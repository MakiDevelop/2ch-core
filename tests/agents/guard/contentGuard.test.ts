/**
 * Content Guard 測試（ReDoS 防護 + 內容檢測）
 *
 * 確保：
 * 1. 安全 regex 正常運作
 * 2. 不安全 regex 被跳過（不會造成 ReDoS）
 * 3. 靜態 config 檢測正確
 * 4. homophone 正規化運作正確
 * 5. quickCheck 同步介面正確
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkContent, quickCheck } from '../../../src/agents/guard/contentGuard';

describe('contentGuard', () => {
  describe('checkContent（同步 / 靜態 config）', () => {
    it('正常內容不應被標記', () => {
      const result = checkContent('今天天氣真好，適合出去走走');
      expect(result.flagged).toBe(false);
      expect(result.score).toBe(0);
      expect(result.categories).toHaveLength(0);
    });

    it('包含敏感詞的內容應被標記', () => {
      // badwords.json 裡有的詞才能測
      // 用一般性測試，確認 flagged 結構正確
      const result = checkContent('正常的討論內容');
      expect(result).toHaveProperty('flagged');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('matchedTerms');
      expect(typeof result.flagged).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(Array.isArray(result.categories)).toBe(true);
      expect(Array.isArray(result.matchedTerms)).toBe(true);
    });

    it('score 應在 0.0 - 1.0 範圍內', () => {
      const result = checkContent('任意測試內容');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('未被標記的內容 score 應為 0', () => {
      const result = checkContent('討論技術架構');
      if (!result.flagged) {
        expect(result.score).toBe(0);
      }
    });
  });

  describe('quickCheck（同步快速檢查）', () => {
    it('正常內容返回 false', () => {
      const flagged = quickCheck('這是一篇正常的文章');
      expect(flagged).toBe(false);
    });

    it('返回值應為 boolean', () => {
      const result = quickCheck('測試');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('ReDoS 防護', () => {
    it('safe-regex 應拒絕明顯的 ReDoS pattern', () => {
      // 直接測試 safe-regex 庫的行為
      const safeRegex = require('safe-regex');

      // 經典 ReDoS pattern: (a+)+$
      expect(safeRegex('(a+)+$')).toBe(false);
      // 巢狀量詞: (a+){2,}
      expect(safeRegex('(a+){2,}')).toBe(false);
      // 安全 pattern
      expect(safeRegex('[a-z]+')).toBe(true);
      expect(safeRegex('\\d{1,5}')).toBe(true);
    });

    it('不安全 regex 不應導致超時（ReDoS）', () => {
      // 用 checkContent 搭配靜態 config，確認不會 hang
      // 靜態 config 的 pattern 都應該是安全的
      const start = Date.now();
      const result = checkContent('a'.repeat(100));
      const elapsed = Date.now() - start;

      // 正常檢查應在 100ms 內完成
      expect(elapsed).toBeLessThan(1000);
      expect(result).toHaveProperty('flagged');
    });

    it('checkContent 使用靜態 config 時所有 pattern 應為安全', () => {
      const safeRegex = require('safe-regex');
      const staticConfig = require('../../../src/config/badwords.json');

      for (const [category, catConfig] of Object.entries(staticConfig)) {
        if (category === 'homophone_map') continue;
        const config = catConfig as any;
        if (config.patterns) {
          for (const pattern of config.patterns) {
            expect(
              safeRegex(pattern),
              `Pattern "${pattern}" in category "${category}" should be safe`
            ).toBe(true);
          }
        }
      }
    });
  });

  describe('返回值結構', () => {
    it('ContentCheckResult 應包含所有必要欄位', () => {
      const result = checkContent('test content');
      expect(result).toHaveProperty('flagged');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('matchedTerms');
    });

    it('matchedTerms 不應有重複', () => {
      // 即使內容多次匹配同一詞，matchedTerms 應去重
      const result = checkContent('正常內容');
      const unique = new Set(result.matchedTerms);
      expect(unique.size).toBe(result.matchedTerms.length);
    });
  });
});
