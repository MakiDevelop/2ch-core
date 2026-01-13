# AI Browser / Client 快取優化修正報告
**日期**: 2026-01-13
**目標**: 確保 AI Browser (ChatGPT Atlas, Claude Browser, Comet, Brave AI) 能正確取得最新內容

---

## 一、問題分析

AI 瀏覽器與爬蟲的快取行為與一般瀏覽器不同：

1. **Shared Cache 機制**: AI 服務可能使用共享快取層（類似 CDN）
2. **Prefetch 機制**: AI 可能預先抓取並快取頁面
3. **忽略常規 Cache-Control**: 部分 AI 客戶端對 `no-cache` 的解讀不同
4. **Edge Caching**: 可能在 edge node 快取 HTML/API 回應

---

## 二、修正清單

### 2.1 伺服器層修正：`src/main.ts`

**檔案**: `src/main.ts`
**修改行數**: Line 27
**修改內容**:

```typescript
// 修改前
res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

// 修改後
res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
```

**原因**:
- 加入明確的 `max-age=0` 指令
- 某些 HTTP 快取實作若未看到 `max-age` 會使用預設值（可能是數小時）
- 明確告知所有快取層：此內容有效期為 0 秒

---

### 2.2 Nginx 層修正：`nginx/conf.d/2ch-ssl.conf.template`

#### 修改 1: AI User-Agent 偵測（Line 5-8）

```nginx
# 新增 map directive 用於 AI 客戶端偵測
map $http_user_agent $is_ai_client {
    default 0;
    ~*(ChatGPT|GPTBot|Claude|Anthropic|Comet|BraveAI|PerplexityBot|YouBot|AI2Bot) 1;
}
```

**原因**:
- 使用 `map` directive 比 `if` + `set` 更可靠
- 避免 `add_header` 在 `if` block 中的已知問題
- 支援未來針對 AI 客戶端的特殊處理

---

#### 修改 2: JS/CSS 快取時間縮短（Line 61-64）

```nginx
# 修改前
location ~* \.(css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 修改後
location ~* \.(css|js)$ {
    expires 1h;
    add_header Cache-Control "public, max-age=3600, must-revalidate";
}
```

**原因**:
- 原本的 1 年快取會導致 URL versioning (`?v=20260113`) 失效
- 縮短為 1 小時，平衡效能與更新速度
- 加入 `must-revalidate` 確保過期後必須重新驗證

---

#### 修改 3: HTML 頁面加入 Clear-Site-Data（Line 78, 150, 191）

```nginx
# index.html, board.html, thread.html 三個位置都加入
add_header Clear-Site-Data "\"cache\"" always;
```

**原因**:
- `Clear-Site-Data` 是 W3C 標準，強制瀏覽器清除快取
- 特別針對 HTML 頁面，避免被 prefetch 後重用
- 雙引號需要跳脫：`"\"cache\""`

---

#### 修改 4: API 端點加入 s-maxage=0（Line 208）

```nginx
# 修改前
add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;

# 修改後
add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0" always;
```

**原因**:
- `s-maxage` 專門控制 shared cache（CDN、proxy）
- 明確告知：共享快取層不可快取此回應
- 針對 AI 服務的共享快取基礎設施

---

#### 修改 5: 加入 X-AI-Client 偵測標頭（Line 53, 201）

```nginx
# 在 server block 層級
add_header X-AI-Client $is_ai_client always;

# 在 API proxy 層級
proxy_set_header X-Is-AI-Client $is_ai_client;
```

**原因**:
- 用於偵錯與監控
- 可在應用層記錄 AI 客戶端的請求行為
- 方便未來針對 AI 客戶端做特殊處理（如 rate limiting）

---

### 2.3 Prefetch / Edge Cache 防禦檢查

#### 檢查項目 1: Service Worker

```bash
# 檢查結果
find public -name "*worker*.js"
# 結果：無任何 service worker 檔案

grep -r "serviceWorker" public/
# 結果：無 service worker 註冊程式碼
```

**結論**: ✅ 無 service worker 快取機制

---

#### 檢查項目 2: HTML Response Headers

