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

  // ========== #5444 免費心理諮商 (life) ==========
  // OP=1, 現有5則回覆, 補4則
  await insertReply(5444, '去年用完今年又有3次\n政府難得做對事', '名無しさん', 24);
  await insertReply(5444, '>>5 真的 這筆錢花得值得\n比吃藥有用', '名無しさん', 22);
  await insertReply(5444, '提醒一下45歲前要用\n超過就不能新申請了', '名無しさん', 20);
  await insertReply(5444, '我預約了下週的\n有點緊張但期待', '名無しさん', 18);

  // ========== #5464 交友軟體推薦 (love) ==========
  // OP=1, 現有5則回覆, 補4則
  await insertReply(5464, '>>4 CMB真的品質比較好\n不像Tinder一堆怪人', '名無しさん', 32);
  await insertReply(5464, '純聊天的話探探也可以\n但認真交往不推', '名無しさん', 30);
  await insertReply(5464, '>>6 SweetRing我用過\n要填很多資料 但配對蠻準的', '名無しさん', 28);
  await insertReply(5464, '最後還是要看緣分\n軟體只是工具', '過來人', 26);

  // ========== #5484 深色模式 (meta) ==========
  // OP=1, 現有5則回覆, 補4則
  await insertReply(5484, '深色模式+1\n省電又護眼', '名無しさん', 58);
  await insertReply(5484, '>>6 自動切換超重要\n跟系統同步最方便', '名無しさん', 56);
  await insertReply(5484, '希望可以記住設定\n不要每次都要重選', '名無しさん', 54);
  await insertReply(5484, '管理員看到了嗎\n拜託做這個功能', '名無しさん', 52);

  // ========== #5490 官方app (meta) ==========
  // OP=1, 現有5則回覆, 補4則
  await insertReply(5490, '>>4 PWA怎麼加\n求教學', '名無しさん', 72);
  await insertReply(5490, '>>7 Safari按分享→加入主畫面\nChrome按選單→安裝應用程式', '名無しさん', 70);
  await insertReply(5490, 'PWA通知好像還是比不上原生app\n希望未來能支援', '名無しさん', 68);
  await insertReply(5490, '小站有app才奇怪吧\n網頁夠用了', '名無しさん', 66);

  // ========== #5470 TGS電玩展 (acg) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(5470, '搶到皮克敏週邊超開心\n排了一小時值得', '名無しさん', 5);
  await insertReply(5470, '>>5 零的恐怖遊戲真的嚇人\n旁邊有人玩到尖叫', '名無しさん', 4);
  await insertReply(5470, '明年一定要請假去平日\n假日真的太擠', '名無しさん', 3);
  await insertReply(5470, '獨立遊戲區意外有很多好遊戲\n值得逛逛', '名無しさん', 2);

  // ========== #5457 交友軟體疲勞 (love) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(5457, '>>5 AI配對聽起來不錯\n至少比亂滑好', '名無しさん', 26);
  await insertReply(5457, '我覺得問題是大家都不認真\n當成遊戲在玩', '名無しさん', 24);
  await insertReply(5457, '>>7 對 一個人也可以很好\n不用為了脫單而脫單', '名無しさん', 22);
  await insertReply(5457, '等對的人出現吧\n強求也沒意思', '名無しさん', 20);

  // ========== #5450 年輕人壓力 (life) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(5450, '>>4 國際局勢這個真的\n每天看新聞都焦慮', '名無しさん', 34);
  await insertReply(5450, '我選擇不看新聞\n眼不見為淨', '名無しさん', 32);
  await insertReply(5450, '>>7 不生小孩+1\n養自己就很累了', '名無しさん', 30);
  await insertReply(5450, '政府應該正視這問題\n不是只會叫年輕人努力', '名無しさん', 28);

  // ========== #5477 2026冬番 (acg) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(5477, '>>3 死滅迴游劇情真的虐\n但停不下來', '名無しさん', 38);
  await insertReply(5477, '芙莉蓮OP超好聽\nYOASOBI真的讚', '名無しさん', 36);
  await insertReply(5477, '推孩劇情越來越黑暗\n跟第一季差好多', '名無しさん', 34);
  await insertReply(5477, '有沒有新番推薦\n續作以外的', '名無しさん', 32);

  // ========== #4991 台股 (money) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(4991, '>>6 100塊賣的太慘了\n拍拍', '名無しさん', 64);
  await insertReply(4991, '現在上車還來得及嗎\n感覺已經很高了', '名無しさん', 62);
  await insertReply(4991, '>>9 有人說3000有人說崩盤\n自己判斷吧', '名無しさん', 60);
  await insertReply(4991, 'AI股還能漲多久\n泡沫遲早要破', '空軍', 58);

  console.log('回覆補充完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
