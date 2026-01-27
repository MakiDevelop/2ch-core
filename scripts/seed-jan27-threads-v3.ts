#!/usr/bin/env tsx
/**
 * 2026/1/27 新增討論串 v3
 * 基於今日時事新增討論串
 * 目標版塊：work, love, life, money, gossip, tech
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
  console.log('=== 新增討論串 v3 (2026-01-27) ===\n');

  // ============================================================
  // [work] 病假新制上路 請10天不能扣全勤了
  // ============================================================
  console.log('[work] 病假新制');
  const t1 = await insertThread('work',
    '病假新制上路 請10天不能扣全勤了',
    '2026新制\n一年病假10天內不能扣全勤獎金\n超過的才能按比例扣\n\n而且不能因為請病假就考績打差\n違反的話罰100萬\n\n終於不用生病還得爬去上班了\n以前長榮空姐的事件大家應該還記得',
    '社畜', 8);
  await insertReply(t1, '終於 以前感冒還要掙扎要不要請假\n全勤獎金一扣就是幾千塊', '名無しさん', 7);
  await insertReply(t1, '但我們公司根本沒全勤獎金\n所以這新制跟我無關', '名無しさん', 6);
  await insertReply(t1, '重點是「不能因病假打考績」\n以前主管都暗示你請假會影響升遷\n現在有法條保護了', '名無しさん', 5);
  await insertReply(t1, '100萬罰金有夠少\n大企業根本不痛不癢', '名無しさん', 4);
  await insertReply(t1, '長榮那件事真的太慘了\n生病還要值勤最後人沒了\n希望這種事不要再發生', '名無しさん', 3);
  await insertReply(t1, '我們公司HR今天就發公告了\n說配合新制調整考勤規定\n動作還蠻快的', '名無しさん', 2);

  // ============================================================
  // [work] 年後轉職潮開始了 各位準備好了嗎
  // ============================================================
  console.log('[work] 年後轉職');
  const t2 = await insertThread('work',
    '年後轉職潮開始了 各位準備好了嗎',
    '年終領完準備閃人\n已經在偷偷投履歷了\n\n今年市場感覺還不錯\n104上AI相關職缺超多\n\n大家有打算年後跳槽嗎\n還是繼續撐',
    '準備閃人', 7);
  await insertReply(t2, '已經拿到offer了\n就等年終入帳那天提離職', '名無しさん', 6);
  await insertReply(t2, '我也想跳 但房貸在身不敢衝\n穩定最重要', '名無しさん', 5);
  await insertReply(t2, 'AI相關職缺薪水真的開很高\n但要求也很高 不是隨便轉就行', '名無しさん', 4.5);
  await insertReply(t2, '年前面試拿offer\n年後第一天提離職\n這是最佳時間線', '轉職達人', 4);
  await insertReply(t2, '拜託不要裸辭\n找好下家再走\n我上次裸辭休了三個月回不去了', '過來人', 3);
  await insertReply(t2, '今年科技業不錯\n傳產就不好說了\n看產業', '名無しさん', 2);

  // ============================================================
  // [love] 金錢觀不合到底能不能在一起
  // ============================================================
  console.log('[love] 金錢觀不合');
  const t3 = await insertThread('love',
    '金錢觀不合到底能不能在一起',
    '跟男友交往快一年\n各方面都很合 長相個性都是天菜\n\n但金錢觀差超多\n他覺得錢就是要花的 享受當下\n我是會存錢跟記帳的那種\n\n每次出去吃飯他都要吃好的\n我覺得偶爾就好平常省一點\n\n這種差異以後結婚會更嚴重吧\n該下船嗎',
    '名無しさん', 10);
  await insertReply(t3, '金錢觀是感情中最重要的事之一\n比起個性不合更難磨合', '名無しさん', 9);
  await insertReply(t3, '交往一年就發現了算幸運\n結婚後才發現的更痛苦', '名無しさん', 8);
  await insertReply(t3, '看他願不願意改啊\n如果連溝通都不願意那真的可以考慮了', '名無しさん', 7);
  await insertReply(t3, '我跟我老婆也是這樣\n後來約定每月各存一筆共同帳戶\n剩下的自己花 互不干涉\n目前還行', '過來人', 6);
  await insertReply(t3, '不是不能在一起\n但一定要在結婚前談清楚\n不然以後吵不完', '名無しさん', 5);
  await insertReply(t3, '月光族不是罪\n但如果完全沒有儲蓄意識\n未來一起面對房貸小孩學費時會很辛苦', '名無しさん', 3);

  // ============================================================
  // [love] 過年見家長 對方家族一直打麻將我好尷尬
  // ============================================================
  console.log('[love] 過年見家長');
  const t4 = await insertThread('love',
    '過年見家長 對方家族一直打麻將我好尷尬',
    '今年第一次去男友家過年\n結果他們全家都在打麻將\n我完全不會打\n\n坐在旁邊滑手機超級尷尬\n男友也在打 根本沒空理我\n\n是不是應該學一下麻將\n還是以後找藉口不要去了',
    '麻將苦手', 6);
  await insertReply(t4, '學啊 麻將超好玩的\n而且學會了跟長輩打牌是最快拉近關係的方式', '名無しさん', 5);
  await insertReply(t4, '我第一年也是這樣\n後來學會了 現在過年反而最期待打牌', '名無しさん', 4.5);
  await insertReply(t4, '你男友不對\n帶你去他家應該要顧你\n不是丟著你自己去打牌', '名無しさん', 4);
  await insertReply(t4, '台灣過年文化就是這樣啦\n不打麻將的就幫忙洗水果倒茶\n融入就好', '名無しさん', 2.5);
  await insertReply(t4, '手機下載神來也先練\n基本規則一個下午就會了', '名無しさん', 2);

  // ============================================================
  // [life] Costco美食區以後非會員不能進了
  // ============================================================
  console.log('[life] Costco新制');
  const t5 = await insertThread('life',
    'Costco美食區以後非會員不能進了',
    '好市多2026年四大新制\n美食區要刷會員卡才能買\n非會員不能進了\n\n1.5美元熱狗套餐只給會員\n獨立加油站也要會員\n結帳導入預掃描\n藥局透明化定價\n\n台灣應該也會跟進吧\n以後不能蹭美食區了',
    '名無しさん', 9);
  await insertReply(t5, '早該這樣了\n美食區永遠一堆非會員在排隊\n會員反而買不到', '名無しさん', 8);
  await insertReply(t5, '可是台灣美食區本來就在裡面\n沒會員卡根本進不去啊\n是在緊張什麼', '名無しさん', 7);
  await insertReply(t5, '有些店美食區在外面的\n不用進賣場就能買', '名無しさん', 6);
  await insertReply(t5, '那個熱狗套餐漲到60塊的那天\n我就不去了', '名無しさん', 5);
  await insertReply(t5, '預掃描不錯\n排隊結帳真的是Costco最大的痛點\n尤其假日', '名無しさん', 4);
  await insertReply(t5, '年費都漲了\n會員福利本來就應該更好', '名無しさん', 3);

  // ============================================================
  // [life] 新台幣要改版了 你覺得該放什麼圖案
  // ============================================================
  console.log('[life] 新台幣改版');
  const t6 = await insertThread('life',
    '新台幣要改版了 你覺得該放什麼圖案',
    '央行今天宣布新台幣改版\n主題是「臺灣之美」\n有12種面額主題\n還會開放民眾參與\n\n終於要換了\n現在的鈔票設計真的很老\n你們覺得該放什麼',
    '名無しさん', 7);
  await insertReply(t6, '玉山一定要有\n然後放台灣黑熊', '名無しさん', 6);
  await insertReply(t6, '拜託不要再放政治人物了\n放自然風景跟動物就好', '名無しさん', 5);
  await insertReply(t6, '日本的鈔票改版就做得很好\n葛飾北齋的浮世繪超美\n台灣也可以放原住民圖騰', '名無しさん', 4.5);
  await insertReply(t6, '放101啊\n全世界最有辨識度的台灣地標', '名無しさん', 4);
  await insertReply(t6, '希望有夜市\n珍珠奶茶也行\n代表台灣文化', '名無しさん', 3);
  await insertReply(t6, '放帝雉 藍腹鷴 石虎\n台灣特有種最棒了', '鳥控', 2);
  await insertReply(t6, '各面額放不同的山或國家公園\n太魯閣 阿里山 墾丁 都很美', '名無しさん', 1.5);

  // ============================================================
  // [money] 台股破32000 Q1能上34000嗎
  // ============================================================
  console.log('[money] 台股破32000');
  const t7 = await insertThread('money',
    '台股破32000 Q1能上34000嗎',
    '今天收盤32317點\n又創歷史新高\n台積電聯電台達電帶頭衝\n\n投顧喊樂觀情境34000\n台積電目標1500-1900\n2nm量產如果順利甚至看2000\n\n但Q1可能有波動\n你們有加碼嗎',
    '名無しさん', 5);
  await insertReply(t7, '台積電一家就佔指數五分之一\n台股根本是台積電ETF', '名無しさん', 4);
  await insertReply(t7, '34000太樂觀了吧\n先站穩32000再說', '名無しさん', 3.5);
  await insertReply(t7, '去年說30000是天花板\n現在看起來只是地板\n不要預設立場', '名無しさん', 3);
  await insertReply(t7, 'AI長線沒問題\n但短線漲多就是風險\nQ1要小心', '名無しさん', 2.5);
  await insertReply(t7, '定期定額0050不要停就對了\n不猜漲跌', '名無しさん', 2);
  await insertReply(t7, '群創那個量你們看了嗎\n散戶真的是勇猛', '名無しさん', 1.5);

  // ============================================================
  // [money] 2026年到底該不該買房
  // ============================================================
  console.log('[money] 該不該買房');
  const t8 = await insertThread('money',
    '2026年到底該不該買房',
    '看了一堆分析\n說今年房市「量平價修」\n首購自住是主力 投資客退場\n\n新青安2.0要出了\n但信用管制還沒鬆\n銀行房貸也不好借\n\n手上有頭期款\n到底現在該買還是再等等',
    '首購族', 8);
  await insertReply(t8, '自住就買\n不要想抄底\n你等得起嗎', '名無しさん', 7);
  await insertReply(t8, '南部跌比較多\n北部其實沒什麼降\n看你在哪', '名無しさん', 6);
  await insertReply(t8, '新青安2.0如果條件不錯\n等出來再看也不遲', '名無しさん', 5);
  await insertReply(t8, '量平價修的意思就是\n不會大跌 但也不會再漲\n現在買不會虧但也別期待賺', '名無しさん', 4);
  await insertReply(t8, '我去年底看了10幾間\n發現賣方開始願意談價了\n比前年好議價很多', '名無しさん', 3);
  await insertReply(t8, '先算一下你的月付能力\n房貸不要超過收入三分之一\n這比時機重要', '名無しさん', 2);

  // ============================================================
  // [gossip] 曹西平告別式今天 「率真・謝幕」
  // ============================================================
  console.log('[gossip] 曹西平告別式');
  const t9 = await insertThread('gossip',
    '曹西平告別式今天 「率真・謝幕」',
    '資深藝人曹西平上月底猝逝\n享壽66歲\n\n今天舉辦告別式\n主題是「率真・謝幕」\n\n他在演藝圈的直言風格\n不管你喜不喜歡\n都是很有特色的一位',
    '名無しさん', 4);
  await insertReply(t9, '66歲太年輕了\n猝逝真的很突然\nR.I.P.', '名無しさん', 3.5);
  await insertReply(t9, '他在節目上罵人真的很好笑\n但私底下聽說人很好', '名無しさん', 3);
  await insertReply(t9, '率真謝幕 這主題取得很好\n完全就是他的風格', '名無しさん', 2.5);
  await insertReply(t9, '以前看他在綜藝節目\n講話超直 完全不修飾\n現在這種藝人很少了', '七年級', 2);
  await insertReply(t9, '希望他走得安詳\n一路好走', '名無しさん', 1.5);

  // ============================================================
  // [tech] AI吃電太兇 資料中心搶電比搶伺服器還難
  // ============================================================
  console.log('[tech] AI吃電');
  const t10 = await insertThread('tech',
    'AI吃電太兇 資料中心搶電比搶伺服器還難',
    '現在AI產業最大的瓶頸\n不是GPU不夠 是電力不夠\n\n資料中心擴建的瓶頸\n已經從伺服器交期變成能不能取得穩定電力\n\n台灣的電力供應本來就吃緊\n現在AI又要來搶電\n核電議題又要被拿出來吵了',
    '名無しさん', 6);
  await insertReply(t10, '微軟都在研究小型核反應爐了\n電力真的是AI的最大限制', '名無しさん', 5);
  await insertReply(t10, '台灣電價本來就太便宜\n電力公司虧損累累\n這樣下去遲早出問題', '名無しさん', 4.5);
  await insertReply(t10, '所以綠能不是選擇而是必須\n太陽能風力都要加速佈建', '名無しさん', 4);
  await insertReply(t10, '綠能不穩定啊\n資料中心要的是24/7不斷電\n太陽能晚上不發電你怎麼辦', '名無しさん', 3);
  await insertReply(t10, '核融合才是終極解答\n但短期內看不到商轉', '名無しさん', 2.5);
  await insertReply(t10, '台電應該趁這個機會\n跟科技業者談電力合約\n讓他們自己出錢蓋電廠', '名無しさん', 2);

  console.log('\n=== 完成 ===');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
