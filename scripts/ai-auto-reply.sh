#!/bin/bash
# ai-auto-reply.sh — AI 即時陪聊
#
# 在 Mac mini 上每 5 分鐘執行：
# 1. SSH 到 2ch.tw 查詢需要回覆的真人貼文
# 2. 呼叫 DGX Spark Ollama (qwen3.5:35b-a3b) 生成回覆
# 3. SSH 到 2ch.tw 寫入回覆
#
# cron（Mac mini）：
#   */5 * * * * /opt/2ch-ai-responder/ai-auto-reply.sh >> /opt/2ch-ai-responder/ai-reply.log 2>&1

set -euo pipefail

# --- Config ---
SSH_TARGET="2ch"
DGX_OLLAMA="http://192.168.11.123:11434"
MODEL="qwen3.5:35b-a3b"
STATE_FILE="${STATE_DIR:-/opt/2ch-ai-responder}/processed_ids.txt"
LOOKBACK_MINUTES="${LOOKBACK_MINUTES:-30}"
MAX_REPLIES_PER_RUN="${MAX_REPLIES_PER_RUN:-3}"
DRY_RUN="${DRY_RUN:-false}"

# 已知 cron 呼吸腳本的標題（用來排除）
KNOWN_CRON_TITLES=(
  "半夜三點還醒著的人都在想什麼"
  "今天被裁了"
  "覺得自己是不是不適合社交"
  "三十歲了還不知道自己要什麼"
  "好久沒有跟人好好說話了"
  "搬來新城市三個月了 一個朋友都沒有"
  "已經連續加班兩週了"
  "分手半年了 突然很想他"
  "其實很討厭現在的工作 但不敢離開"
  "爸媽老了 我卻在外面回不去"
  "好像很久沒有笑了"
  "越長大朋友越少 正常嗎"
  "台灣的加班文化真的很扯"
  "覺得現在的新聞越來越不像新聞了"
  "寫程式十年 覺得工具越多反而越累"
  "租屋族永遠是弱勢"
  "外送平台把餐飲業搞得很慘"
  "AI 會不會讓工程師變得更不值錢"
  "台灣人是不是太愛忍了"
  "覺得社群媒體讓人越來越焦慮"
  "第一次看身心科會很奇怪嗎"
  "轉職到底要不要裸辭"
  "自學程式該從哪個語言開始"
  "一個人去旅行會不會很奇怪"
  "有什麼副業是下班後可以做的"
  "該不該花錢買線上課程"
  "最近迷上了半夜散步"
  "便利商店的咖啡其實蠻好喝的"
  "有人跟我一樣很會跟貓說話嗎"
)

# 隨機作者名
AUTHOR_NAMES=("名無しさん" "名無しさん" "名無しさん" "名無しさん" "路人" "夜行者" "社畜" "潛水仔")

# 隨機 User-Agent
USER_AGENTS=(
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15"
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36"
)

# --- Utilities ---

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

random_element() {
  local arr=("$@")
  echo "${arr[$((RANDOM % ${#arr[@]}))]}"
}

random_ip_hash() {
  echo -n "$((RANDOM % 255)).$((RANDOM % 255)).$((RANDOM % 255)).$((RANDOM % 255))" | shasum -a 256 | cut -d' ' -f1
}

is_known_cron_title() {
  local title="$1"
  for known in "${KNOWN_CRON_TITLES[@]}"; do
    if [[ "$title" == "$known" ]]; then
      return 0
    fi
  done
  return 1
}

is_processed() {
  local id="$1"
  touch "$STATE_FILE"
  grep -q "^${id}$" "$STATE_FILE" 2>/dev/null
}

mark_processed() {
  local id="$1"
  echo "$id" >> "$STATE_FILE"
  # 只保留最近 500 筆
  tail -500 "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
}

# --- Phase 1: 查詢需要回覆的真人貼文 ---

fetch_unresponded_threads() {
  ssh "$SSH_TARGET" "docker exec 2ch-core-postgres psql -U postgres -d 2ch -t -A -F'|' -c \"
    SELECT p.id, p.title, REPLACE(LEFT(p.content, 500), E'\\\\n', ' '), p.author_name
    FROM posts p
    WHERE p.parent_id IS NULL
      AND p.status = 0
      AND p.created_at > NOW() - INTERVAL '${LOOKBACK_MINUTES} minutes'
      AND NOT EXISTS (
        SELECT 1 FROM posts r WHERE r.parent_id = p.id AND r.status = 0
      )
    ORDER BY p.created_at DESC
    LIMIT 10;
  \"" 2>/dev/null
}

# --- Phase 2: 呼叫 Ollama 生成回覆 ---

