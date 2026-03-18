import Link from 'next/link';
import Container from '@/components/common/Container';
import BackButton from '@/components/common/BackButton';

export default async function Page() {
  return (
    <main>
      <Container>
        <div className="min-h-[80vh] space-y-6 py-10 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
          <h1 className="text-2xl font-semibold">Terms of Service</h1>

          <p>
            Welcome to Enopax. By accessing or using our platform, you agree to these Terms of Service. Please read them carefully before using our services.
          </p>

          <h2 className="text-xl font-semibold">1. Service Description</h2>
          <p>
            Enopax provides an infrastructure-as-a-service platform that enables users to deploy and manage cloud resources including storage clusters, databases, and other services through a web interface.
          </p>

          <h2 className="text-xl font-semibold">2. Account Registration</h2>
          <p>
            To use our services, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>

          <h2 className="text-xl font-semibold">3. Acceptable Use</h2>
          <p>You agree not to use our services to:</p>
          <ul className="list-disc list-inside">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on the rights of others</li>
            <li>Distribute malware or engage in malicious activities</li>
            <li>Attempt to gain unauthorised access to our systems</li>
            <li>Use resources for cryptocurrency mining unless explicitly permitted</li>
          </ul>

          <h2 className="text-xl font-semibold">4. Service Availability</h2>
          <p>
            We strive to maintain high availability of our services but do not guarantee uninterrupted access. Scheduled maintenance will be communicated in advance where possible. We are not liable for any downtime or service interruptions.
          </p>

          <h2 className="text-xl font-semibold">5. Data and Content</h2>
          <p>
            You retain ownership of all data you upload to our platform. We do not access, use, or share your data except as necessary to provide the services or as required by law. Please refer to our <Link href="/docs/privacy" className="underline text-brand-500">Privacy Policy</Link> for more information.
          </p>

          <h2 className="text-xl font-semibold">6. Payment and Billing</h2>
          <p>
            Certain services may require payment. Pricing and billing terms will be clearly communicated before you incur any charges. You agree to pay all fees associated with your use of paid services.
          </p>

          <h2 className="text-xl font-semibold">7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Enopax shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services. Our total liability shall not exceed the amount you have paid to us in the preceding 12 months.
          </p>

          <h2 className="text-xl font-semibold">8. Termination</h2>
          <p>
            We may suspend or terminate your account if you violate these terms. You may also close your account at any time. Upon termination, your data will be retained for 30 days before permanent deletion, unless otherwise required by law.
          </p>

          <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
          <p>
            We may update these Terms of Service from time to time. We will notify you of significant changes via email or through the platform. Continued use of our services after changes constitutes acceptance of the updated terms.
          </p>

          <h2 className="text-xl font-semibold">10. Governing Law</h2>
          <p>
            These terms are governed by the laws of the Federal Republic of Germany. The courts of Nürnberg, Germany shall have exclusive jurisdiction over any disputes arising from these terms.
          </p>

          <h2 className="text-xl font-semibold">11. Contact</h2>
          <p>
            If you have any questions about these terms, please contact us at{' '}
            <a href="mailto:hallo@enopax.com" className="underline text-brand-500">hallo@enopax.com</a>.
          </p>

          <BackButton href="/" />
        </div>
      </Container>
    </main>
  );
}
