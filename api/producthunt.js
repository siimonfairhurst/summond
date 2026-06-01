export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=3600')

  const token = process.env.PRODUCT_HUNT_TOKEN
  if (!token) return res.json({ projects: [], missing: true })

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
    if (/game|gaming/.test(t)) return 'game'
    if (/tool|util|productivity|dashboard|developer/.test(t)) return 'tool'
    if (/design|ui|ux/.test(t)) return 'design'
    if (/app|mobile|saas/.test(t)) return 'app'
    return 'website'
  }

  try {
    const data = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: `{
        posts(first: 50) {
          edges {
            node {
              id name tagline url votesCount
              thumbnail { url }
              media { url type }
              topics { edges { node { name } } }
              maker { name profileImage }
            }
          }
        }
      }` })
    }).then(r => r.json())

    const posts = data?.data?.posts?.edges?.map(e => e.node) || []

    const projects = posts
      .filter(p => p.thumbnail?.url)
      .map(p => {
        const topicNames = p.topics?.edges?.map(e => e.node.name) || []
        const fullText = `${p.name} ${p.tagline} ${topicNames.join(' ')}`
        const screenshot = p.media?.find(m => m.type === 'image')?.url
        return {
          id: `ph-${p.id}`,
          title: p.name,
          description: p.tagline || '',
          imageUrl: screenshot || p.thumbnail.url,
          sourceUrl: p.url,
          source: 'producthunt',
          tool: detectTool(fullText),
          category: detectCategory(fullText),
          likes: p.votesCount || 0,
          author: p.maker?.name || '',
        }
      })
      .sort((a, b) => b.likes - a.likes)

    res.json({ projects })
  } catch (e) {
    res.json({ projects: [], error: String(e) })
  }
}
