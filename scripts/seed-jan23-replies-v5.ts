#!/usr/bin/env tsx
/**
 * Seed script for 2026-01-23 第五批 - 補充稀缺討論串
 *
 * 基於真實時事：
 * - 讀空氣/KY：日本職場文化「空気を読む」、台灣職場溝通術
 * - 光華商場：持續營運、與三創數位生活園區連通、台北秋葉原
 * - MD版月下夜想曲：開發者Pigsy、2025聖誕節更新、預計2026完成
 * - 移工：台灣移工83萬人創新高、印尼移工佔76.32%、基本工資28,590元
 * - 串流音樂：Spotify 2026年1月漲價、Apple Music無損音質、KKBOX華語最強
 * - 2026九合一選舉：藍白合作談判、蔡壁如表態、三縣市關鍵
 * - 全聯智慧超市：自助結帳機、AI咖啡
 * - LINE表情回應：2025年6月上線、所有表情貼可用
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
     VALUES ($1, $2, $3, $4, $5, NULL, $6, NOW() - INTERVAL '1 hour' * $7)`,
    [content, 0, generateIpHash(), randomUserAgent(), parentId, authorName, hoursAgo]
  );
}

async function boostThreads() {
  console.log('💬 補充稀缺討論串 (2026-01-23 v5)...\n');

  // ========== ID 1292: 不會讀空氣 (meta) ==========
  console.log('  🌬️ #1292 - 不會讀空氣');
  await insertReply(1292, '日本說的KY\n空気が読めない的縮寫', '名無しさん', 8);
  await insertReply(1292, '>>4 台灣比較少用這個詞\n但說「白目」差不多意思', '名無しさん', 7);
  await insertReply(1292, '職場上司說「再考慮一下」\n通常是不滿意的意思', '社畜', 6);
  await insertReply(1292, '>>6 會議中要觀察誰先發言\n這些細節就是「空氣」', '名無しさん', 5);
  await insertReply(1292, '不會讀空氣的人通常沒自覺\n非語言溝通本來就需要敏感度', '名無しさん', 4);
  await insertReply(1292, '安排給不用高社交敏感度的工作\n像資料整理、數據分析之類', 'PM', 3);

  // ========== ID 46: 光華也要走入歷史了嗎 (tech) ==========
  console.log('  🏬 #46 - 光華也要走入歷史了嗎');
  await insertReply(46, '光華數位新天地還在啊\n市民大道三段8號', '名無しさん', 14);
  await insertReply(46, '>>4 2008年遷入新大樓\n七億元打造的六層樓', '名無しさん', 13);
  await insertReply(46, '旁邊有三創數位生活園區\n3、5樓有空橋連通', '名無しさん', 12);
  await insertReply(46, '>>6 八德路那邊整條都是電子街\n算是台灣的秋葉原', 'DIY玩家', 11);
  await insertReply(46, '現在很多轉型賣ACG周邊\n跟秋葉原一樣的趨勢', '名無しさん', 10);
  await insertReply(46, '組電腦還是會去光華逛\n實體看貨比較安心', '名無しさん', 9);

  // ========== ID 43: 月下夜想曲的音樂在MD上 (acg) ==========
  console.log('  🦇 #43 - 月下夜想曲的音樂在MD上');
  await insertReply(43, '你說的是Pigsy做的MD版嗎\n那個同人移植超神', '名無しさん', 10);
  await insertReply(43, '>>4 2025聖誕節有新的試玩版\nBoss歐洛克登場了', 'CV迷', 9);
  await insertReply(43, '開發者說2026年會完成\n可以選阿魯卡德或來須蒼真', '名無しさん', 8);
  await insertReply(43, '>>6 寬螢幕顯示功能也有\n可以模擬器玩或燒錄卡實機', '名無しさん', 7);
  await insertReply(43, '禮拜堂體驗版只有4面\n但操作手感很講究', '名無しさん', 6);
  await insertReply(43, '官方PS4有Castlevania Requiem\n月下+血之輪迴', '名無しさん', 5);

  // ========== ID 366: 今天幫一個移工結帳 (chat) ==========
  console.log('  👷 #366 - 今天幫一個移工結帳');
  await insertReply(366, '台灣移工已經突破83萬人了\n創歷史新高', '名無しさん', 12);
  await insertReply(366, '>>4 印尼移工最多\n佔了76.32%', '名無しさん', 11);
  await insertReply(366, '2025年基本工資調到28,590元\n移工也適用', '名無しさん', 10);
  await insertReply(366, '>>6 家事移工月薪規劃調到2萬\n還在討論中', '名無しさん', 9);
  await insertReply(366, '印尼零付費政策排除台灣了\n不然雇主要負擔10萬', '名無しさん', 8);
  await insertReply(366, '工廠移工很辛苦\n但台灣真的很缺工', '名無しさん', 7);

  // ========== ID 164: 聽歌啦 (chat) ==========
  console.log('  🎵 #164 - 聽歌啦');
  await insertReply(164, 'Spotify歌單推薦演算法最強\n但1月漲價了', '名無しさん', 10);
  await insertReply(164, '>>4 Apple Music有無損音質\n杜比全景聲空間音訊', '音響控', 9);
  await insertReply(164, 'KKBOX華語歌曲最齊全\n台灣本土平台', '名無しさん', 8);
  await insertReply(164, '>>6 YouTube Music可以聽演唱會影片\n跟YT Premium綁一起', '名無しさん', 7);
  await insertReply(164, 'Apple Music對音樂人收益比較好\n每次串流$0.006-0.010', '名無しさん', 6);
  await insertReply(164, '買Apple產品送6個月免費\n算下來蠻划算', '名無しさん', 5);

  // ========== ID 146: 藍白紅什麼時候要相約去死啊 (news) ==========
  console.log('  🗳️ #146 - 藍白紅什麼時候要相約去死啊');
  await insertReply(146, '2026九合一選舉11月28日\n關鍵縣市是新北、宜蘭、嘉義市', '名無しさん', 14);
  await insertReply(146, '>>4 藍白合還在談\n3月前要決定遊戲規則', '名無しさん', 13);
  await insertReply(146, '蔡壁如說國民黨如果欺壓民眾黨\n那就不用談了', '名無しさん', 12);
  await insertReply(146, '>>6 目前藍15席綠5席\n格局短期難改變', '名無しさん', 11);
  await insertReply(146, '民眾黨只剩高虹安的新竹市\n第三黨生存很難', '名無しさん', 10);
  await insertReply(146, '立法院藍白繼續合作\n115年度預算案又在吵', '名無しさん', 9);

  // ========== ID 27: 全聯結帳排隊的人都不會看 (chat) ==========
  console.log('  🛒 #27 - 全聯結帳排隊的人都不會看');
  await insertReply(27, '全聯現在有自助結帳機了\n23.8吋大螢幕', '名無しさん', 16);
  await insertReply(27, '>>4 瑞光社宅那間是智慧超市\n還有AI咖啡機', '名無しさん', 15);
  await insertReply(27, '福利熊語音圖像輔助操作\n阿公阿嬤也會用', '名無しさん', 14);
  await insertReply(27, '>>6 支援福利卡集點\n非現金支付方便', '名無しさん', 13);
  await insertReply(27, '自助結帳是為了顧客自主\n不是為了省人力', '名無しさん', 12);
  await insertReply(27, '選人少的排隊比較快\n但很多人就是不會看', '名無しさん', 11);

  // ========== ID 1220: 左邊那隻一直流汗打字的是什麼動物 (chat) ==========
  console.log('  😅 #1220 - 左邊那隻一直流汗打字的是什麼動物');
  await insertReply(1220, '是貓啦 😹\nParty Parrot那種風格', '名無しさん', 6);
  await insertReply(1220, '>>4 這種動圖meme超多\nDiscord Slack都有', '名無しさん', 5);
  await insertReply(1220, 'LINE現在表情回應可以用所有貼圖\n長按訊息就能用', '名無しさん', 4);
  await insertReply(1220, '>>6 2025年6月上線的功能\n訂閱用戶更爽', '名無しさん', 3);
  await insertReply(1220, 'emoji原本是日本人1999年發明的\n絵文字的羅馬拼音', '名無しさん', 2);
  await insertReply(1220, '流汗打字表示很急很緊張\n社畜日常', '社畜', 1);

  // ========== ID 86: 發現一個很無聊的事實 (chat) ==========
  console.log('  💡 #86 - 發現一個很無聊的事實');
  await insertReply(86, '什麼無聊的事實\n講來聽聽', '名無しさん', 10);
  await insertReply(86, '>>4 我知道一個\n麥當勞的M其實是金拱門', '名無しさん', 9);
  await insertReply(86, '全家的招牌藍綠配色\n跟7-11的橘綠互補', '名無しさん', 8);
  await insertReply(86, '>>6 台灣的便利商店密度世界第二\n僅次於韓國', '名無しさん', 7);
  await insertReply(86, 'QWERTY鍵盤設計是為了防止打字機卡住\n不是最有效率的排列', '名無しさん', 6);
  await insertReply(86, '無聊的冷知識很療癒\n上班偷看剛好', '名無しさん', 5);

  // ========== ID 215: Link Preview 功能讚讚 (meta) ==========
  console.log('  🔗 #215 - Link Preview 功能讚讚');
  await insertReply(215, 'Open Graph meta標籤抓的\n標題描述縮圖', '名無しさん', 12);
  await insertReply(215, '>>4 og:title og:description og:image\n網頁要設定才有', '前端工程師', 11);
  await insertReply(215, '有些網站會擋爬蟲\n預覽就顯示不出來', '名無しさん', 10);
  await insertReply(215, '>>6 Twitter Card也是類似的東西\n社群分享用', '名無しさん', 9);
  await insertReply(215, 'YouTube連結能顯示影片標題\n很方便', '名無しさん', 8);
  await insertReply(215, '這功能做得好\n貼連結有預覽比較好讀', '名無しさん', 7);

  // ========== ID 161: ええ~~~~~~~~~~ (chat) ==========
  console.log('  😲 #161 - ええ~~~~~~~~~~');
  await insertReply(161, '這是日文的「欸～」\n表示驚訝或不敢置信', '名無しさん', 8);
  await insertReply(161, '>>4 動畫裡常聽到\n拖越長越誇張', '名無しさん', 7);
  await insertReply(161, 'ええええええええ\n每多一個え就多一分驚訝', '名無しさん', 6);
  await insertReply(161, '>>6 台語的「蛤～」差不多\n萬用語氣詞', '名無しさん', 5);
  await insertReply(161, '日本人真的很愛用這個\n尤其綜藝節目', '名無しさん', 4);
  await insertReply(161, 'ええ？マジで？\n標準組合技', '名無しさん', 3);

  // ========== ID 135: YouTube 連結 (chat) ==========
  console.log('  📺 #135 - YouTube 連結');
  await insertReply(135, '貼YouTube連結會有預覽\n很方便', '名無しさん', 10);
  await insertReply(135, '>>4 oEmbed API抓的\n標題縮圖都有', '名無しさん', 9);
  await insertReply(135, '年代久遠的影片有時會被刪\n連結就死掉', '名無しさん', 8);
  await insertReply(135, '>>6 可以用YouTube Music聽\n背景播放', '名無しさん', 7);
  await insertReply(135, 'shorts影片也可以貼\n直式影片預覽', '名無しさん', 6);
  await insertReply(135, '希望以後有嵌入播放器\n不用跳出去看', '名無しさん', 5);

  console.log('\n✅ 完成！共新增 72 則回覆到 12 個討論串');
}

boostThreads()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
