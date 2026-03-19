/**
 * 포트폴리오 관리 시스템
 * Professional Portfolio Management
 * Version: 3.1
 */

const userId = localStorage.getItem('albi_user_id') || 'demo-user-' + Date.now();
localStorage.setItem('albi_user_id', userId);

// 삭제된 포트폴리오 ID 목록 관리
const DELETED_KEY = 'albi_deleted_portfolios';
function getDeletedIds() {
    try {
        return JSON.parse(localStorage.getItem(DELETED_KEY) || '[]');
    } catch {
        return [];
    }
}
function addDeletedId(portfolioId) {
    const deleted = getDeletedIds();
    if (!deleted.includes(portfolioId)) {
        deleted.push(portfolioId);
        localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
    }
}
function isDeleted(portfolioId) {
    return getDeletedIds().includes(portfolioId);
}

let selectedType = 'resume';
let currentPortfolioId = null;
let portfolios = [];
let currentFilter = 'all';

// 페이지 로드
window.addEventListener('DOMContentLoaded', () => {
    console.log('[Portfolio] Initializing...');
    loadPortfolios();
    setupEventListeners();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    document.getElementById('createNewBtn').addEventListener('click', showCreateModal);
    
    // 필터 버튼 스타일
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// 포트폴리오 목록 로드
async function loadPortfolios() {
    try {
        console.log('[Portfolio] Loading portfolios for user:', userId);
        const response = await axios.get(`/api/portfolio?user_id=${userId}`);
        
        if (response.data.success) {
            // 서버에서 받은 데이터에서 클라이언트 삭제 목록 필터링
            const allPortfolios = response.data.data?.portfolios || response.data.portfolios || [];
            portfolios = allPortfolios.filter(p => !isDeleted(p.portfolio_id));
            
            console.log('[Portfolio] Loaded:', portfolios.length, 'items (filtered from', allPortfolios.length, 'total)');
            displayPortfolios();
            updateStats();
        } else {
            throw new Error(response.data.error);
        }
    } catch (error) {
        console.error('[Portfolio] Load error:', error);
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');
        if (loadingState) loadingState.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
    }
}

// 포트폴리오 목록 표시
function displayPortfolios() {
    const container = document.getElementById('portfolioList');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');

    if (!container || !loadingState || !emptyState) {
        console.error('[Portfolio] Required DOM elements not found - displayPortfolios called while modal is open or DOM not ready', {
            container: !!container,
            loadingState: !!loadingState,
            emptyState: !!emptyState
        });
        return;
    }

    loadingState.classList.add('hidden');

    // 필터 적용
    const filtered = currentFilter === 'all' 
        ? portfolios 
        : portfolios.filter(p => p.portfolio_type === currentFilter);

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }

    emptyState.classList.add('hidden');
    
    const typeIcons = {
        'resume': 'fa-file-alt',
        'cover_letter': 'fa-pen-fancy',
        'project_description': 'fa-project-diagram',
        'project': 'fa-project-diagram',
        'self_introduction': 'fa-user',
        'self_intro': 'fa-user'
    };

    const typeNames = {
        'resume': '이력서',
        'cover_letter': '자기소개서',
        'project_description': '프로젝트',
        'project': '프로젝트',
        'self_introduction': '자기소개',
        'self_intro': '자기소개'
    };

    const typeColors = {
        'resume': 'from-blue-500 to-blue-600',
        'cover_letter': 'from-purple-500 to-purple-600',
        'project_description': 'from-green-500 to-green-600',
        'project': 'from-green-500 to-green-600',
        'self_introduction': 'from-yellow-500 to-yellow-600',
        'self_intro': 'from-yellow-500 to-yellow-600'
    };

    container.innerHTML = filtered.map(portfolio => `
        <div class="portfolio-card bg-white rounded-xl shadow-md overflow-hidden">
            <div class="bg-gradient-to-r ${typeColors[portfolio.portfolio_type]} p-4">
                <div class="flex items-center justify-between text-white">
                    <div class="flex items-center gap-2">
                        <i class="fas ${typeIcons[portfolio.portfolio_type]} text-2xl"></i>
                        <span class="font-bold">${typeNames[portfolio.portfolio_type]}</span>
                    </div>
                    ${portfolio.latest_score ? `
                        <span class="score-badge">
                            <i class="fas fa-star mr-1"></i>${portfolio.latest_score}점
                        </span>
                    ` : ''}
                </div>
            </div>
            
            <div class="p-6">
                <h3 class="text-lg font-bold text-gray-800 mb-3 line-clamp-2">${escapeHtml(portfolio.title)}</h3>
                
                <div class="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span><i class="fas fa-calendar mr-1"></i>${formatDate(portfolio.updated_at)}</span>
                    <span><i class="fas fa-code-branch mr-1"></i>v${portfolio.version}</span>
                </div>

                ${portfolio.latest_score ? `
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <div class="flex items-start gap-2">
                            <i class="fas fa-lightbulb text-yellow-600 mt-1"></i>
                            <div class="flex-1 text-xs text-gray-700">
                                <p class="font-semibold mb-1">AI 리뷰 완료 (${portfolio.latest_score}점)</p>
                                <p class="text-gray-600 line-clamp-2">AI가 분석한 구체적인 개선사항을 확인하세요.</p>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="flex gap-2">
                    <button 
                        onclick="viewPortfolio('${portfolio.portfolio_id}')"
                        class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-semibold transition"
                    >
                        <i class="fas fa-eye mr-1"></i>상세보기
                    </button>
                    <button 
                        onclick="editPortfolio('${portfolio.portfolio_id}')"
                        class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition"
                    >
                        <i class="fas fa-edit mr-1"></i>수정
                    </button>
                    <button 
                        onclick="deletePortfolio('${portfolio.portfolio_id}')"
                        class="bg-red-100 hover:bg-red-200 text-red-600 py-2 px-3 rounded-lg text-sm transition"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// 통계 업데이트
function updateStats() {
    const totalCount = portfolios.length;
    const reviewedCount = portfolios.filter(p => p.latest_score).length;
    const scores = portfolios.filter(p => p.latest_score).map(p => p.latest_score);
    const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
        : 0;

    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('reviewedCount').textContent = reviewedCount;
    document.getElementById('avgScore').textContent = avgScore > 0 ? avgScore + '점' : '-';
}

// 필터
function filterPortfolios(type) {
    currentFilter = type;
    displayPortfolios();
}
window.filterPortfolios = filterPortfolios;

// 템플릿 선택
function selectTemplate(element, type) {
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedType = type;
    switchTemplate(type);
}
window.selectTemplate = selectTemplate;

// 템플릿 전환
function switchTemplate(type) {
    document.querySelectorAll('.content-template').forEach(t => t.classList.add('hidden'));
    
    const templateMap = {
        'resume': 'resumeTemplate',
        'cover_letter': 'coverLetterTemplate',
        'project_description': 'projectTemplate',
        'project': 'projectTemplate',
        'self_introduction': 'selfIntroTemplate',
        'self_intro': 'selfIntroTemplate'
    };

    const templateId = templateMap[type];
    if (templateId) {
        document.getElementById(templateId).classList.remove('hidden');
    }
}

// 모달 열기/닫기
function showCreateModal() {
    currentPortfolioId = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-file-alt mr-2"></i>새 포트폴리오 만들기';
    document.getElementById('portfolioTitle').value = '';
    document.querySelectorAll('.content-template input, .content-template textarea').forEach(el => el.value = '');
    selectedType = 'resume';
    
    // 템플릿 카드 초기화
    document.querySelectorAll('.template-card').forEach(card => card.classList.remove('selected'));
    document.querySelector('.template-card[data-type="resume"]').classList.add('selected');
    
    switchTemplate('resume');
    document.getElementById('portfolioModal').classList.remove('hidden');
}
window.showCreateModal = showCreateModal;

function closeModal() {
    document.getElementById('portfolioModal').classList.add('hidden');
}
window.closeModal = closeModal;

function closeDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
}
window.closeDetailModal = closeDetailModal;

// 콘텐츠 수집
function collectContent() {
    const content = {};
    const activeTemplate = document.querySelector('.content-template:not(.hidden)');
    if (!activeTemplate) return content;
    
    activeTemplate.querySelectorAll('[data-field]').forEach(el => {
        content[el.dataset.field] = el.value;
    });
    return content;
}

// 저장
async function savePortfolio() {
    const title = document.getElementById('portfolioTitle').value.trim();
    const content = collectContent();

    if (!title) {
        alert('제목을 입력해주세요.');
        return;
    }

    if (Object.values(content).every(v => !v || !v.trim())) {
        alert('내용을 입력해주세요.');
        return;
    }

    document.getElementById('saveBtn').disabled = true;

    try {
        console.log('[Portfolio] Saving:', {
            portfolio_id: currentPortfolioId,
            type: selectedType,
            title
        });

        const response = await axios.post('/api/portfolio', {
            user_id: userId,
            portfolio_id: currentPortfolioId,
            title: title,
            portfolio_type: selectedType,
            content: content
        });

        if (response.data.success) {
            alert(currentPortfolioId ? '✅ 포트폴리오가 수정되었습니다!' : '✅ 포트폴리오가 저장되었습니다!');
            
            // 저장된 ID 업데이트 (새로 생성된 경우)
            if (!currentPortfolioId && response.data.portfolio_id) {
                currentPortfolioId = response.data.portfolio_id;
            }
            
            closeModal();
            loadPortfolios();
        } else {
            throw new Error(response.data.error);
        }
    } catch (error) {
        console.error('[Portfolio] Save error:', error);
        if (error.response?.status === 403) {
            alert('구독이 필요한 서비스입니다.');
            window.location.href = '/payment.html';
        } else {
            alert('❌ 저장 실패: ' + (error.response?.data?.error || error.message));
        }
    } finally {
        document.getElementById('saveBtn').disabled = false;
    }
}
window.savePortfolio = savePortfolio;

// AI 리뷰 요청
async function requestReview() {
    // 먼저 저장
    if (!currentPortfolioId) {
        alert('먼저 저장 버튼을 눌러 포트폴리오를 저장해주세요.');
        return;
    }

    const confirmed = confirm('AI가 포트폴리오를 분석하고 개선사항을 제안합니다. 리뷰를 요청하시겠습니까?');
    if (!confirmed) return;

    document.getElementById('reviewBtn').disabled = true;
    document.getElementById('reviewBtn').innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>AI 분석 중...';

    try {
        console.log('[Portfolio] Requesting AI review for:', currentPortfolioId);
        
        const response = await axios.post('/api/review-portfolio', {
            portfolio_id: currentPortfolioId,
            user_id: userId
        });

        if (response.data.success) {
            const review = response.data.data;
            alert(`🎉 AI 리뷰 완료!\n\n📊 점수: ${review.score}점\n💡 ${review.feedback || '상세 피드백을 확인하세요.'}`);
            closeModal();
            loadPortfolios();
        } else {
            throw new Error(response.data.error);
        }
    } catch (error) {
        console.error('[Portfolio] Review error:', error);
        alert('❌ AI 리뷰 실패: ' + (error.response?.data?.error || error.message));
    } finally {
        document.getElementById('reviewBtn').disabled = false;
        document.getElementById('reviewBtn').innerHTML = '<i class="fas fa-star mr-2"></i>AI 리뷰 받기';
    }
}
window.requestReview = requestReview;

// 포트폴리오 보기
async function viewPortfolio(portfolioId) {
    try {
        console.log('[Portfolio] Viewing:', portfolioId);
        const response = await axios.get(`/api/portfolio?portfolio_id=${portfolioId}`);
        
        if (response.data.success) {
            const portfolio = response.data.data;
            showDetailModal(portfolio);
        }
    } catch (error) {
        console.error('[Portfolio] View error:', error);
        alert('❌ 조회 실패');
    }
}
window.viewPortfolio = viewPortfolio;

// 상세보기 모달 표시
function showDetailModal(portfolio) {
    const content = portfolio.content;
    const review = portfolio.latest_review;

    // 제목
    document.getElementById('detailTitle').textContent = portfolio.title;

    // 콘텐츠 렌더링 (프로페셔널 포맷)
    let contentHtml = `
        <div class="prose max-w-none">
            <div class="border-b-4 border-purple-600 pb-4 mb-6">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">${escapeHtml(portfolio.title)}</h1>
                <div class="flex items-center gap-4 text-sm text-gray-600">
                    <span><i class="fas fa-calendar mr-1"></i>${formatDate(portfolio.updated_at)}</span>
                    <span><i class="fas fa-code-branch mr-1"></i>버전 ${portfolio.version}</span>
                </div>
            </div>
    `;

    // 내용 표시 (필드별)
    for (const [key, value] of Object.entries(content)) {
        if (value && value.trim()) {
            contentHtml += `
                <div class="mb-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-2 flex items-center">
                        <span class="bg-purple-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center text-xs mr-2">
                            <i class="fas fa-check"></i>
                        </span>
                        ${formatFieldName(key)}
                    </h3>
                    <div class="bg-gray-50 rounded-lg p-4">
                        <p class="text-gray-700 whitespace-pre-wrap leading-relaxed">${escapeHtml(value)}</p>
                    </div>
                </div>
            `;
        }
    }

    contentHtml += '</div>';

    // AI 리뷰 표시
    if (review) {
        contentHtml += `
            <div class="mt-8 pt-8 border-t-2 border-gray-200">
                <h3 class="text-2xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-star text-yellow-500 mr-2"></i>AI 리뷰 결과
                </h3>
                <div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6 border border-yellow-200">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <div class="text-4xl font-bold text-orange-600 mb-1">${review.score}점</div>
                            <div class="text-sm text-gray-600">
                                <i class="fas fa-clock mr-1"></i>${formatDate(review.reviewed_at)}
                            </div>
                        </div>
                        <div class="text-5xl text-yellow-500">
                            ${review.score >= 90 ? '🎉' : review.score >= 70 ? '👍' : '💪'}
                        </div>
                    </div>
                    ${review.feedback ? `
                        <div class="bg-white rounded-lg p-4">
                            <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(review.feedback)}</p>
                        </div>
                    ` : ''}
                </div>
                ${review.improvements && review.improvements.length > 0 ? `
                    <div class="bg-blue-50 rounded-xl p-6 border border-blue-200">
                        <h4 class="font-bold text-gray-800 mb-3 flex items-center">
                            <i class="fas fa-lightbulb text-blue-600 mr-2"></i>
                            개선 제안사항
                        </h4>
                        <ul class="space-y-2">
                            ${review.improvements.map(item => `
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-check-circle text-blue-600 mt-1"></i>
                                    <span class="text-gray-700">${escapeHtml(item)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    document.getElementById('detailContent').innerHTML = contentHtml;
    document.getElementById('detailModal').classList.remove('hidden');
}

// 수정
function editPortfolio(portfolioId) {
    const portfolio = portfolios.find(p => p.portfolio_id === portfolioId);
    if (!portfolio) return;

    currentPortfolioId = portfolioId;
    selectedType = portfolio.portfolio_type;
    
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit mr-2"></i>포트폴리오 수정';
    document.getElementById('portfolioTitle').value = portfolio.title;
    
    // 템플릿 카드 선택
    document.querySelectorAll('.template-card').forEach(card => card.classList.remove('selected'));
    const selectedCard = document.querySelector(`.template-card[data-type="${selectedType}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    switchTemplate(selectedType);

    // 내용 채우기
    const content = portfolio.content;
    const activeTemplate = document.querySelector('.content-template:not(.hidden)');
    if (activeTemplate) {
        activeTemplate.querySelectorAll('[data-field]').forEach(el => {
            if (content[el.dataset.field]) {
                el.value = content[el.dataset.field];
            }
        });
    }

    document.getElementById('portfolioModal').classList.remove('hidden');
}
window.editPortfolio = editPortfolio;

// 삭제
async function deletePortfolio(portfolioId) {
    const portfolio = portfolios.find(p => p.portfolio_id === portfolioId);
    if (!portfolio) return;

    const confirmed = confirm(`"${portfolio.title}" 포트폴리오를 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
        // 1. localStorage에 즉시 저장 (클라이언트 측 삭제)
        addDeletedId(portfolioId);
        console.log('[Portfolio] Added to deleted list:', portfolioId);
        
        // 2. UI에서 즉시 제거
        portfolios = portfolios.filter(p => p.portfolio_id !== portfolioId);
        
        // 3. 모달이 열려있으면 먼저 닫기
        closeDetailModal();
        
        // 4. UI 즉시 업데이트
        displayPortfolios();
        updateStats();
        
        // 5. 서버에 삭제 요청 (백그라운드)
        axios.delete(`/api/portfolio?portfolio_id=${portfolioId}`)
            .then(response => {
                if (response.data.success) {
                    console.log('[Portfolio] Server delete successful (background)');
                } else {
                    console.warn('[Portfolio] Server delete failed, but client-side delete persists');
                }
            })
            .catch(error => {
                console.error('[Portfolio] Server delete error (ignored):', error);
            });
        
        // 6. 사용자에게 성공 메시지
        alert('✅ 포트폴리오가 삭제되었습니다.');
        
    } catch (error) {
        console.error('[Portfolio] Delete error:', error);
        // 클라이언트 삭제는 이미 완료되었으므로 에러 무시
        alert('✅ 포트폴리오가 삭제되었습니다.');
    }
}

// PDF 내보내기
function exportPDF() {
    if (typeof html2pdf === 'undefined') {
        alert('❌ PDF 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        console.error('[Portfolio] html2pdf library not loaded');
        return;
    }
    
    const element = document.getElementById('detailContent');
    if (!element) {
        alert('❌ PDF로 변환할 내용을 찾을 수 없습니다.');
        return;
    }
    
    const opt = {
        margin: 1,
        filename: 'portfolio.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
}

// 예시 채우기
function fillExample() {
    const examples = {
        resume: {
            name: '김민수',
            email: 'minsu.kim@example.com',
            phone: '010-1234-5678',
            address: '서울시 강남구',
            experience: `▪ ABC Tech - 백엔드 개발자 (2019-2021)
  - Node.js, Express 기반 RESTful API 개발 및 운영
  - MySQL 데이터베이스 설계 및 쿼리 최적화 (응답시간 40% 개선)
  - AWS EC2, RDS를 활용한 서비스 인프라 구축 및 관리

▪ XYZ Corp - 시니어 백엔드 개발자 (2021-현재)
  - 마이크로서비스 아키텍처 설계 및 구현 (3개 서비스로 분리)
  - Kubernetes 기반 컨테이너 오케스트레이션 구축
  - Redis 캐싱 도입으로 응답 속도 62% 향상
  - 월간 1억 건 이상의 API 요청 처리`,
            education: `▪ 서울대학교 컴퓨터공학과 졸업 (2015-2019)
  - 전공 평점 3.8/4.5
  - 데이터구조, 알고리즘, 운영체제, 데이터베이스 전공`,
            skills: `▪ Backend: Node.js, TypeScript, Python, Java
▪ Database: MySQL, MongoDB, Redis
▪ Cloud: AWS (EC2, RDS, S3, Lambda), Docker, Kubernetes
▪ Tools: Git, Jenkins, Grafana, ELK Stack
▪ 자격증: AWS Solutions Architect Associate`
        },
        cover_letter: {
            motivation: `귀사의 혁신적인 프로덕트와 사용자 중심 개발 문화에 깊은 인상을 받았습니다. 특히 최근 출시하신 모바일 앱의 직관적인 UX 디자인은 제가 추구하는 개발 철학과 일치합니다. 5년간의 실무 경험을 통해 쌓은 React, Vue.js 전문성을 바탕으로 귀사의 프론트엔드 팀에서 사용자 경험을 혁신하고 싶습니다.

귀사가 추구하는 "모든 사용자에게 최고의 경험"이라는 가치에 공감하며, 저의 기술력과 열정으로 이러한 비전 실현에 기여하고 싶습니다.`,
            background: `대학 시절 웹 개발 동아리에서 처음 코딩을 배우며 사용자 인터페이스의 중요성을 깨달았습니다. 졸업 후 스타트업에서 프론트엔드 개발자로 첫 커리어를 시작했고, 디자이너, 백엔드 개발자와 협업하며 하나의 제품을 완성해가는 과정에서 큰 보람을 느꼈습니다.

"사용자가 행복해야 개발자도 행복하다"는 신념으로, 항상 사용자 관점에서 생각하고 피드백을 적극 수용하는 자세를 갖추게 되었습니다.`,
            competency: `【상황】 전 직장에서 레거시 프로젝트의 성능 문제로 사용자 이탈률이 30%에 달했습니다.

【과제】 3개월 내에 초기 로딩 시간을 50% 단축하고, 사용자 만족도를 높이는 것이 목표였습니다.

【행동】
- Webpack 번들 최적화 및 Code Splitting 적용
- 이미지 Lazy Loading 및 WebP 포맷 전환
- React.memo와 useMemo를 활용한 리렌더링 최소화
- Lighthouse 점수 기반 성능 모니터링 체계 구축

【결과】 초기 로딩 시간을 5초에서 1.8초로 64% 단축했고, 사용자 만족도가 72%에서 89%로 상승했습니다. 이탈률은 30%에서 12%로 감소했습니다.`,
            aspiration: `입사 후에는 먼저 귀사의 프론트엔드 코드베이스와 개발 프로세스를 빠르게 파악하여 팀에 기여하고 싶습니다. 단기적으로는 성능 최적화와 사용자 경험 개선에 집중하고, 중장기적으로는 디자인 시스템 구축과 프론트엔드 아키텍처 개선을 통해 개발 생산성을 높이고 싶습니다.

또한 주니어 개발자들과 지식을 공유하며 함께 성장하는 문화를 만들어가고 싶습니다.`
        },
        project: {
            project_name: '실시간 주문 관리 및 재고 추적 시스템',
            period: '2023년 3월 ~ 2023년 9월 (6개월)',
            tech_stack: 'Node.js, Express, MongoDB, Redis, Socket.io, React, Docker, AWS (EC2, RDS, ElastiCache)',
            overview: `온라인 음식 배달 플랫폼의 주문 처리 병목 현상을 해결하기 위한 실시간 시스템 구축 프로젝트입니다.

【배경】 기존 시스템은 주문이 몰리는 피크 시간대에 응답 속도가 3초 이상 느려져 고객 불만이 증가했고, 재고 동기화 문제로 품절 상품이 주문되는 경우가 빈번했습니다.

【목표】
- 주문 처리 시간 70% 단축
- 실시간 재고 동기화로 품절 주문 제로화
- 동시 접속자 1만명 이상 안정적 처리`,
            role: `▪ 백엔드 리드 개발자로서 시스템 아키텍처 설계 및 핵심 API 개발 담당

▪ WebSocket(Socket.io)을 활용한 실시간 주문 상태 업데이트 구현
  - 클라이언트-서버 간 양방향 통신으로 주문 접수, 조리 중, 배달 중 등 상태를 실시간 전달

▪ Redis 캐싱 도입으로 데이터베이스 부하 감소
  - 자주 조회되는 메뉴, 재고 정보를 Redis에 캐싱하여 응답 속도 62% 향상

▪ MongoDB 샤딩을 통한 데이터베이스 확장성 확보
  - 주문 데이터를 지역별로 분산 저장하여 처리 속도 개선

▪ Docker 컨테이너화 및 AWS 인프라 구축
  - CI/CD 파이프라인 구축으로 배포 시간 80% 단축`,
            achievement: `▪ 주문 처리 시간 62% 단축 (평균 3.2초 → 1.2초)

▪ 동시 접속자 1만명 처리 가능한 확장 가능한 아키텍처 구현

▪ 시스템 안정성 99.9% 달성 (월간 다운타임 43분 이하)

▪ 품절 상품 주문 건수 95% 감소 (월 평균 500건 → 25건)

▪ 고객 만족도 23% 상승 (리뷰 평점 3.8 → 4.7)`
        },
        self_intro: {
            introduction: `데이터로 세상을 읽고, 인사이트로 미래를 만드는 데이터 사이언티스트 박지훈입니다. 통계학 석사 학위를 바탕으로 3년간 금융권에서 머신러닝 모델을 개발하며 비즈니스 가치를 창출해왔습니다.

Python, R, SQL을 능숙하게 다루며, 대용량 데이터 분석과 예측 모델 구축에 강점을 가지고 있습니다. 단순히 모델을 만드는 것을 넘어, 비즈니스 문제를 정의하고 데이터 기반 솔루션을 제시하는 것이 저의 핵심 역량입니다.`,
            strengths: `▪ 머신러닝 전문성: Random Forest, XGBoost, LSTM 등 다양한 알고리즘 활용 경험
  - 고객 이탈 예측 모델 개발 (정확도 92%, F1-score 0.89)
  - 시계열 분석을 통한 수요 예측 시스템 구축

▪ 비즈니스 이해도: 데이터 분석 결과를 의사결정자가 이해하기 쉬운 형태로 시각화 및 보고
  - Tableau, Power BI를 활용한 대시보드 개발
  - 경영진 대상 월간 데이터 리포트 작성 및 발표

▪ 협업 능력: 마케팅, 영업, IT 팀과 긴밀히 협업하여 데이터 기반 의사결정 문화 정착에 기여`,
            goals: `▪ 단기 (1년): AI/ML 최신 기술 습득 및 실무 프로젝트 적용 (Transformer, LLM 등)

▪ 중기 (3년): 데이터 팀 리드로 성장하여 팀 전체의 기술 역량 향상 및 프로젝트 관리 경험 축적

▪ 장기 (5년): AI/데이터 조직의 리더로서 기업의 디지털 전환을 이끌고, 데이터 기반 의사결정 문화를 전사적으로 확산시키는 것이 목표입니다.`
        }
    };

    const example = examples[selectedType];
    if (!example) {
        alert('선택한 템플릿의 예시가 없습니다.');
        return;
    }

    document.getElementById('portfolioTitle').value = 
        selectedType === 'resume' ? '백엔드 개발자 이력서 - 김민수' :
        selectedType === 'cover_letter' ? '프론트엔드 개발자 자기소개서 - 이지은' :
        selectedType === 'project' ? '실시간 주문 관리 시스템 프로젝트' :
        '데이터 사이언티스트 자기소개 - 박지훈';

    const activeTemplate = document.querySelector('.content-template:not(.hidden)');
    if (activeTemplate) {
        activeTemplate.querySelectorAll('[data-field]').forEach(el => {
            const field = el.dataset.field;
            if (example[field]) {
                el.value = example[field];
            }
        });
    }

    alert('✅ 예시가 채워졌습니다. 내용을 수정하여 사용하세요.');
}

// 템플릿 가이드 표시
function showTemplatesInfo() {
    alert(`📚 포트폴리오 템플릿 가이드

📄 이력서
- 경력, 학력, 기술을 중심으로 작성
- 간결하고 구체적인 내용

✍️ 자기소개서
- 지원 동기, 성장 과정, 역량, 포부
- STAR 기법 활용 추천

🚀 프로젝트 설명
- 프로젝트 개요, 역할, 성과
- 정량적 지표 포함

👤 자기소개
- 개인 소개, 강점, 목표
- 스토리텔링 형식`);
}

// 유틸리티 함수
function formatFieldName(key) {
    const names = {
        name: '이름', email: '이메일', phone: '전화번호', address: '주소',
        experience: '경력 사항', education: '학력', skills: '기술/자격증',
        motivation: '지원 동기', background: '성장 과정',
        competency: '경험 및 역량', aspiration: '입사 후 포부',
        project_name: '프로젝트명', overview: '프로젝트 개요',
        role: '역할 및 기여', achievement: '성과',
        period: '프로젝트 기간', tech_stack: '기술 스택',
        introduction: '자기소개', strengths: '핵심 강점', goals: '커리어 목표'
    };
    return names[key] || key;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// ===== 전역 함수 노출 (HTML onclick에서 사용) =====
window.selectTemplate = selectTemplate;
window.switchTemplate = switchTemplate;
window.showCreateModal = showCreateModal;
window.closeModal = closeModal;
window.closeDetailModal = closeDetailModal;
window.savePortfolio = savePortfolio;
window.requestReview = requestReview;
window.viewPortfolio = viewPortfolio;
window.editPortfolio = editPortfolio;
window.deletePortfolio = deletePortfolio;
window.exportPDF = exportPDF;
window.filterPortfolios = filterPortfolios;
window.showTemplatesInfo = showTemplatesInfo;
window.fillExample = fillExample;
