import { getStoreAsync } from '@/lib/store';
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
    const store = await getStoreAsync();
    const provisioningTime = template.deployment.provisioningTime;
    const stageTime = provisioningTime / deploymentStages.length;

    for (const stage of deploymentStages) {
      onProgress?.(stage);

      await store.resources.update(resourceId, {
        configuration: {
          deploymentStage: stage.stage,
          deploymentProgress: stage.progress,
          deploymentMessage: stage.message
        }
      });

      await new Promise(resolve => setTimeout(resolve, stageTime));
    }

    const endpoint = generateMockEndpoint(template, resourceId);
    const credentials = generateMockCredentials(template, resourceId);
    const configuration = generateDeploymentConfig(template, resourceId);

    await store.resources.update(resourceId, {
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
    });

    return {
      success: true,
      endpoint,
      credentials,
      configuration
    };
  } catch (error) {
    console.error('Deployment simulation failed:', error);

    const store = await getStoreAsync();
    await store.resources.update(resourceId, {
      status: 'INACTIVE',
      configuration: {
        deploymentStage: 'failed',
        deploymentProgress: 0,
        deploymentMessage: 'Deployment failed',
        error: error instanceof Error ? error.message : 'Unknown error'
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

  const store = await getStoreAsync();
  const resource = await store.resources.findById(resourceId);

  if (!resource) {
    return {
      success: false,
      error: `Resource ${resourceId} not found`
    };
  }

  const owner = await store.users.findById(resource.ownerId);
  const organisation = await store.organisations.findById(resource.organisationId);
  const projectAllocations = await store.projectResources.findByResourceId(resourceId);

  const enrichedResource = {
    ...resource,
    owner,
    organisation,
    allocatedProjects: projectAllocations,
  };

  await store.resources.update(resourceId, {
    status: 'PROVISIONING',
    configuration: {
      templateId,
      deploymentStage: 'init',
      deploymentProgress: 0,
      deploymentMessage: 'Contacting Resource API...'
    }
  });

  setImmediate(async () => {
    await provisionResourceViaApi(resourceId, templateId, template, enrichedResource);
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
    const store = await getStoreAsync();
    const provider = getProviderForTemplate(templateId);

    await store.resources.update(resourceId, {
      configuration: {
        templateId,
        deploymentStage: 'provision',
        deploymentProgress: 50,
        deploymentMessage: 'Provisioning resource via API...'
      }
    });

    const firstAllocation = resource.allocatedProjects?.[0];
    let projectName = 'Default Project';
    if (firstAllocation) {
      const project = await store.projects.findById(firstAllocation.projectId);
      projectName = project?.name || 'Default Project';
    }

    const provisionRequest: ProvisionRequest = {
      name: resource.name,
      organisationName: resource.organisation?.name || '',
      projectName: projectName,
      userId: resource.owner?.id || '',
      sshKeys: [],
    };

    const result = await provisionResource(provider, provisionRequest);

    if (!result.success) {
      throw new Error(result.error || 'Provisioning failed');
    }

    await store.resources.update(resourceId, {
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
    });
  } catch (error) {
    console.error('Resource API provisioning failed:', error);

    const store = await getStoreAsync();
    await store.resources.update(resourceId, {
      status: 'INACTIVE',
      configuration: {
        templateId,
        deploymentStage: 'failed',
        deploymentProgress: 0,
        deploymentMessage: 'Provisioning failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

export async function getDeploymentStatus(resourceId: string): Promise<DeploymentProgress | null> {
  const store = await getStoreAsync();
  const resource = await store.resources.findById(resourceId);

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
