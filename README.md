# 注意

由于上传url图床背景比较吃图床的稳定性，这里建议直接在`/public`目录下直接上传静态资源，然后在管理员面板`/图片路径`设置背景


# 关于项目

示例站点：https://nav.666.x10.mx

仓库地址：https://github.com/gdydg/my-nav-site

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/gdydg/my-nav-site)

> 不想自己配环境：点上面按钮即可一键部署到你的 Cloudflare 账号。想自己改代码：先 Fork 仓库，再在 Worker 里连接这个仓库。详见下方「Cloudflare 部署」。


## 可以到`public/index.html`960行更改自己喜欢的歌单

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





# Cloudflare 部署

本项目部署到 **Cloudflare Workers**（`src/worker.js` + `public/` 静态资源 + D1 数据库），不需要自己的服务器。三种方式任选其一：

| 方式 | 适合谁 | 要不要 GitHub |
| --- | --- | --- |
| [方式一：一键部署](#方式一一键部署推荐最简单) | 最快上线 | 需要（会自动克隆仓库到你的账号） |
| [方式二：Fork 后 Worker 连接仓库](#方式二fork-仓库再用-worker-连接-git-部署) | 要自己改代码、后续自动更新 | 需要（先 Fork） |
| [方式三：控制台手动创建](#方式三控制台手动创建-worker无需-git) | 不想用 Git | 不需要 |

---

## 方式一：一键部署（推荐，最简单）

点击下面按钮，用 GitHub 和 Cloudflare 账号登录后，会自动完成：克隆仓库到你的 GitHub、创建 Worker、创建并绑定 D1、构建发布。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/gdydg/my-nav-site)

直达链接：<https://deploy.workers.cloudflare.com/?url=https://github.com/gdydg/my-nav-site>

操作步骤：

1. 点击按钮，先授权 GitHub，再授权/登录 Cloudflare。
2. 在配置页可以改仓库名、Worker 名、D1 数据库名（默认 `my-nav-site` 即可）。
3. 确认部署命令是 `npm run deploy`（会先执行 D1 migrations 再建表，再发布 Worker）。
4. 点击部署，等绿色成功即可。访问 `https://<Worker名>.<你的子域>.workers.dev`。
5. 打开该 Worker → **设置** → **变量和机密**：
   - 已预置 `ADMIN_PASSWORD=password123`（演示密码）。
   - 建议改成自己的密码。改完后重新部署一次。
6. 以后改你账号下那份仓库并 `git push`，Cloudflare 会自动重新构建部署。

如果首页能打开、后台保存报 500：到 **存储和数据库 → D1** 打开对应数据库，用下面的初始化 SQL 再执行一遍。正常情况下 `npm run deploy` 会跑 migrations，而且第一次调用 `/api` 时 Worker 也会自动建表，一般不用手动执行。

---

## 方式二：Fork 仓库，再用 Worker 连接 Git 部署

适合要长期自己改前端/后端的用户。Worker 连上你 Fork 的仓库后，每次 `git push` 都会自动部署。

### 1. Fork 仓库

打开 [gdydg/my-nav-site](https://github.com/gdydg/my-nav-site)，点击右上角 **Fork**，Fork 到你自己的 GitHub 账号（不要改仓库结构）。

### 2. 先创建自己的 D1 数据库

`wrangler.jsonc` 里的 `database_id` 是模板占位，必须换成你自己的，否则构建会失败。

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **存储和数据库** → **D1 SQL 数据库** → **创建**。
2. 数据库名称填 `my-nav-site`（建议与配置文件一致）。
3. 创建完成后复制 **数据库 ID**（一串 UUID）。

### 3. 在 Fork 仓库里写入你的 database_id

回到你 Fork 出来的仓库，编辑 `wrangler.jsonc`，只改 `database_id`：

```jsonc
{
  "name": "my-nav-site",
  "main": "src/worker.js",
  "compatibility_date": "2025-06-04",
  "assets": {
    "directory": "./public",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-nav-site",
      "database_id": "这里换成你刚刚复制的 D1 数据库 ID"
    }
  ]
}
```

Worker 的 `name` 必须和后面在 Cloudflare 里创建的 Worker 名称一致，默认保持 `my-nav-site` 最省事。改完后 **Commit** 到 `main` 分支。

### 4. 用 Worker 连接这个仓库

1. Cloudflare Dashboard → **Workers 和 Pages** → **创建** / **创建应用**。
2. 选择 **Import a repository** / **导入仓库**（不要选「先创建 Hello World Worker 再粘贴代码」）。
3. 授权 GitHub，在列表里选中你 Fork 的 `my-nav-site`。
4. 确认项目类型为 **Worker**（本仓库有 `wrangler.jsonc`，会自动识别，不要选成 Pages）。
5. Worker 名称填 `my-nav-site`（必须和 `wrangler.jsonc` 的 `name` 一致，否则 Builds 会失败）。
6. 构建配置建议：
   - 根目录：`/`
   - 构建命令：留空（本项目没有前端打包）
   - 部署命令：`npm run deploy`
7. 点击 **Save and Deploy**，等构建成功。

部署命令 `npm run deploy` 会先执行 `wrangler d1 migrations apply DB --remote`，自动建表，一般不用再手动跑 SQL。

### 5. 设置管理员密码

打开该 Worker → **设置** → **变量和机密**：

- 变量名：`ADMIN_PASSWORD`
- 值：你的后台密码（演示站是 `password123`）
- 保存后会再部署一次。如果第一次保存后密码丢失，再设一遍即可。

### 6. 访问与后续更新

- 使用 Workers 提供的 `*.workers.dev` 子域名，或在 **触达 / Triggers** 里绑定自己的域名。
- 之后在 Fork 仓库改代码，`git push` 到已连接的分支，就会自动重新部署。

### 已有 Worker 事后连接仓库

如果 Worker 已经手动建好了，也可以后接 Git：

1. 打开该 Worker → **设置** → **Builds** → **Connect**。
2. 选择你 Fork 的仓库，部署命令填 `npm run deploy`。
3. 向仓库推送一次即可触发部署。
4. Worker 名称仍须与 `wrangler.jsonc` 的 `name` 一致。

常见失败：

- 构建提示找不到 D1 / database_id 无效：`wrangler.jsonc` 还没改成你自己的数据库 ID。
- 构建提示 Worker name mismatch：控制台 Worker 名和 `wrangler.jsonc` 的 `name` 不一致。
- 静态页面 404：确认 `wrangler.jsonc` 里 `assets.directory` 为 `./public`，绑定名为 `ASSETS`。

---

## 方式三：控制台手动创建 Worker（无需 Git）

1.创建D1数据库`my-nav-site`，到控制台执行 SQL 命令

## 方法一：一次性执行（推荐）

复制以下所有内容，粘贴到 D1 控制台一次执行：

```sql


CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('sidebar', 'topbar')),
  displayOrder INTEGER
);


CREATE TABLE IF NOT EXISTS site_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0
);


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


CREATE TABLE IF NOT EXISTS site_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL,
  visit_count INTEGER DEFAULT 0,
  last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS user_preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);


INSERT OR IGNORE INTO settings (key, value) VALUES 
  ('backgroundUrl', 'https://iili.io/FSa7FDB.gif');


INSERT OR IGNORE INTO user_preferences (key, value) VALUES 
  ('show_frequent_sites', 'true'),
  ('frequent_sites_count', '8'),
  ('enable_shortcuts', 'true'),
  ('enable_pinyin_search', 'true');


UPDATE sites SET display_order = id WHERE display_order = 0 OR display_order IS NULL;
```

## 方法二：分步执行（如果一次性执行失败）

## 基础表结构：

### 1. 设置表
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### 2. 分类表
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('sidebar', 'topbar')),
  displayOrder INTEGER
);
```

### 3. 网站表
```sql
CREATE TABLE sites (
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
```

### 4. 网站访问统计表
```sql
CREATE TABLE IF NOT EXISTS site_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL,
  visit_count INTEGER DEFAULT 0,
  last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);
```

### 5. 网站分组表
```sql
CREATE TABLE IF NOT EXISTS site_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0
);
```

### 6. 用户偏好设置表
```sql
CREATE TABLE IF NOT EXISTS user_preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### 7. 初始化默认数据
```sql
INSERT INTO settings (key, value) VALUES ('backgroundUrl', 'https://iili.io/FSa7FDB.gif');

INSERT OR IGNORE INTO user_preferences (key, value) VALUES 
  ('show_frequent_sites', 'true'),
  ('frequent_sites_count', '8'),
  ('enable_shortcuts', 'true'),
  ('enable_pinyin_search', 'true');
```

