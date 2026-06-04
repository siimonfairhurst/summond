export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'No URL provided' })

  let parsed
  try { parsed = new URL(url) } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  const host = parsed.hostname.replace('www.', '')

  // Blocked platforms — don't even try
  const blocked = ['linkedin.com','instagram.com','tiktok.com','threads.net','facebook.com','pinterest.com']
  if (blocked.some(b => host.includes(b))) {
    return res.status(200).json({
      blocked: true,
      reason: `${host} doesn't allow scraping. Please fill in the fields manually.`
    })
  }

  // X/Twitter — extract handle from URL only
  if (host.includes('x.com') || host.includes('twitter.com')) {
    const m = parsed.pathname.match(/^\/([^/]+)\/status/)
    return res.status(200).json({
      mediaUrl: '', caption: '',
      creator: m ? '@' + m[1] : '',
      site: 'X / Twitter',
      note: 'X blocks auto-fill. Your handle has been added — please paste the tweet text as the caption and right-click your image on X to copy the media URL.'
    })
  }

  // All other platforms — use Microlink
  try {
    const mlRes = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&palette=false&audio=false&video=true&iframe=false`,
      {
        headers: { 'x-api-key': '' }, // free tier, no key needed
        signal: AbortSignal.timeout(8000)
      }
    )

    if (!mlRes.ok) throw new Error(`Microlink ${mlRes.status}`)
    const ml = await mlRes.json()

    if (ml.status !== 'success') {
      return res.status(200).json({ error: 'Could not fetch details for that URL. Please fill in manually.' })
    }

    const d = ml.data
    const mediaUrl = (d.image && d.image.url) || (d.logo && d.logo.url) || ''
    let caption = (d.title || d.description || '').trim()
    let creator = d.publisher || ''

    // Platform-specific cleanup
    if (host.includes('dribbble.com')) {
      const m = (d.title || '').match(/by (.+?) on Dribbble/i)
      if (m) creator = m[1].trim()
      caption = (d.title || '').replace(/ by .+? on Dribbble/i, '').trim() || d.description || ''
    } else if (host.includes('vimeo.com')) {
      caption = (d.title || '').replace(/ on Vimeo$/i, '').trim()
      const m = (d.title || '').match(/by (.+?) on Vimeo/i)
      if (m) creator = m[1].trim()
    } else if (host.includes('codepen.io')) {
      const parts = parsed.pathname.match(/^\/([^/]+)\/pen/)
      if (parts) creator = parts[1]
      caption = (d.title || '').replace(/ on CodePen/i, '').trim()
    } else if (host.includes('github.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean)
      if (parts[0]) creator = parts[0]
    } else if (host.includes('youtube.com') || host.includes('youtu.be')) {
      creator = d.author || d.publisher || ''
    }

    if (caption.length > 120) caption = caption.slice(0, 117) + '...'

    return res.status(200).json({
      mediaUrl: mediaUrl || '',
      caption: caption || '',
      creator: creator || '',
      site: d.publisher || host
    })

  } catch (err) {
    console.error('Scrape error:', err.message)
    return res.status(200).json({ error: 'Could not fetch details for that URL. Please fill in manually.' })
  }
}