generate_reply() {
  local title="$1"
  local content="$2"
  local author="$3"

  local system_prompt="你是台灣匿名論壇 2ch.tw 的一般用戶。用繁體中文回覆。

規則：
- 回覆要簡短自然（1-3 句話），像真人在論壇上的隨意回應
- 不要太正式、不要像 AI、不要用條列式
- 可以表達共鳴、分享經驗、提出疑問、或適度吐槽
- 用口語化的繁體中文，可以用「欸」「啊」「吧」「耶」等語助詞
- 不要說「身為 AI」或暴露你是機器人
- 不要用 emoji
- 如果是政治文，可以表達立場但不要太偏激
- 回覆直接給內容，不要加引號或前綴"

  local user_prompt="討論串標題：${title}
內容：${content}
作者：${author}

請以一個路過的網友身份回覆這篇文章。"

  # 用 jq 安全地構建 JSON（處理特殊字元）
  local request_body
  request_body=$(jq -n \
    --arg model "$MODEL" \
    --arg system "$system_prompt" \
    --arg user "$user_prompt" \
    '{
      model: $model,
      think: false,
      messages: [
        { role: "system", content: $system },
        { role: "user", content: $user }
      ],
      stream: false,
      options: {
        temperature: 0.85,
        top_p: 0.9,
        num_predict: 200
      }
    }')

  local response
  response=$(curl -s --max-time 60 "${DGX_OLLAMA}/api/chat" \
    -H "Content-Type: application/json" \
    -d "$request_body" 2>/dev/null)

  if [[ -z "$response" ]]; then
    log "ERROR: Ollama 無回應"
    return 1
  fi

  # 提取回覆內容
  local reply_content
  reply_content=$(echo "$response" | jq -r '.message.content // empty')

  if [[ -z "$reply_content" ]]; then
    log "ERROR: Ollama 回覆為空: $(echo "$response" | head -c 200)"
    return 1
  fi

  # 清理：移除可能的 thinking 標籤
  reply_content=$(echo "$reply_content" | sed 's/<think>.*<\/think>//g' | sed '/^$/d' | head -5)

  echo "$reply_content"
}

# --- Phase 3: 寫入回覆到 DB ---

insert_reply() {
  local thread_id="$1"
  local content="$2"
  local author_name="$3"
  local ip_hash="$4"
  local user_agent="$5"

  # 隨機延遲 3-15 分鐘前的時間戳（讓發文時間更自然）
  local minutes_ago=$(( (RANDOM % 12) + 3 ))

  # 用 heredoc 避免引號問題
  ssh "$SSH_TARGET" "docker exec -i 2ch-core-postgres psql -U postgres -d 2ch" <<SQL
INSERT INTO posts (content, status, ip_hash, user_agent, parent_id, board_id, author_name, created_at)
SELECT
  '$(echo "$content" | sed "s/'/''/g")',
  0,
  '${ip_hash}',
  '${user_agent}',
  ${thread_id},
  p.board_id,
  '${author_name}',
  NOW() - INTERVAL '${minutes_ago} minutes'
FROM posts p WHERE p.id = ${thread_id};
SQL
}

# --- Main ---

main() {
  log "=== ai-auto-reply start ==="

  # 20% 機率跳過（模擬自然節奏）
  if (( RANDOM % 5 == 0 )); then
    log "SKIP: 隨機跳過本次"
    return 0
  fi

  # Phase 1: 查詢
  log "查詢未回覆的真人貼文..."
  local raw_data
  raw_data=$(fetch_unresponded_threads) || { log "ERROR: SSH/DB 查詢失敗"; return 1; }

  if [[ -z "$raw_data" ]]; then
    log "沒有需要回覆的貼文"
    return 0
  fi

  local reply_count=0

  while IFS='|' read -r post_id title content author_name; do
    # 跳過空行
    [[ -z "$post_id" ]] && continue

    # 檢查是否已處理
    if is_processed "$post_id"; then
      log "SKIP #${post_id}: 已處理過"
      continue
    fi

    # 檢查是否為 cron 呼吸的已知標題
    if is_known_cron_title "$title"; then
      log "SKIP #${post_id}: cron 已知標題「${title}」"
      mark_processed "$post_id"
      continue
    fi

    # 達到上限
    if (( reply_count >= MAX_REPLIES_PER_RUN )); then
      log "達到單次上限 ${MAX_REPLIES_PER_RUN}，停止"
      break
    fi

    log "處理 #${post_id}：「${title}」"

    # Phase 2: 生成回覆
    local reply_content
    reply_content=$(generate_reply "$title" "$content" "$author_name") || {
      log "ERROR: 生成回覆失敗 #${post_id}"
      continue
    }

    log "AI 回覆：${reply_content:0:80}..."

    # Phase 3: 寫入
    local rand_author rand_ua rand_ip
    rand_author=$(random_element "${AUTHOR_NAMES[@]}")
    rand_ua=$(random_element "${USER_AGENTS[@]}")
    rand_ip=$(random_ip_hash)

    if [[ "$DRY_RUN" == "true" ]]; then
      log "[DRY-RUN] 會回覆 #${post_id} 以「${rand_author}」身份"
    else
      insert_reply "$post_id" "$reply_content" "$rand_author" "$rand_ip" "$rand_ua" || {
        log "ERROR: 寫入失敗 #${post_id}"
        continue
      }
      log "OK: 已回覆 #${post_id}"
    fi

    mark_processed "$post_id"
    (( reply_count++ ))

    # 隨機等待 10-30 秒再處理下一篇（避免太密集）
    if (( reply_count < MAX_REPLIES_PER_RUN )); then
      sleep $(( (RANDOM % 20) + 10 ))
    fi

  done <<< "$raw_data"

  log "=== 完成：回覆 ${reply_count} 篇 ==="
}

main "$@"
