#!/usr/bin/env tsx
/**
 * cron-breathing.ts — 低頻呼吸模式
 *
 * 每天晚間跑一次，維持論壇基本活力：
 * 1. 發 1 串新討論（週五/六 +1 串）
 * 2. 對 48h 內 0 回覆的串補位（最多 3 則）
 * 3. 整體 20% 跳過率，保持自然冷場
 *
 * 用法：
 *   npx tsx scripts/cron-breathing.ts
 *   npx tsx scripts/cron-breathing.ts --dry-run
 *
 * cron（台灣時間 UTC+8，server 是 UTC）：
 *   每天 21:00 CST = 13:00 UTC
 *   0 13 * * * cd /opt/2ch-core && docker exec 2ch-core-api npx tsx scripts/cron-breathing.ts >> /var/log/2ch-breathing.log 2>&1
 */

import { Pool } from 'pg';
import crypto from 'crypto';

const DRY_RUN = process.argv.includes('--dry-run');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/2ch',
});

// --- Utilities ---

function generateIpHash(): string {
  const randomIp = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  return crypto.createHash('sha256').update(randomIp).digest('hex');
}

const userAgents = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_2 like Mac OS X) AppleWebKit/605.1.15',
];

function randomUA(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shouldSkip(rate = 0.2): boolean {
  return Math.random() < rate;
}

const names = ['名無しさん', '名無しさん', '名無しさん', '名無しさん', '夜行者', '社畜', '路人'];

function randomName(): string {
  return pick(names);
}

// --- DB helpers ---

async function getBoardId(slug: string): Promise<number> {
  const result = await pool.query('SELECT id FROM boards WHERE slug = $1', [slug]);
  if (result.rows.length === 0) throw new Error(`Board not found: ${slug}`);
  return result.rows[0].id;
}

async function titleExists(title: string): Promise<boolean> {
  const result = await pool.query(
    "SELECT 1 FROM posts WHERE title = $1 AND parent_id IS NULL LIMIT 1",
    [title]
  );
  return result.rows.length > 0;
}

async function insertThread(
  boardSlug: string, title: string, content: string, authorName: string
): Promise<number> {
  const boardId = await getBoardId(boardSlug);
  const hoursAgo = Math.random() * 2; // 0-2 hours ago for natural feel
  const result = await pool.query(
    `INSERT INTO posts (title, content, status, ip_hash, user_agent, board_id, author_name, created_at)
     VALUES ($1, $2, 0, $3, $4, $5, $6, NOW() - INTERVAL '1 hour' * $7)
     RETURNING id`,
    [title, content, generateIpHash(), randomUA(), boardId, authorName, hoursAgo]
  );
  return result.rows[0].id;
}

async function insertReply(
  parentId: number, content: string, authorName: string
): Promise<number> {
  const minutesAgo = Math.floor(Math.random() * 60) + 10; // 10-70 minutes ago
  const result = await pool.query(
    `INSERT INTO posts (content, status, ip_hash, user_agent, parent_id, board_id, author_name, created_at)
     VALUES ($1, 0, $2, $3, $4, NULL, $5, NOW() - INTERVAL '1 minute' * $6)
     RETURNING id`,
    [content, generateIpHash(), randomUA(), parentId, authorName, minutesAgo]
  );
  return result.rows[0].id;
}

/** Find threads from last 48h with 0 replies */
async function findLonelyThreads(limit: number): Promise<Array<{ id: number; title: string; content: string; board_slug: string }>> {
  const result = await pool.query(`
    SELECT p.id, p.title, p.content, b.slug as board_slug
    FROM posts p
    JOIN boards b ON p.board_id = b.id
    WHERE p.parent_id IS NULL
      AND p.status = 0
      AND p.created_at > NOW() - INTERVAL '48 hours'
      AND NOT EXISTS (
        SELECT 1 FROM posts r WHERE r.parent_id = p.id AND r.status = 0
      )
    ORDER BY p.created_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

// --- Content Pool ---
// ~30 threads, deduped by title

type ThreadContent = {
  board: string;
  title: string;
  content: string;
  author: string;
  category: 'treehole' | 'opinion' | 'question' | 'casual';
};

const THREAD_POOL: ThreadContent[] = [
  // === 40% treehole (12) ===
  {
    board: 'chat', category: 'treehole', author: '名無しさん',
    title: '半夜三點還醒著的人都在想什麼',
    content: '又失眠了\n躺在床上天花板看了一小時\n\n白天忙到沒空想的事情\n晚上全部跑出來\n\n想著明天要做什麼\n想著上禮拜被主管講的那句話\n想著這個月的房租\n\n然後越想越清醒\n\n有人也是這樣嗎'
  },
  {
    board: 'chat', category: 'treehole', author: '名無しさん',
    title: '今天被裁了',
    content: '收到通知的時候其實沒什麼感覺\n就好像早就知道會發生一樣\n\n收拾東西走出辦公室\n外面陽光很好\n突然覺得很荒謬\n\n在裡面拚了兩年多\n出來的時候就一個紙箱\n\n不知道接下來該幹嘛\n先來這裡打個字好了'
  },
  {
    board: 'chat', category: 'treehole', author: '名無しさん',
    title: '覺得自己是不是不適合社交',
    content: '每次聚會結束回家都會覺得好累\n不是身體累 是心理累\n\n明明大家都在笑\n但我一直在想剛才那句話是不是講錯了\n那個笑話是不是冷掉了\n\n有時候寧願一個人待著\n但又怕被說孤僻\n\n是我想太多嗎'
  },
  {
    board: 'chat', category: 'treehole', author: '夜行者',
    title: '三十歲了還不知道自己要什麼',
    content: '身邊的人好像都有目標\n有的在拚升遷 有的在準備結婚\n有的已經買房了\n\n我呢\n每天上班下班\n假日不知道要幹嘛\n\n不是不努力\n是真的不知道要往哪裡努力\n\n這種感覺正常嗎'
  },
  {
    board: 'chat', category: 'treehole', author: '名無しさん',
    title: '好久沒有跟人好好說話了',
    content: '想了一下上次跟人講超過十句話是什麼時候\n好像是上個月的事了\n\n每天講的話大概就是\n「好」「收到」「了解」「謝謝」\n\n不是沒有朋友\n是大家都忙\n約了幾次都沒約成\n慢慢就不約了\n\n一個人也習慣了 但偶爾還是會覺得...'
  },
  {
    board: 'chat', category: 'treehole', author: '名無しさん',
    title: '搬來新城市三個月了 一個朋友都沒有',
    content: '工作調動來了台北\n租了一間小套房\n\n下班就是回家\n週末就是洗衣服買菜\n偶爾去咖啡廳坐著\n假裝自己很充實\n\n其實真的很孤獨\n但又不知道怎麼認識新的人\n交友軟體滑了幾天就刪了\n\n大家都是怎麼在新環境交朋友的'
  },
  {
    board: 'chat', category: 'treehole', author: '名無しさん',
    title: '已經連續加班兩週了',
    content: '每天都說「明天就好了」\n但明天永遠有新的東西進來\n\n今天回家的時候天已經全黑了\n路上幾乎沒有人\n\n走進便利商店買了一個便當\n店員跟我說「辛苦了」\n差點哭出來\n\n真的好累'
  },
  {
    board: 'chat', category: 'treehole', author: '名無しさん',
    title: '分手半年了 突然很想他',
    content: '明明是自己提的\n明明知道分開是對的\n\n但剛才經過我們常去的那家店\n突然全部都湧上來了\n\n不是想復合\n就是...突然很想那個感覺\n有人在旁邊 有人會回你訊息 有人在等你\n\n現在回家就是暗的\n冰箱裡只有水'
  },
  {
    board: 'chat', category: 'treehole', author: '社畜',
    title: '其實很討厭現在的工作 但不敢離開',
    content: '每個月固定的房租、保險、孝親費\n算一算存款只夠撐兩個月\n\n不喜歡這份工作\n主管不好、同事冷漠、做的事情沒意義\n但至少薪水準時入帳\n\n偶爾打開104\n看到喜歡的職缺\n但一想到要重新開始就...\n\n是不是每個人都這樣過的'
  },
  {
    board: 'chat', category: 'treehole', author: '名無しさん',
    title: '爸媽老了 我卻在外面回不去',
    content: '今天跟爸視訊\n他頭髮又白了好多\n媽在旁邊說腰最近不太舒服\n叫我不要擔心\n\n但我怎麼可能不擔心\n\n在外面工作領的薪水\n每個月匯回去的也不多\n過年回去也就那幾天\n\n有時候覺得很對不起他們\n但也不知道還能怎麼辦'
  },
  {
    board: 'chat', category: 'treehole', author: '名無しさん',
    title: '好像很久沒有笑了',
    content: '不是那種社交的笑\n是發自內心覺得開心的笑\n\n想了想上次是什麼時候\n好像想不起來了\n\n不是不開心\n就是...沒什麼感覺\n每天都差不多\n\n有人也是這樣嗎\n還是我該去看醫生'
  },
  {
    board: 'chat', category: 'treehole', author: '名無しさん',
    title: '越長大朋友越少 正常嗎',
    content: '大學的時候隨便約都十幾個人\n現在要找個人吃飯都很難\n\n不是鬧翻\n就是慢慢不聯絡了\n各自有各自的生活\n\n群組還在 但已經沒人講話了\n偶爾有人丟個連結 也沒人回\n\n是我的問題還是大家都這樣'
  },

  // === 30% opinion (9) ===
  {
    board: 'chat', category: 'opinion', author: '名無しさん',
    title: '台灣的加班文化真的很扯',
    content: '在日商待過 在台商也待過\n說實話台灣的加班文化比日本還誇張\n\n日本至少還會記加班時數\n台灣直接責任制 不給你算\n\n最扯的是「準時下班」還會被酸\n好像留越晚越認真\n\n明明效率高準時走才對吧\n怎麼變成一種罪了'
  },
  {
    board: 'chat', category: 'opinion', author: '名無しさん',
    title: '覺得現在的新聞越來越不像新聞了',
    content: '剛打開手機看新聞\n前三則是某藝人說了什麼\n第四則是哪個Youtuber又怎樣了\n\n真正重要的事情要滑很久才看得到\n或是根本沒有報\n\n以前的新聞不是這樣的吧\n還是其實一直都這樣\n只是我現在才注意到'
  },
  {
    board: 'tech', category: 'opinion', author: '名無しさん',
    title: '寫程式十年 覺得工具越多反而越累',
    content: '剛入行的時候 editor + terminal 就夠了\n現在光環境設定就要搞半天\n\nDocker Kubernetes CI/CD 各種監控\n還沒開始寫 code 已經累了\n\n每隔幾個月就有新框架出來\n不學怕落後 學了怕白學\n\n有時候懷念以前 jQuery 一把梭的日子'
  },
  {
    board: 'chat', category: 'opinion', author: '名無しさん',
    title: '租屋族永遠是弱勢',
    content: '看到房東要漲租的訊息\n心裡涼了一半\n\n合約上寫的很清楚\n但你能怎樣 不租就要搬家\n搬家又是一筆開銷\n\n買房買不起 租房被漲價\n存錢的速度永遠追不上房價\n\n年輕人到底還能怎樣'
  },
  {
    board: 'chat', category: 'opinion', author: '名無しさん',
    title: '外送平台把餐飲業搞得很慘',
    content: '樓下那家小吃店老闆跟我抱怨\n上架外送平台抽成30%\n不上架又沒客人\n\n以前直接來店裡吃的客人\n現在都改用外送了\n同樣的便當 店家少賺一大截\n\n外送員也不好過\n風吹日曬跑一單賺幾十塊\n\n到底誰在賺錢'
  },
  {
    board: 'tech', category: 'opinion', author: '名無しさん',
    title: 'AI 會不會讓工程師變得更不值錢',
    content: '最近用 Copilot 寫 code\n說實話效率真的有變高\n\n但也開始擔心\n如果 AI 可以寫 80% 的 code\n那公司還需要這麼多工程師嗎\n\n以前覺得寫程式是鐵飯碗\n現在看起來沒有什麼是鐵的\n\n大家怎麼看'
  },
  {
    board: 'chat', category: 'opinion', author: '名無しさん',
    title: '台灣人是不是太愛忍了',
    content: '職場被欺負忍\n奧客無理取鬧忍\n鄰居噪音忍\n房東亂來忍\n\n從小被教「多一事不如少一事」\n「忍一時風平浪靜」\n\n但有些事情忍了就是被吃定\n不說出來永遠不會改\n\n是不是該學著不忍'
  },
  {
    board: 'chat', category: 'opinion', author: '名無しさん',
    title: '覺得社群媒體讓人越來越焦慮',
    content: '打開 IG 全是\n別人出國玩\n別人吃大餐\n別人升遷加薪\n別人甜蜜放閃\n\n明知道那是修過的美好\n但還是會不自覺比較\n\n刪了IG兩個禮拜\n焦慮感真的有變少\n但又怕跟朋友脫節\n\n好矛盾'
  },

  // === 20% question (6) ===
  {
    board: 'chat', category: 'question', author: '名無しさん',
    title: '第一次看身心科會很奇怪嗎',
    content: '最近狀態不太好\n失眠 注意力很差 常常發呆\n\n朋友建議我去看身心科\n但總覺得有點...不好意思\n\n怕被貼標籤\n也怕吃藥有副作用\n\n有去過的人可以分享一下嗎\n流程是什麼 會問什麼\n\n想做好心理準備再去'
  },
  {
    board: 'chat', category: 'question', author: '名無しさん',
    title: '轉職到底要不要裸辭',
    content: '目前這份工作做了快三年\n想轉換跑道但一直在猶豫\n\n邊上班邊找的話\n根本沒時間準備面試\n每天下班都累到不想動\n\n裸辭的話\n看著存款每天減少壓力又很大\n\n大家轉職都是怎麼做的\n有經驗的人可以分享一下嗎'
  },
  {
    board: 'tech', category: 'question', author: '名無しさん',
    title: '自學程式該從哪個語言開始',
    content: '非本科想轉職寫程式\n爬了很多文章越看越亂\n\n有人說 Python 入門最簡單\n有人說前端 JavaScript 比較好找工作\n也有人說直接學 Go 或 Rust\n\n目標是半年後可以找到工作\n不知道該怎麼選\n\n請問過來人有什麼建議'
  },
  {
    board: 'chat', category: 'question', author: '名無しさん',
    title: '一個人去旅行會不會很奇怪',
    content: '想出去走走但找不到旅伴\n大家時間都對不上\n\n考慮一個人去日本\n但又有點猶豫\n\n吃飯的時候一個人坐會不會尷尬\n拍照沒人幫忙拍怎麼辦\n晚上回飯店會不會無聊\n\n有一個人旅行經驗的人嗎\n分享一下感想'
  },
  {
    board: 'chat', category: 'question', author: '名無しさん',
    title: '有什麼副業是下班後可以做的',
    content: '薪水不高 每個月存不了多少\n想找個副業增加收入\n\n看過一些選項\n接案設計 寫文案 經營自媒體\n也有人在跑外送\n\n但不確定哪個比較實際\n不想被割韭菜\n\n有在做副業的人嗎\n月收大概多少 花多少時間'
  },
  {
    board: 'tech', category: 'question', author: '名無しさん',
    title: '該不該花錢買線上課程',
    content: '想學資料分析\n看到幾個平台的課程\n價格從幾千到幾萬都有\n\nYouTube 也有很多免費教學\n但品質參差不齊\n\n有人買過線上課程嗎\n真的有用還是交智商稅\n\n或是有推薦的免費資源也可以'
  },

  // === 10% casual (3) ===
  {
    board: 'chat', category: 'casual', author: '名無しさん',
    title: '最近迷上了半夜散步',
    content: '大概十一二點出門\n戴著耳機在附近走一圈\n\n路上幾乎沒有人\n便利商店的燈很亮\n偶爾會遇到遛狗的人\n\n白天走這條路覺得很普通\n晚上走起來感覺完全不一樣\n\n有人也喜歡晚上出門走走嗎'
  },
  {
    board: 'chat', category: 'casual', author: '名無しさん',
    title: '便利商店的咖啡其實蠻好喝的',
    content: '以前覺得喝超商咖啡很隨便\n都跑去外面的咖啡廳\n\n最近預算抓緊\n開始喝超商的\n發現...其實也不差啊\n\n尤其是全家的拿鐵\n45塊 穩定品質\n不用等 不用排隊\n\n以前花150買一杯到底是在幹嘛'
  },
  {
    board: 'chat', category: 'casual', author: '名無しさん',
    title: '有人跟我一樣很會跟貓說話嗎',
    content: '養了貓之後\n發現自己話變超多\n\n回家第一句是跟貓說「我回來了」\n煮飯的時候會問牠要吃什麼\n看電視會跟牠分析劇情\n\n牠完全聽不懂\n但那個眼神讓你覺得牠在聽\n\n朋友知道可能會覺得我有病\n但真的停不下來'
  },
];

// Reply pool for backfill — empathetic/engaging, short
const REPLY_POOL: string[] = [
  '能理解你的感覺\n有時候光是說出來就好一點了',
  '你不是一個人\n很多人都有類似的經歷',
  '辛苦了\n能撐到現在已經很厲害了',
  '深夜看到這篇\n突然覺得自己不是一個人',
  '拍拍\n先好好休息\n明天的事明天再說',
  '看完覺得被講中了\n原來不是只有我這樣',
  '這種事情真的沒有標準答案\n只能慢慢來',
  '+1\n我也差不多的狀況',
  '先好好照顧自己吧\n其他的慢慢想',
  '謝謝分享\n有時候看到別人的經歷會覺得被理解',
  '有同感\n不知道為什麼看到這篇覺得安心了一點',
  '加油\n雖然這兩個字很廉價\n但還是想說',
  '有經歷過類似的事\n後來慢慢就過去了\n會好的',
  '很真實的感受\n不需要覺得不好意思',
  '我也在想一樣的問題\n到現在還沒有答案',
  '半夜看到這篇\n突然覺得很有共鳴',
  '不用急著找答案\n有些事情就是需要時間',
  '至少你還願意說出來\n這就是第一步了',
  '好真實\n很多人都不敢講這些',
  '謝謝你的分享\n讓我知道不是只有自己在掙扎',
];

// --- Main Logic ---

async function seedThread(): Promise<{ id: number; title: string } | null> {
  // Shuffle and find an unused thread
  const shuffled = [...THREAD_POOL].sort(() => Math.random() - 0.5);

  for (const thread of shuffled) {
    const exists = await titleExists(thread.title);
    if (exists) continue;

    if (DRY_RUN) {
      console.log(`[DRY-RUN] Would post thread: [${thread.board}] ${thread.title}`);
      return { id: 0, title: thread.title };
    }

    const id = await insertThread(thread.board, thread.title, thread.content, thread.author);
    console.log(`[THREAD] #${id} [${thread.board}] ${thread.title}`);
    return { id, title: thread.title };
  }

  console.log('[THREAD] All threads in pool have been used. Time to refill!');
  return null;
}

async function backfillReplies(maxReplies: number): Promise<number> {
  const lonely = await findLonelyThreads(10); // fetch up to 10, pick at most maxReplies
  let count = 0;

  for (const thread of lonely) {
    if (count >= maxReplies) break;
    if (shouldSkip(0.3)) continue; // 30% skip for individual replies

    const reply = pick(REPLY_POOL);
    const author = randomName();

    if (DRY_RUN) {
      console.log(`[DRY-RUN] Would reply to #${thread.id} "${thread.title}" with: ${reply.substring(0, 30)}...`);
      count++;
      continue;
    }

    const replyId = await insertReply(thread.id, reply, author);
    console.log(`[REPLY] #${replyId} -> thread #${thread.id} "${thread.title}"`);
    count++;
  }

  return count;
}

async function main() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
  const isWeekend = day === 5 || day === 6;

  console.log(`\n=== cron-breathing ${now.toISOString()} ===`);
  console.log(`Day: ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day]}, Weekend bonus: ${isWeekend}`);

  // Global 20% skip
  if (shouldSkip(0.2)) {
    console.log('[SKIP] Global skip triggered. Doing nothing today.');
    return;
  }

  // 1. Post 1 thread (+ 1 bonus on weekends)
  const threadCount = isWeekend ? 2 : 1;
  let threadsPosted = 0;
  for (let i = 0; i < threadCount; i++) {
    const result = await seedThread();
    if (result) threadsPosted++;
  }

  // 2. Backfill replies for lonely threads
  const repliesPosted = await backfillReplies(3);

  console.log(`\n--- Summary: ${threadsPosted} threads, ${repliesPosted} replies ---\n`);
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('[ERROR]', err);
    pool.end();
    process.exit(1);
  });
