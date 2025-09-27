import type { Metadata } from 'next';

import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { RiProjectorLine, RiTeamLine, RiCodeLine, RiBuildingLine, RiDashboardLine, RiShieldCheckLine } from '@remixicon/react';
import { prisma } from '@/lib/prisma';
import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Divider } from '@/components/common/Divider';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import TiltCard from '@/components/animation/TiltCard';
import IPFSParallax from '@/components/animation/IPFSParallax';

export default async function Page() {
  // Check if user is authenticated and redirect to main dashboard
  const session = await auth();
  if (session) {
    redirect('/main');
  }

  // Fetch real platform statistics from database
  const [projectCount, teamCount, organisationCount, apiKeyCount] = await Promise.all([
    prisma.project.count(),
    prisma.team.count(),
    prisma.organisation.count(),
    prisma.apiKey.count(),
  ]);

  // Format the statistics for display
  const platformStats = {
    totalProjects: projectCount,
    activeTeams: teamCount.toString(),
    organisations: organisationCount,
    apiRequests: apiKeyCount
  };

  const features = [
    {
      icon: RiProjectorLine,
      title: "Project Management",
      description: "Organise your IPFS storage into projects with built-in resource management, team collaboration, and progress tracking."
    },
    {
      icon: RiTeamLine,
      title: "Team Collaboration",
      description: "Create teams and organisations to manage access, share resources, and collaborate on projects with fine-grained permissions."
    },
    {
      icon: RiCodeLine,
      title: "Developer Platform",
      description: "REST API with token authentication, comprehensive documentation, and CLI tools for seamless integration into your workflow."
    },
    {
      icon: RiShieldCheckLine,
      title: "Enterprise Ready",
      description: "GDPR-compliant European infrastructure with usage analytics, storage plans, and organisation-level management capabilities."
    }
  ];

  return (
    <main>
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl">
        <Container>
          <div className="relative w-full h-[900px] overflow-hidden">
            <Image
              src="/assets/bg.png"
              alt="Background"
              className="object-cover object-top opacity-10 dark:invert"
              fill
              priority
            />
            <div className="absolute mb-40 top-40 inset-0 flex flex-col justify-between items-center gap-32 lg:flex-row md:top-0">
              <span className="max-w-2xl relative z-10 text-center lg:text-left">
                <h1 className="text-5xl md:text-7xl font-bold text-brand-500">
                  IPFS Storage
                </h1>
                <p className="mt-6 text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl">
                  European-hosted, decentralized storage platform. Upload via API, drag & drop interface, or CLI. Perfect for digital service providers, journalists, and gaming assets.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button className="px-8 py-3 text-lg font-semibold bg-brand-600 hover:bg-brand-700 text-white">
                    Upload Files
                  </Button>
                  <Link href="/api">
                    <Button variant="outline" className="px-8 py-3 text-lg font-semibold border-brand-600 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20">
                      View API Docs
                    </Button>
                  </Link>
                </div>
              </span>
              <div className="relative z-10">
                <TiltCard />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Divider />

      {/* Stats Section */}
      <section className="mx-auto max-w-6xl py-12">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-600 dark:text-brand-400">
                {platformStats.totalProjects.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Projects</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400">
                {platformStats.activeTeams}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Teams</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">
                {platformStats.organisations}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Organisations</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-400">
                {platformStats.apiRequests}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">API Keys Created</div>
            </div>
          </div>
        </Container>
      </section>

      <Divider />

      {/* Features Section */}
      <section className="mx-auto max-w-6xl">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Enterprise-Grade <br />
              <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                IPFS Storage
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Purpose-built for digital service providers, independent journalists, and gaming asset creators who demand censorship-resistant, reliable storage.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 hover:shadow-lg transition-shadow border-2 hover:border-brand-200 dark:hover:border-brand-800">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                    <feature.icon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <IPFSParallax />
        </Container>
      </section>
      
      <Divider />

      {/* CTA Section */}
      <section className="mx-auto max-w-4xl">
        <Container>
          <div className="text-center py-16">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Start with free storage, scale with flexible pricing. PayPal, Stripe, and crypto payments accepted.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="px-8 py-3 text-lg font-semibold bg-brand-600 hover:bg-brand-700 text-white">
                Create Account
              </Button>
              <Link href="/api">
                <Button variant="outline" className="px-8 py-3 text-lg font-semibold">
                  View API Docs
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
