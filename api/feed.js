export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=300')

  const base = `https://${req.headers.host}`

  const [submissions, ph] = await Promise.allSettled([
    fetch(`${base}/api/submissions`).then(r => r.json()),
    fetch(`${base}/api/producthunt`).then(r => r.json()),
  ])

  const subProjects = submissions.status === 'fulfilled' ? (submissions.value.projects || []) : []
  const phProjects = ph.status === 'fulfilled' ? (ph.value.projects || []) : []

  // Community submissions first, then Product Hunt
  const all = [...subProjects, ...phProjects]

  res.json({
    projects: all,
    total: all.length,
    sources: {
      community: subProjects.length,
      producthunt: phProjects.length,
    }
  })
}
