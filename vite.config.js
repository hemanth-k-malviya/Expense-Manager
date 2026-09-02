import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function geminiDevProxy(env) {
  const serverKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''

  return {
    name: 'gemini-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0] || ''
        if (req.method !== 'POST' || !path.startsWith('/api/gemini/')) {
          next()
          return
        }

        const model = decodeURIComponent(path.slice('/api/gemini/'.length).split('/')[0] || '')
        if (!model) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: { message: 'Missing Gemini model' } }))
          return
        }

        const headerKey = req.headers['x-goog-api-key']
        const apiKey = (typeof headerKey === 'string' && headerKey.trim()) || serverKey
        if (!apiKey) {
          res.statusCode = 401
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: { message: 'Missing Gemini API key' } }))
          return
        }

        const chunks = []
        for await (const chunk of req) chunks.push(chunk)

        try {
          const upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
              },
              body: Buffer.concat(chunks),
            },
          )
          const text = await upstream.text()
          res.statusCode = upstream.status
          res.setHeader('Content-Type', 'application/json')
          res.end(text)
        } catch {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: { message: 'Gemini proxy failed' } }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), geminiDevProxy(env)],
  }
})
