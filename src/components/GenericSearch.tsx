'use client'

import type { ChangeEvent, KeyboardEvent } from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/common/Popover';
import { RiSearchLine } from '@remixicon/react';
import { useState, useEffect, useRef } from 'react';

export interface SearchResult {
  id: string;
  [key: string]: any;
}

export interface GenericSearchProps<T extends SearchResult> {
  placeholder?: string;
  defaultValue?: T | null;
  setResult: (value: T) => void;
  name?: string;
  required?: boolean;
  hasError?: boolean;
  searchFunction: (query: string) => Promise<T[]>;
  getDisplayName: (item: T) => string;
  getSecondaryText?: (item: T) => string | null;
  getBadgeText?: (item: T) => string;
  getBadgeVariant?: (item: T) => 'default' | 'neutral' | 'success' | 'error' | 'warning';
  minSearchLength?: number;
  debounceMs?: number;
}

export default function GenericSearch<T extends SearchResult>({
  placeholder = 'Search...',
  defaultValue,
  setResult,
  name,
  required,
  hasError,
  searchFunction,
  getDisplayName,
  getSecondaryText,
  getBadgeText,
  getBadgeVariant = () => 'default',
  minSearchLength = 2,
  debounceMs = 300,
}: GenericSearchProps<T>) {
  const [blocking, setBlocking] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue ? getDisplayName(defaultValue) : '');
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [selectedItem, setSelectedItem] = useState<T | null>(defaultValue || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Clear selection if input is manually changed
    if (selectedItem && value !== getDisplayName(selectedItem)) {
      setSelectedItem(null);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (inputValue.length < minSearchLength) {
      setSearchResults([]);
      return;
    }

    setBlocking(true);
    const debounceTimeout = setTimeout(async () => {
      try {
        const results = await searchFunction(inputValue);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching:', error);
        setSearchResults([]);
      } finally {
        setBlocking(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(debounceTimeout);
      setBlocking(false);
    };
  }, [inputValue, searchFunction, minSearchLength, debounceMs]);

  const handleItemSelect = (item: T) => {
    setSelectedItem(item);
    setInputValue(getDisplayName(item));
    setResult(item);
    setSearchResults([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchResults([]);
    }
  };

  // Don't show results if an item is selected and input matches the selected item
  const showResults = searchResults.length > 0 && 
    !(selectedItem && inputValue === getDisplayName(selectedItem));

  return (
    <div className="relative">
      <Popover open={showResults}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              type="search"
              name="search"
              placeholder={placeholder}
              autoComplete="off"
              value={inputValue}
              onChange={onInput}
              onKeyDown={handleKeyDown}
              hasError={hasError}
              required={required}
            />
          </div>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 max-h-60"
          align="start"
          side="bottom"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-60 overflow-auto">
            {searchResults.map((item) => {
              const displayName = getDisplayName(item);
              const secondaryText = getSecondaryText?.(item);
              const badgeText = getBadgeText?.(item);
              const badgeVariant = getBadgeVariant(item);

              return (
                <div
                  key={item.id}
                  className="px-4 py-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleItemSelect(item)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {displayName}
                      </span>
                      {secondaryText && (
                        <span className="text-xs text-gray-500">{secondaryText}</span>
                      )}
                    </div>
                    {badgeText && (
                      <Badge variant={badgeVariant}>
                        {badgeText}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Hidden input for form submission */}
      {selectedItem && name && (
        <input type="hidden" name={name} value={selectedItem.id} />
      )}
    </div>
  );
}