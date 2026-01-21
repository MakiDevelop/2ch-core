#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-16 - 炒熱熱門討論串
 *
 * 為回覆量較多的討論串增加更多互動
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

async function boostPopularThreads() {
  console.log('🔥 炒熱熱門討論串...\n');

  // id: 606 - 有人玩過職場模擬器嗎？後期 NPC 都會消失那種 (work) - 9 replies
  console.log('  🎮 #606 - 職場模擬器');
  await insertReply(606, '聽起來像是某種心理恐怖遊戲', '名無しさん', 0.5);
  await insertReply(606, '消失的NPC是不是被裁員了www', '社畜', 1);
  await insertReply(606, '>>11 笑死\n這遊戲也太寫實', '名無しさん', 1.5);
  await insertReply(606, '我玩過！後期真的很空虛', '玩過的人', 2);

  // id: 794 - 台灣生育率又創新低了 (news) - 8 replies
  console.log('  👶 #794 - 台灣生育率');
  await insertReply(794, '政府只會喊口號\n實際補助根本不夠', '名無しさん', 0.5);
  await insertReply(794, '育嬰假制度也要改善\n不然誰敢請', '職場媽媽', 1);
  await insertReply(794, '>>9 公司臉色很難看', '名無しさん', 1.5);
  await insertReply(794, '等房價跌下來再說', '躺平族', 2);

  // id: 516 - Steam冬特有什麼推薦的？ (acg) - 8 replies
  console.log('  🎮 #516 - Steam冬特推薦');
  await insertReply(516, '補推 Stardew Valley\n超療癒', '農場主', 0.5);
  await insertReply(516, 'Elden Ring 打折了嗎？', '魂系玩家', 1);
  await insertReply(516, '>>9 應該有\n不過還是很貴', '名無しさん', 1.5);
  await insertReply(516, '買了一堆結果都沒玩\nSteam 庫存肥大症', '+1', 2);

  // id: 98 - 匿名版的好處就是可以說真話 (meta) - 8 replies
  console.log('  💬 #98 - 匿名版好處');
  await insertReply(98, '不用擔心被肉搜', '名無しさん', 0.5);
  await insertReply(98, '可以討論一些敏感話題', '名無しさん', 1);
  await insertReply(98, '但還是要有底線\n不能造謠', '名無しさん', 1.5);
  await insertReply(98, '希望這個站能一直維持下去', '老用戶', 2);

  // id: 345 - 五年前端找不到工作 (work) - 7 replies
  console.log('  💼 #345 - 五年前端找不到工作');
  await insertReply(345, '現在前端市場確實飽和了', '名無しさん', 0.5);
  await insertReply(345, '要不要考慮轉 full stack', '後端工程師', 1);
  await insertReply(345, '>>8 學後端要多久？', '名無しさん', 1.5);
  await insertReply(345, '試試接案或自己做 side project', '接案仔', 2);
  await insertReply(345, '履歷有 highlight 嗎？', '面試官', 2.5);

  // id: 389 - 女友一直要我報備行蹤 (love) - 7 replies
  console.log('  💕 #389 - 女友報備行蹤');
  await insertReply(389, '這種關係很不健康\n要好好溝通', '名無しさん', 0.5);
  await insertReply(389, '我前女友也這樣\n最後分手了', '過來人', 1);
  await insertReply(389, '>>8 分手後有比較輕鬆嗎', '名無しさん', 1.5);
  await insertReply(389, '安全感要從內心建立\n不是靠監控', '心理系', 2);

  // id: 723 - 最近一直失眠 (life) - 6 replies
  console.log('  😴 #723 - 失眠問題');
  await insertReply(723, '試試看 4-7-8 呼吸法', '名無しさん', 0.5);
  await insertReply(723, '我吃褪黑激素有改善', '名無しさん', 1);
  await insertReply(723, '>>7 褪黑激素長期吃好嗎？', '名無しさん', 1.5);
  await insertReply(723, '先檢查是不是壓力太大', '過來人', 2);

  // id: 623 - 2026年數位帳戶推薦 (money) - 6 replies
  console.log('  💰 #623 - 數位帳戶推薦');
  await insertReply(623, '台新 Richart 利率不錯', '名無しさん', 0.5);
  await insertReply(623, '永豐大戶跨轉免費次數多', '名無しさん', 1);
  await insertReply(623, '我用聯邦 New New Bank\n介面簡單', '名無しさん', 1.5);
  await insertReply(623, '看你需要什麼功能\n利息、跨轉、還是回饋', '理財顧問', 2);

  // id: 450 - 台北房價是不是永遠不會跌了 (news) - 6 replies
  console.log('  🏠 #450 - 台北房價');
  await insertReply(450, '除非發生什麼大事\n不然很難跌', '名無しさん', 0.5);
  await insertReply(450, '新青安也是在撐房價', '名無しさん', 1);
  await insertReply(450, '往南部發展吧\n台北太貴了', '南漂族', 1.5);
  await insertReply(450, '>>9 高雄也開始漲了...', '名無しさん', 2);

  // id: 417 - 台積電現在還能進場嗎 (money) - 6 replies
  console.log('  📈 #417 - 台積電進場');
  await insertReply(417, '定期定額分批買\n降低風險', '名無しさん', 0.5);
  await insertReply(417, 'AI 趨勢還會持續\n長期看好', '多頭派', 1);
  await insertReply(417, '>>7 但現在本益比已經很高了', '名無しさん', 1.5);
  await insertReply(417, '設好停損點再進場', '理性派', 2);

  // id: 401 - 男友打game比陪我重要 (love) - 6 replies
  console.log('  🎮 #401 - 男友打game');
  await insertReply(401, '找到共同興趣很重要', '名無しさん', 0.5);
  await insertReply(401, '試試跟他一起玩？', '名無しさん', 1);
  await insertReply(401, '>>7 不喜歡玩遊戲怎麼辦', '名無しさん', 1.5);
  await insertReply(401, '溝通最重要\n說清楚你的需求', '兩性專家', 2);

  // id: 378 - 交往三年不想結婚 (love) - 6 replies
  console.log('  💍 #378 - 交往三年不結婚');
  await insertReply(378, '三年夠久了\n該做決定了', '名無しさん', 0.5);
  await insertReply(378, '問清楚他的顧慮是什麼', '名無しさん', 1);
  await insertReply(378, '>>7 問了也只是拖', '同病相憐', 1.5);
  await insertReply(378, '不要為了結婚而結婚\n但也不要浪費時間', '過來人', 2);

  // id: 789 - 外送平台抽成太高 (news) - 5 replies
  console.log('  🛵 #789 - 外送平台抽成');
  await insertReply(789, '小店家根本沒賺錢', '名無しさん', 0.5);
  await insertReply(789, '自己開發外送系統又太貴', '餐廳老闆', 1);
  await insertReply(789, '消費者也是受害者\n價格越來越貴', '名無しさん', 1.5);
  await insertReply(789, '>>8 所以我都自己去買', '名無しさん', 2);

  // id: 811 - 快30歲什麼都沒有 (life) - 5 replies
  console.log('  😔 #811 - 快30歲焦慮');
  await insertReply(811, '不要跟別人比\n跟昨天的自己比', '名無しさん', 0.5);
  await insertReply(811, '30歲還很年輕啊', '40歲路過', 1);
  await insertReply(811, '>>6 謝謝\n感覺好一點了', '原PO', 1.5);
  await insertReply(811, '一步一步來\n先設定小目標', '名無しさん', 2);

  // id: 640 - 男友比我小5歲 (love) - 5 replies
  console.log('  👫 #640 - 姐弟戀');
  await insertReply(640, '年齡不是問題\n心態才是', '名無しさん', 0.5);
  await insertReply(640, '我老公比我小7歲\n結婚5年了', '姐姐派', 1);
  await insertReply(640, '>>6 家人後來接受了嗎', '名無しさん', 1.5);
  await insertReply(640, '時間會證明一切', '名無しさん', 2);

  // id: 768 - 手遊課金課到懷疑人生 (acg) - 5 replies
  console.log('  💸 #768 - 手遊課金');
  await insertReply(768, '課金前先想想這錢能買什麼', '名無しさん', 0.5);
  await insertReply(768, '我已經戒手遊了\n錢省超多', '戒斷成功', 1);
  await insertReply(768, '>>6 怎麼戒的？', '名無しさん', 1.5);
  await insertReply(768, '直接刪掉App\n然後找其他興趣', '戒斷成功', 2);

  console.log('\n✅ 熱門討論串已炒熱！');
}

async function main() {
  console.log('🚀 Starting boost (2026-01-16)...\n');

  try {
    await boostPopularThreads();

    console.log('\n✅ All boosts completed!');

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

    // 顯示熱門討論串
    const hotThreads = await pool.query(`
      SELECT p.id, b.slug, LEFT(p.title, 30) as title, COUNT(r.id) as reply_count
      FROM posts p
      LEFT JOIN posts r ON r.parent_id = p.id
      LEFT JOIN boards b ON p.board_id = b.id
      WHERE p.parent_id IS NULL
      GROUP BY p.id, b.slug, p.title
      ORDER BY reply_count DESC
      LIMIT 10
    `);

    console.log('\n🔥 Top 10 熱門討論串:');
    for (const row of hotThreads.rows) {
      console.log(`  ${row.reply_count}則 - [${row.slug}] ${row.title}`);
    }

  } catch (error) {
    console.error('❌ Error boosting threads:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
