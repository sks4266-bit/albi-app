// 전역 변수
let testResult = null;
let testData = null;
let isLoggedIn = false;

// 페이지 로드
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 페이지 로드 시작');
    
    // 로그인 상태 확인 (세션 토큰 및 사용자 정보 체크)
    const userId = localStorage.getItem('albi_user_id');
    const sessionToken = localStorage.getItem('albi_session_token');
    const userName = localStorage.getItem('albi_user_name');
    
    isLoggedIn = !!(userId && sessionToken);
    console.log('🔐 로그인 상태:', isLoggedIn, '| 사용자:', userName || '비로그인');
    
    // 테스트 결과 로드
    let savedResult = localStorage.getItem('testResult');
    console.log('💾 저장된 testResult:', savedResult ? '있음' : '없음');
    
    // testResult가 없으면 myTestResults에서 최신 결과 가져오기
    if (!savedResult && isLoggedIn) {
        console.log('🔍 testResult 없음 - myTestResults에서 최신 결과 확인');
        const myTestResults = JSON.parse(localStorage.getItem('myTestResults') || '[]');
        
        if (myTestResults.length > 0) {
            // 최신 결과 (배열의 첫 번째 항목)
            savedResult = JSON.stringify(myTestResults[0]);
            localStorage.setItem('testResult', savedResult);
            console.log('✅ myTestResults에서 최신 결과 복원:', myTestResults[0].resultType);
        }
    }
    
    if (!savedResult) {
        console.log('❌ 결과 없음 - noResult 표시');
        document.getElementById('noResult').classList.remove('hidden');
        return;
    }
    
    testResult = JSON.parse(savedResult);
    console.log('✅ 테스트 결과 파싱 완료:', testResult.resultType);
    
    // 테스트 데이터 로드 (최대 3번 재시도)
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
        await loadTestData();
        
        if (testData && testData.types) {
            console.log('✅ 테스트 데이터 로드 완료');
            break;
        }
        
        retryCount++;
        console.warn(`⚠️ 테스트 데이터 로드 재시도 (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms 대기
    }
    
    // 데이터 로드 확인
    if (!testData || !testData.types) {
        console.error('❌ 테스트 데이터 로드 최종 실패');
        alert('테스트 데이터를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
        document.getElementById('noResult').classList.remove('hidden');
        return;
    }
    
    // 결과 표시
    displayResult();
    console.log('✅ 결과 표시 완료');
    
    // 로그인하지 않았으면 블러 처리 및 프롬프트 표시
    if (!isLoggedIn) {
        console.log('🔒 비로그인 상태 - 블러 처리');
        applyBlur();
        setTimeout(() => {
            console.log('💬 로그인 프롬프트 표시');
            document.getElementById('loginPrompt').classList.remove('hidden');
        }, 2000); // 2초 후 로그인 프롬프트 표시
    } else {
        console.log('✅ 로그인 상태 - 전체 결과 표시');
        // 로그인한 경우 마이페이지에 결과 저장
        saveToMyPage();
    }
    
    // 카카오 SDK 초기화
    if (typeof Kakao !== 'undefined' && typeof ALBI_CONFIG !== 'undefined') {
        try {
            if (!Kakao.isInitialized()) {
                Kakao.init(ALBI_CONFIG.KAKAO_JAVASCRIPT_KEY);
                console.log('✅ 카카오 SDK 초기화 완료:', ALBI_CONFIG.KAKAO_JAVASCRIPT_KEY.substring(0, 10) + '...');
            } else {
                console.log('✅ 카카오 SDK 이미 초기화됨');
            }
        } catch (error) {
            console.error('❌ 카카오 SDK 초기화 실패:', error);
        }
    } else {
        console.warn('⚠️ Kakao SDK 또는 ALBI_CONFIG를 찾을 수 없습니다.');
    }
});

// 테스트 데이터 로드
async function loadTestData() {
    try {
        console.log('📥 테스트 데이터 로드 중...');
        const response = await fetch('/static/job-test-data.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        testData = await response.json();
        console.log('✅ 테스트 데이터 로드 성공:', Object.keys(testData));
    } catch (error) {
        console.error('❌ 테스트 데이터 로드 실패:', error);
        testData = null;
    }
}

// 결과 표시
function displayResult() {
    console.log('🎨 displayResult 시작');
    
    // testResult 검증
    if (!testResult || !testResult.resultType || !testResult.resultType.primary) {
        console.error('❌ testResult가 유효하지 않습니다:', testResult);
        alert('테스트 결과 데이터가 손상되었습니다. 테스트를 다시 진행해주세요.');
        document.getElementById('noResult').classList.remove('hidden');
        return;
    }
    
    // testData 검증
    if (!testData || !testData.types) {
        console.error('❌ testData가 없습니다. 100ms 후 재시도...');
        setTimeout(displayResult, 100);
        return;
    }
    
    const { resultType, scores, confidence } = testResult;
    const typeKey = resultType.primary;
    
    console.log('📊 타입 키:', typeKey);
    console.log('📊 사용 가능한 타입:', Object.keys(testData.types));
    
    // typeKey 검증
    if (!typeKey || typeof typeKey !== 'string') {
        console.error('❌ 타입 키가 유효하지 않습니다:', typeKey);
        alert('테스트 결과 타입이 올바르지 않습니다. 테스트를 다시 진행해주세요.');
        document.getElementById('noResult').classList.remove('hidden');
        return;
    }
    
    const typeInfo = testData.types[typeKey];
    
    // typeInfo 검증
    if (!typeInfo) {
        console.error('❌ 유효하지 않은 타입 키:', typeKey);
        console.error('📋 사용 가능한 타입 키들:', Object.keys(testData.types));
        alert(`타입 정보를 찾을 수 없습니다: ${typeKey}\n\n테스트를 다시 진행해주세요.`);
        // localStorage 정리
        localStorage.removeItem('testResult');
        localStorage.removeItem('testAnswers');
        // 테스트 페이지로 이동
        setTimeout(() => {
            window.location.href = '/job-test.html';
        }, 2000);
        return;
    }
    
    console.log('✅ typeInfo 확인:', typeInfo.shortName);
    
    document.getElementById('resultContent').classList.remove('hidden');
    
    // 헤더 정보
    document.getElementById('resultEmoji').textContent = typeInfo.emoji;
    document.getElementById('confidencePercentage').textContent = confidence.percentage;
    
    if (resultType.isHybrid) {
        const secondaryType = testData.types[resultType.secondary];
        const hybridInfo = testData.hybridTypes[resultType.hybrid];
        
        if (hybridInfo) {
            document.getElementById('resultTitle').textContent = hybridInfo.name;
            document.getElementById('resultSubtitle').textContent = hybridInfo.description;
            document.getElementById('resultDescription').textContent = hybridInfo.detail;
        } else {
            // 복합형 정보가 없으면 기본 정보 사용
            document.getElementById('resultTitle').textContent = `${typeInfo.shortName} + ${secondaryType?.shortName || ''}`;
            document.getElementById('resultSubtitle').textContent = typeInfo.name;
            document.getElementById('resultDescription').textContent = typeInfo.description;
        }
    } else {
        document.getElementById('resultTitle').textContent = typeInfo.shortName;
        document.getElementById('resultSubtitle').textContent = typeInfo.name;
        document.getElementById('resultDescription').textContent = typeInfo.description;
    }
    
    // 레이더 차트
    displayRadarChart(scores);
    
    // 점수 상세
    displayScoreDetails(scores);
    
    // 강점
    displayList('strengthsList', typeInfo.strengths, 'check-circle', 'green');
    
    // 성장 포인트
    displayList('growthList', typeInfo.growthPoints, 'arrow-up', 'blue');
    
    // 이상적인 환경
    displayList('environmentList', typeInfo.idealEnvironment, 'star', 'yellow');
    
    // 비슷한 현대인
    displayFamousPeople(typeInfo.famousPeople);
    
    // 커리어 로드맵
    displayRoadmap(typeKey);
    
    // 추천 포지션
    displayRecommendedJobs(typeKey);
    
    // AI 면접 유도
    displayAIInterviewPrompt(typeKey);
    
    console.log('✅ displayResult 완료');
}

// 레이더 차트 표시
function displayRadarChart(scores) {
    const ctx = document.getElementById('radarChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['전략형', '분석형', '소통형', '실행형'],
            datasets: [{
                label: '나의 성향',
                data: [
                    scores.strategic,
                    scores.analytical,
                    scores.communicative,
                    scores.executive
                ],
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 2,
                pointBackgroundColor: 'rgb(99, 102, 241)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(99, 102, 241)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 16,
                    ticks: {
                        stepSize: 4
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// 점수 상세 표시
function displayScoreDetails(scores) {
    const container = document.getElementById('scoreDetails');
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    
    const typeNames = {
        strategic: '전략형',
        analytical: '분석형',
        communicative: '소통형',
        executive: '실행형'
    };
    
    const colors = {
        strategic: 'blue',
        analytical: 'pink',
        communicative: 'green',
        executive: 'purple'
    };
    
    sortedScores.forEach(([type, score]) => {
        const percentage = (score / 16 * 100).toFixed(0);
        const color = colors[type];
        
        container.innerHTML += `
            <div class="space-y-2">
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-700">${typeNames[type]}</span>
                    <span class="text-sm text-gray-600">${score}/16 (${percentage}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div class="bg-${color}-500 h-3 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
}

// 리스트 표시 (강점, 성장 포인트, 환경)
function displayList(containerId, items, icon, color) {
    const container = document.getElementById(containerId);
    
    items.forEach(item => {
        container.innerHTML += `
            <div class="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <i class="fas fa-${icon} text-${color}-500 text-xl"></i>
                <span class="text-gray-700">${item}</span>
            </div>
        `;
    });
}

// 비슷한 현대인 (실제 인물)
function displayFamousPeople(people) {
    const container = document.getElementById('famousPeopleList');
    
    if (!people || people.length === 0) {
        container.innerHTML = '<p class="text-gray-600">데이터를 불러오는 중...</p>';
        return;
    }
    
    container.innerHTML = people.map(person => {
        // 새 데이터 구조 지원
        if (typeof person === 'object') {
            return `
                <div class="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex-1 min-w-[280px] max-w-[350px] border border-gray-100">
                    <div class="flex items-start gap-4 mb-4">
                        <div class="flex-shrink-0">
                            <img src="${person.image}" alt="${person.name}" 
                                 class="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg">
                        </div>
                        <div class="flex-1">
                            <h3 class="font-bold text-gray-800 text-lg mb-1">${person.name}</h3>
                            <p class="text-sm text-blue-600 font-medium mb-2">${person.title}</p>
                        </div>
                    </div>
                    <p class="text-gray-600 text-sm leading-relaxed">${person.description}</p>
                </div>
            `;
        }
        // 이전 데이터 구조 지원 (문자열)
        return `
            <div class="inline-block bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 rounded-full">
                <span class="text-gray-700 font-medium">${person}</span>
            </div>
        `;
    }).join('');
}

// 커리어 로드맵
function displayRoadmap(typeKey) {
    const roadmaps = {
        strategic: {
            '1-3': {
                positions: ['사업기획 주니어', '전략기획 어시스트', '주니어 PM'],
                salary: '3,500만~5,000만 원',
                focus: '시장 분석 능력 향상, 기획서 작성 스킬, 프로젝트 관리 경험'
            },
            '4-7': {
                positions: ['사업기획 매니저', '전략기획팀 시니어', '프로덕트 전략 리드'],
                salary: '5,500만~8,500만 원',
                focus: '전략적 의사결정, 팀 리딩, 사업 모델 설계'
            },
            '8+': {
                positions: ['전략본부장', 'CPO', '경영기획 임원'],
                salary: '9,000만 원~1억 5천만 원 이상',
                focus: '조직 전략 수립, 경영진 의사결정, 신사업 발굴'
            }
        },
        analytical: {
            '1-3': {
                positions: ['데이터 분석가', '리서치 어시스트', 'QA 엔지니어'],
                salary: '3,500만~5,000만 원',
                focus: '데이터 분석 툴 활용, 통계 지식, 논리적 사고'
            },
            '4-7': {
                positions: ['데이터 사이언티스트', '시니어 애널리스트', 'UX 리서처'],
                salary: '5,500만~8,500만 원',
                focus: '고급 분석 기법, 인사이트 도출, 전문성 심화'
            },
            '8+': {
                positions: ['데이터 사이언스 리드', '리서치 디렉터', 'Chief Data Officer'],
                salary: '9,000만 원~1억 5천만 원 이상',
                focus: '데이터 전략 수립, 팀 빌딩, 조직 데이터 문화 구축'
            }
        },
        communicative: {
            '1-3': {
                positions: ['HR 어시스트', '마케팅 커뮤니케이션', '고객 성공 매니저'],
                salary: '3,200만~4,800만 원',
                focus: '커뮤니케이션 스킬, 협업 능력, 관계 구축'
            },
            '4-7': {
                positions: ['HR 매니저', '커뮤니케이션 리드', 'CSM 시니어'],
                salary: '5,000만~8,000만 원',
                focus: '팀 빌딩, 조직 문화, 고객 관계 관리'
            },
            '8+': {
                positions: ['HR 디렉터', 'CHRO', '커뮤니케이션 본부장'],
                salary: '8,500만 원~1억 3천만 원 이상',
                focus: '조직 개발, 인재 전략, 문화 혁신'
            }
        },
        executive: {
            '1-3': {
                positions: ['프로젝트 코디네이터', '세일즈 주니어', '운영 매니저'],
                salary: '3,300만~4,900만 원',
                focus: '실행력, 빠른 대응, 프로젝트 경험'
            },
            '4-7': {
                positions: ['프로젝트 매니저', '세일즈 리드', '운영 시니어'],
                salary: '5,200만~8,200만 원',
                focus: '성과 달성, 팀 관리, 효율성 개선'
            },
            '8+': {
                positions: ['PMO 디렉터', '세일즈 본부장', 'COO'],
                salary: '8,800만 원~1억 4천만 원 이상',
                focus: '조직 운영 최적화, 성과 관리 체계, 전사 프로세스'
            }
        }
    };
    
    const roadmap = roadmaps[typeKey] || roadmaps.strategic;
    
    // 1-3년차
    const roadmap13Element = document.getElementById('roadmap1-3');
    if (roadmap13Element) {
        roadmap13Element.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center gap-2 mb-2">
                    <i class="fas fa-briefcase text-blue-300"></i>
                    <strong class="text-white">주요 직무</strong>
                </div>
                <div class="pl-6">
                    ${roadmap['1-3'].positions.map(pos => `
                        <div class="bg-white bg-opacity-10 rounded-lg px-3 py-2 mb-2">
                            <i class="fas fa-check text-green-300 mr-2"></i>${pos}
                        </div>
                    `).join('')}
                </div>
                <div class="flex items-center gap-2 mt-4">
                    <i class="fas fa-won-sign text-yellow-300"></i>
                    <strong class="text-white">예상 연봉:</strong>
                    <span class="text-yellow-200 font-bold">${roadmap['1-3'].salary}</span>
                </div>
                <div class="mt-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fas fa-star text-purple-300"></i>
                        <strong class="text-white">핵심 역량</strong>
                    </div>
                    <p class="pl-6 text-blue-100">${roadmap['1-3'].focus}</p>
                </div>
            </div>
        `;
    }
    
    // 4-7년차
    const roadmap47Element = document.getElementById('roadmap4-7');
    if (roadmap47Element) {
        roadmap47Element.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center gap-2 mb-2">
                    <i class="fas fa-briefcase text-blue-300"></i>
                    <strong class="text-white">주요 직무</strong>
                </div>
                <div class="pl-6">
                    ${roadmap['4-7'].positions.map(pos => `
                        <div class="bg-white bg-opacity-10 rounded-lg px-3 py-2 mb-2">
                            <i class="fas fa-check text-green-300 mr-2"></i>${pos}
                        </div>
                    `).join('')}
                </div>
                <div class="flex items-center gap-2 mt-4">
                    <i class="fas fa-won-sign text-yellow-300"></i>
                    <strong class="text-white">예상 연봉:</strong>
                    <span class="text-yellow-200 font-bold">${roadmap['4-7'].salary}</span>
                </div>
                <div class="mt-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fas fa-star text-purple-300"></i>
                        <strong class="text-white">핵심 역량</strong>
                    </div>
                    <p class="pl-6 text-blue-100">${roadmap['4-7'].focus}</p>
                </div>
            </div>
        `;
    }
    
    // 8년차 이후
    const roadmap8Element = document.getElementById('roadmap8plus');
    if (roadmap8Element) {
        roadmap8Element.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center gap-2 mb-2">
                    <i class="fas fa-briefcase text-blue-300"></i>
                    <strong class="text-white">주요 직무</strong>
                </div>
                <div class="pl-6">
                    ${roadmap['8+'].positions.map(pos => `
                        <div class="bg-white bg-opacity-10 rounded-lg px-3 py-2 mb-2">
                            <i class="fas fa-crown text-yellow-300 mr-2"></i>${pos}
                        </div>
                    `).join('')}
                </div>
                <div class="flex items-center gap-2 mt-4">
                    <i class="fas fa-won-sign text-yellow-300"></i>
                    <strong class="text-white">예상 연봉:</strong>
                    <span class="text-yellow-200 font-bold">${roadmap['8+'].salary}</span>
                </div>
                <div class="mt-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fas fa-star text-purple-300"></i>
                        <strong class="text-white">핵심 역량</strong>
                    </div>
                    <p class="pl-6 text-blue-100">${roadmap['8+'].focus}</p>
                </div>
            </div>
        `;
    }
}

// 추천 포지션
function displayRecommendedJobs(typeKey) {
    const jobs = {
        strategic: [
            {
                company: '스타트업',
                position: '사업기획 매니저',
                salary: '5,000만~7,000만 원',
                tasks: ['시장 분석', '사업 모델 설계', '런칭 전략 수립'],
                required: ['전략적 사고', 'PPT 스킬', '기획 경력 3년 이상']
            },
            {
                company: '중견기업',
                position: '전략기획팀 시니어',
                salary: '6,500만~9,000만 원',
                tasks: ['경쟁사 분석', '포트폴리오 최적화', '신사업 발굴'],
                required: ['컨설팅 경력', 'MBA 우대', '데이터 분석 가능']
            },
            {
                company: '대기업',
                position: '프로덕트 전략 리드',
                salary: '8,000만~1억 2천만 원',
                tasks: ['제품 로드맵 설계', '디지털 전환 전략', 'UX 전략 수립'],
                required: ['PM 경험', '디지털 트렌드 이해', '애자일 경험']
            }
        ],
        analytical: [
            {
                company: '테크 기업',
                position: '데이터 사이언티스트',
                salary: '5,500만~8,000만 원',
                tasks: ['데이터 분석', '예측 모델 구축', '인사이트 도출'],
                required: ['Python/R', '통계학', 'ML 경험']
            },
            {
                company: '리서치 기관',
                position: '시니어 리서처',
                salary: '6,000만~8,500만 원',
                tasks: ['시장 조사', '정성/정량 분석', '리포트 작성'],
                required: ['리서치 경력 5년', '통계 분석', '영어 가능']
            },
            {
                company: '컨설팅 회사',
                position: 'Management Consultant',
                salary: '7,000만~1억 원',
                tasks: ['전략 컨설팅', '프로세스 개선', '조직 진단'],
                required: ['MBA', '문제 해결 능력', '논리적 사고']
            }
        ],
        communicative: [
            {
                company: '스타트업',
                position: 'HR 매니저',
                salary: '4,500만~6,500만 원',
                tasks: ['채용', '조직 문화 구축', '교육 프로그램 운영'],
                required: ['HR 경력 3년', '커뮤니케이션', '채용 경험']
            },
            {
                company: '마케팅 에이전시',
                position: '커뮤니케이션 디렉터',
                salary: '5,500만~8,000만 원',
                tasks: ['브랜드 전략', '미디어 관리', 'PR 캠페인'],
                required: ['마케팅 경력 5년', '크리에이티브', '미디어 이해']
            },
            {
                company: 'SaaS 기업',
                position: 'Customer Success Lead',
                salary: '5,000만~7,500만 원',
                tasks: ['고객 온보딩', '만족도 관리', 'Upsell/Cross-sell'],
                required: ['CS 경력', 'B2B 경험', '데이터 분석']
            }
        ],
        executive: [
            {
                company: '스타트업',
                position: '프로젝트 매니저',
                salary: '4,500만~6,500만 원',
                tasks: ['프로젝트 관리', '일정 조율', '성과 달성'],
                required: ['PM 경력 3년', '실행력', '커뮤니케이션']
            },
            {
                company: '유통 기업',
                position: '운영 시니어 매니저',
                salary: '5,500만~8,000만 원',
                tasks: ['운영 최적화', '프로세스 개선', '성과 관리'],
                required: ['운영 경력 5년', '문제 해결', '데이터 분석']
            },
            {
                company: '이커머스',
                position: '세일즈 리드',
                salary: '6,000만~9,000만 원 + 인센티브',
                tasks: ['영업 전략', '팀 관리', '매출 달성'],
                required: ['세일즈 경력', '성과 지향', '리더십']
            }
        ]
    };
    
    const container = document.getElementById('recommendedJobs');
    if (!container) {
        console.warn('⚠️ recommendedJobs 컨테이너를 찾을 수 없습니다.');
        return;
    }
    
    const typeJobs = jobs[typeKey] || jobs.strategic;
    
    typeJobs.forEach((job, index) => {
        container.innerHTML += `
            <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <div class="flex items-center justify-between mb-4">
                    <div class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        추천 ${index + 1}
                    </div>
                    <div class="text-gray-500 text-sm">${job.company}</div>
                </div>
                
                <h3 class="text-xl font-bold text-gray-800 mb-2">${job.position}</h3>
                <div class="text-2xl font-bold text-blue-600 mb-4">${job.salary}</div>
                
                <div class="mb-4">
                    <div class="text-sm font-semibold text-gray-700 mb-2">주요 업무</div>
                    <div class="flex flex-wrap gap-2">
                        ${job.tasks.map(task => `
                            <span class="bg-white px-3 py-1 rounded-lg text-sm text-gray-600">${task}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <div class="text-sm font-semibold text-gray-700 mb-2">우대 사항</div>
                    <ul class="space-y-1">
                        ${job.required.map(req => `
                            <li class="text-sm text-gray-600">
                                <i class="fas fa-check text-green-500 mr-2"></i>${req}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    });
}

// AI 면접 유도 섹션
function displayAIInterviewPrompt(typeKey) {
    console.log('🎤 AI 면접 유도 섹션 표시 시작:', typeKey);
    
    const container = document.getElementById('matchingJobs');
    if (!container) {
        console.warn('⚠️ matchingJobs 컨테이너를 찾을 수 없습니다.');
        return;
    }
    
    // 타입별 맞춤 메시지
    const messages = {
        strategic: {
            emoji: '🎯',
            title: '전략형인 당신, AI 면접으로 진짜 실력을 보여주세요!',
            description: '체계적인 사고와 계획 능력을 AI가 정확히 평가합니다.',
            highlight: '전략적 문제 해결 능력'
        },
        analytical: {
            emoji: '🔬',
            title: '분석형인 당신, AI 면접에서 논리력을 증명하세요!',
            description: '꼼꼼한 분석 능력과 정확한 판단력을 AI가 평가합니다.',
            highlight: '논리적 사고와 문제 분석'
        },
        communicative: {
            emoji: '💬',
            title: '소통형인 당신, AI 면접으로 매력을 발산하세요!',
            description: '뛰어난 소통 능력과 공감 능력을 AI가 파악합니다.',
            highlight: '대인 관계 및 고객 응대'
        },
        executive: {
            emoji: '⚡',
            title: '실행형인 당신, AI 면접에서 행동력을 입증하세요!',
            description: '빠른 실행력과 적극적인 태도를 AI가 확인합니다.',
            highlight: '신속한 대응과 책임감'
        }
    };
    
    const message = messages[typeKey] || messages.strategic;
    
    container.innerHTML = `
        <div class="col-span-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl">
            <div class="text-center mb-8">
                <div class="text-7xl mb-4">${message.emoji}</div>
                <h2 class="text-3xl md:text-4xl font-bold mb-4">${message.title}</h2>
                <p class="text-xl text-blue-100 mb-2">${message.description}</p>
                <div class="inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-lg font-semibold mt-4">
                    <i class="fas fa-star mr-2"></i>
                    핵심 강점: ${message.highlight}
                </div>
            </div>
            
            <div class="grid md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                    <div class="text-4xl mb-3">🤖</div>
                    <h3 class="text-lg font-bold mb-2">AI 맞춤 질문</h3>
                    <p class="text-blue-100 text-sm">GPT-4 기반 자연스러운 대화형 면접</p>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                    <div class="text-4xl mb-3">⏱️</div>
                    <h3 class="text-lg font-bold mb-2">단 5분 소요</h3>
                    <p class="text-blue-100 text-sm">15개 질문으로 빠르게 완료</p>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                    <div class="text-4xl mb-3">📊</div>
                    <h3 class="text-lg font-bold mb-2">즉시 결과 확인</h3>
                    <p class="text-blue-100 text-sm">S/A/B/C/D 등급과 상세 피드백</p>
                </div>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
                <h3 class="text-xl font-bold mb-4 flex items-center">
                    <i class="fas fa-fire text-yellow-300 mr-3"></i>
                    실전 곤란 상황 시나리오 포함!
                </h3>
                <ul class="space-y-3 text-blue-100">
                    <li class="flex items-start">
                        <i class="fas fa-check-circle text-green-300 mr-3 mt-1"></i>
                        <span>실제 업무에서 발생하는 까다로운 상황 대응 평가</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check-circle text-green-300 mr-3 mt-1"></i>
                        <span>손님 응대, 돌발 상황, 팀워크 능력 종합 측정</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check-circle text-green-300 mr-3 mt-1"></i>
                        <span>적성검사 결과와 연동된 개인화 피드백</span>
                    </li>
                </ul>
            </div>
            
            <div class="text-center">
                <button 
                    onclick="location.href='/chat.html?from=test'" 
                    class="inline-block bg-white text-blue-600 px-12 py-5 rounded-full text-xl font-bold hover:bg-blue-50 transition transform hover:scale-105 shadow-2xl"
                >
                    <i class="fas fa-robot mr-3"></i>
                    AI 면접 시작하기
                    <i class="fas fa-arrow-right ml-3"></i>
                </button>
                <p class="text-blue-100 text-sm mt-4">
                    <i class="fas fa-lock mr-2"></i>
                    적성검사 결과가 자동으로 반영됩니다
                </p>
            </div>
        </div>
    `;
    
    console.log('✅ AI 면접 유도 섹션 표시 완료');
}

// 북마크 함수 (간단 버전)
async function bookmarkJob(jobId) {
    if (!isLoggedIn) {
        alert('로그인이 필요합니다!');
        location.href = '/login.html';
        return;
    }
    
    try {
        const sessionToken = localStorage.getItem('albi_session_token');
        const response = await fetch('/api/bookmarks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ job_id: jobId })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('✅ 관심 공고에 추가되었습니다!');
        } else {
            alert('⚠️ ' + (data.message || '추가에 실패했습니다'));
        }
    } catch (error) {
        console.error('북마크 실패:', error);
        alert('⚠️ 네트워크 오류가 발생했습니다');
    }
}

// 블러 적용
function applyBlur() {
    const detailedContent = document.getElementById('detailedContent');
    if (detailedContent) {
        detailedContent.classList.add('blur-content');
        console.log('✅ 블러 적용됨');
    }
}

// 블러 제거
function removeBlur() {
    const detailedContent = document.getElementById('detailedContent');
    if (detailedContent) {
        detailedContent.classList.remove('blur-content');
    }
    
    const loginPrompt = document.getElementById('loginPrompt');
    if (loginPrompt) {
        loginPrompt.classList.add('hidden');
    }
    
    console.log('✅ 블러 제거됨');
}

// 로그인 페이지로 이동
function goToLogin() {
    // 리다이렉트 URL을 localStorage에 저장
    localStorage.setItem('redirect_after_login', '/job-test-result.html');
    console.log('✅ 로그인 후 리다이렉트 URL 저장: /job-test-result.html');
    window.location.href = '/login.html';
}

// 프롬프트 닫기
function closePrompt() {
    const loginPrompt = document.getElementById('loginPrompt');
    if (loginPrompt) {
        loginPrompt.classList.add('hidden');
    }
}

// 카카오톡 공유
function shareKakao() {
    console.log('🔍 카카오톡 공유 시도');
    console.log('Kakao 객체:', typeof Kakao !== 'undefined' ? '존재' : '없음');
    console.log('Kakao 초기화:', typeof Kakao !== 'undefined' && Kakao.isInitialized());
    
    try {
        if (typeof Kakao === 'undefined') {
            console.error('❌ Kakao SDK가 로드되지 않음');
            alert('⚠️ 카카오톡 공유 기능을 사용할 수 없습니다.\n\n대신 "링크 복사" 버튼을 이용해주세요!');
            return;
        }
        
        if (!Kakao.isInitialized()) {
            console.error('❌ Kakao SDK 초기화 안됨');
            alert('⚠️ 카카오 SDK가 초기화되지 않았습니다.\n\n관리자: Kakao Developers 콘솔에서 JavaScript 키를 등록해주세요.\n\n임시로 "링크 복사" 버튼을 이용해주세요!');
            return;
        }
        
        if (!testData || !testData.types || !testResult) {
            alert('테스트 데이터를 불러올 수 없습니다.');
            return;
        }
        
        const { resultType } = testResult;
        const typeKey = resultType.primary;
        const typeInfo = testData.types[typeKey];
        
        if (!typeInfo) {
            alert('타입 정보를 찾을 수 없습니다.');
            return;
        }
        
        const appUrl = (typeof ALBI_CONFIG !== 'undefined') ? ALBI_CONFIG.APP_URL : 'https://albi.kr';
        const ogImage = (typeof ALBI_CONFIG !== 'undefined') ? ALBI_CONFIG.DEFAULT_OG_IMAGE : 'https://albi.kr/static/images/job-test-og.png';
        
        console.log('📤 카카오톡 공유 데이터:', {
            title: `나는 ${typeInfo.shortName}! ${typeInfo.emoji}`,
            description: typeInfo.description,
            imageUrl: ogImage,
            url: `${appUrl}/job-test.html`
        });
        
        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: `나는 ${typeInfo.shortName}! ${typeInfo.emoji}`,
                description: typeInfo.description,
                imageUrl: ogImage,
                link: {
                    mobileWebUrl: `${appUrl}/job-test.html`,
                    webUrl: `${appUrl}/job-test.html`
                }
            },
            buttons: [
                {
                    title: '나도 테스트하기',
                    link: {
                        mobileWebUrl: `${appUrl}/job-test.html`,
                        webUrl: `${appUrl}/job-test.html`
                    }
                }
            ]
        });
        
        console.log('✅ 카카오톡 공유 요청 성공');
    } catch (error) {
        console.error('❌ 카카오톡 공유 실패:', error);
        
        // 에러 타입별 안내
        if (error.message && error.message.includes('domain')) {
            alert('⚠️ 도메인 등록 오류\n\n관리자: Kakao Developers 콘솔에서 다음 도메인을 등록해주세요:\n• https://albi.kr\n• https://albi-app.pages.dev\n\n임시로 "링크 복사" 버튼을 이용해주세요!');
        } else if (error.message && error.message.includes('key')) {
            alert('⚠️ JavaScript 키 오류\n\n관리자: Kakao Developers 콘솔에서 JavaScript 키를 확인해주세요.\n\n임시로 "링크 복사" 버튼을 이용해주세요!');
        } else {
            alert(`⚠️ 카카오톡 공유에 실패했습니다.\n\n${error.message}\n\n임시로 "링크 복사" 버튼을 이용해주세요!`);
        }
    }
}

