import { NextResponse } from 'next/server';

interface IPFSNodeMetrics {
  id: string;
  name: string;
  status: 'online' | 'offline';
  peers: number;
  repoSize: string;
  api: string;
  gateway: string;
  lastUpdated: string;
}

export async function GET() {
  try {
    // IPFS nodes configuration from docker-compose.yml
    const nodes = [
      { id: 'storage-node-1', port: 5001, gatewayPort: 8080 },
      { id: 'storage-node-2', port: 5002, gatewayPort: 8081 },
      { id: 'storage-node-3', port: 5003, gatewayPort: 8082 },
      { id: 'storage-node-4', port: 5004, gatewayPort: 8083 },
    ];

    const nodeMetrics: IPFSNodeMetrics[] = await Promise.all(
      nodes.map(async (node) => {
        try {
          // Try to get node ID and basic info
          const response = await fetch(`http://localhost:${node.port}/api/v0/id`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Node offline');
          }

          const nodeInfo = await response.json();

          // Get peer count
          const peersResponse = await fetch(`http://localhost:${node.port}/api/v0/swarm/peers`, {
            method: 'POST',
          });

          let peerCount = 0;
          if (peersResponse.ok) {
            const peersData = await peersResponse.json();
            peerCount = peersData.Peers ? peersData.Peers.length : 0;
          }

          // Get repo stats (simplified - you could parse Prometheus metrics for more details)
          const repoStatsResponse = await fetch(`http://localhost:${node.port}/api/v0/repo/stat`, {
            method: 'POST',
          });

          let repoSize = 'Unknown';
          if (repoStatsResponse.ok) {
            const repoStats = await repoStatsResponse.json();
            const sizeBytes = repoStats.RepoSize || 0;
            repoSize = formatBytes(sizeBytes);
          }

          return {
            id: nodeInfo.ID.substring(0, 12) + '...',
            name: node.id,
            status: 'online' as const,
            peers: peerCount,
            repoSize,
            api: `localhost:${node.port}`,
            gateway: `localhost:${node.gatewayPort}`,
            lastUpdated: new Date().toISOString(),
          };
        } catch (error) {
          return {
            id: 'unknown',
            name: node.id,
            status: 'offline' as const,
            peers: 0,
            repoSize: 'N/A',
            api: `localhost:${node.port}`,
            gateway: `localhost:${node.gatewayPort}`,
            lastUpdated: new Date().toISOString(),
          };
        }
      })
    );

    // Get cluster status
    let clusterStatus = null;
    try {
      const clusterResponse = await fetch('http://localhost:9094/health');
      if (clusterResponse.ok) {
        clusterStatus = {
          status: 'healthy',
          api: 'localhost:9094',
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error) {
      clusterStatus = {
        status: 'offline',
        api: 'localhost:9094',
        lastChecked: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      nodes: nodeMetrics,
      cluster: clusterStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching node metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch node metrics' },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}