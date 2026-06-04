export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=300') // refresh every 5 mins

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY
  const sheetId = '1UbDhTzm6bF_d2I8vLb9IcWgzzVim2p5hrMegJn9xyXg'

  if (!apiKey) return res.json({ projects: [], missing: true })

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.values || data.values.length < 2) {
      return res.json({ projects: [] })
    }

    // Columns: A=Caption, B=Media URL, C=Creator URL, D=Tool, E=Creator, F=Status
    const rows = data.values.slice(1)

    const projects = rows
      .filter(row => {
        const status = (row[5] || '').toString().toLowerCase().trim()
        return status === 'true' || status === 'approved'
      })
      .map((row, i) => {
        const creatorUrl = row[2] || ''
        const mediaUrl   = row[1] || ''

        // Detect platform from creator profile URL
        let platform = 'web'
        if (creatorUrl.includes('x.com') || creatorUrl.includes('twitter.com')) platform = 'x'
        else if (creatorUrl.includes('dribbble.com'))  platform = 'dribbble'
        else if (creatorUrl.includes('behance.net'))   platform = 'behance'
        else if (creatorUrl.includes('linkedin.com'))  platform = 'linkedin'
        else if (creatorUrl.includes('instagram.com')) platform = 'instagram'
        else if (creatorUrl.includes('youtube.com') || creatorUrl.includes('youtu.be')) platform = 'youtube'
        else if (creatorUrl.includes('loom.com'))      platform = 'loom'
        else if (creatorUrl.includes('github.com'))    platform = 'github'
        else if (creatorUrl.includes('threads.net'))   platform = 'threads'

        const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') ||
                        mediaUrl.includes('loom.com') || mediaUrl.includes('youtube')

        return {
          id: `sub-${i}`,
          caption:    row[0] || '',
          mediaUrl,
          creatorUrl,
          tool:       row[3] || 'AI',
          creator:    row[4] || '',
          platform,
          mediaType:  isVideo ? 'video' : 'image',
          source:     'community',
        }
      })
      .filter(p => p.mediaUrl)

    res.json({ projects })
  } catch (e) {
    res.json({ projects: [], error: String(e) })
  }
}