// 인스타그램 공유 (스토리)
function shareInstagram() {
    console.log('📸 인스타그램 공유 시도');
    
    if (!testResult || !testData) {
        alert('⚠️ 테스트 데이터를 불러올 수 없습니다.');
        return;
    }
    
    const { resultType } = testResult;
    const typeKey = resultType.primary;
    const typeInfo = testData.types[typeKey];
    
    if (!typeInfo) {
        alert('⚠️ 타입 정보를 찾을 수 없습니다.');
        return;
    }
    
    const appUrl = (typeof ALBI_CONFIG !== 'undefined') ? ALBI_CONFIG.APP_URL : 'https://albi.kr';
    const shareUrl = `${appUrl}/job-test.html`;
    const shareText = `나는 ${typeInfo.shortName}! ${typeInfo.emoji}\n${typeInfo.description}\n\n알비에서 나의 직무 적성을 알아보세요! 👉 ${shareUrl}`;
    
    // 모바일에서 인스타그램 앱 확인
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        // 모바일: Web Share API 사용 (인스타그램 앱으로 공유 가능)
        if (navigator.share) {
            navigator.share({
                title: `나는 ${typeInfo.shortName}!`,
                text: shareText,
                url: shareUrl
            })
            .then(() => console.log('✅ 인스타그램 공유 성공'))
            .catch((error) => {
                console.error('❌ 공유 실패:', error);
                // 실패 시 텍스트 복사
                copyTextForInstagram(shareText);
            });
        } else {
            // Web Share API 미지원 시 텍스트 복사
            copyTextForInstagram(shareText);
        }
    } else {
        // 데스크톱: 텍스트 복사 + 인스타그램 앱 안내
        copyTextForInstagram(shareText);
    }
}

