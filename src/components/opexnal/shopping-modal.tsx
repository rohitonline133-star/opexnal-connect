import { useState } from "react";
import {
  ShoppingBag,
  Bookmark,
  Check,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  X,
  CreditCard,
  Heart,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ProductItem,
  CURATED_SHOPPING_CATALOG,
  getWishlist,
  toggleWishlistItem,
} from "@/lib/interactive-features";
import { cn } from "@/lib/utils";

interface ShoppingModalProps {
  product?: ProductItem;
  productId?: string;
  onClose: () => void;
}

export function ShoppingModal({ product: initialProduct, productId, onClose }: ShoppingModalProps) {
  const product: ProductItem =
    initialProduct ||
    CURATED_SHOPPING_CATALOG.find((p) => p.id === productId) ||
    (CURATED_SHOPPING_CATALOG[0] as ProductItem);

  const [wishlist, setWishlist] = useState<string[]>(() => getWishlist());
  const [checkingOut, setCheckingOut] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const isSaved = wishlist.includes(product.id);

  function handleToggleWishlist() {
    const next = toggleWishlistItem(product.id);
    setWishlist(next);
    if (next.includes(product.id)) {
      toast.success("Saved to your Opexnal Wishlist!");
    } else {
      toast.info("Removed from Wishlist");
    }
  }

  function handleBuyNow() {
    setCheckingOut(true);
    setTimeout(() => {
      setCheckingOut(false);
      setPurchased(true);
      toast.success(`Order placed for ${product.title}! Receipt sent.`);
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold">Opexnal Shop</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {purchased ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <h4 className="text-lg font-bold">Order Confirmed!</h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Thank you for purchasing{" "}
              <span className="font-semibold text-foreground">{product.title}</span> from the
              creator store.
            </p>
            <Button
              type="button"
              onClick={onClose}
              className="rounded-xl brand-gradient-bg text-primary-foreground font-semibold px-6"
            >
              Continue Browsing
            </Button>
          </div>
        ) : (
          <div className="max-h-[75vh] overflow-y-auto p-5 space-y-5">
            {/* Product Image Stage */}
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-secondary/30">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-full w-full object-cover"
              />
              <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                ${product.price} {product.currency}
              </span>
              <button
                type="button"
                onClick={handleToggleWishlist}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md transition-transform active:scale-110"
              >
                <Bookmark
                  className={cn("h-4 w-4", isSaved ? "fill-primary text-primary" : "text-white")}
                />
              </button>
            </div>

            {/* Product Info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {product.brand}
              </p>
              <h2 className="mt-1 text-base font-bold text-foreground">{product.title}</h2>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-amber-500 font-semibold">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{product.rating}</span>
                </div>
                <span className="text-muted-foreground">·</span>
                <span className="text-emerald-500 font-medium">In Stock</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{product.category}</span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">{product.description}</p>

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface p-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck className="h-4 w-4 text-primary" />
                <span>Fast express delivery</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <RotateCcw className="h-4 w-4 text-primary" />
                <span>30-day easy returns</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleWishlist}
                className="flex-1 rounded-xl h-11"
              >
                <Bookmark className={cn("mr-2 h-4 w-4", isSaved && "fill-primary text-primary")} />
                {isSaved ? "Saved" : "Save to Wishlist"}
              </Button>
              <Button
                type="button"
                onClick={handleBuyNow}
                disabled={checkingOut}
                className="flex-1 rounded-xl h-11 brand-gradient-bg text-primary-foreground font-semibold"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {checkingOut ? "Processing..." : `Buy for $${product.price}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
