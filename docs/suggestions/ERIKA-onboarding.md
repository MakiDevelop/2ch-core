# ERIKA Onboarding - 2ch-core

**Date**: 2026-01-31
**From**: Claude (Orchestrator)
**To**: ERIKA
**Status**: Action Required

---

## Repo 資訊

- **Repo**: `git@github.com:MakiDevelop/2ch-core.git`
- **HTTPS**: `https://github.com/MakiDevelop/2ch-core.git`
- **Branch**: `develop` (開發), `main` (production)

## 你的權限

- **Readonly** - 可 clone、pull、讀取所有檔案
- 修改/commit/push 由 Claude、Codex、Gemini 負責

## 專案環境

| 環境 | URL | 伺服器路徑 |
|------|-----|-----------|
| Production | https://2ch.tw | `/opt/2ch-core` |
| Development | https://dev.2ch.tw | `/opt/2ch-core-dev` |

**VPS**: `139.180.199.219` (SSH via key)

---

## 🚨 服務監控（重要任務）

### 監控對象

| 服務 | URL | 優先級 |
|------|-----|--------|
| Production | https://2ch.tw | **最高** |
| Dev | https://dev.2ch.tw | 中 |

### 健康檢查方式

```bash
# 基本檢查 - 網站可存取
curl -sf https://2ch.tw > /dev/null && echo "OK" || echo "DOWN"

# API 檢查 - 回應正常
curl -sf https://2ch.tw/api/health > /dev/null && echo "API OK" || echo "API DOWN"

# 或檢查首頁回應狀態碼
curl -o /dev/null -s -w "%{http_code}" https://2ch.tw
```

### 監控頻率

- 建議納入 heartbeat（每 30 分鐘檢查一次）
- 或設定獨立 cron job

### 異常通報規則

**立即通知 Maki（LINE）：**
- 網站無法存取（連續 2 次檢查失敗）
- HTTP 5xx 錯誤
- 回應時間 > 10 秒
- SSL 憑證問題

**每日彙整：**
- 偶發性慢回應
- 非關鍵錯誤

---

## 你的職責

1. **監控** - 服務狀態、錯誤日誌
2. **執行** - 部署指令、健康檢查
3. **回報** - 異常即時通知、每日彙整
4. **溝通** - 作為 Maki 與其他 AI agents 的橋樑

## 協作文件

- `docs/AI-COLLABORATION-PROTOCOL.md` - 協作規則
- `docs/decision-log.md` - 決策紀錄
- `docs/suggestions/` - 提案草稿（AI↔AI 溝通）
- `docs/rfc/` - 正式 RFC

## 協作夥伴

| 角色 | 職責 |
|------|------|
| **Maki** | 最終決策者 |
| **Claude** | 總指揮（架構、拆解、整合） |
| **Codex** | 實作與 code review |
| **Gemini** | 技術調查與風險顧問 |
| **ERIKA (你)** | 監控、通知、執行 |

## 下一步

1. Clone repo: `git clone https://github.com/MakiDevelop/2ch-core.git`
2. 閱讀 `CLAUDE.md` 了解專案結構
3. 閱讀 `docs/AI-COLLABORATION-PROTOCOL.md` 了解協作規則
4. **設定 2ch.tw 健康檢查**（納入 heartbeat 或 cron）
5. 確認 VPS 存取權限
6. 回覆此文件確認 onboarding 完成

---

*此文件由 Claude 建立，請 ERIKA 確認收到後更新 Status 為 Acknowledged*
