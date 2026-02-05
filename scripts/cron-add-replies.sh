#!/bin/bash
# =============================================================================
# [VPS Primary] Cron: /add-replies
# 每小時檢查並補充回覆
# 排程：30 * * * * (每小時 :30)
# 部署位置：n1k.tw (167.179.69.8)
# =============================================================================
set -euo pipefail

LOCK_FILE="/tmp/2ch-cron-add-replies.lock"
LOG_DIR="$HOME/.claude/logs/2ch-cron"
LOG_FILE="$LOG_DIR/add-replies-$(date +%Y%m%d-%H%M%S).log"
PROJECT_DIR="/opt/2ch-core"
DB_HOST="139.180.199.219"

mkdir -p "$LOG_DIR"

# 防止重複執行
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  echo "$(date): add-replies already running, skipping" >> "$LOG_DIR/skipped.log"
  exit 0
fi

# 自動清理 stale lock
trap 'flock -u 200' EXIT

# 隨機延遲 0-15 分鐘
DELAY=$((RANDOM % 900))
echo "$(date): Sleeping ${DELAY}s before starting" >> "$LOG_FILE"
sleep "$DELAY"

echo "$(date): Starting /add-replies cron job" >> "$LOG_FILE"

# 清理 30 天以前的 log
find "$LOG_DIR" -name "add-replies-*.log" -mtime +30 -delete 2>/dev/null || true

THREAD_COUNT=$((RANDOM % 11 + 5))

claude -p \
  --model sonnet \
  --dangerously-skip-permissions \
  --max-budget-usd 5.00 \
  --add-dir "$PROJECT_DIR" \
  -- \
  "你現在在 $PROJECT_DIR 工作目錄。請執行 /add-replies skill。

具體要求：
1. SSH 到 $DB_HOST 查詢回覆數最少的討論串（取前 30 筆）
2. 從中隨機選出約 ${THREAD_COUNT} 個討論串來補充回覆
3. 讀取每個討論串的原文和現有回覆
4. 每個討論串補充 1-5 則回覆（隨機決定數量，不要每串都一樣）
5. 回覆內容必須：
   - 與主串主題和現有回覆相關
   - 有多元觀點（贊同、反對、補充、吐槽都可以）
   - 適當使用 >>樓層號 引用（OP=1, 第一則回覆=2...）
   - 語氣像台灣年輕人在匿名論壇
   - 長度 1-3 行，自然不做作
6. 建立 seed script 後部署到 production
7. 部署完成後驗證回覆數變化

注意：
- 如果某些串回覆已經很多（>15），可以跳過
- 優先處理回覆數 0-5 的討論串
- 不要為同一個串連續補太多回覆（看起來不自然）" \
  >> "$LOG_FILE" 2>&1

EXIT_CODE=$?
echo "$(date): Finished with exit code $EXIT_CODE" >> "$LOG_FILE"
