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

  // ========== #5116 地震 (gossip) ==========
  // OP=1, 現有回覆到 7 樓
  await insertReply(5116, '宜蘭震央7.0真的超可怕\n幸好深度夠深傷亡不大', '名無しさん', 42);
  await insertReply(5116, '>>6 台灣人地震經驗值太高了\n根本是日常技能', '名無しさん', 38);
  await insertReply(5116, '那天剛好在高樓層\n搖到以為建築物要倒了', '名無しさん', 35);
  await insertReply(5116, '古裝逃命的畫面有人截圖嗎\n想看www', '名無しさん', 30);

  // ========== #4978 Chrome AI Agent (tech) ==========
  // OP=1, 現有回覆到 7 樓
  await insertReply(4978, '>>4 確實隱私是最大問題\n但方便到願意犧牲的人也很多', '名無しさん', 60);
  await insertReply(4978, '這功能出來\n爬蟲仔要失業了吧', '名無しさん', 55);
  await insertReply(4978, '>>7 工程師寫 code 外包給 AI\n上網也外包給 AI\n那工程師要幹嘛', '前端仔', 50);
  await insertReply(4978, '等等看 Safari 會不會跟進\n蘋果這種東西通常會等別人做完再抄', '名無しさん', 45);

  // ========== #5109 F4合體破局 (gossip) ==========
  // OP=1, 現有回覆到 7 樓
  await insertReply(5109, '當年流星花園多紅啊\n現在就這樣散了', '名無しさん', 40);
  await insertReply(5109, '>>3 同意 情緒失控不能當藉口\n那些話收不回去的', '名無しさん', 36);
  await insertReply(5109, '言承旭周渝民都發展得不錯\n吳建豪在韓國也有市場\n就他...', '名無しさん', 32);
  await insertReply(5109, '粉絲等20年終於要合體\n結果被他自己搞砸 真的傻眼', 'F4粉', 28);

  // ========== #5144 中高齡就業 (work) ==========
  // OP=1, 現有回覆到 7 樓
  await insertReply(5144, '>>4 年輕人升遷卡住是真的\n但現在年輕人也不想當主管啊', '名無しさん', 44);
  await insertReply(5144, '我主管都60了還在\n但他經驗真的很強 問什麼都知道', '名無しさん', 40);
  await insertReply(5144, '>>3 日本那邊超商店員很多銀髮族\n服務態度其實很好', '名無しさん', 36);
  await insertReply(5144, '不是每個老人都想繼續工作\n有些是不得不做 退休金不夠', '名無しさん', 32);

  // ========== #5038 小年夜國定假日 (life) ==========
  // OP=1, 現有回覆到 7 樓
  await insertReply(5038, '>>6 高鐵票已經很難搶了\n現在更慘', '名無しさん', 70);
  await insertReply(5038, '終於不用再跟公司請假了\n以前小年夜請假還要看臉色', '社畜二號', 65);
  await insertReply(5038, '>>3 服務業過年都在上班\n真的辛苦', '名無しさん', 60);
  await insertReply(5038, '可以多跟家人吃一餐\n讚讚', '名無しさん', 55);

  console.log('回覆補充完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
