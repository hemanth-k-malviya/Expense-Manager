import { useEffect, useRef, useState } from 'react'
import { categoryLabel } from '../i18n'
import { formatAssistantReply, interpretLocal } from '../lib/assistant'
import { applyAssistantResult } from '../lib/assistantActions'
import { interpretUserMessage } from '../lib/gemini'
import { monthLabel, todayISO } from '../lib/dates'
import { formatMoney } from '../lib/format'
import { languageMeta } from '../i18n/languages'
import { useExpenses } from '../context/ExpenseContext'

const CHIPS = [
  { id: 'add', promptKey: 'ai.chip.add' },
  { id: 'client', promptKey: 'ai.chip.client' },
  { id: 'billable', promptKey: 'ai.chip.billable' },
  { id: 'reimburse', promptKey: 'ai.chip.reimburse' },
  { id: 'spend', promptKey: 'ai.chip.spend' },
  { id: 'summary', promptKey: 'ai.chip.summary' },
]

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

  const money = (value) => formatMoney(value, profile.currency)

  const replyText = (result) => {
    if (result.answer) return result.answer
    return formatAssistantReply(result, {
      t: tRef.current,
      money,
      categoryLabel: (name) => categoryLabel(tRef.current, name),
      monthLabel: snapshotRef.current.monthLabel,
    })
  }

  const pushAssistant = (result, extraText) => {
    const text = extraText || replyText(result)
    setMessages((current) => {
      const next = [
        ...current,
        {
          id: createId(),
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
  }

  const process = async (text) => {
    busyRef.current = true
    setBusy(true)
    try {
      const result = await interpretUserMessage(text, snapshotRef.current, historyFrom(messagesRef.current))
      let extra
      if (result.intent === 'add' || result.intent === 'do') {
        const applied = applyAssistantResult(result, apiRef.current)
        extra =
          result.answer ||
          tRef.current(applied.key, {
            ...applied.params,
            amount: applied.params?.amount != null ? money(applied.params.amount) : undefined,
          })
      }
      pushAssistant(result, extra)
    } catch {
      pushAssistant(interpretLocal(text, snapshotRef.current))
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

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    const prompt = seedPrompt.trim()
    if (!prompt || prompt === lastAutoPrompt) return
    lastAutoPrompt = prompt
    run(prompt)
  }, [seedPrompt])

  const handleClose = () => {
    lastAutoPrompt = ''
    queueRef.current = []
    onClose()
  }

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className="mb-0 flex h-[min(calc(100dvh-10.5rem),540px)] w-[min(calc(100vw-2rem),380px)] flex-col overflow-hidden rounded-[20px] border border-[#dce4dc] bg-white shadow-[0_18px_50px_rgba(29,52,52,0.22)] md:h-[min(68dvh,540px)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-chat-title"
    >
      <div className="flex items-center gap-3 bg-[#1d3434] px-4 py-3 text-[#f6f7ef]">
        <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#c9e75b] text-[15px] font-bold text-[#1d3434]">✦</span>
        <div className="min-w-0 flex-1">
          <h3 id="ai-chat-title" className="truncate font-['Space_Grotesk'] text-[14px] font-semibold">
            {t('ai.title')}
          </h3>
          <p className="truncate text-[11px] text-[#adc0b9]">{t('ai.subtitle')}</p>
        </div>
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
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            run(input)
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('ai.placeholder')}
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
