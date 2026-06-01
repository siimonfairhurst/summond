export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=300') // refresh every 5 mins

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY
  const sheetId = '1UbDhTzm6bF_d2I8vLb9IcWgzzVim2p5hrMegJn9xyXg'

  if (!apiKey) return res.json({ projects: [], missing: true })

  try {
    // Fetch all rows from the sheet
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.values || data.values.length < 2) {
      return res.json({ projects: [] })
    }

    // First row is headers: Caption, Media URL, Post URL, Tool, Creator, Status
    const rows = data.values.slice(1) // skip header row

    const projects = rows
      .filter(row => {
        const status = (row[5] || '').toString().toLowerCase().trim()
        // Support both checkbox (TRUE) and text (approved)
        return status === 'true' || status === 'approved'
      })
      .map((row, i) => {
        const postUrl = row[2] || ''
        // Auto-detect platform from URL
        let platform = 'web'
        if (postUrl.includes('x.com') || postUrl.includes('twitter.com')) platform = 'x'
        else if (postUrl.includes('dribbble.com')) platform = 'dribbble'
        else if (postUrl.includes('behance.net')) platform = 'behance'
        else if (postUrl.includes('linkedin.com')) platform = 'linkedin'
        else if (postUrl.includes('instagram.com')) platform = 'instagram'
        else if (postUrl.includes('youtube.com') || postUrl.includes('youtu.be')) platform = 'youtube'
        else if (postUrl.includes('loom.com')) platform = 'loom'

        // Detect if media is video
        const mediaUrl = row[1] || ''
        const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') ||
                        mediaUrl.includes('loom.com') || mediaUrl.includes('youtube')

        const tool = row[3] || 'AI'

        return {
          id: `sub-${i}`,
          caption: row[0] || '',
          mediaUrl,
          postUrl,
          tool,
          creator: row[4] || '',
          platform,
          mediaType: isVideo ? 'video' : 'image',
          source: 'community',
        }
      })
      .filter(p => p.mediaUrl) // must have media

    res.json({ projects })
  } catch (e) {
    res.json({ projects: [], error: String(e) })
  }
}
