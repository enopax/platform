export interface IPFSNodeMetrics {
  peers: number;
  repoSize: number;
  repoObjects: number;
  bitswapDataReceived: number;
  bitswapDataSent: number;
  bitswapBlocksReceived: number;
  bitswapBlocksSent: number;
  goRoutines: number;
  memoryUsage: number;
  uptime: number;
}

export interface IPFSNodePrometheusData {
  node: string;
  port: number;
  status: 'online' | 'offline';
  metrics: IPFSNodeMetrics;
  timestamp: string;
}

export interface ClusterPeer {
  id: string;
  peername: string;
  ipfs_peer_id: string;
  addresses: string[];
}

export interface ClusterPin {
  cid: string;
  name: string;
  allocations: string[];
  created: string;
  peer_map: Record<string, {
    peername: string;
    status: 'pinned' | 'pinning' | 'pin_error';
    timestamp: string;
    error?: string;
  }>;
}

export interface ClusterStatus {
  status: 'healthy' | 'offline';
  api: string;
  lastChecked: string;
  peers?: ClusterPeer[];
  totalPins?: number;
  recentPins?: ClusterPin[];
}

export interface NetworkSummary {
  totalNodes: number;
  onlineNodes: number;
  totalPeers: number;
  totalRepoSize: number;
  totalRepoSizeFormatted: string;
  totalObjects: number;
  totalDataTransferred: number;
  totalDataTransferredFormatted: string;
}