import { useState } from "react";
import {
  Radio,
  Users,
  Check,
  BadgeCheck,
  BarChart3,
  Bell,
  BellOff,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { Button } from "@/components/ui/button";
import {
  BroadcastChannel,
  getSavedChannels,
  toggleChannelJoin,
  voteChannelPoll,
} from "@/lib/interactive-features";
import { cn } from "@/lib/utils";

export function BroadcastChannelsView() {
  const [channels, setChannels] = useState<BroadcastChannel[]>(() => getSavedChannels());
  const [selectedChannel, setSelectedChannel] = useState<BroadcastChannel | null>(null);

  function handleToggleJoin(channelId: string) {
    const updated = toggleChannelJoin(channelId);
    setChannels(updated);
    const target = updated.find((c) => c.id === channelId);
    if (target?.isJoined) {
      toast.success(`Joined ${target.title}! You will receive creator updates.`);
    } else {
      toast.info(`Left channel.`);
    }
  }

  function handleVote(channelId: string, optionIndex: number) {
    const updated = voteChannelPoll(channelId, optionIndex);
    setChannels(updated);
    toast.success("Vote recorded in creator channel!");
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Radio className="h-4 w-4 animate-pulse" />
          <span>Broadcast Channels</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Public, one-to-many messaging channels where favorite creators share exclusive updates,
          polls, voice notes, and behind-the-scenes moments.
        </p>
      </div>

      <div className="space-y-3">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
          >
            {/* Channel Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  path={channel.creatorAvatar}
                  fallback={channel.title.slice(0, 2).toUpperCase()}
                  className="h-12 w-12 rounded-2xl ring-1 ring-border"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground">{channel.title}</h3>
                    {channel.verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    by {channel.creatorName} · {channel.membersCount.toLocaleString()} members
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant={channel.isJoined ? "secondary" : "brand"}
                onClick={() => handleToggleJoin(channel.id)}
                className="rounded-xl text-xs h-8 px-3 font-semibold"
              >
                {channel.isJoined ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Joined
                  </>
                ) : (
                  "Join"
                )}
              </Button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{channel.description}</p>

            {/* Latest Broadcast Update */}
            <div className="mt-3 rounded-xl border border-border/80 bg-surface/80 p-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-1.5">
                <span className="font-semibold text-primary">Latest Broadcast</span>
                <span>{channel.latestUpdate.timestamp}</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{channel.latestUpdate.text}</p>

              {/* Interactive Poll if exists */}
              {channel.latestUpdate.poll && (
                <div className="mt-3 space-y-2 rounded-lg border border-primary/20 bg-background/50 p-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5 text-primary" />
                      {channel.latestUpdate.poll.question}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {channel.latestUpdate.poll.totalVotes.toLocaleString()} votes
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {channel.latestUpdate.poll.options.map((opt, idx) => {
                      const total = channel.latestUpdate.poll?.totalVotes || 1;
                      const pct = Math.round((opt.votes / total) * 100);
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={opt.userVoted}
                          onClick={() => handleVote(channel.id, idx)}
                          className={cn(
                            "relative flex w-full items-center justify-between overflow-hidden rounded-lg border px-3 py-2 text-xs font-medium transition-all text-left",
                            opt.userVoted
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50 bg-surface",
                          )}
                        >
                          <div
                            className="absolute inset-y-0 left-0 bg-primary/15 transition-all duration-500 pointer-events-none"
                            style={{ width: `${pct}%` }}
                          />
                          <span className="relative z-10 truncate pr-2">{opt.text}</span>
                          <span className="relative z-10 text-[11px] text-muted-foreground font-semibold">
                            {pct}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reactions Bar */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {channel.latestUpdate.reactions.map((r, i) => (
                  <span
                    key={i}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      r.userReacted
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    <span>{r.emoji}</span>
                    <span>{r.count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
