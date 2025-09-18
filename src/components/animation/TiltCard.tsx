'use client'

import Image from "next/image"
import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button } from '@/components/common/Button';

export default function TiltCard({ imageSrc = "/assets/images/drachenlampe.png" }) {
  const ref = useRef(null);

  // motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(0, { stiffness: 400, damping: 18 });
  const rotateY = useSpring(0, { stiffness: 400, damping: 18 });

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const xRot = (0.5 - py) * 20;
    const yRot = (px - 0.5) * 20;
    rotateX.set(xRot);
    rotateY.set(yRot);
    x.set(px * 100);
    y.set(py * 100);
  };

  const glareX = useTransform(x, (v) => `${v}%`);
  const glareY = useTransform(y, (v) => `${v}%`);

  return (
    <div className="flex flex-col [perspective:1000px]">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group w-[300px] h-[400px] flex justify-center items-center rounded-xl bg-gray-200/50 overflow-hidden dark:bg-gray-700/50"
      >
        <div className="flex flex-col items-center text-center p-6">
          <div className="w-32 h-32 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <div className="text-white text-4xl font-bold">IPFS</div>
          </div>
          
          <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
            Start Storing Today
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Get 10GB free storage on our IPFS network
          </p>

          <Button className="font-bold bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white px-6 py-2">
            Get Started
          </Button>
        </div>
        <motion.div
          aria-hidden
          style={{ left: glareX, top: glareY }}
          className="pointer-events-none absolute inset-0 group-hover:bg-[radial-gradient(at_var(--x)_var(--y),rgba(255,255,255,0.25)_20%,transparent_80%)]"
        />
      </motion.div>
    </div>
  );
}