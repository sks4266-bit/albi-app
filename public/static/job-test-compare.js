// 전역 변수
let myResult = null;
let friendResult = null;
let comparisonChart = null;

// 페이지 로드
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 팀워크 궁합 분석 페이지 로드');
    
    // 내 결과 불러오기
    await loadMyResult();
    
    // URL 파라미터에서 친구 결과 확인
    const urlParams = new URLSearchParams(window.location.search);
    const friendData = urlParams.get('friend');
    
    if (friendData) {
        try {
            friendResult = JSON.parse(decodeURIComponent(friendData));
            displayFriendResult();
            enableCompareButton();
        } catch (error) {
            console.error('❌ 친구 데이터 파싱 실패:', error);
        }
    }
});

// 내 결과 불러오기
async function loadMyResult() {
    console.log('🔍 내 테스트 결과 불러오기');
    
    const myResultCard = document.getElementById('myResultCard');
    
    // localStorage에서 내 최신 결과 가져오기
    const savedTests = JSON.parse(localStorage.getItem('myTestResults') || '[]');
    
    if (savedTests.length === 0) {
        myResultCard.innerHTML = `
            <p class="text-gray-600 mb-3">저장된 테스트 결과가 없습니다</p>
            <a href="/job-test.html" class="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm">
                테스트 하러 가기
            </a>
        `;
        return;
    }
    
    // 최신 결과 사용
    myResult = savedTests[0];
    displayMyResult();
}

// 내 결과 표시
function displayMyResult() {
    const card = document.getElementById('myResultCard');
    const emoji = getEmojiByType(myResult.resultType.primary);
    const typeName = getTypeNameByType(myResult.resultType.primary);
    
    card.innerHTML = `
        <div class="flex items-center gap-3 mb-3">
            <div class="text-4xl">${emoji}</div>
            <div>
                <div class="font-bold text-gray-800 text-lg">${typeName}</div>
                <div class="text-sm text-gray-600">${myResult.resultType.primary}</div>
            </div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="bg-blue-50 p-2 rounded">
                <div class="text-xs text-gray-600">전략</div>
                <div class="font-bold text-blue-600">${myResult.scores.strategic}</div>
            </div>
            <div class="bg-purple-50 p-2 rounded">
                <div class="text-xs text-gray-600">분석</div>
                <div class="font-bold text-purple-600">${myResult.scores.analytical}</div>
            </div>
            <div class="bg-green-50 p-2 rounded">
                <div class="text-xs text-gray-600">소통</div>
                <div class="font-bold text-green-600">${myResult.scores.communicative}</div>
            </div>
            <div class="bg-orange-50 p-2 rounded">
                <div class="text-xs text-gray-600">실행</div>
                <div class="font-bold text-orange-600">${myResult.scores.executive}</div>
            </div>
        </div>
    `;
    
    console.log('✅ 내 결과 표시 완료');
}

// 친구 결과 선택
function selectFriendResult() {
    const savedTests = JSON.parse(localStorage.getItem('myTestResults') || '[]');
    
    if (savedTests.length < 2) {
        alert('⚠️ 비교할 다른 결과가 없습니다.\n\n친구에게 테스트 링크를 공유하고 결과를 받아보세요!');
        return;
    }
    
    // 간단한 선택 UI (두 번째 결과 사용)
    friendResult = savedTests[1];
    displayFriendResult();
    enableCompareButton();
}

// 친구 결과 표시
function displayFriendResult() {
    const card = document.getElementById('friendResultCard');
    const emoji = getEmojiByType(friendResult.resultType.primary);
    const typeName = getTypeNameByType(friendResult.resultType.primary);
    
    card.innerHTML = `
        <div class="flex items-center gap-3 mb-3">
            <div class="text-4xl">${emoji}</div>
            <div>
                <div class="font-bold text-gray-800 text-lg">${typeName}</div>
                <div class="text-sm text-gray-600">${friendResult.resultType.primary}</div>
            </div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="bg-blue-50 p-2 rounded">
                <div class="text-xs text-gray-600">전략</div>
                <div class="font-bold text-blue-600">${friendResult.scores.strategic}</div>
            </div>
            <div class="bg-purple-50 p-2 rounded">
                <div class="text-xs text-gray-600">분석</div>
                <div class="font-bold text-purple-600">${friendResult.scores.analytical}</div>
            </div>
            <div class="bg-green-50 p-2 rounded">
                <div class="text-xs text-gray-600">소통</div>
                <div class="font-bold text-green-600">${friendResult.scores.communicative}</div>
            </div>
            <div class="bg-orange-50 p-2 rounded">
                <div class="text-xs text-gray-600">실행</div>
                <div class="font-bold text-orange-600">${friendResult.scores.executive}</div>
            </div>
        </div>
    `;
    
    console.log('✅ 친구 결과 표시 완료');
}

