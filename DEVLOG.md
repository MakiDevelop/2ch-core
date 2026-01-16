# 2ch.tw Development Log

## 2026-01-16 工作記錄

### 已完成項目

#### 1. 討論串排序功能
- **狀態**: ✅ 已合併到 main，等待明天 5:00 AM 部署
- **內容**:
  - 新增三種排序：最新發表（預設）｜熱門討論｜最新回覆
  - 後端：`postgres.ts` 新增 `ThreadSortType`，支援 `latest`/`hot`/`active`
  - API：`boards.ts` 接受 `?sort=` 參數
  - 前端：`board.js` + `board.html` 排序按鈕 UI
- **相關 commits**: `56e2e28`, `76b3949`

#### 2. YouTube Shorts 支援修復
- **狀態**: ✅ 已合併到 main
- **內容**: `<yt>` 標籤現在支援 `youtube.com/shorts/VIDEO_ID` 格式
- **檔案**: `public/js/thread.js` - `extractYouTubeId()` 函數
- **相關 commit**: `26cb950`

#### 3. CI/CD 調整
- **狀態**: ✅ 已生效
- **內容**: 排程部署時間調整為凌晨 5:00 AM（台北時間）
- **檔案**: `.github/workflows/deploy.yml`
- **Rollback 機制**: Health check 失敗自動回滾到上一個 commit

---

### 待實作項目

#### Posts Export API（優先度：中）
- **需求來源**: 2026-01-16 使用者需求
- **用途**: 推薦系統、知識圖譜、文本分析
- **建議 endpoint**: `GET /api/export/posts`
- **建議欄位**:
  ```json
  {
    "id": "number",
    "content": "string",
    "title": "string | null",
    "boardSlug": "string",
    "parentId": "number | null",
    "createdAt": "ISO8601",
    "replyCount": "number"
  }
  ```
- **注意事項**:
  - 需要 cursor-based 分頁（資料量可能很大）
  - 考慮是否需要 API key 保護
  - 可能需要 rate limiting
- **暫不實作原因**: 避免產生未保護的資料匯出口

---

### 已部署但尚未到 Production 的功能

以下功能將在 **2026-01-17 05:00 AM (台北時間)** 自動部署：

| 功能 | 類型 | 狀態 |
|------|------|------|
| 收藏功能（浮動按鈕 + 側邊欄） | Feature | 待部署 |
| 新回覆追蹤（+N badge） | Feature | 待部署 |
| 討論串三排序 | Feature | 待部署 |
| YouTube Shorts 支援 | Bugfix | 待部署 |
| escapeHtml 衝突修復 | Bugfix | 待部署 |

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
