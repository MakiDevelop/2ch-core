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

  // ========== work: 病假新制正式上路 ==========
  const thread1 = await insertThread(
    'work',
    '病假新制上路 請10天內不能扣考績 你敢請嗎',
    '2026勞動新制\n\n勞工1年內請病假不超過10天\n雇主不能因此給不利處分\n\n全勤獎金也改成按比例扣\n不能請一天假就扣整月\n\n法規是這樣寫\n但你敢請嗎\n主管臉色才是最大壓力',
    '名無しさん',
    18
  );
  await insertReply(thread1, '法規歸法規\n台灣職場文化不是這樣玩的', '名無しさん', 17);
  await insertReply(thread1, '>>2 真的 主管那個眼神就夠你喝一壺了', '名無しさん', 16);
  await insertReply(thread1, '大公司還好\n小公司老闆會記仇', '名無しさん', 15);
  await insertReply(thread1, '>>3 小公司根本沒在管勞基法的', '社畜', 14);
  await insertReply(thread1, '勞工局要真的去查才有用\n不然都是紙上談兵', '名無しさん', 13);
  await insertReply(thread1, '我們公司超過3天就要診斷證明\n合法但很機車', '名無しさん', 12);

  // ========== work: 週休三日提案 ==========
  const thread2 = await insertThread(
    'work',
    '週休三日連署過關 台灣工時全球第五高',
    '「推動台灣成為亞洲第一個週休三日國家」\n公共政策平台連署成功了\n\n勞動部說12/7前會正式回應\n\n台灣去年工時2030小時\n全球第五高\n只輸給哥倫比亞、哥斯大黎加等\n\n但老闆們應該會崩潰吧',
    '名無しさん',
    22
  );
  await insertReply(thread2, '連署成功不代表會過\n看看之前多少提案被打槍', '名無しさん', 21);
  await insertReply(thread2, '>>2 至少有在討論了\n總比沒人提好', '名無しさん', 20);
  await insertReply(thread2, '全球第五高工時\n薪水全球排第幾？', '名無しさん', 19);
  await insertReply(thread2, '>>3 這個問題太尖銳了', '名無しさん', 18);
  await insertReply(thread2, '日本韓國都在試辦了\n台灣不跟上會落後', '名無しさん', 17);
  await insertReply(thread2, '服務業絕對反對\n人力成本會暴漲', '老闆視角', 16);

  // ========== money: 2026房市要跌了 ==========
  const thread3 = await insertThread(
    'money',
    '專家說2026房價要跌10% 你信嗎',
    '房仲公會榮譽理事長說\n2026年房市會「價跌量漲」\n\n平均跌幅10%左右\n台北5-6%\n台南高雄可能超過10%\n\n央行打房連七次有效果？\n還是說只是喊話而已',
    '名無しさん',
    20
  );
  await insertReply(thread3, '喊跌喊了幾年\n結果越漲越高', '名無しさん', 19);
  await insertReply(thread3, '>>2 這次央行真的有在打\n銀行放貸變嚴了', '名無しさん', 18);
  await insertReply(thread3, '跌10%也還是買不起\n之前漲多少了', '名無しさん', 17);
  await insertReply(thread3, '剛需的可以等一下\n投資的退場吧', '名無しさん', 16);
  await insertReply(thread3, '>>4 問題是剛需等不起\n租金也在漲', '名無しさん', 15);
  await insertReply(thread3, '建商撐不住會降價的\n看誰先眨眼', '房仲', 14);

  // ========== money: 物價貴到爆 ==========
  const thread4 = await insertThread(
    'money',
    '物價到底漲多少 92%民眾改變消費習慣',
    '調查顯示\n76.5%民眾對物價「非常有感覺」\n65.3%表示生活受到影響\n\n92.6%改變消費習慣\n外食、娛樂先砍\n\n有人說薪水像東南亞\n物價像歐洲\n\n你們有同感嗎',
    '名無しさん',
    24
  );
  await insertReply(thread4, '便當從60變90了\n三年漲50%', '名無しさん', 23);
  await insertReply(thread4, '>>2 小火鍋300起跳\n以前明明200有找', '名無しさん', 22);
  await insertReply(thread4, '現在都自己煮了\n外食吃不起', '名無しさん', 21);
  await insertReply(thread4, '>>3 自己煮超市也貴啊\n一盤肉快100', '名無しさん', 20);
  await insertReply(thread4, 'CPI才漲1.6%\n笑死 跟體感差太多', '名無しさん', 19);
  await insertReply(thread4, '>>5 CPI計算方式本來就有問題\n不含房租', '名無しさん', 18);

  // ========== gossip: 葛萊美獎結果 ==========
  const thread5 = await insertThread(
    'gossip',
    '葛萊美獎揭曉！Lady Gaga三連發 APT.輸了',
    '2026葛萊美結果出來了\n\n年度專輯：Bad Bunny\n（首位西班牙語獲獎！）\n\n年度歌曲：Billie Eilish\n\nLady Gaga拿了三個獎超猛\n\n但Rosé的APT.輸給了Defying Gravity\n可惜',
    '名無しさん',
    8
  );
  await insertReply(thread5, 'Bad Bunny得年專太驚人\n西班牙語專輯第一人', '名無しさん', 7);
  await insertReply(thread5, '>>2 拉丁音樂崛起了\n市場在變', '名無しさん', 6);
  await insertReply(thread5, 'APT.明明超紅\n輸給Defying Gravity有點意外', '名無しさん', 5);
  await insertReply(thread5, '>>3 Wicked電影加成吧\n學院派愛這種', '名無しさん', 4);
  await insertReply(thread5, 'Lady Gaga還是穩\n三個獎不少了', '名無しさん', 3);
  await insertReply(thread5, 'Kendrick又贏了\n年度唱片強', 'Hip-hop迷', 2);

  // ========== gossip: 沈玉琳要復工了 ==========
  const thread6 = await insertThread(
    'gossip',
    '沈玉琳抗癌成功 2-3月可望復出',
    '沈玉琳去年確診血癌\n治療5個月了\n\n詹惟中說2-3月就能復出\n本人對回歸11點熱吵店意願很高\n\n潘若迪也說每天視訊\n沈玉琳笑聲跟以往一樣宏亮\n\n希望真的康復！',
    '名無しさん',
    16
  );
  await insertReply(thread6, '沈玉琳加油！\n綜藝圈沒他真的少很多笑聲', '名無しさん', 15);
  await insertReply(thread6, '>>2 11點熱吵店沒他感覺差很多', '名無しさん', 14);
  await insertReply(thread6, '去年聽到他生病超震驚\n還好有挺過來', '名無しさん', 13);
  await insertReply(thread6, '血癌治療真的很辛苦\n康復不容易', '名無しさん', 12);
  await insertReply(thread6, '>>4 他還胖了3公斤\n代表吃得下有體力', '名無しさん', 11);
  await insertReply(thread6, '期待復出！', '名無しさん', 10);

  // ========== life: 育嬰假可以單日請了 ==========
  const thread7 = await insertThread(
    'life',
    '育嬰假改成可以單日請 家庭照顧假也能算時數',
    '2026新制\n\n育嬰留停不用一次請整月了\n可以「單日」申請\n總共可以請30天\n雙親合計60天\n\n家庭照顧假也能按小時請\n1年7天變56小時\n\n有小孩的應該很有感',
    '名無しさん',
    26
  );
  await insertReply(thread7, '這改得不錯\n以前請一個月壓力很大', '名無しさん', 25);
  await insertReply(thread7, '>>2 對啊 主管會覺得你要離職', '名無しさん', 24);
  await insertReply(thread7, '家庭照顧假按小時很實用\n小孩生病帶去看醫生', '名無しさん', 23);
  await insertReply(thread7, '但還是要看公司文化\n法規給你你敢請嗎', '名無しさん', 22);
  await insertReply(thread7, '>>4 又來了 台灣職場最大問題', '名無しさん', 21);
  await insertReply(thread7, '希望能真正落實\n不要又是紙上談兵', '新手爸媽', 20);

  // ========== life: 小年夜變國定假日 ==========
  const thread8 = await insertThread(
    'life',
    '小年夜變國定假日了！今年過年連休變更長',
    '2026起\n「小年夜」正式列為國定假日\n\n這是什麼概念？\n就是除夕前一天也放假了\n\n今年春節假期會更長\n有沒有很期待',
    '名無しさん',
    28
  );
  await insertReply(thread8, '早該這樣了\n小年夜本來就要大掃除', '名無しさん', 27);
  await insertReply(thread8, '>>2 是說公務員嗎\n一般公司會給嗎', '名無しさん', 26);
  await insertReply(thread8, '國定假日老闆應該要給\n不然要補假', '名無しさん', 25);
  await insertReply(thread8, '連假變長\n出國票價要噴了', '名無しさん', 24);
  await insertReply(thread8, '>>4 確實 機票現在就很貴', '名無しさん', 23);
  await insertReply(thread8, '在家耍廢最實在', '名無しさん', 22);

  console.log('討論串新增完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
