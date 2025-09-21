'use client';

import React, { useState } from 'react';
import { useActionState } from 'react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import { searchFilesAction, type ActionResult } from '@/actions/file-actions';
import { RiSearchLine, RiLoader4Line } from '@remixicon/react';

interface FileSearchFormProps {
  teamId?: string;
  onSearchResults?: (results: any[]) => void;
}

export default function FileSearchForm({
  teamId,
  onSearchResults
}: FileSearchFormProps) {
  const [state, formAction, isPending] = useActionState(searchFilesAction, null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleFormAction = async (formData: FormData) => {
    const result = await formAction(formData);

    // Call callback with results if provided
    if (onSearchResults && result?.success && result.data) {
      onSearchResults(result.data);
    }
  };

  return (
    <div className="space-y-4">
      <form action={handleFormAction} className="space-y-4">
        <div className="flex gap-2">
          <Input
            name="query"
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isPending}
            className="flex-1"
          />

          {/* Hidden field for team context */}
          {teamId && <input type="hidden" name="teamId" value={teamId} />}

          <Button
            type="submit"
            disabled={isPending || !searchQuery.trim()}
          >
            {isPending ? (
              <>
                <RiLoader4Line className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <RiSearchLine className="w-4 h-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>
      </form>

      {state?.error && (
        <Callout variant="error" title="Search Failed">
          {state.error}
        </Callout>
      )}

      {state?.success && state.data && (
        <Callout variant="success" title="Search Results">
          Found {state.data.length} file(s) matching "{searchQuery}"
        </Callout>
      )}
    </div>
  );
}