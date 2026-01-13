# 立即手動部署指南

## 問題確認
生產環境目前**還沒有**應用快取修復，headers 仍然是舊的：
- ❌ 仍有 ETag
- ❌ 沒有 Cache-Control: no-cache

## 需要部署的檔案

### 1. src/main.ts
需要替換整個檔案，關鍵修改：
```typescript
// 在 const app = express(); 之後添加：

// middleware: disable ETag
app.set('etag', false);

// middleware: set no-cache headers for all dynamic content
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});
```

### 2. nginx/conf.d/2ch-ssl.conf.template
替換為本地的 `/Users/maki/GitHub/2ch-core/nginx/conf.d/2ch-ssl.conf.template`

## 快速部署步驟（選擇方式一或方式二）

---

## 方式一：使用 scp 上傳（推薦）

```bash
# 在本地終端執行：

# 1. 上傳 main.ts
scp /Users/maki/GitHub/2ch-core/src/main.ts root@104.131.15.130:/opt/2ch-core/src/main.ts

# 2. 上傳 nginx 配置
scp /Users/maki/GitHub/2ch-core/nginx/conf.d/2ch-ssl.conf.template root@104.131.15.130:/opt/2ch-core/nginx/conf.d/2ch-ssl.conf.template

# 3. 上傳部署腳本
scp /Users/maki/GitHub/2ch-core/scripts/fix-cache.sh root@104.131.15.130:/opt/2ch-core/scripts/fix-cache.sh

# 4. SSH 到伺服器執行部署
ssh root@104.131.15.130 "cd /opt/2ch-core && chmod +x scripts/fix-cache.sh && bash scripts/fix-cache.sh"
```

---

## 方式二：手動 SSH 操作

```bash
# 1. SSH 到伺服器
ssh root@104.131.15.130

# 2. 進入目錄
cd /opt/2ch-core

# 3. 備份舊配置
cp nginx/conf.d/2ch.conf nginx/conf.d/2ch.conf.backup.$(date +%Y%m%d_%H%M%S)

# 4. 編輯 src/main.ts
nano src/main.ts

# 在 const app = express(); 後面，在 app.use(bodyParser.json()); 前面添加：

app.set('etag', false);

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

# 按 Ctrl+O 儲存，Ctrl+X 離開

# 5. 更新 Nginx 配置
cp nginx/conf.d/2ch-ssl.conf.template nginx/conf.d/2ch.conf

# 6. 測試 Nginx 配置
docker compose -f docker-compose.deploy.yml exec nginx nginx -t

# 7. 重建 API 容器
docker compose -f docker-compose.deploy.yml build api

# 8. 重啟所有服務
docker compose -f docker-compose.deploy.yml up -d

# 9. 等待服務啟動
sleep 15

# 10. 檢查服務狀態
docker compose -f docker-compose.deploy.yml ps
docker compose -f docker-compose.deploy.yml logs api --tail=30
```

---

## 方式三：使用 Git pull（如果已設置 Git）

```bash
# 1. SSH 到伺服器
ssh root@104.131.15.130

# 2. 進入目錄
cd /opt/2ch-core

# 3. 拉取最新代碼
git pull origin main

# 4. 執行部署腳本
chmod +x scripts/fix-cache.sh
bash scripts/fix-cache.sh
```

---

## 驗證部署成功

### 立即檢查 Headers：
```bash
# 檢查 API
curl -I https://2ch.tw/boards/chat/threads

# 應該看到：
# cache-control: no-store, no-cache, must-revalidate, proxy-revalidate
# pragma: no-cache
# expires: 0
# (沒有 etag)

# 檢查 HTML
curl -I https://2ch.tw/board.html

# 應該看到：
# cache-control: no-store, no-cache, must-revalidate, proxy-revalidate
# pragma: no-cache
# expires: 0
```

### 瀏覽器測試：
1. **打開 Safari DevTools** (選項 + Cmd + I)
2. 切換到 **Network** 標籤
3. **勾選 "Disable Caches"**（確保看到真實 headers）
4. 訪問 `https://2ch.tw/boards/chat/threads`
5. 查看 `threads` 請求的 Response Headers
6. 應該看到 `cache-control: no-store, no-cache`

### 清除瀏覽器快取（僅此一次）：
部署完成後，用戶可能需要**清除一次舊快取**：

**Safari:**
1. Safari > 設定 > 隱私權
2. 點擊「管理網站資料」
3. 搜尋 `2ch.tw`
4. 點擊「移除」
5. 或者直接：**Option + Command + E**（清除快取）

**Chrome:**
1. Chrome > 設定 > 隱私權與安全性
2. 清除瀏覽資料
3. 選擇「快取的圖片和檔案」
4. 時間範圍選「不限時間」
5. 點擊「清除資料」
6. 或者直接：**Shift + Command + Delete**

**重要：**
- 只需要清除**一次**
- 之後新的 no-cache headers 會生效
- 用戶不需要再次清除快取

---

## 如果遇到問題

### API 容器啟動失敗：
```bash
# 查看錯誤日誌
docker compose -f docker-compose.deploy.yml logs api --tail=100

# 常見問題：TypeScript 語法錯誤
# 解決：檢查 src/main.ts 的語法是否正確
```

### Nginx 配置測試失敗：
```bash
# 恢復備份
cp nginx/conf.d/2ch.conf.backup.* nginx/conf.d/2ch.conf

# 重新載入 Nginx
docker compose -f docker-compose.deploy.yml exec nginx nginx -s reload
```

### 快速回滾：
```bash
cd /opt/2ch-core
git checkout HEAD~1  # 回到上一個版本
docker compose -f docker-compose.deploy.yml build api
docker compose -f docker-compose.deploy.yml up -d
```

---

## 預期結果

部署成功後：
- ✅ Safari/Chrome **不需要**無痕視窗
- ✅ Safari/Chrome **不需要**關閉 Network cache
- ✅ 行動裝置可以正常訪問
- ✅ 重新整理後立即看到最新資料
- ✅ DevTools 不顯示 `(disk cache)` 或 `(memory cache)`

---

## 部署後續

完成部署並驗證成功後，**強烈建議**在網站上添加一個通知：

```
【系統更新通知】
我們修復了快取問題。如果您仍看到舊資料，請：
Safari: Option + Cmd + E 清除快取
Chrome: Shift + Cmd + Delete 清除快取
清除一次後即可正常使用，感謝配合。
```

這個通知可以在 1-2 天後移除。
