import { NextResponse } from 'next/server'

function detectTool(text: string) {
  const t = text.toLowerCase()
  if (t.includes('claude')) return 'Claude'
  if (t.includes('cursor')) return 'Cursor'
  if (t.includes('bolt')) return 'Bolt.new'
  if (t.includes('lovable')) return 'Lovable'
  if (t.includes('v0')) return 'v0'
  if (t.includes('replit')) return 'Replit'
  return 'AI'
}

function detectCategory(text: string) {
  const t = text.toLowerCase()
  if (/game|gaming|arcade/.test(t)) return 'game'
  if (/tool|util|productivity|dashboard/.test(t)) return 'tool'
  if (/design|ui|ux|brand/.test(t)) return 'design'
  if (/app|mobile|saas/.test(t)) return 'app'
  return 'website'
}

export async function GET() {
  const token = process.env.DRIBBBLE_ACCESS_TOKEN
  if (!token || token === 'your_dribbble_token_here') {
    return NextResponse.json({ projects: [], missing: true })
  }

  try {
    const res = await fetch(
      `https://api.dribbble.com/v2/shots?per_page=50&sort=popular&access_token=${token}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return NextResponse.json({ projects: [], error: `Dribbble ${res.status}` })

    const shots = await res.json()
    const AI_TERMS = ['ai', 'claude', 'cursor', 'bolt', 'lovable', 'generated', 'vibe', 'gpt', 'v0']
    const aiShots = shots.filter((s: any) => {
      const text = [s.title, s.description || '', ...(s.tags || [])].join(' ').toLowerCase()
      return AI_TERMS.some(t => text.includes(t))
    })
    const finalShots = aiShots.length >= 6 ? aiShots : shots.slice(0, 30)

    const projects = finalShots
      .filter((s: any) => s.images?.hidpi || s.images?.normal)
      .map((s: any) => {
        const text = `${s.title} ${s.description || ''} ${(s.tags || []).join(' ')}`
        return {
          id: `drib-${s.id}`,
          title: s.title,
          description: s.description?.replace(/<[^>]+>/g, '').slice(0, 180) || '',
          imageUrl: s.images?.hidpi || s.images?.normal,
          sourceUrl: s.html_url,
          source: 'dribbble',
          tool: detectTool(text),
          category: detectCategory(text),
          likes: s.likes_count || 0,
          author: s.user?.name || '',
          authorAvatar: s.user?.avatar_url,
          createdAt: s.created_at,
        }
      })

    projects.sort((a: any, b: any) => b.likes - a.likes)
    return NextResponse.json({ projects })
  } catch (e) {
    return NextResponse.json({ projects: [], error: String(e) })
  }
}
