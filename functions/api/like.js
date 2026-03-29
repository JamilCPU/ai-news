/**
 * POST /api/like  — increment like count for an article
 * GET  /api/like?article_id=xxx — get current count
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const article_id = url.searchParams.get('article_id');
  if (!article_id) {
    return new Response(JSON.stringify({ error: 'article_id required' }), { status: 400, headers: CORS });
  }
  const count = parseInt(await env.SIGNAL_LIKES.get(`like:${article_id}`) || '0');
  return new Response(JSON.stringify({ article_id, count }), { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON' }), { status: 400, headers: CORS });
  }

  const { article_id, category, source } = body;
  if (!article_id) {
    return new Response(JSON.stringify({ error: 'article_id required' }), { status: 400, headers: CORS });
  }

  // Increment article count
  const articleKey = `like:${article_id}`;
  const current = parseInt(await env.SIGNAL_LIKES.get(articleKey) || '0');
  const next = current + 1;
  await env.SIGNAL_LIKES.put(articleKey, String(next));

  // Increment category aggregate
  if (category) {
    const catKey = `meta:cat:${category}`;
    const c = parseInt(await env.SIGNAL_LIKES.get(catKey) || '0');
    await env.SIGNAL_LIKES.put(catKey, String(c + 1));
  }

  // Increment source aggregate
  if (source) {
    const srcKey = `meta:src:${source}`;
    const s = parseInt(await env.SIGNAL_LIKES.get(srcKey) || '0');
    await env.SIGNAL_LIKES.put(srcKey, String(s + 1));
  }

  // Global total
  const total = parseInt(await env.SIGNAL_LIKES.get('meta:total') || '0');
  await env.SIGNAL_LIKES.put('meta:total', String(total + 1));

  return new Response(JSON.stringify({ liked: true, count: next }), { headers: CORS });
}
