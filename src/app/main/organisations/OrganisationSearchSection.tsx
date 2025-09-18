'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import OrganisationSearch from '@/components/search/OrganisationSearch';
import { getUserJoinRequestStatus, createJoinRequest } from '@/actions/organisationJoinRequest';
import {
  RiSearchLine,
  RiBuildingLine,
  RiUserLine,
  RiTeamLine,
  RiProjectorLine,
  RiExternalLinkLine,
  RiUserAddLine,
  RiTimeLine,
  RiCheckLine,
  RiCloseLine
} from '@remixicon/react';
import { OrganisationJoinRequest } from '@prisma/client';

type SearchableOrganisation = {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  email: string | null;
  isActive: boolean;
  owner: {
    name: string | null;
    firstname: string | null;
    lastname: string | null;
    email: string;
  };
  _count: {
    members: number;
    teams: number;
    projects: number;
  };
  createdAt: Date;
  updatedAt: Date;
};

export default function OrganisationSearchSection() {
  const [searchResult, setSearchResult] = useState<SearchableOrganisation | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [joinRequestStatus, setJoinRequestStatus] = useState<OrganisationJoinRequest | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const handleSearchResult = (organisation: SearchableOrganisation) => {
    setSearchResult(organisation);
    loadJoinRequestStatus(organisation.id);
  };

  const clearSearch = () => {
    setSearchResult(null);
    setShowSearch(false);
    setJoinRequestStatus(null);
  };

  const loadJoinRequestStatus = async (organisationId: string) => {
    setLoadingStatus(true);
    try {
      const status = await getUserJoinRequestStatus(organisationId);
      setJoinRequestStatus(status);
    } catch (error) {
      console.error('Failed to load join request status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleJoinRequest = async () => {
    if (!searchResult) return;
    
    setIsRequesting(true);
    try {
      const formData = new FormData();
      const result = await createJoinRequest(searchResult.id, {}, formData);
      
      if (result.error) {
        alert(result.error); // In a real app, you'd want better error handling
      } else if (result.success) {
        // Refresh the join request status
        loadJoinRequestStatus(searchResult.id);
      }
    } catch (error) {
      alert('Failed to send join request');
    } finally {
      setIsRequesting(false);
    }
  };

  const getJoinRequestBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
            <RiTimeLine className="w-3 h-3 mr-1" />
            Request Pending
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="default" className="text-green-600 border-green-200 bg-green-50">
            <RiCheckLine className="w-3 h-3 mr-1" />
            Request Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
            <RiCloseLine className="w-3 h-3 mr-1" />
            Request Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mb-8">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Find Organisations
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Search for organisations to view their details or request membership
            </p>
          </div>
          {!showSearch && (
            <Button 
              variant="outline" 
              onClick={() => setShowSearch(true)}
            >
              <RiSearchLine className="mr-2 h-4 w-4" />
              Search
            </Button>
          )}
        </div>

        {showSearch && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <OrganisationSearch
                  setResult={handleSearchResult}
                  placeholder="Search organisations by name or description..."
                />
              </div>
              <Button variant="outline" onClick={clearSearch}>
                Cancel
              </Button>
            </div>

            {searchResult && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
                      <RiBuildingLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {searchResult.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Owner: {searchResult.owner.name || 
                               `${searchResult.owner.firstname || ''} ${searchResult.owner.lastname || ''}`.trim() || 
                               searchResult.owner.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    Organisation
                  </Badge>
                </div>

                {searchResult.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {searchResult.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center">
                    <RiUserLine className="h-3 w-3 mr-1" />
                    <span className="font-medium">{searchResult._count.members}</span>
                    <span className="ml-1">members</span>
                  </div>
                  <div className="flex items-center">
                    <RiTeamLine className="h-3 w-3 mr-1" />
                    <span className="font-medium">{searchResult._count.teams}</span>
                    <span className="ml-1">teams</span>
                  </div>
                  <div className="flex items-center">
                    <RiProjectorLine className="h-3 w-3 mr-1" />
                    <span className="font-medium">{searchResult._count.projects}</span>
                    <span className="ml-1">projects</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {joinRequestStatus ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      {getJoinRequestBadge(joinRequestStatus.status)}
                      {joinRequestStatus.status === 'REJECTED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleJoinRequest}
                          disabled={isRequesting}
                          isLoading={isRequesting}
                        >
                          <RiUserAddLine className="mr-1 h-3 w-3" />
                          {isRequesting ? 'Requesting...' : 'Request Again'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleJoinRequest}
                      disabled={loadingStatus || isRequesting}
                      isLoading={isRequesting}
                    >
                      <RiUserAddLine className="mr-1 h-3 w-3" />
                      {isRequesting ? 'Requesting...' : 'Request to Join'}
                    </Button>
                  )}
                  {searchResult.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(
                        searchResult.website!.startsWith('http') 
                          ? searchResult.website! 
                          : `https://${searchResult.website}`, 
                        '_blank'
                      )}
                    >
                      <RiExternalLinkLine className="mr-1 h-3 w-3" />
                      Visit Website
                    </Button>
                  )}
                  {searchResult.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `mailto:${searchResult.email}`}
                    >
                      Contact
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}