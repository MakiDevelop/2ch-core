#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-15
 *
 * Target:
 * - money 板塊新增 4 個討論串（目前最少只有 9 個）
 * - love 板塊新增 3 個討論串
 * - gossip 板塊新增 3 個討論串
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

// ===== MONEY 板塊新增 4 個討論串 =====

async function seedMoneyNew() {
  console.log('📝 Seeding money board (新增 4 個討論串)...');

  // 1. 美金定存
  const thread1 = await insertThread(
    'money',
    '美金定存利率5%，現在進場來得及嗎？',
    `看到美金定存利率有5%以上
感覺比台幣定存高很多

但美金現在匯率31多
感覺有點高

各位覺得現在換美金做定存划算嗎？`,
    '匯率觀察者'
  );
  await insertReply(thread1, '利差有風險啊\n美金如果貶回去就虧了', '名無しさん', 1);
  await insertReply(thread1, '分批換比較安全', '分散風險派', 2);
  await insertReply(thread1, '>>2 +1 不要一次all in', '名無しさん', 3);
  await insertReply(thread1, '美金長期看好\n現在進場不算太晚', '美元多頭', 4);

  // 2. 月光族
  const thread2 = await insertThread(
    'money',
    '月薪40K，每個月都月光怎麼辦',
    `扣掉房租12K、生活費、交通
還有保險費、手機費什麼的

每個月底都剛好花完
根本存不到錢

有什麼省錢秘訣嗎？`,
    '月光族'
  );
  await insertReply(thread2, '先記帳看錢花去哪\n才知道怎麼省', '過來人', 1);
  await insertReply(thread2, '房租佔比太高了\n建議找便宜一點的', '名無しさん', 2);
  await insertReply(thread2, '>>2 台北哪有便宜的房租', '名無しさん', 3);
  await insertReply(thread2, '自己煮飯可以省很多', '省錢達人', 4);
  await insertReply(thread2, '40K月光不誇張\n現在物價太高了', '同病相憐', 5);

  // 3. 勞退自提
  const thread3 = await insertThread(
    'money',
    '勞退自提6%到底值不值得？',
    `聽說自提可以節稅
而且報酬率好像還不錯

但錢放進去要到退休才能拿
感覺很不自由

各位有在自提嗎？`,
    '退休規劃中'
  );
  await insertReply(thread3, '自提最大好處是節稅\n高薪族很划算', '稅務小老師', 1);
  await insertReply(thread3, '報酬率不差啊\n而且強迫儲蓄', '自提仔', 2);
  await insertReply(thread3, '>>2 但30年後才能領欸', '名無しさん', 3);
  await insertReply(thread3, '我是自提滿\n反正早晚要退休', '長線派', 4);

  // 4. 數位帳戶利率
  const thread4 = await insertThread(
    'money',
    '2026年數位帳戶推薦哪家？',
    `最近想開數位帳戶
看到很多銀行都有高利活存

台新、將來、LINE Bank
好多選擇不知道怎麼挑

大家都用哪家？`,
    '選擇困難症'
  );
  await insertReply(thread4, '台新Richart最普及\nAPP介面好用', '名無しさん', 1);
  await insertReply(thread4, '將來銀行利率最高', '利率黨', 2);
  await insertReply(thread4, '>>2 但要達到門檻才有', '名無しさん', 3);
  await insertReply(thread4, '我開了3家分散放www', '多開黨', 4);
  await insertReply(thread4, '選跨轉免手續費多的', '實用派', 5);

  console.log('✅ Money board +4 threads');
}

// ===== LOVE 板塊新增 3 個討論串 =====

async function seedLoveNew() {
  console.log('📝 Seeding love board (新增 3 個討論串)...');

  // 1. 遠距離
  const thread1 = await insertThread(
    'love',
    '遠距離戀愛真的能撐下去嗎？',
    `女友去美國讀書
要讀2年才回來

我們已經交往1年多了
但最近覺得越來越難維持

每天視訊但還是很想她
有時候會想是不是該放手...`,
    '遠距離中'
  );
  await insertReply(thread1, '遠距離真的很難\n要有信任才撐得下去', '過來人', 1);
  await insertReply(thread1, '2年其實還好\n先設定目標', '名無しさん', 2);
  await insertReply(thread1, '>>2 但2年很長欸...', '名無しさん', 3);
  await insertReply(thread1, '可以計劃去探班啊\n給彼此期待感', '遠距離成功者', 4);
  await insertReply(thread1, '如果真的愛對方\n2年不算什麼', '樂觀派', 5);

  // 2. 前任
  const thread2 = await insertThread(
    'love',
    '前任傳訊息說想複合',
    `分手半年了
突然收到前任的訊息

說她想清楚了，想再試一次
但當初是她先提分手的

我現在很矛盾
心裡還有感覺但又怕再受傷`,
    '心很亂'
  );
  await insertReply(thread2, '當初為什麼分手？\n問題解決了嗎', '名無しさん', 1);
  await insertReply(thread2, '複合通常都會再分\n三思', '過來人', 2);
  await insertReply(thread2, '>>2 不一定吧\n有成功的', '名無しさん', 3);
  await insertReply(thread2, '先問清楚她的想法\n別衝動', '冷靜派', 4);

  // 3. 年紀差距
  const thread3 = await insertThread(
    'love',
    '男友比我小5歲，家人很反對',
    `我32他27
交往快一年了感情很好

但我爸媽一直說年紀差太多
覺得他不夠成熟、不能依靠

我該怎麼說服家人？`,
    '姐弟戀'
  );
  await insertReply(thread3, '5歲還好吧\n重點是他的行為', '名無しさん', 1);
  await insertReply(thread3, '讓他多跟家人相處\n用行動證明', '過來人', 2);
  await insertReply(thread3, '>>2 +1 時間會證明一切', '名無しさん', 3);
  await insertReply(thread3, '27歲也不小了\n應該算成熟', '名無しさん', 4);
  await insertReply(thread3, '姐弟戀現在很普遍啊', '現代觀點', 5);

  console.log('✅ Love board +3 threads');
}

