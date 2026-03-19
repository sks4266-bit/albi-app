#!/bin/bash
echo "🔍 새 배포 테스트: https://5be701e6.albi-app.pages.dev"

# 기존에 로그인된 토큰이 있다고 가정하고, 북마크 목록만 테스트
# (실제로는 브라우저에서 로그인 후 토큰을 받아야 합니다)

echo -e "\n테스트 방법:"
echo "1. 브라우저에서 https://5be701e6.albi-app.pages.dev/login.html 로그인"
echo "2. 개발자 도구 콘솔에서 다음 실행:"
echo ""
echo "const token = localStorage.getItem('albi_session_token');"
echo "fetch('/api/bookmarks/list', { headers: { 'Authorization': \`Bearer \${token}\` } })"
echo "  .then(r => r.json())"
echo "  .then(data => console.log('✅ 결과:', data))"
echo "  .catch(err => console.error('❌ 에러:', err));"
echo ""
echo "3. 결과를 확인해주세요!"

