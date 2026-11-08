import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight, Palette, Power, Sparkles } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/colour")({
  head: () => ({
    meta: [
      { title: "Opexnal Colour Official — Opexnal" },
      {
        name: "description",
        content: "Personalize Opexnal with premium colour themes.",
      },
    ],
  }),
  component: OpexnalColourOfficial,
});

const STORAGE_ENABLED = "opexnal-colour-enabled";
const STORAGE_THEME = "opexnal-colour-theme";

// prettier-ignore
const themes = [
  {
    id: "emerald",
    name: "Emerald Green + Lime",
    detail: "Fresh • Vibrant",
    colors: ["#00D977", "#43E8A0", "#B6F56A"],
    light: "#E9FFF4",
  },
  {
    id: "ocean",
    name: "Ocean Blue + Ice Blue",
    detail: "Calm • Clear",
    colors: ["#0876D9", "#24B5F5", "#9AE7FF"],
    light: "#EAF7FF",
  },
  {
    id: "royal-purple",
    name: "Royal Purple + Lavender",
    detail: "Bold • Creative",
    colors: ["#7135D8", "#B45AF2", "#F0A2FF"],
    light: "#F5ECFF",
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange + Gold",
    detail: "Warm • Energetic",
    colors: ["#F04A16", "#FF812D", "#FFD06B"],
    light: "#FFF2E7",
  },
  {
    id: "rose-pink",
    name: "Rose Pink + Magenta",
    detail: "Expressive • Modern",
    colors: ["#E52D91", "#FF63B7", "#FFB5D8"],
    light: "#FFF0F7",
  },
  {
    id: "teal-aqua",
    name: "Teal + Aqua",
    detail: "Balanced • Fresh",
    colors: ["#00AFA7", "#39D8C6", "#A1F5E7"],
    light: "#E9FFFC",
  },
  {
    id: "ruby-red",
    name: "Ruby Red + Rose",
    detail: "Confident • Strong",
    colors: ["#C71943", "#F34D65", "#FF9B9E"],
    light: "#FFF0F2",
  },
  {
    id: "golden-luxury",
    name: "Golden + Champagne",
    detail: "Elegant • Premium",
    colors: ["#9A6810", "#E2AA32", "#FFF0A8"],
    light: "#FFF8E6",
  },
  {
    id: "indigo-galaxy",
    name: "Indigo + Electric Blue",
    detail: "Focused • Dynamic",
    colors: ["#3730A3", "#4F46E5", "#60A5FA"],
    light: "#EEF2FF",
  },
  {
    id: "lavender-mist",
    name: "Lavender + Violet",
    detail: "Soft • Refined",
    colors: ["#8B5CF6", "#A78BFA", "#DDD6FE"],
    light: "#F5F0FF",
  },
  {
    id: "white",
    name: "White",
    detail: "Pure monochrome",
    colors: ["#FFFFFF", "#D4D4D4", "#737373"],
    light: "#FFFFFF",
  },
  {
    id: "black",
    name: "Black",
    detail: "Pure monochrome",
    colors: ["#090909", "#303030", "#777777"],
    light: "#171717",
  },
];

// prettier-ignore
function OpexnalMark() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111827] shadow-lg ring-1 ring-white/10">
      <svg
        viewBox="0 0 100 100"
        className="h-10 w-10"
        role="img"
        aria-label="Opexnal Colour mark"
      >
        <defs>
          <linearGradient
            id="opexnal-colour-mark"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="52%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        <path
          d="M50 10 C27 10 10 26 10 47 C10 69 27 86 48 86 H57 C65 86 69 80 65 73 C62 68 66 62 73 62 H78 C88 62 92 55 90 46 C86 25 70 10 50 10Z"
          fill="none"
          stroke="url(#opexnal-colour-mark)"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <circle cx="31" cy="39" r="6" fill="#34D399" />
        <circle cx="48" cy="27" r="6" fill="#38BDF8" />
        <circle cx="67" cy="34" r="6" fill="#A78BFA" />
        <circle cx="76" cy="49" r="5" fill="#FBBF24" />
      </svg>
    </div>
  );
}