// ===== GOSSIP 板塊新增 3 個討論串 =====

async function seedGossipNew() {
  console.log('📝 Seeding gossip board (新增 3 個討論串)...');

  // 1. AI 生成內容
  const thread1 = await insertThread(
    'gossip',
    '現在YouTube很多AI生成的影片',
    `最近發現很多頻道
聲音是AI、字幕是AI
甚至連畫面都是AI生成的

這樣的內容也能有10萬觀看
世界變得好快...`,
    'AI觀察者'
  );
  await insertReply(thread1, 'AI時代來臨了', '名無しさん', 1);
  await insertReply(thread1, '有些AI聲音聽不太出來', '名無しさん', 2);
  await insertReply(thread1, '>>2 現在技術太強了', '名無しさん', 3);
  await insertReply(thread1, '創作者要失業了嗎www', '擔憂派', 4);

  // 2. 網紅翻車
  const thread2 = await insertThread(
    'gossip',
    '又有網紅被爆料私德有問題',
    `不說是誰
但最近好多網紅人設崩塌

螢幕前很正面
私底下完全不一樣

現在看誰都不敢相信了`,
    '八卦王'
  );
  await insertReply(thread2, '網紅本來就是演出來的', '名無しさん', 1);
  await insertReply(thread2, '不要對偶像有太高期待', '現實派', 2);
  await insertReply(thread2, '>>2 說得好', '名無しさん', 3);
  await insertReply(thread2, '所以我只看貓咪頻道www', '貓奴', 4);

  // 3. 追劇推薦
  const thread3 = await insertThread(
    'gossip',
    '最近有什麼好看的Netflix推薦嗎',
    `過年連假想追劇
但不知道要看什麼

喜歡懸疑、推理類
不要太悲傷的結局

大家有推薦嗎？`,
    '追劇需求'
  );
  await insertReply(thread3, '魷魚遊戲第二季\n雖然評價兩極', '名無しさん', 1);
  await insertReply(thread3, '推《黑暗榮耀》\n超爽片', '追劇仔', 2);
  await insertReply(thread3, '>>2 +1 宋慧喬演技炸裂', '名無しさん', 3);
  await insertReply(thread3, '日劇推《最完美的離婚》\n經典神作', '日劇粉', 4);
  await insertReply(thread3, '要懸疑的話《怪物》很讚', '韓劇愛好者', 5);

  console.log('✅ Gossip board +3 threads');
}

// ===== 為回覆量少的討論串補充回覆 =====

async function seedReplies() {
  console.log('📝 為回覆量少的討論串補充回覆...');

  // id: 371 - 超喜歡沢口愛華的啦 (gossip)
  await insertReply(371, '誰？', '名無しさん', 1);
  await insertReply(371, '日本女星吧', '名無しさん', 2);
  await insertReply(371, '去查了一下\n還滿漂亮的', '名無しさん', 3);

  // id: 95 - 為什麼放假比上班還累 (life)
  await insertReply(95, '因為要陪家人跑行程www', '名無しさん', 1);
  await insertReply(95, '躺在家不就好了', '宅宅', 2);
  await insertReply(95, '>>2 家人會唸啊', '名無しさん', 3);
  await insertReply(95, '真的\n放假反而更累', '同感', 4);

  // id: 574 - 我要加薪 (work)
  await insertReply(574, '我也想', '名無しさん', 1);
  await insertReply(574, '+1', '名無しさん', 2);
  await insertReply(574, '先表現好再說', '現實派', 3);

  // id: 128 - 詭寓 (acg)
  await insertReply(128, '這是什麼？遊戲？', '名無しさん', 1);
  await insertReply(128, '恐怖遊戲\n台灣獨立開發的', '名無しさん', 2);
  await insertReply(128, '>>2 台灣也有恐怖遊戲？', '名無しさん', 3);
  await insertReply(128, '返校、還願系列的都很強', '台灣遊戲粉', 4);

  // id: 38 - 很煩咧 (work)
  await insertReply(38, '怎麼了', '名無しさん', 1);
  await insertReply(38, '說出來比較不悶', '名無しさん', 2);
  await insertReply(38, '上班族日常', '社畜', 3);

  console.log('✅ 回覆補充完成');
}

// ===== MAIN =====

async function main() {
  console.log('🚀 Starting seed (2026-01-15)...\n');

  try {
    await seedMoneyNew();
    await seedLoveNew();
    await seedGossipNew();
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

    // 板塊統計
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
