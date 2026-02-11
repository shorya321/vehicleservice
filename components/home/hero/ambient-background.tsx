"use client"
import { motion } from 'motion/react'

interface MotionElementProps {
  className?: string
  size?: string
  initialX: string
  initialY: string
  animateX: string[]
  animateY: string[]
  opacity: number[]
  duration: number
  delay?: number
}

function MotionElement({
  className,
  size,
  initialX,
  initialY,
  animateX,
  animateY,
  opacity,
  duration,
  delay = 0
}: MotionElementProps) {
  return (
    <motion.div
      className={`absolute rounded-full ${size} ${className}`}
      initial={{ opacity: 0, scale: 0.5, x: initialX, y: initialY }}
      animate={{
        x: animateX,
        y: animateY,
        opacity,
        scale: 1
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
    />
  )
}

export function AmbientBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <MotionElement
        className="bg-amber-500/5"
        size="w-[600px] h-[600px] md:w-[900px] md:h-[900px]"
        initialX="-20%"
        initialY="-40%"
        animateX={["-20%", "-15%", "-20%"]}
        animateY={["-40%", "-45%", "-40%"]}
        opacity={[0.02, 0.06, 0.02]}
        duration={28}
      />
      <MotionElement
        className="bg-orange-500/5"
        size="w-[500px] h-[500px] md:w-[800px] md:h-[800px]"
        initialX="60%"
        initialY="70%"
        animateX={["60%", "65%", "60%"]}
        animateY={["70%", "65%", "70%"]}
        opacity={[0.03, 0.07, 0.03]}
        duration={32}
        delay={6}
      />
    </div>
  )
}
