'use client';

import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { respondToJoinRequest } from '@/actions/organisationJoinRequest';
import { 
  RiUserLine, 
  RiCheckLine, 
  RiCloseLine,
  RiMailLine,
  RiCalendarLine
} from '@remixicon/react';
import { format } from 'date-fns';

interface JoinRequest {
  id: string;
  requestedAt: Date;
  user: {
    id: string;
    name: string | null;
    firstname: string | null;
    lastname: string | null;
    email: string;
    image: string | null;
  };
}

interface JoinRequestsManagerProps {
  organisationId: string;
  joinRequests: JoinRequest[];
}

export default function JoinRequestsManager({ organisationId, joinRequests }: JoinRequestsManagerProps) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const getUserDisplayName = (user: JoinRequest['user']) => {
    if (user.name) return user.name;
    if (user.firstname && user.lastname) return `${user.firstname} ${user.lastname}`;
    if (user.firstname) return user.firstname;
    return user.email.split('@')[0];
  };

  const handleResponse = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingIds(prev => new Set([...prev, requestId]));
    
    try {
      const result = await respondToJoinRequest(requestId, status);
      
      if (result.error) {
        alert(result.error); // In a real app, you'd want better error handling
      }
      
      // The page will be revalidated and re-render without this request
    } catch (error) {
      alert('Failed to process request');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-4">
      {joinRequests.map((request) => {
        const isProcessing = processingIds.has(request.id);
        
        return (
          <Card key={request.id} className="p-4">
            {/* User Info */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold text-sm mr-3">
                  {getUserDisplayName(request.user).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {getUserDisplayName(request.user)}
                  </h4>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <RiMailLine className="w-3 h-3 mr-1" />
                    {request.user.email}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 mt-1">
                    <RiCalendarLine className="w-3 h-3 mr-1" />
                    Requested {format(new Date(request.requestedAt), 'MMM d, yyyy \'at\' h:mm a')}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                Pending
              </Badge>
            </div>


            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResponse(request.id, 'REJECTED')}
                disabled={isProcessing}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <RiCloseLine className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => handleResponse(request.id, 'APPROVED')}
                disabled={isProcessing}
                isLoading={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <RiCheckLine className="w-4 h-4 mr-1" />
                {isProcessing ? 'Processing...' : 'Approve'}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}