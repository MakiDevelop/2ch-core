#!/bin/bash
# 快取問題修復 - 快速部署腳本

set -e

echo "========================================="
echo "2ch.tw 快取問題修復 - 部署腳本"
echo "========================================="
echo ""

# 檢查是否在正確的目錄
if [ ! -f "docker-compose.deploy.yml" ]; then
    echo "錯誤: 請在 /opt/2ch-core 目錄下執行此腳本"
    exit 1
fi

echo "1. 備份當前 Nginx 配置..."
if [ -f "nginx/conf.d/2ch.conf" ]; then
    cp nginx/conf.d/2ch.conf nginx/conf.d/2ch.conf.backup.$(date +%Y%m%d_%H%M%S)
    echo "   ✓ 已備份到 nginx/conf.d/2ch.conf.backup.$(date +%Y%m%d_%H%M%S)"
fi

echo ""
echo "2. 更新 Nginx 配置..."
cp nginx/conf.d/2ch-ssl.conf.template nginx/conf.d/2ch.conf
echo "   ✓ 已更新 Nginx 配置"

echo ""
echo "3. 測試 Nginx 配置..."
if docker compose -f docker-compose.deploy.yml exec nginx nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✓ Nginx 配置測試通過"
else
    echo "   ✗ Nginx 配置測試失敗"
    echo "   正在恢復備份..."
    if [ -f "nginx/conf.d/2ch.conf.backup.$(date +%Y%m%d_%H%M%S)" ]; then
        cp nginx/conf.d/2ch.conf.backup.$(date +%Y%m%d_%H%M%S) nginx/conf.d/2ch.conf
    fi
    exit 1
fi

echo ""
echo "4. 重建 API 容器..."
docker compose -f docker-compose.deploy.yml build api

echo ""
echo "5. 重啟服務..."
docker compose -f docker-compose.deploy.yml up -d

echo ""
echo "6. 等待服務啟動..."
sleep 10

echo ""
echo "7. 檢查服務狀態..."
docker compose -f docker-compose.deploy.yml ps

echo ""
echo "========================================="
echo "部署完成！"
echo "========================================="
echo ""
echo "請執行以下命令驗證修復:"
echo ""
echo "# 驗證 API headers"
echo "curl -I https://2ch.tw/boards/chat/threads | grep -i cache"
echo ""
echo "# 驗證 HTML headers"
echo "curl -I https://2ch.tw/board.html | grep -i cache"
echo ""
echo "# 查看最近日誌"
echo "docker compose -f docker-compose.deploy.yml logs api --tail=50"
echo ""
