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

  function decodeHTML(str) {
    return str
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  }

  // ── X / Twitter — use oEmbed API ──────────────────────────────
  if (host.includes('x.com') || host.includes('twitter.com')) {
    // Extract handle from URL regardless
    const handleMatch = parsed.pathname.match(/^\/([^/]+)\/status/)
    const creator = handleMatch ? '@' + handleMatch[1] : ''

    try {
      // Normalise to twitter.com for oEmbed
      const twitterUrl = url.replace('x.com', 'twitter.com')
      const oembedRes = await fetch(
        `https://publish.twitter.com/oembed?url=${encodeURIComponent(twitterUrl)}&omit_script=true`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (oembedRes.ok) {
        const oembed = await oembedRes.json()
        // Extract plain text from the HTML snippet — strip tags
        const rawHtml = oembed.html || ''
        const textMatch = rawHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
        let caption = textMatch ? textMatch[1].replace(/<[^>]+>/g, '').trim() : ''
        caption = decodeHTML(caption)
        if (caption.length > 120) caption = caption.slice(0, 117) + '...'

        // oEmbed thumbnail_url is the user avatar — not useful as media
        // Return empty mediaUrl; user must paste the direct media URL
        return res.status(200).json({
          mediaUrl: '',
          caption,
          creator: creator || (oembed.author_name ? '@' + oembed.author_url?.split('/').pop() : ''),
          site: 'X / Twitter',
          note: 'X videos cannot be auto-fetched. Please paste the direct media URL manually.'
        })
      }
    } catch {}

    // oEmbed failed — return just the handle
    return res.status(200).json({
      mediaUrl: '',
      caption: '',
      creator,
      site: 'X / Twitter',
      note: 'X videos cannot be auto-fetched. Please paste the direct media URL manually.'
    })
  }

  // ── Fetch the page HTML ────────────────────────────────────────
  let html = ''
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
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

  const ogImage    = getMeta('og:image') || getMeta('twitter:image') || getMeta('twitter:image:src')
  const ogTitle    = getMeta('og:title') || getMeta('twitter:title')
  const ogDesc     = getMeta('og:description') || getMeta('twitter:description')
  const ogSiteName = getMeta('og:site_name')

  let creator = ''
  let caption = ogTitle || ogDesc || ''
  let note = ''

  if (host.includes('dribbble.com')) {
    const m = ogTitle.match(/by (.+?) on Dribbble/i)
    if (m) creator = m[1].trim()
    caption = ogTitle.replace(/ by .+ on Dribbble/i, '').trim() || ogDesc
  }
  else if (host.includes('youtube.com') || host.includes('youtu.be')) {
    creator = getMeta('og:site_name') || 'YouTube'
    caption = ogTitle
  }
  else if (host.includes('vimeo.com')) {
    caption = ogTitle.replace(/ on Vimeo$/i, '').trim()
    const m = ogTitle.match(/by (.+?) on Vimeo/i)
    if (m) creator = m[1].trim()
  }
  else if (host.includes('codepen.io')) {
    const m = parsed.pathname.match(/^\/([^/]+)\/pen/)
    if (m) creator = m[1]
    caption = ogTitle.replace(/ on CodePen/i, '').trim()
  }
  else if (host.includes('github.com')) {
    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts[0]) creator = parts[0]
    caption = ogTitle || ogDesc
  }
  else {
    caption = ogTitle || ogDesc || ''
  }

  if (caption.length > 120) caption = caption.slice(0, 117) + '...'

  return res.status(200).json({
    mediaUrl: ogImage || '',
    caption:  caption  || '',
    creator:  creator  || '',
    site:     ogSiteName || host,
    ...(note ? { note } : {})
  })
}
