'use client'

import { cx } from "@/lib/utils"

export default function SelectItem({
  className,
  children,
}: {
  className?: string,
  children: React.ReactNode
}) {

  return (
    <button
      className={cx(
        // base
        "grid w-full text-left cursor-pointer grid-cols-[1fr_20px] gap-x-2 rounded px-3 py-2 outline-none transition-colors data-[state=checked]:font-semibold sm:text-sm",
        // text color
        "text-neutral-900 dark:text-neutral-50",
        // disabled
        "data-[disabled]:pointer-events-none data-[disabled]:text-neutral-400 data-[disabled]:hover:bg-none dark:data-[disabled]:text-neutral-600",
        // focus
        "focus-visible:bg-neutral-100 focus-visible:dark:bg-neutral-900",
        // hover
        "hover:bg-neutral-100 hover:dark:bg-neutral-900",
        className,
      )}
    >
      {children}
    </button>
  )
}
