/**
 * GET /api/likes/summary
 * Returns aggregated like data for the ai-digest agent to use as feedback.
 * Called by the Pi before each digest run.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

const ALL_CATEGORIES = [
  'Model Releases & Updates',
  'Research Breakthroughs',
  'Industry & Business',
  'Tools & Open Source',
];

export async function onRequestGet({ env }) {
  // List all keys in the namespace
  const { keys } = await env.SIGNAL_LIKES.list();

  const categories = {};
  const sources = {};
  let total = 0;

  for (const { name } of keys) {
    const val = parseInt(await env.SIGNAL_LIKES.get(name) || '0');
    if (name.startsWith('meta:cat:')) {
      categories[name.replace('meta:cat:', '')] = val;
    } else if (name.startsWith('meta:src:')) {
      sources[name.replace('meta:src:', '')] = val;
    } else if (name === 'meta:total') {
      total = val;
    }
  }

  const sortDesc = (obj) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1]);

  const topCategories = sortDesc(categories).slice(0, 4).map(([name, count]) => ({ name, count }));
  const topSources    = sortDesc(sources).slice(0, 8).map(([name, count]) => ({ name, count }));

  // Categories with zero likes or well below average = low engagement
  const avgCatLikes = total > 0 ? total / ALL_CATEGORIES.length : 0;
  const lowEngagement = ALL_CATEGORIES.filter(
    c => (categories[c] || 0) < avgCatLikes * 0.5
  );

  return new Response(JSON.stringify({
    total_likes: total,
    top_categories: topCategories,
    top_sources: topSources,
    low_engagement: lowEngagement,
    category_counts: categories,
    source_counts: sources,
    generated_at: new Date().toISOString(),
  }), { headers: CORS });
}
