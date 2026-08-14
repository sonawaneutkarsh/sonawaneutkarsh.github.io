"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useMode } from "@/components/mode-provider";

export function ScrollThread() {
  const { mode } = useMode();
  if (mode !== "experience") {
    return null;
  }
  return <ScrollTrack />;
}

function ScrollTrack() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const dotY = useTransform(smoothProgress, [0, 1], ["0vh", "calc(100vh - 8px)"]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 left-[max(2.5rem,calc(50vw-520px))] hidden w-px bg-line lg:block"
    >
      {reduceMotion ? null : (
        <motion.div
          className="absolute top-0 h-1.5 w-1.5 -translate-x-[2.5px] rounded-full bg-signal"
          style={{ translateY: dotY }}
        />
      )}
    </div>
  );
}
