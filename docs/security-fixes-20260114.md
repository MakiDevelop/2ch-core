# Security Fixes - 2026-01-14

本文件記錄 2026 年 1 月 14 日執行的安全修復，基於 `docs/security-assessment.md` 的靜態審查結果。

## 修復摘要

| 等級 | 問題 | 狀態 |
|------|------|------|
| CRITICAL | X-Forwarded-For 偽造 | ✅ 已修復 |
| HIGH | Admin 缺乏強認證 | ✅ 已修復 |
| HIGH | Link Preview SSRF | ✅ 已修復 |
| MEDIUM | 鎖定討論串未強制執行 | ✅ 已修復 |
| MEDIUM | IP Hash 無 salt | ✅ 已修復 |
| MEDIUM | Rate limiting 僅單進程 | ⏳ 待處理 |
| LOW | 缺少現代安全 headers | ✅ 已修復 |
| LOW | IP Hash 型別不一致 | ✅ 已修復 |

---

## 詳細修復內容

### 1. [CRITICAL] X-Forwarded-For 偽造防護

**問題**：Nginx 使用 `$proxy_add_x_forwarded_for` 會附加用戶端提供的 header，攻擊者可偽造 admin IP。

**修復**：

**nginx/conf.d/2ch.conf** - 所有 location 區塊：
```nginx
# 原本（不安全）
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

# 修復後（覆寫用戶端提供的值）
proxy_set_header X-Forwarded-For $remote_addr;
```

**src/main.ts** - 加入 trust proxy 設定：
```typescript
const app = express();

// SECURITY: Trust only the first proxy (nginx)
app.set("trust proxy", 1);
```

**src/agents/api/admin.ts** 與 **posts.ts** - 使用 req.ip：
```typescript
function getRealIp(req: Request): string {
  // With trust proxy enabled, req.ip is set from X-Forwarded-For by Express
  // Nginx overwrites X-Forwarded-For with $remote_addr to prevent spoofing
  return req.ip ?? "unknown";
}
```

---

### 2. [HIGH] Admin Bearer Token 認證

**問題**：原本僅使用 IP Hash 白名單認證，容易被偽造且無法防禦 CSRF。

**修復**：

**新增環境變數** (`.env.example`, `.env.prod`)：
```bash
# Admin API Token (REQUIRED for production)
# Generate with: openssl rand -hex 32
# Usage: Authorization: Bearer <token>
ADMIN_API_TOKEN=your_token_here
```

**src/agents/guard/adminGuard.ts** - 新增 token 認證：
```typescript
export function checkAdminToken(authHeader: string | undefined): AdminGuardResult {
  const adminToken = process.env.ADMIN_API_TOKEN;

  if (!adminToken || adminToken.trim() === "") {
    return { ok: false, status: 401, error: "token_not_configured" };
  }

  if (!authHeader) {
    return { ok: false, status: 401, error: "authorization header required" };
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, status: 401, error: "invalid authorization format" };
  }

  // Use timing-safe comparison to prevent timing attacks
  const tokenBuffer = Buffer.from(adminToken);
  const providedBuffer = Buffer.from(match[1]);

  if (!crypto.timingSafeEqual(tokenBuffer, providedBuffer)) {
    return { ok: false, status: 403, error: "invalid admin token" };
  }

  return { ok: true };
}
```

**使用方式**：
```bash
curl -H "Authorization: Bearer <token>" https://2ch.tw/admin/system-status
```

---

### 3. [HIGH] Link Preview SSRF 防護

**問題**：原本僅用 hostname regex 檢查，`redirect: "follow"` 可能重導向到內部服務。

**修復** (`src/agents/linkPreview.ts`)：

1. **DNS 解析驗證**：在 fetch 前解析 hostname 並檢查 IP 是否為私有位址
2. **手動重導向處理**：使用 `redirect: "manual"` 並在每一跳驗證目標 IP
3. **雲端 metadata 阻擋**：明確阻擋 `169.254.169.254` 等 metadata endpoints
4. **圖片 URL 驗證**：OG image URL 也需通過 IP 驗證

```typescript
// 私有 IP 範圍阻擋
const BLOCKED_IP_RANGES = [
  { start: parseIPv4("10.0.0.0"), end: parseIPv4("10.255.255.255") },
  { start: parseIPv4("172.16.0.0"), end: parseIPv4("172.31.255.255") },
  { start: parseIPv4("192.168.0.0"), end: parseIPv4("192.168.255.255") },
  { start: parseIPv4("169.254.0.0"), end: parseIPv4("169.254.255.255") },
  // ... 更多範圍
];

// 雲端 metadata 阻擋
const BLOCKED_METADATA_HOSTS = [
  "169.254.169.254",  // AWS, GCP, Azure metadata
  "metadata.google.internal",
];

// 手動重導向處理
async function safeFetch(url: string, controller: AbortController, redirectCount = 0) {
  const validation = await resolveAndValidateHost(parsedUrl.hostname);
  if (!validation.safe) return null;

  const response = await fetch(url, { redirect: 'manual' });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    return safeFetch(new URL(location, url).href, controller, redirectCount + 1);
  }

  return response;
}
```

