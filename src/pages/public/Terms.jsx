import { Link } from 'react-router-dom'
import { usePublicSite } from '../../components/publicSiteContext'
import { APP_NAME } from '../../lib/constants'
import { MIN_USER_AGE, OPERATOR_NAME, SUPPORT_EMAIL, SUPPORT_MAILTO } from '../../lib/site'
import LegalFrame, { H, P, Ul } from './LegalFrame'
import { usePublicMeta } from './usePublicMeta'

export default function Terms() {
  const { t } = usePublicSite()
  usePublicMeta({
    title: t('site.terms.title'),
    description: `Terms of use for ${APP_NAME}: accounts, acceptable use, ads, and limits of the service.`,
  })

  return (
    <LegalFrame title={t('site.terms.title')} updated={t('site.terms.updated')}>
      <P>
        These Terms of Use are an agreement between you and {OPERATOR_NAME} for the {APP_NAME} website and signed-in
        workspace. By creating an account or using the public pages you agree to these terms and to the{' '}
        <Link className="font-semibold text-[#1d3434]" to="/privacy">
          Privacy Policy
        </Link>
        .
      </P>

      <H>Eligibility</H>
      <P>
        You must be at least {MIN_USER_AGE} years old. If you are under 18, a parent or guardian should review these
        terms with you. You may not use the service if applicable law bars you from using a financial record-keeping
        tool.
      </P>

      <H>The service</H>
      <P>
        {APP_NAME} is a browser-based expense manager. You can record income and expenses, set budgets, keep books, and
        use optional business tools. The public guides are educational. The app is not a bank, payment service,
        investment adviser, or tax-filing product. We do not hold customer funds.
      </P>

      <H>Accounts</H>
      <P>
        You are responsible for the email and password or Google account you use to sign in. Keep them confidential.
        Notify us at {SUPPORT_EMAIL} if you think someone else used your login. We may suspend an account that abuses
        the service or these terms.
      </P>

      <H>Your records</H>
      <P>
        You own the numbers you enter. In this version those records live primarily in your browser. You are
        responsible for backups (export from Settings). We are not liable for data lost when a browser is cleared, a
        device is reset, or a login is deleted. If you publish or export data, you are responsible for who sees it.
      </P>

      <H>Acceptable use</H>
      <Ul>
        <li>Do not break the law or store content that is illegal in your country.</li>
        <li>Do not attack, scrape in a way that harms the service, or try to access another person’s workspace.</li>
        <li>Do not use the public pages to host malware, phishing, or spam.</li>
        <li>Do not click ads except as a genuine visitor. You may not ask others to click ads, pay for clicks, or use robots on ads.</li>
      </Ul>

      <H>Advertising</H>
      <P>
        Public pages may show third-party ads from Google AdSense. Ads are labelled by Google. We do not endorse
        advertised products. Invalid clicks or impressions can lead to ads being removed from the site. See the Privacy
        Policy for cookies and personalised advertising.
      </P>

      <H>Optional paid features</H>
      <P>
        Some tools inside the workspace may be marked Pro or Business. Prices and what is included can change. A
        feature flag in the app is not a promise of a regulated accounting product.
      </P>

      <H>Intellectual property</H>
      <P>
        The {APP_NAME} name, layout, and original guides belong to {OPERATOR_NAME}. You may not copy the guides for a
        competing site. You may quote short passages with a link back. You keep rights in the data you type.
      </P>

      <H>Disclaimer of warranties</H>
      <P>
        The service is provided “as is.” We do not warrant that totals will be complete, that the app will be
        uninterrupted, or that it is fit for a particular tax or audit. Read the{' '}
        <Link className="font-semibold text-[#1d3434]" to="/disclaimer">
          Disclaimer
        </Link>
        .
      </P>

      <H>Limitation of liability</H>
      <P>
        To the fullest extent allowed by law, {OPERATOR_NAME} is not liable for lost profits, lost data, or indirect
        damages arising from use of {APP_NAME}. If a court finds we owe you money, our total liability is limited to
        the amount you paid us for the service in the three months before the claim, or one US dollar if you paid
        nothing.
      </P>

      <H>Changes and contact</H>
      <P>
        We may update these terms. The date at the top will change. Continued use is acceptance. Questions:{' '}
        <a className="font-semibold text-[#1d3434]" href={SUPPORT_MAILTO}>
          {SUPPORT_EMAIL}
        </a>
        .
      </P>
    </LegalFrame>
  )
}
