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
              media {
                url
                videoUrl
                type
              }
            }
          }
        }
      }` })
    })

    const data = await response.json()
    res.json({ raw: data?.data?.posts?.edges?.slice(0,2) })
  } catch (e) {
    res.json({ error: String(e) })
  }
}
