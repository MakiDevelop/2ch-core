#!/usr/bin/env tsx
/**
 * Smart Seed Script - 會先查詢現有樓層再補充回覆
 *
 * 修正之前的問題：引用樓層時沒考慮原有回覆數量
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
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36',
];

function randomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// 查詢討論串現有的回覆數量，返回下一個樓層編號
async function getNextFloor(threadId: number): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM posts WHERE parent_id = $1',
    [threadId]
  );
  // 樓層1是主題，所以下一個樓層 = 現有回覆數 + 2
  return parseInt(result.rows[0].count) + 2;
}

async function insertReply(
  parentId: number,
  content: string,
  authorName: string = '名無しさん',
  hoursAgo: number = 1
): Promise<void> {
  await pool.query(
    `INSERT INTO posts (content, status, ip_hash, user_agent, parent_id, board_id, author_name, created_at)
     VALUES ($1, $2, $3, $4, $5, NULL, $6, NOW() - INTERVAL '1 hour' * $7)`,
    [content, 0, generateIpHash(), randomUserAgent(), parentId, authorName, hoursAgo]
  );
}

// 定義回覆結構：offset 是相對於起始樓層的偏移，replyTo 是要引用的相對樓層（null 表示不引用）
interface ReplyDef {
  content: string;
  author?: string;
  replyToOffset?: number; // 引用哪個樓層（相對於本批次的起始樓層，0 = 主題, 1 = 本批次第1則, etc）
  replyToAbsolute?: number; // 引用絕對樓層（用於引用原有樓層）
}

async function addRepliesToThread(
  threadId: number,
  replies: ReplyDef[],
  startHoursAgo: number = 10
): Promise<void> {
  const startFloor = await getNextFloor(threadId);
  console.log(`    現有樓層: ${startFloor - 1}，從樓${startFloor}開始新增`);

  for (let i = 0; i < replies.length; i++) {
    const reply = replies[i];
    const currentFloor = startFloor + i;
    let content = reply.content;

    // 處理引用
    if (reply.replyToOffset !== undefined) {
      // 引用本批次的某則回覆
      const targetFloor = startFloor + reply.replyToOffset;
      content = `>>${targetFloor} ${content}`;
    } else if (reply.replyToAbsolute !== undefined) {
      // 引用絕對樓層
      content = `>>${reply.replyToAbsolute} ${content}`;
    }

    const hoursAgo = startHoursAgo - i;
    await insertReply(threadId, content, reply.author || '名無しさん', hoursAgo > 0 ? hoursAgo : 1);
  }
}

async function main() {
  console.log('🔧 Smart Seed - 正確計算樓層引用\n');

  // ========== 補充討論串回覆 ==========

  // 先查詢需要補充的討論串
  const threadsToBoost = await pool.query(`
    SELECT
      p.id,
      p.title,
      b.slug as board,
      COUNT(r.id) as reply_count
    FROM posts p
    LEFT JOIN posts r ON r.parent_id = p.id
    LEFT JOIN boards b ON p.board_id = b.id
    WHERE p.parent_id IS NULL
      AND p.title IS NOT NULL
      AND LENGTH(p.title) > 5
    GROUP BY p.id, p.title, b.slug
    HAVING COUNT(r.id) BETWEEN 6 AND 8
    ORDER BY COUNT(r.id) ASC
    LIMIT 10
  `);

  console.log(`找到 ${threadsToBoost.rows.length} 個需要補充的討論串\n`);

  for (const thread of threadsToBoost.rows) {
    console.log(`  📝 #${thread.id} - ${thread.title} (${thread.board}, ${thread.reply_count}則回覆)`);

    // 根據討論串主題生成相關回覆
    const replies = generateContextualReplies(thread.title, thread.board);

    if (replies.length > 0) {
      await addRepliesToThread(thread.id, replies, 8);
      console.log(`    ✅ 新增 ${replies.length} 則回覆\n`);
    }
  }

  console.log('\n✅ 完成！');
}

// 根據討論串標題和版塊生成相關回覆
function generateContextualReplies(title: string, board: string): ReplyDef[] {
  // 通用回覆模板，不使用引用避免錯誤
  const genericReplies: ReplyDef[] = [
    { content: '推一下\n讓更多人看到', author: '名無しさん' },
    { content: '有道理', author: '名無しさん' },
    { content: '同意樓上', author: '名無しさん' },
  ];

  // 根據版塊和關鍵字選擇回覆
  if (board === 'tech') {
    return [
      { content: '技術發展真的太快\n跟不上了', author: '工程師' },
      { content: '這領域我有在關注\n確實是這樣', author: '名無しさん' },
      { content: '希望台灣能跟上世界趨勢', author: '名無しさん' },
    ];
  }

  if (board === 'news') {
    return [
      { content: '新聞看看就好\n要自己判斷', author: '名無しさん' },
      { content: '這件事後續發展值得關注', author: '名無しさん' },
      { content: '媒體報導有時候會偏頗', author: '名無しさん' },
    ];
  }

  if (board === 'life') {
    return [
      { content: '生活不容易\n大家都辛苦了', author: '名無しさん' },
      { content: '感同身受\n一起加油', author: '名無しさん' },
      { content: '每天都要給自己一點小確幸', author: '名無しさん' },
    ];
  }

  if (board === 'love') {
    return [
      { content: '感情的事很複雜\n沒有標準答案', author: '名無しさん' },
      { content: '溝通最重要', author: '過來人' },
      { content: '祝福你們', author: '名無しさん' },
    ];
  }

  if (board === 'money') {
    return [
      { content: '投資有風險\n要做好功課', author: '名無しさん' },
      { content: '理財觀念很重要', author: '名無しさん' },
      { content: '量力而為\n不要借錢投資', author: '名無しさん' },
    ];
  }

  if (board === 'work') {
    return [
      { content: '職場生存不容易\n保護好自己', author: '社畜' },
      { content: '這種事我也遇過', author: '名無しさん' },
      { content: '工作只是生活的一部分\n別太執著', author: '名無しさん' },
    ];
  }

  if (board === 'acg') {
    return [
      { content: '這個我有在追', author: 'ACG宅' },
      { content: '推推\n同好+1', author: '名無しさん' },
      { content: '有空一起討論', author: '名無しさん' },
    ];
  }

  if (board === 'gossip') {
    return [
      { content: '吃瓜看戲', author: '名無しさん' },
      { content: '這個有後續嗎', author: '名無しさん' },
      { content: '八卦版日常', author: '名無しさん' },
    ];
  }

  return genericReplies;
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
