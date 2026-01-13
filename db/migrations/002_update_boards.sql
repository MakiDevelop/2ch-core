-- Migration: Update boards to final v1 configuration
-- 更新為最終的十個板塊設計

-- 1. 清空現有板塊（保留 posts 數據）
DELETE FROM boards;

-- 2. 重置序列
ALTER SEQUENCE boards_id_seq RESTART WITH 1;

-- 3. 插入新的十個板塊
INSERT INTO boards (slug, name, description, display_order) VALUES
  -- 1. 綜合閒聊（核心流量池）
  ('chat', '綜合閒聊', '核心流量池，什麼都能丟，也是新使用者的第一站。', 1),

  -- 2. 時事／政治（高黏著、高衝突）
  ('news', '時事／政治', '高黏著、高衝突，高風險但必須有，否則不會像匿名板。', 2),

  -- 3. 科技／網路／AI（工程師導向）
  ('tech', '科技／網路／AI', '偏工程師、科技從業者，討論程式、AI、3C、網路文化與科技趨勢。', 3),

  -- 4. 職場／工作／社畜（穩定產出）
  ('work', '職場／工作／社畜', '抱怨、求生、比慘，長期穩定產出討論量。', 4),

  -- 5. 感情／兩性／婚姻（永動機）
  ('love', '感情／兩性／婚姻', '永動機型板塊，只要匿名就一定會熱。', 5),

  -- 6. 金錢／投資／理財（生活財務）
  ('money', '金錢／投資／理財', '不走專業投顧，走「我是不是做錯了」路線。', 6),

  -- 7. ACG／遊戲（宅文化）
  ('acg', 'ACG／遊戲', '動漫、電玩、宅文化，天然適合匿名吐槽。', 7),

  -- 8. 生活／心情／負能量回收站（情緒出口）
  ('life', '生活／心情／負能量回收站', '不主打心理諮商，主打「我只是想講」。', 8),

  -- 9. 娛樂／名人／八卦（評論導向）
  ('gossip', '娛樂／名人／八卦', '不追新聞速度，追評論與嘴砲。', 9),

  -- 10. 站務／建議／黑特2ch（反饋管道）
  ('meta', '站務／建議／黑特2ch', '給使用者一個罵站長和制度的出口，這點很重要。', 10);

-- 4. 更新現有 posts 的 board_id（指向綜合閒聊板）
UPDATE posts
SET board_id = (SELECT id FROM boards WHERE slug = 'chat' LIMIT 1)
WHERE board_id IS NULL OR board_id NOT IN (SELECT id FROM boards);
