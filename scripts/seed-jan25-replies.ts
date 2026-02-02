#!/usr/bin/env tsx
/**
 * 2026/1/25 補充回覆腳本
 * 針對回覆較少的討論串補充回覆
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

// 取得目前回覆數量
async function getReplyCount(threadId: number): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM posts WHERE parent_id = $1',
    [threadId]
  );
  return parseInt(result.rows[0].count);
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

async function addReplies(threadId: number, replies: Array<{content: string, author?: string}>, startHoursAgo: number = 8): Promise<number> {
  const currentCount = await getReplyCount(threadId);
  let added = 0;

  for (let i = 0; i < replies.length; i++) {
    const reply = replies[i];
    const hoursAgo = startHoursAgo - i;
    await insertReply(threadId, reply.content, reply.author || '名無しさん', hoursAgo > 0 ? hoursAgo : 1);
    added++;
  }

  console.log(`    新增 ${added} 則回覆（原有 ${currentCount} 則）`);
  return added;
}

async function main() {
  console.log('🌱 開始補充討論串回覆...\n');

  let totalAdded = 0;

  // ==================== money 版 ====================
  console.log('💰 money 版\n');

  // 定存利率
  console.log('  #1153 定存利率這麼低還要存嗎');
  totalAdded += await addReplies(1153, [
    { content: '現在通膨這麼高\n定存等於賠錢', author: '名無しさん' },
    { content: '>>5\n但放股市風險更大\n看你能不能接受', author: '名無しさん' },
    { content: '美金定存利率比較高\n可以考慮', author: '名無しさん' },
    { content: '至少比放活存好\n有紀律的存錢', author: '名無しさん' },
  ], 12);

  // 新青安2.0
  console.log('  #3162 新青安2.0上路');
  totalAdded += await addReplies(3162, [
    { content: '新青安就是推高房價的元兇之一', author: '名無しさん' },
    { content: '>>5\n2.0有調整條件\n沒那麼容易貸了', author: '名無しさん' },
    { content: '年輕人還是買不起\n政策治標不治本', author: '名無しさん' },
  ], 10);

  // TWEX交易所
  console.log('  #3271 TWEX交易所');
  totalAdded += await addReplies(3271, [
    { content: '台灣大哥大跨足幣圈\n有點意外', author: '名無しさん' },
    { content: '>>5\n有銀行背書比較放心', author: '名無しさん' },
    { content: '希望之後能提幣\n不然跟傳統券商差不多', author: '幣圈人' },
  ], 8);

  // 加密貨幣報稅
  console.log('  #3276 加密貨幣報稅');
  totalAdded += await addReplies(3276, [
    { content: '很多人根本沒報\n等被查到才後悔', author: '名無しさん' },
    { content: '>>5\n國稅局開始盯了\n今年要小心', author: '名無しさん' },
    { content: '幣安那種海外的要報海外所得', author: '名無しさん' },
  ], 9);

  // 記帳App
  console.log('  #871 有推薦的記帳App嗎');
  totalAdded += await addReplies(871, [
    { content: '我用記帳城市\n遊戲化比較有動力', author: '名無しさん' },
    { content: '>>5\nMoneybook可以連結帳戶\n自動同步', author: '名無しさん' },
    { content: 'Excel最強\n完全客製化', author: '名無しさん' },
    { content: 'CWMoney用很久了\n功能很完整', author: '名無しさん' },
  ], 15);

  // 30歲存款30萬
  console.log('  #423 30歲存款只有30萬');
  totalAdded += await addReplies(423, [
    { content: '30萬比很多人好了\n不用太自責', author: '名無しさん' },
    { content: '重點是有沒有負債\n沒負債就OK', author: '名無しさん' },
    { content: '>>6\n現在房租物價這麼高\n能存錢就不錯了', author: '名無しさん' },
    { content: '開始理財永遠不嫌晚', author: '名無しさん' },
  ], 18);

  // ==================== tech 版 ====================
  console.log('\n🔬 tech 版\n');

  // Rust學習曲線
  console.log('  #10 Rust學習曲線');
  totalAdded += await addReplies(10, [
    { content: '所有權系統一開始真的很難懂\n但習慣就好', author: '名無しさん' },
    { content: '>>5\n編譯器很囉唆但也幫你抓很多bug', author: 'Rustacean' },
    { content: '先學Go比較快上手\nRust之後再學', author: '名無しさん' },
    { content: '2026了還是推薦學\n效能跟安全性都好', author: '名無しさん' },
  ], 20);

  // AI取代工程師
  console.log('  #199 AI會取代工程師嗎');
  totalAdded += await addReplies(199, [
    { content: 'AI是工具\n會用的工程師更值錢', author: '名無しさん' },
    { content: '>>5\nCopilot確實提升效率\n但還是要人審', author: '名無しさん' },
    { content: '初級工程師可能會受影響\n資深的不用擔心', author: '名無しさん' },
    { content: 'Claude Code現在很猛\n但debug還是要自己來', author: '名無しさん' },
  ], 22);

  // 中華電信
  console.log('  #362 中華電信1G ADSL');
  totalAdded += await addReplies(362, [
    { content: '中華電信的光纖還可以\nADSL就算了', author: '名無しさん' },
    { content: '>>5\n凱擘500M比較划算', author: '名無しさん' },
    { content: '看地區\n有些地方只有中華', author: '名無しさん' },
  ], 16);

  // 開源專案
  console.log('  #197 想開始貢獻開源專案');
  totalAdded += await addReplies(197, [
    { content: '從修typo開始\n慢慢來', author: '名無しさん' },
    { content: '>>6\n找good first issue的標籤', author: '名無しさん' },
    { content: '先挑自己在用的專案\n比較有動力', author: '名無しさん' },
  ], 14);

  // ==================== work 版 ====================
  console.log('\n💼 work 版\n');

  // 30歲轉職
  console.log('  #91 30歲了還在想要不要轉職');
  totalAdded += await addReplies(91, [
    { content: '30歲還很年輕\n想轉就轉', author: '名無しさん' },
    { content: '>>5\n但要有規劃\n不要裸辭', author: '過來人' },
    { content: '先騎驢找馬\n有offer再提離職', author: '名無しさん' },
    { content: '轉職前先想清楚是逃避還是追求', author: '名無しさん' },
  ], 25);

  // 主管開會愛嗆人
  console.log('  #206 主管開會愛嗆人');
  totalAdded += await addReplies(206, [
    { content: '錄音存證\n有需要可以檢舉', author: '名無しさん' },
    { content: '>>5\n不要正面衝突\n但也不用忍太過分的', author: '名無しさん' },
    { content: '這種主管底下待不久\n趕快找下一份', author: '名無しさん' },
    { content: '看公司文化\n有些地方HR會管', author: '名無しさん' },
  ], 20);

  // 公司要求自備設備
  console.log('  #336 公司要你們先拿自己的設備');
  totalAdded += await addReplies(336, [
    { content: '這很不合理\n設備應該公司提供', author: '名無しさん' },
    { content: '>>5\n資安問題\n用自己電腦公司資料外洩算誰的', author: '名無しさん' },
    { content: '小公司很常這樣\n自己評估', author: '名無しさん' },
  ], 18);

  // 育嬰留停
  console.log('  #3085 育嬰留停新制');
  totalAdded += await addReplies(3085, [
    { content: '按日請方便很多\n小孩生病可以請', author: '新手爸媽' },
    { content: '>>5\n但公司會不會臉色難看', author: '名無しさん' },
    { content: '法律規定的\n公司不能拒絕', author: '名無しさん' },
  ], 12);

  // ==================== life 版 ====================
  console.log('\n🌿 life 版\n');

  // 一個人吃飯
  console.log('  #209 一個人吃飯真的很可悲嗎');
  totalAdded += await addReplies(209, [
    { content: '一個人吃飯超爽\n想吃什麼吃什麼', author: '名無しさん' },
    { content: '>>5\n不用配合別人\n自在', author: '名無しさん' },
    { content: '日本一人燒肉、一人火鍋都有\n很正常', author: '名無しさん' },
    { content: '可悲的是不敢一個人吃飯的心態', author: '名無しさん' },
  ], 28);

  // 失眠
  console.log('  #800 最近一直失眠');
  totalAdded += await addReplies(800, [
    { content: '少看手機\n睡前不要滑', author: '名無しさん' },
    { content: '>>6\n運動有幫助\n但不要太晚運動', author: '名無しさん' },
    { content: '真的很嚴重要看醫生\n不要硬撐', author: '名無しさん' },
    { content: '褪黑激素可以試試\n藥局有賣', author: '名無しさん' },
  ], 22);

  // 黃仁勳美食
  console.log('  #3192 黃仁勳台北美食地圖');
  totalAdded += await addReplies(3192, [
    { content: '老黃每次來都會去鼎泰豐\n小籠包愛好者', author: '名無しさん' },
    { content: '>>5\n還有饒河夜市那家胡椒餅', author: '名無しさん' },
    { content: '他吃的都很庶民\n接地氣', author: '名無しさん' },
  ], 10);

  // 運動幣
  console.log('  #3102 運動幣');
  totalAdded += await addReplies(3102, [
    { content: '500元買個球拍都不夠\n誠意不足', author: '名無しさん' },
    { content: '>>6\n60萬份全台2300萬人\n中獎率2.6%', author: '名無しさん' },
    { content: '反正免費的\n登記看看', author: '名無しさん' },
  ], 8);

  // ==================== acg 版 ====================
  console.log('\n🎮 acg 版\n');

  // 日本動畫異世界
  console.log('  #521 日本動畫越來越多異世界轉生');
  totalAdded += await addReplies(521, [
    { content: '小說家になろう的影響\n網文改編', author: '名無しさん' },
    { content: '>>6\n異世界容易帶入\n賣得好就一直做', author: '名無しさん' },
    { content: '看膩了\n想看原創故事', author: '名無しさん' },
    { content: '藥師少女、葬送的芙莉蓮不是異世界但也好看', author: '名無しさん' },
  ], 25);

  // 台北國際動漫節
  console.log('  #3061 台北國際動漫節');
  totalAdded += await addReplies(3061, [
    { content: '人超多\n假日去會被擠死', author: '名無しさん' },
    { content: '>>6\n平日去比較好逛', author: '名無しさん' },
    { content: '限定商品很快就沒了\n要早點去', author: '名無しさん' },
  ], 9);

  // 買動漫實體店
  console.log('  #3067 買動漫台北實體店');
  totalAdded += await addReplies(3067, [
    { content: '展覽區還不錯\n有時間可以去看', author: '名無しさん' },
    { content: '>>5\n咖啡廳有限定商品\n粉絲會喜歡', author: '名無しさん' },
    { content: '台北車站附近\n交通方便', author: '名無しさん' },
  ], 11);

  // PS5大作
  console.log('  #3298 PS5大作');
  totalAdded += await addReplies(3298, [
    { content: 'FF7 Rebirth Part 3等好久', author: '名無しさん' },
    { content: '>>5\n小島的新作應該快了', author: '名無しさん' },
    { content: '今年應該有驚喜\n索尼在憋招', author: '名無しさん' },
  ], 10);

  // hololive一番賞
  console.log('  #3233 hololive一番賞');
  totalAdded += await addReplies(3233, [
    { content: 'Villain風格的設計超讚\n反差萌', author: 'DD' },
    { content: '>>5\n線上抽比較不用排隊', author: '名無しさん' },
    { content: '希望能中A賞\n但機率好低', author: '名無しさん' },
  ], 7);

  // ==================== news 版 ====================
  console.log('\n📰 news 版\n');

  // 詐騙集團
  console.log('  #456 詐騙集團為什麼抓不完');
  totalAdded += await addReplies(456, [
    { content: '跨國犯罪\n很難追', author: '名無しさん' },
    { content: '>>5\n柬埔寨那邊一堆\n當地政府不管', author: '名無しさん' },
    { content: '被騙的人太多\n詐騙有市場', author: '名無しさん' },
    { content: '提高警覺最重要\n政府抓不勝抓', author: '名無しさん' },
  ], 20);

  // 公家機關效率
  console.log('  #445 公家機關的效率真的有夠差');
  totalAdded += await addReplies(445, [
    { content: '現在線上申辦方便很多了', author: '名無しさん' },
    { content: '>>5\n看單位\n有些地方很快', author: '名無しさん' },
    { content: '我申請護照只花15分鐘', author: '名無しさん' },
  ], 18);

  // 中國海警
  console.log('  #3025 中國海警金門');
  totalAdded += await addReplies(3025, [
    { content: '海巡署有在反制\n不用太擔心', author: '名無しさん' },
    { content: '>>5\n認知作戰的一部分\n看看就好', author: '名無しさん' },
    { content: '金門人生活照常\n習慣了', author: '金門人' },
  ], 11);

  // ==================== gossip 版 ====================
  console.log('\n🎭 gossip 版\n');

  // RAIN演唱會
  console.log('  #3216 RAIN演唱會');
  totalAdded += await addReplies(3216, [
    { content: '當年It\'s Raining紅遍亞洲', author: '名無しさん' },
    { content: '>>5\n金泰希老公來了', author: '名無しさん' },
    { content: '韓國第一代男神\n現場應該很精彩', author: '名無しさん' },
  ], 9);

  // 金唱片
  console.log('  #3050 金唱片頒獎典禮');
  totalAdded += await addReplies(3050, [
    { content: '今年陣容很強\nIVE跟ATEEZ必看', author: 'K-pop粉' },
    { content: '>>5\n應該會有直播\n往年都有', author: '名無しさん' },
    { content: '期待頒獎典禮的舞台表演', author: '名無しさん' },
  ], 10);

  // YOASOBI
  console.log('  #3350 YOASOBI');
  totalAdded += await addReplies(3350, [
    { content: '他們的歌都跟小說有關\n很特別的創作方式', author: '名無しさん' },
    { content: '>>5\nアイドル因為推しの子爆紅', author: '名無しさん' },
    { content: '希望來台灣辦專場', author: '名無しさん' },
  ], 8);

  // Energy
  console.log('  #3055 Energy演唱會');
  totalAdded += await addReplies(3055, [
    { content: '七年級的回憶\n當年超紅', author: '名無しさん' },
    { content: '>>6\n放手現在聽還是很好聽', author: '名無しさん' },
    { content: '五個人完整體回來了', author: '名無しさん' },
  ], 9);

  // DAY6
  console.log('  #3345 DAY6演唱會');
  totalAdded += await addReplies(3345, [
    { content: '他們是真的會樂器\n不是假彈', author: '名無しさん' },
    { content: '>>5\n搖滾樂團在韓國很難得', author: '名無しさん' },
    { content: 'Days Gone By神曲', author: 'My Day' },
  ], 7);

  // ==================== love 版 ====================
  console.log('\n💕 love 版\n');

  // 相親
  console.log('  #3321 被家人安排相親');
  totalAdded += await addReplies(3321, [
    { content: '相親不可恥\n認識人的管道之一', author: '名無しさん' },
    { content: '>>5\n至少對方也是有意願的', author: '名無しさん' },
    { content: '去了不合適就當交朋友', author: '名無しさん' },
  ], 9);

  // 情人節
  console.log('  #3114 今年情人節在春節');
  totalAdded += await addReplies(3114, [
    { content: '今年情人節剛好小年夜\n可以白天約會晚上回家', author: '名無しさん' },
    { content: '>>6\n提前過也可以', author: '名無しさん' },
    { content: '餐廳應該很難訂\n大家都放假', author: '名無しさん' },
  ], 8);

  // ==================== meta 版 ====================
  console.log('\n🔧 meta 版\n');

  // 深色模式
  console.log('  #3326 深色模式');
  totalAdded += await addReplies(3326, [
    { content: '深色模式省電又護眼', author: '名無しさん' },
    { content: '>>5\n可以跟隨系統設定自動切換', author: '名無しさん' },
    { content: '支持這個功能', author: '名無しさん' },
  ], 7);

  // 圖片上傳
  console.log('  #3331 圖片上傳');
  totalAdded += await addReplies(3331, [
    { content: '用imgur貼連結暫時解決', author: '名無しさん' },
    { content: '>>5\n圖片功能要審核機制\n不然會被亂傳', author: '名無しさん' },
    { content: '這功能開發成本不低', author: '名無しさん' },
  ], 8);

  // 手機版
  console.log('  #3255 手機版優化');
  totalAdded += await addReplies(3255, [
    { content: '回覆層級確實不太明顯', author: '名無しさん' },
    { content: '>>5\n可以參考Reddit的設計', author: '名無しさん' },
    { content: '希望能改善\n手機用戶應該不少', author: '名無しさん' },
  ], 9);

  // 收藏功能
  console.log('  #97 建議增加收藏討論串功能');
  totalAdded += await addReplies(97, [
    { content: '這功能很實用\n有時候想回來看的討論串找不到', author: '名無しさん' },
    { content: '>>6\n用瀏覽器書籤暫時代替', author: '名無しさん' },
    { content: '希望能做\n不用登入也能用的那種', author: '名無しさん' },
  ], 15);

  // 寵物版
  console.log('  #3126 新增寵物版');
  totalAdded += await addReplies(3126, [
    { content: '支持！貓貓狗狗討論很需要', author: '貓奴' },
    { content: '>>5\n寵物醫療、飼養問題都可以問', author: '名無しさん' },
    { content: '領養代替購買也可以推廣', author: '名無しさん' },
  ], 10);

  console.log(`\n✅ 完成！共新增 ${totalAdded} 則回覆`);
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
