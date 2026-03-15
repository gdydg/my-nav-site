// ... existing code ...
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

async function handleApiRequest(request, env) {
  // 处理浏览器的 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { pathname } = new URL(request.url);
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
          const correctPassword = env.ADMIN_PASSWORD; 
          
          if (password === correctPassword) {
            return jsonResponse({ success: true });
          } else {
            return jsonResponse({ success: false, error: "Incorrect password" }, 401);
          }
        }
        break;

      case 'settings':
// ... existing code ...
