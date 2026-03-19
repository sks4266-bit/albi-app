/**
 * 사용자 프로필 통합 API
 * GET /api/user-profile?userId={userId}
 * 
 * 반환 데이터:
 * - 적성검사 결과
 * - AI 면접 이력
 * - 멘토 채팅 이력
 * - 포트폴리오 정보
 */

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'guest';
    
    try {
        // CORS 헤더
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };
        
        // 사용자 프로필 데이터 수집
        const userProfile = await collectUserProfile(userId, env);
        
        return new Response(JSON.stringify({
            success: true,
            userId,
            profile: userProfile,
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: corsHeaders
        });
        
    } catch (error) {
        console.error('[UserProfile] Error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            userId
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

/**
 * 사용자 프로필 데이터 수집
 */
async function collectUserProfile(userId, env) {
    const profile = {
        userId,
        personalInfo: null,
        aptitudeTest: null,
        interviewHistory: [],
        mentorChats: [],
        portfolio: null,
        skills: [],
        experiences: [],
        interests: [],
        targetCompanies: [],
        targetPositions: []
    };
    
    try {
        // 1. 적성검사 결과 조회 (localStorage에서 가져올 예정)
        // D1 데이터베이스 연동 시 여기서 조회
        profile.aptitudeTest = {
            type: 'unknown', // MBTI-like personality type
            strengths: [],
            weaknesses: [],
            recommendedJobs: [],
            skills: []
        };
        
        // 2. AI 면접 이력 조회
        profile.interviewHistory = [];
        
        // 3. 멘토 채팅 이력 조회
        profile.mentorChats = [];
        
        // 4. 포트폴리오 정보 조회
        profile.portfolio = {
            education: [],
            experience: [],
            projects: [],
            certifications: [],
            skills: []
        };
        
        // 5. 관심 분야 및 목표 기업/직무 추출
        profile.interests = extractInterests(profile);
        profile.targetPositions = extractTargetPositions(profile);
        
    } catch (error) {
        console.error('[CollectProfile] Error:', error);
    }
    
    return profile;
}

/**
 * 관심 분야 추출
 */
function extractInterests(profile) {
    const interests = new Set();
    
    // 적성검사에서 추출
    if (profile.aptitudeTest && profile.aptitudeTest.recommendedJobs) {
        profile.aptitudeTest.recommendedJobs.forEach(job => {
            interests.add(job);
        });
    }
    
    // 포트폴리오에서 추출
    if (profile.portfolio && profile.portfolio.skills) {
        profile.portfolio.skills.forEach(skill => {
            interests.add(skill);
        });
    }
    
    return Array.from(interests);
}

/**
 * 목표 직무 추출
 */
function extractTargetPositions(profile) {
    const positions = new Set();
    
    // 적성검사 결과 기반
    if (profile.aptitudeTest && profile.aptitudeTest.recommendedJobs) {
        profile.aptitudeTest.recommendedJobs.forEach(job => {
            positions.add(job);
        });
    }
    
    // 경력 기반
    if (profile.portfolio && profile.portfolio.experience) {
        profile.portfolio.experience.forEach(exp => {
            if (exp.position) {
                positions.add(exp.position);
            }
        });
    }
    
    return Array.from(positions).slice(0, 3); // 상위 3개
}
