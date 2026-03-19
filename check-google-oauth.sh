#!/bin/bash

# Google OAuth Redirect URI 설정 자동 확인 스크립트
# 이 스크립트는 현재 설정을 확인하고 테스트합니다.

echo "🔍 Google OAuth 설정 확인 스크립트"
echo "======================================"
echo ""

# 1. Client ID 확인
echo "📋 Client ID:"
echo "851913480828-jmjakc448nekunr07hsi60if6gp9q49j.apps.googleusercontent.com"
echo ""

# 2. 필요한 Redirect URI 목록
echo "✅ 필요한 Redirect URI 목록:"
echo ""
echo "1. 프로덕션 (필수):"
echo "   https://albi.kr/api/auth/google/callback"
echo ""
echo "2. Cloudflare Pages (권장):"
echo "   https://albi-app.pages.dev/api/auth/google/callback"
echo ""
echo "3. 로컬 개발 (선택):"
echo "   http://localhost:3000/api/auth/google/callback"
echo ""

# 3. OAuth 엔드포인트 테스트
echo "🧪 OAuth 엔드포인트 테스트:"
echo ""

echo "테스트 1: /api/auth/google 엔드포인트 확인..."
response=$(curl -s -I -L https://albi.kr/api/auth/google 2>&1)
if echo "$response" | grep -q "accounts.google.com"; then
    echo "✅ OAuth 리디렉션 정상 작동 (Google 인증 페이지로 이동)"
else
    echo "⚠️  OAuth 엔드포인트 응답 확인 필요"
fi
echo ""

# 4. 설정 URL 제공
echo "⚙️  Google Cloud Console 설정 URL:"
echo "https://console.cloud.google.com/apis/credentials"
echo ""

# 5. 설정 체크리스트
echo "📝 설정 체크리스트:"
echo ""
echo "[ ] 1. Google Cloud Console 접속"
echo "[ ] 2. Client ID 851913480828-... 찾기"
echo "[ ] 3. '승인된 리디렉션 URI' 편집"
echo "[ ] 4. https://albi.kr/api/auth/google/callback 추가"
echo "[ ] 5. 저장"
echo "[ ] 6. 5분 대기"
echo "[ ] 7. https://albi.kr/login.html에서 테스트"
echo ""

# 6. 테스트 URL
echo "🔗 테스트 URL:"
echo "https://albi.kr/login.html"
echo ""

# 7. 예상 결과
echo "✨ 예상 결과:"
echo "1. 'Google로 로그인' 버튼 클릭"
echo "2. Google 계정 선택 화면 표시"
echo "3. 권한 승인 화면 표시"
echo "4. /auth-callback.html로 자동 리디렉션"
echo "5. 로그인 완료 및 대시보드/채팅 페이지 이동"
echo ""

echo "======================================"
echo "🚀 설정 완료 후 브라우저에서 테스트하세요!"
echo "======================================"
