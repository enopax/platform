'use client'

import { Button } from '@/components/common/Button';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';
import CheckoutForm from "@/components/form/CheckoutForm";
import PayPalCheckout from "@/components/PayPalCheckout";

export default function PaymentDialog({
  text,
  callback,
}: {
  text: string,
  callback: () => void,
}) {
  return (
    <DialogContent className="max-h-[90vh]">
      <DialogHeader>
        <DialogTitle className="mx-5">Payment</DialogTitle>
        <DialogClose asChild>
          <Button variant="light" className="m-5 sm:w-fit">
            Back
          </Button>
        </DialogClose>
      </DialogHeader>

      <PayPalCheckout
        amount="1.00"
        onSuccess={(details) => console.log('Success:', details)}
        onError={(error) => console.log('Error:', error)}
      />
    </DialogContent>
  );
}
