# CI/CD 設定說明

## 分支策略

```
main     ──► 線上環境 https://2ch.tw（push 自動部署）
  ↑
  └── PR merge

develop  ──► 測試環境 https://dev.2ch.tw（push 自動部署）
```

## 環境隔離

| 項目 | Production (2ch.tw) | Development (dev.2ch.tw) |
|------|---------------------|--------------------------|
| 分支 | `main` | `develop` |
| 資料庫 | `2ch` | `2ch_dev` |
| 容器 | `api` | `api-dev` |
| robots.txt | Allow all | Disallow all |
| 搜尋引擎 | 會收錄 | 不收錄 |

## 跟 Claude 協作

| 你說的話 | Claude 會做 |
|----------|-------------|
| 「幫我改 XXX」「加個功能」 | commit 到 `develop`，不部署 |
| 「部署」「上線」「推到 main」 | merge 到 `main`，觸發自動部署 |
| 「先不要部署」 | 只 commit 到 `develop` |

## GitHub Actions

- **觸發條件**: push 到 `main` 分支
- **動作**: SSH 到伺服器執行部署
- **位置**: `.github/workflows/deploy.yml`

## 需要設定的 GitHub Secrets

到 GitHub repo → Settings → Secrets and variables → Actions，新增：

| Secret 名稱 | 值 |
|------------|-----|
| `SERVER_HOST` | `139.180.199.219` |
| `SERVER_USER` | `root` |
| `SERVER_SSH_KEY` | 伺服器的 SSH private key |

### 取得 SSH Key

```bash
# 在本機執行，複製輸出的內容
cat ~/.ssh/id_ed25519
# 或
cat ~/.ssh/id_rsa
```

## 手動部署

如果需要手動觸發部署：

1. 到 GitHub repo → Actions
2. 選 "Deploy to Production"
3. 點 "Run workflow"

## 本地開發流程

```bash
# 1. 確保在 develop 分支
git checkout develop

# 2. 開發完成後
git add . && git commit -m "feat: xxx"
git push origin develop

# 3. 準備上線時，開 PR 或直接 merge
git checkout main
git merge develop
git push origin main  # 自動觸發部署
```

## 緊急回滾

```bash
# 在伺服器上
cd /opt/2ch-core
git log --oneline -5  # 找到要回滾的 commit
git reset --hard <commit-hash>
docker compose -f docker-compose.deploy.yml build api
docker compose -f docker-compose.deploy.yml up -d --force-recreate --no-deps api
```

