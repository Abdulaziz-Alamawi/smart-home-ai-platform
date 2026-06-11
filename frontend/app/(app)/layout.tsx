import { DashboardShell } from "@/components/DashboardShell";
import { RealtimeProvider } from "@/lib/realtime";

// Authenticated, real-time dashboard — rendered dynamically (no static prerender).
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      <DashboardShell>{children}</DashboardShell>
    </RealtimeProvider>
  );
}
