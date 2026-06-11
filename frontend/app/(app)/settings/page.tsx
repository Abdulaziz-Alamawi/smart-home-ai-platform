"use client";

import { useEffect, useState } from "react";

import { PageHeader, PageLoader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { ApiData, UserSettings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<ApiData<UserSettings>>("/settings");
        setSettings(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.patch<ApiData<UserSettings>>("/settings", {
        currency: settings.currency,
        energyTariff: settings.energyTariff,
        timezone: settings.timezone,
        language: settings.language,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
      });
      setSettings(res.data);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!settings) return null;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Configure your preferences" />

      <form onSubmit={save} className="card space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Currency</label>
            <input
              className="input"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Energy tariff (per kWh)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={settings.energyTariff}
              onChange={(e) => setSettings({ ...settings, energyTariff: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Timezone</label>
            <input
              className="input"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Language</label>
            <select
              className="input"
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Email notifications</span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-brand-600"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Push notifications</span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-brand-600"
              checked={settings.pushNotifications}
              onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Spinner className="text-white" /> : "Save settings"}
          </button>
          {saved && <span className="text-sm text-emerald-600">Saved!</span>}
        </div>
      </form>
    </div>
  );
}
