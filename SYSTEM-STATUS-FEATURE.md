# 系統健康檢查頁面功能

**日期**: 2026-01-13
**功能**: 系統狀態監控儀表板
**存取**: https://2ch.tw/system-status.html

---

## 功能概述

新增系統健康檢查頁面，供管理員監控系統狀態，包括：
- 系統負載（CPU、記憶體、運行時間）
- 資料庫統計（文章數、討論串數、今日統計）
- 容器狀態（Docker containers）
- Node.js 程序資訊

---

## 新增檔案

### 1. Backend API Endpoint

**檔案**: `src/agents/api/admin.ts`
- 新增函數：`systemStatusHandler()` - GET /admin/system-status
- 新增輔助函數：`formatUptime()`, `getContainerStatus()`
- 需要管理員權限（透過 IP hash 驗證）

**檔案**: `src/agents/persistence/postgres.ts`
- 新增函數：`getSystemStats()` - 獲取資料庫統計資訊
- 統計項目：
  - 板塊、文章、討論串、回覆數量
  - 已刪除文章、管理記錄數量
  - 今日新增文章、討論串數量
  - 資料庫大小與版本

**檔案**: `src/agents/api/index.ts`
- 導出：`systemStatusHandler`

**檔案**: `src/main.ts`
- 路由：`GET /admin/system-status` -> `systemStatusHandler`

### 2. Frontend HTML Page

**檔案**: `public/system-status.html`
- 完整的系統狀態儀表板
- 自動每 30 秒重新整理
- 包含以下區塊：
  - 系統資訊（主機名稱、運行時間、CPU 核心）
  - 負載與記憶體（系統負載、記憶體使用率）
  - Node.js 程序資訊
  - 資料庫狀態（連線狀態、統計資訊）
  - 容器狀態（Docker containers）
- 響應式設計，支援手機版

### 3. SEO 與爬蟲排除

**檔案**: `public/robots.txt` (新增)
- 排除 `/admin/` 路徑
- 排除 `/system-status.html`
- 排除 `/terms.html`
- 排除 `/health` API endpoint

**檔案**: `nginx/conf.d/2ch.conf` (修改)
- 新增 `location = /system-status.html` 區塊
  - 添加 `X-Robots-Tag: noindex, nofollow` header
  - 禁用快取
- 新增 `location = /robots.txt` 區塊
  - 允許快取 1 天

**檔案**: `nginx/conf.d/2ch-ssl.conf.template` (修改)
- 同步 2ch.conf 的變更

### 4. 其他修正

**檔案**: `public/board.html` (修正)
- 修正「娛樂／名人／八卦」連結
- 從 `/boards/ent/threads` 改為 `/boards/gossip/threads`

---

## API Endpoint 詳細資訊

### GET /admin/system-status

**需求**:
- 管理員 IP（透過 `checkIsAdmin()` 驗證）

**回應範例**:
```json
{
  "timestamp": "2026-01-13T10:30:00.000Z",
  "system": {
    "hostname": "2ch-server",
    "platform": "linux",
    "arch": "x64",
    "uptime": 864000,
    "uptimeFormatted": "10d 0h 0m 0s",
    "loadavg": [0.5, 0.6, 0.7],
    "cpus": 4,
    "totalMemory": 8589934592,
    "freeMemory": 4294967296,
    "usedMemory": 4294967296,
    "memoryUsagePercent": "50.00"
  },
  "process": {
    "nodeVersion": "v20.x.x",
    "pid": 1234,
    "uptime": 86400,
    "uptimeFormatted": "1d 0h 0m 0s",
    "memoryUsage": {
      "rss": 134217728,
      "heapTotal": 67108864,
      "heapUsed": 50331648,
      "external": 8388608
    }
  },
  "database": {
    "connected": true,
    "version": "PostgreSQL 15.x",
    "database": "2ch",
    "user": "postgres",
    "size": "100 MB",
    "stats": {
      "boards": 10,
      "posts": 1500,
      "deletedPosts": 50,
      "threads": 500,
      "replies": 1000,
      "moderationLogs": 25,
      "todayPosts": 50,
      "todayThreads": 10
    }
  },
  "containers": {
    "count": 4,
    "containers": [
      {
        "name": "2ch-core-nginx-1",
        "status": "Up 10 days",
        "state": "running"
      },
      {
        "name": "2ch-core-api-1",
        "status": "Up 10 days",
        "state": "running"
      },
      {
        "name": "2ch-core-postgres-1",
        "status": "Up 10 days",
        "state": "running"
      },
      {
        "name": "2ch-core-redis-1",
        "status": "Up 10 days",
        "state": "running"
      }
    ]
  }
}
```

**錯誤回應**:
- `403 Forbidden`: 沒有管理員權限
- `500 Internal Server Error`: 伺服器錯誤

---

## 安全措施

### 1. 權限控制
- API endpoint 需要管理員 IP（透過 `checkIsAdmin()` 驗證）
- 非管理員會收到 403 Forbidden 錯誤

### 2. SEO 排除
- `robots.txt` 明確禁止爬蟲索引
- HTML meta tag: `<meta name="robots" content="noindex, nofollow">`
- Nginx X-Robots-Tag header: `noindex, nofollow`

