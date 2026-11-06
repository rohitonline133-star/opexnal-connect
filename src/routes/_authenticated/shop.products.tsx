import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Package } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/shop/products")({
  head: () => ({
    meta: [
      { title: "Products Catalog — Opexnal Shop" },
      {
        name: "description",
        content: "Creator product catalog availability on Opexnal.",
      },
    ],
  }),
  component: ShopProductsPage,
});

function ShopProductsPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="explore">
      <div className="min-h-screen bg-black pb-20 text-white">
        <div className="mx-auto max-w-xl">
          <ScreenHeader
            title="Products Catalog"
            showBack
            onBack={() => navigate({ to: "/shop" })}
          />
          <div className="space-y-4 p-4">
            <section className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div className="space-y-1">
                <h2 className="text-sm font-semibold">No live product catalog is available</h2>
                <p className="text-xs leading-5 text-gray-300">
                  Product listings, seller identities, prices, stock, and checkout are
                  not backed by a connected marketplace service. This page will not
                  display invented catalog entries.
                </p>
              </div>
            </section>
            <div className="rounded-xl border border-[#262626] bg-[#121212] p-4 text-xs leading-5 text-gray-400">
              <Package className="mb-2 h-5 w-5" />
              Products will appear here only after they are retrieved from the verified
              Opexnal marketplace backend.
            </div>
            <Link
              to="/shop"
              className="inline-flex rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
