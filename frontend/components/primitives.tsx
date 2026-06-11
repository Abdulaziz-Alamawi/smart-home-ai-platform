"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

/* Animated count-up number */
export function AnimatedNumber({
  value,
  decimals = 0,
  className,
  suffix = "",
  prefix = "",
}: {
  value: number;
  decimals?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (latest) =>
    `${prefix}${latest.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`
  );

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1, ease: "easeOut" });
    return controls.stop;
  }, [mv, value]);

  return <motion.span className={className}>{rounded}</motion.span>;
}

/* Pulsing live indicator */
export function LiveDot({
  active = true,
  className,
  label,
}: {
  active?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative inline-flex h-2.5 w-2.5">
        {active && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            active ? "bg-emerald-500" : "bg-gray-400"
          )}
        />
      </span>
      {label && <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>}
    </span>
  );
}

/* Circular progress ring (health, battery, score) */
export function Ring({
  value,
  size = 64,
  stroke = 6,
  color = "#06b6d4",
  trackClassName = "text-gray-200 dark:text-white/10",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackClassName?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circ - (clamped / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={trackClassName}
          stroke="currentColor"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/* Tiny inline sparkline */
export function Sparkline({
  data,
  width = 96,
  height = 32,
  color = "#06b6d4",
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1 || 1);
  const points = data
    .map((d, i) => `${i * step},${height - ((d - min) / range) * height}`)
    .join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const gradId = `spark-${color.replace("#", "")}`;
  return (
    <svg width={width} height={height} className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Horizontal signal/level bars */
export function LevelBars({ value, bars = 4, className }: { value: number; bars?: number; className?: string }) {
  const filled = Math.round((value / 100) * bars);
  return (
    <div className={cn("flex items-end gap-0.5", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-sm",
            i < filled ? "bg-brand-500" : "bg-gray-300 dark:bg-white/15"
          )}
          style={{ height: `${6 + i * 3}px` }}
        />
      ))}
    </div>
  );
}

/* Staggered fade-in section wrapper */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

/* Skeleton block */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 w-full", className)} />;
}
