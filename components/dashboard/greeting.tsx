"use client";

import { motion } from "framer-motion";

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Large friendly dashboard greeting (Image 1 style). */
export function Greeting({
  name,
  subtitle,
}: {
  name: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <h1 className="text-3xl font-extrabold sm:text-4xl">
        {timeGreeting()}, {name}! 👋
      </h1>
      {subtitle && (
        <p className="mt-1 text-muted-foreground">{subtitle}</p>
      )}
    </motion.div>
  );
}
