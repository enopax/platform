'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Callout } from '@/components/common/Callout';
import {
  RiCheckLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiInformationLine,
  RiServerLine
} from '@remixicon/react';

interface DeploymentStatusProps {
  resourceId: string;
  status: string;
  configuration?: any;
  endpoint?: string | null;
  credentials?: any;
  onDeploymentComplete?: () => void;
}

export default function DeploymentStatus({
  resourceId,
  status,
  configuration,
  endpoint,
  credentials,
  onDeploymentComplete
}: DeploymentStatusProps) {
  const [deploymentProgress, setDeploymentProgress] = useState(configuration?.deploymentProgress || 0);
  const [deploymentStage, setDeploymentStage] = useState(configuration?.deploymentStage || 'init');
  const [deploymentMessage, setDeploymentMessage] = useState(configuration?.deploymentMessage || 'Preparing...');
  const [currentStatus, setCurrentStatus] = useState(status);

  useEffect(() => {
    if (currentStatus !== 'PROVISIONING') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/resources/${resourceId}/deployment-status`);
        if (response.ok) {
          const data = await response.json();

          if (data.status === 'ACTIVE') {
            setCurrentStatus('ACTIVE');
            setDeploymentProgress(100);
            setDeploymentStage('complete');
            setDeploymentMessage('Deployment complete!');
            clearInterval(pollInterval);
            onDeploymentComplete?.();
          } else if (data.configuration) {
            setDeploymentProgress(data.configuration.deploymentProgress || 0);
            setDeploymentStage(data.configuration.deploymentStage || 'init');
            setDeploymentMessage(data.configuration.deploymentMessage || 'Deploying...');
          }
        }
      } catch (error) {
        console.error('Failed to poll deployment status:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [resourceId, currentStatus, onDeploymentComplete]);

  if (currentStatus === 'ACTIVE' && deploymentStage === 'complete') {
    return (
      <Card className="p-6 mb-6">
        <Callout
          title="Deployment Successful"
          variant="success"
          icon={RiCheckLine}
        >
          Your resource has been successfully deployed and is now active.
        </Callout>

        {endpoint && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
              <RiServerLine className="w-4 h-4 mr-2" />
              Endpoint
            </h4>
            <code className="text-sm text-gray-700 dark:text-gray-300 break-all">
              {endpoint}
            </code>
          </div>
        )}

        {credentials && Object.keys(credentials).length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <RiInformationLine className="w-4 h-4 mr-2" />
              Credentials
            </h4>
            <div className="space-y-2">
              {Object.entries(credentials).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">{key}</span>
                  <code className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-2 rounded break-all">
                    {String(value)}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  }

  if (currentStatus === 'PROVISIONING') {
    return (
      <Card className="p-6 mb-6">
        <div className="flex items-start mb-4">
          <RiLoader4Line className="w-6 h-6 text-brand-600 dark:text-brand-400 mr-3 animate-spin flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Deploying Resource
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {deploymentMessage}
            </p>
          </div>
          <Badge variant="outline" className="ml-2">
            {deploymentStage}
          </Badge>
        </div>

        <ProgressBar value={deploymentProgress} className="mb-2" />

        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {deploymentProgress}% complete
        </p>

        <Callout
          title="Deployment in Progress"
          variant="info"
          icon={RiInformationLine}
          className="mt-4"
        >
          Your resource is being provisioned. This typically takes 30-60 seconds.
          You can leave this page and return later.
        </Callout>
      </Card>
    );
  }

  if (currentStatus === 'INACTIVE') {
    return (
      <Card className="p-6 mb-6">
        <Callout
          title="Deployment Failed"
          variant="error"
          icon={RiErrorWarningLine}
        >
          The resource deployment encountered an error. Please try creating the resource again
          or contact support if the issue persists.
        </Callout>
      </Card>
    );
  }

  return null;
}
