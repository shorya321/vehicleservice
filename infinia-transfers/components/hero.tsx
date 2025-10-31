"use client"
import { useState } from "react"
import type React from "react"

import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { CalendarDays, Users, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// Component for subtle animated background elements
const MotionElement = ({
  className,
  initial,
  animate,
  transition,
  size = "w-64 h-64",
}: {
  className?: string
  initial?: object
  animate?: object
  transition?: object
  size?: string
}) => (
  <motion.div
    className={`absolute rounded-full ${size} ${className}`}
    initial={{ opacity: 0, scale: 0.5, ...initial }}
    animate={{ opacity: [0.1, 0.2, 0.15, 0.1], scale: 1, ...animate }}
    transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear", ...transition }}
  />
)

export function Hero() {
  const [isReturnTrip, setIsReturnTrip] = useState(false)

  return (
    <div
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-mercedes-luxury-hotel.jpg"
          alt="Luxury Mercedes S-Class parked in front of upscale hotel"
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent"></div>
      </div>

      <div className="absolute inset-0 z-0 overflow-hidden">
        <MotionElement
          className="bg-amber-500/5"
          size="w-[600px] h-[600px] md:w-[900px] md:h-[900px]"
          initial={{ x: "-20%", y: "-40%" }}
          animate={{ x: ["-20%", "-15%", "-20%"], y: ["-40%", "-45%", "-40%"], opacity: [0.02, 0.06, 0.02] }}
          transition={{ duration: 28, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <MotionElement
          className="bg-orange-500/5"
          size="w-[500px] h-[500px] md:w-[800px] md:h-[800px]"
          initial={{ x: "60%", y: "70%" }}
          animate={{ x: ["60%", "65%", "60%"], y: ["70%", "65%", "70%"], opacity: [0.03, 0.07, 0.03] }}
          transition={{ duration: 32, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 6 }}
        />
      </div>

      <div className="relative z-10 luxury-container flex flex-col justify-center items-center text-center flex-grow pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-4xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl mb-4 leading-tight font-serif" style={{ color: "#F5F5F5" }}>
            Premier Transfers from Airport or City in UAE
          </h1>
          <p className="text-base md:text-lg mb-12" style={{ color: "#C6AA88" }}>
            1,300,000+ Completed Rides • 100+ Countries Served
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="w-full max-w-6xl p-3 rounded-xl shadow-2xl backdrop-blur-lg border"
          style={{ backgroundColor: "rgba(24, 24, 24, 0.5)", borderColor: "rgba(198, 170, 136, 0.2)" }}
        >
          <div className="flex flex-col md:flex-row items-center gap-2">
            {/* From Input */}
            <div className="relative w-full flex-grow">
              <MapPin
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                style={{ color: "#C6AA88" }}
              />
              <Input
                type="text"
                placeholder="From (airport, port, address)"
                className="w-full h-14 bg-transparent border-0 focus:ring-1 pl-12 text-base"
                style={{ color: "#F5F5F5", "--tw-ring-color": "#C6AA88" } as React.CSSProperties}
              />
              <style jsx>{`
                input::placeholder {
                  color: rgba(198, 170, 136, 0.7);
                }
              `}</style>
            </div>

            <div
              className="hidden md:block border-l h-8 mx-1"
              style={{ borderColor: "rgba(198, 170, 136, 0.2)" }}
            ></div>
            <div
              className="w-full md:w-auto h-px md:h-auto my-1 md:my-0"
              style={{ backgroundColor: "rgba(198, 170, 136, 0.2)" }}
            ></div>

            {/* To Input */}
            <div className="relative w-full flex-grow">
              <MapPin
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                style={{ color: "#C6AA88" }}
              />
              <Input
                type="text"
                placeholder="To (airport, port, address)"
                className="w-full h-14 bg-transparent border-0 focus:ring-1 pl-12 text-base"
                style={{ color: "#F5F5F5", "--tw-ring-color": "#C6AA88" } as React.CSSProperties}
              />
              <style jsx>{`
                input::placeholder {
                  color: rgba(198, 170, 136, 0.7);
                }
              `}</style>
            </div>

            <div
              className="hidden md:block border-l h-8 mx-1"
              style={{ borderColor: "rgba(198, 170, 136, 0.2)" }}
            ></div>
            <div
              className="w-full md:w-auto h-px md:h-auto my-1 md:my-0"
              style={{ backgroundColor: "rgba(198, 170, 136, 0.2)" }}
            ></div>

            {/* Date Input */}
            <div className="relative w-full md:w-auto">
              <CalendarDays
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                style={{ color: "#C6AA88" }}
              />
              <Input
                type="text"
                placeholder="Date"
                className="w-full md:w-40 h-14 bg-transparent border-0 focus:ring-1 pl-12 text-base"
                style={{ color: "#F5F5F5", "--tw-ring-color": "#C6AA88" } as React.CSSProperties}
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => (e.target.type = "text")}
              />
              <style jsx>{`
                input::placeholder {
                  color: rgba(198, 170, 136, 0.7);
                }
              `}</style>
            </div>

            {/* Return Checkbox */}
            <div className="flex items-center space-x-2 w-full md:w-auto justify-center md:justify-start px-2 h-14">
              <Checkbox
                id="return-trip"
                checked={isReturnTrip}
                onCheckedChange={(checked) => setIsReturnTrip(checked as boolean)}
                className="data-[state=checked]:text-black"
                style={
                  {
                    borderColor: "rgba(198, 170, 136, 0.5)",
                    "--tw-ring-color": "#C6AA88",
                  } as React.CSSProperties
                }
              />
              <Label htmlFor="return-trip" className="text-sm cursor-pointer" style={{ color: "#B0B0B0" }}>
                Return?
              </Label>
            </div>

            {/* Conditional Return Date Input */}
            {isReturnTrip && (
              <>
                <div
                  className="hidden md:block border-l h-8 mx-1"
                  style={{ borderColor: "rgba(198, 170, 136, 0.2)" }}
                ></div>
                <div
                  className="w-full md:w-auto h-px md:h-auto my-1 md:my-0"
                  style={{ backgroundColor: "rgba(198, 170, 136, 0.2)" }}
                ></div>
                <div className="relative w-full md:w-auto">
                  <CalendarDays
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                    style={{ color: "#C6AA88" }}
                  />
                  <Input
                    type="text"
                    placeholder="Return Date"
                    className="w-full md:w-40 h-14 bg-transparent border-0 focus:ring-1 pl-12 text-base"
                    style={{ color: "#F5F5F5", "--tw-ring-color": "#C6AA88" } as React.CSSProperties}
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => (e.target.type = "text")}
                  />
                  <style jsx>{`
                    input::placeholder {
                      color: rgba(198, 170, 136, 0.7);
                    }
                  `}</style>
                </div>
              </>
            )}

            <div
              className="hidden md:block border-l h-8 mx-1"
              style={{ borderColor: "rgba(198, 170, 136, 0.2)" }}
            ></div>
            <div
              className="w-full md:w-auto h-px md:h-auto my-1 md:my-0"
              style={{ backgroundColor: "rgba(198, 170, 136, 0.2)" }}
            ></div>

            {/* Passengers Input */}
            <div className="relative w-full md:w-auto">
              <Users
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                style={{ color: "#C6AA88" }}
              />
              <Input
                type="number"
                placeholder="Guests"
                min="1"
                className="w-full md:w-32 h-14 bg-transparent border-0 focus:ring-1 pl-12 text-base"
                style={{ color: "#F5F5F5", "--tw-ring-color": "#C6AA88" } as React.CSSProperties}
              />
              <style jsx>{`
                input::placeholder {
                  color: rgba(198, 170, 136, 0.7);
                }
              `}</style>
            </div>

            {/* Search Button */}
            <Button
              type="submit"
              size="default"
              className="w-full md:w-auto flex-shrink-0 h-14 mt-2 md:mt-0 ml-0 md:ml-1"
            >
              Search
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
