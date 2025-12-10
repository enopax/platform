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
            Welcome to Nomad Camp. By registering or attending, you agree to these Terms of Service. Our goal is to create a collaborative, respectful, and fun environment for all participants. This is a community-run, non-profit event designed to foster connection, learning, and shared adventure.
          </p>

          <h2 className="text-xl font-semibold">1. What We’re Doing</h2>
          <p>
            We will be working, cooking, relaxing, and having campfires together. Expect an open atmosphere where participation is encouraged in both scheduled and spontaneous activities.
          </p>

          <h2 className="text-xl font-semibold">2. Unconference Format</h2>
          <p>
            Our camp follows an unconference format. This means there are no pre-set speakers or formal schedules. Instead, each morning, participants propose workshops, talks, or activities that they're interested in hosting or attending.
          </p>
          <ul className="list-disc list-inside">
            <li>Morning Planning: Daily scheduling of sessions proposed by attendees.</li>
            <li>Collaborative Scheduling: Everyone helps shape the day's activities.</li>
            <li>Flexible Sessions: From technical talks to yoga, it's all up to the group.</li>
            <li>Adaptive Schedule: Things may shift as interests evolve — that’s part of the magic.</li>
          </ul>

          <h2 className="text-xl font-semibold">3. What You Can Expect</h2>
          <p>
            In addition to sessions, you can expect hands-on group projects like building the main tent, outdoor adventures, and plenty of campfire moments. Whether you’re new to unconferences or a seasoned nomad, your contribution matters — even just showing up and being curious.
          </p>

          <h2 className="text-xl font-semibold">4. Community Principles</h2>
          <ul className="list-disc list-inside">
            <li><strong>Friendship-First:</strong> Building real connections through shared experiences.</li>
            <li><strong>Authenticity:</strong> This is not a networking event; it’s a place to be yourself.</li>
            <li><strong>Freedom:</strong> Come and go as you like — no minimum stay required.</li>
            <li><strong>Nature & Simplicity:</strong> We gather in beautiful outdoor settings with minimal structure.</li>
          </ul>

          <h2 className="text-xl font-semibold">5. Cost Transparency</h2>
          <p>
            Nomad Camp is a non-profit initiative. We charge no more than what’s necessary to cover shared expenses like campsite rental, communal equipment, and basic logistics.
          </p>
          <p>
            <strong>Registration Fee:</strong> To help cover upfront costs, we charge a small registration fee of <strong>€10*</strong> per person.
          </p>
          <p className="text-xs text-gray-500">
            *The €10 fee helps us reserve the site, manage logistics, and maintain minimal operations. We do not profit from this event.
          </p>

          <h2 className="text-xl font-semibold">6. Code of Conduct</h2>
          <p>
            We expect everyone to treat others with respect, kindness, and inclusivity. Discrimination, harassment, or disruptive behavior will not be tolerated. Anyone violating this will be asked to leave without a refund.
          </p>

          <h2 className="text-xl font-semibold">7. Liability</h2>
          <p>
            By participating in the camp, you acknowledge that you are responsible for your own health, safety, and belongings. The organizers are volunteers and not liable for accidents, injuries, or lost items.
          </p>

          <h2 className="text-xl font-semibold">8. Data & Privacy</h2>
          <p>
            We collect minimal data for registration purposes. Please refer to our <Link href="/privacy" className="underline text-brand-500">Privacy Policy</Link> for more information.
          </p>

          <h2 className="text-xl font-semibold">9. Cookies</h2>
          <p>
            Our website uses only essential cookies. These include cookies required to process PayPal payments securely and — in the future — for login and session handling.
          </p>
          <p>
            We do not use any tracking, marketing, or personalization cookies. Our analytics are self-hosted, anonymized, and do not rely on cookies or third-party services.
          </p>
          <p>
            If you interact with PayPal (e.g. for registration or donations), their service may set cookies according to their own policy. See <a href="https://www.paypal.com/webapps/mpp/ua/cookie-full" target="_blank" rel="noopener noreferrer" className="underline">PayPal’s Cookie Policy</a> for details.
          </p>
          <p>
            You can manage or delete cookies in your browser settings. Disabling essential cookies may affect payment or login functionality.
          </p>

          <h2 className="text-xl font-semibold">10. Questions?</h2>
          <p>
            Feel free to reach out at <a href="mailto:info@nomadcamp.org" className="underline">info@nomadcamp.org</a> if you have any questions before registering or attending.
          </p>

          <BackButton href="/" />
        </div>
      </Container>
    </main>
  );
}
