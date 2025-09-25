'use client';

import { useState, ReactNode } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import Modal from '@/components/common/Modal';
import { RiAlertLine, RiDeleteBin7Line } from '@remixicon/react';

interface ConfirmDialogProps {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  requiredInput?: string;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({
  trigger,
  title,
  description,
  confirmText = 'Continue',
  requiredInput,
  onConfirm,
  isLoading = false,
  variant = 'danger'
}: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (requiredInput && inputValue !== requiredInput) {
      return; // Don't proceed if required input doesn't match
    }

    setIsProcessing(true);
    try {
      await onConfirm();
      setIsOpen(false);
      setInputValue('');
    } catch (error) {
      // Error handling is done in the onConfirm function
    } finally {
      setIsProcessing(false);
    }
  };

  const canConfirm = requiredInput ? inputValue === requiredInput : true;
  const isButtonLoading = isLoading || isProcessing;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: 'text-red-500',
          buttonClass: 'bg-red-600 hover:bg-red-700',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
        };
      case 'warning':
        return {
          iconColor: 'text-amber-500',
          buttonClass: 'bg-amber-600 hover:bg-amber-700',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        };
      default:
        return {
          iconColor: 'text-red-500',
          buttonClass: 'bg-red-600 hover:bg-red-700',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
        };
    }
  };

  const { iconColor, buttonClass, bgColor } = getVariantStyles();

  return (
    <Modal
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={trigger}
      title={title}
    >
      <div className="space-y-6">
        {/* Warning Icon and Description */}
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 p-2 rounded-full ${bgColor} ${iconColor}`}>
            <RiAlertLine className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {description}
            </p>
          </div>
        </div>

        {/* Required Input Field */}
        {requiredInput && (
          <div className="space-y-2">
            <Label htmlFor="confirm-input">
              Type "{requiredInput}" to confirm:
            </Label>
            <Input
              id="confirm-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Type "${requiredInput}"`}
              className="font-mono"
              disabled={isButtonLoading}
            />
            {inputValue && inputValue !== requiredInput && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Input doesn't match. Please type "{requiredInput}" exactly.
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={() => {
              setIsOpen(false);
              setInputValue('');
            }}
            disabled={isButtonLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || isButtonLoading}
            isLoading={isButtonLoading}
            className={buttonClass}
          >
            <RiDeleteBin7Line className="w-4 h-4 mr-2" />
            {isButtonLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}