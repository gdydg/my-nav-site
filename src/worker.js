// Cloudflare Worker entrypoint serving static assets and API backed by D1

const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};

async function handleApiRequest(request, env) {
  const { pathname } = new URL(request.url);
  const pathParts = pathname.split('/').filter(Boolean);

  if (pathParts[0] !== 'api') {
    return jsonResponse({ error: 'Invalid API route' }, 404);
  }

  const resource = pathParts[1];
  const id = pathParts[2];

  try {
    switch (resource) {
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
      return handleApiRequest(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
