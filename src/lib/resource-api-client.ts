const RESOURCE_API_URL = process.env.RESOURCE_API_URL || 'http://localhost:3001';
const RESOURCE_API_KEY = process.env.RESOURCE_API_KEY || '';

export interface ProvisionRequest {
  name: string;
  organisationName: string;
  projectName: string;
  userId: string;
  sshKeys?: string[];
  [key: string]: any;
}

export interface ProvisionResponse {
  success: boolean;
  id: string;
  name: string;
  status: string;
  message: string;
  access?: string;
  error?: string;
}

export interface ResourceStatusResponse {
  success: boolean;
  id: string;
  name: string;
  status: string;
  message: string;
  access?: string;
  error?: string;
}

export interface ListResourcesResponse {
  success: boolean;
  resources: Array<{
    id: string;
    name: string;
    status: string;
    access?: string;
  }>;
  error?: string;
}

export interface ProviderInfo {
  name: string;
  apiVersion: string;
  endpoint: string;
  description?: string;
  capabilities?: string[];
  schema?: {
    provision?: any;
    update?: any;
  };
  customEndpoints?: Array<{
    path: string;
    name: string;
    description?: string;
  }>;
}

export interface ProvidersInfoResponse {
  providers: ProviderInfo[];
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (RESOURCE_API_KEY) {
    headers['X-API-Key'] = RESOURCE_API_KEY;
  }

  return headers;
}

export async function discoverProviders(): Promise<ProvidersInfoResponse> {
  try {
    const response = await fetch(`${RESOURCE_API_URL}/providers/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resource API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to discover providers:', error);
    throw error;
  }
}

export async function provisionResource(
  provider: string,
  data: ProvisionRequest
): Promise<ProvisionResponse> {
  try {
    const response = await fetch(`${RESOURCE_API_URL}/v1/${provider}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resource API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to provision resource:', error);
    throw error;
  }
}

export async function getResourceStatus(
  provider: string,
  resourceId: string
): Promise<ResourceStatusResponse> {
  try {
    const response = await fetch(
      `${RESOURCE_API_URL}/v1/${provider}/${resourceId}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resource API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get resource status:', error);
    throw error;
  }
}

export async function listResources(
  provider: string,
  org: string,
  project: string
): Promise<ListResourcesResponse> {
  try {
    const params = new URLSearchParams({
      org: org,
      project: project,
    });

    const response = await fetch(
      `${RESOURCE_API_URL}/v1/${provider}?${params.toString()}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resource API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to list resources:', error);
    throw error;
  }
}

export async function updateResource(
  provider: string,
  resourceId: string,
  data: Partial<ProvisionRequest>
): Promise<ProvisionResponse> {
  try {
    const response = await fetch(
      `${RESOURCE_API_URL}/v1/${provider}/${resourceId}`,
      {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resource API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to update resource:', error);
    throw error;
  }
}

export async function deprovisionResource(
  provider: string,
  resourceId: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const response = await fetch(
      `${RESOURCE_API_URL}/v1/${provider}/${resourceId}`,
      {
        method: 'DELETE',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resource API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to deprovision resource:', error);
    throw error;
  }
}

export async function getResourceMetrics(
  provider: string,
  resourceId: string
): Promise<any> {
  try {
    const response = await fetch(
      `${RESOURCE_API_URL}/v1/${provider}/${resourceId}/metrics`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resource API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get resource metrics:', error);
    throw error;
  }
}

export function isResourceApiConfigured(): boolean {
  return !!RESOURCE_API_URL;
}

export function getResourceApiUrl(): string {
  return RESOURCE_API_URL;
}
