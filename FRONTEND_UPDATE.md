# 前端配置更新指南

## 部署後端後需要更新的配置

### 1. 更新 API 端點配置

在您的前端代碼中，找到 API 配置文件（通常是 `src/lib/api.ts` 或類似文件），將後端 URL 更新為 Railway 提供的域名：

```typescript
// 更新前
const API_BASE_URL = 'http://localhost:8000';
const ML_SERVICE_URL = 'http://localhost:5000';

// 更新後
const API_BASE_URL = 'https://your-django-backend.railway.app';
const ML_SERVICE_URL = 'https://your-ml-service.railway.app';
```

### 2. 更新環境變數

在 Vercel 的環境變數設定中，更新以下變數：

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.railway.app
NEXT_PUBLIC_API_ORIGIN=https://your-backend-domain.railway.app
```

### 3. 檢查 CORS 設定

確保後端的 CORS 設定允許您的前端域名：

```python
# 在 Django 設定中
NEXT_PUBLIC_ORIGIN=https://aaron-website9.vercel.app
```

### 4. 測試連接

更新配置後，測試以下端點是否正常：

**Django 後端：**
- 健康檢查：`https://your-django-backend.railway.app/health/`
- API 文檔：`https://your-django-backend.railway.app/swagger/`
- 登入端點：`https://your-django-backend.railway.app/api/token/`

**ML 服務：**
- 健康檢查：`https://your-ml-service.railway.app/health`
- 題目生成：`https://your-ml-service.railway.app/generate_questions`

### 5. 重新部署前端

配置更新後，重新部署您的前端到 Vercel：

```bash
# 如果使用 Vercel CLI
vercel --prod

# 或者直接推送到 GitHub，Vercel 會自動部署
git add .
git commit -m "feat: 更新後端 API 端點為 Railway 域名"
git push origin main
```

## 注意事項

- 確保所有 API 調用都使用新的後端域名
- 檢查瀏覽器控制台是否有 CORS 錯誤
- 測試所有主要功能（登入、註冊、題目獲取等）
- 如果遇到問題，檢查 Railway 的日誌輸出
