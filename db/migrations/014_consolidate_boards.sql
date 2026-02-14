-- Migration 014: 看板整合 10 → 3（氣氛重構實驗第一波）
-- 軟刪除：is_active = false，資料保留

-- 1. ACG 板的討論串搬到 tech 板
UPDATE posts
SET board_id = (SELECT id FROM boards WHERE slug = 'tech')
WHERE board_id = (SELECT id FROM boards WHERE slug = 'acg')
  AND parent_id IS NULL;

-- 2. 更新 tech 板名稱為「科技 / ACG」
UPDATE boards
SET name = '科技 / ACG',
    description = '科技、AI、3C、動漫、電玩、宅文化'
WHERE slug = 'tech';

-- 3. 更新 chat 板名稱
UPDATE boards
SET name = '綜合',
    description = '什麼都能聊'
WHERE slug = 'chat';

-- 4. 軟刪除 7 個板
UPDATE boards
SET is_active = false
WHERE slug IN ('news', 'work', 'love', 'money', 'acg', 'life', 'gossip', 'meta');

-- 5. 新增成人板
INSERT INTO boards (slug, name, description, display_order, is_active)
VALUES ('nsfw', '成人', 'R18，未滿 18 歲禁止進入', 3, true)
ON CONFLICT (slug) DO UPDATE
SET name = '成人',
    description = 'R18，未滿 18 歲禁止進入',
    display_order = 3,
    is_active = true;

-- 6. 更新 display_order
UPDATE boards SET display_order = 1 WHERE slug = 'chat';
UPDATE boards SET display_order = 2 WHERE slug = 'tech';
UPDATE boards SET display_order = 3 WHERE slug = 'nsfw';
