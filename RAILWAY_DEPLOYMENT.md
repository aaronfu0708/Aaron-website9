# Railway 後端部署指南

## 部署 Django 後端

### 步驟 1：註冊 Railway 帳號
1. 前往 [Railway.app](https://railway.app)
2. 使用 GitHub 帳號登入
3. 點擊 "New Project"

### 步驟 2：連接 GitHub 倉庫
1. 選擇 "Deploy from GitHub repo"
2. 選擇您的 `aaron-website9` 倉庫
3. 選擇 `main` 分支

### 步驟 3：配置 Django 部署設定
1. **Service Name**: `aaron-website9-backend`
2. **Root Directory**: `backend-django`
3. **Build Command**: 留空（使用 Dockerfile）
4. **Start Command**: 留空（使用 Dockerfile）

### 步驟 4：設定 Django 環境變數
在 Railway 的 Variables 標籤頁中，添加以下環境變數：

```bash
# Django 設定
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=aaron-website9.vercel.app,localhost,127.0.0.1

# 資料庫設定
DB_ENGINE=django.db.backends.mysql
DB_NAME=noteQ
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=your-db-host
DB_PORT=3306
DATABASE_URL=mysql://your-db-user:your-db-password@your-db-host:3306/noteQ

# 郵件設定
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# CORS 設定
NEXT_PUBLIC_ORIGIN=https://aaron-website9.vercel.app
NEXT_PUBLIC_API_ORIGIN=https://your-backend-domain.railway.app

# 綠界金流設定
MERCHANT_ID=your-merchant-id
HASH_KEY=your-hash-key
HASH_IV=your-hash-iv

# OpenAI 設定
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_PROJECT_ID=your-openai-project-id-here
```

## 步驟 5：部署
1. 點擊 "Deploy Now"
2. 等待構建完成
3. 記錄生成的域名（例如：`https://aaron-website9-backend-production.up.railway.app`）

## 步驟 6：更新前端配置
部署完成後，更新您前端的 API 端點配置，將後端 URL 改為 Railway 提供的域名。

### 步驟 5：部署 Django
1. 點擊 "Deploy Now"
2. 等待構建完成
3. 記錄生成的域名（例如：`https://aaron-website9-backend-production.up.railway.app`）

### 步驟 6：測試 Django API
訪問 `https://your-django-domain.railway.app/health/` 確認後端正常運行。

---

## 部署 ML 服務

### 步驟 1：在 Railway 中創建新服務
1. 在您的 Railway 專案中點擊 "New Service"
2. 選擇 "GitHub Repo"
3. 選擇相同的 `aaron-website9` 倉庫

### 步驟 2：配置 ML 服務部署設定
1. **Service Name**: `aaron-website9-ml`
2. **Root Directory**: `ml-service`
3. **Build Command**: 留空（使用 Dockerfile）
4. **Start Command**: 留空（使用 Dockerfile）

### 步驟 3：設定 ML 服務環境變數
在 Railway 的 Variables 標籤頁中，添加以下環境變數：

```bash
# OpenAI 設定
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_PROJECT_ID=your-openai-project-id-here

# Django 後端 API 端點（使用上面部署的 Django 域名）
DJANGO_BASE_URL=https://your-django-domain.railway.app

# Flask 服務設定
FLASK_ENV=production
FLASK_DEBUG=0

# CORS 設定
CORS_ORIGINS=https://aaron-website9.vercel.app
```

### 步驟 4：部署 ML 服務
1. 點擊 "Deploy Now"
2. 等待構建完成
3. 記錄生成的域名（例如：`https://aaron-website9-ml-production.up.railway.app`）

### 步驟 5：測試 ML 服務
訪問 `https://your-ml-domain.railway.app/health` 確認 ML 服務正常運行。

---

## 步驟 7：更新前端配置
部署完成後，更新您前端的 API 端點配置，將後端 URL 改為 Railway 提供的域名。

## 注意事項
- 確保您的 MySQL 資料庫 `fs101.coded2.fun` 允許外部連接
- 如果遇到 CORS 問題，檢查 `NEXT_PUBLIC_ORIGIN` 設定
- 生產環境中 `DJANGO_DEBUG` 應設為 `0`
- ML 服務需要 OpenAI API Key 才能正常生成題目
- 確保 Django 後端和 ML 服務的域名配置正確
