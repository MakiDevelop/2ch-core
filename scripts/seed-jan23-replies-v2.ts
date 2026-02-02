#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-23 第二批 - 補充各版討論串
 *
 * 為回覆數較少的討論串補充回應，基於真實時事：
 * - 40歲轉職：長照服務需求高、斜槓工作趨勢
 * - 2026陸劇：驕陽似我、軋戲、玉茗茶骨、逍遙
 * - 00878 vs 台積電：高股息ETF績效6.3%、台積電ETF熱潮
 * - TWICE 娜璉：THIS IS FOR 世巡、2026台北動漫節見面會
 * - 馬斯克：X演算法開源、淨資產7850億美元
 * - 札幌雪祭：2/4-2/11、三大會場
 * - 春聯：2026馬年、除夕6點到12點最佳
 * - 更衣人偶：第二季完結、聲優直田姬奈來台
 * - 八方雲集：鍋貼水餃7元、全台1055家
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
  console.log('💬 補充各版討論串 (2026-01-23 v2)...\n');

  // ========== ID 166: 40歲正在求轉職 (work) ==========
  console.log('  💼 #166 - 40歲正在求轉職');
  await insertReply(166, '40歲以後推薦長照服務\n台灣要進入超高齡社會\n需求超大', '名無しさん', 10);
  await insertReply(166, '>>4 護理師、理財顧問、心理諮商師也適合\n經驗比體力重要', '名無しさん', 9);
  await insertReply(166, 'Zoom創辦人袁征41歲離開思科創業\n現在市值200億美元', '名無しさん', 8);
  await insertReply(166, '中年轉職可以考慮斜槓\n發揮多元才能', '過來人', 7);
  await insertReply(166, '>>7 49%企業說中高階人才短缺\n其實機會很多', '名無しさん', 6);
  await insertReply(166, '40歲的優勢是人脈和經驗\n面對跨部門溝通更游刃有餘', '名無しさん', 5);

  // ========== ID 165: 有人看陸劇嗎 (gossip) ==========
  console.log('  📺 #165 - 有人看陸劇嗎');
  await insertReply(165, '2026陸劇推《驕陽似我》\n宋威龍趙今麥主演\n甜到爆', '名無しさん', 12);
  await insertReply(165, '>>4 《軋戲》也好看\n陳星旭盧昱曉的NPC戀愛', '追劇族', 11);
  await insertReply(165, '古裝推《玉茗茶骨》\n侯明昊古力娜扎的宅鬥劇', '名無しさん', 10);
  await insertReply(165, '《逍遙》也很夯\n智謀交鋒類型', '名無しさん', 9);
  await insertReply(165, '>>7 《輕年》霍建華主演\n中年世代的友情人生', '名無しさん', 8);
  await insertReply(165, '待播期待《逐玉》《莫離》\n張凌赫白鹿迪麗熱巴都有新作', '名無しさん', 7);
  await insertReply(165, '現在陸劇品質真的不錯\n不輸韓劇', '名無しさん', 6);

  // ========== ID 158: 00878換台積電對嗎？ (money) ==========
  console.log('  💰 #158 - 00878換台積電對嗎？');
  await insertReply(158, '2025年00878績效報酬6.3%\n0050漲超過36%\n差很多', '名無しさん', 14);
  await insertReply(158, '>>4 高股息ETF去年表現差強人意\n但有抗跌特性', '名無しさん', 13);
  await insertReply(158, '台股破3萬點\n台積電是絕對領頭羊', '名無しさん', 12);
  await insertReply(158, '含積量高的市值型ETF很夯\n權重30-35%是黃金比例', '理財族', 11);
  await insertReply(158, '>>7 分散風險還是要的\n別全押單一標的', '名無しさん', 10);
  await insertReply(158, '2026年預估上市櫃現金股利2.6兆\n高股息ETF配息有望調高', '名無しさん', 9);
  await insertReply(158, '看你的投資目標\n穩定配息選00878\n追成長選台積電', '名無しさん', 8);

  // ========== ID 155: 娜妍也很可愛 (gossip) ==========
  console.log('  🐰 #155 - 娜妍也很可愛');
  await insertReply(155, 'TWICE現在在跑THIS IS FOR世巡\n360度舞台超讚', '名無しさん', 16);
  await insertReply(155, '>>4 1月溫哥華兩場sold out\n1月底達拉斯也有', 'ONCE', 15);
  await insertReply(155, '娜璉是TWICE第一個solo出道的\n《IM NAYEON》《Na》都很讚', '名無しさん', 14);
  await insertReply(155, '去年TWICE成為首個在Lollapalooza當頭條的K-pop女團', '名無しさん', 13);
  await insertReply(155, '>>7 十週年專輯《Ten: The Story Goes On》超感動', '名無しさん', 12);
  await insertReply(155, '娜璉志效Momo子瑜還上了維密秀\n超強', '名無しさん', 11);

  // ========== ID 147: 馬斯克森77 (tech) ==========
  console.log('  🚀 #147 - 馬斯克森77');
  await insertReply(147, '馬斯克現在淨資產7850億美元\n全球首富', '名無しさん', 12);
  await insertReply(147, '>>4 2024年12月達4000億\n2025年底就衝到7000億\n太誇張', '名無しさん', 11);
  await insertReply(147, 'X說要公開演算法原始碼\n每4週更新一次', '名無しさん', 10);
  await insertReply(147, '馬斯克預測2026年美國經濟兩位數成長\n但很多人不信', '名無しさん', 9);
  await insertReply(147, '>>7 X這週當機兩次了\n品質堪憂', '名無しさん', 8);
  await insertReply(147, 'X還在告音樂出版商反壟斷\n戲真多', '名無しさん', 7);

  // ========== ID 163: 今の札幌 (chat) ==========
  console.log('  ❄️ #163 - 今の札幌');
  await insertReply(163, '札幌雪祭2/4-2/11\n第76屆了', '名無しさん', 14);
  await insertReply(163, '>>4 三大會場：大通公園、TSUDOME、薄野', '名無しさん', 13);
  await insertReply(163, '大通公園有5座大型雪雕\n1.5公里走完要30分鐘', '旅日族', 12);
  await insertReply(163, '小樽雪燈之路2/7-2/14\n運河點燈超美', '名無しさん', 11);
  await insertReply(163, '>>7 旭川冬季祭2/6-2/11也可以順便去', '名無しさん', 10);
  await insertReply(163, '每年超過200萬人參加\n要訂房要早', '名無しさん', 9);

  // ========== ID 150: 外國人寫春聯 (chat) ==========
  console.log('  🧧 #150 - 外國人寫春聯');
  await insertReply(150, '2026是馬年\n春節2/14-2/22放9天', '名無しさん', 16);
  await insertReply(150, '>>4 春聯最佳時間是除夕早上6點到中午12點\n陽氣最旺', '名無しさん', 15);
  await insertReply(150, '貼法：上聯仄下聯平\n先貼右再貼左', '名無しさん', 14);
  await insertReply(150, '「春」字不要貼大門\n有招爛桃花的意思', '名無しさん', 13);
  await insertReply(150, '>>7 「福」字貼大門要正貼\n象徵迎福納福', '名無しさん', 12);
  await insertReply(150, '外國人寫春聯很有趣\n文化交流', '名無しさん', 11);

  // ========== ID 162: その着せ替え人形は恋をする (acg) ==========
  console.log('  👗 #162 - その着せ替え人形は恋をする');
  await insertReply(162, '動畫第二季2025年7-9月播完了\nCloverWorks製作', '名無しさん', 14);
  await insertReply(162, '>>4 漫畫2025年3月完結\n共連載7年', '名無しさん', 13);
  await insertReply(162, '台北動漫節會請海夢聲優直田姬奈來\n有見面會', 'ACG迷', 12);
  await insertReply(162, '第三季目前還沒消息\n等官方公告', '名無しさん', 11);
  await insertReply(162, '>>7 這部cosplay題材很棒\n五條君太可愛', '名無しさん', 10);
  await insertReply(162, '海夢的角色塑造很成功\n開朗又有深度', '名無しさん', 9);

  // ========== ID 202: 很神奇的道教神 (chat) ==========
  console.log('  ⛩️ #202 - 很神奇的道教神');
  await insertReply(202, '台灣民間信仰融合道釋儒\n93%有信仰的人都是民間信仰', '名無しさん', 18);
  await insertReply(202, '>>4 道教神明系統：三清居首\n玉皇大帝在其下', '名無しさん', 17);
  await insertReply(202, '媽祖原名林默娘\n福建湄洲人\n海上守護神', '名無しさん', 16);
  await insertReply(202, '「三月瘋媽祖、四月迎王爺」\n大甲媽遶境超過百萬人參加', '信眾', 15);
  await insertReply(202, '>>7 土地公是村落守護神\n到處都有福德宮', '名無しさん', 14);
  await insertReply(202, '台灣廟宇常見前殿道教後殿佛教\n很特別', '名無しさん', 13);

  // ========== ID 1170: 看成八方雲集 (chat) ==========
  console.log('  🥟 #1170 - 看成八方雲集');
  await insertReply(1170, '八方雲集現在鍋貼水餃一顆7元\n2024年7月調漲的', '名無しさん', 12);
  await insertReply(1170, '>>4 全台1055家\n跟四海遊龍並列兩強', '名無しさん', 11);
  await insertReply(1170, '新口味酸甘藍要上了\n咖哩雞肉要下架', '名無しさん', 10);
  await insertReply(1170, '鍋貼一顆約60大卡\n水餃油脂比較低', '名無しさん', 9);
  await insertReply(1170, '>>7 還有梁師傅排骨麵和八方一號\n不只鍋貼', '名無しさん', 8);
  await insertReply(1170, '可以用LINE Pay街口全支付\n但各店不同', '名無しさん', 7);

  // ========== ID 340: 為何有此匿名討論區 (life) ==========
  console.log('  🎭 #340 - 為何有此匿名討論區');
  await insertReply(340, 'PTT門檻越來越高\n現在要登入2000次才能發文', '名無しさん', 14);
  await insertReply(340, '>>4 等於2017年以前的帳號\n新人進不去', '名無しさん', 13);
  await insertReply(340, '匿名的好處是可以講真話\n不用怕被認出來', '名無しさん', 12);
  await insertReply(340, 'Dcard也要大學信箱驗證\n不是完全匿名', '名無しさん', 11);
  await insertReply(340, '>>7 但匿名也容易被網軍利用\n要小心分辨', '名無しさん', 10);
  await insertReply(340, '有個安全發言的空間還是很重要', '名無しさん', 9);

  // ========== ID 120: Tzuyu (chat) ==========
  console.log('  💜 #120 - Tzuyu');
  await insertReply(120, '子瑜去年上了維密秀\n和娜璉志效Momo一起', '名無しさん', 16);
  await insertReply(120, '>>4 台灣之光\n超驕傲', 'ONCE', 15);
  await insertReply(120, 'TWICE十週年專輯她的part很棒', '名無しさん', 14);
  await insertReply(120, '現在在跑世巡THIS IS FOR\n360度舞台', '名無しさん', 13);
  await insertReply(120, '>>7 下半年不知道會不會回台開演唱會', '名無しさん', 12);
  await insertReply(120, '子瑜的氣質真的很好\n又美又有禮貌', '名無しさん', 11);

  console.log('\n✅ 各版討論串補充完成 (2026-01-23 v2)！');
}

async function main() {
  console.log('🚀 Starting reply boost (2026-01-23 v2)...\n');

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
      WHERE p.id IN (166, 165, 158, 155, 147, 163, 150, 162, 202, 1170, 340, 120)
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
