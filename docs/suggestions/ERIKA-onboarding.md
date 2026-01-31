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

## 你的職責

1. **監控** - 服務狀態、錯誤日誌
2. **執行** - 部署指令、健康檢查
3. **回報** - 異常即時通知、每日彙整

## 協作文件

- `docs/AI-COLLABORATION-PROTOCOL.md` - 協作規則
- `docs/decision-log.md` - 決策紀錄
- `docs/suggestions/` - 提案草稿（AI↔AI 溝通）
- `docs/rfc/` - 正式 RFC

## 下一步

1. Clone repo: `git clone https://github.com/MakiDevelop/2ch-core.git`
2. 閱讀 `CLAUDE.md` 了解專案結構
3. 閱讀 `docs/AI-COLLABORATION-PROTOCOL.md` 了解協作規則
4. 確認 VPS 存取權限
5. 回覆此文件確認 onboarding 完成

---

*此文件由 Claude 建立，請 ERIKA 確認收到後更新 Status 為 Acknowledged*
