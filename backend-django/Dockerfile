FROM python:3.12-slim

# 設置工作目錄
WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    pkg-config \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# 複製依賴文件
COPY pyproject.toml uv.lock ./

# 安裝 uv 和 Python 依賴
RUN pip install uv && \
    uv pip install --system gunicorn psycopg2-binary redis

# 複製專案文件
COPY . .

# 安裝專案依賴
RUN uv pip install --system -e .

# 創建必要的目錄
RUN mkdir -p /app/staticfiles /app/media

# 設置環境變數
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# 暴露端口
EXPOSE 8000

# 啟動命令 - 使用 Django 開發服務器
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]