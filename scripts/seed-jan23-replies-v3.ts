#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-23 第三批 - 補充稀缺討論串
 *
 * 為回覆數較少的討論串補充回應，基於真實時事：
 * - AI賺錢：內容創作、線上課程、提示詞工程
 * - 第一桶金：平均4.21年存171萬、定期定額0050
 * - 2026冬番：葬送的芙莉蓮S2、咒術迴戰、我推的孩子S3
 * - 手遊課金：明日方舟業界良心、崩鐵抽卡攻略
 * - 養貓花費：每月2000-5000元、年度3.6-14.4萬
 * - 2026報稅：免稅額10.1萬、標準扣除額13.6萬
 * - 曖昧告白：直球戀愛clear-coding、曖昧不超過一個月
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
  console.log('💬 補充稀缺討論串 (2026-01-23 v3)...\n');

  // ========== ID 107: AI時代普通人最快的賺錢方式是？ (work) ==========
  console.log('  🤖 #107 - AI時代普通人最快的賺錢方式是？');
  await insertReply(107, 'AI自媒體寫作月入5000+\n用ChatGPT生成熱點文章和短影音腳本', '名無しさん', 10);
  await insertReply(107, '>>4 線上課程也可以\nAI幫你規劃大綱寫講義\n開發週期縮短好幾倍', '名無しさん', 9);
  await insertReply(107, '提示詞工程是新興技能\n幫企業設計高效prompt', '名無しさん', 8);
  await insertReply(107, '有人用AI做定制化GPT工具\n按月收費賣給企業', '副業族', 7);
  await insertReply(107, '>>7 麥肯錫說71%企業在用生成式AI\n需求很大', '名無しさん', 6);
  await insertReply(107, '重點是要從擅長的領域開始\n用AI加速不是從零開始', '名無しさん', 5);

  // ========== ID 103: 存到第一桶金需要多久 (money) ==========
  console.log('  💰 #103 - 存到第一桶金需要多久');
  await insertReply(103, '調查說平均4.21年存171萬\n每月要存2.8萬', '名無しさん', 12);
  await insertReply(103, '>>4 40%的人認為25-29歲要存到100萬', '名無しさん', 11);
  await insertReply(103, '22歲開始每月7000定期定額0050\n30歲就有100萬', '名無しさん', 10);
  await insertReply(103, '現在100萬換算30年前是200萬\n通膨太可怕', '理財族', 9);
  await insertReply(103, '>>7 年輕人同時面對低薪和通膨\n真的不容易', '名無しさん', 8);
  await insertReply(103, '定期定額是王道\n長期複利效果驚人', '名無しさん', 7);

  // ========== ID 100: 這季新番有什麼推薦的嗎 (acg) ==========
  console.log('  📺 #100 - 這季新番有什麼推薦的嗎');
  await insertReply(100, '2026冬番超強\n葬送的芙莉蓮S2、咒術迴戰死滅迴游、我推的孩子S3', '名無しさん', 14);
  await insertReply(100, '>>4 芙莉蓮第二季改編61-119話\n北部旅程篇', 'ACG迷', 13);
  await insertReply(100, '炎炎消防隊最終季！2019播到現在終於完結', '名無しさん', 12);
  await insertReply(100, '新作推達爾文事變\n人猿混種的社會派漫畫改編', '名無しさん', 11);
  await insertReply(100, '>>7 花樣少年少女終於動畫化\n1/4開播', '名無しさん', 10);
  await insertReply(100, '公主殿下拷問S2也回來了\n美食拷問www', '名無しさん', 9);
  await insertReply(100, '這季55部新作\n選擇困難症發作', '名無しさん', 8);

  // ========== ID 101: 手遊課了5萬還是沒抽到 (acg) ==========
  console.log('  🎰 #101 - 手遊課了5萬還是沒抽到');
  await insertReply(101, '明日方舟算業界良心\n抽卡機率透明', '名無しさん', 12);
  await insertReply(101, '>>4 棕色塵埃2也很佛\n常常送免費抽', '手遊玩家', 11);
  await insertReply(101, 'FGO聖晶石一顆30元\n甜蜜期過了就是深淵', '名無しさん', 10);
  await insertReply(101, '抽卡樂趣在過程不是結果\n這就是轉蛋機制的陷阱', '名無しさん', 9);
  await insertReply(101, '>>7 30-40歲課最多\n收入穩定但沉迷更深', '名無しさん', 8);
  await insertReply(101, '設預算上限\n超過就停手\n不然無底洞', '名無しさん', 7);

  // ========== ID 99: 曖昧三個月了，要不要告白 (love) ==========
  console.log('  💕 #99 - 曖昧三個月了，要不要告白');
  await insertReply(99, '三個月太久了\n愛情吸引力會過期', '名無しさん', 14);
  await insertReply(99, '>>4 曖昧最好不要超過一個月\n時間越長越難突破', '名無しさん', 13);
  await insertReply(99, '2026約會趨勢是直球戀愛clear-coding\n直接說清楚要什麼', '名無しさん', 12);
  await insertReply(99, '判斷對方順從度\n話題有呼應、邀約有答應\n就可以進攻了', '過來人', 11);
  await insertReply(99, '>>7 在對方面前能做自己最重要\n這樣才能長久', '名無しさん', 10);
  await insertReply(99, '朋友的意見也很重要\n他們的眼光是最即時的參考', '名無しさん', 9);

  // ========== ID 94: 養貓之後發現自己很窮 (life) ==========
  console.log('  🐱 #94 - 養貓之後發現自己很窮');
  await insertReply(94, '養貓每月2000-5000\n看你買什麼等級的', '名無しさん', 12);
  await insertReply(94, '>>4 伙食費1200-2500\n貓砂50-500\n加一加真的不少', '貓奴', 11);
  await insertReply(94, '年度花費3.6萬到14.4萬\n保險健檢預防針攤下來更多', '名無しさん', 10);
  await insertReply(94, '寵物保險一年1000-5000\n建議要保\n生病醫療費超貴', '名無しさん', 9);
  await insertReply(94, '>>7 團購囤貨可以省\n加入寵物店會員也有折扣', '名無しさん', 8);
  await insertReply(94, '但貓咪療癒無價\n花得值得', '名無しさん', 7);

  // ========== ID 139: 稅 (chat) ==========
  console.log('  💸 #139 - 稅');
  await insertReply(139, '2026報稅免稅額提高到10.1萬\n標準扣除額13.6萬', '名無しさん', 14);
  await insertReply(139, '>>4 薪資扣除額22.7萬\n基本生活費21.3萬', '名無しさん', 13);
  await insertReply(139, '單身上班族薪資46.4萬以下免繳稅\n小資族福音', '名無しさん', 12);
  await insertReply(139, '租屋族年收62.6萬以下也免稅', '名無しさん', 11);
  await insertReply(139, '>>7 長照扣除額從12萬提高到18萬\n有照顧長輩的可以用', '名無しさん', 10);
  await insertReply(139, '房租支出改列特別扣除額\n上限18萬', '報稅達人', 9);

  // ========== ID 93: 今天又沒有跟任何人說話 (life) ==========
  console.log('  😶 #93 - 今天又沒有跟任何人說話');
  await insertReply(93, '遠距工作越來越多人這樣\n一整天只跟電腦說話', '名無しさん', 10);
  await insertReply(93, '>>4 社交需要刻意安排\n不然很容易宅在家', '名無しさん', 9);
  await insertReply(93, '去咖啡廳工作\n至少點餐要開口', '名無しさん', 8);
  await insertReply(93, '參加社團或興趣班\n固定時間見到人', '名無しさん', 7);
  await insertReply(93, '>>7 線上社群也算\n有互動就好', '名無しさん', 6);
  await insertReply(93, '一個人也沒什麼不好\n但偶爾需要真人交流', '名無しさん', 5);

  // ========== ID 92: 遇到一個很雷的新人 (work) ==========
  console.log('  ⚡ #92 - 遇到一個很雷的新人');
  await insertReply(92, '先確認是能力問題還是態度問題\n處理方式不同', '名無しさん', 12);
  await insertReply(92, '>>4 能力不足可以教\n態度有問題就麻煩了', '主管', 11);
  await insertReply(92, '給明確的工作指示和期限\n不要假設他知道', '名無しさん', 10);
  await insertReply(92, '新人適應期通常3個月\n太快下結論不好', '名無しさん', 9);
  await insertReply(92, '>>7 但如果影響到團隊\n還是要反映給主管', '名無しさん', 8);
  await insertReply(92, '文字紀錄很重要\n以後有爭議才有證據', '名無しさん', 7);

  // ========== ID 90: 主管說要有ownership但又不給權限 (work) ==========
  console.log('  🔒 #90 - 主管說要有ownership但又不給權限');
  await insertReply(90, '典型的台灣職場文化\n責任給你但權力不放', '名無しさん', 14);
  await insertReply(90, '>>4 ownership需要授權配套\n不然就是空話', '社畜', 13);
  await insertReply(90, '可以問主管具體要怎麼做\n讓他給方向', '名無しさん', 12);
  await insertReply(90, '或者先做再報告\n用結果換取信任', '名無しさん', 11);
  await insertReply(90, '>>7 如果一直被卡\n那可能要考慮換環境了', '名無しさん', 10);
  await insertReply(90, '職場上不是每個主管都懂怎麼帶人\n自己要保護好自己', '名無しさん', 9);

  // ========== ID 156: 噁心的一幕 (life) ==========
  console.log('  🤢 #156 - 噁心的一幕');
  await insertReply(156, '公共場所看到的嗎\n還是職場', '名無しさん', 10);
  await insertReply(156, '>>4 捷運上最多奇人異事', '名無しさん', 9);
  await insertReply(156, '台灣人情味重\n但也有沒公德心的', '名無しさん', 8);
  await insertReply(156, '看到不舒服的事\n能離開就離開\n不用硬撐', '名無しさん', 7);
  await insertReply(156, '>>7 有些可以檢舉\n1999市民專線', '名無しさん', 6);

  // ========== ID 148: 世界好可愛 (gossip) ==========
  console.log('  🥰 #148 - 世界好可愛');
  await insertReply(148, '今天遇到什麼好事了嗎', '名無しさん', 12);
  await insertReply(148, '>>4 有時候一個小事就會覺得世界很美好', '名無しさん', 11);
  await insertReply(148, '早上買咖啡店員多給一塊餅乾\n開心一整天', '名無しさん', 10);
  await insertReply(148, '路上看到小朋友在玩\n笑得很開心\n被療癒', '名無しさん', 9);
  await insertReply(148, '>>7 貓咪影片也很療癒\nYouTube一看就停不下來', '名無しさん', 8);
  await insertReply(148, '保持這種心情很重要\n世界沒那麼糟', '名無しさん', 7);

  console.log('\n✅ 稀缺討論串補充完成 (2026-01-23 v3)！');
}

async function main() {
  console.log('🚀 Starting reply boost (2026-01-23 v3)...\n');

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
      WHERE p.id IN (107, 103, 100, 101, 99, 94, 139, 93, 92, 90, 156, 148)
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