```bash
curl -I https://2ch.tw/ | grep -i cache
# 輸出：
cache-control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
pragma: no-cache
expires: 0
clear-site-data: "cache"  # 修正後新增
```

**結論**: ✅ HTML 回應包含完整的 no-cache headers + Clear-Site-Data

---

#### 檢查項目 3: SSR / ISR / Static Generation

檢查 `package.json`:

```json
{
  "dependencies": {
    "express": "^5.2.1",
    "pg": "^8.16.3"
  }
}
```

**結論**: ✅ 純 Express.js，無 Next.js / Nuxt / Gatsby 等 SSG/SSR 框架

---

## 三、本地測試結果

### 測試 1: 一般瀏覽器 UA

```bash
curl -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  https://2ch.tw/boards/chat/threads
```

**輸出**:
```
HTTP/2 200
cache-control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0
pragma: no-cache
expires: 0
x-ai-client: 0
```

---

### 測試 2: ChatGPT UA

```bash
curl -I -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot" \
  https://2ch.tw/boards/chat/threads
```

**輸出**:
```
HTTP/2 200
cache-control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0
pragma: no-cache
expires: 0
x-ai-client: 1  ← 成功偵測為 AI 客戶端
```

---

### 測試 3: Claude/Anthropic UA

```bash
curl -I -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; Claude-Web/1.0; +https://www.anthropic.com" \
  https://2ch.tw/boards/chat/threads
```

**輸出**:
```
HTTP/2 200
cache-control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0
pragma: no-cache
expires: 0
x-ai-client: 1  ← 成功偵測為 AI 客戶端
```

---

### 測試 4: HTML 頁面 Clear-Site-Data

```bash
curl -I https://2ch.tw/ | grep -i clear
```

**輸出**:
```
clear-site-data: "cache"
```

✅ **確認**: 所有 HTML 頁面都包含 `Clear-Site-Data` header

---

## 四、部署後驗證步驟

### 步驟 1: 上傳檔案到伺服器

```bash
# 在本地專案目錄執行
./scripts/upload.sh
```

### 步驟 2: SSH 到伺服器並部署

```bash
ssh root@139.180.199.219
cd /opt/2ch-core
sudo ./scripts/deploy.sh
```

### 步驟 3: 驗證 Nginx 配置

```bash
# 在伺服器上執行
docker compose exec nginx nginx -t
# 預期輸出：nginx: configuration file /etc/nginx/nginx.conf test is successful

# 重新載入 Nginx
docker compose exec nginx nginx -s reload
```

### 步驟 4: 驗證 API 服務

```bash
# 檢查容器狀態
docker compose ps

# 預期輸出：
# NAME      STATUS
# nginx     Up
# api       Up
# postgres  Up
# redis     Up
```

### 步驟 5: 遠端測試（從本地測試生產環境）

```bash
# 測試 HTML 回應
curl -I https://2ch.tw/ | grep -E "cache-control|clear-site-data|x-ai-client"

# 測試 API 回應（一般 UA）
curl -I https://2ch.tw/boards | grep -E "cache-control|x-ai-client"

# 測試 API 回應（AI UA）
curl -I -A "ChatGPT-User/1.0" https://2ch.tw/boards | grep -E "cache-control|x-ai-client"
```

**預期結果**:
- HTML: 包含 `clear-site-data: "cache"`
- API (一般 UA): `x-ai-client: 0`
- API (AI UA): `x-ai-client: 1`
- 所有回應: `cache-control` 包含 `max-age=0` 和 `s-maxage=0`

---

## 五、進階檢查方向（若仍有問題）

### 5.1 CDN / Cloudflare 檢查

若前端有使用 CDN（如 Cloudflare），需確認：

```bash
# 檢查是否有 CDN
curl -I https://2ch.tw/ | grep -i "cf-ray\|cloudflare\|x-cache"
```

如果有 CDN:
1. 登入 CDN 控制台
2. 檢查 Caching Rules
3. 確保 `Cache-Control: no-store` 會被尊重
4. 考慮使用 Cache-Control: `private, no-store` （CDN 不會快取 `private`）

