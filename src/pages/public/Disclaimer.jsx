import { Link } from 'react-router-dom'
import { usePublicSite } from '../../components/publicSiteContext'
import { APP_NAME } from '../../lib/constants'
import { OPERATOR_NAME, SUPPORT_EMAIL, SUPPORT_MAILTO } from '../../lib/site'
import LegalFrame, { H, P } from './LegalFrame'
import { usePublicMeta } from './usePublicMeta'

export default function Disclaimer() {
  const { t } = usePublicSite()
  usePublicMeta({
    title: t('site.disclaimer.title'),
    description: `${APP_NAME} is not a bank, CA, or investment adviser. Guides are educational. Ads are from Google.`,
  })

  return (
    <LegalFrame title={t('site.disclaimer.title')} updated={t('site.disclaimer.updated')}>
      <P>
        {APP_NAME} is a record-keeping website operated by {OPERATOR_NAME}. Nothing on this site or in the signed-in
        workspace is professional financial, tax, legal, or investment advice. You remain responsible for decisions
        about money, GST, income tax, and how you run a shop.
      </P>

      <H>Not a filing product</H>
      <P>
        Guides that mention GST-style folders, vendor bills, or profit and loss are educational. They do not replace
        the GST portal, a return, or a chartered accountant. If you are registered for tax, file with the official
        systems and a professional if you use one.
      </P>

      <H>Numbers can be wrong</H>
      <P>
        Totals depend on what you typed, which book you used, and whether this browser still has your data. We do not
        guarantee completeness. Export backups if the records matter.
      </P>

      <H>Advertising</H>
      <P>
        Public pages may display advertisements served by Google AdSense. Those ads are not recommendations from{' '}
        {APP_NAME}. We do not control every advertiser’s landing page. Click only if you intend to visit the advertiser.
      </P>

      <H>External links</H>
      <P>
        Links to Google policies, ad settings, or other sites are for convenience. Their content is theirs, not ours.
      </P>

      <H>Contact</H>
      <P>
        Questions:{' '}
        <a className="font-semibold text-[#1d3434]" href={SUPPORT_MAILTO}>
          {SUPPORT_EMAIL}
        </a>
        . Also see{' '}
        <Link className="font-semibold text-[#1d3434]" to="/privacy">
          Privacy
        </Link>{' '}
        and{' '}
        <Link className="font-semibold text-[#1d3434]" to="/terms">
          Terms
        </Link>
        .
      </P>
    </LegalFrame>
  )
}
