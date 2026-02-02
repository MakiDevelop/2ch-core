#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-24 - 新增討論串主題與回覆
 *
 * 基於真實時事來源：
 * - Alex Honnold 攀登101延期至1/25上午9點（因天候）
 * - WBC經典賽：中華隊1/15開始集訓，陳傑憲隊長，3/5東京巨蛋首戰
 * - 大谷翔平確認出戰WBC，可能對決中華隊
 * - 2025年台灣詐騙財損893億，網購詐騙最常見
 * - 2026春節2/14-2/22共9天，小年夜不用補班
 * - 台灣燈會在嘉義，3/3-3/15，主燈是阿里山神木
 * - 台積電外資目標價上調至2400元
 * - 假銀行郵件詐騙、AI深偽詐騙盛行
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

async function insertThread(
  boardSlug: string,
  title: string,
  content: string,
  authorName: string = '名無しさん',
  hoursAgo: number = 1
): Promise<number> {
  const boardResult = await pool.query('SELECT id FROM boards WHERE slug = $1', [boardSlug]);
  if (boardResult.rows.length === 0) {
    throw new Error(`Board ${boardSlug} not found`);
  }
  const boardId = boardResult.rows[0].id;

  const result = await pool.query(
    `INSERT INTO posts (content, status, ip_hash, user_agent, parent_id, board_id, title, author_name, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - INTERVAL '1 hour' * $9)
     RETURNING id`,
    [content, 0, generateIpHash(), randomUserAgent(), null, boardId, title, authorName, hoursAgo]
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
     VALUES ($1, $2, $3, $4, $5, NULL, $6, NOW() - INTERVAL '1 hour' * $7)`,
    [content, 0, generateIpHash(), randomUserAgent(), parentId, authorName, hoursAgo]
  );
}

async function seedThreads() {
  console.log('📝 新增討論串主題與回覆 (2026-01-24)...\n');

  // ========== NEWS 板：霍諾德攀登101延期 ==========
  console.log('  🧗 [news] 霍諾德攀登101延期到明天');
  const t1 = await insertThread(
    'news',
    '霍諾德攀登101因大雨延期到明天了',
    '原本今天1/24要爬的\n結果台北一直下雨\nNetflix改到明天早上9點直播\n\n賈永婕說「老天建議我們改成明天早上九時」',
    '名無しさん',
    3
  );
  await insertReply(t1, '我還請假準備去信義廣場看\n白請了', '名無しさん', 2);
  await insertReply(t1, '>>2 明天是週日\n不用請假', '名無しさん', 2);
  await insertReply(t1, 'Netflix全球同步直播\n在家看比較舒服', '名無しさん', 2);
  await insertReply(t1, '>>4 508公尺不帶繩索\n真的超猛', '名無しさん', 1);
  await insertReply(t1, '他之前Free Solo拿奧斯卡\n那部紀錄片必看', '名無しさん', 1);
  await insertReply(t1, '>>6 酋長岩3000英尺\n這次101才508公尺\n應該沒問題', '名無しさん', 1);

  // ========== NEWS 板：WBC中華隊集訓 ==========
  console.log('  ⚾ [news] WBC中華隊集訓開始');
  const t2 = await insertThread(
    'news',
    'WBC中華隊集訓開始了，陳傑憲當隊長',
    '1/15在左營國訓中心開訓\n31人報到\n陳傑憲繼續當隊長\n\n3/5東京巨蛋首戰\n同組有日本、韓國、澳洲、捷克',
    '棒球迷',
    12
  );
  await insertReply(t2, '大谷翔平確認出賽\n3/6可能對決', '名無しさん', 11);
  await insertReply(t2, '>>2 日本又是死亡之組\n只有兩張晉級門票', '名無しさん', 10);
  await insertReply(t2, '陳冠宇35歲了還加入\n老將精神可嘉', '名無しさん', 9);
  await insertReply(t2, '>>4 農曆年後移師大巨蛋調整\n2月底跟日職交流賽', '名無しさん', 8);
  await insertReply(t2, '門票1/15開賣\n搶到了嗎', '名無しさん', 7);
  await insertReply(t2, '>>6 海外售票每單限4張\n黃牛又要發財', '名無しさん', 6);

  // ========== NEWS 板：詐騙財損 ==========
  console.log('  🚨 [news] 2025年詐騙財損近900億');
  const t3 = await insertThread(
    'news',
    '2025年全台詐騙財損893億，越來越誇張',
    '165打詐儀錶板統計\n去年詐騙財損893.26億\n受理16.2萬件\n\n最常見是網購詐騙（4140件）\n再來假投資（1280件）',
    '名無しさん',
    8
  );
  await insertReply(t3, '我媽差點被假投資騙\n還好有先問我', '名無しさん', 7);
  await insertReply(t3, '>>2 現在AI深偽超逼真\nDeepfake視訊都有', '名無しさん', 6);
  await insertReply(t3, '假銀行郵件也很多\n說什麼扣款取消交易', '名無しさん', 5);
  await insertReply(t3, '>>4 銀行不會用郵件要你輸入個資\n基本常識', '名無しさん', 4);
  await insertReply(t3, '有人被假冒名醫騙20萬\n買什麼特效藥', '名無しさん', 3);
  await insertReply(t3, '>>6 LINE帳號盜取也很猖狂\n朋友突然要借錢都要小心', '名無しさん', 2);

  // ========== GOSSIP 板：台灣燈會 ==========
  console.log('  🏮 [gossip] 2026台灣燈會在嘉義');
  const t4 = await insertThread(
    'gossip',
    '2026台灣燈會在嘉義，主燈是阿里山神木',
    '3/3到3/15在嘉義\n主題「光躍台灣·點亮嘉義」\n\n今年主燈不是生肖了\n改用阿里山神木當主題',
    '名無しさん',
    6
  );
  await insertReply(t4, '終於不是生肖\n每年都差不多', '名無しさん', 5);
  await insertReply(t4, '>>2 嘉義交通會很塞\n要有心理準備', '名無しさん', 4);
  await insertReply(t4, '可以順便去阿里山\n櫻花季也快了', '名無しさん', 3);
  await insertReply(t4, '>>4 武陵農場櫻花也不錯\n但超難訂房', '名無しさん', 2);
  await insertReply(t4, '高鐵有加開班次嗎\n到嘉義再轉車', '名無しさん', 1);
  await insertReply(t4, '>>6 嘉義BRT應該會配合疏運\n關注官方公告', '名無しさん', 1);

  // ========== GOSSIP 板：大谷翔平 ==========
  console.log('  ⭐ [gossip] 大谷翔平確認出戰WBC');
  const t5 = await insertThread(
    'gossip',
    '大谷翔平確認出戰WBC了！',
    '日本隊二刀流回歸\n要挑戰衛冕冠軍\n\n3/6可能對上中華隊\n超期待',
    '野球迷',
    10
  );
  await insertReply(t5, '大谷打擊超猛\n但這次應該只投不打', '名無しさん', 9);
  await insertReply(t5, '>>2 道奇不會讓他投太多吧\n季賽比較重要', '名無しさん', 8);
  await insertReply(t5, '中華隊打線能碰到大谷嗎\n那也是一種榮幸', '名無しさん', 7);
  await insertReply(t5, '>>4 2023那屆好可惜\n差一點就贏日本', '名無しさん', 6);
  await insertReply(t5, '這屆投手陣容不錯\n有機會爆冷', '名無しさん', 5);
  await insertReply(t5, '>>6 先過澳洲韓國再說\n別太樂觀', '名無しさん', 4);

  // ========== MONEY 板：台積電目標價 ==========
  console.log('  📈 [money] 台積電外資目標價2400');
  const t6 = await insertThread(
    'money',
    '外資把台積電目標價調到2400了',
    'Aletheia資本報告\n2027年EPS有機會挑戰100元\n目標價從2100調到2400\n\n現在1695元\n還有700元空間？',
    '股票族',
    8
  );
  await insertReply(t6, '1695已經很高了\n追高怕被套', '名無しさん', 7);
  await insertReply(t6, '>>2 台積電不一樣\n護國神山', '名無しさん', 6);
  await insertReply(t6, '市值全球第6了\n超越Meta跟博通', '名無しさん', 5);
  await insertReply(t6, '>>4 CoWoS產能供不應求\nAI晶片太猛', '名無しさん', 4);
  await insertReply(t6, '2026-2029連續四年漲價\n客戶只能買單', '名無しさん', 3);
  await insertReply(t6, '>>6 先進製程根留台灣\n國科會有說', '名無しさん', 2);

  // ========== LIFE 板：春節連假 ==========
  console.log('  🧧 [life] 春節連假9天怎麼安排');
  const t7 = await insertThread(
    'life',
    '春節連假9天大家怎麼安排？',
    '2/14-2/22放9天\n今年小年夜不用補班了\n\n有人請2/23-2/26\n直接連休16天到228',
    '名無しさん',
    5
  );
  await insertReply(t7, '回南部待3天就受不了\n親戚問話轟炸', '名無しさん', 4);
  await insertReply(t7, '>>2 我已經訂好離島機票\n直接逃跑', '名無しさん', 4);
  await insertReply(t7, '高鐵票搶到了嗎\n1/13開賣的', '名無しさん', 3);
  await insertReply(t7, '>>4 用APP搶\n秒殺', '名無しさん', 3);
  await insertReply(t7, '想去武陵農場賞櫻\n但訂不到房', '名無しさん', 2);
  await insertReply(t7, '>>6 九族文化村也有櫻花\n比較好訂', '名無しさん', 1);

  // ========== LIFE 板：過年泡溫泉 ==========
  console.log('  ♨️ [life] 過年想去泡溫泉');
  const t8 = await insertThread(
    'life',
    '過年想帶家人去泡溫泉，有推薦嗎？',
    '初三到初五想出門\n不想人擠人\n泡溫泉放鬆一下\n\n北投？礁溪？谷關？',
    '名無しさん',
    4
  );
  await insertReply(t8, '過年哪裡都人擠人\n認命吧', '名無しさん', 3);
  await insertReply(t8, '>>2 冷門一點的\n烏來或金山', '溫泉控', 3);
  await insertReply(t8, '礁溪最方便\n但過年房價三倍起跳', '名無しさん', 2);
  await insertReply(t8, '>>4 日租湯屋比較划算\n不住過夜', '名無しさん', 2);
  await insertReply(t8, '谷關要開車\n但比較不擠', '名無しさん', 1);
  await insertReply(t8, '>>6 台東知本也不錯\n順便玩東部', '名無しさん', 1);

  // ========== LOVE 板：過年見家長 ==========
  console.log('  💕 [love] 過年要去見另一半家長');
  const t9 = await insertThread(
    'love',
    '第一次過年去見另一半家長，好緊張',
    '交往一年多\n今年要去他家過年\n完全不知道要帶什麼禮物\n\n而且要住兩天...',
    '名無しさん',
    6
  );
  await insertReply(t9, '水果禮盒最安全\n不會出錯', '名無しさん', 5);
  await insertReply(t9, '>>2 先問另一半家人喜好\n別自己猜', '過來人', 5);
  await insertReply(t9, '紅包要包嗎\n還是送禮就好', '名無しさん', 4);
  await insertReply(t9, '>>4 第一次不用包紅包\n禮物誠意夠就好', '名無しさん', 3);
  await insertReply(t9, '記得多幫忙\n不要只坐著滑手機', '名無しさん', 2);
  await insertReply(t9, '>>6 放輕鬆\n他們也會緊張的', '名無しさん', 1);

  // ========== LOVE 板：遠距離過年 ==========
  console.log('  💔 [love] 遠距離過年怎麼辦');
  const t10 = await insertThread(
    'love',
    '遠距離戀愛過年各自回家，好想對方',
    '他在北部工作\n我在南部\n過年各自回老家\n9天見不到面...',
    '名無しさん',
    5
  );
  await insertReply(t10, '視訊啊\n現在科技很方便', '名無しさん', 4);
  await insertReply(t10, '>>2 在長輩面前視訊很尷尬\n會被問東問西', '名無しさん', 4);
  await insertReply(t10, '約初四一起出去玩\n找個中間點', '名無しさん', 3);
  await insertReply(t10, '>>4 過年交通很難訂\n高鐵搶不到', '名無しさん', 2);
  await insertReply(t10, '9天而已\n撐一下', '名無しさん', 2);
  await insertReply(t10, '>>6 可以傳訊息\n或約好每天視訊時間', '名無しさん', 1);

  // ========== ACG 板：春節玩什麼遊戲 ==========
  console.log('  🎮 [acg] 春節連假玩什麼遊戲');
  const t11 = await insertThread(
    'acg',
    '春節連假9天想補完遊戲',
    '過年待在家\n想趁機把積的遊戲清一清\n\n艾爾登法環DLC還沒打\n薩爾達也還沒破關',
    '遊戲宅',
    4
  );
  await insertReply(t11, 'Switch 2有買嗎\n可以玩新遊戲', '名無しさん', 3);
  await insertReply(t11, '>>2 FromSoftware新作要2026年底\n先等等', '名無しさん', 3);
  await insertReply(t11, '過年打艾爾登\n家人會以為你在生氣', '名無しさん', 2);
  await insertReply(t11, '>>4 我都戴耳機\n隔絕親戚問話', '名無しさん', 2);
  await insertReply(t11, '推薦薩爾達\n開放世界適合慢慢玩', '名無しさん', 1);
  await insertReply(t11, '>>6 小心一玩就天亮\n過年生理時鐘會亂', '名無しさん', 1);

  // ========== ACG 板：春節追番 ==========
  console.log('  📺 [acg] 過年追什麼動畫');
  const t12 = await insertThread(
    'acg',
    '過年追番清單分享',
    '冬番開播快一個月了\n趁過年追進度\n\n芙莉蓮第二季必追\n咒術迴戰死滅迴游也要補',
    'ACG宅',
    5
  );
  await insertReply(t12, '達爾文事變推\n社會派題材', '名無しさん', 4);
  await insertReply(t12, '>>2 我推的孩子第三季\n劇情越來越黑暗', '名無しさん', 4);
  await insertReply(t12, '地獄樂第二季也開了\n戰鬥場面很讚', '名無しさん', 3);
  await insertReply(t12, '>>4 這季太多神番\n追不完', '名無しさん', 2);
  await insertReply(t12, '戀愛番推相反的你和我\n很甜', '名無しさん', 2);
  await insertReply(t12, '>>6 過年配動畫吃零食\n完美', '名無しさん', 1);

  console.log('\n✅ 完成！新增 12 個討論串，共 84 則內容（12主題+72回覆）');
}

seedThreads()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
