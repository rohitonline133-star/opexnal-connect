import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ShoppingBag } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Opexnal" },
      {
        name: "description",
        content: "Creator marketplace status and availability on Opexnal.",
      },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="explore">
      <div className="min-h-screen bg-black pb-20 text-white">
        <div className="mx-auto max-w-xl">
          <ScreenHeader title="Shop" showBack onBack={() => navigate({ to: "/explore" })} />
          <div className="space-y-4 p-4">
            <section className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div className="space-y-1">
                <h2 className="text-sm font-semibold">Creator marketplace is not connected</h2>
                <p className="text-xs leading-5 text-gray-300">
                  Opexnal does not currently have a product catalog, seller inventory,
                  checkout provider, or order service. No sample products or prices are
                  shown as if they were real listings.
                </p>
              </div>
            </section>
            <div className="rounded-xl border border-[#262626] bg-[#121212] p-4">
              <ShoppingBag className="mb-2 h-5 w-5 text-gray-400" />
              <h3 className="text-sm font-semibold">Marketplace requirements</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-5 text-gray-400">
                <li>Verified seller profiles and product inventory</li>
                <li>Secure checkout, payment processing, refunds, and order tracking</li>
                <li>Buyer and seller support with auditable transaction records</li>
              </ul>
            </div>
            <Link
              to="/explore"
              className="inline-flex rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black"
            >
              Return to Explore
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