// prettier-ignore
function OpexnalColourOfficial() {
  const [enabled, setEnabled] = useState(false);
  const [selected, setSelected] = useState("emerald");
  const [advanced, setAdvanced] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    const isEnabled =
      window.localStorage.getItem(STORAGE_ENABLED) === "true";
    const savedTheme =
      window.localStorage.getItem(STORAGE_THEME) || "emerald";

    setEnabled(isEnabled);
    setSelected(
      themes.some((theme) => theme.id === savedTheme)
        ? savedTheme
        : "emerald",
    );
    setPreferencesLoaded(true);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;

    if (enabled) {
      document.documentElement.setAttribute(
        "data-opexnal-theme",
        selected,
      );
    } else {
      document.documentElement.removeAttribute("data-opexnal-theme");
    }

    window.localStorage.setItem(STORAGE_ENABLED, String(enabled));
    window.localStorage.setItem(STORAGE_THEME, selected);
  }, [enabled, selected, preferencesLoaded]);

  function toggleTheme(id: string) {
    if (selected === id && enabled) {
      setEnabled(false);
      toast.success("Opexnal Colour turned off.");
      return;
    }

    setSelected(id);
    setEnabled(true);
    toast.success(
      `${themes.find((theme) => theme.id === id)?.name || "Theme"} activated.`,
    );
  }

  return (
    <AppShell activeTab="profile">
      <div className="mx-auto min-h-screen w-full max-w-xl space-y-5 px-4 pb-24 pt-4">
        <ScreenHeader title="Opexnal Colour" showBack />

        <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-xl">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <OpexnalMark />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                Opexnal Colour Official
              </p>
              <h1 className="text-xl font-bold tracking-tight">
                Colour, your way.
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                A refined look for your Opexnal experience.
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-background/70 p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Power className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Opexnal Colour Engine
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {enabled
                    ? "Custom colours are active"
                    : "Using the default app appearance"}
                </p>
              </div>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              aria-label="Turn Opexnal Colour on or off"
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-base font-bold">Colour collections</h2>
              <p className="text-xs text-muted-foreground">
                Select one signature palette for the whole app.
              </p>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">
              12 THEMES
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {themes.map((theme) => {
              const active = enabled && selected === theme.id;

              return (
                <div
                  key={theme.id}
                  className={`group rounded-2xl border p-3 transition-all ${
                    active
                      ? "border-primary/70 bg-primary/5 shadow-md shadow-primary/10"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="mb-3 flex h-10 items-center gap-1.5 overflow-hidden rounded-xl bg-muted/40 p-1">
                    {theme.colors.map((color) => (
                      <span
                        key={color}
                        title={color}
                        className="h-full flex-1 rounded-lg"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {advanced && (
                    <p className="mb-2 font-mono text-[9px] tracking-wide text-muted-foreground">
                      {theme.colors.join("  ·  ")}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">
                        {theme.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {theme.detail}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={active ? "default" : "outline"}
                      className="h-8 min-w-[66px] rounded-full px-3 text-[11px]"
                      aria-pressed={active}
                      onClick={() => toggleTheme(theme.id)}
                    >
                      {active ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5" />
                          ON
                        </>
                      ) : (
                        "OFF"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">
                Optional controls
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Extra controls, only when you need them.
              </p>
            </div>
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="advanced-colour" className="text-xs">
                Advanced colour details
              </Label>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Show palette HEX values for precision
              </p>
            </div>
            <Switch
              id="advanced-colour"
              checked={advanced}
              onCheckedChange={setAdvanced}
            />
          </div>
        </section>

        <div className="flex items-center justify-between rounded-xl px-1 text-[11px] text-muted-foreground">
          <span>One active theme at a time</span>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1 font-medium text-primary"
          >
            Settings <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
