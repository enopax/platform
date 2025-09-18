import { RiServerLine, RiCheckboxCircleFill, RiErrorWarningFill, RiTimeLine } from '@remixicon/react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { ClusterStatus as ClusterStatusType } from '@/types/nodes';

interface ClusterStatusProps {
  cluster: ClusterStatusType;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function ClusterStatus({ cluster }: ClusterStatusProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <RiServerLine className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">IPFS Cluster</h3>
            <p className="text-gray-600 dark:text-gray-300">
              API: {cluster.api}
            </p>
          </div>
        </div>
        <Badge variant={cluster.status === 'healthy' ? 'success' : 'destructive'}>
          {cluster.status === 'healthy' ? '✅ Healthy' : '❌ Offline'}
        </Badge>
      </div>

      {cluster.status === 'healthy' && cluster.peers && (
        <>
          {/* Cluster Peers */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Cluster Peers ({cluster.peers.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cluster.peers.map((peer) => (
                <div
                  key={peer.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <RiCheckboxCircleFill className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{peer.peername}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {peer.ipfs_peer_id.slice(0, 20)}...
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cluster Statistics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {cluster.totalPins || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Pins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {cluster.peers?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Peers</div>
            </div>
          </div>

          {/* Recent Pin Allocations */}
          {cluster.recentPins && cluster.recentPins.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Recent Pin Allocations
              </h4>
              <div className="space-y-3">
                {cluster.recentPins.map((pin) => (
                  <div
                    key={pin.cid}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                          {pin.cid.slice(0, 20)}...
                        </code>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <RiTimeLine className="w-3 h-3" />
                          {formatTimeAgo(pin.created)}
                        </div>
                      </div>
                      <Badge variant="neutral">
                        {pin.allocations.length} replicas
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(pin.peer_map).map(([peerId, peerInfo]) => {
                        const statusColors = {
                          pinned: 'text-green-600 bg-green-100 dark:bg-green-900/30',
                          pinning: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
                          pin_error: 'text-red-600 bg-red-100 dark:bg-red-900/30'
                        };
                        
                        return (
                          <div
                            key={peerId}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              statusColors[peerInfo.status] || statusColors.pin_error
                            }`}
                          >
                            {peerInfo.status === 'pinned' && <RiCheckboxCircleFill className="w-3 h-3" />}
                            {peerInfo.status === 'pin_error' && <RiErrorWarningFill className="w-3 h-3" />}
                            <span>{peerInfo.peername}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}