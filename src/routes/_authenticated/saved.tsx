import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bookmark, Grid3X3, FolderPlus, Image as ImageIcon } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved Collections — Opexnal" },
      { name: "description", content: "Saved posts, reels and audio collections on Opexnal." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const navigate = useNavigate();

  const collections = [
    {
      id: "all",
      name: "All Posts",
      count: 24,
      cover:
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "design",
      name: "Design Inspo & 3D",
      count: 12,
      cover:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "audio",
      name: "Saved Audio",
      count: 7,
      cover:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    },
  ];

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Saved" showBack onBack={() => navigate({ to: "/profile" })} />

        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Only you can see what you've saved</span>
            <button
              type="button"
              className="text-[#8B5CF6] font-semibold flex items-center gap-1 hover:underline"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New Collection</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {collections.map((col) => (
              <div
                key={col.id}
                className="bg-[#121212] border border-[#262626] rounded-2xl overflow-hidden group cursor-pointer"
              >
                <div className="aspect-square bg-gray-900 relative overflow-hidden">
                  <img
                    src={col.cover}
                    alt={col.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-semibold text-white">
                    {col.count} items
                  </span>
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-white truncate">{col.name}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
