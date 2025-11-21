import { prisma } from '@/lib/prisma';
import {
  getTemplateById,
  generateMockEndpoint,
  generateMockCredentials,
  generateDeploymentConfig,
  getProviderForTemplate,
  type ResourceTemplate
} from '@/lib/resource-templates';
import {
  provisionResource,
  getResourceStatus,
  type ProvisionRequest
} from '@/lib/resource-api-client';

export interface DeploymentProgress {
  stage: string;
  progress: number;
  message: string;
}

export interface DeploymentResult {
  success: boolean;
  endpoint?: string;
  credentials?: Record<string, string>;
  configuration?: Record<string, any>;
  error?: string;
}

const deploymentStages = [
  { stage: 'init', progress: 0, message: 'Initialising deployment...' },
  { stage: 'allocate', progress: 20, message: 'Allocating resources...' },
  { stage: 'configure', progress: 40, message: 'Configuring services...' },
  { stage: 'provision', progress: 60, message: 'Provisioning infrastructure...' },
  { stage: 'verify', progress: 80, message: 'Verifying deployment...' },
  { stage: 'complete', progress: 100, message: 'Deployment complete!' }
];

export async function simulateDeployment(
  resourceId: string,
  template: ResourceTemplate,
  onProgress?: (progress: DeploymentProgress) => void
): Promise<DeploymentResult> {
  try {
    const provisioningTime = template.deployment.provisioningTime;
    const stageTime = provisioningTime / deploymentStages.length;

    for (const stage of deploymentStages) {
      onProgress?.(stage);

      await prisma.resource.update({
        where: { id: resourceId },
        data: {
          configuration: {
            deploymentStage: stage.stage,
            deploymentProgress: stage.progress,
            deploymentMessage: stage.message
          }
        }
      });

      await new Promise(resolve => setTimeout(resolve, stageTime));
    }

    const endpoint = generateMockEndpoint(template, resourceId);
    const credentials = generateMockCredentials(template, resourceId);
    const configuration = generateDeploymentConfig(template, resourceId);

    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        status: 'ACTIVE',
        endpoint,
        credentials,
        configuration: {
          ...configuration,
          deploymentStage: 'complete',
          deploymentProgress: 100,
          deploymentMessage: 'Deployment complete!',
          deployedAt: new Date().toISOString()
        }
      }
    });

    return {
      success: true,
      endpoint,
      credentials,
      configuration
    };
  } catch (error) {
    console.error('Deployment simulation failed:', error);

    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        status: 'INACTIVE',
        configuration: {
          deploymentStage: 'failed',
          deploymentProgress: 0,
          deploymentMessage: 'Deployment failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed'
    };
  }
}

export async function deployResource(
  resourceId: string,
  templateId: string
): Promise<DeploymentResult> {
  const template = getTemplateById(templateId);

  if (!template) {
    return {
      success: false,
      error: `Template ${templateId} not found`
    };
  }

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: {
      owner: true,
      organisation: true,
      allocatedProjects: {
        include: { project: true }
      }
    }
  });

  if (!resource) {
    return {
      success: false,
      error: `Resource ${resourceId} not found`
    };
  }

  await prisma.resource.update({
    where: { id: resourceId },
    data: {
      status: 'PROVISIONING',
      configuration: {
        templateId,
        deploymentStage: 'init',
        deploymentProgress: 0,
        deploymentMessage: 'Contacting Resource API...'
      }
    }
  });

  setImmediate(async () => {
    await provisionResourceViaApi(resourceId, templateId, template, resource);
  });

  return {
    success: true
  };
}

async function provisionResourceViaApi(
  resourceId: string,
  templateId: string,
  template: ResourceTemplate,
  resource: any
): Promise<void> {
  try {
    const provider = getProviderForTemplate(templateId);

    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        configuration: {
          templateId,
          deploymentStage: 'provision',
          deploymentProgress: 50,
          deploymentMessage: 'Provisioning resource via API...'
        }
      }
    });

    const projectName = resource.allocatedProjects?.[0]?.project?.name || 'Default Project';

    const provisionRequest: ProvisionRequest = {
      name: resource.name,
      organisationName: resource.organisation.name,
      projectName: projectName,
      userId: resource.owner.id,
      sshKeys: [],
    };

    const result = await provisionResource(provider, provisionRequest);

    if (!result.success) {
      throw new Error(result.error || 'Provisioning failed');
    }

    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        status: 'ACTIVE',
        endpoint: result.access,
        credentials: {
          resourceApiId: result.id,
          resourceApiStatus: result.status,
        },
        configuration: {
          templateId,
          resourceApiId: result.id,
          provider,
          deploymentStage: 'complete',
          deploymentProgress: 100,
          deploymentMessage: 'Deployment complete!',
          deployedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Resource API provisioning failed:', error);

    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        status: 'INACTIVE',
        configuration: {
          templateId,
          deploymentStage: 'failed',
          deploymentProgress: 0,
          deploymentMessage: 'Provisioning failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    });
  }
}

export async function getDeploymentStatus(resourceId: string): Promise<DeploymentProgress | null> {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: {
      configuration: true,
      status: true
    }
  });

  if (!resource) {
    return null;
  }

  const config = resource.configuration as any;

  if (resource.status === 'PROVISIONING' && config) {
    return {
      stage: config.deploymentStage || 'init',
      progress: config.deploymentProgress || 0,
      message: config.deploymentMessage || 'Deploying...'
    };
  }

  if (resource.status === 'ACTIVE' && config?.deploymentStage === 'complete') {
    return {
      stage: 'complete',
      progress: 100,
      message: 'Deployment complete!'
    };
  }

  return null;
}
