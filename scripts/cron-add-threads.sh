#!/bin/bash
# =============================================================================
# [VPS Primary] Cron: /add-threads（樹洞模式 v1.0）
# 每 12 小時新增 1 個討論串
# 排程：0 4,16 * * * (UTC) = 12:00, 00:00 UTC+8（中午＋深夜）
# 部署位置：n1k.tw (167.179.69.8)
# =============================================================================
set -euo pipefail

# 禁止 root 執行（root 會破壞 lock file 權限，導致 cronbot 後續全部失敗）
if [ "${EUID:-$(id -u)}" -eq 0 ]; then
  echo "ERROR: 此腳本不可用 root 執行，請用 cronbot 用戶" >&2
  exit 1
fi

LOCK_FILE="/tmp/2ch-cron-add-threads.lock"
LOG_DIR="$HOME/.claude/logs/2ch-cron"
LOG_FILE="$LOG_DIR/add-threads-$(date +%Y%m%d-%H%M%S).log"
PROJECT_DIR="/opt/2ch-core"
DB_HOST="139.180.199.219"

mkdir -p "$LOG_DIR"

# 自我修復：若 lock file 被其他用戶建立（如 root），刪除後重建
if [ -e "$LOCK_FILE" ] && [ ! -O "$LOCK_FILE" ]; then
  echo "$(date): WARN: 清除非本用戶的 stale lock (owned by $(stat -c %U "$LOCK_FILE" 2>/dev/null || stat -f %Su "$LOCK_FILE" 2>/dev/null))" >> "$LOG_DIR/skipped.log"
  rm -f "$LOCK_FILE"
fi

# 防止重複執行
exec 200>"$LOCK_FILE" || { echo "$(date): ERROR: 無法開啟 lock file $LOCK_FILE" >&2; exit 1; }
if ! flock -n 200; then
  echo "$(date): add-threads already running, skipping" >> "$LOG_DIR/skipped.log"
  exit 0
fi

# 自動清理 stale lock
trap 'flock -u 200' EXIT

echo "$(date): Starting /add-threads cron job (treehole mode)" >> "$LOG_FILE"

# 清理 30 天以前的 log
find "$LOG_DIR" -name "add-threads-*.log" -mtime +30 -delete 2>/dev/null || true

claude -p \
  --model sonnet \
  --dangerously-skip-permissions \
  --max-budget-usd 5.00 \
  --add-dir "$PROJECT_DIR" \
  -- \
  "你現在在 $PROJECT_DIR 工作目錄。請執行 /add-threads skill。

模式：樹洞模式 v1.0
日期：$(date +%Y-%m-%d)
時間：$(TZ=Asia/Taipei date +%H:%M)

具體要求：
1. 先 SSH 到 $DB_HOST 查詢各活躍版塊目前的討論串數量
2. 只產 1 個討論串（不多不少）
3. 隨機決定主題類型（50% 深夜壓力、30% 迷惘求助、15% 工作學業焦慮、5% 輕微摩擦）
4. 不附帶回覆（讓 add-replies 自然補位）
5. 內容 150-300 字，第一人稱，有猶豫、有留白
6. 建立 seed script 後部署到 production
7. 驗證

禁止：列點、總結、太流暢、太專業、太理性收尾、挑釁
目標版塊：chat 或 tech（隨機選一個）" \
  >> "$LOG_FILE" 2>&1

EXIT_CODE=$?
echo "$(date): Finished with exit code $EXIT_CODE" >> "$LOG_FILE"
