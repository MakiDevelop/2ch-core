# 2ch.tw 生產環境部署指南

本指南說明如何將 2ch.tw 部署到 Vultr VPS。

## 📋 前置需求

- Vultr VPS (Ubuntu 22.04 或更新版本)
- 域名: 2ch.tw
- SSH 訪問權限

### 服務器規格建議

- **最低**: 1 CPU, 2GB RAM, 50GB SSD
- **建議**: 2 CPU, 4GB RAM, 80GB SSD

## 🚀 快速部署步驟

### 1. 設定 DNS

在你的域名服務商設定 DNS A 記錄：

```
A    2ch.tw       139.180.199.219
A    www.2ch.tw   139.180.199.219
```

等待 DNS 傳播（可能需要 5-30 分鐘）。

驗證 DNS：
```bash
dig 2ch.tw +short
# 應該顯示: 139.180.199.219
```

### 2. 連接到服務器

```bash
ssh root@139.180.199.219
```

### 3. 上傳代碼到服務器

從本地電腦執行：

```bash
# 方式 1: 使用 rsync (推薦)
rsync -avz --exclude 'node_modules' --exclude '.git' \
  -e ssh . root@139.180.199.219:/opt/2ch-core/

# 方式 2: 使用 scp
tar czf 2ch-core.tar.gz --exclude 'node_modules' --exclude '.git' .
scp 2ch-core.tar.gz root@139.180.199.219:/opt/
ssh root@139.180.199.219 "cd /opt && tar xzf 2ch-core.tar.gz && mv 2ch-core-* 2ch-core"
```

### 4. 運行部署腳本

在服務器上執行：

```bash
cd /opt/2ch-core
chmod +x scripts/deploy.sh
sudo ./scripts/deploy.sh
```

部署腳本會自動執行：
- ✅ 安裝 Docker 和 Docker Compose
- ✅ 設定防火牆
- ✅ 複製環境變量文件
- ✅ 構建和啟動容器
- ✅ 初始化數據庫
- ✅ 設定 SSL 證書（可選）

### 5. 驗證部署

檢查服務狀態：
```bash
cd /opt/2ch-core
docker compose -f docker-compose.deploy.yml ps
```

所有服務應該顯示為 `healthy` 或 `running`。

測試 API：
```bash
# HTTP (初始)
curl http://2ch.tw/health

# HTTPS (SSL 設定後)
curl https://2ch.tw/health
```

預期響應：
```json
{"status":"ok","timestamp":"2026-01-13T..."}
```

## 🔧 手動部署步驟（可選）

如果自動部署腳本遇到問題，可以手動執行以下步驟：

### 步驟 1: 安裝 Docker

```bash
# 更新系統
apt-get update && apt-get upgrade -y

# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 驗證安裝
docker --version
docker compose version
```

### 步驟 2: 設定防火牆

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

### 步驟 3: 準備應用

```bash
cd /opt/2ch-core

# 複製環境變量
cp .env.prod .env

# 編輯如有需要
nano .env
```

### 步驟 4: 啟動服務

```bash
# 構建鏡像
docker compose -f docker-compose.deploy.yml build

# 啟動服務
docker compose -f docker-compose.deploy.yml up -d

# 查看日誌
docker compose -f docker-compose.deploy.yml logs -f
```

### 步驟 5: 初始化數據庫

```bash
# 等待數據庫就緒
sleep 10

# 運行遷移
docker compose -f docker-compose.deploy.yml exec api npx tsx db/migrate.ts
```

### 步驟 6: 設定 SSL（Let's Encrypt）

確保 DNS 已正確設定並傳播後：

```bash
# 申請證書
docker compose -f docker-compose.deploy.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@2ch.tw \
  --agree-tos \
  --no-eff-email \
  -d 2ch.tw \
  -d www.2ch.tw

# 更新 Nginx 配置
cp nginx/conf.d/2ch-ssl.conf.template nginx/conf.d/2ch.conf

# 重載 Nginx
docker compose -f docker-compose.deploy.yml exec nginx nginx -s reload
```

## 🔐 設定管理員權限

1. 創建測試帖子獲取你的 IP Hash：

```bash
curl -X POST https://2ch.tw/posts \
  -H 'Content-Type: application/json' \
  -d '{"content":"test"}'
```

2. 從響應中複製 `ipHash` 值

3. 更新 `.env` 文件：

```bash
cd /opt/2ch-core
nano .env
# 設定: ADMIN_IP_HASHES=你的_ip_hash
```

4. 重啟 API 服務：

```bash
docker compose -f docker-compose.deploy.yml restart api
```

## 📊 運維命令

### 查看服務狀態

