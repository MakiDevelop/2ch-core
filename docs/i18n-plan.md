# i18n 實作計畫

## 策略

- UI 層面：建立可擴充的語系結構，預設只開繁中
- 內容層面：完全不做翻譯、不混語系
- 擴充時機：等有實際外語使用者群體再處理

## 要做的事

### 1. 建立 Locale 檔案結構

```
src/
└── locales/
    ├── index.ts        # 匯出與 helper
    └── zh-TW.ts        # 繁中訊息（唯一需維護）
```

### 2. 後端：集中化錯誤訊息

**建立 `src/locales/zh-TW.ts`**

```typescript
export const zhTW = {
  // API 錯誤
  error: {
    invalidParentId: "無效的父文章 ID",
    invalidThreadId: "無效的討論串 ID",
    threadNotFound: "找不到該討論串",
    threadLocked: "此討論串已被鎖定，無法回覆",
    threadArchived: "此討論串已達 999 樓上限，已封存無法回覆",
    internalError: "內部伺服器錯誤",
  },

  // 搜尋相關
  search: {
    queryRequired: "搜尋關鍵字為必填",
    queryTooShort: "搜尋關鍵字至少需要 2 個字元",
    queryTooLong: "搜尋關鍵字不能超過 50 個字元",
    cooldown: (sec: number) => `搜尋冷卻中，請等待 ${sec} 秒`,
  },

  // 預設值
  defaults: {
    authorName: "名無しさん",
  },
};
```

**建立 `src/locales/index.ts`**

```typescript
import { zhTW } from "./zh-TW";

// 目前只有繁中，未來可擴充
const locales = {
  "zh-TW": zhTW,
} as const;

type Locale = keyof typeof locales;

// 預設語系
const defaultLocale: Locale = "zh-TW";

// 取得訊息（未來可依 request header 切換）
export function getMessages(locale: Locale = defaultLocale) {
  return locales[locale] ?? locales[defaultLocale];
}

export const msg = getMessages();
```

### 3. 後端：替換硬編碼字串

**`src/agents/api/posts.ts` 範例**

```typescript
// Before
res.status(404).json({ error: "thread not found" });

// After
import { msg } from "../../locales";
res.status(404).json({ error: msg.error.threadNotFound });
```

**需修改的檔案**

| 檔案 | 字串數量 | 備註 |
|------|---------|------|
| `src/agents/api/posts.ts` | ~10 | 錯誤訊息 |
| `src/agents/api/admin.ts` | ~5 | 管理錯誤 |
| `src/agents/persistence/postgres.ts` | ~2 | 預設暱稱 |

### 4. 前端 JS：建立翻譯 helper

**建立 `public/js/i18n.js`**

```javascript
const i18n = {
  "zh-TW": {
    time: {
      justNow: "剛剛",
      minutesAgo: (n) => `${n}分鐘前`,
      hoursAgo: (n) => `${n}小時前`,
      daysAgo: (n) => `${n}天前`,
    },
    ui: {
      copied: "已複製分享連結",
      loading: "載入中...",
      noMore: "沒有更多了",
    },
  },
};

const currentLocale = "zh-TW";
const t = (path) => {
  const keys = path.split(".");
  let result = i18n[currentLocale];
  for (const key of keys) {
    result = result?.[key];
  }
  return result ?? path;
};
```

**需修改的檔案**

| 檔案 | 字串數量 |
|------|---------|
| `public/js/thread.js` | ~5 |
| `public/js/board.js` | ~3 |

---

## 不做的事

- [ ] HTML 頁面內容（版規等）— 維持硬編碼
- [ ] 板塊名稱/描述 — 資料庫維持現狀
- [ ] 語言切換器 UI — 不需要
- [ ] 其他語系翻譯 — 等有需求再說
- [ ] Accept-Language 偵測 — 目前不需要

---

## 未來擴充

當需要新增語系時：

1. 新增 `src/locales/en.ts`（複製 zh-TW 結構）
2. 在 `src/locales/index.ts` 註冊
3. 加入語言偵測邏輯（Accept-Language header）
4. （可選）前端加語言切換器

---

## 預估工時

| 項目 | 時間 |
|------|------|
| 建立 locale 結構 | 30 分鐘 |
| 後端字串抽取 | 2-3 小時 |
| 前端 JS 字串抽取 | 1-2 小時 |
| 測試 | 1 小時 |
| **總計** | **約 1 天** |
