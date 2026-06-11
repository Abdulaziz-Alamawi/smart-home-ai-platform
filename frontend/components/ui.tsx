"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-brand-600", className)} />;
}

export function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "brand" | "green" | "amber" | "red" | "violet";
}) {
  const accents: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  };
  return (
    <div className="card animate-fade-in p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        <div className={cn("rounded-lg p-2.5", accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function Badge({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: "gray" | "green" | "red" | "amber" | "brand" | "violet";
}) {
  const colors: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    brand: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  };
  return <span className={cn("badge", colors[color])}>{children}</span>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 p-12 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
