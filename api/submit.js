export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL
  if (!SCRIPT_URL) {
    return res.status(500).json({ error: 'GOOGLE_SCRIPT_URL not configured' })
  }

  try {
    const { mediaUrl, postUrl, caption, tool, creator, creatorUrl } = req.body

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaUrl, postUrl, caption, tool, creator, creatorUrl })
    })

    if (!response.ok) {
      throw new Error(`Script responded with ${response.status}`)
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Submit error:', err)
    return res.status(500).json({ error: 'Submission failed' })
  }
}
