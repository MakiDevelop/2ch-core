#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-23 第四批 - 補充稀缺討論串
 *
 * 為回覆數較少的討論串補充回應，基於真實時事：
 * - M4 Mac：Mac mini M4 Pro效能、Thunderbolt 5讀取6269MB/s
 * - GitHub Copilot：Free版每月2000次、Pro $10/月、Pro+ $39/月
 * - Vercel替代方案：Netlify、Cloudflare Pages、Coolify自架
 * - Rust：226萬開發者使用、商業開發成長68.75%
 * - 標題黨：台灣媒體亂象、內容農場
 * - 失眠：478呼吸法、認知行為療法CBT-I
 * - CSS 2026：Anchor Positioning、原生Masonry佈局
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
  console.log('💬 補充稀缺討論串 (2026-01-23 v4)...\n');

  // ========== ID 84: 用 M4 Mac 編譯還是起飛 (tech) ==========
  console.log('  🍎 #84 - 用 M4 Mac 編譯還是起飛');
  await insertReply(84, 'M4 Pro效能跟M1 Ultra差不多\n價格卻只要一半', '名無しさん', 10);
  await insertReply(84, '>>4 Thunderbolt 5 SSD讀取6269MB/s\n比MacBook Pro M1 Max還快', '名無しさん', 9);
  await insertReply(84, '重負載編譯風扇幾乎無聲\n維持4.5GHz不降頻', '工程師', 8);
  await insertReply(84, 'AppleInsider給滿分\n「Mac Studio效能，一半價格」', '名無しさん', 7);
  await insertReply(84, '>>7 M5已經在傳了\nCPU快15%、GPU快45%', '名無しさん', 6);
  await insertReply(84, '開發者用Mac mini M4 Pro剛好\n不用買到Studio', '名無しさん', 5);

  // ========== ID 82: GitHub Copilot 續訂要 600 多，值得嗎 (tech) ==========
  console.log('  🤖 #82 - GitHub Copilot 續訂要 600 多，值得嗎');
  await insertReply(82, '現在有免費版了\n每月2000次補完、50次聊天', '名無しさん', 12);
  await insertReply(82, '>>4 Pro版$10/月\n無限次補完+進階模型', '名無しさん', 11);
  await insertReply(82, 'Pro+版$39/月\n有GPT-5可以用', '名無しさん', 10);
  await insertReply(82, '調查說用Copilot的開發者滿意度提高75%\n效率提高55%', '工程師', 9);
  await insertReply(82, '>>7 學生和開源維護者可以免費用', '名無しさん', 8);
  await insertReply(82, '直接在VS Code裡解決問題\n比網頁複製貼上快多了', '名無しさん', 7);

  // ========== ID 80: Vercel 免費方案快不夠用了，求替代方案 (tech) ==========
  console.log('  ☁️ #80 - Vercel 免費方案快不夠用了，求替代方案');
  await insertReply(80, 'Cloudflare Pages推薦\n邊緣運算很強', '名無しさん', 14);
  await insertReply(80, '>>4 Netlify也是經典選擇\n自動化建構+全球CDN', '名無しさん', 13);
  await insertReply(80, 'Zeabur對小專案很友善\n3個服務以內免費', '名無しさん', 12);
  await insertReply(80, '想要完全掌控就自架Coolify\n開源的Heroku替代方案', '後端工程師', 11);
  await insertReply(80, '>>7 Railway也不錯\n可以部署資料庫和後端', '名無しさん', 10);
  await insertReply(80, 'Vercel免費版有100GB流量\n個人專案其實夠用', '名無しさん', 9);

  // ========== ID 75: Rust 學了三個月，頭髮掉了一半 (tech) ==========
  console.log('  🦀 #75 - Rust 學了三個月，頭髮掉了一半');
  await insertReply(75, 'Rust學習曲線確實陡\n但過了就是新世界', '名無しさん', 12);
  await insertReply(75, '>>4 全球226萬開發者在用\n70萬人當主力語言', 'Rustacean', 11);
  await insertReply(75, '商業開發比例3年成長68.75%\n越來越多公司用', '名無しさん', 10);
  await insertReply(75, 'Mozilla、Microsoft、AWS都在用\n不是玩具語言', '名無しさん', 9);
  await insertReply(75, '>>7 每6個Go開發者就有1個考慮轉Rust', '名無しさん', 8);
  await insertReply(75, 'Stack Overflow連續好幾年最受喜愛語言\n撐下去', '名無しさん', 7);

  // ========== ID 78: 2026 年了還有人在手刻 CSS 嗎 (tech) ==========
  console.log('  🎨 #78 - 2026 年了還有人在手刻 CSS 嗎');
  await insertReply(78, 'CSS 2026超強\nAnchor Positioning不用靠JS定位了', '名無しさん', 14);
  await insertReply(78, '>>4 原生Masonry佈局也來了\n不用Masonry.js', '前端工程師', 13);
  await insertReply(78, 'Tailwind還是很多人用\n但原生CSS功能越來越強', '名無しさん', 12);
  await insertReply(78, 'Container Queries改變響應式設計\n根據父容器調整樣式', '名無しさん', 11);
  await insertReply(78, '>>7 clamp()超好用\n字體大小自適應', '名無しさん', 10);
  await insertReply(78, '框架會來來去去\n但HTML CSS JS永遠是基礎', '名無しさん', 9);

  // ========== ID 74: 用了三個月 Claude Code，回不去了 (tech) ==========
  console.log('  🧠 #74 - 用了三個月 Claude Code，回不去了');
  await insertReply(74, '200K上下文處理大專案超猛\n認證系統連API連DB都能理解', '名無しさん', 10);
  await insertReply(74, '>>4 CLAUDE.md設定好規範\n它真的會一直遵守', '工程師', 9);
  await insertReply(74, '比Cursor少用5.5倍token\n完成更快錯誤更少', '名無しさん', 8);
  await insertReply(74, '「Cursor讓你做更快，Claude Code幫你做」', '名無しさん', 7);
  await insertReply(74, '>>7 兩個一起用更強\n看任務類型切換', '名無しさん', 6);
  await insertReply(74, '省下的時間拿去debug其他問題www', '名無しさん', 5);

  // ========== ID 102: 現在的新聞是不是都標題黨 (news) ==========
  console.log('  📰 #102 - 現在的新聞是不是都標題黨');
  await insertReply(102, '標題黨就是clickbait\n用誇張聳動標題騙點擊', '名無しさん', 14);
  await insertReply(102, '>>4 內容農場最嚴重\n靠流量賺廣告費', '名無しさん', 13);
  await insertReply(102, '台灣媒體1987解嚴後競爭激烈\n平實報導留不住人', '名無しさん', 12);
  await insertReply(102, '民視還被抓到用AI生成畫面報導緬甸地震', '名無しさん', 11);
  await insertReply(102, '>>7 業配新聞也是問題\n政府機關付錢寫的', '名無しさん', 10);
  await insertReply(102, '自己查證很重要\n不要只看標題就分享', '名無しさん', 9);

  // ========== ID 85: 半夜三點睡不著，來聊天 (chat) ==========
  console.log('  😴 #85 - 半夜三點睡不著，來聊天');
  await insertReply(85, '試試478呼吸法\n吸4秒、屏7秒、呼8秒', '名無しさん', 10);
  await insertReply(85, '>>4 可以降低壓力荷爾蒙', '名無しさん', 9);
  await insertReply(85, '睡前30分鐘不要看3C\n藍光會抑制褪黑激素', '名無しさん', 8);
  await insertReply(85, '寫煩惱筆記本\n讓大腦知道明天再處理', '失眠族', 7);
  await insertReply(85, '>>7 40度溫水泡腳20分鐘\n促進血液循環', '名無しさん', 6);
  await insertReply(85, '長期失眠要看身心科\n認知行為療法CBT-I很有效', '名無しさん', 5);

  // ========== ID 77: 今天 debug 到一個超詭異的 bug (tech) ==========
  console.log('  🐛 #77 - 今天 debug 到一個超詭異的 bug');
  await insertReply(77, '最詭異的通常是時區或編碼問題', '名無しさん', 12);
  await insertReply(77, '>>4 還有race condition\n偶發性超難抓', '工程師', 11);
  await insertReply(77, '有次debug三天\n結果是少一個分號', '名無しさん', 10);
  await insertReply(77, '現在用Claude Code debug很快\n直接貼錯誤訊息給它', '名無しさん', 9);
  await insertReply(77, '>>7 但AI有時候會唬爛\n還是要自己驗證', '名無しさん', 8);
  await insertReply(77, '最好的debug是寫好測試\n問題早點發現', '名無しさん', 7);

  // ========== ID 88: 便利商店的店員記住我了 (chat) ==========
  console.log('  🏪 #88 - 便利商店的店員記住我了');
  await insertReply(88, '去太多次了吧www', '名無しさん', 10);
  await insertReply(88, '>>4 店員記性好的很恐怖\n你買什麼他都知道', '名無しさん', 9);
  await insertReply(88, '我家附近的會幫我留報紙\n太感動', '名無しさん', 8);
  await insertReply(88, '被記住有好有壞\n買奇怪的東西會尷尬', '名無しさん', 7);
  await insertReply(88, '>>7 深夜買泡麵被關心\n「又加班啊？」', '社畜', 6);
  await insertReply(88, '小七店員辛苦了\n什麼都要會', '名無しさん', 5);

  // ========== ID 87: 隔壁鄰居又在吵架了 (chat) ==========
  console.log('  🏠 #87 - 隔壁鄰居又在吵架了');
  await insertReply(87, '半夜吵可以報警\n噪音管制法有規定', '名無しさん', 12);
  await insertReply(87, '>>4 晚上10點到早上6點是管制時間', '名無しさん', 11);
  await insertReply(87, '先錄音蒐證\n有證據才好處理', '名無しさん', 10);
  await insertReply(87, '也可以請管委會協調\n不用直接衝突', '名無しさん', 9);
  await insertReply(87, '>>7 買隔音耳塞\n自己保護自己', '名無しさん', 8);
  await insertReply(87, '有些人就是沒公德心\n只能搬家解決', '名無しさん', 7);

  // ========== ID 96: 這個站剛開嗎？人好少 (meta) ==========
  console.log('  🌱 #96 - 這個站剛開嗎？人好少');
  await insertReply(96, 'PTT門檻太高\n新的匿名空間需要時間累積', '名無しさん', 14);
  await insertReply(96, '>>4 現在要登入2000次才能發文\n新人根本進不去', '名無しさん', 13);
  await insertReply(96, '慢慢來\n品質比人數重要', '名無しさん', 12);
  await insertReply(96, '人少的好處是討論品質比較好\n不會被洗版', '名無しさん', 11);
  await insertReply(96, '>>7 等內容多了自然會有人來', '名無しさん', 10);
  await insertReply(96, '我是從PTT過來的\n這裡清靜多了', '老鄉民', 9);

  console.log('\n✅ 稀缺討論串補充完成 (2026-01-23 v4)！');
}

async function main() {
  console.log('🚀 Starting reply boost (2026-01-23 v4)...\n');

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
      WHERE p.id IN (84, 82, 80, 75, 78, 74, 102, 85, 77, 88, 87, 96)
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
