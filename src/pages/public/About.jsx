import { Link } from 'react-router-dom'
import { usePublicSite } from '../../components/publicSiteContext'
import { APP_NAME } from '../../lib/constants'
import { MIN_USER_AGE, OPERATOR_NAME, SUPPORT_EMAIL, SUPPORT_MAILTO } from '../../lib/site'
import { H, P } from './LegalFrame'
import { usePublicMeta } from './usePublicMeta'

export default function About() {
  const { t } = usePublicSite()
  usePublicMeta({
    title: t('site.about.title'),
    description: t('site.about.lede'),
  })

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-['Space_Grotesk'] text-[34px] font-semibold leading-tight text-[#1d3434]">{t('site.about.title')}</h1>
      <p className="mt-4 text-[18px] leading-8 text-[#33403d]">{t('site.about.lede')}</p>

      <div className="mt-8 space-y-5 text-[15px] leading-7 text-[#33403d]">
        <H>Who runs this site</H>
        <P>
          {APP_NAME} is operated by {OPERATOR_NAME}. It is an independent project — not a bank, not a payment company, and
          not a chartered-accountancy firm. The public website and the signed-in workspace are the same product: an
          expense manager for personal money and small shops.
        </P>
        <P>
          You can reach the operator at{' '}
          <a className="font-semibold text-[#1d3434]" href={SUPPORT_MAILTO}>
            {SUPPORT_EMAIL}
          </a>
          . There is also a{' '}
          <Link className="font-semibold text-[#1d3434]" to="/contact">
            contact page
          </Link>
          .
        </P>

        <H>Why it exists</H>
        <P>
          Spreadsheets break when two people edit them. Paper notebooks disappear. Full accounting suites ask a kirana
          or a freelancer for company-scale setup. {APP_NAME} is the middle path: a browser workspace where you record
          income and spend, set category budgets, keep a personal book next to a shop book, and — when you need them —
          add vendors, clients, and approvals.
        </P>
        <P>
          The signed-in tools stay behind a login so other people cannot see your amounts. These public pages exist so
          anyone, including Google’s site review, can read how the product works, who is responsible, and how ads and
          cookies are used — without creating an account.
        </P>

        <H>What we are not</H>
        <P>
          {APP_NAME} does not hold your money, move UPI, file GST, or give personalised investment advice. Numbers in
          the app are your records. Tax, compliance, and legal filings stay with you and any professional you hire. The
          guides on this site are educational. Read the{' '}
          <Link className="font-semibold text-[#1d3434]" to="/disclaimer">
            disclaimer
          </Link>{' '}
          if you will use the app for a shop.
        </P>

        <H>Age</H>
        <P>
          The site and the app are for people {MIN_USER_AGE} years or older. We do not design this service for children
          under 13, and we do not knowingly collect data from anyone under {MIN_USER_AGE}.
        </P>

        <H>How to learn more</H>
        <P>
          Start with the{' '}
          <Link className="font-semibold text-[#1d3434]" to="/guides">
            guides
          </Link>
          , then create an account if you want a workspace. Privacy details live on the{' '}
          <Link className="font-semibold text-[#1d3434]" to="/privacy">
            Privacy Policy
          </Link>
          . Rules for using the app are in the{' '}
          <Link className="font-semibold text-[#1d3434]" to="/terms">
            Terms of Use
          </Link>
          .
        </P>
      </div>
    </article>
  )
}
