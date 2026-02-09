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
  let totalThreads = 0;
  let totalReplies = 0;

  // ===== love 版：2026 直球約會趨勢 =====
  const love1 = await insertThread('love', '2026約會趨勢出爐 直球戀愛是主流了嗎',
    'Tinder 2026報告說今年約會趨勢是「直球戀愛」\n64%的人覺得現在約會需要更多情感誠實\n不要再搞什麼欲擒故縱了 直接講清楚\n\n但我身邊朋友還是一堆在那邊已讀不回玩曖昧的...\n是報告太理想還是真的有在改變啊', '名無しさん', 14);
  totalThreads++;
  await insertReply(love1, '直球才是王道 浪費時間搞曖昧超累', '名無しさん', 13);
  await insertReply(love1, '>>2\n理想很美好 現實是你直球對方覺得你太急', '名無しさん', 12);
  await insertReply(love1, '42%的人說朋友對感情有重大影響\n所以現在流行團體約會是真的嗎 好老派', '名無しさん', 11);
  await insertReply(love1, '>>4\n雙人約會其實不錯 比較沒壓力\n朋友在旁邊可以幫忙觀察', '名無しさん', 10);
  await insertReply(love1, '我就是被已讀不回搞到心累才決定直球的\n結果對方說我太直接嚇到他 到底要怎樣', '魯蛇', 8);
  totalReplies += 5;

  // ===== love 版：情人節撞除夕 =====
  const love2 = await insertThread('love', '2/14情人節就是除夕 你們選哪邊',
    '今年情人節2/14剛好就是除夕\n女朋友說想一起過情人節\n但我媽說除夕一定要回家吃年夜飯\n\n兩邊都不能得罪 有人有好的解決方案嗎\n帶回家吃年夜飯算情人節嗎...', '名無しさん', 16);
  totalThreads++;
  await insertReply(love2, '帶回家啊 一石二鳥\n順便讓爸媽看看', '名無しさん', 15);
  await insertReply(love2, '>>2\n交往多久了 太早帶回家壓力很大欸', '名無しさん', 14);
  await insertReply(love2, '我跟男友已經協調好了\n白天各自在家準備 晚上視訊倒數\n2/15再補過情人節', '名無しさん', 13);
  await insertReply(love2, '單身狗表示：完全沒有這個煩惱 嗚嗚', '魯蛇', 12);
  await insertReply(love2, '>>4\n一樣+1 除夕就安心在家吃飯看電視', '名無しさん', 10);
  totalReplies += 5;

  // ===== money 版：2026房市恐成斷頭元年 =====
  const money1 = await insertThread('money', '2026房市真的要跌了？專家說平均跌10%',
    '看到新聞說2026房市展望是「價跌量漲」\n全台平均預估跌10%\n台北跌幅不超過5-6%\n台南高雄部分區域恐超過10%\n\n去年在猶豫要不要買 現在看起來等對了？\n還是說跌10%也只是回到前年的價格...', '名無しさん', 18);
  totalThreads++;
  await insertReply(money1, '2025六都買賣移轉棟數年減24.6%\n交易量已經在跌了 價格遲早跟上', '名無しさん', 17);
  await insertReply(money1, '>>2\n量縮不代表價跌 屋主不賣就是不賣\n你以為跌10%很多？漲的時候一年漲30%欸', '名無しさん', 16);
  await insertReply(money1, '新青安2.0要出了 到時候又是一波利多\n不要以為房價會一直跌', '名無しさん', 15);
  await insertReply(money1, '台股都28000了 錢都在股市\n沒人要往房市丟了 財富效果失靈', '韭菜', 13);
  await insertReply(money1, '>>4\n笑死 股市賺的也不夠買房啊\n除非你重壓台積電', '名無しさん', 11);
  await insertReply(money1, '現在是觀望期 急著買的是盤子\n但你也別期待大跌 頂多修正而已', '投資老手', 9);
  totalReplies += 6;

  // ===== money 版：台股封關前 =====
  const money2 = await insertThread('money', '台股要封關了 你們年前有出場嗎',
    '春節連假要來了 台股封關在即\n今年台股漲到28000 AI類股猛到不行\n\n我手上還壓著一堆AI概念股\n在想要不要先出一半 年後再看\n萬一過年期間美股暴跌就GG了', '社畜', 20);
  totalThreads++;
  await insertReply(money2, '長期投資不用管封關不封關\n你又不是當沖仔', '名無しさん', 19);
  await insertReply(money2, '>>2\n說得輕鬆 去年過年美股跌了一波\n開紅盤直接吃一根', '名無しさん', 18);
  await insertReply(money2, '我出了一半 落袋為安\n過年安心吃年夜飯比較重要', '名無しさん', 16);
  await insertReply(money2, '瑞銀預測2026 AI支出5710億美元\n年增35% 你確定要在這裡下車？', '名無しさん', 14);
  await insertReply(money2, '>>4\n這種數據每年都在喊 重點是個股表現\n不是整個產業好你就一定賺', '名無しさん', 12);
  totalReplies += 5;

  // ===== tech 版：AI互連物理層重構 =====
  const tech1 = await insertThread('tech', 'AI訓練GPU有1/3時間在等網路 這也太浪費',
    '看到TechNews報導\nAI訓練叢集突破萬卡規模後\n網路瓶頸讓GPU有近1/3時間閒置等待\n\n雲端大廠把網路預算從GPU成本10%拉到25%\n800G/1.6T要大規模部署了\n\n所以現在瓶頸不是算力而是網路？\n台灣網通股是不是要起飛了', '名無しさん', 15);
  totalThreads++;
  await insertReply(tech1, '早就說了 AI不只是晶片的問題\n散熱、網路、電力全部都是瓶頸', '名無しさん', 14);
  await insertReply(tech1, '>>2\n所以黃仁勳才一直喊 Physical AI\n不只算力 物理世界的問題更多', '名無しさん', 13);
  await insertReply(tech1, '台灣做網通的其實不少\n中磊、智邦、明泰都有在吃這塊', '科技宅', 12);
  await insertReply(tech1, '1/3時間在等 等於33%的錢白花\n一張H100那麼貴 這浪費也太驚人', '名無しさん', 10);
  await insertReply(tech1, '>>4\n所以才說 InfiniBand 和 RoCE 是下一個戰場\nNVIDIA 想全包但 Meta 不買單', '名無しさん', 8);
  totalReplies += 5;

  // ===== tech 版：華為AI一帶一路 =====
  const tech2 = await insertThread('tech', '華為要搞AI版一帶一路了 擴大昇騰晶片海外銷售',
    '看到新聞說華為要擴大昇騰晶片的海外銷售\n打算搶輝達的市占\n\n美國一直在卡中國AI晶片出口\n結果華為自己搞出替代方案還要外銷\n\n這對台灣半導體是利是弊？\n台積電是不是兩邊都賺', '名無しさん', 17);
  totalThreads++;
  await insertReply(tech2, '昇騰的效能跟H100還是有差距\n但價格便宜很多 第三世界國家會買單', '名無しさん', 16);
  await insertReply(tech2, '>>2\n問題是生態系 CUDA太強了\n你買了昇騰 軟體工具鏈跟不上也是白搭', '名無しさん', 15);
  await insertReply(tech2, '台積電兩邊都賺是對的\n不管誰贏 都要找台積代工', '名無しさん', 13);
  await insertReply(tech2, '中美科技戰只會越打越烈\n台灣夾在中間 是紅利也是風險', '名無しさん', 11);
  await insertReply(tech2, '>>4\n風險你媽 台灣就是靠這個吃飯的\n沒有這個矛盾 誰理你台灣', '名無しさん', 9);
  totalReplies += 5;

  // ===== acg 版：2026冬番 =====
  const acg1 = await insertThread('acg', '2026冬番有57部新作 你們追幾部',
    '2026冬番（1月開播）有57部新作\n續作包括咒術迴戰新季和炎炎消防隊三之章\n新作有Fate/strange Fake和花樣少年少女重製\n\n我目前追了5部 覺得已經快追不完了\n有人能推薦一下今季必看的嗎', '宅宅', 19);
  totalThreads++;
  await insertReply(acg1, 'Fate/strange Fake 等了好久終於動畫化\n光衝著成田良悟就必看', '名無しさん', 18);
  await insertReply(acg1, '>>2\n我反而比較期待花樣少年少女重製\n小時候看漫畫的回憶', '名無しさん', 17);
  await insertReply(acg1, '咒術迴戰不是完結了嗎 還有新季度？\n原來是之前沒動畫化的部分', '名無しさん', 15);
  await insertReply(acg1, '57部根本追不完 我每季都說要追10部\n結果到最後只剩2-3部沒棄', '名無しさん', 13);
  await insertReply(acg1, '>>4\n三集定律 第三集還沒被吸引就可以棄了\n不要浪費時間', '社畜宅', 11);
  totalReplies += 5;

  // ===== acg 版：人型機器人 =====
  const acg2 = await insertThread('acg', '2026人型機器人出貨量要破5萬台了 鋼彈要成真了',
    '看到新聞說2026年人型機器人出貨量年增7倍\n預估突破5萬台\n\n黃仁勳也在推Physical AI和機器人\n感覺科幻動漫裡的場景越來越近了\n\n話說如果哪天真的出了 你們最想要哪種機器人', '名無しさん', 12);
  totalThreads++;
  await insertReply(acg2, '當然是女僕型啊 還用問嗎', '名無しさん', 11);
  await insertReply(acg2, '>>2\n你很誠實 但我覺得先出的一定是工廠用的\n像鋼彈裡的工作用MS', '名無しさん', 10);
  await insertReply(acg2, '5萬台聽起來很多 但比起手機什麼的還是小規模\n量產之後價格才會降到一般人買得起', '名無しさん', 9);
  await insertReply(acg2, '攻殼機動隊的世界觀\n先義體化再說', '名無しさん', 7);
  totalReplies += 4;

  // ===== gossip 版：世紀血案電影爭議 =====
  const gossip1 = await insertThread('gossip', '《世紀血案》改編林宅血案 沒取得家屬授權也敢拍？',
    '電影《世紀血案》改編自台灣重大歷史懸案「林宅血案」\n結果殺青時才爆出根本沒取得家屬授權\n劇本內容被質疑誤導史實\n演員在記者會上的發言也有爭議\n\n這種歷史事件改編不先問家屬\n是覺得死人不會抗議嗎', '名無しさん', 20);
  totalThreads++;
  await insertReply(gossip1, '這太誇張了吧 人家家屬還在\n拍之前不問一下 被告剛好而已', '名無しさん', 19);
  await insertReply(gossip1, '>>2\n台灣影視圈一直有這問題\n覺得「取材自真實事件」就可以隨便改', '名無しさん', 18);
  await insertReply(gossip1, '林宅血案到現在都還是懸案\n隨便拍一個版本出來 對受害家屬多傷', '名無しさん', 16);
  await insertReply(gossip1, '韓國拍真實事件改編至少會標明\n台灣這種直接用然後不授權的真的離譜', '名無しさん', 14);
  await insertReply(gossip1, '>>4\n韓國也不是都有授權啦\n但至少人家劇本品質比較好...', '名無しさん', 12);
  totalReplies += 5;

  // ===== gossip 版：陳昇展覽取消 =====
  const gossip2 = await insertThread('gossip', '陳昇台南美術館個展突然取消了 到底發生什麼事',
    '陳昇原本2/7起在台南市美術館辦「我是搖滾畫手」個展\n結果他的團隊主動提出取消合作\n\n官方只說「雙方取消合作」沒講原因\n有人知道內幕嗎\n\n陳昇不是一直都蠻隨性的 這次是怎樣', '名無しさん', 22);
  totalThreads++;
  await insertReply(gossip2, '陳昇本來就是很有個性的人\n搞不好就是看不順眼某個安排就不幹了', '名無しさん', 21);
  await insertReply(gossip2, '>>2\n但都已經公告了才取消\n對已經買票或排行程的人很不公平吧', '名無しさん', 20);
  await insertReply(gossip2, '南美館最近蠻常辦跨界展覽的\n之前殷振豪的也蠻成功 可惜這次破局', '名無しさん', 18);
  await insertReply(gossip2, '陳昇每年跨年演唱會都很猛\n畫展取消可能真的是理念不合', '名無しさん', 16);
  totalReplies += 4;

  // ===== life 版：換新鈔排隊 =====
  const life1 = await insertThread('life', '一早去排換新鈔 前面已經50人在等了',
    '今天是換新鈔第一天\n想說8點去排應該還好\n結果銀行門口已經排了50幾個人\n\n而且限換100張百元鈔\n排了一個多小時就換到一疊\n回家被老媽嫌太少 要我明天再去排\n\n真的有必要每年搞這個嗎...', '社畜', 8);
  totalThreads++;
  await insertReply(life1, '我媽也是 每年都要我去排\n說紅包沒放新鈔不體面', '名無しさん', 7);
  await insertReply(life1, '>>2\n其實ATM也可以領新鈔\n不用傻傻去排隊', '名無しさん', 6);
  await insertReply(life1, '>>3\nATM的新鈔很快就領完了\n而且不一定每台都有', '名無しさん', 5);
  await insertReply(life1, '現在都用行動支付了\n過年紅包直接轉帳不行嗎', '名無しさん', 4);
  await insertReply(life1, '>>5\n你跟長輩說用轉帳試試看\n保證被念到過完年', '名無しさん', 3);
  totalReplies += 5;

  // ===== life 版：9天連假焦慮 =====
  const life2 = await insertThread('life', '春節9天連假 社恐的地獄要來了',
    '2/14-2/22 連假9天\n一般人開心放假\n社恐的人準備面對親戚轟炸\n\n薪水多少、交男女朋友沒、什麼時候結婚、什麼時候生\n全部問一輪\n\n有沒有人跟我一樣已經在焦慮了', '社恐', 10);
  totalThreads++;
  await insertReply(life2, '準備好罐頭回答就好\n「還在努力中」萬用句', '名無しさん', 9);
  await insertReply(life2, '>>2\n問題是他們不會只問一次\n同一個問題不同親戚輪流問', '名無しさん', 8);
  await insertReply(life2, '我今年直接訂了出國機票\n跟家人說公司有事 完美迴避', '名無しさん', 7);
  await insertReply(life2, '>>4\n除夕不回家你爸媽不會生氣？', '名無しさん', 6);
  await insertReply(life2, '我覺得最煩的是要包紅包\n薪水本來就不多 過一個年噴好幾千', '名無しさん', 5);
  await insertReply(life2, '>>6\n真的 紅包通膨比物價還嚴重\n以前200就好 現在600起跳', '名無しさん', 3);
  totalReplies += 6;

  // ===== news 版：台美關稅談判 =====
  const news1 = await insertThread('news', '台美關稅談判底定了 農曆年前要簽對等貿易協定',
    '鄭麗君領軍的台美關稅談判底定\n農曆年前有望簽署對等貿易協定\n半導體據說拿到最優惠待遇\n\n這算是好消息吧\n但不知道農業那邊有沒有被犧牲\n每次跟美國談 農民都是第一個被開刀的', '名無しさん', 16);
  totalThreads++;
  await insertReply(news1, '半導體最優惠不意外\n台積電就是最大的談判籌碼', '名無しさん', 15);
  await insertReply(news1, '>>2\n但台灣不能只靠半導體一條腿走路\n萬一哪天技術被追上就完了', '名無しさん', 14);
  await insertReply(news1, '農業一定會被開放更多\n美豬美牛round 2', '名無しさん', 12);
  await insertReply(news1, '>>4\n美豬已經開放了 還能再開什麼\n難道要開放美國米？', '名無しさん', 10);
  await insertReply(news1, '對等貿易聽起來好聽\n實際上就是大的吃小的 小的配合', '名無しさん', 8);
  totalReplies += 5;

  // ===== work 版：AI對職場的影響 =====
  const work1 = await insertThread('work', 'IDC調查54%企業要增加AI投資 我們會被取代嗎',
    '看到IDC的調查\n54%的台灣企業表示2026年要增加AI投資\n代理式AI（Agentic AI）開始進入企業應用\n可以自主完成流程自動化、銷售決策\n\n這不就是在取代白領嗎\n以前說AI取代藍領 現在看來白領先死', '社畜工程師', 13);
  totalThreads++;
  await insertReply(work1, '不會完全取代 但會減少人力需求\n本來要10個人做的 以後5個人+AI就夠', '名無しさん', 12);
  await insertReply(work1, '>>2\n那另外5個人呢？\n「轉型」這種話講起來很容易', '名無しさん', 11);
  await insertReply(work1, '工程師還好 會用AI的工程師更值錢\n怕的是純做重複性工作的行政職', '名無しさん', 10);
  await insertReply(work1, '>>4\n行政職早就在被ERP取代了\n現在AI只是加速這個過程', '名無しさん', 8);
  await insertReply(work1, '學會跟AI協作才是重點\n抵抗不了就加入', '名無しさん', 6);
  totalReplies += 5;

  // ===== chat 版：馬年新鈔設計 =====
  const chat1 = await insertThread('chat', '馬年新鈔的設計 你們覺得好看嗎',
    '今天去換了2026馬年新鈔\n百元鈔的設計改了 加了馬年元素\n\n老實說我覺得還行\n但我媽說沒有以前的好看\n她每年都有意見\n\n你們覺得今年設計怎樣', '名無しさん', 6);
  totalThreads++;
  await insertReply(chat1, '台灣的鈔票設計一直都很普通\n你看日本的新鈔多精緻', '名無しさん', 5);
  await insertReply(chat1, '>>2\n拜託 鈔票是拿來用的不是收藏的\n好不好看有差嗎', '名無しさん', 4);
  await insertReply(chat1, '新鈔就是拿來包紅包的\n好不好看小朋友才不在意 他們只在意金額', '名無しさん', 3);
  await insertReply(chat1, '我比較在意什麼時候改版\n國父頭像用了多久了 該換了吧', '名無しさん', 2);
  totalReplies += 4;

  // ===== chat 版：Check Point 網路安全報告 =====
  const chat2 = await insertThread('chat', '2026全球網路攻擊創歷史新高 AI被拿來當武器了',
    'Check Point剛出了2026年網路安全報告\n全球網攻數量創歷史新高\nAI被用來生成釣魚郵件、深偽影片\n\n以前的詐騙郵件一看就假\n現在用AI寫的中文超流暢 根本分不出來\n\n大家有收過很逼真的詐騙訊息嗎', '名無しさん', 11);
  totalThreads++;
  await insertReply(chat2, '上個月收到一封「銀行通知」\n排版跟真的一模一樣 差點點下去', '名無しさん', 10);
  await insertReply(chat2, '>>2\n現在連語音都能AI生成了\n我朋友接到「主管」打來的電話 結果是假的', '名無しさん', 9);
  await insertReply(chat2, '深偽最可怕 用你的臉去借錢\n之前不是有人被騙幾百萬', '名無しさん', 8);
  await insertReply(chat2, '所以說密碼管理器和2FA一定要開\n不要用同一組密碼走天下', '科技宅', 6);
  await insertReply(chat2, '>>5\n長輩才是最大受害者\n教了好幾次還是會點不明連結', '名無しさん', 4);
  totalReplies += 5;

  // ===== news 版：高市早苗眾議院大選狂勝 =====
  const news2 = await insertThread('news', '高市早苗大勝 自民黨拿下3分之2絕對多數 對台灣是好事嗎',
    '日本眾議院選舉結果出爐\n高市早苗帶領自民黨拿下316席\n加上維新會36席 執政聯盟共352席\n465席裡佔了超過4分之3\n\n高市一直對台灣很友好\n賴清德也是第一批祝賀的外國元首\n\n大家覺得台日關係會怎麼發展', '名無しさん', 10);
  totalThreads++;
  await insertReply(news2, '高市早苗本來就是自民黨裡最挺台的\n上次訪台的時候就說過「台灣有事就是日本有事」', '名無しさん', 9);
  await insertReply(news2, '>>2\n嘴巴說說而已\n真的打起來日本敢出手？', '名無しさん', 8);
  await insertReply(news2, '重點是她拿到修憲門檻了\n日本要不要修和平憲法 接下來很關鍵', '名無しさん', 7);
  await insertReply(news2, '>>4\n修憲還要公投 沒那麼容易\n但至少方向是往正常國家走', '名無しさん', 6);
  await insertReply(news2, '她勝選後馬上感謝川普\n日美同盟加上台日友好\n對中國來說壓力很大', '名無しさん', 5);
  await insertReply(news2, '食料品消費稅歸零兩年也是亮點\n日本人荷包有感才會投她', '名無しさん', 4);
  await insertReply(news2, '>>7\n但積極財政就是在印鈔\n日圓會不會繼續貶 去日本旅遊更便宜？', '名無しさん', 3);
  totalReplies += 7;

  // ===== news 版：台灣女婿山口晉重返眾議院 =====
  const news3 = await insertThread('news', '高市早苗站台助威 台灣女婿山口晉重返日本眾議院了',
    '中央社報導 高市早苗幫「台灣女婿」山口晉站台\n山口晉的老婆是台灣人\n這次順利重返眾議院\n\n有台灣連結的日本議員越多\n對台日關係越有利吧\n\n話說日本政壇有台灣配偶的議員好像不少', '名無しさん', 8);
  totalThreads++;
  await insertReply(news3, '山口晉之前就蠻挺台灣的\n有老婆是台灣人當然會特別關注', '名無しさん', 7);
  await insertReply(news3, '>>2\n不只他 安倍派很多人都挺台\n高市早苗自己就是安倍路線的繼承者', '名無しさん', 6);
  await insertReply(news3, '台灣軟實力真的強\n日本人愛台灣 台灣人愛日本 雙向奔赴', '名無しさん', 5);
  await insertReply(news3, '>>4\n別太天真 國際關係是利益\n不是光靠感情就能維持的', '名無しさん', 4);
  await insertReply(news3, '但至少比跟中國的關係好處理多了\n台日之間沒有根本性的利益衝突', '名無しさん', 3);
  totalReplies += 5;

  console.log(`\n完成！新增 ${totalThreads} 個討論串、${totalReplies} 則回覆`);
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
