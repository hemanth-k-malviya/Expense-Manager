import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Field, { controlClass } from '../components/Field'
import Modal from '../components/Modal'
import { useExpenses } from '../context/ExpenseContext'
import { daysUntil } from '../lib/dates'
import { clampPercent, formatMoney } from '../lib/format'

function goalForm(goal) {
  return {
    name: goal?.name || '',
    targetAmount: goal ? String(goal.targetAmount) : '',
    currentAmount: goal ? String(goal.currentAmount) : '0',
    deadline: goal?.deadline || '',
    note: goal?.note || '',
  }
}

export default function Goals() {
  const { profile, goals, addGoal, updateGoal, contributeToGoal, deleteGoal, t } = useExpenses()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(goalForm())
  const [contribute, setContribute] = useState(null)
  const [amount, setAmount] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [error, setError] = useState('')

  const openModal = (goal) => {
    setForm(goalForm(goal))
    setError('')
    setModal(goal ? { mode: 'edit', goal } : { mode: 'create' })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const targetAmount = Number.parseFloat(form.targetAmount)
    const currentAmount = Number.parseFloat(form.currentAmount || '0')
    if (!form.name.trim()) {
      setError(t('form.needName'))
      return
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setError(t('form.needTarget'))
      return
    }
    if (!form.deadline) {
      setError(t('form.needDeadline'))
      return
    }
    if (!Number.isFinite(currentAmount) || currentAmount < 0) {
      setError(t('form.needSaved'))
      return
    }

    const payload = {
      name: form.name,
      targetAmount,
      currentAmount,
      deadline: form.deadline,
      note: form.note,
    }

    if (modal.mode === 'edit') {
      updateGoal(modal.goal.id, payload)
    } else {
      addGoal(payload)
    }
    setModal(null)
  }

  const handleContribute = (event) => {
    event.preventDefault()
    const value = Number.parseFloat(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError(t('form.needAmount'))
      return
    }
    contributeToGoal(contribute.id, value)
    setContribute(null)
    setAmount('')
    setError('')
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title m-0 font-semibold text-[#223535]">{t('goals.title')}</h1>
          <p className="mt-2 text-[13px] text-[#88918b]">{t('goals.subtitle')}</p>
        </div>
        <button type="button" onClick={() => openModal()} className="min-h-11 w-full rounded-[7px] bg-[#e96d52] px-[17px] py-[12px] text-[12px] font-bold text-white sm:w-auto">
          {t('goals.new')}
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {goals.length === 0 ? (
          <div className="lg:col-span-2">
            <EmptyState title={t('goals.emptyTitle')} message={t('goals.emptyBody')} actionLabel={t('goals.new')} onAction={() => openModal()} />
          </div>
        ) : (
          goals.map((goal) => {
            const percent = clampPercent((goal.currentAmount / goal.targetAmount) * 100)
            const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)
            const due = daysUntil(goal.deadline)
            const complete = goal.currentAmount >= goal.targetAmount

            return (
              <article key={goal.id} className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[17px] font-semibold text-[#263b39]">{goal.name}</h2>
                    <p className="mt-1 text-[12px] text-[#7d8782]">
                      {complete ? t('goals.reached') : due >= 0 ? t('goals.daysLeft', { count: due }) : t('goals.daysPast', { count: Math.abs(due) })}
                      {goal.note ? ` · ${goal.note}` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${complete ? 'bg-[#dfeecf] text-[#446a4d]' : 'bg-[#edf0eb] text-[#5b6b67]'}`}>
                    {Math.round(percent)}%
                  </span>
                </div>

                <p className="mt-4 font-['Space_Grotesk'] text-[20px] font-semibold text-[#223535]">
                  {formatMoney(goal.currentAmount, profile.currency)}
                  <span className="ml-2 text-[12px] font-medium text-[#7d8782]">{t('goals.of', { amount: formatMoney(goal.targetAmount, profile.currency) })}</span>
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf0eb]">
                  <div className="h-full rounded-full bg-[#7dbb7d]" style={{ width: `${percent}%` }} />
                </div>

                <p className="mt-2 text-[12px] text-[#7d8782]">{complete ? t('goals.funded') : t('goals.toGo', { amount: formatMoney(remaining, profile.currency) })}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!complete ? (
                    <button type="button" onClick={() => { setContribute(goal); setAmount(''); setError('') }} className="rounded-[7px] bg-[#1d3434] px-3 py-2 text-[11px] font-semibold text-white">
                      {t('goals.contribute')}
                    </button>
                  ) : null}
                  <button type="button" onClick={() => openModal(goal)} className="rounded-[7px] border border-[#dfe6df] px-3 py-2 text-[11px] text-[#4d7772]">
                    {t('common.edit')}
                  </button>
                  <button type="button" onClick={() => setPendingDelete(goal)} className="rounded-[7px] px-3 py-2 text-[11px] text-[#b45b4a]">
                    {t('common.delete')}
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>

      {modal ? (
        <Modal title={modal.mode === 'edit' ? t('goals.edit') : t('goals.newTitle')} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label={t('goals.name')} explain={t('goals.nameHint')} placeholder={t('goals.namePh')}>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={controlClass} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('goals.target')} explain={t('goals.targetHint')} placeholder={t('goals.targetPh')}>
                <input type="number" min="0.01" step="0.01" value={form.targetAmount} onChange={(event) => setForm((current) => ({ ...current, targetAmount: event.target.value }))} className={controlClass} />
              </Field>
              <Field label={t('goals.saved')} explain={t('goals.savedHint')} placeholder={t('goals.savedPh')}>
                <input type="number" min="0" step="0.01" value={form.currentAmount} onChange={(event) => setForm((current) => ({ ...current, currentAmount: event.target.value }))} className={controlClass} />
              </Field>
            </div>
            <Field label={t('goals.deadline')} explain={t('goals.deadlineHint')}>
              <input type="date" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} className={controlClass} />
            </Field>
            <Field label={t('goals.note')} explain={t('goals.noteHint')} placeholder={t('goals.notePh')}>
              <input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className={controlClass} />
            </Field>
            {error ? <p className="text-[12px] text-[#c45b45]">{error}</p> : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setModal(null)} className="min-h-11 rounded-[8px] border border-[#dfe6df] px-[14px] py-[10px] text-[12px]">
                {t('common.cancel')}
              </button>
              <button type="submit" className="min-h-11 rounded-[8px] bg-[#e96d52] px-[16px] py-[10px] text-[12px] font-semibold text-white">
                {t('goals.save')}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {contribute ? (
        <Modal title={t('goals.contributeTo', { name: contribute.name })} onClose={() => setContribute(null)}>
          <form onSubmit={handleContribute} className="space-y-4">
            <Field label={t('goals.amount')} explain={t('goals.amountHint')} placeholder={t('goals.amountPh')}>
              <input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className={controlClass} />
            </Field>
            {error ? <p className="text-[12px] text-[#c45b45]">{error}</p> : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setContribute(null)} className="min-h-11 rounded-[8px] border border-[#dfe6df] px-[14px] py-[10px] text-[12px]">
                {t('common.cancel')}
              </button>
              <button type="submit" className="min-h-11 rounded-[8px] bg-[#e96d52] px-[16px] py-[10px] text-[12px] font-semibold text-white">
                {t('goals.addContribution')}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title={t('goals.deleteTitle')}
          message={t('goals.deleteBody', { name: pendingDelete.name })}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            deleteGoal(pendingDelete.id)
            setPendingDelete(null)
          }}
        />
      ) : null}
    </div>
  )
}
