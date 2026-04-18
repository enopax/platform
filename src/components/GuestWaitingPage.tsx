'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { RiTimeLine, RiCheckLine } from '@remixicon/react';
import { sendGuestMessage } from '@/actions/user';

export default function GuestWaitingPage({ email }: { email: string }) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setError('');
    startTransition(async () => {
      const result = await sendGuestMessage(message.trim());
      if (result.success) {
        setSent(true);
        setMessage('');
      } else {
        setError(result.error || 'Failed to send');
      }
    });
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-brand-100 dark:bg-brand-900/30 rounded-full mb-4">
            <RiTimeLine className="h-8 w-8 text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Thanks for registering!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-1">
            Your account is on the early access list. We&apos;ll notify you when your access is activated.
          </p>
          <p className="text-sm text-gray-500">
            Signed in as {email}
          </p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Send us a message
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Tell us about your use case or what you&apos;re looking for — we&apos;ll get back to you.
          </p>

          {sent ? (
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <RiCheckLine className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">Message sent. We&apos;ll be in touch!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="I'm interested in managed Kubernetes for..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
              {error && (
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isPending || !message.trim()}>
                {isPending ? 'Sending…' : 'Send message'}
              </Button>
            </form>
          )}
        </div>
      </Card>
    </main>
  );
}
