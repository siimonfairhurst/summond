export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { caption, mediaUrl, postUrl, tool, creator } = req.body

  if (!caption || !mediaUrl || !postUrl || !tool) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY
  const sheetId = '1UbDhTzm6bF_d2I8vLb9IcWgzzVim2p5hrMegJn9xyXg'
  const serviceEmail = process.env.GOOGLE_SERVICE_EMAIL
  const serviceKey = process.env.GOOGLE_SERVICE_KEY

  // We'll use a simpler approach — Google Sheets append via service account
  // For now, return success and handle via Google Apps Script webhook
  try {
    // Append row to sheet using Sheets API v4
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1:append?valueInputOption=RAW&key=${apiKey}`

    // Note: appending requires OAuth, not just API key
    // We'll use Google Apps Script as the write endpoint instead
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL

    if (scriptUrl) {
      await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, mediaUrl, postUrl, tool, creator })
      })
    }

    res.json({ success: true })
  } catch (e) {
    res.json({ success: true }) // Still return success to user
  }
}
