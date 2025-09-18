"use client"

import { motion, useScroll, useMotionValueEvent } from "motion/react";

export default function ScrollLinked({
  children,
  bookId,
  pageNumber,
}: {
  children: React.ReactNode,
}) {
  const { scrollYProgress } = useScroll()
  console.log(scrollYProgress.current);

  useMotionValueEvent(scrollYProgress, "change", async (latest) => {
    if (latest === 1) {
      await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookId: bookId,
          pageNumber: pageNumber,
          value: scrollYProgress.current,
        }),
      });
    }
  });

  return (
    <>
      <motion.div
        id="scroll-indicator"
        className="bg-brand-500"
        style={{
          scaleX: scrollYProgress,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          originX: 0,
          zIndex: 999,
        }}
      />
      {children}
    </>
  );
}