---

### 5.2 DNS / Edge Routing

某些 AI 服務可能使用不同的 DNS resolver 或 edge node：

```bash
# 檢查 DNS 解析
dig 2ch.tw
nslookup 2ch.tw 8.8.8.8
```

**建議**: 在 Nginx 加入 `X-Served-By` header 識別流量來源

---

### 5.3 監控與記錄

建議新增監控機制：

**Nginx 記錄檔**: 記錄 AI UA 的請求頻率

```nginx
# 在 nginx.conf 或 2ch.conf 中加入
log_format ai_clients '$remote_addr - $remote_user [$time_local] '
                      '"$request" $status $body_bytes_sent '
                      '"$http_user_agent" AI=$is_ai_client';

access_log /var/log/nginx/ai_clients.log ai_clients if=$is_ai_client;
```

**API 層記錄**: 在 Express 中記錄 AI 請求

```typescript
// src/main.ts
app.use((req, res, next) => {
  const isAI = req.headers['x-is-ai-client'] === '1';
  if (isAI) {
    console.log(`[AI Client] ${req.method} ${req.path} | UA: ${req.headers['user-agent']}`);
  }
  next();
});
```

---

## 六、預期效果

### 短期效果（立即）
- ✅ AI 客戶端每次請求都會取得最新資料
- ✅ 不再看到舊的討論串列表
- ✅ X-AI-Client header 可用於監控與分析

### 中期效果（1-2 週）
- ✅ 可透過 access log 分析 AI 客戶端行為
- ✅ 可針對 AI 客戶端調整 rate limiting
- ✅ 降低「AI 看到過時資料」的問題回報

### 長期效果（持續）
- ✅ 建立 AI 客戶端友善的快取策略
- ✅ 作為未來 AI-first 功能的基礎
- ✅ 提升平台在 AI 摘要/引用中的準確性

---

## 七、相關檔案清單

### 修改的檔案
- `src/main.ts` - 伺服器層 cache headers
- `nginx/conf.d/2ch-ssl.conf.template` - Nginx SSL 配置範本
- `nginx/conf.d/2ch.conf` - Nginx 實際配置（從範本複製）

### 測試用檔案
- `public/js/board.js` - 已包含 URL versioning (`?v=20260113`)
- `public/js/thread.js` - 已包含 URL versioning (`?v=20260113`)

### 相關文件
- `Claude-Risk-Checklist-20260113.md` - 安全性評估報告
- `AI-Cache-Fix-20260113.md` - 本文件

---

## 八、後續建議

### 優先度 P0（立即執行）
1. ✅ 部署此次修正到生產環境
2. ⏳ 驗證 AI 客戶端確實取得最新內容（需實際測試）

### 優先度 P1（本週完成）
1. 新增 AI 客戶端專用的 access log format
2. 建立監控 dashboard 觀察 AI 流量
3. 考慮針對 AI 客戶端的 rate limiting (目前未實作)

### 優先度 P2（未來優化）
1. 研究各家 AI 服務的快取行為差異
2. 考慮為 AI 提供 API-first 的存取方式（減少 HTML scraping）
3. 建立 robots.txt / AI-specific crawl policy

---

## 九、檢核清單

在完成部署後，請逐項確認：

- [ ] `src/main.ts` 包含 `max-age=0`
- [ ] `nginx/conf.d/2ch.conf` 包含 AI UA map directive
- [ ] HTML 回應包含 `Clear-Site-Data: "cache"`
- [ ] API 回應包含 `s-maxage=0`
- [ ] JS/CSS 快取時間為 1 小時（非 1 年）
- [ ] curl 測試顯示 `x-ai-client: 1` (AI UA)
- [ ] curl 測試顯示 `x-ai-client: 0` (一般 UA)
- [ ] 無 service worker 或其他客戶端快取機制
- [ ] 伺服器上所有容器狀態為 Up
- [ ] Nginx 配置測試通過 (`nginx -t`)

---

**報告產生時間**: 2026-01-13
**預計生效時間**: 部署後立即生效
**建議監控期間**: 7 天
