# 2ch-core Dockerfile - Multi-stage build
# 用于生产环境的优化镜像构建

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package files
COPY package*.json ./

# 安装依赖（包括 devDependencies 用于构建）
RUN npm ci

# 复制源代码
COPY src ./src
COPY tsconfig.json ./

# 复制静态文件
COPY public ./public

# 如果使用 TypeScript 编译
# RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

# 安装 wget 用于健康检查
RUN apk add --no-cache wget

WORKDIR /app

# 复制 package files
COPY package*.json ./

# 安装生产依赖 + tsx (用于运行 TypeScript)
RUN npm ci --only=production && \
    npm install tsx && \
    npm cache clean --force

# 从 builder 复制源代码（如果不使用编译，直接复制 src）
COPY --from=builder /app/src ./src

# 复制数据库迁移文件
COPY db ./db

# 复制静态文件
COPY public ./public

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动应用
CMD ["npm", "start"]
