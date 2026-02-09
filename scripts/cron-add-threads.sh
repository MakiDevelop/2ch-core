#!/bin/bash
# =============================================================================
# [VPS Primary] Cron: /add-threads
# 每 8 小時檢查並新增討論串
# 排程：0 16,0,8 * * * (UTC) = 00:00, 08:00, 16:00 UTC+8
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

echo "$(date): Starting /add-threads cron job" >> "$LOG_FILE"

# 清理 30 天以前的 log
find "$LOG_DIR" -name "add-threads-*.log" -mtime +30 -delete 2>/dev/null || true

claude -p \
  --model sonnet \
  --dangerously-skip-permissions \
  --max-budget-usd 10.00 \
  --add-dir "$PROJECT_DIR" \
  -- \
  "你現在在 $PROJECT_DIR 工作目錄。請執行 /add-threads skill。

具體要求：
1. 先 SSH 到 $DB_HOST 查詢各版目前的討論串數量
2. 用 WebSearch 搜尋今天（$(date +%Y-%m-%d)）的台灣及國際時事
3. 為以下每個版塊各建立至少 3 個新討論串：chat, news, tech, work, acg, life, gossip
   - love 和 money 版各至少 2 個
   - meta 版跳過
4. 每個討論串配 4-8 則回覆
5. 建立 seed script 後部署到 production
6. 部署完成後驗證數量變化

注意：
- 標題和內容要基於真實搜尋到的新聞，不可捏造
- 語氣像台灣年輕人在匿名論壇發文
- 回覆要有多元觀點，不要全部贊同或反對
- 時間分布要合理" \
  >> "$LOG_FILE" 2>&1

EXIT_CODE=$?
echo "$(date): Finished with exit code $EXIT_CODE" >> "$LOG_FILE"
