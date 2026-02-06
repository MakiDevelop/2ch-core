# 2ch.tw 系統架構

## 技術棧

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Database**: PostgreSQL（主資料庫）
- **Cache**: Redis（rate limiting、快取、重複偵測）
- **Logger**: pino（structured logging）
- **Testing**: Vitest

---

## 目錄結構

```
src/
├─ agents/                    # 核心業務邏輯
│  ├─ api/                    # HTTP Handler 層
│  │  ├─ admin.ts             # 管理後台 API（刪文、鎖文、badword 管理等）
│  │  ├─ posts.ts             # 發文、回文、編輯、搜尋
│  │  ├─ boards.ts            # 看板列表、看板討論串
│  │  ├─ sitemap.ts           # SEO: sitemap.xml, robots.txt
│  │  ├─ threadPage.ts        # SSR: 討論串頁面（OG meta）
│  │  ├─ boardPage.ts         # SSR: 看板頁面（OG meta）
│  │  └─ health.ts            # Health check
│  │
│  ├─ guard/                  # 輸入驗證與安全防護
│  │  ├─ postGuard.ts         # 發文驗證（長度、spam、embed 白名單）
│  │  ├─ adminGuard.ts        # Admin 認證（Bearer Token、timing-safe）
│  │  └─ contentGuard.ts      # 內容審核（badword 檢測、ReDoS 防護）
│  │
│  ├─ service/                # 業務服務層
│  │  ├─ moderationService.ts # 內容審核流程（掃描、審核佇列）
│  │  └─ badwordService.ts    # 關鍵字 CRUD
│  │
│  ├─ persistence/            # 資料存取層
│  │  ├─ postgres.ts          # PostgreSQL 操作（CRUD、audit log）
│  │  └─ redis.ts             # Redis 連線管理與健康檢查
│  │
│  ├─ domain/                 # Domain 模型（預留）
│  └─ realtime/               # 即時功能（預留，SSE/WebSocket）
│
├─ middleware/                # Express Middleware
│  ├─ csrfGuard.ts            # CSRF 防護（Origin/Referer 檢查）
│  └─ errorHandler.ts         # 全域錯誤處理（HttpError → JSON）
│
├─ config/                    # 設定
│  ├─ env.ts                  # 環境變數
│  └─ badwords.json           # 靜態 badword 設定
│
├─ utils/                     # 通用工具
│  ├─ errors.ts               # HttpError 類別體系（含 error code）
│  ├─ logger.ts               # Structured logger（pino）
│  ├─ ip.ts                   # IP Hash 工具
│  └─ rateLimiter.ts          # Rate limiting（Redis / in-memory fallback）
│
├─ types/                     # TypeScript 型別定義
├─ app.ts                     # Express app 設定與路由註冊
└─ main.ts                    # Server 啟動入口
```

---

## 請求流程

```
Client Request
  → nginx（SSL、CSP headers、靜態檔）
    → Express app.ts
      → Cache-Control middleware
      → bodyParser.json()
      → csrfGuard（攔截非法 Origin）
      → SSR middleware（threadPage / boardPage）
      → Route Handler（api/*.ts）
        → Guard 驗證（guard/*.ts）
        → Service 邏輯（service/*.ts）
        → Persistence 操作（persistence/*.ts）
      → errorHandler（統一錯誤回應）
```

---

## 安全機制

| 機制 | 實作位置 | 說明 |
|------|----------|------|
| CSRF 防護 | `middleware/csrfGuard.ts` | Origin/Referer 白名單，Bearer Token 跳過 |
| CSP | nginx `.inc` snippets | 公開頁面禁止 inline script，admin 允許 |
| Admin 認證 | `guard/adminGuard.ts` | Bearer Token + timing-safe comparison |
| Embed 白名單 | `guard/postGuard.ts` | `<yt>` 限 YouTube，`<iu>` 限常見圖床 |
| 內容審核 | `guard/contentGuard.ts` | badword 檢測 + ReDoS 防護（safe-regex） |
| Rate Limiting | `utils/rateLimiter.ts` | Redis / in-memory fallback |
| Audit Log | `persistence/postgres.ts` | moderation_logs 表，記錄所有管理操作 |

---

## Health Check

- `GET /health` — Liveness probe（永遠回 200）
- `GET /health/ready` — Readiness probe（檢查 DB + Redis 連線）

---

## 設計原則

1. **Guard → Service → Persistence 分層**：API handler 不直接操作 DB
2. **Redis 可選**：所有 Redis 依賴有 in-memory fallback
3. **Audit 完整**：所有管理操作（刪文、鎖文、badword CRUD）寫入 moderation_logs
4. **Error Code 體系**：HttpError 支援 `code` 欄位，方便前端判斷
5. **Structured Logging**：pino，支援 JSON 格式輸出
