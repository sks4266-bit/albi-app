/**
 * 💰 급여계산기 API
 * POST /api/calculator/wage
 * 시급과 근무시간으로 주휴수당 포함 급여 계산
 */

interface WageRequest {
  hourlyWage: number;
  weeklyHours: number;
}

interface WageResult {
  success: boolean;
  data?: {
    hourlyWage: number;
    weeklyHours: number;
    weeklyBasePay: number;
    weeklyHolidayPay: number;
    hasHolidayPay: boolean;
    weeklyTotal: number;
    monthlyEstimate: number;
    holidayHours: number;
    explanation: string;
  };
  error?: string;
}

/**
 * POST /api/calculator/wage
 * 급여 계산
 */
export const onRequestPost: PagesFunction = async (context) => {
  try {
    const body = await context.request.json() as WageRequest;
    const { hourlyWage, weeklyHours } = body;

    // 입력값 검증
    if (!hourlyWage || !weeklyHours) {
      return Response.json({
        success: false,
        error: '시급과 주간 근무시간을 입력해주세요.'
      } as WageResult, { status: 400 });
    }

    if (hourlyWage < 0) {
      return Response.json({
        success: false,
        error: '시급은 0원 이상이어야 합니다.'
      } as WageResult, { status: 400 });
    }

    if (weeklyHours < 0 || weeklyHours > 168) {
      return Response.json({
        success: false,
        error: '주간 근무시간은 0-168시간 범위여야 합니다.'
      } as WageResult, { status: 400 });
    }

    // 주간 기본급 계산
    const weeklyBasePay = Math.round(hourlyWage * weeklyHours);

    // 주휴수당 계산
    let weeklyHolidayPay = 0;
    let hasHolidayPay = false;
    let holidayHours = 0;
    let explanation = '';

    if (weeklyHours >= 15) {
      // 주 15시간 이상: 주휴수당 지급
      hasHolidayPay = true;
      
      if (weeklyHours >= 40) {
        // 주 40시간 이상: 8시간 고정
        holidayHours = 8;
        weeklyHolidayPay = Math.round(hourlyWage * 8);
        
        explanation = `📊 계산 방식:\n\n` +
          `1. 주간 기본급\n` +
          `   ${hourlyWage.toLocaleString()}원 × ${weeklyHours}시간 = ${weeklyBasePay.toLocaleString()}원\n\n` +
          `2. 주휴수당 (40시간 이상 근무)\n` +
          `   ${hourlyWage.toLocaleString()}원 × 8시간 = ${weeklyHolidayPay.toLocaleString()}원\n\n` +
          `3. 주급 합계\n` +
          `   ${weeklyBasePay.toLocaleString()}원 + ${weeklyHolidayPay.toLocaleString()}원 = ${(weeklyBasePay + weeklyHolidayPay).toLocaleString()}원\n\n` +
          `4. 예상 월급 (4.345주 기준)\n` +
          `   ${(weeklyBasePay + weeklyHolidayPay).toLocaleString()}원 × 4.345 = ${Math.round((weeklyBasePay + weeklyHolidayPay) * 4.345).toLocaleString()}원`;
        
      } else {
        // 주 15-40시간: 비례 계산
        holidayHours = Math.round((weeklyHours / 40) * 8 * 10) / 10; // 소수점 1자리
        weeklyHolidayPay = Math.round(hourlyWage * holidayHours);
        
        explanation = `📊 계산 방식:\n\n` +
          `1. 주간 기본급\n` +
          `   ${hourlyWage.toLocaleString()}원 × ${weeklyHours}시간 = ${weeklyBasePay.toLocaleString()}원\n\n` +
          `2. 주휴수당 (비례 계산)\n` +
          `   주휴시간 = (${weeklyHours}시간 ÷ 40) × 8시간 = ${holidayHours}시간\n` +
          `   ${hourlyWage.toLocaleString()}원 × ${holidayHours}시간 = ${weeklyHolidayPay.toLocaleString()}원\n\n` +
          `3. 주급 합계\n` +
          `   ${weeklyBasePay.toLocaleString()}원 + ${weeklyHolidayPay.toLocaleString()}원 = ${(weeklyBasePay + weeklyHolidayPay).toLocaleString()}원\n\n` +
          `4. 예상 월급 (4.345주 기준)\n` +
          `   ${(weeklyBasePay + weeklyHolidayPay).toLocaleString()}원 × 4.345 = ${Math.round((weeklyBasePay + weeklyHolidayPay) * 4.345).toLocaleString()}원`;
      }
    } else {
      // 주 15시간 미만: 주휴수당 없음
      hasHolidayPay = false;
      weeklyHolidayPay = 0;
      
      explanation = `📊 계산 방식:\n\n` +
        `1. 주간 기본급\n` +
        `   ${hourlyWage.toLocaleString()}원 × ${weeklyHours}시간 = ${weeklyBasePay.toLocaleString()}원\n\n` +
        `2. 주휴수당\n` +
        `   주 15시간 미만 근무로 주휴수당이 지급되지 않습니다.\n\n` +
        `3. 주급 합계\n` +
        `   ${weeklyBasePay.toLocaleString()}원\n\n` +
        `4. 예상 월급 (4.345주 기준)\n` +
        `   ${weeklyBasePay.toLocaleString()}원 × 4.345 = ${Math.round(weeklyBasePay * 4.345).toLocaleString()}원\n\n` +
        `💡 주 15시간 이상 근무하면 주휴수당을 받을 수 있습니다!`;
    }

    // 주급 합계
    const weeklyTotal = weeklyBasePay + weeklyHolidayPay;

    // 예상 월급 (4.345주 기준)
    const monthlyEstimate = Math.round(weeklyTotal * 4.345);

    return Response.json({
      success: true,
      data: {
        hourlyWage,
        weeklyHours,
        weeklyBasePay,
        weeklyHolidayPay,
        hasHolidayPay,
        weeklyTotal,
        monthlyEstimate,
        holidayHours,
        explanation
      }
    } as WageResult, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('❌ Wage calculation error:', error);
    return Response.json({
      success: false,
      error: '계산 중 오류가 발생했습니다.'
    } as WageResult, { status: 500 });
  }
};

/**
 * OPTIONS handler (CORS)
 */
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
