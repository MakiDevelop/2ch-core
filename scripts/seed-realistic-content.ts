#!/usr/bin/env tsx
/**
 * Seed script for adding realistic content to 2ch-core production database
 *
 * Usage:
 *   npx tsx scripts/seed-realistic-content.ts
 *
 * This script generates:
 * - High-quality threads for underrepresented boards
 * - Realistic replies for existing and new threads
 */

import { Pool } from 'pg';
import crypto from 'crypto';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/2ch',
});

// Helper: Generate realistic IP hash
function generateIpHash(): string {
  const randomIp = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  return crypto.createHash('sha256').update(randomIp).digest('hex');
}

// Helper: Random user agent
const userAgents = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
];

function randomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Helper: Insert thread
async function insertThread(
  boardSlug: string,
  title: string,
  content: string,
  authorName: string = '名無しさん'
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
    [content, 0, generateIpHash(), randomUserAgent(), null, boardId, title, authorName, Math.floor(Math.random() * 168)] // Random time within last week
  );

  return result.rows[0].id;
}

// Helper: Insert reply
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

// ===== CONTENT GENERATION =====

async function seedLoveBoard() {
  console.log('📝 Seeding love board (感情/兩性/婚姻)...');

  const thread1 = await insertThread(
    'love',
    '交往三年，他還是不想結婚',
    `我們都30歲了，交往也三年多
他就是一直說「再等等」「還沒準備好」

上個月我說想要訂婚，他又開始拖
朋友都結婚生小孩了，我真的很焦慮

到底要等到什麼時候啊...`,
    '等不到結婚的女友'
  );
  await insertReply(thread1, '三年都不結婚，要不就是沒錢，要不就是不想', '過來人', 1);
  await insertReply(thread1, '直接問清楚他的想法吧\n拖下去對妳也不好', '名無しさん', 2);
  await insertReply(thread1, '>>1 +1\n男生如果真的想結婚不會拖三年', '名無しさん', 3);
  await insertReply(thread1, '我男友也是這樣，後來發現他只是不想結婚而已', '同樣處境', 5);
  await insertReply(thread1, '30歲真的要趕快決定了\n不然就是浪費時間', '名無しさん', 8);

  const thread2 = await insertThread(
    'love',
    '暗戀同事半年了，該告白嗎？',
    `每天上班最期待的就是看到她
但是不確定她對我有沒有意思

偶爾會聊天、一起吃午餐
但她對誰都很友善，看不出來

如果告白失敗，上班會很尷尬吧...`,
    '猶豫不決'
  );
  await insertReply(thread2, '先試探看看啊\n約下班吃飯或看電影', '名無しさん', 1);
  await insertReply(thread2, '職場戀情要小心，分手了超尷尬', '辦公室戀愛受害者', 2);
  await insertReply(thread2, '半年了還不確定？可能沒戲吧', '名無しさん', 4);
  await insertReply(thread2, '>>3 不要這麼悲觀啦www\n至少試試看', '名無しさん', 6);

  const thread3 = await insertThread(
    'love',
    '女友一直要我報備行蹤',
    `每次出門都要報備
跟誰、去哪、做什麼、幾點回家

就連跟朋友吃飯也要視訊確認
手機要隨時接，不接就奪命連環call

這樣正常嗎？覺得好累...`,
    '被管很嚴'
  );
  await insertReply(thread3, '這是控制慾太強吧，要溝通', '名無しさん', 1);
  await insertReply(thread3, '你有沒有做什麼讓她沒安全感的事？', '路過', 2);
  await insertReply(thread3, '>>2 沒有的話就是她的問題了', '名無しさん', 3);
  await insertReply(thread3, '這樣下去你會瘋掉\n建議好好談', '過來人', 5);
  await insertReply(thread3, '換個角度想，至少她很在意你（？', '名無しさん', 7);
  await insertReply(thread3, '>>5 太窒息了不叫在意好嗎', '名無しさん', 8);

  const thread4 = await insertThread(
    'love',
    '相親對象各方面都很好，但就是沒感覺',
    `家境好、工作穩定、人也不錯
爸媽很滿意，一直叫我趕快交往

可是見了幾次面
就是沒有心動的感覺

要為了結婚而結婚嗎？`,
    '30歲的煩惱'
  );
  await insertReply(thread4, '條件好不代表適合啊', '名無しさん', 1);
  await insertReply(thread4, '感覺可以培養，先試試看交往？', '相親過來人', 2);
  await insertReply(thread4, '我就是這樣結婚的，現在也過得不錯', '名無しさん', 4);
  await insertReply(thread4, '>>3 但如果一直沒感覺呢？', '名無しさん', 5);

  const thread5 = await insertThread(
    'love',
    '男友打game比陪我重要',
    `每天下班回家就是打game
週末也是整天掛在電腦前

約他出去要看「有沒有raid」
說話都在「嗯嗯啊啊」

我只是要一點陪伴而已...`,
    '遊戲寡婦'
  );
  await insertReply(thread5, '跟他好好談啊\n不然就分手', '名無しさん', 1);
  await insertReply(thread5, '我男友也是\n後來規定遊戲時間才改善', '同病相憐', 2);
  await insertReply(thread5, '妳也可以找自己的興趣啊', '遊戲宅', 3);
  await insertReply(thread5, '>>3 重點是陪伴好嗎', '名無しさん', 4);
  await insertReply(thread5, '打game的時候不要煩他，設定固定的相處時間', '平衡派', 6);

  const thread6 = await insertThread(
    'love',
    '分手後還能當朋友嗎？',
    `前女友說想當朋友
偶爾還會傳訊息聊天

但我還沒完全放下
看到她的訊息心情就很複雜

是不是該封鎖比較好？`,
    '走不出來'
  );
  await insertReply(thread6, '還沒放下就別當朋友\n對自己殘忍', '過來人', 1);
  await insertReply(thread6, '>>1 +1 先斷聯一陣子', '名無しさん', 2);
  await insertReply(thread6, '能當朋友的都是沒愛過www', '名無しさん', 3);
  await insertReply(thread6, '給自己時間吧\n不用急著決定', '溫柔派', 5);

  console.log('✅ Love board seeded');
}

