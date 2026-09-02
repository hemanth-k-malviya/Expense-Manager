import { Link } from 'react-router-dom'
import { useExpenses } from '../context/ExpenseContext'

export default function LockedFeature({ feature }) {
  const { enableFeature, t } = useExpenses()
  const title = t(`feature.${feature}.title`)
  const description = t(`feature.${feature}.desc`)

  return (
    <div className="flex min-h-[min(58vh,520px)] items-center justify-center px-1">
      <article className="w-full max-w-lg rounded-[16px] border border-[#e8ebe4] bg-white px-5 py-7 text-center shadow-[0_12px_40px_rgba(29,52,52,0.06)] sm:px-7 sm:py-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#1d3434] px-3 py-1 text-[10px] font-bold tracking-[0.8px] text-[#d7ef6b]">
          {t('business.kicker')}
        </span>
        <h1 className="page-title mt-4 font-semibold text-[#223535]">{title}</h1>
        <p className="mt-3 text-[13px] leading-6 text-[#6c7874]">{description}</p>
        <p className="mt-2 text-[12px] text-[#8a948e]">{t('locked.enableHelp')}</p>
        <div className="mt-6 flex w-full flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
          <button type="button" onClick={() => enableFeature(feature)} className="min-h-11 rounded-[8px] bg-[#e96d52] px-5 py-3 text-[12px] font-bold text-white">
            {t('locked.enable', { name: title })}
          </button>
          <Link to="/settings" className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[#dfe6df] px-5 py-3 text-[12px] font-semibold text-[#4d7772]">
            {t('locked.seeAll')}
          </Link>
        </div>
      </article>
    </div>
  )
}
