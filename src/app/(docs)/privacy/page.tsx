import Link from 'next/link';
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
            <br />
            <strong>Nomad Camp</strong> <br />
            Email: <a href="mailto:info@nomadcamp.org" className="underline">info@nomadcamp.org</a>
          </p>

          <h2 className="text-xl font-semibold">2. Data We Collect</h2>
          <p>We collect the following personal data when you fill out our form:</p>
          <ul className="list-disc list-inside">
            <li>First and last name</li>
            <li>Email address</li>
            <li>Phone number (optional)</li>
            <li>Preferences and camp participation details</li>
          </ul>

          <h2 className="text-xl font-semibold">3. Purpose of Data Processing</h2>
          <p>Your data is processed exclusively for the following purposes:</p>
          <ul className="list-disc list-inside">
            <li>Organizing and managing the camp</li>
            <li>Contacting you with questions or updates</li>
            <li>Internal analytics and statistics (anonymized)</li>
          </ul>

          <h2 className="text-xl font-semibold">4. Legal Basis</h2>
          <p>
            Your data is processed based on your explicit consent in accordance with Article 6(1)(a) of the GDPR.
          </p>

          <h2 className="text-xl font-semibold">5. Data Sharing</h2>
          <p>
            Your personal data will not be shared with third parties unless it is necessary for the organisation of the camp or you have explicitly consented. We only transfer data to third countries (outside the EU) if appropriate safeguards are in place.
          </p>

          <h2 className="text-xl font-semibold">6. Data Retention</h2>
          <p>
            Your data will only be stored for as long as necessary for the purposes mentioned. In general, we delete your data within 6 months after the end of the event.
          </p>

          <h2 className="text-xl font-semibold">7. Your Rights</h2>
          <p>You have the following rights under the GDPR:</p>
          <ul className="list-disc list-inside">
            <li>Right of access (Art. 15)</li>
            <li>Right to rectification (Art. 16)</li>
            <li>Right to erasure (Art. 17)</li>
            <li>Right to restrict processing (Art. 18)</li>
            <li>Right to object (Art. 21)</li>
            <li>Right to data portability (Art. 20)</li>
          </ul>
          <p>
            You may withdraw your consent at any time with future effect. Please contact us via email at <a href="mailto:info@nomadcamp.org" className="underline">info@nomadcamp.org</a>.
          </p>

          <h2 className="text-xl font-semibold">8. Cookies & Analytics</h2>
          <p>
            We do not use cookies for advertising purposes. Anonymous usage data (such as page views) may be logged locally to improve our website. This data is not linked to individuals and is not shared with third parties.
          </p>

          <h2 className="text-xl font-semibold">9. Contact</h2>
          <p>
            If you have any questions about data protection or wish to exercise your rights, please contact us at:
            <br />
            <a href="mailto:info@nomadcamp.org" className="underline">info@nomadcamp.org</a>
          </p>

          <BackButton href="/" />
        </div>
      </Container>
    </main>
  );
}
