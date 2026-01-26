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
  console.log('=== 為稀缺討論串補充回覆 (v2) ===\n');

  // --- Thread 3733: 引用功能可以顯示預覽嗎 (meta, 4 replies) ---
  console.log('Thread 3733: 引用功能可以顯示預覽嗎');
  await insertReply(3733, '>>3736\n手機可以做成長按展開\n或是直接在引用下面顯示縮短版的原文', '名無しさん', 82);
  await insertReply(3733, '這功能Reddit有做\n滑鼠移到上面就顯示原文\n體驗差很多', '名無しさん', 78);
  await insertReply(3733, '>>3737\n對 點擊展開最符合手機操作\nhover只適合電腦端', '前端仔', 74);
  await insertReply(3733, '現在引用要自己上去翻真的很不方便\n尤其回覆超過20樓的討論串\n希望站長加油', '名無しさん', 68);

  // --- Thread 3738: 會出APP嗎 (meta, 4 replies) ---
  console.log('\nThread 3738: 會出APP嗎');
  await insertReply(3738, '>>3739\nPWA +1 加到桌面就像APP了\n而且不用過審核', '名無しさん', 82);
  await insertReply(3738, '原生APP上架要錢\niOS每年3000多 Android一次性25美金\n小站吃不消', '名無しさん', 76);
  await insertReply(3738, '>>3742\n推播用 Web Push API 就能做\n不一定要原生APP', '工程師路過', 70);
  await insertReply(3738, '其實手機網頁體驗做好就好了\n不要什麼都想做APP\n維護成本超高', '名無しさん', 64);

  // --- Thread 3260: 可以有固定暱稱功能嗎 (meta, 4 replies) ---
  console.log('\nThread 3260: 可以有固定暱稱功能嗎');
  await insertReply(3260, '>>3261\n匿名跟記住暱稱不衝突吧\n又不是要你用真名', '名無しさん', 110);
  await insertReply(3260, '>>3262\n自動填入有時候會填錯格\n還是站內記住比較好', '名無しさん', 104);
  await insertReply(3260, '>>3264\n選用功能最好 大家各取所需\n不想登入就繼續匿名', '名無しさん', 98);
  await insertReply(3260, 'localStorage存就好了\n不用後端做任何事\n純前端就能實現', '名無しさん', 90);

  // --- Thread 1169: 既然都已經想得這麼完整了 (work, 4 replies) ---
  console.log('\nThread 1169: 既然都已經想得這麼完整了');
  await insertReply(1169, '>>1278\n對 不給加班費就截圖存證\n勞基法站在勞工這邊', '名無しさん', 130);
  await insertReply(1169, '這種靈魂拷問式的主管超多\n自己不做功課 丟給下面的人\n然後再挑毛病', '名無しさん', 120);
  await insertReply(1169, '>>1247\n真的 自己不想扛責任\n還要你晚上十點多回訊息', '名無しさん', 110);
  await insertReply(1169, '我之前也遇過這種\n後來直接已讀不回 下班就是下班\n結果主管反而沒事了 根本只是在刷存在感', '職場老鳥', 100);

  // --- Thread 779: 有人在看電競比賽嗎 (acg, 4 replies) ---
  console.log('\nThread 779: 有人在看電競比賽嗎');
  await insertReply(779, '>>781\nValorant的VCT也超好看\n日本隊伍今年很強', '名無しさん', 230);
  await insertReply(779, '推薦看LCK 韓國賽區水準最高\n解說也很專業\n配合看Twitch聊天室更有氣氛', '電競仔', 224);
  await insertReply(779, '>>780\nT1 Faker是真的神\n打了這麼多年還是頂尖', '名無しさん', 218);
  await insertReply(779, '我從S3開始看到現在\n電競已經不是以前被說打電動浪費時間的年代了\n世界賽獎金池都幾千萬美金', '名無しさん', 212);

  // --- Thread 1142: 有很多 PoC 的討論 (work, 4 replies) ---
  console.log('\nThread 1142: 有很多 PoC 的討論');
  await insertReply(1142, '>>1395\n笑死 Proof of Conversation 這個太精闢了\n完全戳中痛點', '名無しさん', 180);
  await insertReply(1142, '看完整篇文 感覺就是職場版的\n「大家討論得很開心 但什麼都沒決定」\n超有既視感', '名無しさん', 170);
  await insertReply(1142, '>>1156\n但如果PoC永遠停在conversation\n那也學不到什麼實戰經驗吧', '名無しさん', 160);
  await insertReply(1142, '我司也是這樣\n每週開PoC會議 開了半年\n最後結論是「再研究看看」', '同病相憐', 150);
  await insertReply(1142, '原PO的文筆很好\n把那種無奈用很委婉的方式表達出來\n最後一段日文更是畫龍點睛', '名無しさん', 140);

  console.log('\n=== 完成！ ===');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
