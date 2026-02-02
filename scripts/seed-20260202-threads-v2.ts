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

  // ========== tech: AI代理人成2026關鍵字 ==========
  const thread1 = await insertThread(
    'tech',
    'AI Agent會不會取代工程師？2026是轉捩點',
    '資策會公布2026年十大AI關鍵技術\n代理式AI（Agentic AI）被點名\n\n不只是生成內容\n而是有「目標導向」跟「自主行動」能力\n\n微軟、亞馬遜都在投資AaaS\n感覺以後很多工作會被取代\n\n你們覺得呢',
    '名無しさん',
    20
  );
  await insertReply(thread1, '這波AI比以前的自動化更可怕\n因為能處理非結構化任務', '名無しさん', 19);
  await insertReply(thread1, '>>2 但還是需要人下指令吧\n不會真的自己跑', '名無しさん', 18);
  await insertReply(thread1, '會用AI的工程師會取代不會用的\n這是真的', 'AI工程師', 17);
  await insertReply(thread1, '>>3 現在已經有AI agent自己寫code了\n人類只要review', '名無しさん', 16);
  await insertReply(thread1, '先學會怎麼用再說\n反正也逃不掉', '名無しさん', 15);
  await insertReply(thread1, '台灣企業54%要增加AI投資\n再不跟上就落後了', '名無しさん', 14);

  // ========== tech: 甲骨文股價暴跌 ==========
  const thread2 = await insertThread(
    'tech',
    '甲骨文股價暴跌30% AI泡沫恐慌來了？',
    '甲骨文創25年最大跌幅\n股價一天崩30%\n\n因為財報低於預期\n雲端業務成長趨緩\n\n大家開始擔心AI是不是泡沫\n之前炒太高了\n\n你們覺得AI概念股還能買嗎',
    '名無しさん',
    26
  );
  await insertReply(thread2, '一家公司業績不好不代表整個產業\n別恐慌', '名無しさん', 25);
  await insertReply(thread2, '>>2 但甲骨文是大廠欸\n這種程度的跌幅很少見', '名無しさん', 24);
  await insertReply(thread2, 'AI需要實際落地應用\n純炒概念的確實危險', '名無しさん', 23);
  await insertReply(thread2, '台積電還好吧\n有真正的訂單', '名無しさん', 22);
  await insertReply(thread2, '>>4 台積電是護國神山\n跟這種純軟體股不同', '名無しさん', 21);
  await insertReply(thread2, '泡沫擠一擠才健康\n不然估值太瘋狂', '老股民', 20);

  // ========== gossip: 2月1日追星地獄日 ==========
  const thread3 = await insertThread(
    'gossip',
    '2/1追星地獄日 TXT大巨蛋+TWS高雄流 你選誰',
    '昨天2/1被封為「追星地獄日」\n一天五場活動同時開\n\n- TXT在台北大巨蛋\n- TWS在高雄流行音樂中心\n- 鄭大賢見面會\n- SILENT SIREN演唱會\n- 崔振赫見面會\n\n錢包跟時間都不夠用\n你們去了哪場',
    '名無しさん',
    14
  );
  await insertReply(thread3, 'TXT！大巨蛋超震撼\n音響效果比想像中好', '名無しさん', 13);
  await insertReply(thread3, '>>2 我也去TXT\n後悔沒買VIP位', '名無しさん', 12);
  await insertReply(thread3, 'TWS高雄場路過\n場地比較小但氣氛超棒', '名無しさん', 11);
  await insertReply(thread3, '只有我是崔振赫嗎\n歐巴太帥了', '名無しさん', 10);
  await insertReply(thread3, '追星真的好燒錢\n這個月已經吃土了', '名無しさん', 9);
  await insertReply(thread3, '2/28還有NCT WISH\n錢包準備好', '名無しさん', 8);

  // ========== gossip: 江蕙演唱會安可場 ==========
  const thread4 = await insertThread(
    'gossip',
    '江蕙演唱會安可場2/20開唱 有人搶到票嗎',
    '江蕙【無,有】安可場來了\n2/20-25小巨蛋連唱5場\n\n上次封麥說是最後一次\n結果還是回來了\n\n不過票價真的貴\n最高檔要12800\n\n有人要去嗎',
    '名無しさん',
    22
  );
  await insertReply(thread4, '搶到2/22的票！\n等了好久終於能看', '名無しさん', 21);
  await insertReply(thread4, '>>2 恭喜！我搶不到只能看轉播', '名無しさん', 20);
  await insertReply(thread4, '江蕙每次說最後都會再來\n但還是會買票', '名無しさん', 19);
  await insertReply(thread4, '帶媽媽去看\n她超愛江蕙', '名無しさん', 18);
  await insertReply(thread4, '>>4 孝順推\n我也想帶爸媽', '名無しさん', 17);
  await insertReply(thread4, '12800有點貴\n但看江蕙值得', '老歌迷', 16);

  // ========== acg: 孤獨搖滾動畫展 ==========
  const thread5 = await insertThread(
    'acg',
    '孤獨搖滾動畫展2/13三創開展 波奇控集合',
    '《孤獨搖滾！》動畫展終於來台灣了\n\n地點：三創生活園區12F\n時間：2/13-3/22\n\n日本巡迴很久了\n終於輪到我們\n\n有人要約一起去嗎',
    '名無しさん',
    18
  );
  await insertReply(thread5, '波奇太可愛了\n一定要去朝聖', '名無しさん', 17);
  await insertReply(thread5, '>>2 同意！希望有限定周邊', '名無しさん', 16);
  await insertReply(thread5, '三創那邊交通方便\n搭捷運就到', '名無しさん', 15);
  await insertReply(thread5, '結束那天剛好是動畫節\n可以連著看', '名無しさん', 14);
  await insertReply(thread5, '>>4 行程排起來！', '名無しさん', 13);
  await insertReply(thread5, '喜多醬派在這裡', '名無しさん', 12);

  // ========== acg: 小林家龍女僕快閃店 ==========
  const thread6 = await insertThread(
    'acg',
    '小林家的龍女僕快閃店2/11新光南西 台灣首場',
    '《小林家的龍女僕》快閃店要來了\n\n地點：新光三越台北南西店一館9F\n時間：2/11-3/22\n\n托爾跟康納都太可愛\n終於有實體店可以朝聖\n\n有人知道會賣什麼嗎',
    '名無しさん',
    16
  );
  await insertReply(thread6, '托爾女僕裝周邊必買', '名無しさん', 15);
  await insertReply(thread6, '>>2 我要康納的！', '名無しさん', 14);
  await insertReply(thread6, '新光南西那邊很好逛\n可以順便吃飯', '名無しさん', 13);
  await insertReply(thread6, '希望不要跟日本一樣要抽選入場', '名無しさん', 12);
  await insertReply(thread6, '>>4 台灣應該不會吧\n人沒那麼多', '名無しさん', 11);

  // ========== love: 直球約會成趨勢 ==========
  const thread7 = await insertThread(
    'love',
    'Tinder報告說2026流行「直球約會」 不再曖昧內耗',
    'Tinder公布年度報告\n2026年約會趨勢是「Clear-Coding」\n\n意思是：\n- 直接說明自己要什麼\n- 不再花時間猜對方心思\n- 邊界清楚、期待對等\n\n經歷曖昧內耗後\n大家都學乖了嗎',
    '名無しさん',
    24
  );
  await insertReply(thread7, '這很好啊\n曖昧真的很累', '名無しさん', 23);
  await insertReply(thread7, '>>2 但太直接會不會嚇到人', '名無しさん', 22);
  await insertReply(thread7, '寧可被直接拒絕\n也不要浪費時間曖昧', '單身狗', 21);
  await insertReply(thread7, '>>3 真的 時間成本最貴', '名無しさん', 20);
  await insertReply(thread7, '我覺得還是要看對象\n有些人喜歡慢慢來', '名無しさん', 19);
  await insertReply(thread7, '交友軟體本來就該高效率\n不然用來幹嘛', '名無しさん', 18);

  // ========== love: 朋友介紹對象 ==========
  const thread8 = await insertThread(
    'love',
    '2026約會趨勢：朋友介紹比演算法可靠？',
    'Tinder說今年流行「Friendfluence」\n就是朋友的眼光最被信任\n\n群組裡的朋友變成媒人\n比交友軟體的演算法還準\n\n你們覺得呢\n朋友介紹的對象好嗎',
    '名無しさん',
    20
  );
  await insertReply(thread8, '朋友介紹至少知道底細\n不怕遇到怪人', '名無しさん', 19);
  await insertReply(thread8, '>>2 但朋友介紹分手很尷尬', '名無しさん', 18);
  await insertReply(thread8, '我跟老婆就是朋友介紹的\n推', '已婚人士', 17);
  await insertReply(thread8, '>>3 恭喜！但我朋友都單身...', '名無しさん', 16);
  await insertReply(thread8, '演算法配的都是表面條件\n朋友看的是個性', '名無しさん', 15);

  // ========== life: 機車路考2027實施 ==========
  const thread9 = await insertThread(
    'life',
    '機車路考2027年上路 你們怎麼看',
    '公路局推動駕照改革\n\n2026年筆試取消是非題\n2027年10月試辦機車道路考驗\n\n現在考照太簡單了\n很多人路上根本不會騎\n\n早該這樣做了吧',
    '名無しさん',
    28
  );
  await insertReply(thread9, '支持\n現在機車族騎法太可怕', '名無しさん', 27);
  await insertReply(thread9, '>>2 路考要怎麼考？\n台灣路況這麼複雜', '名無しさん', 26);
  await insertReply(thread9, '應該學日本\n有專門的練習場地', '名無しさん', 25);
  await insertReply(thread9, '駕訓班準備賺大錢了', '名無しさん', 24);
  await insertReply(thread9, '>>4 確實 學費應該會漲', '名無しさん', 23);
  await insertReply(thread9, '考再嚴也沒用\n取締才是重點', '名無しさん', 22);

  // ========== life: 台鐵票價調漲 ==========
  const thread10 = await insertThread(
    'life',
    '台鐵要漲價26.8%了 以後通勤更貴',
    '台鐵公司通過票價調整案\n預計調漲26.8%\n\n從70元變88元這種感覺\n\n通勤族表示：\n薪水沒漲 票價先漲\n\n你們支持漲價嗎',
    '名無しさん',
    30
  );
  await insertReply(thread10, '漲價可以接受\n但服務要跟上', '名無しさん', 29);
  await insertReply(thread10, '>>2 台鐵誤點問題先解決好嗎', '名無しさん', 28);
  await insertReply(thread10, '公司化之後什麼都漲\n這就是私有化？', '名無しさん', 27);
  await insertReply(thread10, '高鐵都漲過了\n台鐵遲早的事', '名無しさん', 26);
  await insertReply(thread10, '>>4 高鐵至少準時\n台鐵能比嗎', '名無しさん', 25);
  await insertReply(thread10, '改搭客運好了', '名無しさん', 24);

  console.log('討論串新增完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
