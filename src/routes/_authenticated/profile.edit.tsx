import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Loader2, Plus, Trash2, Link as LinkIcon, ExternalLink } from "lucide-react";
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
  pronouns: z.string().trim().max(30).optional().default(""),
  gender: z.string().trim().max(40).optional().default(""),
  bio: z.string().trim().max(160, "Bio must be 160 characters or fewer"),
  website: z.union([z.literal(""), z.string().trim().url("Enter a valid URL").max(200)]),
  banner_url: z
    .union([z.literal(""), z.string().trim().url("Enter a valid URL").max(500)])
    .optional()
    .default(""),
  account_type: z.enum(["personal", "creator", "business"]),
});

function EditProfile() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfileById(user!.id),
    enabled: Boolean(user?.id),
  });

  const [form, setForm] = useState({
    display_name: "",
    username: "",
    pronouns: "",
    gender: "",
    bio: "",
    website: "",
    banner_url: "",
    account_type: "personal" as "personal" | "creator" | "business",
  });
  const [linksList, setLinksList] = useState<{ title: string; url: string }[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [showAddLink, setShowAddLink] = useState(false);

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      display_name: profile.display_name ?? "",
      username: profile.username,
      pronouns: profile.pronouns ?? "",
      gender: profile.gender ?? "",
      bio: profile.bio ?? "",
      website: profile.website ?? "",
      banner_url: profile.banner_url ?? "",
      account_type: profile.account_type,
    });
    setLinksList(profile.links ?? []);
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
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      setUploading(false);
      toast.error(uploadError.message);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: path })
      .eq("id", user.id);
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
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
      localStorage.setItem(
        `opexnal_profile_ext_${user.id}`,
        JSON.stringify({
          pronouns: parsed.data.pronouns || null,
          gender: parsed.data.gender || null,
          banner_url: parsed.data.banner_url || null,
          links: linksList,
        }),
      );
    } catch {
      // quota
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: parsed.data.display_name,
        username: parsed.data.username,
        bio: parsed.data.bio,
        website: parsed.data.website || (linksList[0]?.url ?? null),
        account_type: parsed.data.account_type,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      const msg =
        (error as { code?: string; message?: string })?.code === "23505"
          ? "That username is already taken"
          : (error as Error).message || "Profile update failed";
      toast.error(msg);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    await queryClient.invalidateQueries({ queryKey: ["profile-by-username"] });
    toast.success("Profile saved");
    navigate({ to: "/profile" });
  }

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) {
      toast.error("Please enter a link URL");
      return;
    }
    let url = newLinkUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    const cleanTitle = newLinkTitle.trim() || url.replace(/^https?:\/\//, "").split("/")[0] || "Link";
    setLinksList((prev) => [...prev, { title: cleanTitle, url }]);
    setNewLinkTitle("");
    setNewLinkUrl("");
    setShowAddLink(false);
    toast.success("Link added");
  };

  const handleRemoveLink = (index: number) => {
    setLinksList((prev) => prev.filter((_, i) => i !== index));
    toast.success("Link removed");
  };

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
            <Label htmlFor="pronouns">Pronouns</Label>
            <Input
              id="pronouns"
              placeholder="e.g. she/her, he/him, they/them"
              value={form.pronouns}
              maxLength={30}
              onChange={(e) => setForm((f) => ({ ...f, pronouns: e.target.value }))}
              className="h-12 rounded-xl bg-surface"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={form.gender || "prefer_not_to_say"}
              onValueChange={(value) => setForm((f) => ({ ...f, gender: value }))}
            >
              <SelectTrigger id="gender" className="h-12 rounded-xl bg-surface">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="non_binary">Non-binary</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="banner_url">Profile Banner Image URL (optional)</Label>
            <Input
              id="banner_url"
              inputMode="url"
              placeholder="https://images.unsplash.com/..."
              value={form.banner_url}
              maxLength={500}
              onChange={(e) => setForm((f) => ({ ...f, banner_url: e.target.value }))}
              className="h-12 rounded-xl bg-surface"
            />
            {form.banner_url && (
              <div className="h-20 w-full rounded-xl overflow-hidden border border-border mt-2">
                <img
                  src={form.banner_url}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                  onError={() => toast.error("Could not load banner preview")}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Links & Websites</Label>
              <Button
                type="button"
                variant="surface"
                size="sm"
                onClick={() => setShowAddLink(!showAddLink)}
                className="h-7 text-xs rounded-lg gap-1 text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Link</span>
              </Button>
            </div>

            {showAddLink && (
              <div className="p-3 bg-surface border border-border rounded-xl space-y-2">
                <Input
                  placeholder="Link Title (e.g. YouTube, Portfolio)"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
                <Input
                  placeholder="URL (e.g. https://instagram.com/user)"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddLink(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="brand"
                    onClick={handleAddLink}
                    className="h-7 text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            {linksList.length > 0 ? (
              <div className="space-y-1.5">
                {linksList.map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-surface border border-border rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <LinkIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-semibold text-foreground truncate">{link.title}</span>
                      <span className="text-muted-foreground truncate text-[11px]">{link.url}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      aria-label="Remove link"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No links added yet.</p>
            )}
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
