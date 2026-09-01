// Cloudflare Worker entrypoint serving static assets and API backed by D1

// 添加跨域 CORS 支持
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
};


const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('sidebar', 'topbar')),
    displayOrder INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS site_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS sites (
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
  )`,
  `CREATE TABLE IF NOT EXISTS site_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    visit_count INTEGER DEFAULT 0,
    last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS user_preferences (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `INSERT OR IGNORE INTO settings (key, value) VALUES ('backgroundUrl', 'https://iili.io/FSa7FDB.gif')`,
  `INSERT OR IGNORE INTO user_preferences (key, value) VALUES
    ('show_frequent_sites', 'true'),
    ('frequent_sites_count', '8'),
    ('enable_shortcuts', 'true'),
    ('enable_pinyin_search', 'true')`
];

let schemaReady = null;

async function ensureSchema(env) {
  if (!env || !env.DB) return;
  if (!schemaReady) {
    schemaReady = env.DB.batch(SCHEMA_STATEMENTS.map((sql) => env.DB.prepare(sql))).catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}


function isPrivateHost(host) {
  if (!host) return true;
  const h = host.toLowerCase().replace(/\.$/, '');
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (h === '::1' || h === '[::1]') return true;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 0 || a === 10 || a === 127 || a === 169 || a === 255) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

function extractFaviconHost(value) {
  if (!value) return '';
  try {
    if (/^https?:\/\//i.test(value)) {
      const u = new URL(value);
      if (u.hostname === 'favicon.im' || u.hostname.endsWith('.favicon.im')) {
        return decodeURIComponent(u.pathname.replace(/^\//, '').split('/')[0] || '');
      }
      const domainParam = u.searchParams.get('domain') || u.searchParams.get('url') || u.searchParams.get('domain_url');
      if (domainParam) {
        try { return new URL(domainParam.startsWith('http') ? domainParam : `https://${domainParam}`).hostname; }
        catch { return domainParam.replace(/^https?:\/\//i, '').split('/')[0]; }
      }
      return u.hostname;
    }
    return value.replace(/^https?:\/\//i, '').split('/')[0];
  } catch {
    return '';
  }
}

async function handleFavicon(request, ctx) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  const reqUrl = new URL(request.url);
  const rawHost = (reqUrl.searchParams.get('host') || '').trim();
  const rawUrl = (reqUrl.searchParams.get('url') || '').trim();
  const host = extractFaviconHost(rawHost || rawUrl).replace(/[^\w.-]/g, '');

  if (!host || isPrivateHost(host) || host.length > 253) {
    return new Response('Invalid host', { status: 400, headers: corsHeaders });
  }

  const cache = caches.default;
  const cacheKey = new Request(`${reqUrl.origin}/api/favicon?host=${encodeURIComponent(host)}`, { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) {
    const hit = new Response(cached.body, cached);
    hit.headers.set('Access-Control-Allow-Origin', '*');
    return hit;
  }

  const candidates = [];
  if (rawUrl && /^https?:\/\//i.test(rawUrl) && !isPrivateHost(extractFaviconHost(rawUrl))) {
    candidates.push(rawUrl);
  }
  candidates.push(
    `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host)}`,
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
    `https://favicon.im/${host}`,
    `https://${host}/favicon.ico`
  );

  for (const src of candidates) {
    try {
      const upstream = await fetch(src, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NavSiteFavicon/1.0)' },
        cf: { cacheTtl: 86400, cacheEverything: true }
      });
      if (!upstream.ok) continue;
      const contentType = (upstream.headers.get('Content-Type') || '').toLowerCase();
      if (contentType.includes('text/html') || contentType.includes('application/json')) continue;
      const buf = await upstream.arrayBuffer();
      if (!buf || buf.byteLength < 32 || buf.byteLength > 512 * 1024) continue;
      const type = contentType.includes('image') || contentType.includes('octet-stream') || contentType.includes('icon')
        ? (contentType.split(';')[0] || 'image/png')
        : 'image/png';
      const headers = {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        'Access-Control-Allow-Origin': '*'
      };
      const body = request.method === 'HEAD' ? null : buf;
      const out = new Response(body, { status: 200, headers });
      if (ctx && ctx.waitUntil) ctx.waitUntil(cache.put(cacheKey, out.clone()));
      return out;
    } catch (err) {
      console.error('Favicon source failed:', src, err && err.message);
    }
  }

  const letter = (host.replace(/^www\./, '').charAt(0) || '?').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="#6b7280"/><text x="32" y="42" text-anchor="middle" fill="#fff" font-size="28" font-family="system-ui,sans-serif">${letter}</text></svg>`;
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleApiRequest(request, env, ctx) {
  const { pathname } = new URL(request.url);
  const pathPartsEarly = pathname.split('/').filter(Boolean);
  if (pathPartsEarly[0] === 'api' && pathPartsEarly[1] === 'favicon') {
    return handleFavicon(request, ctx);
  }

  await ensureSchema(env);
  // 处理浏览器的 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const pathParts = pathname.split('/').filter(Boolean);

  if (pathParts[0] !== 'api') {
    return jsonResponse({ error: 'Invalid API route' }, 404);
  }

  const resource = pathParts[1];
  const id = pathParts[2];

  try {
    switch (resource) {
      case 'auth':
        if (request.method === 'POST' && id === 'login') {
          const { password } = await request.json();
          const correctPassword = env.ADMIN_PASSWORD || 'password123'; 
          
          if (password === correctPassword) {
            return jsonResponse({ success: true });
          } else {
            return jsonResponse({ success: false, error: "Incorrect password" }, 401);
          }
        }
        break;

      case 'settings':
        if (request.method === 'GET') {
          const stmt = env.DB.prepare('SELECT * FROM settings WHERE key = ?').bind('backgroundUrl');
          const { results } = await stmt.all();
          return jsonResponse(results[0] || { key: 'backgroundUrl', value: '' });
        }
        if (request.method === 'POST') {
          const { backgroundUrl } = await request.json();
          const stmt = env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
            .bind('backgroundUrl', backgroundUrl);
          await stmt.run();
          return jsonResponse({ success: true });
        }
        break;

      case 'categories':
        if (request.method === 'GET') {
          const { results } = await env.DB.prepare('SELECT * FROM categories ORDER BY displayOrder, id').all();
          return jsonResponse(results || []);
        }
        if (request.method === 'POST' && !pathParts[2]) {
          const { name, type } = await request.json();
          if (!name || !type) return jsonResponse({ error: 'Missing fields' }, 400);
          const { results } = await env.DB.prepare('SELECT MAX(displayOrder) as maxOrder FROM categories').all();
          const newOrder = (results[0].maxOrder || 0) + 1;
          const stmt = env.DB.prepare('INSERT INTO categories (name, type, displayOrder) VALUES (?, ?, ?)')
            .bind(name, type, newOrder);
          const { meta } = await stmt.run();
          return jsonResponse({ success: true, id: meta.last_row_id }, 201);
        }
        if (request.method === 'DELETE' && id) {
          await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true });
        }
        if (request.method === 'POST' && pathParts[2] === 'order') {
          const { orderedIds } = await request.json();
          if (!Array.isArray(orderedIds)) {
            return jsonResponse({ error: 'Invalid data format, expected orderedIds array' }, 400);
          }
          const statements = orderedIds.map((orderedId, index) => {
            return env.DB.prepare('UPDATE categories SET displayOrder = ? WHERE id = ?').bind(index, orderedId);
          });
          await env.DB.batch(statements);
          return jsonResponse({ success: true });
        }
        if (request.method === 'POST' && pathParts[2] === 'update-all') {
          const { updates } = await request.json();
          if (!Array.isArray(updates)) {
            return jsonResponse({ error: 'Invalid data format, expected updates array' }, 400);
          }
          const statements = updates.map((update) => {
            return env.DB.prepare(
              'UPDATE categories SET type = ?, displayOrder = ? WHERE id = ?'
            ).bind(update.type, update.displayOrder, update.id);
          });
          await env.DB.batch(statements);
          return jsonResponse({ success: true });
        }
        break;

      case 'sites':
        if (request.method === 'GET' && !pathParts[2]) {
          const { results } = await env.DB.prepare('SELECT * FROM sites ORDER BY categoryId, display_order, id').all();
          return jsonResponse(results || []);
        }
        if (request.method === 'GET' && pathParts[2] === 'frequent') {
          const { results } = await env.DB.prepare(
            'SELECT * FROM sites ORDER BY visit_count DESC LIMIT 10'
          ).all();
          return jsonResponse(results || []);
        }
        if (request.method === 'POST' && !pathParts[2]) {
          const { categoryId, name, url, icon, description, tags, group_id } = await request.json();
          if (!categoryId || !name || !url) return jsonResponse({ error: 'Missing fields' }, 400);
          const { results } = await env.DB.prepare(
            'SELECT MAX(display_order) as maxOrder FROM sites WHERE categoryId = ?'
          ).bind(categoryId).all();
          const newOrder = (results[0].maxOrder || 0) + 1;
          const stmt = env.DB.prepare(
            'INSERT INTO sites (categoryId, name, url, icon, description, tags, group_id, visit_count, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)'
          ).bind(categoryId, name, url, icon || '', description || '', tags || '', group_id || null, newOrder);
          const { meta } = await stmt.run();
          return jsonResponse({ success: true, id: meta.last_row_id });
        }
        if (request.method === 'POST' && pathParts[3] === 'visit') {
          const siteId = pathParts[2];
          if (!siteId) return jsonResponse({ error: 'Site ID required' }, 400);
          await env.DB.prepare(
            'UPDATE sites SET visit_count = visit_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          ).bind(siteId).run();
          await env.DB.prepare(
            'INSERT INTO site_visits (site_id, visit_count, last_visit) VALUES (?, 1, CURRENT_TIMESTAMP) ON CONFLICT(site_id) DO UPDATE SET visit_count = visit_count + 1, last_visit = CURRENT_TIMESTAMP'
          ).bind(siteId).run();
          return jsonResponse({ success: true });
        }
        if (request.method === 'PUT' && id) {
          const { categoryId, name, url, icon, description, tags, group_id } = await request.json();
          if (!categoryId || !name || !url) return jsonResponse({ error: 'Missing fields' }, 400);
          const stmt = env.DB.prepare(
            'UPDATE sites SET categoryId = ?, name = ?, url = ?, icon = ?, description = ?, tags = ?, group_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          ).bind(categoryId, name, url, icon || '', description || '', tags || '', group_id || null, id);
          await stmt.run();
          return jsonResponse({ success: true });
        }
        if (request.method === 'POST' && pathParts[2] === 'order') {
          const { categoryId, orderedIds } = await request.json();
          if (!categoryId || !Array.isArray(orderedIds)) {
            return jsonResponse({ error: 'Invalid data format' }, 400);
          }
          const statements = orderedIds.map((orderedId, index) => {
            return env.DB.prepare(
              'UPDATE sites SET display_order = ? WHERE id = ? AND categoryId = ?'
            ).bind(index, orderedId, categoryId);
          });
          await env.DB.batch(statements);
          return jsonResponse({ success: true });
        }
        if (request.method === 'DELETE' && id) {
          await env.DB.prepare('DELETE FROM sites WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true });
        }
        break;

      case 'site-groups':
        if (request.method === 'GET') {
          const { results } = await env.DB.prepare('SELECT * FROM site_groups ORDER BY display_order').all();
          return jsonResponse(results || []);
        }
        if (request.method === 'POST') {
          const { name, color, icon } = await request.json();
          if (!name) return jsonResponse({ error: 'Name required' }, 400);
          const { results } = await env.DB.prepare('SELECT MAX(display_order) as maxOrder FROM site_groups').all();
          const newOrder = (results[0].maxOrder || 0) + 1;
          const stmt = env.DB.prepare('INSERT INTO site_groups (name, color, icon, display_order) VALUES (?, ?, ?, ?)')
            .bind(name, color || '', icon || '', newOrder);
          const { meta } = await stmt.run();
          return jsonResponse({ success: true, id: meta.last_row_id });
        }
        break;

      case 'user-preferences':
        if (request.method === 'GET') {
          const { results } = await env.DB.prepare('SELECT * FROM user_preferences').all();
          const prefs = {};
          results.forEach((row) => {
            prefs[row.key] = row.value;
          });
          return jsonResponse(prefs);
        }
        if (request.method === 'POST') {
          const preferences = await request.json();
          const statements = [];
          for (const [key, value] of Object.entries(preferences)) {
            statements.push(
              env.DB.prepare('INSERT OR REPLACE INTO user_preferences (key, value) VALUES (?, ?)').bind(key, value)
            );
          }
          await env.DB.batch(statements);
          return jsonResponse({ success: true });
        }
        break;

      case 'import':
        if (request.method === 'POST') {
          const data = await request.json();
          const statements = [];
          if (data.categories) {
            statements.push(env.DB.prepare('DELETE FROM categories'));
            data.categories.forEach((cat) => {
              statements.push(
                env.DB.prepare('INSERT INTO categories (id, name, type, displayOrder) VALUES (?, ?, ?, ?)')
                  .bind(cat.id, cat.name, cat.type, cat.displayOrder || 0)
              );
            });
          }
          if (data.sites) {
            statements.push(env.DB.prepare('DELETE FROM sites'));
            data.sites.forEach((site) => {
              statements.push(
                env.DB.prepare(
                  'INSERT INTO sites (id, categoryId, name, url, icon, description, tags, group_id, visit_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                ).bind(
                  site.id,
                  site.categoryId,
                  site.name,
                  site.url,
                  site.icon || '',
                  site.description || '',
                  site.tags || '',
                  site.group_id || null,
                  site.visit_count || 0
                )
              );
            });
          }
          if (data.siteGroups) {
            statements.push(env.DB.prepare('DELETE FROM site_groups'));
            data.siteGroups.forEach((group) => {
              statements.push(
                env.DB.prepare('INSERT INTO site_groups (id, name, color, icon, display_order) VALUES (?, ?, ?, ?, ?)')
                  .bind(group.id, group.name, group.color || '', group.icon || '', group.display_order || 0)
              );
            });
          }
          if (data.userPreferences) {
            for (const [key, value] of Object.entries(data.userPreferences)) {
              statements.push(
                env.DB.prepare('INSERT OR REPLACE INTO user_preferences (key, value) VALUES (?, ?)').bind(key, value)
              );
            }
          }
          await env.DB.batch(statements);
          return jsonResponse({ success: true });
        }
        break;

      default:
        return jsonResponse({ error: 'Resource not found' }, 404);
    }

    return jsonResponse({ error: `Method ${request.method} not allowed` }, 405);
  } catch (e) {
    console.error('API Error:', e);
    return jsonResponse({ error: 'Internal Server Error', details: e.message }, 500);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api')) {
      return handleApiRequest(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  }
};
