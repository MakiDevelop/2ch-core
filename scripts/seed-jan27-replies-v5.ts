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
  console.log('開始為稀缺討論串補充回覆...');

  // Thread 1209: 北七欸www (YouTube 影片關於冷水變小)
  // 現有回覆: 1223 "冷水突然變小XD", 1376 "笑死", 1377 "www"
  console.log('補充回覆到討論串 1209 (北七欸www)...');
  await insertReply(1209, '這什麼鬼XDDD', '名無しさん', 240);
  await insertReply(1209, '>>1223\n真的 水柱突然變細 笑爛', '名無しさん', 230);
  await insertReply(1209, '水壓也太不穩', '路過仔', 220);
  await insertReply(1209, '是在洗澡洗到一半被嚇到嗎www', '名無しさん', 210);

  // Thread 361: ^_^ (顏文字串)
  // 現有回覆: 1001 "(ﾉ´∀`)ﾉ", 1000 "( ´ ▽ ` )ﾉ", 999 "^_^"
  console.log('補充回覆到討論串 361 (^_^)...');
  await insertReply(361, '(≧▽≦)', '名無しさん', 285);
  await insertReply(361, 'ヽ(✿ﾟ▽ﾟ)ノ', '名無しさん', 280);
  await insertReply(361, '(*´∀`)~♥', '顏文字狂', 275);
  await insertReply(361, '(｡♥‿♥｡)', '名無しさん', 270);

  // Thread 141: 貪汙去死 (news board)
  // 現有回覆: 754, 831 "貪官真的可惡", 753, 830 "是發生什麼事了"
  console.log('補充回覆到討論串 141 (貪汙去死)...');
  await insertReply(141, '又是哪個貪官被抓了', '名無しさん', 265);
  await insertReply(141, '>>753\n點進去看就知道了 又是貪污案', '名無しさん', 260);
  await insertReply(141, '這種人就該重判', '名無しさん', 255);
  await insertReply(141, '但是最後都輕判啊 台灣司法笑話', '酸民', 250);
  await insertReply(141, '>>754\n同意 貪污犯就該重罰', '名無しさん', 245);

  // Thread 47: 媽的死支那人 (海底電纜被切斷)
  // 現有回覆討論網路變慢、海纜斷裂、船長被起訴等
  console.log('補充回覆到討論串 47 (海底電纜問題)...');
  await insertReply(47, '>>1525\n已經斷9條了？太扯', '名無しさん', 200);
  await insertReply(47, '現在連 YouTube 都很卡', '名無しさん', 195);
  await insertReply(47, '>>1526\n起訴有屁用 根本防不勝防', '名無しさん', 190);
  await insertReply(47, '微波備援根本不夠用吧 12.6G 能撐幾個人', '工程師', 185);

  // Thread 1199: 許功蓋 (chat board, 只有4個回覆)
  console.log('查詢討論串 1199 內容...');
  const thread1199 = await pool.query(
    'SELECT id, content FROM posts WHERE (id = 1199 OR parent_id = 1199) AND status = 0 ORDER BY created_at'
  );
  if (thread1199.rows.length > 0) {
    console.log('補充回覆到討論串 1199 (許功蓋)...');
    await insertReply(1199, '這什麼梗', '名無しさん', 240);
    await insertReply(1199, '台語發音嗎XDDD', '名無しさん', 235);
    await insertReply(1199, '笑死 許功蓋', '路人', 230);
  }

  // Thread 578: 幹幹叫 (chat board, 只有4個回覆)
  console.log('查詢討論串 578 內容...');
  const thread578 = await pool.query(
    'SELECT id, content FROM posts WHERE (id = 578 OR parent_id = 578) AND status = 0 ORDER BY created_at'
  );
  if (thread578.rows.length > 0) {
    console.log('補充回覆到討論串 578 (幹幹叫)...');
    await insertReply(578, '到底是誰在幹幹叫', '名無しさん', 275);
    await insertReply(578, 'XDDDDD', '名無しさん', 270);
    await insertReply(578, '這標題真的很有事', '名無しさん', 265);
  }

  console.log('✅ 所有回覆已成功新增！');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('❌ 錯誤:', err);
    pool.end();
    process.exit(1);
  });
