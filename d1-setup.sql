-- 完整的 D1 数据库初始化脚本
-- 可以一次性执行所有命令

-- 1. 创建设置表
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 2. 创建分类表
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('sidebar', 'topbar')),
  displayOrder INTEGER
);

-- 3. 创建网站分组表（需要先创建，因为 sites 表会引用它）
CREATE TABLE IF NOT EXISTS site_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0
);

-- 4. 创建网站表
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categoryId INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  visit_count INTEGER DEFAULT 0,
  tags TEXT,
  group_id INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES site_groups(id)
);

-- 5. 创建网站访问统计表
CREATE TABLE IF NOT EXISTS site_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL,
  visit_count INTEGER DEFAULT 0,
  last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- 6. 创建用户偏好设置表
CREATE TABLE IF NOT EXISTS user_preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 7. 插入默认设置
INSERT OR IGNORE INTO settings (key, value) VALUES 
  ('backgroundUrl', 'https://iili.io/FSa7FDB.gif');

-- 8. 插入默认用户偏好
INSERT OR IGNORE INTO user_preferences (key, value) VALUES 
  ('show_frequent_sites', 'true'),
  ('frequent_sites_count', '8'),
  ('enable_shortcuts', 'true'),
  ('enable_pinyin_search', 'true');

-- 9. 更新现有数据（如果是升级的话）
UPDATE sites SET display_order = id WHERE display_order = 0 OR display_order IS NULL;