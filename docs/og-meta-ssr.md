# OG Meta SSR 實作筆記

**日期**: 2026-01-14

## 目標

讓每則貼文分享到社交平台（LINE、Facebook、X/Twitter）時，顯示正確的預覽標題和內文。

## 架構

```
瀏覽器/爬蟲 請求 /posts/:id
        ↓
    nginx proxy
        ↓
  threadPageMiddleware (API)
        ↓
  檢查 Accept header
        ↓
├─ Accept: application/json → 返回 JSON (給前端 JS)
└─ 其他 (瀏覽器/爬蟲) → 返回 SSR HTML (帶動態 OG meta)
```

## 關鍵檔案

| 檔案 | 用途 |
|------|------|
| `src/agents/api/threadPage.ts` | SSR middleware 和 handler |
| `src/main.ts` | 註冊 middleware（必須在 API routes 之前） |
| `nginx/conf.d/2ch.conf` | 移除 rewrite，讓 API 處理內容協商 |
| `public/thread.html` | HTML 模板（API 啟動時載入） |
| `public/js/thread.js` | 前端 JS |

## 實作重點

### 1. Middleware 判斷邏輯

```typescript
// 只有明確要求 JSON 才返回 JSON
const isApiRequest =
  accept.includes("application/json") ||
  req.xhr ||
  req.headers["x-requested-with"] === "XMLHttpRequest";

if (isApiRequest) {
  return next(); // 讓 API handler 處理
}

// 其他所有請求（瀏覽器、爬蟲）都返回 SSR HTML
```

**重要**: 不能用 `Accept: text/html` 判斷，因為爬蟲（Twitterbot、facebookexternalhit、LINE）通常發送 `Accept: */*` 或不發送。

### 2. 前端 fetch 必須加 Accept header

```javascript
fetch('/posts/' + id, {
  headers: { 'Accept': 'application/json' }
})
```

**包含位置**:
- `public/thread.html` 裡的 prefetch
- `public/js/thread.js` 裡的所有 fetch
- `public/js/board.js` 裡的所有 fetch

### 3. nginx 配置

移除 `/posts/:id` 的 rewrite 邏輯，讓所有請求都 proxy 到 API：

```nginx
location ~ ^/posts/(\d+)$ {
    proxy_pass http://api:3000;
    # ... 其他 proxy 設定
}
```

### 4. HTML 模板是啟動時載入

`threadPage.ts` 在模組載入時讀取 `public/thread.html`：

```typescript
const templatePath = path.join(process.cwd(), "public", "thread.html");
let templateHtml = fs.readFileSync(templatePath, "utf-8");
```

**注意**: 修改 `thread.html` 後必須 rebuild Docker image，restart 不夠。

## 部署步驟

```bash
# 1. 同步檔案到伺服器
rsync -avz src/agents/api/threadPage.ts root@SERVER:/opt/2ch-core/src/agents/api/
rsync -avz public/ root@SERVER:/opt/2ch-core/public/
rsync -avz nginx/conf.d/2ch.conf root@SERVER:/opt/2ch-core/nginx/conf.d/

# 2. Rebuild 並重啟 API（因為模板是啟動時載入）
ssh root@SERVER "cd /opt/2ch-core && \
  docker compose -f docker-compose.deploy.yml build api && \
  docker compose -f docker-compose.deploy.yml up -d --force-recreate --no-deps api"

# 3. Reload nginx（如果有改 nginx config）
ssh root@SERVER "cd /opt/2ch-core && \
  docker compose -f docker-compose.deploy.yml exec nginx nginx -s reload"
```

## 測試方法

```bash
# 測試爬蟲（應返回 HTML）
curl -s -A "Twitterbot/1.0" https://2ch.tw/posts/366 | grep "og:title"

# 測試 API（應返回 JSON）
curl -s -H "Accept: application/json" https://2ch.tw/posts/366 | head -c 100

# Facebook Debugger
https://developers.facebook.com/tools/debug/?q=https://2ch.tw/posts/366

# X/Twitter Card Validator
https://cards-dev.twitter.com/validator
```

## 踩過的坑

### 1. 爬蟲拿到 JSON 而不是 HTML
**原因**: 原本用 `Accept: text/html` 判斷，但爬蟲不發送這個 header
**解法**: 改成只判斷「是否明確要求 JSON」，其他都返回 HTML

### 2. 前端 JS 拿到 HTML 導致 JSON parse 失敗
**原因**: fetch 預設不發送 `Accept: application/json`
**解法**: 所有前端 fetch 都加上 `headers: { 'Accept': 'application/json' }`

### 3. 修改 thread.html 後沒生效
**原因**: API 容器啟動時載入模板，restart 不會重新載入
**解法**: 必須 `docker compose build api` 重建 image

### 4. nginx 的靜態檔案沒更新
**原因**: nginx mount 的是 host 的 `./public`，需要確保 rsync 到正確位置
**解法**: `rsync -avz public/ root@SERVER:/opt/2ch-core/public/`

## OG Meta 欄位

| 欄位 | 內容 |
|------|------|
| `og:title` | 貼文標題 + " - 2ch.tw" |
| `og:description` | 內文前 150 字 |
| `og:image` | 全站 og-image.jpg |
| `og:url` | 貼文完整 URL |
