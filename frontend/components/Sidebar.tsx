"use client";

import {
  Bell,
  BrainCircuit,
  Cpu,
  Gauge,
  Home,
  LayoutGrid,
  type LucideIcon,
  Map as MapIcon,
  Router,
  Settings,
  Shield,
  ShieldAlert,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { LiveDot } from "./primitives";

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}
interface NavSection {
  titleKey: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    titleKey: "nav.sectionMain",
    items: [
      { href: "/executive", labelKey: "nav.executive", icon: Gauge },
      { href: "/dashboard", labelKey: "nav.overview", icon: Home },
      { href: "/twin", labelKey: "nav.twin", icon: LayoutGrid },
      { href: "/map", labelKey: "nav.map", icon: MapIcon },
      { href: "/devices", labelKey: "nav.devices", icon: Router },
      { href: "/automation", labelKey: "nav.automation", icon: Cpu },
    ],
  },
  {
    titleKey: "nav.sectionIntel",
    items: [
      { href: "/ai", labelKey: "nav.ai", icon: BrainCircuit },
      { href: "/maintenance", labelKey: "nav.maintenance", icon: Wrench },
      { href: "/energy", labelKey: "nav.energy", icon: Zap },
      { href: "/analytics", labelKey: "nav.analytics", icon: TrendingUp },
    ],
  },
  {
    titleKey: "nav.sectionSystem",
    items: [
      { href: "/soc", labelKey: "nav.soc", icon: ShieldAlert },
      { href: "/security", labelKey: "nav.security", icon: Shield },
      { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
      { href: "/settings", labelKey: "nav.settings", icon: Settings },
    ],
  },
];

export function Sidebar({
  onNavigate,
  connected = true,
}: {
  onNavigate?: () => void;
  connected?: boolean;
}) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="flex h-full w-64 flex-col border-e border-gray-200 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-surface-100/60">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-iris-600 text-white shadow-neon">
          <Home className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight">Smart Home AI</div>
          <div className="text-[10px] uppercase tracking-widest text-brand-500">OS · v2.0</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {sections.map((section) => (
          <div key={section.titleKey}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {t(section.titleKey)}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-gradient-to-r from-brand-500/15 to-iris-500/10 text-brand-600 dark:text-brand-300"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                    )}
                  >
                    {active && (
                      <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-gradient-to-b from-brand-400 to-iris-500" />
                    )}
                    <item.icon className={cn("h-[18px] w-[18px] transition", active && "text-brand-500")} />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4 dark:border-white/10">
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-xs dark:bg-white/5">
          <span className="text-gray-500 dark:text-gray-400">{t(connected ? "common.connected" : "common.offline")}</span>
          <LiveDot active={connected} />
        </div>
        <p className="mt-2 px-1 text-[10px] text-gray-400">by Abdulaziz AlAmawi</p>
      </div>
    </aside>
  );
}
