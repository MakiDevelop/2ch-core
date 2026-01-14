# 2ch.tw 開發日誌

## 重要資訊

| 項目 | 值 |
|------|-----|
| Vultr 主機 | `root@139.180.199.219` |
| GitHub Repo | `git@github.com:MakiDevelop/2ch-core.git` |
| 部署方式 | rsync 同步（伺服器非 git repo） |
| 家用管理 IP | `61.222.111.237`, `61.222.111.238` |

---

## 2026-01-13 工作內容

### 1. 系統狀態功能部署
- [x] 部署 `system-status.html` 系統監控儀表板
- [x] 部署 `robots.txt` 爬蟲排除規則
- [x] 部署 `/admin/system-status` API
- [x] 修正娛樂板連結 (`/boards/gossip/threads`)

### 2. 發文語法說明提示 (?)
- [x] 在 `board.html` 和 `thread.html` 的 textarea 右上角添加 `(?)` 提示 icon
- [x] Hover 顯示語法說明（`<yt>`、`<iu>`、`<code>`）
- [x] 支援行動裝置 tap 切換
- [x] 添加提醒：不支援社群媒體圖片（IG/Threads/FB/X）

### 3. 內容解析功能 (`parseContent`)
- [x] 在 `thread.js` 添加 `parseContent()` 函數
- [x] YouTube 嵌入（`<yt>` 標籤，最多 1 部，支援多種 URL 格式）
- [x] 圖片嵌入（`<iu>` 標籤，最多 3 張，僅 https）
- [x] 程式碼區塊（`<code>` 標籤，保留換行空白）
- [x] 圖片載入失敗時 fallback 為可點擊連結
- [x] 主討論串和回覆都支援解析

### 4. 效能優化
- [x] 添加 `defer` 延遲載入 JS
- [x] 添加 `preconnect` / `dns-prefetch` 預連接
- [x] 添加 `<link rel="preload">` 預載入 CSS/JS
- [x] **API 預先請求**：HTML 解析時就發起 fetch，不等 JS 載入
- [x] 添加 JSON-LD 結構化資料（幫助 AI 瀏覽器）
- [x] 移除 `Clear-Site-Data` header（可能造成某些網路延遲）

### 5. 管理員設定
- [x] 添加家用固定 IP 到白名單
- [x] 可訪問 `/system-status.html` 和管理 API

---

## 今日修改的檔案

```
public/board.html        - 語法提示、AI 優化、preload、prefetch API
public/thread.html       - 語法提示、AI 優化、preload、prefetch API
public/js/board.js       - 使用預載入資料
public/js/thread.js      - 內容解析功能、使用預載入資料
public/css/style.css     - 嵌入內容樣式、fallback 連結樣式
src/main.ts              - 移除 Clear-Site-Data header
.env (伺服器)            - ADMIN_IP_HASHES
```

---

## 效能分析結果

### 伺服器端（正常）
- API 響應：0.13-0.25 秒
- 所有資源 gzip 壓縮

### 客戶端
- Chrome/Safari：正常速度
- AI 瀏覽器（Comet/Atlas）：較慢（是 AI 瀏覽器特性）
- 公司網路：可能有 10 秒+ 延遲（DPI/防火牆問題，非伺服器問題）

### HAR 分析發現
- `wait` 時間很短（伺服器快）
- `receive` 時間異常長（網路層問題）
- 3KB 下載 10 秒 = 公司網路限速/DPI

---

## 待辦事項

### 高優先
- [ ] 回家測試網路速度，確認公司網路是特例
- [ ] 測試 AI 瀏覽器優化效果

### 功能開發
- [ ] 考慮 SSR（Server-Side Rendering）進一步優化 AI 瀏覽器體驗
- [ ] 圖片上傳功能（不依賴外部圖床）
- [ ] 使用者舉報功能

### 維運
- [ ] 設定定期資料庫備份
- [ ] 監控系統資源使用
- [ ] 考慮加入 CDN（CloudFlare）

### 已知問題
- [ ] 社群媒體圖片無法嵌入（hot-linking 保護）→ 已加提示說明
- [ ] 某些公司網路載入很慢 → 非伺服器問題，可能需要 CDN

---

## 部署指令備忘

```bash
# 同步檔案到伺服器
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='.env' \
  /Users/maki/GitHub/2ch-core/ root@139.180.199.219:/opt/2ch-core/

# 只同步特定檔案
rsync -avz public/board.html public/thread.html root@139.180.199.219:/opt/2ch-core/public/

# 重建並重啟 API
ssh root@139.180.199.219 'cd /opt/2ch-core && \
  docker compose -f docker-compose.deploy.yml build api && \
  docker compose -f docker-compose.deploy.yml up -d api'

# 檢查服務狀態
ssh root@139.180.199.219 'docker compose -f /opt/2ch-core/docker-compose.deploy.yml ps'

# 查看 API 日誌
ssh root@139.180.199.219 'docker compose -f /opt/2ch-core/docker-compose.deploy.yml logs api --tail 50'
```

---

*最後更新：2026-01-13 19:28*
