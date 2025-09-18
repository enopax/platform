import { RiGlobalLine } from '@remixicon/react';
import { Card } from '@/components/common/Card';
import { NetworkSummary as NetworkSummaryType } from '@/types/nodes';

interface NetworkSummaryProps {
  summary: NetworkSummaryType;
}

export default function NetworkSummary({ summary }: NetworkSummaryProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <RiGlobalLine className="w-5 h-5 text-brand-600" />
        Network Summary
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {summary.onlineNodes}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Online Nodes</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {summary.totalNodes - summary.onlineNodes}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Offline Nodes</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.totalPeers}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Peers</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {summary.totalObjects.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Objects</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {summary.totalRepoSizeFormatted}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Storage Used</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {summary.totalDataTransferredFormatted}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Data Transferred</div>
        </div>
      </div>
    </Card>
  );
}