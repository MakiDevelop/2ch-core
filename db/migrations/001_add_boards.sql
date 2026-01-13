-- Migration: Add boards system
-- 创建 boards 表并修改 posts 表以支持板块系统

-- 1. 创建 boards 表
CREATE TABLE IF NOT EXISTS boards (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 为 boards 表创建索引
CREATE INDEX idx_boards_slug ON boards(slug);
CREATE INDEX idx_boards_display_order ON boards(display_order);

-- 3. 修改 posts 表，增加 board_id 字段
ALTER TABLE posts ADD COLUMN IF NOT EXISTS board_id INTEGER REFERENCES boards(id);

-- 4. 为 posts.board_id 创建索引
CREATE INDEX IF NOT EXISTS idx_posts_board_id ON posts(board_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts(created_at DESC);

-- 5. 插入初始板块数据（v1 Board Seed）
INSERT INTO boards (slug, name, description, display_order) VALUES
  -- 核心通用板（必備）
  ('chat', '雜談', '任何無法分類、也不想分類的話題入口。此板的存在目的是保護其他所有板。', 1),
  ('news', '時事', '新聞、政治、社會事件與公共議題。高衝突、高流量，必須集中處理。', 2),
  ('question', '問卦', '低門檻提問、求解、請益。用來避免雜談板被問題洗版。', 3),
  ('rant', '抱怨', '發洩情緒、負面經驗、不滿與牢騷。此板不存在，其他板一定會爆。', 4),

  -- 興趣導向板（邊界刻意寬鬆）
  ('acg', 'ACG', '動畫、漫畫、遊戲、影視、追星與流行文化。', 5),
  ('tech', '科技', '程式、AI、3C、網路文化與科技趨勢。', 6),
  ('life', '生活', '工作、感情、家庭、日常瑣事與人生觀察。', 7),

  -- 風險隔離板（治理用途）
  ('nsfw', '成人', '成人內容集中處理，避免污染其他板。', 8),
  ('controversy', '爭議', '容易引戰、價值衝突、高對立話題的集中區。此板的目的在於「隔離」，而非鼓勵。', 9),

  -- 預留與緩衝板
  ('other', '其他', '系統測試、臨時導流、或尚未確定去向的話題。', 10)
ON CONFLICT (slug) DO NOTHING;

-- 6. 为现有的 posts 设置默认 board（雜談板）
UPDATE posts
SET board_id = (SELECT id FROM boards WHERE slug = 'chat' LIMIT 1)
WHERE board_id IS NULL;
