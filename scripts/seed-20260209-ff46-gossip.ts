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
  console.log('開始新增 FF46 gossip 版八卦串...');

  // ===== Thread 1: えなこ年收破億 coser怎麼這麼賺 =====
  const t1 = await insertThread(
    'gossip',
    'えなこ年收破億日圓 Coser到底怎麼這麼賺',
    'FF46剛結束 來八卦一下えなこ的收入\n\n<iu>https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/AKIBAYABAI_2022_Enako_%2852496435212%29.jpg/960px-AKIBAYABAI_2022_Enako_%2852496435212%29.jpg</iu>\n\n這女人連續三年年收超過一億日圓（約2300萬台幣）\n經紀人爆料年商其實是兩億 一半歸公司一半歸她\n\n收入來源：\n- 企業代言案 70%（同時接7-8家）\n- 寫真集自費出版 20%（一次Comiket賣一千萬日圓）\n- YouTube/直播/聲優/其他 10%\n\nhttps://www.nikkan-gendai.com/articles/view/geino/363993\n日刊Gendai有詳細報導\n\n重點是她錢包居然是用塑膠袋裝現金\n完全不帶皮夾 有夠反差www\n\ncoser真的能賺這麼多嗎 還是只有她這種頂層的才行',
    '名無しさん',
    29
  );
  await insertReply(t1, '一億日圓只有她啦 一般coser能養活自己就偷笑了\nえなこ是cosplay界的大谷翔平 不能拿來當常態\n\n<iu>https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/AKIBAYABAI_2022_Enako_%2852496435317%29.jpg/960px-AKIBAYABAI_2022_Enako_%2852496435317%29.jpg</iu>\n這張也太美', '名無しさん', 27);
  await insertReply(t1, '>>1\n她已經不是單純的coser了吧\n上綜藝節目、配音、代言遊戲 根本全方位藝人\n只是起點是cosplay而已', '名無しさん', 25);
  await insertReply(t1, '塑膠袋裝現金也太好笑了\n年收一億的女人用塑膠袋www\n這反差萌也是她的賣點之一吧', '名無しさん', 23);
  await insertReply(t1, '台灣的coser有人能到這個等級嗎？\n感覺市場規模差太多 日本畢竟是動漫大國', '名無しさん', 21);
  await insertReply(t1, '>>4\n台灣頂層的coser接案也有年收百萬台幣的\n但跟えなこ比確實差一個量級\n不過台灣市場這幾年成長很快 未來難說', '名無しさん', 19);
  await insertReply(t1, '她男友是職業電競選手けんき\n2021年文春爆料之後兩人直接公開認了\n人生勝利組就是不一樣', '名無しさん', 17);
  await insertReply(t1, '>>6\n她公開交往那天 日本宅男崩潰超多\n但年收一億的女人誰管你崩不崩潰wwww', '名無しさん', 15);
  await insertReply(t1, '認真說 她的商業策略很聰明\n自費出版寫真不用經過出版社 利潤全拿\n又有企業代言的穩定收入 風險分散得很好', '業界人', 13);

  // ===== Thread 2: yunocy FF46 性感明日香 =====
  const t2 = await insertThread(
    'gossip',
    'yunocy在FF46穿緊身衣版明日香 現場直接暴動',
    '不知道大家有沒有注意到這次FF46除了えなこ伊織萌之外\n還有一個叫yunocy的日本coser也來了\n\n<iu>https://lifenews.com.tw/wp-content/uploads/2026/02/S__82534439_0.jpg</iu>\n\n她cos了EVA的明日香 而且是「緊身衣版本」\n現場圍觀的人牆比えなこ那邊還誇張\n\nhttps://news.nextapple.com/entertainment/20260207/AD73B66E6526B5AC1D6314E6A24F46D0\n壹蘋有報導\n\n她IG有50萬粉 被封為「現象級性感女神」\n而且這已經是她第三次來台灣了\n之前台北電玩展也來過 說台灣粉絲讓她印象超深刻\n\n還有推出「1分鐘拍攝互動券」 可以近距離合照或手機錄影\n這商業模式也太猛了吧',
    '名無しさん',
    27
  );
  await insertReply(t2, '一分鐘拍攝互動券www 有夠會做生意\n不過粉絲買單就是了 一分鐘跟女神近距離接觸 值', '名無しさん', 25);
  await insertReply(t2, '>>1\n緊身衣版明日香我在現場看到了\n身材真的太誇張 照片完全拍不出那個震撼感\n\n<iu>https://more-news.tw/wp-content/uploads/2026/02/S__82534437_0.webp</iu>', '名無しさん', 23);
  await insertReply(t2, '她說最喜歡台灣的刈包但不敢吃臭豆腐\n很典型的日本人反應www', '名無しさん', 21);
  await insertReply(t2, '每次這種日本coser來台灣 男粉絲都暴動\n但她們回日本就忘了台灣粉絲了啦\n清醒一點好嗎', '名無しさん', 19);
  await insertReply(t2, '>>4\n人家都來第三次了還說忘記？\n而且她自己說SNS都有看台灣粉絲留言\n不要這麼酸好嗎', '名無しさん', 17);
  await insertReply(t2, '桃羽Family也有來 cos絕區零的角色\n第一次海外參展就選台灣 表示台灣市場被重視了\n\n<iu>https://more-news.tw/wp-content/uploads/2026/02/%E6%97%A5%E6%9C%AC%E6%96%B0%E9%8A%B3Coser-3%E4%BA%BA%E7%B5%84_%E6%A1%83%E7%BE%BDFamily.webp</iu>\n桃羽Family三人組', '名無しさん', 15);

  // ===== Thread 3: FF46偷拍爭議 =====
  const t3 = await insertThread(
    'gossip',
    'FF46拍照禮儀又出事了 什麼時候才學得會',
    '每次同人場都有偷拍仔搞事\nFF46也不例外 聽說有人被發現用超廣角偷拍低角度\n被旁邊的人抓到 差點被打\n\n拜託同人場拍照的基本禮儀：\n1. 拍之前要問 不問就拍=偷拍\n2. 不要拍低角度/裙底 這是犯罪\n3. 不要擋住通道一直拍\n4. coser說不行就不行 沒有討價還價的空間\n\n主辦也應該加強巡邏\n不然以後日本coser不敢來台灣怎麼辦',
    '名無しさん',
    26
  );
  await insertReply(t3, '每次場次都有這種老鼠屎\n不過FF的工作人員算處理得還不錯了\n聽說當場就把人架走了', '名無しさん', 24);
  await insertReply(t3, '>>1\n台灣法律對偷拍的罰則太輕了\n妨害秘密最重也才三年 根本不痛不癢\n應該比照韓國加重罰則', '名無しさん', 22);
  await insertReply(t3, '我覺得問題出在場地設計\n花博爭艷館的coser拍照區太開放了\n應該設置圍欄跟專門的攝影區', '名無しさん', 20);
  await insertReply(t3, '推一個 日本C104的拍照規範就做得很好\n有專門的攝影師證制度 濫拍直接終身禁入\n台灣場次可以參考', '名無しさん', 18);
  await insertReply(t3, '>>4\n台灣的同人場規模跟Comiket不能比啦\n但至少可以從身分登記開始做\n偷拍仔最怕被記錄身分', '名無しさん', 16);
  await insertReply(t3, '是說 日本coser來台灣好像都會特別交代工作人員注意這個\n可能是之前就有不好的經驗吧', '名無しさん', 14);
  await insertReply(t3, '有些coser自己會帶保鑣或朋友在旁邊盯\n這不該是她們的責任 但現實就是這樣\n希望環境能慢慢改善', '名無しさん', 12);

  // ===== Thread 4: 伊織萌 vs えなこ 誰才是coser一姐 =====
  const t4 = await insertThread(
    'gossip',
    '伊織萌跟えなこ到底誰比較紅 八卦一下',
    '趁FF46熱度還在 來戰一下\n\n<iu>https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/AKIBAYABAI_2022_Enako_%2852496435477%29.jpg/960px-AKIBAYABAI_2022_Enako_%2852496435477%29.jpg</iu>\n↑ えなこ\n\nえなこ：\n- 年收破億 商業價值最高\n- 男友是電競選手けんき（2021公開）\n- 日本內閣府Cool Japan大使\n- SNS粉絲290萬+\n\n<iu>https://upload.wikimedia.org/wikipedia/commons/2/27/Moe_Iori_standing%2C_front_view_%2852710197695%29.jpg</iu>\n↑ 伊織萌\n\n伊織萌：\n- 角色還原度公認最強\n- 跟前男友交往10年被爆料\n- 親和力高 粉絲互動好\n- 被說是「更衣人偶」現實版\n\n兩個人路線完全不同\nえなこ走商業化藝人路線\n伊織萌走職人coser路線\n\n你們選誰？',
    '名無しさん',
    25
  );
  await insertReply(t4, 'えなこ的商業成就無人能敵\n但如果純論cosplay的品質 伊織萌更強\n看你要比什麼', '名無しさん', 23);
  await insertReply(t4, '>>1\n「更衣人偶現實版」太好笑了\n不過伊織萌確實是真愛玩家 她玩DOA跟FF不是裝的\n\n<iu>https://upload.wikimedia.org/wikipedia/commons/8/87/Comic_Market_94_Day_1_Cosplayers_%2842244870270%29.jpg</iu>\nC94的時候拍的 角色還原度真的高', '名無しさん', 21);
  await insertReply(t4, '不用比啦 兩個人都是頂層了\n硬要比的話 えなこ贏在知名度 伊織萌贏在專業度\n各有各的市場', '名無しさん', 19);
  await insertReply(t4, '伊織萌交往10年被爆料那件事\n日本網友說根本就是「更衣人偶」劇情重現\nhttps://www.sohu.com/a/526414809_100129097\n不過人家私生活管我們什麼事', '名無しさん', 17);
  await insertReply(t4, '>>4\n真的 每次有coser被爆戀愛 粉絲就崩潰\n人家也是普通人啊 交男朋友很正常好嗎', '名無しさん', 15);
  await insertReply(t4, 'えなこ公開交往之後人氣反而沒掉\n反而因為上更多綜藝節目知名度更高了\n說明她的粉絲已經不只是宅男了', '名無しさん', 13);
  await insertReply(t4, '我推東雲うみ 清新派才是正義\n不需要走性感路線也能有人氣', '東雲推し', 11);

  // ===== Thread 5: FF46 coser經濟學 =====
  const t5 = await insertThread(
    'gossip',
    'FF46的coser經濟到底多大 算給你看',
    '認真分析一下FF46的coser經濟規模\n\n門票收入：\n場刊+三日電子票套組400元\n假設三天共6萬人次 = 2400萬\n\n攤位收入：\n超過1000個社團參展 攤位費平均約3000-5000\n= 300-500萬\n\n消費支出：\n平均每人場內消費估2000元\n6萬人次 x 2000 = 1.2億\n\n日本coser出場費（推測）：\nえなこ等級可能一場50-100萬台幣\n其他日本coser 10-30萬\n光請coser可能就花了300-500萬\n\n結論：FF46三天的經濟規模保守估計超過1.5億台幣\n動漫產業真的不是鬧著玩的',
    '名無しさん',
    24
  );
  await insertReply(t5, '這些數字看起來合理\n不過你沒算到周邊的餐飲、交通、住宿\n如果算上外溢效應 可能接近3億', '名無しさん', 22);
  await insertReply(t5, '>>1\nえなこ一場50-100萬？認真的嗎\n她在日本一場企業活動出場費就是百萬日圓起跳\n台灣可能更高因為要加海外出差費', '名無しさん', 20);
  await insertReply(t5, '所以你知道為什麼每年FF都越辦越大了吧\n有利可圖 主辦、參展者、周邊商家都在賺', '名無しさん', 18);
  await insertReply(t5, '>>3\n不只是商業利益 FF也推動了台灣的同人創作文化\n有些台灣繪師就是從FF起家 現在在日本都有案子接', '名無しさん', 16);
  await insertReply(t5, '1.2億消費支出應該還是保守了\n我身邊朋友三天花兩三萬的一堆\n不過也有只逛不買的就是了', '散財仔', 14);
  await insertReply(t5, '台灣政府應該更重視ACG產業\n日本Cool Japan政策搞了多少年了\n台灣還在那邊討論動漫是不是正經文化', '名無しさん', 12);

  console.log('完成！新增 5 個 gossip 版 FF46 八卦串');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
