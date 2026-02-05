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

  // 7865 - 台北國際動漫節（已有6則回覆）
  console.log('處理討論串 7865 (動漫節)...');
  await insertReply(7865, '排隊排到腿痠，但看到喜歡的周邊還是值得', '名無しさん', 13);
  await insertReply(7865, '>>4\n恭喜！我都沒抽到QQ', '名無しさん', 12);

  // 7815 - 暗網販毒（已有6則回覆）
  console.log('處理討論串 7815 (暗網販毒)...');
  await insertReply(7815, '台大出來的結果做這種事，家人應該很崩潰', '名無しさん', 11);
  await insertReply(7815, '>>2\n33億根本是國際級犯罪集團的規模了', '名無しさん', 10);

  // 7915 - 雙囍電影（已有6則回覆）
  console.log('處理討論串 7915 (雙囍電影)...');
  await insertReply(7915, '>>5\n好像是講雙胞胎的故事，懸疑劇情', '名無しさん', 9);
  await insertReply(7915, '預告看起來蠻有質感的，不像爛片', '名無しさん', 8);

  // 7878 - 2月遊戲（已有6則回覆）
  console.log('處理討論串 7878 (2月遊戲)...');
  await insertReply(7878, '2月就專心清積壓遊戲吧，反正沒大作', '名無しさん', 9);
  await insertReply(7878, '>>4\nNS的話有《Unicorn Overlord》可以期待', '名無しさん', 8);

  // 7795 - 海鯤艦（已有6則回覆）
  console.log('處理討論串 7795 (海鯤艦)...');
  await insertReply(7795, '>>6\n真的，一艘就要幾百億', '名無しさん', 9);
  await insertReply(7795, '希望後續還有海鯤二號、三號繼續建造', '名無しさん', 8);

  // 7893 - 寒流獨居（已有6則回覆）
  console.log('處理討論串 7893 (寒流獨居)...');
  await insertReply(7893, '>>5\n我也是，有時候想打電話回家但又怕吵到家人', '名無しさん', 8);
  await insertReply(7893, '抱個抱枕會好一點，至少有溫暖的感覺', '名無しさん', 7);
  await insertReply(7893, '>>2\n電暖器真的有用，我最近也買了一台', '名無しさん', 6);

  // 7944 - 台股（已有6則回覆）
  console.log('處理討論串 7944 (台股)...');
  await insertReply(7944, '新手的話建議先從 ETF 入門，0050 或 0056', '名無しさん', 6);
  await insertReply(7944, '>>3\n對，現在追高風險很大', '名無しさん', 5);

  // 7922 - 江蕙演唱會（已有6則回覆）
  console.log('處理討論串 7922 (江蕙演唱會)...');
  await insertReply(7922, '>>4\n記得上次看到3000-8000不等', '名無しさん', 7);
  await insertReply(7922, '我爸媽超想去，可惜搶不到票', '名無しさん', 6);

  // 7858 - 最低工資（已有6則回覆）
  console.log('處理討論串 7858 (最低工資)...');
  await insertReply(7858, '>>5\n真的，不然只是基層薪資被壓縮', '名無しさん', 7);
  await insertReply(7858, '物價一直漲，薪資也要跟上才合理', '名無しさん', 6);

  // 7802 - 對台軍售（已有6則回覆）
  console.log('處理討論串 7802 (對台軍售)...');
  await insertReply(7802, '>>6\n哈哈哈被點名的感覺', '名無しさん', 5);
  await insertReply(7802, '美國不會因為習近平說一句話就停軍售啦', '名無しさん', 4);

  // 7908 - 九把刀新片（已有6則回覆）
  console.log('處理討論串 7908 (九把刀新片)...');
  await insertReply(7908, '>>5\n希望這次能做好，不要又被罵特效粗糙', '名無しさん', 5);
  await insertReply(7908, '3億應該有一定品質了，期待', '名無しさん', 4);

  // 7837 - 波士頓動力（已有6則回覆）
  console.log('處理討論串 7837 (波士頓動力)...');
  await insertReply(7837, '>>2\n工廠工人確實要開始轉型了', '名無しさん', 6);
  await insertReply(7837, 'Atlas 的動作真的越來越像人了，有點可怕', '名無しさん', 5);

  console.log('完成！已為 12 個討論串補充回覆');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
