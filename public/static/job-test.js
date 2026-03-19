// 전역 변수
let testData = null;
let currentQuestion = 0;
let answers = [];
let scores = {
    strategic: 0,
    analytical: 0,
    communicative: 0,
    executive: 0
};

// 데이터 로드
async function loadTestData() {
    try {
        const response = await fetch('/static/job-test-data.json');
        testData = await response.json();
        console.log('Test data loaded:', testData);
    } catch (error) {
        console.error('Failed to load test data:', error);
        alert('테스트 데이터를 불러오는데 실패했습니다. 페이지를 새로고침해주세요.');
    }
}

// 페이지 로드 시 데이터 로드
document.addEventListener('DOMContentLoaded', () => {
    loadTestData();
    
    // 저장된 진행 상황 확인
    const savedAnswers = localStorage.getItem('testAnswers');
    if (savedAnswers) {
        const resume = confirm('이전에 진행하던 테스트가 있습니다. 이어서 하시겠습니까?');
        if (resume) {
            answers = JSON.parse(savedAnswers);
            currentQuestion = answers.length;
            // 자동으로 테스트 시작
            if (currentQuestion < 16) {
                setTimeout(() => {
                    document.getElementById('startScreen').classList.add('hidden');
                    document.getElementById('testScreen').classList.remove('hidden');
                    showQuestion(currentQuestion);
                }, 100);
            }
        } else {
            localStorage.removeItem('testAnswers');
        }
    }
});

// 테스트 시작
function startTest() {
    currentQuestion = 0;
    answers = [];
    scores = {
        strategic: 0,
        analytical: 0,
        communicative: 0,
        executive: 0
    };
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('testScreen').classList.remove('hidden');
    
    showQuestion(0);
}

// 질문 표시
function showQuestion(index) {
    if (!testData || !testData.questions) {
        console.error('Test data not loaded');
        return;
    }
    
    const question = testData.questions[index];
    const progress = ((index + 1) / 16) * 100;
    
    // 진행률 업데이트
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${index + 1}/16`;
    
    // 차원 표시 업데이트
    const dimensionBadge = document.getElementById('currentDimension');
    dimensionBadge.textContent = question.dimensionName;
    dimensionBadge.className = 'dimension-badge';
    
    switch(question.dimension) {
        case 'Behavior':
            dimensionBadge.classList.add('dim-behavior');
            break;
        case 'Thinking':
            dimensionBadge.classList.add('dim-thinking');
            break;
        case 'Values':
            dimensionBadge.classList.add('dim-values');
            break;
        case 'Environment':
            dimensionBadge.classList.add('dim-environment');
            break;
    }
    
    // 질문 내용 업데이트
    document.getElementById('questionIcon').textContent = question.icon;
    document.getElementById('questionText').textContent = question.question;
    
    // 옵션 생성
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, i) => {
        const optionCard = document.createElement('div');
        optionCard.className = 'option-card bg-white border-2 border-gray-200 rounded-xl p-4 cursor-pointer';
        optionCard.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                    ${option.value}
                </div>
                <div class="flex-1 text-gray-700">
                    ${option.text}
                </div>
            </div>
        `;
        
        // 이전에 선택한 답변이 있으면 표시
        if (answers[index] && answers[index].value === option.value) {
            optionCard.classList.add('selected');
        }
        
        optionCard.onclick = () => selectOption(index, option, optionCard);
        optionsContainer.appendChild(optionCard);
    });
    
    // 버튼 상태 업데이트
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').disabled = !answers[index];
}

// 옵션 선택
function selectOption(questionIndex, option, card) {
    // 모든 옵션 카드 선택 해제
    const allCards = document.querySelectorAll('.option-card');
    allCards.forEach(c => c.classList.remove('selected'));
    
    // 선택한 카드 표시
    card.classList.add('selected');
    
    // 답변 저장
    answers[questionIndex] = {
        questionId: testData.questions[questionIndex].id,
        value: option.value,
        type: option.type,
        reverse: testData.questions[questionIndex].reverse || false,
        reverseType: option.reverseType
    };
    
    // localStorage에 저장 (중간 저장)
    localStorage.setItem('testAnswers', JSON.stringify(answers));
    
    // 다음 버튼 활성화
    document.getElementById('nextBtn').disabled = false;
    
    // 모바일에서는 자동으로 다음으로 (0.5초 후)
    if (window.innerWidth < 768) {
        setTimeout(() => {
            nextQuestion();
        }, 500);
    }
}

// 이전 질문
function previousQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion(currentQuestion);
    }
}

// 다음 질문
function nextQuestion() {
    if (!answers[currentQuestion]) {
        alert('답변을 선택해주세요.');
        return;
    }
    
    if (currentQuestion < 15) {
        currentQuestion++;
        showQuestion(currentQuestion);
    } else {
        // 테스트 완료
        finishTest();
    }
}

