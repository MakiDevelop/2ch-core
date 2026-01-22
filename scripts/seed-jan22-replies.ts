#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-22 - 補充稀缺回應 (第三批)
 *
 * 基於真實時事：
 * - 俄烏戰爭：烏克蘭代表團與美方磋商終戰計畫，扎波羅熱核電站局部停火
 * - 電價：2025下半年民生電價微調0.71%，700度以下每度漲0.1元
 * - 台北捷運：常客優惠從7-9折調整為85-95折（2025/3起）
 * - 原神：6.3版本更新，新角色哥倫比娜、兹白
 * - RTO趨勢：微軟2026年2月起要求3天進辦公室，Meta/TikTok要求5天
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
  console.log('💬 補充稀缺回應 (第三批)...\n');

  // ========== ID 1810: 奇怪的夢 ==========
  console.log('  💭 #1810 - 奇怪的夢');
  await insertReply(1810, '這是鋼鍊的世界觀吧www', '名無しさん', 5);
  await insertReply(1810, 'Roy Mustang 和 Riza Hawkeye\n經典CP', '動漫迷', 4);
  await insertReply(1810, '夢到動漫角色代表你看太多了', '名無しさん', 3);
  await insertReply(1810, '>>3 不是\n是愛得深沉', '名無しさん', 2);

  // ========== ID 1808: 突然被要求回去考期中考 ==========
  console.log('  📋 #1808 - 突然被要求回去考期中考');
  await insertReply(1808, '情緒勒索誤會成管理\n這句話太精準了', '名無しさん', 6);
  await insertReply(1808, '規則可以一路往回套用\n這種公司最可怕', '名無しさん', 5);
  await insertReply(1808, '>>1 先冷靜誰就輸\n職場PUA標配', '名無しさん', 4);
  await insertReply(1808, '離開這種環境是對的', '過來人', 3);
  await insertReply(1808, '建議保留所有對話紀錄', '名無しさん', 2);

  // ========== ID 589: 要第三次世界大戰了嗎 ==========
  console.log('  🌍 #589 - 要第三次世界大戰了嗎');
  await insertReply(589, '烏克蘭代表團已經在跟美方談終戰計畫了', '名無しさん', 8);
  await insertReply(589, '川普說普丁準備好結束戰爭\n澤倫斯基比較遲疑', '名無しさん', 7);
  await insertReply(589, '扎波羅熱核電站有局部停火\n至少核安全有顧到', '名無しさん', 6);
  await insertReply(589, '>>5 28點和平計畫很有爭議\n烏克蘭要放棄很多', '名無しさん', 5);
  await insertReply(589, '2026年停火機率很高\n但條件對烏克蘭不利', '國際觀察', 4);

  // ========== ID 219: 電價又要漲 ==========
  console.log('  ⚡ #219 - 電價又要漲');
  await insertReply(219, '去年下半年有漲\n但幅度不大\n平均才0.71%', '名無しさん', 10);
  await insertReply(219, '700度以下每度漲0.1元\n一般家庭影響不大', '名無しさん', 9);
  await insertReply(219, '>>5 用電大戶比較慘\n1000度以上每度漲0.4元', '名無しさん', 8);
  await insertReply(219, '台電累積虧損4000多億\n不漲也撐不住', '名無しさん', 7);
  await insertReply(219, '省電方法：冷氣開26度\n搭配電扇', '省電達人', 6);
  await insertReply(219, '用DC變頻電扇\n比傳統省很多', '名無しさん', 5);

  // ========== ID 218: 台北捷運漲價 ==========
  console.log('  🚇 #218 - 台北捷運漲價');
  await insertReply(218, '基本票價沒漲\n但常客優惠縮水了', '名無しさん', 12);
  await insertReply(218, '本來7-9折\n現在變85-95折', '名無しさん', 11);
  await insertReply(218, '>>5 2025年3月開始的', '名無しさん', 10);
  await insertReply(218, '北捷說不漲價但今年可能首度虧損', '名無しさん', 9);
  await insertReply(218, '通勤族可以考慮TPASS 1200\n基北北桃吃到飽', '名無しさん', 8);
  await insertReply(218, '>>8 一個月搭超過40趟就划算', '名無しさん', 7);

  // ========== ID 222: 月薪四萬怎麼存錢 ==========
  console.log('  💰 #222 - 月薪四萬怎麼存錢');
  await insertReply(222, '房租一萬二在台北算便宜了\n可以接受', '名無しさん', 14);
  await insertReply(222, '生活費1.5萬可以再省\n自己煮會差很多', '名無しさん', 13);
  await insertReply(222, '>>5 早餐自己做\n外食真的花很多', '名無しさん', 12);
  await insertReply(222, '先存緊急預備金\n3-6個月生活費', '理財新手', 11);
  await insertReply(222, '記帳很重要\n才知道錢花去哪', '名無しさん', 10);
  await insertReply(222, '可以考慮提升收入\n比省錢效果好', '名無しさん', 9);

  // ========== ID 221: 原神入坑 ==========
  console.log('  🎮 #221 - 原神入坑');
  await insertReply(221, '現在入坑剛好\n6.3版本劇情超讚', '名無しさん', 16);
  await insertReply(221, '新角色哥倫比娜超強\n水系輔助', '老玩家', 15);
  await insertReply(221, '>>5 還有兹白\n岩系單手劍', '名無しさん', 14);
  await insertReply(221, '零課也能玩\n抽不到就用免費角', '名無しさん', 13);
  await insertReply(221, '劇情可以慢慢補\n不用趕進度', '名無しさん', 12);
  await insertReply(221, '新手有很多原石可以拿\n抽卡資源不少', '名無しさん', 11);

  // ========== ID 207: WFH被叫回辦公室 ==========
  console.log('  🏢 #207 - WFH被叫回辦公室');
  await insertReply(207, '現在很多公司都在推RTO\n微軟也是', '名無しさん', 18);
  await insertReply(207, '微軟2月開始要求一週3天進辦公室', '名無しさん', 17);
  await insertReply(207, '>>6 Meta、TikTok更狠\n要求5天', '名無しさん', 16);
  await insertReply(207, '純遠端職缺越來越少\n要有心理準備', '名無しさん', 15);
  await insertReply(207, '如果效率真的沒差\n可以跟主管談談', '名無しさん', 14);
  await insertReply(207, '2026是RTO元年\n大公司都在收緊', '業界人', 13);

  // ========== ID 205: 年後轉職 ==========
  console.log('  💼 #205 - 年後轉職');
  await insertReply(205, '3個月年終很不錯\n建議先領完再跳', '名無しさん', 16);
  await insertReply(205, '可以先面試\n但入職日期談年後', '名無しさん', 15);
  await insertReply(205, '>>6 好公司會等人的', '名無しさん', 14);
  await insertReply(205, '三年沒成長空間是該跳了', '名無しさん', 13);
  await insertReply(205, '先更新履歷投看看\n測試市場水溫', '名無しさん', 12);

  // ========== ID 211: 租屋處隔壁吵 ==========
  console.log('  🔊 #211 - 租屋處隔壁吵');
  await insertReply(211, '可以報警\n噪音是有法規的', '名無しさん', 10);
  await insertReply(211, '晚上10點到早上8點有管制\n可以檢舉', '名無しさん', 9);
  await insertReply(211, '>>5 但要蒐證\n錄音錄影', '名無しさん', 8);
  await insertReply(211, '長期下去還是搬家比較實際', '名無しさん', 7);
  await insertReply(211, '隔音差的房子真的母湯', '過來人', 6);

  // ========== ID 1419: 離職時善意不算數 ==========
  console.log('  📝 #1419 - 離職善意不算數');
  await insertReply(1419, '舉證之所在敗訴之所在\n律師說得對', '名無しさん', 12);
  await insertReply(1419, '以後什麼都要留紀錄\n口頭承諾不算數', '名無しさん', 11);
  await insertReply(1419, '>>5 email或訊息都要截圖', '名無しさん', 10);
  await insertReply(1419, '交接期間特別要小心\n容易被坑', '名無しさん', 9);
  await insertReply(1419, '離職前把自己的東西都備份好', '過來人', 8);

  // ========== ID 1306: 建議新增暗黑模式 ==========
  console.log('  🌙 #1306 - 暗黑模式');
  await insertReply(1306, '+1 晚上用手機看超刺眼', '名無しさん', 8);
  await insertReply(1306, '現在很多網站都有深色模式了', '名無しさん', 7);
  await insertReply(1306, '希望站方考慮\n對眼睛比較好', '名無しさん', 6);
  await insertReply(1306, '可以先用瀏覽器外掛暫時解決', '名無しさん', 5);

  // ========== ID 1312: 選秀節目評審標準 ==========
  console.log('  🎤 #1312 - 選秀節目評審');
  await insertReply(1312, '話題性＞實力\n這就是娛樂圈', '名無しさん', 10);
  await insertReply(1312, '節目要收視率\n不是真的在選人才', '名無しさん', 9);
  await insertReply(1312, '>>5 所以很多實力派都被淘汰', '名無しさん', 8);
  await insertReply(1312, '看開點\n當綜藝節目看就好', '名無しさん', 7);

  // ========== ID 1147: 年度頒獎典禮 ==========
  console.log('  🏆 #1147 - 年度頒獎典禮');
  await insertReply(1147, '金唱片獎在大巨蛋辦的那場嗎\n超讚', '名無しさん', 14);
  await insertReply(1147, 'Jennie拿藝人大賞\n實至名歸', '名無しさん', 13);
  await insertReply(1147, '>>5 GD回歸也拿音源大賞', '名無しさん', 12);
  await insertReply(1147, 'Stray Kids專輯大賞\n粉絲超開心', 'Stay', 11);
  await insertReply(1147, '大巨蛋音響效果不錯\n以後可以多辦', '名無しさん', 10);

  // ========== ID 1146: 選秀藝人都去哪了 ==========
  console.log('  🌟 #1146 - 選秀藝人都去哪了');
  await insertReply(1146, '沒資源就消失了\n很現實', '名無しさん', 12);
  await insertReply(1146, '有些轉型當演員或網紅', '名無しさん', 11);
  await insertReply(1146, '>>5 能維持熱度的真的很少', '名無しさん', 10);
  await insertReply(1146, '選秀節目本來就是一時的曝光', '名無しさん', 9);
  await insertReply(1146, '還是要靠作品說話', '名無しさん', 8);

  // ========== ID 1144: 天團成員深夜約會 ==========
  console.log('  💑 #1144 - 天團成員約會');
  await insertReply(1144, '藝人也是人\n談戀愛很正常', '名無しさん', 10);
  await insertReply(1144, '粉絲崩潰是因為人設崩塌', '名無しさん', 9);
  await insertReply(1144, '>>5 賣單身人設的話確實會傷', '名無しさん', 8);
  await insertReply(1144, '祝福他們就好了\n干嘛那麼激動', '名無しさん', 7);
  await insertReply(1144, '私生活本來就不該被過度關注', '名無しさん', 6);

  console.log('\n✅ 稀缺回應補充完成！');
}

async function main() {
  console.log('🚀 Starting reply boost (2026-01-22)...\n');

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
      WHERE p.id IN (1810, 1808, 589, 219, 218, 222, 221, 207, 205, 211, 1419, 1306, 1312, 1147, 1146, 1144)
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