async function seedMoneyBoard() {
  console.log('📝 Seeding money board (金錢/投資/理財)...');

  const thread1 = await insertThread(
    'money',
    '存款到100萬了，接下來怎麼規劃？',
    `努力存了三年終於破百萬
除了定存，還能怎麼運用？

想法是：
- 50萬定存保底
- 30萬買ETF
- 20萬當緊急預備金

這樣配置OK嗎？`,
    '理財新手'
  );
  await insertReply(thread1, '恭喜！配置滿穩健的', '名無しさん', 1);
  await insertReply(thread1, 'ETF可以考慮 0050 或 006208\n長期持有', 'ETF信徒', 2);
  await insertReply(thread1, '20萬緊急預備金有點少\n建議至少半年生活費', '保守派', 3);
  await insertReply(thread1, '>>3 +1\n先確保生活安全', '名無しさん', 4);

  const thread2 = await insertThread(
    'money',
    '台積電現在還能進場嗎？',
    `看AI熱潮好像還會漲
但現在價位已經很高了

擔心追高被套牢
但又怕錯過這波漲勢

各位覺得呢？`,
    '觀望中'
  );
  await insertReply(thread2, '不要all in就好\n可以分批買', '名無しさん', 1);
  await insertReply(thread2, '台積電長期看好啊\n現在進也不算太晚', '長期投資', 2);
  await insertReply(thread2, '等回調再進比較安全', '穩健派', 3);
  await insertReply(thread2, '>>3 問題是不知道會不會回調', '名無しさん', 5);
  await insertReply(thread2, 'AI趨勢才剛開始\n台積電還有空間', '樂觀派', 7);

  const thread3 = await insertThread(
    'money',
    '30歲存款只有30萬，是不是很失敗？',
    `看到別人都存上百萬
自己只有30萬覺得超慚愧

收入不高，扣掉房租生活費就沒剩多少
想存錢但總是有意外支出

該怎麼辦...`,
    '存不到錢'
  );
  await insertReply(thread3, '不要比較啦\n每個人狀況不同', '名無しさん', 1);
  await insertReply(thread3, '至少有存到30萬，很多人是負的', '樂觀派', 2);
  await insertReply(thread3, '記帳看看\n找出錢都花在哪', '過來人', 3);
  await insertReply(thread3, '>>3 +1 記帳很有用', '名無しさん', 4);
  await insertReply(thread3, '重點是持續存\n慢慢累積', '名無しさん', 6);

  const thread4 = await insertThread(
    'money',
    '高股息ETF還是成長型ETF？',
    `0056、00878 這類高股息
vs
0050、006208 這類大盤型

各有什麼優缺點？
該怎麼選？`,
    '選擇困難'
  );
  await insertReply(thread4, '看你要現金流還是資本利得', '名無しさん', 1);
  await insertReply(thread4, '高股息：定期配息，適合退休\n成長型：長期增值，適合年輕人', '分析師', 2);
  await insertReply(thread4, '我兩種都買\n各佔一半', '平衡派', 3);
  await insertReply(thread4, '>>3 這樣配置不錯', '名無しさん', 4);

  const thread5 = await insertThread(
    'money',
    '被信用卡循環利息吃掉好多錢',
    `上個月忘記繳全額
結果被扣了2000多的循環利息

信用卡利率真的超高
以後一定要記得繳清...`,
    '繳循環哭哭'
  );
  await insertReply(thread5, '信用卡循環利率15%起跳，超可怕', '名無しさん', 1);
  await insertReply(thread5, '可以設定自動扣款避免忘記', '理財老手', 2);
  await insertReply(thread5, '>>2 對，自動扣款真的方便', '名無しさん', 3);
  await insertReply(thread5, '繳不起全額就不要刷了', '保守派', 5);

  console.log('✅ Money board seeded');
}

