#!/bin/bash

# Cloudflare Pages 배포를 위한 빌드 스크립트
# public/ 디렉토리를 dist/로 복사하고 functions/ 추가
# TypeScript 파일을 esbuild로 번들링

echo "🔨 Building for Cloudflare Pages deployment..."

# dist 디렉토리 초기화
echo "🗑️  Cleaning dist/ directory..."
rm -rf dist
mkdir -p dist/static

# TypeScript 번들링 (src/payment.ts → dist/static/payment.js)
echo "📦 Bundling TypeScript files..."
npx esbuild src/payment.ts --bundle --outfile=dist/static/payment.js --format=esm --minify

# public 디렉토리 전체를 dist로 복사
echo "📦 Copying public/ to dist/..."
cp -r public/* dist/

# functions 디렉토리를 dist 안으로 복사
echo "📦 Copying functions/ to dist/functions/..."
cp -r functions dist/

echo "✅ Build complete! Ready to deploy dist/ directory"
echo "📁 Structure:"
echo "   dist/"
echo "   ├── payment.html"
echo "   ├── static/"
echo "   │   └── payment.js (bundled)"
echo "   └── functions/"
echo "       └── api/"
