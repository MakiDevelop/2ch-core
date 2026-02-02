#!/usr/bin/env tsx
/**
 * 修復腳本 v2 - 修正樓層引用
 *
 * 前端樓層計算方式：回覆從1樓開始，主題不算樓
 * - 主題 = 不算樓
 * - 第1則回覆 = 1樓
 * - 第2則回覆 = 2樓
 * - ...
 *
 * 錯誤情況：
 * 1. 引用自己（N樓說 >>N）
 * 2. 引用不存在的樓層（引用的樓層 >= 當前樓層）
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/2ch',
});

async function main() {
  console.log('🔧 修復錯誤的樓層引用 v2（前端樓層計算）\n');

  // 找出所有討論串
  const threads = await pool.query(`
    SELECT id, title FROM posts WHERE parent_id IS NULL
  `);

  let totalFixed = 0;
  let totalChecked = 0;

  for (const thread of threads.rows) {
    // 取得該討論串的所有回覆，按時間排序
    const replies = await pool.query(`
      SELECT id, content, created_at
      FROM posts
      WHERE parent_id = $1
      ORDER BY created_at ASC
    `, [thread.id]);

    // 前端樓層計算：回覆從1樓開始
    // 第1則回覆 = 1樓, 第2則回覆 = 2樓, ...
    for (let i = 0; i < replies.rows.length; i++) {
      const reply = replies.rows[i];
      const currentFloor = i + 1; // 1-based，第1則回覆是1樓
      const content = reply.content;
      totalChecked++;

      // 找出所有 >>數字 的引用
      const refPattern = /^>>\d+/gm;
      const matches = content.match(refPattern);

      if (!matches) continue;

      let newContent = content;
      let needsFix = false;

      for (const match of matches) {
        const refFloor = parseInt(match.replace('>>', ''));

        // 檢查錯誤情況
        const isSelfReference = refFloor === currentFloor;
        const isInvalidFloor = refFloor >= currentFloor; // 不能引用自己或之後的樓
        const isNonExistent = refFloor < 1 || refFloor > replies.rows.length;

        if (isSelfReference || isInvalidFloor || isNonExistent) {
          console.log(`  ❌ #${thread.id} ${currentFloor}樓: "${match}" 錯誤引用`);
          if (isSelfReference) console.log(`     → 引用自己`);
          else if (refFloor >= currentFloor) console.log(`     → 引用 ${refFloor}樓 >= 當前 ${currentFloor}樓`);
          else if (isNonExistent) console.log(`     → ${refFloor}樓不存在`);

          // 移除錯誤的引用
          newContent = newContent.replace(new RegExp(`^${match}\\s*`, 'm'), '');
          needsFix = true;
        }
      }

      if (needsFix) {
        newContent = newContent.trim();
        await pool.query(
          'UPDATE posts SET content = $1 WHERE id = $2',
          [newContent, reply.id]
        );
        totalFixed++;
        console.log(`     ✅ 已修正\n`);
      }
    }
  }

  console.log(`\n📊 統計:`);
  console.log(`  - 檢查了 ${totalChecked} 則回覆`);
  console.log(`  - 修正了 ${totalFixed} 則錯誤引用`);
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
