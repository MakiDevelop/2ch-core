# 部署備忘錄

**日期**: 2026-01-13
**狀態**: ✅ 代碼已 commit，等待 push 與部署

---

## 已完成

1. ✅ 建立系統健康檢查頁面 (`/system-status.html`)
2. ✅ 建立系統狀態 API (`GET /admin/system-status`)
3. ✅ 新增 `robots.txt` 排除爬蟲
4. ✅ 更新 Nginx 配置保護敏感頁面
5. ✅ 修正娛樂板連結錯誤 (`/boards/gossip/threads`)
6. ✅ 所有變更已 commit 到 git

**Commit ID**: `50d47db`

---

## 接下來要做（重開 Terminal 後）

### Step 1: Push 到遠端倉庫

```bash
cd /Users/maki/GitHub/2ch-core
git push origin main
```

### Step 2: 登入伺服器並部署

```bash
# 登入伺服器
ssh root@139.180.199.219 （SSH Keys）

# 執行以下指令
cd /opt/2ch-core

# 拉取最新代碼
git pull origin main

# 給予腳本執行權限
chmod +x scripts/deploy-commands.sh

# 執行部署
./scripts/deploy-commands.sh
```

### Step 3: 驗證部署

部署完成後，執行以下驗證：

1. **檢查系統狀態頁**
   ```bash
   curl -I https://2ch.tw/system-status.html
   # 應該包含 X-Robots-Tag: noindex, nofollow
   ```

2. **檢查 robots.txt**
   ```bash
   curl https://2ch.tw/robots.txt
   # 應該包含 Disallow: /system-status.html
   ```

3. **測試系統狀態 API**
   ```bash
   curl https://2ch.tw/admin/system-status
   # 應該返回系統資訊 JSON
   ```

4. **測試娛樂板修正**
   - 訪問: https://2ch.tw/boards/chat/threads
   - 點擊「娛樂／名人／八卦」
   - 應該正常載入（不再卡在「載入中...」）

5. **瀏覽器測試系統狀態頁**
   - 訪問: https://2ch.tw/system-status.html
   - 應該看到完整的系統監控儀表板

---

## 變更檔案清單

### 新增檔案
- `public/system-status.html` - 系統狀態儀表板
- `public/robots.txt` - 爬蟲排除規則
- `SYSTEM-STATUS-FEATURE.md` - 完整功能說明
- `scripts/deploy-commands.sh` - 部署腳本（在伺服器上執行）
- `scripts/test-system-status-local.sh` - 本地測試腳本
- `DEPLOY-MEMO.md` - 本文件

### 修改檔案
- `src/agents/api/admin.ts` - 新增 `systemStatusHandler()`
- `src/agents/api/index.ts` - 導出新 handler
- `src/agents/persistence/postgres.ts` - 新增 `getSystemStats()`
- `src/main.ts` - 註冊 `/admin/system-status` 路由
- `nginx/conf.d/2ch.conf` - 新增 system-status.html 與 robots.txt 配置
- `nginx/conf.d/2ch-ssl.conf.template` - 同步配置
- `public/board.html` - 修正娛樂板連結

---

## 功能說明

### 系統狀態頁面功能
- 📊 系統資訊：主機名稱、平台、運行時間、CPU 核心數
- 💾 記憶體監控：使用率、已用/可用記憶體（含進度條）
- 📈 系統負載：1/5/15 分鐘平均負載
- 🗄️ 資料庫統計：
  - 板塊、討論串、回覆、文章總數
  - 已刪除文章、管理記錄數量
  - 今日新增文章與討論串
  - 資料庫大小與版本
- 🐳 容器狀態：所有 Docker 容器的運行狀態
- ⚡ Node.js 程序：版本、PID、運行時間、記憶體使用
- 🔄 自動重新整理：每 30 秒更新一次

### 安全措施
- 🔒 API 需要管理員 IP 驗證
- 🚫 多層爬蟲排除（robots.txt + meta tag + X-Robots-Tag）
- 🔄 禁用快取確保資料即時

---

## 快速部署指令（複製貼上）

重開 Terminal 後，依序執行：

```bash
# 1. Push 代碼
cd /Users/maki/GitHub/2ch-core && git push origin main

# 2. 登入伺服器並部署
ssh root@139.180.199.219 << 'ENDSSH'
cd /opt/2ch-core
git pull origin main
chmod +x scripts/deploy-commands.sh
./scripts/deploy-commands.sh
ENDSSH

# 3. 驗證部署
echo "驗證系統狀態頁..."
curl -I https://2ch.tw/system-status.html | grep -i "x-robots-tag"
echo ""
echo "驗證 robots.txt..."
curl -s https://2ch.tw/robots.txt | grep -i "system-status"
echo ""
echo "✅ 請在瀏覽器訪問 https://2ch.tw/system-status.html 確認"
```

---

## 如果遇到問題

### SSH 連線問題
如果 SSH 連線失敗，手動執行：
1. 登入伺服器
2. 執行 `cd /opt/2ch-core && ./scripts/deploy-commands.sh`

### Git pull 失敗
如果伺服器上 git pull 有衝突：
```bash
cd /opt/2ch-core
git stash
git pull origin main
git stash pop
```

### Nginx 配置錯誤
如果 nginx -t 失敗，檢查語法錯誤：
```bash
docker compose -f docker-compose.deploy.yml exec nginx nginx -t
# 查看錯誤訊息
```

### API 服務啟動失敗
檢查 API 日誌：
```bash
docker compose -f docker-compose.deploy.yml logs api
```

---

## 相關文件

- `SYSTEM-STATUS-FEATURE.md` - 完整功能說明與 API 文件
- `scripts/deploy-commands.sh` - 伺服器端部署腳本
- `scripts/test-system-status-local.sh` - 本地測試腳本

---

**注意**: 系統狀態頁面需要管理員 IP 才能訪問 API，請確保你的 IP 已加入白名單。

**最後更新**: 2026-01-13 18:15
