import React from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import Headline from '@/components/common/Headline';
import {
  RiHeartLine,
  RiFireLine,
  RiCompassLine,
  RiTeamLine,
  RiWifiLine,
  RiSunLine,
  RiShieldLine,
  RiStarLine
} from '@remixicon/react';

export default function CoreConceptSection() {
  const coreValues = [
    {
      icon: RiHeartLine,
      title: "Friendship-First Approach",
      description: "Genuine, lifelong friendships through shared experiences around campfires.",
      highlight: "Authentic connections"
    },
    {
      icon: RiFireLine,
      title: "Summer Camp for Adults",
      description: "Natural community around shared daily life, not forced programming.",
      highlight: "Real-world relationships"
    },
    {
      icon: RiCompassLine,
      title: "Complete Freedom",
      description: "Flexible come-and-go model with no minimum stay required.",
      highlight: "Nomadic flexibility"
    }
  ];

  const uniqueFeatures = [
    "Friendship Over Networking",
    "Natural Settings",
    "Flexible Freedom", 
    "Authentic Community",
    "Cost Transparency"
  ];

  return (
    <section className="space-y-12">
      <div className="space-y-4">
        <p className="text-lg text-gray-600 max-w-3xl">
          A global network of temporary communities where digital nomads connect authentically, 
          share skills, and build lasting friendships in beautiful natural settings.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <Headline className="text-2xl mb-2">Core Philosophy</Headline>
          <p className="text-gray-600">The principles that guide everything we do</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {coreValues.map((value, index) => (
            <Card key={index} className="space-y-4">
              <div className="w-12 h-12 mx-auto bg-brand-100 rounded-full flex items-center justify-center">
                <value.icon className="size-6 text-brand-600" />
              </div>
              <div className="w-full">
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{value.description}</p>
                <Badge className="text-xs">
                  {value.highlight}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="space-y-6">
        <div>
          <Headline className="text-2xl mb-2">What Makes Us Unique</Headline>
          <p className="text-gray-600">The key differences that set us apart</p>
        </div>

        <div className="space-y-3">
          {uniqueFeatures.map((feature, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border dark:border-neutral-700">
              <RiStarLine className="size-5 text-yellow-500 shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{feature}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          <strong>Important notice:</strong> This is not a package trip. Travel, accommodation, and meals must be arranged independently by each participant.
        </p>
        <p className="text-sm text-gray-500">
          <strong>Estimated camping prices:</strong> &bull; €10 per person &bull; €14 per tent
        </p>
      </div>
    </section>
  );
}
