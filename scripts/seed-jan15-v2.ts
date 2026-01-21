#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-15 (v2)
 *
 * Target:
 * - acg 板塊新增 4 個討論串（目前最少只有 12 個）
 * - news 板塊新增 3 個討論串
 * - life 板塊新增 3 個討論串
 * - 為回覆量少的討論串補充回覆
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
    [content, 0, generateIpHash(), randomUserAgent(), null, boardId, title, authorName, Math.floor(Math.random() * 48)]
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

// ===== ACG 板塊新增 4 個討論串 =====

async function seedAcgNew() {
  console.log('📝 Seeding acg board (新增 4 個討論串)...');

  // 1. Switch 遊戲
  const thread1 = await insertThread(
    'acg',
    'Switch 2 要出了，現在買 Switch 還值得嗎？',
    `聽說 Switch 2 今年會發表
但我現在很想玩薩爾達和寶可夢

現在買會不會太虧？
還是等新主機比較好？`,
    '猶豫中的玩家'
  );
  await insertReply(thread1, 'Switch 遊戲庫很豐富\n現在買也不虧', '名無しさん', 1);
  await insertReply(thread1, '新主機剛出都很貴\n不如先買現在的', '等等黨', 2);
  await insertReply(thread1, '>>2 同意\n而且新機初期遊戲少', '名無しさん', 3);
  await insertReply(thread1, '薩爾達王國之淚必玩', '塞爾達粉', 4);

  // 2. 手遊課金
  const thread2 = await insertThread(
    'acg',
    '手遊課金課到懷疑人生',
    `玩某款抽卡遊戲
為了抽一個角色花了快一萬

結果還是沒抽到
感覺被詐騙...

大家都怎麼控制課金的？`,
    '課長反省中'
  );
  await insertReply(thread2, '設定月預算啊\n超過就不課', '自制派', 1);
  await insertReply(thread2, '手遊就是賭博\n不如買斷制遊戲', '單機黨', 2);
  await insertReply(thread2, '>>2 但抽到的時候真的很爽', '名無しさん', 3);
  await insertReply(thread2, '沒保底的遊戲不要玩', '過來人', 4);
  await insertReply(thread2, '我都等免費十連再抽', '零課仔', 5);

  // 3. 動畫新番
  const thread3 = await insertThread(
    'acg',
    '2026冬番有什麼推薦的？',
    `新的一季開始了
但好像沒什麼特別期待的

大家有在追什麼嗎？
求推薦！`,
    '追番仔'
  );
  await insertReply(thread3, '我在等鏈鋸人第二季', '名無しさん', 1);
  await insertReply(thread3, '推《藥師少女的獨語》\n女主很聰明', '小說黨', 2);
  await insertReply(thread3, '>>2 +1 貓貓可愛', '名無しさん', 3);
  await insertReply(thread3, '這季確實比較弱\n不如補舊番', '老番粉', 4);

  // 4. 電競比賽
  const thread4 = await insertThread(
    'acg',
    '有人在看電競比賽嗎？',
    `最近開始看LOL世界賽
覺得滿熱血的

但身邊朋友都沒在看
想找人討論`,
    '電競新觀眾'
  );
  await insertReply(thread4, 'LOL世界賽超精彩\n今年T1又奪冠了', '電競老粉', 1);
  await insertReply(thread4, '我比較常看Valorant', '名無しさん', 2);
  await insertReply(thread4, '電競已經是正式運動了\n越來越多人看', '名無しさん', 3);
  await insertReply(thread4, '推薦看LPL\n中國隊伍打得很兇', '名無しさん', 4);

  console.log('✅ ACG board +4 threads');
}

// ===== NEWS 板塊新增 3 個討論串 =====

async function seedNewsNew() {
  console.log('📝 Seeding news board (新增 3 個討論串)...');

  // 1. 電價
  const thread1 = await insertThread(
    'news',
    '電價又要漲了，夏天怎麼辦',
    `看新聞說四月要調漲電價
漲幅好像還不小

夏天開冷氣電費會很可怕
有人有省電秘訣嗎？`,
    '怕電費的人'
  );
  await insertReply(thread1, '冷氣溫度設26-27度\n搭配電風扇', '省電達人', 1);
  await insertReply(thread1, '買變頻冷氣比較省', '名無しさん', 2);
  await insertReply(thread1, '>>2 但變頻冷氣也很貴', '名無しさん', 3);
  await insertReply(thread1, '去圖書館吹免費冷氣www', '現實派', 4);

  // 2. 外送平台
  const thread2 = await insertThread(
    'news',
    '外送平台抽成太高，餐廳都在漲價',
    `最近點外送發現
同一家店外送價格比內用貴很多

聽說平台抽成30%以上
難怪店家要漲價

外送還划算嗎？`,
    '外送觀察'
  );
  await insertReply(thread2, '能自己去買就自己去\n省錢又快', '名無しさん', 1);
  await insertReply(thread2, '外送費+服務費+漲價\n一餐貴好多', '精打細算', 2);
  await insertReply(thread2, '懶得出門還是會點', '懶人', 3);
  await insertReply(thread2, '>>3 懶惰稅www', '名無しさん', 4);

  // 3. 少子化
  const thread3 = await insertThread(
    'news',
    '台灣生育率又創新低了',
    `看到新聞說去年出生人數又破新低
只剩13萬多

年輕人不想生小孩
以後誰來繳稅養老人？

這問題有解嗎...`,
    '擔憂的人'
  );
  await insertReply(thread3, '房價這麼高誰敢生', '名無しさん', 1);
  await insertReply(thread3, '養小孩太貴了\n一個月至少2-3萬', '育兒中', 2);
  await insertReply(thread3, '>>2 還不包括教育費', '名無しさん', 3);
  await insertReply(thread3, '政府補助根本不夠', '名無しさん', 4);
  await insertReply(thread3, '連自己都養不活了\n怎麼養小孩', '現實派', 5);

  console.log('✅ News board +3 threads');
}

