'use client'

import {
  motion,
  MotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react"
import { useRef } from "react"
import { RiDatabase2Line, RiNodeTree, RiGlobalLine, RiShieldCheckLine, RiSpeedUpLine } from "@remixicon/react"

function useParallax(value: MotionValue<number>, distance: number) {
  return useTransform(value, [0, 1], [-distance, distance])
}

function IPFSFeature({ feature, index }: { feature: any, index: number }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref })
  const y = useParallax(scrollYProgress, 200)
  
  return (
    <section className="h-screen flex justify-center items-center relative overflow-hidden">
      <div
        ref={ref}
        className="w-[350px] h-[450px] flex flex-col justify-center items-center rounded-2xl bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 border-2 border-brand-200 dark:border-brand-800 shadow-xl"
      >
        <div className="flex flex-col items-center text-center p-8">
          <div className="p-4 bg-brand-600 rounded-full mb-6">
            <feature.icon className="w-12 h-12 text-white" />
          </div>
          
          <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
            {feature.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            {feature.description}
          </p>

          <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
            {feature.stats.map((stat: string, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                {stat}
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ y }}
        className="absolute text-brand-600 dark:text-brand-400 font-mono font-extrabold text-6xl md:text-8xl leading-[1.2] tracking-tight top-1/2 left-1/4 -translate-x-[calc(50%+400px)] -translate-y-1/2 pointer-events-none select-none"
      >
        {`0${index + 1}`}
      </motion.div>
    </section>
  )
}

export default function IPFSParallax() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  const ipfsFeatures = [
    {
      icon: RiDatabase2Line,
      title: "Immutable Storage",
      description: "Content-addressed storage ensures your files never change unexpectedly and remain permanently accessible.",
      stats: ["Content hashing", "Version control", "Data integrity"]
    },
    {
      icon: RiNodeTree,
      title: "Distributed Network",
      description: "Your content is replicated across multiple nodes worldwide, eliminating single points of failure.",
      stats: ["47+ active nodes", "Global replication", "Auto-failover"]
    },
    {
      icon: RiGlobalLine,
      title: "Edge Optimization",
      description: "Smart caching and edge distribution ensure lightning-fast access from anywhere in the world.",
      stats: ["CDN integration", "Smart routing", "99.9% uptime"]
    },
    {
      icon: RiShieldCheckLine,
      title: "Enterprise Security",
      description: "Military-grade encryption and access controls keep your data secure and compliant.",
      stats: ["AES-256 encryption", "Access controls", "Audit logs"]
    },
    {
      icon: RiSpeedUpLine,
      title: "Lightning Fast",
      description: "Optimized protocols and intelligent caching deliver sub-second response times globally.",
      stats: ["<100ms latency", "Bandwidth optimization", "Intelligent prefetch"]
    }
  ]
  
  return (
    <div className="relative w-full">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 to-purple-600 transform-origin-left z-50"
        style={{ scaleX }}
      />
      
      <div className="overflow-y-auto snap-y snap-mandatory">
        {ipfsFeatures.map((feature, index) => (
          <IPFSFeature key={index} feature={feature} index={index} />
        ))}
      </div>
    </div>
  )
}