#!/bin/bash
# 部署系統健康檢查頁面
# 包含：API endpoint、HTML 頁面、robots.txt、Nginx 配置

set -e

REMOTE_USER="maki"
REMOTE_HOST="107.191.62.114"
REMOTE_DIR="/opt/2ch-core"
COMPOSE_FILE="docker-compose.deploy.yml"

echo "🚀 開始部署系統健康檢查頁面..."
echo ""

# Step 1: 複製檔案到伺服器
echo "📦 Step 1: 上傳檔案到伺服器..."
scp public/system-status.html ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/public/
scp public/robots.txt ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/public/
scp public/board.html ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/public/
scp nginx/conf.d/2ch.conf ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/nginx/conf.d/
scp nginx/conf.d/2ch-ssl.conf.template ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/nginx/conf.d/
scp -r src ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

echo "✅ 檔案上傳完成"
echo ""

# Step 2: 重新建構並重啟服務
echo "🔧 Step 2: 重新建構並重啟服務..."
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd /opt/2ch-core

# 重新建構 API 服務
echo "Building API service..."
docker compose -f docker-compose.deploy.yml build api

# 重啟服務
echo "Restarting services..."
docker compose -f docker-compose.deploy.yml restart api

# 複製靜態檔案到 nginx 容器
echo "Copying static files to nginx..."
docker compose -f docker-compose.deploy.yml cp public/system-status.html nginx:/var/www/html/
docker compose -f docker-compose.deploy.yml cp public/robots.txt nginx:/var/www/html/
docker compose -f docker-compose.deploy.yml cp public/board.html nginx:/var/www/html/

# 複製 nginx 配置並重新載入
echo "Updating nginx configuration..."
docker compose -f docker-compose.deploy.yml cp nginx/conf.d/2ch.conf nginx:/etc/nginx/conf.d/

# 測試 nginx 配置
echo "Testing nginx configuration..."
docker compose -f docker-compose.deploy.yml exec nginx nginx -t

# 重新載入 nginx
echo "Reloading nginx..."
docker compose -f docker-compose.deploy.yml exec nginx nginx -s reload

echo "✅ 服務重啟完成"
ENDSSH

echo ""
echo "✅ 部署完成！"
echo ""
echo "驗證步驟："
echo "1. 訪問系統狀態頁：https://2ch.tw/system-status.html"
echo "2. 檢查 robots.txt：https://2ch.tw/robots.txt"
echo "3. 測試 API endpoint：curl -X GET https://2ch.tw/admin/system-status"
echo "4. 檢查娛樂板修正：https://2ch.tw/boards/chat/threads -> 點擊「娛樂／名人／八卦」"
echo ""
