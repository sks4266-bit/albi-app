#!/bin/bash

# SVG를 복사하여 PNG 이름으로 저장 (브라우저가 SVG도 PNG로 인식 가능)
# 또는 단순히 manifest에서 해당 크기 제거

echo "📝 PWA 아이콘 옵션:"
echo ""
echo "Option 1: SVG만 사용 (권장)"
echo "  - icon.svg는 모든 크기를 커버할 수 있음"
echo "  - manifest.json에서 PNG 아이콘은 optional"
echo ""
echo "Option 2: 실제 PNG 생성"
echo "  - 브라우저에서 /icon-generator.html 접속"
echo "  - 144px, 192px, 512px PNG 생성 후 /static/ 폴더에 저장"
echo ""
echo "현재: SVG 아이콘만 사용 중 (✅ 정상 동작)"
echo "PNG 404는 경고일 뿐, 기능에 영향 없음"
