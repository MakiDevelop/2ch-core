#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-22 - 補充稀缺回應 (第四批)
 *
 * 基於真實時事：
 * - GitHub Copilot vs Cursor：Copilot $10/月、Cursor $20/月，Cursor 評價 4.9/5
 * - Rust：連續多年最受歡迎語言，微軟/Linux/Android 都在用
 * - 台灣軟體薪水：月薪約 7-16 萬，年薪約 88-200 萬
 * - NAS：Synology DS224+ $9,699、QNAP QuX05 系列
 * - Ubuntu 26.04 LTS：4月發布，代號 Resolute Raccoon，GNOME 50
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
  console.log('💬 補充稀缺回應 (第四批 - Tech 專題)...\n');

  // ========== ID 1894: 有些工作的循環 ==========
  console.log('  🔄 #1894 - 有些工作的循環');
  await insertReply(1894, '太有感了\n功勞是主管的，責任是底下人的', '名無しさん', 6);
  await insertReply(1894, '這就是大公司文化\n見怪不怪了', '名無しさん', 5);
  await insertReply(1894, '>>1 最怕的是還要自己善後', '名無しさん', 4);
  await insertReply(1894, '學會保護自己\n郵件都要留底', '過來人', 3);
  await insertReply(1894, '所以現在做事都先想退路', '名無しさん', 2);

  // ========== ID 195: GitHub Copilot vs Cursor ==========
  console.log('  🤖 #195 - Copilot vs Cursor');
  await insertReply(195, 'Copilot $10/月\nCursor Pro $20/月\n價格差一倍', '名無しさん', 14);
  await insertReply(195, 'Cursor 評價比較高\n4.9 vs 4.2', '名無しさん', 13);
  await insertReply(195, '>>5 但 Cursor 對大型專案比較有優勢\n可以讀整個專案上下文', '名無しさん', 12);
  await insertReply(195, '日常開發用 Copilot 就夠了\n整合度高', '工程師', 11);
  await insertReply(195, '現在很多人兩個都用\n看情況切換', '名無しさん', 10);
  await insertReply(195, 'Claude Code 也很強\n複雜問題解釋得很清楚', '名無しさん', 9);

  // ========== ID 192: Rust 值得學嗎 ==========
  console.log('  🦀 #192 - Rust 值得學嗎');
  await insertReply(192, 'Stack Overflow 連續幾年最受歡迎語言\n超過80%開發者想繼續用', '名無しさん', 16);
  await insertReply(192, '微軟、Linux、Android 都在導入\n大廠背書', '名無しさん', 15);
  await insertReply(192, '>>5 微軟70%漏洞是記憶體安全問題\n所以開始用Rust改寫', '名無しさん', 14);
  await insertReply(192, '學習曲線確實陡\n借用檢查器一開始會很痛苦', 'Rustacean', 13);
  await insertReply(192, '推薦 The Rust Book\n官方教材很完整', '名無しさん', 12);
  await insertReply(192, 'CLI工具、系統程式用Rust超香\n效能跟C差不多', '名無しさん', 11);

  // ========== ID 193: 台灣軟體業薪水 ==========
  console.log('  💰 #193 - 台灣軟體薪水');
  await insertReply(193, '市場規模差太多\n美國是全球市場', '名無しさん', 18);
  await insertReply(193, '台灣中位數大概年薪88萬\nSenior可以到160萬', '名無しさん', 17);
  await insertReply(193, '>>5 但生活成本也差很多\n矽谷房租超貴', '名無しさん', 16);
  await insertReply(193, '想領美國薪水可以找遠端工作', '名無しさん', 15);
  await insertReply(193, '台灣軟體業還是供不應求\n薪資成長空間有', '名無しさん', 14);
  await insertReply(193, '外商在台分公司薪水也不錯\nGoogle、Microsoft', '名無しさん', 13);

  // ========== ID 194: 自架NAS還是買現成 ==========
  console.log('  💾 #194 - 自架NAS');
  await insertReply(194, 'Synology DS224+ 大概 $9,699\n軟體生態真的好用', '名無しさん', 14);
  await insertReply(194, 'QNAP 硬體規格通常比較高\n同價位效能更好', '名無しさん', 13);
  await insertReply(194, '>>5 但Synology的DSM系統穩定度更好', 'NAS用戶', 12);
  await insertReply(194, '你的需求4T+Docker\nDS224+就夠了', '名無しさん', 11);
  await insertReply(194, '自組TrueNAS要花時間\n但彈性大', '名無しさん', 10);
  await insertReply(194, '記得買UPS\n防止停電資料損壞', '名無しさん', 9);

  // ========== ID 196: 2026還在用Ubuntu ==========
  console.log('  🐧 #196 - Ubuntu');
  await insertReply(196, 'Ubuntu 26.04 LTS 4月要出了\n代號 Resolute Raccoon', '名無しさん', 12);
  await insertReply(196, '會搭載 GNOME 50 和 Linux Kernel 6.20', '名無しさん', 11);
  await insertReply(196, '>>5 還有更好的 NVIDIA Wayland 支援', '名無しさん', 10);
  await insertReply(196, 'Ubuntu 夠用就不用換\n穩定最重要', 'Linux老手', 9);
  await insertReply(196, 'Fedora 比較新潮\n但 Ubuntu 社群資源多', '名無しさん', 8);
  await insertReply(196, '做後端開發 Ubuntu 完全夠用', '名無しさん', 7);

  // ========== ID 198: 刷題有用嗎 ==========
  console.log('  📝 #198 - 刷題');
  await insertReply(198, '外商必刷\nGoogle、Meta都會考', '名無しさん', 14);
  await insertReply(198, '台廠看公司\n有些會考簡單的', '名無しさん', 13);
  await insertReply(198, '>>5 建議至少刷100-150題\n涵蓋主要類型', '名無しさん', 12);
  await insertReply(198, 'LeetCode Hot 100 先刷完', '名無しさん', 11);
  await insertReply(198, '系統設計也很重要\n不能只刷演算法', '名無しさん', 10);
  await insertReply(198, '有3年經驗的話\n專案經歷也很加分', '面試官', 9);

  // ========== ID 200: HomeLab入坑 ==========
  console.log('  🏠 #200 - HomeLab');
  await insertReply(200, '3-5萬預算可以買台N100小主機\n功耗低又安靜', '名無しさん', 12);
  await insertReply(200, '二手企業伺服器便宜但超吵\n不建議放家裡', '名無しさん', 11);
  await insertReply(200, '>>5 而且吃電\n電費會很可觀', '名無しさん', 10);
  await insertReply(200, 'Intel NUC組cluster很潮\n但成本比較高', 'HomeLab玩家', 9);
  await insertReply(200, 'K3s比K8s輕量\n學習用推薦', '名無しさん', 8);
  await insertReply(200, 'Proxmox當底層很方便\n可以跑VM和容器', '名無しさん', 7);

  // ========== ID 203: 週一症候群 ==========
  console.log('  😩 #203 - 週一症候群');
  await insertReply(203, '這很正常\n大部分人都有', '名無しさん', 10);
  await insertReply(203, '試試看週日晚上準備好隔天的東西\n減少焦慮', '名無しさん', 9);
  await insertReply(203, '>>5 或是週一早上給自己一個小獎勵', '名無しさん', 8);
  await insertReply(203, '運動有幫助\n週日下午去跑步', '名無しさん', 7);
  await insertReply(203, '如果真的很嚴重\n可能要考慮換工作', '名無しさん', 6);

  // ========== ID 204: 同事一直找我聊天 ==========
  console.log('  💬 #204 - 同事聊天');
  await insertReply(204, '直接說在趕deadline\n需要專心', '名無しさん', 8);
  await insertReply(204, '戴降噪耳機\n假裝沒聽到', '名無しさん', 7);
  await insertReply(204, '>>5 都拍肩膀了還是會被打斷', '名無しさん', 6);
  await insertReply(204, '跟他約固定時間聊\n比如午餐或下午茶', '名無しさん', 5);
  await insertReply(204, '真的很困擾可以跟主管反應', '名無しさん', 4);

  // ========== ID 208: 半夜睡不著 ==========
  console.log('  🌙 #208 - 半夜睡不著');
  await insertReply(208, '放下手機\n藍光會讓你更清醒', '名無しさん', 6);
  await insertReply(208, '4-7-8呼吸法可以試試', '名無しさん', 5);
  await insertReply(208, '>>5 吸4秒、憋7秒、吐8秒\n重複幾次', '名無しさん', 4);
  await insertReply(208, '白噪音app也有幫助', '名無しさん', 3);
  await insertReply(208, '長期失眠要看醫生\n不要硬撐', '名無しさん', 2);

  // ========== ID 1288: MEGA.nz ==========
  console.log('  ☁️ #1288 - MEGA.nz');
  await insertReply(1288, '免費仔的悲哀\n人家也要成本', '名無しさん', 10);
  await insertReply(1288, '>>1 但用威脅語氣真的很差勁', '名無しさん', 9);
  await insertReply(1288, '換Google Drive或Dropbox吧', '名無しさん', 8);
  await insertReply(1288, '自架NAS才是王道\n資料自己掌控', '名無しさん', 7);
  await insertReply(1288, '重要資料還是備份多份比較安心', '名無しさん', 6);

  // ========== ID 372: Thread年薪200萬 ==========
  console.log('  💵 #372 - Thread年薪200萬');
  await insertReply(372, '網路上看看就好\n倖存者偏差', '名無しさん', 12);
  await insertReply(372, '真的年薪200的不會上網炫耀', '名無しさん', 11);
  await insertReply(372, '>>5 而且可能是稅前+股票', '名無しさん', 10);
  await insertReply(372, '比較自己的成長比較實際', '名無しさん', 9);
  await insertReply(372, '台灣軟體業頂尖的確實可以\n但是少數', '名無しさん', 8);

  // ========== ID 375: 矽谷創業文 ==========
  console.log('  🚀 #375 - 矽谷創業');
  await insertReply(375, '創業導師比創業者還多www', '名無しさん', 10);
  await insertReply(375, '很多是賣課程的\n韭菜收割機', '名無しさん', 9);
  await insertReply(375, '>>5 先看他們自己創業成功了沒', '名無しさん', 8);
  await insertReply(375, '真正成功的創業家沒空寫文章', '名無しさん', 7);
  await insertReply(375, '台灣市場也有機會\n不一定要去矽谷', '名無しさん', 6);

  // ========== ID 1360: SEGA Master System ==========
  console.log('  🎮 #1360 - SEGA SMS');
  await insertReply(1360, 'SMS硬體規格確實比紅白機好\n但遊戲陣容差太多', '名無しさん', 10);
  await insertReply(1360, '任天堂的獨佔遊戲太強了', '懷舊玩家', 9);
  await insertReply(1360, '>>5 馬力歐、薩爾達都在紅白機', '名無しさん', 8);
  await insertReply(1360, 'R-Type在SMS上真的很強', '名無しさん', 7);
  await insertReply(1360, '硬體好不等於會贏\n看PS跟SS', '名無しさん', 6);

  // ========== ID 1293: PC-Engine ==========
  console.log('  🕹️ #1293 - PC-Engine');
  await insertReply(1293, 'PCE的CD-ROM遊戲超前時代', '名無しさん', 10);
  await insertReply(1293, '天外魔境系列超讚', '懷舊玩家', 9);
  await insertReply(1293, '>>5 還有惡魔城血之輪迴\n神作', '名無しさん', 8);
  await insertReply(1293, '可惜只在日本紅\n北美銷量很差', '名無しさん', 7);
  await insertReply(1293, 'NEC跟Hudson合作的產物\n技術力很強', '名無しさん', 6);

  console.log('\n✅ 稀缺回應補充完成！');
}

async function main() {
  console.log('🚀 Starting reply boost v2 (2026-01-22)...\n');

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
      WHERE p.id IN (1894, 195, 192, 193, 194, 196, 198, 200, 203, 204, 208, 1288, 372, 375, 1360, 1293)
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
