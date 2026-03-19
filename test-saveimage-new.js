// 간단한 이미지 저장 - 실제 화면 요소 직접 캡처
async function saveImage() {
    console.log('🖼️ 이미지 저장 시작');
    
    if (typeof html2canvas === 'undefined') {
        alert('⚠️ 이미지 저장 기능을 사용할 수 없습니다.');
        return;
    }
    
    try {
        const button = event.target.closest('button');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>생성 중...';
        button.disabled = true;
        
        // 캡처할 요소들
        const captureCard = document.getElementById('captureCard');
        const radarSection = document.querySelector('.bg-white.rounded-3xl.shadow-lg.p-8.mb-8.fade-in');
        const famousSection = document.getElementById('famousPeople');
        
        // 레이더 차트 Canvas 직접 가져오기
        const radarChart = document.getElementById('radarChart');
        const radarDataUrl = radarChart.toDataURL();
        
        // 점수 상세 정보
        const scoreDetails = document.getElementById('scoreDetails').cloneNode(true);
        
        console.log('📸 이미지 생성 중...');
        
        // 임시 컨테이너
        const temp = document.createElement('div');
        temp.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: 1000px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 50px;
            font-family: -apple-system, sans-serif;
        `;
        
        // 흰색 박스
        const box = document.createElement('div');
        box.style.cssText = `
            background: white;
            border-radius: 30px;
            padding: 50px;
            box-shadow: 0 25px 70px rgba(0,0,0,0.3);
        `;
        
        // 상단 카드 복제 (버튼 제외)
        const cardClone = captureCard.cloneNode(true);
        cardClone.querySelectorAll('button, .flex.gap-3, .text-sm.text-gray-500.text-center.mt-4').forEach(el => el.remove());
        cardClone.style.cssText = 'background: transparent; box-shadow: none; padding: 0; margin-bottom: 40px; border-radius: 0;';
        
        // 구분선
        const divider = document.createElement('div');
        divider.style.cssText = `
            height: 2px;
            background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
            margin: 40px 0;
        `;
        
        // 4차원 차트 섹션
        const chartSection = document.createElement('div');
        chartSection.innerHTML = `
            <h2 style="font-size: 28px; font-weight: 800; color: #1f2937; margin: 0 0 30px 0; text-align: center;">📊 4차원 직무 점수</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;">
                <div style="text-align: center;">
                    <img src="${radarDataUrl}" style="max-width: 100%; height: auto;" />
                </div>
                <div id="scoreDetailsClone"></div>
            </div>
        `;
        chartSection.querySelector('#scoreDetailsClone').appendChild(scoreDetails);
        
        // 조립
        box.appendChild(cardClone);
        box.appendChild(divider);
        box.appendChild(chartSection);
        
        // 유명인 섹션 추가
        if (famousSection) {
            const famousClone = famousSection.cloneNode(true);
            famousClone.style.cssText = 'background: transparent; box-shadow: none; padding: 40px 0 0 0; margin: 0;';
            box.appendChild(famousClone);
        }
        
        temp.appendChild(box);
        document.body.appendChild(temp);
        
        // 렌더링 대기
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 캡처
        console.log('📸 캡처 중...');
        const canvas = await html2canvas(temp, {
            backgroundColor: null,
            scale: 2,
            width: 1100,
            windowWidth: 1100
        });
        
        document.body.removeChild(temp);
        
        // 다운로드
        canvas.toBlob((blob) => {
            const typeKey = testResult.resultType.primary;
            const dateText = new Date().toISOString().split('T')[0];
            const fileName = `알비_직무적성_${typeKey}_${dateText}.png`;
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
            
            console.log('✅ 다운로드 완료:', fileName);
            button.innerHTML = originalText;
            button.disabled = false;
        }, 'image/png');
        
    } catch (error) {
        console.error('❌ 오류:', error);
        alert('⚠️ 이미지 저장 실패');
    }
}
