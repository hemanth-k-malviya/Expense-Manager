import { useEffect, useRef, useState } from 'react'
import { categoryLabel, translate } from '../i18n'
import { formatAssistantReply, interpretLocal } from '../lib/assistant'
import { applyAssistantResult } from '../lib/assistantActions'
import { interpretUserMessage } from '../lib/gemini'
import { monthLabel, todayISO } from '../lib/dates'
import { formatMoney } from '../lib/format'
import { languageMeta } from '../i18n/languages'
import {
  canUseSpeechInput,
  canUseSpeechOutput,
  createSpeechListener,
  languageForSpeech,
  replyLanguageFor,
  speakText,
  stopSpeaking,
} from '../lib/voice'
import { useExpenses } from '../context/ExpenseContext'

const CHIPS = [
  { id: 'add', promptKey: 'ai.chip.add' },
  { id: 'client', promptKey: 'ai.chip.client' },
  { id: 'billable', promptKey: 'ai.chip.billable' },
  { id: 'reimburse', promptKey: 'ai.chip.reimburse' },
  { id: 'spend', promptKey: 'ai.chip.spend' },
  { id: 'summary', promptKey: 'ai.chip.summary' },
]

const SPEAK_PREF_KEY = 'expense-so-ai-speak'

let lastAutoPrompt = ''

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function historyFrom(messages) {
  const turns = messages
    .filter((item) => item.id !== 'hello' && item.text)
    .slice(-12)
    .map((item) => ({
      role: item.role === 'user' ? 'user' : 'model',
      text: item.text,
    }))
  if (turns.length && turns[turns.length - 1].role === 'user') turns.pop()
  return turns
}

function readSpeakPref() {
  try {
    return window.localStorage.getItem(SPEAK_PREF_KEY) === '1'
  } catch {
    return false
  }
}

