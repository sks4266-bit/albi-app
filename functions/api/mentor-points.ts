/**
 * 💰 멘토링 포인트 시스템 API
 * 포인트 충전, 사용, 조회
 */

interface Env {
  DB: D1Database;
}

// UUID 생성
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 포인트 조회
async function getUserPoints(db: D1Database, userId: string): Promise<number> {
  const result = await db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as balance
    FROM mentor_points
    WHERE user_id = ?
  `).bind(userId).first();
  
  return result?.balance || 0;
}

// 포인트 트랜잭션 생성
async function createPointTransaction(
  db: D1Database,
  userId: string,
  type: string,
  amount: number,
  description: string,
  serviceType?: string,
  relatedId?: string
): Promise<any> {
  const transactionId = generateUUID();
  const balanceAfter = await getUserPoints(db, userId) + amount;
  
  await db.prepare(`
    INSERT INTO mentor_points (
      transaction_id, user_id, type, amount, balance_after,
      description, service_type, related_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    transactionId,
    userId,
    type,
    amount,
    balanceAfter,
    description,
    serviceType || null,
    relatedId || null
  ).run();
  
  return {
    transaction_id: transactionId,
    type,
    amount,
    balance_after: balanceAfter,
    description
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  console.log('💰 Point balance query');
  
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user_id');
    
    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'user_id가 필요합니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const db = context.env.DB;
    
    // 현재 잔액
    const balance = await getUserPoints(db, userId);
    
    // 최근 트랜잭션 (10개)
    const transactions = await db.prepare(`
      SELECT 
        transaction_id,
        type,
        amount,
        balance_after,
        description,
        service_type,
        created_at
      FROM mentor_points
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(userId).all();
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        user_id: userId,
        balance,
        transactions: transactions.results
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error: any) {
    console.error('❌ Point query error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Failed to query points'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  console.log('💰 Point transaction request');
  
  try {
    const body = await context.request.json();
    const { user_id, type, amount, description, service_type, related_id } = body;
    
    if (!user_id || !type || !amount) {
      return new Response(JSON.stringify({
        success: false,
        message: 'user_id, type, amount가 필요합니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const db = context.env.DB;
    
    // 사용인 경우 잔액 확인
    if (type === 'usage' && amount < 0) {
      const currentBalance = await getUserPoints(db, user_id);
      if (currentBalance + amount < 0) {
        return new Response(JSON.stringify({
          success: false,
          message: '포인트가 부족합니다',
          current_balance: currentBalance,
          required: Math.abs(amount)
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
    
    // 트랜잭션 생성
    const transaction = await createPointTransaction(
      db,
      user_id,
      type,
      amount,
      description,
      service_type,
      related_id
    );
    
    console.log(`✅ Point transaction: ${user_id} ${amount}P (${type})`);
    
    return new Response(JSON.stringify({
      success: true,
      data: transaction
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error: any) {
    console.error('❌ Point transaction error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Transaction failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

// CORS
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};
