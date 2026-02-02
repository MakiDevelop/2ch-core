#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-22 第三批 - 補充稀缺回應
 *
 * 為回覆數較少的討論串補充回應，基於真實時事：
 * - 梁小龍（火雲邪神）1/14 逝世，享年75歲
 * - 木村拓哉搭機巧遇高市早苗，同班機還有佐佐木朗希
 * - 2025年神奇新聞：大S過世、台北車站砍人、花蓮堰塞湖
 * - PTT八卦版門檻提高至2000次登入
 * - 2026基本工資調漲至29,500元
 * - Tinder 2026約會報告：clear-coding直球戀愛
 * - 40歲轉職趨勢
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

  // ========== ID 1987: 世界有夠小 ==========
  console.log('  🌍 #1987 - 世界有夠小');
  await insertReply(1987, '最近看到木村拓哉搭機巧遇高市早苗的新聞\n元旦那班飛機上還有佐佐木朗希\n真的世界超小', '名無しさん', 8);
  await insertReply(1987, '>>1 高市首相還說她珍藏木村1996年的寫真集\n那本當年賣50萬冊', '名無しさん', 7);
  await insertReply(1987, '首相是木村粉絲www\n「真是像做夢一樣」', '名無しさん', 6);
  await insertReply(1987, '我也遇過前任在電影院\n結果那天還是和新對象一起去的', '名無しさん', 5);
  await insertReply(1987, '>>4 慘\n但至少證明你品味沒變', '名無しさん', 4);
  await insertReply(1987, '六度分隔理論是真的\n世界上任兩個人中間最多只隔六個人', '名無しさん', 3);
  await insertReply(1987, '小時候出國玩\n遇到隔壁鄰居\n真的傻眼', '名無しさん', 2);

  // ========== ID 1354: 天啊！火雲邪神！ ==========
  console.log('  🔥 #1354 - 天啊！火雲邪神！');
  await insertReply(1354, '梁小龍1/14走了\n心臟衰竭搶救六小時不治\n享年75歲', '名無しさん', 10);
  await insertReply(1354, '>>4 什麼！！！\nR.I.P. 火雲邪神', '名無しさん', 9);
  await insertReply(1354, '周星馳也發文悼念\n「永遠懷念梁小龍先生」', '名無しさん', 8);
  await insertReply(1354, '70年代他和李小龍、成龍、狄龍號稱四龍\n真正的武打巨星', '武打迷', 7);
  await insertReply(1354, '《功夫》裡的火雲邪神太經典\n蛤蟆功跟如來神掌', '名無しさん', 6);
  await insertReply(1354, '>>7 「天下武功無堅不摧，唯快不破」', '名無しさん', 5);
  await insertReply(1354, '據說他對《功夫》片酬不太滿意\n但那個角色真的成為經典', '名無しさん', 4);
  await insertReply(1354, '他80年代演《大俠霍元甲》的陳真也很紅\n一代人的回憶', '名無しさん', 3);

  // ========== ID 1396: 2025年的神奇新聞 ==========
  console.log('  📰 #1396 - 2025年的神奇新聞');
  await insertReply(1396, '大S因流感併發肺炎過世\n震驚整個娛樂圈', '名無しさん', 12);
  await insertReply(1396, '>>4 真的太突然\n才48歲', '名無しさん', 11);
  await insertReply(1396, '台北車站砍人事件也很扯\n張姓男子丟煙霧彈持刀砍人', '名無しさん', 10);
  await insertReply(1396, '花蓮12/27規模7地震\n馬太鞍溪堰塞湖潰堤淹沒光復鄉', '名無しさん', 9);
  await insertReply(1396, '>>7 那個地震相當於16顆原子彈威力\n真的很恐怖', '名無しさん', 8);
  await insertReply(1396, '陸配亞亞被限期出境\n網路聲量直接飆到35萬筆', '名無しさん', 7);
  await insertReply(1396, '2025第一季就超不平靜\n還有大罷免潮', '名無しさん', 6);

  // ========== ID 1313: 八卦版以前比較好玩 ==========
  console.log('  📋 #1313 - 八卦版以前比較好玩');
  await insertReply(1313, '現在門檻提高到登入2000次才能發文\n版主說是為了防網軍', '名無しさん', 14);
  await insertReply(1313, '>>4 等於2017年以前就要有帳號了\n新人完全進不來', '名無しさん', 13);
  await insertReply(1313, '以前八卦版真的很歡樂\n現在一堆政治文', '老鄉民', 12);
  await insertReply(1313, '之前抓到公關公司用85個分身帳號帶風向\n超誇張', '名無しさん', 11);
  await insertReply(1313, '>>7 BOT自動發廢文那個？\n真的讓人對八卦版失望', '名無しさん', 10);
  await insertReply(1313, '選舉期間政治文特別多\n看了就煩', '名無しさん', 9);
  await insertReply(1313, '懷念以前的卦版梗\n「人氣-1」www', '名無しさん', 8);

  // ========== ID 224: 為什麼台灣綜藝節目越來越難看 ==========
  console.log('  📺 #224 - 為什麼台灣綜藝節目越來越難看');
  await insertReply(224, '預算不夠吧\n韓綜一集製作費是台綜好幾倍', '名無しさん', 16);
  await insertReply(224, '>>4 而且市場太小\n廣告收入撐不起大製作', '名無しさん', 15);
  await insertReply(224, '《嗨！營業中》算有在努力\n2025網路聲量有8萬多', '名無しさん', 14);
  await insertReply(224, '長青節目靠穩定\n《綜藝玩很大》都11週年了\n最近在播楓玩加拿大', '名無しさん', 13);
  await insertReply(224, '>>7 《天才衝衝衝》也還在\n瓜哥乃哥同框那集蠻好笑', '名無しさん', 12);
  await insertReply(224, 'YouTube搶走很多觀眾\n年輕人根本不看電視', '名無しさん', 11);
  await insertReply(224, '不是節目不好看\n是競爭對手太多了', '電視迷', 10);

  // ========== ID 1353: 劈腿男和劈腿女求婚 ==========
  console.log('  💍 #1353 - 劈腿男和劈腿女求婚');
  await insertReply(1353, 'Tinder 2026報告出爐\nclear-coding直球戀愛當道\n不再玩曖昧了', '名無しさん', 18);
  await insertReply(1353, '>>4 所謂的直球戀愛\n就是喜歡就說、不喜歡也直接講', '名無しさん', 17);
  await insertReply(1353, '以前覺得曖昧浪漫\n現在覺得只是浪費時間', '名無しさん', 16);
  await insertReply(1353, '劈腿的人在一起\n互相都知道對方底線在哪\n搞不好反而穩定？', '名無しさん', 15);
  await insertReply(1353, '>>7 那叫互相傷害吧www', '名無しさん', 14);
  await insertReply(1353, '現代人比較重視相處輕鬆\n不用過度解讀訊息和情緒', '名無しさん', 13);
  await insertReply(1353, '跨年那個李川直播求婚超甜\n錘娜麗莎直接點頭', '名無しさん', 12);

  // ========== ID 1184: 問題丟得夠快，就不需要想清楚 ==========
  console.log('  💼 #1184 - 問題丟得夠快，就不需要想清楚');
  await insertReply(1184, '這種主管超多\n自己不想解決就丟給下屬', '社畜', 12);
  await insertReply(1184, '>>4 然後你回答之後\n他又說要再想想\n那一開始問什麼', '名無しさん', 11);
  await insertReply(1184, '2026調薪季\n104報告說有63.9%企業會調薪\n平均4.5%', '名無しさん', 10);
  await insertReply(1184, '>>6 聽起來很美好\n但近7成人領不到平均薪資', '名無しさん', 9);
  await insertReply(1184, '科技業金融業薪資高\n餐飲服務業差很多', '名無しさん', 8);
  await insertReply(1184, '基本工資終於調到29500了\n希望今年能破3萬', '名無しさん', 7);

  // ========== ID 1311: 某演員演技真的很尷尬 ==========
  console.log('  🎬 #1311 - 某演員演技真的很尷尬');
  await insertReply(1311, '很多流量明星演戲真的不行\n表情僵硬台詞念不好', '名無しさん', 14);
  await insertReply(1311, '>>4 韓劇都是演技派\n台劇有些真的...',  '名無しさん', 13);
  await insertReply(1311, '有人是氛圍感演員\n靠臉和BGM撐', '名無しさん', 12);
  await insertReply(1311, '華視訓練中心有些學員不錯\n莊岳演《茶金》《華燈初上》很自然', '名無しさん', 11);
  await insertReply(1311, '演技好不好觀眾很敏感\n假哭一看就知道', '名無しさん', 10);
  await insertReply(1311, '有些人綜藝咖轉演員反而很驚艷\n但也有人完全不適合', '名無しさん', 9);

  // ========== ID 1448: 回覆引用功能很方便 ==========
  console.log('  📝 #1448 - 回覆引用功能很方便');
  await insertReply(1448, '>>的引用功能讚\n可以清楚知道在回哪則', '名無しさん', 10);
  await insertReply(1448, '>>4 比LINE群組好追話題\n不會一直斷', '名無しさん', 9);
  await insertReply(1448, 'PTT也是這種模式\n回文方便討論', '老鄉民', 8);
  await insertReply(1448, '希望能加個貼圖功能\n純文字有時候表達不夠', '名無しさん', 7);
  await insertReply(1448, '>>7 匿名板塊貼圖搞不好會亂\n先這樣也好', '名無しさん', 6);

  // ========== ID 535: 能不能加個「熱門討論」排序？ ==========
  console.log('  🔥 #535 - 能不能加個「熱門討論」排序？');
  await insertReply(535, '熱門排序+1\n想看最多人討論的', '名無しさん', 12);
  await insertReply(535, '>>4 按回覆數排序應該不難實作', '名無しさん', 11);
  await insertReply(535, '或是綜合時間和回覆數的演算法\n太舊的不要一直置頂', '名無しさん', 10);
  await insertReply(535, 'Reddit那種karma機制也不錯\n但可能太複雜', '名無しさん', 9);
  await insertReply(535, '>>7 簡單點好\n這裡就是要匿名輕鬆', '名無しさん', 8);

  // ========== ID 539: 感謝站長做出這個平台 ==========
  console.log('  🙏 #539 - 感謝站長做出這個平台');
  await insertReply(539, '台灣需要匿名討論的地方\nPTT門檻越來越高', '名無しさん', 14);
  await insertReply(539, '>>4 對\n現在八卦版要登入2000次才能發文', '名無しさん', 13);
  await insertReply(539, '匿名的好處是可以講真話\n不用怕被認出來', '名無しさん', 12);
  await insertReply(539, '希望這裡能繼續維持\n不要被奇怪的人搞爛', '名無しさん', 11);
  await insertReply(539, '>>7 版主辛苦了\n維護論壇不容易', '名無しさん', 10);

  // ========== ID 1309: 發文間隔可以縮短嗎 ==========
  console.log('  ⏱️ #1309 - 發文間隔可以縮短嗎');
  await insertReply(1309, '間隔是為了防洗版\n不然一個人可以灌爆', '名無しさん', 10);
  await insertReply(1309, '>>4 理解\n但回覆應該可以縮短一點', '名無しさん', 9);
  await insertReply(1309, '發文和回覆分開計算比較合理', '名無しさん', 8);
  await insertReply(1309, '有些論壇用積分制\n老用戶間隔比較短', '名無しさん', 7);
  await insertReply(1309, '>>7 這裡匿名\n用積分不太適合', '名無しさん', 6);

  console.log('\n✅ 稀缺回應補充完成 (第三批)！');
}

async function main() {
  console.log('🚀 Starting reply boost (2026-01-22 v3)...\n');

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
      WHERE p.id IN (1987, 1354, 1396, 1313, 224, 1353, 1184, 1311, 1448, 535, 539, 1309)
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
