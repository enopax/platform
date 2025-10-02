import {
  RiDatabase2Line,
  RiServerLine,
  RiHardDrive2Line,
  RiCloudLine,
} from '@remixicon/react';

export interface ResourceTemplate {
  id: string;
  name: string;
  description: string;
  type: 'STORAGE' | 'COMPUTE' | 'DATABASE' | 'API';
  icon: any;
  iconColor: string;
  popular: boolean;
  config: {
    storageSize?: number;
    recommended?: boolean;
    features: string[];
  };
  pricing: {
    estimate: string;
    period: string;
  };
  deployment: {
    mockEndpoint: string;
    mockCredentials: Record<string, string>;
    provisioningTime: number;
    configuration: Record<string, any>;
  };
}

export const RESOURCE_TEMPLATES: ResourceTemplate[] = [
  {
    id: 'ipfs-cluster-small',
    name: 'IPFS Cluster (3 Nodes)',
    description: 'Distributed IPFS storage cluster with automatic replication and high availability',
    type: 'STORAGE',
    icon: RiHardDrive2Line,
    iconColor: 'text-purple-500',
    popular: true,
    config: {
      storageSize: 50,
      recommended: true,
      features: [
        '3 IPFS nodes with cluster coordination',
        'Automatic content replication',
        'Load-balanced gateway access',
        'Cluster management API',
        'Real-time sync monitoring',
        'Pin status tracking'
      ]
    },
    pricing: {
      estimate: '$12',
      period: 'month'
    },
    deployment: {
      mockEndpoint: 'http://ipfs-cluster-{id}.local:9094',
      mockCredentials: {
        clusterSecret: 'mock-cluster-secret-{id}',
        apiToken: 'mock-api-token-{id}',
        gatewayUrl: 'http://gateway-{id}.local:8080'
      },
      provisioningTime: 5000,
      configuration: {
        nodes: 3,
        replicationMin: 2,
        replicationMax: 3,
        clusterPeers: [
          '/ip4/10.0.1.1/tcp/9096/p2p/{peer1}',
          '/ip4/10.0.1.2/tcp/9096/p2p/{peer2}',
          '/ip4/10.0.1.3/tcp/9096/p2p/{peer3}'
        ],
        ports: {
          clusterApi: 9094,
          gateway: 8080,
          swarm: 4001
        }
      }
    }
  },
  {
    id: 'postgres-small',
    name: 'PostgreSQL Database (Small)',
    description: 'Managed PostgreSQL database with automatic backups and monitoring',
    type: 'DATABASE',
    icon: RiDatabase2Line,
    iconColor: 'text-blue-500',
    popular: true,
    config: {
      storageSize: 10,
      recommended: true,
      features: [
        '2 vCPUs, 4GB RAM',
        'Daily automated backups',
        'Connection pooling (PgBouncer)',
        'SSL/TLS encryption',
        'Point-in-time recovery',
        'Performance monitoring'
      ]
    },
    pricing: {
      estimate: '$8',
      period: 'month'
    },
    deployment: {
      mockEndpoint: 'postgresql://postgres-{id}.local:5432/maindb',
      mockCredentials: {
        host: 'postgres-{id}.local',
        port: '5432',
        database: 'maindb',
        username: 'dbuser_{id}',
        password: 'mock-password-{id}',
        connectionString: 'postgresql://dbuser_{id}:mock-password-{id}@postgres-{id}.local:5432/maindb',
        pgBouncerPort: '6432'
      },
      provisioningTime: 4000,
      configuration: {
        version: '17',
        maxConnections: 100,
        sharedBuffers: '1GB',
        effectiveCacheSize: '3GB',
        maintenanceWorkMem: '256MB',
        walBuffers: '16MB',
        backup: {
          enabled: true,
          schedule: 'daily',
          retention: 7
        }
      }
    }
  },
  {
    id: 'postgres-medium',
    name: 'PostgreSQL Database (Medium)',
    description: 'Production-grade PostgreSQL with read replicas and enhanced performance',
    type: 'DATABASE',
    icon: RiDatabase2Line,
    iconColor: 'text-blue-600',
    popular: false,
    config: {
      storageSize: 50,
      features: [
        '4 vCPUs, 16GB RAM',
        '1 read replica for HA',
        'Daily automated backups',
        'Advanced connection pooling',
        'SSL/TLS encryption',
        'Query performance insights',
        'Custom maintenance windows'
      ]
    },
    pricing: {
      estimate: '$25',
      period: 'month'
    },
    deployment: {
      mockEndpoint: 'postgresql://postgres-{id}.local:5432/maindb',
      mockCredentials: {
        host: 'postgres-{id}.local',
        port: '5432',
        database: 'maindb',
        username: 'dbuser_{id}',
        password: 'mock-password-{id}',
        connectionString: 'postgresql://dbuser_{id}:mock-password-{id}@postgres-{id}.local:5432/maindb',
        readReplicaHost: 'postgres-{id}-replica.local',
        pgBouncerPort: '6432'
      },
      provisioningTime: 6000,
      configuration: {
        version: '17',
        maxConnections: 200,
        sharedBuffers: '4GB',
        effectiveCacheSize: '12GB',
        maintenanceWorkMem: '1GB',
        walBuffers: '64MB',
        readReplicas: 1,
        backup: {
          enabled: true,
          schedule: 'daily',
          retention: 30,
          pointInTimeRecovery: true
        }
      }
    }
  },
  {
    id: 'small-storage',
    name: 'Small Project Storage',
    description: 'Perfect for small projects, documentation, and lightweight assets',
    type: 'STORAGE',
    icon: RiCloudLine,
    iconColor: 'text-green-500',
    popular: false,
    config: {
      storageSize: 5,
      features: ['5GB IPFS Storage', 'Basic file sharing', 'Version history']
    },
    pricing: {
      estimate: 'Free',
      period: 'month'
    },
    deployment: {
      mockEndpoint: 'http://ipfs-{id}.local:8080',
      mockCredentials: {
        apiEndpoint: 'http://ipfs-{id}.local:5001',
        gatewayUrl: 'http://ipfs-{id}.local:8080',
        apiKey: 'mock-api-key-{id}'
      },
      provisioningTime: 2000,
      configuration: {
        nodes: 1,
        ports: {
          api: 5001,
          gateway: 8080,
          swarm: 4001
        }
      }
    }
  },
  {
    id: 'medium-storage',
    name: 'Standard Project Storage',
    description: 'Great for medium-sized projects with multimedia content',
    type: 'STORAGE',
    icon: RiCloudLine,
    iconColor: 'text-green-600',
    popular: false,
    config: {
      storageSize: 25,
      features: ['25GB IPFS Storage', 'Advanced sharing', 'CDN acceleration', 'Analytics']
    },
    pricing: {
      estimate: '$5',
      period: 'month'
    },
    deployment: {
      mockEndpoint: 'http://ipfs-{id}.local:8080',
      mockCredentials: {
        apiEndpoint: 'http://ipfs-{id}.local:5001',
        gatewayUrl: 'http://ipfs-{id}.local:8080',
        apiKey: 'mock-api-key-{id}'
      },
      provisioningTime: 3000,
      configuration: {
        nodes: 1,
        ports: {
          api: 5001,
          gateway: 8080,
          swarm: 4001
        }
      }
    }
  },
  {
    id: 'large-storage',
    name: 'Enterprise Storage',
    description: 'Scalable storage for large applications and datasets',
    type: 'STORAGE',
    icon: RiCloudLine,
    iconColor: 'text-green-700',
    popular: false,
    config: {
      storageSize: 100,
      features: ['100GB IPFS Storage', 'Priority support', 'Custom endpoints', 'SLA guarantee']
    },
    pricing: {
      estimate: '$15',
      period: 'month'
    },
    deployment: {
      mockEndpoint: 'http://ipfs-{id}.local:8080',
      mockCredentials: {
        apiEndpoint: 'http://ipfs-{id}.local:5001',
        gatewayUrl: 'http://ipfs-{id}.local:8080',
        apiKey: 'mock-api-key-{id}'
      },
      provisioningTime: 4000,
      configuration: {
        nodes: 1,
        ports: {
          api: 5001,
          gateway: 8080,
          swarm: 4001
        }
      }
    }
  }
];

