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

  // 討論串 7327: 交接中的同事 (work版, 0則回覆)
  console.log('補充討論串 7327 (交接中的同事)...');
  await insertReply(7327, '這種就是擺爛交接\n根本不想教', '名無しさん', 2);
  await insertReply(7327, '>>1\n可以跟主管反應嗎', '名無しさん', 4);
  await insertReply(7327, '遇過更扯的\n交接文件一個字都不寫', '過來人', 6);

  // 討論串 1305: 如何和中情局聯絡 (chat版, 7則回覆)
  console.log('補充討論串 1305 (如何和中情局聯絡)...');
  await insertReply(1305, '>>8\n直接去美國在台協會走一趟（誤', '名無しさん', 168);
  await insertReply(1305, '這串怎麼越來越歪www', '名無しさん', 170);

  // 討論串 1312: 選秀節目評審標準 (gossip版, 7則回覆)
  console.log('補充討論串 1312 (選秀節目評審標準)...');
  await insertReply(1312, '所以才說選秀節目不要太認真看\n都是劇本', '名無しさん', 216);
  await insertReply(1312, '>>8\n這就是現實啊\n殘酷但真實', '名無しさん', 218);
  await insertReply(1312, '有些實力派後來自己出專輯更紅\n不一定要靠節目', '名無しさん', 220);

  // 討論串 3776: 今年跨年是不是特別無感 (chat版, 7則回覆)
  console.log('補充討論串 3776 (今年跨年是不是特別無感)...');
  await insertReply(3776, '>>7\n還沒老好嗎！只是懶而已', '名無しさん', 360);
  await insertReply(3776, '不想人擠人\n在家看直播比較舒服', '宅宅', 362);
  await insertReply(3776, '今年煙火好像也沒特別精彩', '名無しさん', 364);
  await insertReply(3776, '>>2\n+1 疫情改變很多習慣', '名無しさん', 366);

  // 討論串 1209: 北七欸www (chat版, 7則回覆)
  console.log('補充討論串 1209 (北七欸www)...');
  await insertReply(1209, '這水壓也太不穩定XDDD', '名無しさん', 240);
  await insertReply(1209, '>>8\n應該是熱水器的問題', '名無しさん', 242);

  // 討論串 1199: 許功蓋 (chat版, 7則回覆)
  console.log('補充討論串 1199 (許功蓋)...');
  await insertReply(1199, '>>8\n長知識了\n原來是Big5的坑', '名無しさん', 240);
  await insertReply(1199, '這論壇應該是UTF-8吧\n不會有這問題', '工程師', 242);
  await insertReply(1199, '許、功、蓋 www\n經典三字', '名無しさん', 244);

  // 討論串 3326: 有深色模式嗎 (meta版, 7則回覆)
  console.log('補充討論串 3326 (有深色模式嗎)...');
  await insertReply(3326, '>>7\n對 跟隨系統最方便', '名無しさん', 336);
  await insertReply(3326, '現在還沒有嗎\n我也想要深色模式', '名無しさん', 338);

  // 討論串 3126: 可以新增寵物版嗎 (meta版, 7則回覆)
  console.log('補充討論串 3126 (可以新增寵物版嗎)...');
  await insertReply(3126, '>>7\n支持！領養資訊很實用', '名無しさん', 456);
  await insertReply(3126, '寵物版+1\n可以分享貓貓狗狗照片', '貓奴', 458);
  await insertReply(3126, '>>4\n美食版也不錯欸', '吃貨', 460);

  // 討論串 1306: 建議新增暗黑模式 (meta版, 7則回覆)
  console.log('補充討論串 1306 (建議新增暗黑模式)...');
  await insertReply(1306, '>>4\n真的有月亮按鈕嗎\n我怎麼沒看到', '名無しさん', 240);
  await insertReply(1306, '我用Dark Reader插件\n效果還不錯', '名無しさん', 242);

  // 討論串 1307: 手機版排版跑掉了 (meta版, 7則回覆)
  console.log('補充討論串 1307 (手機版排版跑掉了)...');
  await insertReply(1307, '>>5\n站長辛苦了！', '名無しさん', 240);
  await insertReply(1307, '現在修好了嗎', '名無しさん', 242);
  await insertReply(1307, '>>8\nChrome手機版也是', '名無しさん', 244);

  // 討論串 1308: 可以新增收藏功能嗎 (meta版, 7則回覆)
  console.log('補充討論串 1308 (可以新增收藏功能嗎)...');
  await insertReply(1308, '>>8\n分類功能+1\n現在收藏太多找不到', '名無しさん', 240);
  await insertReply(1308, '希望能匯出收藏清單', '名無しさん', 242);

  // 討論串 1199 額外補充（這串很有趣，再多補一則）
  await insertReply(1199, '功蓋院育會坑疊www', '名無しさん', 246);

  // 討論串 1305 額外補充
  await insertReply(1305, '這串越討論越危險www', '圍觀群眾', 172);

  console.log('完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
