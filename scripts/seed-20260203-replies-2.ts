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
  console.log('開始補充回覆 (第二批)...');

  // === Thread 3615: Alex Honnold 徒手攀爬台北101 ===
  // 現有 7 樓 (OP + 6 回覆)
  console.log('補充 thread 3615 (Alex Honnold)...');

  await insertReply(3615, `>>3
他真的有研究過
說他大腦杏仁核反應比較小`, '名無しさん', 200);

  await insertReply(3615, `101外牆那個傾斜角度
想到就腿軟`, '名無しさん', 198);

  await insertReply(3615, `>>7
酋長岩是垂直的
101還有凹凸可以抓吧`, '名無しさん', 195);

  await insertReply(3615, `紀錄片超好看
Netflix有`, '爬山愛好者', 192);

  // === Thread 2827: 大谷翔平確認出戰WBC了！ ===
  // 現有 7 樓 (OP + 6 回覆)
  console.log('補充 thread 2827 (大谷翔平)...');

  await insertReply(2827, `>>5
那球真的可惜
周東打那支安打...`, '名無しさん', 230);

  await insertReply(2827, `日本隊陣容太豪華
達比修+大谷+山本`, '野球迷', 228);

  await insertReply(2827, `希望張育成有表現
在大聯盟起起伏伏`, '名無しさん', 225);

  await insertReply(2827, `>>7
韓國今年也很強
李政厚回來了`, '名無しさん', 222);

  // === Thread 3671: 求職錄取率只有0.4%？ ===
  // 現有 7 樓 (OP + 6 回覆)
  console.log('補充 thread 3671 (求職)...');

  await insertReply(3671, `>>4
LinkedIn真的有用
我就是這樣換工作的`, '轉職仔', 248);

  await insertReply(3671, `履歷要針對JD改
不要一份投到底`, '名無しさん', 245);

  await insertReply(3671, `>>7
ATS系統很煩
格式跑掉就直接刷掉`, '名無しさん', 242);

  await insertReply(3671, `現在大公司都先發線上測驗
能力測驗+性格測驗`, 'HR路過', 238);

  // === Thread 3197: Tinder 2026約會報告 ===
  // 現有 7 樓 (OP + 6 回覆)
  console.log('補充 thread 3197 (Tinder)...');

  await insertReply(3197, `>>2
曖昧期太長真的累
不如直接問清楚`, '名無しさん', 260);

  await insertReply(3197, `低壓約會很好
第一次見面壓力不要太大`, '名無しさん', 258);

  await insertReply(3197, `>>6
詐騙是真的多
但正常人也有`, '名無しさん', 255);

  await insertReply(3197, `直球戀愛要看對象
有些人受不了太直接`, '戀愛高手', 252);

  await insertReply(3197, `Hinge比Tinder好用
配對品質比較高`, '名無しさん', 248);

  console.log('完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
