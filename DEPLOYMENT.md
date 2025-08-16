# 🚀 Quiz App 部署指南

## 📋 系統需求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB RAM
- 至少 10GB 磁碟空間

## 🛠️ 快速部署

### 1. 克隆專案
```bash
git clone <your-repo-url>
cd quiz-app
```

### 2. 設置環境變數
```bash
cp .env.example .env
# 編輯 .env 文件，設置您的配置
```

### 3. 執行部署腳本
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔧 手動部署步驟

### 1. 構建並啟動服務
```bash
# 構建所有服務
docker-compose build

# 啟動服務
docker-compose up -d

# 查看服務狀態
docker-compose ps
```

### 2. 檢查服務健康狀態
```bash
# 主服務
curl http://localhost/health

# Django API
curl http://localhost:8000/health

# ML 服務
curl http://localhost:5000/health

# 前端
curl http://localhost:3000/health
```

## 🌐 服務訪問地址

- **前端應用**: http://localhost
- **Django API**: http://localhost:8000
- **ML 服務**: http://localhost:5000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 📊 監控和管理

### 查看日誌
```bash
# 查看所有服務日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs -f django
docker-compose logs -f ml-service
docker-compose logs -f frontend
```

### 服務管理
```bash
# 停止服務
docker-compose down

# 重啟服務
docker-compose restart

# 更新服務
docker-compose pull
docker-compose up -d
```

## 🔒 安全配置

### 1. 修改預設密碼
編輯 `.env` 文件，更改以下密碼：
- `POSTGRES_PASSWORD`
- `SECRET_KEY`

### 2. 啟用 HTTPS
1. 將 SSL 證書放入 `ssl/` 目錄
2. 修改 `nginx.conf` 配置
3. 重啟 Nginx 服務

### 3. 防火牆設置
```bash
# 只開放必要端口
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 🚨 故障排除

### 常見問題

1. **服務無法啟動**
   ```bash
   docker-compose logs <service-name>
   ```

2. **資料庫連接失敗**
   - 檢查 PostgreSQL 服務狀態
   - 驗證資料庫憑證

3. **前端無法訪問**
   - 檢查 Nginx 配置
   - 驗證前端服務狀態

### 重置系統
```bash
# 完全重置（會刪除所有資料）
docker-compose down -v
docker system prune -a
./deploy.sh
```

## 📈 性能優化

### 1. 調整 Worker 數量
根據伺服器配置調整 `docker-compose.yml` 中的 worker 數量

### 2. 啟用 Redis 快取
確保 Django 和 ML 服務正確配置 Redis

### 3. 靜態文件優化
- 啟用 Gzip 壓縮
- 設置適當的快取策略

## 🔄 更新部署

### 1. 拉取最新代碼
```bash
git pull origin main
```

### 2. 重新構建並部署
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📞 支援

如遇到問題，請檢查：
1. Docker 和 Docker Compose 版本
2. 系統資源使用情況
3. 服務日誌
4. 網路連接狀態

---

**注意**: 首次部署可能需要較長時間來下載 Docker 映像和構建服務。