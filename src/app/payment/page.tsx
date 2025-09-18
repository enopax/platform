import type { Metadata } from "next";

import Container from '@/components/common/Container';
import CheckoutForm from "@/components/form/CheckoutForm";

import { Button } from '@/components/common/Button';
import { Tooltip } from '@/components/common/Tooltip';
import { Dialog, DialogTrigger } from '@/components/common/Dialog';
import PaymentDialog from '@/components/dialog/Payment';

export const metadata: Metadata = {
  title: "Donate with embedded Checkout | Next.js + TypeScript Example",
};

export default function Page() {
  return (
    <main>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="light"
          >
            Hi
          </Button>
        </DialogTrigger>
        <PaymentDialog />
      </Dialog>
    </main>
  );
}