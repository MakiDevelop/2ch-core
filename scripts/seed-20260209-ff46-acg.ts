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
  console.log('開始新增 FF46 開拓動漫祭討論串...');

  // ===== Thread 1: FF46 總回顧 =====
  const t1 = await insertThread(
    'acg',
    'FF46三天結束了 今年花博根本被擠爆',
    '剛從FF46回來 腿已經不是我的了\n花博爭艷館連續三天（2/6-2/8）人潮爆滿\n今年邀請了えなこ、伊織萌、東雲うみ、月海一堆神級coser\n排隊買場刊就排了40分鐘 進場又排\n\n最扯的是週六那天 coser拍照區整個變成領域展開\n一堆人舉手機舉相機 根本看不到前面\nhttps://game.ettoday.net/article/3115401.htm\nETtoday這篇寫得蠻完整的\n\n有人三天都去嗎？分享一下心得',
    '名無しさん',
    30
  );
  await insertReply(t1, '三天全勤報到 第一天還好 第二天開始根本戰場\n日本coser的攤位前面排到走廊外面去了', '場次常客', 28);
  await insertReply(t1, '>>1\n我只去了週六 光排えなこ的簽名就排了兩小時\n不過拿到簽名的時候覺得值得ＱＱ', '名無しさん', 26);
  await insertReply(t1, '今年場刊+三日電子票套組400元 cp值蠻高的\n不過裡面吃的東西貴到靠北 一個飯糰要80', '名無しさん', 24);
  await insertReply(t1, '>>3\n所以老手都自己帶糧食進去啊 場內飲食是盤子價', '名無しさん', 22);
  await insertReply(t1, '有人注意到今年企業攤的規模變好大嗎\nVTuber攤位也一堆 箱箱TheBox那邊超熱鬧', '名無しさん', 20);
  await insertReply(t1, '週日最後一天人少一點 反而逛得最舒服\n場外coser拍照也比較不用排隊', '名無しさん', 18);
  await insertReply(t1, '明年FF47是8月吧？已經開始期待了\n希望能邀更多日本coser來', 'ACG難民', 15);

  // ===== Thread 2: えなこ Enako 專串 =====
  const t2 = await insertThread(
    'acg',
    'えなこ（Enako）FF46現場也太猛了吧',
    'えなこ本人出現在花博的時候 整個場館瞬間暴動\n被粉絲圍成超大一圈 新聞說像「領域展開」真的沒誇張\n\n她IG有放一些台灣場的照片：\nhttps://www.instagram.com/enakorin/\n\n日本最強coser果然不是叫假的\n年收過億日圓的女人 氣場完全不一樣\n\n有拍到現場照的嗎？我被擠到後面什麼都看不到',
    'えなこ推し',
    28
  );
  await insertReply(t2, '有拍到！但是距離太遠 放大都糊了\n她那天cos的角色超還原 但人太多我看不清楚是哪個角色', '名無しさん', 26);
  await insertReply(t2, '>>1\nえなこ的X也有發文感謝台灣粉絲\nhttps://x.com/enako_cos\n她說很開心能來台灣 下次還想再來', '名無しさん', 25);
  await insertReply(t2, '我朋友凌晨四點就去排了 排到第一批進場\n說近距離看本人 皮膚好到不像真人', '名無しさん', 23);
  await insertReply(t2, '>>3\n凌晨四點www 這就是愛吧', '名無しさん', 22);
  await insertReply(t2, 'えなこ年收過億不是傳說 她現在已經超越單純coser的範疇了\n上綜藝節目、拍雜誌、代言遊戲 根本全方位藝人', '名無しさん', 20);
  await insertReply(t2, '她之前FF45也有來 但FF46的人潮明顯又更多了\n台灣coser市場真的在成長', '名無しさん', 18);
  await insertReply(t2, '隔壁伊織萌的攤位也是排爆\n這次日本coser陣容真的頂', '名無しさん', 16);
  await insertReply(t2, '說真的 能在台灣看到這種等級的coser\n以前想都不敢想 現在FF每屆都有 幸福', 'コスプレ愛好者', 14);

  // ===== Thread 3: 伊織萌專串 =====
  const t3 = await insertThread(
    'acg',
    '伊織萌（伊織もえ）FF46攤位心得 角色還原度神了',
    '這次FF46伊織萌是第二天和第三天有攤位\nhttps://x.com/iorimoe_five\n她的推特有更新FF46相關的內容\n\n本人的角色還原度真的超高 而且超親切\n簽名的時候會跟每個粉絲講幾句話 不會趕人\n聽說她是「日本人coser 15年來首次」參加台灣活動的等級\n\n她IG也很好追 照片品質超高：\nhttps://www.instagram.com/moe_five/\n\n有買到她寫真的嗎？',
    '名無しさん',
    27
  );
  await insertReply(t3, '買到了！限定版寫真集超精美\n排了一個半小時 但拿到的時候手在抖', '名無しさん', 25);
  await insertReply(t3, '>>1\n伊織萌的特色就是親和力 不像有些coser有距離感\n她會笑著跟你聊天 雖然語言不通但感覺得到誠意', '名無しさん', 24);
  await insertReply(t3, '她cos的DOA角色真的絕了 身材比例跟遊戲一模一樣\n難怪被說是角色還原度最高的coser之一', '名無しさん', 22);
  await insertReply(t3, '>>3\n她本來就很喜歡FF（Final Fantasy）和DOA\n不是那種為了流量才cos的 是真愛玩家', '名無しさん', 20);
  await insertReply(t3, '題外話 她的WorldCosplay頁面作品超多\nhttps://worldcosplay.net/en/member/moe_five\n每個角色都超用心', '名無しさん', 18);
  await insertReply(t3, '有人知道她下次還會來台灣嗎？\nFF47拜託再邀請她', 'もえ推し', 16);

  // ===== Thread 4: 東雲うみ專串 =====
  const t4 = await insertThread(
    'acg',
    '東雲うみ FF46也太可愛了吧 整個人在發光',
    '東雲うみ（Shinonome Umi）這次也來FF46了\nIG粉絲74萬不是蓋的 本人比照片還漂亮\nhttps://www.instagram.com/umi_portrait/\n\n她除了coser身份以外 還是YouTuber跟寫真偶像\n多才多藝的類型 在日本超有人氣\n\n現場排隊的人也是超多 不輸えなこ的區域\n有人有拍到好照片嗎？分享一下',
    '名無しさん',
    26
  );
  await insertReply(t4, '東雲うみ本人真的超美 照片根本沒修圖的必要\n而且她在台灣好像有不少粉絲 現場聽到好多人喊她名字', '名無しさん', 24);
  await insertReply(t4, '>>1\n她的TikTok也很好看 推一波\nhttps://www.tiktok.com/@shinonome_umi\n日常影片看了會心情變好', '名無しさん', 22);
  await insertReply(t4, '我是在FF45的時候認識她的 這次FF46特地衝第二天來看\n感覺她的知名度在台灣越來越高了', '名無しさん', 20);
  await insertReply(t4, '東雲うみ跟伊織萌風格不太一樣\n伊織萌是性感路線 東雲比較清新可愛\n兩個都讚', '名無しさん', 18);
  await insertReply(t4, '>>4\n各有各的好 不用比較啦\n能同時在台灣看到兩位就是賺到', '名無しさん', 16);
  await insertReply(t4, '她的寫真在日本賣超好的 台灣好像也買得到\n博客來有進一些', '名無しさん', 14);

  // ===== Thread 5: FF46 coser 排行/比較串 =====
  const t5 = await insertThread(
    'acg',
    'FF46這次日本coser陣容太豪華 來排個名',
    '這次FF46來的日本coser根本全明星陣容：\n\n- えなこ（Enako）：日本coser天花板 年收破億\n- 伊織萌（Iori Moe）：角色還原度之神\n- 東雲うみ（Shinonome Umi）：清新派代表\n- 月海：實力派新星\n\n我自己的排名是 えなこ > 伊織萌 > 東雲うみ > 月海\n純個人喜好 不接受戰wwww\n\n你們覺得呢？',
    '名無しさん',
    25
  );
  await insertReply(t5, '排名這種東西很主觀啦\n不過えなこ確實是另一個等級的 知名度和商業價值都是最高', '名無しさん', 23);
  await insertReply(t5, '>>1\n我覺得伊織萌比えなこ可愛\n但えなこ的氣場確實無人能敵', '名無しさん', 21);
  await insertReply(t5, '東雲うみ的粉絲路過 她不需要跟別人比\n每個coser都有自己的風格和魅力', '名無しさん', 19);
  await insertReply(t5, '>>3\n推這個 比來比去沒意思\n能一次看到這麼多大咖就該偷笑了', '名無しさん', 17);
  await insertReply(t5, '月海也很厲害好嗎 不要忽略她\n她的妝容技術我覺得是四個裡面最強的', '月海推し', 15);
  await insertReply(t5, '你們忘了台灣本土coser也很強\n這次場外看到好多台灣coser水準超高\n不用什麼都只看日本的', '名無しさん', 13);
  await insertReply(t5, '>>6\n同意 台灣coser圈近幾年進步超多\n技術和創意都不輸日本了', '名無しさん', 11);

  // ===== Thread 6: FF46 攝影心得 =====
  const t6 = await insertThread(
    'acg',
    'FF46拍照心得 帶了A7IV去結果差點被擠壞',
    '第一次帶單眼去FF 結果人多到我後悔\n在coser拍照區被前後夾擊 差點摔機\n\n不過拍到幾張えなこ跟伊織萌的遠景\n可惜東雲うみ那邊更誇張 完全擠不進去\n\n建議明年要去的人：\n1. 帶小台一點的機身 無反比單眼方便\n2. 望遠鏡頭是必備（70-200至少）\n3. 第一天人最少 要拍照首日去\n4. 穿好走的鞋 三天下來腳會廢掉\n\n有人用手機拍到好照片的嗎？現在手機拍照也很猛了',
    'カメラ小僧',
    24
  );
  await insertReply(t6, '手機黨表示 iPhone 16 Pro Max的5倍光學變焦意外好用\n拍遠處的coser不會糊', '名無しさん', 22);
  await insertReply(t6, '>>1\n帶70-200去人擠人真的很hardcore\n我帶35mm定焦 只能拍旁邊的台灣coser 反而效果不錯', '名無しさん', 20);
  await insertReply(t6, '拍照要注意禮節啊 有些coser不喜歡被偷拍\n拍之前問一下是基本禮貌', '名無しさん', 18);
  await insertReply(t6, '>>3\n這個很重要 尤其是台灣的coser\n日本來的通常有經紀人管 但台灣的就是自己在cosplay 要尊重人家', '名無しさん', 16);
  await insertReply(t6, '我都用Pixel 9 Pro拍 AI修圖超方便\n拍完直接發IG 不用後製', '名無しさん', 14);

  // ===== Thread 7: FF46 戰利品串 =====
  const t7 = await insertThread(
    'acg',
    'FF46戰利品開箱 錢包已死',
    '三天加起來花了快兩萬...\n\n戰利品清單：\n- えなこ限定寫真集 x1\n- 伊織萌簽名板 x1\n- 東雲うみ寫真 x2\n- 同人誌 x8\n- 各種周邊吊飾 x ???（已失去計數能力）\n\n最貴的是えなこ的限定寫真 但真的超值\n印刷品質好到不行\n\n大家花了多少？曬一下戰利品',
    '散財童子',
    22
  );
  await insertReply(t7, '兩萬算客氣了吧\n我朋友光同人誌就買了三萬多 回家被女友罵到臭頭', '名無しさん', 20);
  await insertReply(t7, '>>1\n伊織萌的簽名板好羨慕！排多久拿到的？', '名無しさん', 18);
  await insertReply(t7, '我就買了場刊跟幾本同人誌\n加起來不到兩千 窮人的FF46', '名無しさん', 16);
  await insertReply(t7, '>>3\n重點是體驗不是花錢啦 去感受氣氛也很棒\n不用每個攤位都掃貨', '名無しさん', 14);
  await insertReply(t7, '東雲うみ的寫真品質如何？考慮去博客來補貨', '名無しさん', 12);
  await insertReply(t7, '>>5\n超推 紙質跟印刷都是日本水準\n而且她的攝影師很會拍 每張都像藝術照', '名無しさん', 10);

  console.log('完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
