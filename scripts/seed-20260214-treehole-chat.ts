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

async function getBoardId(slug: string): Promise<number | null> {
  const result = await pool.query('SELECT id FROM boards WHERE slug = $1', [slug]);
  return result.rows[0]?.id || null;
}

async function insertThread(
  boardSlug: string,
  title: string,
  content: string,
  authorName: string = '名無しさん',
  hoursAgo: number = 2
): Promise<number> {
  const boardId = await getBoardId(boardSlug);
  if (!boardId) throw new Error(`Board not found: ${boardSlug}`);
  const result = await pool.query(
    `INSERT INTO posts (title, content, status, ip_hash, user_agent, board_id, author_name, created_at)
     VALUES ($1, $2, 0, $3, $4, $5, $6, NOW() - INTERVAL '1 hour' * $7)
     RETURNING id`,
    [title, content, generateIpHash(), randomUserAgent(), boardId, authorName, hoursAgo]
  );
  return result.rows[0].id;
}

async function main() {
  // seed_goal: emotional_release
  // 類型：深夜壓力型（50%）
  // 背景：2/14 情人節 + 春節連假第一天
  const threadId = await insertThread(
    'chat',
    '過年第一天又剛好情人節 雙重暴擊',
    `今天開始放年假\n本來應該很開心\n結果一整天都待在房間\n\n爸媽在客廳看電視\n一直問什麼時候帶人回來\n我說還沒 他們就不說話了\n那個沉默比被唸還難受\n\n滑 IG 全部都是情人節放閃\n關掉\n滑抖音也是\n關掉\n\n其實不是羨慕\n是那種「大家都有在過日子」的感覺\n而我好像只是在消耗時間\n\n連假才第一天\n後面還有好幾天\n要在家裡被問好幾天\n\n剛剛出門去超商買宵夜\n街上都是一對一對的\n我拿著一袋鹹酥雞走回來\n突然覺得這畫面有點好笑\n又有點心酸\n\n算了 反正明天開始就沒人在意情人節了\n過年快樂吧`,
    '名無しさん',
    1
  );

  console.log(`樹洞討論串已建立: thread id ${threadId} (chat 板)`);
  console.log('seed_goal: emotional_release');
  console.log('類型: 深夜壓力型');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
