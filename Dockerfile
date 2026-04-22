# syntax=docker/dockerfile:1

# ----------------------------
# 前端构建阶段：用 Node 打包出 dist
# ----------------------------
FROM node:20-alpine AS build
WORKDIR /app

# 先拷 package*.json 利用 docker 层缓存安装依赖
COPY package*.json ./
RUN npm install --registry=https://registry.npmmirror.com

# 再拷其余源码并打包
COPY . .
RUN npm run build

# ----------------------------
# 运行阶段：Nginx 托管静态文件并反向代理 /api
# ----------------------------
FROM nginx:alpine

# 把构建产物放到 nginx 静态目录
COPY --from=build /app/dist /usr/share/nginx/html

# 用自定义 nginx.conf 覆盖默认配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
