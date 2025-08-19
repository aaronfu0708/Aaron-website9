#!/bin/bash

echo "🚀 開始部署 aaron-website9 後端到 Railway..."

# 檢查是否在正確的目錄
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 錯誤：請在 aaron-website9 目錄中執行此腳本"
    exit 1
fi

# 檢查 Git 狀態
echo "檢查 Git 狀態..."
git status

# 添加所有更改
echo "添加所有更改到 Git..."
git add .

# 提交更改
echo " 提交更改..."
git commit -m "feat: 準備 Railway 部署，添加健康檢查端點"

# 推送到遠程倉庫
echo "推送到 GitHub..."
git push origin main

echo "代碼已推送到 GitHub！"
echo ""
echo "接下來請按照以下步驟在 Railway 上部署："
echo ""
echo "部署 Django 後端："
echo "1. 前往 https://railway.app"
echo "2. 使用 GitHub 帳號登入"
echo "3. 點擊 'New Project'"
echo "4. 選擇 'Deploy from GitHub repo'"
echo "5. 選擇您的 aaron-website9 倉庫"
echo "6. 設定 Root Directory 為 'backend-django'"
echo "7. 在 Variables 中添加環境變數（參考 backend-django/env.production.template）"
echo "8. 點擊 'Deploy Now'"
echo ""
echo "部署 ML 服務："
echo "1. 在 Railway 專案中點擊 'New Service'"
echo "2. 選擇 'GitHub Repo'"
echo "3. 選擇相同的 aaron-website9 倉庫"
echo "4. 設定 Root Directory 為 'ml-service'"
echo "5. 在 Variables 中添加環境變數（參考 ml-service/env.production.template）"
echo "6. 點擊 'Deploy Now'"
echo ""
echo "部署完成後，您的前端就可以連接到新的後端 API 和 ML 服務了！"
echo "詳細步驟請參考 RAILWAY_DEPLOYMENT.md 文件"
