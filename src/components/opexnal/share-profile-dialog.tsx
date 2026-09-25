import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Copy, QrCode, Share2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ShareProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  displayName: string;
}

export function ShareProfileDialog({
  open,
  onOpenChange,
  username,
  displayName,
}: ShareProfileDialogProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/u/${username}` : "";

  useEffect(() => {
    if (!open || !profileUrl) return;
    QRCode.toDataURL(profileUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: "#1c1427",
        light: "#ffffff",
      },
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error("QR Code generation error:", err));
  }, [open, profileUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Profile link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: `${displayName} (@${username}) on Opexnal`,
          url: profileUrl,
        });
      } else {
        handleCopy();
      }
    } catch {
      // User cancelled
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs bg-card border border-border rounded-3xl p-6 text-center">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold">Share Profile</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Scan QR code or share your link to connect on Opexnal
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center my-4">
          <div className="p-4 bg-white rounded-2xl shadow-md border border-border/50">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt={`QR Code for @${username}`}
                className="h-44 w-44 object-contain"
              />
            ) : (
              <div className="h-44 w-44 flex items-center justify-center text-xs text-muted-foreground">
                Generating QR...
              </div>
            )}
          </div>
          <p className="mt-3 text-sm font-bold text-foreground">@{username}</p>
          <p className="text-xs text-muted-foreground">{displayName}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl text-xs gap-1.5"
            onClick={handleCopy}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy Link
          </Button>
          <Button
            className="flex-1 rounded-xl brand-gradient-bg text-primary-foreground text-xs font-semibold gap-1.5"
            onClick={handleNativeShare}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
