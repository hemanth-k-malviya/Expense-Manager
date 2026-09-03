import { Link } from 'react-router-dom'
import { usePublicSite } from '../../components/publicSiteContext'
import { GUIDES } from '../../content/guides'
import { usePublicMeta } from './usePublicMeta'

export default function Guides() {
  const { t } = usePublicSite()
  usePublicMeta({
    title: t('site.guides.title'),
    description: t('site.guides.lede'),
  })

  return (
    <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-['Space_Grotesk'] text-[34px] font-semibold text-[#1d3434]">{t('site.guides.title')}</h1>
      <p className="mt-4 max-w-2xl text-[17px] leading-7 text-[#33403d]">{t('site.guides.lede')}</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {GUIDES.map((guide) => (
          <Link key={guide.slug} to={`/guides/${guide.slug}`} className="rounded-[14px] border border-[#e4e8df] bg-white p-5 hover:bg-[#fbfcf9]">
            <p className="text-[11px] text-[#7d8782]">
              {guide.date} · {guide.minutes} min
            </p>
            <h2 className="mt-2 font-['Space_Grotesk'] text-[20px] font-semibold text-[#1d3434]">{guide.title}</h2>
            <p className="mt-2 text-[14px] leading-6 text-[#5b6b67]">{guide.description}</p>
            <p className="mt-4 text-[12px] font-semibold text-[#1d3434]">{t('site.guides.read')} →</p>
          </Link>
        ))}
      </div>
    </article>
  )
}
