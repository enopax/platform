import React from "react"

import { cx } from "@/lib/utils"

type DividerProps = React.ComponentPropsWithoutRef<"div">

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, children, ...props }, forwardedRef) => (
    <div
      ref={forwardedRef}
      className={cx(
        // base
        "mx-auto my-6 flex w-full items-center justify-between gap-3 text-sm",
        // text color
        "text-neutral-800 dark:text-neutral-200",
        className,
      )}
      tremor-id="tremor-raw"
      {...props}
    >
      {children ? (
        <>
          <div
            className={cx(
              // base
              "h-[1px] w-full",
              // background color
              "bg-neutral-300 dark:bg-neutral-700",
            )}
          />
          <div className="whitespace-nowrap text-inherit">
            {children}
          </div>
          <div
            className={cx(
              // base
              "h-[1px] w-full",
              // background color
              "bg-neutral-300 dark:bg-neutral-700",
            )}
          />
        </>
      ) : (
        <div
          className={cx(
            // base
            "h-[1px] w-full",
            // background color
            "bg-neutral-300 dark:bg-neutral-700",
          )}
        />
      )}
    </div>
  ),
)

Divider.displayName = "Divider"

export { Divider }