### 8. 更新现有数据（如果是升级）
```sql
UPDATE sites SET display_order = id WHERE display_order = 0 OR display_order IS NULL;
```

2. 在 Cloudflare 控制台创建 Worker（无需终端）

   - 进入「Workers & Pages」→「Workers」→「创建应用」→「创建 Worker」。
   - 在在线编辑器中，将仓库里的 `src/worker.js` 代码粘贴到脚本，点击「保存并部署」。

3. 绑定 D1 数据库

   - 打开该 Worker →「设置」→「绑定」→「D1 数据库」→「添加」。
   - 绑定名称填 `DB`（必须与代码一致），数据库选择上面创建的 `my-nav-site`。
   - 保存后重新部署以生效。

4. 配置静态资源（Assets）

   - 在 Worker →「设置」→「静态资源（Assets）」中启用静态资源。
   - 绑定名称填 `ASSETS`（需与代码一致）。
   - 上传项目的 `public/` 目录（或将其压缩为 zip 后上传），保存并发布。

5. 可选设置

   - 演示站密码 `password123`。可在 Worker 的「设置」→「变量与密钥」中新增 `ADMIN_PASSWORD` 变量(密钥格式）设置自己的密码(注意设置密码变量每次更新或者重新部署都要重新设置变量，懒得修复了，就这样了）。
   - 添加网站图标可到 `https://favicon.im/zh/` 获取，也可以不填，已默认嵌入根据网站地址获取网站图标功能。

6. 绑定域名与路由

   - 在 Worker 的「触达（Triggers）」→「路由」中添加 `你的域名/*` 路由，或使用 `*.workers.dev` 子域名访问。

7. 常见问题

   - 访问静态文件 404：确认已启用静态资源并将绑定名设为 `ASSETS`，且已上传 `public/`。
   - API 报错 500：确认已为 Worker 绑定 D1（绑定名 `DB`），且已按上文在 D1 控制台完成初始化 SQL。
   - 更新前端/后端：前端更新后重新上传 `public/` 并发布；后端在在线编辑器中修改脚本并保存部署。
   -记得修改`wrangler.jsonc`配置

### workers部署优点

经过优选RT

![屏幕截图 2025-10-03 204908.png](https://imge.ssss.bio/file/1759495863127_屏幕截图_2025-10-03_204908.png)
