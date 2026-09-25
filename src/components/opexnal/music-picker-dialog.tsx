import { useState } from "react";
import { Music, Play, Square, Search, Check, Sparkles, X, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AudioTrack,
  CURATED_AUDIO_TRACKS,
  playSynthPreview,
  stopSynthPreview,
} from "@/lib/interactive-features";
import { cn } from "@/lib/utils";

interface MusicPickerDialogProps {
  selectedTrackId?: string | null;
  onSelectTrack: (track: AudioTrack) => void;
  onClose: () => void;
}

export function MusicPickerDialog({
  selectedTrackId,
  onSelectTrack,
  onClose,
}: MusicPickerDialogProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const tracks = CURATED_AUDIO_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase()) ||
      t.genre.toLowerCase().includes(search.toLowerCase()),
  );

  function togglePlay(track: AudioTrack) {
    if (playingId === track.id) {
      stopSynthPreview();
      setPlayingId(null);
    } else {
      setPlayingId(track.id);
      playSynthPreview(track.audioFreq, () => {
        setPlayingId((curr) => (curr === track.id ? null : curr));
      });
    }
  }

  function handleSelect(track: AudioTrack) {
    stopSynthPreview();
    onSelectTrack(track);
    toast.success(`Attached "${track.title}" by ${track.artist}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold">Add Audio / Music</h3>
              <p className="text-[11px] text-muted-foreground">
                Trending commercial tracks for your content
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopSynthPreview();
              onClose();
            }}
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search songs, artists, or genres..."
              className="pl-9 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Tracks List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-border p-2">
          {tracks.map((track) => {
            const isPlaying = playingId === track.id;
            const isSelected = selectedTrackId === track.id;
            return (
              <div
                key={track.id}
                className={cn(
                  "flex items-center justify-between gap-3 p-3 rounded-2xl transition-colors hover:bg-secondary/40",
                  isSelected && "bg-primary/10 border border-primary/30",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => togglePlay(track)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity hover:bg-black/60"
                      aria-label={isPlaying ? "Pause" : "Play preview"}
                    >
                      {isPlaying ? (
                        <Square className="h-4 w-4 fill-white" />
                      ) : (
                        <Play className="h-4 w-4 fill-white" />
                      )}
                    </button>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-bold text-foreground">{track.title}</p>
                      {track.trendingRank && (
                        <span className="shrink-0 rounded bg-primary/20 px-1 py-0.2 text-[9px] font-bold text-primary">
                          #{track.trendingRank}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {track.artist} · {track.genre} · {track.duration}
                    </p>
                    {isPlaying && (
                      <div className="flex items-center gap-1 text-[10px] text-primary font-medium mt-0.5">
                        <Volume2 className="h-3 w-3 animate-pulse" />
                        <span>Playing beat preview...</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={isSelected ? "brand" : "secondary"}
                  onClick={() => handleSelect(track)}
                  className="shrink-0 rounded-xl text-xs h-8 px-3 font-semibold"
                >
                  {isSelected ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Selected
                    </>
                  ) : (
                    "Use"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
