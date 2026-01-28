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

  // === Thread 4910: 有毒的環境 (life) ===
  // OP=1, 4911=2
  console.log('Thread 4910: 有毒的環境');
  await insertReply(4910, `離職還被刁難真的最噁心\n公司就是想逼你自己走不給資遣費吧`, '名無しさん', 4);
  await insertReply(4910, `>>2 這種公司一定要留證據\n對話紀錄、email都存好\n以後打官司用得到`, '名無しさん', 3);
  await insertReply(4910, `辛苦了QQ\n這種時候朋友真的很重要\n有人拉你一把才能撐過去`, '名無しさん', 2);
  await insertReply(4910, `去勞工局檢舉啊\n這種職場霸凌有在管的`, '名無しさん', 2);
  await insertReply(4910, `>>1\n到處說壞話是毀謗罪喔\n保留證據可以告回去`, '有經驗的', 1);

  // === Thread 4890: 自稱重感情，其實只是怕沒人要 (love) ===
  // OP=1, 4891=2, 4892=3, 4893=4, 4894=5, 4895=6
  console.log('Thread 4890: 自稱重感情');
  await insertReply(4890, `>>4 分不乾淨那段真的戳中要害\n說什麼還是朋友 其實就是留退路`, '名無しさん', 8);
  await insertReply(4890, `這種人通常都長得不錯\n不然哪來的本錢腳踏多條船`, '名無しさん', 6);
  await insertReply(4890, `遇過一個 糾纏三年\n最後發現他同時跟四個人聊天\n每個都說「妳最特別」`, '過來人', 5);
  await insertReply(4890, `>>6 貪這個字精準\n就是什麼好處都要 什麼責任都閃`, '名無しさん', 4);

  // === Thread 4854: 曹西平告別式 (gossip) ===
  // OP=1, 4855=2, 4856=3, 4857=4, 4858=5, 4859=6
  console.log('Thread 4854: 曹西平告別式');
  await insertReply(4854, `>>3 對啊 他在節目上雖然毒舌\n但聽說私下很照顧後輩`, '名無しさん', 10);
  await insertReply(4854, `小時候看康熙來了他超好笑\n那個年代的綜藝真的比較有梗`, '八年級', 8);
  await insertReply(4854, `66歲真的算年輕\n好好照顧身體很重要`, '名無しさん', 6);
  await insertReply(4854, `他罵張菲那段經典\n現在很少有人敢那樣講話了`, '名無しさん', 4);

  // === Thread 4695: 土方之亂 (life) ===
  // OP=1, 4696=2, 4697=3, 4698=4, 4699=5, 4700=6
  console.log('Thread 4695: 土方之亂');
  await insertReply(4695, `做工程的朋友說現在根本接不了案\n手續太繁瑣了`, '名無しさん', 12);
  await insertReply(4695, `>>3 管制本意是好的\n但不能一次全面禁止\n應該要有緩衝期`, '名無しさん', 10);
  await insertReply(4695, `房價要跌了（X）\n蓋更慢房更少價更高（O）`, '名無しさん', 8);
  await insertReply(4695, `>>5 說要增加暫置場\n但到現在還沒看到具體進度`, '名無しさん', 6);
  await insertReply(4695, `裝潢延期真的很慘\n租房子又要多付幾個月`, '名無しさん', 4);

  // === Thread 4732: 台灣要搞主權AI (tech) ===
  // OP=1, 4733=2, 4734=3, 4735=4, 4736=5, 4737=6
  console.log('Thread 4732: 台灣主權AI');
  await insertReply(4732, `>>2 簡單說就是自己養AI\n不用看美國臉色`, '名無しさん', 10);
  await insertReply(4732, `重點是算力\n台灣電力夠不夠是問題`, '名無しさん', 8);
  await insertReply(4732, `>>5 TAIDE那個好像是繁體中文模型\n表現聽說還可以`, '名無しさん', 6);
  await insertReply(4732, `說真的 敏感資料不能放國外這點很重要\n軍事、外交相關的更是`, '資安仔', 5);
  await insertReply(4732, `歐洲也在推Mistral\n就是不想被OpenAI壟斷`, '名無しさん', 3);

  // === Thread 4657: 夜間模式 (meta) ===
  // OP=1, 4658=2, 4659=3, 4660=4, 4661=5, 4662=6
  console.log('Thread 4657: 夜間模式');
  await insertReply(4657, `真的需要+1\n半夜滑手機眼睛會痛`, '名無しさん', 14);
  await insertReply(4657, `>>5 Dark Reader有時候會讓圖片反色\n變得很奇怪`, '名無しさん', 12);
  await insertReply(4657, `站長有在看嗎？\n這功能應該不難做`, '名無しさん', 8);
  await insertReply(4657, `OLED螢幕用深色主題還可以省電\n一舉兩得`, '名無しさん', 5);

  console.log('\n回覆補充完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