// 테스트 완료
function finishTest() {
    // 로딩 화면 표시
    document.getElementById('testScreen').classList.add('hidden');
    document.getElementById('loadingScreen').classList.remove('hidden');
    
    // 점수 계산
    calculateScores();
    
    // 결과 저장
    const result = {
        answers: answers,
        scores: scores,
        resultType: getResultType(),
        confidence: calculateConfidence(),
        consistency: checkConsistency(),
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('testResult', JSON.stringify(result));
    localStorage.removeItem('testAnswers'); // 진행 중인 답변 삭제
    
    // 마이페이지 결과 기록에 추가
    try {
        const myTestResults = JSON.parse(localStorage.getItem('myTestResults') || '[]');
        myTestResults.unshift(result); // 최신 결과를 맨 앞에 추가
        
        // 최대 10개까지만 저장
        if (myTestResults.length > 10) {
            myTestResults.pop();
        }
        
        localStorage.setItem('myTestResults', JSON.stringify(myTestResults));
        console.log('✅ 테스트 결과 저장 완료 (마이페이지)');
    } catch (error) {
        console.error('❌ 테스트 결과 저장 실패:', error);
    }
    
    // 2초 후 결과 페이지로 이동
    setTimeout(() => {
        console.log('✅ 적성검사 완료! 결과 페이지로 이동합니다...');
        window.location.href = '/job-test-result.html';  // ✨ 결과 페이지로 이동
    }, 2000);
}

// 점수 계산
function calculateScores() {
    scores = {
        strategic: 0,
        analytical: 0,
        communicative: 0,
        executive: 0
    };
    
    answers.forEach(answer => {
        if (answer.reverse) {
            // 역문항: 선택한 타입의 점수를 낮춤
            const reverseType = answer.reverseType || answer.type;
            scores[reverseType] = Math.max(0, scores[reverseType] - 1);
        } else {
            // 일반 문항: 선택한 타입의 점수 증가
            scores[answer.type] = (scores[answer.type] || 0) + 1;
        }
    });
    
    console.log('Final scores:', scores);
}

// 결과 타입 결정
function getResultType() {
    // 최고 점수와 두 번째 점수 찾기
    const sortedScores = Object.entries(scores)
        .sort((a, b) => b[1] - a[1]);
    
    const topType = sortedScores[0][0];
    const topScore = sortedScores[0][1];
    const secondType = sortedScores[1][0];
    const secondScore = sortedScores[1][1];
    
    const difference = topScore - secondScore;
    
    // 차이가 2 이하면 복합형
    if (difference <= 2) {
        const hybridKey = [topType, secondType].sort().join('-');
        return {
            primary: topType,
            secondary: secondType,
            hybrid: hybridKey,
            isHybrid: true
        };
    }
    
    return {
        primary: topType,
        isHybrid: false
    };
}

// 신뢰도 계산
function calculateConfidence() {
    const sortedScores = Object.entries(scores)
        .sort((a, b) => b[1] - a[1]);
    
    const difference = sortedScores[0][1] - sortedScores[1][1];
    
    if (difference >= 4) {
        return {
            level: '매우 높음',
            percentage: 95,
            description: '매우 명확한 성향을 보입니다.'
        };
    } else if (difference === 3) {
        return {
            level: '높음',
            percentage: 85,
            description: '명확한 성향을 보입니다.'
        };
    } else if (difference === 2) {
        return {
            level: '중간',
            percentage: 75,
            description: '복합적 성향을 가지고 있습니다.'
        };
    } else {
        return {
            level: '복합형',
            percentage: 65,
            description: '여러 성향이 고르게 나타납니다.'
        };
    }
}

// 일관성 검사
function checkConsistency() {
    // 같은 차원(Behavior, Thinking, Values, Environment) 내에서
    // 다른 타입을 선택한 횟수 체크
    const dimensionAnswers = {
        Behavior: [],
        Thinking: [],
        Values: [],
        Environment: []
    };
    
    answers.forEach((answer, index) => {
        const question = testData.questions[index];
        dimensionAnswers[question.dimension].push(answer.type);
    });
    
    let inconsistencies = 0;
    
    Object.values(dimensionAnswers).forEach(types => {
        const typeCount = {};
        types.forEach(type => {
            typeCount[type] = (typeCount[type] || 0) + 1;
        });
        
        // 한 차원 내에서 4개의 다른 타입이 모두 나타나면 일관성 낮음
        if (Object.keys(typeCount).length === 4) {
            inconsistencies++;
        }
    });
    
    return {
        score: Math.max(0, 10 - inconsistencies * 2),
        isConsistent: inconsistencies < 2,
        message: inconsistencies >= 2 
            ? '답변에 일관성이 다소 부족합니다. 보다 솔직하게 답변해보세요.' 
            : '일관성 있는 답변을 보여주셨습니다.'
    };
}

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    const testScreen = document.getElementById('testScreen');
    if (!testScreen.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') {
            previousQuestion();
        } else if (e.key === 'ArrowRight') {
            nextQuestion();
        } else if (['a', 'A', 'b', 'B', 'c', 'C', 'd', 'D'].includes(e.key)) {
            // A, B, C, D 키로 선택
            const optionIndex = e.key.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
            const options = document.querySelectorAll('.option-card');
            if (options[optionIndex]) {
                options[optionIndex].click();
            }
        }
    }
});
