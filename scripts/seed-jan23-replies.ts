#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-23 - 補充稀缺回應
 *
 * 為回覆數較少的討論串補充回應，基於真實時事：
 * - Claude Code vs Cursor 2026 比較評測
 * - 2026 信用卡現金回饋：永豐大戶卡、台新Richart卡、國泰CUBE卡
 * - 深色模式研究：省電但不一定護眼
 * - 台灣過勞問題：職業倦怠指數36%全球居冠
 * - Imgur 鎖台灣 IP，替代方案：Meee、圖鴨上床
 * - 台語使用比例：31.7%，年輕世代國語超過九成
 * - 2026約會趨勢：直球戀愛 clear-coding
 * - 網軍與假帳號：國安局查報4.5萬組異常帳號
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
  console.log('💬 補充稀缺回應 (2026-01-23)...\n');

  // ========== ID 2064: 真的是有夠累 ==========
  console.log('  😩 #2064 - 真的是有夠累');
  await insertReply(2064, '台灣職業倦怠指數36%\n全球居冠\n比日本韓國還高', '名無しさん', 8);
  await insertReply(2064, '>>1 67%上班族感到身心俱疲\n不意外', '名無しさん', 7);
  await insertReply(2064, '台灣年工時2030小時\n39國排第6\n比日本還長', '社畜', 6);
  await insertReply(2064, '56.5%的人每天工作超過9小時\n違反勞基法了吧', '名無しさん', 5);
  await insertReply(2064, '>>4 還有先打卡再加班的\n根本血汗', '名無しさん', 4);
  await insertReply(2064, '平均每11天就有一個過勞死\n太可怕了', '名無しさん', 3);
  await insertReply(2064, '下班還要回訊息\n隱形工時算進去更恐怖', '名無しさん', 2);

  // ========== ID 191: Claude Code 用了一個月心得 ==========
  console.log('  🤖 #191 - Claude Code 用了一個月心得');
  await insertReply(191, '2026評測說Claude Code比Cursor少用5.5倍token\n完成更快錯誤更少', '名無しさん', 10);
  await insertReply(191, '>>4 兩個定位不同\nCursor是加速器，Claude Code是委派者', '工程師', 9);
  await insertReply(191, '「Cursor讓你做得更快\nClaude Code幫你做」\n這句話很到位', '名無しさん', 8);
  await insertReply(191, 'Claude 200K上下文處理大專案很猛\n認證系統連API連資料庫都能理解', '名無しさん', 7);
  await insertReply(191, '>>7 CLAUDE.md設定好規範\n它真的會一直遵守', '名無しさん', 6);
  await insertReply(191, 'Cursor的tab補全還是很快\n小修改用Cursor比較順', '名無しさん', 5);
  await insertReply(191, '結論是兩個都用\n看任務類型切換', '名無しさん', 4);

  // ========== ID 223: 信用卡推薦：現金回饋 vs 點數 ==========
  console.log('  💳 #223 - 信用卡推薦：現金回饋 vs 點數');
  await insertReply(223, '2026現金回饋首推永豐大戶卡\n國內3.5%國外4.5%', '名無しさん', 12);
  await insertReply(223, '>>4 活動到6月底\n要辦要快', '名無しさん', 11);
  await insertReply(223, '台新Richart卡整合7種方案\n每天可以切換一次', '名無しさん', 10);
  await insertReply(223, '國泰CUBE也是切換制\n慶生月最高10%', '卡友', 9);
  await insertReply(223, '>>7 CUBE的童樂匯方案有小孩的可以辦', '名無しさん', 8);
  await insertReply(223, '滙豐御璽卡無腦刷\n國內1.22%國外2.22%無上限', '名無しさん', 7);
  await insertReply(223, '現金回饋最實用\n點數換來換去麻煩', '名無しさん', 6);

  // ========== ID 212: 建議：希望能有深色模式 ==========
  console.log('  🌙 #212 - 建議：希望能有深色模式');
  await insertReply(212, '研究說深色模式其實不護眼\n只是比較省電', '名無しさん', 14);
  await insertReply(212, '>>4 黑底白字有光暈效應\n瞳孔要放大看更累', '名無しさん', 13);
  await insertReply(212, '但晚上用深色模式比較舒服是真的\n不會太刺眼', '名無しさん', 12);
  await insertReply(212, '81.9%手機用戶都用深色模式\n已經是主流了', '名無しさん', 11);
  await insertReply(212, '>>7 省電是真的\n亮度100%可省47%電', '名無しさん', 10);
  await insertReply(212, '程式碼編輯用深色比較好\n不然眼睛很痛', '工程師', 9);

  // ========== ID 214: 匿名發文會不會太容易被濫用？ ==========
  console.log('  🎭 #214 - 匿名發文會不會太容易被濫用？');
  await insertReply(214, '國安局去年查報4.5萬組異常帳號\n231萬則爭議訊息', '名無しさん', 12);
  await insertReply(214, '>>4 中共還用AI合成台灣人聲音\n超可怕', '名無しさん', 11);
  await insertReply(214, 'X平台新功能可以看帳號真實IP\n一堆自稱台灣的顯示北京', '名無しさん', 10);
  await insertReply(214, 'Dcard帳號淘寶都買得到\n可以指定大學', '名無しさん', 9);
  await insertReply(214, '>>7 難怪一些話題討論很假\n都是帶風向的', '名無しさん', 8);
  await insertReply(214, '匿名本身沒問題\n問題是有心人士操作', '名無しさん', 7);

  // ========== ID 216: 交往多久才適合見家長？ ==========
  console.log('  👨‍👩‍👧 #216 - 交往多久才適合見家長？');
  await insertReply(216, '調查說台男覺得隨時都可以\n但台女希望超過一年', '名無しさん', 14);
  await insertReply(216, '>>4 中南部男生最著急讓女友見公婆www', '名無しさん', 13);
  await insertReply(216, '心理師說婚姻是兩個家庭的事\n早點見反而好', '名無しさん', 12);
  await insertReply(216, '如果對方家長很難搞\n趁感情未深時分開比較不傷', '過來人', 11);
  await insertReply(216, '2026約會趨勢是直球戀愛\n喜歡不喜歡直接講', '名無しさん', 10);
  await insertReply(216, '>>9 clear-coding\n直接說明要什麼不要什麼', '名無しさん', 9);

  // ========== ID 1118: 想貼圖，煩惱沒圖床嗎？ ==========
  console.log('  🖼️ #1118 - 想貼圖，煩惱沒圖床嗎？');
  await insertReply(1118, 'Imgur去年5月開始鎖台灣IP\n只能用VPN上傳', '名無しさん', 16);
  await insertReply(1118, '>>4 替代方案推Meee\nPTT鄉民做的\n圖片8MB短片80MB', '名無しさん', 15);
  await insertReply(1118, '圖鴨上床(duk.tw)也不錯\n單檔20MB可以設密碼', '名無しさん', 14);
  await insertReply(1118, 'Imgpoi免註冊\n支援WebP格式', '名無しさん', 13);
  await insertReply(1118, '>>7 Postimages會壓縮高解析圖\n要注意', '名無しさん', 12);
  await insertReply(1118, 'imgbox會擋香港網域\n用的話要小心', '名無しさん', 11);

  // ========== ID 1119: 這裡還有一個圖床選擇 ==========
  console.log('  🖼️ #1119 - 這裡還有一個圖床選擇');
  await insertReply(1119, 'Meee是目前最穩的\n有人工審核不會亂', '名無しさん', 14);
  await insertReply(1119, '>>4 而且專門為PTT設計\n生成的連結格式方便', '名無しさん', 13);
  await insertReply(1119, 'Freeimage.host也有人推\n目前沒什麼問題', '名無しさん', 12);
  await insertReply(1119, 'imgpile找不到資料夾功能\n整理圖片不方便', '名無しさん', 11);
  await insertReply(1119, 'IM.GE會死圖\n不建議用', '名無しさん', 10);

  // ========== ID 337: 守護台灣語感的三個理由 ==========
  console.log('  🗣️ #337 - 守護台灣語感的三個理由');
  await insertReply(337, '最新普查台語使用比例31.7%\n年輕人幾乎都講國語', '名無しさん', 18);
  await insertReply(337, '>>4 14歲以下超過九成用國語\n台語要消失了', '名無しさん', 17);
  await insertReply(337, '55歲以上用國語的不到一半\n65歲以上不到三成', '名無しさん', 16);
  await insertReply(337, '每週兩堂母語課\n家裡不講有什麼用', '台語人', 15);
  await insertReply(337, '>>7 「母語就是家裡的話」\n學校學效果有限', '名無しさん', 14);
  await insertReply(337, '教育部台語辭典用了4.9億次\n還是有人在努力', '名無しさん', 13);

  // ========== ID 1214: 世界真的很偽善 ==========
  console.log('  🌐 #1214 - 世界真的很偽善');
  await insertReply(1214, '說要和平結果到處打仗\n說要人權結果到處迫害', '名無しさん', 12);
  await insertReply(1214, '>>4 雙標是國際政治的日常', '名無しさん', 11);
  await insertReply(1214, '環保喊得很大聲\n結果碳排放越來越多', '名無しさん', 10);
  await insertReply(1214, '社群媒體一堆假帳號帶風向\n真假都分不清', '名無しさん', 9);
  await insertReply(1214, '>>7 AI時代更慘\n合成影片合成聲音', '名無しさん', 8);
  await insertReply(1214, '能做的就是保持獨立思考\n不要被風向帶著走', '名無しさん', 7);

  // ========== ID 579: 你的錢就是我的錢 ==========
  console.log('  💰 #579 - 你的錢就是我的錢');
  await insertReply(579, '這種人趕快分\n財務觀念不合很難走下去', '名無しさん', 14);
  await insertReply(579, '>>4 交往就要AA\n不然以後更麻煩', '名無しさん', 13);
  await insertReply(579, '2026約會趨勢是直接講清楚\n不要曖昧', '名無しさん', 12);
  await insertReply(579, '結婚前各自管各自的錢最健康\n共同帳戶另外開', '過來人', 11);
  await insertReply(579, '>>7 有些人就是吃定你不好意思計較', '名無しさん', 10);
  await insertReply(579, '財務觀念不合是離婚主因之一\n要認真談', '名無しさん', 9);

  // ========== ID 210: 今天被路人誇了，開心一整天 ==========
  console.log('  😊 #210 - 今天被路人誇了，開心一整天');
  await insertReply(210, '被陌生人誇真的心情會很好\n一整天都有動力', '名無しさん', 12);
  await insertReply(210, '>>4 台灣人比較內斂\n很少主動誇人', '名無しさん', 11);
  await insertReply(210, '我也開始練習誇別人\n看到好的就說出來', '名無しさん', 10);
  await insertReply(210, '研究說正向回饋可以提升生產力\n職場也是', '名無しさん', 9);
  await insertReply(210, '>>7 被主管誇比被路人誇更難得www', '社畜', 8);
  await insertReply(210, '今天你也可以誇一個人\n讓好的循環下去', '名無しさん', 7);

  console.log('\n✅ 稀缺回應補充完成 (2026-01-23)！');
}

async function main() {
  console.log('🚀 Starting reply boost (2026-01-23)...\n');

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
      WHERE p.id IN (2064, 191, 223, 212, 214, 216, 1118, 1119, 337, 1214, 579, 210)
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