async function seedNewsBoard() {
  console.log('📝 Seeding news board (時事/政治)...');

  const thread1 = await insertThread(
    'news',
    '台灣的交通違規罰金太輕了吧',
    `看到新聞又有人酒駕撞死人
罰金才幾萬塊，關個幾個月就出來

對比其他國家：
- 日本酒駕：罰款100萬日圓起跳
- 新加坡：罰款+鞭刑+吊銷駕照

台灣的法律根本沒嚇阻力`,
    '氣憤的路人'
  );
  await insertReply(thread1, '完全同意\n罰太輕了', '名無しさん', 1);
  await insertReply(thread1, '酒駕累犯應該直接入獄', '名無しさん', 2);
  await insertReply(thread1, '問題是修法很難\n立委不想得罪選民', '現實派', 3);
  await insertReply(thread1, '>>3 所以就繼續放任嗎', '名無しさん', 4);
  await insertReply(thread1, '建議比照日本，罰到傾家蕩產', '名無しさん', 6);

  const thread2 = await insertThread(
    'news',
    '公家機關的效率真的有夠差',
    `去戶政事務所辦個證件
前面只有3個人，等了快一小時

辦事員動作超慢
還一直聊天、喝咖啡

難怪大家都說公務員爽`,
    '浪費一早上'
  );
  await insertReply(thread2, '公務員生態就這樣\n不用期待', '名無しさん', 1);
  await insertReply(thread2, '可以打1999申訴', '名無しさん', 2);
  await insertReply(thread2, '>>2 申訴有用嗎www', '名無しさん', 3);
  await insertReply(thread2, '有些公務員還是很認真的啦', '公務員', 5);

  const thread3 = await insertThread(
    'news',
    '台北房價是不是永遠不會跌了？',
    `新聞說建商又在喊漲
蛋白區都要破50萬了

薪水凍漲，房價飆漲
年輕人真的買不起

到底什麼時候會回歸正常...`,
    '買不起房'
  );
  await insertReply(thread3, '不會跌的\n有錢人一堆', '現實派', 1);
  await insertReply(thread3, '除非經濟崩盤\n不然房價只會往上', '名無しさん', 2);
  await insertReply(thread3, '租房也不錯啊\n何必執著買房', '租屋派', 3);
  await insertReply(thread3, '>>3 租金也在漲好嗎', '名無しさん', 4);
  await insertReply(thread3, '建議考慮新北或桃園', '務實派', 6);

  const thread4 = await insertThread(
    'news',
    '詐騙集團為什麼抓不完？',
    `每天新聞都在報詐騙案
警察也一直宣導

但詐騙還是層出不窮
家裡長輩差點被騙30萬

到底是哪裡出問題？`,
    '擔心家人'
  );
  await insertReply(thread4, '因為詐騙成本太低\n罰得太輕', '名無しさん', 1);
  await insertReply(thread4, '很多機房在國外\n台灣管不到', '名無しさん', 2);
  await insertReply(thread4, '>>2 對，東南亞一堆詐騙園區', '名無しさん', 3);
  await insertReply(thread4, '重點還是防範意識要強', '名無しさん', 5);

  const thread5 = await insertThread(
    'news',
    '台灣的醫療真的很棒',
    `看到美國朋友生病
光看診就要花上萬台幣

台灣健保真的太佛心
掛號費150就能看診拿藥

希望健保能永續經營`,
    '感恩健保'
  );
  await insertReply(thread5, '台灣健保世界第一', '名無しさん', 1);
  await insertReply(thread5, '但健保財務真的撐不住了', '憂心派', 2);
  await insertReply(thread5, '>>2 需要調整制度', '名無しさん', 3);
  await insertReply(thread5, '真的要珍惜', '名無しさん', 4);

  console.log('✅ News board seeded');
}

