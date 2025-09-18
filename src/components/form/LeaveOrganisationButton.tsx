'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { leaveOrganisation } from '@/actions/organisationJoinRequest';
import { RiLogoutBoxLine } from '@remixicon/react';

interface LeaveOrganisationButtonProps {
  organisationId: string;
  organisationName: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'light';
  className?: string;
}

export default function LeaveOrganisationButton({ 
  organisationId, 
  organisationName, 
  size = 'md',
  variant = 'outline',
  className = ''
}: LeaveOrganisationButtonProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeave = async () => {
    const confirmed = confirm(
      `Are you sure you want to leave "${organisationName}"?\n\nThis will remove you from:\n- The organisation\n- All teams within the organisation\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setIsLeaving(true);
    try {
      const result = await leaveOrganisation(organisationId);
      
      if (result.error) {
        alert(result.error); // In a real app, you'd want better error handling
      }
      // If successful, the page will be revalidated and the organisation will disappear from the list
    } catch (error) {
      alert('Failed to leave organisation');
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLeave}
      disabled={isLeaving}
      isLoading={isLeaving}
      className={className}
    >
      <RiLogoutBoxLine className="w-4 h-4 mr-1" />
      {isLeaving ? 'Leaving...' : 'Leave'}
    </Button>
  );
}