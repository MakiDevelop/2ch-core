#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-24 v3 - 補充 ACG/Gossip/生活類討論串
 *
 * 基於真實時事：
 * - Switch 2 已於 2025/6/5 全球發售，台灣 7/10，14,380 元起
 * - Switch 2 規格：7.9吋1080p螢幕、256GB、DLSS、光追、4K60輸出
 * - Switch 2 銷量：發售四天破350萬台，歷史最快
 * - 2026冬番：咒術迴戰死滅迴游、葬送的芙莉蓮第二季、我推的孩子第三季
 * - 新作：達爾文事變、相反的你和我、Fate/strange Fake
 * - 米哈遊：崩壞星穹鐵道 vs 原神持續競爭
 * - Netflix台劇品質提升
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
  console.log('💬 補充稀缺討論串 (2026-01-24 v3)...\n');

  // ========== ID 763: Switch 2 要出了 (acg) ==========
  console.log('  🎮 #763 - Switch 2 要出了');
  await insertReply(763, 'Switch 2 去年六月就發售了\n你現在才問', '名無しさん', 10);
  await insertReply(763, '>>5 台灣七月才上\n14,380元', '名無しさん', 9);
  await insertReply(763, '7.9吋螢幕超讚\n掌機模式也是1080p', '遊戲玩家', 8);
  await insertReply(763, '>>7 支援DLSS和光追\n效能大躍進', '名無しさん', 7);
  await insertReply(763, '發售四天就賣350萬台\n史上最快', '名無しさん', 6);
  await insertReply(763, '>>9 FromSoftware新作The Duskbloods\nSwitch 2獨佔', '名無しさん', 5);

  // ========== ID 686: Switch 2 (另一串重複主題) ==========
  console.log('  🎮 #686 - Switch 2 (另一串)');
  await insertReply(686, '已經買了\n瑪利歐賽車世界組合15,580', '名無しさん', 10);
  await insertReply(686, '>>5 256GB內建不夠\n要買microSD Express卡', '名無しさん', 9);
  await insertReply(686, 'TV模式4K60很讚\n接大螢幕玩', '名無しさん', 8);
  await insertReply(686, '>>7 舊Switch遊戲也能玩\n向下相容', '名無しさん', 7);
  await insertReply(686, '2025銷量破千萬台\n任天堂穩了', '名無しさん', 6);
  await insertReply(686, '>>9 等降價再買也行\n不急', '名無しさん', 5);

  // ========== ID 774: 2026冬番有什麼推薦的？ (acg) ==========
  console.log('  📺 #774 - 2026冬番有什麼推薦的？');
  await insertReply(774, '芙莉蓮第二季必看\n北部旅程篇', '名無しさん', 10);
  await insertReply(774, '>>5 咒術迴戰死滅迴游\n超期待', 'ACG宅', 9);
  await insertReply(774, '我推的孩子第三季也回歸\n劇情越來越緊張', '名無しさん', 8);
  await insertReply(774, '>>7 地獄樂第二季\n進入天仙篇', '名無しさん', 7);
  await insertReply(774, '新作推達爾文事變\n人猿混種社會議題', '名無しさん', 6);
  await insertReply(774, '>>9 這季快60部\n追不完', '名無しさん', 5);

  // ========== ID 697: 2026冬番 (另一串) ==========
  console.log('  📺 #697 - 2026冬番 (另一串)');
  await insertReply(697, '相反的你和我\n戀愛番推這部', '名無しさん', 10);
  await insertReply(697, '>>5 Fate/strange Fake終於動畫化\n型月粉必追', '名無しさん', 9);
  await insertReply(697, '金牌得主第二季\n花滑題材很新鮮', '名無しさん', 8);
  await insertReply(697, '>>7 黃金神威最終章\n完結撒花', '名無しさん', 7);
  await insertReply(697, '懷舊的看花樣少年少女重製\n老粉淚崩', '名無しさん', 6);
  await insertReply(697, '>>9 這季真的太強\n神番連發', '名無しさん', 5);

  // ========== ID 511: 崩壞：星穹鐵道 vs 原神 (acg) ==========
  console.log('  ⭐ #511 - 崩壞：星穹鐵道 vs 原神');
  await insertReply(511, '完全不同類型\n星鐵是回合制RPG', '名無しさん', 10);
  await insertReply(511, '>>5 原神開放世界探索\n星鐵輕鬆休閒', '手遊玩家', 9);
  await insertReply(511, '兩款都很課\n選一個專心玩', '名無しさん', 8);
  await insertReply(511, '>>7 星鐵劇情比較有趣\n角色也有梗', '名無しさん', 7);
  await insertReply(511, '原神3.x版本劇情拉回來了\n須彌很讚', '名無しさん', 6);
  await insertReply(511, '>>9 絕區零也可以試試\n動作感更強', '名無しさん', 5);

  // ========== ID 593: 皮客敏和寶可夢 (acg) ==========
  console.log('  🌱 #593 - 皮客敏和寶可夢');
  await insertReply(593, '皮克敏4很療癒\n適合休閒玩', '名無しさん', 10);
  await insertReply(593, '>>5 寶可夢是20年IP了\n情懷加成', '名無しさん', 9);
  await insertReply(593, '皮克敏手機版也有人玩\nNiantic做的', '名無しさん', 8);
  await insertReply(593, '>>7 寶可夢朱紫雖然畫面差\n但遊戲性還行', '名無しさん', 7);
  await insertReply(593, '任天堂第一方都有品質保證\n很難踩雷', '名無しさん', 6);
  await insertReply(593, '>>9 等寶可夢Switch 2新作\n應該會好很多', '名無しさん', 5);

  // ========== ID 702: 電競比賽 (acg) ==========
  console.log('  🏆 #702 - 電競比賽');
  await insertReply(702, 'LOL世界賽還是最熱\nT1 Faker傳奇', '名無しさん', 10);
  await insertReply(702, '>>5 Valorant亞洲賽區成長很快\n台灣隊也有機會', '電競粉', 9);
  await insertReply(702, '格鬥遊戲看EVO\n今年在日本', '名無しさん', 8);
  await insertReply(702, '>>7 Street Fighter 6競技性很強\n觀賞性也好', '名無しさん', 7);
  await insertReply(702, '手遊電競也越來越多\n傳說對決、PUBG Mobile', '名無しさん', 6);
  await insertReply(702, '>>9 電競選手年紀偏小\n職業壽命短是問題', '名無しさん', 5);

  // ========== ID 481: Netflix台劇越來越好看了 (gossip) ==========
  console.log('  🎬 #481 - Netflix台劇越來越好看了');
  await insertReply(481, '模仿犯、八尺門辨護人都很讚\n製作品質提升', '名無しさん', 10);
  await insertReply(481, '>>5 Netflix投資帶動整體水準\n競爭是好事', '名無しさん', 9);
  await insertReply(481, '華燈初上算是轉捩點\n帶起熱潮', '名無しさん', 8);
  await insertReply(481, '>>7 Disney+也開始拍台劇\n星際效應劇組', '名無しさん', 7);
  await insertReply(481, '題材變多元了\n不只愛情偶像', '名無しさん', 6);
  await insertReply(481, '>>9 演員演技也進步\n不再只看顏值', '影劇迷', 5);

  // ========== ID 89: 討厭收到語音訊息 (chat) ==========
  console.log('  🎤 #89 - 討厭收到語音訊息');
  await insertReply(89, '+1 尤其在外面不方便聽\n還要找耳機', '名無しさん', 10);
  await insertReply(89, '>>5 發語音的人自己方便\n聽的人麻煩', '名無しさん', 9);
  await insertReply(89, '重點是不能搜尋\n找訊息找不到', '名無しさん', 8);
  await insertReply(89, '>>7 有些人發60秒語音\n內容只有一句話', '名無しさん', 7);
  await insertReply(89, '工作用還是文字為主\n才有紀錄', '上班族', 6);
  await insertReply(89, '>>9 但長輩就是愛發\n只好忍耐', '名無しさん', 5);

  // ========== ID 20: 超商店員一直盯著我看 (chat) ==========
  console.log('  👀 #20 - 超商店員一直盯著我看');
  await insertReply(20, '防盜監視啦\n不是針對你', '名無しさん', 10);
  await insertReply(20, '>>5 店員要注意可疑人物\n這是工作', '便利商店店員', 9);
  await insertReply(20, '還是說你長太帥\n被注目了', '名無しさん', 8);
  await insertReply(20, '>>7 如果不舒服就換一家買\n到處都有', '名無しさん', 7);
  await insertReply(20, '大夜班店員壓力大\n多體諒', '名無しさん', 6);
  await insertReply(20, '>>9 有些店會特別注意\n可能那區偷竊多', '名無しさん', 5);

  // ========== ID 1301: 容易餓又容易胖 (chat) ==========
  console.log('  🍔 #1301 - 容易餓又容易胖');
  await insertReply(1301, '代謝問題\n可以去檢查甲狀腺', '名無しさん', 10);
  await insertReply(1301, '>>5 蛋白質吃夠\n飽足感會持續比較久', '健身仔', 9);
  await insertReply(1301, '澱粉吃太多血糖起伏大\n很快又餓', '名無しさん', 8);
  await insertReply(1301, '>>7 喝水也很重要\n有時候是口渴不是餓', '名無しさん', 7);
  await insertReply(1301, '少量多餐試試\n不要一次吃太多', '名無しさん', 6);
  await insertReply(1301, '>>9 睡眠不足也會影響\n容易暴飲暴食', '名無しさん', 5);

  // ========== ID 24: 這個 YouTube 影片笑死 (chat) ==========
  console.log('  📹 #24 - 這個 YouTube 影片笑死');
  await insertReply(24, '什麼影片\n貼連結啊', '名無しさん', 10);
  await insertReply(24, '>>5 這邊有Link Preview\n可以直接看標題', '名無しさん', 9);
  await insertReply(24, '沒貼連結怎麼看\n釣魚嗎', '名無しさん', 8);
  await insertReply(24, '>>7 可能怕被說業配吧\n有些人很敏感', '名無しさん', 7);
  await insertReply(24, '推薦一下最近看的好笑影片\n順便分享', '名無しさん', 6);
  await insertReply(24, '>>9 YouTube Shorts演算法\n有時候會推超奇怪的', '名無しさん', 5);

  console.log('\n✅ 完成！共新增 72 則回覆到 12 個討論串');
}

boostThreads()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
