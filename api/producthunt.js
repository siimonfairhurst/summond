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
            nod
