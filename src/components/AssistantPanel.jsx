import { useEffect, useRef, useState } from 'react'
import { categoryLabel } from '../i18n'
import { formatAssistantReply, interpretLocal } from '../lib/assistant'
import { interpretUserMessage } from '../lib/gemini'
import { monthLabel, todayISO } from '../lib/dates'
import { formatMoney } from '../lib/format'
import { languageMeta } from '../i18n/languages'
import { useExpenses } from '../context/ExpenseContext'
import Modal from './Modal'

const CHIPS = [
  { id: 'add', promptKey: 'ai.chip.add' },
  { id: 'spend', promptKey: 'ai.chip.spend' },
  { id: 'budget', promptKey: 'ai.chip.budget' },
  { id: 'summary', promptKey: 'ai.chip.summary' },
]

let lastAutoPrompt = ''

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function AssistantPanel({ seedPrompt = '', onClose, onEditDraft }) {
  const {
    profile,
    categories,
    shops,
    personalMonthTransactions,
    incomeTotal,
    spendingTotal,
    totalBalance,
    expenseBreakdown,
    budgetStatus,
    selectedYear,
    selectedMonth,
    addTransaction,
    language,
    t,
  } = useExpenses()

  const [input, setInput] = useState(seedPrompt)
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState(() => [
    { id: 'hello', role: 'assistant', text: t('ai.hello') },
  ])
  const scroller = useRef(null)

  const snapshot = {
    profile,
    categories,
    shops,
    monthTransactions: personalMonthTransactions,
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

  const money = (value) => formatMoney(value, profile.currency)
  const labelOf = (name) => categoryLabel(t, name)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const pushAssistant = (result) => {
    const text =
      result.intent === 'ask' && result.answer
        ? result.answer
        : formatAssistantReply(result, {
            t,
            money,
            categoryLabel: labelOf,
            monthLabel: snapshot.monthLabel,
          })
    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: 'assistant',
        text,
        draft: result.intent === 'add' ? result.transaction : null,
        source: result.source,
        geminiFallback: result.geminiFallback,
        geminiError: result.geminiError,
      },
    ])
  }

  const run = async (raw) => {
    const text = raw.trim()
    if (!text || busy) return
    setInput('')
    setMessages((current) => [...current, { id: createId(), role: 'user', text }])
    setBusy(true)
    try {
      const result = await interpretUserMessage(text, snapshot)
      pushAssistant(result)
    } catch {
      pushAssistant(interpretLocal(text, snapshot))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const prompt = seedPrompt.trim()
    if (!prompt || prompt === lastAutoPrompt) return
    lastAutoPrompt = prompt
    run(prompt)
  }, [seedPrompt])

  const handleClose = () => {
    lastAutoPrompt = ''
    onClose()
  }

  const saveDraft = (draft) => {
    addTransaction(draft)
    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: 'assistant',
        text: t('ai.added', { name: draft.name, amount: money(draft.amount) }),
      },
    ])
  }

  return (
    <Modal title={t('ai.title')} onClose={handleClose} wide>
      <p className="mt-[-8px] text-[12px] text-[#7d8782]">{t('ai.subtitle')}</p>

      <div ref={scroller} className="mt-4 max-h-[min(52vh,420px)] space-y-3 overflow-y-auto pr-1">
        {messages.map((item) => (
          <div key={item.id} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[92%] rounded-[12px] px-3 py-2 text-[13px] leading-6 ${
                item.role === 'user' ? 'bg-[#1d3434] text-white' : 'bg-[#f3f6f1] text-[#2f3d3b]'
              }`}
            >
              <p>{item.text}</p>
              {item.source === 'gemini' ? <p className="mt-1 text-[10px] font-medium opacity-70">{t('ai.source.gemini')}</p> : null}
              {item.geminiFallback ? <p className="mt-1 text-[10px] opacity-70">{t(`ai.error.${item.geminiError || 'generic'}`)}</p> : null}
              {item.draft ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => saveDraft(item.draft)}
                    className="rounded-[7px] bg-[#e96d52] px-3 py-1.5 text-[11px] font-bold text-white"
                  >
                    {t('ai.confirm')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditDraft(item.draft)}
                    className="rounded-[7px] border border-[#dfe6df] bg-white px-3 py-1.5 text-[11px] font-medium text-[#4d7772]"
                  >
                    {t('ai.edit')}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {busy ? <p className="text-[12px] text-[#7d8782]">{t('ai.thinking')}</p> : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => run(t(chip.promptKey))}
            className="rounded-full border border-[#dde3db] bg-white px-3 py-1.5 text-[11px] text-[#5b6b67]"
          >
            {t(chip.promptKey)}
          </button>
        ))}
      </div>

      <form
        className="mt-4 flex gap-2"
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
          className="min-h-11 flex-1 rounded-[8px] border border-[#dfe6df] bg-[#f9faf8] px-3 text-[13px] outline-none focus:border-[#b9d4c7]"
        />
        <button type="submit" disabled={busy || !input.trim()} className="min-h-11 rounded-[8px] bg-[#1d3434] px-4 text-[12px] font-semibold text-white disabled:opacity-50">
          {t('ai.send')}
        </button>
      </form>
      <p className="field-hint mt-2">{t('ai.inputHint')}</p>
    </Modal>
  )
}
