FROM python:3.11-slim

# 設置工作目錄
WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 複製依賴文件
COPY pyproject.toml uv.lock ./

# 安裝 uv 和 Python 依賴
RUN pip install uv && \
    uv pip install --system gunicorn redis

# 複製專案文件
COPY . .

# 安裝專案依賴
RUN uv pip install --system -e .

# 設置環境變數
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

# 暴露端口
EXPOSE 5000

# 啟動命令
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "main:app"]