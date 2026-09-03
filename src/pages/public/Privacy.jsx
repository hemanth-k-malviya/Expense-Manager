import { Link } from 'react-router-dom'
import { usePublicSite } from '../../components/publicSiteContext'
import { APP_NAME } from '../../lib/constants'
import {
  ADSENSE_PUBLISHER_ID,
  GOOGLE_AD_SETTINGS,
  GOOGLE_HOW_DATA_IS_USED,
  MIN_USER_AGE,
  OPERATOR_NAME,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from '../../lib/site'
import LegalFrame, { H, P, Ul } from './LegalFrame'
import { usePublicMeta } from './usePublicMeta'

export default function Privacy() {
  const { t } = usePublicSite()
  usePublicMeta({
    title: t('site.privacy.title'),
    description: `${APP_NAME} privacy policy: accounts, local records, cookies, and Google AdSense.`,
  })

  return (
    <LegalFrame title={t('site.privacy.title')} updated={t('site.privacy.updated')}>
      <P>
        This Privacy Policy explains how {OPERATOR_NAME} (“we”, “us”) collects, uses, and shares information when you
        use {APP_NAME} on the web, including the public pages and the signed-in workspace. It also explains cookies and
        advertising. If you do not agree, do not use the site.
      </P>

      <H>Who we are</H>
      <P>
        {APP_NAME} is operated by {OPERATOR_NAME}. Contact:{' '}
        <a className="font-semibold text-[#1d3434]" href={SUPPORT_MAILTO}>
          {SUPPORT_EMAIL}
        </a>
        . This service is intended for people {MIN_USER_AGE} years or older. We do not knowingly collect personal
        information from anyone under {MIN_USER_AGE}. The site is not directed to children under 13 and is not designed
        to be used in a COPPA-covered child-directed manner.
      </P>

      <H>Information we collect</H>
      <Ul>
        <li>
          <strong>Account data.</strong> If you register or sign in, Firebase Authentication (a Google service) stores
          your email address, a user ID, and — if you provide it — a display name. Google sign-in also shares the email
          and name associated with the Google account you choose.
        </li>
        <li>
          <strong>Expense records.</strong> Transactions, budgets, books, vendors, and similar workspace data are saved
          in your browser (localStorage) on this device. This version does not upload that ledger to our own cloud
          database.
        </li>
        <li>
          <strong>Optional AI key.</strong> If you paste a Gemini API key in Settings, it is stored in this browser and
          used only to send the prompts you type to Google’s Gemini API. We do not use that key to personalise ads.
        </li>
        <li>
          <strong>Technical data.</strong> Like most websites, our host and third parties may process IP address,
          browser type, language, and pages viewed as part of delivering the site and ads.
        </li>
        <li>
          <strong>Cookie preference.</strong> If you accept the cookie notice, we store a flag in localStorage so the
          bar stays hidden.
        </li>
      </Ul>

      <H>How we use information</H>
      <P>
        We use account data to sign you in and to keep your workspace attached to your email on this device. We use
        workspace data only to show you your own records in the app. We use technical data to operate, secure, and
        understand the public site. We do not sell your expense list.
      </P>

      <H>Cookies, identifiers, and Google AdSense</H>
      <P>
        The public pages of {APP_NAME} use Google AdSense (publisher ID {ADSENSE_PUBLISHER_ID}) to show ads. Third
        parties, including Google, may place and read cookies on your browser, or use web beacons, pixels, or IP
        addresses and other identifiers to collect information as a result of ad serving on this website. Google may
        use these technologies to serve personalised advertising based on your visits to this site and other sites.
      </P>
      <P>
        To understand how Google uses data when you use our partners’ sites or apps, read{' '}
        <a className="font-semibold text-[#1d3434]" href={GOOGLE_HOW_DATA_IS_USED} rel="noopener noreferrer" target="_blank">
          How Google uses information from sites or apps that use our services
        </a>
        . You can manage ad personalisation in{' '}
        <a className="font-semibold text-[#1d3434]" href={GOOGLE_AD_SETTINGS} rel="noopener noreferrer" target="_blank">
          Google Ad Settings
        </a>
        .
      </P>
      <P>
        We do not place AdSense units next to your private transactions inside the signed-in workspace. Ads, if shown,
        appear on public pages such as the homepage, guides, and legal pages.
      </P>
      <P>
        If you visit from the European Economic Area, the UK, or Switzerland, Google’s EU user consent rules apply to
        personalised ads. After AdSense is approved we enable Google’s Privacy & messaging consent on this domain. Until
        that message is active, treat ads on this site as using cookies and identifiers as described above.
      </P>

      <H>Firebase and other Google services</H>
      <P>
        Sign-in is provided by Google Firebase Authentication. Password-reset emails are sent by Firebase. If you use
        Google sign-in, Google’s own privacy policy also applies to that step. Gemini is used only when you supply a
        key and send a message to the in-app assistant.
      </P>

      <H>Sharing</H>
      <P>
        If you use the contact form, your device opens your own email app. The draft is addressed to {SUPPORT_EMAIL}.
        We do not pass that message through a third-party form service.
      </P>
      <P>
        We share information with service providers who process it for us (hosting, authentication, advertising). We
        may disclose information if required by law. We do not sell personal information. Exported CSV or JSON files
        that you download are under your control — do not send them to people who should not see your money.
      </P>

      <H>Retention and your choices</H>
      <P>
        You can sign out at any time. You can delete workspace data from Settings on this device. You can delete your
        Firebase login from Google’s account tools; a new login is a new ID. You can request help about your account
        email by writing to {SUPPORT_EMAIL}. Browser storage can also be cleared with your browser settings, which
        removes local records on that device.
      </P>

      <H>Security</H>
      <P>
        We use HTTPS and Firebase’s authentication service. Local records are only as private as the device and browser
        profile you use. Do not use a shared computer without signing out. Do not paste secrets into public guides or
        contact forms.
      </P>

      <H>International visitors</H>
      <P>
        Servers and advertising partners may process data in the United States and other countries. If you use the site
        from India or elsewhere, you understand that information may be processed outside your home country.
      </P>

      <H>Changes</H>
      <P>
        We may update this policy. The “last updated” date at the top will change. Continued use after an update means
        you accept the revised policy.
      </P>

      <H>Contact</H>
      <P>
        Privacy questions: {OPERATOR_NAME},{' '}
        <a className="font-semibold text-[#1d3434]" href={SUPPORT_MAILTO}>
          {SUPPORT_EMAIL}
        </a>
        . See also{' '}
        <Link className="font-semibold text-[#1d3434]" to="/terms">
          Terms
        </Link>{' '}
        and the{' '}
        <Link className="font-semibold text-[#1d3434]" to="/disclaimer">
          Disclaimer
        </Link>
        .
      </P>
    </LegalFrame>
  )
}
