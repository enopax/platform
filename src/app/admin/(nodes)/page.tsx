import Container from '@/components/common/Container';
import ClusterStatus from '@/components/nodes/ClusterStatus';
import NodeCard from '@/components/nodes/NodeCard';
import NetworkSummary from '@/components/nodes/NetworkSummary';
import NodesClient from '@/components/NodesClient';
import { fetchPrometheusData } from '@/services/prometheusService';

export default async function NodesPage() {
  // Fetch all data using the service
  const { nodeData, cluster, summary } = await fetchPrometheusData();

  return (
    <main className="py-12">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                IPFS Node Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Real-time monitoring of IPFS storage nodes and cluster status
              </p>
            </div>
            <NodesClient />
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Cluster Status */}
        <div className="mb-8">
          <ClusterStatus cluster={cluster} />
        </div>

        {/* Node Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {nodeData.map((node) => (
            <NodeCard key={node.node} node={node} />
          ))}
        </div>

        {/* Network Summary */}
        <NetworkSummary summary={summary} />
      </Container>
    </main>
  );
}