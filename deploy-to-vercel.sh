#!/bin/bash

echo "🚀 開始部署 Quiz App 到 Vercel..."

# 檢查是否安裝了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安裝 Vercel CLI..."
    npm install -g vercel
fi

# 進入前端目錄
cd frontend/my-app

echo "🔧 安裝依賴..."
npm install

echo "🏗️ 構建專案..."
npm run build

echo "🚀 部署到 Vercel..."
vercel --prod --yes

echo "✅ 部署完成！"
echo "🌐 您的網站已經上線！"
echo "📱 請檢查終端輸出中的網址"