```bash
cd /opt/2ch-core
docker compose -f docker-compose.deploy.yml ps
```

### 查看日誌

```bash
# 所有服務
docker compose -f docker-compose.deploy.yml logs -f

# 特定服務
docker compose -f docker-compose.deploy.yml logs -f api
docker compose -f docker-compose.deploy.yml logs -f nginx
docker compose -f docker-compose.deploy.yml logs -f postgres
```

### 重啟服務

```bash
# 重啟所有服務
docker compose -f docker-compose.deploy.yml restart

# 重啟特定服務
docker compose -f docker-compose.deploy.yml restart api
```

### 更新應用

```bash
cd /opt/2ch-core

# 拉取新代碼 (或使用 rsync 從本地上傳)
git pull  # 如果使用 git

# 重新構建和重啟
docker compose -f docker-compose.deploy.yml up -d --build
```

### 備份數據庫

```bash
cd /opt/2ch-core

# 創建備份
docker compose -f docker-compose.deploy.yml exec postgres \
  pg_dump -U postgres 2ch | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# 或使用腳本
./scripts/docker-manage.sh backup
```

### 恢復數據庫

```bash
cd /opt/2ch-core

# 從備份恢復
gunzip < backup_20260113_120000.sql.gz | \
  docker compose -f docker-compose.deploy.yml exec -T postgres \
  psql -U postgres 2ch
```

### SSL 證書更新

證書會自動續期（certbot 容器每 12 小時檢查一次）。

手動更新：
```bash
docker compose -f docker-compose.deploy.yml run --rm certbot renew
docker compose -f docker-compose.deploy.yml exec nginx nginx -s reload
```

## 🐛 故障排查

### 服務無法啟動

```bash
# 檢查容器狀態
docker compose -f docker-compose.deploy.yml ps

# 查看錯誤日誌
docker compose -f docker-compose.deploy.yml logs api
docker compose -f docker-compose.deploy.yml logs postgres
```

### 無法訪問網站

1. 檢查防火牆：
```bash
ufw status
```

2. 檢查 Nginx：
```bash
docker compose -f docker-compose.deploy.yml logs nginx
```

3. 測試 Nginx 配置：
```bash
docker compose -f docker-compose.deploy.yml exec nginx nginx -t
```

### SSL 證書問題

1. 確認 DNS 解析正確：
```bash
dig 2ch.tw +short
```

2. 檢查證書狀態：
```bash
docker compose -f docker-compose.deploy.yml run --rm certbot certificates
```

3. 查看 certbot 日誌：
```bash
docker compose -f docker-compose.deploy.yml logs certbot
```

### 數據庫連接問題

1. 檢查數據庫是否運行：
```bash
docker compose -f docker-compose.deploy.yml exec postgres pg_isready
```

2. 檢查環境變量：
```bash
cd /opt/2ch-core
cat .env | grep DATABASE_URL
```

3. 測試連接：
```bash
docker compose -f docker-compose.deploy.yml exec postgres \
  psql -U postgres -d 2ch -c "SELECT 1;"
```

## 📈 監控建議

### 基本監控

```bash
# CPU 和內存使用
docker stats

# 磁盤使用
df -h
```

### 日誌監控

```bash
# 實時監控 API 日誌
docker compose -f docker-compose.deploy.yml logs -f api | grep ERROR

# 監控 Nginx 訪問日誌
docker compose -f docker-compose.deploy.yml exec nginx tail -f /var/log/nginx/access.log
```

## 🔒 安全建議

1. **定期更新系統和 Docker**
```bash
apt-get update && apt-get upgrade -y
```

2. **設定 fail2ban 防止暴力攻擊**
```bash
apt-get install -y fail2ban
systemctl enable fail2ban
```

3. **定期備份數據**
```bash
# 設定 cron job 自動備份
crontab -e
# 添加: 0 2 * * * cd /opt/2ch-core && ./scripts/docker-manage.sh backup
```

4. **監控磁盤空間**
```bash
# 定期清理 Docker 未使用的資源
docker system prune -a --volumes -f
```

5. **使用強密碼**
確保 `.env` 中的密碼足夠強（已設定）

## 📞 支援

- 查看項目文檔：`README.md`, `ARCHITECTURE.md`
- 查看開發日誌：`docs/DEV_LOG_20260110.md`
- Docker 文檔：`DOCKER.md`

## 🎉 部署完成

部署成功後，你的 2ch.tw 應該可以通過以下方式訪問：

- **主站**: https://2ch.tw
- **API 文檔**: https://2ch.tw/health
- **板塊列表**: https://2ch.tw/boards

開始使用你的匿名討論版吧！
