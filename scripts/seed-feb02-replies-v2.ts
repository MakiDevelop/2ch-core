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
  console.log('開始新增回覆...\n');

  // === 5701: 中配立委李貞秀2/3就職 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 中配立委李貞秀2/3就職 國安疑慮引發討論');

  await insertReply(5701,
    '>>6 這就是國安法的漏洞\n歸化了但對方不承認',
    '名無しさん', 18);

  await insertReply(5701,
    '她老公是台灣人吧\n也不能說她一定有問題',
    '名無しさん', 16);

  await insertReply(5701,
    '>>7 審查機制確實該檢討\n這種敏感身份怎麼能排不分區',
    '名無しさん', 14);

  await insertReply(5701,
    '說實在的 中配在台灣生活幾十年\n跟中國早就沒關係了',
    '名無しさん', 12);

  await insertReply(5701,
    '重點是放棄國籍證明\n有就沒問題 沒有就是有疑慮',
    '政治觀察', 10);

  // === 5004: 買動漫台北車站旗艦店 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 買動漫台北車站旗艦店開幕了');

  await insertReply(5004,
    '週末去人爆多\n排結帳排超久',
    '名無しさん', 48);

  await insertReply(5004,
    '>>7 實體店真的要支持\n不然以後都只能網購',
    '動漫迷', 44);

  await insertReply(5004,
    '咖啡區蠻有氣氛的\n邊喝咖啡邊看漫畫',
    '名無しさん', 40);

  await insertReply(5004,
    '有些絕版漫畫這邊找得到\n網路上都缺貨',
    '名無しさん', 36);

  await insertReply(5004,
    '>>4 平日去比較好\n假日根本逛不動',
    '名無しさん', 32);

  // === 4261: 2026是赤馬紅羊劫 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 2026是赤馬紅羊劫 60年一遇的災厄');

  await insertReply(4261,
    '命理這種事\n靈不靈驗看你怎麼解讀',
    '名無しさん', 80);

  await insertReply(4261,
    '>>6 屬馬的我也瑟瑟發抖\n今年要低調一點',
    '名無しさん', 76);

  await insertReply(4261,
    '川普上台比什麼紅羊劫可怕\n這個才是真的',
    '名無しさん', 72);

  await insertReply(4261,
    '台灣人愛算命\n算命師賺翻',
    '名無しさん', 68);

  await insertReply(4261,
    '>>7 同意 股票跌了就多買一點\n比求神問卜實際',
    '理性投資', 64);

  // === 3628: 土方之亂是怎麼回事 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 土方之亂是怎麼回事？工地都停擺了');

  await insertReply(3628,
    '附近的大樓蓋到一半停工\n住戶都在問什麼時候會好',
    '名無しさん', 90);

  await insertReply(3628,
    '>>7 房價一定漲啦\n每次成本增加都是買方吸收',
    '名無しさん', 86);

  await insertReply(3628,
    '電子聯單方向是對的\n但執行上確實有問題',
    '名無しさん', 82);

  await insertReply(3628,
    '砂石業者抗議也是為了自己利益\n但政府配套真的不足',
    '名無しさん', 78);

  await insertReply(3628,
    '>>2 美濃那個事件太誇張\n整座山被挖掉',
    '高雄人', 74);

  // === 3823: 台中燈會今年是嚕嚕米 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 台中燈會今年是嚕嚕米！60公尺極光主燈');

  await insertReply(3823,
    '>>4 平日晚上去比較好\n假日真的擠爆',
    '名無しさん', 60);

  await insertReply(3823,
    '芬蘭IP在台灣出現\n蠻酷的組合',
    '名無しさん', 56);

  await insertReply(3823,
    '台中燈會年年進步\n比高雄的好看',
    '中部人', 52);

  await insertReply(3823,
    '帶小朋友去一定會愛\n嚕嚕米超療癒',
    '名無しさん', 48);

  await insertReply(3823,
    '記得先查交管\n不然會塞死',
    '名無しさん', 44);

  // === 3816: 年貨大街開始了 (已有 6 則回覆，樓層 1-7) ===
  console.log('新增回覆到: 年貨大街開始了 今年要買什麼');

  await insertReply(3816,
    '>>5 物價真的漲很兇\n同樣預算買不到以前那麼多',
    '名無しさん', 70);

  await insertReply(3816,
    '烏魚子今年行情如何\n有人問過嗎',
    '名無しさん', 66);

  await insertReply(3816,
    '>>4 試吃是去迪化街的樂趣之一\n不然網購就好',
    '名無しさん', 62);

  await insertReply(3816,
    '我媽堅持要去現場挑\n說網購不知道品質',
    '名無しさん', 58);

  await insertReply(3816,
    '堅果類推薦南北雜貨\n老店品質穩定',
    '年貨達人', 54);

  console.log('\n✅ 已為 6 個討論串新增共 30 則回覆');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
