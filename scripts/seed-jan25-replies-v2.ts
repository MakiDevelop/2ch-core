#!/usr/bin/env tsx
/**
 * 2026/1/25 補充回覆腳本 v2
 * 針對回覆較少的討論串補充回覆
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

async function getReplyCount(threadId: number): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM posts WHERE parent_id = $1',
    [threadId]
  );
  return parseInt(result.rows[0].count);
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

async function addReplies(threadId: number, replies: Array<{content: string, author?: string}>, startHoursAgo: number = 8): Promise<number> {
  const currentCount = await getReplyCount(threadId);
  let added = 0;

  for (let i = 0; i < replies.length; i++) {
    const reply = replies[i];
    const hoursAgo = startHoursAgo - i;
    await insertReply(threadId, reply.content, reply.author || '名無しさん', hoursAgo > 0 ? hoursAgo : 1);
    added++;
  }

  console.log(`    新增 ${added} 則回覆（原有 ${currentCount} 則）`);
  return added;
}

async function main() {
  console.log('🌱 開始補充討論串回覆 v2...\n');

  let totalAdded = 0;

  // ==================== money 版 ====================
  console.log('💰 money 版\n');

  // 勞退自提
  console.log('  #618 勞退自提6%到底值不值得');
  totalAdded += await addReplies(618, [
    { content: '節稅效果很明顯\n高薪族群很划算', author: '名無しさん' },
    { content: '>>6\n退休金強迫儲蓄\n不會亂花', author: '名無しさん' },
    { content: '缺點是不能提前領\n流動性差', author: '名無しさん' },
  ], 12);

  // 高股息vs成長
  console.log('  #429 高股息ETF還是成長型ETF');
  totalAdded += await addReplies(429, [
    { content: '年輕人選成長型\n退休才選高股息', author: '名無しさん' },
    { content: '>>6\n0050長期報酬比高股息好', author: '名無しさん' },
    { content: '高股息心理上比較安心\n有現金流', author: '名無しさん' },
  ], 14);

  // 存款100萬
  console.log('  #412 存款到100萬了');
  totalAdded += await addReplies(412, [
    { content: '恭喜！第一桶金達成', author: '名無しさん' },
    { content: '>>6\n可以開始學投資了\n但要做功課', author: '名無しさん' },
    { content: '別全部放定存\n分散配置', author: '名無しさん' },
  ], 16);

  // 房市展望
  console.log('  #3149 2026房市展望');
  totalAdded += await addReplies(3149, [
    { content: '跌10%也是很多錢\n房價太高了', author: '名無しさん' },
    { content: '>>7\n台北不太會跌\n蛋白區比較危險', author: '名無しさん' },
    { content: '觀望中\n等看看再說', author: '名無しさん' },
  ], 10);

  // 台股三萬點
  console.log('  #3038 台股破三萬點');
  totalAdded += await addReplies(3038, [
    { content: '沒賺到QQ\n都在觀望', author: '名無しさん' },
    { content: '>>6\n定期定額的人最開心', author: '名無しさん' },
    { content: '台積電一個人扛起整個大盤', author: '名無しさん' },
  ], 11);

  // 存錢計畫
  console.log('  #2953 2026存錢計畫');
  totalAdded += await addReplies(2953, [
    { content: '今年目標存50萬\n加油', author: '名無しさん' },
    { content: '>>7\n先記帳才知道錢花哪', author: '名無しさん' },
    { content: '每月固定轉帳到不動戶頭', author: '名無しさん' },
  ], 9);

  // 比特幣
  console.log('  #3265 比特幣跌25%');
  totalAdded += await addReplies(3265, [
    { content: '幣圈波動本來就大\n習慣就好', author: '幣圈人' },
    { content: '>>6\n分批買入比較穩', author: '名無しさん' },
    { content: '長期持有不看短期波動', author: '名無しさん' },
  ], 8);

  // ==================== tech 版 ====================
  console.log('\n🔬 tech 版\n');

  // AI選舉干預
  console.log('  #3143 中國用AI干預台灣選舉');
  totalAdded += await addReplies(3143, [
    { content: 'AI生成假新聞越來越難分辨', author: '名無しさん' },
    { content: '>>6\n要教長輩媒體識讀', author: '名無しさん' },
    { content: 'LINE群組一堆假消息', author: '名無しさん' },
  ], 10);

  // 黃仁勳訪台
  console.log('  #3167 黃仁勳1/29訪台');
  totalAdded += await addReplies(3167, [
    { content: '老黃每次來股價就漲', author: '名無しさん' },
    { content: '>>7\n北士科簽約很重要\n台灣AI研發基地', author: '名無しさん' },
    { content: '期待兆元宴的消息', author: '名無しさん' },
  ], 7);

  // CES 2026
  console.log('  #1601 CES 2026 黃仁勳演講');
  totalAdded += await addReplies(1601, [
    { content: 'Rubin平台很厲害\n下一代架構', author: '名無しさん' },
    { content: '>>7\n自駕AI應該快落地了', author: '名無しさん' },
    { content: '老黃畫餅能力一流', author: '名無しさん' },
  ], 8);

  // ==================== work 版 ====================
  console.log('\n💼 work 版\n');

  // 週休三日
  console.log('  #3096 週休三日提案連署過關');
  totalAdded += await addReplies(3096, [
    { content: '不可能通過\n資方一定反對', author: '名無しさん' },
    { content: '>>6\n先把加班費確實給再說', author: '名無しさん' },
    { content: '台灣工時太長了\n該改了', author: '名無しさん' },
  ], 9);

  // 年終
  console.log('  #3249 年終獎金');
  totalAdded += await addReplies(3249, [
    { content: '金融業今年應該還不錯', author: '名無しさん' },
    { content: '>>6\n科技業看公司\n差很多', author: '名無しさん' },
    { content: '有發就感恩了', author: '名無しさん' },
  ], 10);

  // 基本工資
  console.log('  #3078 基本工資調到29500');
  totalAdded += await addReplies(3078, [
    { content: '物價漲更多\n實質購買力下降', author: '名無しさん' },
    { content: '>>7\n便當從80變100\n有感', author: '名無しさん' },
    { content: '時薪196打工族有感', author: '名無しさん' },
  ], 8);

  // 考期中考
  console.log('  #1808 突然被要求回去考期中考');
  totalAdded += await addReplies(1808, [
    { content: '這什麼奇怪的要求', author: '名無しさん' },
    { content: '>>6\n有些公司會考核\n很正常', author: '名無しさん' },
    { content: '職場文化問題', author: '名無しさん' },
  ], 12);

  // ==================== life 版 ====================
  console.log('\n🌿 life 版\n');

  // 年菜推薦
  console.log('  #3186 2026外帶年菜推薦');
  totalAdded += await addReplies(3186, [
    { content: '今年試試美福的\n評價不錯', author: '名無しさん' },
    { content: '>>6\n全家的年菜意外可以\n方便', author: '名無しさん' },
    { content: '佛跳牆必備', author: '名無しさん' },
  ], 9);

  // 日本旅遊
  console.log('  #3180 1月去日本最便宜');
  totalAdded += await addReplies(3180, [
    { content: '1月初真的便宜\n住宿打折', author: '名無しさん' },
    { content: '>>6\n但1/1-3很多店沒開', author: '名無しさん' },
    { content: '福袋狩獵也是樂趣', author: '名無しさん' },
  ], 10);

  // 早上捷運
  console.log('  #491 早上7點的捷運');
  totalAdded += await addReplies(491, [
    { content: '北捷尖峰時間超擠\n被推著走', author: '名無しさん' },
    { content: '>>6\n6:30出門好很多', author: '名無しさん' },
    { content: '戴耳機閉眼睛撐過去', author: '名無しさん' },
  ], 18);

  // 快30歲什麼都沒有
  console.log('  #734 快30歲了什麼都還沒有');
  totalAdded += await addReplies(734, [
    { content: '30歲還很年輕\n不要太焦慮', author: '名無しさん' },
    { content: '>>6\n比較是偷走快樂的小偷', author: '名無しさん' },
    { content: '專注自己的步調就好', author: '名無しさん' },
    { content: '人生不是只有錢跟房', author: '名無しさん' },
  ], 20);

  // 學測
  console.log('  #1620 115學測這週末');
  totalAdded += await addReplies(1620, [
    { content: '考生加油！平常心應考', author: '名無しさん' },
    { content: '>>7\n記得帶准考證和文具', author: '名無しさん' },
    { content: '寒流來\n多穿一點', author: '名無しさん' },
  ], 7);

  // ==================== news 版 ====================
  console.log('\n📰 news 版\n');

  // 霍諾德攀登
  console.log('  #2799 霍諾德攀登101因大雨延期');
  totalAdded += await addReplies(2799, [
    { content: '最後還是成功了！91分鐘', author: '名無しさん' },
    { content: '>>7\nNetflix直播很緊張', author: '名無しさん' },
    { content: '台灣又上國際新聞了', author: '名無しさん' },
  ], 8);

  // 土方之亂
  console.log('  #3019 土方之亂');
  totalAdded += await addReplies(3019, [
    { content: 'GPS聯單政策太倉促', author: '名無しさん' },
    { content: '>>6\n立意良好但配套不足', author: '名無しさん' },
    { content: '工地都在等土方\n工程延誤', author: '營建業' },
  ], 10);

  // 詐騙
  console.log('  #2813 2025年全台詐騙財損893億');
  totalAdded += await addReplies(2813, [
    { content: '893億…太誇張了', author: '名無しさん' },
    { content: '>>7\n很多人不敢報案\n實際更多', author: '名無しさん' },
    { content: '要教長輩防詐', author: '名無しさん' },
  ], 9);

  // WBC中華隊
  console.log('  #2806 WBC中華隊集訓開始');
  totalAdded += await addReplies(2806, [
    { content: '陳傑憲當隊長很適合', author: '名無しさん' },
    { content: '>>7\n今年陣容很強\n期待', author: '名無しさん' },
    { content: '希望能打進前四', author: '棒球迷' },
  ], 8);

  // 台美關稅
  console.log('  #3006 台美關稅談判');
  totalAdded += await addReplies(3006, [
    { content: '15%比其他國家好很多了', author: '名無しさん' },
    { content: '>>6\n半導體應該有特殊待遇', author: '名無しさん' },
    { content: '台積電護國神山', author: '名無しさん' },
  ], 11);

  // ==================== gossip 版 ====================
  console.log('\n🎭 gossip 版\n');

  // BTS高雄
  console.log('  #3227 BTS世巡台灣場在高雄');
  totalAdded += await addReplies(3227, [
    { content: '三場應該買得到\n希望', author: 'ARMY' },
    { content: '>>6\n住宿要先訂\n會爆滿', author: '名無しさん' },
    { content: '高雄終於有大場演唱會', author: '高雄人' },
  ], 9);

  // 蔡依林
  console.log('  #3044 蔡依林大巨蛋演唱會');
  totalAdded += await addReplies(3044, [
    { content: '舞台超猛\n值回票價', author: '名無しさん' },
    { content: '>>6\n跨年那場氣氛超好', author: '名無しさん' },
    { content: '呸姐的演唱會不會失望', author: 'Jolin粉' },
  ], 10);

  // 台灣燈會
  console.log('  #2820 2026台灣燈會在嘉義');
  totalAdded += await addReplies(2820, [
    { content: '阿里山神木當主燈很有特色', author: '名無しさん' },
    { content: '>>7\n嘉義交通要先規劃', author: '名無しさん' },
    { content: '期待今年的燈會', author: '名無しさん' },
  ], 8);

  // ==================== love 版 ====================
  console.log('\n💕 love 版\n');

  // 前任訊息
  console.log('  #3309 前任過年傳訊息來');
  totalAdded += await addReplies(3309, [
    { content: '有新對象就不要回了', author: '名無しさん' },
    { content: '>>6\n已讀不回最安全', author: '名無しさん' },
    { content: '半年後還傳\n有企圖', author: '名無しさん' },
  ], 10);

  // 相親對象沒感覺
  console.log('  #396 相親對象條件好但沒感覺');
  totalAdded += await addReplies(396, [
    { content: '感覺可以培養\n多相處看看', author: '名無しさん' },
    { content: '>>6\n但也不要勉強自己', author: '名無しさん' },
    { content: '條件好不代表適合', author: '名無しさん' },
  ], 15);

  // 帶女友回家
  console.log('  #3303 今年春節要帶女友回家');
  totalAdded += await addReplies(3303, [
    { content: '禮物帶水果禮盒就好\n不用太貴', author: '名無しさん' },
    { content: '>>6\n第一次見面自然就好', author: '名無しさん' },
    { content: '事先跟爸媽打聲招呼', author: '名無しさん' },
  ], 9);

  // 交友軟體
  console.log('  #3204 2026交友軟體推薦');
  totalAdded += await addReplies(3204, [
    { content: 'Bumble女生主動這點不錯', author: '名無しさん' },
    { content: '>>6\n探探詐騙多\n要小心', author: '名無しさん' },
    { content: '視訊確認比較保險', author: '名無しさん' },
  ], 10);

  // 遠距離
  console.log('  #629 遠距離戀愛真的能撐下去嗎');
  totalAdded += await addReplies(629, [
    { content: '看兩個人的決心\n有成功的例子', author: '名無しさん' },
    { content: '>>6\n固定視訊很重要', author: '名無しさん' },
    { content: '要有明確的結束時間點', author: '過來人' },
  ], 16);

  // 見家長緊張
  console.log('  #2855 第一次過年去見另一半家長');
  totalAdded += await addReplies(2855, [
    { content: '放輕鬆\n太刻意反而尷尬', author: '名無しさん' },
    { content: '>>7\n多幫忙做事\n印象加分', author: '名無しさん' },
    { content: '禮物不用太貴\n心意到就好', author: '名無しさん' },
  ], 7);

  // ==================== acg 版 ====================
  console.log('\n🎮 acg 版\n');

  // 巴哈姆特徵稿
  console.log('  #3238 巴哈姆特2026 ACG徵稿');
  totalAdded += await addReplies(3238, [
    { content: '每年都有佳作出現\n支持本土創作', author: '名無しさん' },
    { content: '>>5\n遊戲組門檻比較高', author: '名無しさん' },
    { content: '投稿到5/20截止\n還有時間', author: '名無しさん' },
  ], 12);

  // 一月新番
  console.log('  #3072 2026一月新番');
  totalAdded += await addReplies(3072, [
    { content: '這季新番太多\n追不完', author: '名無しさん' },
    { content: '>>6\n公主大人拷問時間第二季必看', author: '名無しさん' },
    { content: '稜鏡戀曲在Netflix\n流星花園作者的', author: '名無しさん' },
  ], 9);

  // ==================== meta 版 ====================
  console.log('\n🔧 meta 版\n');

  // 感謝站方
  console.log('  #3340 感謝站方維護這個地方');
  totalAdded += await addReplies(3340, [
    { content: '現在匿名討論的地方越來越少', author: '名無しさん' },
    { content: '>>5\n比PTT友善一點', author: '名無しさん' },
    { content: '希望人越來越多', author: '名無しさん' },
  ], 11);

  console.log(`\n✅ 完成！共新增 ${totalAdded} 則回覆`);
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('錯誤:', err);
    pool.end();
    process.exit(1);
  });
