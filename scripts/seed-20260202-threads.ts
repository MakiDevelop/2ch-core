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

  // ========== news: 黃國昌新北市長競選總部成立 ==========
  const thread1 = await insertThread(
    'news',
    '黃國昌新北競總成立 趙少康喊藍白一定合',
    '民眾黨主席黃國昌昨天在新莊成立競選總部\n柯文哲、趙少康都到場力挺\n\n趙少康說國民黨人選就是李四川\n春節前會定案 三月藍白協調好\n\n不過民調顯示\n黃國昌單挑綠營候選人都輸\n只有李四川可以完勝蘇巧慧跟林右昌\n\n藍白真的合得起來嗎',
    '名無しさん',
    18
  );
  await insertReply(thread1, '黃國昌聲量高但好感度低\n這種人選藍營會接受？', '名無しさん', 17);
  await insertReply(thread1, '>>2 趙少康都說李四川了\n藍白合就是要國昌讓', '名無しさん', 16);
  await insertReply(thread1, '柯文哲出來挺是什麼意思\n他不是還有官司？', '名無しさん', 15);
  await insertReply(thread1, '>>3 讓個屁 國昌粉會崩潰', '白粉路過', 14);
  await insertReply(thread1, '新北市長真的很重要\n侯友宜幹完去選總統\n下一任會是藍營的指標', '名無しさん', 13);
  await insertReply(thread1, '>>4 柯剛被釋放啊\n交保條件沒說不能站台吧', '名無しさん', 12);

  // ========== news: 台美關稅15%拍板 ==========
  const thread2 = await insertThread(
    'news',
    '台美關稅15%拍板 半導體232最惠國待遇',
    '台美貿易談判結果出爐\n\n重點：\n- 對等關稅15%不疊加\n- 半導體232條款最優惠待遇\n- 台灣企業自主投資2500億美元\n- 政府信保2500億美元\n\n總共5000億美元投資美國\n學者擔心一半都是半導體\n未來3-5年台灣經濟會受衝擊\n\n但政府說是「台灣模式」\n跟日韓出資給美國不同',
    '名無しさん',
    36
  );
  await insertReply(thread2, '5000億美元是什麼概念\n台灣一年GDP才多少', '名無しさん', 35);
  await insertReply(thread2, '>>2 大概15兆台幣\n分好幾年投資啦', '名無しさん', 34);
  await insertReply(thread2, '說是台灣模式\n實際上就是被川普逼的吧', '名無しさん', 33);
  await insertReply(thread2, '半導體去美國設廠\n工程師要跟著去嗎', '名無しさん', 32);
  await insertReply(thread2, '>>4 台積電亞利桑那已經在招人了\n待遇聽說很好', '業界人士', 31);
  await insertReply(thread2, '>>5 去美國的都後悔\n生活品質差超多', '名無しさん', 30);
  await insertReply(thread2, '重點是232最惠國待遇\n這個其他國家都沒有', '名無しさん', 29);

  // ========== money: 新台幣改版票選 ==========
  const thread3 = await insertThread(
    'money',
    '新台幣改版票選開跑 101跟晶片最熱門',
    '央行開放新台幣改版票選\n12個主題讓你選\n\n目前最熱門的是：\n- 台北101（建築之美）\n- 半導體晶片（科技創新）\n- 石虎黑熊（保育動物）\n\n投完還可以抽馬年套幣\n首日投票人數破萬\n網站一度當機\n\n你們想投什麼？',
    '名無しさん',
    24
  );
  await insertReply(thread3, '101一定要選\n台灣地標就是它', '名無しさん', 23);
  await insertReply(thread3, '>>2 晶片也很有意義\n護國神山放上去很讚', '名無しさん', 22);
  await insertReply(thread3, '石虎超可愛\n希望能讓更多人注意保育', '名無しさん', 21);
  await insertReply(thread3, '我投女性的光輝\n台灣女性運動員超強', '名無しさん', 20);
  await insertReply(thread3, '>>4 戴資穎印上去嗎哈哈', '名無しさん', 19);
  await insertReply(thread3, '現在的鈔票用24年了\n真的該換', '名無しさん', 18);

  // ========== money: 台股32000後怎麼操作 ==========
  const thread4 = await insertThread(
    'money',
    '台股上週跌472點 32000守得住嗎',
    '上週五收32063點\n跌了472點 跌幅1.45%\n成交量9071億\n\n年後開盤破32000\n結果一週就回來測試\n\n法人說關注：\n- Fed降息路徑\n- 關稅政策\n- 美國期中選舉\n\n大家有停利嗎',
    '名無しさん',
    20
  );
  await insertReply(thread4, '我的0050還好\n長期投資不看短線', '名無しさん', 19);
  await insertReply(thread4, '>>2 問題是買在31000的\n現在看起來還是高點', '名無しさん', 18);
  await insertReply(thread4, '川普不確定性太高\n先觀望比較安全', '名無しさん', 17);
  await insertReply(thread4, '台積電法說會說今年資本支出520-560億美元\n這是定心丸', '名無しさん', 16);
  await insertReply(thread4, '>>4 資本支出高不代表股價會漲\n已經反映了', '老韭菜', 15);
  await insertReply(thread4, '年前我就減碼了\n等回檔再進場', '名無しさん', 14);

  // ========== meta: 論壇建議 ==========
  const thread5 = await insertThread(
    'meta',
    '可以新增圖片上傳功能嗎',
    '現在發文只能貼連結\n如果能直接上傳圖片會方便很多\n\n我知道有容量跟審核問題\n但至少可以考慮一下？\n\n或是支援主流圖床的預覽也行',
    '名無しさん',
    28
  );
  await insertReply(thread5, '支持\n每次都要先傳imgur很麻煩', '名無しさん', 27);
  await insertReply(thread5, '>>2 +1\n而且imgur現在要登入才能傳', '名無しさん', 26);
  await insertReply(thread5, '站方可能沒那麼多伺服器空間\n圖片很佔資源', '名無しさん', 25);
  await insertReply(thread5, '至少可以做圖片預覽吧\n點連結還要跳出去', '名無しさん', 24);
  await insertReply(thread5, '>>4 YouTube連結已經有預覽了\n圖片應該也做得到', '名無しさん', 23);

  // ========== meta: 手機版體驗 ==========
  const thread6 = await insertThread(
    'meta',
    '手機版的字好像太小了',
    '用iPhone看這個站\n字體有點吃力\n\n尤其是回覆區塊\n密密麻麻的\n\n可以調大一點嗎\n或是讓用戶自己設定字體大小',
    '眼睛痛',
    32
  );
  await insertReply(thread6, '我也覺得\n尤其晚上看很累', '名無しさん', 31);
  await insertReply(thread6, '>>2 開夜間模式啊\n有夜間模式嗎？', '名無しさん', 30);
  await insertReply(thread6, '手機可以自己放大吧\n雙指縮放', '名無しさん', 29);
  await insertReply(thread6, '>>4 那樣排版會跑掉', '名無しさん', 28);
  await insertReply(thread6, '建議站方可以參考Dcard的行動版\n閱讀體驗很好', '名無しさん', 27);

  // ========== news: 中配立委就職爭議 ==========
  const thread7 = await insertThread(
    'news',
    '中配立委李貞秀2/3就職 國安疑慮引發討論',
    '民眾黨不分區立委李貞秀\n原籍中國 後來歸化台灣\n2/3要就職立委了\n\n但她還沒出具放棄中國國籍證明\n有人擔心她可能要服從中國的「國家情報法」\n\n這會不會有國安問題？',
    '名無しさん',
    22
  );
  await insertReply(thread7, '這不是早就知道的事嗎\n怎麼現在才在吵', '名無しさん', 21);
  await insertReply(thread7, '>>2 因為要就職了啊\n這時候不講什麼時候講', '名無しさん', 20);
  await insertReply(thread7, '中國的國家情報法超恐怖\n中國公民有配合情報工作的義務', '名無しさん', 19);
  await insertReply(thread7, '她不是已經歸化了嗎\n放棄國籍應該只是程序問題', '名無しさん', 18);
  await insertReply(thread7, '>>4 但中國不承認放棄啊\n他們覺得你永遠是中國人', '名無しさん', 17);
  await insertReply(thread7, '民眾黨的審查機制是不是有問題', '名無しさん', 16);

  // ========== news: 馬年換新鈔 ==========
  const thread8 = await insertThread(
    'news',
    '馬年換新鈔2/9開跑 百元鈔每人限100張',
    '央行公布2026馬年換新鈔時程\n\n時間：2/9（一）至2/13（五）\n地點：7家銀行+中華郵政\n\n百元新鈔最搶手\n每人限換100張\n\n記得帶身分證\n不然白跑一趟',
    '名無しさん',
    16
  );
  await insertReply(thread8, '每年都搶百元鈔\n紅包用最體面', '名無しさん', 15);
  await insertReply(thread8, '>>2 現在都用轉帳了吧\n誰還包現金', '年輕人', 14);
  await insertReply(thread8, '長輩還是喜歡拿實體紅包啦\n儀式感', '名無しさん', 13);
  await insertReply(thread8, '限100張是不是太少\n大家族要包很多', '名無しさん', 12);
  await insertReply(thread8, '>>4 可以多跑幾家銀行啊', '名無しさん', 11);
  await insertReply(thread8, '今年是馬年\n馬上有錢！', '名無しさん', 10);

  console.log('討論串新增完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
