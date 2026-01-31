#!/usr/bin/env tsx
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
  console.log('開始新增討論串...');

  // ========== ACG 版 ==========

  // 討論串 1: 買動漫旗艦店
  let threadId = await insertThread(
    'acg',
    '買動漫台北旗艦店開幕了 有人去過嗎',
    '就在台北車站M6出口附近\n許昌街42號4樓 新光三越館前店後面\n\n有書店區、展覽區、主題咖啡區\n現在還有桂 Gui 老師的個展\n\n開幕到1/31消費有三重贈\n有去的人分享一下',
    'ACG民',
    72
  );
  await insertReply(threadId, '上週去過了\n空間蠻大的 採光也不錯', '名無しさん', 68);
  await insertReply(threadId, '咖啡區有賣什麼嗎\n想去坐坐', '名無しさん', 64);
  await insertReply(threadId, '>>2 有主題飲品跟甜點\n價格中等', '名無しさん', 60);
  await insertReply(threadId, '終於有實體店了\n以前都只能網拍', '名無しさん', 55);
  await insertReply(threadId, '展覽區免費參觀嗎', '名無しさん', 50);
  await insertReply(threadId, '>>5 對 免費的\n但咖啡區要消費', '名無しさん', 45);

  // 討論串 2: 動漫快閃店
  threadId = await insertThread(
    'acg',
    '台中草悟廣場動漫快閃店 芙莉蓮寶箱怪超大',
    '木棉花跟宅一番辦的\n1/16到3/15在PARK2草悟廣場\n\n有芙莉蓮、獵人、膽大黨、莉可麗絲\n芙莉蓮那個巨大寶箱怪拍照超讚\n\n台中的可以去朝聖',
    '中部人',
    48
  );
  await insertReply(threadId, '寶箱怪wwww\n芙莉蓮迷看到會瘋掉', '名無しさん', 44);
  await insertReply(threadId, '獵人的是什麼角色啊', '名無しさん', 40);
  await insertReply(threadId, '>>2 好像是經典角色合影牆\n小傑奇犽酷拉皮卡雷歐力那些', '名無しさん', 36);
  await insertReply(threadId, '膽大黨也有！\n這部最近很紅', '名無しさん', 32);
  await insertReply(threadId, '要門票嗎', '名無しさん', 28);
  await insertReply(threadId, '>>5 免費參觀\n買東西另計', '名無しさん', 24);

  // ========== MONEY 版 ==========

  // 討論串 1: 台股
  threadId = await insertThread(
    'money',
    '台股逼近33000 但感覺很抖',
    '29日盤中最高到32996\n離33000就差一點點\n\n但美股那邊財報季\n加上聯準會利率決策觀望\n開盤就跌200點\n\n大家覺得Q1能上34000嗎',
    '散戶',
    36
  );
  await insertReply(threadId, '月線季線乖離太大\n短線要小心', '名無しさん', 32);
  await insertReply(threadId, 'AI概念股還是主流\n但估值真的高', '名無しさん', 28);
  await insertReply(threadId, '年前應該會整理一下\n年後再說', '名無しさん', 24);
  await insertReply(threadId, '>>3 同意 過年前先獲利了結\n年後再看', '名無しさん', 20);
  await insertReply(threadId, '2025年台股漲太多了\n今年應該會震盪', '名無しさん', 16);

  // 討論串 2: 新台幣改版
  threadId = await insertThread(
    'money',
    '新台幣改版票選 你投哪個主題',
    '央行開放票選了\n以「台灣之美」為主題\n有12個面額可以選\n\n27號開投第一天就破萬人\n101跟半導體晶片最熱門\n\n你們想要什麼圖案',
    '名無しさん',
    60
  );
  await insertReply(threadId, '101一定要有吧\n最代表台灣', '名無しさん', 55);
  await insertReply(threadId, '半導體晶片wwww\n護國神山', '名無しさん', 50);
  await insertReply(threadId, '玉山也可以\n百岳之首', '名無しさん', 45);
  await insertReply(threadId, '希望有珍珠奶茶（認真', '名無しさん', 40);
  await insertReply(threadId, '>>4 哈哈哈哈\n這個真的很台灣', '名無しさん', 35);
  await insertReply(threadId, '24年沒換了\n終於要改版', '名無しさん', 30);

  // ========== NEWS 版 ==========

  // 討論串 1: 海鯤艦
  threadId = await insertThread(
    'news',
    '海鯤艦完成首次淺水潛航測試了',
    '國造潛艦海鯤艦\n順利完成首次淺水潛航測試\n\n下潛50公尺\n測試聲納、動力跟水下計程儀\n三大項都過了\n\n國防自主又前進一步',
    '名無しさん',
    48
  );
  await insertReply(threadId, '終於有進度了\n等超久', '名無しさん', 44);
  await insertReply(threadId, '50公尺算淺水\n後面還有深水測試', '名無しさん', 40);
  await insertReply(threadId, '希望一切順利\n國防很重要', '名無しさん', 36);
  await insertReply(threadId, '>>2 對 這只是第一步\n但至少有在推進', '名無しさん', 32);
  await insertReply(threadId, '潛艦國造從喊到做到\n真的不容易', '名無しさん', 28);

  // 討論串 2: 2025 GDP
  threadId = await insertThread(
    'news',
    '2025年GDP成長8.63% 比預期好很多',
    '主計總處公布了\nQ4成長率12.68%\n全年8.63%\n\n都比原本預期好\nAI跟半導體真的帶動很大',
    '名無しさん',
    72
  );
  await insertReply(threadId, '出口6407億美元創新高\n年增34.9%', '名無しさん', 68);
  await insertReply(threadId, '但一般人有感嗎...', '名無しさん', 64);
  await insertReply(threadId, '>>2 真的 數據很漂亮\n薪水沒漲多少', '名無しさん', 60);
  await insertReply(threadId, '護國神山群真的猛', '名無しさん', 55);
  await insertReply(threadId, '台灣經濟靠半導體撐起來的', '名無しさん', 50);

  // ========== TECH 版 ==========

  // 討論串 1: NVIDIA 聯發科
  threadId = await insertThread(
    'tech',
    '黃仁勳說跟聯發科合作開發AI晶片',
    '老黃在輝達台灣尾牙受訪\n說跟聯發科合作打造SoC\n\n功耗低但性能強\n專門給有AI應用的電腦用\n\n聯發科股價要起飛了嗎',
    '科技宅',
    40
  );
  await insertReply(threadId, '聯發科終於不只做手機晶片了', '名無しさん', 36);
  await insertReply(threadId, '老黃來台灣都會講一些好消息\n尾牙效應', '名無しさん', 32);
  await insertReply(threadId, '低功耗AI晶片確實是趨勢\nEdge AI很重要', '名無しさん', 28);
  await insertReply(threadId, '>>3 對 不可能什麼都丟雲端\n本地要能跑', '名無しさん', 24);
  await insertReply(threadId, '台廠供應鏈又有題材了', '名無しさん', 20);

  // 討論串 2: AI泡沫
  threadId = await insertThread(
    'tech',
    '甲骨文股價暴跌30% AI泡沫要破了嗎',
    '甲骨文創25年最大跌幅\n被當成AI泡沫恐慌的代表\n\n但其他AI股還好\nNVIDIA也只是小回而已\n\n你們覺得是泡沫還是修正',
    '名無しさん',
    56
  );
  await insertReply(threadId, '甲骨文本來就不是純AI股吧', '名無しさん', 52);
  await insertReply(threadId, '估值太高遲早要修正\n問題是修正完繼續漲', '名無しさん', 48);
  await insertReply(threadId, '>>2 同意 AI實際應用還在擴散\n不是泡沫', '名無しさん', 44);
  await insertReply(threadId, '但NVIDIA本益比真的很恐怖', '名無しさん', 40);
  await insertReply(threadId, '泡沫喊了兩年還沒破\n空軍死一片', '名無しさん', 36);

  // ========== GOSSIP 版 ==========

  // 討論串 1: 金唱片
  threadId = await insertThread(
    'gossip',
    '金唱片頒獎典禮在台灣辦欸',
    '第40屆金唱片\n1月10號在台灣舉辦\n\n出演嘉賓超猛\nATEEZ、ENHYPEN、IVE\n還有宋仲基、邊佑錫、安孝燮\n\n門票搶到了嗎',
    '追星族',
    96
  );
  await insertReply(threadId, '搶票搶到手軟\n根本秒殺', '名無しさん', 92);
  await insertReply(threadId, 'IVE要來！！！\n張員瑛我老婆', '名無しさん', 88);
  await insertReply(threadId, '>>2 排隊+1\n員瑛太美了', '名無しさん', 84);
  await insertReply(threadId, '宋仲基也來\n韓流真的很愛台灣', '名無しさん', 80);
  await insertReply(threadId, '台灣現在變韓流演出重鎮了', '名無しさん', 76);
  await insertReply(threadId, '邊佑錫那個臉真的犯規', '名無しさん', 72);

  // 討論串 2: TXT演唱會
  threadId = await insertThread(
    'gossip',
    'TXT今天大巨蛋開唱 有人去嗎',
    'TXT首次登上台北大巨蛋\n就是今天1/31\n\n聽說票也是秒殺\n大巨蛋座位多還是不夠搶\n\n有去的回來分享',
    '名無しさん',
    12
  );
  await insertReply(threadId, '我在場！！\n氣氛超嗨', '現場', 8);
  await insertReply(threadId, '大巨蛋音場怎麼樣', '名無しさん', 6);
  await insertReply(threadId, '>>2 比想像中好\n可能是韓團設備強', '現場', 4);
  await insertReply(threadId, '羨慕 我沒搶到票QQ', '名無しさん', 3);
  await insertReply(threadId, '明年還會來嗎\n想看', '名無しさん', 2);

  // ========== WORK 版 ==========

  // 討論串 1: 週休三日
  threadId = await insertThread(
    'work',
    '週休三日提案連署過關了',
    '公共政策平台那個週休三日提案\n連署5768人 過關了\n\n主張四日工作制\n要讓台灣成為亞洲第一個週休三日\n\n勞動部12/7前要回應\n你們覺得有可能嗎',
    '社畜',
    80
  );
  await insertReply(threadId, '台灣總工時全球第5\n真的該休息了', '名無しさん', 76);
  await insertReply(threadId, '資方會跳腳\n不太可能過', '名無しさん', 72);
  await insertReply(threadId, '>>2 至少先推動討論\n觀念要慢慢改變', '名無しさん', 68);
  await insertReply(threadId, '日本有些公司已經在試了\n效率反而提升', '名無しさん', 64);
  await insertReply(threadId, '服務業不可能啦\n誰來顧店', '服務業', 60);
  await insertReply(threadId, '>>5 可以輪班啊\n重點是總工時降低', '名無しさん', 56);

  // 討論串 2: 育嬰假彈性化
  threadId = await insertThread(
    'work',
    '育嬰留停可以按日請了',
    '1/1起育嬰留停新制上路\n以前要連續請至少30天\n現在可以按「日」為單位\n\n父母合計60天彈性額度\n還是可以領8成薪\n\n這個對雙薪家庭蠻實用的',
    '名無しさん',
    48
  );
  await insertReply(threadId, '終於！以前30天門檻太高', '名無しさん', 44);
  await insertReply(threadId, '小孩生病可以請一天了\n不用全部用完', '名無しさん', 40);
  await insertReply(threadId, '>>2 對 這才是彈性\n符合實際需求', '名無しさん', 36);
  await insertReply(threadId, '但公司會不會不爽\n請太多天被刁難', '名無しさん', 32);
  await insertReply(threadId, '>>4 這是法定權利\n敢刁難可以申訴', '名無しさん', 28);

  console.log('討論串新增完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
