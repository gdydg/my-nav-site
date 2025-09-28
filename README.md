# 注意

由于上传url图床背景比较吃图床的稳定性，这里建议直接在`/public`目录下直接上传静态资源，然后在管理员面板`/图片路径`设置背景


# 关于项目

示例站点：https://nas.ikun.pp.ua

## 最新功能更新 🚀

### 1. 常用网站自动排序
- 导航站顶部新增「常用网站」区域
- 根据访问频率自动排序，最常访问的网站会显示在最前面
- 显示访问次数统计
- 支持快捷键访问（数字键 1-9）

### 2. 增强的搜索功能
- 支持中文拼音搜索
- 支持按标签搜索
- 支持模糊匹配

### 3. 网站标签系统
- 为每个网站添加多个标签
- 标签以美观的标签形式显示
- 支持按标签筛选网站

### 4. 网站分组功能
- 可以创建自定义分组
- 将相关网站归类到同一分组
- 分组支持自定义颜色和图标

### 5. 导入导出功能
- 一键导出所有数据为 JSON 文件
- 支持从备份文件恢复数据
- 方便迁移和备份

### 6. 优化的后台管理
- 分类拖拽排序功能更加流畅
- 编辑网站时支持标签和分组
- 更直观的管理界面

### 7. 快捷键导航
- 数字键 1-9：快速打开常用网站
- 智能识别，避免与输入框冲突

### 8. 网站自由排序 🆕
- **分类排序**：侧边栏和顶部栏的分类可以通过拖拽调整顺序
- **网站排序**：每个分类内的网站也可以自由拖拽排序
- **分组管理**：后台管理面板中，网站按分类分组显示，更加清晰
- **实时保存**：拖拽后点击保存按钮即可保存新顺序



一、项目核心特点与功能
这个导航站项目最大的特点是完全构建于 Cloudflare 的生态系统之上，实现了真正的“全栈无服务器化”，集高性能、高安全性和零成本于一身。

1.技术架构先进

（1）全栈 Cloudflare 生态：前端使用 Cloudflare Pages，后端 API 使用 Cloudflare Functions，数据库使用 Cloudflare D1。整个项目无需管理任何服务器。

（2）前后端分离：界面（HTML）与逻辑（API）完全分离，代码结构清晰，易于维护和扩展。

（3）数据库驱动：所有网站、分类和设置都存储在 D1 数据库中，实现了完全的动态化管理，而非写死在代码里。

2.强大的后台管理功能

（1）动态内容管理：提供密码保护的管理面板，可以方便地添加、删除网站链接和分类。

（2）分类拖拽排序：在管理面板中，可以通过拖拽直观地调整侧边栏和顶部栏分类的显示顺序，并一键保存。

（3）自动图标获取：添加网站时，只需输入网址，系统会自动尝试抓取网站的 favicon 图标，简化操作。
<img src="https://img.8888.vvvv.ee/file/图片/1753689323513.png" alt="屏幕截图 2025-07-28 143848.png" width=100% />

<img src="https://img.8888.vvvv.ee/file/图片/1753689321276.png" alt="屏幕截图 2025-07-28 133333.png" width=100% />

3.优秀的用户体验

（1）多语言支持：内置中英双语一键切换，并能记住用户的语言偏好。

（2）白天/黑夜模式：支持浅色和深色两种主题，同样可以自动保存用户的选择。

（3）动态背景：支持在后台更换全局背景图片，并集成了优雅的樱花飘落动态特效，美观且独特。

（4）实时搜索：顶部的搜索框可以即时筛选所有网站，快速定位。

（5）完全响应式设计：无论在电脑、平板还是手机上，都能获得完美的访问体验。

二、与其他导航站对比
为了更好地理解本项目的优势，我们可以将它与市面上常见的两类导航站进行对比：传统的静态导航站和商业化在线服务。

<img src="https://img.8888.vvvv.ee/file/图片/1753689317457.png" alt="屏幕截图 2025-07-28 155349.png" width=100% />

三、总结

总而言之，这个项目为您提供了一个兼具静态网站的简洁、高性能和商业服务的强大动态功能的完美解决方案。它不仅完全免费、保护隐私，还给予了您百分之百的定制自由，是打造个性化、现代化个人导航主页的绝佳选择。





# cloudflare部署

1.创建D1数据库`my-nav-site`，到控制台依次输入命令并逐一执行

```
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```
```
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('sidebar', 'topbar'))
);
```
```
CREATE TABLE sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categoryId INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE 
);
```
```
INSERT INTO settings (key, value) VALUES ('backgroundUrl', 'https://iili.io/FSa7FDB.gif');
```
```
ALTER TABLE categories ADD COLUMN displayOrder INTEGER;
```

新增表结构（用于支持新功能）：

```sql

CREATE TABLE IF NOT EXISTS site_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL,
  visit_count INTEGER DEFAULT 0,
  last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);


ALTER TABLE sites ADD COLUMN visit_count INTEGER DEFAULT 0;
ALTER TABLE sites ADD COLUMN tags TEXT;
ALTER TABLE sites ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE sites ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE TABLE IF NOT EXISTS site_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0
);


ALTER TABLE sites ADD COLUMN group_id INTEGER REFERENCES site_groups(id);


CREATE TABLE IF NOT EXISTS user_preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO user_preferences (key, value) VALUES 
  ('show_frequent_sites', 'true'),
  ('frequent_sites_count', '8'),
  ('enable_shortcuts', 'true'),
  ('enable_pinyin_search', 'true');
```
```sql
-- 为sites表添加display_order字段
ALTER TABLE sites ADD COLUMN display_order INTEGER DEFAULT 0;
```
```sql
-- 为现有网站设置初始排序值
UPDATE sites SET display_order = id WHERE display_order = 0;
```

2.fork项目，到cloudflare创建pages连接Git仓库，选择构建目录`public`，点击部署。

3.绑定D1数据库，名称为`DB`,重新部署令数据库生效。

4.管理员密码默认`password123`，可变量`ADMIN_PASSWORD`修改或到index.html文件第198行修改。

5.添加网站可以到`https://favicon.im/zh/`获取网站图标。

6.缺点是在管理面板编辑保存时有时需一段时间缓存加载。


