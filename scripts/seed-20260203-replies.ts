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

  // === 6051: 這衣服怎麼辦到的 (Threads 連結，視覺錯覺衣服) ===
  await insertReply(6051, '這也太強 設計師是天才吧', '名無しさん', 18);
  await insertReply(6051, '靠北我看了三遍才看懂\n原來是這樣剪裁的', '名無しさん', 15);
  await insertReply(6051, '>>2\n我到現在還是看不懂', '名無しさん', 12);
  await insertReply(6051, '這種衣服穿出去一定被狂看', '時尚大師', 8);
  await insertReply(6051, '想買 有人知道品牌嗎', '名無しさん', 5);

  // === 6052: 房價跌一跌才買得起啦~ (三立新聞連結) ===
  await insertReply(6052, '等房價跌的都等到生小孩了', '名無しさん', 20);
  await insertReply(6052, '跌？你是說少漲嗎', '名無しさん', 17);
  await insertReply(6052, '>>2\n笑死 真的 少漲2%就叫跌了', '無殼蝸牛', 14);
  await insertReply(6052, '我已經放棄了 租一輩子', '名無しさん', 10);
  await insertReply(6052, '南部還是買得起啦\n台北就...', '名無しさん', 6);
  await insertReply(6052, '政府打房打了幾年了？\n有用嗎', '名無しさん', 3);

  // === 6061: 給版主（網站安全建議） ===
  await insertReply(6061, '版主加油 這站很有潛力', '名無しさん', 22);
  await insertReply(6061, 'Cloudflare 先掛上去吧', '名無しさん', 19);
  await insertReply(6061, '>>2\n+1 基本中的基本', '資安新手', 15);
  await insertReply(6061, '希望別被打掛\n好不容易有個新論壇', '名無しさん', 10);

  // === 3847: 過年有開的餐廳推薦（補充更多） ===
  await insertReply(3847, '火鍋店很多過年都有開\n但要訂位', '名無しさん', 200);
  await insertReply(3847, '>>6\n對 便利商店 YYDS', '名無しさん', 180);
  await insertReply(3847, '推薦饒河夜市\n過年也有很多攤位', '夜市控', 150);
  await insertReply(3847, '台北車站微風也有開', '名無しさん', 120);

  // === 2841: 春節連假9天怎麼安排（補充更多） ===
  await insertReply(2841, '>>6\n武陵真的難訂\n我去年十月就訂了', '名無しさん', 210);
  await insertReply(2841, '宅在家打電動\n完美', '肥宅', 190);
  await insertReply(2841, '出國的機票超貴\n日本來回三萬', '名無しさん', 160);
  await insertReply(2841, '初二回娘家 初三開始自由\n應該會去走走', '名無しさん', 130);

  console.log('完成！已補充回覆');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
