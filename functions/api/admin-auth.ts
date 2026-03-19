/**
 * 🔐 관리자 인증 API
 * 간단한 비밀번호 기반 인증 (JWT 토큰 발급)
 */

interface Env {
  ADMIN_PASSWORD?: string; // Cloudflare secret
}

// 간단한 JWT 생성 (실제로는 crypto 사용)
function generateToken(password: string): string {
  const timestamp = Date.now();
  const payload = btoa(JSON.stringify({ password, timestamp }));
  return payload;
}

function validateToken(token: string): boolean {
  try {
    const decoded = JSON.parse(atob(token));
    const age = Date.now() - decoded.timestamp;
    // 24시간 유효
    return age < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  console.log('🔐 Admin auth request');
  
  try {
    const { password } = await context.request.json();
    
    // 기본 비밀번호 (프로덕션에서는 Cloudflare secret 사용)
    const adminPassword = context.env.ADMIN_PASSWORD || 'albi2024!@#';
    
    if (password === adminPassword) {
      const token = generateToken(password);
      
      return new Response(JSON.stringify({
        success: true,
        token,
        message: '로그인 성공'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: '비밀번호가 틀렸습니다'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error: any) {
    console.error('❌ Auth error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Auth failed'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};

// 토큰 검증 API
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        message: '인증 토큰이 없습니다'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const token = authHeader.substring(7);
    const isValid = validateToken(token);
    
    if (isValid) {
      return new Response(JSON.stringify({
        success: true,
        message: '인증 유효'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: '토큰이 만료되었습니다'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error?.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
