# 專案簡介
本專案為一個多服務架構的系統，包含 Django 和 Flask 兩套後端服務，以及獨立的機器學習微服務（ml-service）。

# 目錄結構
```
/
├── frontend/ # React 前端
│ └── README.md
├── backend-django/ # Django 主系統（帳號、題庫、熟悉度）
│ └── README.md
├── ml-service/ # Flask 微服務（GPT 題目產生、模型處理）
│ └── README.md
├── docker-compose.yml # 整合啟動所有服務
├── .gitignore
├── README.md # 專案說明與分工紀錄
└── .code-workspace # VS Code 工作區（選擇性）
```

# ---------(陸續新增)-------

## 技術棧（暫定）

- Django 4.x
- Flask 2.x
- Python 3.8+
- FastAPI（可選，用於 ml-service）
- PostgreSQL / MySQL / SQLite（視需求）
- Redis（視需求）
- Docker（視部署方式）

---

## 待補內容

- 啟動流程
- API 介面說明
- 聯絡資訊
