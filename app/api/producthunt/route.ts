import { NextResponse } from 'next/server'

function detectTool(text: string) {
  const t = text.toLowerCase()
  if (t.includes('claude')) return 'Claude'
  if (t.includes('cursor')) return 'Cursor'
  if (t.includes('bolt')) return 'Bolt.new'
  if (t.includes('lovable')) return 'Lovable'
  if (t.includes('v0') || t.includes('vercel')) return 'v0'
  if (t.includes('replit')) return 'Replit'
  return 'AI'
}

function detectCategory(text: string) {
  const t = text.toLowerCase()
  if (/game|gaming/.test(t)) return 'game'
  if (/tool|util|productivity|dashboard|developer/.test(t)) return 'tool'
  if (/design|ui|ux|creative/.test(t)) return 'design'
  if (/app|mobile|saas/.test(t)) return 'app'
  return 'website'
}

const PH_GRAPHQL = 'https://api.producthunt.com/v2/api/graphql'
const TOPICS = ['artificial-intelligence', 'developer-tools', 'no-code', 'productivity']
const QUERY = `
query GetPosts($topic: String!) {
  posts(topic: $topic, order: VOTES, first: 30) {
    edges {
      node {
        id name tagline url votesCount
        thumbnail { url }
        media { url type videoUrl }
        topics { edges { node { name } } }
        maker { name profileImage }
        createdAt
      }
    }
  }
}
`

async function getToken() {
  const res = await fetch('https://api.producthunt.com/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PRODUCT_HUNT_API_KEY,
      client_secret: process.env.PRODUCT_HUNT_API_SECRET,
      grant_type: 'client_credentials',
    }),
    next: { revalidate: 82800 },
  })
  const data = await res.json()
  return data.access_token
}

async function fetchTopic(topic: string, token: string) {
  const res = await fetch(PH_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: QUERY, variables: { topic } }),
    next: { revalidate: 3600 },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data?.data?.posts?.edges?.map((e: any) => e.node) || []
}

export async function GET() {
  const key = process.env.PRODUCT_HUNT_API_KEY
  if (!key || key === 'your_producthunt_api_key_here') {
    return NextResponse.json({ projects: [], missing: true })
  }

  try {
    const token = await getToken()
    if (!token) return NextResponse.json({ projects: [], error: 'Auth failed' })

    const results = await Promise.all(TOPICS.map(t => fetchTopic(t, token)))
    const posts = results.flat()

    const seen = new Set<string>()
    const unique = posts.filter((p: any) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    }).filter((p: any) => p.thumbnail?.url)

    const projects = unique.map((p: any) => {
      const topics = p.topics?.edges?.map((e: any) => e.node.name) || []
      const fullText = `${p.name} ${p.tagline} ${topics.join(' ')}`
      const screenshot = p.media?.find((m: any) => m.type === 'image')?.url
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
        authorAvatar: p.maker?.profileImage,
        createdAt: p.createdAt,
      }
    })

    projects.sort((a: any, b: any) => b.likes - a.likes)
    return NextResponse.json({ projects })
  } catch (e) {
    return NextResponse.json({ projects: [], error: String(e) })
  }
}