async function seedGossipBoard() {
  console.log('📝 Seeding gossip board (娛樂/名人/八卦)...');

  const thread1 = await insertThread(
    'gossip',
    '覺得現在的韓劇都太灑狗血了',
    `最近追的幾部韓劇
不是財閥繼承就是時空穿越

劇情越來越浮誇
角色設定也很扁平

懷念以前《請回答1988》那種寫實風格`,
    '韓劇疲乏'
  );
  await insertReply(thread1, '請回答系列真的經典', '名無しさん', 1);
  await insertReply(thread1, '現在韓劇都在拼視覺特效\n少了真實感', '追劇仔', 2);
  await insertReply(thread1, '>>2 完全同意', '名無しさん', 3);
  await insertReply(thread1, '推薦《我的出走日記》\n很寫實', '推劇派', 4);

  const thread2 = await insertThread(
    'gossip',
    '最近YouTube演算法是不是壞掉了',
    `首頁都是重複的影片
訂閱的創作者都不推

反而一直推薦我沒興趣的內容
是不是該重新訓練演算法了`,
    '演算法受害者'
  );
  await insertReply(thread2, '我也是！一直推短影音', '名無しさん', 1);
  await insertReply(thread2, '可以多點「不感興趣」', '名無しさん', 2);
  await insertReply(thread2, '>>2 點了也沒用啊', '名無しさん', 3);
  await insertReply(thread2, 'YouTube就是要你多看廣告', '現實派', 5);

  const thread3 = await insertThread(
    'gossip',
    '台灣網紅的業配越來越誇張',
    `每個影片都在業配
連片頭都要硬塞廣告

內容越來越空洞
只剩下業配業配業配

以前那些有趣的創作者都變了`,
    '失望的觀眾'
  );
  await insertReply(thread3, '網紅也要吃飯啊', '理解派', 1);
  await insertReply(thread3, '>>1 但也不用每支影片都業配吧', '名無しさん', 2);
  await insertReply(thread3, '創作跟業配的平衡很難抓', '名無しさん', 3);
  await insertReply(thread3, '直接退訂了，懶得看', '名無しさん', 5);

  const thread4 = await insertThread(
    'gossip',
    'Netflix台劇越來越好看了',
    `華燈初上、模仿犯、人選之人
質感都不輸韓劇

台灣影視產業終於起來了？`,
    '台劇粉'
  );
  await insertReply(thread4, '台劇這幾年真的進步很多', '名無しさん', 1);
  await insertReply(thread4, '模仿犯超好看', '追劇狂', 2);
  await insertReply(thread4, '>>2 +1 張孝全演技太強', '名無しさん', 3);
  await insertReply(thread4, '希望能繼續保持品質', '樂觀派', 4);

  const thread5 = await insertThread(
    'gossip',
    '演唱會票價越來越貴是怎樣',
    `動不動就是3000、5000起跳
搶黃牛票更是破萬

以前看演唱會1500就能進場
現在根本看不起`,
    '窮粉絲'
  );
  await insertReply(thread5, '通膨啊\n什麼都在漲', '名無しさん', 1);
  await insertReply(thread5, '黃牛太猖狂了', '受害者', 2);
  await insertReply(thread5, '>>2 應該要實名制', '名無しさん', 3);
  await insertReply(thread5, '看線上演唱會就好www', '省錢派', 4);

  console.log('✅ Gossip board seeded');
}

