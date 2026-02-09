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
  let count = 0;

  // === 12218: 台股封關 (money, 5 replies → +3) ===
  await insertReply(12218, '我全部出了 過年就是要安心\n年後再看情勢進場也不遲', '名無しさん', 8);
  await insertReply(12218, '>>5\n瑞銀的報告看看就好 去年他們也喊AI起飛\n結果下半年一堆AI股腰斬', '名無しさん', 6);
  await insertReply(12218, '每年封關前都有人問一樣的問題www\n答案永遠是「看你抱不抱得住」', '名無しさん', 4);
  count += 3;

  // === 12230: 華為昇騰晶片 (tech, 5 replies → +3) ===
  await insertReply(12230, '>>5\n口氣那麼衝幹嘛 人家擔心風險也是正常的\n地緣政治本來就是不確定因素', '名無しさん', 7);
  await insertReply(12230, '昇騰的 CANN 框架其實進步蠻快的\n但開發者生態跟 CUDA 比還是差一個世代\n短期內搶不走輝達的客戶', '半導體仔', 5);
  await insertReply(12230, '說到底 美國禁到最後\n只是讓中國更有動力自己做\n禁不完的', '名無しさん', 3);
  count += 3;

  // === 12271: 台美關稅 (news, 5 replies → +3) ===
  await insertReply(12271, '>>5\n美國米真的有可能\n日本當年也是被逼開放稻米市場的', '名無しさん', 7);
  await insertReply(12271, '鄭麗君還蠻適合這種場合的\n至少比之前派去的那些人有談判力', '名無しさん', 5);
  await insertReply(12271, '農業犧牲是一定的 問題是政府會不會補償農民\n如果只是嘴巴說照顧 實際放生 那就完了', '名無しさん', 3);
  count += 3;

  // === 12389: 直球戀愛 (love, 5 replies → +4) ===
  await insertReply(12389, '>>5\n對啊 你直球了結果對方繼續曖昧\n那不是更痛苦', '名無しさん', 7);
  await insertReply(12389, '我上次直球告白被發好人卡\n然後隔天她跟別人在一起了\n從此不相信直球這種東西', '受傷的人', 5);
  await insertReply(12389, '>>7\n拍拍 但至少你知道結果了\n比曖昧半年然後發現人家有對象好多了', '名無しさん', 3);
  await insertReply(12389, '我覺得重點不是直球不直球\n是要看對方有沒有給你信號\n完全沒信號你就衝 那叫唐突不叫直球', '名無しさん', 2);
  count += 4;

  // === 12236: 2026冬番 (acg, 5 replies → +3) ===
  await insertReply(12236, '推一個「迷宮飯」第二季\n第一季好評如潮 第二季應該穩了', '名無しさん', 7);
  await insertReply(12236, '>>5\n三集定律我覺得太武斷了\n有些慢熱型的到中段才好看\n不過57部確實只能靠篩選了', '名無しさん', 5);
  await insertReply(12236, '今年MAPPA和ufotable都有大作\n製作品質應該有保障\n怕的是趕工導致作畫崩壞', '名無しさん', 3);
  count += 3;

  // === 12247: 世紀血案 (gossip, 5 replies → +3) ===
  await insertReply(12247, '台灣影視要進步 版權意識一定要先到位\n不然永遠被人嫌', '名無しさん', 6);
  await insertReply(12247, '>>4\n韓國的真實事件改編至少會把名字改掉\n台灣有些連名字都不改 直接拿來用\n真的是不怕告', '名無しさん', 4);
  await insertReply(12247, '林宅血案是台灣民主運動的傷痛\n拍可以 但要尊重歷史和家屬\n不是拿來消費的素材', '名無しさん', 2);
  count += 3;

  // === 12264: 春節社恐 (life, 6 replies → +3) ===
  await insertReply(12264, '我去年學會一招：戴耳機\n假裝在講電話 親戚就不會來煩你', '名無しさん', 5);
  await insertReply(12264, '>>6\n紅包通膨+1 小時候收的紅包都沒現在包的多\n到底誰發明紅包這種制度的', '名無しさん', 3);
  await insertReply(12264, '最怕的是表弟表妹帶男女朋友回來\n全場焦點轉到你身上：你怎麼還沒有\n真的會社會性死亡', '單身狗', 1);
  count += 3;

  // === 12347: 半導體破兆 (tech, 6 replies → +3) ===
  await insertReply(12347, '破一兆美元聽起來很猛\n但扣掉通膨因素其實成長沒那麼誇張\n不過AI確實是真的在拉動', '名無しさん', 6);
  await insertReply(12347, '>>5\n台積電都這麼高了 現在買風險太大\n不如看看設備股 ASML 那些', '名無しさん', 4);
  await insertReply(12347, '半導體這波行情能撐多久是個問題\n如果AI泡沫跟當年.com一樣\n破掉的時候會很慘', '名無しさん', 2);
  count += 3;

  // === 12515: FF46拍照 (acg, 5 replies → +3) ===
  await insertReply(12515, '>>5\nPixel的AI修圖確實猛 但我覺得有點過度美化了\n拍出來跟本人不太像www', '名無しさん', 6);
  await insertReply(12515, '明年建議帶個小梯子（笑）\n不然後排什麼都看不到\n或是開場第一個小時衝進去 人還沒那麼多', '名無しさん', 4);
  await insertReply(12515, '其實用手機拍反而有個優勢\n舉高拍不用觀景窗 盲拍也能拍到\n單眼就一定要湊到前面才行', '名無しさん', 2);
  count += 3;

  // === 12429: 小將超兇 (acg, 5 replies → +2) ===
  await insertReply(12429, '這遊戲廣告打超兇\n到處都看得到 但實際玩起來就那樣\n跟廣告的玩法完全不一樣www', '名無しさん', 5);
  await insertReply(12429, '>>4\n「小課也能玩」通常是課了才說的\n免費仔的體驗跟課金仔差很多吧', '名無しさん', 3);
  count += 2;

  console.log(`完成！為 10 個討論串補充了 ${count} 則回覆`);
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
