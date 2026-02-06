/**
 * CSRF Guard Middleware 測試
 *
 * 確保：
 * 1. GET/HEAD/OPTIONS 請求不受影響
 * 2. 來自允許 origin 的 POST/PUT/PATCH/DELETE 可以通過
 * 3. 來自未知 origin 的 state-changing 請求被擋下
 * 4. Bearer token 請求跳過 CSRF 檢查
 * 5. 沒有 Origin/Referer 的請求允許通過
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { csrfGuard } from '../../src/middleware/csrfGuard';
import type { Request, Response, NextFunction } from 'express';

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    path: '/test',
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function createMockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

describe('csrfGuard', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  describe('安全方法（GET/HEAD/OPTIONS）不檢查', () => {
    it('GET 請求應直接通過', () => {
      const req = createMockReq({ method: 'GET' });
      const res = createMockRes();
      csrfGuard(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('HEAD 請求應直接通過', () => {
      const req = createMockReq({ method: 'HEAD' });
      const res = createMockRes();
      csrfGuard(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('OPTIONS 請求應直接通過', () => {
      const req = createMockReq({ method: 'OPTIONS' });
      const res = createMockRes();
      csrfGuard(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('允許的 Origin', () => {
    const allowedOrigins = [
      'https://2ch.tw',
      'https://dev.2ch.tw',
      'http://localhost:3000',
      'http://localhost',
    ];

    for (const origin of allowedOrigins) {
      it(`POST 來自 ${origin} 應通過`, () => {
        const req = createMockReq({
          method: 'POST',
          headers: { origin },
        });
        const res = createMockRes();
        csrfGuard(req, res, next);
        expect(next).toHaveBeenCalled();
      });
    }

    it('PUT 來自 2ch.tw 應通過', () => {
      const req = createMockReq({
        method: 'PUT',
        headers: { origin: 'https://2ch.tw' },
      });
      const res = createMockRes();
      csrfGuard(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('DELETE 來自 2ch.tw 應通過', () => {
      const req = createMockReq({
        method: 'DELETE',
        headers: { origin: 'https://2ch.tw' },
      });
      const res = createMockRes();
      csrfGuard(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('PATCH 來自 2ch.tw 應通過', () => {
      const req = createMockReq({
        method: 'PATCH',
        headers: { origin: 'https://2ch.tw' },
      });
      const res = createMockRes();
      csrfGuard(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Referer 作為 fallback', () => {
    it('有 Referer 且 origin 合法應通過', () => {
      const req = createMockReq({
        method: 'POST',
        headers: { referer: 'https://2ch.tw/boards/chat/threads' },
      });
      const res = createMockRes();
      csrfGuard(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('Referer 來自非法 origin 應被擋', () => {
      const req = createMockReq({
        method: 'POST',
        headers: { referer: 'https://evil.com/attack' },
      });
      const res = createMockRes();
      csrfGuard(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('未知 Origin 被阻擋', () => {
    it('POST 來自未知 origin 應返回 403', () => {
      const req = createMockReq({
        method: 'POST',
        path: '/boards/chat/threads',
        headers: { origin: 'https://evil.com' },
      });
      const res = createMockRes();
      csrfGuard(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('origin') })
      );
    });

    it('DELETE 來自未知 origin 應返回 403', () => {
      const req = createMockReq({
        method: 'DELETE',
        headers: { origin: 'https://attacker.site' },
      });
      const res = createMockRes();
      csrfGuard(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Bearer Token 跳過 CSRF 檢查', () => {
    it('POST 帶 Bearer token 即使 origin 不合法也應通過', () => {
      const req = createMockReq({
        method: 'POST',
        headers: {
          origin: 'https://evil.com',
          authorization: 'Bearer some-admin-token',
        },
      });
      const res = createMockRes();
      csrfGuard(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('非 Bearer 格式的 Authorization 不跳過檢查', () => {
      const req = createMockReq({
        method: 'POST',
        headers: {
          origin: 'https://evil.com',
          authorization: 'Basic dXNlcjpwYXNz',
        },
      });
      const res = createMockRes();
      csrfGuard(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('無 Origin/Referer 的請求', () => {
    it('POST 沒有 Origin 和 Referer 應允許通過（curl 等工具）', () => {
      const req = createMockReq({
        method: 'POST',
        headers: {},
      });
      const res = createMockRes();
      csrfGuard(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
