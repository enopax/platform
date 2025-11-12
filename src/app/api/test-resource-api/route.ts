import { NextRequest, NextResponse } from 'next/server';
import {
  discoverProviders,
  provisionResource,
  getResourceStatus,
  listResources,
  deprovisionResource,
  isResourceApiConfigured,
  getResourceApiUrl,
} from '@/lib/resource-api-client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (!isResourceApiConfigured()) {
    return NextResponse.json(
      {
        error: 'Resource API not configured',
        message: 'Please set RESOURCE_API_URL in environment variables',
      },
      { status: 500 }
    );
  }

  try {
    switch (action) {
      case 'discover': {
        const providers = await discoverProviders();
        return NextResponse.json({
          success: true,
          data: providers,
          apiUrl: getResourceApiUrl(),
        });
      }

      case 'status': {
        const provider = searchParams.get('provider') || 'example';
        const resourceId = searchParams.get('resourceId');

        if (!resourceId) {
          return NextResponse.json(
            { error: 'resourceId parameter required' },
            { status: 400 }
          );
        }

        const status = await getResourceStatus(provider, resourceId);
        return NextResponse.json({
          success: true,
          data: status,
        });
      }

      case 'list': {
        const provider = searchParams.get('provider') || 'example';
        const org = searchParams.get('org');
        const project = searchParams.get('project');

        if (!org || !project) {
          return NextResponse.json(
            { error: 'org and project parameters required' },
            { status: 400 }
          );
        }

        const resources = await listResources(provider, org, project);
        return NextResponse.json({
          success: true,
          data: resources,
        });
      }

      default: {
        return NextResponse.json({
          success: true,
          message: 'Resource API test endpoint',
          apiUrl: getResourceApiUrl(),
          availableActions: [
            'discover',
            'status (requires provider & resourceId)',
            'list (requires provider, org & project)',
          ],
        });
      }
    }
  } catch (error) {
    console.error('Resource API test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (!isResourceApiConfigured()) {
    return NextResponse.json(
      {
        error: 'Resource API not configured',
        message: 'Please set RESOURCE_API_URL in environment variables',
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    switch (action) {
      case 'provision': {
        const provider = searchParams.get('provider') || 'example';

        const result = await provisionResource(provider, {
          name: body.name || 'test-resource',
          organisationName: body.organisationName || 'Test Organisation',
          projectName: body.projectName || 'Test Project',
          userId: body.userId || 'test-user',
          sshKeys: body.sshKeys || [],
        });

        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      default: {
        return NextResponse.json(
          { error: 'Invalid action. Use action=provision' },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('Resource API test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const provider = searchParams.get('provider') || 'example';
  const resourceId = searchParams.get('resourceId');

  if (!isResourceApiConfigured()) {
    return NextResponse.json(
      {
        error: 'Resource API not configured',
        message: 'Please set RESOURCE_API_URL in environment variables',
      },
      { status: 500 }
    );
  }

  if (!resourceId) {
    return NextResponse.json(
      { error: 'resourceId parameter required' },
      { status: 400 }
    );
  }

  try {
    const result = await deprovisionResource(provider, resourceId);
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Resource API test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
