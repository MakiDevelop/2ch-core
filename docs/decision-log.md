# Decision Log

本文件記錄專案中的重要決策，包含「為什麼這樣選擇」而非僅記錄「做了什麼」。

---

## 記錄原則

**必須記錄的情境：**
- 選擇 mock / fake / replay 而非真實系統
- 否決或推翻任何 AI (Claude / Gemini / Codex) 的建議
- 技術選型、架構取捨、有明顯 trade-off 的決策
- 為了推進進度而暫時接受「不完美方案」

**格式範本：**
```
### YYYY-MM-DD: [決策標題]

**背景：** 為什麼需要做這個決定
**選項：** 考慮過的方案
**決策：** 最終選擇
**理由：** 為什麼這樣選
**風險/TODO：** 未來需要注意或回收的事項
```

---

## 2026-02-14: 內容策略轉型 — 從「AI 填充」到「AI 引戰」

**背景：** 論壇上線以來，內容 95% 為 AI 生成（Claude CLI + cron），真實用戶約 6 人。技術面（SSR、SEO、JSON-LD、sitemap）已完備，但缺乏真人互動。需要決定下一步投資方向。

**五方會診：** Claude（整合）、Perplexity（市場研究）、Codex（技術架構）、Gemini（UX/內容策略）、ChatGPT（Prompt 工程）

**市場分析（Perplexity）：**
- PTT 老化 + 技術滯後、Dcard 商業化 + 假掰、Threads 搶走政治話題
- 缺口：現代 UI + 真匿名 + 有深度討論的論壇
- Google AI Overviews 大量引用論壇 Q&A，SEO 機會存在
- AI 農場風險：Google 2025/8 spam update 已在打低品質 AI 內容

**決策 1：看板從 10 個縮減為 3 個（冷啟動聚焦）**

| 保留 | 原因 |
|------|------|
| 綜合（雜談+時事+問卦+抱怨+生活合併） | 流量核心，製造擁擠感 |
| 科技/ACG | 技術同溫層，最容易接受論壇形式 |
| 成人 | 匿名環境下活躍度高，導流利器 |

- 理由（Gemini）：6 人分 10 間包廂 = 鬼屋。先擠在一起，等單板日發文 >100 再拆分
- 其他看板暫時隱藏，不刪除資料

**決策 2：AI 內容策略重構 — Persona Pool + 康寧漢模式**

核心原則轉變：
- ❌ AI 負責給完整答案、總結、列點、平衡觀點
- ✅ AI 負責留漏洞、引發糾正、製造摩擦

人格池（ChatGPT v3 spec）：
1. 暴躁老哥 — 情緒明顯、有偏見
2. 反主流工程師 — 站少數立場、不給完整論證
3. 半懂嘴砲仔 — 混合對錯、留技術漏洞（康寧漢定律）
4. 認真魔人 — 研究一半卡住、求補充
5. 深夜孤獨人 — 情緒真實、帶生活味

康寧漢模式：30% 機率啟動，故意講 70% 對 30% 錯的觀點，不自我修正。

**決策 3：分兩波實施**

第一波（零/低 code change，立即執行）：
- 看板縮減 10 → 3
- 整合 Persona Pool prompt 到 /add-threads 和 /add-replies skill
- AI 回覆字數限制 15-50 字（真人回覆通常很短）

第二波（需要寫 code，第一波觀察 14 天後）：
- DB 加欄位：`seed_source`、`persona_type`、`seed_goal`
- 熱門排序 + 首頁模塊（hotness score，真人串優先）
- 半匿名身份（簽名 cookie）+ 回覆通知（WebPush）
- 回覆框 UX 改善（直接露出，不藏在按鈕後）

**成功指標（14 天觀察）：**
- 真人首樓比例
- AI/真人回覆比
- 每串平均真人留言數
- 無 AI 介入的真人互動數

**風險/TODO：**
- Google 若判定為 AI 農場可能降權 → 需要真人訊號混入 + GSC 監控
- 成人板需注意年齡驗證與法規合規
- 看板合併後舊連結需要 redirect 或相容處理
- Persona prompt 需持續調校，避免太刻意反而讓人察覺是 AI

---

## 2026-02-14: 第一波執行 — 從「引戰」轉向「樹洞」