async function seedLifeBoard() {
  console.log('📝 Seeding life board (生活/心情)...');

  const thread1 = await insertThread(
    'life',
    '早上7點的捷運，大家都好累',
    `每個人都在滑手機或補眠
沒有人在聊天

偶爾會想，大家是為了什麼而努力？

通勤時間是一天最孤獨的時候`,
    '通勤觀察家'
  );
  await insertReply(thread1, '上班族的日常', '名無しさん', 1);
  await insertReply(thread1, '為了生活啊\n不然要怎麼辦', '現實派', 2);
  await insertReply(thread1, '通勤真的很厭世', '名無しさん', 3);
  await insertReply(thread1, '>>3 所以我選擇遠端工作', 'WFH族', 5);

  const thread2 = await insertThread(
    'life',
    '30歲生日，一個人吃飯',
    `本來約了朋友
結果都有事不能來

最後自己去吃王品慶生
服務生還唱生日快樂歌

雖然有點孤單，但也還行`,
    '30歲的孤獨'
  );
  await insertReply(thread2, '生日快樂！', '名無しさん', 1);
  await insertReply(thread2, '一個人也可以過得很好', '獨立派', 2);
  await insertReply(thread2, '>>1 謝謝！', '30歲的孤獨', 3);
  await insertReply(thread2, '自己慶生也不錯啊', '名無しさん', 4);

  const thread3 = await insertThread(
    'life',
    '租屋處隔音超差，聽到鄰居吵架',
    `昨天半夜被吵醒
隔壁在大吵
摔東西的聲音超大

想搬家但又剛續約
只能忍一年...`,
    '失眠鄰居'
  );
  await insertReply(thread3, '買耳塞試試看', '名無しさん', 1);
  await insertReply(thread3, '可以跟房東反應', '名無しさん', 2);
  await insertReply(thread3, '>>2 房東也沒辦法吧', '名無しさん', 3);
  await insertReply(thread3, '租屋真的辛苦', '同病相憐', 5);

  const thread4 = await insertThread(
    'life',
    '被家裡催婚催到煩',
    `每次回家就是問：
「有沒有對象？」
「要不要介紹？」
「再不結婚就來不及了」

我才28歲欸！`,
    '被催婚的單身狗'
  );
  await insertReply(thread4, '台灣長輩都這樣', '名無しさん', 1);
  await insertReply(thread4, '左耳進右耳出就好', '老鳥', 2);
  await insertReply(thread4, '>>2 說得容易www', '名無しさん', 3);
  await insertReply(thread4, '我都直接說「努力中」敷衍過去', '應對高手', 4);

  console.log('✅ Life board seeded');
}

