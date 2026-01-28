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

  // Thread 4890: 自稱重感情,其實只是怕沒人要 (0 replies -> 新增5則)
  console.log('補充討論串 4890 (love版 - 多重關係批判)...');
  await insertReply(4890, '說到心坎裡了\n這種人最可怕的是他們自己都不覺得有問題', '名無しさん', 2);
  await insertReply(4890, '>>1\n對 而且還會說「我就是太善良了才不想傷害人」\n噁心到爆', '受害者', 3.5);
  await insertReply(4890, '分不乾淨真的是最沒品的行為\n要嘛分手要嘛在一起 搞曖昧幹嘛', '名無しさん', 5);
  await insertReply(4890, '這種人就是情感吸血鬼\n只會索取從不付出', '名無しさん', 6.5);
  await insertReply(4890, '>>2 +1\n而且都會把問題推給「我也不知道自己要什麼」\n其實根本就是貪', '名無しさん', 8);

  // Thread 4768: 我們終究會活成自己最討厭的樣子 (5 replies -> 新增3則)
  console.log('補充討論串 4768 (chat版 - 人生變化)...');
  await insertReply(4768, '>>5\n這個觀點不錯\n可能不是變成討厭的樣子 而是理解了當初的無奈', '名無しさん', 14);
  await insertReply(4768, '我以前超討厭那種在家族群組轉長輩圖的人\n結果現在也開始轉了...', '名無しさん', 16);
  await insertReply(4768, '>>6 哈哈哈笑死\n我也是 以前覺得超low 現在覺得還蠻溫馨的', '名無しさん', 17.5);

  // Thread 4819: 過年見家長 對方家族一直打麻將我好尷尬 (5 replies -> 新增4則)
  console.log('補充討論串 4819 (love版 - 過年麻將)...');
  await insertReply(4819, '>>3 推這個\n男友應該要幫你解圍或教你打\n不然就別一起去', '名無しさん', 12.5);
  await insertReply(4819, '其實不會打麻將也可以幫忙做其他事\n幫忙準備點心飲料 阿姨們會覺得你很貼心', '名無しさん', 14);
  await insertReply(4819, '>>5 +1 神來也真的好用\nAI陪打很快就會了 過年前惡補還來得及', '麻將新手', 15.5);
  await insertReply(4819, '我第一年也是被晾在旁邊\n後來跟男友溝通 他才意識到這樣不對\n建議直接講開比較好', '名無しさん', 17);

  // Thread 4689: 35歲母胎單身 是我的問題嗎 (5 replies -> 新增4則)
  console.log('補充討論串 4689 (love版 - 單身議題)...');
  await insertReply(4689, '>>4 說得好\n現在離婚率這麼高 單身反而是保護自己', '名無しさん', 4.5);
  await insertReply(4689, '我覺得35歲還有機會啊\n我表姊38歲才結婚 現在過得超幸福', '名無しさん', 6);
  await insertReply(4689, '>>1 不要被社會壓力綁架\n真的不適合硬湊一對也只是痛苦而已', '名無しさん', 7.5);
  await insertReply(4689, '過年被問真的很煩+1\n但如果遇到喜歡的人還是要試試看\n不要到40歲才後悔', '過來人', 9);

  console.log('✓ 回覆補充完成！');
  console.log('  - Thread 4890: +5 replies');
  console.log('  - Thread 4768: +3 replies');
  console.log('  - Thread 4819: +4 replies');
  console.log('  - Thread 4689: +4 replies');
  console.log('  總計新增 16 則回覆');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
