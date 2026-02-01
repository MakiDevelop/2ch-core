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

  // ========== #1208 睦那京的腿線條好美 (gossip) ==========
  // 現有5則回覆, 補4則
  await insertReply(1208, '韓國啦啦隊真的很猛\\n訓練很扎實', '名無しさん', 360);
  await insertReply(1208, '>>5 推薦看完整版的應援影片\\n比短片更精彩', '名無しさん', 358);
  await insertReply(1208, '腿控的天堂', '名無しさん', 356);
  await insertReply(1208, '韓職啦啦隊營運蠻成功的\\n各隊都有代表性的人物', '名無しさん', 354);

  // ========== #4519 北捷台北車站攻擊事件 (news) ==========
  // 現有6則回覆, 補4則
  await insertReply(4519, '>>4 網路上可以買到的樣子\\n管制應該要更嚴格', '名無しさん', 154);
  await insertReply(4519, '心理健康資源真的要加強\\n預防勝於治療', '名無しさん', 152);
  await insertReply(4519, '>>6 希望不要只有檢討安檢\\n社會安全網才是根本', '名無しさん', 150);
  await insertReply(4519, '類似事件不應該被過度報導\\n怕有模仿效應', '名無しさん', 148);

  // ========== #4248 川普威脅南韓加徵關稅 (news) ==========
  // 現有6則回覆, 補4則
  await insertReply(4248, '>>3 川普的談判風格就這樣\\n先喊高再談', '名無しさん', 156);
  await insertReply(4248, '韓國三星被打 台積電受惠\\n地緣政治也是商機', '名無しさん', 154);
  await insertReply(4248, '>>7 台灣順差大確實要注意\\n低調做事比較好', '名無しさん', 152);
  await insertReply(4248, '供應鏈重組才剛開始\\n未來還有很多變數', '財經觀察', 150);

  // ========== #3947 覺得自己真得很爛 (life) ==========
  // 現有6則回覆, 補4則
  await insertReply(3947, '>>5 律師陪你走過這段\\n相信專業判斷', '名無しさん', 158);
  await insertReply(3947, '你願意站出來就已經很不容易了\\n很多人連這步都做不到', '名無しさん', 156);
  await insertReply(3947, '>>6 對方無情在先\\n保護自己沒有錯', '名無しさん', 154);
  await insertReply(3947, '後續更新一下結果吧\\n幫你加油', '名無しさん', 152);

  // ========== #4304 最低工資29500能活嗎 (money) ==========
  // 現有6則回覆, 補4則
  await insertReply(4304, '>>6 真的很諷刺\\n漲薪的追不上漲價的', '名無しさん', 160);
  await insertReply(4304, '還好我住家裡\\n不然28K在台北真的不夠', '省錢達人', 158);
  await insertReply(4304, '>>5 超商真的很血汗\\n站一整天還要被客訴', '名無しさん', 156);
  await insertReply(4304, '政府說經濟成長\\n我只感受到物價成長', '名無しさん', 154);

  // ========== #4319 男友PTT仇女該分手嗎 (love) ==========
  // 現有6則回覆, 補4則
  await insertReply(4319, '>>3 光跟風仇女就是問題了\\n價值觀不合很難走下去', '名無しさん', 162);
  await insertReply(4319, '可以試著跟他聊聊這話題\\n看他怎麼回應', '名無しさん', 160);
  await insertReply(4319, '>>6 同意 跟風也是一種選擇\\n說明他不反對這些觀點', '名無しさん', 158);
  await insertReply(4319, '匿名的時候才是真面目\\n這話不是沒道理', '過來人', 156);

  // ========== #4326 爸找23歲女友要結婚 (love) ==========
  // 現有6則回覆, 補4則
  await insertReply(4326, '>>3 先確認財產狀況\\n遺產問題很複雜', '名無しさん', 164);
  await insertReply(4326, '不管怎樣都要支持爸爸有人陪\\n但保護措施要做好', '名無しさん', 162);
  await insertReply(4326, '>>5 婚前協議+1\\n雙方都有保障', '名無しさん', 160);
  await insertReply(4326, '27歲年齡差不算誇張\\n重點是對方動機', '名無しさん', 158);

  // ========== #3768 對工作已經厭倦到不行 (life) ==========
  // 現有6則回覆, 補4則
  await insertReply(3768, '>>5 勞工局真的有用\\n公司最怕被查', '名無しさん', 166);
  await insertReply(3768, '這種公司就是想逼人自己走\\n千萬不要簽自願離職', '名無しさん', 164);
  await insertReply(3768, '>>6 睡不著的話真的要看醫生\\n長期下來身體會出問題', '名無しさん', 162);
  await insertReply(3768, '資遣費是你應得的\\n不要放棄', '過來人', 160);

  console.log('回覆補充完成！');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
