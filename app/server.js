import express from 'express'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.static(join(__dirname, 'public')))

// Serve digest index — reads the JSON file the page-creator agent maintains
app.get('/api/digests', (req, res) => {
  const indexPath = join(__dirname, 'public', 'digests', 'index.json')
  if (!existsSync(indexPath)) return res.json([])
  try {
    const data = JSON.parse(readFileSync(indexPath, 'utf8'))
    res.json(data)
  } catch {
    res.json([])
  }
})

// SPA fallback — digest pages are static HTML files, just serve index for /
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SIGNAL AI News running on :${PORT}`)
})
