#!/usr/bin/env tsx
/**
 * 2026/1/25 時事新聞種子腳本
 * 基於真實新聞事件，補充稀缺版塊的討論串
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

// 取得討論串目前的回覆數，計算下一個樓層
async function getReplyCount(threadId: number): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM posts WHERE parent_id = $1',
    [threadId]
  );
  return parseInt(result.rows[0].count);
}

async function main() {
  console.log('🌱 開始新增基於時事的討論串...\n');

  // ==================== news 版 ====================
  console.log('📰 news 版 - 時事/政治\n');

  // 1. 台美關稅談判
  const thread1 = await insertThread(
    'news',
    '台美關稅談判有進展 傳降至15%',
    '紐時報導台美接近達成貿易協議\n美國對台進口關稅將從原本的對等關稅降至15%\n鄭麗君副院長14日已經赴美磋商\n\n這算是好消息嗎？',
    '名無しさん',
    36
  );
  await insertReply(thread1, '15%還是很高吧\n但比起其他國家算好了', '名無しさん', 34);
  await insertReply(thread1, '鄭麗君去談的\n看來真的要選台北市長了', '政治觀察者', 32);
  await insertReply(thread1, '>>1\n至少有在談\n不像某些國家直接被課重稅', '名無しさん', 30);
  await insertReply(thread1, '半導體應該會有特殊待遇吧', '名無しさん', 28);
  await insertReply(thread1, '>>4\n台積電護國神山不是叫假的', '名無しさん', 26);
  console.log(`  ✅ #${thread1} 台美關稅談判`);

  // 2. Honnold 爬101
  const thread2 = await insertThread(
    'news',
    'Alex Honnold徒手爬完台北101！91分鐘創紀錄',
    '美國極限攀岩大師Alex Honnold昨天(1/24)徒手攀登台北101\n挑戰508公尺、101層樓\n全程Netflix全球同步直播\n\n91分鐘完成！CNN說是「史上第一人」\n有人有看直播嗎？超緊張',
    '名無しさん',
    18
  );
  await insertReply(thread2, '有看！真的超猛\n完全沒有繩索保護', '攀岩愛好者', 16);
  await insertReply(thread2, '91分鐘…我爬101樓梯都要喘死', '名無しさん', 14);
  await insertReply(thread2, '>>1\nNetflix直播的時候手心都是汗', '名無しさん', 12);
  await insertReply(thread2, '台灣又上國際新聞了\n這次是好事', '名無しさん', 10);
  await insertReply(thread2, '>>2\n他之前徒手爬酋長岩更誇張\n那個900多公尺', '攀岩愛好者', 8);
  await insertReply(thread2, '101終於不只是跨年煙火有話題了', '名無しさん', 6);
  console.log(`  ✅ #${thread2} Honnold攀登101`);

  // 3. 土方之亂
  const thread3 = await insertThread(
    'news',
    '「土方之亂」全台工程大延宕 營建業叫苦',
    '高雄美濃大峽谷事件後\n政府1月推「營建剩餘土石方全流向管制」\n所有清運車要裝GPS、用電子聯單\n\n結果配套不足\n全台工程都在等…\n\n有在營建業的嗎？真的這麼慘？',
    '名無しさん',
    48
  );
  await insertReply(thread3, '超慘 我們工地停工兩週了', '營建業', 46);
  await insertReply(thread3, '政策立意良好但執行太倉促', '名無しさん', 44);
  await insertReply(thread3, '>>1\n之前大峽谷的事太誇張\n但這樣矯枉過正', '名無しさん', 42);
  await insertReply(thread3, '聽說很多小包商直接倒了', '名無しさん', 40);
  await insertReply(thread3, '房價會不會因此再漲？', '名無しさん', 38);
  console.log(`  ✅ #${thread3} 土方之亂`);

  // 4. 中國海警金門
  const thread4 = await insertThread(
    'news',
    '中國海警又來金門海域「常態執法巡查」',
    '中國海警宣稱在金門附近海域展開「常態執法巡查」\n海巡署金馬澎分署嚴正駁斥\n說與事實不符\n\n這種事越來越頻繁了…',
    '金門人',
    60
  );
  await insertReply(thread4, '金門人表示習慣了…', '名無しさん', 58);
  await insertReply(thread4, '他們自己宣稱而已\n實際上哪有什麼常態', '名無しさん', 56);
  await insertReply(thread4, '大內宣吧\n給對岸人民看的', '名無しさん', 54);
  await insertReply(thread4, '>>1\n海巡辛苦了', '名無しさん', 52);
  console.log(`  ✅ #${thread4} 中國海警金門`);

  // ==================== money 版 ====================
  console.log('\n💰 money 版 - 金錢/投資\n');

  // 5. 台積電
  const thread5 = await insertThread(
    'money',
    '台積電衝上1695元 外資目標價喊2400',
    '台股破3萬點那天\n台積電直接衝到1695元\n漲幅6.94%\n\n外資目標價從2100上調到2400\n但國家隊反手賣了67.2億\n\n追還是不追？',
    '小股民',
    42
  );
  await insertReply(thread5, '1695買不下手…\n但每次都覺得貴 結果繼續漲', '名無しさん', 40);
  await insertReply(thread5, '2奈米量產加持\n基本面沒問題', '半導體研究員', 38);
  await insertReply(thread5, '>>1\n國家隊賣是調節吧\n不代表看空', '名無しさん', 36);
  await insertReply(thread5, '法說會1/15說的都是利多\n資本支出要450億美元', '名無しさん', 34);
  await insertReply(thread5, '現在買跟兩年前600買的人比…\n羨慕', '名無しさん', 32);
  await insertReply(thread5, '>>2\n2奈米良率是關鍵\n要持續觀察', '半導體研究員', 30);
  await insertReply(thread5, '抱著不放就對了', '老股民', 28);
  console.log(`  ✅ #${thread5} 台積電`);

  // 6. 台股三萬點
  const thread6 = await insertThread(
    'money',
    '台股破三萬點！你賺了多少？',
    '2026年第二個交易日就破三萬點\n歷史新高\n\n台積電一檔貢獻56.68%\n185萬股東成最大贏家\n\n大家有跟上嗎？',
    '名無しさん',
    50
  );
  await insertReply(thread6, '早就all in台積電了\n終於等到這天', '名無しさん', 48);
  await insertReply(thread6, '沒有QQ\n一直等回檔結果越等越高', '名無しさん', 46);
  await insertReply(thread6, '>>1\n基金定期定額的路過\n慢慢累積', '名無しさん', 44);
  await insertReply(thread6, '台積電一檔扛起整個大盤\n其他股票沒什麼動', '名無しさん', 42);
  await insertReply(thread6, '護國神山不是叫假的', '名無しさん', 40);
  console.log(`  ✅ #${thread6} 台股三萬點`);

  // ==================== gossip 版 ====================
  console.log('\n🎭 gossip 版 - 娛樂/八卦\n');

  // 7. 蔡依林演唱會
  const thread7 = await insertThread(
    'gossip',
    '蔡依林大巨蛋演唱會有人搶到票嗎',
    'PLEASURE世界巡迴演唱會\n12/30、12/31、1/1 連三天\n「人間樂園」主題\n\n票價6990到990\n秒殺\n\n有搶到的嗎？黃牛價多少了？',
    'Jolin粉',
    72
  );
  await insertReply(thread7, '搶到跨年場4990的\n期待', '名無しさん', 70);
  await insertReply(thread7, '黃牛喊到兩萬\n瘋了', '名無しさん', 68);
  await insertReply(thread7, '>>1\n跨年那場超難搶\n系統直接當機', '名無しさん', 66);
  await insertReply(thread7, '聽說舞台超猛\n可以期待', '名無しさん', 64);
  await insertReply(thread7, '呸姐的演唱會值得', '名無しさん', 62);
  console.log(`  ✅ #${thread7} 蔡依林演唱會`);

  // 8. 金唱片
  const thread8 = await insertThread(
    'gossip',
    '第40屆金唱片頒獎典禮 1/10台灣看得到嗎',
    '今年金唱片出演陣容：\n文佳煐、宋仲基、邊佑錫、安孝燮\nATEEZ、BOYNEXTDOOR、ENHYPEN、IVE\n\n這陣容也太豪華\n有轉播嗎？',
    'K-POP粉',
    80
  );
  await insertReply(thread8, '應該會有直播吧\n往年都有', '名無しさん', 78);
  await insertReply(thread8, 'IVE必看！', '名無しさん', 76);
  await insertReply(thread8, '>>1\n宋仲基現在長怎樣啊\n好久沒看他', '名無しさん', 74);
  await insertReply(thread8, 'ATEEZ表演一定很炸', '名無しさん', 72);
  console.log(`  ✅ #${thread8} 金唱片`);

  // 9. Energy
  const thread9 = await insertThread(
    'gossip',
    'Energy要重返小巨蛋了！1/10-1/11',
    '《ALL IN全面進擊》演唱會\n1月10日、11日\n台北小巨蛋\n\n當年的青春回憶\n還有多少人記得？',
    '七年級生',
    90
  );
  await insertReply(thread9, '放手、星期五晚上、某年某月某一天\n經典', '名無しさん', 88);
  await insertReply(thread9, '暴露年齡了哈哈', '名無しさん', 86);
  await insertReply(thread9, '>>1\n買票了！要去回味青春', '名無しさん', 84);
  await insertReply(thread9, '五個人都還在嗎？', '名無しさん', 82);
  await insertReply(thread9, '>>4\n都在！這次完整體', '名無しさん', 80);
  console.log(`  ✅ #${thread9} Energy演唱會`);

  // ==================== acg 版 ====================
  console.log('\n🎮 acg 版 - ACG/遊戲\n');

  // 10. 台北國際動漫節
  const thread10 = await insertThread(
    'acg',
    '2026台北國際動漫節開跑！有什麼必買的嗎',
    '主題「讚動漫∞無極限」\n\n這次有：\n- 真珠美人魚\n- 藥師少女的獨語\n- 凡爾賽玫瑰\n- TIF ASIA TOUR 台日偶像\n- 忍者亂太郎2.5次元歌舞劇\n\n有要去的嗎？',
    '名無しさん',
    30
  );
  await insertReply(thread10, '藥師少女必看\n動畫做得很好', '名無しさん', 28);
  await insertReply(thread10, '想買周邊但怕排隊排到死', '名無しさん', 26);
  await insertReply(thread10, '>>1\n真珠美人魚也太懷舊', '名無しさん', 24);
  await insertReply(thread10, '限定商品通常第一天就沒了\n要早點去', '名無しさん', 22);
  await insertReply(thread10, '忍者亂太郎的舞台劇有人看過嗎？', '名無しさん', 20);
  console.log(`  ✅ #${thread10} 台北國際動漫節`);

  // 11. 買動漫開幕
  const thread11 = await insertThread(
    'acg',
    '買動漫台北實體店開幕了！有人去過嗎',
    '1/2在台北車站M6出口附近開幕\n許昌街42號4樓\n\n有展覽區、咖啡廳\n首場是桂Gui老師個展「至冬之戀」\n\n感覺可以泡一整天',
    'ACG宅',
    96
  );
  await insertReply(thread11, '去過了\n空間比想像中大', '名無しさん', 94);
  await insertReply(thread11, '咖啡廳東西貴不貴？', '名無しさん', 92);
  await insertReply(thread11, '>>2\n還行\n一杯飲料150左右', '名無しさん', 90);
  await insertReply(thread11, '終於有實體店了\n之前只有線上', '名無しさん', 88);
  console.log(`  ✅ #${thread11} 買動漫實體店`);

  // 12. 2026一月新番
  const thread12 = await insertThread(
    'acg',
    '2026一月新番 大家在追什麼',
    '這季有55部新番\n太多了根本追不完\n\n目前在追：\n- 公主大人拷問時間 第2季\n- 靠死亡遊戲混飯吃\n- 稜鏡戀曲（神尾葉子原作）Netflix獨佔\n\n大家推薦哪部？',
    '名無しさん',
    40
  );
  await insertReply(thread12, '公主大人第一季就很好笑\n第二季必追', '名無しさん', 38);
  await insertReply(thread12, '稜鏡戀曲是流星花園作者的\n可以期待', '名無しさん', 36);
  await insertReply(thread12, '>>1\n55部太誇張\n我只追3-4部', '名無しさん', 34);
  await insertReply(thread12, '死亡遊戲那部設定很奇葩\n穿女僕裝逃生', '名無しさん', 32);
  await insertReply(thread12, '這季沒什麼大作\n等四月', '名無しさん', 30);
  console.log(`  ✅ #${thread12} 一月新番`);

  // ==================== work 版 ====================
  console.log('\n💼 work 版 - 職場/工作\n');

  // 13. 基本工資
  const thread13 = await insertThread(
    'work',
    '基本工資調到29500了 有感嗎',
    '2026/1/1起\n月薪：29500元\n時薪：196元\n\n連續第10年調漲\n據說247萬勞工受惠\n\n但物價漲更快吧…',
    '社畜',
    100
  );
  await insertReply(thread13, '物價漲50%\n薪水漲5%\n呵', '名無しさん', 98);
  await insertReply(thread13, '領基本工資的才有感\n其他人薪水不動', '名無しさん', 96);
  await insertReply(thread13, '>>1\n時薪196還是很低\n日本打工都300多台幣', '名無しさん', 94);
  await insertReply(thread13, '公司說因為基本工資漲\n所以今年不調薪\n笑死', '名無しさん', 92);
  await insertReply(thread13, '>>4\n這種話術每年都有', '名無しさん', 90);
  await insertReply(thread13, '便當從80變100\n這樣算追上了嗎', '名無しさん', 88);
  console.log(`  ✅ #${thread13} 基本工資`);

  // 14. 育嬰留停
  const thread14 = await insertThread(
    'work',
    '育嬰留停可以「按日請」了！新制上路',
    '以前育嬰留停每次要連續請30天\n現在改成可以按「日」申請\n父母合計60天彈性額度\n\n這樣臨時要帶小孩看病什麼的方便很多',
    '新手爸爸',
    85
  );
  await insertReply(thread14, '這個政策很讚\n之前30天太硬了', '名無しさん', 83);
  await insertReply(thread14, '公司會不會刁難啊', '名無しさん', 81);
  await insertReply(thread14, '>>2\n法規寫明的應該不敢', '名無しさん', 79);
  await insertReply(thread14, '終於跟上時代了', '名無しさん', 77);
  console.log(`  ✅ #${thread14} 育嬰留停新制`);

  // 15. 春節連假
  const thread15 = await insertThread(
    'work',
    '2026春節連假9天！小年夜也放假了',
    '小年夜正式列入國定假日\n今年春節從2/14放到2/22\n整整9天！\n\n而且今年連假有9個\n總放假日數120天\n\n終於有點福利了',
    '名無しさん',
    75
  );
  await insertReply(thread15, '服務業：關我什麼事', '名無しさん', 73);
  await insertReply(thread15, '>>1\n9天可以出國玩了', '名無しさん', 71);
  await insertReply(thread15, '機票一定超貴', '名無しさん', 69);
  await insertReply(thread15, '補班是不是很多天？', '名無しさん', 67);
  await insertReply(thread15, '>>4\n要補2天\n比以前少了', '名無しさん', 65);
  console.log(`  ✅ #${thread15} 春節連假`);

  // 16. 週休三日
  const thread16 = await insertThread(
    'work',
    '週休三日提案連署過關了！勞動部要回應',
    '公共政策網路參與平台的提案\n連署過關\n勞動部12/7前要正式回應\n\n台灣勞工總工時2030小時\n全球前5高\n\n有可能通過嗎？',
    '過勞社畜',
    110
  );
  await insertReply(thread16, '不可能\n老闆們不會同意', '名無しさん', 108);
  await insertReply(thread16, '先把加班費確實給再說週休三日吧', '名無しさん', 106);
  await insertReply(thread16, '>>1\n2030小時真的太誇張', '名無しさん', 104);
  await insertReply(thread16, '就算通過也是做功德的繼續做', '名無しさん', 102);
  await insertReply(thread16, '日本韓國工時都比我們低\n慘', '名無しさん', 100);
  console.log(`  ✅ #${thread16} 週休三日`);

  // ==================== life 版 ====================
  console.log('\n🌿 life 版 - 生活/心情\n');

  // 17. 運動幣
  const thread17 = await insertThread(
    'life',
    '運動幣1/26開始登記！但只有60萬份',
    '青春動滋券轉型成運動幣\n從16-22歲擴大到16歲以上都能領\n\n但是！\n金額只有500元\n而且限量60萬份要抽籤\n\n這什麼德政…',
    '名無しさん',
    20
  );
  await insertReply(thread17, '500元能幹嘛…健身房一個月都不夠', '名無しさん', 18);
  await insertReply(thread17, '60萬份 台灣幾千萬人\n根本抽不到', '名無しさん', 16);
  await insertReply(thread17, '>>1\n不如直接發現金', '名無しさん', 14);
  await insertReply(thread17, '去年1200今年500\n越來越少', '名無しさん', 12);
  await insertReply(thread17, '還是會去登記啦\n聊勝於無', '名無しさん', 10);
  console.log(`  ✅ #${thread17} 運動幣`);

  // 18. 尹錫悅
  const thread18 = await insertThread(
    'life',
    '南韓前總統尹錫悅被求處死刑 太扯了吧',
    '內亂案\n檢方求處死刑\n\n之前戒嚴那個\n沒想到會走到這一步\n\n韓國政治真的很激烈',
    '名無しさん',
    55
  );
  await insertReply(thread18, '韓國總統魔咒\n每個下場都很慘', '名無しさん', 53);
  await insertReply(thread18, '戒嚴12小時就被撤\n根本鬧劇', '名無しさん', 51);
  await insertReply(thread18, '>>1\n死刑應該不會判啦\n嚇嚇他', '名無しさん', 49);
  await insertReply(thread18, '台灣總統至少卸任後不會被抓', '名無しさん', 47);
  await insertReply(thread18, '>>4\n是因為沒人追究吧', '名無しさん', 45);
  console.log(`  ✅ #${thread18} 尹錫悅`);

  // ==================== love 版 ====================
  console.log('\n💕 love 版 - 感情/兩性\n');

  // 19. 情人節
  const thread19 = await insertThread(
    'love',
    '今年情人節在春節連假期間 怎麼過',
    '2/14情人節\n但今年2/14是除夕前一天\n小年夜\n\n要陪家人還是陪另一半？\n還是可以偷溜出去？',
    '名無しさん',
    45
  );
  await insertReply(thread19, '帶另一半回家過年\n一石二鳥', '名無しさん', 43);
  await insertReply(thread19, '>>1\n單身的表示沒這困擾', '名無しさん', 41);
  await insertReply(thread19, '可以提前過啊\n2/11-13都可以', '名無しさん', 39);
  await insertReply(thread19, '我們打算2/13先過\n14回家', '名無しさん', 37);
  await insertReply(thread19, '餐廳應該很難訂\n大家都放假', '名無しさん', 35);
  console.log(`  ✅ #${thread19} 情人節春節`);

  // 20. 李棟旭見面會
  const thread20 = await insertThread(
    'love',
    '女友說要去看李棟旭見面會 5880的票',
    '1/31在和平籃球館\nSVIP 5880\nVIP 4880\n\n她說要買SVIP\n我覺得好貴\n但又不想掃她興\n\n各位會怎麼處理',
    '名無しさん',
    65
  );
  await insertReply(thread20, '她自己出錢就讓她去啊\n開心最重要', '名無しさん', 63);
  await insertReply(thread20, '>>1\n你出錢還是她出錢？', '名無しさん', 61);
  await insertReply(thread20, '李棟旭很帥\n我也想去', '名無しさん', 59);
  await insertReply(thread20, '對方的興趣要尊重\n除非影響生活', '名無しさん', 57);
  await insertReply(thread20, '5880還好吧\n演唱會都這價', '名無しさん', 55);
  console.log(`  ✅ #${thread20} 李棟旭見面會`);

  // ==================== meta 版 ====================
  console.log('\n🔧 meta 版 - 站務/建議\n');

  // 21. 網站建議
  const thread21 = await insertThread(
    'meta',
    '可以新增「寵物版」嗎？',
    '現在寵物相關的討論都散落在各版\n如果有專門的寵物版\n可以討論貓狗、飼養問題、領養資訊等等\n\n感覺會很熱鬧',
    '貓奴',
    120
  );
  await insertReply(thread21, '支持！貓貓狗狗療癒', '名無しさん', 118);
  await insertReply(thread21, '生活版也可以發吧', '名無しさん', 116);
  await insertReply(thread21, '>>2\n專版比較好找文', '名無しさん', 114);
  await insertReply(thread21, '順便開個美食版', '名無しさん', 112);
  console.log(`  ✅ #${thread21} 新增版塊建議`);

  // ==================== tech 版 ====================
  console.log('\n🔬 tech 版 - 科技/AI\n');

  // 22. Switch 2
  const thread22 = await insertThread(
    'tech',
    'Switch 2終於有消息了 動森會是首發遊戲？',
    '傳聞Switch 2效能大提升\n動物森友會會推出Switch 2版\n4K畫質\n\n任天堂應該快公布了吧\n今年會出嗎？',
    '任豚',
    35
  );
  await insertReply(thread22, '等好久了\nSwitch都7年了', '名無しさん', 33);
  await insertReply(thread22, '4K動森可以\n島的畫質終於能看', '名無しさん', 31);
  await insertReply(thread22, '>>1\n希望有向下相容', '名無しさん', 29);
  await insertReply(thread22, 'Joy-Con不要再飄移了拜託', '名無しさん', 27);
  await insertReply(thread22, '>>4\n真的！這個最重要', '名無しさん', 25);
  console.log(`  ✅ #${thread22} Switch 2`);

  // 23. 台積電2奈米
  const thread23 = await insertThread(
    'tech',
    '台積電2奈米量產了 GAA架構領先全球',
    '2025年底2奈米正式量產\n採用GAA（Gate-All-Around）架構\n確立技術領先地位\n\n三星、Intel都還在追趕中\n\n台灣之光',
    '半導體迷',
    60
  );
  await insertReply(thread23, '護國神山不是叫假的', '名無しさん', 58);
  await insertReply(thread23, '良率是關鍵\n目前聽說還在提升', '名無しさん', 56);
  await insertReply(thread23, '>>1\n蘋果M5應該就是用2奈米', '名無しさん', 54);
  await insertReply(thread23, 'Intel要1.4奈米才能追上\n難', '名無しさん', 52);
  await insertReply(thread23, '三星良率問題一直解決不了', '名無しさん', 50);
  console.log(`  ✅ #${thread23} 台積電2奈米`);

  // 24. AI假訊息
  const thread24 = await insertThread(
    'tech',
    '中國用AI干預台灣選舉？日媒踢爆',
    '讀賣新聞報導\n洩露文件顯示中國用AI影響外國選舉\n包括台灣2026、2028選舉\n\n之前還有Salt Typhoon入侵美國國會\n\n資安問題越來越嚴重',
    '名無しさん',
    70
  );
  await insertReply(thread24, '早就知道了\n假帳號一堆', '名無しさん', 68);
  await insertReply(thread24, 'AI生成假新聞真的很難分辨', '名無しさん', 66);
  await insertReply(thread24, '>>1\n要加強媒體識讀教育', '名無しさん', 64);
  await insertReply(thread24, '長輩最容易被騙\nLINE傳一堆假消息', '名無しさん', 62);
  await insertReply(thread24, 'Salt Typhoon那個超扯\n國會都被駭', '名無しさん', 60);
  console.log(`  ✅ #${thread24} AI選舉干預`);

  console.log('\n✅ 完成！共新增 24 個討論串及其回覆');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
