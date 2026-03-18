import Container from '@/components/common/Container';
import BackButton from '@/components/common/BackButton';

export default async function Page() {
  return (
    <main>
      <Container>
        <div className="min-h-[80vh] space-y-6 py-10 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
          <h1 className="text-2xl font-semibold">Privacy Policy</h1>

          <p>
            Protecting your personal data is important to us. This Privacy Policy explains what data we collect, how we use it, and your rights under the General Data Protection Regulation (GDPR).
          </p>

          <h2 className="text-xl font-semibold">1. Controller</h2>
          <p>
            The controller responsible for data processing on this website is:
          </p>
          <p>
            Felix Böhm<br />
            Josephsplatz 8<br />
            90429 Nürnberg<br />
            Germany<br />
            Email: <a href="mailto:hallo@enopax.com" className="underline text-brand-500">hallo@enopax.com</a>
          </p>

          <h2 className="text-xl font-semibold">2. Data We Collect</h2>
          <p>We collect the following personal data when you use our platform:</p>
          <ul className="list-disc list-inside">
            <li>Name and email address (account registration)</li>
            <li>Authentication data (login credentials, session tokens)</li>
            <li>Usage data (resources created, actions performed)</li>
            <li>Technical data (IP address, browser type, access times)</li>
          </ul>

          <h2 className="text-xl font-semibold">3. Purpose of Data Processing</h2>
          <p>Your data is processed for the following purposes:</p>
          <ul className="list-disc list-inside">
            <li>Providing and maintaining our platform services</li>
            <li>User authentication and account management</li>
            <li>Communication about your account and services</li>
            <li>Improving our platform and user experience</li>
            <li>Compliance with legal obligations</li>
          </ul>

          <h2 className="text-xl font-semibold">4. Legal Basis</h2>
          <p>
            Your data is processed based on the following legal bases under the GDPR:
          </p>
          <ul className="list-disc list-inside">
            <li>Performance of a contract (Art. 6(1)(b)) — for providing our services</li>
            <li>Legitimate interests (Art. 6(1)(f)) — for platform improvement and security</li>
            <li>Consent (Art. 6(1)(a)) — where explicitly given</li>
            <li>Legal obligation (Art. 6(1)(c)) — for compliance requirements</li>
          </ul>

          <h2 className="text-xl font-semibold">5. Data Sharing</h2>
          <p>
            Your personal data will not be shared with third parties unless necessary to provide our services or required by law. We host our infrastructure within the European Union and do not transfer data to third countries without appropriate safeguards.
          </p>

          <h2 className="text-xl font-semibold">6. Data Retention</h2>
          <p>
            Your data is stored for as long as your account is active. Upon account deletion, personal data will be removed within 30 days, unless retention is required by law. Anonymised usage statistics may be retained indefinitely.
          </p>

          <h2 className="text-xl font-semibold">7. Your Rights</h2>
          <p>You have the following rights under the GDPR:</p>
          <ul className="list-disc list-inside">
            <li>Right of access (Art. 15)</li>
            <li>Right to rectification (Art. 16)</li>
            <li>Right to erasure (Art. 17)</li>
            <li>Right to restrict processing (Art. 18)</li>
            <li>Right to data portability (Art. 20)</li>
            <li>Right to object (Art. 21)</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at{' '}
            <a href="mailto:hallo@enopax.com" className="underline text-brand-500">hallo@enopax.com</a>.
          </p>

          <h2 className="text-xl font-semibold">8. Cookies</h2>
          <p>
            Our website uses only essential cookies required for authentication and session management. We do not use tracking, marketing, or personalisation cookies. Our analytics are self-hosted and anonymised.
          </p>

          <h2 className="text-xl font-semibold">9. Contact</h2>
          <p>
            If you have any questions about data protection or wish to exercise your rights, please contact us at:{' '}
            <a href="mailto:hallo@enopax.com" className="underline text-brand-500">hallo@enopax.com</a>
          </p>

          <BackButton href="/" />
        </div>
      </Container>
    </main>
  );
}
