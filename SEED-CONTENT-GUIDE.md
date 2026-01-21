# 2ch-core 內容生成指南

## 📋 快速執行（給 Claude Code 的 Prompt）

```
我需要為 2ch.tw (production) 生成模擬內容。

當前狀態：
- Production DB: root@139.180.199.219:/opt/2ch-core
- 使用 docker-compose.deploy.yml
- 資料庫名稱：2ch

請執行以下步驟：
1. SSH 連接到 production 檢查當前資料庫狀態（討論串數、回覆數）
2. 檢查各板塊的討論串分布
3. 使用現有的 scripts/seed-realistic-content.ts 或創建新的 seed script
4. 生成符合以下風格的內容：
   - 口語化、接地氣的台灣用語
   - 作者名稱有創意（例如：「存不到錢的上班族」「觀望中的路人」）
   - 討論主題真實、貼近生活
   - 回覆有長有短，有些會用 >>1 引用
   - 適當使用網路用語（www、XD 等）
5. 上傳並執行 script
6. 驗證結果並回報統計數據
```

---

## 🎯 內容生成原則

### 討論串風格
- **標題長度**：10-30 字，清晰描述主題
- **內容長度**：50-300 字
- **語氣**：真實、口語化、有情緒
- **作者名稱**：
  - 50% 使用「名無しさん」（預設）
  - 50% 使用創意暱稱（反映主題或心境）

### 回覆風格
- **長度分布**：
  - 30% 短回覆（5-20 字）
  - 50% 中等回覆（20-80 字）
  - 20% 長回覆（80-200 字，分點列舉）
- **互動特色**：
  - 使用 `>>1`、`>>2` 引用前面的留言
  - 表達同意：「+1」「同意」「>>2 對」
  - 網路用語：「www」「XD」「好不好」
  - 表情符號適量使用

### 主題類型參考

#### love 板（感情／兩性／婚姻）
- 戀愛困擾（暗戀、告白、交往）
- 感情問題（吵架、冷戰、分手）
- 婚姻壓力（催婚、婚姻生活）
- 兩性觀察

#### money 板（金錢／投資／理財）
- 存錢方法與困擾
- 投資理財建議（ETF、股票）
- 信用卡、貸款
- 薪水與開銷規劃

#### news 板（時事／政治）
- 社會議題（交通、房價、詐騙）
- 政策討論
- 公共服務體驗
- 民生新聞

#### gossip 板（娛樂／名人／八卦）
- 影劇評論（韓劇、台劇、動畫）
- 網紅、YouTube
- 演唱會、活動
- 流行文化

#### life 板（生活／心情）
- 日常觀察
- 通勤、租屋
- 人際關係
- 生活感悟

#### acg 板（ACG／遊戲）
- 遊戲推薦與評論
- 動畫討論
- 遊戲平台（Steam、PS5、Switch）
- ACG 話題

#### meta 板（站務／建議）
- 功能建議
- 使用體驗
- 感謝與回饋

---

## 🛠️ 技術細節

### 執行環境
```bash
# Production Server
Host: root@139.180.199.219
Path: /opt/2ch-core
Docker Compose: docker-compose.deploy.yml
Container Name: 2ch-core-api
Database: postgres://postgres:postgres@postgres:5432/2ch
```

### 執行 Seed Script
```bash
# 1. 上傳 script 到 server
scp scripts/seed-realistic-content.ts root@139.180.199.219:/opt/2ch-core/scripts/

# 2. 複製到容器內
ssh root@139.180.199.219 "docker cp /opt/2ch-core/scripts/seed-realistic-content.ts 2ch-core-api:/app/"

# 3. 執行 script
ssh root@139.180.199.219 "cd /opt/2ch-core && docker compose -f docker-compose.deploy.yml exec -T api npx tsx /app/seed-realistic-content.ts"
```

### 驗證結果
```bash
# 檢查總體統計
docker compose -f docker-compose.deploy.yml exec -T postgres psql -U postgres -d 2ch -c "
  SELECT
    (SELECT COUNT(*) FROM posts WHERE parent_id IS NULL) as threads,
    (SELECT COUNT(*) FROM posts WHERE parent_id IS NOT NULL) as replies,
    (SELECT COUNT(*) FROM posts) as total
"

# 檢查各板塊分布
docker compose -f docker-compose.deploy.yml exec -T postgres psql -U postgres -d 2ch -c "
  SELECT b.slug, b.name, COUNT(p.id) as thread_count
  FROM boards b
  LEFT JOIN posts p ON p.board_id = b.id AND p.parent_id IS NULL
  GROUP BY b.id, b.slug, b.name
  ORDER BY b.display_order
"

# 檢查最新討論串
docker compose -f docker-compose.deploy.yml exec -T postgres psql -U postgres -d 2ch -c "
  SELECT p.id, p.title, p.author_name, b.slug,
         (SELECT COUNT(*) FROM posts r WHERE r.parent_id = p.id) as reply_count
  FROM posts p
  LEFT JOIN boards b ON p.board_id = b.id
  WHERE p.parent_id IS NULL
  ORDER BY p.created_at DESC
  LIMIT 15
"
```

