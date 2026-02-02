#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-24 v2 - 補充剩餘稀缺討論串
 *
 * 基於真實時事：
 * - Apple M5 晶片 2025年10月發布，AI性能大躍進
 * - Claude Opus 4.5 是最新的 frontier model
 * - Cursor IDE 整合 AI coding
 * - GitHub Copilot 持續進化
 * - Vercel 定價調整
 * - PTT 穩定性問題
 * - 外送平台競爭
 * - 都市生活困擾（裝潢噪音、咖啡廳佔位）
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
  console.log('💬 補充稀缺討論串 (2026-01-24 v2)...\n');

  // ========== ID 4: Claude 4.5 感覺沒有比 4 強多少 (tech) ==========
  console.log('  🤖 #4 - Claude 4.5 感覺沒有比 4 強多少');
  await insertReply(4, 'Opus 4.5才是最新的\n你說的是Sonnet嗎', '名無しさん', 10);
  await insertReply(4, '>>4 寫code能力確實變強\n上下文理解也更好', '工程師', 9);
  await insertReply(4, '跟GPT-4比各有優勢\n看使用場景', '名無しさん', 8);
  await insertReply(4, '>>6 Claude長文處理比較強\n200K context', '名無しさん', 7);
  await insertReply(4, '免費額度不夠用\n還是要訂閱', '名無しさん', 6);
  await insertReply(4, '>>8 API用量大的話\n價格要算一下', '名無しさん', 5);

  // ========== ID 5: 有人在用 Cursor 嗎 (tech) ==========
  console.log('  💻 #5 - 有人在用 Cursor 嗎');
  await insertReply(5, '用了半年了\n比VSCode + Copilot整合更好', '名無しさん', 10);
  await insertReply(5, '>>4 Tab補全很聰明\n理解上下文', 'Cursor用戶', 9);
  await insertReply(5, 'Cmd+K直接改code\n不用複製貼上', '名無しさん', 8);
  await insertReply(5, '>>6 缺點是訂閱費不便宜\n$20/月', '名無しさん', 7);
  await insertReply(5, '跟Windsurf比較過\n各有優點', '名無しさん', 6);
  await insertReply(5, '>>8 2026年AI coding工具競爭很激烈\n選擇很多', '名無しさん', 5);

  // ========== ID 6: M4 MacBook 風扇真的很吵 (tech) ==========
  console.log('  🍎 #6 - M4 MacBook 風扇真的很吵');
  await insertReply(6, 'M5都出了\n2025年10月發布的', '名無しさん', 10);
  await insertReply(6, '>>4 M5 AI性能又大躍進\nApple Intelligence更強', '名無しさん', 9);
  await insertReply(6, 'M4 Pro版才有風扇\n基本款沒有', 'Mac用戶', 8);
  await insertReply(6, '>>6 跑大型專案會熱\n效能降頻', '名無しさん', 7);
  await insertReply(6, '買Pro版散熱比較好\n但價格差很多', '名無しさん', 6);
  await insertReply(6, '>>8 等M5 MacBook出\n效能價格比更好', '名無しさん', 5);

  // ========== ID 7: GitHub Copilot 一直重複生成垃圾 code (tech) ==========
  console.log('  🐙 #7 - GitHub Copilot');
  await insertReply(7, '要給它足夠的context\n註解寫清楚一點', '名無しさん', 10);
  await insertReply(7, '>>4 有時候建議的code邏輯錯誤\n還是要自己review', '工程師', 9);
  await insertReply(7, 'Copilot Chat比Tab補全好用\n可以對話', '名無しさん', 8);
  await insertReply(7, '>>6 企業版有更多功能\n但貴', '名無しさん', 7);
  await insertReply(7, '用Cursor試試\n整合度更高', '名無しさん', 6);
  await insertReply(7, '>>8 AI寫code還是輔助\n不能完全依賴', '資深工程師', 5);

  // ========== ID 9: Vercel 開始收費了 (tech) ==========
  console.log('  ▲ #9 - Vercel 開始收費了');
  await insertReply(9, '免費額度還是有\n只是限制變多', '名無しさん', 10);
  await insertReply(9, '>>4 商業專案用Pro版划算\n$20/月起', '名無しさん', 9);
  await insertReply(9, 'Cloudflare Pages免費額度很大方\n可以考慮', '名無しさん', 8);
  await insertReply(9, '>>6 Railway、Render也不錯\n看需求選', '工程師', 7);
  await insertReply(9, 'Hobby專案自架VPS最省\n但要自己維護', '名無しさん', 6);
  await insertReply(9, '>>8 Vercel DX還是最好\n就是貴', '名無しさん', 5);

  // ========== ID 21: PTT 又掛了 (chat) ==========
  console.log('  📟 #21 - PTT 又掛了');
  await insertReply(21, '老系統了\n維護團隊人力不足', '名無しさん', 10);
  await insertReply(21, '>>4 BBS架構太古老\n現代流量撐不住', 'PTT老人', 9);
  await insertReply(21, '八卦版人氣還是很高\n每次選舉就爆', '名無しさん', 8);
  await insertReply(21, '>>6 新平台起來很難\n大家習慣了', '名無しさん', 7);
  await insertReply(21, '這邊不錯啊\n匿名版風格有復古感', '名無しさん', 6);
  await insertReply(21, '>>8 希望多一點人來\n討論區要人多才有趣', '名無しさん', 5);

  // ========== ID 22: 下雨天外送員超多 (chat) ==========
  console.log('  🛵 #22 - 下雨天外送員超多');
  await insertReply(22, '下雨天加成高\n外送員都出動', '名無しさん', 10);
  await insertReply(22, '>>4 但也危險\n機車騎快容易滑倒', '名無しさん', 9);
  await insertReply(22, 'Uber Eats跟Foodpanda競爭激烈\n優惠碼一直發', '名無しさん', 8);
  await insertReply(22, '>>6 外送費越來越貴\n有時候比餐費還高', '名無しさん', 7);
  await insertReply(22, '自己煮最省\n但懶', '名無しさん', 6);
  await insertReply(22, '>>8 下雨天就是想耍廢\n叫外送剛好', '社畜', 5);

  // ========== ID 25: 鄰居每天晚上11點開始裝潢 (chat) ==========
  console.log('  🔨 #25 - 鄰居每天晚上11點開始裝潢');
  await insertReply(25, '違法啦\n晚上10點後不能施工', '名無しさん', 10);
  await insertReply(25, '>>4 可以報警\n噪音妨害安寧', '名無しさん', 9);
  await insertReply(25, '先跟管委會反映\n看能不能處理', '名無しさん', 8);
  await insertReply(25, '>>6 直接去敲門溝通\n但可能會吵架', '名無しさん', 7);
  await insertReply(25, '錄影蒐證\n以後有糾紛有證據', '名無しさん', 6);
  await insertReply(25, '>>8 租屋的話考慮搬家\n鄰居素質很重要', '租屋族', 5);

  // ========== ID 26: 咖啡廳插座都被佔走 (chat) ==========
  console.log('  ☕ #26 - 咖啡廳插座都被佔走');
  await insertReply(26, '帶行動電源吧\n不能靠咖啡廳', '名無しさん', 10);
  await insertReply(26, '>>4 有些店限制用電時間\n怕人霸佔', '名無しさん', 9);
  await insertReply(26, '去星巴克或路易莎\n插座比較多', '名無しさん', 8);
  await insertReply(26, '>>6 共享空間也可以\n按小時計費但有保證', '自由工作者', 7);
  await insertReply(26, '圖書館免費\n但不能喝東西', '名無しさん', 6);
  await insertReply(26, '>>8 在家工作最方便\n但容易分心', '名無しさん', 5);

  // ========== ID 1446: 可以新增編輯功能嗎 (meta) ==========
  console.log('  ✏️ #1446 - 可以新增編輯功能嗎');
  await insertReply(1446, '已經有了喔\n發文後10分鐘內可以編輯', '名無しさん', 10);
  await insertReply(1446, '>>5 點右上角的三點\n會出現編輯選項', '名無しさん', 9);
  await insertReply(1446, '要記住編輯token\n不然沒辦法改', '名無しさん', 8);
  await insertReply(1446, '>>7 編輯過的文章會有標記\n不能亂改然後裝沒事', '名無しさん', 7);
  await insertReply(1446, '這功能不錯\n打錯字可以修正', '名無しさん', 6);
  await insertReply(1446, '>>9 10分鐘內限制蠻合理\n不會被濫用', '名無しさん', 5);

  // ========== ID 1724: 有音樂版可以放嗎～ (chat) ==========
  console.log('  🎵 #1724 - 有音樂版可以放嗎');
  await insertReply(1724, '可以在chat版分享啊\n貼YouTube連結', '名無しさん', 10);
  await insertReply(1724, '>>5 這邊有Link Preview\n會顯示影片標題', '名無しさん', 9);
  await insertReply(1724, '開一個音樂主題的討論串\n大家一起分享', '名無しさん', 8);
  await insertReply(1724, '>>7 Spotify連結也可以\n不過預覽可能沒那麼好', '名無しさん', 7);
  await insertReply(1724, '最近在聽什麼\n推薦一下', '名無しさん', 6);
  await insertReply(1724, '>>9 金唱片獎剛辦完\nG-Dragon音源大賞', '名無しさん', 5);

  // ========== ID 50: 在這個時候會以為沒有成功 (tech) ==========
  console.log('  💭 #50 - 在這個時候會以為沒有成功');
  await insertReply(50, '什麼沒有成功\n發文成功了啊', '名無しさん', 10);
  await insertReply(50, '>>4 可能說的是API回應\n有時候會lag', '名無しさん', 9);
  await insertReply(50, '網路慢的時候會這樣\n其實已經送出了', '名無しさん', 8);
  await insertReply(50, '>>6 樂觀更新UI\n先顯示再確認', '前端工程師', 7);
  await insertReply(50, '多按一次就重複發文\n要小心', '名無しさん', 6);
  await insertReply(50, '>>8 這個標題很有哲理\n人生也是這樣', '名無しさん', 5);

  console.log('\n✅ 完成！共新增 72 則回覆到 12 個討論串');
}

boostThreads()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
