export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store')

  const token = process.env.PRODUCT_HUNT_TOKEN
  if (!token) return res.json({ error: 'no token found' })

  try {
    const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: `{ posts(first: 3) { edges { node { id name thumbnail { url } } } } }` })
    })

    const text = await response.text()
    res.json({ status: response.status, body: text, tokenLength: token.length })
  } catch (e) {
    res.json({ error: String(e) })
  }
}
