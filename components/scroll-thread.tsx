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
  // Function transform: interpolating between "0vh" and "calc(100vh - 8px)" as
  // two static strings is not something framer-motion can mix (different numeric
  // structures), so compute the offset numerically per frame instead.
  const dotY = useTransform(smoothProgress, (v) => `calc(${v * 100}vh - ${v * 8}px)`);

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