---

### 4. [MEDIUM] 鎖定討論串強制檢查

**問題**：`isThreadLocked` 函數存在但未在回覆 handler 中使用。

**修復** (`src/agents/api/posts.ts`)：
```typescript
import { isThreadLocked } from "../persistence/postgres";

export async function createReplyHandler(req: Request, res: Response) {
  // ... 驗證 thread 存在 ...

  // 檢查是否已達 999 樓上限
  if (thread.replyCount >= 999) {
    res.status(403).json({ error: "此討論串已達 999 樓上限，已封存無法回覆" });
    return;
  }

  // 檢查討論串是否已被鎖定
  const locked = await isThreadLocked(threadId);
  if (locked) {
    res.status(403).json({ error: "此討論串已被鎖定，無法回覆" });
    return;
  }

  // ... 繼續處理 ...
}
```

---

### 5. [MEDIUM] IP Hash HMAC 加鹽

**問題**：原本使用純 SHA-256，IPv4 可被字典攻擊反推。

**修復** (`src/agents/api/posts.ts`, `admin.ts`)：
```typescript
function getIpHash(ip: string): string {
  // Use HMAC with server secret to prevent rainbow table attacks on IPv4
  const secret = process.env.APP_SECRET || "default-secret-change-me";
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}
```

**注意**：此修改會使現有的 IP hash 失效，需重新計算 admin IP hash（若仍使用 IP hash 認證）。

---

### 6. [LOW] 現代安全 Headers

**問題**：缺少 CSP、Referrer-Policy 等現代安全 headers；X-XSS-Protection 已過時。

**修復** (`nginx/conf.d/2ch.conf`)：
```nginx
# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;

# CSP: Allow inline scripts (needed for theme init), YouTube embeds, and external images
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; frame-src https://www.youtube.com https://youtube.com; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';" always;

add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;

# X-XSS-Protection removed - obsolete and can cause issues in modern browsers
```

---

### 7. [LOW] IP Hash 型別不一致

**問題**：`createPostHandler` 中 `getIpHash(req)` 傳入 `Request` 但函數預期 `string`。

**修復** (`src/agents/api/posts.ts`)：
```typescript
export async function createPostHandler(req: Request, res: Response) {
  const realIp = getRealIp(req);
  const ipHash = getIpHash(realIp);  // 正確：先取得 IP 再 hash
  // ...
}
```

---

## 待處理項目

### [MEDIUM] Rate Limiting 改用 Redis

**現況**：Rate limiting 僅存於單進程記憶體，重啟或多進程部署時會失效。

**建議修復方案**：
1. 使用 Redis 儲存 rate limit 計數器
2. 或使用 Nginx `limit_req` 模組在反向代理層實作

---

## 部署步驟

### 1. 更新環境變數

```bash
# 產生 secrets
openssl rand -hex 32  # APP_SECRET
openssl rand -hex 32  # ADMIN_API_TOKEN
```

### 2. 更新 `.env.prod`

```bash
APP_SECRET=<generated_secret>
ADMIN_API_TOKEN=<generated_token>
```

### 3. 更新 `docker-compose.deploy.yml`

確保 API 服務包含新環境變數：
```yaml
environment:
  APP_SECRET: ${APP_SECRET}
  ADMIN_API_TOKEN: ${ADMIN_API_TOKEN}
```

### 4. 重建並部署

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.prod build api
docker compose -f docker-compose.deploy.yml --env-file .env.prod up -d
```

---

## 測試驗證

### Admin 認證測試

```bash
# 無 token - 應回傳 401
curl https://2ch.tw/admin/system-status
# {"error":"authorization header required"}

# 有 token - 應回傳系統狀態
curl -H "Authorization: Bearer <token>" https://2ch.tw/admin/system-status
# {"timestamp":"...","system":{...}}
```

### SSRF 防護測試

```bash
# 內部 IP 應被阻擋
curl -X POST https://2ch.tw/posts/1/replies \
  -H "Content-Type: application/json" \
  -d '{"content":"test http://169.254.169.254/latest/meta-data"}'
# Link preview 應為 null（被阻擋）
```

---

## 相關檔案變更

- `nginx/nginx.conf` - 移除重複的安全 headers
- `nginx/conf.d/2ch.conf` - 更新安全 headers、修復 XFF
- `src/main.ts` - 加入 trust proxy、調整 middleware 順序
- `src/agents/api/admin.ts` - 使用 checkAdminAuth、HMAC IP hash
- `src/agents/api/posts.ts` - 修復 IP hash、加入 locked thread 檢查
- `src/agents/guard/adminGuard.ts` - 新增 Bearer token 認證
- `src/agents/linkPreview.ts` - 完整 SSRF 防護實作
- `docker-compose.deploy.yml` - 加入新環境變數
- `.env.example` - 加入 ADMIN_API_TOKEN 說明
- `.env.prod` - 加入實際 token 值

---

## 附錄：Admin Token

**生產環境 Token**（請妥善保管）：
```
c7035b9749fef61e2864921e1716c5b08e2844f6caf570bf235b270c91578964
```

若需更換，請重新產生並更新 `.env.prod` 後重啟容器。
