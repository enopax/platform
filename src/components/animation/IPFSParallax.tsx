'use client'

import {
  motion,
  MotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react"
import { useRef } from "react"
import { RiDatabase2Line, RiNodeTree, RiGlobalLine, RiShieldCheckLine, RiSpeedUpLine, RiTeamLine, RiDashboardLine } from "@remixicon/react"

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

  const resourceFeatures = [
    {
      icon: RiGlobalLine,
      title: "Multi-Provider Support",
      description: "Seamlessly deploy resources across multiple infrastructure providers from a single unified platform.",
      stats: ["Multiple providers", "Unified interface", "Flexible switching"]
    },
    {
      icon: RiSpeedUpLine,
      title: "One-Click Deployment",
      description: "Deploy infrastructure resources instantly with pre-configured templates and automated provisioning.",
      stats: ["Instant provisioning", "Template library", "Auto-configuration"]
    },
    {
      icon: RiTeamLine,
      title: "Organisation Management",
      description: "Manage teams and control access with role-based permissions at the organisation level.",
      stats: ["Team collaboration", "Role-based access", "Permission control"]
    },
    {
      icon: RiDashboardLine,
      title: "Real-time Monitoring",
      description: "Track deployment progress and resource status with live updates and comprehensive dashboards.",
      stats: ["Live progress", "Status tracking", "Performance metrics"]
    },
    {
      icon: RiNodeTree,
      title: "Scalable Infrastructure",
      description: "Effortlessly grow your resources on demand with automatic scaling and flexible capacity management.",
      stats: ["Auto-scaling", "On-demand growth", "Capacity planning"]
    },
    {
      icon: RiShieldCheckLine,
      title: "Enterprise Security",
      description: "Protect your resources with enterprise-grade security, access controls, and compliance standards.",
      stats: ["Encryption", "Access controls", "Audit logs"]
    }
  ]
  
  return (
    <div className="relative w-full">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 to-purple-600 transform-origin-left z-50"
        style={{ scaleX }}
      />
      
      <div className="overflow-y-auto snap-y snap-mandatory">
        {resourceFeatures.map((feature, index) => (
          <IPFSFeature key={index} feature={feature} index={index} />
        ))}
      </div>
    </div>
  )
}