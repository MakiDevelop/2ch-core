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

## 2026-02-03: 引入 ESLint + Pre-commit 防止「修東壞西」

**背景：**
- 2026-02-02 事故：函數改 async 但呼叫端沒加 await，導致發文功能故障 3 天
- 專案缺乏自動化檢查機制，容易「修東壞西」

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

**修復的潛在問題：**
- `boardPage.ts:146` - floating promise（無 .catch）
- `threadPage.ts:172` - floating promise（無 .catch）

**理由：**
- Gemini + Codex 共識：靜態分析是成本最低但最有效的防護
- 只檢查新改動，不影響開發速度
- 漸進式改善，不用一次還清技術債

**未來 TODO：**
- [ ] 逐步開啟 TypeScript strict mode
- [ ] 針對關鍵路徑加測試
- [ ] CI 加入 lint 檢查

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
