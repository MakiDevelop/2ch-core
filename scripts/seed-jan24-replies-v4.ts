#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-24 v4 - 基於今日時事補充討論串
 *
 * 基於真實時事來源：
 * - Alex Honnold 1/24 徒手攀登台北101，Netflix全球直播
 * - 藍白第8度封殺1.25兆國防特別預算
 * - 台北捷運禁用行動電源（自燃風險）
 * - 運動幣1/26開始登記，500元，60萬份限量抽籤
 * - 清晨低溫7度，北部大雨可能降雪
 * - 台積電股價1695元新高，市值全球第6，外資目標價2400元
 * - 鄧紫棋4月大巨蛋演唱會，2/6優先購、2/7全面開賣，票價1680-6880
 * - YouTube演算法：Mozilla調查71%反感影片來自推薦
 * - 2026房市盤整，20-30歲不到1%能買房，房貸估值比10年前高400萬
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

async function boostThreads() {
  console.log('💬 補充稀缺討論串 (2026-01-24 v4)...\n');

  // ========== ID 1352: 買不起房 (chat) ==========
  console.log('  🏠 #1352 - 買不起房');
  await insertReply(1352, '20-30歲能買房的不到1%\n聯徵中心統計的', '名無しさん', 10);
  await insertReply(1352, '>>6 房貸估值比10年前高400萬\n薪水漲不到這個速度', '名無しさん', 9);
  await insertReply(1352, '2026房市盤整中\n但價格還是很硬', '名無しさん', 8);
  await insertReply(1352, '>>8 南部可能跌15-20%\n北部抗跌', '房市觀察者', 7);
  await insertReply(1352, '新青安至少還有利息補貼\n寬限期5年', '名無しさん', 6);
  await insertReply(1352, '>>10 等2027看看吧\n專家說會止跌回溫', '名無しさん', 5);

  // ========== ID 1595: 鄧紫棋4月大巨蛋演唱會 (gossip) ==========
  console.log('  🎤 #1595 - 鄧紫棋4月大巨蛋演唱會');
  await insertReply(1595, '2/6永豐優先購\n2/7全面開賣', '名無しさん', 10);
  await insertReply(1595, '>>6 票價1680到6880\n七種價位', '演唱會迷', 9);
  await insertReply(1595, '連開三天 4/10-12\n香港歌手首位登大巨蛋', '名無しさん', 8);
  await insertReply(1595, '>>8 上次來台開唱2019\n隔了7年', '名無しさん', 7);
  await insertReply(1595, 'I AM GLORIA巡演超過105場\n華語女歌手紀錄', '名無しさん', 6);
  await insertReply(1595, '>>10 拓元又要塞爆了\n祝搶票順利', '名無しさん', 5);

  // ========== ID 486: 演唱會票價越來越貴 (gossip) ==========
  console.log('  🎫 #486 - 演唱會票價越來越貴');
  await insertReply(486, '鄧紫棋最貴6880\n還算可以接受', '名無しさん', 10);
  await insertReply(486, '>>5 金唱片獎剛在大巨蛋辦完\n場租應該很貴', '名無しさん', 9);
  await insertReply(486, '黃牛問題更嚴重\n原價買不到', '名無しさん', 8);
  await insertReply(486, '>>7 實名制推了還是有漏洞\n轉讓太容易', '名無しさん', 7);
  await insertReply(486, '製作成本也漲\n舞台、燈光、音響都不便宜', '名無しさん', 6);
  await insertReply(486, '>>9 通膨啦\n什麼都在漲', '名無しさん', 5);

  // ========== ID 471: 最近YouTube演算法是不是壞掉了 (gossip) ==========
  console.log('  📺 #471 - YouTube演算法是不是壞掉了');
  await insertReply(471, 'Mozilla調查過\n71%反感影片來自演算法推薦', '名無しさん', 10);
  await insertReply(471, '>>5 43.6%推薦內容跟最近看的無關\n莫名其妙', '名無しさん', 9);
  await insertReply(471, '推薦系統會把視野越鑽越窄\n變同溫層', '名無しさん', 8);
  await insertReply(471, '>>7 可以暫停觀看紀錄\n重置演算法', 'YT重度用戶', 7);
  await insertReply(471, '點「不感興趣」沒什麼用\n還是一直推', '名無しさん', 6);
  await insertReply(471, '>>9 Shorts更誇張\n滑一下就停不下來', '名無しさん', 5);

  // ========== ID 476: 台灣網紅的業配越來越誇張 (gossip) ==========
  console.log('  💰 #476 - 網紅業配越來越誇張');
  await insertReply(476, '沒標業配的最可怕\n以為是真心推薦', '名無しさん', 10);
  await insertReply(476, '>>5 公平會有規定要標示\n但很多人不管', '名無しさん', 9);
  await insertReply(476, '業配費用很高\n難怪大家搶著接', '名無しさん', 8);
  await insertReply(476, '>>7 小網紅更敢講真話\n大咖都要顧廠商關係', '名無しさん', 7);
  await insertReply(476, '看到「合作」兩個字就跳過\n節省時間', '名無しさん', 6);
  await insertReply(476, '>>9 有些業配做得很好\n不覺得突兀', '名無しさん', 5);

  // ========== ID 646: 現在YouTube很多AI生成的影片 (gossip) ==========
  console.log('  🤖 #646 - YouTube很多AI生成的影片');
  await insertReply(646, 'AI配音超明顯\n語調很不自然', '名無しさん', 10);
  await insertReply(646, '>>6 內容農場轉戰YouTube\n大量產出', '名無しさん', 9);
  await insertReply(646, '演算法反而推這些\n因為產量大', '名無しさん', 8);
  await insertReply(646, '>>8 真人創作者很難競爭\n成本差太多', '創作者', 7);
  await insertReply(646, 'AI繪圖+AI配音+AI剪輯\n一條龍', '名無しさん', 6);
  await insertReply(646, '>>10 品質參差不齊\n有些還是不錯', '名無しさん', 5);

  // ========== ID 656: 最近有什麼好看的Netflix推薦嗎 (gossip) ==========
  console.log('  🎬 #656 - Netflix推薦');
  await insertReply(656, '今天Alex Honnold爬101\nNetflix全球直播', '名無しさん', 10);
  await insertReply(656, '>>6 徒手攀登508公尺\n沒有繩索', '名無しさん', 9);
  await insertReply(656, '他之前的Free Solo拿過奧斯卡\n紀錄片很好看', '名無しさん', 8);
  await insertReply(656, '>>8 台劇也越來越多\n模仿犯、八尺門都不錯', '影劇迷', 7);
  await insertReply(656, '魷魚遊戲第二季也上了\n但評價兩極', '名無しさん', 6);
  await insertReply(656, '>>10 等二月鄧紫棋紀錄片\n應該也會有', '名無しさん', 5);

  // ========== ID 594: 捷運坐過頭 (chat) ==========
  console.log('  🚇 #594 - 捷運坐過頭');
  await insertReply(594, '睡過頭常有的事\n到終點站被叫醒', '名無しさん', 10);
  await insertReply(594, '>>5 捷運現在禁用行動電源了\n怕自燃', '名無しさん', 9);
  await insertReply(594, '>>6 什麼時候的規定\n我都還在用', '名無しさん', 8);
  await insertReply(594, '>>7 最近宣布的\n出事要賠償損失', '名無しさん', 7);
  await insertReply(594, '設鬧鐘提醒\n到站前5分鐘響', '通勤族', 6);
  await insertReply(594, '>>9 尖峰時間人多到睡不著\n不用擔心', '名無しさん', 5);

  // ========== ID 496: 30歲生日，一個人吃飯 (life) ==========
  console.log('  🎂 #496 - 30歲生日，一個人吃飯');
  await insertReply(496, '30歲一個里程碑\n對自己好一點', '名無しさん', 10);
  await insertReply(496, '>>5 運動幣1/26開始登記\n16歲以上都可以抽', '名無しさん', 9);
  await insertReply(496, '>>6 這跟生日有什麼關係\n離題了吧', '名無しさん', 8);
  await insertReply(496, '>>7 送自己運動當禮物\n健康最重要', '名無しさん', 7);
  await insertReply(496, '一個人吃也不錯\n想吃什麼就吃什麼', '單身族', 6);
  await insertReply(496, '>>9 生日快樂\n新的一年加油', '名無しさん', 5);

  // ========== ID 729: 一個人住的快樂與寂寞 (life) ==========
  console.log('  🏠 #729 - 一個人住的快樂與寂寞');
  await insertReply(729, '自由最爽\n想幾點睡就幾點睡', '名無しさん', 10);
  await insertReply(729, '>>5 但生病的時候很慘\n沒人照顧', '獨居者', 9);
  await insertReply(729, '今天清晨7度\n一個人窩在被子裡', '名無しさん', 8);
  await insertReply(729, '>>7 北部還可能下雪\n週末會回暖', '名無しさん', 7);
  await insertReply(729, '養隻貓或狗\n有個伴', '名無しさん', 6);
  await insertReply(729, '>>9 租屋很多不給養\n只能養植物', '名無しさん', 5);

  // ========== ID 220: 有什麼冷門但好看的動畫推薦？ (acg) ==========
  console.log('  📺 #220 - 冷門好看的動畫推薦');
  await insertReply(220, '達爾文事變\n這季新番，社會派題材', '名無しさん', 10);
  await insertReply(220, '>>5 人猿混種的故事\n很有深度', 'ACG宅', 9);
  await insertReply(220, '冷門的話推Odd Taxi\n2021的神作', '名無しさん', 8);
  await insertReply(220, '>>7 推理+社會批評\n動物擬人風格', '名無しさん', 7);
  await insertReply(220, '四疊半神話大系\n湯淺政明的', '名無しさん', 6);
  await insertReply(220, '>>9 那個很藝術\n需要耐心看', '名無しさん', 5);

  // ========== ID 691: 手遊課金課到懷疑人生 (acg) ==========
  console.log('  💸 #691 - 手遊課金課到懷疑人生');
  await insertReply(691, '設預算上限\n超過就不課', '名無しさん', 10);
  await insertReply(691, '>>6 說得簡單\n抽到保底前停不下來', '課長', 9);
  await insertReply(691, '米哈遊遊戲機率還算透明\n有些更黑', '名無しさん', 8);
  await insertReply(691, '>>8 原神和星鐵保底90抽\n算起來不便宜', '名無しさん', 7);
  await insertReply(691, '月卡黨最划算\n重課真的母湯', '名無しさん', 6);
  await insertReply(691, '>>10 把課金的錢存起來\n買台Switch 2', '名無しさん', 5);

  console.log('\n✅ 完成！共新增 72 則回覆到 12 個討論串');
}

boostThreads()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
