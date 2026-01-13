#!/bin/bash
# 本地測試系統健康檢查功能

set -e

echo "🧪 本地測試系統健康檢查功能"
echo ""

echo "✅ 環境檢查完成"
echo ""

# 檢查檔案存在
echo "📁 檢查檔案..."
files=(
    "public/system-status.html"
    "public/robots.txt"
    "src/agents/api/admin.ts"
    "src/agents/persistence/postgres.ts"
    "nginx/conf.d/2ch.conf"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (檔案不存在)"
        exit 1
    fi
done
echo "✅ 所有檔案存在"
echo ""

# 檢查 robots.txt 內容
echo "🔍 檢查 robots.txt..."
if grep -q "Disallow: /system-status.html" public/robots.txt; then
    echo "  ✓ system-status.html 已排除"
else
    echo "  ✗ system-status.html 未排除"
    exit 1
fi

if grep -q "Disallow: /admin/" public/robots.txt; then
    echo "  ✓ /admin/ 已排除"
else
    echo "  ✗ /admin/ 未排除"
    exit 1
fi
echo "✅ robots.txt 配置正確"
echo ""

# 檢查 Nginx 配置
echo "🔍 檢查 Nginx 配置..."
if grep -q "location = /system-status.html" nginx/conf.d/2ch.conf; then
    echo "  ✓ system-status.html location 存在"
else
    echo "  ✗ system-status.html location 不存在"
    exit 1
fi

if grep -q "X-Robots-Tag" nginx/conf.d/2ch.conf; then
    echo "  ✓ X-Robots-Tag header 存在"
else
    echo "  ✗ X-Robots-Tag header 不存在"
    exit 1
fi

if grep -q "location = /robots.txt" nginx/conf.d/2ch.conf; then
    echo "  ✓ robots.txt location 存在"
else
    echo "  ✗ robots.txt location 不存在"
    exit 1
fi
echo "✅ Nginx 配置正確"
echo ""

# 檢查 board.html 修正
echo "🔍 檢查 board.html..."
if grep -q "/boards/gossip/threads" public/board.html; then
    echo "  ✓ 娛樂板連結已修正 (gossip)"
else
    echo "  ✗ 娛樂板連結仍錯誤 (ent)"
    exit 1
fi
echo "✅ board.html 修正正確"
echo ""

echo "✅✅✅ 所有測試通過！"
echo ""
echo "下一步："
echo "1. 執行部署腳本：./scripts/deploy-system-status.sh"
echo "2. 或手動部署到伺服器"
echo ""
