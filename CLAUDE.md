# 2ch-core 專案資訊

## 伺服器資訊

- **IP**: 139.180.199.219
- **SSH**: `ssh root@139.180.199.219` (使用 SSH Key)
- **專案路徑**: `/opt/2ch-core` (production), `/opt/2ch-core-dev` (dev source)

## 環境架構

### Production (2ch.tw)
- **URL**: https://2ch.tw
- **Container**: `2ch-core-api`
- **Static files**: `/opt/2ch-core/public`
- **Database**: `2ch` (主資料庫)
- **Compose file**: `docker-compose.deploy.yml`

### Development (dev.2ch.tw)
- **URL**: https://dev.2ch.tw
- **Container**: `2ch-core-api-dev`
- **Static files**: `/opt/2ch-core/public-dev`
- **Database**: `2ch_dev` (獨立開發資料庫，由 `DATABASE_URL_DEV` 設定)
- **Source**: `/opt/2ch-core-dev` (develop branch)

### 共用服務
- **Nginx**: `2ch-core-nginx` - 反向代理，處理 SSL
- **PostgreSQL**: `2ch-core-postgres` - 包含 `2ch` 和 `2ch_dev` 兩個資料庫
- **Redis**: `2ch-core-redis` - 快取

## 常用指令

```bash
# SSH 連線
ssh root@139.180.199.219

# 查看 container 狀態
docker ps --format 'table {{.Names}}\t{{.Status}}'

# 查看 logs
docker logs 2ch-core-api --tail 50
docker logs 2ch-core-api-dev --tail 50

# 重啟服務
cd /opt/2ch-core
docker compose -f docker-compose.deploy.yml restart api
docker compose -f docker-compose.deploy.yml restart api-dev

# 重新載入 nginx
docker exec 2ch-core-nginx nginx -s reload

# 部署 production (從 main branch)
cd /opt/2ch-core && git pull && docker compose -f docker-compose.deploy.yml up -d --build api

# 部署 dev (從 develop branch)
cd /opt/2ch-core-dev && git pull && docker compose -f /opt/2ch-core/docker-compose.deploy.yml up -d --build api-dev
```

## 本地開發

```bash
# 啟動本地 dev 環境
docker compose up -d

# 本地 API
http://localhost:3000

# 執行 seed
npx tsx scripts/seed-realistic-content.ts
```

## 資料庫

- Production DB 和 Dev DB 是分開的
- 本地開發使用獨立的 Docker volume (`2ch-core_postgres_data`)
- 如果本地 DB 密碼錯誤，重建 volume: `docker volume rm 2ch-core_postgres_data`

## Git 分支

- `main` - Production (2ch.tw)
- `develop` - Development (dev.2ch.tw)
