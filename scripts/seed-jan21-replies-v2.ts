#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-21 - 補充稀缺回應 (第二批)
 *
 * 基於真實時事：
 * - 115學測數A有魔王題，考生反映寫不完
 * - 駕照筆試 2026/1月取消是非題（機車），6月（汽車）
 * - 過年紅包行情：給長輩 6000-8000 起跳
 * - 信用卡：滙豐 1.22%/2.22%、永豐大戶卡 3.5%/4.5%
 * - 綜藝節目：綜藝大熱門、天才衝衝衝、小姐不熙娣
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
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36',
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

async function boostThreads() {
  console.log('💬 補充稀缺回應 (第二批)...\n');

  // ========== ID 1725: 就是有人這麼自私 ==========
  console.log('  😤 #1725 - 就是有人這麼自私');
  await insertReply(1725, '這種人超多\n自己不用就要毀掉', '名無しさん', 4);
  await insertReply(1725, '見不得別人好的心態', '名無しさん', 3);
  await insertReply(1725, '職場上最討厭這種人', '名無しさん', 2);
  await insertReply(1725, '>>1 是遇到什麼事了', '名無しさん', 1);

  // ========== ID 1723: 被從背後捅一刀 ==========
  console.log('  🔪 #1723 - 被從背後捅一刀');
  await insertReply(1723, '職場上還是要留一手\n太天真會吃虧', '名無しさん', 5);
  await insertReply(1723, '>>1 還好有防備\n不然真的死得很慘', '名無しさん', 4);
  await insertReply(1723, '同事永遠只是同事\n不要太信任', '過來人', 3);
  await insertReply(1723, '我也被捅過\n從此學會自保', '名無しさん', 2);
  await insertReply(1723, '職場如戰場', '名無しさん', 1);

  // ========== ID 1724: 有音樂版可以放嗎 ==========
  console.log('  🎵 #1724 - 有音樂版');
  await insertReply(1724, '+1 希望有音樂版', '名無しさん', 3);
  await insertReply(1724, '可以分享歌單的話很讚', '名無しさん', 2);
  await insertReply(1724, '建議站方考慮看看', '名無しさん', 1);

  // ========== ID 1717: 大公司的毛還真多 ==========
  console.log('  🏢 #1717 - 大公司的毛');
  await insertReply(1717, '大公司流程就是多\n習慣就好', '名無しさん', 6);
  await insertReply(1717, '>>1 是怕出事被追究\n所以什麼都要開會', '名無しさん', 5);
  await insertReply(1717, '子網域比較好管理吧\n主網域改動風險大', '工程師', 4);
  await insertReply(1717, '小公司也有小公司的問題\n各有利弊', '名無しさん', 3);

  // ========== ID 1716: 退職後突然開始懂品質 ==========
  console.log('  💼 #1716 - 退職後懂品質');
  await insertReply(1716, '太有共鳴了\n人走茶涼', '名無しさん', 8);
  await insertReply(1716, '在職的時候都說好棒棒\n離職就開始檢討', '名無しさん', 7);
  await insertReply(1716, '>>1 這種公司文化真的有毒', '名無しさん', 6);
  await insertReply(1716, '所以離職前要把文件都留好\n保護自己', '過來人', 5);
  await insertReply(1716, '品質標準只適用於離職員工www', '名無しさん', 4);

  // ========== ID 1718: 如何優雅的把事情推給別人 ==========
  console.log('  🎭 #1718 - 推事情');
  await insertReply(1718, '這招很常見\n開會就是為了找人背鍋', '名無しさん', 6);
  await insertReply(1718, '會議紀錄很重要\n誰說的要記清楚', '名無しさん', 5);
  await insertReply(1718, '>>3 對\n不然到時候說不清楚', '名無しさん', 4);
  await insertReply(1718, '高階主管都這樣\n責任往下丟', '名無しさん', 3);

  // ========== ID 1427: 學測考完了 ==========
  console.log('  📝 #1427 - 學測考完了');
  await insertReply(1427, '數A真的有魔王題\n補教說是歷年最難', '名無しさん', 10);
  await insertReply(1427, '高二比重快6成\n很多人卡在多選', '名無しさん', 9);
  await insertReply(1427, '>>5 頂標預估才11級分\n超低', '名無しさん', 8);
  await insertReply(1427, '北一女校長也去考\n說自然寫不完www', '名無しさん', 7);
  await insertReply(1427, '社會科結合很多時事\n關稅、堰塞湖都有考', '名無しさん', 6);
  await insertReply(1427, '數B第17題超難\n單點透視加空間幾何', '考生', 5);

  // ========== ID 1428: 駕照筆試取消是非題 ==========
  console.log('  🚗 #1428 - 駕照筆試');
  await insertReply(1428, '機車1月底開始\n汽車6月', '名無しさん', 12);
  await insertReply(1428, '是非題有50%猜對機會\n取消合理', '名無しさん', 11);
  await insertReply(1428, '選擇題從3選1變4選1\n難度確實提高', '名無しさん', 10);
  await insertReply(1428, '>>6 還會加危險感知跟情境題', '名無しさん', 9);
  await insertReply(1428, '聽說很多人趕在新制前去考\n報名暴增', '名無しさん', 8);
  await insertReply(1428, '題庫1600題也會重新修訂', '名無しさん', 7);

  // ========== ID 1445: 紅包要包多少給對方爸媽 ==========
  console.log('  🧧 #1445 - 紅包行情');
  await insertReply(1445, '給長輩通常6000起跳\n8000、10000都有人包', '名無しさん', 14);
  await insertReply(1445, '第一次見面可以先從6600開始\n吉利數字', '名無しさん', 13);
  await insertReply(1445, '>>5 記得用新鈔\n紅包袋不要封口', '名無しさん', 12);
  await insertReply(1445, '避開4這個數字\n其他2、6、8都可以', '名無しさん', 11);
  await insertReply(1445, '問一下男友家的習慣比較保險', '名無しさん', 10);
  await insertReply(1445, '給長輩的叫添歲錢\n以後只能越包越多喔', '過來人', 9);

  // ========== ID 1152: 信用卡回饋怎麼選 ==========
  console.log('  💳 #1152 - 信用卡回饋');
  await insertReply(1152, '無腦刷推滙豐現金回饋御璽卡\n國內1.22%國外2.22%', '名無しさん', 16);
  await insertReply(1152, '永豐大戶卡也不錯\n國內3.5%國外4.5%', '名無しさん', 15);
  await insertReply(1152, '>>5 大戶卡活動到6月底\n之後不知道還有沒有', '名無しさん', 14);
  await insertReply(1152, '台新Richart可以每天切換方案\n很彈性', '名無しさん', 13);
  await insertReply(1152, '出國玩的話玉山熊本熊卡\n日本最高8.5%', '名無しさん', 12);
  await insertReply(1152, '現金回饋最實在\n點數常常用不掉', '名無しさん', 11);

  // ========== ID 1150: 遠距離戀愛能維持嗎 ==========
  console.log('  💕 #1150 - 遠距離戀愛');
  await insertReply(1150, '兩年其實還好\n有目標比較撐得住', '名無しさん', 10);
  await insertReply(1150, '固定視訊時間很重要\n不要斷了聯繫', '名無しさん', 9);
  await insertReply(1150, '>>5 對\n每天至少聊一下', '名無しさん', 8);
  await insertReply(1150, '我跟我老公遠距三年\n現在結婚了', '成功案例', 7);
  await insertReply(1150, '>>7 恭喜！怎麼維持的', '名無しさん', 6);
  await insertReply(1150, '信任最重要\n不要疑神疑鬼', '名無しさん', 5);

  // ========== ID 1149: 前任突然聯絡我 ==========
  console.log('  📱 #1149 - 前任聯絡');
  await insertReply(1149, '要先問清楚目的\n不要抱太多期待', '名無しさん', 8);
  await insertReply(1149, '分手兩年才聯絡\n多半是寂寞了', '名無しさん', 7);
  await insertReply(1149, '>>5 或是現任分手了', '名無しさん', 6);
  await insertReply(1149, '如果當初是好聚好散\n見面聊聊也沒差', '名無しさん', 5);
  await insertReply(1149, '小心當備胎', '過來人', 4);

  // ========== ID 1148: 交往多久適合見家長 ==========
  console.log('  👨‍👩‍👧 #1148 - 見家長');
  await insertReply(1148, '一年差不多了\n代表他認真的', '名無しさん', 10);
  await insertReply(1148, '緊張正常\n準備一點伴手禮', '名無しさん', 9);
  await insertReply(1148, '>>5 水果禮盒最安全', '名無しさん', 8);
  await insertReply(1148, '記得穿著得體一點\n第一印象很重要', '名無しさん', 7);
  await insertReply(1148, '問問男友他爸媽的喜好', '名無しさん', 6);

  // ========== ID 1143: 綜藝節目越來越無聊嗎 ==========
  console.log('  📺 #1143 - 綜藝節目');
  await insertReply(1143, '天才衝衝衝還不錯\n網路聲量很高', '名無しさん', 12);
  await insertReply(1143, '小姐不熙娣也可以\n訪談類比較有深度', '名無しさん', 11);
  await insertReply(1143, '>>5 綜藝大熱門還是週間收視冠軍', '名無しさん', 10);
  await insertReply(1143, '現在很多人都看YouTube了\n電視收視本來就難', '名無しさん', 9);
  await insertReply(1143, '韓綜比較好笑\n台綜笑點真的很尷尬', '名無しさん', 8);

  // ========== ID 1145: 直播主越來越誇張 ==========
  console.log('  📹 #1145 - 直播主');
  await insertReply(1145, '為了流量沒下限', '名無しさん', 10);
  await insertReply(1145, '平台應該要管一下\n危險行為不應該推薦', '名無しさん', 9);
  await insertReply(1145, '>>5 觀眾也有責任\n不要看就沒流量了', '名無しさん', 8);
  await insertReply(1145, '吃播送醫的新聞超多\n真的很傻', '名無しさん', 7);
  await insertReply(1145, '有些人是真的缺錢\n但這樣賺不值得', '名無しさん', 6);

  // ========== ID 1211: 二十年前還會靠 coding 討生活 ==========
  console.log('  💻 #1211 - coding 人生');
  await insertReply(1211, '過度設計真的是工程師的通病', '名無しさん', 8);
  await insertReply(1211, '>>1 先讓東西能跑再說\n不要追求完美', '名無しさん', 7);
  await insertReply(1211, '動量消失這個形容太精準了', '同行', 6);
  await insertReply(1211, 'logging比抽象重要\n這句話要裱起來', '名無しさん', 5);
  await insertReply(1211, '寫了二十年還在寫\n也是一種堅持', '名無しさん', 4);

  console.log('\n✅ 稀缺回應補充完成！');
}

async function main() {
  console.log('🚀 Starting reply boost v2 (2026-01-21)...\n');

  try {
    await boostThreads();

    // 統計
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

    // 檢查補充的討論串
    const boostedThreads = await pool.query(`
      SELECT p.id, b.slug, LEFT(p.title, 40) as title, COUNT(r.id) as reply_count
      FROM posts p
      LEFT JOIN posts r ON r.parent_id = p.id
      LEFT JOIN boards b ON p.board_id = b.id
      WHERE p.id IN (1725, 1723, 1724, 1717, 1716, 1718, 1427, 1428, 1445, 1152, 1150, 1149, 1148, 1143, 1145, 1211)
      GROUP BY p.id, b.slug, p.title
      ORDER BY reply_count DESC
    `);

    console.log('\n📋 補充後的討論串回覆數:');
    for (const row of boostedThreads.rows) {
      console.log(`  #${row.id} [${row.slug}] ${row.title}: ${row.reply_count}則`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
