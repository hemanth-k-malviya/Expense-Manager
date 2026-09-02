import { useState } from 'react'
import { useExpenses } from '../context/ExpenseContext'
import { planPrice, requiredPlanFor } from '../lib/subscription'
import Modal from './Modal'

const PRO_PERK_KEYS = ['perk.pro1', 'perk.pro2', 'perk.pro3', 'perk.pro4', 'perk.pro5', 'perk.pro6', 'perk.pro7']
const BIZ_PERK_KEYS = ['perk.biz1', 'perk.biz2', 'perk.biz3', 'perk.biz4', 'perk.biz5', 'perk.biz6', 'perk.biz7', 'perk.biz8', 'perk.biz9']

export default function UpgradeModal() {
  const { upgradeRequest, closeUpgrade, subscribe, t } = useExpenses()
  const [billing, setBilling] = useState('yearly')
  const [busy, setBusy] = useState(false)

  if (!upgradeRequest) return null

  const plan = requiredPlanFor(upgradeRequest)
  const perks = plan === 'business' ? BIZ_PERK_KEYS : PRO_PERK_KEYS
  const planLabel = t(plan === 'business' ? 'plan.business' : 'plan.pro')
  const title = plan === 'business' ? t('pricing.business') : t('pricing.pro')
  const featureTitle = t(`feature.${upgradeRequest}.title`)
  const featureDesc = t(`feature.${upgradeRequest}.desc`)

  const handleSubscribe = async () => {
    setBusy(true)
    await new Promise((resolve) => window.setTimeout(resolve, 700))
    subscribe(billing, plan)
    setBusy(false)
  }

  return (
    <Modal title={title} onClose={closeUpgrade} wide>
      <p className="text-[13px] leading-6 text-[#5b6b67]">
        {t('upgrade.members', { title: featureTitle, plan: planLabel, description: featureDesc })}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {['monthly', 'yearly'].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setBilling(option)}
            className={`rounded-[12px] border px-4 py-4 text-left ${
              billing === option ? 'border-[#1d3434] bg-[#f7f9f2]' : 'border-[#e4e8df] bg-white'
            }`}
          >
            <span className="flex items-center justify-between text-[11px] font-semibold text-[#7d8782]">
              {option === 'yearly' ? t('upgrade.yearly') : t('upgrade.monthly')}
              {option === 'yearly' ? <em className="not-italic rounded-full bg-[#dbe899] px-2 py-0.5 text-[10px] font-bold text-[#446a4d]">{t('upgrade.save')}</em> : null}
            </span>
            <strong className="mt-1 block font-['Space_Grotesk'] text-[22px] text-[#223535]">${planPrice(option, plan)}</strong>
            <span className="text-[11px] text-[#7d8782]">/ {t(option === 'yearly' ? 'billing.year' : 'billing.month')}</span>
          </button>
        ))}
      </div>

      <ul className="mt-5 grid gap-2 text-[12px] text-[#46504c] sm:grid-cols-2">
        {perks.map((perk) => (
          <li key={perk} className="flex gap-2">
            <span className="text-[#7dbb7d]">✓</span>
            {t(perk)}
          </li>
        ))}
      </ul>

      <button type="button" onClick={handleSubscribe} disabled={busy} className="mt-6 w-full rounded-[8px] bg-[#e96d52] px-4 py-3 text-[13px] font-bold text-white disabled:opacity-70">
        {busy
          ? t('upgrade.starting')
          : t('upgrade.start', { plan: planLabel, price: planPrice(billing, plan), period: t(billing === 'yearly' ? 'billing.year' : 'billing.month') })}
      </button>
      <p className="mt-3 text-center text-[11px] text-[#8a948e]">{t('upgrade.note')}</p>
    </Modal>
  )
}
