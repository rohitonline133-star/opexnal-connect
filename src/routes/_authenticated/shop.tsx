import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Tag, Package, ExternalLink, Sparkles } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/shop")({
  head: () => ({
    meta: [
      { title: "Shop & Creator Marketplace — Opexnal" },
      {
        name: "description",
        content: "Discover creator merchandise, digital drops and affiliate goods.",
      },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const navigate = useNavigate();

  const featuredProducts = [
    {
      id: "prod_1",
      title: "Creator Presets Lightroom Pack v3",
      creator: "maya_codes",
      price: "$19.00",
      image:
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "prod_2",
      title: "Handcrafted Ceramic Mug - Violet Edition",
      creator: "artisan_clay",
      price: "$34.00",
      image:
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "prod_3",
      title: "Minimalist Mechanical Desk Mat",
      creator: "desk_setup_lab",
      price: "$28.00",
      image:
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=500&q=80",
    },
  ];

  return (
    <AppShell activeTab="explore">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Shop" showBack onBack={() => navigate({ to: "/explore" })} />

        <div className="p-4 space-y-5">
          <div className="flex gap-2">
            <Link
              to="/shop/products"
              className="flex-1 py-2 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2c2c2c] rounded-xl text-center text-xs font-semibold text-white transition"
            >
              Browse Catalog
            </Link>
            <Link
              to="/shop/orders"
              className="flex-1 py-2 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2c2c2c] rounded-xl text-center text-xs font-semibold text-white transition"
            >
              My Orders
            </Link>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Featured Creator Drops
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {featuredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#121212] border border-[#262626] rounded-2xl overflow-hidden group flex flex-col justify-between"
                >
                  <div className="aspect-square bg-gray-900 relative overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded-md text-[11px] font-bold text-white">
                      {p.price}
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="text-xs font-semibold text-white line-clamp-1">{p.title}</h4>
                    <p className="text-[10px] text-gray-400">by @{p.creator}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
