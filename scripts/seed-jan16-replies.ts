#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-16 - Reply補充
 *
 * 為回覆數少於 3 則的討論串補充回覆
 */

import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/2ch',
});

function generateIpHash(): string {
  const randomIp = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  return crypto.createHash('sha256').update(randomIp).digest('hex');
}

const userAgents = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
];

function randomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

async function insertReply(
  parentId: number,
  content: string,
  authorName: string = '名無しさん',
  hoursAgo: number = 1
): Promise<void> {
  await pool.query(
    `INSERT INTO posts (content, status, ip_hash, user_agent, parent_id, board_id, author_name, created_at)
     VALUES ($1, $2, $3, $4, $5, NULL, $6, NOW() - INTERVAL '1 hour' * $7)`,
    [content, 0, generateIpHash(), randomUserAgent(), parentId, authorName, hoursAgo]
  );
}

async function seedReplies() {
  console.log('📝 為回覆數少於 3 則的討論串補充回覆...\n');

  // === 0 回覆的討論串 ===

  // id: 988 - 有些討論版會有重複的文章或回文 (meta)
  console.log('  補充 #988 - 有些討論版會有重複的文章或回文');
  await insertReply(988, '是 bug 嗎？可以回報給站長', '名無しさん', 1);
  await insertReply(988, '有截圖嗎？方便追蹤問題', '名無しさん', 2);
  await insertReply(988, '我也有遇到過\n重新整理就正常了', '名無しさん', 3);

  // id: 576 - Phah jī 看覓 (chat) - 台語羅馬字
  console.log('  補充 #576 - Phah jī 看覓');
  await insertReply(576, '台語羅馬字？', '名無しさん', 1);
  await insertReply(576, '看起來是白話字', '名無しさん', 2);
  await insertReply(576, '這個站支援台語真好', '名無しさん', 3);

  // id: 361 - ^_^ (chat)
  console.log('  補充 #361 - ^_^');
  await insertReply(361, '^_^', '名無しさん', 1);
  await insertReply(361, '( ´ ▽ ` )ﾉ', '名無しさん', 2);
  await insertReply(361, '(ﾉ´∀`)ﾉ', '名無しさん', 3);

  // id: 187 - Debug Test (meta)
  console.log('  補充 #187 - Debug Test');
  await insertReply(187, '測試成功了嗎？', '名無しさん', 1);
  await insertReply(187, '站長辛苦了', '名無しさん', 2);
  await insertReply(187, '功能正常運作中', '名無しさん', 3);

  // id: 186 - Link Preview Test (meta)
  console.log('  補充 #186 - Link Preview Test');
  await insertReply(186, 'Link preview 功能很實用', '名無しさん', 1);
  await insertReply(186, '貼 YouTube 會自動嵌入嗎？', '名無しさん', 2);
  await insertReply(186, '測試看起來正常', '名無しさん', 3);

  // id: 185 - Link Test (meta)
  console.log('  補充 #185 - Link Test');
  await insertReply(185, '連結功能正常', '名無しさん', 1);
  await insertReply(185, '+1', '名無しさん', 2);
  await insertReply(185, '感謝站長測試', '名無しさん', 3);

  // id: 45 - test (chat)
  console.log('  補充 #45 - test');
  await insertReply(45, 'test 成功', '名無しさん', 1);
  await insertReply(45, '測試回覆', '名無しさん', 2);
  await insertReply(45, '( ･ω･)b', '名無しさん', 3);

  // id: 1 - (無標題) (chat)
  console.log('  補充 #1 - 第一篇文章');
  await insertReply(1, '這是第一篇文章嗎？', '名無しさん', 1);
  await insertReply(1, '見證歷史', '名無しさん', 2);
  await insertReply(1, '創站紀念', '名無しさん', 3);

  // === 1 回覆的討論串 ===

  // id: 989 - 為什麼有人可以爽爽擺爛不做事領薪水 (work)
  console.log('  補充 #989 - 為什麼有人可以爽爽擺爛不做事領薪水');
  await insertReply(989, '可能有背景吧', '名無しさん', 1);
  await insertReply(989, '老闆的親戚？', '名無しさん', 2);

  // id: 366 - 今天幫一個移工結帳 (chat)
  console.log('  補充 #366 - 今天幫一個移工結帳');
  await insertReply(366, '笑死www', '名無しさん', 1);
  await insertReply(366, '這畫面太有趣了', '名無しさん', 2);

  // id: 163 - 今の札幌 (chat)
  console.log('  補充 #163 - 今の札幌');
  await insertReply(163, '札幌現在很冷吧', '名無しさん', 1);
  await insertReply(163, '好想去北海道', '名無しさん', 2);

  // id: 161 - ええ~~ (chat)
  console.log('  補充 #161 - ええ~~');
  await insertReply(161, 'ええええ？', '名無しさん', 1);
  await insertReply(161, '發生什麼事了www', '名無しさん', 2);

  // id: 150 - 外國人寫春聯 (chat)
  console.log('  補充 #150 - 外國人寫春聯');
  await insertReply(150, '外國人寫的春聯都很有趣', '名無しさん', 1);
  await insertReply(150, '文化交流很棒', '名無しさん', 2);

  // id: 139 - 稅 (chat)
  console.log('  補充 #139 - 稅');
  await insertReply(139, '又要繳稅了...', '名無しさん', 1);
  await insertReply(139, '五月報稅季好可怕', '名無しさん', 2);

  // id: 136 - 🇹🇼 (chat)
  console.log('  補充 #136 - 台灣國旗');
  await insertReply(136, '🇹🇼🇹🇼🇹🇼', '名無しさん', 1);
  await insertReply(136, '台灣加油！', '名無しさん', 2);

  // id: 120 - Tzuyu (chat)
  console.log('  補充 #120 - Tzuyu');
  await insertReply(120, '子瑜好美', '名無しさん', 1);
  await insertReply(120, 'TWICE 台灣之光', '名無しさん', 2);

  // id: 117 - yut (chat)
  console.log('  補充 #117 - yut');
  await insertReply(117, '?', '名無しさん', 1);
  await insertReply(117, '這是什麼意思', '名無しさん', 2);

  // id: 83 - xss 2 (chat)
  console.log('  補充 #83 - xss 2');
  await insertReply(83, '資安測試？', '名無しさん', 1);
  await insertReply(83, '看來沒有被 XSS', '名無しさん', 2);

  // id: 56 - 圖圖圖 (chat)
  console.log('  補充 #56 - 圖圖圖');
  await insertReply(56, '圖呢？', '名無しさん', 1);
  await insertReply(56, '看不到圖', '名無しさん', 2);

  // id: 41 - test (tech)
  console.log('  補充 #41 - test (tech)');
  await insertReply(41, '技術測試', '名無しさん', 1);
  await insertReply(41, 'OK', '名無しさん', 2);

  // === 2 回覆的討論串 (補到 3 則) ===

  // id: 579 - 你的錢就是我的錢 (chat)
  console.log('  補充 #579 - 你的錢就是我的錢');
  await insertReply(579, '我的錢也是我的錢', '名無しさん', 1);

  // id: 578 - 幹幹叫 (chat)
  console.log('  補充 #578 - 幹幹叫');
  await insertReply(578, '消消氣', '名無しさん', 1);

  // id: 215 - Link Preview 功能讚讚 (meta)
  console.log('  補充 #215 - Link Preview 功能讚讚');
  await insertReply(215, '這功能真的很方便', '名無しさん', 1);

  // id: 202 - 很神奇的道教神 (chat)
  console.log('  補充 #202 - 很神奇的道教神');
  await insertReply(202, '道教神明體系很複雜', '名無しさん', 1);

  // id: 164 - 聽歌啦 (chat)
  console.log('  補充 #164 - 聽歌啦');
  await insertReply(164, '好聽！', '名無しさん', 1);

  // id: 147 - 馬斯克森77 (tech)
  console.log('  補充 #147 - 馬斯克森77');
  await insertReply(147, 'Elon Musk 的新計畫？', '名無しさん', 1);

  // id: 135 - YouTube連結 (chat)
  console.log('  補充 #135 - YouTube連結');
  await insertReply(135, '影片不錯', '名無しさん', 1);

  // id: 133 - 怎麼辦到的 (chat)
  console.log('  補充 #133 - 怎麼辦到的');
  await insertReply(133, '太神了', '名無しさん', 1);

  // id: 50 - 在這個時候會以為沒有成功 (tech)
  console.log('  補充 #50 - 在這個時候會以為沒有成功');
  await insertReply(50, '需要多等一下', '名無しさん', 1);

  // id: 2 - 測試標題功能 (chat)
  console.log('  補充 #2 - 測試標題功能');
  await insertReply(2, '標題功能正常', '名無しさん', 1);

  console.log('\n✅ 回覆補充完成');
}

async function main() {
  console.log('🚀 Starting seed (2026-01-16 replies)...\n');

  try {
    await seedReplies();

    console.log('\n✅ All replies seeded successfully!');

    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM posts WHERE parent_id IS NULL) as threads,
        (SELECT COUNT(*) FROM posts WHERE parent_id IS NOT NULL) as replies,
        (SELECT COUNT(*) FROM posts) as total
    `);

    console.log('\n📊 Database Statistics:');
    console.log(`- Total threads: ${result.rows[0].threads}`);
    console.log(`- Total replies: ${result.rows[0].replies}`);
    console.log(`- Total posts: ${result.rows[0].total}`);

    // 檢查還有多少討論串回覆少於3則
    const lowReplyResult = await pool.query(`
      SELECT COUNT(*) as count FROM (
        SELECT p.id
        FROM posts p
        LEFT JOIN posts r ON r.parent_id = p.id
        WHERE p.parent_id IS NULL
        GROUP BY p.id
        HAVING COUNT(r.id) < 3
      ) sub
    `);

    console.log(`\n📊 還有 ${lowReplyResult.rows[0].count} 個討論串回覆少於 3 則`);

  } catch (error) {
    console.error('❌ Error seeding replies:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