// ===== LIFE 板塊新增 3 個討論串 =====

async function seedLifeNew() {
  console.log('📝 Seeding life board (新增 3 個討論串)...');

  // 1. 失眠
  const thread1 = await insertThread(
    'life',
    '最近一直失眠，有什麼方法嗎',
    `每天躺在床上滑手機
不知不覺就凌晨3點了

白天上班超累
但晚上又睡不著

這個惡性循環怎麼破`,
    '失眠患者'
  );
  await insertReply(thread1, '睡前一小時不要看手機', '名無しさん', 1);
  await insertReply(thread1, '>>1 這真的很難做到', '同病相憐', 2);
  await insertReply(thread1, '喝熱牛奶有點用', '名無しさん', 3);
  await insertReply(thread1, '運動後比較好睡\n但不要太晚運動', '健身仔', 4);
  await insertReply(thread1, '嚴重的話去看醫生吧', '過來人', 5);

  // 2. 獨居生活
  const thread2 = await insertThread(
    'life',
    '一個人住的快樂與寂寞',
    `搬出來自己住半年了
自由是真的很自由

但有時候下班回家
空蕩蕩的房間會有點寂寞

養貓會不會比較好？`,
    '獨居青年'
  );
  await insertReply(thread2, '養貓超療癒\n回家有人迎接', '貓奴', 1);
  await insertReply(thread2, '但養寵物要考慮經濟能力', '名無しさん', 2);
  await insertReply(thread2, '>>2 貓的開銷其實還好', '名無しさん', 3);
  await insertReply(thread2, '我是養植物\n照顧生命的感覺', '植物系', 4);

  // 3. 年紀焦慮
  const thread3 = await insertThread(
    'life',
    '快30歲了，什麼都還沒有',
    `沒車沒房沒對象
存款也沒多少

看到同學結婚生小孩買房
覺得自己是不是很失敗

30歲該有什麼成就？`,
    '焦慮的人'
  );
  await insertReply(thread3, '不要跟別人比較\n過好自己的就好', '名無しさん', 1);
  await insertReply(thread3, '每個人節奏不同啦', '名無しさん', 2);
  await insertReply(thread3, '有些人40歲才起飛', '樂觀派', 3);
  await insertReply(thread3, '>>1 道理都懂但還是會焦慮', '同感', 4);
  await insertReply(thread3, '健康就好\n其他慢慢來', '佛系', 5);

  console.log('✅ Life board +3 threads');
}

// ===== 為回覆量少的討論串補充回覆 =====

async function seedReplies() {
  console.log('📝 為回覆量少的討論串補充回覆...');

  // id: 606 - 有人玩過職場模擬器嗎？後期 NPC 都會消失那種 (work)
  await insertReply(606, '這什麼遊戲？聽起來很獵奇', '名無しさん', 1);
  await insertReply(606, '是恐怖遊戲嗎', '名無しさん', 2);
  await insertReply(606, 'NPC消失是bug還是劇情？', '名無しさん', 3);

  // id: 583 - 民進黨黨內初選真的有打電話嗎 (news)
  await insertReply(583, '有啊\n我家有接過', '名無しさん', 1);
  await insertReply(583, '現在都用手機民調了吧', '名無しさん', 2);
  await insertReply(583, '我沒接過\n可能是抽樣', '名無しさん', 3);

  // id: 374 - 老闆明天出國玩 (chat)
  await insertReply(374, '爽喔\n可以放鬆一下', '名無しさん', 1);
  await insertReply(374, '老闆不在的日子最快樂', '社畜', 2);
  await insertReply(374, '>>2 真理www', '名無しさん', 3);

  // id: 98 - 匿名版的好處就是可以說真話 (meta)
  await insertReply(98, '真的\n不用怕被認出來', '名無しさん', 1);
  await insertReply(98, '匿名才敢講真心話', '名無しさん', 2);
  await insertReply(98, '但也要有底線', '名無しさん', 3);
  await insertReply(98, '這就是2ch的精神', '名無しさん', 4);

  // id: 141 - 貪汙去死 (news)
  await insertReply(141, '是發生什麼事了', '名無しさん', 1);
  await insertReply(141, '貪官真的可惡', '名無しさん', 2);

  console.log('✅ 回覆補充完成');
}

// ===== MAIN =====

async function main() {
  console.log('🚀 Starting seed (2026-01-15 v2)...\n');

  try {
    await seedAcgNew();
    await seedNewsNew();
    await seedLifeNew();
    await seedReplies();

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
