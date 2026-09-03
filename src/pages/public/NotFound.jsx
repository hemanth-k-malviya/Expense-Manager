import { Link } from 'react-router-dom'
import { usePublicSite } from '../../components/publicSiteContext'
import { usePublicMeta } from './usePublicMeta'

export default function NotFound() {
  const { t } = usePublicSite()
  usePublicMeta({
    title: t('site.notFound.title'),
    description: t('site.notFound.body'),
    noindex: true,
  })

  return (
    <article className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="font-['Space_Grotesk'] text-[34px] font-semibold text-[#1d3434]">{t('site.notFound.title')}</h1>
      <p className="mt-4 text-[16px] leading-7 text-[#5b6b67]">{t('site.notFound.body')}</p>
      <div className="mt-6 flex gap-4 text-[13px] font-semibold">
        <Link to="/" className="text-[#1d3434]">
          {t('site.nav.home')}
        </Link>
        <Link to="/guides" className="text-[#1d3434]">
          {t('site.nav.guides')}
        </Link>
      </div>
    </article>
  )
}