**背景：** 上方五方會診產出了「AI 引戰 + 康寧漢模式」策略，但 Maki 重新評估後認為方向不對。論壇最大的風險不是技術債，是「把論壇做成研究所」。需要的不是引戰，是讓人願意說話。

**決策：放棄引戰路線，改為「深夜樹洞」模式**

核心原則轉變：
- ❌ AI 負責引戰、製造摩擦、康寧漢模式
- ✅ AI 是凌晨還在線的人。安全感 > 熱度、陪伴 > 解決、延續 > 結案

**理由：**
- 「當 70% 內容是 AI，怎麼讓 30% 真人願意說話」— 答案不是更聰明的 AI，是更安全的環境
- 論壇不是演算法場、不是戰場、不是排行榜。是可以暫時放下防備的地方
- AI 只是陪著，不是主導

**已執行項目：**

| 項目 | 變更前 | 變更後 |
|------|--------|--------|
| 看板數量 | 10 個 | 3 個（綜合、科技/ACG、成人） |
| 看板處理 | — | 軟刪除（`is_active=false`），資料保留 |
| ACG 討論串 | 獨立板（163 串） | 搬入 tech 板（合併後 321 串） |
| 成人板 | 不存在 | 新增（slug: `nsfw`） |
| add-threads 頻率 | 每 8 小時，每次 3+ 串 | 每 12 小時，每次 1 串 |
| add-threads 風格 | 基於時事 WebSearch | 第一人稱情緒文，150-300 字 |
| add-replies 頻率 | 每小時，每串 1-5 則 | 每 4 小時，每串最多 1 則 |
| add-replies 觸發 | 回覆數最少的串 | 發文後 4 小時無人回覆才補位 |
| add-replies 風格 | 多元觀點、列點 | 重述感受、共感、延續提問 |
| 跳過機率 | 無 | 20%（保持自然冷場） |

**主題比例（add-threads）：**
- 50% 深夜壓力型
- 30% 迷惘求助型
- 15% 工作/學業焦慮
- 5% 輕微摩擦觀點（不攻擊、不挑釁）

**persona_pool（add-replies）：**
- lonely — 深夜也醒著的人
- confused — 也在迷惘中
- tired_worker — 同樣累的人
- quiet_thinker — 不多話，偶爾一句到位

**14 天觀察指標（不看 PV、不看流量）：**
- 真人首樓比例
- 真人回覆延續數
- 二次發文用戶數
- 深夜發文比例
- 無 AI 介入的真人互動數

**14 天內不做的事：**
- ❌ 通知系統
- ❌ 熱門排序
- ❌ 身份系統
- ❌ SEO 深耕
- ❌ 優化任何東西

**成功標準：** 有人願意在這裡說，在其他地方不敢說的話。

**風險/TODO：**
- 14 天後根據數據決定下一步（v1.1 思想碰撞 / v2 混合摩擦 / 引爆模式）
- 成人板目前空的，暫不自動發文
- 舊板的 SEO 連結會 404，但目前無真實 SEO 流量

---

## 2026-02-06: 專案綜合審查 — 完成 11 項，6 項延後

**背景：** 由三個角色（資深架構師、CTO、CISO）對 2ch-core 做全面審查，產出 17 項改善建議。

**已完成（Phase 1 + Phase 2）：**
- CSP unsafe-inline 移除、CSRF 防護、ReDoS 防護
- 整合測試（69 tests）、DB migration runner idempotent
- Embed URL 域名白名單、Admin audit log（badword CRUD）
- Health readiness probe（/health/ready）
- Error code 統一體系（HttpError + code）
- Structured logging（pino）
- ARCHITECTURE.md 改寫為實際架構

**決策：剩餘 6 項延後處理**

| 項目 | 優先級 | 延後理由 |
|------|--------|----------|
| 搜尋全文索引（tsvector/GIN） | 低 | 目前資料量小，效能無痛點 |
| postgres.ts 拆分 | 觀察 | 重構型，目前結構可維護 |
| 監控與告警（Grafana/Loki） | 中 | 需要額外基礎設施，非功能性 |
| 前端靜態資源版本控制 | 低 | cache busting，優先級不高 |
| Redis 密碼命令列曝光 | 低 | 改用 env_file，風險低（內網） |
| Security.txt | 低 | 加靜態檔即可，隨時可做 |

