# 2ch.tw 故障排除指南

## 已知問題與解決方案

---

### 1. Nginx DNS 快取導致 API 回傳舊資料

**發生日期**: 2026-01-20

#### 症狀
- 網站顯示舊的貼文資料（例如顯示數天前的資料）
- 資料庫查詢顯示正確的新資料
- 從 nginx 容器內部直接呼叫 `http://api:3000` 回傳正確資料
- 但透過外部 HTTPS 存取回傳舊資料

#### 診斷方式

```bash
# 1. 檢查資料庫是否有最新資料
ssh root@2ch.tw "docker exec 2ch-core-postgres psql -U postgres -d 2ch -c \"SELECT id, title, created_at FROM posts WHERE parent_id IS NULL ORDER BY created_at DESC LIMIT 5;\""

# 2. 從 nginx 容器內部測試 API（應該回傳正確資料）
ssh root@2ch.tw "docker exec 2ch-core-nginx wget -qO- 'http://api:3000/boards/chat/threads?limit=2'"

# 3. 從外部測試 API（如果回傳舊資料，則確認是 nginx 問題）
curl -s -H 'Accept: application/json' 'https://2ch.tw/boards/chat/threads?limit=2'

# 4. 比較兩者的 threadCount 或資料時間戳
```

#### 根本原因
Nginx 在啟動時會解析 Docker 容器的 DNS 名稱（如 `api`）並快取 IP 位址。當 Docker 容器重啟後 IP 可能改變，但 nginx 仍使用舊的 IP，導致請求被路由到錯誤的端點或無回應。

#### 解決方案

```bash
# 重新載入 nginx 配置（會刷新 DNS 快取）
ssh root@2ch.tw "docker exec 2ch-core-nginx nginx -s reload"
```

#### 預防措施

1. **部署後必須 reload nginx**
   - 每次 API 容器重啟或重新部署後，都要執行 `nginx -s reload`
   - 已加入 CI/CD 流程（見 `.github/workflows/deploy.yml`）

2. **考慮加入 nginx resolver 設定**（未來優化）
   ```nginx
   # 在 nginx.conf 的 http block 加入
   resolver 127.0.0.11 valid=10s;  # Docker 內建 DNS
   ```
   這樣 nginx 會定期重新解析 DNS，而非永久快取。

3. **監控告警**
   - 建議加入 API 回應時間和資料新鮮度的監控
   - 當最新貼文時間超過異常閾值時發送告警

---

### 2. 前端 JS 快取導致功能異常

**發生日期**: 2026-01-20

#### 症狀
- 新功能部署後，使用者操作出現 `Internal Server Error`
- API 直接測試正常，但透過網頁操作失敗
- 清除瀏覽器快取後恢復正常

#### 根本原因
瀏覽器快取了舊版 JS 檔案，舊版程式碼無法處理新的 API 回應格式。

#### 解決方案

1. **更新 JS 版本號**
   - 修改 `public/js/board.js` 和 `public/js/thread.js` 中的 `APP_VERSION`
   - 修改 `public/board.html` 和 `public/thread.html` 中的 `?v=` 參數

2. **重新部署靜態檔案**
   ```bash
   ssh root@2ch.tw "cd /root/2ch-core && docker cp public/. 2ch-core-nginx:/var/www/html/"
   ```

#### 預防措施
- 每次修改前端 JS 時，同步更新版本號
- 版本號格式建議：`YYYYMMDD` 或 `YYYYMMDDx`（x 為當日序號）

---

### 3. Production vs Dev 資料庫混淆

#### 環境配置

| 環境 | 網址 | API 容器 | 資料庫 |
|------|------|----------|--------|
| Production | https://2ch.tw | `2ch-core-api` | `2ch` |
| Development | https://dev.2ch.tw | `2ch-core-api-dev` | `2ch_dev` |

#### 確認方式

```bash
# 檢查 production API 連接的資料庫
ssh root@2ch.tw "docker exec 2ch-core-api env | grep DATABASE"
# 應該顯示: DATABASE_URL=postgres://...@postgres:5432/2ch

# 檢查 dev API 連接的資料庫
ssh root@2ch.tw "docker exec 2ch-core-api-dev env | grep DATABASE"
# 應該顯示: DATABASE_URL=postgres://...@postgres:5432/2ch_dev

# 比較兩個資料庫的資料量
ssh root@2ch.tw "docker exec 2ch-core-postgres psql -U postgres -c \"SELECT 'production' as env, COUNT(*) FROM posts;\" -d 2ch && docker exec 2ch-core-postgres psql -U postgres -c \"SELECT 'development' as env, COUNT(*) FROM posts;\" -d 2ch_dev"
```

---

## 常用診斷指令

```bash
# 查看所有容器狀態
ssh root@2ch.tw "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# 查看 API 容器日誌
ssh root@2ch.tw "docker logs 2ch-core-api --tail 50"

# 查看 nginx 錯誤日誌
ssh root@2ch.tw "docker exec 2ch-core-nginx tail -50 /var/log/nginx/error.log"

# 測試 API 健康狀態
curl -s https://2ch.tw/health

# 查看最新貼文（台北時間）
ssh root@2ch.tw "docker exec 2ch-core-postgres psql -U postgres -d 2ch -c \"SELECT id, title, (created_at + INTERVAL '8 hours') as taipei_time FROM posts WHERE parent_id IS NULL ORDER BY created_at DESC LIMIT 5;\""
```

---

## 緊急聯絡

如遇無法自行解決的問題，請記錄：
1. 問題發生時間
2. 錯誤訊息或異常現象
3. 已嘗試的解決方案
4. 相關日誌截圖
