#!/usr/bin/env tsx
/**
 * 2026/1/26 時事種子腳本
 * 基於最新時事補充稀缺討論版
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
  console.log('🌱 開始新增基於時事的討論串 (2026/1/26)...\n');

  // ==================== news 版 ====================
  console.log('📰 news 版\n');

  // 1. Alex Honnold 徒手攀爬台北101
  const thread1 = await insertThread(
    'news',
    'Alex Honnold 徒手攀爬台北101 史上第一人',
    '美國攀岩家 Alex Honnold 徒手攀爬台北101\n耗時91分鐘完成\nCNN報導稱他是「史上第一人」\n\n這傢伙之前就徒手爬過酋長岩\n有紀錄片《乘著風》\n根本不怕死\n\n台灣之光…嗎？',
    '名無しさん',
    8
  );
  await insertReply(thread1, '看影片手心都冒汗', '名無しさん', 7);
  await insertReply(thread1, '這人是不是沒有恐懼基因', '名無しさん', 6);
  await insertReply(thread1, '>>1\n91分鐘不敢想像\n萬一中途想尿尿', '名無しさん', 5);
  await insertReply(thread1, '台北101准他爬喔？\n還是偷爬', '名無しさん', 4);
  await insertReply(thread1, '>>4\n應該有合作啦\n否則會被逮捕', '名無しさん', 3);
  await insertReply(thread1, '酋長岩更猛\n900多公尺', '攀岩愛好者', 2);
  console.log(`  ✅ #${thread1} Alex Honnold 台北101`);

  // 2. 運動幣登記抽籤
  const thread2 = await insertThread(
    'news',
    '運動幣今天開始登記！60萬份抽籤制',
    '運動幣今天起開放登記了\n500元\n16歲以上國民都可以抽\n\n只有60萬份\n限量抽籤制\n\n比之前的動滋券還少\n感覺很難中\n\n有人要抽嗎',
    '名無しさん',
    6
  );
  await insertReply(thread2, '500元能幹嘛\n買雙襪子？', '名無しさん', 5);
  await insertReply(thread2, '60萬份太少了吧', '名無しさん', 4);
  await insertReply(thread2, '>>1\n先登記再說\n中了賺到', '名無しさん', 3);
  await insertReply(thread2, '之前動滋券中過\n買球拍', '名無しさん', 2);
  await insertReply(thread2, '抽獎最大的意義是參與感', '名無しさん', 1);
  console.log(`  ✅ #${thread2} 運動幣登記`);

  // 3. 土方之亂
  const thread3 = await insertThread(
    'news',
    '土方之亂是怎麼回事？工地都停擺了',
    '最近新聞一直報「土方之亂」\n是什麼狀況？\n\n好像是新的GPS電子聯單制度\n導致全台工程延宕\n\n營建業叫苦連天\n說配套不足',
    '名無しさん',
    15
  );
  await insertReply(thread3, '>>1\n美濃大峽谷事件後的政策\n要求運土車裝GPS', '名無しさん', 14);
  await insertReply(thread3, '方向對但執行太急\n業者來不及配合', '營建業', 13);
  await insertReply(thread3, '砂石車亂倒確實要管\n但不能矯枉過正', '名無しさん', 12);
  await insertReply(thread3, '我家附近工地也停了\n說在等電子聯單', '名無しさん', 11);
  await insertReply(thread3, '這波會影響房價嗎', '名無しさん', 10);
  await insertReply(thread3, '>>5\n工期延長成本增加\n當然會', '名無しさん', 9);
  console.log(`  ✅ #${thread3} 土方之亂`);

  // 4. 金唱片獎在大巨蛋
  const thread4 = await insertThread(
    'news',
    '金唱片獎在台北大巨蛋辦 韓國都跑來台灣',
    '韓國唱片產業協會\n第40屆金唱片獎在台北大巨蛋舉辦\n\nJennie獲得藝人大賞\nG-Dragon拿音源大賞\nStray Kids專輯大賞\n\n台灣變成韓流聖地了嗎',
    'K-pop粉',
    20
  );
  await insertReply(thread4, 'Jennie solo回歸太強了', '名無しさん', 19);
  await insertReply(thread4, 'GD復出就拿大賞\n傳奇', '名無しさん', 18);
  await insertReply(thread4, '>>1\n大巨蛋蓋好後很多活動來', '名無しさん', 17);
  await insertReply(thread4, 'SKZ的KARMA超好聽', '名無しさん', 16);
  await insertReply(thread4, '韓國頒獎典禮來台灣辦\n滿特別的', '名無しさん', 15);
  await insertReply(thread4, '台灣場地租金比韓國便宜？', '名無しさん', 14);
  console.log(`  ✅ #${thread4} 金唱片獎`);

  // ==================== tech 版 ====================
  console.log('\n💻 tech 版\n');

  // 5. CES 2026 AI 趨勢
  const thread5 = await insertThread(
    'tech',
    'CES 2026 重點整理：Physical AI 元年',
    'CES 2026 在拉斯維加斯結束了\n四大晶片巨頭都登台\n\n黃仁勳、蘇姿丰、陳立武、高通艾蒙\n定調2026是「實體AI」跟「代理式AI」元年\n\nAI PC、AI眼鏡、AI機器人\n各種AI裝置百花齊放\n\n有看發表會的來分享',
    '科技迷',
    25
  );
  await insertReply(thread5, '黃仁勳那個皮衣男每次都很會講', '名無しさん', 24);
  await insertReply(thread5, 'NVIDIA霸主地位穩了', '名無しさん', 23);
  await insertReply(thread5, '>>1\nAMD今年追得很緊\n蘇媽加油', '名無しさん', 22);
  await insertReply(thread5, '人形機器人今年會大爆發嗎', '名無しさん', 21);
  await insertReply(thread5, 'AI眼鏡想買\n但還是太貴', '名無しさん', 20);
  await insertReply(thread5, 'Physical AI是什麼\n可以吃嗎', '名無しさん', 19);
  await insertReply(thread5, '>>6\n就是AI進入實體世界\n機器人、自駕車這類', '名無しさん', 18);
  console.log(`  ✅ #${thread5} CES 2026`);

  // 6. 清華 AI 藥物篩選
  const thread6 = await insertThread(
    'tech',
    '清華AI藥物篩選平台 速度快百萬倍',
    '清華大學智能產業研究院\n研發了DrugCLIP藥物篩選平台\n\n登上Science期刊\n\n24小時內完成超過10兆次蛋白質配對計算\n比傳統方法快百萬倍\n\n台灣AI研究也很強',
    'AI研究者',
    30
  );
  await insertReply(thread6, '登上Science超猛', '名無しさん', 29);
  await insertReply(thread6, '藥物開發可以加速了\n造福人類', '名無しさん', 28);
  await insertReply(thread6, '>>1\n這種基礎研究很重要\n但一般人不會注意', '名無しさん', 27);
  await insertReply(thread6, '希望能加速新藥開發\n癌症藥物太貴了', '名無しさん', 26);
  await insertReply(thread6, '清大一直有在做AI\n產學合作也多', '名無しさん', 25);
  console.log(`  ✅ #${thread6} 清華AI藥物篩選`);

  // 7. Switch 2 台灣體驗會
  const thread7 = await insertThread(
    'tech',
    'Switch 2 台灣體驗會 7/5-7/6 圓山花博',
    'Nintendo Switch 2 台灣體驗會\n確定7/5-7/6在台北圓山花博爭豔館\n\n規格：\n- 7.9吋 1080p 螢幕\n- 支援120fps\n- 256GB內建儲存\n- 售價14,380元\n\n只能用microSD Express\n舊記憶卡不能用\n\n有人要去體驗嗎',
    '任豚',
    35
  );
  await insertReply(thread7, '14380有點貴\n但任天堂值得', '名無しさん', 34);
  await insertReply(thread7, '記憶卡不相容這點很雷', '名無しさん', 33);
  await insertReply(thread7, '>>1\n7月才體驗\n9月開賣的意思？', '名無しさん', 32);
  await insertReply(thread7, '瑪利歐賽車世界Day1買', '名無しさん', 31);
  await insertReply(thread7, '等個一兩年再買\n看有沒有改版', '名無しさん', 30);
  await insertReply(thread7, 'Joy-Con磁吸設計讚', '名無しさん', 29);
  await insertReply(thread7, '>>2\n這是為了速度\n舊卡太慢', '名無しさん', 28);
  console.log(`  ✅ #${thread7} Switch 2 體驗會`);

  // ==================== work 版 ====================
  console.log('\n💼 work 版\n');

  // 8. 2026徵才加薪趨勢
  const thread8 = await insertThread(
    'work',
    '2026年Q1加薪4.1%？你們公司有加嗎',
    '看新聞說2026年Q1企業平均加薪4.1%\n近6成企業有調薪計畫\n創2022年來新高\n\n五大缺工產業：\n科技業、建築業、餐飲住宿、醫療照護、製造業\n\n你們公司有加嗎\n我們是0',
    '社畜',
    40
  );
  await insertReply(thread8, '4.1%根本追不上通膨', '名無しさん', 39);
  await insertReply(thread8, '科技業有感\n其他產業呢', '名無しさん', 38);
  await insertReply(thread8, '>>1\n0也太慘\n該跳槽了', '名無しさん', 37);
  await insertReply(thread8, '我們加3%\n算中位數', '名無しさん', 36);
  await insertReply(thread8, '缺工是缺低薪願意做的人', '名無しさん', 35);
  await insertReply(thread8, '失業率3.33%歷史新低\n好像不錯？', '名無しさん', 34);
  console.log(`  ✅ #${thread8} 2026加薪趨勢`);

  // 9. 求職錄取率0.4%
  const thread9 = await insertThread(
    'work',
    '求職錄取率只有0.4%？海投沒用',
    '看到報導說現在白領工作錄取率只有0.4%\n100個人投履歷不到1個中\n\n但有內部推薦的錄取率4.4%\n高10倍\n\n果然找工作還是要靠關係',
    '求職者',
    45
  );
  await insertReply(thread9, '海投真的沒用\n要針對性投', '名無しさん', 44);
  await insertReply(thread9, '認識對的人比能力重要', '名無しさん', 43);
  await insertReply(thread9, '>>1\nLinkedIn經營好\n會有獵頭來找', '名無しさん', 42);
  await insertReply(thread9, '4.4%也不高啊', '名無しさん', 41);
  await insertReply(thread9, '投500封中2個\n數學合理', '名無しさん', 40);
  await insertReply(thread9, '現在AI篩履歷\n關鍵字很重要', '名無しさん', 39);
  console.log(`  ✅ #${thread9} 求職錄取率`);

  // 10. 育嬰留停新制
  const thread10 = await insertThread(
    'work',
    '育嬰留停可以單日請了！新制上路',
    '2026年勞動新制\n育嬰留停不用一次請整個月\n改成可以「單日」申請\n\n30天內彈性運用\n雙親合計60天\n\n家庭照顧假也改成可以用「小時」計算\n\n這個改得不錯',
    '上班族爸爸',
    50
  );
  await insertReply(thread10, '這個讚\n小孩生病可以彈性請', '名無しさん', 49);
  await insertReply(thread10, '但公司會不會刁難就不知道了', '名無しさん', 48);
  await insertReply(thread10, '>>1\n法規一回事\n實際執行一回事', '名無しさん', 47);
  await insertReply(thread10, '最低工資也調到29500了', '名無しさん', 46);
  await insertReply(thread10, '病假10天內不能扣考績\n這個重要', '名無しさん', 45);
  console.log(`  ✅ #${thread10} 育嬰留停新制`);

  // ==================== gossip 版 ====================
  console.log('\n🎭 gossip 版\n');

  // 11. 蔡依林PLEASURE央視過審
  const thread11 = await insertThread(
    'gossip',
    '蔡依林PLEASURE央視過審了 巨蟒是生生不息',
    '蔡依林的PLEASURE演唱會\n確定過了央視審核\n\n原本爭議的巨蟒\n央視解釋是「生生不息的哲學概念」\n\n可以在中國開了\n\nJolin好強',
    '歌迷',
    55
  );
  await insertReply(thread11, '哲學概念XDDD', '名無しさん', 54);
  await insertReply(thread11, '央視的解釋太會了', '名無しさん', 53);
  await insertReply(thread11, '>>1\n市場太大\n還是要進', '名無しさん', 52);
  await insertReply(thread11, 'Jolin演唱會真的很讚\n台灣的驕傲', '名無しさん', 51);
  await insertReply(thread11, '生生不息我笑了', '名無しさん', 50);
  console.log(`  ✅ #${thread11} 蔡依林PLEASURE`);

  // 12. TXT大巨蛋
  const thread12 = await insertThread(
    'gossip',
    'TXT大巨蛋場1/31開唱 有人要去嗎',
    'TOMORROW X TOGETHER世界巡演\n台北場1/31-2/1在大巨蛋\n\n韓國男團越來越常來台灣了\n大巨蛋變成演唱會聖地\n\nMOA們集合',
    'MOA',
    60
  );
  await insertReply(thread12, '買到票了！超期待', '名無しさん', 59);
  await insertReply(thread12, '沒搶到QQ\n黃牛太多', '名無しさん', 58);
  await insertReply(thread12, '>>1\n大巨蛋音響怎樣\n會不會吵', '名無しさん', 57);
  await insertReply(thread12, '>>3\n上次去還OK\n但遠的位置差', '名無しさん', 56);
  await insertReply(thread12, '連兩天都搶不到\n哭', '名無しさん', 55);
  console.log(`  ✅ #${thread12} TXT大巨蛋`);

  // ==================== acg 版 ====================
  console.log('\n🎮 acg 版\n');

  // 13. 台北電玩展TGS 2026
  const thread13 = await insertThread(
    'acg',
    '台北電玩展TGS 2026 1/29開展',
    '2026台北國際電玩展\n1/29-2/1在南港展覽館\n\n今年有什麼大作可以試玩嗎\n\n去年人超多\n排隊排到死',
    '遊戲玩家',
    65
  );
  await insertReply(thread13, '每年都去\n看show girl', '名無しさん', 64);
  await insertReply(thread13, '>>1\n今年Switch 2應該會有展區', '名無しさん', 63);
  await insertReply(thread13, 'Brook Gaming有參展\n會發表新配件', '名無しさん', 62);
  await insertReply(thread13, '索尼克賽車新DLC有PAC-MAN', '名無しさん', 61);
  await insertReply(thread13, '想看有什麼獨立遊戲', '名無しさん', 60);
  await insertReply(thread13, '南港比世貿好逛', '名無しさん', 59);
  console.log(`  ✅ #${thread13} 台北電玩展`);

  // 14. 買動漫台北旗艦店
  const thread14 = await insertThread(
    'acg',
    '買動漫台北旗艦店開幕了 台北車站附近',
    '買動漫的台北實體店\n1/2在許昌街開幕了\n\n有展覽區跟主題咖啡廳\n第一場是台灣漫畫家桂Gui的個展\n\n買動漫終於有實體店了',
    'ACG愛好者',
    70
  );
  await insertReply(thread14, '去逛過了\n店面不大但東西多', '名無しさん', 69);
  await insertReply(thread14, '台北車站M6出口\n很好找', '名無しさん', 68);
  await insertReply(thread14, '>>1\n有咖啡廳可以坐一下\n不錯', '名無しさん', 67);
  await insertReply(thread14, '桂Gui的畫風超讚\n去看展了', '名無しさん', 66);
  await insertReply(thread14, '希望高雄也開一間', '高雄人', 65);
  console.log(`  ✅ #${thread14} 買動漫旗艦店`);

  // 15. 2026一月新番
  const thread15 = await insertThread(
    'acg',
    '2026一月新番你在追什麼',
    '一月新番開播了\n今季有什麼推薦的嗎\n\n我目前在看：\n- 鬼滅之刃 柱訓練篇\n- 怪獸8號第二季\n\n還有什麼值得追的',
    '動畫迷',
    75
  );
  await insertReply(thread15, '怪獸8號第二季讚\n打戲很爽', '名無しさん', 74);
  await insertReply(thread15, '無職轉生完結篇還在追\n季度大作', '名無しさん', 73);
  await insertReply(thread15, '>>1\n鬼滅柱訓練篇電視版補完', '名無しさん', 72);
  await insertReply(thread15, '咒術迴戰涉谷事變後篇呢', '名無しさん', 71);
  await insertReply(thread15, '比較冷門但推薦地下城的人都是變態', '名無しさん', 70);
  console.log(`  ✅ #${thread15} 一月新番`);

  // ==================== life 版 ====================
  console.log('\n🌿 life 版\n');

  // 16. 運動幣怎麼搶
  const thread16 = await insertThread(
    'life',
    '運動幣怎麼登記？流程教學',
    '運動幣開放登記了\n但官網流程有點複雜\n\n1. 到運動部網站\n2. 用手機號碼驗證\n3. 填寫基本資料\n4. 等抽籤結果\n\n只有60萬份\n感覺很難中\n\n有人登記成功了嗎',
    '名無しさん',
    5
  );
  await insertReply(thread16, '剛登記完\n流程不難', '名無しさん', 4);
  await insertReply(thread16, '500元雖然不多\n但有抽有機會', '名無しさん', 3);
  await insertReply(thread16, '>>1\n什麼時候公布結果', '名無しさん', 2);
  await insertReply(thread16, '可以用在健身房嗎', '名無しさん', 1);
  console.log(`  ✅ #${thread16} 運動幣教學`);

  // 17. 超高齡社會
  const thread17 = await insertThread(
    'life',
    '台灣正式進入超高齡社會了',
    '今年台灣65歲以上人口超過20%\n正式進入超高齡社會\n\n想到以後會很恐怖\n勞動力不足\n長照需求大增\n\n你們有想過退休怎麼辦嗎',
    '名無しさん',
    80
  );
  await insertReply(thread17, '現在就要開始存錢了', '名無しさん', 79);
  await insertReply(thread17, '勞保會不會破產\n很擔心', '名無しさん', 78);
  await insertReply(thread17, '>>1\n移民吧\n這裡沒未來', '名無しさん', 77);
  await insertReply(thread17, '少子化問題更嚴重', '名無しさん', 76);
  await insertReply(thread17, '日本老早就超高齡了\n也是活下來', '名無しさん', 75);
  await insertReply(thread17, '靠自己比較實在\n政府不可靠', '名無しさん', 74);
  console.log(`  ✅ #${thread17} 超高齡社會`);

  // 18. 年後轉職焦慮
  const thread18 = await insertThread(
    'life',
    '年後想離職但很猶豫',
    '年前領完年終\n年後想離職\n\n但現在工作不好找\n錄取率0.4%看了很怕\n\n走也不是留也不是\n好煩',
    '名無しさん',
    85
  );
  await insertReply(thread18, '先找好再離\n不要裸辭', '名無しさん', 84);
  await insertReply(thread18, '>>1\n年後大家都在投\n競爭激烈', '名無しさん', 83);
  await insertReply(thread18, '有本事就走\n沒本事就忍', '名無しさん', 82);
  await insertReply(thread18, '現在的公司有多不堪？', '名無しさん', 81);
  await insertReply(thread18, '至少先面試看看行情', '名無しさん', 80);
  console.log(`  ✅ #${thread18} 年後轉職`);

  // ==================== meta 版 ====================
  console.log('\n🔧 meta 版\n');

  // 19. 引用功能
  const thread19 = await insertThread(
    'meta',
    '引用功能可以顯示預覽嗎',
    '現在用>>數字引用\n但要往上滑才看得到原文\n\n可以做成hover顯示預覽嗎\n像PTT或巴哈那樣\n\n這樣回覆串更好讀',
    '名無しさん',
    90
  );
  await insertReply(thread19, '支持這個功能\n很實用', '名無しさん', 89);
  await insertReply(thread19, 'hover預覽確實方便', '名無しさん', 88);
  await insertReply(thread19, '>>1\n手機版怎麼處理\nhover沒用', '名無しさん', 87);
  await insertReply(thread19, '手機可以點擊展開', '名無しさん', 86);
  console.log(`  ✅ #${thread19} 引用功能`);

  // 20. APP
  const thread20 = await insertThread(
    'meta',
    '會出APP嗎',
    '現在用手機網頁版還OK\n但如果有原生APP會更方便\n\n可以推播通知\n也比較省流量\n\n有規劃嗎',
    '手機用戶',
    95
  );
  await insertReply(thread20, 'PWA先做吧\n可以加到桌面', '名無しさん', 94);
  await insertReply(thread20, 'APP開發成本高\n小站不太可能', '名無しさん', 93);
  await insertReply(thread20, '>>1\n網頁版其實夠用了', '名無しさん', 92);
  await insertReply(thread20, '推播功能比較需要', '名無しさん', 91);
  console.log(`  ✅ #${thread20} APP需求`);

  // ==================== love 版 ====================
  console.log('\n💕 love 版\n');

  // 21. 2026約會趨勢
  const thread21 = await insertThread(
    'love',
    '2026約會趨勢：直球戀愛當道',
    'Tinder年度報告出來了\n2026年的約會關鍵字是「直球戀愛」\n\n64%約會者認為需要更多情感誠實\n不要再曖昧了\n\n告白就告白\n不喜歡就說\n\n你們贊成嗎',
    '名無しさん',
    100
  );
  await insertReply(thread21, '直球最好\n曖昧很累', '名無しさん', 99);
  await insertReply(thread21, '但直接被拒絕也很傷', '名無しさん', 98);
  await insertReply(thread21, '>>1\n至少不用浪費時間', '名無しさん', 97);
  await insertReply(thread21, '這趨勢不錯\n內耗太久不健康', '名無しさん', 96);
  await insertReply(thread21, '說的比做的容易', '名無しさん', 95);
  console.log(`  ✅ #${thread21} 2026約會趨勢`);

  // 22. Double date
  const thread22 = await insertThread(
    'love',
    '有人試過double date嗎',
    'Tinder報告說37%約會者想嘗試團體約會\n\n感覺兩對一起出去\n比較沒壓力\n也有人可以幫忙化解尷尬\n\n有經驗的分享一下',
    '名無しさん',
    105
  );
  await insertReply(thread22, '試過一次\n朋友在旁邊反而更尷尬', '名無しさん', 104);
  await insertReply(thread22, '要看對象\n太熟也不好', '名無しさん', 103);
  await insertReply(thread22, '>>1\n雙方都有朋友比較平衡', '名無しさん', 102);
  await insertReply(thread22, '這在日本很常見\n聯誼', '名無しさん', 101);
  console.log(`  ✅ #${thread22} Double date`);

  // ==================== money 版 ====================
  console.log('\n💰 money 版\n');

  // 23. 台灣經濟成長7.37%
  const thread23 = await insertThread(
    'money',
    '台灣經濟成長7.37% 15年來最高',
    '賴清德新年談話說\n台灣2025年經濟成長率7.37%\n是15年來新高\n\n台股也屢創新紀錄\n\n但為什麼我沒感覺\n薪水還是一樣',
    '名無しさん',
    110
  );
  await insertReply(thread23, 'AI帶動的\n沒搭上就沒感覺', '名無しさん', 109);
  await insertReply(thread23, '台積電一家公司撐起來的', '名無しさん', 108);
  await insertReply(thread23, '>>1\nGDP高不代表分配平均', '名無しさん', 107);
  await insertReply(thread23, '股票有賺\n算有感', '股民', 106);
  await insertReply(thread23, '2026預估放緩\n只有2-3%', '名無しさん', 105);
  await insertReply(thread23, '有錢人更有錢\n窮人沒差', '名無しさん', 104);
  console.log(`  ✅ #${thread23} 經濟成長`);

  // 24. 2026房市
  const thread24 = await insertThread(
    'money',
    '2026房價要跌了？專家說會盤整',
    '看到新聞說2026房價會跌\n有些區域跌幅超過1成\n\n專家說2027才會止跌回溫\n\n等等黨終於等到了嗎',
    '等等黨',
    115
  );
  await insertReply(thread24, '專家說的不準\n參考就好', '名無しさん', 114);
  await insertReply(thread24, '利率高+少子化\n應該會跌', '名無しさん', 113);
  await insertReply(thread24, '>>1\n土方之亂會影響供給', '名無しさん', 112);
  await insertReply(thread24, '蛋黃區不會跌\n蛋殼區跌', '名無しさん', 111);
  await insertReply(thread24, '等了10年還在等', '名無しさん', 110);
  await insertReply(thread24, '年輕人躺平就好\n反正買不起', '名無しさん', 109);
  console.log(`  ✅ #${thread24} 2026房市`);

  console.log('\n✅ 完成！共新增 24 個討論串及其回覆');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
