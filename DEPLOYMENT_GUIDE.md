# 🚀 Quiz App 部署指南

## 🌐 快速部署到 Vercel (推薦)

### 方法 1: 使用 Vercel CLI (最簡單)

1. **安裝 Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **執行部署腳本**:
   ```bash
   chmod +x deploy-to-vercel.sh
   ./deploy-to-vercel.sh
   ```

3. **或者手動部署**:
   ```bash
   cd frontend/my-app
   vercel --prod
   ```

### 方法 2: 使用 Vercel 網頁界面

1. 訪問 [vercel.com](https://vercel.com)
2. 使用 GitHub 帳號登入
3. 點擊 "New Project"
4. 選擇您的 GitHub 專案
5. 點擊 "Deploy"

### 方法 3: 使用 GitHub Actions (自動部署)

1. 在 GitHub 專案中設置 Secrets:
   - `VERCEL_TOKEN`: 從 Vercel 獲取
   - `ORG_ID`: 從 Vercel 獲取
   - `PROJECT_ID`: 從 Vercel 獲取

2. 推送代碼到 main 分支即可自動部署

## 🔧 後端部署選項

### 選項 1: Vercel Serverless Functions
- 適合小型 API
- 免費額度充足
- 自動擴展

### 選項 2: Railway
- 支援 Python/Django
- 免費額度
- 簡單部署

### 選項 3: Heroku
- 支援多種語言
- 免費額度
- 穩定可靠

## 📱 部署後配置

1. **設置環境變數**:
   - API 端點
   - 資料庫連接
   - 第三方服務金鑰

2. **配置域名**:
   - 自定義域名
   - SSL 證書
   - CDN 配置

3. **監控和日誌**:
   - 性能監控
   - 錯誤追蹤
   - 用戶分析

## 🎯 推薦部署架構

```
前端 (Vercel) → API (Vercel/Railway) → 資料庫 (Supabase/PlanetScale)
```

## 💰 成本預估

- **Vercel**: 免費 (個人使用)
- **Railway**: 免費額度 $5/月
- **資料庫**: 免費額度充足
- **總計**: 基本免費，進階功能 $5-20/月

## 🚨 注意事項

1. 確保所有環境變數正確設置
2. 檢查 API 端點是否可訪問
3. 測試所有功能是否正常
4. 設置適當的 CORS 配置
5. 配置錯誤監控和日誌

## 📞 需要幫助？

如果遇到問題，可以：
1. 檢查 Vercel 部署日誌
2. 查看 GitHub Actions 狀態
3. 檢查環境變數配置
4. 聯繫技術支援