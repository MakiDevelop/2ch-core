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

  // Thread 5355: 2025年GDP成長8.63% (news)
  // 現有6則(1 OP + 5回覆), 補4則
  await insertReply(5355, '不過物價也漲很多\n實質購買力有提升嗎', '名無しさん', 52);
  await insertReply(5355, '>>7 GDP漲 薪水沒漲\n物價先漲 標準體感差', '名無しさん', 48);
  await insertReply(5355, '台積電一家公司佔多少啊\n其他產業有跟上嗎', '名無しさん', 44);
  await insertReply(5355, '半導體是真的猛\n但太集中單一產業也是風險', '名無しさん', 40);

  // Thread 5386: 週休三日提案連署過關了 (work)
  // 現有7則(1 OP + 6回覆), 補4則
  await insertReply(5386, '先從公務員試辦看看\n私人企業太難推', '名無しさん', 68);
  await insertReply(5386, '冰島跟英國都有成功案例\n產值反而提升', '名無しさん', 64);
  await insertReply(5386, '>>8 公務員週休三日\n民間會暴動吧', '名無しさん', 60);
  await insertReply(5386, '與其週休三日不如先把加班費落實\n一堆責任制根本血汗', '加班仔', 56);

  // Thread 5123: 金錢觀差異婚前一定要談清楚 (love)
  // 現有7則(1 OP + 6回覆), 補5則
  await insertReply(5123, '我前男友也是月光族\n後來分手了\n金錢觀真的很重要', '名無しさん', 42);
  await insertReply(5123, '>>2 共同帳戶+1\n各出固定比例最公平', '名無しさん', 38);
  await insertReply(5123, '可以先問問他願不願意改\n如果連改都不願意\n那就要想想了', '名無しさん', 34);
  await insertReply(5123, '原PO可以設定共同目標\n例如存旅遊基金\n讓他有動力存錢', '名無しさん', 30);
  await insertReply(5123, '我老公以前也是\n結婚後讓他管帳反而變超省\n人會變的', '過來人', 26);

  // Thread 5342: 新台幣改版票選 (money)
  // 現有7則(1 OP + 6回覆), 補4則
  await insertReply(5342, '黑熊可以嗎\n台灣特有種', '名無しさん', 70);
  await insertReply(5342, '藍鵲也不錯\n超美的', '名無しさん', 66);
  await insertReply(5342, '>>7 黑熊讚\n很有台灣特色', '名無しさん', 62);
  await insertReply(5342, '希望設計要現代一點\n現在的鈔票真的很老氣', '名無しさん', 58);

  // Thread 5373: 金唱片頒獎典禮在台灣辦 (gossip)
  // 現有7則(1 OP + 6回覆), 補4則
  await insertReply(5373, 'ENHYPEN也來\n西八臉團來了', '名無しさん', 88);
  await insertReply(5373, '>>8 西八臉wwww\n這形容太精準', '名無しさん', 84);
  await insertReply(5373, '台灣現在真的很多韓流演出\n場地租金應該不便宜', '名無しさん', 80);
  await insertReply(5373, '沒搶到票的在這QQ\n黃牛票貴爆', '名無しさん', 76);

  console.log('補充完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