export default function AssistantPanel({ seedPrompt = '', onClose }) {
  const expenses = useExpenses()
  const {
    profile,
    categories,
    shops,
    clients,
    vendors,
    employees,
    departments,
    projects,
    monthTransactions,
    transactions,
    incomeTotal,
    spendingTotal,
    totalBalance,
    expenseBreakdown,
    budgetStatus,
    selectedYear,
    selectedMonth,
    addTransaction,
    addClient,
    addVendor,
    addShop,
    addEmployee,
    addDepartment,
    addProject,
    addBill,
    addInvoice,
    upsertBudget,
    addGoal,
    setTransactionStatus,
    language,
    t,
  } = expenses

  const [input, setInput] = useState(seedPrompt)
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [speakReplies, setSpeakReplies] = useState(() => canUseSpeechOutput() && readSpeakPref())
  const [speakingId, setSpeakingId] = useState('')
  const [voiceNote, setVoiceNote] = useState('')
  const [messages, setMessages] = useState(() => [
    { id: 'hello', role: 'assistant', text: t('ai.hello') },
  ])
  const scroller = useRef(null)
  const busyRef = useRef(false)
  const queueRef = useRef([])
  const messagesRef = useRef(messages)
  const snapshotRef = useRef(null)
  const apiRef = useRef(null)
  const tRef = useRef(t)
  const recognitionRef = useRef(null)
  const speakRepliesRef = useRef(speakReplies)
  const languageRef = useRef(language)
  const voiceLanguageRef = useRef(language)
  const spokenIdsRef = useRef(new Set(['hello']))

  const speechInputOk = canUseSpeechInput()
  const speechOutputOk = canUseSpeechOutput()

  const snapshot = {
    profile,
    categories,
    shops,
    clients,
    vendors,
    employees,
    departments,
    projects,
    transactions,
    monthTransactions,
    incomeTotal,
    spendingTotal,
    totalBalance,
    expenseBreakdown,
    budgetStatus,
    today: todayISO(),
    currency: profile.currency,
    monthLabel: monthLabel(selectedYear, selectedMonth, t),
    languageName: languageMeta(language).english,
  }

  const api = {
    ...snapshot,
    addTransaction,
    addClient,
    addVendor,
    addShop,
    addEmployee,
    addDepartment,
    addProject,
    addBill,
    addInvoice,
    upsertBudget,
    addGoal,
    setTransactionStatus,
  }

  snapshotRef.current = snapshot
  apiRef.current = api
  tRef.current = t
  messagesRef.current = messages
  speakRepliesRef.current = speakReplies
  languageRef.current = language
  if (language === 'hi') {
    voiceLanguageRef.current = 'hi'
  } else if (voiceLanguageRef.current !== 'hi') {
    voiceLanguageRef.current = language
  }

  const money = (value) => formatMoney(value, profile.currency)

  const replyText = (result, replyLang) => {
    if (result.answer) return result.answer
    const tReply = (key, vars) => translate(replyLang, key, vars)
    return formatAssistantReply(result, {
      t: tReply,
      money,
      categoryLabel: (name) => categoryLabel(tReply, name),
      monthLabel: monthLabel(selectedYear, selectedMonth, tReply),
    })
  }

  const speakAssistant = (id, text, replyLang) => {
    if (!speechOutputOk || !text) return
    spokenIdsRef.current.add(id)
    setSpeakingId(id)
    speakText(text, languageForSpeech(text, replyLang || languageRef.current), {
      onEnd: () => setSpeakingId((current) => (current === id ? '' : current)),
    })
  }

  const pushAssistant = (result, extraText, replyLang) => {
    const lang = replyLang || languageRef.current
    const text = extraText || replyText(result, lang)
    const id = createId()
    setMessages((current) => {
      const next = [
        ...current,
        {
          id,
          role: 'assistant',
          text,
          source: result.source,
          geminiFallback: result.geminiFallback,
          geminiError: result.geminiError,
        },
      ]
      messagesRef.current = next
      return next
    })
    if (speakRepliesRef.current) speakAssistant(id, text, lang)
  }

  const process = async (text) => {
    busyRef.current = true
    setBusy(true)
    const replyLang = replyLanguageFor(text, languageRef.current)
    voiceLanguageRef.current = replyLang
    const turnSnapshot = {
      ...snapshotRef.current,
      languageName: languageMeta(replyLang).english,
    }
    const tReply = (key, vars) => translate(replyLang, key, vars)
    try {
      const result = await interpretUserMessage(text, turnSnapshot, historyFrom(messagesRef.current))
      let extra
      if (result.intent === 'add' || result.intent === 'do') {
        const applied = applyAssistantResult(result, apiRef.current)
        extra =
          result.answer ||
          tReply(applied.key, {
            ...applied.params,
            amount: applied.params?.amount != null ? money(applied.params.amount) : undefined,
          })
      }
      pushAssistant(result, extra, replyLang)
    } catch {
      pushAssistant(interpretLocal(text, turnSnapshot), undefined, replyLang)
    } finally {
      const next = queueRef.current.shift()
      if (next) {
        process(next)
      } else {
        busyRef.current = false
        setBusy(false)
      }
    }
  }

  const run = (raw) => {
    const text = String(raw || '').trim()
    if (!text) return
    setInput('')
    setVoiceNote('')
    setMessages((current) => {
      const next = [...current, { id: createId(), role: 'user', text }]
      messagesRef.current = next
      return next
    })
    if (busyRef.current) {
      queueRef.current.push(text)
      return
    }
    process(text)
  }

  const stopMic = ({ abort = false } = {}) => {
    const session = recognitionRef.current
    recognitionRef.current = null
    setListening(false)
    if (!session) return
    try {
      if (abort) session.abort()
      else session.stop()
    } catch {
      // Already stopped.
    }
  }

  const startMic = () => {
    if (!speechInputOk || listening || busy) return
    setVoiceNote('')
    stopSpeaking()
    setSpeakingId('')

    let submitted = false
    const recognition = createSpeechListener({
      language: voiceLanguageRef.current === 'hi' || language === 'hi' ? 'hi' : language,
      onPartial: (text, meta) => {
        setInput(text)
        setVoiceNote(meta?.hearing ? t('ai.hearing') : t('ai.listening'))
      },
      onFinal: (text) => {
        if (submitted) return
        submitted = true
        recognitionRef.current = null
        setListening(false)
        setInput(text)
        setVoiceNote('')
        if (replyLanguageFor(text, language) === 'hi') voiceLanguageRef.current = 'hi'
        run(text)
      },
      onError: (code) => {
        recognitionRef.current = null
        setListening(false)
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          setVoiceNote(t('ai.voiceDenied'))
        } else if (code === 'no-speech' || code === 'aborted') {
          setVoiceNote('')
        } else {
          setVoiceNote(t('ai.voiceError'))
        }
      },
      onEnd: () => {
        recognitionRef.current = null
        setListening(false)
      },
    })

    if (!recognition) {
      setVoiceNote(t('ai.voiceUnsupported'))
      return
    }

    recognitionRef.current = recognition
    setListening(true)
    setVoiceNote(t('ai.listening'))
    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
      setListening(false)
      setVoiceNote(t('ai.voiceError'))
    }
  }

  const toggleMic = () => {
    if (listening) {
      // Finalize current speech instead of discarding it.
      stopMic()
      return
    }
    startMic()
  }

  const toggleSpeakReplies = () => {
    const next = !speakReplies
    setSpeakReplies(next)
    try {
      window.localStorage.setItem(SPEAK_PREF_KEY, next ? '1' : '0')
    } catch {
      // Private mode still toggles for this session.
    }
    if (!next) {
      stopSpeaking()
      setSpeakingId('')
    }
  }

  const toggleSpeakMessage = (item) => {
    if (!speechOutputOk || item.role !== 'assistant') return
    if (speakingId === item.id) {
      stopSpeaking()
      setSpeakingId('')
      return
    }
    speakAssistant(item.id, item.text)
  }

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy, listening])

  useEffect(() => {
    const prompt = seedPrompt.trim()
    if (!prompt || prompt === lastAutoPrompt) return
    lastAutoPrompt = prompt
    run(prompt)
  }, [seedPrompt])

  const handleClose = () => {
    lastAutoPrompt = ''
    queueRef.current = []
    stopMic({ abort: true })
    stopSpeaking()
    onClose()
  }

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      stopMic({ abort: true })
      stopSpeaking()
    }
  }, [])

  return (
    <div
      className="mb-0 flex h-[min(calc(100dvh-11rem),540px)] w-[min(calc(100vw-1.5rem),380px)] flex-col overflow-hidden rounded-[20px] border border-[#dce4dc] bg-white shadow-[0_18px_50px_rgba(29,52,52,0.22)] md:h-[min(68dvh,540px)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-chat-title"
    >
      <div className="flex items-center gap-2 bg-[#1d3434] px-3 py-3 text-[#f6f7ef] sm:gap-3 sm:px-4">
        <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#c9e75b] text-[15px] font-bold text-[#1d3434]">✦</span>
        <div className="min-w-0 flex-1">
          <h3 id="ai-chat-title" className="truncate font-['Space_Grotesk'] text-[14px] font-semibold">
            {t('ai.title')}
          </h3>
          <p className="truncate text-[11px] text-[#adc0b9]">
            {listening ? voiceNote || t('ai.listening') : t('ai.subtitle')}
          </p>
        </div>
        {speechOutputOk ? (
          <button
            type="button"
            onClick={toggleSpeakReplies}
            className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-[14px] leading-none ${
              speakReplies ? 'bg-[#c9e75b] text-[#1d3434]' : 'text-[#adc0b9] hover:bg-white/10 hover:text-white'
            }`}
            aria-pressed={speakReplies}
            aria-label={speakReplies ? t('ai.speakOff') : t('ai.speakOn')}
            title={speakReplies ? t('ai.speakOff') : t('ai.speakOn')}
          >
            {speakReplies ? '🔊' : '🔇'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleClose}
          className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-[20px] leading-none text-[#adc0b9] hover:bg-white/10 hover:text-white"
          aria-label={t('common.close')}
        >
          ×
        </button>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[#f7f8f5] px-3 py-3">
        {messages.map((item) => (
          <div key={item.id} className={`flex gap-1.5 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {item.role === 'assistant' ? (
              <span className="mt-1 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-[#1d3434] text-[10px] text-[#d7ef6b]">✦</span>
            ) : null}
            <div
              className={`max-w-[82%] rounded-[14px] px-3 py-2 text-[13px] leading-5 ${
                item.role === 'user' ? 'rounded-br-sm bg-[#1d3434] text-white' : 'rounded-bl-sm bg-white text-[#2f3d3b] shadow-[0_1px_2px_rgba(29,52,52,0.06)]'
              }`}
            >
              <p className="whitespace-pre-wrap">{item.text}</p>
              {item.source === 'gemini' ? <p className="mt-1 text-[10px] font-medium opacity-70">{t('ai.source.gemini')}</p> : null}
              {item.geminiFallback ? <p className="mt-1 text-[10px] opacity-70">{t(`ai.error.${item.geminiError || 'generic'}`)}</p> : null}
              {item.role === 'assistant' && speechOutputOk ? (
                <button
                  type="button"
                  onClick={() => toggleSpeakMessage(item)}
                  className="mt-2 text-[11px] font-semibold text-[#4d7772]"
                >
                  {speakingId === item.id ? t('ai.stopSpeak') : t('ai.speakMessage')}
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="flex items-center gap-2 text-[12px] text-[#7d8782]">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#1d3434] text-[10px] text-[#d7ef6b]">✦</span>
            {t('ai.thinking')}
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#eef1ed] bg-white px-3 py-2">
        <div className="-mx-1 mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => run(t(chip.promptKey))}
              className="flex-shrink-0 rounded-full border border-[#dde3db] bg-[#f7f8f5] px-2.5 py-1 text-[10px] text-[#5b6b67]"
            >
              {t(chip.promptKey)}
            </button>
          ))}
        </div>
        {voiceNote ? <p className="mb-2 text-[12px] text-[#4d7772]">{voiceNote}</p> : null}
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (listening) {
              stopMic()
              return
            }
            run(input)
          }}
        >
          {speechInputOk ? (
            <button
              type="button"
              onClick={toggleMic}
              disabled={busy}
              className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-[16px] transition disabled:opacity-50 ${
                listening
                  ? 'bg-[#e96d52] text-white shadow-[0_0_0_4px_rgba(233,109,82,0.22)]'
                  : 'border border-[#dfe6df] bg-[#f9faf8] text-[#1d3434] hover:bg-[#eef3e4]'
              }`}
              aria-pressed={listening}
              aria-label={listening ? t('ai.micStop') : t('ai.mic')}
              title={listening ? t('ai.micStop') : t('ai.mic')}
            >
              {listening ? '■' : '🎙'}
            </button>
          ) : null}
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={listening ? t('ai.listening') : t('ai.placeholder')}
            aria-label={t('ai.open')}
            autoFocus
            className="min-h-10 flex-1 rounded-full border border-[#dfe6df] bg-[#f9faf8] px-3 text-[13px] outline-none focus:border-[#b9d4c7]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#e96d52] text-white disabled:opacity-50"
            aria-label={t('ai.send')}
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  )
}