// 비교 버튼 활성화
function enableCompareButton() {
    const btn = document.getElementById('compareBtn');
    if (myResult && friendResult) {
        btn.disabled = false;
        btn.classList.remove('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
        btn.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white', 'hover:shadow-xl');
    }
}

// 궁합 분석 시작
function compareResults() {
    console.log('🎯 궁합 분석 시작');
    
    // 선택 섹션 숨기기
    document.getElementById('selectSection').classList.add('hidden');
    
    // 결과 섹션 표시
    document.getElementById('resultSection').classList.remove('hidden');
    
    // 궁합도 계산 및 표시
    const compatibility = calculateCompatibility();
    displayCompatibilityScore(compatibility);
    
    // 차트 렌더링
    renderComparisonChart();
    
    // 점수 비교 표시
    displayScoreComparison();
    
    // 팀워크 분석 표시
    displayTeamworkAnalysis(compatibility);
    
    // 추천 협업 방식
    displayRecommendedCollaboration(compatibility);
    
    // 페이지 맨 위로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 궁합도 계산 알고리즘
function calculateCompatibility() {
    console.log('📊 궁합도 계산 중...');
    
    const my = myResult.scores;
    const friend = friendResult.scores;
    
    // 1. 유사도 점수 (0-100)
    const similarity = 100 - (
        Math.abs(my.strategic - friend.strategic) +
        Math.abs(my.analytical - friend.analytical) +
        Math.abs(my.communicative - friend.communicative) +
        Math.abs(my.executive - friend.executive)
    ) / 64 * 100;
    
    // 2. 보완 관계 점수 (0-100)
    let complementary = 0;
    const myType = myResult.resultType.primary;
    const friendType = friendResult.resultType.primary;
    
    // 좋은 조합 (보완 관계)
    const goodCombos = {
        'strategic': ['analytical', 'executive'],
        'analytical': ['strategic', 'communicative'],
        'communicative': ['analytical', 'executive'],
        'executive': ['strategic', 'communicative']
    };
    
    if (goodCombos[myType]?.includes(friendType)) {
        complementary = 80;
    } else if (myType === friendType) {
        complementary = 60; // 같은 성향
    } else {
        complementary = 40;
    }
    
    // 3. 균형 점수 (0-100)
    const totalScore = (
        my.strategic + friend.strategic +
        my.analytical + friend.analytical +
        my.communicative + friend.communicative +
        my.executive + friend.executive
    ) / 2;
    
    const balance = Math.min(
        (Math.abs(my.strategic + friend.strategic - totalScore/4) / (totalScore/4) * 50) + 50,
        100
    );
    
    // 최종 점수 (가중 평균)
    const finalScore = Math.round(
        similarity * 0.3 +
        complementary * 0.5 +
        balance * 0.2
    );
    
    console.log(`✅ 궁합도 계산 완료: ${finalScore}%`);
    
    return {
        score: finalScore,
        similarity,
        complementary,
        balance,
        myType,
        friendType
    };
}

// 궁합도 점수 표시
function displayCompatibilityScore(compatibility) {
    const scoreEl = document.getElementById('compatibilityScore');
    const levelEl = document.getElementById('compatibilityLevel');
    const descEl = document.getElementById('compatibilityDescription');
    
    const score = compatibility.score;
    
    // 점수 애니메이션
    let current = 0;
    const interval = setInterval(() => {
        current += 2;
        if (current >= score) {
            current = score;
            clearInterval(interval);
        }
        scoreEl.textContent = `${current}%`;
    }, 20);
    
    // 레벨 및 설명
    let level = '';
    let description = '';
    let emoji = '';
    
    if (score >= 85) {
        level = '환상의 팀워크! 🎉';
        emoji = '🔥';
        description = '두 분은 함께 일하기에 최적의 조합입니다! 서로의 강점을 극대화하고 약점을 보완할 수 있는 관계예요.';
    } else if (score >= 70) {
        level = '훌륭한 팀워크! 👍';
        emoji = '✨';
        description = '두 분은 함께 일하면 시너지를 낼 수 있는 관계입니다. 서로를 이해하고 존중하면 좋은 결과를 만들 수 있어요.';
    } else if (score >= 50) {
        level = '괜찮은 팀워크 😊';
        emoji = '💪';
        description = '두 분은 노력하면 좋은 팀을 이룰 수 있습니다. 서로의 차이를 이해하고 소통에 신경 쓰면 잘 맞을 거예요.';
    } else {
        level = '도전적인 팀워크 🤔';
        emoji = '💡';
        description = '두 분은 성향이 많이 다르지만, 그만큼 새로운 관점을 배울 수 있는 관계입니다. 소통과 이해가 중요해요.';
    }
    
    levelEl.textContent = level;
    descEl.innerHTML = `
        <div class="text-5xl mb-4">${emoji}</div>
        <p class="text-lg">${description}</p>
        <div class="mt-6 grid md:grid-cols-3 gap-4 text-left">
            <div class="bg-blue-50 p-4 rounded-xl">
                <div class="text-sm text-gray-600 mb-1">유사도</div>
                <div class="text-2xl font-bold text-blue-600">${Math.round(compatibility.similarity)}%</div>
            </div>
            <div class="bg-purple-50 p-4 rounded-xl">
                <div class="text-sm text-gray-600 mb-1">보완 관계</div>
                <div class="text-2xl font-bold text-purple-600">${Math.round(compatibility.complementary)}%</div>
            </div>
            <div class="bg-green-50 p-4 rounded-xl">
                <div class="text-sm text-gray-600 mb-1">균형도</div>
                <div class="text-2xl font-bold text-green-600">${Math.round(compatibility.balance)}%</div>
            </div>
        </div>
    `;
}

// 비교 차트 렌더링
function renderComparisonChart() {
    const canvas = document.getElementById('comparisonChart');
    const ctx = canvas.getContext('2d');
    
    const my = myResult.scores;
    const friend = friendResult.scores;
    
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    comparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['전략형', '분석형', '소통형', '실행형'],
            datasets: [
                {
                    label: '나',
                    data: [my.strategic, my.analytical, my.communicative, my.executive],
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(59, 130, 246)'
                },
                {
                    label: '친구',
                    data: [friend.strategic, friend.analytical, friend.communicative, friend.executive],
                    backgroundColor: 'rgba(168, 85, 247, 0.2)',
                    borderColor: 'rgb(168, 85, 247)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgb(168, 85, 247)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(168, 85, 247)'
                }
            ]
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
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

// 점수 비교 표시
function displayScoreComparison() {
    const container = document.getElementById('scoreComparison');
    const my = myResult.scores;
    const friend = friendResult.scores;
    
    const dimensions = [
        { name: '전략형', key: 'strategic', color: 'blue' },
        { name: '분석형', key: 'analytical', color: 'purple' },
        { name: '소통형', key: 'communicative', color: 'green' },
        { name: '실행형', key: 'executive', color: 'orange' }
    ];
    
    container.innerHTML = dimensions.map(dim => {
        const myScore = my[dim.key];
        const friendScore = friend[dim.key];
        const diff = Math.abs(myScore - friendScore);
        
        return `
            <div class="bg-${dim.color}-50 p-4 rounded-xl">
                <div class="font-bold text-gray-800 mb-2">${dim.name}</div>
                <div class="flex items-center justify-between mb-1">
                    <span class="text-sm text-gray-600">나</span>
                    <span class="text-lg font-bold text-${dim.color}-600">${myScore}</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">친구</span>
                    <span class="text-lg font-bold text-${dim.color}-600">${friendScore}</span>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                    차이: ${diff}점 ${diff < 4 ? '(비슷함)' : diff < 8 ? '(약간 다름)' : '(많이 다름)'}
                </div>
            </div>
        `;
    }).join('');
}

// 팀워크 분석 표시
function displayTeamworkAnalysis(compatibility) {
    const container = document.getElementById('teamworkAnalysis');
    const myType = compatibility.myType;
    const friendType = compatibility.friendType;
    
    // 성향 조합별 분석
    const analyses = {
        'strategic-analytical': {
            strength: '전략과 분석의 완벽한 조합! 큰 그림을 보면서 세부적인 데이터로 뒷받침할 수 있습니다.',
            challenge: '실행력이 부족할 수 있으니, 빠른 실행을 위한 파트너가 필요할 수 있습니다.'
        },
        'strategic-communicative': {
            strength: '전략을 수립하고 사람들에게 효과적으로 전달할 수 있는 조합입니다.',
            challenge: '세부 분석이 약할 수 있으니, 데이터 검증에 신경 써야 합니다.'
        },
        'strategic-executive': {
            strength: '전략 수립과 빠른 실행이 가능한 드림팀입니다!',
            challenge: '소통과 협업 프로세스를 명확히 해야 오해를 줄일 수 있습니다.'
        },
        'analytical-communicative': {
            strength: '데이터 기반으로 설득력 있게 커뮤니케이션할 수 있는 조합입니다.',
            challenge: '장기 전략 수립 시 외부 조언이 필요할 수 있습니다.'
        },
        'analytical-executive': {
            strength: '정확한 분석과 빠른 실행력을 갖춘 효율적인 팀입니다.',
            challenge: '사람과의 소통 부분에서 보완이 필요할 수 있습니다.'
        },
        'communicative-executive': {
            strength: '사람들과 잘 소통하며 빠르게 실행하는 행동파 조합입니다!',
            challenge: '장기 계획과 데이터 분석에 시간을 더 투자해야 합니다.'
        }
    };
    
    // 같은 성향인 경우
    if (myType === friendType) {
        container.innerHTML = `
            <div class="bg-blue-50 p-6 rounded-xl">
                <h3 class="font-bold text-gray-800 mb-3">
                    <i class="fas fa-check-circle text-blue-600 mr-2"></i>강점
                </h3>
                <p class="text-gray-700">서로를 이해하기 쉽고 같은 방식으로 일할 수 있어 편안합니다. 의견 충돌이 적고 빠르게 합의할 수 있습니다.</p>
            </div>
            <div class="bg-orange-50 p-6 rounded-xl">
                <h3 class="font-bold text-gray-800 mb-3">
                    <i class="fas fa-exclamation-triangle text-orange-600 mr-2"></i>주의사항
                </h3>
                <p class="text-gray-700">같은 약점을 공유할 수 있으니, 다른 성향의 팀원을 영입하거나 부족한 부분을 의식적으로 보완해야 합니다.</p>
            </div>
        `;
    } else {
        const comboKey = [myType, friendType].sort().join('-');
        const analysis = analyses[comboKey] || {
            strength: '서로 다른 강점을 가진 조합입니다. 다양한 관점에서 문제를 바라볼 수 있습니다.',
            challenge: '차이를 이해하고 존중하는 것이 중요합니다. 소통을 자주 하세요.'
        };
        
        container.innerHTML = `
            <div class="bg-green-50 p-6 rounded-xl">
                <h3 class="font-bold text-gray-800 mb-3">
                    <i class="fas fa-thumbs-up text-green-600 mr-2"></i>시너지 효과
                </h3>
                <p class="text-gray-700">${analysis.strength}</p>
            </div>
            <div class="bg-yellow-50 p-6 rounded-xl">
                <h3 class="font-bold text-gray-800 mb-3">
                    <i class="fas fa-lightbulb text-yellow-600 mr-2"></i>보완 포인트
                </h3>
                <p class="text-gray-700">${analysis.challenge}</p>
            </div>
        `;
    }
}

// 추천 협업 방식
function displayRecommendedCollaboration(compatibility) {
    const container = document.getElementById('recommendedCollaboration');
    const score = compatibility.score;
    
    let recommendations = [];
    
    if (score >= 70) {
        recommendations = [
            {
                icon: '🎯',
                title: '공동 프로젝트',
                desc: '함께 프로젝트를 기획하고 실행하면 좋은 결과를 낼 수 있어요.'
            },
            {
                icon: '💡',
                title: '브레인스토밍',
                desc: '정기적으로 만나 아이디어를 나누고 피드백을 주고받으세요.'
            },
            {
                icon: '📊',
                title: '역할 분담',
                desc: '각자의 강점을 살려 역할을 나누면 더 효율적입니다.'
            }
        ];
    } else {
        recommendations = [
            {
                icon: '🗣️',
                title: '소통 강화',
                desc: '정기적인 미팅으로 서로의 생각과 관점을 공유하세요.'
            },
            {
                icon: '📝',
                title: '명확한 규칙',
                desc: '협업 방식과 역할을 명확히 정해 오해를 줄이세요.'
            },
            {
                icon: '🤝',
                title: '상호 존중',
                desc: '서로의 다른 점을 인정하고 배우려는 자세가 중요합니다.'
            }
        ];
    }
    
    container.innerHTML = recommendations.map(rec => `
        <div class="bg-gray-50 p-6 rounded-xl hover:bg-gray-100 transition">
            <div class="text-3xl mb-3">${rec.icon}</div>
            <h3 class="font-bold text-gray-800 mb-2">${rec.title}</h3>
            <p class="text-gray-700">${rec.desc}</p>
        </div>
    `).join('');
}

// 결과 공유
function shareComparison() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert('✅ 링크가 복사되었습니다!\n\n친구에게 공유해보세요.');
    }).catch(err => {
        console.error('복사 실패:', err);
        alert('⚠️ 링크 복사에 실패했습니다.');
    });
}

// 유틸리티 함수
function getEmojiByType(type) {
    const emojis = {
        'strategic': '🎯',
        'analytical': '📊',
        'communicative': '💬',
        'executive': '⚡'
    };
    return emojis[type] || '❓';
}

function getTypeNameByType(type) {
    const names = {
        'strategic': '전략형',
        'analytical': '분석형',
        'communicative': '소통형',
        'executive': '실행형'
    };
    return names[type] || '알 수 없음';
}
