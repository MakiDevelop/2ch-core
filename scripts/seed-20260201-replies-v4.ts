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

  // ========== #5322 動漫旗艦店 (acg) ==========
  // 現有6則回覆, 補4則
  await insertReply(5322, '桂老師的展有去看過\\n畫風真的超細膩', '名無しさん', 38);
  await insertReply(5322, '>>7 咖啡區餐點價格如何\\n會不會踩雷', '名無しさん', 36);
  await insertReply(5322, '許昌街那邊蠻好找的\\n從M6出口走大概3分鐘', '名無しさん', 34);
  await insertReply(5322, '週末去人會很多嗎\\n想避開人潮', '名無しさん', 32);

  // ========== #4840 台股破32000 (money) ==========
  // 現有6則回覆, 補4則
  await insertReply(4840, '>>5 AI題材短期可能過熱\\n但長期趨勢還是向上', '名無しさん', 140);
  await insertReply(4840, '今年目標34000感覺不難\\n看外資態度', '名無しさん', 138);
  await insertReply(4840, '>>6 台積電法說會才是關鍵\\n業績展望決定後面走勢', '名無しさん', 136);
  await insertReply(4840, '手上滿倉的在笑\\n場外觀望的在哭', '股海老司機', 134);

  // ========== #4707 台積電2nm (tech) ==========
  // 現有6則回覆, 補4則
  await insertReply(4707, '>>4 蘋果A20晶片應該會用2nm\\n性能提升蠻期待的', '名無しさん', 142);
  await insertReply(4707, 'Intel自己都在找台積電代工了\\n真的沒辦法', '名無しさん', 140);
  await insertReply(4707, '>>6 AMD跟高通搶產能\\nNVIDIA也虎視眈眈', '名無しさん', 138);
  await insertReply(4707, '目標價2000的話\\n股利換算殖利率也太低', '名無しさん', 136);

  // ========== #4276 Intel Panther Lake (tech) ==========
  // 現有6則回覆, 補4則
  await insertReply(4276, '>>5 18A製程終於量產了\\nIntel股價能反彈嗎', '名無しさん', 144);
  await insertReply(4276, 'Core Ultra 3定位入門\\n效能別期待太高', '名無しさん', 142);
  await insertReply(4276, '>>6 主要看續航跟AI加速\\nNPU性能才是重點', '名無しさん', 140);
  await insertReply(4276, 'AMD跟高通壓力很大了\\n筆電市場競爭激烈', '名無しさん', 138);

  // ========== #4395 藥師少女特展 (acg) ==========
  // 現有6則回覆, 補4則
  await insertReply(4395, '貓貓氣偶超可愛\\n拍了一堆照片', '名無しさん', 146);
  await insertReply(4395, '>>5 周邊價格有點貴\\n但品質不錯', '名無しさん', 144);
  await insertReply(4395, '動畫第二季什麼時候啊\\n等得好辛苦', '名無しさん', 142);
  await insertReply(4395, '>>7 宮廷大門那個場景很適合拍照\\n人少的時候去最棒', '名無しさん', 140);

  // ========== #4354 病假10天新制 (work) ==========
  // 現有6則回覆, 補4則
  await insertReply(4354, '>>4 法規歸法規\\n台灣職場文化不是這樣玩的', '名無しさん', 148);
  await insertReply(4354, '我們公司直接說\\n超過3天要附診斷證明', '社畜', 146);
  await insertReply(4354, '>>6 主管那個眼神真的很有壓力\\n明明合法請假還要看臉色', '名無しさん', 144);
  await insertReply(4354, '大公司比較敢請\\n小公司根本不敢動', '名無しさん', 142);

  // ========== #4361 七成員工用AI (work) ==========
  // 現有6則回覆, 補4則
  await insertReply(4361, '>>5 我們公司連Excel都不會\\n導入AI是夢', '名無しさん', 150);
  await insertReply(4361, '蔡明忠講的沒錯\\n但基層有沒有被賦能才是重點', '名無しさん', 148);
  await insertReply(4361, '>>6 RPA用起來真的省很多時間\\n重複性工作交給機器', '名無しさん', 146);
  await insertReply(4361, '問題是導入AI後省下的人力\\n會不會變成裁員理由', '擔心ing', 144);

  // ========== #4368 Ella買SHE版權 (gossip) ==========
  // 現有6則回覆, 補4則
  await insertReply(4368, '>>5 這才是真愛團\\n自掏腰包買版權', '名無しさん', 152);
  await insertReply(4368, 'S.H.E的歌都是經典\\nSuper Star 我還會唱', '名無しさん', 150);
  await insertReply(4368, '>>6 華研應該不便宜\\n15首不知道花多少', '名無しさん', 148);
  await insertReply(4368, '希望其他歌手也能這樣\\n版權問題真的很複雜', '名無しさん', 146);

  console.log('回覆補充完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
