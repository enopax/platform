"use client"

import { AnimatePresence, motion, usePresenceData, wrap } from "motion/react"
import { forwardRef, SVGProps, useState, ReactNode, Children } from "react"

export default function Slideshow({ children }: { children: ReactNode }) {
  const slides = Children.toArray(children)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)

  function setSlide(newDirection: 1 | -1) {
    const nextIndex = wrap(0, slides.length, selectedIndex + newDirection)
    setSelectedIndex(nextIndex)
    setDirection(newDirection)
  }

  const color = `var(--hue-${selectedIndex + 1})`

  return (
    <div className="relative space-y-8">
      <AnimatePresence custom={direction} initial={false} mode="popLayout">
        <Slide key={selectedIndex} color={color}>
          {slides[selectedIndex]}
        </Slide>
      </AnimatePresence>

      <div className="relative flex items-center justify-between gap-2">
        <motion.button
          initial={false}
          animate={{ backgroundColor: color }}
          aria-label="Previous"
          onClick={() => setSlide(-1)}
          whileFocus={{ outline: `2px solid ${color}` }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full flex items-center justify-center z-10 focus:outline-offset-2"
        >
          <ArrowLeft />
        </motion.button>

        <motion.button
          initial={false}
          animate={{ backgroundColor: color }}
          aria-label="Next"
          onClick={() => setSlide(1)}
          whileFocus={{ outline: `2px solid ${color}` }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full flex items-center justify-center z-10 focus:outline-offset-2"
        >
          <ArrowRight />
        </motion.button>
      </div>
    </div>
  )
}


const Slide = forwardRef(
  function Slide({
    color,
    children,
  }: { color: string; children: ReactNode },
  ref: React.Ref<HTMLDivElement>
) {
  const direction = usePresenceData()

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: direction * 50 }}
      animate={{
        opacity: 1,
        x: 0,
        transition: {
            delay: 0.2,
            type: "spring",
            visualDuration: 0.3,
            bounce: 0.4,
        },
      }}
      exit={{ opacity: 0, x: direction * -50 }}
    >
      {children}
    </motion.div>
  );
})



/**
 * ==============   Icons   ================
 */
const iconsProps: SVGProps<SVGSVGElement> = {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
}

function ArrowLeft() {
  return (
    <svg {...iconsProps}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg {...iconsProps}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
