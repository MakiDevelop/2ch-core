/**
 * 測試發文功能是否正常
 *
 * 用法：
 *   npx tsx scripts/test-post-guard.ts [API_URL]
 *
 * 範例：
 *   npx tsx scripts/test-post-guard.ts                     # 測試 localhost:3000
 *   npx tsx scripts/test-post-guard.ts https://dev.2ch.tw  # 測試 dev 環境
 *   npx tsx scripts/test-post-guard.ts https://2ch.tw      # 測試 production
 */

const API_BASE = process.argv[2] || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<boolean>, expectedDetails?: string) {
  try {
    const passed = await fn();
    results.push({ name, passed, details: expectedDetails });
    console.log(passed ? `✅ ${name}` : `❌ ${name}${expectedDetails ? ` - ${expectedDetails}` : ''}`);
  } catch (err: any) {
    results.push({ name, passed: false, details: err.message });
    console.log(`❌ ${name} - Error: ${err.message}`);
  }
}

async function main() {
  console.log(`\n🧪 測試 API: ${API_BASE}\n`);
  console.log('─'.repeat(50));

  // 測試 1: API 健康檢查
  await test('API 健康檢查', async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  });

  // 測試 2: 正常發文應該成功
  await test('正常發文應該成功', async () => {
    const res = await fetch(`${API_BASE}/boards/meta/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `[測試] ${new Date().toISOString()}`,
        content: '這是自動化測試發文，請忽略。測試完成後會刪除。',
        authorName: '測試機器人'
      })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Status ${res.status}: ${error.error || JSON.stringify(error)}`);
    }

    const data = await res.json();
    // 記錄 post ID 以便後續清理
    console.log(`   ↳ 建立了測試文章 ID: ${data.id}`);
    return true;
  });

  // 測試 3: 空內容應該被拒絕
  await test('空內容應該被拒絕 (400)', async () => {
    const res = await fetch(`${API_BASE}/boards/meta/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '測試標題',
        content: '',
        authorName: '測試者'
      })
    });
    return res.status === 400;
  });

  // 測試 4: 缺少標題應該被拒絕
  await test('缺少標題應該被拒絕 (400)', async () => {
    const res = await fetch(`${API_BASE}/boards/meta/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '測試內容',
        authorName: '測試者'
      })
    });
    return res.status === 400;
  });

  // 測試 5: 回覆功能（需要有效的 thread ID）
  await test('回覆功能正常', async () => {
    // 先取得一個有效的 thread
    const threadsRes = await fetch(`${API_BASE}/boards/meta/threads`);
    const threadsData = await threadsRes.json();

    if (!threadsData.threads || threadsData.threads.length === 0) {
      throw new Error('沒有可用的討論串');
    }

    const threadId = threadsData.threads[0].id;

    const res = await fetch(`${API_BASE}/posts/${threadId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `[測試回覆] ${new Date().toISOString()}`,
        authorName: '測試機器人'
      })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Status ${res.status}: ${error.error || JSON.stringify(error)}`);
    }

    return true;
  });

  // 測試 6: Guard 真的有在運作（檢查是否回傳正確結構）
  await test('Guard 回傳正確結構', async () => {
    const res = await fetch(`${API_BASE}/boards/meta/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `[Guard測試] ${Date.now()}`,
        content: '測試 Guard 功能',
        authorName: '測試者'
      })
    });

    const data = await res.json();

    // 成功時應該有 id 和 editToken
    if (res.ok) {
      return typeof data.id === 'number' && typeof data.editToken === 'string';
    }

    // 失敗時應該有 error
    return typeof data.error === 'string';
  });

  // 總結
  console.log('\n' + '─'.repeat(50));
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\n📊 結果: ${passed}/${total} 通過`);

  if (passed === total) {
    console.log('🎉 所有測試通過！\n');
    process.exit(0);
  } else {
    console.log('⚠️  有測試失敗，請檢查\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('測試執行失敗:', err);
  process.exit(1);
});
