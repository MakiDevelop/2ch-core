#!/usr/bin/env tsx
/**
 * 2026-02-23 針對真人用戶討論串的回覆補位
 * 目標：讓真人用戶感受到互動，增加回訪動力
 *
 * 對象串：
 * - 20195 新年快樂 (0 replies, TODAY) ← 最緊急
 * - 20163 初五開工被LINE轟炸 (3 replies)
 * - 14129 真不知道是真的為我們好
 * - 13232 工作怎換都是有毒的環境
 * - 8534  你給我翻譯翻譯
 * - 5211  外專法新規
 * - 4941  討論版列表能固定嗎
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

function randomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

async function insertReply(
  parentId: number,
  content: string,
  authorName: string = '名無しさん',
  minutesAgo: number = 10
): Promise<number> {
  const result = await pool.query(
    `INSERT INTO posts (content, status, ip_hash, user_agent, parent_id, board_id, author_name, created_at)
     VALUES ($1, 0, $2, $3, $4, NULL, $5, NOW() - INTERVAL '1 minute' * $6)
     RETURNING id`,
    [content, generateIpHash(), randomUserAgent(), parentId, authorName, minutesAgo]
  );
  return result.rows[0].id;
}

async function main() {
  console.log('🎯 開始針對真人用戶討論串補位回覆...\n');

  // ========================================
  // Thread 20195: 新年快樂 (0 replies, TODAY!)
  // by 131c69f5 - 「雖然已經初七了，但還是想跟大家說聲新年快樂」
  // ========================================
  console.log('📌 Thread 20195: 新年快樂');

  // persona: quiet_thinker
  await insertReply(20195,
    '新年快樂～\n初七才是真正開工的感覺，之前都在補眠',
    '名無しさん', 45);

  // persona: tired_worker
  await insertReply(20195,
    '新年快樂！\n雖然已經收假了但心還在放假中...',
    '名無しさん', 30);

  // persona: lonely
  await insertReply(20195,
    '謝謝 看到有人說新年快樂心情好了一點\n今年也請多指教',
    '名無しさん', 15);

  console.log('  ✅ 3 replies added\n');

  // ========================================
  // Thread 20163: 初五開工被LINE轟炸 (3 replies)
  // by e90665ba - 老闆LINE連發、一大早四點多開車回家
  // ========================================
  console.log('📌 Thread 20163: 初五開工');

  // persona: tired_worker
  await insertReply(20163,
    '「這只是提醒不是工作指派」\n這句話根本是年度幹話冠軍',
    '名無しさん', 120);

  // persona: confused
  await insertReply(20163,
    '四點多開車回家還要被轟炸…\n你老闆是不是覺得過年不算假期啊',
    '名無しさん', 90);

  console.log('  ✅ 2 replies added\n');

  // ========================================
  // Thread 14129: 真不知道是真的為我們好
  // by e90665ba - AI輔助寫code的辛苦、主管事後檢討
  // ========================================
  console.log('📌 Thread 14129: 真不知道是真的為我們好');

  // persona: tired_worker - 共感AI coding的辛苦
  await insertReply(14129,
    '用AI寫code結果出問題還是工程師背鍋\n又不是AI自己上線的\n這種壓力真的很大',
    '名無しさん', 200);

  // persona: quiet_thinker
  await insertReply(14129,
    '熬夜到三四點然後七點出門\n光這個就夠崩潰了\n身體要顧好啊',
    '名無しさん', 150);

  console.log('  ✅ 2 replies added\n');

  // ========================================
  // Thread 13232: 工作怎換都是有毒的環境
  // by e90665ba - 離職後到新公司也一樣有毒
  // ========================================
  console.log('📌 Thread 13232: 工作怎換都是有毒的環境');

  // persona: confused
  await insertReply(13232,
    '業務出去講得天花亂墜然後工程師擦屁股\n這個劇本我看過好幾次了',
    '名無しさん', 250);

  // persona: quiet_thinker
  await insertReply(13232,
    '有時候不是運氣差\n是台灣很多公司的管理方式就是這樣\n認清之後反而比較不會失望',
    '名無しさん', 220);

  console.log('  ✅ 2 replies added\n');

  // ========================================
  // Thread 8534: 你給我翻譯翻譯 (超有梗的串)
  // by 195e0fa0 - 職場黑話翻譯，b6ad7194回了4次
  // ========================================
  console.log('📌 Thread 8534: 你給我翻譯翻譯');

  // persona: quiet_thinker - 加碼翻譯
  await insertReply(8534,
    '「你比較了解這塊」➡️ 這件事從頭到尾你自己處理',
    '名無しさん', 350);

  // persona: tired_worker
  await insertReply(8534,
    '「之後再跟你sync一下」➡️ 永遠不會有之後',
    '加班的人', 330);

  // persona: confused
  await insertReply(8534,
    '「這個很快」➡️ 快的是叫你做的速度，不是做完的速度',
    '名無しさん', 310);

  console.log('  ✅ 3 replies added\n');

  // ========================================
  // Thread 5211: 外專法新規
  // by 131c69f5 - 深度政策分析文，0195630a有回覆
  // ========================================
  console.log('📌 Thread 5211: 外專法');

  // persona: quiet_thinker - 從實際面回應
  await insertReply(5211,
    '最近公司真的開始有越南跟印尼的同事了\n中文講得比我還好\n其實相處起來沒什麼問題',
    '名無しさん', 400);

  // persona: confused
  await insertReply(5211,
    '政策方向是對的但執行面不知道\n之前也很多政策雷聲大雨點小\n希望這次不一樣吧',
    '名無しさん', 380);

  console.log('  ✅ 2 replies added\n');

  // ========================================
  // Thread 4941: 討論版列表能固定嗎?
  // by 131c69f5 - 功能建議，滑起來有點累
  // ========================================
  console.log('📌 Thread 4941: 討論版列表能固定嗎');

  // persona: tired_worker - 支持
  await insertReply(4941,
    '推這個建議\n現在版越來越多每次都要滑好久\n如果能把常看的固定在上面就好了',
    '名無しさん', 450);

  console.log('  ✅ 1 reply added\n');

  console.log('========================================');
  console.log('✅ 總計新增 15 則回覆');
  console.log('涵蓋 7 個真人用戶的討論串');
  console.log('========================================');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('❌ 錯誤:', err); pool.end(); process.exit(1); });
