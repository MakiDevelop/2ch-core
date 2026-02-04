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
  hoursAgo: number = 24
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
  console.log('開始新增 2026-02-04 時事討論串...\n');

  // ===== 1. tech 版：資策會 2026 十大 AI 關鍵技術 =====
  const techId = await insertThread(
    'tech',
    '資策會公布2026十大AI技術，Agentic AI排第一',
    '資策會剛公布了2026年十大AI關鍵技術\n把AI發展分成四個階段：鑑別式→生成式→代理式→通用\n\n現在最火的就是Agentic AI（代理式AI）\n簡單說就是AI不只回答問題，還會自己設定目標、自己行動\n\n黃仁勳在CES也說機器人迎來ChatGPT時刻\n感覺今年AI又要大爆發了',
    '名無しさん', 18
  );
  await insertReply(techId, 'Agentic AI 就是以前說的 AI Agent 吧\n現在各家都在做，Claude Code、Codex、Devin\n工程師要被取代了嗎', '名無しさん', 16);
  await insertReply(techId, '>>2\n不會被取代啦 但會被會用AI的工程師取代\n現在不學怎麼跟AI協作的人才危險', '名無しさん', 14);
  await insertReply(techId, 'IDC說54%企業要增加AI投資\n但我們公司到現在還在用Excel管資料\n差距也太大', '社畜工程師', 12);
  await insertReply(techId, '台灣就是硬體強 軟體弱\n做晶片代工第一名 做AI應用就...\n不過邊緣AI倒是有機會 群聯在CES展的東西蠻猛的', '名無しさん', 10);
  await insertReply(techId, '>>4\n你們公司還有Excel用 我們還在用紙本簽核\n數位轉型這四個字在台灣很多公司就是個笑話', '名無しさん', 8);
  await insertReply(techId, 'AI智慧眼鏡今年出貨量要到950萬副\n感覺Meta跟Apple會打起來\n台灣代工廠又有得賺了', '名無しさん', 5);
  console.log(`✓ tech 版：資策會AI技術 (ID: ${techId})`);

  // ===== 2. acg 版：台北動漫節 =====
  const acgId = await insertThread(
    'acg',
    '明天台北動漫節開幕！有人要去嗎',
    '2/5-2/9 南港展覽館\n今年有幾個蠻猛的：\n\n・無職轉生作者首度來台簽名會\n・鏈鋸人蕾潔篇新周邊\n・孤獨搖滾動畫展（2/13三創）\n・換裝娃娃聲優直田姬奈見面會\n\n博報堂也第一次來台參展\n帶了地下城、少女與戰車、點兔的東西\n\n有大佬分享一下怎麼逛比較有效率嗎',
    '名無しさん', 20
  );
  await insertReply(acgId, '無職轉生簽名會一定爆滿\n建議早上六點去排', '名無しさん', 18);
  await insertReply(acgId, '鏈鋸人蕾潔篇周邊必搶\n閱讀系列的圖超好看', '名無しさん', 16);
  await insertReply(acgId, '>>1\n建議第一天去 人最少\n週末根本擠不進去', '動漫宅', 14);
  await insertReply(acgId, '折言拿了GDC提名欸 台灣之光\n有在NS上架了 大家支持一下', '名無しさん', 12);
  await insertReply(acgId, '等等 孤獨搖滾展是2/13到3/22？\n這個一定要去 波奇醬可愛', 'ぼっち推し', 9);
  await insertReply(acgId, '小林家龍女僕快閃店 2/11新光南西\n康娜的周邊不知道有什麼', '名無しさん', 6);
  await insertReply(acgId, 'CWT-72 也是這個月 2/21-22台大體育館\n二月真的是ACG月 錢包要爆了', '名無しさん', 3);
  console.log(`✓ acg 版：台北動漫節 (ID: ${acgId})`);

  // ===== 3. news 版：台美EPPD =====
  const newsId = await insertThread(
    'news',
    '賴清德記者會：台美經貿進入新階段',
    '賴清德昨天針對台美EPPD會議成果開記者會\n說台美關係進入新階段 要攜手走進世界\n\n重點：\n・台美要成立工作小組\n・合作領域：供應鏈韌性、無人機認證\n・三大戰略兩大目標（具體內容還在看）\n\n同時美國參議員韋克爾也公開說\n對台灣在野黨刪國防預算感到失望\n認為中國威脅加劇 立法院應重新考慮',
    '名無しさん', 22
  );
  await insertReply(newsId, '無人機認證合作是重點\n台灣未來兩年要採購快五萬架無人機\n這個市場很大', '名無しさん', 20);
  await insertReply(newsId, '在野黨刪國防預算真的很扯\n人家美國都看不下去了', '名無しさん', 18);
  await insertReply(newsId, '>>2\n國防是長期投資 不是短期可以看到效果的\n但現在的國際情勢真的不能省這個', '名無しさん', 15);
  await insertReply(newsId, '國共論壇也在昨天開\n蕭旭岑說兩岸要合作賺世界的錢\n這兩邊的訊號也太衝突', '名無しさん', 12);
  await insertReply(newsId, '供應鏈韌性就是去中化\n台灣在這方面本來就有優勢\n半導體就不用說了', '名無しさん', 8);
  await insertReply(newsId, '2026選舉快到了\n所有議題都會被政治化\n能不能客觀討論一下', '名無しさん', 4);
  console.log(`✓ news 版：台美EPPD (ID: ${newsId})`);

  // ===== 4. gossip 版：袁惟仁病逝 =====
  const gossipId = await insertThread(
    'gossip',
    '袁惟仁走了...R.I.P.',
    '小胖老師走了\n之前腦溢血之後一直沒好\n他寫的歌真的是一個時代\n\n征服、夢醒了、旋木、離開我、最熟悉的陌生人\n隨便一首都是經典\n\n那個年代的華語樂壇真的百花齊放\n現在想想好懷念',
    '名無しさん', 24
  );
  await insertReply(gossipId, '征服是真的神曲\n當年那英唱到全亞洲都知道\nRIP 小胖老師', '名無しさん', 22);
  await insertReply(gossipId, '夢醒了也是\n陶喆的版本超經典\n想到就鼻酸', '名無しさん', 20);
  await insertReply(gossipId, '他真的是幕後天才\n寫了超多金曲 但很多人不知道作曲是他\n離開我、旋木、最熟悉的陌生人\n全部都是他', '名無しさん', 16);
  await insertReply(gossipId, '>>3\n對 很多人只認識歌手\n不知道背後的創作者\n小胖老師是真正的音樂人', '名無しさん', 12);
  await insertReply(gossipId, '那個年代的華語音樂真的是黃金時期\n周杰倫、陶喆、王力宏、孫燕姿\n再加上小胖老師在背後操刀\n現在的音樂...唉', '七年級生', 8);
  await insertReply(gossipId, '之前他在上海跌倒腦溢血\n後來一直在療養 偶爾會看到近況\n沒想到還是走了\n希望另一個世界繼續寫歌', '名無しさん', 3);
  console.log(`✓ gossip 版：袁惟仁 (ID: ${gossipId})`);

  console.log('\n✅ 完成！共新增 4 個討論串、25 則回覆');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
