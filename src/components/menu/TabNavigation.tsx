"use client"

import React from "react"
import Link from 'next/link';
import * as NavigationMenuPrimitives from "@radix-ui/react-navigation-menu"

import { cx, focusRing } from "@/lib/utils"

function getSubtree(
  options: { children: React.ReactNode },
  content: React.ReactNode | ((children: React.ReactNode) => React.ReactNode),
) {
  const { children } = options
  return typeof content === "function" ? content(children) : content

  const firstChild = React.Children.only(children) as React.ReactElement
  return React.cloneElement(firstChild)
}

const TabNavigation = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitives.Root>,
  Omit<
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitives.Root>,
    "orientation" | "defaultValue" | "dir"
  >
>(({ className, children, ...props }, forwardedRef) => (
  <NavigationMenuPrimitives.Root
    ref={forwardedRef}
    {...props}
    tremor-id="tremor-raw"
    asChild={false}
  >
    <NavigationMenuPrimitives.List
      className={cx(
        // base
        "flex items-center justify-start whitespace-nowrap border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        // border color
        "border-neutral-200 dark:border-neutral-200",
        className,
      )}
    >
      {children}
    </NavigationMenuPrimitives.List>
  </NavigationMenuPrimitives.Root>
))

TabNavigation.displayName = "TabNavigation"

const TabNavigationLink = React.forwardRef<
  React.ElementRef<typeof Link>,
  Omit<
    React.ComponentPropsWithoutRef<typeof Link>,
    "onSelect"
  > & { disabled?: boolean }
>(({ disabled, className, children, ...props }, forwardedRef) => (
  <NavigationMenuPrimitives.Item className="flex" aria-disabled={disabled}>
    <Link
      aria-disabled={disabled}
      className={cx(
        "group relative flex shrink-0 select-none items-center justify-center",
        disabled ? "pointer-events-none" : "",
      )}
      ref={forwardedRef}
      onSelect={() => {}}
      {...props}
    >
      {getSubtree({ children }, (children) => (
        <span
          className={cx(
            // base
            "-mb-px flex items-center justify-center whitespace-nowrap border-b border-transparent px-3 pb-2 text-sm font-medium transition-all",
            // text color
            "text-neutral-500 dark:text-neutral-500",
            // hover
            //"group-hover:text-neutral-700 group-hover:dark:text-neutral-400",
            // border hover
            //"group-hover:border-neutral-300 group-hover:dark:border-neutral-400",
            // selected
            "group-data-[active]:border-emerald-500 group-data-[active]:text-emerald-500",
            "group-data-[active]:dark:border-emerald-500 group-data-[active]:dark:text-emerald-500",
            // disabled
            disabled
              ? "pointer-events-none text-neutral-300 dark:text-neutral-700"
              : "",
            focusRing,
            className,
          )}
        >
          {children}
        </span>
      ))}
    </Link>
  </NavigationMenuPrimitives.Item>
))

TabNavigationLink.displayName = "TabNavigationLink"

export { TabNavigation, TabNavigationLink }