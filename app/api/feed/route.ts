import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || 'all'
  const base = new URL(req.url).origin

  const [ph, drib] = await Promise.allSettled([
    fetch(`${base}/api/producthunt`).then(r => r.json()),
    fetch(`${base}/api/dribbble`).then(r => r.json()),
  ])

  const phProjects = ph.status === 'fulfilled' ? (ph.value.projects || []) : []
  const dribProjects = drib.status === 'fulfilled' ? (drib.value.projects || []) : []
  const phMissing = ph.status === 'fulfilled' ? !!ph.value.missing : true
  const dribMissing = drib.status === 'fulfilled' ? !!drib.value.missing : true

  let all = [...phProjects, ...dribProjects]

  // Category filter
  if (category !== 'all') {
    all = all.filter(p => p.category === category)
  }

  // Sort by likes — trending first
  all.sort((a, b) => b.likes - a.likes)

  return NextResponse.json({
    projects: all,
    total: all.length,
    missing: { producthunt: phMissing, dribbble: dribMissing },
  })
}
