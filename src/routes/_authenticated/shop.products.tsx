import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Package, Search, Filter } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/shop/products")({
  head: () => ({
    meta: [
      { title: "Products & Merchandise — Opexnal Shop" },
      { name: "description", content: "Explore products tagged by community creators on Opexnal." },
    ],
  }),
  component: ShopProductsPage,
});

function ShopProductsPage() {
  const navigate = useNavigate();

  const products = [
    {
      id: "p1",
      name: "Analog Soundboard Presets",
      category: "Digital Audio",
      price: "$15.00",
      creator: "soundwaves_pro",
    },
    {
      id: "p2",
      name: "Minimalist Linen Overshirt",
      category: "Apparel",
      price: "$65.00",
      creator: "urban_atelier",
    },
    {
      id: "p3",
      name: "Mechanical Keyboard Coiled Cable",
      category: "Hardware",
      price: "$24.00",
      creator: "keeb_crafters",
    },
  ];

  return (
    <AppShell activeTab="explore">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Products Catalog" showBack onBack={() => navigate({ to: "/shop" })} />

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            {products.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                  <p className="text-xs text-gray-400">
                    {item.category} • by @{item.creator}
                  </p>
                </div>
                <span className="font-bold text-sm text-[#8B5CF6]">{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
