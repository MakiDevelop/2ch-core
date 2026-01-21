#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-16
 *
 * Target:
 * - love 板塊新增 5 個討論串（目前只有 13 個）
 * - money 板塊新增 5 個討論串（目前只有 13 個）
 * - 為回覆數少於 3 則的討論串補充回覆
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

async function insertThread(
  boardSlug: string,
  title: string,
  content: string,
  authorName: string = '名無しさん'
): Promise<number> {
  const boardResult = await pool.query('SELECT id FROM boards WHERE slug = $1', [boardSlug]);
  if (boardResult.rows.length === 0) {
    throw new Error(`Board ${boardSlug} not found`);
  }
  const boardId = boardResult.rows[0].id;

  const result = await pool.query(
    `INSERT INTO posts (content, status, ip_hash, user_agent, parent_id, board_id, title, author_name, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - INTERVAL '1 hour' * $9)
     RETURNING id`,
    [content, 0, generateIpHash(), randomUserAgent(), null, boardId, title, authorName, Math.floor(Math.random() * 72)]
  );

  return result.rows[0].id;
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

// ===== LOVE 板塊新增 5 個討論串 =====

async function seedLoveNew() {
  console.log('📝 Seeding love board (新增 5 個討論串)...');

  // 1. 遠距離戀愛
  const thread1 = await insertThread(
    'love',
    '遠距離戀愛真的能維持嗎？',
    `男友去年調到高雄工作
我在台北，每個月只能見一次

視訊聊天越來越少話題
感覺感情在慢慢變淡

有遠距離成功的經驗嗎？`,
    '北高戀愛中'
  );
  await insertReply(thread1, '重點是有沒有共同目標\n知道什麼時候能結束遠距', '過來人', 1);
  await insertReply(thread1, '我跟老公遠距三年\n現在結婚了', '成功案例', 2);
  await insertReply(thread1, '>>2 請問怎麼維持的？', '北高戀愛中', 3);
  await insertReply(thread1, '每天固定時間通話很重要', '名無しさん', 4);
  await insertReply(thread1, '沒有結束日期的遠距很難撐', '現實派', 5);

  // 2. 曖昧期
  const thread2 = await insertThread(
    'love',
    '曖昧期多久該告白？',
    `認識一個女生兩個月了
每天都有聊天、週末會約出去

感覺她對我也有好感
但不確定是不是錯覺

曖昧太久會不會變成朋友？`,
    '曖昧苦手'
  );
  await insertReply(thread2, '兩個月夠久了\n直接約告白吧', '名無しさん', 1);
  await insertReply(thread2, '曖昧超過三個月就危險了', '經驗談', 2);
  await insertReply(thread2, '>>2 為什麼？', '名無しさん', 3);
  await insertReply(thread2, '因為會習慣這種關係\n不想打破現狀', '經驗談', 4);
  await insertReply(thread2, '找個適合的時機衝吧！', '加油', 5);

  // 3. 前任
  const thread3 = await insertThread(
    'love',
    '分手後多久才能釋懷？',
    `分手三個月了
還是會想起在一起的時光

朋友說時間會沖淡一切
但每天晚上還是會難過

什麼時候才能真正放下？`,
    '走不出來'
  );
  await insertReply(thread3, '通常要一半的交往時間', '名無しさん', 1);
  await insertReply(thread3, '刪掉所有照片和聯絡方式\n會好很多', '斷捨離派', 2);
  await insertReply(thread3, '找新的興趣轉移注意力', '名無しさん', 3);
  await insertReply(thread3, '三個月還好啦\n我花了一年', '同病相憐', 4);

  // 4. 結婚壓力
  const thread4 = await insertThread(
    'love',
    '28歲了，家人一直催結婚',
    `每次回家就是問對象
親戚聚會更是被轟炸

「你條件很好啊為什麼還單身」
「要不要幫你介紹」

壓力好大...`,
    '被催婚的人'
  );
  await insertReply(thread4, '我也是\n過年最怕親戚問', '同感', 1);
  await insertReply(thread4, '直接說在努力中就好', '應對高手', 2);
  await insertReply(thread4, '28還好啦\n不用太焦慮', '名無しさん', 3);
  await insertReply(thread4, '>>3 但家人不這麼想', '名無しさん', 4);
  await insertReply(thread4, '自己的人生自己決定', '獨立派', 5);

  // 5. 交友軟體
  const thread5 = await insertThread(
    'love',
    '交友軟體到底有沒有用？',
    `用了三個月配對很多
但聊幾句就斷了

真的有人在上面找到真愛嗎？
還是大家只是無聊滑滑？`,
    '交友軟體苦手'
  );
  await insertReply(thread5, '我在上面認識現在的老公', '成功案例', 1);
  await insertReply(thread5, '要有耐心\n大部分都是聊聊而已', '過來人', 2);
  await insertReply(thread5, '照片很重要\n第一印象決定一切', '名無しさん', 3);
  await insertReply(thread5, '>>3 但見面發現照騙怎麼辦', '名無しさん', 4);

  console.log('✅ Love board +5 threads');
}

// ===== MONEY 板塊新增 5 個討論串 =====

async function seedMoneyNew() {
  console.log('📝 Seeding money board (新增 5 個討論串)...');

  // 1. 買房
  const thread1 = await insertThread(
    'money',
    '該先買房還是先投資？',
    `存了200萬，在猶豫要：
1. 當頭期款買房（但會背30年房貸）
2. 繼續投資 ETF（但租金一直繳）

哪個比較划算？
還是應該兩邊都做？`,
    '選擇困難'
  );
  await insertReply(thread1, '看你的收入穩定度\n穩定就可以考慮買房', '名無しさん', 1);
  await insertReply(thread1, '現在房價太高\n我選擇繼續投資', '投資派', 2);
  await insertReply(thread1, '有自住需求就買\n投資的話租房比較划算', '理性分析', 3);
  await insertReply(thread1, '200萬在台北只能買郊區...', '現實派', 4);

  // 2. 緊急預備金
  const thread2 = await insertThread(
    'money',
    '緊急預備金要存多少才夠？',
    `看理財書說要存6個月生活費
但我一個月開銷大概3萬

18萬放活存感覺好浪費
可是又怕存太少不夠用

大家都存多少？`,
    '理財新手'
  );
  await insertReply(thread2, '6個月是基本\n有家庭的話要更多', '名無しさん', 1);
  await insertReply(thread2, '可以放高利活存\n至少有點利息', '名無しさん', 2);
  await insertReply(thread2, '我是存一年的\n比較安心', '保守派', 3);
  await insertReply(thread2, '>>3 一年會不會太多？', '名無しさん', 4);
  await insertReply(thread2, '看你工作穩定度\n工程師半年就夠', '科技業', 5);

  // 3. 記帳
  const thread3 = await insertThread(
    'money',
    '有推薦的記帳App嗎？',
    `想開始記帳但不知道用什麼
試過幾個都覺得太複雜

只想要簡單記錄收支
最好能自動分類

有推薦嗎？`,
    '想記帳'
  );
  await insertReply(thread3, '推薦「記帳城市」\n遊戲化很有動力', '名無しさん', 1);
  await insertReply(thread3, 'Money Manager 簡單好用', '名無しさん', 2);
  await insertReply(thread3, '我用 Excel\n最自由', '表格派', 3);
  await insertReply(thread3, '>>3 但要手動輸入很麻煩', '名無しさん', 4);

  // 4. 保險
  const thread4 = await insertThread(
    'money',
    '剛出社會該買什麼保險？',
    `25歲開始工作
爸媽說要趁年輕買保險

但保險種類好多看不懂
壽險、醫療險、意外險...

新鮮人該怎麼規劃？`,
    '保險小白'
  );
  await insertReply(thread4, '意外險和醫療險優先\n壽險等有家庭再說', '保險規劃師', 1);
  await insertReply(thread4, '先買定期險\n不要買儲蓄險', '名無しさん', 2);
  await insertReply(thread4, '>>2 為什麼不要儲蓄險？', '名無しさん', 3);
  await insertReply(thread4, '因為報酬率太低\n不如自己投資', '名無しさん', 4);
  await insertReply(thread4, '實支實付一定要有', '過來人', 5);

  // 5. 副業
  const thread5 = await insertThread(
    'money',
    '有什麼下班後可以做的副業？',
    `主業薪水不高
想利用下班時間多賺一點

不想做外送（太累）
會一點程式和設計

有什麼建議嗎？`,
    '想增加收入'
  );
  await insertReply(thread5, '接案平台可以試試\n像 Fiverr、Upwork', '名無しさん', 1);
  await insertReply(thread5, '會設計可以賣模板\n被動收入', '設計師', 2);
  await insertReply(thread5, '寫技術部落格\n長期可以接業配', '名無しさん', 3);
  await insertReply(thread5, '>>3 但要很久才有流量', '名無しさん', 4);
  await insertReply(thread5, '接官網設計案\n一個案子幾萬塊', '接案仔', 5);

  console.log('✅ Money board +5 threads');
}

// ===== 為回覆數少的討論串補充回覆 =====

async function seedRepliesForLowActivity() {
  console.log('📝 為回覆數少於 3 則的討論串補充回覆...');

  // === 0 回覆的討論串 ===

  // id: 579 - 你的錢就是我的錢 (chat)
  await insertReply(579, '什麼意思www', '名無しさん', 1);
  await insertReply(579, '共產主義是你？', '名無しさん', 2);

  // id: 578 - 幹幹叫 (chat)
  await insertReply(578, '怎麼了？', '名無しさん', 1);
  await insertReply(578, '發生什麼事', '名無しさん', 2);

  // id: 147 - 馬斯克森77 (tech)
  await insertReply(147, '這是什麼？', '名無しさん', 1);
  await insertReply(147, '新產品嗎', '名無しさん', 2);

  // id: 97 - 建議增加「收藏討論串」功能 (meta)
  await insertReply(97, '+1 這功能滿實用的', '名無しさん', 1);
  await insertReply(97, '可以先用瀏覽器書籤', '名無しさん', 2);
  await insertReply(97, '>>2 但不方便管理啊', '名無しさん', 3);

  // id: 50 - 在這個時候會以為沒有成功 (tech)
  await insertReply(50, '什麼沒有成功？', '名無しさん', 1);
  await insertReply(50, '需要更多資訊', '名無しさん', 2);

  // === 1 回覆的討論串 ===

  // id: 602 - 五個字 (chat)
  await insertReply(602, '哪五個字？', '名無しさん', 1);
  await insertReply(602, '好神秘喔www', '名無しさん', 2);

  // id: 600 - 有得就有失 (chat)
  await insertReply(600, '很有哲理', '名無しさん', 1);
  await insertReply(600, '最近發生什麼事了嗎', '名無しさん', 2);

  // id: 594 - 捷運坐過頭 (chat)
  await insertReply(594, '滑手機滑太入迷？', '名無しさん', 1);
  await insertReply(594, '我也常常這樣www', '同病相憐', 2);

  // id: 593 - 皮客敏和寶可夢 (acg)
  await insertReply(593, '寶可夢是童年回憶啊', '名無しさん', 1);
  await insertReply(593, 'Switch 版很好玩', '名無しさん', 2);

  // id: 589 - 要第三次世界大戰了嗎 (news)
  await insertReply(589, '希望不要...', '名無しさん', 1);
  await insertReply(589, '新聞看太多會焦慮', '名無しさん', 2);

  // id: 584 - 44歲還母胎單身 (love)
  await insertReply(584, '不要放棄啊', '名無しさん', 1);
  await insertReply(584, '緣分這種事很難說', '名無しさん', 2);
  await insertReply(584, '有沒有試過交友軟體？', '名無しさん', 3);

  // id: 375 - 脆上寫矽谷創業 (work)
  await insertReply(375, '倖存者偏差', '名無しさん', 1);
  await insertReply(375, '失敗的不會出來講', '名無しさん', 2);

  // id: 372 - Thread年薪200 (work)
  await insertReply(372, '網路上都誇大的啦', '名無しさん', 1);
  await insertReply(372, '做夢也是一種工作', '名無しさん', 2);

  // id: 156 - 噁心的一幕 (life)
  await insertReply(156, '發生什麼事？', '名無しさん', 1);
  await insertReply(156, '好奇想知道', '名無しさん', 2);

  // id: 155 - 娜妍也很可愛 (gossip)
  await insertReply(155, '同意！', '名無しさん', 1);
  await insertReply(155, 'TWICE 成員都很讚', '名無しさん', 2);

  // id: 148 - 世界好可愛 (gossip)
  await insertReply(148, '今天心情很好？', '名無しさん', 1);
  await insertReply(148, '正能量推推', '名無しさん', 2);

  // id: 101 - 手遊課了5萬 (acg)
  await insertReply(101, '太慘了...', '名無しさん', 1);
  await insertReply(101, '手遊真的是無底洞', '過來人', 2);

  // id: 100 - 這季新番推薦 (acg)
  await insertReply(100, '看你喜歡什麼類型', '名無しさん', 1);
  await insertReply(100, '異世界類還是日常類？', '名無しさん', 2);

  // id: 96 - 這個站剛開嗎 (meta)
  await insertReply(96, '對，剛開不久', '名無しさん', 1);
  await insertReply(96, '希望能越來越熱鬧', '名無しさん', 2);

  // id: 93 - 今天又沒有跟任何人說話 (life)
  await insertReply(93, '你現在有在跟我們說話啊', '名無しさん', 1);
  await insertReply(93, '拍拍，明天會更好', '名無しさん', 2);

  // id: 85 - 半夜三點睡不著 (chat)
  await insertReply(85, '失眠好痛苦', '名無しさん', 1);
  await insertReply(85, '試試看放空冥想', '名無しさん', 2);

  // id: 43 - 月下夜想曲的音樂 (acg)
  await insertReply(43, '經典中的經典', '名無しさん', 1);
  await insertReply(43, '山根ミチル的配樂超讚', '惡魔城粉', 2);

  // id: 23 - Vibe Coding賣課程 (tech)
  await insertReply(23, '不如自己看 YouTube', '名無しさん', 1);
  await insertReply(23, '免費資源很多了', '名無しさん', 2);

  // id: 22 - 下雨天外送員超多 (chat)
  await insertReply(22, '下雨天大家都不想出門', '名無しさん', 1);
  await insertReply(22, '外送員辛苦了', '名無しさん', 2);

  // id: 21 - PTT又掛了 (chat)
  await insertReply(21, '常態了', '名無しさん', 1);
  await insertReply(21, 'PTT 真的該升級了', '名無しさん', 2);

  // id: 9 - Vercel開始收費 (tech)
  await insertReply(9, '免費仔的末日', '名無しさん', 1);
  await insertReply(9, '可以考慮 Cloudflare Pages', '名無しさん', 2);

  // id: 8 - ChatGPT訂閱 (tech)
  await insertReply(8, '看你用多少\n用很少就不用續', '名無しさん', 1);
  await insertReply(8, 'Claude 也很好用', '名無しさん', 2);

  // id: 7 - GitHub Copilot重複生成 (tech)
  await insertReply(7, '要給它足夠的 context', '名無しさん', 1);
  await insertReply(7, '試試 Cursor 會比較好', '名無しさん', 2);

  // id: 6 - M4 MacBook風扇 (tech)
  await insertReply(6, '跑什麼才會吵？', '名無しさん', 1);
  await insertReply(6, '編譯 Rust 嗎www', '名無しさん', 2);

  // id: 4 - Claude 4.5 (tech)
  await insertReply(4, 'Coding 能力有變強', '名無しさん', 1);
  await insertReply(4, '看用途吧', '名無しさん', 2);

  // === 2 回覆的討論串 (補到 3-4 則) ===

  // id: 587 - 回覆框太小了 (meta)
  await insertReply(587, '+1 希望能調大一點', '名無しさん', 1);

  // id: 340 - 為何有此匿名討論區 (life)
  await insertReply(340, '匿名才能說真話', '名無しさん', 1);

  // id: 224 - 台灣綜藝節目難看 (gossip)
  await insertReply(224, '預算問題吧', '名無しさん', 1);

  // id: 223 - 信用卡推薦 (money)
  await insertReply(223, '看你消費習慣\n網購多就選回饋高的', '名無しさん', 1);

  // id: 219 - 電價又要漲 (news)
  await insertReply(219, '夏天電費會更可怕', '名無しさん', 1);

  // id: 218 - 台北捷運漲價 (news)
  await insertReply(218, '還是比計程車便宜', '名無しさん', 1);

  // id: 211 - 租屋處隔壁吵 (life)
  await insertReply(211, '買個耳塞試試', '名無しさん', 1);

  // id: 210 - 被路人誇了 (life)
  await insertReply(210, '開心的一天！', '名無しさん', 1);

  // id: 208 - 半夜三點睡不著2 (life)
  await insertReply(208, '失眠同溫層報到', '名無しさん', 1);

  // id: 203 - 週一症候群 (work)
  await insertReply(203, '週五才有解', '名無しさん', 1);

  // id: 198 - 刷題有用嗎 (tech)
  await insertReply(198, '面試有用\n工作不太用', '名無しさん', 1);

  // id: 195 - Copilot vs Cursor (tech)
  await insertReply(195, 'Cursor 比較智慧', '名無しさん', 1);

  // id: 194 - 自架NAS (tech)
  await insertReply(194, '自架比較有彈性\n但要花時間維護', '名無しさん', 1);

  // id: 193 - 台灣軟體薪水 (tech)
  await insertReply(193, '市場規模不同', '名無しさん', 1);

  // id: 165 - 有人看陸劇嗎 (gossip)
  await insertReply(165, '古裝劇還不錯', '名無しさん', 1);

  // id: 162 - その着せ替え人形 (acg)
  await insertReply(162, '喜多川好可愛', '名無しさん', 1);

  // id: 158 - 00878換台積電 (money)
  await insertReply(158, '看你的投資目標', '名無しさん', 1);

  // id: 103 - 存到第一桶金 (money)
  await insertReply(103, '看收入和開銷比例', '名無しさん', 1);

  // id: 94 - 養貓發現自己很窮 (life)
  await insertReply(94, '貓罐頭真的貴', '名無しさん', 1);

  // id: 92 - 遇到雷新人 (work)
  await insertReply(92, '慢慢教吧\n每個人都是新人過來的', '名無しさん', 1);

  // id: 84 - M4 Mac編譯起飛 (tech)
  await insertReply(84, 'Apple Silicon 真的強', '名無しさん', 1);

  // id: 82 - GitHub Copilot 600 (tech)
  await insertReply(82, '對工作有幫助就值得', '名無しさん', 1);

  // id: 80 - Vercel替代方案 (tech)
  await insertReply(80, '試試 Railway 或 Render', '名無しさん', 1);

  // id: 78 - 手刻CSS (tech)
  await insertReply(78, 'Tailwind 真香', '名無しさん', 1);

  // id: 75 - Rust學三個月 (tech)
  await insertReply(75, 'Rust 學習曲線真的陡', '名無しさん', 1);

  // id: 46 - 光華走入歷史 (tech)
  await insertReply(46, '網購太方便了', '名無しさん', 1);

  // id: 26 - 咖啡廳插座被佔 (chat)
  await insertReply(26, '去共享空間比較好', '名無しさん', 1);

  // id: 25 - 鄰居11點裝潢 (chat)
  await insertReply(25, '可以報警處理', '名無しさん', 1);

  // id: 24 - YouTube影片笑死 (chat)
  await insertReply(24, '分享連結啊', '名無しさん', 1);

  // id: 20 - 超商店員盯著看 (chat)
  await insertReply(20, '可能在防小偷吧', '名無しさん', 1);

  console.log('✅ 回覆補充完成');
}

// ===== MAIN =====

async function main() {
  console.log('🚀 Starting seed (2026-01-16 supplement)...\n');

  try {
    await seedLoveNew();
    await seedMoneyNew();
    await seedRepliesForLowActivity();

    console.log('\n✅ All content seeded successfully!');

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

    const boardStats = await pool.query(`
      SELECT b.slug, b.name, COUNT(p.id) as thread_count
      FROM boards b
      LEFT JOIN posts p ON p.board_id = b.id AND p.parent_id IS NULL
      GROUP BY b.id, b.slug, b.name
      ORDER BY thread_count ASC
    `);

    console.log('\n📊 Board Statistics:');
    for (const row of boardStats.rows) {
      console.log(`- ${row.slug}: ${row.thread_count} threads`);
    }

  } catch (error) {
    console.error('❌ Error seeding content:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
