#!/bin/bash

echo "🚀 開始部署 Quiz App 系統..."

# 檢查 Docker 是否安裝
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安裝，請先安裝 Docker"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安裝，請先安裝 Docker"
    exit 1
fi

# 檢查 Docker Compose 是否可用
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安裝，請先安裝 Docker Compose"
    exit 1
fi

# 創建必要的目錄
echo "📁 創建必要的目錄..."
mkdir -p ssl
mkdir -p logs

# 停止現有服務
echo "🛑 停止現有服務..."
docker compose down

# 清理舊的構建
echo "🧹 清理舊的構建..."
docker compose build --no-cache

# 啟動服務
echo "🚀 啟動服務..."
docker compose up -d

# 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 30

# 檢查服務狀態
echo "🔍 檢查服務狀態..."
docker compose ps

# 檢查健康狀態
echo "🏥 檢查服務健康狀態..."
curl -f http://localhost/health || echo "❌ 主服務健康檢查失敗"
curl -f http://localhost:8000/health || echo "❌ Django 服務健康檢查失敗"
curl -f http://localhost:5000/health || echo "❌ ML 服務健康檢查失敗"
curl -f http://localhost:3000/health || echo "❌ 前端服務健康檢查失敗"

echo "✅ 部署完成！"
echo ""
echo "🌐 服務訪問地址："
echo "   前端應用: http://localhost"
echo "   Django API: http://localhost:8000"
echo "   ML 服務: http://localhost:5000"
echo ""
echo "📊 查看日誌："
echo "   docker-compose logs -f"
echo ""
echo "🛑 停止服務："
echo "   docker-compose down"