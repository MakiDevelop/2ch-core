#!/usr/bin/env tsx
/**
 * 修復腳本 - 清理錯誤的樓層引用
 *
 * 錯誤情況：
 * 1. 引用自己（樓N說 >>N）
 * 2. 引用不存在的樓層（引用的樓層 > 當前樓層）
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/2ch',
});

async function main() {
  console.log('🔧 修復錯誤的樓層引用\n');

  // 1. 找出所有討論串
  const threads = await pool.query(`
    SELECT id, title FROM posts WHERE parent_id IS NULL
  `);

  let totalFixed = 0;
  let totalChecked = 0;

  for (const thread of threads.rows) {
    // 2. 取得該討論串的所有回覆，按時間排序
    const replies = await pool.query(`
      SELECT id, content, created_at
      FROM posts
      WHERE parent_id = $1
      ORDER BY created_at ASC
    `, [thread.id]);

    // 建立樓層對照表：樓層1是主題，樓層2開始是回覆
    const floorMap: { [floor: number]: number } = {}; // floor -> post id
    floorMap[1] = thread.id; // 主題是樓層1

    for (let i = 0; i < replies.rows.length; i++) {
      const floor = i + 2; // 回覆從樓層2開始
      floorMap[floor] = replies.rows[i].id;
    }

    // 3. 檢查每則回覆的引用是否正確
    for (let i = 0; i < replies.rows.length; i++) {
      const reply = replies.rows[i];
      const currentFloor = i + 2;
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
        const isInvalidFloor = refFloor >= currentFloor || refFloor < 1;
        const isNonExistent = !floorMap[refFloor];

        if (isSelfReference || isInvalidFloor || isNonExistent) {
          console.log(`  ❌ #${thread.id} 樓${currentFloor}: "${match}" 是錯誤引用`);
          if (isSelfReference) console.log(`     原因: 引用自己`);
          if (isInvalidFloor) console.log(`     原因: 引用樓層 ${refFloor} >= 當前樓層 ${currentFloor}`);
          if (isNonExistent) console.log(`     原因: 樓層 ${refFloor} 不存在`);

          // 移除錯誤的引用（只移除開頭的引用標記，保留後面的內容）
          newContent = newContent.replace(new RegExp(`^${match}\\s*`, 'm'), '');
          needsFix = true;
        }
      }

      // 4. 更新修正後的內容
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
