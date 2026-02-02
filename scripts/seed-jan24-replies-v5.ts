#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-24 v5 - 基於真實時事補充討論串
 *
 * 基於真實時事來源：
 * - 2026韓劇：《愛情怎麼翻譯？》金宣虎、《21世紀大君夫人》IU+邊佑錫、宋慧喬+孔劉合作
 * - BLACKPINK Jisoo《月刊男友》是2026年Netflix最大韓劇
 * - 電價：2025下半年微調0.71%，700度以下每度漲0.1元，台電累虧4700億
 * - 美元定存：王道銀行1個月8.8%優惠，一般牌告1年期約2-2.8%
 * - 外送平台抽成問題
 * - 交友軟體現況
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
  console.log('💬 補充稀缺討論串 (2026-01-24 v5)...\n');

  // ========== ID 466: 覺得現在的韓劇都太灑狗血了 (gossip) ==========
  console.log('  📺 #466 - 覺得現在的韓劇都太灑狗血了');
  await insertReply(466, '2026韓劇陣容超強\n宋慧喬+孔劉合作', '名無しさん', 10);
  await insertReply(466, '>>6 《21世紀大君夫人》IU+邊佑錫\n很期待', '韓劇迷', 9);
  await insertReply(466, 'Jisoo的《月刊男友》\n2026 Netflix最大製作', '名無しさん', 8);
  await insertReply(466, '>>8 《愛情怎麼翻譯？》1/16開播\n金宣虎回歸', '名無しさん', 7);
  await insertReply(466, '灑狗血是特色\n不然就不是韓劇了', '名無しさん', 6);
  await insertReply(466, '>>10 要看類型\n懸疑類就比較正常', '名無しさん', 5);

  // ========== ID 784: 電價又要漲了 (news) ==========
  console.log('  ⚡ #784 - 電價又要漲了');
  await insertReply(784, '2025下半年微調0.71%\n700度以下每度漲0.1元', '名無しさん', 10);
  await insertReply(784, '>>5 台電累虧4700億了\n繼續虧下去', '名無しさん', 9);
  await insertReply(784, '2026選舉年\n電價可能不會大漲', '名無しさん', 8);
  await insertReply(784, '>>7 政治考量囉\n選前誰敢漲', '名無しさん', 7);
  await insertReply(784, '1001度以上每度漲0.4元\n用電大戶影響大', '名無しさん', 6);
  await insertReply(784, '>>9 夏天冷氣開整天\n帳單會很可怕', '名無しさん', 5);

  // ========== ID 712: 外送平台抽成太高 (news) ==========
  console.log('  🛵 #712 - 外送平台抽成太高');
  await insertReply(712, '聽說抽成30%以上\n餐廳不漲價才怪', '名無しさん', 10);
  await insertReply(712, '>>5 Uber Eats跟Foodpanda寡占\n沒議價空間', '餐飲業者', 9);
  await insertReply(712, '小餐廳被迫上架\n不上沒曝光', '名無しさん', 8);
  await insertReply(712, '>>7 外送價比內用貴20-30%\n很正常', '名無しさん', 7);
  await insertReply(712, '自己走去買最省\n順便運動', '名無しさん', 6);
  await insertReply(712, '>>9 懶是原罪\n認了', '名無しさん', 5);

  // ========== ID 607: 美金定存利率5% (money) ==========
  console.log('  💵 #607 - 美金定存利率5%');
  await insertReply(607, '那是優惠利率\n牌告利率1年期只有2-2.8%', '名無しさん', 10);
  await insertReply(607, '>>5 王道銀行新戶1個月8.8%\n但限額限期', '理財族', 9);
  await insertReply(607, '要注意匯率風險\n匯差可能吃掉利息', '名無しさん', 8);
  await insertReply(607, '>>7 單筆利息超過台幣2萬要扣補充保費\n可以拆單', '名無しさん', 7);
  await insertReply(607, '聯準會降息\n美元定存利率會越來越低', '名無しさん', 6);
  await insertReply(607, '>>9 現在進場時機不是最好\n但也不算差', '名無しさん', 5);

  // ========== ID 860: 該先買房還是先投資？ (money) ==========
  console.log('  🏠 #860 - 該先買房還是先投資？');
  await insertReply(860, '看你的需求\n自住的話早買早安心', '名無しさん', 10);
  await insertReply(860, '>>5 2026房市盤整中\n不急的話可以等', '名無しさん', 9);
  await insertReply(860, '投資報酬率可能比房貸利率高\n但風險不同', '投資者', 8);
  await insertReply(860, '>>7 台積電今年股價1695\n漲幅超過房價', '名無しさん', 7);
  await insertReply(860, '新青安貸款條件不錯\n40年、5年寬限期', '名無しさん', 6);
  await insertReply(860, '>>9 頭期款存不夠就先投資\n等資金夠再說', '名無しさん', 5);

  // ========== ID 1151: 第一份薪水應該怎麼分配 (money) ==========
  console.log('  💰 #1151 - 第一份薪水應該怎麼分配');
  await insertReply(1151, '631法則\n60%生活、30%儲蓄、10%自我投資', '名無しさん', 10);
  await insertReply(1151, '>>5 2026基本工資29500\n存30%有點難', '社會新鮮人', 9);
  await insertReply(1151, '先存緊急預備金\n3-6個月生活費', '名無しさん', 8);
  await insertReply(1151, '>>7 強迫儲蓄\n薪水入帳先轉走', '名無しさん', 7);
  await insertReply(1151, '記帳很重要\n才知道錢花去哪', '名無しさん', 6);
  await insertReply(1151, '>>9 不要月光就好\n慢慢來', '名無しさん', 5);

  // ========== ID 434: 被信用卡循環利息吃掉好多錢 (money) ==========
  console.log('  💳 #434 - 被信用卡循環利息吃掉');
  await insertReply(434, '循環利息年利率15%左右\n超級高', '名無しさん', 10);
  await insertReply(434, '>>5 趕快還清\n借信貸來還都比較划算', '名無しさん', 9);
  await insertReply(434, '最低應繳只繳利息\n本金還不完', '名無しさん', 8);
  await insertReply(434, '>>7 銀行最愛這種客戶\n穩定利息收入', '銀行員', 7);
  await insertReply(434, '以後用帳戶扣款\n不要用循環', '名無しさん', 6);
  await insertReply(434, '>>9 自制力很重要\n刷卡前想清楚', '名無しさん', 5);

  // ========== ID 855: 交友軟體到底有沒有用？ (love) ==========
  console.log('  💕 #855 - 交友軟體到底有沒有用');
  await insertReply(855, '看運氣\n有人真的交到另一半', '名無しさん', 10);
  await insertReply(855, '>>5 照片決定一切\n內涵看不到', '名無しさん', 9);
  await insertReply(855, 'Tinder、Bumble、Pairs都試過\n各有優缺點', '使用者', 8);
  await insertReply(855, '>>7 很多是來約的\n認真交友要篩選', '名無しさん', 7);
  await insertReply(855, '當作認識新朋友\n不要期待太高', '名無しさん', 6);
  await insertReply(855, '>>9 聊得來再見面\n安全第一', '名無しさん', 5);

  // ========== ID 407: 分手後還能當朋友嗎？ (love) ==========
  console.log('  💔 #407 - 分手後還能當朋友嗎');
  await insertReply(407, '看分手原因\n和平分手比較有可能', '名無しさん', 10);
  await insertReply(407, '>>5 新對象通常不喜歡\n容易有誤會', '名無しさん', 9);
  await insertReply(407, '需要冷靜期\n馬上當朋友很奇怪', '過來人', 8);
  await insertReply(407, '>>7 最後通常就淡掉了\n各過各的', '名無しさん', 7);
  await insertReply(407, '保持禮貌的點頭之交\n比較實際', '名無しさん', 6);
  await insertReply(407, '>>9 刪好友最乾脆\n眼不見為淨', '名無しさん', 5);

  // ========== ID 635: 前任傳訊息說想複合 (love) ==========
  console.log('  📱 #635 - 前任傳訊息說想複合');
  await insertReply(635, '先想清楚當初為什麼分\n問題解決了嗎', '名無しさん', 10);
  await insertReply(635, '>>5 複合的成功率不高\n同樣問題會重演', '名無しさん', 9);
  await insertReply(635, '是真的想你還是寂寞\n要分清楚', '過來人', 8);
  await insertReply(635, '>>7 過年前容易這樣\n怕一個人', '名無しさん', 7);
  await insertReply(635, '如果你已經放下了\n就不要回頭', '名無しさん', 6);
  await insertReply(635, '>>9 但如果還有感覺\n可以約出來談談', '名無しさん', 5);

  // ========== ID 1231: 職場上婊別人的 (life) ==========
  console.log('  🏢 #1231 - 職場上婊別人的');
  await insertReply(1231, '職場不是交朋友的地方\n保護好自己', '名無しさん', 10);
  await insertReply(1231, '>>5 email CC要寄對\n留證據很重要', '上班族', 9);
  await insertReply(1231, '新的病假規定\n10天內不能算考績', '名無しさん', 8);
  await insertReply(1231, '>>7 但主管心裡會記\n制度歸制度', '名無しさん', 7);
  await insertReply(1231, '會議發言錄音備份\n以後有糾紛有證據', '名無しさん', 6);
  await insertReply(1231, '>>9 做好自己的事\n不給人把柄', '名無しさん', 5);

  // ========== ID 213: 這個站跟 PTT 比起來如何？ (meta) ==========
  console.log('  🔧 #213 - 這個站跟 PTT 比起來如何');
  await insertReply(213, 'PTT又常常掛\n這邊穩定多了', '名無しさん', 10);
  await insertReply(213, '>>5 介面比較現代\n不用學BBS指令', '名無しさん', 9);
  await insertReply(213, '但人氣差很多\n討論區要人才熱鬧', '名無しさん', 8);
  await insertReply(213, '>>7 匿名版的感覺很像\n發文門檻低', 'PTT難民', 7);
  await insertReply(213, 'Link Preview做得不錯\n貼連結有預覽', '名無しさん', 6);
  await insertReply(213, '>>9 希望多拉一些人來\n版越活越好', '名無しさん', 5);

  console.log('\n✅ 完成！共新增 72 則回覆到 12 個討論串');
}

boostThreads()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
