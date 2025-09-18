import { PrometheusDriver } from 'prometheus-query';
import { IPFSNodePrometheusData, ClusterStatus, NetworkSummary, ClusterPeer, ClusterPin } from '@/types/nodes';
import { formatBytes } from '@/lib/nodesUtils';

async function getMetricValue(prom: PrometheusDriver, query: string): Promise<number> {
  try {
    const result = await prom.instantQuery(query);
    if (result.result && result.result.length > 0 && result.result[0].value) {
      return parseFloat(result.result[0].value.value);
    }
  } catch (error) {
    // Silently fail - metrics might not be available
  }
  return 0;
}

// Helper function to fetch IPFS API data
async function fetchIPFSApiData(port: number, endpoint: string): Promise<any> {
  try {
    const response = await fetch(`http://localhost:${port}/api/v0/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    // Silently fail - node might be offline
  }
  return null;
}

async function getNodeMetrics(prom: PrometheusDriver, nodeName: string, port: number): Promise<IPFSNodePrometheusData> {
  const instanceLabel = `${nodeName}:5001`; // Internal port for Prometheus scraping

  try {
    // Fetch data from both IPFS API and Prometheus
    const [
      repoStat,
      bitswapStat,
      peers,
      goRoutines,
      memoryUsage,
      uptime
    ] = await Promise.allSettled([
      // IPFS API calls for accurate repo data
      fetchIPFSApiData(port, 'repo/stat'),
      fetchIPFSApiData(port, 'bitswap/stat'),
      
      // Prometheus metrics for other data
      getMetricValue(prom, `ipfs_p2p_peers_total{instance="${instanceLabel}"}`),
      getMetricValue(prom, `go_goroutines{instance="${instanceLabel}"}`),
      getMetricValue(prom, `go_memstats_alloc_bytes{instance="${instanceLabel}"}`),
      getMetricValue(prom, `process_start_time_seconds{instance="${instanceLabel}"}`)
    ]);

    // Extract repo statistics from IPFS API
    const repoData = repoStat.status === 'fulfilled' && repoStat.value ? repoStat.value : null;
    const bitswapData = bitswapStat.status === 'fulfilled' && bitswapStat.value ? bitswapStat.value : null;
    
    // Node is online if we can get repo data
    const isOnline = repoData !== null;
    
    return {
      node: nodeName,
      port,
      status: isOnline ? 'online' : 'offline',
      metrics: {
        peers: peers.status === 'fulfilled' ? peers.value : (bitswapData?.Peers?.length || 0),
        repoSize: repoData?.RepoSize || 0,
        repoObjects: repoData?.NumObjects || 0,
        bitswapDataReceived: bitswapData?.DataReceived || 0,
        bitswapDataSent: bitswapData?.DataSent || 0,
        bitswapBlocksReceived: bitswapData?.BlocksReceived || 0,
        bitswapBlocksSent: bitswapData?.BlocksSent || 0,
        goRoutines: goRoutines.status === 'fulfilled' ? goRoutines.value : 0,
        memoryUsage: memoryUsage.status === 'fulfilled' ? memoryUsage.value : 0,
        uptime: uptime.status === 'fulfilled' ? uptime.value : 0,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to get metrics for ${nodeName}:`, error);
    return {
      node: nodeName,
      port,
      status: 'offline',
      metrics: {
        peers: 0,
        repoSize: 0,
        repoObjects: 0,
        bitswapDataReceived: 0,
        bitswapDataSent: 0,
        bitswapBlocksReceived: 0,
        bitswapBlocksSent: 0,
        goRoutines: 0,
        memoryUsage: 0,
        uptime: 0,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

async function getClusterStatus(): Promise<ClusterStatus> {
  try {
    // Check health first
    const healthResponse = await fetch('http://localhost:9094/health', {
      next: { revalidate: 5 } // Cache for 5 seconds
    });
    
    const isHealthy = healthResponse.ok;
    
    if (isHealthy) {
      // Fetch additional cluster information
      const [peersResponse, pinsResponse] = await Promise.allSettled([
        fetch('http://localhost:9094/peers'),
        fetch('http://localhost:9094/pins')
      ]);
      
      let peers: ClusterPeer[] = [];
      let totalPins = 0;
      let recentPins: ClusterPin[] = [];
      
      // Parse peers data
      if (peersResponse.status === 'fulfilled' && peersResponse.value.ok) {
        const peersText = await peersResponse.value.text();
        const peerLines = peersText.trim().split('\n').filter(line => line.trim());
        peers = peerLines.map(line => {
          const peer = JSON.parse(line);
          return {
            id: peer.id,
            peername: peer.peername,
            ipfs_peer_id: peer.ipfs?.id || '',
            addresses: peer.addresses || []
          };
        });
      }
      
      // Parse pins data
      if (pinsResponse.status === 'fulfilled' && pinsResponse.value.ok) {
        const pinsText = await pinsResponse.value.text();
        const pinLines = pinsText.trim().split('\n').filter(line => line.trim());
        const pins = pinLines.map(line => {
          const pin = JSON.parse(line);
          return {
            cid: pin.cid,
            name: pin.name || '',
            allocations: pin.allocations || [],
            created: pin.created,
            peer_map: Object.fromEntries(
              Object.entries(pin.peer_map || {}).map(([peerId, data]: [string, any]) => [
                peerId,
                {
                  peername: data.peername,
                  status: data.status,
                  timestamp: data.timestamp,
                  error: data.error
                }
              ])
            )
          };
        });
        
        totalPins = pins.length;
        // Get the 5 most recent pins
        recentPins = pins
          .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
          .slice(0, 5);
      }
      
      return {
        status: 'healthy' as const,
        api: 'localhost:9094',
        lastChecked: new Date().toISOString(),
        peers,
        totalPins,
        recentPins,
      };
    } else {
      return {
        status: 'offline' as const,
        api: 'localhost:9094',
        lastChecked: new Date().toISOString(),
      };
    }
  } catch (error) {
    return {
      status: 'offline' as const,
      api: 'localhost:9094',
      lastChecked: new Date().toISOString(),
    };
  }
}

export async function fetchPrometheusData(): Promise<{
  nodeData: IPFSNodePrometheusData[];
  cluster: ClusterStatus;
  summary: NetworkSummary;
}> {
  // Initialize Prometheus client
  const prom = new PrometheusDriver({
    endpoint: 'http://localhost:9090',
    baseURL: '/api/v1',
  });

  // IPFS nodes configuration
  const nodes = [
    { name: 'storage-node-1', port: 5001 },
    { name: 'storage-node-2', port: 5002 },
    { name: 'storage-node-3', port: 5003 },
    { name: 'storage-node-4', port: 5004 },
  ];

  // Fetch all data in parallel
  const [nodeDataResults, clusterStatus] = await Promise.allSettled([
    Promise.all(nodes.map(node => getNodeMetrics(prom, node.name, node.port))),
    getClusterStatus()
  ]);

  const nodeData = nodeDataResults.status === 'fulfilled' ? nodeDataResults.value : [];
  const cluster = clusterStatus.status === 'fulfilled' ? clusterStatus.value : {
    status: 'offline' as const,
    api: 'localhost:9094',
    lastChecked: new Date().toISOString(),
  };

  // Calculate summary statistics
  const summary: NetworkSummary = {
    totalNodes: nodeData.length,
    onlineNodes: nodeData.filter(n => n.status === 'online').length,
    totalPeers: nodeData.reduce((sum, node) => sum + node.metrics.peers, 0),
    totalRepoSize: nodeData.reduce((sum, node) => sum + node.metrics.repoSize, 0),
    totalRepoSizeFormatted: formatBytes(nodeData.reduce((sum, node) => sum + node.metrics.repoSize, 0)),
    totalObjects: nodeData.reduce((sum, node) => sum + node.metrics.repoObjects, 0),
    totalDataTransferred: nodeData.reduce((sum, node) => 
      sum + node.metrics.bitswapDataReceived + node.metrics.bitswapDataSent, 0),
    totalDataTransferredFormatted: formatBytes(nodeData.reduce((sum, node) => 
      sum + node.metrics.bitswapDataReceived + node.metrics.bitswapDataSent, 0)),
  };

  return {
    nodeData,
    cluster,
    summary,
  };
}