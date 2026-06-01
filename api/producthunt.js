export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=3600')

  // Use the developer token directly — simpler and more reliable
  const token = process.env.PRODUCT_HUNT_TOKEN
  if (!token || token === 'your_token_here') {
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
    if (/game|gaming/.test(t)) return 'game'
    if (/tool|util|productivity|dashboard|developer/.test(t)) return 'tool'
    if (/design|ui|ux/.test(t)) return 'design'
    if (/app|mobile|saas/.test(t)) return 'app'
    return 'website'
  }

  const QUERY = `
    query GetPosts($topic: String!) {
      posts(topic: $topic, order: VOTES, first: 30) {
        edges {
          node {
            id name tagline url votesCount
            thumbnail { url }
            media { url type }
            topics { edges { node { name } } }
            maker { name profileImage }
            createdAt
          }
        }
      }
    }
  `

  try {
    const topics = ['artificial-intelligence', 'developer-tools', 'no-code', 'productivity']
    const results = await Promise.all(topics.map(topic =>
      fetch('https://api.producthunt.com/v2/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: QUERY, variables: { topic } })
      }).then(r => r.json()).then(d => d?.data?.posts?.edges?.map(e => e.node) || [])
    ))

    const posts = results.flat()
    const seen = new Set()
    const unique = posts.filter(p => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    }).filter(p => p.thumbnail?.url)

    const projects = unique.map(p => {
      const topics = p.topics?.edges?.map(e => e.node.name) || []
      const fullText = `${p.name} ${p.tagline} ${topics.join(' ')}`
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
    }).sort((a, b) => b.likes - a.likes)

    res.json({ projects })
  } catch (e) {
    res.json({ projects: [], error: String(e) })
  }
}
