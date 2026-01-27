#!/usr/bin/env tsx
/**
 * 2026/1/27 Poller 第二輪測試
 * 為各版塊新增討論串，用於測試 poller 機制
 * 基於 2026/1/27 真實時事
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
  console.log('Poller 第二輪測試 - 開始新增討論串...');

  // === meta 站務 (44串，最少) ===

  // 1. 夜間模式
  const t1 = await insertThread('meta', '拜託加個夜間模式 半夜刷論壇眼睛快瞎了',
    '每天半夜睡不著就會來逛\n白底黑字在暗房間真的超刺眼\n\n手機有開護眼模式但還是不夠\n希望站方可以考慮加個深色主題\n\n其他論壇幾乎都有了\n應該是2026年基本功能吧',
    '夜貓子', 3);
  await insertReply(t1, '超需要+1\n我都開到最暗還是覺得亮', '名無しさん', 2.5);
  await insertReply(t1, '對眼睛真的不好\n尤其這站的白色特別亮', '名無しさん', 2);
  await insertReply(t1, '站長看到了幫加一下\n黑底白字就好不用很花俏', '名無しさん', 1.5);
  await insertReply(t1, '先暫時用瀏覽器外掛Dark Reader擋一下', '前端仔', 1);
  await insertReply(t1, '>>4 有用過 但有些排版會跑掉\n還是原生支援最好', '名無しさん', 0.5);

  // 2. 圖片上傳
  const t2 = await insertThread('meta', '可以支援圖片上傳嗎 純文字有點寂寞',
    '我知道這站主打匿名文字討論\n但有時候想貼個圖說明一下\n\n比如說問3C問題貼個截圖\n或是分享食物照片\n\n不一定要像imgur那樣\n簡單的圖片功能就好',
    '名無しさん', 5);
  await insertReply(t2, '有圖片的話會不會變成另一個PTT圖文版', '名無しさん', 4.5);
  await insertReply(t2, '2ch本來就沒有圖片啊\n想看圖去futaba', '老鄉民', 4);
  await insertReply(t2, '外連imgur就好了\n站內存圖的話伺服器成本會爆炸', '名無しさん', 3);
  await insertReply(t2, '>>3 說的也是\n存圖很花錢的', '名無しさん', 2.5);
  await insertReply(t2, '我覺得純文字有純文字的好\n想像力無限大', '名無しさん', 2);

  // === work 職場 (48串) ===

  // 3. 最低工資29500
  const t3 = await insertThread('work', '基本工資29500 離三萬只差500了',
    '2026年基本工資調到29500\n時薪196\n\n距離三萬大關只差500\n明年應該就過了\n\n但說實在的 29500在雙北\n扣完房租水電根本活不下去\n\n物價漲得比薪水快太多了',
    '社畜', 4);
  await insertReply(t3, '29500扣勞健保實拿更少\n大概27000出頭', '名無しさん', 3.5);
  await insertReply(t3, '10年前基本工資才兩萬出頭\n漲了快一萬結果生活水準沒變', '名無しさん', 3);
  await insertReply(t3, '時薪196 打工族至少有進步\n以前120的日子回不去了', '名無しさん', 2.5);
  await insertReply(t3, '>>1 雙北基本上要35000以上才能活\n29500只是法定最低 不是舒適最低', '名無しさん', 2);
  await insertReply(t3, '企業主不意外又在喊撐不住了\n每次調都喊 結果還不是照賺', '名無しさん', 1.5);

  // 4. AI搶工作
  const t4 = await insertThread('work', '公司導入AI之後砍了1/3的人 我是下一個嗎',
    '我們是做行銷的小公司\n老闆最近導入AI工具之後\n發現很多文案、設計初稿AI都能做\n\n上個月直接砍了三個人\n現在剩下的人要扛更多\n\n我負責的數據分析也快被取代\n每天上班都很焦慮\n\n有人也遇到類似的嗎',
    '即將失業', 6);
  await insertReply(t4, '我做翻譯的 去年就被砍了\n現在在學寫程式轉職', '名無しさん', 5.5);
  await insertReply(t4, 'AI只是工具 會用AI的人取代不會用的人\n趕快學起來', '名無しさん', 5);
  await insertReply(t4, '>>2 這句話聽到爛了\n但事實就是公司要的是更便宜的', '名無しさん', 4.5);
  await insertReply(t4, '數據分析其實還好\n要有判讀能力和業務理解AI做不到', '資料分析師', 4);
  await insertReply(t4, '我覺得真正危險的是純執行層\n需要創意和判斷力的暫時安全', '名無しさん', 3);
  await insertReply(t4, '老闆最開心 又省錢又不用管人\n科技始終來自於資本家的貪婪', '名無しさん', 2);

  // === love 感情 (48串) ===

  // 5. 離婚率
  const t5 = await insertThread('love', '台灣離婚率亞洲第二 半數婚姻撐不過8年',
    '看到內政部的數據嚇到\n2024年離婚53469對\n粗離婚率2.28‰ 亞洲第二\n\n40-44歲離婚最多\n半數婚姻平均壽命只有8.3年\n\n結婚到底是為了什麼\n難道真的只是一張紙嗎',
    '名無しさん', 7);
  await insertReply(t5, '8.3年 七年之癢果然不是說說的', '名無しさん', 6.5);
  await insertReply(t5, '現代人更重視自我了\n婚姻不合就離 沒什麼不好', '名無しさん', 6);
  await insertReply(t5, '>>2 有小孩的話就不只是兩個人的事了', '名無しさん', 5);
  await insertReply(t5, '我身邊結婚的朋友\n10對有3對已經離了\n比例真的高', '名無しさん', 4.5);
  await insertReply(t5, '與其不幸福地維持婚姻\n不如好聚好散\n對小孩也比較好', '過來人', 4);
  await insertReply(t5, '所以才越來越多人選擇不婚\n看到這數據更不想結了', '名無しさん', 3);

  // 6. 母胎單身
  const t6 = await insertThread('love', '35歲母胎單身 是我的問題嗎',
    '35歲了 從來沒有交過男朋友\n不是沒有機會 但每次都覺得不適合\n\n朋友都結婚了 有的小孩都上幼稚園了\n過年回家一定又要被問\n\n其實一個人也過得不錯\n但偶爾還是會想 是不是我太挑了',
    '名無しさん', 8);
  await insertReply(t6, '35歲母胎單身的人比你想像的多\n統計說35-39歲未婚快五成了', '名無しさん', 7.5);
  await insertReply(t6, '不是你的問題\n只是還沒遇到對的人而已', '名無しさん', 7);
  await insertReply(t6, '一個人過得好是能力\n不用勉強自己迎合別人', '名無しさん', 6);
  await insertReply(t6, '>>1 過年被問最煩\n我都直接說沒有然後轉移話題', '同病相憐', 5.5);
  await insertReply(t6, '你覺得自己過得好就好\n外人的眼光不重要\n結婚也不保證幸福', '名無しさん', 5);

  // === life 生活/負能量 (49串) ===

  // 7. 土方之亂
  const t7 = await insertThread('life', '土方之亂 工地全部停擺 裝潢也跟著延期',
    '2026年新制要求土方車全裝GPS跟填電子聯單\n結果業者全部反彈\n一堆工地直接停工\n\n我家裝潢也因為這樣延期了\n建材進不來 廢棄物出不去\n\n政府的用意是好的\n但一刀切太急了吧',
    '等裝潢的人', 5);
  await insertReply(t7, '我也被影響到\n本來年前要搬新家的 現在不知道什麼時候', '名無しさん', 4.5);
  await insertReply(t7, '高雄美濃那個盜挖農田的案子太誇張\n所以才要加強管制', '名無しさん', 4);
  await insertReply(t7, '>>2 管制是對的 但執行方式要更細緻\n不能讓整個產業都停擺', '名無しさん', 3.5);
  await insertReply(t7, '1/14內政部已經開記者會了\n說要簡化流程 增加暫置場', '名無しさん', 3);
  await insertReply(t7, '台灣就是這樣\n出事才管 管了就一刀切\n然後再慢慢修', '名無しさん', 2);

  // 8. Honnold爬101的感想
  const t8 = await insertThread('life', '看完Honnold爬101突然覺得自己的煩惱好小',
    '昨天看Netflix直播\nAlex Honnold徒手爬台北101\n91分鐘 508公尺 沒有繩索\n\n中間他耳機斷線 用音樂找節奏\n到頂端的時候街上所有人都在歡呼\n\n看完之後突然覺得\n我每天煩的那些事情好渺小\n這人真的是在用生命做熱愛的事',
    '名無しさん', 4);
  await insertReply(t8, '我也看了直播 手一直在流汗\n他怎麼那麼冷靜', '名無しさん', 3.5);
  await insertReply(t8, '508公尺 往下看就是死\n這種心理素質不是人類等級的', '名無しさん', 3);
  await insertReply(t8, '>>1 他老婆在底下看的畫面更感人\n那種信任真的很強大', '名無しさん', 2.5);
  await insertReply(t8, '101的竹節結構是最難的部分\n往外傾斜 光想就怕', '名無しさん', 2);
  await insertReply(t8, '看完之後我也覺得\n明天上班好像也沒那麼可怕了', '社畜', 1.5);

  // === money 金錢/投資 (49串) ===

  // 9. 台積電2nm
  const t9 = await insertThread('money', '台積電2nm量產倒數 目標價喊到2000',
    '各家投顧對台積電2026年超樂觀\n2nm量產進度順利的話\n目標價區間1500~1900\n最樂觀的喊到2000以上\n\nAI需求持續爆發\n蘋果高通AMD都要搶產能\n\n手上有台積的繼續抱？\n還是先獲利了結等回檔',
    '散戶', 6);
  await insertReply(t9, '台積電就是信仰\n張忠謀說過的 跟著護國神山走', '名無しさん', 5.5);
  await insertReply(t9, '>>1 但也不要ALL IN\n分散一下比較安全', '名無しさん', 5);
  await insertReply(t9, '2nm量產最快下半年\n上半年應該還是靠3nm撐', '半導體業', 4);
  await insertReply(t9, '我去年600買的 現在翻倍了\n該不該賣一半鎖利潤', '名無しさん', 3.5);
  await insertReply(t9, '>>4 賣一半是最穩的做法\n至少不會全賠', '名無しさん', 3);
  await insertReply(t9, '川普關稅是最大風險\n萬一對台灣半導體課稅就GG', '名無しさん', 2);

  // 10. 存款vs投資
  const t10 = await insertThread('money', '月薪35K 到底該先存錢還是先投資',
    '剛出社會半年 月薪35K\n扣完房租水電吃飯\n大概剩8000-10000\n\n這點錢要存起來還是丟去投資\n存銀行利息少得可憐\n但投資又怕賠\n\n版上的前輩有什麼建議嗎',
    '社會新鮮人', 7);
  await insertReply(t10, '先存三到六個月的緊急預備金\n再開始投資', '名無しさん', 6.5);
  await insertReply(t10, '8000定期定額買0050或006208\n每月自動扣款 不要管漲跌', '名無しさん', 6);
  await insertReply(t10, '>>2 這是最正確的做法\n時間是你最大的優勢', '名無しさん', 5);
  await insertReply(t10, '先把信用卡帳單清掉\n如果有的話\n利息比什麼投資報酬都高', '名無しさん', 4.5);
  await insertReply(t10, '我25歲開始定期定額\n現在30歲帳上已經有80萬了\n真的要趁早', '名無しさん', 4);
  await insertReply(t10, '>>5 五年80萬 每月投多少？', '名無しさん', 3);

  // === gossip 娛樂/八卦 (50串) ===

  // 11. Honnold花絮
  const t11 = await insertThread('gossip', 'Honnold爬101的Netflix直播 收視破紀錄了吧',
    'Netflix直播Honnold徒手爬台北101\n全球190國同步\n邀請Mark Rober跟WWE的Seth Rollins解說\n\n台灣時間1/25早上9點開始\n91分鐘就登頂了\n\n台北街頭200多人在現場集氣\n登頂那刻大家都在尖叫\n\n這是台灣被全世界看到的一天',
    '名無しさん', 8);
  await insertReply(t11, '190國同步直播\n台北101直接變成全球焦點', '名無しさん', 7);
  await insertReply(t11, 'Mark Rober解說超有趣\n用科學角度分析每個動作的物理', '名無しさん', 6.5);
  await insertReply(t11, '>>1 本來是美國鄉民在看\n現在全世界都知道台北101了', '名無しさん', 6);
  await insertReply(t11, '我住附近 那天早上出門嚇到\n怎麼一堆人在看天', '信義區居民', 5);
  await insertReply(t11, '有人有注意他穿紅色上衣黃色攀岩鞋嗎\n顏色搭配意外的好看', '名無しさん', 4);

  // 12. 三義連環追撞
  const t12 = await insertThread('gossip', '台13線三義連環追撞 連警用重機都被撞',
    '今天台13線三義八股路段\n59歲男子追撞前車\n被撞的又追撞前方兩台警用重機\n\n連環追撞\n不知道有沒有人受傷\n\n那段路本來就很容易出事\n彎道多又快',
    '名無しさん', 2);
  await insertReply(t12, '警用重機也被撞\n那不就是公務車輛被毀損', '名無しさん', 1.5);
  await insertReply(t12, '三義那邊的路真的很危險\n假日車又多', '苗栗人', 1);
  await insertReply(t12, '59歲未注意車前狀況\n老人駕駛的問題又來了', '名無しさん', 0.8);
  await insertReply(t12, '>>3 不要一竿子打翻\n年輕人滑手機出事的也很多', '名無しさん', 0.5);

  // === tech 科技 (50串) ===

  // 13. 主權AI
  const t13 = await insertThread('tech', '台灣要搞主權AI了 到底什麼意思',
    '看到新聞說政府要推主權AI\n說是為了資安防護跟國家競爭力\n\n所以是自己訓練大語言模型的意思？\n還是只是把伺服器放在台灣？\n\n有沒有懂的人解釋一下\n感覺很厲害但不太懂實際內容',
    '名無しさん', 6);
  await insertReply(t13, '主權AI主要是指\n關鍵AI基礎設施由國家自主掌控\n包括算力、資料、模型都不依賴外國', '資工系', 5.5);
  await insertReply(t13, '法國跟德國也在搞這個\n不想被美國大廠綁死', '名無しさん', 5);
  await insertReply(t13, '>>1 台灣有台積電的晶片\n但軟體這塊還是差很多', '名無しさん', 4);
  await insertReply(t13, '國科會有推TAIDE\n不知道後續發展怎樣了', '名無しさん', 3.5);
  await insertReply(t13, '資安是最重要的考量\n不然所有資料都在OpenAI的伺服器上\n等於把國家機密交出去', '名無しさん', 3);

  // 14. 半導體搶人才
  const t14 = await insertThread('tech', '矽谷搶能源專才 AI跟國防帶動新一波挖角',
    '看到報導說矽谷因為AI跟國防產業\n現在最缺的不是工程師\n而是能源專才\n\n資料中心太耗電了\n需要大量懂電力系統的人\n\n台灣的電力工程師\n會不會也被國際挖角',
    '名無しさん', 5);
  await insertReply(t14, '資料中心的用電量真的誇張\n一個大型中心等於一個小城市', '名無しさん', 4.5);
  await insertReply(t14, 'AI泡沫破了之後\n這些能源投資怎麼辦', '名無しさん', 4);
  await insertReply(t14, '>>2 AI不是泡沫\n是真的在改變生產力的技術', '名無しさん', 3.5);
  await insertReply(t14, '台灣自己的電都不夠了\n還要蓋資料中心？', '名無しさん', 3);
  await insertReply(t14, '核能議題遲早要重新討論\n沒有穩定大量的電力\nAI產業發展不起來', '名無しさん', 2);

  // === news 時事 (52串) ===

  // 15. 總預算卡關
  const t15 = await insertThread('news', '115年總預算還在卡 行政院長親自出來喊話',
    '今年度的中央政府總預算還沒過\n已經1月底了\n\n卓榮泰上火線要求立法院趕快審\n民眾黨列了13項優先法案\n包含TPASS月票、公保生育給付等\n\n國家運作沒有預算是要怎麼做事\n藍白綠都有責任',
    '名無しさん', 5);
  await insertReply(t15, '沒有預算\n很多公共建設都卡住了', '公務員', 4.5);
  await insertReply(t15, 'TPASS一定要保住\n通勤族的命啊', '名無しさん', 4);
  await insertReply(t15, '每年都在吵預算\n政治人物能不能做點正事', '名無しさん', 3.5);
  await insertReply(t15, '>>2 TPASS是近年最有感的政策\n千萬不能砍', '通勤族', 3);
  await insertReply(t15, '行政院不是可以用暫行預算嗎\n怎麼搞到現在', '名無しさん', 2);

  // 16. ICE執法爭議
  const t16 = await insertThread('news', '美國ICE開槍射殺白人女駕駛 全美抗議',
    '美國移民暨海關執法局的人\n在明尼蘇達州執法的時候\n開槍射殺一名白人女性駕駛\n\n結果引發好幾個城市的抗議\n\n川普的移民政策越來越激進\n連美國公民都被波及了',
    '名無しさん', 9);
  await insertReply(t16, '連自己國民都射殺\n這已經不是移民問題了', '名無しさん', 8);
  await insertReply(t16, 'ICE的權力太大了\n幾乎沒有監督機制', '名無しさん', 7);
  await insertReply(t16, '>>1 被射殺的是白人\n如果是少數族裔可能根本不會上新聞', '名無しさん', 6);
  await insertReply(t16, '川普第二任真的比第一任還猛\n什麼事都做得出來', '名無しさん', 5);
  await insertReply(t16, '美國的人權燈塔已經熄了', '名無しさん', 4);

  // === acg ACG/遊戲 (50串) ===

  // 17. Netflix紀錄片帶動
  const t17 = await insertThread('acg', 'Netflix拍Honnold爬101 紀錄片也能做得這麼熱血',
    '剛看完Netflix的Skyscraper Live\n紀錄片居然可以這麼刺激\n\n中間穿插他的訓練過程\n還有他怎麼跟台北101團隊協調路線\n\n結合科學解說跟即時直播\n這個企劃真的猛\n\n有人知道還有什麼類似的極限紀錄片嗎',
    '名無しさん', 4);
  await insertReply(t17, 'Free Solo啊\n就是他之前爬El Capitan的\n奧斯卡最佳紀錄片', '名無しさん', 3.5);
  await insertReply(t17, 'Dawn Wall也很好看\n講Tommy Caldwell攀登黎明牆', '名無しさん', 3);
  await insertReply(t17, '14 Peaks\nNirmal Purja的14座八千米\n也是Netflix上的', '名無しさん', 2.5);
  await insertReply(t17, '>>1 推The Alpinist\n講Marc-André Leclerc\n看完會哭', '名無しさん', 2);
  await insertReply(t17, '極限運動紀錄片看完都會反思人生\n我在幹嘛', '名無しさん', 1);

  // === chat 綜合閒聊 (82串) ===

  // 18. 過年倒數
  const t18 = await insertThread('chat', '距離過年還有兩週 你們準備好被拷問了嗎',
    '再兩週就過年了\n\n每年固定被問：\n交男/女朋友了嗎\n薪水多少\n什麼時候結婚\n什麼時候生小孩\n\n今年打算怎麼應付\n有人分享一下話術嗎',
    '怕過年', 3);
  await insertReply(t18, '我今年直接說值班不回去了\n花錢買自由', '名無しさん', 2.5);
  await insertReply(t18, '>>1 這招我用過\n結果親戚說初二再來\n根本躲不掉', '名無しさん', 2);
  await insertReply(t18, '反問回去就好了\n叔叔你股票賺多少\n馬上安靜', '名無しさん', 1.5);
  await insertReply(t18, '>>3 這招好用 但會被長輩記恨', '名無しさん', 1);
  await insertReply(t18, '戴著耳機裝沒聽到\n低頭滑手機就好', '躺平族', 0.5);

  console.log('Poller 第二輪測試 - 討論串新增完成！共18個討論串。');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
