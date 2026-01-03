# 2ch-core

2ch-core 是 2ch.tw 的核心後端服務，負責匿名即時討論平台的主要業務邏輯與系統能力。  
本專案刻意對齊日本 2ch / 5ch 的設計哲學：**簡單、線性、耐用**，以「可實際上線並長期演進」為第一優先。

這不是範例專案，也不是技術展示用 repo，而是一個已可實際運作的匿名留言板核心。

---

## 專案定位

- 匿名即時討論平台後端核心
- 高雜訊使用者輸入的防禦與正規化
- 2ch-style thread / reply（僅一層回覆）
- 可演進的防濫用與治理機制

---

## 設計哲學（重要）

- **只支援一層 reply，不支援 reply 的 reply**
- 系統不追蹤「回誰」，引用交由文化（例如 `>>123`）
- 資料模型以「線性 + 穩定」為優先，而非巢狀結構
- 寧願簡單耐用，也不提早為未來過度設計

---

## 目前功能（v0.1）

- 匿名發文（Thread / Reply）
- Thread + one-level replies（2ch 正統模式）
- 基本 Guard（長度限制、rate limit）
- 真實來源 IP Hash（proxy-ready）
- REST API（Express）
- PostgreSQL persistence
- Docker 開發環境

---

## 技術主線

### 語言
- **TypeScript（主線）**：所有同步請求與核心邏輯
- Python（未來）：僅用於非同步或批次任務，不進主請求路徑

### 基礎設施
- Runtime：Node.js
- Database：PostgreSQL
- Cache / Realtime（規劃）：Redis
- Container：Docker

---

## 架構概念

專案採用「責任明確分層」的 Agent-based 結構，但不追求形式上的複雜度。

- API：HTTP 介面與請求協調
- Guard：防濫用、限流、輸入正規化
- Persistence：資料存取
- Realtime（預留）：即時推播
- Domain（預留）：業務規則

---

## API 概覽

### POST /posts
建立主貼或回覆。

```json
{
  "content": "Hello world",
  "parentId": 1
}
```

- `parentId` 為選填
- 不提供即時驗證 parent 是否存在（對齊 2ch 行為）

---

### GET /posts
取得最新主貼（threads）。

```json
{
  "items": [
    {
      "id": 1,
      "content": "Thread",
      "parentId": null
    }
  ]
}
```

---

## 開發與啟動

```bash
npm install
docker compose up -d
npx tsx src/main.ts
```

---

## 專案階段

- **v0.1**：單一服務、可實際上線（目前）
- v1：引入 Redis 強化保護與即時能力
- v1.5：非同步 Worker（Python）
- v2：依需求拆分為多服務

---

## 開發原則

1. 先能跑、再變好
2. 架構服務於產品，而非炫技
3. 主請求路徑保持單一心智模型
4. 所有設計皆可被替換與演進

---

## 授權

尚未決定授權方式，暫不開放使用或散佈。