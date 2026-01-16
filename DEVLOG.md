# 2ch.tw Development Log

## 2026-01-17 工作記錄

### 已完成項目

#### 1. 板塊專屬 Banner
- **狀態**: ✅ 已部署到 Production
- **內容**:
  - 10 個板塊各有專屬插畫 Banner
  - 原始圖片 2528×1696，優化為 1400px 寬度
  - WebP 格式 (~150-250KB) + PNG fallback
  - CSS `object-fit: cover` 響應式顯示（桌面 280px / 手機 180px）
- **檔案**:
  - `public/images/banners/optimized/` - 10 張 WebP + PNG
  - `public/css/style.css` - Banner 樣式
  - `public/js/board.js` - 動態載入邏輯

#### 2. 麵包屑導航
- **狀態**: ✅ 已部署到 Production
- **內容**: 板塊頁面新增「首頁 › 板塊名稱」導航
- **檔案**: `public/board.html`, `public/css/style.css`, `public/js/board.js`

#### 3. Header 高度精簡
- **狀態**: ✅ 已部署到 Production
- **內容**:
  - Top header: padding 30px → 15px, h1 2.5em → 1.8em
  - Board header: padding 25px → 12px, h2 1.8em → 1.4em
- **檔案**: `public/css/style.css`

#### 4. JS 版本號快取解決方案
- **狀態**: ✅ 已部署到 Production
- **內容**: 所有 JS 引用加上 `?v=20260117` 避免瀏覽器快取問題
- **檔案**: `public/*.html`

---

### 未來規劃

#### 廣告位預留
- **Header 右側**: 橫幅廣告 (728x90 或 responsive)
- **左側 Sidebar 下方**: 方形廣告 (300x250)

#### Posts Export API（優先度：中）
- **需求來源**: 2026-01-16 使用者需求
- **用途**: 推薦系統、知識圖譜、文本分析
- **建議 endpoint**: `GET /api/export/posts`
- **暫不實作原因**: 避免產生未保護的資料匯出口

---

## 2026-01-16 工作記錄

### 已完成項目

#### 1. 討論串排序功能
- **狀態**: ✅ 已部署到 Production
- **內容**:
  - 新增三種排序：最新發表（預設）｜熱門討論｜最新回覆
  - 後端：`postgres.ts` 新增 `ThreadSortType`，支援 `latest`/`hot`/`active`
  - API：`boards.ts` 接受 `?sort=` 參數
  - 前端：`board.js` + `board.html` 排序按鈕 UI

#### 2. 收藏功能
- **狀態**: ✅ 已部署到 Production
- **內容**:
  - LocalStorage 儲存收藏
  - 浮動按鈕 + 側邊欄 UI
  - 新回覆追蹤（+N badge）
- **檔案**: `public/js/bookmark.js`

#### 3. YouTube Shorts 支援修復
- **狀態**: ✅ 已部署到 Production
- **內容**: `<yt>` 標籤現在支援 `youtube.com/shorts/VIDEO_ID` 格式
- **檔案**: `public/js/thread.js` - `extractYouTubeId()` 函數

#### 4. CI/CD 調整
- **狀態**: ✅ 已生效
- **內容**:
  - 排程部署改為手動觸發（避免重複部署）
  - `docker build --no-cache` 確保程式碼更新
  - `rsync` 同步靜態檔案
  - Health check 失敗自動回滾
- **檔案**: `.github/workflows/deploy.yml`

---

### 技術決策記錄

#### Container Registry 評估（2026-01-16）
- **結論**: 暫不導入
- **原因**: 目前單一 instance + docker-compose 部署，導入 registry 的工程價值不足
- **建議**: 等真正需要時一次完成（image naming + auth + CI push + deploy pull）

---

## 環境資訊

- **Production**: https://2ch.tw
- **Dev**: https://dev.2ch.tw
- **VPS**: 139.180.199.219
- **部署方式**: docker-compose（dev 用 `docker-compose.yml`，prod 用 `docker-compose.deploy.yml`）
