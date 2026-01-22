#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-21 - 基於時事的內容補充
 *
 * 時事來源：
 * - 台美關稅談判結果 (15% 非疊加)
 * - 台積電法說會前股價回檔
 * - CES 2026 黃仁勳發布會
 * - F4 合體破局、金唱片獎在大巨蛋
 * - 115 學測、大寒寒流
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

async function getBoardId(slug: string): Promise<number> {
  const result = await pool.query('SELECT id FROM boards WHERE slug = $1', [slug]);
  if (result.rows.length === 0) {
    throw new Error(`Board not found: ${slug}`);
  }
  return result.rows[0].id;
}

async function insertThread(
  boardSlug: string,
  title: string,
  content: string,
  authorName: string = '名無しさん',
  hoursAgo: number = 1
): Promise<number> {
  const boardId = await getBoardId(boardSlug);
  const result = await pool.query(
    `INSERT INTO posts (title, content, status, ip_hash, user_agent, board_id, author_name, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '1 hour' * $8)
     RETURNING id`,
    [title, content, 0, generateIpHash(), randomUserAgent(), boardId, authorName, hoursAgo]
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

// ============== NEWS 板 ==============

async function seedNews() {
  console.log('📰 Seeding news board...\n');

  // 1. 台美關稅談判
  const t1 = await insertThread(
    'news',
    '台美關稅談判結果出來了，15%非疊加',
    `剛看到新聞，台美關稅談判結果：
- 15% 非疊加
- 投資 2500 億美元
- 232 條款取得最優厚條件
- 另加 2500 億美元信保基金

聽說談判過程總統府晚上都燈火通明
賴清德親自領軍會議

比預期好很多吧？原本還以為會更慘`,
    '關心國事的鄉民',
    12
  );
  await insertReply(t1, '15%算是可以接受的範圍了\n原本有人說會到25%', '名無しさん', 11);
  await insertReply(t1, '投資2500億美元是什麼概念', '名無しさん', 10);
  await insertReply(t1, '>>2 大概就是台積電在美國建廠那種規模', '名無しさん', 9);
  await insertReply(t1, '比東南亞的條件好多了\n算是有談出成果', '經濟系', 8);
  await insertReply(t1, '232條款是什麼？', '名無しさん', 7);
  await insertReply(t1, '>>5 鋼鋁相關的關稅條款\n之前川普時代就有在用', '名無しさん', 6);

  // 2. 土方之亂
  const t2 = await insertThread(
    'news',
    '土方之亂搞得全台工程都延宕',
    `美濃大峽谷事件之後
政府推的「營建剩餘土石方全流向管制」新制
要求所有清運車輛安裝 GPS 使用電子聯單

結果現在全台工程建案都延宕
工地一堆砂石車不能動
缺土也缺得很嚴重

這政策是不是太急了？`,
    '營建業相關',
    10
  );
  await insertReply(t2, '美濃那個真的太誇張\n挖出一整個峽谷', '名無しさん', 9);
  await insertReply(t2, '政策方向是對的\n但執行確實太倉促', '名無しさん', 8);
  await insertReply(t2, '現在建案都在喊缺土\n價格也漲了', '業界人士', 7);
  await insertReply(t2, '>>3 對啊\n我們公司工地也停了', '工程師', 6);
  await insertReply(t2, '早該管了\n之前根本到處亂倒', '名無しさん', 5);

  // 3. 大寒寒流
  const t3 = await insertThread(
    'news',
    '今天大寒，冷氣團南下中',
    `剛好今天是24節氣的「大寒」
強烈大陸冷氣團正在南下

鄭明典在臉書PO衛星雲圖
可以看到很清楚的「雲街」

北部今晚會很冷
大家注意保暖`,
    '氣象控',
    6
  );
  await insertReply(t3, '已經開暖氣了\n電費不敢想', '名無しさん', 5);
  await insertReply(t3, '雲街是什麼？', '名無しさん', 4);
  await insertReply(t3, '>>2 冷空氣過海時形成的條狀雲\n代表冷氣團很強', '氣象迷', 3);
  await insertReply(t3, '台北現在14度\n體感更冷', '北部人', 2);
  await insertReply(t3, '南部還好\n只有穿一件外套', '南部人', 1);

  console.log('  ✅ News board seeded (3 threads)\n');
}

// ============== MONEY 板 ==============

async function seedMoney() {
  console.log('💰 Seeding money board...\n');

  // 1. 台積電法說會
  const t1 = await insertThread(
    'money',
    '台積電法說會前股價回檔，1685元',
    `法說會明天就要開了
結果今天股價反而跌25元
最低來到1685元

ADR也跌了1.24%

不過分析師說這是漲多的技術性整理
元旦以來漲太多了

有人要趁這波進場嗎？`,
    '散戶韭菜',
    8
  );
  await insertReply(t1, '法說會前都這樣\n利多出盡的預期', '名無しさん', 7);
  await insertReply(t1, '我是定期定額\n不太管短期波動', '長期投資人', 6);
  await insertReply(t1, '>>2 這才是正確心態', '名無しさん', 5);
  await insertReply(t1, '今年Q1獲利應該還是很強\n資本支出可能到500億美元', '法人觀點', 4);
  await insertReply(t1, '等法說會結果出來再說', '觀望中', 3);
  await insertReply(t1, '>>5 法說會結束後如果拉回更多\n就是買點', '名無しさん', 2);

  // 2. 台股3萬點
  const t2 = await insertThread(
    'money',
    '台股站穩3萬點，32K在望？',
    `今天收盤30941點
又創收盤新高

連 CNBC 都來採訪證交所董事長

AI、高效能運算帶動
去年全年出口6407億美元創新高
連26個月正成長

這波行情還能持續多久？`,
    '股市觀察',
    14
  );
  await insertReply(t2, 'AI概念股帶動整個大盤', '名無しさん', 13);
  await insertReply(t2, '32K不是夢\n但要小心回檔', '名無しさん', 12);
  await insertReply(t2, '護國神山撐起半片天', '名無しさん', 11);
  await insertReply(t2, '>>3 台積電佔權重太高了\n其實有點怕', '分散投資派', 10);
  await insertReply(t2, '我滿手0050\n跟著大盤走', '名無しさん', 9);

  // 3. 南亞科資本支出
  const t3 = await insertThread(
    'money',
    '南亞科2026資本支出激增到500億',
    `南亞科宣布今年資本支出500億
比去年高很多

加上美光收購力積電銅鑼廠
記憶體產業在台灣越來越熱

不過DRAM價格最近好像又開始波動了
不知道這波擴產是不是時機點`,
    '半導體觀察',
    16
  );
  await insertReply(t3, '美光收力積電\n台灣記憶體版圖要重劃了', '名無しさん', 15);
  await insertReply(t3, 'HBM需求帶動的吧\nAI要用很多', '名無しさん', 14);
  await insertReply(t3, '>>2 對，現在HBM供不應求', '業界人', 13);
  await insertReply(t3, '記憶體封測也漲價了\n整個供應鏈都受惠', '名無しさん', 12);

  console.log('  ✅ Money board seeded (3 threads)\n');
}

// ============== GOSSIP 板 ==============

async function seedGossip() {
  console.log('🎬 Seeding gossip board...\n');

  // 1. F4合體破局
  const t1 = await insertThread(
    'gossip',
    'F4合體又破局，朱孝天道歉了',
    `朱孝天之前在粉絲群組嗆團隊
說大麥跟黃牛掛鉤
還點名F3和阿信

結果在陸網引發軒然大波
現在出來道歉說「情緒失控」

F4這輩子是不是不可能合體了www`,
    '追星族',
    20
  );
  await insertReply(t1, '當年流星花園多紅\n現在變這樣', '名無しさん', 19);
  await insertReply(t1, '情緒失控也不該亂噴人吧', '名無しさん', 18);
  await insertReply(t1, '>>2 而且是公開在粉絲群講的', '名無しさん', 17);
  await insertReply(t1, '其他三個人有回應嗎', '名無しさん', 16);
  await insertReply(t1, '>>4 目前沒有\n應該在等風頭過', '名無しさん', 15);
  await insertReply(t1, '年輕時追過他們\n現在覺得有點唏噓', '七年級生', 14);

  // 2. 金唱片獎在大巨蛋
  const t2 = await insertThread(
    'gossip',
    '金唱片獎在大巨蛋辦，Jennie拿藝人大賞',
    `第40屆金唱片獎1/10在台北大巨蛋辦
韓國唱片產業協會辦的

得獎名單：
- 藝人大賞：Jennie
- 音源大賞：GD〈Home Sweet Home〉
- 專輯大賞：Stray Kids《KARMA》

現場氣氛超好
台灣粉絲超瘋狂`,
    'KPOP飯',
    24
  );
  await insertReply(t2, 'Jennie今年真的很猛\nSOLO活動超成功', '名無しさん', 23);
  await insertReply(t2, 'GD回歸太強了\n那首歌洗腦', '名無しさん', 22);
  await insertReply(t2, 'SKZ也是實至名歸', 'Stay', 21);
  await insertReply(t2, '大巨蛋現在變成韓星來台首選場地了', '名無しさん', 20);
  await insertReply(t2, '>>4 因為場地大又新\n音響也不錯', '名無しさん', 19);
  await insertReply(t2, '有人搶到票嗎\n我沒搶到QQ', '名無しさん', 18);
  await insertReply(t2, '>>6 那場超難搶的', '名無しさん', 17);

  // 3. 鄧紫棋演唱會
  const t3 = await insertThread(
    'gossip',
    '鄧紫棋4月大巨蛋演唱會，有人要搶票嗎',
    `鄧紫棋宣布4月要在大巨蛋開唱了

她唱功真的沒話說
現場應該超強

有人知道什麼時候開賣嗎？
想揪朋友一起搶`,
    '鐵肺歌迷',
    22
  );
  await insertReply(t3, '她現場真的很穩\n上次演唱會超讚', '名無しさん', 21);
  await insertReply(t3, '光年之外現場聽一定很震撼', '名無しさん', 20);
  await insertReply(t3, '我也想去\n應該很難搶', '名無しさん', 19);
  await insertReply(t3, '大巨蛋位子很多\n但她人氣太高', '名無しさん', 18);
  await insertReply(t3, '>>4 應該會秒殺吧', '名無しさん', 17);

  console.log('  ✅ Gossip board seeded (3 threads)\n');
}

// ============== TECH 板 ==============

async function seedTech() {
  console.log('💻 Seeding tech board...\n');

  // 1. CES 2026 黃仁勳
  const t1 = await insertThread(
    'tech',
    'CES 2026 黃仁勳說機器人迎來ChatGPT時刻',
    `黃仁勳在CES主題演講說
機器人領域已經迎接ChatGPT時刻

發布了一系列物理AI開源模型
還說NVIDIA DRIVE AV會搭載在賓士CLA上
2026年底前在美國上市

「從AI物理轉型到物理AI的時代」
這句話好像很厲害但我不太懂www`,
    '科技宅',
    18
  );
  await insertReply(t1, '簡單說就是AI要開始控制實體機器人了', '名無しさん', 17);
  await insertReply(t1, '老黃每次CES都有重磅消息', '名無しさん', 16);
  await insertReply(t1, '物理AI就是讓AI理解物理世界\n然後控制機器互動', 'AI研究生', 15);
  await insertReply(t1, '>>3 所以以後機器人會越來越聰明？', '名無しさん', 14);
  await insertReply(t1, '自動駕駛終於要普及了嗎', '名無しさん', 13);
  await insertReply(t1, 'NVIDIA股價應該又要噴了', '名無しさん', 12);

  // 2. 高通 Snapdragon X2
  const t2 = await insertThread(
    'tech',
    '高通推Snapdragon X2 Plus，邊緣AI要起飛',
    `高通在CES發布一堆新品：
- Snapdragon X2 Plus
- 機器人平台 Dragonwing IQ10
- IoT處理器 Q-7790、Q-8750

主打邊緣AI市場
就是不用連雲端就能跑AI的那種

看起來要跟Intel、AMD搶市場`,
    'ARM架構支持者',
    16
  );
  await insertReply(t2, '高通在手機以外積極佈局', '名無しさん', 15);
  await insertReply(t2, '邊緣AI是趨勢\n反應快又省頻寬', '名無しさん', 14);
  await insertReply(t2, '>>2 隱私也比較好\n不用把資料傳上雲端', '名無しさん', 13);
  await insertReply(t2, 'X Elite系列的筆電不知道怎麼樣', '名無しさん', 12);
  await insertReply(t2, '>>4 續航很強\n但軟體相容性還在改善', '用過的人', 11);

  // 3. AI取代傳統搜尋
  const t3 = await insertThread(
    'tech',
    'Gartner預測搜尋引擎流量會掉25%',
    `Gartner說2026年傳統搜尋引擎流量會下降25%

因為大家開始習慣「先問AI再做決定」
SEO人員要哭了

Google應該很緊張吧
雖然他們也有Gemini`,
    '行銷人',
    14
  );
  await insertReply(t3, '確實現在有問題都先問ChatGPT', '名無しさん', 13);
  await insertReply(t3, 'Google搜尋體驗越來越差\n一堆廣告', '名無しさん', 12);
  await insertReply(t3, '>>2 還有一堆SEO內容農場', '名無しさん', 11);
  await insertReply(t3, 'AI搜尋的問題是會幻覺\n不一定正確', '名無しさん', 10);
  await insertReply(t3, '>>4 所以還是要查證\n但方便很多', '名無しさん', 9);

  console.log('  ✅ Tech board seeded (3 threads)\n');
}

// ============== LIFE 板 ==============

async function seedLife() {
  console.log('🏠 Seeding life board...\n');

  // 1. 115學測
  const t1 = await insertThread(
    'life',
    '115學測這週末，考生加油',
    `學測1/17、18、19三天
今年有新規定，禁止帶有圖形或數學式的尺

身邊有親戚小孩要考
看他壓力超大的
希望他能正常發揮

各位考生加油！`,
    '學測過來人',
    8
  );
  await insertReply(t1, '學測壓力真的很大\n祝福所有考生', '名無しさん', 7);
  await insertReply(t1, '考完就解脫了\n撐過這幾天', '名無しさん', 6);
  await insertReply(t1, '記得帶准考證和身分證', '名無しさん', 5);
  await insertReply(t1, '>>3 還有2B鉛筆\n最好多帶幾支', '名無しさん', 4);
  await insertReply(t1, '今年數學不知道會不會很難', '家長', 3);
  await insertReply(t1, '心態放平\n會的寫對就好', '補習班老師', 2);

  // 2. 超高齡社會
  const t2 = await insertThread(
    'life',
    '台灣正式進入超高齡社會了',
    `去年台灣就正式邁入超高齡社會
衛福部說要用四大策略因應

生育率又創新低
年輕人不想生
老人越來越多

未來勞動力怎麼辦...
養老也是大問題`,
    '擔心未來的人',
    12
  );
  await insertReply(t2, '房價這麼高誰敢生', '名無しさん', 11);
  await insertReply(t2, '養小孩成本太高了', '名無しさん', 10);
  await insertReply(t2, '>>2 光是托嬰就找不到', '新手爸媽', 9);
  await insertReply(t2, '以後可能要延後退休年齡', '名無しさん', 8);
  await insertReply(t2, '>>4 日本就是這樣', '名無しさん', 7);
  await insertReply(t2, '長照問題也很嚴重', '名無しさん', 6);

  // 3. 寒流保暖
  const t3 = await insertThread(
    'life',
    '寒流來了，大家怎麼保暖',
    `這波冷氣團真的很強
北部體感好像不到10度

想問大家都怎麼保暖的？
暖氣？電暖器？暖暖包？

電費好貴但不開又好冷QQ`,
    '怕冷星人',
    4
  );
  await insertReply(t3, '電熱毯讚\n睡覺很舒服', '名無しさん', 3);
  await insertReply(t3, '我都穿發熱衣\nUniqlo那種', '名無しさん', 2.5);
  await insertReply(t3, '暖暖包貼在肚子上', '名無しさん', 2);
  await insertReply(t3, '喝熱湯最有效\n從裡面暖起來', '名無しさん', 1.5);
  await insertReply(t3, '>>4 薑茶也不錯', '名無しさん', 1);
  await insertReply(t3, '南部人表示不懂這種冷', '高雄人', 0.5);

  console.log('  ✅ Life board seeded (3 threads)\n');
}

// ============== ACG 板 ==============

async function seedAcg() {
  console.log('🎮 Seeding acg board...\n');

  // 1. 機器人ChatGPT時刻
  const t1 = await insertThread(
    'acg',
    '黃仁勳說機器人ChatGPT時刻，以後會有真的機娘嗎',
    `老黃在CES說機器人迎來ChatGPT時刻
發布物理AI模型

認真問，這樣以後會不會有
真正的智慧機器人女僕？
AI＋機器人＋二次元...

科幻作品要成真了嗎www`,
    'ACG宅',
    10
  );
  await insertReply(t1, '你是不是想太多www', '名無しさん', 9);
  await insertReply(t1, '鋼鍊教過我們了\n不要想這種事', '名無しさん', 8);
  await insertReply(t1, '>>2 那是造人\n這個是機器人啦', '名無しさん', 7);
  await insertReply(t1, '我只要有AI能陪聊天就很滿足了', '孤單宅', 6);
  await insertReply(t1, '真的做出來一定超貴', '名無しさん', 5);
  await insertReply(t1, '攻殼機動隊的世界要來了', '名無しさん', 4);

  console.log('  ✅ ACG board seeded (1 thread)\n');
}

async function main() {
  console.log('🚀 Starting seed (2026-01-21 時事版)...\n');

  try {
    await seedNews();
    await seedMoney();
    await seedGossip();
    await seedTech();
    await seedLife();
    await seedAcg();

    console.log('\n✅ All boards seeded!');

    // 統計
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

    // 各板塊統計
    const boardStats = await pool.query(`
      SELECT b.slug, b.name, COUNT(p.id) as thread_count
      FROM boards b
      LEFT JOIN posts p ON p.board_id = b.id AND p.parent_id IS NULL
      GROUP BY b.id, b.slug, b.name
      ORDER BY thread_count DESC
    `);

    console.log('\n📋 Threads per board:');
    for (const row of boardStats.rows) {
      console.log(`  ${row.slug}: ${row.thread_count} (${row.name})`);
    }

  } catch (error) {
    console.error('❌ Error seeding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
