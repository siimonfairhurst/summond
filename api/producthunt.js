export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store')

  const token = process.env.PRODUCT_HUNT_TOKEN
  if (!token) return res.json({ projects: [], missing: true })

  try {
    const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
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
            }
          }
        }
      }` })
    })

    const data = await response.json()
    const posts = data?.data?.posts?.edges?.map(e => e.node) || []

    const projects = posts
      .filter(p => p.thumbnail?.url)
      .map(p => ({
        id: `ph-${p.id}`,
        title: p.name,
        description: p.tagline || '',
        imageUrl: p.thumbnail.url,
        sourceUrl: p.url,
        source: 'producthunt',
        tool: 'AI',
        category: 'app',
        likes: p.votesCount || 0,
        author: '',
      }))

    res.json({ projects })
  } catch (e) {
    res.json({ projects: [], error: String(e) })
  }
}
