export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "MANAGER" | "USER";
  avatarUrl: string | null;
  isActive?: boolean;
  settings?: UserSettings | null;
}

export interface UserSettings {
  id: string;
  theme: string;
  language: string;
  currency: string;
  energyTariff: number;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  status: "ONLINE" | "OFFLINE" | "ERROR";
  powerRatingKw: number;
  isOn: boolean;
  lastSeenAt: string | null;
  room?: { id: string; name: string } | null;
}

export interface Room {
  id: string;
  name: string;
  floor: number;
  _count?: { devices: number };
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  isEnabled: boolean;
  lastRunAt: string | null;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>[];
}

export interface Schedule {
  id: string;
  name: string;
  cron: string;
  isEnabled: boolean;
  device?: { id: string; name: string } | null;
}

export interface Notification {
  id: string;
  type: "INFO" | "WARNING" | "ALERT" | "RECOMMENDATION";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  title: string;
  message: string;
  estimatedSavings: number | null;
  isApplied: boolean;
  isDismissed: boolean;
}

export interface DashboardData {
  devices: { total: number; online: number; offline: number; error: number };
  energy: { monthlyKwh: number; monthlyCost: number };
  notifications: { unread: number };
  insights: { count: number; top: Recommendation[] };
}

export interface EnergyPoint {
  date: string;
  energyKwh: number;
  cost: number;
}

export interface ApiList<T> {
  success: boolean;
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  unread?: number;
}

export interface ApiData<T> {
  success: boolean;
  data: T;
}
