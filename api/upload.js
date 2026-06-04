// Increase Vercel body size limit to 50MB for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { fileBase64, fileName, fileType } = req.body
  if (!fileBase64 || !fileName) return res.status(400).json({ error: 'Missing file data' })

  const PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY
  if (!PRIVATE_KEY) return res.status(500).json({ error: 'ImageKit not configured' })

  try {
    const auth = Buffer.from(PRIVATE_KEY + ':').toString('base64')

    // Use FormData — much more efficient than URLSearchParams for binary data
    const formData = new FormData()
    formData.append('file', fileBase64)          // ImageKit accepts base64 directly
    formData.append('fileName', fileName)
    formData.append('folder', '/summond')
    formData.append('useUniqueFileName', 'true')

    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`
        // Don't set Content-Type — let fetch set it with the boundary for FormData
      },
      body: formData
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
    console.error('Upload error:', err.message)
    return res.status(500).json({ error: 'Upload failed: ' + err.message })
  }
}
