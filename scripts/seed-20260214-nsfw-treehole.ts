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

async function getBoardId(slug: string): Promise<number | null> {
  const result = await pool.query('SELECT id FROM boards WHERE slug = $1', [slug]);
  return result.rows[0]?.id || null;
}

async function insertThread(
  boardSlug: string,
  title: string,
  content: string,
  authorName: string = '名無しさん',
  hoursAgo: number = 2
): Promise<number> {
  const boardId = await getBoardId(boardSlug);
  if (!boardId) throw new Error(`Board not found: ${boardSlug}`);
  const result = await pool.query(
    `INSERT INTO posts (title, content, status, ip_hash, user_agent, board_id, author_name, created_at)
     VALUES ($1, $2, 0, $3, $4, $5, $6, NOW() - INTERVAL '1 hour' * $7)
     RETURNING id`,
    [title, content, generateIpHash(), randomUserAgent(), boardId, authorName, hoursAgo]
  );
  return result.rows[0].id;
}

async function main() {
  console.log('開始 seed 成人板種子討論串（樹洞模式）...');

  // seed_goal: emotional_release — 關係疏離型
  const t1 = await insertThread(
    'nsfw',
    '在一起很久了 但已經很久沒有碰彼此了',
    `交往快五年了\n結婚兩年\n\n不是吵架 不是不愛\n就是...不知道從什麼時候開始\n回到家就是各自滑手機\n然後說晚安 然後睡覺\n\n有時候躺在旁邊 明明距離很近\n但覺得好遠\n\n我不知道是我的問題還是這就是正常的\n朋友都說婚後本來就這樣\n但我總覺得不應該是這樣\n\n有人也是嗎`,
    '名無しさん',
    18
  );
  console.log(`  [1] 關係疏離型 thread id: ${t1}`);

  // seed_goal: seeking_understanding — 慾望羞愧型
  const t2 = await insertThread(
    'nsfw',
    '有些想法不敢跟任何人說',
    `不是什麼犯法的事\n但就是有一些...幻想\n\n每次想完就覺得自己很奇怪\n然後上網查 發現好像也有人這樣\n但現實中完全不敢講\n\n交往對象也不敢說\n怕對方覺得我有問題\n\n有時候覺得\n人跟人之間最難說出口的\n不是秘密 是慾望\n\n匿名才敢打這些字`,
    '名無しさん',
    14
  );
  console.log(`  [2] 慾望羞愧型 thread id: ${t2}`);

  // seed_goal: life_confusion — 壓力無慾型
  const t3 = await insertThread(
    'nsfw',
    '工作忙到完全沒有慾望 這正常嗎',
    `最近半年換了新工作\n壓力大到每天回家只想倒頭就睡\n\n以前不是這樣的\n但現在真的什麼感覺都沒有\n另一半有時候會暗示\n我都裝作沒聽到 或說太累了\n\n其實不是不想\n是真的沒有那個心情\n連自己都覺得自己怪怪的\n\n這是年紀的問題嗎\n還是我壞掉了`,
    '名無しさん',
    10
  );
  console.log(`  [3] 壓力無慾型 thread id: ${t3}`);

  // seed_goal: quiet_question — 單身孤獨型
  const t4 = await insertThread(
    'nsfw',
    '單身久了 其實最難的是晚上',
    `白天很好 忙工作忙生活\n可以假裝一切都很充實\n\n但晚上回到家\n一個人吃飯 一個人洗碗\n一個人看劇看到睡著\n\n不是想要性\n是想要有人在旁邊\n那種有體溫的感覺\n\n朋友說去交友軟體滑\n我試過 但每次聊到後來都很累\n大家都在演\n\n算了 今天又是一個人的深夜\n打開這裡隨便寫寫`,
    '名無しさん',
    6
  );
  console.log(`  [4] 單身孤獨型 thread id: ${t4}`);

  console.log('\n成人板種子完成：4 串，無回覆（等真人或 add-replies 補位）');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
