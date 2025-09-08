import React from "react";
import { Button } from "./ui/button";
import { Flower } from "lucide-react";
import DarkVeil from "./DarkVeil";
import BlurText from "./BlurText";
import { motion } from "motion/react";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8 relative">
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: -1 }}>
        <DarkVeil 
          hueShift={30}
          noiseIntensity={0.02}
          scanlineIntensity={0.1}
          speed={0.3}
          scanlineFrequency={2.0}
          warpAmount={0.1}
        />
      </div>
      <div className="flex flex-col items-center space-y-8 max-w-sm w-full bg-[rgba(224,185,185,0)]">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <Flower className="w-10 h-10 text-white" />
          </div>
          <BlurText
            text="Reflecta"
            delay={600}
            animateBy="letters"
            direction="top"
            className="text-white text-3xl kanit-bold tracking-tight"
          />
        </div>

        {/* Slogan */}
        <div className="text-center space-y-2">
          <BlurText
            text="Your calm evening with reflection"
            delay={1000}
            animateBy="words"
            direction="bottom"
            className="text-white/90 text-lg leading-relaxed dm-sans-regular"
          />
          <BlurText
            text="Share your thoughts and connect with your AI companion for gentle daily retrospectives"
            delay={1500}
            animateBy="words"
            direction="bottom"
            className="text-white/70 text-sm leading-relaxed dm-sans-regular"
          />
        </div>

        {/* Get Started Button */}
        <motion.div 
          className="w-full pt-8"
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 2, duration: 0.6, ease: "easeOut" }}
        >
          <Button
            onClick={onGetStarted}
            className="w-full h-14 bg-white text-gray-800 hover:bg-white/90 rounded-xl transition-all duration-200 shadow-lg"
          >
            Get Started
          </Button>
        </motion.div>
      </div>
    </div>
  );
}