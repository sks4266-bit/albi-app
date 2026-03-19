/**
 * 알비 실시간 챗봇 위젯
 * 고객 지원 및 FAQ 자동 응답
 */

class AlbiChatbot {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.isTyping = false;
    
    this.init();
    this.loadWelcomeMessage();
  }

  // 초기화
  init() {
    // 챗봇 HTML 삽입
    const html = `
      <button class="chatbot-button" id="chatbot-toggle">
        <i class="fas fa-comments"></i>
        <span class="chatbot-badge" id="chatbot-badge" style="display: none;">1</span>
      </button>

      <div class="chatbot-window" id="chatbot-window">
        <div class="chatbot-header">
          <div class="chatbot-header-left">
            <div class="chatbot-avatar">🤖</div>
            <div class="chatbot-info">
              <h3>알비 AI</h3>
              <div class="chatbot-status">
                <span class="status-dot"></span>
                <span>온라인</span>
              </div>
            </div>
          </div>
          <button class="chatbot-close" id="chatbot-close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="chatbot-messages" id="chatbot-messages"></div>

        <div class="chatbot-input-area">
          <input 
            type="text" 
            class="chatbot-input" 
            id="chatbot-input" 
            placeholder="메시지를 입력하세요..."
          >
          <button class="chatbot-send-btn" id="chatbot-send">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;

    // body에 추가
    const container = document.createElement('div');
    container.id = 'albi-chatbot';
    container.innerHTML = html;
    document.body.appendChild(container);

    // 이벤트 리스너
    document.getElementById('chatbot-toggle').addEventListener('click', () => this.toggle());
    document.getElementById('chatbot-close').addEventListener('click', () => this.close());
    document.getElementById('chatbot-send').addEventListener('click', () => this.sendMessage());
    document.getElementById('chatbot-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  // 토글
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // 열기
  open() {
    this.isOpen = true;
    document.getElementById('chatbot-window').classList.add('show');
    document.getElementById('chatbot-toggle').classList.add('open');
    document.getElementById('chatbot-badge').style.display = 'none';
    document.getElementById('chatbot-input').focus();
  }

  // 닫기
  close() {
    this.isOpen = false;
    document.getElementById('chatbot-window').classList.remove('show');
    document.getElementById('chatbot-toggle').classList.remove('open');
  }

  // 환영 메시지
  loadWelcomeMessage() {
    setTimeout(() => {
      this.addBotMessage(
        '안녕하세요! 알비 AI입니다 👋<br>무엇을 도와드릴까요?',
        [
          '포인트는 어떻게 얻나요?',
          '체험 신청 방법',
          '기프티콘 교환',
          '고객센터 연결'
        ]
      );
      
      // 뱃지 표시
      document.getElementById('chatbot-badge').style.display = 'block';
    }, 2000);
  }

  // 사용자 메시지 전송
  sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    
    if (!message) return;

    // 사용자 메시지 추가
    this.addUserMessage(message);
    input.value = '';

    // 봇 응답 (타이핑 효과)
    this.showTyping();
    setTimeout(() => {
      this.hideTyping();
      this.handleBotResponse(message);
    }, 1500);
  }

  // 사용자 메시지 추가
  addUserMessage(text) {
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const html = `
      <div class="chatbot-message user">
        <div class="message-content">
          <div class="message-bubble">${this.escapeHtml(text)}</div>
          <div class="message-time">${time}</div>
        </div>
        <div class="message-avatar user">
          <i class="fas fa-user"></i>
        </div>
      </div>
    `;
    
    this.appendMessage(html);
  }

  // 봇 메시지 추가
  addBotMessage(text, quickReplies = []) {
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    
    let quickRepliesHtml = '';
    if (quickReplies.length > 0) {
      quickRepliesHtml = `
        <div class="quick-replies">
          ${quickReplies.map(reply => `
            <button class="quick-reply-btn" onclick="window.albiChatbot.handleQuickReply('${this.escapeHtml(reply)}')">${reply}</button>
          `).join('')}
        </div>
      `;
    }

    const html = `
      <div class="chatbot-message bot">
        <div class="message-avatar bot">🤖</div>
        <div class="message-content">
          <div class="message-bubble">${text}</div>
          <div class="message-time">${time}</div>
          ${quickRepliesHtml}
        </div>
      </div>
    `;
    
    this.appendMessage(html);
  }

  // 타이핑 표시
  showTyping() {
    this.isTyping = true;
    const html = `
      <div class="chatbot-message bot" id="typing-indicator">
        <div class="message-avatar bot">🤖</div>
        <div class="message-content">
          <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </div>
    `;
    this.appendMessage(html);
  }

  // 타이핑 숨김
  hideTyping() {
    this.isTyping = false;
    const typingEl = document.getElementById('typing-indicator');
    if (typingEl) typingEl.remove();
  }

  // 메시지 추가
  appendMessage(html) {
    const messagesEl = document.getElementById('chatbot-messages');
    messagesEl.insertAdjacentHTML('beforeend', html);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // 빠른 답변 처리
  handleQuickReply(text) {
    this.addUserMessage(text);
    this.showTyping();
    setTimeout(() => {
      this.hideTyping();
      this.handleBotResponse(text);
    }, 1000);
  }

  // 봇 응답 처리
  handleBotResponse(userMessage) {
    const message = userMessage.toLowerCase();

    // 키워드 기반 응답
    if (message.includes('포인트')) {
      this.addBotMessage(
        '알비포인트는 다음 방법으로 획득할 수 있습니다:<br><br>' +
        '✅ 회원가입: 50P<br>' +
        '✅ AI 면접 완료: 30P<br>' +
        '✅ 체험 완료: 최대 50P<br>' +
        '✅ 친구 추천: 20P<br><br>' +
        '포인트는 기프티콘으로 교환 가능합니다!',
        ['기프티콘 교환', '친구 추천 방법', '포인트 스토어']
      );
    } else if (message.includes('체험')) {
      this.addBotMessage(
        '1시간 시각체험 신청 방법:<br><br>' +
        '1️⃣ 원하는 공고 선택<br>' +
        '2️⃣ "1시간 체험 신청" 버튼 클릭 (10P 차감)<br>' +
        '3️⃣ 희망 날짜/시간 선택<br>' +
        '4️⃣ 구인자 승인 대기<br>' +
        '5️⃣ 체험 참여!<br><br>' +
        '체험 완료 시 최대 50P를 받을 수 있어요!',
        ['공고 찾기', '체험 취소 방법', '포인트 보상']
      );
    } else if (message.includes('기프티콘') || message.includes('교환')) {
      this.addBotMessage(
        '포인트 스토어에서 기프티콘 교환 가능!<br><br>' +
        '📱 스타벅스: 50P~100P<br>' +
        '🏪 GS25/CU: 100P<br>' +
        '🎬 CGV: 200P<br>' +
        '🍗 BBQ/도미노: 300P<br><br>' +
        '구매 즉시 이메일로 발송됩니다.',
        ['포인트 스토어 가기', '구매 내역', '포인트 적립']
      );
    } else if (message.includes('고객센터') || message.includes('문의')) {
      this.addBotMessage(
        '고객센터 연락처:<br><br>' +
        '📞 전화: 1588-9999 (평일 09:00-18:00)<br>' +
        '📧 이메일: support@albi.kr<br>' +
        '💬 카카오톡: @Albi<br><br>' +
        '24시간 이내 답변 드립니다!',
        ['고객센터 바로가기', '자주 묻는 질문']
      );
    } else if (message.includes('안녕') || message.includes('hello')) {
      this.addBotMessage(
        '안녕하세요! 😊<br>알비 AI가 도와드릴게요.<br>무엇이 궁금하신가요?',
        ['포인트 적립', '체험 신청', '기프티콘 교환', '고객센터']
      );
    } else {
      // 기본 응답
      this.addBotMessage(
        '죄송합니다, 이해하지 못했습니다 😅<br>' +
        '아래 버튼을 선택하시거나 고객센터로 문의해주세요!',
        ['포인트 적립', '체험 신청', '기프티콘 교환', '고객센터 연결']
      );
    }
  }

  // HTML 이스케이프
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 페이지 로드 시 챗봇 초기화
window.addEventListener('DOMContentLoaded', () => {
  window.albiChatbot = new AlbiChatbot();
  console.log('✅ 알비 챗봇 초기화 완료');
});
