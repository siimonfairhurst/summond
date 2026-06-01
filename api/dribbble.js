export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=3600')

  const token = process.env.DRIBBBLE_ACCESS_TOKEN
  if (!token || token === 'your_dribbble_token_here') {
    return res.json({ projects: [], missing: true })
  }

  function detectTool(text) {
    const t = text.toLowerCase()
    if (t.includes('claude')) return 'Claude'
    if (t.includes('cursor')) return 'Cursor'
    if (t.includes('bolt')) return 'Bolt.new'
    if (t.includes('lovable')) return 'Lovable'
    if (t.includes('v0')) return 'v0'
    if (t.includes('replit')) return 'Replit'
    return 'AI'
  }

  function detectCategory(text) {
    const t = text.toLowerCase()
    if (/game|gaming|arcade/.test(t)) return 'game'
    if (/tool|util|productivity|dashboard/.test(t)) return 'tool'
    if (/design|ui|ux|brand/.test(t)) return 'design'
    if (/app|mobile|saas/.test(t)) return 'app'
    return 'website'
  }

  try {
    const response = await fetch(
      `https://api.dribbble.com/v2/shots?per_page=50&sort=popular&access_token=${token}`
    )
    if (!response.ok) return res.json({ projects: [], error: `Dribbble ${response.status}` })

    const shots = await response.json()
    const AI_TERMS = ['ai', 'claude', 'cursor', 'bolt', 'lovable', 'generated', 'vibe', 'gpt', 'v0']

    const aiShots = shots.filter(s => {
      const text = [s.title, s.description || '', ...(s.tags || [])].join(' ').toLowerCase()
      return AI_TERMS.some(t => text.includes(t))
    })

    const finalShots = aiShots.length >= 6 ? aiShots : shots.slice(0, 30)

    const projects = finalShots
      .filter(s => s.images?.hidpi || s.images?.normal)
      .map(s => {
        const text = `${s.title} ${s.description || ''} ${(s.tags || []).join(' ')}`
        return {
          id: `drib-${s.id}`,
          title: s.title,
          description: (s.description || '').replace(/<[^>]+>/g, '').slice(0, 180),
          imageUrl: s.images?.hidpi || s.images?.normal,
          sourceUrl: s.html_url,
          source: 'dribbble',
          tool: detectTool(text),
          category: detectCategory(text),
          likes: s.likes_count || 0,
          author: s.user?.name || '',
        }
      })
      .sort((a, b) => b.likes - a.likes)

    res.json({ projects })
  } catch (e) {
    res.json({ projects: [], error: String(e) })
  }
}
