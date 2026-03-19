'use client';

import { useState } from 'react';
import { RiMailLine, RiCloseLine } from '@remixicon/react';

export default function EmailVerificationBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (dismissed) return null;

  async function handleResend() {
    setSending(true);
    try {
      const { resendVerificationEmail } = await import('@/actions/register');
      const result = await resendVerificationEmail();
      if (result.success) {
        setSent(true);
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
          <RiMailLine className="size-4 shrink-0" />
          {sent ? (
            <span>Verification email sent. Check your inbox.</span>
          ) : (
            <span>
              Please verify your email address.{' '}
              <button
                onClick={handleResend}
                disabled={sending}
                className="underline font-medium hover:no-underline"
              >
                {sending ? 'Sending...' : 'Resend verification email'}
              </button>
            </span>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
        >
          <RiCloseLine className="size-4" />
        </button>
      </div>
    </div>
  );
}
