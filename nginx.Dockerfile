FROM nginx:alpine

# 複製 Nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 創建 SSL 目錄
RUN mkdir -p /etc/nginx/ssl

# 暴露端口
EXPOSE 80 443

# 啟動 Nginx
CMD ["nginx", "-g", "daemon off;"]