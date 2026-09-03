import { Link } from 'react-router-dom'
import { usePublicSite } from '../../components/publicSiteContext'
import { GUIDES } from '../../content/guides'
import { APP_NAME } from '../../lib/constants'
import { usePublicMeta } from './usePublicMeta'

const featureKeys = [
  ['site.landing.feat1Title', 'site.landing.feat1Body'],
  ['site.landing.feat2Title', 'site.landing.feat2Body'],
  ['site.landing.feat3Title', 'site.landing.feat3Body'],
  ['site.landing.feat4Title', 'site.landing.feat4Body'],
  ['site.landing.feat5Title', 'site.landing.feat5Body'],
  ['site.landing.feat6Title', 'site.landing.feat6Body'],
]

const howKeys = [
  ['site.landing.how1Title', 'site.landing.how1Body'],
  ['site.landing.how2Title', 'site.landing.how2Body'],
  ['site.landing.how3Title', 'site.landing.how3Body'],
]

const faqKeys = [
  ['site.landing.faq1Q', 'site.landing.faq1A'],
  ['site.landing.faq2Q', 'site.landing.faq2A'],
  ['site.landing.faq3Q', 'site.landing.faq3A'],
  ['site.landing.faq4Q', 'site.landing.faq4A'],
]

export default function Landing() {
  const { t } = usePublicSite()
  usePublicMeta({
    title: `${APP_NAME} — Expense manager for people and shops`,
    description: t('site.landing.lede'),
  })

  return (
    <div>
      <section className="bg-[#1d3434] px-4 py-16 text-[#f6f7ef] sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-bold tracking-[1.4px] text-[#c9e75b]">{t('site.landing.kicker')}</p>
          <h1 className="mt-4 max-w-3xl font-['Space_Grotesk'] text-[40px] font-semibold leading-[1.15] sm:text-[48px]">
            {t('site.landing.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-7 text-[#adc0b9]">{t('site.landing.lede')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-[8px] bg-[#e96d52] px-5 py-3 text-[13px] font-semibold text-white">
              {t('site.landing.primary')}
            </Link>
            <Link to="/guides/track-daily-expenses" className="rounded-[8px] bg-[#c9e75b] px-5 py-3 text-[13px] font-semibold text-[#1d3434]">
              {t('site.landing.secondary')}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{t('site.landing.howTitle')}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {howKeys.map(([title, body], index) => (
            <article key={title} className="rounded-[14px] border border-[#e4e8df] bg-white p-5">
              <p className="text-[11px] font-bold text-[#e96d52]">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-2 font-['Space_Grotesk'] text-[18px] font-semibold text-[#1d3434]">{t(title)}</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#5b6b67]">{t(body)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{t('site.landing.featuresTitle')}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureKeys.map(([title, body]) => (
              <article key={title} className="rounded-[14px] bg-[#f7f8f5] p-5">
                <h3 className="font-['Space_Grotesk'] text-[17px] font-semibold text-[#1d3434]">{t(title)}</h3>
                <p className="mt-2 text-[14px] leading-6 text-[#5b6b67]">{t(body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{t('site.landing.whoTitle')}</h2>
        <p className="mt-4 max-w-3xl text-[16px] leading-7 text-[#33403d]">{t('site.landing.whoBody')}</p>
      </section>

      <section className="bg-[#eef3e4] px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{t('site.landing.guidesTitle')}</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5b6b67]">{t('site.landing.guidesBody')}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {GUIDES.slice(0, 4).map((guide) => (
              <Link key={guide.slug} to={`/guides/${guide.slug}`} className="rounded-[14px] bg-white p-5 hover:bg-[#fbfcf9]">
                <h3 className="font-['Space_Grotesk'] text-[17px] font-semibold text-[#1d3434]">{guide.title}</h3>
                <p className="mt-2 text-[14px] leading-6 text-[#5b6b67]">{guide.description}</p>
                <p className="mt-3 text-[12px] font-semibold text-[#1d3434]">{t('site.guides.read')} →</p>
              </Link>
            ))}
          </div>
          <Link to="/guides" className="mt-6 inline-flex text-[13px] font-semibold text-[#1d3434]">
            {t('site.cta.readGuides')} →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h2 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{t('site.landing.faqTitle')}</h2>
        <dl className="mt-8 space-y-6">
          {faqKeys.map(([q, a]) => (
            <div key={q}>
              <dt className="font-['Space_Grotesk'] text-[17px] font-semibold text-[#1d3434]">{t(q)}</dt>
              <dd className="mt-2 text-[15px] leading-7 text-[#5b6b67]">{t(a)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
