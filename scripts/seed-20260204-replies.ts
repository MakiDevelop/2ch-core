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
  console.log('開始補充回覆...\n');

  // ===== 6117: 牛肉麵 vs 牛肉湯餃（chat, 現有1則回覆）=====
  // OP=1, 現有回覆「晚餐的話湯餃」=2
  await insertReply(6117, '牛肉麵啊 這還要想？\n湯餃吃完沒飽足感', '名無しさん', 18);
  await insertReply(6117, '>>2\n湯餃派+1\n而且熱量比較低（自我安慰', '名無しさん', 14);
  await insertReply(6117, '兩個都點 問題解決\n選擇困難的最佳解法就是全都要', '名無しさん', 10);
  await insertReply(6117, '看天氣決定\n冷的話牛肉麵 熱的話湯餃\n今天9度當然是牛肉麵', '名無しさん', 6);
  console.log('✓ 6117: 牛肉麵vs湯餃 +4');

  // ===== 6151: 空屋建案問題（chat, 現有1則回覆）=====
  // OP=1, 現有回覆「建商會先花錢」=2
  await insertReply(6151, '>>2\n對 等住戶不夠的時候管理費就會很高\n我朋友的社區入住率不到三成 管理費一戶快四千', '名無しさん', 16);
  await insertReply(6151, '投資客買來放著等漲\n根本不在乎管理費\n反正最後都是轉嫁給自住戶', '名無しさん', 12);
  await insertReply(6151, '少子化是事實 但北漂族也是事實\n鄉下空屋多 台北還是一堆人搶\n問題是分配不均', '名無しさん', 8);
  await insertReply(6151, '建商蓋房子是因為有利潤\n賣不掉就降價 但他們寧可養蚊子也不降\n台灣房市就是這麼畸形', '憤怒的無殼蝸牛', 4);
  console.log('✓ 6151: 空屋建案 +4');

  // ===== 6154: 過年上班（work, 0 replies）=====
  // OP=1
  await insertReply(6154, '我也是 寧可上班\n至少有加班費\n回家只有被問薪水和對象', '名無しさん', 20);
  await insertReply(6154, '>>1\n真的 塞在國五上三個小時只為了吃一頓飯\n不如在家叫外送看Netflix', '名無しさん', 16);
  await insertReply(6154, '服務業表示：你們還有得選喔？', '名無しさん', 12);
  await insertReply(6154, '>>3\n辛苦了QQ\n不過過年上班薪水是雙倍吧', '名無しさん', 8);
  await insertReply(6154, '我公司直接排班要我值守\n說是「彈性休假」\n結果放假天數比平常還少', '社畜本人', 4);
  console.log('✓ 6154: 過年上班 +5');

  // ===== 6158: 9度冷天（chat, 現有1則回覆）=====
  // OP=1, 現有回覆「早上真的有冷到」=2
  await insertReply(6158, '週末還有強烈冷氣團\n北部要跌破10度\n才剛回暖就又來', '名無しさん', 14);
  await insertReply(6158, '台北騎車上班手快凍掉\n羽絨外套+防風手套還是冷', '名無しさん', 10);
  await insertReply(6158, '>>2\n南部人表示不懂什麼叫9度\n我們這邊還穿短袖', '高雄人', 6);
  await insertReply(6158, '>>5\n炫耀什麼啦 等夏天40度再來說', '名無しさん', 3);
  console.log('✓ 6158: 9度冷天 +4');

  // ===== 6160: 勇敢影片（life, 0 replies）=====
  // OP=1
  await insertReply(6160, '謝謝分享\n最近也是壓力大到不行\n看完覺得好一點了', '名無しさん', 18);
  await insertReply(6160, '有時候就是需要被提醒\n你已經很努力了\n不用對自己那麼嚴格', '名無しさん', 14);
  await insertReply(6160, '推\n每個人都在撐著自己的世界\n外表看不出來而已', '名無しさん', 10);
  await insertReply(6160, '>>1\n加油 能意識到自己需要力量\n本身就是很勇敢的事', '路過的', 6);
  console.log('✓ 6160: 勇敢影片 +4');

  console.log('\n✅ 完成！共為 5 個討論串補充 21 則回覆');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
