'use client';

interface PayPalCheckoutProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function PayPalCheckout({ amount, onSuccess, onError }: PayPalCheckoutProps) {
  return (
    <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
      <p className="text-gray-600 mb-2">PayPal Checkout Component</p>
      <p className="text-sm text-gray-500">Amount: £{amount}</p>
      <div className="mt-4 space-x-2">
        <button
          onClick={onSuccess}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Simulate Success
        </button>
        <button
          onClick={() => onError('Payment cancelled')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Simulate Error
        </button>
      </div>
    </div>
  );
}