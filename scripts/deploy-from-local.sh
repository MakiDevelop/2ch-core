#!/bin/bash
# 從本地快速部署到生產環境

set -e

SERVER="root@104.131.15.130"
APP_DIR="/opt/2ch-core"
LOCAL_DIR="/Users/maki/GitHub/2ch-core"

echo "========================================="
echo "快速部署到 2ch.tw"
echo "========================================="
echo ""

echo "1. 同步代碼到伺服器..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  "${LOCAL_DIR}/" "${SERVER}:${APP_DIR}/"
echo "   ✓ 代碼同步完成"

echo ""
echo "2. 在伺服器上執行部署..."
ssh $SERVER "cd ${APP_DIR} && bash scripts/fix-cache.sh"

echo ""
echo "========================================="
echo "部署完成！"
echo "========================================="
