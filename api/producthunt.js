export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const token = process.env.PRODUCT_HUNT_TOKEN
  if (!token) return res.json({ error: 'no token' })

  try {
    const raw = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: `{ posts(first: 3) { edges { node { id name } } } }` })
    }).then(r => r.json())

    res.json({ raw })
  } catch (e) {
    res.json({ error: String(e) })
  }
}
