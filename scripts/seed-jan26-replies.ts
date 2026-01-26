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
  const result = await pool.query(
    `INSERT INTO posts (content, status, ip_hash, user_agent, parent_id, board_id, author_name, created_at)
     VALUES ($1, 0, $2, $3, $4, NULL, $5, NOW() - INTERVAL '1 hour' * $6)
     RETURNING id`,
    [content, generateIpHash(), randomUserAgent(), parentId, authorName, hoursAgo]
  );
  console.log(`  插入回覆 #${result.rows[0].id} (parent: ${parentId}, ${hoursAgo}h ago)`);
}

async function main() {
  console.log('=== 為稀缺討論串補充回覆 ===\n');

  // --- Thread 3768: 對工作已經厭倦到不行 (life, 1 reply) ---
  console.log('Thread 3768: 對工作已經厭倦到不行');
  await insertReply(3768, '>>3768\n被資遣還要被刁難 這公司有夠垃圾\n可以蒐集證據去勞工局申訴', '名無しさん', 18);
  await insertReply(3768, '睡不著真的很折磨\n建議找心理諮商聊聊 不要自己扛\n壓力太大的話身心科也可以先去看', '名無しさん', 16);
  await insertReply(3768, '>>3893\n不只壓力大 這根本職場霸凌了吧\n想逼人自願離職省資遣費 超常見的手法', '過來人', 14);
  await insertReply(3768, '先把所有對話紀錄截圖存好\nLINE訊息、email都是證據\n到時候勞資調解用得到', '名無しさん', 12);
  await insertReply(3768, '我之前也遇過類似的\n最後直接去勞工局 公司秒變態度\n該拿的一毛都不能少', '名無しさん', 8);

  // --- Thread 3715: 運動幣怎麼登記 (life, 4 replies) ---
  console.log('\nThread 3715: 運動幣怎麼登記');
  await insertReply(3715, '>>3718\n好像是二月中公布\n官網有寫時程', '名無しさん', 14);
  await insertReply(3715, '>>3719\n可以用在合作的運動場館\n健身房、游泳池都有', '名無しさん', 12);
  await insertReply(3715, '剛幫全家都登記了\n一個手機號碼只能一個人\n所以要分開用不同號碼', '名無しさん', 10);
  await insertReply(3715, '60萬份感覺還好\n上次動滋券抽籤率大概30%\n運動幣應該差不多', '名無しさん', 6);

  // --- Thread 3287: 絕區零還有人在玩嗎 (acg, 4 replies) ---
  console.log('\nThread 3287: 絕區零還有人在玩嗎');
  await insertReply(3287, '1.4版本新角超強\n回鍋打深淵很爽\n不過日常還是很肝', '名無しさん', 50);
  await insertReply(3287, '>>3289\n畫風跟戰鬥是真的頂\n但米哈遊的通病就是劇情節奏太慢', '名無しさん', 46);
  await insertReply(3287, '純休閒玩的話還行\n不要跟人比進度就沒壓力\n角色設計真的好看', 'ZZZ玩家', 40);
  await insertReply(3287, '>>3288\n後面主線確實好很多\n尤其第四章開始比較精彩', '名無しさん', 36);

  // --- Thread 3355: ONE OK ROCK大巨蛋場 (gossip, 4 replies) ---
  console.log('\nThread 3355: ONE OK ROCK大巨蛋場');
  await insertReply(3355, '搶票搶到快中風\n結果還是沒搶到 只好看別人拍的片段QQ', '名無しさん', 60);
  await insertReply(3355, '>>3357\nThe Beginning也超猛\n全場大合唱雞皮疙瘩', '名無しさん', 56);
  await insertReply(3355, '位子在三樓但還是很嗨\n音響比想像中好很多\n下次來一定要搶搖滾區', '名無しさん', 52);
  await insertReply(3355, '大巨蛋辦演唱會真的不錯\n就是散場交通有點崩\n捷運排了快一小時', '名無しさん', 48);
  await insertReply(3355, '>>3356\n我也是 喊到隔天說不出話\n但完全值得！', '名無しさん', 44);

  // --- Thread 3749: 有人試過double date嗎 (love, 4 replies) ---
  console.log('\nThread 3749: 有人試過double date嗎');
  await insertReply(3749, '>>3750\n看你朋友是什麼類型吧\n如果朋友太搶眼反而更慘', '名無しさん', 100);
  await insertReply(3749, '日本的合コン文化其實蠻成熟的\n台灣比較少這種 通常是朋友私下湊\n不過氣氛確實比較輕鬆', '名無しさん', 96);
  await insertReply(3749, '試過 蠻好玩的\n重點是活動要選對\n吃飯太正式 不如去密室逃脫或桌遊', '戀愛達人', 92);
  await insertReply(3749, '>>3752\n對 雙方都帶朋友比較自然\n不然一方有伴一方落單超尷尬', '名無しさん', 88);

  // --- Thread 3336: 搜尋功能可以再強化嗎 (meta, 3 replies) ---
  console.log('\nThread 3336: 搜尋功能可以再強化嗎');
  await insertReply(3336, '>>3337\n用Google搜也太克難了吧\n站內搜尋是基本功能啊', '名無しさん', 100);
  await insertReply(3336, '>>3338\n可以用 PostgreSQL 的 full text search\n不用另外裝 Elasticsearch 也能做', '名無しさん', 96);
  await insertReply(3336, '至少加個按版塊篩選\n有時候只想找特定版的文\n現在要自己一個一個版滑', '名無しさん', 90);
  await insertReply(3336, '希望可以搜尋回覆內容\n有時候記得某段話但忘記在哪篇', '名無しさん', 84);

  console.log('\n=== 完成！ ===');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