### 3. 快取控制
- 系統狀態頁禁用所有快取
- 確保資料即時更新

---

## 部署步驟

### 方式一：使用部署腳本（推薦）

```bash
chmod +x scripts/deploy-system-status.sh
./scripts/deploy-system-status.sh
```

### 方式二：手動部署

```bash
# 1. 複製檔案到伺服器
scp public/system-status.html maki@107.191.62.114:/opt/2ch-core/public/
scp public/robots.txt maki@107.191.62.114:/opt/2ch-core/public/
scp public/board.html maki@107.191.62.114:/opt/2ch-core/public/
scp nginx/conf.d/2ch.conf maki@107.191.62.114:/opt/2ch-core/nginx/conf.d/
scp -r src maki@107.191.62.114:/opt/2ch-core/

# 2. 登入伺服器
ssh maki@107.191.62.114

# 3. 重新建構與重啟
cd /opt/2ch-core
docker compose -f docker-compose.deploy.yml build api
docker compose -f docker-compose.deploy.yml restart api

# 4. 更新靜態檔案
docker compose -f docker-compose.deploy.yml cp public/system-status.html nginx:/var/www/html/
docker compose -f docker-compose.deploy.yml cp public/robots.txt nginx:/var/www/html/
docker compose -f docker-compose.deploy.yml cp public/board.html nginx:/var/www/html/

# 5. 更新 Nginx 配置
docker compose -f docker-compose.deploy.yml cp nginx/conf.d/2ch.conf nginx:/etc/nginx/conf.d/
docker compose -f docker-compose.deploy.yml exec nginx nginx -t
docker compose -f docker-compose.deploy.yml exec nginx nginx -s reload
```

---

## 驗證步驟

### 1. 訪問系統狀態頁
```bash
# 瀏覽器訪問
https://2ch.tw/system-status.html

# 預期結果：顯示完整的系統狀態儀表板
```

### 2. 測試 API Endpoint
```bash
# 使用管理員 IP 測試
curl -X GET https://2ch.tw/admin/system-status

# 預期結果：回傳完整的系統狀態 JSON
```

### 3. 檢查 robots.txt
```bash
curl https://2ch.tw/robots.txt

# 預期結果：包含 "Disallow: /system-status.html"
```

### 4. 檢查爬蟲排除 Headers
```bash
curl -I https://2ch.tw/system-status.html

# 預期結果：包含 "X-Robots-Tag: noindex, nofollow"
```

### 5. 驗證娛樂板修正
```bash
# 訪問討論版列表
https://2ch.tw/boards/chat/threads

# 點擊「娛樂／名人／八卦」
# 預期結果：正常載入板塊內容（即使是空的）
```

---

## 修改檔案清單

### 新增檔案
- `public/system-status.html` - 系統狀態儀表板頁面
- `public/robots.txt` - 爬蟲排除規則
- `scripts/deploy-system-status.sh` - 部署腳本
- `SYSTEM-STATUS-FEATURE.md` - 本文件

### 修改檔案
- `src/agents/api/admin.ts` - 新增 systemStatusHandler 與輔助函數
- `src/agents/api/index.ts` - 導出 systemStatusHandler
- `src/agents/persistence/postgres.ts` - 新增 getSystemStats 函數
- `src/main.ts` - 註冊 GET /admin/system-status 路由
- `nginx/conf.d/2ch.conf` - 新增 system-status.html 與 robots.txt 配置
- `nginx/conf.d/2ch-ssl.conf.template` - 同步配置
- `public/board.html` - 修正娛樂板連結

---

## 後續建議

### P1 - 可選功能增強
1. **存取記錄**
   - 記錄誰在什麼時候訪問了系統狀態頁
   - 加入 audit log

2. **告警功能**
   - 記憶體使用率 > 90% 時發送警告
   - 容器狀態異常時發送通知
   - 資料庫連線失敗時發送告警

3. **歷史資料**
   - 儲存每小時的系統狀態快照
   - 提供趨勢圖表

4. **更多指標**
   - Redis 連線狀態與記憶體使用
   - Nginx 請求統計
   - API 回應時間統計

### P2 - 進階功能
1. **IP 白名單**
   - 只允許特定 IP 訪問系統狀態頁
   - 在 Nginx 層實作

2. **基本認證**
   - 為系統狀態頁添加 HTTP Basic Auth
   - 避免依賴 IP 驗證

3. **WebSocket 即時更新**
   - 使用 WebSocket 推送即時資料
   - 避免每 30 秒輪詢

---

## 總結

✅ **已完成**:
- 系統狀態 API endpoint (GET /admin/system-status)
- 系統狀態 HTML 儀表板頁面
- robots.txt 排除爬蟲索引
- Nginx 配置添加 X-Robots-Tag header
- 修正娛樂板連結錯誤

✅ **安全措施**:
- 管理員 IP 權限驗證
- 多層爬蟲排除（robots.txt + meta tag + X-Robots-Tag）
- 禁用快取確保資料即時

✅ **使用方式**:
- 直接訪問 https://2ch.tw/system-status.html
- 或使用 API：GET /admin/system-status

---

**文件產生時間**: 2026-01-13
**功能開發**: Claude Sonnet 4.5
**審閱建議**: 技術主管、DevOps、系統管理員