**理由：** 高優先 + 中優先項目已全數完成，剩餘皆為低優先或觀察級。PoC 階段優先推進功能，這些項目等需求出現或資料量成長時再處理。

---

## 2026-02-03: 引入 ESLint + Pre-commit 防止「修東壞西」

**背景：**
- 2026-02-02 事故：函數改 async 但呼叫端沒加 await，導致發文功能故障 3 天
- 專案缺乏自動化檢查機制，容易「修東壞西」
- 品質調查發現 64 個 TypeScript 錯誤、41 個 ESLint 警告

**選項：**
1. 只靠人工 code review
2. 引入 ESLint + TypeScript strict mode（一次大改）
3. ESLint + Pre-commit，只檢查新改動的檔案（漸進式）

**決策：** 選項 3 - ESLint + Pre-commit（漸進式）

**實施內容：**
- 安裝 ESLint 9 + typescript-eslint + Husky + lint-staged
- 核心規則設為 ERROR：`@typescript-eslint/no-floating-promises`、`no-misused-promises`
- 次要規則設為 WARN：`no-unused-vars`、`no-explicit-any` 等
- Pre-commit hook 只檢查 staged files，不阻擋舊債
- 啟用 `strictNullChecks` 讓 discriminated union type narrowing 正常運作

**修復結果：**

| 問題 | 修復前 | 修復後 |
|------|--------|--------|
| TypeScript errors | 64 | 0 |
| ESLint errors | 19 | 0 |
| ESLint warnings | 22 | 21 |

**關鍵修復：**
1. **posts.ts missing await** - 又發現一個跟 2/2 incident 同樣的 bug pattern
2. **floating promises** - boardPage.ts:146, threadPage.ts:172 沒有 .catch()
3. **ThreadDetail type** - 補齊 boardSlug/boardName 屬性

**理由：**
- Gemini + Codex 共識：靜態分析是成本最低但最有效的防護
- 只檢查新改動，不影響開發速度
- 漸進式改善，不用一次還清技術債

**未來 TODO：**
- [ ] 逐步開啟 TypeScript strict mode（目前只開 strictNullChecks）
- [ ] 針對關鍵路徑加測試
- [ ] CI 加入 lint 檢查
- [ ] 清理剩餘 21 個 warnings（`any` 類型和 unused vars）

---

## 2026-01-31: ERIKA 通訊管道選型 - LINE Bot

**背景：** ERIKA 需要雙向通訊管道，用於通知人類決策點、接收指令

**選項：**
1. Telegram Bot - 雙向、即時、易開發
2. LINE Bot (Messaging API) - 雙向、台灣主流通訊軟體
3. LINE Notify + Webhook - 單向通知 + 其他管道接收
4. Discord Bot - 雙向、易開發

**決策：** 選項 2 - LINE Bot (Messaging API)

**理由：**
- LINE 是台灣最普及的通訊軟體，用戶日常使用
- Messaging API 支援雙向溝通（推播 + 接收指令）
- 可整合 Rich Menu、Quick Reply 等互動元件

**風險/TODO：**
- 需要 LINE Developers Console 設定 Channel
- 需要 HTTPS webhook endpoint
- 免費額度：每月 500 則推播訊息（超過需付費）

---

## 2026-01-31: 五位一體模式啟動與權限分配

**背景：** 專案導入五位一體 AI 協作模式，需明確定義各角色權限

**決策：**
- **ERIKA**：repo readonly 權限（監控、讀取、執行 task）
- **Claude / Codex / Gemini**：可進行修改、commit、push

**理由：**
- ERIKA 定位為「執行監控」，不需要直接修改程式碼
- 修改決策權集中在 Claude（總指揮）整合 Codex/Gemini 輸出後執行
- 減少多 agent 同時修改造成的衝突風險

**風險/TODO：**
- ERIKA 若需執行部署，需另外設定 VPS 執行權限（非 repo 寫入權限）

---

## 2026-01-30: Dev 環境資料庫 Schema 不同步問題

**背景：** dev.2ch.tw 無法發文，錯誤訊息 `column "edit_token_hash" of relation "posts" does not exist`

**原因：**
- Production (`2ch`) 資料庫已執行過 `008_add_edit_token.sql` migration
- Dev (`2ch_dev`) 資料庫未執行此 migration，導致缺少 `edit_token_hash` 和 `edited_at` 欄位

