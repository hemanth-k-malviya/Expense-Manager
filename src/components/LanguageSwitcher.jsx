import { LANGUAGES } from '../i18n'
import { useExpenses } from '../context/ExpenseContext'
import Select from './Select'

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, t } = useExpenses()

  return (
    <div className={compact ? 'block min-w-0' : 'block min-w-0 text-[12px] font-medium text-[#4b5d5a]'}>
      <Select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label={t('settings.language')}
        className={
          compact
            ? 'max-w-[11rem] rounded-full border border-[#dfe6df] bg-white px-2 py-1.5 text-[11px] text-[#46504c] outline-none'
            : 'mt-1 w-full rounded-[8px] border border-[#dfe6df] bg-white px-[12px] py-[10px] text-[13px] text-[#213432] outline-none'
        }
      >
        {LANGUAGES.map((item) => (
          <option key={item.code} value={item.code}>
            {compact ? item.native : `${item.native} — ${item.english}`}
          </option>
        ))}
      </Select>
    </div>
  )
}