async function seedAcgBoard() {
  console.log('📝 Seeding acg board (ACG/遊戲)...');

  const thread1 = await insertThread(
    'acg',
    '崩壞：星穹鐵道 vs 原神，選哪個？',
    `兩個都是米哈遊的遊戲
星鐵是回合制，原神是動作

時間有限只能玩一款
各位推薦哪個？`,
    '選擇障礙'
  );
  await insertReply(thread1, '喜歡動作就原神\n喜歡策略就星鐵', '名無しさん', 1);
  await insertReply(thread1, '星鐵比較不吃操作', '手殘派', 2);
  await insertReply(thread1, '>>2 同意，星鐵對手殘友善', '名無しさん', 3);
  await insertReply(thread1, '原神探索比較爽', '探索黨', 4);

  const thread2 = await insertThread(
    'acg',
    'Steam冬特有什麼推薦的？',
    `預算大概1000塊
想買單機遊戲

喜歡RPG、解謎類
不喜歡恐怖遊戲

有推薦的嗎？`,
    '等特價仔'
  );
  await insertReply(thread2, 'Hades打折必入', '名無しさん', 1);
  await insertReply(thread2, 'Hollow Knight 超值', '銀河惡魔城粉', 2);
  await insertReply(thread2, '>>2 +1 空洞騎士神作', '名無しさん', 3);
  await insertReply(thread2, '推薦 Ori 系列', '名無しさん', 4);

  const thread3 = await insertThread(
    'acg',
    '日本動畫越來越多異世界轉生',
    `每季新番至少5部異世界
劇情都大同小異

什麼時候才能有點新意？`,
    '看膩了'
  );
  await insertReply(thread3, '因為賣得好啊', '現實派', 1);
  await insertReply(thread3, '推薦看《葬送的芙莉蓮》\n不是異世界', '推薦派', 2);
  await insertReply(thread3, '>>2 芙莉蓮超好看', '名無しさん', 3);
  await insertReply(thread3, '異世界題材已經被玩爛了', '名無しさん', 4);

  const thread4 = await insertThread(
    'acg',
    'PS5值得買嗎？還是等PS5 Pro',
    `最近想買PS5
但聽說Pro要出了

該現在買還是等Pro？`,
    '猶豫中'
  );
  await insertReply(thread4, 'Pro貴很多\n一般版就夠用', '名無しさん', 1);
  await insertReply(thread4, '如果有4K電視可以等Pro', '畫質黨', 2);
  await insertReply(thread4, '>>2 沒有的話就買一般版', '名無しさん', 3);
  await insertReply(thread4, '現在獨佔遊戲也不多', '觀望派', 4);

  console.log('✅ ACG board seeded');
}

async function seedMetaBoard() {
  console.log('📝 Seeding meta board (站務/建議)...');

  const thread1 = await insertThread(
    'meta',
    '建議增加「收藏」功能',
    `有些討論串想要之後再回來看
但找不到收藏功能

希望能新增書籤或收藏列表`,
    '功能建議'
  );
  await insertReply(thread1, '+1 這功能滿實用的', '名無しさん', 1);
  await insertReply(thread1, '或是可以用瀏覽器書籤', '名無しさん', 2);
  await insertReply(thread1, '>>2 但瀏覽器書籤不方便管理', '名無しさん', 3);

  const thread2 = await insertThread(
    'meta',
    '能不能加個「熱門討論」排序？',
    `現在只有「最新」排序
有時候想看熱門的討論串

建議可以加上：
- 回覆數排序
- 24小時熱門
- 本週熱門`,
    '站務建議'
  );
  await insertReply(thread2, '這個建議不錯', '名無しさん', 1);
  await insertReply(thread2, '熱門排序很實用+1', '名無しさん', 2);
  await insertReply(thread2, '>>2 同意', '名無しさん', 3);

  const thread3 = await insertThread(
    'meta',
    '感謝站長做出這個平台',
    `匿名討論真的很需要
可以放心講真話

希望這個站能一直經營下去`,
    '感謝'
  );
  await insertReply(thread3, '真的！支持站長', '名無しさん', 1);
  await insertReply(thread3, '台灣需要這樣的平台', '名無しさん', 2);
  await insertReply(thread3, '+1', '名無しさん', 3);

  console.log('✅ Meta board seeded');
}

// ===== MAIN EXECUTION =====

async function main() {
  console.log('🚀 Starting content seeding...\n');

  try {
    await seedLoveBoard();
    await seedMoneyBoard();
    await seedNewsBoard();
    await seedGossipBoard();
    await seedLifeBoard();
    await seedAcgBoard();
    await seedMetaBoard();

    console.log('\n✅ All content seeded successfully!');

    // Print statistics
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM posts WHERE parent_id IS NULL) as threads,
        (SELECT COUNT(*) FROM posts WHERE parent_id IS NOT NULL) as replies,
        (SELECT COUNT(*) FROM posts) as total
    `);

    console.log('\n📊 Database Statistics:');
    console.log(`- Total threads: ${result.rows[0].threads}`);
    console.log(`- Total replies: ${result.rows[0].replies}`);
    console.log(`- Total posts: ${result.rows[0].total}`);

  } catch (error) {
    console.error('❌ Error seeding content:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
