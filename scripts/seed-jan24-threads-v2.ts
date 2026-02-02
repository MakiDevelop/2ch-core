#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-24 v2 - 新增更多討論串主題與回覆
 *
 * 基於真實時事來源：
 * - CES 2026：黃仁勳宣布「物理AI的ChatGPT時刻到了」、Rubin平台
 * - 台美關稅協議：降至15%，台灣模式進軍美國
 * - 2026轉職潮：86.2%上班族考慮年前換工作，59%已投履歷
 * - 五大缺工產業：科技、建築、餐飲、醫療、製造
 * - 企業加薪：59.8%企業Q1有調薪計畫，平均4.1%
 * - AI技能：75%企業願意為AI技能加薪
 * - 失業率3.33%，25年同期最低
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
  console.log('📝 新增討論串主題與回覆 v2 (2026-01-24)...\n');

  // ========== TECH 板：CES 2026 ==========
  console.log('  🤖 [tech] CES 2026 黃仁勳說物理AI時刻到了');
  const t1 = await insertThread(
    'tech',
    'CES 2026：黃仁勳說「物理AI的ChatGPT時刻到了」',
    '老黃在CES 2026演講\n說物理AI的ChatGPT時刻到了\n\n發布三個重點：\n1. Rubin運算平台\n2. 自駕車模型\n3. 開源模型',
    '科技迷',
    10
  );
  await insertReply(t1, '靈巧手也很多\n中韓廠商超強', '名無しさん', 9);
  await insertReply(t1, '>>2 機器人商用化快了\n工廠搬運物流都能用', '名無しさん', 8);
  await insertReply(t1, '長壽經濟變成新趨勢\n高齡科技產品超多', '名無しさん', 7);
  await insertReply(t1, '>>4 台灣老年化嚴重\n這塊市場很大', '名無しさん', 6);
  await insertReply(t1, 'NVIDIA股價又要噴了', '名無しさん', 5);
  await insertReply(t1, '>>6 台積電也受惠\n先進製程吃到飽', '名無しさん', 4);

  // ========== TECH 板：AI技能求職 ==========
  console.log('  💼 [tech] AI技能變求職必備');
  const t2 = await insertThread(
    'tech',
    '75%企業願意為AI技能加薪，轉職要學什麼',
    '104調查\n75%企業願意為AI開發技能加薪\n\n麻省理工教授說\n未來不是「能不能做」\n而是「能不能和AI創造附加價值」',
    '轉職者',
    8
  );
  await insertReply(t2, 'Prompt engineering最基本\n會寫提示詞就贏一半', '名無しさん', 7);
  await insertReply(t2, '>>2 Python必學\n資料分析基礎要有', '工程師', 6);
  await insertReply(t2, '不是工程師的話\n學怎麼用AI提升效率就好', '名無しさん', 5);
  await insertReply(t2, '>>4 ChatGPT、Claude這些\n日常工作都能用', '名無しさん', 4);
  await insertReply(t2, '有些公司要求會用AI協作\n履歷可以寫上去', '名無しさん', 3);
  await insertReply(t2, '>>6 但也不要只靠AI\n基本功還是要有', '資深工程師', 2);

  // ========== WORK 板：年前轉職潮 ==========
  console.log('  🏃 [work] 86%上班族想年前換工作');
  const t3 = await insertThread(
    'work',
    '調查說86%上班族想年前換工作，你是其中之一嗎',
    'yes123調查\n86.2%考慮年前換工作\n59%已經開始投履歷了\n\n很多公司開「可年後上班」職缺\n不用放棄年終',
    '社畜',
    6
  );
  await insertReply(t3, '我就是那59%\n已經面試兩家了', '名無しさん', 5);
  await insertReply(t3, '>>2 年後再換比較安全\n年終先拿到', '名無しさん', 5);
  await insertReply(t3, '現在失業率3.33%\n25年同期最低\n工作好找', '名無しさん', 4);
  await insertReply(t3, '>>4 但好缺都很競爭\n投5次履歷才1次面試機會', '名無しさん', 3);
  await insertReply(t3, '想離開但怕沒年終\n好糾結', '名無しさん', 2);
  await insertReply(t3, '>>6 先談好年後上班\n兩邊都不虧', '名無しさん', 1);

  // ========== WORK 板：企業加薪 ==========
  console.log('  💰 [work] 六成企業Q1要加薪');
  const t4 = await insertThread(
    'work',
    '調查：六成企業Q1有調薪計畫，平均加4.1%',
    '59.8%企業明年Q1有調薪\n創2022年以來新高\n39.4%全面調薪\n平均調幅4.1%',
    '上班族',
    7
  );
  await insertReply(t4, '4.1%而已\n通膨都不止這個', '名無しさん', 6);
  await insertReply(t4, '>>2 有加就不錯了\n很多公司凍薪', '名無しさん', 5);
  await insertReply(t4, '五大缺工產業：科技、建築、餐飲、醫療、製造', '名無しさん', 4);
  await insertReply(t4, '>>4 缺工的行業薪水漲比較多\n供需問題', '名無しさん', 3);
  await insertReply(t4, '科技業還是最好\n但也最卷', '工程師', 2);
  await insertReply(t4, '>>6 醫護人員缺很大\n但工作環境太差', '名無しさん', 1);

  // ========== WORK 板：面試地雷 ==========
  console.log('  🚫 [work] 面試三大地雷答案');
  const t5 = await insertThread(
    'work',
    '這三種面試回答，主管馬上考慮不錄取',
    '經理人雜誌整理\n三種NG回答：\n\n1. 「我什麼都可以做」\n2. 「我沒有缺點」\n3. 「為什麼離開上一份工作？」答得太負面',
    '面試官',
    5
  );
  await insertReply(t5, '第一點超多人踩\n以為這樣很有誠意', '名無しさん', 4);
  await insertReply(t5, '>>2 要展現專業度\n不是當工具人', 'HR', 4);
  await insertReply(t5, '離職原因怎麼答才好\n說真話怕扣分', '名無しさん', 3);
  await insertReply(t5, '>>4 說「想尋求新挑戰」\n比較安全', '名無しさん', 2);
  await insertReply(t5, '「我沒有缺點」真的很假\n誰信啊', '名無しさん', 2);
  await insertReply(t5, '>>6 可以說「太追求完美」之類\n把缺點包裝成優點', '名無しさん', 1);

  // ========== NEWS 板：台美關稅協議 ==========
  console.log('  🇺🇸 [news] 台美關稅協議突破');
  const t6 = await insertThread(
    'news',
    '台美關稅協議突破，降到15%了',
    '紐時報導\n台美就關稅架構達成共識\n對等關稅降至15%\n不疊加最惠國待遇\n\n「台灣模式」進軍美國',
    '名無しさん',
    12
  );
  await insertReply(t6, '台積電要再蓋5座廠\n先進製程根留台灣', '名無しさん', 11);
  await insertReply(t6, '>>2 國科會說研發一定在台灣\n放心', '名無しさん', 10);
  await insertReply(t6, '15%比原本預期好很多\n本來說要100%', '名無しさん', 9);
  await insertReply(t6, '>>4 盧特尼克之前放話\n結果談出這個結果', '名無しさん', 8);
  await insertReply(t6, '對台股利多\n護國神山穩了', '名無しさん', 7);
  await insertReply(t6, '>>6 台積電已經漲到1695\n還有空間嗎', '名無しさん', 6);

  // ========== META 板：這個站很穩 ==========
  console.log('  🔧 [meta] 這個站比PTT穩多了');
  const t7 = await insertThread(
    'meta',
    '這個站比PTT穩多了',
    'PTT又掛了\n這邊都不會\n\n介面也比BBS好用\n不用學指令',
    '名無しさん',
    4
  );
  await insertReply(t7, '人少比較穩\n人多就不知道了', '名無しさん', 3);
  await insertReply(t7, '>>2 希望多拉人來\n討論區要人才熱鬧', '名無しさん', 3);
  await insertReply(t7, 'Link Preview做得不錯\n貼連結有預覽', '名無しさん', 2);
  await insertReply(t7, '>>4 手機版也順\n響應式設計', '名無しさん', 2);
  await insertReply(t7, '匿名發文門檻低\n不用註冊', '名無しさん', 1);
  await insertReply(t7, '>>6 但也可能被亂洗\n看站長怎麼管', '名無しさん', 1);

  // ========== META 板：建議新功能 ==========
  console.log('  💡 [meta] 建議新增夜間模式');
  const t8 = await insertThread(
    'meta',
    '可以新增夜間模式嗎',
    '晚上看白底很刺眼\n有深色模式的話會更好\n\n很多App都有這功能了',
    '名無しさん',
    5
  );
  await insertReply(t8, '+1 半夜爬文眼睛痛', '名無しさん', 4);
  await insertReply(t8, '>>2 手機有系統級深色模式\n但網頁要另外做', '名無しさん', 3);
  await insertReply(t8, '瀏覽器有外掛可以強制深色\nDark Reader之類的', '名無しさん', 2);
  await insertReply(t8, '>>4 但會跑版\n原生支援比較好', '名無しさん', 2);
  await insertReply(t8, '站長有在潛水嗎\n希望能看到', '名無しさん', 1);
  await insertReply(t8, '>>6 這種功能應該不難做\n CSS變數切換就好', '前端工程師', 1);

  // ========== CHAT 板：運動幣要抽籤 ==========
  console.log('  🎰 [chat] 運動幣1/26開始登記');
  const t9 = await insertThread(
    'chat',
    '運動幣1/26開始登記，只有60萬份',
    '運動部公告\n青春動滋券轉型成運動幣\n16歲以上都可以抽\n\n500元/份\n限量抽籤60萬份',
    '名無しさん',
    3
  );
  await insertReply(t9, '之前是16-22歲才有\n現在擴大了', '名無しさん', 2);
  await insertReply(t9, '>>2 但變成抽籤\n不一定抽得到', '名無しさん', 2);
  await insertReply(t9, '500元能幹嘛\n買個運動鞋都不夠', '名無しさん', 1);
  await insertReply(t9, '>>4 游泳池門票、健身房體驗\n還是可以用', '名無しさん', 1);
  await insertReply(t9, '記得1/26去登記\n別忘了', '名無しさん', 1);
  await insertReply(t9, '>>6 用APP登記嗎\n還是有網站', '名無しさん', 1);

  // ========== CHAT 板：捷運禁用行動電源 ==========
  console.log('  🔋 [chat] 台北捷運禁用行動電源');
  const t10 = await insertThread(
    'chat',
    '台北捷運宣布禁用行動電源了',
    '捷運公司公告\n進站「請勿使用」行動電源\n\n怕自燃造成意外\n出事要求償',
    '名無しさん',
    4
  );
  await insertReply(t10, '不是禁止攜帶\n是禁止使用', '名無しさん', 3);
  await insertReply(t10, '>>2 所以放包包裡沒關係？', '名無しさん', 3);
  await insertReply(t10, '之前有行動電源自燃的新聞\n怕出事', '名無しさん', 2);
  await insertReply(t10, '>>4 買有認證的比較安全\nBSMI標章要有', '名無しさん', 2);
  await insertReply(t10, '通勤時間手機沒電很痛苦\n只能忍了', '名無しさん', 1);
  await insertReply(t10, '>>6 出門前充飽電\n或帶本書看', '名無しさん', 1);

  // ========== MONEY 板：記帳存錢 ==========
  console.log('  💵 [money] 2026存錢計畫分享');
  const t11 = await insertThread(
    'money',
    '2026存錢計畫，大家目標多少',
    '新的一年\n想認真存錢\n目標存30萬\n\n有什麼方法分享一下',
    '月光族',
    6
  );
  await insertReply(t11, '52週存錢法\n每週遞增存', '名無しさん', 5);
  await insertReply(t11, '>>2 第一週存50\n第52週存2600\n年底就有6萬多', '名無しさん', 4);
  await insertReply(t11, '記帳最重要\n才知道錢花哪裡', '名無しさん', 3);
  await insertReply(t11, '>>4 推Money記帳App\n介面簡單', '名無しさん', 2);
  await insertReply(t11, '先存再花\n薪水進來先轉走', '名無しさん', 2);
  await insertReply(t11, '>>6 高利活存可以放\n現在有些2%以上', '名無しさん', 1);

  // ========== LOVE 板：過年被催婚 ==========
  console.log('  💔 [love] 過年又要被催婚了');
  const t12 = await insertThread(
    'love',
    '過年回家又要被催婚，該怎麼擋',
    '30了還單身\n過年回家壓力超大\n\n長輩一直問什麼時候結婚\n受不了',
    '單身狗',
    5
  );
  await insertReply(t12, '說「緣分還沒到」\n然後轉移話題', '名無しさん', 4);
  await insertReply(t12, '>>2 或者說「工作太忙」\n長輩通常能接受', '名無しさん', 4);
  await insertReply(t12, '帶朋友假裝男/女友\n演一下', '名無しさん', 3);
  await insertReply(t12, '>>4 這招風險太大\n穿幫很尷尬', '名無しさん', 2);
  await insertReply(t12, '減少待在家的時間\n多出去走走', '名無しさん', 2);
  await insertReply(t12, '>>6 約同學朋友聚會\n正當理由外出', '名無しさん', 1);

  console.log('\n✅ 完成！新增 12 個討論串，共 84 則內容（12主題+72回覆）');
}

seedThreads()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
