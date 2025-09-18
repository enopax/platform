'use client'

import {
  motion,
  MotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react"
import { useRef } from "react"
import Image from "next/image"
import { Button } from '@/components/common/Button';

function useParallax(value: MotionValue<number>, distance: number) {
  return useTransform(value, [0, 1], [-distance, distance])
}

function Area({ id }: { id: number }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref })
  const y = useParallax(scrollYProgress, 300)
  
  return (
    <section className="h-screen flex justify-center items-center relative overflow-hidden">
      <div
        ref={ref}
        className="w-[300px] h-[400px] flex justify-center items-center rounded-xl bg-gray-200/50 dark:bg-gray-800/50"
      >
        <div className="flex flex-col">
          <Image
            src={`/assets/images/drachenlampe.png`}
            alt="Some furni"
            width={200}
            height={200}
            className="p-8 object-contain rounded-xl"
          />

          <Button className="font-bold">
            Buy Now!
          </Button>
        </div>
      </div>

      <motion.h2
        initial={{ visibility: "hidden" }}
        animate={{ visibility: "visible" }}
        style={{ y }}
        className="absolute text-brand-300 font-mono font-extrabold text-4xl leading-[1.2] tracking-tight top-1/2 left-1/2 -translate-x-[calc(50%-120px)] -translate-y-1/2 md:text-5xl dark:text-brand-800"
      >
        {`Goldene Drachenlampe`}
      </motion.h2>
    </section>
  )
}

export default function Parallax() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })
  
  return (
    <div className="relative w-full">
      <div className="overflow-y-auto snap-y snap-mandatory">
        {[1, 2, 3, 4, 5].map((image) => (
          <Area key={image} id={image} />
        ))}
      </div>
    </div>
  )
}