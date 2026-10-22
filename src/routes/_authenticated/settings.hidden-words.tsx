import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EyeOff, Plus, X, Save, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/hooks/use-session";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoredSettings, updateSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/_authenticated/settings/hidden-words")({
  head: () => ({
    meta: [
      { title: "Hidden Words & Offensive Content — Settings — Opexnal" },
      {
        name: "description",
        content: "Filter offensive comments, slurs and spam words on Opexnal.",
      },
    ],
  }),
  component: SettingsHiddenWordsPage,
});

function SettingsHiddenWordsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.userId || "user_maya";

  const { data: settings } = useQuery({
    queryKey: ["settings", userId],
    queryFn: () => getStoredSettings(userId),
  });

  const [hideOffensive, setHideOffensive] = useState(settings?.hideOffensiveComments ?? true);
  const [advancedFilter, setAdvancedFilter] = useState(settings?.advancedCommentFiltering ?? true);
  const [customWords, setCustomWords] = useState<string[]>(
    settings?.customKeywordFilter ?? ["scam", "dm me for promo", "free crypto"],
  );
  const [wordInput, setWordInput] = useState("");

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = wordInput.trim().toLowerCase();
    if (clean && !customWords.includes(clean)) {
      setCustomWords([...customWords, clean]);
      setWordInput("");
    }
  };

  const handleRemoveWord = (word: string) => {
    setCustomWords(customWords.filter((w) => w !== word));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      return updateSettings(userId, {
        hideOffensiveComments: hideOffensive,
        advancedCommentFiltering: advancedFilter,
        customKeywordFilter: customWords,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", userId] });
      toast.success("Hidden words settings updated.");
    },
    onError: () => {
      toast.error("Failed to update settings.");
    },
  });

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Hidden Words" showBack onBack={() => navigate({ to: "/settings" })} />

        <div className="p-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Offensive Comments
            </h3>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Hide Offensive Comments</span>
                <p className="text-xs text-gray-400">
                  Comments that may be offensive will be automatically filtered
                </p>
              </div>
              <Switch checked={hideOffensive} onCheckedChange={setHideOffensive} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Advanced Comment Filtering</span>
                <p className="text-xs text-gray-400">
                  Stricter AI classification of scam and hate speech
                </p>
              </div>
              <Switch checked={advancedFilter} onCheckedChange={setAdvancedFilter} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Custom Word Blacklist
            </h3>

            <form onSubmit={handleAddWord} className="flex gap-2">
              <input
                type="text"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                placeholder="Add a phrase or word to block..."
                className="flex-1 h-10 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6]"
              />
              <button
                type="submit"
                className="px-3 h-10 bg-[#262626] hover:bg-[#333333] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {customWords.map((word) => (
                <span
                  key={word}
                  className="px-2.5 py-1 bg-[#1a1a1a] border border-[#2c2c2c] rounded-lg text-xs text-gray-300 flex items-center gap-1.5"
                >
                  <span>{word}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWord(word)}
                    className="text-gray-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Filter Rules</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
