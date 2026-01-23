#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-21 - 補充稀缺回應
 *
 * 為回覆數較少的討論串補充回應，基於真實時事：
 * - Sony 與 TCL 合資 (TCL 持股 51%)
 * - Switch 2 台灣定價 14380 元
 * - WBC 中華隊 3/5 首戰，陳傑憲隊長
 * - 營養午餐 20 縣市實施
 * - 美元定存利率 1.8-2.2%
 * - 台股站上 3 萬點
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
  console.log('💬 補充稀缺回應...\n');

  // ========== ID 1542: Sony 分拆電視業務 ==========
  console.log('  📺 #1542 - Sony 分拆電視業務');
  await insertReply(1542, 'TCL 持股 51%\nSony 只剩 49%\n等於控制權交出去了', '名無しさん', 8);
  await insertReply(1542, 'Bravia 品牌會繼續用\n但以後是中資主導生產', '名無しさん', 7);
  await insertReply(1542, '日系電視全滅了\nSharp、Toshiba 早就被買走\nPanasonic 也縮減', '電視迷', 6);
  await insertReply(1542, '>>3 Sony 是最後一個撐著的\n現在也撐不住了', '名無しさん', 5);
  await insertReply(1542, 'Sony 電視市占才 1.9%\nTCL 有 13.8%\n沒辦法', '名無しさん', 4);
  await insertReply(1542, '2027年4月才正式移交\n還要看監管機關同意', '名無しさん', 3);

  // ========== ID 1541: 去年有這麼冷嗎 ==========
  console.log('  🥶 #1541 - 去年有這麼冷嗎');
  await insertReply(1541, '今天剛好大寒\n強烈大陸冷氣團南下', '名無しさん', 6);
  await insertReply(1541, '鄭明典PO衛星雲圖\n可以看到很明顯的雲街', '氣象控', 5);
  await insertReply(1541, '>>2 雲街代表冷空氣很強', '名無しさん', 4);
  await insertReply(1541, '北部體感不到10度\n超冷', '名無しさん', 3);
  await insertReply(1541, '南部還好啦\n穿個外套就夠了', '高雄人', 2);
  await insertReply(1541, '暖氣開下去\n電費不敢看', '名無しさん', 1);

  // ========== ID 1435: 2026台股還能繼續漲嗎 ==========
  console.log('  📈 #1435 - 2026台股');
  await insertReply(1435, '都站上3萬點了\n32K在望', '名無しさん', 10);
  await insertReply(1435, '去年全年出口6407億美元創新高\nAI帶動', '名無しさん', 9);
  await insertReply(1435, '台積電佔權重太高\n基本上看台積電臉色', '名無しさん', 8);
  await insertReply(1435, '>>7 對啊\n法說會前股價回檔也是正常', '名無しさん', 7);
  await insertReply(1435, '定期定額不要停\n長期看好台灣半導體', '存股族', 6);

  // ========== ID 1441: Switch 2 要買嗎 ==========
  console.log('  🎮 #1441 - Switch 2');
  await insertReply(1441, '台灣定價 14380 元\n比日本海外版便宜', '名無しさん', 12);
  await insertReply(1441, '全球銷量已經破千萬了\n賣超快', '名無しさん', 11);
  await insertReply(1441, '>>5 四天就賣350萬台\n任天堂史上最快', '名無しさん', 10);
  await insertReply(1441, '瑪利歐賽車世界套裝 15580\n感覺可以', '名無しさん', 9);
  await insertReply(1441, '日版只能用日本帳號\n要買多國語言版', '名無しさん', 8);
  await insertReply(1441, '>>8 對\neShop也只能用日版', '名無しさん', 7);

  // ========== ID 1426: 免費營養午餐 ==========
  console.log('  🍱 #1426 - 免費營養午餐');
  await insertReply(1426, '現在已經20縣市實施了\n只剩新北跟嘉義市', '名無しさん', 14);
  await insertReply(1426, '台北一年要20幾億\n台中25-30億', '名無しさん', 13);
  await insertReply(1426, '新北說要46億\n侯還在評估', '名無しさん', 12);
  await insertReply(1426, '黃偉哲說是被迫捲入福利競賽www', '名無しさん', 11);
  await insertReply(1426, '>>9 政治人物不跟進會被罵\n跟進又說沒錢', '名無しさん', 10);
  await insertReply(1426, '全教總說比免費更重要的是品質\n營養師人力不足', '名無しさん', 9);

  // ========== ID 1437: 美元定存 ==========
  console.log('  💵 #1437 - 美元定存');
  await insertReply(1437, '現在利率大概1.8-2.2%\nFed已經降息了', '名無しさん', 16);
  await insertReply(1437, '上海銀行一年期2%\n算高的', '名無しさん', 15);
  await insertReply(1437, '滙豐一年期2.2%\n但要看起存門檻', '名無しさん', 14);
  await insertReply(1437, '匯差要注意\n換來換去會吃掉利息', '名無しさん', 13);
  await insertReply(1437, '>>8 對\n網銀換匯比較划算', '名無しさん', 12);
  await insertReply(1437, '長期持有美元資產還是OK\n不急著換回來', '理財族', 11);

  // ========== ID 1429: WBC中華隊 ==========
  console.log('  ⚾ #1429 - WBC中華隊');
  await insertReply(1429, '3/5首戰澳洲\n隔天打日本', '名無しさん', 18);
  await insertReply(1429, '陳傑憲當隊長\n1/15已經開始集訓了', '名無しさん', 17);
  await insertReply(1429, '大谷翔平確定參賽\n會在預賽遇到', '名無しさん', 16);
  await insertReply(1429, '>>7 超期待中日大戰', '棒球迷', 15);
  await insertReply(1429, 'C組在東京打\n日本、韓國、澳洲、捷克', '名無しさん', 14);
  await insertReply(1429, '四天打四場\n還有晚場接午場\n體力是考驗', '名無しさん', 13);
  await insertReply(1429, '目標8強！加油！', '名無しさん', 12);

  // ========== ID 1444: 曖昧對象已讀不回 ==========
  console.log('  💔 #1444 - 曖昧對象已讀不回');
  await insertReply(1444, '先別急著下結論\n可能真的在忙', '名無しさん', 8);
  await insertReply(1444, '觀察一週再說\n每個人有自己的節奏', '名無しさん', 7);
  await insertReply(1444, '>>5 但突然變冷淡確實要注意', '名無しさん', 6);
  await insertReply(1444, '直接約出來聊聊\n線上訊息容易誤會', '過來人', 5);
  await insertReply(1444, '我之前也這樣\n後來發現對方只是工作壓力大', '名無しさん', 4);

  // ========== ID 1432: 年假不夠 ==========
  console.log('  🏠 #1432 - 年假不夠');
  await insertReply(1432, '同感\n光是塞車就去掉一天', '名無しさん', 10);
  await insertReply(1432, '年初二開始跑親戚\n根本沒休息到', '名無しさん', 9);
  await insertReply(1432, '>>6 還要包紅包\n荷包也很累', '名無しさん', 8);
  await insertReply(1432, '我都初三以後才出門\n避開人潮', '名無しさん', 7);
  await insertReply(1432, '年假應該要放兩週才對', '社畜', 6);

  // ========== ID 1433: 準備轉職 ==========
  console.log('  💼 #1433 - 準備轉職');
  await insertReply(1433, 'AI相關職缺還是很多\n可以考慮', '名無しさん', 12);
  await insertReply(1433, '先騎驢找馬\n不要裸辭', '名無しさん', 11);
  await insertReply(1433, '>>6 對\n有工作談薪水比較有底氣', '名無しさん', 10);
  await insertReply(1433, '半導體業還是很缺人\n但要看你的專業', '業界人', 9);
  await insertReply(1433, '履歷先更新\n投幾家測試水溫', '名無しさん', 8);

  // ========== ID 1440: 噬血代碼2 ==========
  console.log('  🎮 #1440 - 噬血代碼2');
  await insertReply(1440, '1代沒玩過可以直接玩\n劇情有連結但不影響', '名無しさん', 14);
  await insertReply(1440, '類魂但比較偏動作\n難度沒那麼硬', '名無しさん', 13);
  await insertReply(1440, '>>6 角色建模很讚\n二次元風格', '名無しさん', 12);
  await insertReply(1440, '可以雙人連線\n找朋友一起玩', '名無しさん', 11);
  await insertReply(1440, '等特價再買\n現在全價有點貴', '等等黨', 10);

  // ========== ID 1439: 台中動漫快閃店 ==========
  console.log('  🎪 #1439 - 台中動漫快閃店');
  await insertReply(1439, '寶箱怪超大\n拍照很讚', '名無しさん', 16);
  await insertReply(1439, '獵人的周邊賣很快\n要買要早', '名無しさん', 15);
  await insertReply(1439, '>>6 小傑立牌瞬間沒了www', '名無しさん', 14);
  await insertReply(1439, '假日人很多\n建議平日去', '去過的人', 13);
  await insertReply(1439, '膽大黨那區也不錯\n有互動裝置', '名無しさん', 12);

  console.log('\n✅ 稀缺回應補充完成！');
}

async function main() {
  console.log('🚀 Starting reply boost (2026-01-21)...\n');

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
      SELECT p.id, b.slug, LEFT(p.title, 35) as title, COUNT(r.id) as reply_count
      FROM posts p
      LEFT JOIN posts r ON r.parent_id = p.id
      LEFT JOIN boards b ON p.board_id = b.id
      WHERE p.id IN (1542, 1541, 1435, 1441, 1426, 1437, 1429, 1444, 1432, 1433, 1440, 1439)
      GROUP BY p.id, b.slug, p.title
      ORDER BY p.id
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
