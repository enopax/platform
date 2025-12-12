'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Callout } from '@/components/common/Callout';
import { createResource, type CreateResourceState } from '@/actions/resource';
import { RESOURCE_TEMPLATES, type ResourceTemplate } from '@/lib/resource-templates';
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiStarFill,
  RiInformationLine,
  RiErrorWarningLine
} from '@remixicon/react';

interface ResourceWizardProps {
  projectId?: string;
  projectName?: string;
  currentUserId: string;
  organisationName?: string;
  onCancel: () => void;
  onComplete?: (resourceData: any) => void;
}

const STORAGE_SIZE_MAP = [
  { value: 1, bytes: 1024 * 1024 * 1024 },
  { value: 5, bytes: 5 * 1024 * 1024 * 1024 },
  { value: 10, bytes: 10 * 1024 * 1024 * 1024 },
  { value: 25, bytes: 25 * 1024 * 1024 * 1024 },
  { value: 50, bytes: 50 * 1024 * 1024 * 1024 },
  { value: 100, bytes: 100 * 1024 * 1024 * 1024 },
];

export default function ResourceWizard({
  projectId,
  projectName,
  currentUserId,
  organisationName,
  onCancel,
  onComplete
}: ResourceWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ResourceTemplate | null>(null);
  const [customConfig, setCustomConfig] = useState({
    name: '',
    description: '',
    storageSize: 5
  });
  const [state, formAction, isPending] = useActionState<CreateResourceState, FormData>(
    createResource,
    {}
  );

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTemplateSelect = (template: ResourceTemplate) => {
    setSelectedTemplate(template);
    setCustomConfig({
      ...customConfig,
      name: projectName ? `${projectName} - ${template.name}` : template.name,
      description: template.description,
      storageSize: template.config.storageSize || 5
    });
  };

  useEffect(() => {
    if (state.success) {
      setTimeout(() => {
        if (projectId && organisationName) {
          router.push(`/orga/${organisationName}/${projectId}`);
        } else if (organisationName) {
          router.push(`/orga/${organisationName}/projects`);
        } else {
          router.push('/main/resources');
        }
        router.refresh();
      }, 1500);
    }
  }, [state.success, router, projectId, organisationName]);

  return (
    <form action={formAction}>
      <input type="hidden" name="name" value={customConfig.name} />
      <input type="hidden" name="description" value={customConfig.description} />
      <input type="hidden" name="type" value={selectedTemplate?.type || ''} />
      <input type="hidden" name="status" value="PROVISIONING" />
      <input type="hidden" name="ownerId" value={currentUserId} />
      <input type="hidden" name="templateId" value={selectedTemplate?.id || ''} />
      {selectedTemplate && (
        <input
          type="hidden"
          name="quotaLimit"
          value={STORAGE_SIZE_MAP.find(s => s.value === customConfig.storageSize)?.bytes.toString() || ''}
        />
      )}
      {projectId && <input type="hidden" name="projectId" value={projectId} />}

      <Card className="p-8">
        {state.success && (
          <Callout
            title="Success"
            variant="success"
            icon={RiCheckLine}
            className="mb-6"
          >
            Resource created successfully{projectName ? ` for ${projectName}` : ''}! Redirecting...
          </Callout>
        )}

        {state.error && (
          <Callout
            title="Creation Failed"
            variant="error"
            icon={RiErrorWarningLine}
            className="mb-6"
          >
            {state.error}
          </Callout>
        )}

        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {projectName ? `Add Resource to ${projectName}` : 'Create New Resource'}
            </h2>
            <Badge variant="outline">
              Step {currentStep} of {totalSteps}
            </Badge>
          </div>

        <ProgressBar value={progress} className="mb-4" />

        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span className={currentStep >= 1 ? 'text-brand-600 dark:text-brand-400 font-medium' : ''}>
            Choose Template
          </span>
          <span className={currentStep >= 2 ? 'text-brand-600 dark:text-brand-400 font-medium' : ''}>
            Configure
          </span>
          <span className={currentStep >= 3 ? 'text-brand-600 dark:text-brand-400 font-medium' : ''}>
            Review & Create
          </span>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Choose a Resource Template
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Select a pre-configured template that best matches your project needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESOURCE_TEMPLATES.map((template) => {
              const IconComponent = template.icon;
              const isSelected = selectedTemplate?.id === template.id;

              return (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-brand-300'
                  }`}
                >
                  {template.popular && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                        <RiStarFill className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-800 mr-3`}>
                      <IconComponent className={`w-6 h-6 ${template.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {template.pricing.estimate}
                        </span>
                        <span className="text-xs text-gray-500">
                          /{template.pricing.period}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {template.description}
                  </p>

                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wide">
                      Includes:
                    </h5>
                    {template.config.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                        <RiCheckLine className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {isSelected && (
                    <div className="absolute inset-0 rounded-xl border-2 border-brand-500 bg-brand-500/5 flex items-center justify-center">
                      <div className="bg-brand-500 text-white rounded-full p-2">
                        <RiCheckLine className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedTemplate && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start">
                <RiInformationLine className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Good Choice!
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {selectedTemplate.name} is perfect for your project. You can customize the configuration in the next step.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {currentStep === 2 && selectedTemplate && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Configure Your Resource
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Customize the settings for your {selectedTemplate.name}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resource Name *
                </label>
                <input
                  type="text"
                  value={customConfig.name}
                  onChange={(e) => setCustomConfig({ ...customConfig, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Enter a name for this resource"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={customConfig.description}
                  onChange={(e) => setCustomConfig({ ...customConfig, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Describe what this resource will be used for"
                />
              </div>

              {selectedTemplate.type === 'STORAGE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Storage Size: {customConfig.storageSize} GB
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={customConfig.storageSize}
                    onChange={(e) => setCustomConfig({ ...customConfig, storageSize: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 GB</span>
                    <span>100 GB</span>
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Resource Preview</h4>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedTemplate.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Storage:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{customConfig.storageSize} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Cost:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {selectedTemplate.pricing.estimate}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Features Included:</h5>
                <ul className="space-y-1">
                  {selectedTemplate.config.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                      <RiCheckLine className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && selectedTemplate && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Review & Create Resource
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Review your configuration before creating the resource
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <selectedTemplate.icon className={`w-8 h-8 ${selectedTemplate.iconColor} mr-4`} />
              <div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {customConfig.name}
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  {customConfig.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {customConfig.storageSize} GB
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Storage Space</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {selectedTemplate.pricing.estimate}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Per Month</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  IPFS
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Storage Type</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
            <div className="flex items-start">
              <RiCheckLine className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                  Ready to Create
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {projectName
                    ? `Your resource will be created and automatically assigned to ${projectName}.`
                    : 'Your resource will be created for your organisation.'
                  }
                  {' '}You can modify these settings later if needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="light"
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            className="flex items-center"
            disabled={isPending}
          >
            <RiArrowLeftLine className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={currentStep === 1 && !selectedTemplate}
              className="flex items-center"
            >
              Next
              <RiArrowRightLine className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!customConfig.name.trim() || isPending}
              isLoading={isPending}
              className="flex items-center"
            >
              <RiCheckLine className="w-4 h-4 mr-2" />
              {isPending ? 'Creating...' : 'Create Resource'}
            </Button>
          )}
        </div>
      </Card>
    </form>
  );
}