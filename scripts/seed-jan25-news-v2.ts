#!/usr/bin/env tsx
/**
 * 2026/1/25 時事新聞種子腳本 v2
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

async function main() {
  console.log('🌱 開始新增基於時事的討論串 v2...\n');

  // ==================== money 版 ====================
  console.log('💰 money 版\n');

  // 1. 房市下跌
  const thread1 = await insertThread(
    'money',
    '2026房市展望：全台房價跌定了？專家說跌10%',
    '房仲公會全聯會榮譽理事長李同榮分析\n2026年房市「價跌量漲」\n平均跌幅10%左右\n\n台北市跌不超過5-6%\n台南高雄部分區域恐超過10%\n\n現在該買嗎？還是等2027？',
    '名無しさん',
    25
  );
  await insertReply(thread1, '終於要跌了\n等好久', '無殼蝸牛', 23);
  await insertReply(thread1, '10%而已\n漲的時候漲多少', '名無しさん', 21);
  await insertReply(thread1, '>>1\n核心區域跌不多\n蛋白區才慘', '名無しさん', 19);
  await insertReply(thread1, '2025年交易量已經創八年新低了\n26.1萬件', '名無しさん', 17);
  await insertReply(thread1, '建商撐得住嗎', '名無しさん', 15);
  await insertReply(thread1, '>>5\n小建商可能會倒一批', '名無しさん', 13);
  console.log(`  ✅ #${thread1} 房市展望`);

  // 2. 租屋補助新制
  const thread2 = await insertThread(
    'money',
    '2026租屋補助新制：頂加不能申請了！',
    '租屋補助延長到2026年\n但有重大改變：\n\n必須是「合法住宅」才能申請\n頂樓加蓋、違章建築都不行！\n\n要有房屋稅籍或建物登記\n\n一堆人租頂加怎麼辦…',
    '租屋族',
    30
  );
  await insertReply(thread2, '頂加便宜啊\n合法的租不起', '名無しさん', 28);
  await insertReply(thread2, '台北頂加一堆\n這政策打到窮人', '名無しさん', 26);
  await insertReply(thread2, '>>1\n婚育加碼有放寬\n新婚跟育兒可以多領', '名無しさん', 24);
  await insertReply(thread2, '房東不配合根本申請不了', '名無しさん', 22);
  await insertReply(thread2, '這是在逼大家搬出違建？', '名無しさん', 20);
  console.log(`  ✅ #${thread2} 租屋補助`);

  // 3. 新青安2.0
  const thread3 = await insertThread(
    'money',
    '新青安2.0上路！房市有救了？',
    '新青安2.0推出\n放款集中度改為銀行自主管理\n\n北市公會看好房市\n理由：\n1. 輝達進駐北士科 帶動買氣\n2. 台股大漲 資金轉移房市\n3. 選舉年 政策可能鬆綁\n\n大家怎麼看？',
    '名無しさん',
    35
  );
  await insertReply(thread3, '又要噴了…', '名無しさん', 33);
  await insertReply(thread3, '利多出盡吧\n不可能再漲', '名無しさん', 31);
  await insertReply(thread3, '>>1\n北士科那邊真的炒很兇', '名無しさん', 29);
  await insertReply(thread3, '新青安害房價漲\n現在又出2.0', '名無しさん', 27);
  console.log(`  ✅ #${thread3} 新青安2.0`);

  // ==================== tech 版 ====================
  console.log('\n🔬 tech 版\n');

  // 4. 黃仁勳訪台
  const thread4 = await insertThread(
    'tech',
    '黃仁勳1/29要來台灣了！尾牙+兆元宴+北士科簽約',
    '黃仁勳訪台行程曝光：\n\n1/29 抵台\n1/30 輝達台灣尾牙\n1/31 「兆元宴」邀請供應鏈大咖\n  台積電、鴻海、廣達、緯創、英業達、仁寶、和碩、華碩、宏碁、緯穎\n\n還要跟蔣萬安簽約北士科新總部\n可能還會逛士林夜市\n\n皮衣教主又來了！',
    'NVIDIA粉',
    15
  );
  await insertReply(thread4, '每次來都帶動股價\n期待', '名無しさん', 13);
  await insertReply(thread4, '士林夜市又要塞爆了', '名無しさん', 11);
  await insertReply(thread4, '>>1\n北士科簽約很重要\n台灣變成AI研發基地', '名無しさん', 9);
  await insertReply(thread4, '輝達台灣子公司資本額10億\n誠意十足', '名無しさん', 7);
  await insertReply(thread4, '他剛從上海過來\n中國那邊在談H200', '名無しさん', 5);
  await insertReply(thread4, '>>5\n真的假的\n美國限制出口不是嗎', '名無しさん', 3);
  console.log(`  ✅ #${thread4} 黃仁勳訪台`);

  // 5. CES 2026
  const thread5 = await insertThread(
    'tech',
    'CES 2026：黃仁勳點名DeepSeek 還誇中國AI',
    'CES 2026主題演講\n黃仁勳罕見點名讚揚中國DeepSeek\n說是「全球開源AI轉型的催化劑」\n\n還發表新的Rubin運算平台\n自駕AI模型也亮相\n\n老黃這次又畫了什麼大餅',
    '名無しさん',
    45
  );
  await insertReply(thread5, 'DeepSeek確實厲害\n開源又便宜', '名無しさん', 43);
  await insertReply(thread5, '老黃：你們都很棒\n但還是要買我的卡', '名無しさん', 41);
  await insertReply(thread5, '>>1\nRubin架構看起來很猛', '名無しさん', 39);
  await insertReply(thread5, 'AI末日論被他批了\n說傷害社會', '名無しさん', 37);
  await insertReply(thread5, '演講兩小時\n真的佩服他體力', '名無しさん', 35);
  console.log(`  ✅ #${thread5} CES 2026`);

  // ==================== life 版 ====================
  console.log('\n🌿 life 版\n');

  // 6. 日本旅遊淡季
  const thread6 = await insertThread(
    'life',
    '1月去日本最便宜！1/6-1/10是全年最淡',
    '想出國的注意\n\n1月上旬（1/12前）是淡季\n特別是1/6-1/10是日本住宿全年最便宜的時候\n\n中旬之後價格就會開始漲\n因為寒假1/24開始\n\n有人最近去日本嗎？',
    '旅遊控',
    40
  );
  await insertReply(thread6, '已經回來了\n真的便宜很多', '名無しさん', 38);
  await insertReply(thread6, '福袋1/3開賣\n那幾天人超多', '名無しさん', 36);
  await insertReply(thread6, '>>1\n但1/1-1/3很多店沒開\n要注意', '名無しさん', 34);
  await insertReply(thread6, '現在機票漲回來了\n寒假效應', '名無しさん', 32);
  await insertReply(thread6, 'Visit Japan Web記得先填好', '名無しさん', 30);
  console.log(`  ✅ #${thread6} 日本旅遊`);

  // 7. 年菜
  const thread7 = await insertThread(
    'life',
    '2026外帶年菜推薦！飯店vs超商哪個好',
    '快過年了\n今年想訂外帶年菜\n\n飯店年菜貴但精緻\n超商年菜便宜但怕踩雷\n\n有推薦的嗎？\n佛跳牆哪家好？',
    '主婦',
    55
  );
  await insertReply(thread7, '誠品行旅聚聚樓有早鳥9折\n到1/10截止', '名無しさん', 53);
  await insertReply(thread7, '美福的還不錯\n價格也算合理', '名無しさん', 51);
  await insertReply(thread7, '>>1\n佛跳牆推福華', '名無しさん', 49);
  await insertReply(thread7, '全家的年菜意外還可以\n便利', '名無しさん', 47);
  await insertReply(thread7, '今年自己煮\n外面太貴', '名無しさん', 45);
  console.log(`  ✅ #${thread7} 年菜推薦`);

  // 8. 黃仁勳美食地圖
  const thread8 = await insertThread(
    'life',
    '黃仁勳台北美食地圖15選！跟著老黃吃',
    '媒體整理了黃仁勳愛吃的台北餐廳\n\n有老字號川菜\n中式私廚\n古早味懷舊餐廳\n\n每次他來台灣都會去吃\n\n有人有去朝聖過嗎？',
    '美食愛好者',
    50
  );
  await insertReply(thread8, '鼎泰豐他必去\n每次都排隊', '名無しさん', 48);
  await insertReply(thread8, '寧夏夜市他也愛', '名無しさん', 46);
  await insertReply(thread8, '>>1\n他吃的都很台\n接地氣', '名無しさん', 44);
  await insertReply(thread8, '胡椒餅那家因為他爆紅', '名無しさん', 42);
  console.log(`  ✅ #${thread8} 黃仁勳美食`);

  // ==================== love 版 ====================
  console.log('\n💕 love 版\n');

  // 9. Tinder 2026趨勢
  const thread9 = await insertThread(
    'love',
    'Tinder 2026約會報告：「直球戀愛」成趨勢',
    'Tinder發布Year in Swipe報告\n2026年約會四大趨勢：\n\n1. Clear-Coding 直球戀愛\n2. Hot-Take Dating 敢言約會\n3. Emotional Vibe Coding 共感同頻\n4. Friendfluence 友誼影響力\n\n64%約會者認為需要更多「情感誠實」\n不要再曖昧內耗了\n\n這對單身狗有幫助嗎',
    '單身狗',
    38
  );
  await insertReply(thread9, '直球戀愛好\n曖昧真的累', '名無しさん', 36);
  await insertReply(thread9, '說是這樣說\n實際上還是很多人玩曖昧', '名無しさん', 34);
  await insertReply(thread9, '>>1\n友誼影響力是什麼\n朋友介紹？', '名無しさん', 32);
  await insertReply(thread9, '低壓約會：散步、喝咖啡\n不用花大錢', '名無しさん', 30);
  await insertReply(thread9, '交友軟體都是詐騙吧', '名無しさん', 28);
  await insertReply(thread9, '>>5\n也有認真的\n要自己判斷', '名無しさん', 26);
  console.log(`  ✅ #${thread9} Tinder趨勢`);

  // 10. 交友軟體
  const thread10 = await insertThread(
    'love',
    '2026交友軟體推薦？Tinder以外還有什麼',
    '最近想認識新朋友\nTinder用膩了\n\n聽說有：\n- Bumble（女生先開口）\n- Pairs（日系認真交往）\n- SweetRing（結婚導向）\n- 探探（？）\n\n哪個比較好用？\n不想遇到詐騙',
    '名無しさん',
    60
  );
  await insertReply(thread10, 'Bumble女生主動這點不錯\n不會一直被騷擾', '名無しさん', 58);
  await insertReply(thread10, 'Pairs比較認真\n但要付費', '名無しさん', 56);
  await insertReply(thread10, '>>1\n探探詐騙多\n不推', '名無しさん', 54);
  await insertReply(thread10, '不如參加實體活動\n比較真實', '名無しさん', 52);
  await insertReply(thread10, '現在詐騙太多\n視訊確認比較保險', '名無しさん', 50);
  console.log(`  ✅ #${thread10} 交友軟體`);

  // 11. 遠距離
  const thread11 = await insertThread(
    'love',
    '遠距離戀愛怎麼維持？女友在日本工作',
    '女友去年去日本工作\n說是工作簽兩年\n\n一開始說好每個月見一次\n但最近她越來越忙\n已經兩個月沒見面了\n\n訊息也回得慢\n是我想太多嗎',
    '名無しさん',
    70
  );
  await insertReply(thread11, '兩個月沒見有點久\n但工作忙可以理解', '名無しさん', 68);
  await insertReply(thread11, '訊息回慢比較需要注意\n直接問她比較好', '名無しさん', 66);
  await insertReply(thread11, '>>1\n遠距離真的很考驗\n要有心理準備', '名無しさん', 64);
  await insertReply(thread11, '可以約視訊\n固定時間', '名無しさん', 62);
  await insertReply(thread11, '我之前也遠距離\n最後還是分了\n太累', '過來人', 60);
  console.log(`  ✅ #${thread11} 遠距離戀愛`);

  // ==================== gossip 版 ====================
  console.log('\n🎭 gossip 版\n');

  // 12. RAIN
  const thread12 = await insertThread(
    'gossip',
    'RAIN演唱會1/17 有人要去嗎',
    'RAIN「STILL RAINING: ENCORE」\n1月17日 台北小巨蛋\n\n這幾年韓流這麼多團\n還有人記得RAIN嗎\n當年真的超紅',
    '名無しさん',
    75
  );
  await insertReply(thread12, '이승환~~ 當年的回憶', '名無しさん', 73);
  await insertReply(thread12, '全身都是肌肉的那個\n超會跳舞', '名無しさん', 71);
  await insertReply(thread12, '>>1\n現在是金泰希的老公\n人生贏家', '名無しさん', 69);
  await insertReply(thread12, 'Rainism還是經典', '名無しさん', 67);
  console.log(`  ✅ #${thread12} RAIN演唱會`);

  // 13. 鄧紫棋
  const thread13 = await insertThread(
    'gossip',
    '鄧紫棋睽違7年再來台灣開唱！',
    'G.E.M.鄧紫棋要來台灣了\n睽違7年！\n\n上次來是2019年\n這次終於等到\n\n時間地點還沒公布\n應該是大巨蛋吧',
    '名無しさん',
    65
  );
  await insertReply(thread13, '7年了！光年之外到現在', '名無しさん', 63);
  await insertReply(thread13, '一定要搶票\n她現場超猛', '名無しさん', 61);
  await insertReply(thread13, '>>1\n大巨蛋應該沒問題\n她夠紅', '名無しさん', 59);
  await insertReply(thread13, '泡沫、喜歡你、光年之外\n經典太多', '名無しさん', 57);
  await insertReply(thread13, '希望不要秒殺…', '名無しさん', 55);
  console.log(`  ✅ #${thread13} 鄧紫棋演唱會`);

  // 14. BTS高雄
  const thread14 = await insertThread(
    'gossip',
    'BTS世巡台灣場在高雄！要三場',
    'BTS回歸後65場世界巡迴\n台灣在高雄辦三場！\n\n不是台北大巨蛋\n是高雄\n\n南部ARMY終於有福了\n\n搶票大戰要開始了',
    'ARMY',
    80
  );
  await insertReply(thread14, '高雄！！終於不用北上', '高雄人', 78);
  await insertReply(thread14, '三場應該買得到吧\n希望', '名無しさん', 76);
  await insertReply(thread14, '>>1\n住宿要先訂\n到時候一定爆', '名無しさん', 74);
  await insertReply(thread14, '黃牛一定很猖獗\n要小心', '名無しさん', 72);
  await insertReply(thread14, '已經在存錢了', '名無しさん', 70);
  console.log(`  ✅ #${thread14} BTS高雄`);

  // ==================== acg 版 ====================
  console.log('\n🎮 acg 版\n');

  // 15. hololive一番賞
  const thread15 = await insertThread(
    'acg',
    'hololive一番賞Villain Style 1/10日本開抽',
    '一番賞「hololive ～Villain Style～」\n1月10日日本開抽\n\n白上吹雪、大神澪、角卷綿芽、獅白牡丹\n反派風格造型\n\n台灣可以在購物橘子線上抽\n\n有人要抽嗎',
    'DD',
    42
  );
  await insertReply(thread15, '獅白的造型超帥', '名無しさん', 40);
  await insertReply(thread15, '反派風很讚\n跟平常的風格不一樣', '名無しさん', 38);
  await insertReply(thread15, '>>1\n線上抽運費很貴\n但沒辦法', '名無しさん', 36);
  await insertReply(thread15, '想要A賞但一定抽不到', '名無しさん', 34);
  console.log(`  ✅ #${thread15} hololive一番賞`);

  // 16. 巴哈姆特徵稿
  const thread16 = await insertThread(
    'acg',
    '巴哈姆特2026 ACG徵稿開始！',
    '巴哈姆特ACG徵稿活動開始了\n台灣最大的原創動畫、漫畫、遊戲徵稿賽事\n\n投稿到2026/5/20截止\n\n有在創作的朋友可以試試\n說不定能被發掘',
    '名無しさん',
    85
  );
  await insertReply(thread16, '每年都有佳作出現\n台灣ACG有希望', '名無しさん', 83);
  await insertReply(thread16, '漫畫組競爭最激烈', '名無しさん', 81);
  await insertReply(thread16, '>>1\n遊戲組門檻比較高\n要做出可玩的demo', '名無しさん', 79);
  await insertReply(thread16, '支持本土創作', '名無しさん', 77);
  console.log(`  ✅ #${thread16} 巴哈姆特徵稿`);

  // ==================== work 版 ====================
  console.log('\n💼 work 版\n');

  // 17. 下班還要回訊息
  const thread17 = await insertThread(
    'work',
    '下班後還要回公事訊息 有加班費嗎',
    '根據調查\n45.6%上班族下班後還要盯手機回公事\n平均花51分鐘處理主管交辦事項\n\n9成沒有加班費！\n\n這樣合理嗎\n怎麼跟主管反應',
    '社畜',
    48
  );
  await insertReply(thread17, '我都已讀不回\n急的話打電話', '名無しさん', 46);
  await insertReply(thread17, '看公司文化\n有些地方真的很誇張', '名無しさん', 44);
  await insertReply(thread17, '>>1\n勞基法有規定\n但沒人敢檢舉', '名無しさん', 42);
  await insertReply(thread17, '改天打卡下班就關通知', '名無しさん', 40);
  await insertReply(thread17, '責任制的悲哀', '名無しさん', 38);
  console.log(`  ✅ #${thread17} 下班回訊息`);

  // 18. 年終
  const thread18 = await insertThread(
    'work',
    '你們公司年終發多少？可以分享嗎',
    '快過年了\n年終應該要發了吧\n\n去年領1.5個月\n今年不知道會不會縮水\n\n科技業是不是都很多\n\n大家可以分享嗎（不方便說金額說產業也可以）',
    '名無しさん',
    52
  );
  await insertReply(thread18, '傳產\n1個月\n至少有', '名無しさん', 50);
  await insertReply(thread18, '科技業小公司\n2個月\n已經謝天謝地', '名無しさん', 48);
  await insertReply(thread18, '>>1\n金融業\n看績效\n好的時候4-5個月', '名無しさん', 46);
  await insertReply(thread18, '服務業\n0.5個月\n哭', '名無しさん', 44);
  await insertReply(thread18, '今年景氣不好\n能發就不錯了', '名無しさん', 42);
  console.log(`  ✅ #${thread18} 年終獎金`);

  // ==================== meta 版 ====================
  console.log('\n🔧 meta 版\n');

  // 19. 手機版建議
  const thread19 = await insertThread(
    'meta',
    '手機版可以優化一下嗎？字有點小',
    '用手機看這個站\n字體有點小\n而且回覆的層級不太明顯\n\n可以參考一下其他論壇的排版嗎\n\n不過整體來說還不錯啦',
    '手機用戶',
    95
  );
  await insertReply(thread19, '同意\n字可以大一點', '名無しさん', 93);
  await insertReply(thread19, '引用的顯示可以更明顯', '名無しさん', 91);
  await insertReply(thread19, '>>1\n用電腦看就好\n手機看論壇本來就不方便', '名無しさん', 89);
  await insertReply(thread19, '期待改進！', '名無しさん', 87);
  console.log(`  ✅ #${thread19} 手機版建議`);

  // 20. 暱稱功能
  const thread20 = await insertThread(
    'meta',
    '可以有固定暱稱功能嗎？每次都要重打',
    '每次發文都要打名字\n有點麻煩\n\n可以有登入或記住暱稱的功能嗎\n\n或是用cookie記住就好',
    '名無しさん',
    100
  );
  await insertReply(thread20, '匿名版的特色就是不登入啊', '名無しさん', 98);
  await insertReply(thread20, '用瀏覽器的自動填入', '名無しさん', 96);
  await insertReply(thread20, '>>1\n支持\n但登入可能會降低發文意願', '名無しさん', 94);
  await insertReply(thread20, '可以做成選用功能\n要登入的登入\n不要的繼續匿名', '名無しさん', 92);
  console.log(`  ✅ #${thread20} 暱稱功能`);

  console.log('\n✅ 完成！共新增 20 個討論串及其回覆');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
