import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { SecurityDashboard } from "@/components/opexnal/security-dashboard";

export const Route = createFileRoute("/_authenticated/admin/security")({
  head: () => ({
    meta: [
      { title: "10,000 Security Controls Architecture — Opexnal" },
      {
        name: "description",
        content: "Master registry of 10,000 security controls across 100 categories with automated audit verifications.",
      },
    ],
  }),
  component: AdminSecurityPage,
});

function AdminSecurityPage() {
  return (
    <AppShell
      header={
        <ScreenHeader
          title="Security Architecture & Audit"
          left={
            <Link
              to="/admin"
              aria-label="Back to Admin"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          }
        />
      }
    >
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        <SecurityDashboard />
      </div>
    </AppShell>
  );
}
