const rateLimit = new Map()

function isRateLimited(userId) {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const key = `${userId}-${Math.floor(now / dayMs)}` // resets each day

  const count = rateLimit.get(key) || 0
  if (count >= 5) return true
  rateLimit.set(key, count + 1)
  return false
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { prompt, userId } = req.body
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' })
  if (!userId) return res.status(400).json({ error: 'No user ID provided' })

  if (isRateLimited(userId)) {
    return res.status(429).json({ error: 'You have used all 5 suggestions for today. Come back tomorrow!' })
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.7
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Groq error')
    const text = data.choices?.[0]?.message?.content?.trim()
    res.status(200).json({ text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}