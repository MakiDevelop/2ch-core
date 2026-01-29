#!/usr/bin/env tsx
/**
 * 2026/1/29 新增討論串
 * 基於今日時事新增討論串
 * 目標版塊：meta, acg, gossip, love, work (討論串數量最少的版塊)
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
  console.log('=== 新增討論串 (2026-01-29) ===\n');

  // ============================================================
  // [acg] 魔物獵人荒野評價持續下滑 現在才19%好評
  // ============================================================
  console.log('[acg] 魔物獵人荒野評價');
  const t1 = await insertThread('acg',
    '魔物獵人荒野評價持續下滑 現在才19%好評',
    '荒野當初開服同上138萬人\n結果現在掉到1萬多人\n比世界還少\n\nSteam最近8000則評論只有19%好評\n直接變壓倒性負評\n\n玩家三大怨念：\n內容太少、最佳化太差、更新太慢\n\n卡普空要怎麼救',
    '獵人', 8);
  await insertReply(t1, '我就說發售就買的都是白老鼠\n等個半年一年DLC出完再買', '名無しさん', 7);
  await insertReply(t1, '畫面是真的美\n但優化爛到爆\n3080都跑不動', '名無しさん', 6);
  await insertReply(t1, 'CAPCOM這幾年財報太好\n開始擺爛了\n看看龍信2也是半成品', '名無しさん', 5);
  await insertReply(t1, '內容量真的少\n大型怪就那幾隻\n刷個幾天就沒東西玩了', '名無しさん', 4);
  await insertReply(t1, '世界加Iceborne的組合太強\n荒野根本比不上', '冰原老兵', 3);
  await insertReply(t1, '9月還有跟FF14聯動\n看會不會拉回一些玩家', '名無しさん', 2);
  await insertReply(t1, '等G位DLC吧\n本體就當作試玩版', '名無しさん', 1.5);

  // ============================================================
  // [acg] 蜘蛛人2 PC版明天發售 各位準備好了嗎
  // ============================================================
  console.log('[acg] 蜘蛛人2 PC版');
  const t2 = await insertThread('acg',
    '蜘蛛人2 PC版明天發售 各位準備好了嗎',
    '漫威蜘蛛人2\n1/30 PC版終於出了\nPS5獨佔不到2年就上PC\n\n這代有雙蜘蛛人可以切換\n猛毒劇情也超讚\n\n各位要入手嗎\n還是等特價',
    '蜘蛛控', 6);
  await insertReply(t2, '預購了\n一代玩過超爽\n盪來盪去的感覺太棒', '名無しさん', 5);
  await insertReply(t2, '等夏特打折\n索尼第一方遊戲折扣都很慢', '名無しさん', 4.5);
  await insertReply(t2, '希望優化不要像地平線一樣爛\n索尼PC移植有時候很雷', '名無しさん', 4);
  await insertReply(t2, '猛毒超帥\n光看預告片就爽了', '名無しさん', 3);
  await insertReply(t2, 'PS5玩過了\n二周目沒動力\n等便宜再買PC版', '名無しさん', 2.5);
  await insertReply(t2, '這代紐約地圖超大\n加上布魯克林和皇后區', '名無しさん', 2);

  // ============================================================
  // [gossip] F4合體破局 朱孝天道歉了
  // ============================================================
  console.log('[gossip] F4合體破局');
  const t3 = await insertThread('gossip',
    'F4合體破局 朱孝天道歉了',
    'F4原本要合體開演唱會\n結果朱孝天跟團隊撕破臉\n\n之前在粉絲群組亂嗆\n還點名大麥跟黃牛掛勾\n甚至抹黑F3跟阿信\n\n現在道歉說「情緒失控」\n但演唱會已經變F3+阿信了\n\n這算是徹底被踢出去了吧',
    '名無しさん', 10);
  await insertReply(t3, '流星花園的回憶啊\n結果搞成這樣\n可惜了', '七年級', 9);
  await insertReply(t3, '情緒失控不是藉口\n公開場合講那種話\n以後誰敢跟他合作', '名無しさん', 8);
  await insertReply(t3, '去年五月天演唱會F4合體\n氣氛超好的\n沒想到私底下有這些事', '名無しさん', 7);
  await insertReply(t3, '新歌《恆星不忘Forever Forever》超好聽\n可惜就是少了Ken', '名無しさん', 6);
  await insertReply(t3, '他這幾年本來就比較邊緣化\n其他三個發展都比較好', '名無しさん', 5);
  await insertReply(t3, '道歉也來不及了\n這種事情發生過一次\n信任就回不去了', '名無しさん', 4);

  // ============================================================
  // [gossip] 12/27宜蘭7.0地震 藝人錄影穿古裝逃命
  // ============================================================
  console.log('[gossip] 宜蘭強震');
  const t4 = await insertThread('gossip',
    '12/27宜蘭7.0地震 藝人錄影穿古裝逃命',
    '上個月27號的7.0大地震\n全台有感\n\n《週末最強大》深夜錄影遇到\n11個藝人穿著古裝急護頭撤離\n畫面超好笑又心酸\n\n韓國女星金佳垠來台第一次遇地震\n說嚇到腿軟\n\n規模7只比921小\n大家那天有怕嗎',
    '名無しさん', 7);
  await insertReply(t4, '那天我在台北\n搖超久的\n還以為要921重演', '名無しさん', 6);
  await insertReply(t4, '穿古裝逃命wwww\n這畫面太有戲了', '名無しさん', 5.5);
  await insertReply(t4, '氣象署說這是隱沒帶地震\n所以餘震比較少\n花蓮那次震完餘震超多', '名無しさん', 5);
  await insertReply(t4, '16顆原子彈威力欸\n想想都可怕', '名無しさん', 4);
  await insertReply(t4, '地震來了台灣人還是躺著滑手機看地震文\n我就是', '名無しさん', 3);
  await insertReply(t4, '外國人來台灣第一次遇地震都會嚇到\n我們已經習慣了', '名無しさん', 2);

  // ============================================================
  // [love] 金錢觀差異婚前一定要談清楚
  // ============================================================
  console.log('[love] 金錢觀差異');
  const t5 = await insertThread('love',
    '金錢觀差異婚前一定要談清楚',
    '最近AI統計2025戀愛問題\n金錢觀差異是熱門議題\n\n想問大家\n你們跟另一半金錢觀差很多嗎\n是怎麼處理的\n\n我男友月光族\n我是會記帳存錢的\n每次出去他都要吃好的\n我壓力好大',
    '記帳控', 9);
  await insertReply(t5, '我跟老婆約定好\n各出固定比例到共同帳戶\n剩下的自己管\n這樣就不會吵', '名無しさん', 8);
  await insertReply(t5, '婚前不談清楚\n婚後吵到離婚的一堆\n錢的問題最現實', '名無しさん', 7);
  await insertReply(t5, '可以試著一起記帳\n讓他知道錢花去哪\n有些人只是沒概念而已', '名無しさん', 6);
  await insertReply(t5, '月光族不一定不好\n但完全沒儲蓄觀念的\n以後買房養小孩會很辛苦', '名無しさん', 5);
  await insertReply(t5, '>>2\n這個方法不錯\n各管各的帳但有共同的存款目標', '名無しさん', 4);
  await insertReply(t5, '如果溝通無效\n真的要考慮了\n價值觀這種東西很難改', '名無しさん', 3);

  // ============================================================
  // [love] 過年被問什麼時候結婚怎麼回
  // ============================================================
  console.log('[love] 過年被問結婚');
  const t6 = await insertThread('love',
    '過年被問什麼時候結婚怎麼回',
    '過年回家\n長輩親戚一定問\n「什麼時候結婚」「有對象了嗎」\n\n超煩的\n大家都怎麼應對\n\n我已經交往三年了\n但還沒打算結\n不想解釋那麼多',
    '名無しさん', 8);
  await insertReply(t6, '直接說「你要幫我付禮金嗎」\n他們就不敢再問了', '名無しさん', 7);
  await insertReply(t6, '我都說等房價跌再說\n長輩就會開始抱怨房價然後話題就轉走了', '名無しさん', 6);
  await insertReply(t6, '笑笑帶過就好\n不用認真回應\n反正明年還是會問', '名無しさん', 5);
  await insertReply(t6, '我媽會幫我擋\n自己家人要先溝通好', '名無しさん', 4.5);
  await insertReply(t6, '反問他們「你有認識適合的要介紹嗎」\n如果沒有就閉嘴', '名無しさん', 4);
  await insertReply(t6, '交往三年不想結\n是不是該跟對方確認一下彼此想法', '認真的人', 3);

  // ============================================================
  // [work] 2026徵才降溫但加薪升溫 你信嗎
  // ============================================================
  console.log('[work] 2026徵才市場');
  const t7 = await insertThread('work',
    '2026徵才降溫但加薪升溫 你信嗎',
    '104最新報告\n2026年企業徵才趨於保守\n但91%企業會調薪\n77%調幅在1-5%\n\n然後AI相關職缺還是搶手\n轉職可能有15-20%薪資成長\n\n各位的公司有要加薪嗎\n還是又要凍薪了',
    '社畜', 7);
  await insertReply(t7, '1-5%是在調心酸的嗎\n物價漲幅都不只這樣', '名無しさん', 6);
  await insertReply(t7, '我們公司說「配合整體經濟環境」\n翻譯：今年沒有', '名無しさん', 5.5);
  await insertReply(t7, 'AI工程師現在超搶手\n會的人根本不愁沒工作', '名無しさん', 5);
  await insertReply(t7, '傳產哪來15-20%\n能有3%就偷笑了', '名無しさん', 4);
  await insertReply(t7, '大公司還是有在調\n但幅度真的不大\n通膨吃掉差不多', '名無しさん', 3);
  await insertReply(t7, '想轉AI但沒有相關背景\n不知道從哪裡開始', '名無しさん', 2);

  // ============================================================
  // [work] 中高齡就業專法上路 65歲不用強制退休了
  // ============================================================
  console.log('[work] 中高齡就業');
  const t8 = await insertThread('work',
    '中高齡就業專法上路 65歲不用強制退休了',
    '2026台灣正式進入超高齡社會\n政府推中高齡就業促進專法\n鬆綁65歲強制退休規定\n\n企業要推「全齡人才」政策\n以後可能60幾歲的同事會更多\n\n各位怎麼看',
    '名無しさん', 9);
  await insertReply(t8, '少子化勞動力不足\n不讓老人繼續工作\n誰來做事', '名無しさん', 8);
  await insertReply(t8, '日本已經這樣很久了\n便利商店都是阿公阿嬤在顧', '名無しさん', 7);
  await insertReply(t8, '但年輕人的位子會不會被卡住\n升遷更難', '名無しさん', 6);
  await insertReply(t8, '>>4\n這確實是問題\n但反過來說\n經驗傳承也很重要', '名無しさん', 5);
  await insertReply(t8, '體力活應該還是會退\n但坐辦公室的確實可以做更久', '名無しさん', 4);
  await insertReply(t8, '退休後沒事做也很無聊\n能繼續工作對老人家精神健康也好', '名無しさん', 3);

  // ============================================================
  // [meta] 希望可以有夜間模式
  // ============================================================
  console.log('[meta] 夜間模式');
  const t9 = await insertThread('meta',
    '希望可以有夜間模式',
    '深夜逛版\n白色背景有點刺眼\n\n希望站方可以加個夜間模式\n眼睛會舒服很多\n\n或者是自動偵測時間切換也行',
    '夜貓子', 6);
  await insertReply(t9, '+1 現在很多網站都有了\n這應該是基本功能', '名無しさん', 5);
  await insertReply(t9, '用瀏覽器套件先擋吧\nDark Reader之類的', '名無しさん', 4);
  await insertReply(t9, '站方有在看嗎\n這個建議真的不錯', '名無しさん', 3);
  await insertReply(t9, '深色背景配淺色字\n比較護眼', '名無しさん', 2.5);
  await insertReply(t9, '手機APP也希望有\n不然半夜看很傷眼', '名無しさん', 2);

  // ============================================================
  // [meta] 可以考慮加個訂閱討論串功能嗎
  // ============================================================
  console.log('[meta] 訂閱功能');
  const t10 = await insertThread('meta',
    '可以考慮加個訂閱討論串功能嗎',
    '有時候看到有興趣的討論\n想追蹤後續發展\n但過幾天就找不到了\n\n如果可以訂閱討論串\n有新回覆會通知\n這樣就不會漏掉想看的內容',
    '名無しさん', 10);
  await insertReply(t10, '好像很多論壇都有這功能\n支持', '名無しさん', 9);
  await insertReply(t10, '現在只能自己書籤\n很不方便', '名無しさん', 8);
  await insertReply(t10, '站方之前有說在規劃會員功能\n不知道進度如何', '名無しさん', 7);
  await insertReply(t10, '通知的話用email還是站內信\n我傾向站內信', '名無しさん', 5);
  await insertReply(t10, '這功能有的話\n黏著度會提升很多', '名無しさん', 3);

  console.log('\n=== 完成 ===');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
