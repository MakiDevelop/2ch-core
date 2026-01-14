# 部署前檢查清單 - 安全性修復 PR

## 📅 預定部署時間
**明天凌晨 4:00 AM（台北時間）自動部署**

---

## ⚠️ 重要：部署前必須完成（今晚凌晨 4:00 前）

### 1. 設定 ADMIN_API_TOKEN（必須）

```bash
# SSH 到正式伺服器
ssh user@2ch.tw

cd /opt/2ch-core

# 生成 64 字元的安全 Token
export NEW_TOKEN=$(openssl rand -hex 32)

# 加入到生產環境配置
echo "ADMIN_API_TOKEN=$NEW_TOKEN" >> .env.prod

# 確認設定成功
grep ADMIN_API_TOKEN .env.prod

# 記錄 Token（重要！請保存到安全的地方）
echo "Admin Token: $NEW_TOKEN" >> ~/admin_token_backup.txt
chmod 600 ~/admin_token_backup.txt
```

**❗ 如果沒有設定，應用程式會拒絕啟動！**

---

### 2. 執行資料庫遷移（必須）

```bash
# 在正式伺服器執行
cd /opt/2ch-core

# 備份資料庫（安全起見）
pg_dump $DATABASE_URL > ~/backup_before_migration_$(date +%Y%m%d_%H%M%S).sql

# 執行遷移（移除 real_ip 欄位）
psql $DATABASE_URL -f db/migrations/007_remove_real_ip.sql

# 驗證遷移成功（應該看不到 real_ip 欄位）
psql $DATABASE_URL -c "\d posts"
```

---

## 🤖 自動部署流程

### 時間軸：

**明天凌晨 3:59:59**
- GitHub Actions 準備執行

**明天凌晨 4:00:00**
- 開始自動部署
- 記錄當前版本（用於 rollback）
- 拉取最新程式碼
- 重建 Docker 映像檔
- 重啟 API 容器

**明天凌晨 4:00:15**（部署後 15 秒）
- 自動執行健康檢查

**如果健康檢查失敗：**
- ❌ 偵測到錯誤
- 🔄 自動回滾到上一個版本
- 🔨 重建舊版本的 Docker 映像檔
- 🚀 重啟舊版本容器
- ✅ 回滾完成，系統恢復正常

**如果健康檢查成功：**
- ✅ 部署成功
- ✅ 最終驗證通過
- 🎉 新版本上線

---

## 📊 部署後驗證

### 自動驗證（GitHub Actions 會執行）
- ✅ 健康檢查: `https://2ch.tw/health`
- ✅ 15 秒後二次確認

### 手動驗證（建議凌晨 4:05 後執行）

```bash
# 1. 檢查健康狀態
curl https://2ch.tw/health

# 2. 測試發文功能
curl -X POST https://2ch.tw/posts \
  -H "Content-Type: application/json" \
  -d '{"content":"部署後測試"}'

# 3. 測試管理認證（應該回傳 401）
curl https://2ch.tw/admin/system-status

# 4. 使用正確 Token 測試（應該回傳系統狀態）
curl https://2ch.tw/admin/system-status \
  -H "Authorization: Bearer $NEW_TOKEN"

# 5. 檢查 Docker 容器狀態
ssh user@2ch.tw "cd /opt/2ch-core && docker compose -f docker-compose.deploy.yml ps"

# 6. 檢查應用日誌
ssh user@2ch.tw "cd /opt/2ch-core && docker compose -f docker-compose.deploy.yml logs --tail=50 api"
```

---

## 🚨 緊急應變

### 如果自動 Rollback 也失敗：

```bash
# 手動回滾到已知的穩定版本
ssh user@2ch.tw
cd /opt/2ch-core

# 查看最近的 commit
git log --oneline -5

# 回滾到安全的版本（目前的版本）
git reset --hard 3d4f52f

# 重建並重啟
docker compose -f docker-compose.deploy.yml build api
docker compose -f docker-compose.deploy.yml up -d --force-recreate --no-deps api

# 驗證
curl https://2ch.tw/health
```

### 如果需要取消明天的部署：

1. 前往 https://github.com/MakiDevelop/2ch-core/actions
2. 找到預定的 workflow run
3. 點擊 "Cancel workflow"

---

## 📝 部署記錄

### 部署資訊
- **PR**: #1 - Security fixes for 3 critical vulnerabilities
- **Commit**: 將在 merge 後更新
- **部署時間**: 明天凌晨 4:00 AM
- **預估停機時間**: 約 30 秒（容器重啟）
- **Rollback 機制**: 自動（健康檢查失敗時）

### 修復內容
1. 移除 IP 明文儲存（GDPR 合規）
2. 強制 Admin Token 認證（防止降級攻擊）
3. Docker SDK 取代 Shell Exec（防止命令注入）

---

## ✅ 檢查清單

在今晚睡覺前確認：

- [ ] 已設定 `ADMIN_API_TOKEN` 在正式環境
- [ ] 已執行資料庫遷移 `007_remove_real_ip.sql`
- [ ] 已備份資料庫
- [ ] 已記錄新的 Admin Token
- [ ] 已驗證環境變數設定正確
- [ ] 已 Merge PR #1 到 main 分支

準備就緒後，就可以安心睡覺，讓系統在凌晨 4:00 自動部署！

---

## 📞 聯絡資訊

如果部署失敗需要人工介入：
- GitHub Actions: https://github.com/MakiDevelop/2ch-core/actions
- 部署日誌會顯示詳細的錯誤訊息和 rollback 狀態
