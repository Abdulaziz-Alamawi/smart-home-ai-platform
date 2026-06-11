"use client";

import { useEffect, useState } from "react";

import { Badge, PageHeader, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) setFullName(user.fullName);
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.patch("/users/profile", { fullName });
      await refreshUser();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Profile" subtitle="Manage your account information" />

      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-2xl font-semibold text-white">
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user?.fullName}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="mt-1">
              <Badge color="brand">{user?.role}</Badge>
            </div>
          </div>
        </div>

        <form onSubmit={save} className="mt-6 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={user?.email ?? ""} disabled />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Spinner className="text-white" /> : "Save changes"}
            </button>
            {saved && <span className="text-sm text-emerald-600">Saved!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
