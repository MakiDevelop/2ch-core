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
  console.log('開始新增回覆...\n');

  // === 4037: Honnold爬台北101那天 信義區交管超誇張 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: Honnold爬台北101那天 信義區交管超誇張');

  await insertReply(4037,
    '>>7 國際媒體報導台灣\n難得的正面新聞',
    '名無しさん', 100);

  await insertReply(4037,
    '徒手攀爬世界第九高樓\n光想就腿軟',
    '名無しさん', 96);

  await insertReply(4037,
    '>>2 我朋友在現場\n說人山人海',
    '名無しさん', 92);

  await insertReply(4037,
    '松智路那邊塞爆\n好在我騎機車',
    '機車族', 88);

  await insertReply(4037,
    'Netflix的紀錄片應該會大賣\n台灣能見度提升',
    '名無しさん', 84);

  // === 3635: 金唱片獎在台北大巨蛋辦 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 金唱片獎在台北大巨蛋辦 韓國都跑來台灣');

  await insertReply(3635,
    '>>7 租金不知道但場地確實大\n4.5萬人耶',
    '名無しさん', 120);

  await insertReply(3635,
    'GD的Power太經典\n現場唱應該很嗨',
    '名無しさん', 116);

  await insertReply(3635,
    '台灣飯真的很幸福\n不用飛韓國就能看',
    'K-pop迷', 112);

  await insertReply(3635,
    '>>3 大巨蛋蓋完整個改變台灣演唱會市場\n終於有國際級場地',
    '名無しさん', 108);

  await insertReply(3635,
    '希望以後更多頒獎典禮來台灣辦\n觀光財啊',
    '名無しさん', 104);

  // === 3948: 北捷在M8出口設了余家昶紀念牌 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 北捷在M8出口設了余家昶紀念牌');

  await insertReply(3948,
    '>>7 北捷那天的緊急應變做得真的好\n傷亡降到最低',
    '名無しさん', 140);

  await insertReply(3948,
    '願意挺身而出的人越來越少\n他值得被記住',
    '名無しさん', 136);

  await insertReply(3948,
    '每次經過M8都會看一下那塊牌\n默默致敬',
    '台北通勤族', 132);

  await insertReply(3948,
    '>>2 600萬太少了\n但錢也換不回一條命',
    '名無しさん', 128);

  await insertReply(3948,
    '社會需要更多這樣的人\n也需要保護這樣的人',
    '名無しさん', 124);

  // === 3955: 台南市長選舉「妃龍在天」(已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 台南市長選舉「妃龍在天」');

  await insertReply(3955,
    '>>7 真的\n台南綠到出汁',
    '名無しさん', 150);

  await insertReply(3955,
    '謝龍介媒體曝光率很高\n但轉換成選票不知道行不行',
    '名無しさん', 146);

  await insertReply(3955,
    '>>4 郭信良如果出來攪局\n民進黨會頭痛',
    '名無しさん', 142);

  await insertReply(3955,
    '地方派系錯綜複雜\n外人看不懂',
    '台南觀察', 138);

  await insertReply(3955,
    '市長做什麼都一樣的話\n不如選個會做事的',
    '名無しさん', 134);

  // === 2960: 過年回家又要被催婚 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 過年回家又要被催婚，該怎麼擋');

  await insertReply(2960,
    '反問長輩「你幫我出聘金嗎」\n通常就安靜了',
    '名無しさん', 170);

  await insertReply(2960,
    '>>3 假裝有對象風險太大\n之後更難收',
    '名無しさん', 166);

  await insertReply(2960,
    '我都說在存錢買房\n長輩反而支持',
    '名無しさん', 162);

  await insertReply(2960,
    '現在30單身很正常\n不用有壓力',
    '同樣30的', 158);

  await insertReply(2960,
    '>>6 找朋友聚會是好方法\n順便聯絡感情',
    '名無しさん', 154);

  // === 2862: 遠距離戀愛過年各自回家 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 遠距離戀愛過年各自回家');

  await insertReply(2862,
    '>>7 每天固定時間視訊很重要\n維持連結感',
    '名無しさん', 180);

  await insertReply(2862,
    '9天真的不算長\n想想當兵的',
    '名無しさん', 176);

  await insertReply(2862,
    '可以一起玩線上遊戲\n邊玩邊聊',
    '遠距過來人', 172);

  await insertReply(2862,
    '>>5 初四約中間點+1\n兩邊都方便',
    '名無しさん', 168);

  await insertReply(2862,
    '趁這幾天好好陪家人\n也是一種充電',
    '名無しさん', 164);

  console.log('\n✅ 已為 6 個討論串新增共 30 則回覆');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
