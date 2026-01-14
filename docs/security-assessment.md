# Security Assessment (Static Review)

Scope: static review of the codebase and configuration only. No live scanning or active testing.

## Executive Summary
- Critical risk found in admin authentication due to trusted client-controlled headers.
- High risk SSRF exposure in link preview logic via DNS rebinding/redirects.
- Several medium/low hardening gaps (rate limit scope, missing headers, lock enforcement).

## Findings (Issue List)

### [CRITICAL] Admin auth bypass via X-Forwarded-For spoofing
- Evidence: `src/agents/api/admin.ts` (getIpHash trusts `x-forwarded-for`), `nginx/conf.d/2ch.conf` (proxy appends client header)
- Impact: attacker can send `X-Forwarded-For: <admin_ip>` and gain admin access
- Fix: overwrite `X-Forwarded-For` with `$remote_addr` in Nginx; set `app.set("trust proxy", 1)` and only use `req.ip`; move to strong auth (token/API key/mTLS)

### [HIGH] Admin endpoints lack strong authentication and CSRF defense
- Evidence: `src/agents/guard/adminGuard.ts`, `src/agents/api/admin.ts`
- Impact: IP-hash is weak; admin actions can be triggered via CSRF if an admin browses a malicious page
- Fix: require strong auth (Bearer token/Basic Auth/mTLS) and restrict admin endpoints to internal/VPN

### [HIGH] Link preview SSRF via DNS rebinding or redirects
- Evidence: `src/agents/linkPreview.ts` (hostname regex only; `redirect: "follow"`)
- Impact: attacker can reach internal networks/metadata endpoints
- Fix: resolve hostname to IP and block private/reserved ranges; validate every redirect hop; consider allowlist-only

### [MEDIUM] Locked thread not enforced in reply handler
- Evidence: `src/agents/persistence/postgres.ts` has `isThreadLocked` but it is unused; `src/agents/api/posts.ts` lacks the check
- Impact: users can reply to locked threads
- Fix: call `isThreadLocked(threadId)` in `createReplyHandler` and return 403 when locked

### [MEDIUM] Rate limiting is per-process memory only
- Evidence: `src/agents/guard/postGuard.ts`
- Impact: multi-process or restarts bypass throttling; weak anti-spam/DoS
- Fix: use Redis or Nginx `limit_req` for global rate limit

### [MEDIUM] IP hash without salt exposes privacy risk
- Evidence: `src/agents/api/admin.ts`, `src/agents/api/posts.ts` (SHA-256 on IP)
- Impact: leaked hashes are reversible for IPv4 by dictionary
- Fix: use HMAC with server secret; do not use IP hash for admin auth

### [LOW] Missing modern security headers
- Evidence: `nginx/conf.d/2ch.conf`
- Impact: weaker baseline protections; `X-XSS-Protection` is obsolete
- Fix: add CSP, Referrer-Policy, Permissions-Policy; remove `X-XSS-Protection`

### [LOW] Post creation uses inconsistent IP hashing
- Evidence: `src/agents/api/posts.ts` uses `getIpHash(req)` (type mismatch)
- Impact: runtime errors or inconsistent throttling
- Fix: obtain real IP first, then hash it (same as other handlers)

## Threat Modeling Notes (STRIDE-lite)
- Assets: admin actions, posts content, IP/UA/real_ip (PII)
- Trust boundaries: Browser -> Nginx -> Node/Express -> PostgreSQL/Redis
- High-risk flows: `/admin/*`, link preview fetch, post creation
- Priority controls: admin authentication, SSRF protections, global rate limiting, audit logging/alerting

## Compliance-Oriented Test Checklist
- AuthZ: admin endpoint access, header spoofing, locked thread enforcement
- Input validation: content limits, title limits, embed URL parsing
- SSRF: link preview internal IP/metadata access and redirect validation
- Availability: flood testing with single and multiple IPs
- Security headers: CSP/Referrer/Permissions/HSTS
- Data protection: real_ip storage/retention; DB least privilege; backup encryption
- Audit: admin action logs completeness and tamper resistance

