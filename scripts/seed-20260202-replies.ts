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
  console.log('開始補充回覆...');

  // ========== #5750 小林家龍女僕快閃店 (acg) ==========
  // 現有5則回覆, 補4則
  await insertReply(5750, '>>5 日本那邊限量商品秒殺\\n希望台灣備貨多一點', '名無しさん', 14);
  await insertReply(5750, '艾爾瑪的周邊希望也有\\n不要只出托爾康納', '名無しさん', 13);
  await insertReply(5750, '開幕第一天一定很多人\\n建議平日去比較好', '名無しさん', 12);
  await insertReply(5750, '>>6 路西亞也要！\\n全角色都出一輪啦', '名無しさん', 11);

  // ========== #5763 朋友介紹對象 (love) ==========
  // 現有5則回覆, 補4則
  await insertReply(5763, '>>4 朋友圈都單身是真的絕望\\n要認識新朋友才行', '名無しさん', 17);
  await insertReply(5763, '朋友介紹好處是有共同話題\\n至少有個話頭可以聊', '名無しさん', 16);
  await insertReply(5763, '>>6 但也可能因為太熟悉\\n反而不好意思追', '名無しさん', 15);
  await insertReply(5763, '我覺得最好的還是自然認識\\n工作、興趣社團之類的', '過來人', 14);

  // ========== #5689 圖片上傳功能 (meta) ==========
  // 現有5則回覆, 補4則
  await insertReply(5689, '支援 imgur/meee 的預覽+1\\n這個應該比較好做', '名無しさん', 22);
  await insertReply(5689, '>>6 PTT也是這樣做的\\n點連結自動展開圖片', '名無しさん', 21);
  await insertReply(5689, '站方有在看這裡嗎\\n好多功能建議都石沉大海', '名無しさん', 20);
  await insertReply(5689, '其實現在這樣也還好\\n功能太多反而亂', '名無しさん', 19);

  // ========== #5695 手機版字太小 (meta) ==========
  // 現有5則回覆, 補4則
  await insertReply(5695, '>>5 PTT的網頁版字也很小\\n但人家有APP', '名無しさん', 26);
  await insertReply(5695, '建議做個字體大小設定\\n存在localStorage就好', '前端工程師', 25);
  await insertReply(5695, '我都用電腦看\\n手機版確實不太方便', '名無しさん', 24);
  await insertReply(5695, '>>7 對 做APP吧\\n有APP一定更多人用', '名無しさん', 23);

  // ========== #587 回覆框太小 (meta) ==========
  // 現有5則回覆, 補4則
  await insertReply(587, '手機版確實不好按\\n常常按錯', '名無しさん', 380);
  await insertReply(587, '>>6 圖片看起來真的很小\\n手指粗的人應該會哭', '名無しさん', 378);
  await insertReply(587, '站方有空的話麻煩調整一下\\n真的影響使用體驗', '名無しさん', 376);
  await insertReply(587, '用電腦還好\\n手機才有這問題', '名無しさん', 374);

  // ========== #183 林妍霏道歉 (gossip) ==========
  // 現有5則回覆, 補4則
  await insertReply(183, '演員人設跟本人差太多\\n粉絲傻眼', '名無しさん', 390);
  await insertReply(183, '>>4 早就有人爆料了\\n只是現在才被關注', '名無しさん', 388);
  await insertReply(183, '說錯話道歉很正常吧\\n就看誠不誠懇', '名無しさん', 386);
  await insertReply(183, '這種事過一陣子就沒人記得了\\n娛樂圈就是這樣', '名無しさん', 384);

  // ========== #5729 追星地獄日 (gossip) ==========
  // 現有6則回覆, 補4則
  await insertReply(5729, '>>4 崔振赫超紳士的\\n見面會互動很好', '名無しさん', 10);
  await insertReply(5729, 'SILENT SIREN也很讚\\n日本樂團現場超棒', '名無しさん', 9);
  await insertReply(5729, '>>7 NCT WISH我也要去\\n已經準備好搶票了', '名無しさん', 8);
  await insertReply(5729, '朋友同時去不同場\\n當天群組超熱鬧', '名無しさん', 7);

  // ========== #5708 馬年換新鈔 (news) ==========
  // 現有6則回覆, 補4則
  await insertReply(5708, '>>5 對啊 多跑幾趟\\n不過要看有沒有額度剩', '名無しさん', 13);
  await insertReply(5708, '郵局也可以換\\n不用特地去銀行', '名無しさん', 12);
  await insertReply(5708, '>>7 馬年生的要發大財了\\n本命年運勢起來', '名無しさん', 11);
  await insertReply(5708, '新年新氣象\\n紅包當然要用新鈔', '名無しさん', 10);

  console.log('回覆補充完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
