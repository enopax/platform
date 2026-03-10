import Container from '@/components/common/Container';
import BackButton from '@/components/common/BackButton';

export const metadata = {
  title: 'Imprint',
};

export default async function Page() {
  return (
    <main>
      <Container>
        <div className="min-h-[80vh] space-y-6 py-10 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
          <h1 className="text-2xl font-semibold">Imprint (Impressum)</h1>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Information in accordance with § 5 TMG (German Telemedia Act)
          </p>

          <h2 className="text-xl font-semibold">Responsible Person</h2>
          <p>
            Felix Böhm
          </p>

          <h2 className="text-xl font-semibold">Contact</h2>
          <p>
            E-Mail:{' '}
            <a href="mailto:contact@enopax.com" className="underline text-brand-500">
              contact@enopax.com
            </a>
          </p>

          <h2 className="text-xl font-semibold">Dispute Resolution</h2>
          <p>
            The European Commission provides a platform for online dispute resolution (ODR):{' '}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-brand-500"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
          </p>
          <p>
            We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.
          </p>

          <h2 className="text-xl font-semibold">Liability for Content</h2>
          <p>
            As a service provider, we are responsible for our own content on these pages in accordance with general legislation pursuant to § 7 (1) TMG. According to §§ 8 to 10 TMG, however, we are not obliged as a service provider to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.
          </p>
          <p>
            Obligations to remove or block the use of information under general law remain unaffected. However, liability in this regard is only possible from the time of knowledge of a specific infringement. If we become aware of corresponding infringements, we will remove this content immediately.
          </p>

          <h2 className="text-xl font-semibold">Liability for Links</h2>
          <p>
            Our website contains links to external third-party websites over whose content we have no influence. Therefore, we cannot accept any liability for this external content. The respective provider or operator of the pages is always responsible for the content of the linked pages. The linked pages were checked for possible legal violations at the time of linking. Illegal content was not recognisable at the time of linking.
          </p>
          <p>
            However, permanent monitoring of the content of linked pages is not reasonable without concrete evidence of an infringement. If we become aware of legal violations, we will remove such links immediately.
          </p>

          <BackButton href="/" />
        </div>
      </Container>
    </main>
  );
}
