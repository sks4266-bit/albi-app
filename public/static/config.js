// 알비 앱 설정
const ALBI_CONFIG = {
    // 카카오 API 키
    KAKAO_JAVASCRIPT_KEY: 'b69e30d2c21d6db82408ee9a2091d293', // 카카오 맵과 동일한 키 사용
    
    // API 베이스 URL (현재 도메인 사용)
    API_BASE_URL: window.location.origin,
    
    // 앱 정보 (현재 도메인 사용)
    APP_NAME: '알비',
    APP_URL: window.location.origin, // 현재 도메인 유지
    
    // 기본 OG 이미지 (현재 도메인 사용)
    DEFAULT_OG_IMAGE: `${window.location.origin}/static/images/job-test-og.svg`
};

console.log('✅ ALBI_CONFIG 로드 완료:', ALBI_CONFIG.APP_URL);
