"use client";

import { Languages } from "lucide-react";

import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, toggle } = useI18n();
  return (
    <button
      onClick={toggle}
      className="btn-ghost flex items-center gap-1.5 px-2 py-2 text-sm font-medium"
      aria-label="Switch language"
      title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Languages className="h-5 w-5" />
      <span>{lang === "ar" ? "EN" : "ع"}</span>
    </button>
  );
}
