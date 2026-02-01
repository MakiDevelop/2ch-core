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

  // ========== #5329 芙莉蓮快閃店 (acg) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(5329, '週末去的 人超多\n建議平日去', '名無しさん', 42);
  await insertReply(5329, '>>6 免費參觀太佛了\n周邊價格也還好', '名無しさん', 40);
  await insertReply(5329, '膽大黨超紅\n欣德可太可愛了', '名無しさん', 38);
  await insertReply(5329, '三月結束前一定要去\n芙莉蓮粉必朝聖', '芙莉蓮控', 36);

  // ========== #5151 夜間模式 (meta) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(5151, '>>7 真的有了！\n站方動作很快欸', '名無しさん', 40);
  await insertReply(5151, '剛試用 超讚\n眼睛舒服多了', '夜貓子', 38);
  await insertReply(5151, '希望可以記住設定\n每次都要重新切有點麻煩', '名無しさん', 36);
  await insertReply(5151, '讚讚 建議採納速度很快', '名無しさん', 34);

  // ========== #4971 基本工資破三萬 (work) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(4971, '>>7 房價漲那麼多\n薪水根本追不上', '名無しさん', 90);
  await insertReply(4971, '基本工資調漲對正職沒什麼感\n領基本工資的才有差', '名無しさん', 88);
  await insertReply(4971, '物價漲更多\n實質購買力根本沒增加', '名無しさん', 86);
  await insertReply(4971, '韓國日本最低時薪換算都比我們高\n台灣CP值還是很高', '名無しさん', 84);

  // ========== #5031 直球戀愛 (love) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(5031, '直球會不會太衝\n萬一被發好人卡', '名無しさん', 88);
  await insertReply(5031, '>>8 被發卡也比曖昧一年好\n至少不浪費時間', '名無しさん', 86);
  await insertReply(5031, '慢節奏+先當朋友我覺得不錯\n壓力比較小', '名無しさん', 84);
  await insertReply(5031, '每年交友軟體都在發明新名詞\n行銷話術而已', '名無しさん', 82);

  // ========== #4860 AI吃電 (tech) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(4860, '>>5 核融合確實是終極解\n但起碼還要20年', '名無しさん', 92);
  await insertReply(4860, '台灣要發展AI\n電力問題一定要先解決', '名無しさん', 90);
  await insertReply(4860, '>>7 讓科技業自己蓋電廠+1\n不然憑什麼吃民生用電', '名無しさん', 88);
  await insertReply(4860, '聽說很多資料中心都在找\n能自己供電的地點', '名無しさん', 86);

  // ========== #4798 病假新制 (work) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(4798, '>>7 HR配合新制還不錯\n有些公司都拖拖拉拉', '名無しさん', 94);
  await insertReply(4798, '希望檢舉管道要暢通\n不然新制形同虛設', '名無しさん', 92);
  await insertReply(4798, '現在生病終於可以安心請假了\n不用擔心考績', '名無しさん', 90);
  await insertReply(4798, '100萬對大企業是不夠\n但對小公司還是有嚇阻力', '名無しさん', 88);

  // ========== #4825 Costco美食區 (life) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(4825, '>>3 內湖店美食區在裡面\n但有些店在外面可以直接買', '名無しさん', 96);
  await insertReply(4825, '熱狗套餐一定要保持60塊以下\n不然不去了', '名無しさん', 94);
  await insertReply(4825, '預掃描希望台灣趕快跟進\n結帳排隊真的太久', '名無しさん', 92);
  await insertReply(4825, '會員年費都1450了\n福利當然要給會員', '名無しさん', 90);

  // ========== #4812 金錢觀不合 (love) ==========
  // OP=1, 現有6則回覆, 補4則
  await insertReply(4812, '>>5 共同帳戶的方法不錯\n各管各的比較不會吵', '名無しさん', 94);
  await insertReply(4812, '原PO要趁現在談清楚\n結婚後改變更難', '名無しさん', 92);
  await insertReply(4812, '我前任也是這樣\n最後因為錢分手了', '名無しさん', 90);
  await insertReply(4812, '價值觀這種東西很難改\n要有心理準備', '過來人', 88);

  console.log('回覆補充完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
