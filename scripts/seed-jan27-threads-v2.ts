#!/usr/bin/env tsx
/**
 * 2026/1/27 時事種子腳本 v2
 * 補充稀缺版塊：meta, money, love, life, acg, news, gossip
 * 基於 2026/1/27 搜尋到的真實時事
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
  console.log('開始新增討論串...');

  // === news 時事/政治 ===

  // 1. 北捷無差別攻擊事件
  const t1 = await insertThread('news', '北捷台北車站攻擊事件 4死11傷',
    '27歲張姓嫌犯在北捷台北車站M7出口丟煙霧彈\n然後持刀無差別攻擊\n之後跑到中山站繼續砍人\n最後衝進百貨公司墜樓身亡\n\n含嫌犯共4死11傷\n\n台灣治安到底怎麼了',
    '名無しさん', 8);
  await insertReply(t1, '看到新聞整個人雞皮疙瘩\n怎麼又是捷運...', '名無しさん', 7);
  await insertReply(t1, '無差別攻擊真的防不勝防\n每次搭捷運都會怕', '通勤族', 6.5);
  await insertReply(t1, '>>2 我現在搭捷運都會觀察周圍的人\n特別是拿大包包的', '名無しさん', 6);
  await insertReply(t1, '煙霧彈到底哪來的\n這東西一般人能買到？', '名無しさん', 5.5);
  await insertReply(t1, '嫌犯才27歲 到底發生什麼事\n讓他走到這一步', '名無しさん', 5);
  await insertReply(t1, '願傷者早日康復\nRIP', '名無しさん', 4);

  // 2. Alex Honnold 攀登101
  const t2 = await insertThread('news', 'Alex Honnold 徒手攀登台北101 Netflix拍攝',
    '那個徒手攀岩的瘋子 Honnold\n居然來爬台北101了\n\nNetflix有拍他老婆的視角\n據說全場安靜到不行\n\n中間耳機還斷線 他用Tool的音樂找節奏\n\n太猛了吧',
    '名無しさん', 10);
  await insertReply(t2, '等等 徒手攀101？\n這合法嗎', '名無しさん', 9);
  await insertReply(t2, '>>1 有申請啦 不是偷爬\nNetflix紀錄片企劃', '名無しさん', 8.5);
  await insertReply(t2, '看Free Solo就覺得這人不是人\n現在來爬101 台灣被看到了', '名無しさん', 8);
  await insertReply(t2, 'Tool的音樂配攀岩 這畫面也太帥', '搖滾仔', 7);
  await insertReply(t2, '他老婆看著他爬一定超緊張\n我光看影片手就在冒汗', '名無しさん', 6);

  // 3. 美國空襲委內瑞拉
  const t3 = await insertThread('news', '川普直接空襲委內瑞拉抓走馬杜羅 太扯了吧',
    '美國直接空襲委內瑞拉首都\n把馬杜羅夫妻抓走押送紐約出庭\n\n馬杜羅說自己被綁架是無辜的\n\n2026年也太瘋了吧\n這跟電影一樣',
    '名無しさん', 12);
  await insertReply(t3, '美國佬又在玩世界警察了', '名無しさん', 11);
  await insertReply(t3, '>>1 馬杜羅本來就是獨裁者\n但這樣直接綁也太誇張', '名無しさん', 10.5);
  await insertReply(t3, '國際法呢？主權呢？\n直接空襲一個國家首都抓總統', '名無しさん', 10);
  await insertReply(t3, '以後川普看誰不爽就直接抓？', '名無しさん', 9);
  await insertReply(t3, '委內瑞拉人民其實很開心吧\n馬杜羅搞到國家都破產了', '名無しさん', 8);

  // === money 金錢/投資 ===

  // 4. 台股站穩3萬 投顧看法
  const t4 = await insertThread('money', '投顧共識：台股3萬點只是地板',
    '永豐投顧說台股2026年目標往上移\n預期全年獲利年增兩成以上\n\n各家投顧罕見共識：3萬只是低標\n爭的是會走到哪裡、怎麼走上去\n\n上週五又創新高了\n世芯、川湖資金一直灌\n\n大家覺得呢',
    '名無しさん', 9);
  await insertReply(t4, '投顧喊多的時候就該小心了\n記得2022年嗎', '名無しさん', 8);
  await insertReply(t4, '>>1 但這次有AI基本面在撐\n跟之前不一樣', '名無しさん', 7.5);
  await insertReply(t4, '台積電2nm要量產了\n不看好都難', '名無しさん', 7);
  await insertReply(t4, '我倒是怕川普的關稅\n第一季搞不好就噴一波回檔', '名無しさん', 6);
  await insertReply(t4, '問就是定期定額0050\n其他不管', '佛系投資', 5);

  // 5. 比特幣ETF在台灣
  const t5 = await insertThread('money', '台灣終於有含比特幣的ETF了',
    '富邦景氣循環多元資產組合基金\n1/19拿到核准\n是首檔涵蓋比特幣ETF投資的基金\n\n台灣這方面真的慢很多\n美國都不知道幾檔了\n\n有人打算買嗎',
    '名無しさん', 7);
  await insertReply(t5, '終於\n等了好久', '幣圈韭菜', 6);
  await insertReply(t5, '比特幣這種波動\n放在組合基金裡佔比應該很小吧', '名無しさん', 5.5);
  await insertReply(t5, '直接去交易所買就好了幹嘛買ETF\n手續費被扒兩層', '名無しさん', 5);
  await insertReply(t5, '>>3 有些人不想自己管錢包\n放基金比較安心', '名無しさん', 4.5);
  await insertReply(t5, '台灣金管會一直在擋\n能過就不錯了', '名無しさん', 4);

  // 6. 威力彩7.7億
  const t6 = await insertThread('money', '威力彩連26摃 下期頭獎7.7億',
    '天啊又沒人中\n已經連續26期摃龜\n頭獎獎金累積到7.7億\n\n7.7億欸 可以直接退休\n明天一定要去買\n\n大家有什麼明牌',
    '做夢的人', 5);
  await insertReply(t6, '7.7億扣稅大概拿5億多\n夠用了', '名無しさん', 4.5);
  await insertReply(t6, '我每次都買100塊\n連200都沒中過', '名無しさん', 4);
  await insertReply(t6, '>>2 你不孤單', '名無しさん', 3.5);
  await insertReply(t6, '中了第一件事是什麼\n我先想好：辭職', '名無しさん', 3);
  await insertReply(t6, '>>4 我要先睡三天再說', '社畜', 2);

  // === love 感情/兩性 ===

  // 7. 2026約會趨勢
  const t7 = await insertThread('love', 'Tinder報告：2026年流行直球戀愛',
    '看到Tinder年度報告\n2026四大趨勢：\n\n1. clear-coding（直球戀愛）\n2. hot-take dating（敢言約會）\n3. emotional vibe coding（共感同頻）\n4. friendfluence（朋友影響力）\n\n64%的人覺得約會需要更多情感誠實\n60%希望表達意圖能更清楚\n\n所以以後不能已讀不回了？',
    '名無しさん', 8);
  await insertReply(t7, '直球戀愛？台灣人做得到嗎\n我覺得大家還是很愛曖昧', '名無しさん', 7);
  await insertReply(t7, '已讀不回就是答案啊\n這也算很直球了吧', '名無しさん', 6.5);
  await insertReply(t7, '>>2 殘酷的事實', '名無しさん', 6);
  await insertReply(t7, '朋友影響力也太真實\n每次約會完都要跟閨蜜報告', '名無しさん', 5);
  await insertReply(t7, '42%的人說朋友對感情有重大影響\n這我信 我朋友比我還緊張', '名無しさん', 4);

  // 8. 唐綺陽2026感情運勢
  const t8 = await insertThread('love', '唐綺陽：射手今年桃花最旺 天秤婚姻受考驗',
    '唐綺陽2026預測出來了\n\n射手桃花最強 單身脫單機率很高\n白羊有宿命感戀情\n天秤婚姻可能受到考驗\n\n巨蟹容易辦公室戀情\n雙魚開始看經濟條件 不只看浪漫了\n摩羯很想結婚\n\n各位什麼星座 準不準',
    '名無しさん', 6);
  await insertReply(t8, '射手+1 目前單身\n所以今年有望？', '名無しさん', 5.5);
  await insertReply(t8, '天秤已婚 看到受考驗有點怕', '名無しさん', 5);
  await insertReply(t8, '唐綺陽的一定要信\n她準到我覺得恐怖', '名無しさん', 4.5);
  await insertReply(t8, '雙魚看經濟條件好現實\n但也長大了吧', '名無しさん', 4);
  await insertReply(t8, '>>3 你確定不是confirmation bias', '名無しさん', 3);

  // === life 生活/負能量 ===

  // 9. 物價壓力
  const t9 = await insertThread('life', '薪水漲的速度永遠追不上物價',
    '主計處說CPI才1.66%\n但我去菜市場買菜\n怎麼覺得什麼都漲了\n\n便當從80漲到100\n飲料從40漲到55\n房租更不用說\n\n官方數字跟實際感受差太多了吧\n到底是誰在平均',
    '菜市場阿桑', 7);
  await insertReply(t9, '雞排以前35 現在75\n翻倍了', '名無しさん', 6);
  await insertReply(t9, 'CPI把3C跟通訊費算進去\n那些一直在降價 所以被平均了\n\n但你不能每天吃手機啊', '名無しさん', 5.5);
  await insertReply(t9, '>>2 笑死 吃手機', '名無しさん', 5);
  await insertReply(t9, '實質薪資根本在下降\n名目漲 但購買力跌', '名無しさん', 4.5);
  await insertReply(t9, '等等你便當才100？哪裡\n我這邊已經120起跳了', '台北人', 4);
  await insertReply(t9, '>>5 台北以外的世界很大的', '名無しさん', 3);

  // 10. 駕照新制
  const t10 = await insertThread('life', '考駕照要取消是非題了？還有機車路考',
    '2026年起汽機車筆試全面取消是非題\n2027年10月還要試辦機車道路駕駛考驗\n\n現在機車考照已經很多人過不了了\n加上路考會不會更難\n\n不過台灣道路安全確實要改善\n太多三寶了',
    '剛考到駕照', 9);
  await insertReply(t10, '早該這樣了\n是非題根本送分 背答案就過', '名無しさん', 8);
  await insertReply(t10, '機車路考+1\n日本跟歐洲早就有了', '名無しさん', 7);
  await insertReply(t10, '但台灣的道路設計對機車超不友善\n先改道路再改考照吧', '名無しさん', 6);
  await insertReply(t10, '>>3 兩個一起做不好嗎', '名無しさん', 5);
  await insertReply(t10, '考照難是好事\n我覺得現在路上的機車騎士\n一半以上需要重考', '名無しさん', 4);

  // === acg ACG/遊戲 ===

  // 11. 2026冬季新番
  const t11 = await insertThread('acg', '2026冬季新番55部 你追什麼',
    '1月新番表出來了\n一共55部\n新作39部 續作16部\n\n漫改36部 小說改17部\n奇幻23 動作19 冒險15\n\n數量也太多了吧\n大家打算追哪些\n\n我先說 我追續作為主 穩',
    '名無しさん', 10);
  await insertReply(t11, '55部wwww\n就算不睡覺也看不完', '名無しさん', 9);
  await insertReply(t11, '續作比較安全\n新作開頭好看最後爛尾的太多了', '名無しさん', 8);
  await insertReply(t11, '奇幻23部是不是太多了\n能不能來點別的題材', '名無しさん', 7);
  await insertReply(t11, '每季都說要追10部\n最後能追完3部就偷笑了', '名無しさん', 6);
  await insertReply(t11, '>>4 我上季追了2部就放棄了\n工作太忙', '社畜', 5);

  // 12. 買動漫實體店
  const t12 = await insertThread('acg', '「買動漫」台北車站旗艦店開了',
    '買動漫在台北車站M6出口附近開實體店了\n1/2開幕的\n\n有書店區、展覽區、主題咖啡區\n\n假日11:00~21:30\n平日12:00~21:00\n\n有人去過了嗎 好逛嗎',
    '名無しさん', 11);
  await insertReply(t12, '開幕那天人超多的\n排了一個小時才進去', '名無しさん', 10);
  await insertReply(t12, '咖啡區有主題飲品嗎\n想知道值不值得去', '名無しさん', 9);
  await insertReply(t12, 'M6出口很好找\n我上週去過了 空間還不錯', '名無しさん', 8);
  await insertReply(t12, '>>1 人真的多 假日建議平日去', '名無しさん', 7);
  await insertReply(t12, '實體店在這年代還能開\n代表ACG市場真的有需求', '名無しさん', 6);

  // 13. 巴哈姆特創作大賽
  const t13 = await insertThread('acg', '巴哈姆特2026 ACG創作大賽開始投稿了',
    '巴哈ACG創作大賽開始了\n截止日5/20\n\n動畫、漫畫、遊戲都能投\n年度最大的原創徵稿活動\n\n有在創作的人可以試試\n去年的得獎作品水準都很高',
    '名無しさん', 6);
  await insertReply(t13, '每年都想參加\n每年都只是想想', '拖延症', 5);
  await insertReply(t13, '去年遊戲組冠軍真的猛\n一個人做的', '名無しさん', 4);
  await insertReply(t13, '5/20截止 還有時間\n今年要動起來了', '名無しさん', 3.5);
  await insertReply(t13, '>>1 我也是哈哈\n想法很多 手跟不上', '名無しさん', 3);

  // === gossip 娛樂/八卦 ===

  // 14. 全台免費營養午餐
  const t14 = await insertThread('gossip', '全台18縣市跟進免費營養午餐 政策買票？',
    '台北市帶頭推免費營養午餐之後\n基隆、台中、高雄都跟了\n到1/9已經18個縣市確定推\n\n有人說是好政策\n有人說是選前撒幣\n\n你們覺得呢\n孩子的午餐應該免費嗎',
    '名無しさん', 8);
  await insertReply(t14, '給小孩吃飯有什麼好吵的\n又不是什麼大錢', '名無しさん', 7);
  await insertReply(t14, '>>1 問題是錢從哪來\n排擠其他教育預算怎麼辦', '名無しさん', 6.5);
  await insertReply(t14, '日本早就全國免費營養午餐了\n而且吃得很好', '名無しさん', 6);
  await insertReply(t14, '重點是品質\n不要為了省錢給小孩吃爛東西', '家長', 5);
  await insertReply(t14, '>>2 少買一架戰鬥機就夠了', '名無しさん', 4);
  await insertReply(t14, '不管動機是什麼\n孩子能吃飽就好', '名無しさん', 3);

  // 15. 川普健康疑雲
  const t15 = await insertThread('gossip', '川普手背出現暗紫色瘀青 79歲了',
    '川普在瑞士出席國際場合\n被攝影師拍到左手背有很明顯的暗紫色瘀青\n\n他都79歲了\n健康狀況一直被外界關注\n\n感覺很多事都是硬撐在做\n美國不擔心嗎',
    '名無しさん', 11);
  await insertReply(t15, '79歲還當總統\n美國人也是厲害', '名無しさん', 10);
  await insertReply(t15, '拜登那時候也是 走路都搖搖晃晃\n美國政壇是養老院嗎', '名無しさん', 9);
  await insertReply(t15, '手背瘀青老人家很常見啦\n血管脆弱', '名無しさん', 8);
  await insertReply(t15, '>>3 是沒錯 但這是世界上最有權力的人\n健康不透明很可怕', '名無しさん', 7);
  await insertReply(t15, '他還在空襲委內瑞拉 精力很好啊（', '名無しさん', 6);

  // === meta 站務 ===

  // 16. 手機版優化
  const t16 = await insertThread('meta', '手機版滑動有時候會卡卡的',
    '用iPhone滑論壇\n偶爾會有一點lag\n特別是圖片多的討論串\n\n不知道是不是圖片loading的問題\n還是渲染的關係\n\n整體來說很順 只是偶爾卡一下',
    '名無しさん', 5);
  await insertReply(t16, '我也有這個問題\n圖多的時候特別明顯', '名無しさん', 4);
  await insertReply(t16, '可能是圖片沒有lazy loading\n一次載入太多', '前端工程師', 3.5);
  await insertReply(t16, 'Android也會 不是只有iPhone', '名無しさん', 3);
  await insertReply(t16, '>>2 lazy loading應該可以改善\n開發者看到的話幫修一下', '名無しさん', 2);

  // 17. 台中房仲吸金
  const t17 = await insertThread('news', '台中房仲吸金23億 被起訴求重刑',
    '台中房仲葉仁豪\n吸金23億多被台中檢方起訴\n\n23億欸...\n到底怎麼騙這麼多人\n受害者也太多了吧\n\n投資一定要小心\n天下沒有白吃的午餐',
    '名無しさん', 6);
  await insertReply(t17, '23億 我這輩子看都沒看過這數字', '名無しさん', 5);
  await insertReply(t17, '保證獲利的都是騙子\n這句話講了幾十年還是有人上當', '名無しさん', 4.5);
  await insertReply(t17, '房仲業應該要有更嚴格的監管', '名無しさん', 4);
  await insertReply(t17, '>>2 人就是貪啊\n不然詐騙不會年年創新高', '名無しさん', 3);

  console.log('討論串新增完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
