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

  // === 5882: 沈玉琳抗癌成功 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 沈玉琳抗癌成功 2-3月可望復出');

  await insertReply(5882,
    '詹惟中真的很挺他\n命理師的友情很堅定',
    '名無しさん', 5);

  await insertReply(5882,
    '>>7 等復出的那天要收看\n綜藝圈好久沒有這種好消息了',
    '名無しさん', 4);

  await insertReply(5882,
    '他老婆這段時間應該壓力很大\n撐住不容易',
    '名無しさん', 3);

  await insertReply(5882,
    '血癌真的是鬼門關\n能康復就是奇蹟',
    '過來人', 2);

  // === 5847: 病假新制上路 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 病假新制上路 請10天內不能扣考績');

  await insertReply(5847,
    '>>7 診斷證明一張200-300\n生病還要多花錢',
    '名無しさん', 6);

  await insertReply(5847,
    '重點是勞檢人力不夠\n違法成本太低',
    '名無しさん', 5);

  await insertReply(5847,
    '>>5 勞檢員一個月才查幾家\n全台幾十萬家公司',
    '名無しさん', 4);

  await insertReply(5847,
    '外商這點真的好很多\n病假就是病假 沒人給你臉色看',
    '科技業', 3);

  await insertReply(5847,
    '>>9 可是也不是人人能進外商\n大部分還是在中小企業受苦',
    '名無しさん', 2);

  // === 5660: 黃國昌新北競總 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 黃國昌新北競總成立 趙少康喊藍白一定合');

  await insertReply(5660,
    '新北選情比台北還複雜\n蘇巧慧地方經營也很久了',
    '名無しさん', 6);

  await insertReply(5660,
    '>>5 侯友宜這八年真的做很多建設\n下一任藍營壓力超大',
    '名無しさん', 5);

  await insertReply(5660,
    '國昌的問題是太學者\n一般民眾不吃這套',
    '政治觀察', 4);

  await insertReply(5660,
    '>>8 學者怎麼了\n至少講話有邏輯',
    '名無しさん', 3);

  await insertReply(5660,
    '藍白不管誰讓 另一邊粉都會爆\n所以我覺得合不成',
    '名無しさん', 2);

  // === 5682: 台股上週跌472點 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 台股上週跌472點 32000守得住嗎');

  await insertReply(5682,
    '現在買股票不如買美債\n殖利率還不錯',
    '名無しさん', 6);

  await insertReply(5682,
    '>>5 台積電本益比還在15倍左右\n其實不算貴',
    '名無しさん', 5);

  await insertReply(5682,
    '股版一堆人喊空結果一路軋\n現在又在喊多了',
    '名無しさん', 4);

  await insertReply(5682,
    '>>7 散戶反指標\n大家看多就要小心',
    '老股民', 3);

  await insertReply(5682,
    '每次跌都說要崩\n結果又創新高',
    '名無しさん', 2);

  // === 5868: 物價到底漲多少 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 物價到底漲多少 92%民眾改變消費習慣');

  await insertReply(5868,
    '房租漲最多\n不列入CPI根本沒意義',
    '租屋族', 6);

  await insertReply(5868,
    '>>6 幸福指數統計也很迷\n誰幸福了',
    '名無しさん', 5);

  await insertReply(5868,
    '現在去全聯買菜都要算半天\n以前都是隨便拿',
    '名無しさん', 4);

  await insertReply(5868,
    '手搖飲都戒了\n一杯60太貴',
    '名無しさん', 3);

  await insertReply(5868,
    '>>9 以前大杯25元的年代回不去了',
    '名無しさん', 2);

  // === 5889: 育嬰假改成可以單日請 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 育嬰假改成可以單日請');

  await insertReply(5889,
    '這個真的德政\n小孩發燒不用請一整個月',
    '名無しさん', 6);

  await insertReply(5889,
    '>>6 問題是請太多次一樣被盯\n台灣職場文化就這樣',
    '名無しさん', 5);

  await insertReply(5889,
    '男生敢請育嬰假的還是少數\n多數還是女生請',
    '名無しさん', 4);

  await insertReply(5889,
    '>>9 我有請過\n主管雖然臉臭但沒說什麼',
    '新手爸爸', 3);

  await insertReply(5889,
    '希望生育率能提高一點\n現在少子化太嚴重',
    '名無しさん', 2);

  console.log('\n✅ 已為 6 個討論串新增共 26 則回覆');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