// 인스타그램용 텍스트 복사
function copyTextForInstagram(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            alert('✅ 공유 텍스트가 복사되었습니다!\n\n인스타그램 앱을 열고 스토리나 게시물에 붙여넣기 해주세요.\n\n💡 팁: 결과 화면을 스크린샷으로 찍어서 함께 올리면 더 좋아요!');
        })
        .catch(err => {
            console.error('❌ 복사 실패:', err);
            alert('⚠️ 텍스트 복사에 실패했습니다.\n\n수동으로 복사해주세요:\n\n' + text);
        });
}

// 링크 복사
function shareLink() {
    const appUrl = (typeof ALBI_CONFIG !== 'undefined') ? ALBI_CONFIG.APP_URL : window.location.origin;
    const url = `${appUrl}/job-test.html`;
    navigator.clipboard.writeText(url).then(() => {
        alert('✅ 링크가 복사되었습니다!\n\n친구에게 공유해보세요!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('링크 복사에 실패했습니다.');
    });
}

// 점수 라벨 반환 헬퍼 함수
function getScoreLabel(key) {
    const labels = {
        'strategic': '전략형',
        'analytical': '분석형',
        'communicative': '소통형',
        'executive': '실행형'
    };
    return labels[key] || key;
}

// 마이페이지에 테스트 결과 저장
function saveToMyPage() {
    if (!isLoggedIn || !testResult) {
        console.log('⚠️ 로그인하지 않았거나 테스트 결과가 없어 저장하지 않음');
        return;
    }
    
    try {
        // 이미 저장되었는지 확인 (세션 내 중복 저장 방지)
        const savedKey = 'lastSavedTestResult';
        const lastSaved = sessionStorage.getItem(savedKey);
        const currentResult = JSON.stringify({
            type: testResult.resultType.primary,
            timestamp: testResult.timestamp
        });
        
        if (lastSaved === currentResult) {
            console.log('⏭️ 이미 저장된 결과 - 중복 저장 방지');
            return;
        }
        
        // localStorage에 저장 (추후 API 연동 가능)
        const savedTests = JSON.parse(localStorage.getItem('myTestResults') || '[]');
        
        // 중복 체크 강화: timestamp가 정확히 같으면 중복으로 간주
        const existingIndex = savedTests.findIndex(test => 
            test.timestamp === testResult.timestamp
        );
        
        const testRecord = {
            ...testResult,
            date: new Date().toISOString().split('T')[0]
        };
        
        if (existingIndex >= 0) {
            // 이미 같은 timestamp의 결과가 있으면 업데이트
            savedTests[existingIndex] = testRecord;
            console.log('✅ 기존 결과 업데이트됨');
        } else {
            // 새로운 결과 추가
            savedTests.unshift(testRecord); // 최신 결과를 맨 앞에 추가
            console.log('✅ 새 결과 추가됨');
        }
        
        // 최대 10개까지만 저장
        if (savedTests.length > 10) {
            savedTests.splice(10); // 10개 이후 모두 제거
        }
        
        localStorage.setItem('myTestResults', JSON.stringify(savedTests));
        sessionStorage.setItem(savedKey, currentResult);
        console.log('✅ 마이페이지에 테스트 결과 저장 완료:', savedTests.length, '건');
    } catch (error) {
        console.error('❌ 마이페이지 저장 실패:', error);
    }
}
