import { Link } from 'react-router-dom'
import { usePublicSite } from '../../components/publicSiteContext'
import { GUIDES } from '../../content/guides'
import { APP_NAME } from '../../lib/constants'
import { usePublicMeta } from './usePublicMeta'

const benefitKeys = [
  ['site.landing.benefit1Title', 'site.landing.benefit1Body'],
  ['site.landing.benefit2Title', 'site.landing.benefit2Body'],
  ['site.landing.benefit3Title', 'site.landing.benefit3Body'],
  ['site.landing.benefit4Title', 'site.landing.benefit4Body'],
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

function CtaGroup({ t, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <Link
        to="/register"
        className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[#e96d52] px-6 py-3 text-[15px] font-semibold text-white"
      >
        {t('site.landing.primary')}
      </Link>
      <Link
        to="/demo"
        className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[#c9e75b] px-6 py-3 text-[15px] font-semibold text-[#1d3434]"
      >
        {t('site.landing.secondary')}
      </Link>
    </div>
  )
}

export default function Landing() {
  const { t } = usePublicSite()
  usePublicMeta({
    title: `${APP_NAME} — Track expenses and manage your budget`,
    description: t('site.landing.meta'),
  })

  return (
    <div>
      <section className="relative overflow-hidden bg-[#1d3434] px-4 pb-16 pt-14 text-[#f6f7ef] sm:px-6 sm:pb-20 sm:pt-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 10% 0%, #c9e75b 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 90% 20%, #e96d52 0%, transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="font-['Space_Grotesk'] text-[22px] font-bold tracking-[-0.03em] text-[#c9e75b] sm:text-[26px]">
            {APP_NAME}
          </p>
          <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#adc0b9]">{t('site.landing.kicker')}</p>
          <h1 className="mt-4 max-w-4xl font-['Space_Grotesk'] text-[34px] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[48px]">
            {t('site.landing.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-8 text-[#d7e0db]">{t('site.landing.lede')}</p>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#adc0b9]">{t('site.landing.lede2')}</p>
          <CtaGroup t={t} className="mt-8" />
          <p className="mt-4 text-[13px] text-[#8aa39b]">{t('site.landing.ctaHint')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{t('site.landing.whatTitle')}</h2>
        <div className="mt-5 max-w-3xl space-y-4 text-[16px] leading-8 text-[#33403d]">
          <p>{t('site.landing.what1')}</p>
          <p>{t('site.landing.what2')}</p>
          <p>{t('site.landing.what3')}</p>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{t('site.landing.benefitsTitle')}</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5b6b67]">{t('site.landing.benefitsIntro')}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {benefitKeys.map(([title, body], index) => (
              <article key={title} className="border-t border-[#e4e8df] pt-5">
                <p className="text-[12px] font-bold tracking-[0.08em] text-[#e96d52]">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-2 font-['Space_Grotesk'] text-[20px] font-semibold text-[#1d3434]">{t(title)}</h3>
                <p className="mt-2 text-[15px] leading-7 text-[#5b6b67]">{t(body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{t('site.landing.howTitle')}</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {howKeys.map(([title, body], index) => (
            <article key={title}>
              <p className="font-['Space_Grotesk'] text-[32px] font-semibold text-[#c9e75b]">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-2 font-['Space_Grotesk'] text-[18px] font-semibold text-[#1d3434]">{t(title)}</h3>
              <p className="mt-2 text-[15px] leading-7 text-[#5b6b67]">{t(body)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#eef3e4] px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{t('site.landing.demoTitle')}</h2>
              <p className="mt-3 text-[15px] leading-7 text-[#5b6b67]">{t('site.landing.demoBody')}</p>
            </div>
            <Link to="/demo" className="inline-flex min-h-11 items-center rounded-[10px] bg-[#1d3434] px-5 text-[14px] font-semibold text-white">
              {t('site.landing.secondary')}
            </Link>
          </div>
          <div className="mt-8 overflow-hidden rounded-[16px] border border-[#d7e0c8] bg-white">
            <div className="border-b border-[#eef1ed] bg-[#1d3434] px-5 py-4 text-[#f6f7ef]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#c9e75b]">{t('site.demo.sampleLabel')}</p>
              <p className="mt-1 font-['Space_Grotesk'] text-[20px] font-semibold">{t('site.demo.sampleMonth')}</p>
            </div>
            <div className="grid gap-0 sm:grid-cols-3">
              {[
                ['site.demo.income', '₹48,200'],
                ['site.demo.spending', '₹31,450'],
                ['site.demo.left', '₹16,750'],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-[#eef1ed] px-5 py-5 sm:border-b-0 sm:border-r sm:last:border-r-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8a948e]">{t(label)}</p>
                  <p className="mt-2 font-['Space_Grotesk'] text-[26px] font-semibold text-[#1d3434]">{value}</p>
                </div>
              ))}
            </div>
            <ul className="divide-y divide-[#eef1ed] px-2 py-2">
              {[
                ['Groceries', '₹2,180', 'Cash'],
                ['Rent', '₹12,000', 'Bank'],
                ['Freelance payment', '+ ₹18,000', 'UPI'],
                ['Fuel', '₹1,450', 'Card'],
              ].map(([name, amount, method]) => (
                <li key={name} className="flex items-center justify-between gap-3 px-3 py-3 text-[14px]">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#263b39]">{name}</p>
                    <p className="text-[12px] text-[#8a948e]">{method}</p>
                  </div>
                  <p className={`flex-shrink-0 font-semibold ${amount.startsWith('+') ? 'text-[#3d7a4a]' : 'text-[#1d3434]'}`}>{amount}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{t('site.landing.whoTitle')}</h2>
        <p className="mt-4 max-w-3xl text-[16px] leading-8 text-[#33403d]">{t('site.landing.whoBody')}</p>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{t('site.landing.guidesTitle')}</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5b6b67]">{t('site.landing.guidesBody')}</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {GUIDES.slice(0, 4).map((guide) => (
              <Link key={guide.slug} to={`/guides/${guide.slug}`} className="border-t border-[#e4e8df] pt-5 hover:opacity-90">
                <h3 className="font-['Space_Grotesk'] text-[18px] font-semibold text-[#1d3434]">{guide.title}</h3>
                <p className="mt-2 text-[14px] leading-7 text-[#5b6b67]">{guide.description}</p>
                <p className="mt-3 text-[13px] font-semibold text-[#1d3434]">{t('site.guides.read')} →</p>
              </Link>
            ))}
          </div>
          <Link to="/guides" className="mt-8 inline-flex text-[14px] font-semibold text-[#1d3434]">
            {t('site.cta.readGuides')} →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{t('site.landing.faqTitle')}</h2>
        <dl className="mt-8 space-y-7">
          {faqKeys.map(([q, a]) => (
            <div key={q}>
              <dt className="font-['Space_Grotesk'] text-[18px] font-semibold text-[#1d3434]">{t(q)}</dt>
              <dd className="mt-2 text-[15px] leading-7 text-[#5b6b67]">{t(a)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-[#e4e8df] bg-[#f7f8f5] px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#1d3434]">{t('site.landing.finalTitle')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-7 text-[#5b6b67]">{t('site.landing.finalBody')}</p>
          <CtaGroup t={t} className="mt-8 justify-center" />
        </div>
      </section>
    </div>
  )
}
