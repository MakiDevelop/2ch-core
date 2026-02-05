#!/bin/bash
# =============================================================================
# Install Content Seeding Cron Jobs on VPS (n1k.tw)
# - /add-threads: 每 8 小時 (00:00, 08:00, 16:00 UTC)
# - /add-replies: 每小時 :30
# =============================================================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 確保腳本有執行權限
chmod +x "$SCRIPT_DIR/cron-add-threads.sh"
chmod +x "$SCRIPT_DIR/cron-add-replies.sh"

CRON_THREADS="0 16,0,8 * * * $SCRIPT_DIR/cron-add-threads.sh"
CRON_REPLIES="30 * * * * $SCRIPT_DIR/cron-add-replies.sh"

CURRENT_CRON=$(crontab -l 2>/dev/null || echo "")

add_cron() {
  local pattern="$1"
  local entry="$2"
  local label="$3"

  if echo "$CURRENT_CRON" | grep -q "$pattern"; then
    log_warn "$label 已存在，跳過"
  else
    CURRENT_CRON="$CURRENT_CRON
$entry"
    log_info "新增 $label"
  fi
}

add_cron "cron-add-threads.sh" "$CRON_THREADS" "/add-threads (每 8 小時)"
add_cron "cron-add-replies.sh" "$CRON_REPLIES" "/add-replies (每小時)"

echo "$CURRENT_CRON" | crontab -
log_info "Crontab 已更新"

echo ""
log_info "目前的 crontab:"
crontab -l

echo ""
log_info "=== 排程說明 ==="
log_info "add-threads: 每 8 小時 (UTC 0,8,16 = UTC+8 8,16,0)"
log_info "add-replies: 每小時 :30 (含隨機延遲 0-15 分鐘)"
log_info "Log 目錄: \$HOME/.claude/logs/2ch-cron/"
