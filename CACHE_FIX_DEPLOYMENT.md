# 快取問題修復 - 部署指南

## 問題摘要
- 行動版瀏覽器無法載入討論列表
- 桌機版必須關閉 Network cache 才正常
- 根本原因：HTTP/瀏覽器快取導致舊或空 response 被重複使用

## 已修復的內容

### 1. Express API (src/main.ts)
**修改內容:**
- 禁用 ETag 生成 (`app.set('etag', false)`)
- 添加全域 no-cache middleware，為所有 API 響應添加：
  - `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`
  - `Pragma: no-cache`
  - `Expires: 0`
  - `Surrogate-Control: no-store`

**影響的端點:**
- GET /boards
- GET /boards/:slug/threads
- GET /posts
- GET /posts/:id
- GET /posts/:id/replies
- POST /boards/:slug/threads
- POST /posts/:id/replies
- 所有 admin API

### 2. Nginx 配置 (nginx/conf.d/2ch-ssl.conf.template)
**修改內容:**

**動態 HTML 頁面 (添加 no-cache headers):**
- `/` (index.html)
- `/board.html`
- `/thread.html`

**API 代理 (禁用 Nginx 快取):**
- `/boards/*` - 添加 `proxy_cache_bypass 1` 和 `proxy_no_cache 1`
- `/posts/*` - 添加 `proxy_cache_bypass 1` 和 `proxy_no_cache 1`
- `/admin/*` - 添加 `proxy_cache_bypass 1` 和 `proxy_no_cache 1`
- `@api` fallback - 添加 `proxy_cache_bypass 1` 和 `proxy_no_cache 1`

**保持快取的資源 (正確):**
- 靜態資源 (CSS, JS, images) - 1 年快取

## 部署步驟

### 準備階段
1. 確認已提交所有更改到 Git
2. 備份當前生產環境配置

### 部署到生產環境

```bash
# 1. SSH 到伺服器
ssh root@104.131.15.130

# 2. 進入應用目錄
cd /opt/2ch-core

# 3. 備份當前 Nginx 配置
cp nginx/conf.d/2ch.conf nginx/conf.d/2ch.conf.backup

# 4. 拉取最新代碼
git pull origin main
# 或者使用 rsync 從本地同步:
# (在本地機器執行)
# rsync -avz --exclude 'node_modules' --exclude '.git' \
#   /Users/maki/GitHub/2ch-core/ root@104.131.15.130:/opt/2ch-core/

# 5. 更新 Nginx 配置
# 如果伺服器正在使用 2ch-ssl.conf.template，需要複製到 2ch.conf
cp nginx/conf.d/2ch-ssl.conf.template nginx/conf.d/2ch.conf

# 6. 測試 Nginx 配置
docker compose -f docker-compose.deploy.yml exec nginx nginx -t

# 7. 重建並重啟服務
docker compose -f docker-compose.deploy.yml build api
docker compose -f docker-compose.deploy.yml up -d

# 8. 等待服務啟動
sleep 10

# 9. 驗證服務狀態
docker compose -f docker-compose.deploy.yml ps
docker compose -f docker-compose.deploy.yml logs api --tail=50
```

## 驗證修復

### 1. 驗證 API Headers
```bash
# 測試討論列表 API
curl -I https://2ch.tw/boards/chat/threads

# 應該看到:
# Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
# Pragma: no-cache
# Expires: 0
# (不應該有 ETag header)

# 測試討論串詳情 API
curl -I https://2ch.tw/posts/1

# 測試回覆列表 API
curl -I https://2ch.tw/posts/1/replies
```

### 2. 驗證動態 HTML Headers
```bash
# 測試首頁
curl -I https://2ch.tw/

# 測試板塊頁面
curl -I https://2ch.tw/board.html

# 測試討論串頁面
curl -I https://2ch.tw/thread.html

# 所有都應該有 no-cache headers
```

### 3. 驗證靜態資源 Headers (應該保持快取)
```bash
# 測試 CSS
curl -I https://2ch.tw/css/style.css

# 應該看到:
# Cache-Control: public, immutable
# Expires: (1年後的日期)
```

### 4. 行動裝置測試
- 用 iOS Safari 或 Android Chrome 訪問 https://2ch.tw/boards/chat/threads
- **不需要**使用無痕視窗
- **不需要**關閉 Network cache
- 應該能正常看到討論列表
- 重新整理後，數據應該即時更新

### 5. DevTools 驗證
1. 打開 Chrome DevTools > Network
2. 訪問 https://2ch.tw/boards/chat/threads
3. 查看 `threads` 請求
4. Status 應該是 `200` (不是 `304 Not Modified`)
5. Size 應該顯示實際大小 (不是 `(disk cache)` 或 `(memory cache)`)

## 潛在風險和注意事項

### 已識別的風險
1. **CDN 快取 (如果使用):**
   - 目前架構中沒有 CDN，但如果將來添加，需要：
   - 配置 CDN 尊重 `Cache-Control: no-store`
   - 或者在 CDN 層面排除動態 API 和 HTML 頁面

2. **Service Worker (如果存在):**
   - 當前網站沒有 Service Worker
   - 如果將來添加，需要確保不快取動態內容

3. **瀏覽器行為:**
   - 某些激進的行動瀏覽器可能仍會嘗試快取
   - `no-store` 是最強的指令，應該被所有現代瀏覽器尊重

### 效能影響
- **靜態資源:** 無影響，仍然快取 1 年
- **API 請求:** 每次都會發送到伺服器，但這是正確行為（確保數據即時性）
- **HTML 頁面:** 每次都會發送到伺服器，但 HTML 很小（5-6KB），影響可忽略

### 未來優化建議 (非緊急)
1. **條件式快取:** 將來可以考慮使用短期快取（如 5-10 秒）配合 ETag/Last-Modified
2. **API 響應壓縮:** 已啟用 gzip，繼續保持
3. **HTTP/2 Server Push:** 可以考慮推送關鍵 CSS/JS

## 回滾計畫

如果部署後出現問題：

```bash
# 1. 恢復舊的 Nginx 配置
cd /opt/2ch-core
cp nginx/conf.d/2ch.conf.backup nginx/conf.d/2ch.conf

# 2. 回滾到上一個版本 (如果使用 Git)
git log --oneline -5  # 查看最近提交
git checkout <previous-commit-hash>

# 3. 重建並重啟
docker compose -f docker-compose.deploy.yml build api
docker compose -f docker-compose.deploy.yml up -d

# 4. 重新載入 Nginx
docker compose -f docker-compose.deploy.yml exec nginx nginx -s reload
```

## 完成檢查清單

部署後請確認以下所有項目：

- [ ] API 端點返回正確的 no-cache headers
- [ ] API 端點不返回 ETag header
- [ ] 動態 HTML 頁面返回 no-cache headers
- [ ] 靜態資源 (CSS/JS) 仍然正確快取
- [ ] 行動裝置一般視窗可以正常訪問
- [ ] 重新整理後數據即時更新
- [ ] DevTools 顯示請求不命中快取
- [ ] 沒有 503 或其他錯誤
- [ ] 日誌中沒有異常錯誤

## 聯絡資訊
- 伺服器: 104.131.15.130
- 應用目錄: /opt/2ch-core
- 日誌: `docker compose -f docker-compose.deploy.yml logs -f`
