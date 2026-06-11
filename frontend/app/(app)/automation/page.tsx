"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bolt,
  Clock,
  Cpu,
  Play,
  Plus,
  Power,
  Radar,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { FadeIn } from "@/components/primitives";
import { EmptyState, PageLoader } from "@/components/ui";
import { api } from "@/lib/api";
import { deviceMeta } from "@/lib/home";
import { useI18n } from "@/lib/i18n";
import type { ApiData, AutomationRule, Device } from "@/lib/types";

const TRIGGERS = [
  { id: "SENSOR", icon: Radar, ar: "حركة مكتشفة", en: "Motion detected" },
  { id: "SCHEDULE", icon: Clock, ar: "وقت محدّد", en: "At a time" },
  { id: "ENERGY_THRESHOLD", icon: Zap, ar: "تجاوز استهلاك الطاقة", en: "Energy exceeds" },
  { id: "DEVICE_STATE", icon: Cpu, ar: "تغيّر حالة جهاز", en: "Device changes" },
  { id: "AI_RECOMMENDATION", icon: Bolt, ar: "توصية ذكاء اصطناعي", en: "AI recommends" },
];

function triggerMeta(id: string) {
  return TRIGGERS.find((tr) => tr.id === id) ?? TRIGGERS[0];
}

export default function AutomationEngine() {
  const { t, lang } = useI18n();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ name: "", trigger: "SENSOR", deviceId: "", isOn: true });

  const load = async () => {
    try {
      const [r, d] = await Promise.all([
        api.get<ApiData<AutomationRule[]>>("/automation-rules"),
        api.get<{ items: Device[] }>("/devices?pageSize=100"),
      ]);
      setRules(r.data);
      setDevices(d.items);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowForm(false);
    try {
      await api.post("/automation-rules", {
        name: form.name,
        trigger: form.trigger,
        conditions: { source: "builder" },
        actions: form.deviceId ? [{ deviceId: form.deviceId, isOn: form.isOn }] : [{ type: "noop" }],
      });
    } finally {
      setForm({ name: "", trigger: "SENSOR", deviceId: "", isOn: true });
      void load();
    }
  };

  const toggleEnabled = async (rule: AutomationRule) => {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, isEnabled: !r.isEnabled } : r)));
    await api.patch(`/automation-rules/${rule.id}`, { isEnabled: !rule.isEnabled }).catch(() => {});
  };
  const run = async (id: string) => {
    await api.post(`/automation-rules/${id}/run`).catch(() => {});
    setToast(lang === "ar" ? "تم تنفيذ القاعدة بنجاح ✓" : "Rule executed ✓");
    setTimeout(() => setToast(""), 2500);
    void load();
  };
  const remove = async (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    await api.del(`/automation-rules/${id}`).catch(() => {});
  };

  const actionDeviceName = (rule: AutomationRule): string => {
    const a = rule.actions?.[0] as { deviceId?: string; isOn?: boolean } | undefined;
    const dev = devices.find((d) => d.id === a?.deviceId);
    return dev?.name ?? (lang === "ar" ? "إجراء" : "Action");
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <FadeIn className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Cpu className="h-6 w-6 text-iris-500" /> {t("automation.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t("automation.subtitle")}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> {t("automation.newRule")}
        </button>
      </FadeIn>

      {/* Visual builder */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={create}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 overflow-hidden"
          >
            <div className="glass p-6">
              <input
                className="input mb-5 text-base font-semibold"
                placeholder={lang === "ar" ? "اسم القاعدة (مثال: إضاءة المعيشة عند الحركة)" : "Rule name"}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
                {/* IF */}
                <div className="flex-1 rounded-2xl border-2 border-dashed border-brand-500/40 bg-brand-500/5 p-4">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-bold text-white">
                    {t("automation.if")}
                  </div>
                  <p className="mb-2 text-xs text-gray-500">{t("automation.when")}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {TRIGGERS.map((tr) => (
                      <button
                        type="button"
                        key={tr.id}
                        onClick={() => setForm({ ...form, trigger: tr.id })}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center text-xs transition ${
                          form.trigger === tr.id
                            ? "border-brand-500 bg-brand-500/10 text-brand-600"
                            : "border-gray-200 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
                        }`}
                      >
                        <tr.icon className="h-4 w-4" />
                        {lang === "ar" ? tr.ar : tr.en}
                      </button>
                    ))}
                  </div>
                </div>

                <ArrowRight className="mx-auto hidden h-6 w-6 shrink-0 text-gray-400 lg:block rtl:rotate-180" />

                {/* THEN */}
                <div className="flex-1 rounded-2xl border-2 border-dashed border-iris-500/40 bg-iris-500/5 p-4">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-iris-500 px-2.5 py-1 text-xs font-bold text-white">
                    {t("automation.then")}
                  </div>
                  <p className="mb-2 text-xs text-gray-500">{t("automation.do")}</p>
                  <select className="input mb-2" value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })}>
                    <option value="">{lang === "ar" ? "اختر جهازًا" : "Select device"}</option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm({ ...form, isOn: true })} className={`flex-1 rounded-lg py-2 text-sm font-medium ${form.isOn ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-white/5"}`}>
                      {lang === "ar" ? "تشغيل" : "Turn on"}
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, isOn: false })} className={`flex-1 rounded-lg py-2 text-sm font-medium ${!form.isOn ? "bg-gray-700 text-white" : "bg-gray-100 dark:bg-white/5"}`}>
                      {lang === "ar" ? "إيقاف" : "Turn off"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <button type="submit" className="btn-primary">{t("automation.save")}</button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>{t("automation.cancel")}</button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Rules list */}
      {rules.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={lang === "ar" ? "لا توجد قواعد أتمتة" : "No automation rules"}
            description={t("automation.subtitle")}
            action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> {t("automation.newRule")}</button>}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {rules.map((rule, i) => {
            const tm = triggerMeta(rule.trigger);
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="glass p-5"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{rule.name}</h3>
                  <button
                    onClick={() => toggleEnabled(rule)}
                    className={`relative h-6 w-11 rounded-full transition ${rule.isEnabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-white/15"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${rule.isEnabled ? "start-[22px]" : "start-0.5"}`} />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500/10 px-2.5 py-1.5 text-brand-600">
                    <tm.icon className="h-3.5 w-3.5" /> {lang === "ar" ? tm.ar : tm.en}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 rtl:rotate-180" />
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-iris-500/10 px-2.5 py-1.5 text-iris-600">
                    <Power className="h-3.5 w-3.5" /> {actionDeviceName(rule)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/5">
                  <span className="text-xs text-gray-400">
                    {rule.lastRunAt ? `${lang === "ar" ? "آخر تنفيذ" : "Last run"}: ${new Date(rule.lastRunAt).toLocaleString()}` : (lang === "ar" ? "لم تُنفّذ بعد" : "Never run")}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => run(rule.id)} className="btn-ghost p-2 text-brand-500" aria-label="run"><Play className="h-4 w-4" /></button>
                    <button onClick={() => remove(rule.id)} className="btn-ghost p-2 text-red-500" aria-label="delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-6 z-40 mx-auto w-fit rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-elevated"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
