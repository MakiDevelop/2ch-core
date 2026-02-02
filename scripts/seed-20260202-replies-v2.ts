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

  // ========== #5743 孤獨搖滾動畫展 (acg) ==========
  // 現有6則回覆, 補4則
  await insertReply(5743, '>>7 喜多醬可愛！\\n但波奇才是本命', '名無しさん', 15);
  await insertReply(5743, '虹夏派路過\\n鼓手最帥', '名無しさん', 14);
  await insertReply(5743, '>>5 動畫節有什麼活動嗎\\n可以排一整天', '名無しさん', 13);
  await insertReply(5743, '希望有真人比例的立牌\\n可以合照那種', '名無しさん', 12);

  // ========== #5715 AI Agent取代工程師 (tech) ==========
  // 現有6則回覆, 補4則
  await insertReply(5715, '>>7 54%要增加投資\\n但多少是跟風而已', '名無しさん', 17);
  await insertReply(5715, '重複性工作一定會被取代\\n創意跟判斷力才是關鍵', '名無しさん', 16);
  await insertReply(5715, '>>5 我用Cursor寫code\\n效率真的提升很多', '工程師', 15);
  await insertReply(5715, '不用怕被取代\\n怕的是不願意學習的人', '名無しさん', 14);

  // ========== #5736 江蕙演唱會安可場 (gossip) ==========
  // 現有6則回覆, 補4則
  await insertReply(5736, '>>6 可以帶爸媽\\n這種機會不多了', '名無しさん', 13);
  await insertReply(5736, '二姐的聲音還是那麼好聽\\n歲月沒有留下痕跡', '名無しさん', 12);
  await insertReply(5736, '>>4 孝順加分\\n帶長輩看演唱會超有意義', '名無しさん', 11);
  await insertReply(5736, '黃牛價格應該很恐怖\\n正常管道買不到只能認了', '名無しさん', 10);

  // ========== #5756 直球約會趨勢 (love) ==========
  // 現有6則回覆, 補4則
  await insertReply(5756, '>>7 交友軟體就是要效率\\n想慢慢來去認識朋友的朋友', '名無しさん', 14);
  await insertReply(5756, '直球有直球的好\\n至少不用猜來猜去', '名無しさん', 13);
  await insertReply(5756, '>>5 對方喜歡慢慢來\\n你喜歡快\\n一開始就不合了', '名無しさん', 12);
  await insertReply(5756, '重點是誠實\\n不管快慢都要真誠', '過來人', 11);

  // ========== #5722 甲骨文股價暴跌 (tech) ==========
  // 現有6則回覆, 補4則
  await insertReply(5722, '>>6 泡沫論每年都有人喊\\n結果AI還是繼續漲', '名無しさん', 22);
  await insertReply(5722, '個股問題不能代表整體\\n基本面還是要看', '名無しさん', 21);
  await insertReply(5722, '>>5 台積電有實際獲利\\n不是純炒題材', '名無しさん', 20);
  await insertReply(5722, '趁現在跌買一點\\n長期看AI還是會成長', '抄底仔', 19);

  // ========== #5769 機車路考2027 (life) ==========
  // 現有6則回覆, 補4則
  await insertReply(5769, '>>6 取締確實是重點\\n違規不抓考再嚴也沒用', '名無しさん', 24);
  await insertReply(5769, '路考應該要包含待轉區\\n很多人不知道怎麼待轉', '名無しさん', 23);
  await insertReply(5769, '>>4 駕訓班學費現在就夠貴了\\n再漲誰考得起', '名無しさん', 22);
  await insertReply(5769, '支持路考\\n但配套措施要完善', '名無しさん', 21);

  // ========== #5776 台鐵漲價 (life) ==========
  // 現有6則回覆, 補4則
  await insertReply(5776, '>>6 客運也會跟著漲吧\\n油價那麼貴', '名無しさん', 26);
  await insertReply(5776, '漲價後要提升服務品質\\n不然憑什麼漲', '名無しさん', 25);
  await insertReply(5776, '>>5 高鐵準時但貴\\n台鐵便宜但誤點\\n選擇困難', '名無しさん', 24);
  await insertReply(5776, '公司化的結果就是這樣\\n以後只會更貴', '通勤族', 23);

  // ========== #5675 新台幣改版票選 (money) ==========
  // 現有6則回覆, 補4則
  await insertReply(5675, '>>6 24年沒換真的太久\\n防偽技術都落後了', '名無しさん', 32);
  await insertReply(5675, '投完票了\\n希望晶片可以上', '名無しさん', 31);
  await insertReply(5675, '>>5 不要人像比較好\\n爭議太多', '名無しさん', 30);
  await insertReply(5675, '石虎黑熊+1\\n保育意識要從小培養', '名無しさん', 29);

  console.log('回覆補充完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
