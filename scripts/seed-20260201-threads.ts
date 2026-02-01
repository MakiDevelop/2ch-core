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

  // ========== life 版：免費心理諮商 ==========
  const thread1 = await insertThread(
    'life',
    '免費心理諮商2026額度重新計算了 有人去過嗎',
    '衛福部的15-45歲心理諮商方案\n2026年額度重新計算\n每人又有3次免費\n\n據說每4個青壯年就有1個有心理困擾\n想問有人用過嗎\n流程會不會很麻煩',
    '名無しさん',
    36
  );
  await insertReply(thread1, '去年用過兩次\n流程很簡單 帶身分證就好\n諮商師人很好', '名無しさん', 34);
  await insertReply(thread1, '>>2 請問要怎麼預約\n直接打電話嗎', '名無しさん', 32);
  await insertReply(thread1, '官網可以查合作機構\n然後打去預約\n掛號費另計 大概100-200', '名無しさん', 30);
  await insertReply(thread1, '每次1600省下來真的有感\n推薦大家去試試\n不一定要有病才能諮商', '過來人', 28);
  await insertReply(thread1, '>>4 掛號費不算貴\n重點是諮商真的有幫助', '名無しさん', 26);

  // ========== life 版：年輕人壓力 ==========
  const thread2 = await insertThread(
    'life',
    '調查說六成年輕人是高壓力族群 你們呢',
    '遠見民調說18-34歲\n六成屬於高壓力族群\n壓力來源前兩名是財務跟工作\n\n還有八成擔心退休金不夠\n想到就焦慮\n覺得努力也沒什麼用',
    '壓力山大',
    48
  );
  await insertReply(thread2, '財務壓力真的\n薪水漲幅追不上物價\n存不到錢', '名無しさん', 46);
  await insertReply(thread2, '>>2 房價更不用說\n買房根本夢裡才有', '名無しさん', 44);
  await insertReply(thread2, '我壓力來源是國際局勢\n萬一打仗怎麼辦', '名無しさん', 42);
  await insertReply(thread2, '想躺平但又不敢\n這種矛盾感更累', '名無しさん', 40);
  await insertReply(thread2, '>>4 懂 動也不是不動也不是\n乾脆當天和尚撞天鐘', '名無しさん', 38);
  await insertReply(thread2, '年輕人不生小孩很合理\n自己都養不活了', '名無しさん', 36);

  // ========== love 版：交友軟體疲勞 ==========
  const thread3 = await insertThread(
    'love',
    '交友軟體越來越沒動力用了',
    '最近看到新聞說交友軟體下載數\n從2020年2.8億降到2.3億\n\n我自己也是\n以前還會認真經營\n現在連打開都懶\n\n是不是大家都累了',
    '名無しさん',
    42
  );
  await insertReply(thread3, '配對一堆不回訊息的\n浪費時間', '名無しさん', 40);
  await insertReply(thread3, '聊天還要付費\n免費仔根本配不到', '名無しさん', 38);
  await insertReply(thread3, '>>2 付了錢也不一定能聊啊\n花錢買寂寞', '名無しさん', 36);
  await insertReply(thread3, '聽說現在流行AI配對\n不知道有沒有用', '名無しさん', 34);
  await insertReply(thread3, '還是現實認識的比較實在\n但現實也沒機會啊...', '名無しさん', 32);
  await insertReply(thread3, '我已經放棄了\n一個人也很好', '單身萬歲', 30);

  // ========== love 版：約會軟體推薦 ==========
  const thread4 = await insertThread(
    'love',
    '2026還在用的交友軟體推薦',
    '雖然說交友軟體熱度下降\n但還是想問\n現在還有人在用什麼軟體\n\n聽說CMB評價很高\n有人用過嗎',
    '認真想脫單',
    38
  );
  await insertReply(thread4, 'Pairs還可以\n日系的 認真交往為主', '名無しさん', 36);
  await insertReply(thread4, '>>2 Pairs要付費才好用\n免費版超難配', '名無しさん', 34);
  await insertReply(thread4, 'CMB每天只給幾個配對\n但品質比較好', '名無しさん', 32);
  await insertReply(thread4, 'Bumble女生主動的設計不錯\n比較不會被騷擾', '名無しさん', 30);
  await insertReply(thread4, '30以上的建議用SweetRing\n比較多認真的', '名無しさん', 28);

  // ========== acg 版：TGS 電玩展 ==========
  const thread5 = await insertThread(
    'acg',
    'TGS電玩展最後一天了 有人今天去嗎',
    '2026台北電玩展到今天為止\n聽說任天堂攤位超多人\n120台試玩機還是要排超久\n\n有人搶到什麼周邊嗎',
    '名無しさん',
    8
  );
  await insertReply(thread5, '昨天去的\n皮克敏拍照區超可愛\n排了40分鐘', '名無しさん', 6);
  await insertReply(thread5, '《仁王3》試玩超難\n死了三次才過', '名無しさん', 5);
  await insertReply(thread5, '>>3 仁王系列本來就硬核\n新手勸退遊戲', '名無しさん', 4);
  await insertReply(thread5, '零～紅蝶～REMAKE全球首次試玩\n恐怖遊戲迷必去', '名無しさん', 3);
  await insertReply(thread5, '桌遊區意外的好玩\n寶可夢卡牌教學很讚', '名無しさん', 2);
  await insertReply(thread5, '人超多 建議平日去\n假日根本人擠人', '名無しさん', 1);

  // ========== acg 版：2026冬番 ==========
  const thread6 = await insertThread(
    'acg',
    '2026冬番大家在追什麼',
    '這季新番好多續作\n芙莉蓮第二季、咒術迴戰死滅迴游\n我推的孩子第三季\n\n大家在追哪部',
    '動畫宅',
    52
  );
  await insertReply(thread6, '芙莉蓮必追\n第一季封神', '名無しさん', 50);
  await insertReply(thread6, '咒術死滅迴游劇情很黑暗\n虎杖好慘', '名無しさん', 48);
  await insertReply(thread6, '>>3 乙骨終於登場了\n帥爆', '名無しさん', 46);
  await insertReply(thread6, '地獄樂第二季也不錯\n畫眉丸超強', '名無しさん', 44);
  await insertReply(thread6, '推孩第三季回歸\n阿奎亞線超期待', '名無しさん', 42);
  await insertReply(thread6, '今季強檔太多追不完\n時間不夠用', '名無しさん', 40);

  // ========== meta 版：深色模式 ==========
  const thread7 = await insertThread(
    'meta',
    '建議新增深色模式切換',
    '晚上滑2ch眼睛有點痛\n能不能加個深色模式的選項\n\n很多論壇app都有這個功能了\n應該不會太難做吧',
    '夜貓子',
    72
  );
  await insertReply(thread7, '+1 晚上白底真的很刺眼', '名無しさん', 70);
  await insertReply(thread7, '可以用瀏覽器插件先擋一下\nDark Reader之類的', '名無しさん', 68);
  await insertReply(thread7, '>>3 插件會讓版面跑掉\n還是希望官方做', '名無しさん', 66);
  await insertReply(thread7, '支持\n現在手機都有系統深色模式\n網站跟著切換最好', '名無しさん', 64);
  await insertReply(thread7, '希望可以自動偵測系統設定\n不用手動切', '名無しさん', 62);

  // ========== meta 版：app建議 ==========
  const thread8 = await insertThread(
    'meta',
    '有計畫出官方app嗎',
    '手機版網頁用起來還可以\n但如果有專屬app會更方便\n\n可以推送通知\n看回覆不用一直重新整理',
    '名無しさん',
    84
  );
  await insertReply(thread8, '先把網頁版做好比較實際\n開發app成本很高', '名無しさん', 82);
  await insertReply(thread8, '>>2 同意 小站沒那個資源\n網頁PWA就夠了', '名無しさん', 80);
  await insertReply(thread8, 'PWA可以加到桌面\n跟app差不多', '名無しさん', 78);
  await insertReply(thread8, '推送通知希望有\n有人回覆想即時知道', '名無しさん', 76);
  await insertReply(thread8, '現在網頁版已經很流暢了\n先這樣就好', '名無しさん', 74);

  console.log('討論串新增完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