export function getTemplateById(id: string): ResourceTemplate | undefined {
  return RESOURCE_TEMPLATES.find(t => t.id === id);
}

export function generateMockEndpoint(template: ResourceTemplate, resourceId: string): string {
  return template.deployment.mockEndpoint.replace(/{id}/g, resourceId.substring(0, 8));
}

export function generateMockCredentials(template: ResourceTemplate, resourceId: string): Record<string, string> {
  const credentials: Record<string, string> = {};
  const shortId = resourceId.substring(0, 8);

  for (const [key, value] of Object.entries(template.deployment.mockCredentials)) {
    credentials[key] = value.replace(/{id}/g, shortId);
  }

  return credentials;
}

export function generateDeploymentConfig(template: ResourceTemplate, resourceId: string): Record<string, any> {
  const config = JSON.parse(JSON.stringify(template.deployment.configuration));
  const shortId = resourceId.substring(0, 8);

  const replaceIds = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/{id}/g, shortId)
                .replace(/{peer1}/g, `Qm${shortId}Peer1`)
                .replace(/{peer2}/g, `Qm${shortId}Peer2`)
                .replace(/{peer3}/g, `Qm${shortId}Peer3`);
    }
    if (Array.isArray(obj)) {
      return obj.map(replaceIds);
    }
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = replaceIds(value);
      }
      return result;
    }
    return obj;
  };

  return replaceIds(config);
}
