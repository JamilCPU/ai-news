const CATEGORIES = {
  'Model Releases & Updates': 'cat-model',
  'Research Breakthroughs':   'cat-research',
  'Industry & Business':      'cat-industry',
  'Tools & Open Source':      'cat-tools',
}

const CATEGORY_ORDER = Object.keys(CATEGORIES)

// ── Navigation ────────────────────────────────────────────────────────────────

function showIndex() {
  document.getElementById('digest-view').classList.add('hidden')
  document.getElementById('index-view').classList.remove('hidden')
  history.pushState({}, '', '/')
}

function showDigest(date) {
  document.getElementById('index-view').classList.add('hidden')
  document.getElementById('digest-view').classList.remove('hidden')
  history.pushState({}, '', `/digest/${date}`)
  loadDigest(date)
}

window.addEventListener('popstate', () => {
  const match = location.pathname.match(/^\/digest\/(.+)$/)
  if (match) showDigest(match[1])
  else showIndex()
})

// ── Index ─────────────────────────────────────────────────────────────────────

async function loadIndex() {
  const el = document.getElementById('digest-list')
  try {
    const res = await fetch('/api/digests')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const digests = await res.json()

    if (!digests.length) {
      el.innerHTML = `
        <div class="empty-state">
          <h2>No digests yet</h2>
          <p>The ai-digest agent will post the first digest at 7am today.</p>
        </div>`
      return
    }

    el.innerHTML = digests.map(d => `
      <div class="digest-card" onclick="showDigest('${d.digest_date}')">
        <div class="digest-date-badge">${formatDate(d.digest_date)}</div>
        <div class="digest-card-body">
          <div class="digest-card-overview">${escHtml(d.overview)}</div>
          <div class="digest-card-meta">
            <span>${d.item_count} items</span>
          </div>
        </div>
      </div>`).join('')
  } catch (e) {
    el.innerHTML = `
      <div class="error-state">
        <h2>Could not load digests</h2>
        <p>${escHtml(e.message)}</p>
      </div>`
  }
}

// ── Digest page ───────────────────────────────────────────────────────────────

async function loadDigest(date) {
  const el = document.getElementById('digest-content')
  el.innerHTML = '<div class="loading">Loading digest...</div>'
  try {
    const res = await fetch(`/api/digests/${date}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const d = await res.json()
    renderDigest(el, d)
  } catch (e) {
    el.innerHTML = `
      <div class="error-state">
        <h2>Could not load digest</h2>
        <p>${escHtml(e.message)}</p>
      </div>`
  }
}

function renderDigest(el, d) {
  // Group items by category, preserving defined order
  const grouped = {}
  CATEGORY_ORDER.forEach(c => grouped[c] = [])
  const other = []
  ;(d.items || []).forEach(item => {
    if (grouped[item.category] !== undefined) grouped[item.category].push(item)
    else other.push(item)
  })

  const categorySections = CATEGORY_ORDER
    .filter(cat => grouped[cat].length > 0)
    .map(cat => `
      <div class="category-section ${CATEGORIES[cat]}">
        <div class="category-title">${escHtml(cat)}</div>
        ${grouped[cat].map(item => renderItem(item)).join('')}
      </div>`)
    .join('')

  const otherSection = other.length ? `
    <div class="category-section">
      <div class="category-title" style="color:var(--text-muted)">Other</div>
      ${other.map(item => renderItem(item)).join('')}
    </div>` : ''

  el.innerHTML = `
    <div class="digest-header">
      <div class="digest-title">AI News</div>
      <div class="digest-subtitle">${formatDateLong(d.digest_date)}</div>
    </div>
    <div class="digest-overview">${escHtml(d.overview)}</div>
    ${categorySections}
    ${otherSection}
  `
}

function renderItem(item) {
  const sourceHost = item.url ? (() => { try { return new URL(item.url).hostname.replace('www.', '') } catch { return item.source || '' } })() : (item.source || '')
  return `
    <div class="news-item">
      <div class="news-headline">${escHtml(item.headline)}</div>
      <div class="news-summary">${escHtml(item.summary)}</div>
      ${item.url ? `<a class="news-source" href="${escHtml(item.url)}" target="_blank" rel="noopener">
        ↗ ${escHtml(sourceHost)}
      </a>` : ''}
    </div>`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso) {
  const [y, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m)-1]} ${parseInt(d)}, ${y}`
}

function formatDateLong(iso) {
  const [y, m, d] = iso.split('-')
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const date = new Date(`${iso}T12:00:00`)
  return `${days[date.getDay()]}, ${months[parseInt(m)-1]} ${parseInt(d)}, ${y}`
}

function escHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// ── Init ──────────────────────────────────────────────────────────────────────

const match = location.pathname.match(/^\/digest\/(.+)$/)
if (match) showDigest(match[1])
else loadIndex()
