import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { authClient } from "@/lib/auth-client";
import { apiUrl } from "@/lib/api-client";
import { getProfileById, initialsFor, USERNAME_PATTERN } from "@/lib/profile";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/profile/edit")({
  head: () => ({
    meta: [
      { title: "Edit profile — Opexnal" },
      { name: "description", content: "Update your Opexnal name, username, bio and photo." },
      { property: "og:title", content: "Edit profile — Opexnal" },
      { property: "og:description", content: "Update your Opexnal profile details." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditProfile,
});

const formSchema = z.object({
  display_name: z.string().trim().max(50, "Name must be 50 characters or fewer"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_PATTERN, "3–30 characters: lowercase letters, numbers, dots or underscores"),
  bio: z.string().trim().max(160, "Bio must be 160 characters or fewer"),
  website: z.union([
    z.literal(""),
    z.string().trim().url("Enter a valid URL").max(200).refine((value) => value.startsWith("https://"), "Website must use HTTPS"),
  ]),
  account_type: z.enum(["personal", "creator", "business"]),
});

function EditProfile() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfileById(user!.id),
    enabled: Boolean(user?.id),
  });

  const [form, setForm] = useState({
    display_name: "",
    username: "",
    bio: "",
    website: "",
    account_type: "personal" as "personal" | "creator" | "business",
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      display_name: profile.display_name ?? "",
      username: profile.username,
      bio: profile.bio ?? "",
      website: profile.website ?? "",
      account_type: profile.account_type,
    });
  }, [profile]);

  async function handleAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Images must be 5 MB or smaller");
      return;
    }
    setUploading(true);
    const { data: uploaded, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(`${user.id}/avatar`, file, { upsert: false, contentType: file.type });
    if (uploadError || !uploaded?.path) {
      setUploading(false);
      toast.error(uploadError?.message || "Avatar upload failed.");
      return;
    }
    try {
      const response = await fetch(apiUrl("/api/v1/users/me"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authClient.getAuthHeader(),
        },
        body: JSON.stringify({ avatarUrl: uploaded.path }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Avatar update failed.");
      await authClient.getUser();
    } catch (error) {
      await supabase.storage.from("avatars").remove([uploaded.path]);
      setUploading(false);
      toast.error(error instanceof Error ? error.message : "Avatar update failed.");
      return;
    }
    setUploading(false);
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Photo updated");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(apiUrl("/api/v1/users/me"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authClient.getAuthHeader(),
        },
        body: JSON.stringify({
          displayName: parsed.data.display_name,
          username: parsed.data.username,
          bio: parsed.data.bio,
          website: parsed.data.website || null,
          accountType: parsed.data.account_type,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Profile update failed.");
      await authClient.getUser();
    } catch (error) {
      setBusy(false);
      toast.error(error instanceof Error ? error.message : "Profile update failed.");
      return;
    }
    setBusy(false);
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Profile saved");
    navigate({ to: "/profile" });
  }

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Edit profile"
          left={
            <Link
              to="/profile"
              aria-label="Back"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
        />
      }
    >
      {isLoading || !profile ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        <form className="space-y-5 px-4 py-6" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col items-center gap-3">
            <ProfileAvatar
              path={profile.avatar_url}
              fallback={initialsFor(profile)}
              className="h-24 w-24 text-xl"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatar}
            />
            <Button
              type="button"
              variant="ghost"
              className="text-primary"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Change photo"}
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="display_name">Name</Label>
            <Input
              id="display_name"
              value={form.display_name}
              maxLength={50}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              className="h-12 rounded-xl bg-surface"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={form.username}
              maxLength={30}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))}
              className="h-12 rounded-xl bg-surface"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={form.bio}
              maxLength={160}
              rows={3}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className="rounded-xl bg-surface"
            />
            <p className="text-right text-xs text-muted-foreground">{form.bio.length}/160</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              inputMode="url"
              placeholder="https://"
              value={form.website}
              maxLength={200}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              className="h-12 rounded-xl bg-surface"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account_type">Account type</Label>
            <Select
              value={form.account_type}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, account_type: value as typeof f.account_type }))
              }
            >
              <SelectTrigger id="account_type" className="h-12 rounded-xl bg-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" variant="brand" size="xl" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Save changes
          </Button>
        </form>
      )}
    </AppShell>
  );
}
