/**
 * 구독 만료 체크 및 알림 발송 (Cron Job)
 * GET /api/check-subscriptions
 */

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 1. 3일 후 만료되는 구독 찾기 (갱신 알림)
    const upcomingExpiry = await env.DB.prepare(`
      SELECT s.*, u.email as user_email, u.name as user_name
      FROM mentor_subscriptions s
      LEFT JOIN (
        SELECT DISTINCT user_id, user_email as email, user_name as name
        FROM payment_requests
        WHERE status = 'approved'
      ) u ON s.user_id = u.user_id
      WHERE s.status = 'active'
        AND datetime(s.expires_at) BETWEEN datetime('now') AND datetime('now', '+3 days')
        AND s.reminder_sent IS NULL
    `).all();

    console.log(`📧 Found ${upcomingExpiry.results.length} subscriptions expiring in 3 days`);

    // 갱신 알림 이메일 발송
    for (const subscription of upcomingExpiry.results) {
      if (!subscription.user_email) continue;

      try {
        const emailResponse = await fetch(`${new URL(request.url).origin}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: subscription.user_email,
            subject: '⏰ Albi AI 구독 갱신 안내',
            template: 'subscription_reminder',
            data: {
              userName: subscription.user_name || '회원',
              daysLeft: 3,
              nextPaymentDate: new Date(subscription.expires_at).toLocaleDateString('ko-KR'),
              paymentMethod: '등록된 카드'
            }
          })
        });

        const emailResult = await emailResponse.json();
        
        if (emailResult.success) {
          // 알림 발송 완료 플래그 업데이트
          await env.DB.prepare(`
            UPDATE mentor_subscriptions
            SET reminder_sent = CURRENT_TIMESTAMP
            WHERE subscription_id = ?
          `).bind(subscription.subscription_id).run();
          
          console.log(`✅ Reminder sent to ${subscription.user_email}`);
        }
      } catch (error) {
        console.error(`❌ Failed to send reminder to ${subscription.user_email}:`, error);
      }
    }

    // 2. 만료된 구독 찾기 (만료 알림)
    const expiredSubscriptions = await env.DB.prepare(`
      SELECT s.*, u.email as user_email, u.name as user_name,
             (SELECT COUNT(*) FROM interview_sessions WHERE user_id = s.user_id AND status = 'completed') as total_sessions,
             (SELECT COUNT(*) FROM mentor_conversations WHERE user_id = s.user_id) as total_messages,
             (SELECT AVG(total_score) FROM interview_sessions WHERE user_id = s.user_id AND status = 'completed') as avg_score
      FROM mentor_subscriptions s
      LEFT JOIN (
        SELECT DISTINCT user_id, user_email as email, user_name as name
        FROM payment_requests
        WHERE status = 'approved'
      ) u ON s.user_id = u.user_id
      WHERE s.status = 'active'
        AND datetime(s.expires_at) < datetime('now')
    `).all();

    console.log(`📧 Found ${expiredSubscriptions.results.length} expired subscriptions`);

    // 만료 알림 이메일 발송 및 상태 업데이트
    for (const subscription of expiredSubscriptions.results) {
      if (!subscription.user_email) continue;

      try {
        const emailResponse = await fetch(`${new URL(request.url).origin}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: subscription.user_email,
            subject: '😢 Albi AI 구독이 만료되었습니다',
            template: 'subscription_expired',
            data: {
              userName: subscription.user_name || '회원',
              expiredDate: new Date(subscription.expires_at).toLocaleDateString('ko-KR'),
              totalSessions: subscription.total_sessions || 0,
              totalMessages: subscription.total_messages || 0,
              avgScore: subscription.avg_score ? Math.round(subscription.avg_score) : 0
            }
          })
        });

        const emailResult = await emailResponse.json();
        
        if (emailResult.success) {
          console.log(`✅ Expiry notice sent to ${subscription.user_email}`);
        }
      } catch (error) {
        console.error(`❌ Failed to send expiry notice to ${subscription.user_email}:`, error);
      }

      // 구독 상태를 'expired'로 변경
      await env.DB.prepare(`
        UPDATE mentor_subscriptions
        SET status = 'expired'
        WHERE subscription_id = ?
      `).bind(subscription.subscription_id).run();
      
      console.log(`✅ Subscription ${subscription.subscription_id} marked as expired`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Subscription check completed',
      stats: {
        reminders_sent: upcomingExpiry.results.length,
        expired_updated: expiredSubscriptions.results.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Subscription check error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
