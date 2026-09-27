import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Package, ShoppingBag, ArrowLeft } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/shop/orders")({
  head: () => ({
    meta: [
      { title: "Orders & Purchases — Opexnal Shop" },
      { name: "description", content: "Track orders and digital downloads on Opexnal." },
    ],
  }),
  component: ShopOrdersPage,
});

function ShopOrdersPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="explore">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Orders & Receipts" showBack onBack={() => navigate({ to: "/shop" })} />

        <div className="p-4 text-center py-20 space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#1e1e1e] flex items-center justify-center mx-auto text-gray-500">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Orders Yet</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              When you purchase merchandise or digital tools from verified creators, your receipts
              and tracking will appear here.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
