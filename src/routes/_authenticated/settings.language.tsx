import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Languages, Check, Globe } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/settings/language")({
  head: () => ({
    meta: [
      { title: "Language & Regional Settings — Opexnal" },
      {
        name: "description",
        content: "Select preferred language and translation settings on Opexnal.",
      },
    ],
  }),
  component: SettingsLanguagePage,
});

function SettingsLanguagePage() {
  const navigate = useNavigate();

  const [selectedLang, setSelectedLang] = useState("en");

  const languages = [
    { code: "en", name: "English (US)", native: "English" },
    { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
    { code: "hi", name: "Hindi", native: "हिन्दी" },
    { code: "es", name: "Spanish", native: "Español" },
    { code: "fr", name: "French", native: "Français" },
    { code: "de", name: "German", native: "Deutsch" },
    { code: "ja", name: "Japanese", native: "日本語" },
  ];

  const handleSelect = (code: string, name: string) => {
    setSelectedLang(code);
    toast.success(`Language updated to ${name}`);
  };

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="App Language" showBack onBack={() => navigate({ to: "/settings" })} />

        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-400">
            Choose the language used for buttons, titles, and system messages across Opexnal.
          </p>

          <div className="space-y-1.5">
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelect(l.code, l.name)}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition text-xs ${
                  selectedLang === l.code
                    ? "bg-purple-950/30 border-purple-800/80 text-white"
                    : "bg-[#121212] border-[#262626] text-gray-300 hover:bg-[#1a1a1a]"
                }`}
              >
                <div>
                  <span className="font-semibold text-white block">{l.name}</span>
                  <span className="text-[11px] text-gray-400">{l.native}</span>
                </div>
                {selectedLang === l.code && <Check className="w-4 h-4 text-purple-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
