export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=3600')

  const category = req.query.category || 'all'
  const base = `https://${req.headers.host}`

  const [ph, drib] = await Promise.allSettled([
    fetch(`${base}/api/producthunt`).then(r => r.json()),
    fetch(`${base}/api/dribbble`).then(r => r.json()),
  ])

  const phProjects = ph.status === 'fulfilled' ? (ph.value.projects || []) : []
  const dribProjects = drib.status === 'fulfilled' ? (drib.value.projects || []) : []
  const missing = {
    producthunt: ph.status === 'fulfilled' ? !!ph.value.missing : true,
    dribbble: drib.status === 'fulfilled' ? !!drib.value.missing : true,
  }

  let all = [...phProjects, ...dribProjects]
  if (category !== 'all') all = all.filter(p => p.category === category)
  all.sort((a, b) => b.likes - a.likes)

  res.json({ projects: all, total: all.length, missing })
}
