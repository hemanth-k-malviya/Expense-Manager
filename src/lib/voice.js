import { languageMeta } from '../i18n/languages'

const DEVANAGARI_RE = /[\u0900-\u097F]/g
const LETTER_RE = /\p{L}/gu
const SILENCE_MS = 1700

export function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function canUseSpeechInput() {
  return Boolean(getSpeechRecognition())
}

export function canUseSpeechOutput() {
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined'
}

export function speechLocaleFor(language) {
  if (language === 'en') return 'en-IN'
  return languageMeta(language).locale || 'en-US'
}

/** True when text is clearly Hindi (Devanagari script). */
export function looksLikeHindi(text) {
  const value = String(text || '')
  const hindiChars = (value.match(DEVANAGARI_RE) || []).join('').length
  if (hindiChars >= 2) return true
  const letters = (value.match(LETTER_RE) || []).length
  return letters > 0 && hindiChars / letters >= 0.25
}

/** Reply / TTS language for this turn: Hindi if the user spoke/wrote Hindi. */
export function replyLanguageFor(text, fallback = 'en') {
  return looksLikeHindi(text) ? 'hi' : fallback || 'en'
}

/** Prefer Hindi TTS when the spoken reply itself is in Hindi. */
export function languageForSpeech(text, fallback = 'en') {
  return looksLikeHindi(text) ? 'hi' : fallback || 'en'
}

export function stopSpeaking() {
  if (!canUseSpeechOutput()) return
  window.speechSynthesis.cancel()
}

export function speakText(text, language, { onEnd } = {}) {
  if (!canUseSpeechOutput()) return null
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!clean) return null

  stopSpeaking()
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.lang = speechLocaleFor(languageForSpeech(clean, language))
  utterance.rate = 1
  utterance.pitch = 1
  if (onEnd) {
    utterance.onend = onEnd
    utterance.onerror = onEnd
  }
  window.speechSynthesis.speak(utterance)
  return utterance
}

function bestAlternative(result) {
  let best = result[0]
  for (let i = 1; i < result.length; i += 1) {
    if ((result[i]?.confidence || 0) > (best?.confidence || 0)) best = result[i]
  }
  return best
}

function joinTranscript(parts) {
  return parts
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Continuous listener that keeps the mic open, picks the best alternative,
 * and finalizes after a short silence (or when stop() is called).
 */
export function createSpeechListener({ language, onPartial, onFinal, onError, onEnd, silenceMs = SILENCE_MS }) {
  const Recognition = getSpeechRecognition()
  if (!Recognition) return null

  const recognition = new Recognition()
  recognition.lang = speechLocaleFor(language)
  recognition.interimResults = true
  recognition.continuous = true
  recognition.maxAlternatives = 3

  let committed = ''
  let interim = ''
  let silenceTimer = null
  let finalized = false
  let intentionalStop = false

  const displayText = () => joinTranscript([committed, interim])

  const clearSilence = () => {
    if (silenceTimer) {
      window.clearTimeout(silenceTimer)
      silenceTimer = null
    }
  }

  const finalize = () => {
    if (finalized) return
    finalized = true
    intentionalStop = true
    clearSilence()
    const text = displayText()
    try {
      recognition.stop()
    } catch {
      // Already stopped.
    }
    if (text) onFinal?.(text)
    else onEnd?.()
  }

  const bumpSilence = () => {
    clearSilence()
    silenceTimer = window.setTimeout(() => {
      if (displayText()) finalize()
    }, silenceMs)
  }

  recognition.onresult = (event) => {
    let nextInterim = ''
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i]
      const best = bestAlternative(result)
      const chunk = String(best?.transcript || '').trim()
      if (!chunk) continue
      if (result.isFinal) {
        committed = joinTranscript([committed, chunk])
      } else {
        nextInterim = joinTranscript([nextInterim, chunk])
      }
    }
    interim = nextInterim
    const text = displayText()
    if (text) {
      onPartial?.(text, { hearing: true })
      bumpSilence()
    }
  }

  recognition.onerror = (event) => {
    const code = event.error || 'failed'
    if (code === 'no-speech' && displayText()) {
      finalize()
      return
    }
    if (code === 'aborted' && intentionalStop) return
    clearSilence()
    finalized = true
    intentionalStop = true
    onError?.(code)
  }

  recognition.onend = () => {
    clearSilence()
    // Chrome often ends continuous sessions early — restart while still active.
    if (!finalized && !intentionalStop) {
      try {
        recognition.start()
        return
      } catch {
        // Fall through to end.
      }
    }
    if (!finalized && displayText()) {
      finalize()
      return
    }
    onEnd?.()
  }

  return {
    start() {
      recognition.start()
    },
    stop() {
      finalize()
    },
    abort() {
      finalized = true
      intentionalStop = true
      clearSilence()
      try {
        recognition.abort()
      } catch {
        try {
          recognition.stop()
        } catch {
          // Already stopped.
        }
      }
      onEnd?.()
    },
  }
}
