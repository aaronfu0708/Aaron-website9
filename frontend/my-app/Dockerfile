# 使用 Node.js 直接運行
FROM node:18-alpine

WORKDIR /app

# 複製 package 文件
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製源碼
COPY . .

# 暴露端口
EXPOSE 3000

# 啟動 Next.js 開發服務器
CMD ["npm", "run", "dev"]