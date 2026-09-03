import { compactSnapshot, interpretLocal } from './assistant'
import { hydrateTransaction, normalizeDoPayload } from './assistantActions'

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
  return hydrateTransaction(raw, snapshot)
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

function buildPayload(text, snapshot, history = [], includeThinking = true) {
  const generationConfig = {
    temperature: 0.65,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json',
  }
  if (includeThinking) generationConfig.thinkingConfig = { thinkingLevel: 'MINIMAL' }

  const turns = (history || [])
    .filter((item) => item?.text && (item.role === 'user' || item.role === 'model'))
    .slice(-12)

  const contents = turns.map((item) => ({
    role: item.role,
    parts: [{ text: item.text }],
  }))

  if (!contents.length || contents[0].role !== 'user') {
    contents.unshift({
      role: 'user',
      parts: [{ text: 'Hi' }],
    })
  }

  contents.push({
    role: 'user',
    parts: [
      {
        text: `New user message (reply to this one, do not reuse a previous answer):\n${text}`,
      },
    ],
  })

  return {
    systemInstruction: {
      parts: [
        {
          text: `You are the workspace assistant for Expense So, a personal and business money app.
Reply in ${snapshot.languageName || 'English'}.
Today is ${snapshot.today}.
Workspace data (JSON): ${JSON.stringify(compactSnapshot(snapshot))}

Every user message needs a new natural-language reply in "answer". Never return an empty answer. Do not repeat the last reply word for word.

You can add personal and business records, not only chat.
Return ONLY JSON:
{"intent":"add"|"do"|"ask"|"help","action":"client"|"vendor"|"shop"|"employee"|"department"|"project"|"bill"|"invoice"|"budget"|"goal"|"approve"|"reject"|"reimburse"|null,"answer":string,"transaction":{"name":string,"amount":number,"type":"expense"|"income","category":string,"date":"YYYY-MM-DD","paymentMethod":"Card"|"Cash"|"Bank"|"Wallet","note":string,"shop":string,"client":string,"employee":string,"vendor":string,"billable":boolean,"reimbursable":boolean,"taxRate":number}|null,"payload":{"name":string,"amount":number,"city":string,"type":string,"role":string,"party":string,"category":string,"client":string,"employee":string,"vendor":string,"department":string,"deadline":string}|null}

Rules:
- Always fill "answer" with a fresh reply to the latest user message.
- intent "add" when the user recorded money in or out. Category must be one of the workspace categories. Set billable true for client bill-backs. Set reimbursable true for staff claims.
- intent "do" when the user asked to add a client, vendor, shop, employee, department, project, bill, invoice, budget, goal, or to approve/reject/reimburse a claim. Fill action and payload.
- intent "ask" for questions, greetings, and follow-up chat.
- Create missing names in payload when the user asked to add them. Do not refuse business work.`,
        },
      ],
    },
    contents,
    generationConfig,
  }
}

export async function interpretWithGemini(text, snapshot, apiKey, history = []) {
  let lastStatus = 0
  let lastMessage = ''
  let includeThinking = true

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      let response
      let data
      try {
        ;({ response, data } = await postModel(model, apiKey, buildPayload(text, snapshot, history, includeThinking)))
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

      const answer = parsed.answer ? String(parsed.answer).trim() : ''

      if (parsed.intent === 'add') {
        const transaction = normalizeTransaction(parsed.transaction, snapshot)
        if (!transaction) {
          const error = new Error('Gemini add payload was incomplete')
          error.code = 'generic'
          throw error
        }
        return { intent: 'add', transaction, answer, source: 'gemini' }
      }

      if (parsed.intent === 'do' && parsed.action) {
        const payload = normalizeDoPayload(parsed.action, parsed.payload || parsed.transaction, snapshot) || parsed.payload || {}
        return { intent: 'do', action: parsed.action, payload, answer, source: 'gemini' }
      }

      if (answer) {
        return { intent: 'ask', topic: 'cloud', answer, source: 'gemini' }
      }

      return { intent: 'help', answer: '', source: 'gemini' }
    }
  }

  const error = new Error(lastMessage || `Gemini HTTP ${lastStatus}`)
  error.code = errorCodeFromHttp(lastStatus)
  throw error
}

export async function interpretUserMessage(text, snapshot, history = []) {
  const local = interpretLocal(text, snapshot)
  if (!canUseCloud(snapshot.profile)) return local

  try {
    const cloud = await interpretWithGemini(text, snapshot, geminiKeyFrom(snapshot.profile), history)
    if (cloud.intent === 'add' && cloud.transaction) return cloud
    if (cloud.intent === 'do' && cloud.action) return cloud
    if (cloud.answer) return { intent: 'ask', topic: 'cloud', answer: cloud.answer, source: 'gemini' }
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
