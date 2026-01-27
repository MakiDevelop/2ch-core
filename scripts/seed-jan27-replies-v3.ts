#!/usr/bin/env tsx
/**
 * 2026/1/27 回覆補充腳本 v3
 * 為回覆數少的討論串補充自然回覆
 * 目標討論串：844, 849, 1154, 1218, 1304, 1436, 1569, 1608, 4096, 4109
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
  console.log('開始補充回覆...');

  // === 844: 分手後多久才能釋懷？(love) ===
  // 已有回覆：848(同病相憐), 847(轉移注意力), 846(斷捨離), 845(一半交往時間), 980(十年後心境不同)
  await insertReply(844, '>>845 一半交往時間這個說法我聽過\n交往兩年的話一年才能走出來\n聽起來很絕望但真的差不多', '名無しさん', 2.5);
  await insertReply(844, '最有效的方法是認識新的人\n不一定要交往 但接觸新的圈子\n你會發現世界很大', '名無しさん', 2);
  await insertReply(844, '>>846 刪照片我做不到...\n那是美好的回憶\n我只是把對話紀錄封存了', '名無しさん', 1.5);
  await insertReply(844, '原po加油\n時間真的是最好的良藥\n我花了兩年才走出來\n但現在回想覺得那段經歷讓我成長很多', '過來人', 1);

  // === 849: 28歲了，家人一直催結婚 (love) ===
  // 已有回覆：854(自己決定), 853(家人不這麼想), 852(28還好), 851(應對高手), 850(同感)
  await insertReply(849, '我32了都還沒結\n28真的不用急\n你的人生又不是親戚的', '名無しさん', 2);
  await insertReply(849, '>>851 我都說「對象在路上了」\n親戚就不會再問了', '名無しさん', 1.5);
  await insertReply(849, '現在台灣平均初婚年齡\n男生32 女生30\n28根本還早', '名無しさん', 1);
  await insertReply(849, '過年的時候最可怕\n今年我直接出國避難', '名無しさん', 0.5);

  // === 1154: 只要一直反問，就永遠不用做決定 (work) ===
  // 已有回覆：1155(爛人同事), 1268(超多), 1269(主管), 1279(很累), 1294(看破手腳)
  await insertReply(1154, '這不就是我前主管嗎\n開會兩小時全部都在反問\n最後說「好 那你先做一版出來看看」', '名無しさん', 2);
  await insertReply(1154, '>>1269 我也是 他每次都說「你覺得呢」\n後來我學會先給答案再問他同不同意\n強迫他做決定', '名無しさん', 1.5);
  await insertReply(1154, '這種人升遷反而最快\n因為從來不會犯錯\n畢竟從來沒做過決定', '名無しさん', 1);

  // === 1218: 是不是該轉行了 (tech) ===
  // 已有回覆：1225(做得過Google?), 1276(怒), 1281(可是google做得到), 1283(有新意), 1299(抄功能)
  await insertReply(1218, '工程師變成要自己找需求\n這真的很扯\n你乾脆自己創業算了', '名無しさん', 2);
  await insertReply(1218, '>>1299 哈哈哈 老闆看到什麼就要抄什麼\n完全不管背後的團隊規模差多少', '名無しさん', 1.5);
  await insertReply(1218, 'AI蔥油餅 可以\n用GPT生成食譜 自動化揉麵\n這才是真正的AI落地應用', '名無しさん', 1);
  await insertReply(1218, '認真說 如果公司不重視工程師的意見\n真的可以看看外面的機會\n現在AI人才很搶手', '名無しさん', 0.5);

  // === 1304: 假日不要回報Bug好嗎 (work) ===
  // 已有回覆：1318(週五報bug), 1319(週一要修好), 1320(假裝沒看到), 1357(超爛), 1414(對不起)
  await insertReply(1304, '我已經學會假日把Line通知關掉了\n世界瞬間美好', '名無しさん', 2);
  await insertReply(1304, '>>1320 資深就是不一樣\n菜鳥時期真的不敢不回', '名無しさん', 1.5);
  await insertReply(1304, '最氣的是叫你自己翻LINE整理\n他報bug連截圖都沒有\n只有一句「壞了」', '名無しさん', 1);
  await insertReply(1304, '我們公司用Jira\n規定是：假日發現bug寫ticket\n工程師週一看\n\n你們那個用LINE報bug也太原始了', '名無しさん', 0.5);

  // === 1436: 年終獎金怎麼分配比較好 (money) ===
  // 已有回覆：1497(6:3:1), 1498(先還債), 1499(全部存), 1530(預備金), 1532(0050)
  await insertReply(1436, '兩個月年終是哪家公司\n我們才1.2個月 唉', '名無しさん', 2);
  await insertReply(1436, '>>1497 6:3:1不錯\n但我覺得要先確保有3-6個月的緊急預備金\n之後再投資', '名無しさん', 1.5);
  await insertReply(1436, '>>1532 問就是0050 笑死\n但認真講大盤ETF長期真的穩', '名無しさん', 1);
  await insertReply(1436, '先犒賞自己\n一整年辛苦了\n不花點錢對不起自己', '享樂主義者', 0.5);

  // === 1569: 台股站穩3萬點，32K在望？(money) ===
  // 已有回覆：1570(AI帶動), 1571(32K不是夢), 1572(護國神山), 1573(權重太高), 1574(0050)
  await insertReply(1569, '連CNBC都來採訪了\n台股真的是世界注目焦點', '名無しさん', 2);
  await insertReply(1569, '>>1573 台積電權重確實太高\n跌一根大家都要哭', '名無しさん', 1.5);
  await insertReply(1569, '現在進場的話Q1要小心\n投顧說可能會有類似去年3、4月的震盪', '名無しさん', 1);
  await insertReply(1569, '出口連26個月正成長\n基本面是真的好\n但估值也不便宜了', '名無しさん', 0.5);

  // === 1608: 高通推Snapdragon X2 Plus (tech) ===
  // 已有回覆：1609(佈局), 1610(邊緣AI), 1611(隱私), 1612(X Elite), 1613(續航)
  await insertReply(1608, 'ARM架構的筆電越來越成熟了\n微軟這次真的有在推\n不像RT那時候半死不活', '名無しさん', 2);
  await insertReply(1608, '>>1613 續航確實猛 但軟體相容性還是最大問題\n很多專業軟體都不支援', '名無しさん', 1.5);
  await insertReply(1608, '邊緣AI最大的應用場景\n我覺得是工廠跟醫療\n延遲低又不用上傳敏感資料', '名無しさん', 1);

  // === 4096: 拜託出暗色模式 (meta) ===
  // 已有回覆：4097(+1), 4098(瀏覽器插件), 4099(CSS改改就好), 4100(跟隨系統), 4101(省電)
  await insertReply(4096, '同意\n純白底配亮螢幕晚上真的很刺眼\nOLED還會燒螢幕', '名無しさん', 2);
  await insertReply(4096, '>>4099 CSS改改就好+1\n用CSS variable換色很快\n開發者應該很快就能做', '名無しさん', 1.5);
  await insertReply(4096, '推推這個需求\n暗色模式是2026年的基本功能了', '名無しさん', 1);

  // === 4109: 匿名論壇還是需要某種身份機制嗎 (meta) ===
  // 已有回覆：4110(匿名自由), 4111(同串ID), 4112(IP hash), 4113(洗版問題), 4114(匿名核心)
  await insertReply(4109, '>>4112 原來有IP hash啊\n但使用者看不到的話等於沒有\n至少讓同串能分辨不同人吧', '名無しさん', 2);
  await insertReply(4109, '2ch那種同串ID制度最棒\n不用註冊 但同一串裡知道誰是誰\n討論品質會好很多', '名無しさん', 1.5);
  await insertReply(4109, '>>4114 同意 匿名是核心\n但匿名不代表不能有最基本的辨識\n同串ID跟匿名不衝突', '名無しさん', 1);

  console.log('回覆補充完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
