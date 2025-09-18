'use client'

import { useEffect, useRef, useState } from 'react';
import { createPayPalOrder, capturePayPalOrder } from '@/actions/paypal';

interface PayPalCheckoutProps {
  amount: string;
  currency?: string;
  productId?: string;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PayPalCheckout({
  amount,
  currency = 'EUR',
  productId,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  className = ''
}: PayPalCheckoutProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0); // Add retry counter to force re-render

  useEffect(() => {
    const loadPayPalScript = () => {
      if (window.paypal) {
        setIsScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=${currency}`;
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      script.onerror = () => setError('Failed to load PayPal SDK');
      document.body.appendChild(script);
    };

    loadPayPalScript();
  }, [currency, retryCount]); // Include retryCount to reload script on retry

  useEffect(() => {
    if (!isScriptLoaded || !window.paypal || !paypalRef.current || error) return;

    const renderPayPalButton = () => {
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }

      window.paypal.Buttons({
        createOrder: async () => {
          try {
            const order = await createPayPalOrder(amount, currency, productId);
            return order.id;
          } catch (err) {
            console.error('Error creating PayPal order:', err);
            setError('Failed to create payment order');
            onError?.(err);
            throw err;
          }
        },
        onApprove: async (data: any) => {
          try {
            const details = await capturePayPalOrder(data.orderID);
            onSuccess?.(details);
          } catch (err) {
            console.error('Error capturing PayPal order:', err);
            setError('Failed to complete payment');
            onError?.(err);
          }
        },
        onCancel: () => {
          onCancel?.();
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          setError('Payment failed');
          onError?.(err);
        },
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal'
        }
      }).render(paypalRef.current);

      setIsLoading(false);
    };

    renderPayPalButton();
  }, [isScriptLoaded, amount, currency, productId, onSuccess, onError, onCancel, retryCount, error]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setIsScriptLoaded(false);
    setRetryCount(prev => prev + 1);
    
    // Clear the PayPal container
    if (paypalRef.current) {
      paypalRef.current.innerHTML = '';
    }
  };

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-md ${className}`}>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={handleRetry}
          className="mt-2 text-red-600 underline text-sm hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-md">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading PayPal...</span>
        </div>
      )}
      <div
        ref={paypalRef}
        className={disabled ? 'pointer-events-none opacity-50' : ''}
        style={{ minHeight: isLoading ? '0' : '150px' }}
      />
    </div>
  );
}