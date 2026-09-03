import { Link } from 'react-router-dom'
import { usePublicSite } from '../../components/publicSiteContext'

export default function LegalFrame({ title, updated, children }) {
  const { t } = usePublicSite()

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-[12px] text-[#7d8782]">
        <Link to="/" className="font-semibold text-[#1d3434]">
          {t('site.legal.back')}
        </Link>
      </p>
      <h1 className="mt-4 font-['Space_Grotesk'] text-[34px] font-semibold leading-tight text-[#1d3434]">{title}</h1>
      {updated ? <p className="mt-2 text-[13px] text-[#7d8782]">{updated}</p> : null}
      <div className="mt-8 space-y-5 text-[15px] leading-7 text-[#33403d]">{children}</div>
    </article>
  )
}

export function P({ children }) {
  return <p>{children}</p>
}

export function H({ children }) {
  return <h2 className="pt-4 font-['Space_Grotesk'] text-[20px] font-semibold text-[#1d3434]">{children}</h2>
}

export function Ul({ children }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>
}
