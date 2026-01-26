#!/usr/bin/env tsx
/**
 * 2026/1/26 chat 版閒聊種子腳本
 * 補充綜合閒聊版的輕鬆話題
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
  console.log('🌱 開始新增 chat 版閒聊討論串...\n');

  // 1. 蔣中正日記開放
  const thread1 = await insertThread(
    'chat',
    '蔣中正日記開放了 內容超勁爆',
    '國史館宣布蔣中正日記著作權到期\n1/1起全面開放下載\n\n結果日記內容...\n超詳細記錄房事、性病、早洩\n\n原來蔣公也是人啊\n道德自律跟性慾之間反覆拉扯\n\n有人去看了嗎',
    '歷史迷',
    10
  );
  await insertReply(thread1, '笑死 這什麼內容', '名無しさん', 9);
  await insertReply(thread1, '原來偉人也有這種煩惱', '名無しさん', 8);
  await insertReply(thread1, '>>1\n日記本來就是私人的\n沒想到會公開吧', '名無しさん', 7);
  await insertReply(thread1, '歷史課本不會教的內容', '名無しさん', 6);
  await insertReply(thread1, '去下載來看了\n字很難認', '名無しさん', 5);
  await insertReply(thread1, '人性的一面\n比政治宣傳有趣多了', '名無しさん', 4);
  console.log(`  ✅ #${thread1} 蔣中正日記`);

  // 2. 跨年無感
  const thread2 = await insertThread(
    'chat',
    '今年跨年是不是特別無感',
    '看到Threads有人發\n「你們不覺得今年很沒有跨年的感覺嗎」\n\n60萬瀏覽 5萬人按讚\n\n我也這樣覺得\n不知道為什麼\n好像跟平常日沒差',
    '名無しさん',
    200
  );
  await insertReply(thread2, '年紀大了就這樣', '名無しさん', 198);
  await insertReply(thread2, '疫情後好像都這樣', '名無しさん', 196);
  await insertReply(thread2, '>>1\n我連101煙火都懶得看', '名無しさん', 194);
  await insertReply(thread2, '以前會倒數現在直接睡', '名無しさん', 192);
  await insertReply(thread2, '跨年不就換個數字而已', '名無しさん', 190);
  await insertReply(thread2, '人越老越無感', '名無しさん', 188);
  await insertReply(thread2, '>>5\n醒醒 這樣想就老了', '名無しさん', 186);
  console.log(`  ✅ #${thread2} 跨年無感`);

  // 3. 中國跨年尷尬
  const thread3 = await insertThread(
    'chat',
    '中國跨年好尷尬 萬人倒數完一片靜默',
    '看到新聞笑死\n中國多個城市臨時取消跨年活動\n但民眾還是去了\n\n結果萬人倒數完\n沒煙火沒燈光秀\n就...靜默\n\n上海西安杭州南京都這樣\n被稱為「全球最尬跨年」',
    '名無しさん',
    195
  );
  await insertReply(thread3, '想像那個畫面 太好笑', '名無しさん', 194);
  await insertReply(thread3, '321 新年快樂！\n......\n然後呢', '名無しさん', 193);
  await insertReply(thread3, '>>1\n說是安全考量取消的', '名無しさん', 192);
  await insertReply(thread3, '有影片嗎 想看', '名無しさん', 191);
  await insertReply(thread3, '比台灣冷清多了', '名無しさん', 190);
  await insertReply(thread3, '韭菜的跨年', '名無しさん', 189);
  console.log(`  ✅ #${thread3} 中國跨年`);

  // 4. 取消補班
  const thread4 = await insertThread(
    'chat',
    '2026取消補班了！！！',
    '剛看到新聞\n從2025下半年開始\n取消補班制度\n\n以後只補假不補班\n\n終於不用連上6天班了\n感動',
    '社畜',
    180
  );
  await insertReply(thread4, '這政策德政', '名無しさん', 179);
  await insertReply(thread4, '等了多少年終於', '名無しさん', 178);
  await insertReply(thread4, '>>1\n我們公司本來就不補班\n沒差', '外商員工', 177);
  await insertReply(thread4, '連上6天班真的很累', '名無しさん', 176);
  await insertReply(thread4, '補班制度本來就莫名其妙', '名無しさん', 175);
  await insertReply(thread4, '可是假變少了不是嗎', '名無しさん', 174);
  await insertReply(thread4, '>>6\n沒有 假一樣多 只是不用補班', '名無しさん', 173);
  console.log(`  ✅ #${thread4} 取消補班`);

  // 5. 春節9天
  const thread5 = await insertThread(
    'chat',
    '春節放9天你們要幹嘛',
    '2/14-2/22 連放9天\n\n目前計畫：\n- 耍廢\n- 吃\n- 睡\n- 被親戚問\n\n你們呢',
    '名無しさん',
    50
  );
  await insertReply(thread5, '出國 機票訂好了', '名無しさん', 49);
  await insertReply(thread5, '在家躺9天', '名無しさん', 48);
  await insertReply(thread5, '>>1\n被親戚問最痛苦', '名無しさん', 47);
  await insertReply(thread5, '請4天變16天連假 出國去', '名無しさん', 46);
  await insertReply(thread5, '過年就是吃吃吃', '名無しさん', 45);
  await insertReply(thread5, '宅在家打遊戲最棒', '名無しさん', 44);
  await insertReply(thread5, '>>4\n228那個？聰明', '名無しさん', 43);
  await insertReply(thread5, '回老家被唸9天', '名無しさん', 42);
  console.log(`  ✅ #${thread5} 春節計畫`);

  // 6. 高鐵搶票
  const thread6 = await insertThread(
    'chat',
    '高鐵春節票開搶了 你搶到了嗎',
    '1/16凌晨0點開搶\n春節疏運2/13-2/23\n\n我搶到初二回家的票了\n\n你們搶到沒',
    '名無しさん',
    240
  );
  await insertReply(thread6, '搶到了 但時間很爛', '名無しさん', 238);
  await insertReply(thread6, '沒搶到QQ 只剩站票', '名無しさん', 236);
  await insertReply(thread6, '>>1\n初二回家 勇者', '名無しさん', 234);
  await insertReply(thread6, '開車回去 不搶', '名無しさん', 232);
  await insertReply(thread6, '台北人沒這困擾', '名無しさん', 230);
  await insertReply(thread6, '>>5\n羨慕', '南部人', 228);
  await insertReply(thread6, '客運便宜但好累', '名無しさん', 226);
  console.log(`  ✅ #${thread6} 高鐵搶票`);

  // 7. 年貨大街
  const thread7 = await insertThread(
    'chat',
    '年貨大街開始了 今年要買什麼',
    '迪化街、桃園、新竹都開始了\n\n每年必買：\n- 肉乾\n- 堅果\n- 糖果餅乾\n\n你們會去逛嗎',
    '名無しさん',
    30
  );
  await insertReply(thread7, '人太多了 網購比較快', '名無しさん', 29);
  await insertReply(thread7, '迪化街的氣氛還是很棒', '名無しさん', 28);
  await insertReply(thread7, '>>1\n肉乾現在好貴', '名無しさん', 27);
  await insertReply(thread7, '去試吃就飽了', '名無しさん', 26);
  await insertReply(thread7, '今年物價漲\n年貨預算爆表', '名無しさん', 25);
  await insertReply(thread7, '桃園藝文廣場那個還不錯', '桃園人', 24);
  console.log(`  ✅ #${thread7} 年貨大街`);

  // 8. 台中燈會嚕嚕米
  const thread8 = await insertThread(
    'chat',
    '台中燈會今年是嚕嚕米！60公尺極光主燈',
    '2/15-3/3 台中燈會\n今年首度結合嚕嚕米IP\n\n全台最大60公尺極光主燈秀\n7大展區\n\n嚕嚕米迷要去朝聖了',
    '嚕嚕米粉',
    25
  );
  await insertReply(thread8, '嚕嚕米超可愛！', '名無しさん', 24);
  await insertReply(thread8, '60公尺 很大欸', '名無しさん', 23);
  await insertReply(thread8, '>>1\n台北燈會輸了', '名無しさん', 22);
  await insertReply(thread8, '會不會人擠人', '名無しさん', 21);
  await insertReply(thread8, '去年的燈會就很讚', '台中人', 20);
  await insertReply(thread8, '要拍照打卡了', '名無しさん', 19);
  console.log(`  ✅ #${thread8} 台中燈會`);

  // 9. 過年親戚問話
  const thread9 = await insertThread(
    'chat',
    '過年親戚問話求生指南',
    '又到了被親戚關心的季節\n\n常見問題：\n- 交男/女朋友了沒\n- 薪水多少\n- 什麼時候結婚\n- 什麼時候生\n\n你們都怎麼回',
    '名無しさん',
    20
  );
  await insertReply(thread9, '反問回去\n「阿姨你股票賺多少」', '名無しさん', 19);
  await insertReply(thread9, '裝忙滑手機', '名無しさん', 18);
  await insertReply(thread9, '>>1\n直接不回去 完美', '名無しさん', 17);
  await insertReply(thread9, '微笑點頭然後轉移話題', '名無しさん', 16);
  await insertReply(thread9, '小孩才回答 大人都裝沒聽到', '名無しさん', 15);
  await insertReply(thread9, '「緣分到了自然會」萬用', '名無しさん', 14);
  await insertReply(thread9, '今年準備說在交往中\n先堵住他們', '名無しさん', 13);
  await insertReply(thread9, '>>7\n小心被追問對象是誰', '名無しさん', 12);
  console.log(`  ✅ #${thread9} 親戚問話`);

  // 10. 寒流
  const thread10 = await insertThread(
    'chat',
    '這波寒流也太冷了吧',
    '台北體感溫度剩10度\n山區更冷\n\n暖氣開整天電費爆表\n\n大家都怎麼取暖',
    '怕冷的人',
    15
  );
  await insertReply(thread10, '電熱毯是神器', '名無しさん', 14);
  await insertReply(thread10, '窩在被子裡不出來', '名無しさん', 13);
  await insertReply(thread10, '>>1\n去7-11站著取暖', '名無しさん', 12);
  await insertReply(thread10, '泡澡泡到皺', '名無しさん', 11);
  await insertReply(thread10, '南部人表示還好', '高雄人', 10);
  await insertReply(thread10, '>>5\n南部冷起來更慘\n沒暖氣', '名無しさん', 9);
  await insertReply(thread10, '穿發熱衣疊三層', '名無しさん', 8);
  console.log(`  ✅ #${thread10} 寒流`);

  // 11. 美食推薦
  const thread11 = await insertThread(
    'chat',
    '過年期間有開的餐廳推薦',
    '過年很多店都休息\n但總有不想吃年菜的時候\n\n大家知道哪些過年有開的店嗎\n\n台北的話',
    '吃貨',
    35
  );
  await insertReply(thread11, '連鎖店大部分有開', '名無しさん', 34);
  await insertReply(thread11, '日本料理店很多過年營業', '名無しさん', 33);
  await insertReply(thread11, '>>1\n百貨公司美食街', '名無しさん', 32);
  await insertReply(thread11, 'Google Maps 查營業時間最準', '名無しさん', 31);
  await insertReply(thread11, '初一初二很多休\n初三後比較多', '名無しさん', 30);
  await insertReply(thread11, '便利商店永遠在', '名無しさん', 29);
  console.log(`  ✅ #${thread11} 過年餐廳`);

  // 12. 紅包行情
  const thread12 = await insertThread(
    'chat',
    '2026紅包行情多少',
    '每年都在煩惱這個\n\n給父母：?\n給姪子姪女：?\n給長輩：?\n\n物價漲\n紅包要不要跟著漲',
    '名無しさん',
    40
  );
  await insertReply(thread12, '父母6000起跳', '名無しさん', 39);
  await insertReply(thread12, '小孩600-1200看交情', '名無しさん', 38);
  await insertReply(thread12, '>>1\n我都包雙數吉利', '名無しさん', 37);
  await insertReply(thread12, '今年漲到800', '名無しさん', 36);
  await insertReply(thread12, '紅包是支出黑洞', '名無しさん', 35);
  await insertReply(thread12, '還沒結婚可以收紅包\n快結了', '名無しさん', 34);
  await insertReply(thread12, '>>6\n趁年輕多收', '名無しさん', 33);
  console.log(`  ✅ #${thread12} 紅包行情`);

  // 13. WFH
  const thread13 = await insertThread(
    'chat',
    '你們公司還有WFH嗎',
    '疫情過後很多公司取消WFH了\n\n我們公司一週只剩一天\n很懷念全遠端的日子\n\n你們呢',
    '社畜',
    60
  );
  await insertReply(thread13, '完全取消了 天天進辦公室', '名無しさん', 59);
  await insertReply(thread13, '一週兩天 夠了', '名無しさん', 58);
  await insertReply(thread13, '>>1\n外商還是很彈性', '名無しさん', 57);
  await insertReply(thread13, '在家工作效率比較好\n但老闆不信', '名無しさん', 56);
  await insertReply(thread13, '我們全遠端 幸福', '名無しさん', 55);
  await insertReply(thread13, '>>5\n什麼公司 收人嗎', '名無しさん', 54);
  await insertReply(thread13, '通勤兩小時真的很累', '名無しさん', 53);
  console.log(`  ✅ #${thread13} WFH`);

  // 14. 手搖飲
  const thread14 = await insertThread(
    'chat',
    '最近大家都喝什麼手搖',
    '冬天到了\n想喝熱的\n\n最近迷上鮮奶茶\n但每天一杯也太傷\n\n大家推薦什麼',
    '飲料控',
    45
  );
  await insertReply(thread14, '五十嵐鮮奶茶讚', '名無しさん', 44);
  await insertReply(thread14, '迷客夏的芋頭牛奶', '名無しさん', 43);
  await insertReply(thread14, '>>1\n冬天喝熱可可', '名無しさん', 42);
  await insertReply(thread14, '一杯70-80 比便當貴', '名無しさん', 41);
  await insertReply(thread14, '路易莎比較省', '名無しさん', 40);
  await insertReply(thread14, '戒糖中 只喝無糖', '名無しさん', 39);
  await insertReply(thread14, '珍珠熱量炸彈', '名無しさん', 38);
  console.log(`  ✅ #${thread14} 手搖飲`);

  // 15. 睡眠
  const thread15 = await insertThread(
    'chat',
    '大家都幾點睡',
    '我習慣1-2點睡\n早上8點起床\n\n感覺睡眠品質不太好\n\n你們都幾點睡',
    '夜貓子',
    55
  );
  await insertReply(thread15, '12點 準時', '名無しさん', 54);
  await insertReply(thread15, '3-4點... 我知道不好', '名無しさん', 53);
  await insertReply(thread15, '>>1\n11點睡最健康', '名無しさん', 52);
  await insertReply(thread15, '想早睡但做不到', '名無しさん', 51);
  await insertReply(thread15, '睡前滑手機一滑就2點', '名無しさん', 50);
  await insertReply(thread15, '有小孩後9點就睡了', '名無しさん', 49);
  await insertReply(thread15, '>>6\n人生勝利組', '名無しさん', 48);
  console.log(`  ✅ #${thread15} 睡眠時間`);

  // 16. 拖延症
  const thread16 = await insertThread(
    'chat',
    '拖延症怎麼治',
    '永遠在deadline前一天才開始\n然後熬夜趕完\n\n知道這樣不好\n但每次都這樣\n\n有解嗎',
    '拖延症患者',
    70
  );
  await insertReply(thread16, '我也是 沒救了', '名無しさん', 69);
  await insertReply(thread16, '番茄鐘工作法試過嗎', '名無しさん', 68);
  await insertReply(thread16, '>>1\n把deadline提前騙自己', '名無しさん', 67);
  await insertReply(thread16, '反正最後都會完成\n順其自然', '名無しさん', 66);
  await insertReply(thread16, '壓力是最好的動力', '名無しさん', 65);
  await insertReply(thread16, '完美主義是拖延的根源', '名無しさん', 64);
  console.log(`  ✅ #${thread16} 拖延症`);

  console.log('\n✅ 完成！共新增 16 個 chat 版討論串及其回覆');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
