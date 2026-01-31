#!/usr/bin/env tsx
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
     VALUES ($1, 0, $2, $3, $4, NULL, $5, NOW() - INTERVAL '1 hour' * $6)`,
    [content, generateIpHash(), randomUserAgent(), parentId, authorName, hoursAgo]
  );
}

async function main() {
  console.log('開始補充回覆...');

  // ========== #5380 TXT大巨蛋 (gossip) ==========
  // OP=1, 5381=2, 5382=3, 5383=4, 5384=5, 5385=6, 新回覆從 7 開始
  await insertReply(5380, '>>3 大巨蛋辦演唱會真的有差\n比小巨蛋大很多', '名無しさん', 10);
  await insertReply(5380, '韓團真的很會炒氣氛\n粉絲應援也超整齊', '名無しさん', 8);
  await insertReply(5380, '>>5 他們應該會再來吧\n台灣市場夠大', '名無しさん', 6);
  await insertReply(5380, '門票價格怎麼樣\n想知道行情', '名無しさん', 4);

  // ========== #5336 台股逼近33000 (money) ==========
  // OP=1, 5337=2, 5338=3, 5339=4, 5340=5, 5341=6, 新回覆從 7 開始
  await insertReply(5336, '>>2 乖離確實大\n但多頭趨勢還沒破', '名無しさん', 28);
  await insertReply(5336, 'AI應用落地才剛開始\n長線還是看好', '名無しさん', 24);
  await insertReply(5336, '>>6 震盪整理是健康的\n一直漲才可怕', '名無しさん', 20);
  await insertReply(5336, '外資今年態度很關鍵\n要看他們怎麼做', '名無しさん', 16);

  // ========== #5361 NVIDIA聯發科 (tech) ==========
  // OP=1, 5362=2, 5363=3, 5364=4, 5365=5, 5366=6, 新回覆從 7 開始
  await insertReply(5361, '>>4 Edge AI 確實重要\n延遲跟隱私都是問題', '名無しさん', 32);
  await insertReply(5361, '聯發科天璣系列就有NPU了\n這是再強化', '名無しさん', 28);
  await insertReply(5361, '跟NVIDIA合作是加分\n品牌效應', '名無しさん', 24);
  await insertReply(5361, '>>2 手機晶片還是主力\n但多角化是對的', '名無しさん', 20);

  // ========== #5393 育嬰留停 (work) ==========
  // OP=1, 5394=2, 5395=3, 5396=4, 5397=5, 5398=6, 新回覆從 7 開始
  await insertReply(5393, '>>5 很多公司表面上不敢講\n但會用其他方式刁難', '名無しさん', 24);
  await insertReply(5393, '至少法規先進步\n觀念慢慢會改', '名無しさん', 20);
  await insertReply(5393, '希望爸爸也多用\n不要只有媽媽請', '新手爸', 16);
  await insertReply(5393, '>>8 同意 育兒是兩個人的事', '名無しさん', 12);

  // ========== #5349 海鯤艦 (news) ==========
  // OP=1, 5350=2, 5351=3, 5352=4, 5353=5, 5354=6, 新回覆從 7 開始
  await insertReply(5349, '>>3 深水測試才是關鍵\n期待後續消息', '名無しさん', 38);
  await insertReply(5349, '自製潛艦對台灣戰略意義很大', '名無しさん', 34);
  await insertReply(5349, '技術累積需要時間\n第一艘最難', '名無しさん', 30);
  await insertReply(5349, '>>6 是啊 有了第一艘\n後面就會越來越順', '名無しさん', 26);

  // ========== #5367 AI泡沫 (tech) ==========
  // OP=1, 5368=2, 5369=3, 5370=4, 5371=5, 5372=6, 新回覆從 7 開始
  await insertReply(5367, '>>2 甲骨文主要是雲端跟資料庫\nAI只是順便沾邊', '名無しさん', 48);
  await insertReply(5367, '泡沫破之前都不是泡沫\n破了才知道', '名無しさん', 44);
  await insertReply(5367, '>>5 本益比高不代表一定是泡沫\n看成長性', '名無しさん', 40);
  await insertReply(5367, '反正我是不敢空AI股\n被軋怕了', '名無しさん', 36);

  console.log('回覆補充完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
