import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  Bookmark,
  FolderPlus,
  Plus,
  Trash2,
  X,
  ChevronLeft,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved Collections — Opexnal" },
      { name: "description", content: "Saved posts, reels and audio collections on Opexnal." },
    ],
  }),
  component: SavedPage,
});

interface Collection {
  id: string;
  name: string;
  count: number;
  cover: string;
}

const DEFAULT_COLLECTIONS: Collection[] = [
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

const SAVED_STORAGE_KEY = "opexnal_saved_collections";

function SavedPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>(() => {
    if (typeof window === "undefined") return DEFAULT_COLLECTIONS;
    try {
      const raw = localStorage.getItem(SAVED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_COLLECTIONS;
    } catch {
      return DEFAULT_COLLECTIONS;
    }
  });

  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionCover, setNewCollectionCover] = useState("");
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(collections));
    } catch {
      // quota
    }
  }, [collections]);

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) {
      toast.error("Please enter a collection name");
      return;
    }
    const newCol: Collection = {
      id: `col_${Date.now()}`,
      name: newCollectionName.trim(),
      count: 0,
      cover:
        newCollectionCover.trim() ||
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    };
    setCollections((prev) => [...prev, newCol]);
    setNewCollectionName("");
    setNewCollectionCover("");
    setNewCollectionOpen(false);
    toast.success(`Collection "${newCol.name}" created`);
  };

  const handleDeleteCollection = (id: string, name: string) => {
    if (id === "all") {
      toast.error("You cannot delete the primary All Posts collection");
      return;
    }
    setCollections((prev) => prev.filter((c) => c.id !== id));
    setActiveCollection(null);
    toast.success(`Collection "${name}" deleted`);
  };

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-background text-foreground pb-20 max-w-md mx-auto">
        <ScreenHeader
          title="Saved"
          left={
            <Link
              to="/profile"
              aria-label="Back"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          }
          right={
            <button
              type="button"
              onClick={() => setNewCollectionOpen(true)}
              className="text-primary hover:text-primary/80 p-1"
              aria-label="New collection"
            >
              <Plus className="h-5 w-5" />
            </button>
          }
        />

        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Only you can see what you've saved</span>
            <button
              type="button"
              onClick={() => setNewCollectionOpen(true)}
              className="text-primary font-semibold flex items-center gap-1 hover:underline"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New Collection</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {collections.map((col) => (
              <div
                key={col.id}
                onClick={() => setActiveCollection(col)}
                className="bg-card border border-border rounded-2xl overflow-hidden group cursor-pointer shadow-xs hover:border-primary/50 transition-all"
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
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
                  <h4 className="text-xs font-bold text-foreground truncate">{col.name}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Collection Dialog */}
        <Dialog open={newCollectionOpen} onOpenChange={setNewCollectionOpen}>
          <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-primary" />
                New Collection
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1">
                Save and organize your favorite posts, reels, and inspiration.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateCollection} className="space-y-3 py-2 text-xs">
              <div>
                <label className="font-semibold block mb-1">Collection Name</label>
                <Input
                  placeholder="e.g. Photography Inspo, Architecture"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="h-10 rounded-xl bg-surface border-border text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Cover Image URL (optional)</label>
                <Input
                  placeholder="https://..."
                  value={newCollectionCover}
                  onChange={(e) => setNewCollectionCover(e.target.value)}
                  className="h-10 rounded-xl bg-surface border-border text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="surface"
                  onClick={() => setNewCollectionOpen(false)}
                  className="flex-1 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold"
                >
                  Create
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Collection Viewer Dialog */}
        <Dialog open={Boolean(activeCollection)} onOpenChange={() => setActiveCollection(null)}>
          <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-primary" />
                {activeCollection?.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {activeCollection?.count} saved items in this collection
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3 text-center">
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border">
                <img
                  src={activeCollection?.cover}
                  alt={activeCollection?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                All posts saved to &ldquo;{activeCollection?.name}&rdquo; are private to your
                account.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              {activeCollection?.id !== "all" && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() =>
                    activeCollection &&
                    handleDeleteCollection(activeCollection.id, activeCollection.name)
                  }
                  className="text-xs rounded-xl"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="surface"
                onClick={() => setActiveCollection(null)}
                className="flex-1 text-xs rounded-xl"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
