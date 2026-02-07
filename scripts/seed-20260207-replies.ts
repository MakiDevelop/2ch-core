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
  console.log('開始為稀缺討論串補充回覆...\n');

  // 討論串 10350: 楊冪跟馬龍同框Prada活動引熱議 (gossip)
  console.log('📝 補充討論串 10350 (gossip)');
  await insertReply(10350, '>>4\n真的是桌球那個馬龍 有點意外', '名無しさん', 3);
  await insertReply(10350, '兩個人完全不同領域 Prada選人蠻有趣的', '名無しさん', 5);
  await insertReply(10350, '翟子路最近很常參加精品活動欸', '名無しさん', 8);

  // 討論串 10338: 覺得台灣就業環境越來越差 (life)
  console.log('📝 補充討論串 10338 (life)');
  await insertReply(10338, '>>5\n+1 現在根本要靠自己upskill', '名無しさん', 4);
  await insertReply(10338, '我覺得不是變差 是科技進步太快大家跟不上', '名無しさん', 7);
  await insertReply(10338, '重點是薪水凍漲但物價狂漲啊', '碼農仔', 10);
  await insertReply(10338, '>>7\n有道理 但企業也不給員工學習時間', '名無しさん', 12);

  // 討論串 10319: 2026冬番有55套新作 太多了吧 (acg)
  console.log('📝 補充討論串 10319 (acg)');
  await insertReply(10319, '我還想追《SAKAMOTO DAYS》 Netflix獨佔', '名無しさん', 6);
  await insertReply(10319, '>>5\n那部第一集就很暗 不知道能撐多久', '名無しさん', 9);
  await insertReply(10319, '異世界系又一大堆 有點膩了', '動畫宅', 11);

  // 討論串 10331: 每年過年都要被問工作跟結婚 (life)
  console.log('📝 補充討論串 10331 (life)');
  await insertReply(10331, '>>3\n我也用這招XDD 超有效', '名無しさん', 4);
  await insertReply(10331, '直接說有對象但還在觀察 他們就不敢繼續問了', '名無しさん', 8);
  await insertReply(10331, '其實長輩也是關心啦 只是方式很煩', '名無しさん', 13);
  await insertReply(10331, '>>9\n關心可以 但年年問一樣的問題真的很膩', '名無しさん', 15);

  // 討論串 10312: 咒術迴戰死滅迴游篇要開打了 (acg)
  console.log('📝 補充討論串 10312 (acg)');
  await insertReply(10312, '>>4\nMAPPA最近案子很多 真的怕進度炸掉', '名無しさん', 5);
  await insertReply(10312, '乙骨的領域展開超期待！', '咒術粉', 9);
  await insertReply(10312, '>>2\n我覺得還差一點 畢竟五條有無下限', '名無しさん', 12);

  console.log('\n✅ 所有回覆已新增完成');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
