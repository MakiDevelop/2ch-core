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

  // ========== #4941 討論版列表能固定嗎 (meta) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(4941, '>>6 謝謝！找到書籤功能了\n原來藏在右下角', '名無しさん', 58);
  await insertReply(4941, '希望能有「我的最愛看板」功能\n把常用的版固定在最上面', '名無しさん', 56);
  await insertReply(4941, '>>7 討論串書籤跟看板收藏是不同的需求\n兩個都希望有', '名無しさん', 54);
  await insertReply(4941, '站方加油 功能越來越完整了', '名無しさん', 52);

  // ========== #4675 公司導入AI砍人 (work) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(4675, '>>6 創意跟判斷力也快了\n看GPT-5的進化速度', '名無しさん', 110);
  await insertReply(4675, '趁現在學會使用AI\n變成駕馭AI的人而不是被取代的人', '名無しさん', 108);
  await insertReply(4675, '>>7 資本家的貪婪這句太真實\n科技進步紅利都被老闆吃走', '名無しさん', 106);
  await insertReply(4675, '我覺得最危險的是\n不願意學習新技能的人', '轉職成功', 104);

  // ========== #4714 月薪35K存錢還是投資 (money) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(4714, '>>6 大概每月1萬到1.2萬\n加上複利效果', '名無しさん', 112);
  await insertReply(4714, '0050真的是新手首選\n低風險穩定成長', '名無しさん', 110);
  await insertReply(4714, '>>2 緊急預備金很重要\n不然投資賠了又要用錢很慘', '名無しさん', 108);
  await insertReply(4714, '年輕最大的本錢就是時間\n複利的威力現在開始最明顯', '名無しさん', 106);

  // ========== #4682 離婚率亞洲第二 (love) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(4682, '>>6 離婚對小孩影響其實因人而異\n天天吵架的婚姻更傷', '名無しさん', 118);
  await insertReply(4682, '現在年輕人對婚姻的期待不同了\n不將就也是一種進步', '名無しさん', 116);
  await insertReply(4682, '>>7 不婚族路過+1\n看到這些數據更堅定了', '名無しさん', 114);
  await insertReply(4682, '婚前一定要同居試試\n三觀合不合住過才知道', '過來人', 112);

  // ========== #4568 薪水追不上物價 (life) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(4568, '>>6 台北120算便宜了\n信義區沒150吃不到', '名無しさん', 126);
  await insertReply(4568, 'CPI的計算方式本來就有問題\n跟一般人消費結構差太多', '名無しさん', 124);
  await insertReply(4568, '房租漲最多但不算在CPI裡\n官方數字當然好看', '名無しさん', 122);
  await insertReply(4568, '省錢只能省小錢\n要解決問題還是得多賺', '名無しさん', 120);

  // ========== #4598 免費營養午餐 (gossip) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(4598, '>>6 錢本來就該花在孩子身上\n不是買軍火', '名無しさん', 132);
  await insertReply(4598, '>>4 日本的營養午餐真的很用心\n希望台灣也能這樣', '名無しさん', 130);
  await insertReply(4598, '政策好不好看執行\n怕的是錢花了品質爛', '名無しさん', 128);
  await insertReply(4598, '不管藍綠 對孩子好的政策都該支持', '名無しさん', 126);

  // ========== #4333 星巴克買一送一 (life) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(4333, '>>6 喝星巴克是買氣氛\n認真討論CP值就輸了', '名無しさん', 134);
  await insertReply(4333, '小熊杯已經開賣了\n官網秒殺 只能找黃牛', '名無しさん', 132);
  await insertReply(4333, '>>4 路易莎咖啡也不錯\n但星巴克店面真的舒服', '名無しさん', 130);
  await insertReply(4333, '買一送一要揪人\n一個人喝兩杯太撐', '名無しさん', 128);

  // ========== #4283 AirTag 2 (tech) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(4283, '>>5 防跟蹤功能iOS有更新\n陌生AirTag會通知', '名無しさん', 136);
  await insertReply(4283, '第一代電池換過一次\n續航真的很久', '名無しさん', 134);
  await insertReply(4283, '>>7 出國旅行必備\n行李不見有救', '名無しさん', 132);
  await insertReply(4283, '放一個在機車上\n被偷也找得回來', '名無しさん', 130);

  console.log('回覆補充完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
