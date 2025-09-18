'use client';

import React, { useState, useEffect } from 'react';
import { Input } from './Input';

interface ColorPickerProps {
  name: string;
  id?: string;
  defaultValue?: string;
  hasError?: boolean;
  className?: string;
}

export default function ColorPicker({ 
  name, 
  id, 
  defaultValue = '#3B82F6', 
  hasError, 
  className 
}: ColorPickerProps) {
  const [color, setColor] = useState(defaultValue);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only update if it's a valid hex color or empty
    if (value === '' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
      setColor(value);
    }
  };

  const isValidHex = (hex: string) => {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <input
        type="color"
        value={isValidHex(color) ? color : defaultValue}
        onChange={(e) => handleColorChange(e.target.value)}
        className="w-16 h-10 p-1 rounded cursor-pointer border border-gray-300 dark:border-gray-700"
      />
      <Input
        type="text"
        id={id}
        name={name}
        value={color}
        onChange={handleTextChange}
        placeholder="#3B82F6"
        className="flex-1"
        pattern="^#[0-9A-Fa-f]{6}$"
        hasError={hasError}
        maxLength={7}
      />
    </div>
  );
}