import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Node 環境（不是 browser）
    environment: 'node',
    // 測試檔案位置
    include: ['tests/**/*.test.ts'],
    // 全域 timeout
    testTimeout: 10000,
    // 測試用環境變數
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/2ch_test',
      APP_SECRET: 'test-secret-for-unit-tests',
    },
  },
});
