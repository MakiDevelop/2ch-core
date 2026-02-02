import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/2ch'
});

async function insertReply(parentId: number, content: string, authorName: string, hoursAgo: number): Promise<void> {
  const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO posts (parent_id, board_id, content, author_name, ip_hash, created_at)
     SELECT $1, p.board_id, $2, $3, 'seed-script', $4
     FROM posts p WHERE p.id = $1`,
    [parentId, content, authorName, createdAt]
  );
}

async function getReplyCount(threadId: number): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM posts WHERE parent_id = $1',
    [threadId]
  );
  return parseInt(result.rows[0].count);
}

async function addReplies(threadId: number, replies: Array<{content: string, author?: string}>, startHoursAgo: number = 4): Promise<number> {
  const currentCount = await getReplyCount(threadId);
  let added = 0;

  for (let i = 0; i < replies.length; i++) {
    const reply = replies[i];
    const hoursAgo = startHoursAgo - (i * 0.5); // 每則回覆間隔約30分鐘
    await insertReply(threadId, reply.content, reply.author || '名無しさん', hoursAgo > 0.1 ? hoursAgo : 0.1);
    added++;
  }

  console.log(`  Thread #${threadId}: 新增 ${added} 則回覆（原有 ${currentCount} 則）`);
  return added;
}

async function main() {
  console.log('=== 補充 0 回覆討論串 ===\n');

  let totalReplies = 0;

  // #3004 - 在想過年要不要加班 (職場版)
  console.log('處理 #3004: 在想過年要不要加班');
  totalReplies += await addReplies(3004, [
    { content: '加班有加班費嗎？有的話我會考慮', author: '社畜仔' },
    { content: '過年加班通常是雙倍薪吧\n有錢賺又不用去跟親戚尬聊，雙贏', author: '打工人' },
    { content: '>>1\n現在景氣不好，有加班機會就加吧\n我們公司過年還強制放假不給加班勒', author: '名無しさん' },
    { content: '我去年過年加班\n辦公室只有我一個人\n安靜到有點可怕但很爽', author: '獨行俠' },
    { content: '>>2\n親戚尬聊真的是過年最煩的事\n「交女朋友了沒」「薪水多少」「什麼時候結婚」', author: '厭世青年' },
    { content: '不如趁過年出國\n機票貴但至少清靜', author: '旅遊愛好者' },
    { content: '>>4\n辦公室一個人真的爽\n想幹嘛就幹嘛\n還可以放音樂外放', author: '名無しさん' },
    { content: '我是覺得看個人啦\n如果跟家人關係好就回去\n不好的話加班躲著也行', author: '中肯哥' },
  ], 3);

  // #3005 - 壓力有夠大，竟然做這種夢 (生活版)
  console.log('處理 #3005: 壓力有夠大，竟然做這種夢');
  totalReplies += await addReplies(3005, [
    { content: '工作壓力反映在夢裡很常見\n我之前也常夢到上班遲到或是開會忘記準備', author: '過來人' },
    { content: '第二個夢也太可怕了吧...\n你最近是不是新聞看太多', author: '名無しさん' },
    { content: '通勤三小時那個夢太真實了\n我現在通勤單趟一小時就覺得很痛苦', author: '通勤族' },
    { content: '>>1\n夢到工作的事超煩\n明明下班了還在工作的感覺', author: '社畜' },
    { content: '寄居他人家裡那段\n是不是現實中也有類似的壓力？\n感覺你可能在擔心住的問題', author: '解夢師' },
    { content: '我之前壓力大的時候\n連續一個禮拜每天都夢到在公司被老闆罵\n後來去看了身心科才好一點', author: '名無しさん' },
    { content: '>>3\n三小時通勤真的是地獄\n那個時間每天來回就六小時\n等於一天只剩18小時', author: '計算王' },
    { content: '拍拍\n找時間好好休息一下\n週末不要再想工作的事了', author: '溫暖路人' },
    { content: 'WFH一週才發現通勤遠這個設定好有創意\n夢的邏輯就是這麼荒謬w', author: '名無しさん' },
    { content: '我也常做壓力夢\n最常夢到考試沒準備\n明明都畢業好幾年了', author: '學生時代陰影' },
  ], 2);

  console.log(`\n=== 完成！共新增 ${totalReplies} 則回覆 ===`);

  await pool.end();
}

main().catch(console.error);
