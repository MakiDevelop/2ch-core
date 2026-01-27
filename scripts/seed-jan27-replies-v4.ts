#!/usr/bin/env tsx
/**
 * 2026/1/27 回覆補充腳本 v4
 * 為回覆數少的討論串補充自然回覆
 * 目標討論串：4768, 4727, 4616, 4593, 4762, 4756, 4701, 4669, 4744
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
  console.log('=== 補充回覆 v4 (2026-01-27) ===\n');

  // --- Thread 4768: 我們終究會活成自己最討厭的樣子 (0 replies) ---
  console.log('Thread 4768: 我們終究會活成自己最討厭的樣子');
  await insertReply(4768, '哈哈我也是\n以前最討厭老闆叫人加班\n結果現在自己當主管也在叫人加班', '名無しさん', 3);
  await insertReply(4768, '這就是社畜化的過程\n環境會慢慢改變一個人', '名無しさん', 2.5);
  await insertReply(4768, '>>4768\n至少你還有自覺 很多人根本不知道自己變了', '名無しさん', 2);
  await insertReply(4768, '我最討厭的就是講幹話的前輩\n結果現在每天開會第一個講幹話的就是我', '社畜', 1.5);
  await insertReply(4768, '不是活成討厭的樣子\n是終於理解當初為什麼那樣了\n角度不同而已', '名無しさん', 1);

  // --- Thread 4727: 台13線三義連環追撞 (4 replies) ---
  console.log('Thread 4727: 台13線三義連環追撞');
  await insertReply(4727, '年前出車禍最慘\n希望傷勢不嚴重', '名無しさん', 3);
  await insertReply(4727, '>>4730\n不是只有老人的問題\n那段路設計本來就爛 彎道又陡又窄', '苗栗人', 2);
  await insertReply(4727, '警用重機被撞 那個賠償金額應該不小', '名無しさん', 1.5);

  // --- Thread 4616: 台中房仲吸金23億 (4 replies) ---
  console.log('Thread 4616: 台中房仲吸金23億');
  await insertReply(4616, '台中地產圈最近好多這種\n前陣子也有建商跑路的', '名無しさん', 4);
  await insertReply(4616, '>>4618\n報酬率太離譜的一定有問題\n正常投資哪有穩賺的', '名無しさん', 3);
  await insertReply(4616, '23億 感覺整個社區都被騙了\n受害人數一定很驚人', '名無しさん', 2);

  // --- Thread 4593: 巴哈ACG創作大賽 (4 replies) ---
  console.log('Thread 4593: 巴哈ACG創作大賽');
  await insertReply(4593, '今年截止比去年晚一點\n時間還算充裕 該動起來了', '名無しさん', 5);
  await insertReply(4593, '>>4594\n+1 我也是每年都想每年都鴿', '鴿王', 3);
  await insertReply(4593, '有人知道今年獎金有沒有改嗎\n去年好像是十萬', '名無しさん', 2);

  // --- Thread 4762: 過年被拷問 (5 replies) ---
  console.log('Thread 4762: 距離過年還有兩週');
  await insertReply(4762, '最怕比較薪水\n我都說公司規定不能透露 直接擋掉', '名無しさん', 3);
  await insertReply(4762, '>>4765\n笑死 這招太猛了吧\n但親戚應該會翻臉', '名無しさん', 2);
  await insertReply(4762, '今年改視訊拜年\n打完電話三分鐘結束 舒服', '名無しさん', 1.5);

  // --- Thread 4756: Netflix Honnold紀錄片 (5 replies) ---
  console.log('Thread 4756: Netflix紀錄片');
  await insertReply(4756, '>>4757\nFree Solo真的是神作\n看到手心全濕 好幾次差點不敢看', '名無しさん', 4);
  await insertReply(4756, '推The Alpinist\n看完真的很感動也很心痛', '名無しさん', 2.5);
  await insertReply(4756, 'Meru也很推\n講Conrad Anker他們攀登梅魯峰\n三個人的故事都很精彩', '名無しさん', 1.5);

  // --- Thread 4701: Honnold爬101 (5 replies) ---
  console.log('Thread 4701: 看完Honnold爬101');
  await insertReply(4701, '他太太在底下看的反應是整場最揪心的部分', '名無しさん', 4);
  await insertReply(4701, '>>4705\n竹節外傾那段我差點關掉\n光用看的腳就軟了', '懼高症', 3);
  await insertReply(4701, '台灣人能看到世界級的活動在自己的地標上\n真的是很難得的經驗', '名無しさん', 1.5);

  // --- Thread 4669: 基本工資29500 (5 replies) ---
  console.log('Thread 4669: 基本工資29500');
  await insertReply(4669, '南部還行 雙北真的不夠\n光租房就要一萬五起跳', '名無しさん', 5);
  await insertReply(4669, '>>4674\n企業主每年都喊撐不住\n結果人力銀行上職缺還不是照開', '名無しさん', 3);
  await insertReply(4669, '重點不是基本工資多少\n是整體薪資中位數太低\n基本工資調再多 中間的人沒感覺', '名無しさん', 1.5);

  // --- Thread 4744: 115年總預算 (5 replies) ---
  console.log('Thread 4744: 115年總預算');
  await insertReply(4744, '暫行預算只能用上年度規模\n新的政策全部卡住 最苦的是基層', '公務員', 4);
  await insertReply(4744, '>>4746\nTPASS應該不會被砍啦\n太多人依賴了 砍了等著被罵', '通勤族', 2.5);
  await insertReply(4744, '1月底了還沒過\n世界上大概沒幾個國家這樣搞的', '名無しさん', 1);

  console.log('\n=== 完成 ===');
}

main()
  .then(() => pool.end())
  .catch((err) => { console.error('錯誤:', err); pool.end(); process.exit(1); });