---

## 📊 執行記錄

### 2026-01-14 首次執行
**執行前：**
- 127 討論串
- 250 回覆
- 377 總貼文

**執行後：**
- 159 討論串（+32）
- 383 回覆（+133）
- 542 總貼文（+165）

**各板塊變化：**
| 板塊 | 執行前 | 執行後 | 增加 | 增幅 |
|------|--------|--------|------|------|
| love | 3 | 9 | +6 | +200% |
| money | 4 | 9 | +5 | +125% |
| news | 6 | 11 | +5 | +83% |
| gossip | 6 | 11 | +5 | +83% |
| acg | 7 | 11 | +4 | +57% |
| life | 10 | 14 | +4 | +40% |
| meta | 10 | 13 | +3 | +30% |
| chat | 35 | 35 | 0 | 0% |
| tech | 31 | 31 | 0 | 0% |
| work | 15 | 15 | 0 | 0% |

**新增內容類型：**
- 32 個高質量討論串
- 133 則真實感的回覆
- 內容分佈在過去 7 天（使用隨機時間戳）
- 作者名稱多樣化，風格一致

---

## 🔄 重複執行建議

### 執行頻率
- **初期建立內容**：每週 1-2 次
- **維持活躍度**：每兩週 1 次
- **平時**：依照板塊活躍度調整

### 內容多樣性
為避免內容重複或風格單調，每次執行時：
1. 更換討論主題（參考時事、熱門話題）
2. 調整語氣風格（更幽默 / 更認真 / 更抱怨）
3. 變化作者名稱的創意度
4. 混合不同長度的內容

### 注意事項
- ⚠️ 不要短時間內重複執行（避免內容過度集中）
- ⚠️ 定期檢查各板塊平衡度
- ⚠️ 觀察使用者真實貼文的風格，適時調整生成內容
- ⚠️ 避免生成過於敏感的政治、宗教、仇恨言論

---

## 📝 Seed Script 結構參考

```typescript
// 基本結構
async function seedBoard(boardSlug: string) {
  // 1. 建立討論串
  const thread = await insertThread(
    boardSlug,
    '討論串標題',
    '討論串內容\n可以多行',
    '作者暱稱'
  );

  // 2. 新增回覆（3-10 則）
  await insertReply(thread, '第一則回覆', '名無しさん', 1); // 1小時前
  await insertReply(thread, '第二則回覆', '回覆者', 2);     // 2小時前
  await insertReply(thread, '>>1 引用回覆', '名無しさん', 3);
}

// Helper functions
- generateIpHash(): 生成隨機 IP hash
- randomUserAgent(): 隨機 user agent
- insertThread(): 插入討論串
- insertReply(): 插入回覆
```

---

## 🎨 內容範例

### 優質討論串範例

**標題**：「交往三年，他還是不想結婚」
**內容**：
```
我們都30歲了，交往也三年多
他就是一直說「再等等」「還沒準備好」

上個月我說想要訂婚，他又開始拖
朋友都結婚生小孩了，我真的很焦慮

到底要等到什麼時候啊...
```
**作者**：等不到結婚的女友

### 優質回覆範例

**短回覆**：
- 「三年都不結婚，要不就是沒錢，要不就是不想」
- 「>>1 +1」
- 「不愧是種花」

**中等回覆**：
- 「直接問清楚他的想法吧\n拖下去對妳也不好」
- 「我男友也是這樣，後來發現他只是不想結婚而已」

**長回覆**：
```
看你的投資目標

00878：
- 高股息 ETF，適合想領配息的
- 分散風險，波動較小
- 殖利率大概 5-6%

台積電：
- 成長股，股價波動大
- 配息少但資本利得潛力高
- 集中風險

如果你是想長期存股領息，00878 比較穩
想賺價差就台積電
```

---

## 💡 Claude Code 使用提示

當你需要 Claude Code 生成內容時，只需要說：

```
請使用 SEED-CONTENT-GUIDE.md 的指引，為 2ch.tw production 生成新內容。
重點補充 [板塊名稱]，生成 [數量] 個討論串。
```

或更簡潔地：

```
執行 seed content，補充稀缺板塊。
```

Claude Code 會自動：
1. 讀取這份指南
2. 檢查 production 現況
3. 生成符合風格的內容
4. 執行並驗證

---

**最後更新**：2026-01-14
**維護者**：Claude Code (Anthropic)
