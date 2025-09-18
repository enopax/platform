'use client';

import React from 'react';
import { RadioCardGroup, RadioCardItem } from '@/components/common/RadioCardGroup';
import { Badge } from '@/components/common/Badge';
import { RiCloudLine, RiRocketLine, RiDiamondLine, RiVipCrownLine, RiInfinityLine } from '@remixicon/react';

export type StorageTier = 'FREE_500MB' | 'BASIC_5GB' | 'PRO_50GB' | 'ENTERPRISE_500GB' | 'UNLIMITED';

interface StorageTierOption {
  value: StorageTier;
  name: string;
  description: string;
  storage: string;
  price: string;
  popular?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

const storageTierOptions: StorageTierOption[] = [
  {
    value: 'FREE_500MB',
    name: 'Free',
    description: 'Perfect for getting started',
    storage: '500 MB',
    price: 'Free',
    icon: RiCloudLine,
    features: ['Basic IPFS storage', 'Standard support', 'Community access']
  },
  {
    value: 'BASIC_5GB',
    name: 'Basic',
    description: 'For small projects and teams',
    storage: '5 GB',
    price: '$5/month',
    icon: RiRocketLine,
    features: ['Enhanced replication', 'Priority support', 'API access', 'Analytics dashboard']
  },
  {
    value: 'PRO_50GB',
    name: 'Professional',
    description: 'For growing businesses',
    storage: '50 GB',
    price: '$25/month',
    popular: true,
    icon: RiDiamondLine,
    features: ['High-speed uploads', 'Advanced analytics', 'Team management', 'SLA guarantee']
  },
  {
    value: 'ENTERPRISE_500GB',
    name: 'Enterprise',
    description: 'For large organizations',
    storage: '500 GB',
    price: '$150/month',
    icon: RiVipCrownLine,
    features: ['Dedicated nodes', 'Custom integration', 'Priority support', 'Compliance tools']
  },
  {
    value: 'UNLIMITED',
    name: 'Unlimited',
    description: 'Custom enterprise solution',
    storage: 'Unlimited',
    price: 'Contact us',
    icon: RiInfinityLine,
    features: ['Unlimited storage', 'Custom infrastructure', '24/7 dedicated support', 'White-label option']
  }
];

interface StorageTierSelectorProps {
  selectedTier: StorageTier;
  onTierChange: (tier: StorageTier) => void;
  disabled?: boolean;
}

export default function StorageTierSelector({ selectedTier, onTierChange, disabled = false }: StorageTierSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Storage Plan
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Choose the storage tier that best fits your needs
        </p>
      </div>

      <RadioCardGroup
        value={selectedTier}
        onValueChange={(value) => onTierChange(value as StorageTier)}
        disabled={disabled}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {storageTierOptions.map((option) => {
          const IconComponent = option.icon;

          return (
            <RadioCardItem
              key={option.value}
              value={option.value}
              className="relative"
            >
              {option.popular && (
                <Badge className="absolute -top-2 left-4 bg-brand-500 text-white">
                  Most Popular
                </Badge>
              )}

              <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                  <IconComponent className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {option.name}
                    </h4>
                    <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                      {option.price}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {option.description}
                  </p>

                  <div className="mb-3">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {option.storage}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                      storage
                    </span>
                  </div>

                  <ul className="space-y-1">
                    {option.features.map((feature, index) => (
                      <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                        <div className="w-1 h-1 bg-brand-500 rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </RadioCardItem>
          );
        })}
      </RadioCardGroup>
    </div>
  );
}

export { storageTierOptions };
export type { StorageTierOption };