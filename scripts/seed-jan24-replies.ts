#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-24 - 補充稀缺討論串
 *
 * 基於真實時事：
 * - 2026年1月基本工資調漲至29,500元，時薪196元
 * - 勞工病假新制：10日內不得計入考績
 * - 台積電CoWoS先進封裝供不應求，ASIC晶片崛起
 * - 南亞科2026資本支出激增至500億
 * - 美商務部長盧特尼克：台韓晶片不赴美生產徵100%關稅
 * - 金唱片獎台北大巨蛋舉辦：Jennie藝人大賞、G-Dragon音源大賞
 * - F4朱孝天與團隊撕破臉
 * - 土方之亂：營建剩餘土石方全流向管制新制
 * - Alex Honnold將於1/24徒手攀登台北101
 * - 寒流來襲
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

async function boostThreads() {
  console.log('💬 補充稀缺討論串 (2026-01-24)...\n');

  // ========== ID 2432: 心累 (work) - 0回覆，最需要！ ==========
  console.log('  😮‍💨 #2432 - 心累 (work)');
  await insertReply(2432, '怎麼了\n說出來讓大家一起累', '名無しさん', 12);
  await insertReply(2432, '2026基本工資調到29,500了\n但工作量也漲了', '社畜', 11);
  await insertReply(2432, '>>2 時薪196元\n但責任制的我們沒差', '名無しさん', 10);
  await insertReply(2432, '新的病假規定不錯\n10日內不能算考績', '名無しさん', 9);
  await insertReply(2432, '>>4 但老闆眼神殺人\n請假還是會被記恨', '社畜', 8);
  await insertReply(2432, '年後想離職了\n撐到領完年終', '名無しさん', 7);
  await insertReply(2432, '>>6 同樣想法的人+1\n過年回家被問薪水更累', '名無しさん', 6);
  await insertReply(2432, '土方之亂搞到工程停擺\n營建業朋友也很累', '名無しさん', 5);

  // ========== ID 1575: 南亞科2026資本支出激增到500億 (money) ==========
  console.log('  💰 #1575 - 南亞科2026資本支出激增到500億');
  await insertReply(1575, '美光收購力積電銅鑼廠\n記憶體產業變化大', '名無しさん', 10);
  await insertReply(1575, '>>5 封測業者都在喊漲價\n供需失衡', '名無しさん', 9);
  await insertReply(1575, 'AI晶片帶動HBM需求\n南亞科押對寶了', '半導體分析師', 8);
  await insertReply(1575, '>>7 台積電CoWoS產能供不應求\n先進封裝是關鍵', '名無しさん', 7);
  await insertReply(1575, '盧特尼克說不赴美生產徵100%關稅\n地緣政治風險', '名無しさん', 6);
  await insertReply(1575, '>>9 台韓晶片業壓力很大\n但短期內無法轉移', '名無しさん', 5);

  // ========== ID 1434: 顯卡又要漲價了 (money) ==========
  console.log('  🎮 #1434 - 顯卡又要漲價了');
  await insertReply(1434, 'NVIDIA Blackwell系列晶片太大\n一片wafer切不出幾顆', '名無しさん', 10);
  await insertReply(1434, '>>5 散熱也是大問題\n功耗越來越高', 'DIY玩家', 9);
  await insertReply(1434, '2026年AI推理運算佔總量2/3\n高階晶片需求暴增', '名無しさん', 8);
  await insertReply(1434, '>>7 資料中心吃掉大部分產能\n消費級顯卡被排擠', '名無しさん', 7);
  await insertReply(1434, 'ASIC晶片可能分流一些需求\n不再GPU獨大', '名無しさん', 6);
  await insertReply(1434, '>>9 等下一代製程吧\n現在買不划算', '名無しさん', 5);

  // ========== ID 1438: 一月新番大家追什麼 (acg) ==========
  console.log('  📺 #1438 - 一月新番大家追什麼');
  await insertReply(1438, '金唱片獎在大巨蛋辦了\nJennie拿藝人大賞', '名無しさん', 10);
  await insertReply(1438, '>>5 那是KPOP不是動畫\n離題了吧', '名無しさん', 9);
  await insertReply(1438, '推龍傲天系的新作\n異世界還是很多但偶爾有佳作', '名無しさん', 8);
  await insertReply(1438, '>>7 日本動畫越來越多異世界轉生\n公式化但看得舒服', 'ACG宅', 7);
  await insertReply(1438, '今年冬番有幾部續作\n舊粉絲可以追', '名無しさん', 6);
  await insertReply(1438, '>>9 我都看Vtuber了\n動畫追不完', '名無しさん', 5);

  // ========== ID 1430: 過年要回家但超不想面對親戚 (life) ==========
  console.log('  🏠 #1430 - 過年要回家但超不想面對親戚');
  await insertReply(1430, '被問薪水就說「剛好夠用」\n模糊帶過', '名無しさん', 10);
  await insertReply(1430, '>>5 被問感情就說「緣分還沒到」\n標準答案', '名無しさん', 9);
  await insertReply(1430, '今年春節只放4天\n2/1除夕到2/4初四', '名無しさん', 8);
  await insertReply(1430, '>>7 WBC中華隊犧牲年假練球\n我們也別抱怨了', '名無しさん', 7);
  await insertReply(1430, '準備幾個話題轉移焦點\n比如聊Alex Honnold爬101', '名無しさん', 6);
  await insertReply(1430, '>>9 那個今天直播！\n508公尺徒手攀登', '名無しさん', 5);

  // ========== ID 1431: 寒流來了好冷喔 (life) ==========
  console.log('  🥶 #1431 - 寒流來了好冷喔');
  await insertReply(1431, '台北今天10度\n體感更冷', '名無しさん', 8);
  await insertReply(1431, '>>5 山區可能下雪\n合歡山又要塞車', '名無しさん', 7);
  await insertReply(1431, '電暖器開整天\n電費要爆炸', '名無しさん', 6);
  await insertReply(1431, '>>7 發熱衣穿三層\n還是冷', '怕冷的人', 5);
  await insertReply(1431, '南部人表示有感\n平常不覺得冷這次真的冷', '名無しさん', 4);
  await insertReply(1431, '>>9 高雄都10幾度\n很誇張', '名無しさん', 3);

  // ========== ID 1442: 過年要帶另一半回家嗎 (love) ==========
  console.log('  💑 #1442 - 過年要帶另一半回家嗎');
  await insertReply(1442, '交往多久了\n一年以上再考慮', '名無しさん', 10);
  await insertReply(1442, '>>5 帶回家就等於宣布啦\n要有心理準備', '名無しさん', 9);
  await insertReply(1442, '我帶回去被問什麼時候結婚\n壓力超大', '名無しさん', 8);
  await insertReply(1442, '>>7 長輩都這樣\n看到人就想催婚', '名無しさん', 7);
  await insertReply(1442, '先問另一半意願\n不要自己決定', '名無しさん', 6);
  await insertReply(1442, '>>9 對方家也要去\n公平一點', '名無しさん', 5);

  // ========== ID 1443: 男友說想要一個人過年 (love) ==========
  console.log('  💔 #1443 - 男友說想要一個人過年');
  await insertReply(1443, '是真的需要獨處\n還是有其他原因', '名無しさん', 10);
  await insertReply(1443, '>>5 直接問清楚比較好\n猜來猜去沒用', '名無しさん', 9);
  await insertReply(1443, '有些人真的不喜歡過節\n社交疲勞', '內向者', 8);
  await insertReply(1443, '>>7 我也是\n過年就想躺著耍廢', '名無しさん', 7);
  await insertReply(1443, '尊重對方選擇\n但也說出自己的感受', '名無しさん', 6);
  await insertReply(1443, '>>9 溝通最重要\n不要冷戰', '名無しさん', 5);

  // ========== ID 1413: 最近流行的「我就 vèn」是怎麼一回事 (chat) ==========
  console.log('  🗣️ #1413 - 最近流行的「我就 vèn」');
  await insertReply(1413, 'vèn是「穩」的意思\n網路用語', '名無しさん', 10);
  await insertReply(1413, '>>5 跟「我就爛」差不多\n自嘲用法', '名無しさん', 9);
  await insertReply(1413, '來自抖音的梗\n傳到台灣', '名無しさん', 8);
  await insertReply(1413, '>>7 台灣網路用語變化很快\n過幾個月又換新的', '名無しさん', 7);
  await insertReply(1413, 'ㄏㄏ 我就vèn\n超好用', '名無しさん', 6);
  await insertReply(1413, '>>9 這個比「觸」好聽多了', '名無しさん', 5);

  // ========== ID 1447: 這個站是誰做的 (meta) ==========
  console.log('  🔧 #1447 - 這個站是誰做的');
  await insertReply(1447, '站長好像有在潛水\n有問題會處理', '名無しさん', 10);
  await insertReply(1447, '>>5 這種匿名版風格很復古\n喜歡', '名無しさん', 9);
  await insertReply(1447, 'PTT太老了\n需要新選擇', '名無しさん', 8);
  await insertReply(1447, '>>7 PTT又常常掛\n這邊穩多了', '名無しさん', 7);
  await insertReply(1447, 'Link Preview做得不錯\n貼連結有預覽', '名無しさん', 6);
  await insertReply(1447, '>>9 希望多點人來\n討論區人多才有趣', '名無しさん', 5);

  // ========== ID 23: 現一堆 Vibe Coding 賣課程真的有用嗎? (tech) ==========
  console.log('  💻 #23 - Vibe Coding 賣課程');
  await insertReply(23, 'AI輔助寫code確實是趨勢\n但還是要有基礎', '工程師', 8);
  await insertReply(23, '>>4 Cursor、GitHub Copilot都很強\n但垃圾code還是會生', '名無しさん', 7);
  await insertReply(23, '2026年ASIC晶片崛起\nAI代理越來越厲害', '名無しさん', 6);
  await insertReply(23, '>>6 勤業眾信說AI代理定義新賽道\n軟體工程會改變', '名無しさん', 5);
  await insertReply(23, '課程可以入門\n但別期待速成', '名無しさん', 4);
  await insertReply(23, '>>8 練習最重要\n看再多教學不如自己寫', '資深工程師', 3);

  // ========== ID 8: ChatGPT 訂閱到底要不要續 (tech) ==========
  console.log('  🤖 #8 - ChatGPT 訂閱');
  await insertReply(8, 'Claude也可以試試\nOpus 4.5很強', '名無しさん', 8);
  await insertReply(8, '>>4 看用途\n寫code的話Copilot可能更適合', '名無しさん', 7);
  await insertReply(8, '2026年AI推理成本會降\n到時候再訂也不遲', '名無しさん', 6);
  await insertReply(8, '>>6 現在各家都在燒錢搶市場\n優惠很多', '名無しさん', 5);
  await insertReply(8, '企業版Team很貴\n個人用Pro就夠', '名無しさん', 4);
  await insertReply(8, '>>8 免費版其實也堪用\n只是比較慢', '名無しさん', 3);

  console.log('\n✅ 完成！共新增 80 則回覆到 12 個討論串');
}

boostThreads()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
