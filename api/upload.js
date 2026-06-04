export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { fileBase64, fileName, fileType } = req.body
  if (!fileBase64 || !fileName) return res.status(400).json({ error: 'Missing file data' })

  const PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY
  const PUBLIC_KEY  = process.env.IMAGEKIT_PUBLIC_KEY

  if (!PRIVATE_KEY) return res.status(500).json({ error: 'ImageKit not configured' })

  try {
    // Build auth header (Basic: privateKey:)
    const auth = Buffer.from(PRIVATE_KEY + ':').toString('base64')

    const body = new URLSearchParams()
    body.append('file', fileBase64)
    body.append('fileName', fileName)
    body.append('folder', '/summond')
    body.append('useUniqueFileName', 'true')

    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('ImageKit error:', data)
      return res.status(500).json({ error: data.message || 'Upload failed' })
    }

    return res.status(200).json({
      url: data.url,
      fileId: data.fileId,
      name: data.name,
      fileType: data.fileType
    })

  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({ error: 'Upload failed' })
  }
}
