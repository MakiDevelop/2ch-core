

# Changelog

本檔案記錄 **2ch-core** 的重要變更，目的是讓未來回來維護或擴充時，可以快速理解「當時做到哪裡、為什麼停在這裡」。

---

## [v0.1.0] - 2026-01-03  
GitHub: https://github.com/MakiDevelop/2ch-core  
Tag: `v0.1.0`

### 🎯 定位
第一個「**可實際上線的匿名留言板核心**」，設計哲學明確對齊日本 2ch / 5ch：  
**線性結構、單層 reply、重文化而非結構。**

---

### ✨ 新增功能
- 匿名發文（POST /posts）
- Thread / Reply 機制（僅一層，2ch-style）
- 支援 `parentId` 作為回覆 thread 的唯一關聯
- GET /posts 取得最新 threads
- 基本 Guard：
  - 內容長度限制
  - 空內容阻擋
  - 依來源的 rate limit
- 真實來源 IP Hash：
  - 支援 `x-forwarded-for`
  - proxy / 雲端部署 ready
- REST API（Express）
- PostgreSQL persistence
- Docker 開發環境

---

### 🧠 重要設計決策（請勿輕易推翻）
- **不支援 reply 的 reply**
  - 所有回覆皆指向 thread
  - 使用 `>>123` 等文化性引用，而非資料結構
- 不做 recursive / tree query
- 不在 v0 強制驗證 parent 是否存在（對齊 2ch 行為）
- Guard 與 API / persistence 嚴格分層，方便未來替換為 Redis / AI

---

### 🧩 專案結構摘要
- `src/main.ts`：HTTP server 入口
- `src/agents/api`：API handlers
- `src/agents/guard`：輸入防線與 rate limit
- `src/agents/persistence`：PostgreSQL 存取
- `src/agents/realtime`：即時層預留
- `src/agents/domain`：業務層預留

---

### 🚫 刻意未做（留給未來）
- 多層巢狀回覆
- 搜尋 / 推薦 / 排序演算法
- Redis-based rate limit
- 前端 UI
- 認證 / 使用者系統

---

### 🔜 下一步方向（非承諾）
- v0.2：GET /posts/:id/replies
- v0.3：Redis rate limit
- v1.0：最小前端 + realtime

---

> 備註：  
> v0.1.0 是一個「乾淨的停損點」，代表系統已可運作、可上線、可長期演進。  
> 若未來設計方向與此版本衝突，請先回頭閱讀本檔案。