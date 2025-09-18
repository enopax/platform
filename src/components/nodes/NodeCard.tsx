import { RiServerLine, RiWifiLine, RiHardDrive3Line, RiExchangeLine, RiDatabase2Line, RiCpuLine } from '@remixicon/react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { IPFSNodePrometheusData } from '@/types/nodes';
import { formatBytes, formatUptime, formatTimestamp } from '@/lib/nodesUtils';

interface NodeCardProps {
  node: IPFSNodePrometheusData;
}

export default function NodeCard({ node }: NodeCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            node.status === 'online' 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            <RiServerLine className={`w-5 h-5 ${
              node.status === 'online'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{node.node}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Port: {node.port}
            </p>
          </div>
        </div>
        <Badge variant={node.status === 'online' ? 'success' : 'destructive'}>
          {node.status === 'online' ? 'Online' : 'Offline'}
        </Badge>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <RiWifiLine className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Peers</p>
          <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{node.metrics.peers}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <RiDatabase2Line className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Objects</p>
          <p className="font-bold text-lg text-purple-600 dark:text-purple-400">
            {node.metrics.repoObjects.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <RiHardDrive3Line className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Repo Size</p>
          <p className="font-bold text-lg text-orange-600 dark:text-orange-400">
            {formatBytes(node.metrics.repoSize)}
          </p>
        </div>
      </div>

      {/* Bitswap Metrics */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <RiExchangeLine className="w-4 h-4" />
          Bitswap Activity
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Blocks Received:</span>
            <span className="font-semibold">{node.metrics.bitswapBlocksReceived.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Blocks Sent:</span>
            <span className="font-semibold">{node.metrics.bitswapBlocksSent.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Data Transferred:</span>
            <span className="font-semibold">
              {formatBytes(node.metrics.bitswapDataReceived + node.metrics.bitswapDataSent)}
            </span>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <RiCpuLine className="w-4 h-4" />
          System Info
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Memory:</span>
            <span className="font-semibold">{formatBytes(node.metrics.memoryUsage)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Go Routines:</span>
            <span className="font-semibold">{node.metrics.goRoutines}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
            <span className="font-semibold">{formatUptime(node.metrics.uptime)}</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Last updated: {formatTimestamp(node.timestamp)}
        </p>
      </div>
    </Card>
  );
}