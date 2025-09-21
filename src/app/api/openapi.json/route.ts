import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: string;
        in: string;
        name: string;
        description: string;
      };
    };
    schemas: Record<string, any>;
  };
  paths: Record<string, any>;
}

// Discover API routes by scanning the filesystem
async function discoverApiRoutes(): Promise<string[]> {
  const apiDir = path.join(process.cwd(), 'src/app/api');
  const routes: string[] = [];

  async function scanDirectory(dir: string, basePath: string = ''): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const routePath = path.join(basePath, entry.name);

        if (entry.isDirectory()) {
          // Skip dynamic route segments and special Next.js folders
          if (!entry.name.startsWith('[') && !entry.name.startsWith('(')) {
            await scanDirectory(fullPath, routePath);
          }
        } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
          // Convert filesystem path to API route
          const apiRoute = basePath.replace(/\\/g, '/');
          routes.push(apiRoute || '/');
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
      console.warn(`Cannot scan directory ${dir}:`, error);
    }
  }

  await scanDirectory(apiDir);
  return routes.sort();
}

// Analyze route file to determine supported HTTP methods
async function analyzeRouteFile(routePath: string): Promise<string[]> {
  try {
    const filePath = path.join(process.cwd(), 'src/app/api', routePath, 'route.ts');
    const content = await readFile(filePath, 'utf-8');

    const methods: string[] = [];
    const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*\(/g;

    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push(match[1].toLowerCase());
    }

    return methods;
  } catch (error) {
    // Fallback - try .js file
    try {
      const filePath = path.join(process.cwd(), 'src/app/api', routePath, 'route.js');
      const content = await readFile(filePath, 'utf-8');

      const methods: string[] = [];
      const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*\(/g;

      let match;
      while ((match = methodRegex.exec(content)) !== null) {
        methods.push(match[1].toLowerCase());
      }

      return methods;
    } catch {
      return ['get']; // Default fallback
    }
  }
}

// Generate path documentation for a specific route
function generatePathDocumentation(route: string, methods: string[]) {
  const pathDoc: Record<string, any> = {};

  methods.forEach(method => {
    const isProtected = !['auth'].some(segment => route.includes(segment));

    pathDoc[method] = {
      summary: `${method.toUpperCase()} ${route}`,
      description: getRouteDescription(route, method),
      tags: [getRouteTag(route)],
      ...(isProtected && {
        security: [{ ApiKeyAuth: [] }]
      }),
      parameters: getRouteParameters(route),
      ...(method === 'post' || method === 'put' || method === 'patch') && {
        requestBody: getRequestBody(route, method)
      },
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: getResponseSchema(route, method)
            }
          }
        },
        '400': {
          description: 'Bad request'
        },
        '401': {
          description: 'Unauthorized'
        },
        '500': {
          description: 'Internal server error'
        }
      }
    };
  });

  return pathDoc;
}

// Get route description based on the route path
function getRouteDescription(route: string, method: string): string {
  const descriptions: Record<string, string> = {
    '/upload': 'Upload files to IPFS storage with optional team/project context',
    '/nodes': 'Get IPFS node status and cluster health information',
    '/tracking': 'Log analytics and tracking events',
    '/developer/api-keys/create': 'Create a new API key for programmatic access',
    '/developer/api-keys/delete': 'Delete an existing API key',
    '/image/upload': 'Upload and resize images using Vercel Blob storage',
    '/email/confirm': 'Confirm email addresses',
    '/email/participate': 'Handle email participation requests',
    '/admin': 'Administrative functions (restricted access)',
    '/auth/signout': 'Sign out the current user'
  };

  return descriptions[route] || `${method.toUpperCase()} operation for ${route}`;
}

// Get route tag for grouping
function getRouteTag(route: string): string {
  if (route.includes('/auth')) return 'Authentication';
  if (route.includes('/developer')) return 'Developer Tools';
  if (route.includes('/upload') || route.includes('/image')) return 'File Management';
  if (route.includes('/admin')) return 'Administration';
  if (route.includes('/email')) return 'Email Services';
  if (route.includes('/nodes')) return 'Infrastructure';
  if (route.includes('/tracking')) return 'Analytics';
  return 'General';
}

// Get route parameters (for dynamic routes)
function getRouteParameters(route: string) {
  const parameters = [];

  // Extract dynamic segments like [id] or [...slug]
  const paramMatches = route.match(/\[([^\]]+)\]/g);
  if (paramMatches) {
    paramMatches.forEach(match => {
      const paramName = match.slice(1, -1);
      const isSpread = paramName.startsWith('...');
      const cleanName = isSpread ? paramName.slice(3) : paramName;

      parameters.push({
        name: cleanName,
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: `${cleanName} parameter`
      });
    });
  }

  return parameters;
}

// Get request body schema for POST/PUT/PATCH methods
function getRequestBody(route: string, method: string) {
  if (route === '/upload') {
    return {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              file: { type: 'string', format: 'binary' },
              teamId: { type: 'string', nullable: true },
              projectId: { type: 'string', nullable: true }
            },
            required: ['file']
          }
        }
      }
    };
  }

  if (route === '/developer/api-keys/create') {
    return {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              name: { type: 'string' },
              permissions: { type: 'array', items: { type: 'string' } },
              expiresIn: { type: 'number', nullable: true }
            },
            required: ['userId', 'name', 'permissions']
          }
        }
      }
    };
  }

  if (route === '/tracking') {
    return {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              event: { type: 'string' },
              referrer: { type: 'string' },
              userAgent: { type: 'string' },
              sessionId: { type: 'string' }
            },
            required: ['url']
          }
        }
      }
    };
  }

  return {
    content: {
      'application/json': {
        schema: { type: 'object' }
      }
    }
  };
}

// Get response schema
function getResponseSchema(route: string, method: string) {
  if (route === '/upload') {
    return {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        hash: { type: 'string' },
        name: { type: 'string' },
        size: { type: 'number' },
        id: { type: 'string' }
      }
    };
  }

  if (route === '/nodes') {
    return {
      type: 'object',
      properties: {
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              status: { type: 'string', enum: ['online', 'offline'] },
              peers: { type: 'number' },
              repoSize: { type: 'string' },
              api: { type: 'string' },
              gateway: { type: 'string' },
              lastUpdated: { type: 'string', format: 'date-time' }
            }
          }
        },
        cluster: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            api: { type: 'string' },
            lastChecked: { type: 'string', format: 'date-time' }
          }
        },
        timestamp: { type: 'string', format: 'date-time' }
      }
    };
  }

  if (route === '/developer/api-keys/create') {
    return {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        apiKey: { type: 'string' },
        keyId: { type: 'string' },
        keyPreview: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time', nullable: true }
      }
    };
  }

  return {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' }
    }
  };
}

export async function GET() {
  try {
    const routes = await discoverApiRoutes();

    const openApiSpec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'IPFS Storage Cluster API',
        description: 'API for managing IPFS storage, files, and developer tools',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'http://localhost/api',
          description: 'Local development server'
        },
        {
          url: 'https://your-domain.com/api',
          description: 'Production server'
        }
      ],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'API key authentication. Use format: Bearer YOUR_API_KEY'
          }
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          Success: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      },
      paths: {}
    };

    // Generate documentation for each discovered route
    for (const route of routes) {
      if (route === 'openapi.json') continue; // Skip self-reference

      const methods = await analyzeRouteFile(route);
      const apiPath = `/${route}`;

      openApiSpec.paths[apiPath] = generatePathDocumentation(route, methods);
    }

    return NextResponse.json(openApiSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Failed to generate OpenAPI specification' },
      { status: 500 }
    );
  }
}