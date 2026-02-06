/**
 * Admin Guard 測試
 *
 * 確保：
 * 1. Bearer Token 認證正確運作
 * 2. Timing-safe comparison 防止時序攻擊
 * 3. Token 未設定時回傳適當錯誤
 * 4. checkAdminAuth 不再 fallback 到 IP Hash
 * 5. 刪除理由驗證正確
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkAdminToken,
  checkAdminAuth,
  checkDeleteReason,
} from '../../../src/agents/guard/adminGuard';

describe('adminGuard', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('checkAdminToken', () => {
    it('正確 Bearer Token 應通過', () => {
      process.env.ADMIN_API_TOKEN = 'secret-admin-token';
      const result = checkAdminToken('Bearer secret-admin-token');
      expect(result.ok).toBe(true);
    });

    it('錯誤 Token 應返回 403', () => {
      process.env.ADMIN_API_TOKEN = 'secret-admin-token';
      const result = checkAdminToken('Bearer wrong-token-here');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(403);
        expect(result.error).toContain('invalid admin token');
      }
    });

    it('長度不同的 Token 應返回 403', () => {
      process.env.ADMIN_API_TOKEN = 'secret-admin-token';
      const result = checkAdminToken('Bearer short');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(403);
      }
    });

    it('缺少 Authorization header 應返回 401', () => {
      process.env.ADMIN_API_TOKEN = 'secret-admin-token';
      const result = checkAdminToken(undefined);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(401);
      }
    });

    it('非 Bearer 格式應返回 401', () => {
      process.env.ADMIN_API_TOKEN = 'secret-admin-token';
      const result = checkAdminToken('Basic dXNlcjpwYXNz');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(401);
        expect(result.error).toContain('Bearer');
      }
    });

    it('Token 未設定應返回 401 (token_not_configured)', () => {
      delete process.env.ADMIN_API_TOKEN;
      const result = checkAdminToken('Bearer any-token');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(401);
        expect(result.error).toBe('token_not_configured');
      }
    });

    it('空字串 Token 視為未設定', () => {
      process.env.ADMIN_API_TOKEN = '  ';
      const result = checkAdminToken('Bearer any-token');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('token_not_configured');
      }
    });
  });

  describe('checkAdminAuth', () => {
    it('正確 Bearer Token 應通過', () => {
      process.env.ADMIN_API_TOKEN = 'correct-token';
      const result = checkAdminAuth('Bearer correct-token', 'some-ip-hash');
      expect(result.ok).toBe(true);
    });

    it('Token 未設定時不 fallback 到 IP Hash，返回 503', () => {
      delete process.env.ADMIN_API_TOKEN;
      process.env.ADMIN_IP_HASHES = 'valid-hash';
      const result = checkAdminAuth(undefined, 'valid-hash');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(503);
        expect(result.error).toContain('ADMIN_API_TOKEN');
      }
    });

    it('錯誤 Token 不 fallback 到 IP Hash', () => {
      process.env.ADMIN_API_TOKEN = 'correct-token';
      process.env.ADMIN_IP_HASHES = 'valid-hash';
      const result = checkAdminAuth('Bearer wrong-token', 'valid-hash');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(403);
      }
    });
  });

  describe('checkDeleteReason', () => {
    it('有效理由應通過', () => {
      const result = checkDeleteReason('違反版規');
      expect(result.ok).toBe(true);
    });

    it('空理由應返回 400', () => {
      const result = checkDeleteReason('');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
      }
    });

    it('undefined 理由應返回 400', () => {
      const result = checkDeleteReason(undefined);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.error).toContain('reason');
      }
    });

    it('純空白理由應返回 400', () => {
      const result = checkDeleteReason('   ');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
      }
    });

    it('超長理由（>200 字）應返回 400', () => {
      const longReason = '理'.repeat(201);
      const result = checkDeleteReason(longReason);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.error).toContain('200');
      }
    });

    it('200 字剛好應通過', () => {
      const exactReason = '理'.repeat(200);
      const result = checkDeleteReason(exactReason);
      expect(result.ok).toBe(true);
    });
  });
});
