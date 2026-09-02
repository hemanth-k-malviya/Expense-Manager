import { PAYMENT_METHODS } from './constants'
import { compactSnapshot, interpretLocal } from './assistant'
import { todayISO } from './dates'

const MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash']
const REQUEST_TIMEOUT_MS = 45000

function geminiUrl(model) {
  if (import.meta.env.DEV) return `/api/gemini/${model}`
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
}

export function geminiKeyFrom(profile) {
  const fromProfile = String(profile?.geminiApiKey || '').trim()
  const fromEnv = typeof import.meta !== 'undefined' ? String(import.meta.env?.VITE_GEMINI_API_KEY || '').trim() : ''
  return fromProfile || fromEnv
}

function canUseCloud(profile) {
  return Boolean(geminiKeyFrom(profile) || import.meta.env.DEV)
}

function normalizeTransaction(raw, snapshot) {
  if (!raw || typeof raw !== 'object') return null
  const amount = Number(raw.amount)
  if (!Number.isFinite(amount) || amount <= 0) return null

  const type = raw.type === 'income' ? 'income' : 'expense'
  const categories = snapshot.categories || []
  const match = categories.find((item) => item.name === raw.category && item.type === type)
  const fallback = categories.find((item) => item.type === type) || categories[0]
  const payment = PAYMENT_METHODS.includes(raw.paymentMethod) ? raw.paymentMethod : 'Card'
  const shop = (snapshot.shops || []).find((item) => item.id === raw.shopId || item.name === raw.shop)

  return {
    name: String(raw.name || fallback?.name || 'Entry').trim(),
    amount,
    type,
    category: match?.name || fallback?.name || 'Other',
    date: /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : todayISO(),
    paymentMethod: payment,
    note: String(raw.note || '').trim(),
    shopId: shop?.id || '',
  }
}

function extractJson(text) {
  if (!text) return null
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fenced ? fenced[1] : trimmed
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(body.slice(start, end + 1))
  } catch {
    return null
  }
}

function textFromCandidate(data) {
  const parts = data?.candidates?.[0]?.content?.parts || []
  const visible = parts.filter((part) => part?.text && !part.thought).map((part) => part.text).join('')
  if (visible.trim()) return visible
  return parts.filter((part) => part?.text).map((part) => part.text).join('')
}

function errorCodeFromHttp(status) {
  if (status === 401 || status === 403) return 'auth'
  if (status === 404) return 'model'
  if (status === 429 || status === 503) return 'busy'
  return 'generic'
}

async function postModel(model, apiKey, payload) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) headers['x-goog-api-key'] = apiKey

  try {
    const response = await fetch(geminiUrl(model), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const data = await response.json().catch(() => ({}))
    return { response, data }
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeout = new Error('Gemini timed out')
      timeout.code = 'busy'
      throw timeout
    }
    throw error
  } finally {
    window.clearTimeout(timer)
  }
}

function buildPayload(text, snapshot, includeThinking = true) {
  const generationConfig = {
    temperature: 0.2,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json',
  }
  if (includeThinking) generationConfig.thinkingConfig = { thinkingLevel: 'MINIMAL' }

  return {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `You help with a personal expense app called Expense So.
Reply in ${snapshot.languageName || 'English'}.
Today is ${snapshot.today}.
Workspace data (JSON): ${JSON.stringify(compactSnapshot(snapshot))}
User message: ${text}

Return ONLY JSON:
{"intent":"add"|"ask"|"help","answer":string|null,"transaction":{"name":string,"amount":number,"type":"expense"|"income","category":string,"date":"YYYY-MM-DD","paymentMethod":"Card"|"Cash"|"Bank"|"Wallet","note":string,"shop":string}|null}

Use intent "add" when the user recorded money in or out. Category must be one of the workspace categories.
Use intent "ask" for questions, greetings, or chat. Always put a short reply in "answer".`,
          },
        ],
      },
    ],
    generationConfig,
  }
}

export async function interpretWithGemini(text, snapshot, apiKey) {
  let lastStatus = 0
  let lastMessage = ''
  let includeThinking = true

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      let response
      let data
      try {
        ;({ response, data } = await postModel(model, apiKey, buildPayload(text, snapshot, includeThinking)))
      } catch (error) {
        if (error.code === 'busy') {
          lastStatus = 503
          lastMessage = error.message
          break
        }
        throw error
      }

      lastStatus = response.status
      lastMessage = data?.error?.message || ''

      if (response.status === 400 && /thinking/i.test(lastMessage) && includeThinking) {
        includeThinking = false
        attempt -= 1
        continue
      }

      if (response.status === 503 || response.status === 429) {
        await new Promise((resolve) => window.setTimeout(resolve, 800 * (attempt + 1)))
        continue
      }

      if (response.status === 404) break

      if (!response.ok) {
        const error = new Error(lastMessage || `Gemini HTTP ${response.status}`)
        error.code = errorCodeFromHttp(response.status)
        throw error
      }

      const parsed = extractJson(textFromCandidate(data))
      if (!parsed) {
        const error = new Error('Gemini returned no JSON')
        error.code = 'generic'
        throw error
      }

      if (parsed.intent === 'add') {
        const transaction = normalizeTransaction(parsed.transaction, snapshot)
        if (!transaction) {
          const error = new Error('Gemini add payload was incomplete')
          error.code = 'generic'
          throw error
        }
        return { intent: 'add', transaction, source: 'gemini' }
      }

      const answer = parsed.answer ? String(parsed.answer).trim() : ''
      if (answer) {
        return { intent: 'ask', topic: 'cloud', answer, source: 'gemini' }
      }

      return { intent: 'help', source: 'gemini' }
    }
  }

  const error = new Error(lastMessage || `Gemini HTTP ${lastStatus}`)
  error.code = errorCodeFromHttp(lastStatus)
  throw error
}

export async function interpretUserMessage(text, snapshot) {
  const local = interpretLocal(text, snapshot)
  if (local.intent === 'greet') return local
  if (!canUseCloud(snapshot.profile)) return local

  try {
    const cloud = await interpretWithGemini(text, snapshot, geminiKeyFrom(snapshot.profile))
    if (cloud.intent === 'add' && cloud.transaction) return cloud
    if (cloud.intent === 'ask' && cloud.answer) return cloud
    if (local.intent !== 'help') return { ...local, source: 'local' }
    return cloud
  } catch (error) {
    return {
      ...local,
      geminiFallback: true,
      geminiError: error.code || 'generic',
    }
  }
}
