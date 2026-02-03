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
  console.log('開始補充回覆（第二批）...');

  // === 2869: 春節連假9天想補完遊戲 (acg) ===
  await insertReply(2869, '>>4\n真的 戴耳機親戚還會問你在聽什麼', '名無しさん', 220);
  await insertReply(2869, 'DLC難度超高\n做好被虐的準備', '魂系玩家', 200);
  await insertReply(2869, '我還在打 Metaphor: ReFantazio\n100小時起跳', '名無しさん', 170);
  await insertReply(2869, '過年就是要肝遊戲\n其他時間都在上班', '名無しさん', 140);

  // === 2876: 過年追番清單分享 (acg) ===
  await insertReply(2876, '芙莉蓮真的神\n每一集都想哭', '名無しさん', 215);
  await insertReply(2876, '>>4\n同感 這季太多要追的', '名無しさん', 185);
  await insertReply(2876, '藍色監獄第二季也推\n足球番燃起來', '名無しさん', 155);
  await insertReply(2876, '過年就是要補番\n睡到自然醒 追番到天亮', '夜貓子', 125);

  // === 2848: 過年想帶家人去泡溫泉 (life) ===
  await insertReply(2848, '>>3\n礁溪真的貴爆\n過年價格是平日三倍', '名無しさん', 225);
  await insertReply(2848, '陽明山也有溫泉\n離台北近 不用跑太遠', '名無しさん', 195);
  await insertReply(2848, '推北投\n捷運到 很方便', '名無しさん', 165);
  await insertReply(2848, '帶長輩的話\n谷關比較清幽\n老人家會喜歡', '孝順仔', 135);

  // === 3664: 2026年Q1加薪4.1% (work) ===
  await insertReply(3664, '>>5\n真的 缺的是奴工不是人才', '名無しさん', 210);
  await insertReply(3664, '我們公司凍薪第三年了\n說要共體時艱', '名無しさん', 180);
  await insertReply(3664, '年終都沒了還談加薪\n笑死', '社畜2號', 150);
  await insertReply(3664, '轉職加薪比等公司調快多了\n建議直接看機會', '名無しさん', 120);

  // === 2932: 可以新增夜間模式嗎 (meta) ===
  await insertReply(2932, '>>6\n確實 站長快來', '名無しさん', 230);
  await insertReply(2932, '現在先用 Dark Reader 擋一下\n但原生支援還是比較好', '名無しさん', 200);
  await insertReply(2932, '希望可以自動切換\n白天白底 晚上黑底', '名無しさん', 170);
  await insertReply(2932, '+1 眼睛真的受不了', '名無しさん', 140);

  // === 3968: 假冒名人投資詐騙 (news) ===
  await insertReply(3968, '>>5\nMeta 真的是詐騙幫凶\n廣告費收爽爽 不管內容', '名無しさん', 205);
  await insertReply(3968, '每次都是事後諸葛\n被騙的人就是會信', '名無しさん', 175);
  await insertReply(3968, '我媽差點被騙\n幸好轉帳前有問我', '名無しさん', 145);
  await insertReply(3968, '刑責太輕了\n詐騙犯關幾年出來又繼續', '名無しさん', 115);

  console.log('完成！已補充回覆');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
