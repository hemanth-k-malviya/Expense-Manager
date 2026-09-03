import { Link, useParams } from 'react-router-dom'
import { usePublicSite } from '../../components/publicSiteContext'
import { guideBySlug } from '../../content/guides'
import { APP_NAME } from '../../lib/constants'
import { usePublicMeta } from './usePublicMeta'

export default function GuideArticle() {
  const { slug } = useParams()
  const { t } = usePublicSite()
  const guide = guideBySlug(slug)

  usePublicMeta({
    title: guide ? guide.title : t('site.guides.notFound'),
    description: guide ? guide.description : t('site.guides.lede'),
  })

  if (!guide) {
    return (
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{t('site.guides.notFound')}</h1>
        <Link to="/guides" className="mt-4 inline-block font-semibold text-[#1d3434]">
          {t('site.guides.title')} →
        </Link>
      </article>
    )
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-[12px] text-[#7d8782]">
        <Link to="/guides" className="font-semibold text-[#1d3434]">
          {t('site.guides.title')}
        </Link>
        <span className="mx-2">/</span>
        {guide.date} · {guide.minutes} min
      </p>
      <h1 className="mt-4 font-['Space_Grotesk'] text-[34px] font-semibold leading-tight text-[#1d3434]">{guide.title}</h1>
      <p className="mt-4 text-[18px] leading-8 text-[#33403d]">{guide.description}</p>
      <div className="mt-10 space-y-8">
        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-['Space_Grotesk'] text-[22px] font-semibold text-[#1d3434]">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="mt-3 text-[16px] leading-7 text-[#33403d]">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
      <p className="mt-12 rounded-[12px] bg-[#eef3e4] px-4 py-4 text-[14px] leading-6 text-[#33403d]">
        {APP_NAME} is a record-keeping app, not a tax or investment adviser.{' '}
        <Link className="font-semibold text-[#1d3434]" to="/disclaimer">
          {t('site.nav.disclaimer')}
        </Link>
        . Want a workspace?{' '}
        <Link className="font-semibold text-[#1d3434]" to="/register">
          {t('site.cta.register')}
        </Link>
        .
      </p>
    </article>
  )
}
