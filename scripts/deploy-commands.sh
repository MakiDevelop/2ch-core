#!/bin/bash
# 在伺服器上直接執行的部署指令
# 請登入伺服器後執行此腳本

set -e

echo "🚀 開始部署系統健康檢查頁面..."
echo ""

cd /opt/2ch-core

# Step 1: 拉取最新代碼 (如果使用 git)
echo "📦 Step 1: 拉取最新代碼..."
if [ -d ".git" ]; then
    git pull origin main
    echo "✅ 代碼更新完成"
else
    echo "⚠️  非 git 倉庫，請手動上傳檔案"
    echo "需要上傳的檔案："
    echo "  - public/system-status.html"
    echo "  - public/robots.txt"
    echo "  - public/board.html"
    echo "  - nginx/conf.d/2ch.conf"
    echo "  - nginx/conf.d/2ch-ssl.conf.template"
    echo "  - src/agents/api/admin.ts"
    echo "  - src/agents/api/index.ts"
    echo "  - src/agents/persistence/postgres.ts"
    echo "  - src/main.ts"
    echo ""
    read -p "檔案已手動上傳？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# Step 2: 重新建構 API 服務
echo "🔧 Step 2: 重新建構 API 服務..."
docker compose -f docker-compose.deploy.yml build api
echo "✅ API 服務建構完成"
echo ""

# Step 3: 重啟 API 服務
echo "🔄 Step 3: 重啟 API 服務..."
docker compose -f docker-compose.deploy.yml restart api
sleep 3
echo "✅ API 服務重啟完成"
echo ""

# Step 4: 複製靜態檔案到 nginx
echo "📋 Step 4: 複製靜態檔案到 nginx..."
docker compose -f docker-compose.deploy.yml cp public/system-status.html nginx:/var/www/html/
docker compose -f docker-compose.deploy.yml cp public/robots.txt nginx:/var/www/html/
docker compose -f docker-compose.deploy.yml cp public/board.html nginx:/var/www/html/
echo "✅ 靜態檔案複製完成"
echo ""

# Step 5: 更新 Nginx 配置
echo "⚙️  Step 5: 更新 Nginx 配置..."
docker compose -f docker-compose.deploy.yml cp nginx/conf.d/2ch.conf nginx:/etc/nginx/conf.d/
echo "✅ Nginx 配置更新完成"
echo ""

# Step 6: 測試 Nginx 配置
echo "🧪 Step 6: 測試 Nginx 配置..."
if docker compose -f docker-compose.deploy.yml exec nginx nginx -t; then
    echo "✅ Nginx 配置測試通過"
else
    echo "❌ Nginx 配置測試失敗"
    exit 1
fi
echo ""

# Step 7: 重新載入 Nginx
echo "🔄 Step 7: 重新載入 Nginx..."
docker compose -f docker-compose.deploy.yml exec nginx nginx -s reload
echo "✅ Nginx 重新載入完成"
echo ""

# Step 8: 檢查服務狀態
echo "📊 Step 8: 檢查服務狀態..."
docker compose -f docker-compose.deploy.yml ps
echo ""

echo "✅✅✅ 部署完成！"
echo ""
echo "驗證步驟："
echo "1. 訪問系統狀態頁：https://2ch.tw/system-status.html"
echo "2. 檢查 robots.txt：https://2ch.tw/robots.txt"
echo "3. 測試 API endpoint："
echo "   curl -X GET https://2ch.tw/admin/system-status"
echo "4. 檢查娛樂板修正：https://2ch.tw/boards/chat/threads"
echo "   -> 點擊「娛樂／名人／八卦」應該正常載入"
echo ""