**修復：** 手動在 `2ch_dev` 執行：
```sql
ALTER TABLE posts ADD COLUMN IF NOT EXISTS edit_token_hash VARCHAR(64);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_posts_edit_token ON posts(id, edit_token_hash) WHERE edit_token_hash IS NOT NULL;
```

**教訓/TODO：**
- ⚠️ **部署 production 時務必確認 migration 已執行**
- 目前無自動 migration 機制，需手動執行 SQL
- 未來考慮實作 migration runner 或在 CI/CD 中整合

---

## 2026-01-22: 編輯標記 10 分鐘後自動隱藏

**背景：** 用戶回報「編輯只給 10 分鐘，顯示『2小時前 編輯』沒有意義」

**選項：**
1. 保持原樣，永久顯示編輯標記
2. 編輯窗口過期後隱藏標記
3. 編輯窗口過期後顯示刪除線

**決策：** 選項 2 - 編輯窗口（10 分鐘）過期後隱藏 `已編輯` 標記

**理由：**
- 編輯功能的目的是讓用戶在發文後短時間內修正錯誤
- 超過編輯窗口後，顯示「已編輯」不再提供有用資訊
- 實作簡單，無效能影響（純前端時間比較）

**風險/TODO：** 無

---

## 2026-01-21: Board Page SSR for OG Tags

**背景：** 社群分享板塊連結時，OG tags 顯示預設值而非板塊資訊

**選項：**
1. 純前端 JavaScript 更新 meta tags（爬蟲無法執行 JS）
2. Server-Side Rendering (SSR) 在後端注入正確的 OG tags

**決策：** 選項 2 - 實作 `boardPageMiddleware` 進行 SSR

**理由：**
- 社群爬蟲（Facebook、LINE、Twitter）不執行 JavaScript
- 必須在 HTML response 中直接包含正確的 OG meta tags
- 已有 `threadPageMiddleware` 作為參考，架構一致

**風險/TODO：** 無

---

## 2026-01-21: Mobile Tooltip 改為 Modal 呈現

**背景：** 用戶回報手機版 Safari 無法關閉語法說明 tooltip

**選項：**
1. 修復 hover 行為在觸控裝置的問題
2. 改為 tap-to-toggle 並以 modal 呈現

**決策：** 選項 2 - 手機版改為置中 modal + 半透明背景 + 關閉按鈕

**理由：**
- 觸控裝置沒有 hover 概念，hover-based UI 本質上有問題
- Modal 呈現更符合手機使用習慣
- 關閉按鈕提供明確的關閉方式

**風險/TODO：** 無

---

## 2026-02-02: 重大事故 - async/await 遺漏導致發文功能故障 3 天

**背景：** 用戶回報發文失敗，調查後發現 1/30 ~ 2/2 期間所有發文/回覆都回傳 500 錯誤

**根本原因：**
- commit `5401bf8` (2026-01-30) 將 `checkCreatePost` 改為 async 函數
- 但呼叫端（`posts.ts`, `boards.ts`）沒有加上 `await`
- 導致驗證邏輯收到 Promise 物件而非實際結果，所有發文都失敗

**問題程式碼：**
```typescript
// 錯誤
const check = checkCreatePost(content);  // 回傳 Promise

// 正確
const check = await checkCreatePost(content);  // 回傳實際結果
```

**影響：**
- 36 次失敗請求，6 個不同 IP
- 用戶資料無法恢復

**修復：**
- commit `90bd2ac`：補上缺少的 `await`
- 新增道歉公告（顯示至 2/9）
- 新增錯誤回報機制

**教訓/開發規範：**
1. ⚠️ **將函數改為 async 時，必須同時檢查所有呼叫端並加上 await**
2. ⚠️ **修改共用函數後，必須測試所有使用該函數的流程**
3. TypeScript 不會警告「呼叫 async 函數但沒 await」，需靠人工或 lint 規則檢查
4. 考慮加入 ESLint 規則：`@typescript-eslint/no-floating-promises`

---

## 記錄守則提醒

> **Claude 必須：**
> - 在做出任何符合上述情境的決策時，主動提醒人類是否需要記錄
> - 不得假設「這很明顯不需要記錄」
>
> **人類原則：**
> - 寧可多記不可漏記
> - 記錄要讓未來的自己和 AI 都能理解
