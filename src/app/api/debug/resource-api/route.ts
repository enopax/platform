import { NextRequest, NextResponse } from 'next/server';
import {
  discoverProviders,
  provisionResource,
} from '@/lib/resource-api-client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    if (action === 'discover') {
      const providers = await discoverProviders();
      return NextResponse.json({
        success: true,
        data: providers,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use ?action=discover' },
      { status: 400 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        hint:
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('fetch failed')
            ? 'Resource API server is not running. Start it with: cd resource-api && pnpm dev'
            : 'Check RESOURCE_API_URL in .env.local',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, resourceData } = body;

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider is required' },
        { status: 400 }
      );
    }

    const result = await provisionResource(provider, resourceData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        hint:
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('fetch failed')
            ? 'Resource API server is not running. Start it with: cd resource-api && pnpm dev'
            : 'Check resource data format or provider availability',
      },
      { status: 500 }
    );
  }
}
