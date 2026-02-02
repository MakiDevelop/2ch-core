#!/usr/bin/env tsx
/**
 * 2026/1/25 時事新聞種子腳本 v3
 * 補充 meta, love, acg, money 版
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
  console.log('🌱 開始新增基於時事的討論串 v3...\n');

  // ==================== money 版 ====================
  console.log('💰 money 版\n');

  // 1. 比特幣
  const thread1 = await insertThread(
    'money',
    '比特幣跌超過25%了 還能抄底嗎',
    '川普說要把美國變成加密貨幣之都\n選後漲了65%\n\n結果最近兩個月跌超過25%\n年初到現在跌了13%\n\n這波是恐慌還是機會',
    '名無しさん',
    22
  );
  await insertReply(thread1, '泡沫而已\n早就該跌了', '名無しさん', 20);
  await insertReply(thread1, '長期看好\n但現在不敢加碼', '名無しさん', 18);
  await insertReply(thread1, '>>1\n川普題材炒完就這樣', '名無しさん', 16);
  await insertReply(thread1, '等跌到5萬美金再說', '名無しさん', 14);
  await insertReply(thread1, '加密貨幣波動本來就大\n習慣就好', '幣圈人', 12);
  console.log(`  ✅ #${thread1} 比特幣`);

  // 2. TWEX交易所
  const thread2 = await insertThread(
    'money',
    'TWEX交易所1/5開放了 台灣大哥大出的',
    '台灣大哥大推出TWEX交易所\n1月5日開放全民使用\n\n台北富邦銀行當託管行\n感覺比較安全？\n\n目前只能買賣比特幣、以太幣\n還不能提幣\n\n有人用過嗎',
    '名無しさん',
    28
  );
  await insertReply(thread2, '不能提幣沒什麼用', '幣圈人', 26);
  await insertReply(thread2, '對新手來說可能OK\n簡單買賣', '名無しさん', 24);
  await insertReply(thread2, '>>1\n有銀行託管是優點', '名無しさん', 22);
  await insertReply(thread2, 'MAX、BitoPro比較多人用吧', '名無しさん', 20);
  console.log(`  ✅ #${thread2} TWEX交易所`);

  // 3. 加密貨幣報稅
  const thread3 = await insertThread(
    'money',
    '加密貨幣要報稅嗎？國稅局在查了',
    '聽說國稅局查到漏報1.3億\n補稅加罰鍰超過3400萬\n\n幣圈的獲利要報「財產交易所得」\n\n境內所得跟海外所得算法不一樣\n\n有人研究過嗎',
    '名無しさん',
    35
  );
  await insertReply(thread3, '境外交易所賺的算海外所得\n超過100萬才要報', '名無しさん', 33);
  await insertReply(thread3, '台灣交易所的就是境內所得', '名無しさん', 31);
  await insertReply(thread3, '>>1\n建議找會計師問\n不要自己瞎搞', '名無しさん', 29);
  await insertReply(thread3, '虧錢的不用報\n賺錢才煩惱', '名無しさん', 27);
  console.log(`  ✅ #${thread3} 加密貨幣報稅`);

  // ==================== acg 版 ====================
  console.log('\n🎮 acg 版\n');

  // 4. 星穹鐵道
  const thread4 = await insertThread(
    'acg',
    '星穹鐵道3.8版本「記憶是夢的開場白」心得',
    '3.8版本上了\n「記憶是夢的開場白」\n\n新角色大家抽了嗎\n星瓊夠不夠用\n\n劇情還不錯\n但體力不夠刷',
    '開拓者',
    18
  );
  await insertReply(thread4, '沒抽\n等下個卡池', '名無しさん', 16);
  await insertReply(thread4, '劇情真的好看\n這版本用心了', '名無しさん', 14);
  await insertReply(thread4, '>>1\n記得用兌換碼領星瓊', '名無しさん', 12);
  await insertReply(thread4, '每日任務好煩\n但為了石頭忍了', '名無しさん', 10);
  await insertReply(thread4, '這遊戲太肝了\n原神比較休閒', '名無しさん', 8);
  console.log(`  ✅ #${thread4} 星穹鐵道`);

  // 5. 絕區零
  const thread5 = await insertThread(
    'acg',
    '絕區零還有人在玩嗎',
    '米哈遊的新遊戲\n之前很期待\n\n結果上線後玩了一陣子就棄坑了\n戰鬥雖然爽但任務很無聊\n\n現在還值得回鍋嗎',
    '名無しさん',
    55
  );
  await insertReply(thread5, '還在玩\n後面內容有變多', '名無しさん', 53);
  await insertReply(thread5, '畫風很讚\n但確實不太耐玩', '名無しさん', 51);
  await insertReply(thread5, '>>1\n米哈遊遊戲都這樣\n前期無聊', '名無しさん', 49);
  await insertReply(thread5, '等大版本再回來看看', '名無しさん', 47);
  console.log(`  ✅ #${thread5} 絕區零`);

  // 6. 內鬼洩密
  const thread6 = await insertThread(
    'acg',
    '米哈遊告玩家洩密 求償15萬美元',
    '有玩家在實況外洩星穹鐵道未登場角色\n被米哈遊告了\n\n求償15萬美元（約443萬台幣）\n\n以後還敢當內鬼嗎',
    '名無しさん',
    65
  );
  await insertReply(thread6, '443萬…人生毀了', '名無しさん', 63);
  await insertReply(thread6, '活該\n洩密就是不對', '名無しさん', 61);
  await insertReply(thread6, '>>1\n米哈遊對這種很認真', '名無しさん', 59);
  await insertReply(thread6, '以前也有人被告過\n都不怕', '名無しさん', 57);
  await insertReply(thread6, '內鬼減少了\n等角色的樂趣增加', '名無しさん', 55);
  console.log(`  ✅ #${thread6} 米哈遊告玩家`);

  // 7. PS5遊戲
  const thread7 = await insertThread(
    'acg',
    '2026年PS5有什麼大作推薦',
    'PS5買了一陣子\n最近沒什麼想玩的\n\n今年有什麼大作嗎\n等不到GTA6好痛苦\n\n有推薦的嗎',
    'PS5玩家',
    70
  );
  await insertReply(thread7, '死亡擱淺2年底會出吧', '名無しさん', 68);
  await insertReply(thread7, 'GTA6應該今年？樂觀估計', '名無しさん', 66);
  await insertReply(thread7, '>>1\n去補一下舊作吧\n艾爾登法環DLC', '名無しさん', 64);
  await insertReply(thread7, '可以玩星穹鐵道PS5版\n免費的', '名無しさん', 62);
  console.log(`  ✅ #${thread7} PS5大作`);

  // ==================== love 版 ====================
  console.log('\n💕 love 版\n');

  // 8. 過年見家長
  const thread8 = await insertThread(
    'love',
    '今年春節要帶女友回家 有點緊張',
    '交往快一年了\n今年春節要帶她回老家見父母\n\n她也很緊張\n問要帶什麼禮物\n\n有經驗的可以分享嗎',
    '名無しさん',
    40
  );
  await insertReply(thread8, '禮物不用太貴\n心意到就好', '名無しさん', 38);
  await insertReply(thread8, '問你媽喜歡什麼最準', '名無しさん', 36);
  await insertReply(thread8, '>>1\n水果禮盒很safe', '名無しさん', 34);
  await insertReply(thread8, '第一次見面放輕鬆\n太刻意反而尷尬', '名無しさん', 32);
  await insertReply(thread8, '帶她去之前先跟爸媽說好\n不要突然帶回去', '過來人', 30);
  console.log(`  ✅ #${thread8} 過年見家長`);

  // 9. 前任
  const thread9 = await insertThread(
    'love',
    '前任過年傳訊息來 該回嗎',
    '分手半年了\n前幾天突然傳新年快樂\n\n我有新對象了\n但看到訊息還是有點複雜\n\n回還是不回',
    '名無しさん',
    45
  );
  await insertReply(thread9, '不回\n已經有新對象了', '名無しさん', 43);
  await insertReply(thread9, '禮貌回一下就好\n不要延續話題', '名無しさん', 41);
  await insertReply(thread9, '>>1\n看你新對象介不介意', '名無しさん', 39);
  await insertReply(thread9, '半年了還傳\n有企圖', '名無しさん', 37);
  await insertReply(thread9, '已讀不回最安全', '名無しさん', 35);
  console.log(`  ✅ #${thread9} 前任訊息`);

  // 10. AA制
  const thread10 = await insertThread(
    'love',
    '約會AA制到底好不好',
    '最近在Tinder配對到一個女生\n聊得還不錯\n約出來吃飯\n\n我想說請客\n但她堅持AA\n\n這是好還是不好的信號',
    '名無しさん',
    50
  );
  await insertReply(thread10, 'AA代表她不想欠你人情\n可能還在觀察', '名無しさん', 48);
  await insertReply(thread10, '現在很多女生都AA\n很正常', '名無しさん', 46);
  await insertReply(thread10, '>>1\n好事啊\n不是公主', '名無しさん', 44);
  await insertReply(thread10, '第一次約會AA很合理', '名無しさん', 42);
  await insertReply(thread10, '輪流請比較好\n這次你請下次她請', '名無しさん', 40);
  console.log(`  ✅ #${thread10} AA制`);

  // 11. 相親
  const thread11 = await insertThread(
    'love',
    '被家人安排相親 該去嗎',
    '快30了\n過年家人說要介紹對象\n是遠房親戚的小孩\n\n聽說條件不錯\n但我覺得相親很尷尬\n\n有人相親成功過嗎',
    '名無しさん',
    58
  );
  await insertReply(thread11, '去看看啊\n不一定要成功\n當作交朋友', '名無しさん', 56);
  await insertReply(thread11, '相親不丟臉\n認識人的一種方式而已', '名無しさん', 54);
  await insertReply(thread11, '>>1\n我朋友相親認識的\n現在結婚了', '名無しさん', 52);
  await insertReply(thread11, '至少對方也是有意願的\n比亂滑好', '名無しさん', 50);
  console.log(`  ✅ #${thread11} 相親`);

  // ==================== meta 版 ====================
  console.log('\n🔧 meta 版\n');

  // 12. 深色模式
  const thread12 = await insertThread(
    'meta',
    '有深色模式嗎？晚上看眼睛很痛',
    '晚上滑這個站\n白底太亮了\n\n可以做個深色模式嗎\n對眼睛比較好\n\n或是跟隨系統設定自動切換',
    '夜貓子',
    82
  );
  await insertReply(thread12, '支持深色模式\n現在主流網站都有', '名無しさん', 80);
  await insertReply(thread12, '用瀏覽器插件可以暫時解決', '名無しさん', 78);
  await insertReply(thread12, '>>1\n這功能很實用\n希望能加', '名無しさん', 76);
  await insertReply(thread12, '白天淺色晚上深色最好', '名無しさん', 74);
  console.log(`  ✅ #${thread12} 深色模式`);

  // 13. 圖片上傳
  const thread13 = await insertThread(
    'meta',
    '可以上傳圖片嗎？有時候想分享',
    '有些話題用文字很難描述\n如果能上傳圖片就好了\n\n可以理解怕違規內容\n但可以做審核機制吧',
    '名無しさん',
    90
  );
  await insertReply(thread13, '用imgur然後貼連結', '名無しさん', 88);
  await insertReply(thread13, '圖片功能需要伺服器空間\n成本考量吧', '名無しさん', 86);
  await insertReply(thread13, '>>1\n匿名版開圖片很危險\n會有人亂傳', '名無しさん', 84);
  await insertReply(thread13, '支持\n但要有檢舉機制', '名無しさん', 82);
  console.log(`  ✅ #${thread13} 圖片上傳`);

  // 14. 搜尋功能
  const thread14 = await insertThread(
    'meta',
    '搜尋功能可以再強化嗎',
    '有時候想找之前看過的討論串\n但搜尋結果不太精準\n\n可以加入按版塊搜尋\n或是按時間排序嗎',
    '名無しさん',
    95
  );
  await insertReply(thread14, '用Google搜「site:2ch.tw 關鍵字」', '名無しさん', 93);
  await insertReply(thread14, '全文搜索很吃資源\n做起來不容易', '工程師', 91);
  await insertReply(thread14, '>>1\n能搜標題就很好了', '名無しさん', 89);
  console.log(`  ✅ #${thread14} 搜尋功能`);

  // 15. 感謝站方
  const thread15 = await insertThread(
    'meta',
    '感謝站方維護這個地方',
    '現在台灣匿名討論的地方越來越少了\nPTT也在衰退\nDcard要登入\n\n這裡還蠻自由的\n謝謝站方維護\n\n希望能繼續營運下去',
    '名無しさん',
    100
  );
  await insertReply(thread15, '同意\n這裡氛圍不錯', '名無しさん', 98);
  await insertReply(thread15, '比PTT友善一點', '名無しさん', 96);
  await insertReply(thread15, '>>1\n希望能越做越好', '名無しさん', 94);
  await insertReply(thread15, '人多起來就好了', '名無しさん', 92);
  console.log(`  ✅ #${thread15} 感謝站方`);

  // ==================== gossip 版 ====================
  console.log('\n🎭 gossip 版\n');

  // 16. DAY6
  const thread16 = await insertThread(
    'gossip',
    'DAY6演唱會買到票了！超期待',
    '韓國流行搖滾天團DAY6\n演唱會票終於搶到了\n\n等好久了\n他們在韓國超紅\n「Zombie」那首歌太神了\n\n有人也要去嗎',
    'My Day',
    42
  );
  await insertReply(thread16, '恭喜！我沒搶到QQ', '名無しさん', 40);
  await insertReply(thread16, 'Zombie跟Days Gone By都是神曲', '名無しさん', 38);
  await insertReply(thread16, '>>1\n現場一定很炸', '名無しさん', 36);
  await insertReply(thread16, '他們樂器都自己來\n很厲害', '名無しさん', 34);
  console.log(`  ✅ #${thread16} DAY6演唱會`);

  // 17. YOASOBI
  const thread17 = await insertThread(
    'gossip',
    'YOASOBI會來台灣嗎',
    '日本超紅的音樂組合YOASOBI\n到處開世界巡迴\n\n台灣會有場次嗎\n「夜に駆ける」太經典\n「アイドル」也洗腦',
    '名無しさん',
    55
  );
  await insertReply(thread17, '應該會來吧\n台灣市場很大', '名無しさん', 53);
  await insertReply(thread17, 'Idol因為推しの子紅到爆', '名無しさん', 51);
  await insertReply(thread17, '>>1\n之前有來過\n票很難搶', '名無しさん', 49);
  await insertReply(thread17, '希望辦在大巨蛋', '名無しさん', 47);
  console.log(`  ✅ #${thread17} YOASOBI`);

  // 18. ONE OK ROCK
  const thread18 = await insertThread(
    'gossip',
    'ONE OK ROCK大巨蛋場太熱血了',
    '日本搖滾天團ONE OK ROCK\n大巨蛋場超讚\n\n有去的人都說超嗨\n主唱Taka狀態很好\n\n下次來還要再去',
    '搖滾粉',
    62
  );
  await insertReply(thread18, '去了！喊到喉嚨沙啞', '名無しさん', 60);
  await insertReply(thread18, 'Wasted Nights現場超震撼', '名無しさん', 58);
  await insertReply(thread18, '>>1\n大巨蛋音響其實不錯', '名無しさん', 56);
  await insertReply(thread18, '等他們下次來', '名無しさん', 54);
  console.log(`  ✅ #${thread18} ONE OK ROCK`);

  console.log('\n✅ 完成！共新增 18 個討論串及其回覆');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
