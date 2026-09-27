import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2, RotateCcw, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/recently-deleted")({
  head: () => ({
    meta: [
      { title: "Recently Deleted — Opexnal" },
      { name: "description", content: "Restore or permanently delete removed items on Opexnal." },
    ],
  }),
  component: RecentlyDeletedPage,
});

function RecentlyDeletedPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([
    {
      id: "del_1",
      type: "post",
      caption: "Early UI prototype draft",
      daysLeft: 28,
      thumb:
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "del_2",
      type: "reel",
      caption: "Quick coding workflow timelapse",
      daysLeft: 19,
      thumb:
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80",
    },
  ]);

  const handleRestore = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Post restored to your profile.");
  };

  const handleDeletePermanent = (id: string) => {
    if (!window.confirm("Permanently delete this item? This action cannot be undone.")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Item permanently deleted.");
  };

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Recently Deleted"
          showBack
          onBack={() => navigate({ to: "/settings" })}
        />

        <div className="p-4 space-y-4">
          <div className="p-3 bg-[#121212] border border-[#262626] rounded-xl flex items-start gap-2.5 text-xs text-gray-400">
            <Clock className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
            <p>
              Posts, reels, and stories in this folder will be permanently deleted after 30 days.
              Only you can see recently deleted items.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-xs">
              <Trash2 className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              No recently deleted items.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#121212] border border-[#262626] rounded-2xl overflow-hidden flex flex-col"
                >
                  <div className="aspect-square bg-gray-900 relative">
                    <img
                      src={item.thumb}
                      alt={item.caption}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded-md text-[10px] text-amber-300 font-semibold">
                      {item.daysLeft}d left
                    </span>
                  </div>
                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-gray-300 line-clamp-2">{item.caption}</p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleRestore(item.id)}
                        className="flex-1 py-1.5 bg-[#262626] hover:bg-[#333333] text-white text-[11px] font-semibold rounded-lg transition flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePermanent(item.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
