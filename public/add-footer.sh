#!/bin/bash

# 푸터를 추가할 주요 페이지들
PAGES=(
  "signup.html"
  "login.html"
  "jobs.html"
  "job-detail.html"
  "chat.html"
  "my-experiences.html"
  "mypage.html"
  "store.html"
  "recommended-jobs.html"
  "about.html"
  "terms.html"
  "privacy.html"
)

for page in "${PAGES[@]}"; do
  if [ -f "$page" ]; then
    # 이미 footer-container가 있는지 확인
    if grep -q "footer-container" "$page"; then
      echo "✓ $page - 푸터 이미 있음"
    else
      # </body> 태그 바로 앞에 푸터 컨테이너 추가
      if grep -q "</body>" "$page"; then
        # footer.css와 footer.js 링크 확인 및 추가
        if ! grep -q "footer.css" "$page"; then
          sed -i 's|</head>|  <link href="/footer.css" rel="stylesheet">\n</head>|' "$page"
          echo "  → footer.css 추가됨"
        fi
        
        if ! grep -q "footer.js" "$page"; then
          sed -i 's|</body>|  <div id="footer-container"></div>\n  <script src="/footer.js"></script>\n</body>|' "$page"
          echo "  → footer-container와 footer.js 추가됨"
        else
          sed -i 's|</body>|  <div id="footer-container"></div>\n</body>|' "$page"
          echo "  → footer-container 추가됨"
        fi
        
        echo "✓ $page - 푸터 추가 완료"
      else
        echo "✗ $page - </body> 태그 없음"
      fi
    fi
  else
    echo "✗ $page - 파일 없음"
  fi
done

echo ""
echo "푸터 적용 완료!"
