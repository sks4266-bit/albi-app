import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api/company-info')

app.use('/*', cors())

// GET /api/company-info - 회사 정보 조회 (알비 운영자 정보)
app.get('/', async (c) => {
  try {
    // 알비(ALBI) 실제 회사 정보 반환
    return c.json({
      success: true,
      data: {
        company_name: '알비',
        business_registration_number: '531-08-03526',
        representative: '박지훈',
        address: '경상남도 양산시 동면 사송로 155, 807동 1405호(사송 롯데캐슬)',
        email: 'albi260128@gmail.com',
        phone: '010-4459-4226',
        business_type: '온라인 알바 플랫폼',
        mail_order_registration: '제2026-경남양산-00526호'
      }
    });

  } catch (error: any) {
    console.error('회사 정보 조회 실패:', error);
    // 에러 발생 시에도 알비(ALBI) 실제 정보 반환
    return c.json({
      success: true,
      data: {
        company_name: '알비',
        business_registration_number: '531-08-03526',
        representative: '박지훈',
        address: '경상남도 양산시 동면 사송로 155, 807동 1405호(사송 롯데캐슬)',
        email: 'albi260128@gmail.com',
        phone: '010-4459-4226',
        business_type: '온라인 알바 플랫폼',
        mail_order_registration: '제2026-경남양산-00526호'
      }
    });
  }
});

export const onRequest = handle(app);
