import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/cloudflare-pages';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api/noshow');

app.use('*', cors());

// 노쇼 신고하기 (구인자만 가능)
app.post('/report', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 세션 확인
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first<{ user_id: string }>();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    // 구인자 확인
    const user = await c.env.DB.prepare(`
      SELECT user_type FROM users WHERE id = ?
    `).bind(session.user_id).first<{ user_type: string }>();

    if (!user || user.user_type !== 'employer') {
      return c.json({ success: false, error: '구인자만 신고할 수 있습니다.' }, 403);
    }

    const { application_id, reason, evidence } = await c.req.json();

    if (!application_id) {
      return c.json({ success: false, error: '지원 ID가 필요합니다.' }, 400);
    }

    // 지원 정보 조회
    const application = await c.env.DB.prepare(`
      SELECT 
        e.id,
        e.user_id as applicant_id,
        e.job_id,
        e.status,
        j.user_id as employer_id
      FROM experiences e
      JOIN jobs j ON e.job_id = j.id
      WHERE e.id = ?
    `).bind(application_id).first();

    if (!application) {
      return c.json({ success: false, error: '지원을 찾을 수 없습니다.' }, 404);
    }

    // 구인자 본인 확인
    if (application.employer_id !== session.user_id) {
      return c.json({ success: false, error: '본인이 등록한 공고의 지원자만 신고할 수 있습니다.' }, 403);
    }

    // 이미 신고되었는지 확인
    const existingReport = await c.env.DB.prepare(`
      SELECT id FROM noshow_reports WHERE application_id = ?
    `).bind(application_id).first();

    if (existingReport) {
      return c.json({ success: false, error: '이미 신고된 지원입니다.' }, 400);
    }

    // 노쇼 신고 생성
    const reportId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO noshow_reports (
        id, application_id, reporter_id, reported_user_id, job_id,
        reason, evidence, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(
      reportId,
      application_id,
      session.user_id,
      application.applicant_id,
      application.job_id,
      reason || null,
      evidence || null
    ).run();

    console.log('✅ 노쇼 신고 생성:', reportId);

    return c.json({
      success: true,
      message: '노쇼 신고가 접수되었습니다. 관리자 검토 후 처리됩니다.',
      reportId: reportId
    });
  } catch (error: any) {
    console.error('노쇼 신고 오류:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 노쇼 신고 목록 조회 (구인자)
app.get('/my-reports', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first<{ user_id: string }>();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    const reports = await c.env.DB.prepare(`
      SELECT 
        nr.id,
        nr.application_id,
        nr.reported_user_id,
        nr.reason,
        nr.status,
        nr.trust_score_deducted,
        nr.created_at,
        nr.resolved_at,
        u.name as reported_user_name,
        j.title as job_title
      FROM noshow_reports nr
      JOIN users u ON nr.reported_user_id = u.id
      JOIN jobs j ON nr.job_id = j.id
      WHERE nr.reporter_id = ?
      ORDER BY nr.created_at DESC
    `).bind(session.user_id).all();

    return c.json({
      success: true,
      reports: reports.results || []
    });
  } catch (error: any) {
    console.error('노쇼 신고 목록 조회 오류:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 노쇼 신고 승인/거절 (관리자만)
app.post('/review/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: '인증이 필요합니다.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first<{ user_id: string }>();

    if (!session) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401);
    }

    // 관리자 확인
    const user = await c.env.DB.prepare(`
      SELECT user_type FROM users WHERE id = ?
    `).bind(session.user_id).first<{ user_type: string }>();

    if (!user || user.user_type !== 'admin') {
      return c.json({ success: false, error: '관리자만 처리할 수 있습니다.' }, 403);
    }

    const reportId = c.req.param('id');
    const { action, admin_notes, trust_score_penalty = 10 } = await c.req.json();

    if (!['approve', 'reject'].includes(action)) {
      return c.json({ success: false, error: '유효하지 않은 액션입니다.' }, 400);
    }

    // 신고 조회
    const report = await c.env.DB.prepare(`
      SELECT * FROM noshow_reports WHERE id = ?
    `).bind(reportId).first();

    if (!report) {
      return c.json({ success: false, error: '신고를 찾을 수 없습니다.' }, 404);
    }

    if (report.status !== 'pending') {
      return c.json({ success: false, error: '이미 처리된 신고입니다.' }, 400);
    }

    if (action === 'approve') {
      // 신고 승인: 신뢰도 차감
      const currentTrustScore = await c.env.DB.prepare(`
        SELECT trust_score FROM users WHERE id = ?
      `).bind(report.reported_user_id).first<{ trust_score: number }>();

      const newTrustScore = Math.max(0, (currentTrustScore?.trust_score || 100) - trust_score_penalty);

      // 신뢰도 업데이트
      await c.env.DB.prepare(`
        UPDATE users SET trust_score = ? WHERE id = ?
      `).bind(newTrustScore, report.reported_user_id).run();

      // 신고 상태 업데이트
      await c.env.DB.prepare(`
        UPDATE noshow_reports 
        SET status = 'approved', 
            trust_score_deducted = ?,
            admin_notes = ?,
            resolved_at = datetime('now'),
            resolved_by = ?
        WHERE id = ?
      `).bind(trust_score_penalty, admin_notes || null, session.user_id, reportId).run();

      console.log(`✅ 노쇼 신고 승인: ${reportId}, 신뢰도 ${trust_score_penalty}점 차감`);

      return c.json({
        success: true,
        message: `노쇼 신고가 승인되었습니다. 신뢰도 ${trust_score_penalty}점이 차감되었습니다.`,
        newTrustScore: newTrustScore
      });
    } else {
      // 신고 거절
      await c.env.DB.prepare(`
        UPDATE noshow_reports 
        SET status = 'rejected',
            admin_notes = ?,
            resolved_at = datetime('now'),
            resolved_by = ?
        WHERE id = ?
      `).bind(admin_notes || null, session.user_id, reportId).run();

      console.log(`✅ 노쇼 신고 거절: ${reportId}`);

      return c.json({
        success: true,
        message: '노쇼 신고가 거절되었습니다.'
      });
    }
  } catch (error: any) {
    console.error('노쇼 신고 처리 오류:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export const onRequest = handle(app);
