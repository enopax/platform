'use client'

import Image from 'next/image';
import { Button } from '@/components/common/Button';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/Dialog";

export default function RewardDialog({
  rewardList,
}: {
  rewardList: { name: string; badge: string }[];
}) {
  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Verfügbare Belohnungen</DialogTitle>
        <DialogDescription className="mt-1 text-sm leading-6">
          Die folgenden Belohnungen kannst du freischalten, sobald du höhere Level erreichst:
        </DialogDescription>
      </DialogHeader>

      {rewardList?.length > 0 && (
        <div className="mt-4 space-y-2">
          <ul className="space-y-1">
            {rewardList.map((reward, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between rounded-md bg-gray-100 px-3 py-2 text-sm"
              >
                <span>{reward.name}</span>
                <span className="inline-block">
                  <Image
                    src={reward.badge}
                    alt={reward.name}
                    width={80}
                    height={80}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <DialogFooter className="mt-6">
        <DialogClose asChild>
          <Button className="w-full sm:w-fit">Schließen</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
