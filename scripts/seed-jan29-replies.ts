#!/usr/bin/env tsx
/**
 * 2026/1/29 為稀缺討論串補充回覆
 */

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
  console.log('=== 補充回覆 (2026-01-29) ===\n');

  // ============================================================
  // Thread 5093: 還好有大家 (life) - 0 replies
  // ============================================================
  console.log('[5093] 還好有大家');
  await insertReply(5093, '辛苦了\n遇到不講理的人真的很累\n但至少這裡可以說', '名無しさん', 4);
  await insertReply(5093, '承辦人員態度差很常見\n我之前去辦事也遇過\n深呼吸 不要跟他們一般見識', '名無しさん', 3.5);
  await insertReply(5093, '你有錄音嗎\n如果真的違法可以去投訴', '名無しさん', 3);
  await insertReply(5093, '抱抱\n有時候就是會遇到這種鳥事\n過了就過了', '名無しさん', 2.5);
  await insertReply(5093, '>>3\n公務機關可以打1999投訴\n私人機構的話看有沒有客服管道', '名無しさん', 2);

  // ============================================================
  // Thread 5045: Antigravity 裡的 opus (tech) - 5 replies
  // ============================================================
  console.log('[5045] Antigravity opus');
  await insertReply(5045, '我也覺得 Claude Code 比較好用\n直接在 terminal 操作比較順', '名無しさん', 2);
  await insertReply(5045, '>>4\n對 system prompt 影響很大\n有些平台會加很多限制', '名無しさん', 1.5);
  await insertReply(5045, 'Cursor 用的是自己微調過的模型\n跟原生 API 還是有差', '名無しさん', 1);
  await insertReply(5045, 'Opus 4.5 真的貴\n但寫程式的話 Sonnet 就很夠了\n除非很複雜的架構設計', '工程師', 0.5);

  // ============================================================
  // Thread 5157: 訂閱討論串功能 (meta) - 5 replies
  // ============================================================
  console.log('[5157] 訂閱功能');
  await insertReply(5157, '>>4\nRSS feed 也可以考慮\n老派但有效', '名無しさん', 1.5);
  await insertReply(5157, '瀏覽器通知也行\n但很多人會關掉就是了', '名無しさん', 1);
  await insertReply(5157, '支持這功能\n有些討論串後續發展很精彩\n但錯過就找不到了', '名無しさん', 0.5);

  // ============================================================
  // Thread 4562: 唐綺陽星座 (love) - 5 replies
  // ============================================================
  console.log('[4562] 唐綺陽星座');
  await insertReply(4562, '獅子座表示\n她說我今年事業運好\n希望是真的', '獅子座', 3);
  await insertReply(4562, '水瓶單身很久了\n看看今年有沒有機會', '名無しさん', 2.5);
  await insertReply(4562, '>>6\nconfirmation bias 也沒錯啦\n但聽聽還是開心', '名無しさん', 2);
  await insertReply(4562, '每年都說射手桃花旺\n結果我還是單身', '射手邊緣人', 1.5);

  // ============================================================
  // Thread 4544: 比特幣ETF (money) - 5 replies
  // ============================================================
  console.log('[4544] 比特幣ETF');
  await insertReply(4544, '組合基金的費用率一定比較高\n要看佔比多少', '名無しさん', 2);
  await insertReply(4544, '>>3\n有些人不想碰交易所\n怕被駭或忘記密碼', '名無しさん', 1.5);
  await insertReply(4544, '如果BTC佔比只有5%\n那買這個意義不大\n不如直接買純股票基金', '名無しさん', 1);
  await insertReply(4544, '觀望中\n先看看成分跟費用再說', '名無しさん', 0.5);

  // ============================================================
  // Thread 4556: Tinder直球戀愛 (love) - 5 replies
  // ============================================================
  console.log('[4556] Tinder報告');
  await insertReply(4556, '直球戀愛在台灣會嚇到人吧\n大家都習慣慢慢來', '名無しさん', 2);
  await insertReply(4556, '>>2\n已讀不回確實是一種答案\n但也很傷人就是', '名無しさん', 1.5);
  await insertReply(4556, '朋友影響力太真實了\n有些人根本是朋友在挑對象', '名無しさん', 1);
  await insertReply(4556, '希望直球戀愛成為主流\n曖昧太累了', '名無しさん', 0.5);

  // ============================================================
  // Thread 4538: 台股3萬點 (money) - 5 replies
  // ============================================================
  console.log('[4538] 台股3萬點');
  await insertReply(4538, '>>5\n定期定額真的是最穩的策略\n不用預測也不用緊張', '名無しさん', 2);
  await insertReply(4538, 'AI題材不會一年就結束\n長線來看還是樂觀\n但短線震盪要有心理準備', '名無しさん', 1.5);
  await insertReply(4538, '川普就是不確定因素\n關稅一打台灣出口商先中槍', '名無しさん', 1);
  await insertReply(4538, '世芯那個本益比\n追高的要小心', '名無しさん', 0.5);

  // ============================================================
  // Thread 4526: Alex Honnold 爬101 (news) - 5 replies
  // ============================================================
  console.log('[4526] Alex Honnold');
  await insertReply(4526, 'Free Solo 看完手心都是汗\n這人真的不是人', '名無しさん', 2);
  await insertReply(4526, '>>3\n台灣被世界看到了\n這種正面曝光超讚', '名無しさん', 1.5);
  await insertReply(4526, '他老婆的心臟一定很大顆\n嫁給這種人壓力超大', '名無しさん', 1);
  await insertReply(4526, 'Netflix紀錄片什麼時候上\n超想看', '名無しさん', 0.5);

  // ============================================================
  // Thread 4587: 買動漫旗艦店 (acg) - 5 replies
  // ============================================================
  console.log('[4587] 買動漫旗艦店');
  await insertReply(4587, '去過了\n書的種類很多\n但價格跟網路差不多', '名無しさん', 2);
  await insertReply(4587, '>>2\n有一些限定商品跟周邊\n這個網路買不到', '名無しさん', 1.5);
  await insertReply(4587, '咖啡區飲料普通\n但拍照打卡很適合', '名無しさん', 1);
  await insertReply(4587, '建議平日去\n假日人擠人逛不舒服', '名無しさん', 0.5);

  // ============================================================
  // Thread 584: 44歲母胎單身 (love) - 5 replies
  // ============================================================
  console.log('[584] 44歲母胎單身');
  await insertReply(584, '44歲也不算太老\n認識幾個朋友50幾歲才結婚', '名無しさん', 2);
  await insertReply(584, '緣分真的很難說\n有時候不強求反而會遇到', '名無しさん', 1.5);
  await insertReply(584, '>>6\n交友軟體真的詐騙很多\n但也有人在上面認識老婆', '名無しさん', 1);
  await insertReply(584, '先把自己生活過好\n其他的順其自然', '名無しさん', 0.5);

  // ============================================================
  // Thread 574: 我要加薪 (work) - 5 replies
  // ============================================================
  console.log('[574] 我要加薪');
  await insertReply(574, '>>6\n同意 老闆不會主動看到你的付出\n要自己爭取', '名無しさん', 2);
  await insertReply(574, '準備好你的戰績數據\n最好能量化\n然後找個好時機談', '名無しさん', 1.5);
  await insertReply(574, '如果公司制度不允許談薪\n那真的只能換了', '名無しさん', 1);
  await insertReply(574, '今年景氣還可以\n跳槽有機會加比較多', '名無しさん', 0.5);

  console.log('\n=== 完成 ===');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
