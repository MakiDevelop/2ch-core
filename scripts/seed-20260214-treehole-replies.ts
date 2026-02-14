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
  console.log('樹洞回覆補位（成人板，50% skip rate）...');
  console.log('跳過: 20058（在一起很久了）、20060（工作忙到沒慾望）— 自然冷場');

  // Thread 20059: 有些想法不敢跟任何人說
  // persona: lonely — 深夜也醒著的人
  await insertReply(
    20059,
    `你最後那句「匿名才敢打這些字」\n大概很多人都是這樣吧\n\n不用覺得奇怪`,
    '名無しさん',
    0.5
  );
  console.log('  [reply] thread 20059 (persona: lonely)');

  // Thread 20061: 單身久了 其實最難的是晚上
  // persona: tired_worker — 同樣累的人
  await insertReply(
    20061,
    `「不是想要性 是想要有人在旁邊」\n這句話打到我了\n\n過年快樂 雖然好像也沒什麼快樂的`,
    '名無しさん',
    0.3
  );
  console.log('  [reply] thread 20061 (persona: tired_worker)');

  console.log('\n補位完成：2 串各 1 則回覆，2 串自然冷場');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
