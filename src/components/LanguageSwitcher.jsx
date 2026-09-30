import { LANGUAGES } from '../i18n'
import { useExpenses } from '../context/ExpenseContext'
import Select from './Select'

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, t } = useExpenses()

  return (
    <div className={compact ? 'block min-w-0' : 'block min-w-0 text-[15px] font-medium text-[#4b5d5a]'}>
      <Select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label={t('settings.language')}
        className={
          compact
            ? 'max-w-[9.5rem] rounded-full border-0 bg-transparent px-2.5 py-1.5 text-[12px] font-medium text-[#46504c] outline-none hover:bg-[#f3f6f1]'
            : 'mt-1 w-full rounded-[8px] border border-[#dfe6df] bg-white px-[12px] py-[10px] text-[15px] text-[#213432] outline-none'
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
