/**
 * postGuard 單元測試
 *
 * 測試發文防護邏輯，確保：
 * 1. 正常內容可以通過
 * 2. 惡意/垃圾內容被擋下
 * 3. async 函數正確返回 Promise
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { checkCreatePost, validateReplyReferences } from '../../../src/agents/guard/postGuard';

describe('postGuard', () => {
  describe('checkCreatePost', () => {
    // 使用固定的 ipHash 避免 rate limit 問題
    const testIpHash = () => `test-${Date.now()}-${Math.random()}`;

    describe('基本驗證', () => {
      it('應該接受有效的中文內容', async () => {
        const result = await checkCreatePost({
          content: '這是一篇正常的討論內容',
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.content).toBe('這是一篇正常的討論內容');
        }
      });

      it('應該接受有效的英文內容', async () => {
        const result = await checkCreatePost({
          content: 'This is a valid English post content',
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(true);
      });

      it('應該拒絕空內容', async () => {
        const result = await checkCreatePost({
          content: '',
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.status).toBe(400);
        }
      });

      it('應該拒絕非字串內容', async () => {
        const result = await checkCreatePost({
          content: 123 as unknown as string,
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.status).toBe(400);
          expect(result.error).toContain('string');
        }
      });

      it('應該拒絕超長內容', async () => {
        const longContent = '中'.repeat(10001);
        const result = await checkCreatePost({
          content: longContent,
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.status).toBe(400);
          expect(result.error).toContain('too long');
        }
      });
    });

    describe('垃圾內容檢測', () => {
      it('應該拒絕鍵盤亂打 (asdf)', async () => {
        const result = await checkCreatePost({
          content: 'asdfasdfasdf',
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain('亂碼');
        }
      });

      it('應該拒絕重複字元 (dddddd)', async () => {
        const result = await checkCreatePost({
          content: 'dddddddddd',
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(false);
      });

      it('應該接受常見網路用語 (lol, www)', async () => {
        const result1 = await checkCreatePost({
          content: 'www',
          ipHash: testIpHash(),
          isReply: true,
        });
        expect(result1.ok).toBe(true);

        const result2 = await checkCreatePost({
          content: 'lol',
          ipHash: testIpHash(),
          isReply: true,
        });
        expect(result2.ok).toBe(true);
      });

      it('回覆應該接受單字中文 (草)', async () => {
        const result = await checkCreatePost({
          content: '草',
          ipHash: testIpHash(),
          isReply: true,
        });

        expect(result.ok).toBe(true);
      });

      it('發文應該拒絕單字中文', async () => {
        const result = await checkCreatePost({
          content: '草',
          ipHash: testIpHash(),
          isReply: false,
        });

        expect(result.ok).toBe(false);
      });
    });

    describe('Embed 標籤安全性', () => {
      it('應該保留白名單 <iu> 標籤（imgur）', async () => {
        const result = await checkCreatePost({
          content: '看這張圖 <iu>https://i.imgur.com/abc123.jpg</iu>',
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.content).toContain('<iu>https://i.imgur.com/abc123.jpg</iu>');
        }
      });

      it('應該過濾非白名單域名的 <iu>', async () => {
        const result = await checkCreatePost({
          content: '看這張圖 <iu>https://evil.com/image.jpg</iu>',
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.content).toContain('[無效圖片連結]');
          expect(result.content).not.toContain('evil.com');
        }
      });

      it('應該過濾無效的 <iu> URL (非 https)', async () => {
        const result = await checkCreatePost({
          content: '看這張圖 <iu>http://i.imgur.com/image.jpg</iu>',
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.content).toContain('[無效圖片連結]');
        }
      });

      it('應該過濾 XSS 攻擊 (javascript:)', async () => {
        const result = await checkCreatePost({
          content: '這是一張圖片 <iu>javascript:alert(1)</iu> 請看',
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.content).toContain('[無效圖片連結]');
          expect(result.content).not.toContain('javascript:');
        }
      });

      it('應該保留白名單 <yt> 標籤（YouTube）', async () => {
        const result = await checkCreatePost({
          content: '看影片 <yt>https://www.youtube.com/watch?v=abc123</yt>',
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.content).toContain('<yt>https://www.youtube.com/watch?v=abc123</yt>');
        }
      });

      it('應該保留 youtu.be 短網址', async () => {
        const result = await checkCreatePost({
          content: '看影片 <yt>https://youtu.be/abc123</yt>',
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.content).toContain('<yt>https://youtu.be/abc123</yt>');
        }
      });

      it('應該過濾非 YouTube 域名的 <yt>', async () => {
        const result = await checkCreatePost({
          content: '看影片 <yt>https://vimeo.com/12345</yt>',
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.content).toContain('[無效影片連結]');
          expect(result.content).not.toContain('vimeo.com');
        }
      });

      it('應該保留 reddit 圖片', async () => {
        const result = await checkCreatePost({
          content: '看圖 <iu>https://i.redd.it/abc123.png</iu>',
          ipHash: testIpHash(),
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.content).toContain('<iu>https://i.redd.it/abc123.png</iu>');
        }
      });
    });

    describe('async/await 正確性（防止 2026-02-02 事故）', () => {
      it('checkCreatePost 應該返回 Promise', () => {
        const result = checkCreatePost({
          content: '測試內容',
          ipHash: testIpHash(),
        });

        // 確認返回的是 Promise
        expect(result).toBeInstanceOf(Promise);
      });

      it('await checkCreatePost 應該得到正確結果', async () => {
        const result = await checkCreatePost({
          content: '測試內容',
          ipHash: testIpHash(),
        });

        // 確認 await 後得到的是物件，不是 Promise
        expect(result).not.toBeInstanceOf(Promise);
        expect(typeof result).toBe('object');
        expect('ok' in result).toBe(true);
      });
    });
  });

  describe('validateReplyReferences', () => {
    it('應該接受沒有引用的內容', () => {
      const result = validateReplyReferences('這是一般回覆', 10);
      expect(result.ok).toBe(true);
    });

    it('應該接受有效的引用', () => {
      const result = validateReplyReferences('>>5 同意樓上', 10);
      expect(result.ok).toBe(true);
    });

    it('應該拒絕引用不存在的樓層', () => {
      const result = validateReplyReferences('>>15 這樓不存在', 10);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('不存在');
      }
    });

    it('應該拒絕過多引用（超過 10 個）', () => {
      const manyRefs = Array.from({ length: 11 }, (_, i) => `>>${i + 1}`).join(' ');
      const result = validateReplyReferences(manyRefs + ' 太多引用了', 20);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('過多');
      }
    });

    it('應該拒絕只有引用沒有實質內容', () => {
      const result = validateReplyReferences('>>1', 10);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('實質內容');
      }
    });
  });
});
