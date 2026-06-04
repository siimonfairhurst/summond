// Lightweight auth endpoint — just returns a signature for client-side upload
// The actual file goes browser → ImageKit directly, never touching Vercel
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY
  const PUBLIC_KEY  = process.env.IMAGEKIT_PUBLIC_KEY

  if (!PRIVATE_KEY || !PUBLIC_KEY) {
    return res.status(500).json({ error: 'ImageKit not configured' })
  }

  try {
    // Generate auth signature for client-side upload
    const token = Math.random().toString(36).slice(2)
    const expire = Math.floor(Date.now() / 1000) + 3600 // 1 hour

    const crypto = await import('crypto')
    const signature = crypto.default
      .createHmac('sha1', PRIVATE_KEY)
      .update(token + expire)
      .digest('hex')

    return res.status(200).json({
      signature,
      expire,
      token,
      publicKey: PUBLIC_KEY
    })
  } catch (err) {
    console.error('Auth error:', err)
    return res.status(500).json({ error: 'Auth failed' })
  }
}
