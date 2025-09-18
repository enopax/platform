import type { Metadata } from 'next';

import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { RiCloudLine, RiShieldCheckLine, RiGlobalLine, RiSpeedUpLine } from '@remixicon/react';
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

  // Mock data for IPFS storage service
  const storageStats = {
    totalFiles: 2847392,
    totalStorage: "1.2 PB",
    activeNodes: 47,
    globalReplication: "99.9%"
  };

  const features = [
    {
      icon: RiCloudLine,
      title: "European Infrastructure",
      description: "GDPR-compliant storage with EU-based servers. Enjoy free storage tiers with GitHub integration and flexible cryptocurrency payments."
    },
    {
      icon: RiShieldCheckLine,
      title: "Multiple Upload Options",
      description: "Upload via REST API with token authentication, intuitive drag & drop interface, or powerful CLI tools for developers."
    },
    {
      icon: RiGlobalLine,
      title: "Team & Analytics",
      description: "Built-in project management, team collaboration tools, and comprehensive usage analytics to track your storage metrics."
    },
    {
      icon: RiSpeedUpLine,
      title: "Strategic Clustering",
      description: "Geographically distributed IPFS nodes for optimal performance. Pay-per-use or monthly subscription pricing models available."
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
                  <Button variant="outline" className="px-8 py-3 text-lg font-semibold border-brand-600 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20">
                    View Docs
                  </Button>
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
                {storageStats.totalFiles.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Files Stored</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400">
                {storageStats.totalStorage}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Storage</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">
                {storageStats.activeNodes}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Nodes</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-400">
                {storageStats.globalReplication}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Uptime</div>
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
              <Button variant="outline" className="px-8 py-3 text-lg font-semibold">
                Contact Sales
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
