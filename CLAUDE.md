# 2ch-core

匿名即時討論平台 — TypeScript + Express v5 + PostgreSQL + Redis + Docker。
部署於 VPS 2ch.tw（139.180.199.219），Production + Dev 雙環境。

## 繼承聲明

本專案繼承全域 `~/.claude/CLAUDE.md` 的所有規則，包括：
- 撞牆停手（兩次失敗必須停）
- 多代理分工（Codex review / Gemini 技術調查）
- 安全紅線（破壞性操作禁止）
- Git 規範（中文 commit、逐檔 stage）

以下為本專案特有的補充規則。

## 撞牆停手（專案特有情境）

除全域規則外，以下情境也視為撞牆：
- Docker build 連續兩次失敗且錯誤訊息相同
- PostgreSQL migration 失敗且 rollback 也失敗
- Nginx reverse proxy 設定改了兩次仍 502/504

撞牆後停手，整理問題說明，不得繼續改 code。

## 安全紅線

### 生產環境（最高優先）
- Production DB `2ch` 與 Dev DB `2ch_dev` 是分開的，**禁止跨 DB 操作**
- **禁止**對 production DB 執行未經 dev 環境驗證的 migration
- **禁止**在 production container 上直接修改程式碼（必須走 git pull + rebuild）
- Docker volume `2ch-core_postgres_data` **禁止刪除**（含所有用戶資料）

### 部署操作
- 部署目標：VPS 2ch.tw（139.180.199.219），`ssh 2ch`
- Production 部署視為 **YELLOW**，需確認 main branch 狀態
- DB migration 視為 **RED**，需 rollback plan
- Nginx reload 視為 **YELLOW**：`docker exec 2ch-core-nginx nginx -s reload`

### Credential 保護
- `.env` 含 DB 密碼、Redis 連線、API key，禁止 commit
- `SERVER_INFO.md`、`LINE_MESSAGING_API.md` 為敏感文件，不可 commit

## 開發規範（從事故中學到的教訓）

### async/await 規則（2026-02-02 事故）

**背景：** 將函數改為 async 但呼叫端沒加 await，導致發文功能故障 3 天。

**強制規則：**
1. **將函數改為 async 時，必須同時搜尋所有呼叫端並加上 await**
2. **修改共用函數後，必須測試所有使用該函數的流程**
3. TypeScript 不會警告「呼叫 async 函數但沒 await」，需人工檢查

**檢查方式：**
```bash
grep -r "functionName(" src/
```

**參考：** `docs/decision-log.md` 2026-02-02 條目

## 開發指令

```bash
# 本地開發
docker compose up -d          # 啟動 PostgreSQL + Redis
npm run dev                   # 啟動本地 server (localhost:3000)

# 測試
npm run test                  # Vitest
npm run test:watch            # 持續測試
npm run lint                  # ESLint
npm run typecheck             # TypeScript 型別檢查

# DB
npm run migrate               # 執行 migration
npx tsx scripts/seed-realistic-content.ts  # Seed 資料

# 部署 production（在 VPS 上）
cd /opt/2ch-core && git pull && docker compose -f docker-compose.deploy.yml up -d --build api

# 部署 dev（在 VPS 上）
cd /opt/2ch-core-dev && git pull && docker compose -f /opt/2ch-core/docker-compose.deploy.yml up -d --build api-dev

# 查看 logs
docker logs 2ch-core-api --tail 50
docker logs 2ch-core-api-dev --tail 50

# 重啟
cd /opt/2ch-core && docker compose -f docker-compose.deploy.yml restart api
```

## 技術棧

| 層 | 技術 |
|----|------|
| 語言 | TypeScript, Node.js 20 |
| 框架 | Express v5 |
| 資料庫 | PostgreSQL |
| 快取 | Redis (ioredis) |
| 驗證 | Zod |
| 測試 | Vitest |
| 容器 | Docker (multi-stage, Node 20-alpine) |
| 日誌 | Pino |

## 伺服器資訊

| 環境 | URL | Container | DB | Source |
|------|-----|-----------|-----|--------|
| Production | https://2ch.tw | 2ch-core-api | 2ch | /opt/2ch-core (main) |
| Development | https://dev.2ch.tw | 2ch-core-api-dev | 2ch_dev | /opt/2ch-core-dev (develop) |

共用：Nginx (`2ch-core-nginx`)、PostgreSQL (`2ch-core-postgres`)、Redis (`2ch-core-redis`)

## Git 分支

- `main` — Production (2ch.tw)
- `develop` — Development (dev.2ch.tw)

## 專案架構

```
src/
├── agents/
│   ├── api/         # REST endpoints
│   ├── guard/       # Anti-abuse, rate limiting
│   ├── persistence/ # PostgreSQL + Redis
│   ├── realtime/    # Realtime push
│   └── service/     # Badword, moderation
├── middleware/      # CSRF, error handling
├── config/          # Environment, badwords
└── utils/           # Logging, IP hash, rate limiter
```
