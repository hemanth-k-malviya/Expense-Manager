import { Link } from 'react-router-dom'
import { useExpenses } from '../context/ExpenseContext'
import { BUSINESS_NAV_ITEMS } from '../lib/constants'

export default function BusinessFeatures() {
  const { isFeatureEnabled, enableFeature, disableFeature, allFeaturesOn, enableAllFeatures, disableAllFeatures, t } = useExpenses()

  return (
    <div className="mt-8 border-t border-[#eff1ed] pt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-[#263b39]">{t('business.tools')}</h2>
          <p className="mt-1 text-[12px] text-[#7d8782]">{t('business.toolsHelp')}</p>
        </div>
        <button
          type="button"
          onClick={() => (allFeaturesOn ? disableAllFeatures() : enableAllFeatures())}
          className={`min-h-10 flex-shrink-0 rounded-[8px] px-4 py-2 text-[12px] font-semibold ${
            allFeaturesOn ? 'border border-[#dfe6df] bg-white text-[#485d5a]' : 'bg-[#e96d52] text-white'
          }`}
        >
          {allFeaturesOn ? t('business.disableAll') : t('business.enableAll')}
        </button>
      </div>
      <div className="mt-4 divide-y divide-[#eff1ed]">
        {BUSINESS_NAV_ITEMS.map((item) => {
          const on = isFeatureEnabled(item.feature)
          return (
            <div key={item.feature} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-[13px] text-[#263b39]">{t(item.labelKey)}</b>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${on ? 'bg-[#1d3434] text-[#d7ef6b]' : 'bg-[#edf0eb] text-[#5b6b67]'}`}>
                    {on ? t('business.on') : t('common.off')}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-[#7d8782]">{t(`feature.${item.feature}.desc`)}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {on ? (
                  <Link to={item.to} className="rounded-[8px] border border-[#dfe6df] px-3 py-2 text-[12px] font-medium text-[#4d7772] no-underline">
                    {t('common.open')}
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => (on ? disableFeature(item.feature) : enableFeature(item.feature))}
                  className={`min-h-10 rounded-[8px] px-4 py-2 text-[12px] font-semibold ${on ? 'border border-[#dfe6df] bg-white text-[#485d5a]' : 'bg-[#e96d52] text-white'}`}
                >
                  {on ? t('business.disable') : t('business.enable')}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
