#!/bin/bash

# 간단한 SVG 아이콘 생성 (144px, 192px, 512px)
mkdir -p public/static

cat > public/static/icon.svg << 'SVGEOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#8B5CF6"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="280" font-weight="bold" text-anchor="middle" fill="white">A</text>
</svg>
SVGEOF

echo "✅ SVG 아이콘 생성 완료"

# HTML 아이콘 제너레이터 페이지도 static 폴더에 복사
cp icon-generator.html public/static/

echo "✅ 아이콘 제너레이터 복사 완료"
echo ""
echo "📝 수동 작업 필요:"
echo "1. /icon-generator.html 또는 /static/icon-generator.html 접속"
echo "2. '아이콘 생성' 버튼 클릭하여 144px, 192px, 512px PNG 생성"
echo "3. 또는 icon.svg를 사용하여 브라우저에서 수동 생성"
