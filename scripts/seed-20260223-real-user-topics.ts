#!/usr/bin/env tsx
/**
 * 2026-02-23 開新串：呼應真人用戶關注的話題
 *
 * 5 個新串，各自帶 2-3 則回覆：
 * 1. work - 開工第一天就想離職 (呼應 e90665ba, 131c69f5)
 * 2. work - AI工具用了之後工作量反而變多 (呼應 e90665ba, 908b3ccd)
 * 3. chat - 過年最怕聽到哪句話 (呼應 b6ad7194, 131c69f5)
 * 4. life - 離職之後才知道的事 (呼應 e90665ba, 908b3ccd)
 * 5. tech - HomeLab玩家都在跑什麼 (呼應 d8855fbf)
 */

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
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_2_ like Mac OS X) AppleWebKit/605.1.15',
];

function randomUA(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

async function getBoardId(slug: string): Promise<number> {
  const result = await pool.query('SELECT id FROM boards WHERE slug = $1', [slug]);
  if (result.rows.length === 0) throw new Error(`Board not found: ${slug}`);
  return result.rows[0].id;
}

async function insertThread(
  boardSlug: string, title: string, content: string,
  authorName: string = '名無しさん', hoursAgo: number = 2
): Promise<number> {
  const boardId = await getBoardId(boardSlug);
  const result = await pool.query(
    `INSERT INTO posts (title, content, status, ip_hash, user_agent, board_id, author_name, created_at)
     VALUES ($1, $2, 0, $3, $4, $5, $6, NOW() - INTERVAL '1 hour' * $7)
     RETURNING id`,
    [title, content, generateIpHash(), randomUA(), boardId, authorName, hoursAgo]
  );
  return result.rows[0].id;
}

async function insertReply(
  parentId: number, content: string,
  authorName: string = '名無しさん', minutesAgo: number = 30
): Promise<number> {
  const result = await pool.query(
    `INSERT INTO posts (content, status, ip_hash, user_agent, parent_id, board_id, author_name, created_at)
     VALUES ($1, 0, $2, $3, $4, NULL, $5, NOW() - INTERVAL '1 minute' * $6)
     RETURNING id`,
    [content, generateIpHash(), randomUA(), parentId, authorName, minutesAgo]
  );
  return result.rows[0].id;
}

async function main() {
  console.log('🎯 開始新增 5 個討論串...\n');

  // ========================================
  // 1. work板：開工第一天就想離職
  // seed_goal: emotional_release
  // ========================================
  const t1 = await insertThread('work',
    '開工第一天就想離職的人有多少',
    `剛剛坐到位子上
打開電腦看到信箱 127 封未讀
還沒開始就已經累了

過年前明明交代好的事情
回來全部推翻重來
老闆說「趁假期想了很多，方向要調整」

你想了很多
但做的人是我啊

有人跟我一樣嗎
才第一天就已經在滑104了`,
    '名無しさん', 3);

  await insertReply(t1, '我今天早上打開slack 200多則未讀\n直接關掉重開假裝沒看到', '名無しさん', 140);
  await insertReply(t1, '>>1\n過年前趕死趕活的東西結果方向要調整\n這種事真的會讓人崩潰', '名無しさん', 110);
  await insertReply(t1, '104沒關過+1\n隨時準備好是基本生存技能了', '名無しさん', 80);

  console.log(`  ✅ Thread ${t1}: 開工第一天就想離職 (work) + 3 replies\n`);

  // ========================================
  // 2. work板：AI工具用了之後工作量反而變多
  // seed_goal: quiet_question
  // ========================================
  const t2 = await insertThread('work',
    'AI工具用了之後 工作量反而變多？',
    `公司去年開始導入各種AI工具
說是要提升效率
結果呢

以前一個禮拜做完的東西
現在因為「AI可以幫你」所以三天就要交
品質要求還更高

老闆覺得有AI就什麼都很快
但他不知道AI寫出來的東西還是要review
有時候修AI的bug比自己寫還久

然後因為「效率提升了」
所以人力也不用補了
一個人扛三個人的量

這到底是在提升什麼`,
    '名無しさん', 4);

  await insertReply(t2, '完全同意\nAI是加速了沒錯\n但加速的是老闆的期待 不是你的產能', '名無しさん', 180);
  await insertReply(t2, '修AI寫的code比自己寫還久+1\n然後出事還是工程師的鍋', '社畜', 150);
  await insertReply(t2, '我主管連ChatGPT都不會用\n但會說「你用AI弄一下很快吧」', '名無しさん', 120);

  console.log(`  ✅ Thread ${t2}: AI工具工作量反而變多 (work) + 3 replies\n`);

  // ========================================
  // 3. chat板：過年最怕聽到哪句話
  // seed_goal: emotional_release
  // ========================================
  const t3 = await insertThread('chat',
    '過年最怕聽到哪句話',
    `每年過年都是一場精神耐力賽

今年冠軍是阿姨的
「你看隔壁的小明都結婚了耶，你呢？」

我能怎樣
我跟小明又不一樣
他有房有車有老婆
我有加班有失眠有黑眼圈

大家今年被問到最煩的是什麼`,
    '名無しさん', 5);

  await insertReply(t3, '「什麼時候要生小孩」\n阿嬤我連對象都沒有', '名無しさん', 220);
  await insertReply(t3, '「一個月賺多少」\n然後不管你說多少都會接「那不就跟XX差不多」', '名無しさん', 190);
  await insertReply(t3, '>>1\n有加班有失眠有黑眼圈 笑死\n這個我可以', '名無しさん', 160);

  console.log(`  ✅ Thread ${t3}: 過年最怕聽到哪句話 (chat) + 3 replies\n`);

  // ========================================
  // 4. life板：離職之後才知道的事
  // seed_goal: seeking_understanding
  // ========================================
  const t4 = await insertThread('life',
    '離職之後才知道的事',
    `上個月離開待了三年的公司
現在回想才發現很多事情

在裡面的時候一直覺得是自己不夠好
做不完是自己效率差
被唸是自己不用心

離開之後才知道
原來那個量本來就不是一個人能做的
原來別家公司不會半夜twelve點還在群組派工作
原來正常的主管不會在你請假的時候問「那誰來做」

最讓我意外的是
離開之後 身體的毛病竟然慢慢好了
長期的胃痛 失眠 都在好轉

有人也有類似的經驗嗎`,
    '名無しさん', 6);

  await insertReply(t4, '離開之後身體變好+1\n在裡面的時候根本不知道自己壓力有多大\n以為那些症狀是正常的', '名無しさん', 280);
  await insertReply(t4, '>>1\n「那誰來做」這句話真的有毒\n好像你請假就是在害人一樣', '名無しさん', 250);

  console.log(`  ✅ Thread ${t4}: 離職之後才知道的事 (life) + 2 replies\n`);

  // ========================================
  // 5. tech板：HomeLab玩家都在跑什麼
  // seed_goal: quiet_question
  // ========================================
  const t5 = await insertThread('tech',
    'HomeLab 玩家都在跑什麼',
    `最近入手了一台 NUC 想拿來當 homelab
目前只有跑 Docker + Portainer

但總覺得能做的事情應該更多
看到有人跑 k3s 也有人搞 NAS
還有人在家裡架了整套監控

想問大家的 homelab 都在跑什麼服務
有沒有什麼好玩又實用的推薦

目前在考慮：
- Pi-hole 擋廣告
- Nextcloud 取代 Google Drive
- Home Assistant 智慧家庭

還是乖乖先把 Kubernetes 學好就好`,
    '名無しさん', 5);

  await insertReply(t5, 'Pi-hole 大推 裝了之後廣告少超多\n而且設定不難', '名無しさん', 220);
  await insertReply(t5, 'NUC 跑 Proxmox 開 VM 很方便\n一台可以模擬很多環境\n學 K8s 也不用花錢租雲端', '名無しさん', 190);
  await insertReply(t5, '推 Jellyfin 自架影音伺服器\n自己的片自己串流\n手機平板都可以看', '名無しさん', 160);

  console.log(`  ✅ Thread ${t5}: HomeLab玩家都在跑什麼 (tech) + 3 replies\n`);

  console.log('========================================');
  console.log('✅ 總計新增 5 個討論串 + 14 則回覆');
  console.log('========================================');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('❌ 錯誤:', err); pool.end(); process.exit(1); });
