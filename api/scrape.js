export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'No URL provided' })

  let parsed
  try { parsed = new URL(url) } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  const host = parsed.hostname.replace('www.', '')

  // ── Blocked platforms ──────────────────────────────────────────
  const blocked = ['linkedin.com','instagram.com','tiktok.com','threads.net','facebook.com','pinterest.com']
  if (blocked.some(b => host.includes(b))) {
    return res.status(200).json({
      blocked: true,
      reason: `${host} doesn't allow scraping. Please fill in the fields manually.`
    })
  }

  // ── Fetch the page ─────────────────────────────────────────────
  let html = ''
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Summond/1.0; +https://summond.design)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(6000)
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    html = await response.text()
  } catch (err) {
    return res.status(200).json({ error: 'Could not fetch that URL. Please fill in manually.' })
  }

  // ── Parse OG / meta tags ───────────────────────────────────────
  function getMeta(property) {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
      new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
    ]
    for (const re of patterns) {
      const m = html.match(re)
      if (m) return decodeHTML(m[1].trim())
    }
    return ''
  }

  function decodeHTML(str) {
    return str
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  }

  const ogImage    = getMeta('og:image') || getMeta('twitter:image') || getMeta('twitter:image:src')
  const ogTitle    = getMeta('og:title') || getMeta('twitter:title')
  const ogDesc     = getMeta('og:description') || getMeta('twitter:description')
  const ogSiteName = getMeta('og:site_name')

  // ── Platform-specific handle extraction ───────────────────────
  let creator = ''
  let caption = ogTitle || ogDesc || ''

  if (host.includes('dribbble.com')) {
    // og:title is usually "Shot name by Creator Name on Dribbble"
    const m = ogTitle.match(/by (.+?) on Dribbble/i)
    if (m) creator = m[1].trim()
    // Clean caption — remove the " by X on Dribbble" suffix
    caption = ogTitle.replace(/ by .+ on Dribbble/i, '').trim() || ogDesc
  }
  else if (host.includes('x.com') || host.includes('twitter.com')) {
    // Handle is in the URL path: x.com/handle/status/...
    const m = parsed.pathname.match(/^\/([^/]+)\/status/)
    if (m) creator = '@' + m[1]
    caption = ogDesc || ogTitle
    // X og:description often starts with the tweet text directly
  }
  else if (host.includes('youtube.com') || host.includes('youtu.be')) {
    const m = getMeta('og:video:tag') || ''
    creator = getMeta('og:site_name') || 'YouTube'
    caption = ogTitle
  }
  else if (host.includes('vimeo.com')) {
    // Vimeo og:title is "Video Name on Vimeo"
    caption = ogTitle.replace(/ on Vimeo$/i, '').trim()
    // Try to get author from page title pattern "Title by Author"
    const m = ogTitle.match(/by (.+?) on Vimeo/i)
    if (m) creator = m[1].trim()
  }
  else if (host.includes('codepen.io')) {
    // codepen.io/handle/pen/slug
    const m = parsed.pathname.match(/^\/([^/]+)\/pen/)
    if (m) creator = m[1]
    caption = ogTitle.replace(/ on CodePen/i, '').trim()
  }
  else if (host.includes('github.com')) {
    // github.com/user/repo
    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts[0]) creator = parts[0]
    caption = ogTitle || ogDesc
  }
  else {
    // Generic fallback — use og:title as caption
    caption = ogTitle || ogDesc || ''
  }

  // Trim caption to 120 chars
  if (caption.length > 120) caption = caption.slice(0, 117) + '...'

  return res.status(200).json({
    mediaUrl: ogImage || '',
    caption:  caption  || '',
    creator:  creator  || '',
    site:     ogSiteName || host
  })
}
