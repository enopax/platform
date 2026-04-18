import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Container from '@/components/common/Container';
import { Button } from '@/components/common/Button';
import {
  RiShieldLine,
  RiServerLine,
  RiTimeLine,
  RiOpenSourceLine,
  RiTeamLine,
  RiGlobalLine,
} from '@remixicon/react';

export default async function Page() {
  const session = await auth();
  if (session) {
    redirect('/orga');
  }

  return (
    <main>
      <section className="mx-auto max-w-6xl">
        <Container>
          <div className="relative w-full py-16 md:py-20">
            <div className="max-w-3xl mx-auto text-center px-4">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Managed Kubernetes.
                <br />
                <span className="text-brand-500">European Infrastructure.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                Production-grade Kubernetes clusters on EU cloud providers — deployed in minutes, not days.
                No vendor lock-in. GDPR-compliant by design.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900 py-20">
        <Container>
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
              Why Enopax?
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-14 max-w-2xl mx-auto">
              We give small and medium businesses, startups, and agencies access to Kubernetes
              without the complexity of running it — all on EU infrastructure.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={RiTimeLine}
                title="Clusters in Minutes"
                description="Fully configured Kubernetes clusters with CNI, storage, and load balancing — ready to deploy your workloads."
              />
              <FeatureCard
                icon={RiShieldLine}
                title="EU Data Sovereignty"
                description="All infrastructure runs on European cloud providers. Your data never leaves the EU. GDPR-compliant by design."
              />
              <FeatureCard
                icon={RiOpenSourceLine}
                title="No Vendor Lock-in"
                description="Standard Kubernetes. Export your workloads any time. No proprietary APIs, no hidden dependencies."
              />
              <FeatureCard
                icon={RiServerLine}
                title="Managed Operations"
                description="We handle upgrades, monitoring, and maintenance. You focus on your application, not your infrastructure."
              />
              <FeatureCard
                icon={RiTeamLine}
                title="Team Collaboration"
                description="Organisations, teams, and role-based access control. Share projects across organisations with fine-grained permissions."
              />
              <FeatureCard
                icon={RiGlobalLine}
                title="AI-First Platform"
                description="Built with AI at the core — automating provisioning, optimising resources, and simplifying operations."
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-14">
              Built for
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AudienceCard
                title="SMEs & Startups"
                description="Outgrown shared hosting? Need containers but can't justify a full DevOps hire? We handle the infrastructure so you can ship product."
              />
              <AudienceCard
                title="Agencies & IT Service Providers"
                description="Provision isolated environments per client. Multi-cluster management, hosted control planes, API-driven provisioning."
              />
              <AudienceCard
                title="Developers"
                description="Kubernetes without the ops overhead. Transparent pricing, standard APIs, developer-friendly tooling."
              />
              <AudienceCard
                title="Regulated Industries"
                description="Healthcare, finance, public sector — strict data residency requirements met by EU-only infrastructure with audit trails."
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-brand-50 dark:bg-brand-950 py-20">
        <Container>
          <div className="max-w-2xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to deploy?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Provision your first cluster in minutes.
            </p>
          </div>
        </Container>
      </section>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-10">
        <Container>
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enopax — European Infrastructure
            </p>
            <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
              <Link href="/docs/imprint" className="hover:text-gray-900 dark:hover:text-white">Imprint</Link>
            </div>
          </div>
        </Container>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-lg w-fit mb-4">
        <Icon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function AudienceCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
