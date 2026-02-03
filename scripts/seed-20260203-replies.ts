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

  // === Thread 6052: 房價跌一跌才買得起啦~ ===
  // 現有 7 樓 (OP + 6 回覆)
  console.log('補充 thread 6052 (房價)...');

  await insertReply(6052, `>>5
同感 乾脆躺平算了
反正也存不到頭期款`, '名無しさん', 18);

  await insertReply(6052, `>>6
南部也在漲好嗎
高雄這幾年漲翻`, '名無しさん', 16);

  await insertReply(6052, `少子化這麼嚴重
以後房子應該會便宜吧？
...應該吧？`, '等房仔', 14);

  await insertReply(6052, `>>10
等少子化房子跌
你可能先等到地震或海平面上升`, '名無しさん', 12);

  // === Thread 2834: 外資把台積電目標價調到2400了 ===
  // 現有 7 樓 (OP + 6 回覆)
  console.log('補充 thread 2834 (台積電)...');

  await insertReply(2834, `>>2
說怕被套的都沒買到
結果一路漲`, '名無しさん', 220);

  await insertReply(2834, `AI需求不減的話
2400不是問題`, '名無しさん', 218);

  await insertReply(2834, `外資報告看看就好
他們自己先買完才喊的`, '韭菜', 215);

  await insertReply(2834, `>>5
CoWoS真的猛
聽說排隊排到2027`, '名無しさん', 212);

  // === Thread 2883: CES 2026：黃仁勳說「物理AI的ChatGPT時刻到了」===
  // 現有 7 樓 (OP + 6 回覆)
  console.log('補充 thread 2883 (CES AI)...');

  await insertReply(2883, `老黃講話一向很敢
但這次真的有東西`, '名無しさん', 220);

  await insertReply(2883, `>>2
中國機器人便宜很多
但精度還是差一截`, '名無しさん', 218);

  await insertReply(2883, `自駕車快要成熟了吧
特斯拉FSD進步很大`, '名無しさん', 215);

  await insertReply(2883, `>>4
高齡科技是真的
日本超多長照機器人`, '台灣人口老化中', 212);

  await insertReply(2883, `開源模型是什麼？
有人有連結嗎`, '名無しさん', 208);

  console.log('完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
