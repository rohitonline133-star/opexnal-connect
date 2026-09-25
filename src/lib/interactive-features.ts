// Interactive Social Media Features for Opexnal:
// Notes, Broadcast Channels, Shopping & Wishlist, Audio Tracks, Live Broadcasts, and Creator Analytics

export interface DMNote {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  text: string; // up to 60 characters
  moodEmoji?: string | undefined;
  audioSnippet?: string | undefined;
  audience: "followers" | "close_friends";
  createdAt: string;
  expiresAt: string;
}

export interface BroadcastChannel {
  id: string;
  title: string;
  handle: string;
  creatorName: string;
  creatorAvatar: string | null;
  description: string;
  membersCount: number;
  isJoined: boolean;
  verified: boolean;
  category: string;
  latestUpdate: {
    id: string;
    text: string;
    timestamp: string;
    mediaUrl?: string | undefined;
    poll?:
      | {
          question: string;
          options: { text: string; votes: number; userVoted?: boolean | undefined }[];
          totalVotes: number;
        }
      | undefined;
    reactions: { emoji: string; count: number; userReacted?: boolean | undefined }[];
  };
}

export interface ProductItem {
  id: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
  description: string;
  rating: number;
  inStock: boolean;
  category: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  coverUrl: string;
  genre: string;
  bpm: number;
  trendingRank?: number;
  audioFreq: number; // For synth playback
}

export const CURATED_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: "track_1",
    title: "Cyber Sunset (Trending)",
    artist: "Opexnal Sound Lab",
    duration: "0:30",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80",
    genre: "Synthwave",
    bpm: 120,
    trendingRank: 1,
    audioFreq: 440,
  },
  {
    id: "track_2",
    title: "Midnight Caffeine Flow",
    artist: "Lo-Fi Collective",
    duration: "0:45",
    coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&q=80",
    genre: "Lo-Fi",
    bpm: 84,
    trendingRank: 2,
    audioFreq: 330,
  },
  {
    id: "track_3",
    title: "Tokyo Neon Drift",
    artist: "Kitsune Beats",
    duration: "0:60",
    coverUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=300&q=80",
    genre: "Future Bass",
    bpm: 128,
    trendingRank: 3,
    audioFreq: 520,
  },
  {
    id: "track_4",
    title: "Golden Hour Reverie",
    artist: "Aura Soundscape",
    duration: "0:30",
    coverUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&q=80",
    genre: "Ambient",
    bpm: 95,
    trendingRank: 4,
    audioFreq: 260,
  },
  {
    id: "track_5",
    title: "Minimal Techno Pulse",
    artist: "Berlin Deep",
    duration: "0:45",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80",
    genre: "Electronic",
    bpm: 130,
    trendingRank: 5,
    audioFreq: 380,
  },
];

export const CURATED_SHOPPING_CATALOG: ProductItem[] = [
  {
    id: "prod_1",
    title: "Minimalist Matte Mechanical Keyboard",
    brand: "Opexnal Hardware",
    price: 129,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
    description:
      "Hot-swappable custom linear switches with frosted PBT keycaps and warm white backlight.",
    rating: 4.9,
    inStock: true,
    category: "Tech & Workspace",
  },
  {
    id: "prod_2",
    title: "Oversized Heavyweight Cotton Hoodie",
    brand: "Studio Mono",
    price: 85,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80",
    description:
      "480 GSM organic cotton french terry with dropped shoulders and double-layered hood.",
    rating: 4.8,
    inStock: true,
    category: "Apparel",
  },
  {
    id: "prod_3",
    title: "Handcrafted Ceramic Pour-Over Dripper",
    brand: "Kuro Craft",
    price: 44,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
    description: "Artisan stoneware with ribbed interior vortex for optimal coffee extraction.",
    rating: 5.0,
    inStock: true,
    category: "Lifestyle",
  },
  {
    id: "prod_4",
    title: "Anodized Aluminum Desk Monitor Arm",
    brand: "ErgoForm",
    price: 98,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80",
    description:
      "Gas-spring precision arm with integrated cable management and 360-degree rotation.",
    rating: 4.7,
    inStock: true,
    category: "Workspace",
  },
];

const INITIAL_NOTES: DMNote[] = [
  {
    id: "note_1",
    userId: "usr_aanya",
    username: "aanya_design",
    displayName: "Aanya Verma",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
    text: "Designing new brand motion guidelines 🎨✨",
    moodEmoji: "🎨",
    audience: "followers",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 22 * 3600 * 1000).toISOString(),
  },
  {
    id: "note_2",
    userId: "usr_rohan",
    username: "rohan_sharma",
    displayName: "Rohan Sharma",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    text: "Listening to Tycho on repeat 🎧☕",
    moodEmoji: "🎧",
    audience: "followers",
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
  },
  {
    id: "note_3",
    userId: "usr_priya",
    username: "priya_art",
    displayName: "Priya Patel",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    text: "Weekend ceramics workshop starts today! 🏺",
    moodEmoji: "🏺",
    audience: "close_friends",
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 23 * 3600 * 1000).toISOString(),
  },
  {
    id: "note_4",
    userId: "usr_vikram",
    username: "vikram_visuals",
    displayName: "Vikram Mehta",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
    text: "Packing gear for Ladakh expedition 🏔️📸",
    moodEmoji: "🏔️",
    audience: "followers",
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_CHANNELS: BroadcastChannel[] = [
  {
    id: "chan_opexnal_official",
    title: "Opexnal Creator Club",
    handle: "opexnal_creators",
    creatorName: "Opexnal Team",
    creatorAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80",
    description:
      "Official product drops, algorithm updates, tips for reaching more viewers, and creator spotlights.",
    membersCount: 48920,
    isJoined: true,
    verified: true,
    category: "Community",
    latestUpdate: {
      id: "upd_1",
      text: "⚡ Big update: Carousel audio and multi-video 90s reels are now live for all creators worldwide! How do you plan to use them?",
      timestamp: "2h ago",
      poll: {
        question: "Which new format are you most excited to create?",
        options: [
          { text: "90s Vertical Reels with Music", votes: 1420, userVoted: true },
          { text: "Swipeable Photo Carousels", votes: 890 },
          { text: "Live Streams with Co-hosts", votes: 610 },
          { text: "24h Notes with Audio", votes: 430 },
        ],
        totalVotes: 3350,
      },
      reactions: [
        { emoji: "🔥", count: 428, userReacted: true },
        { emoji: "❤️", count: 312 },
        { emoji: "🚀", count: 580 },
        { emoji: "👏", count: 195 },
      ],
    },
  },
  {
    id: "chan_tech_radar",
    title: "Aesthetic Tech & Setups",
    handle: "tech_radar",
    creatorName: "Aarav Desai",
    creatorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80",
    description:
      "Curated workspace builds, mechanical keyboards, software engineering tools, and clean desk setups.",
    membersCount: 22400,
    isJoined: false,
    verified: true,
    category: "Technology",
    latestUpdate: {
      id: "upd_2",
      text: "Drafting the 2026 Minimalist Developer Desk tour. Dropping high-res photos and gear links right here at 6 PM IST!",
      timestamp: "5h ago",
      reactions: [
        { emoji: "⚡", count: 184 },
        { emoji: "💻", count: 240 },
        { emoji: "🙌", count: 96 },
      ],
    },
  },
  {
    id: "chan_visual_journal",
    title: "Visual Design Notes",
    handle: "design_notes",
    creatorName: "Maya Lin",
    creatorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80",
    description:
      "Daily typography pairings, color palette experiments, layout math, and architectural photography.",
    membersCount: 16800,
    isJoined: false,
    verified: false,
    category: "Design",
    latestUpdate: {
      id: "upd_3",
      text: "Golden ratio typography scales vs 1.25 Major Third: why subtle step ratios create significantly cleaner mobile interfaces.",
      timestamp: "Yesterday",
      reactions: [
        { emoji: "✨", count: 310 },
        { emoji: "🎯", count: 175 },
      ],
    },
  },
];

// Local state helpers with storage resilience
export function getSavedNotes(): DMNote[] {
  if (typeof window === "undefined") return INITIAL_NOTES;
  try {
    const raw = localStorage.getItem("opexnal_dm_notes");
    if (!raw) return INITIAL_NOTES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_NOTES;
  } catch {
    return INITIAL_NOTES;
  }
}

export function saveUserNote(note: DMNote): DMNote[] {
  const current = getSavedNotes().filter((n) => n.userId !== note.userId);
  const updated = [note, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("opexnal_dm_notes", JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return updated;
}

export function getSavedChannels(): BroadcastChannel[] {
  if (typeof window === "undefined") return INITIAL_CHANNELS;
  try {
    const raw = localStorage.getItem("opexnal_broadcast_channels");
    if (!raw) return INITIAL_CHANNELS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CHANNELS;
  } catch {
    return INITIAL_CHANNELS;
  }
}

export function toggleChannelJoin(channelId: string): BroadcastChannel[] {
  const channels = getSavedChannels().map((ch) => {
    if (ch.id === channelId) {
      const nextJoined = !ch.isJoined;
      return {
        ...ch,
        isJoined: nextJoined,
        membersCount: ch.membersCount + (nextJoined ? 1 : -1),
      };
    }
    return ch;
  });
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("opexnal_broadcast_channels", JSON.stringify(channels));
    } catch {
      // ignore
    }
  }
  return channels;
}

export function voteChannelPoll(channelId: string, optionIndex: number): BroadcastChannel[] {
  const channels = getSavedChannels().map((ch) => {
    if (ch.id === channelId && ch.latestUpdate.poll) {
      const poll = ch.latestUpdate.poll;
      const opts = poll.options.map((opt, idx) => {
        if (idx === optionIndex && !opt.userVoted) {
          return { ...opt, votes: opt.votes + 1, userVoted: true };
        }
        return opt;
      });
      return {
        ...ch,
        latestUpdate: {
          ...ch.latestUpdate,
          poll: {
            ...poll,
            options: opts,
            totalVotes: poll.totalVotes + 1,
          },
        },
      };
    }
    return ch;
  });
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("opexnal_broadcast_channels", JSON.stringify(channels));
    } catch {
      // ignore
    }
  }
  return channels;
}

export function getWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("opexnal_wishlist_ids");
    return raw ? JSON.parse(raw) : ["prod_1"];
  } catch {
    return ["prod_1"];
  }
}

export function getWishlistProducts(): ProductItem[] {
  const ids = getWishlist();
  return CURATED_SHOPPING_CATALOG.filter((p) => ids.includes(p.id));
}

export function toggleWishlistItem(productId: string): string[] {
  const list = getWishlist();
  const exists = list.includes(productId);
  const updated = exists ? list.filter((id) => id !== productId) : [...list, productId];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("opexnal_wishlist_ids", JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return updated;
}

export function getFavoritesFeedList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("opexnal_feed_favorites");
    return raw ? JSON.parse(raw) : ["aanya_design", "rohan_sharma", "priya_art"];
  } catch {
    return ["aanya_design", "rohan_sharma", "priya_art"];
  }
}

export function toggleFavoriteCreator(username: string): string[] {
  const current = getFavoritesFeedList();
  const updated = current.includes(username)
    ? current.filter((u) => u !== username)
    : [...current, username];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("opexnal_feed_favorites", JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return updated;
}

// Simple synthesizer for audio preview without external asset dependencies
let audioCtx: AudioContext | null = null;
let currentOsc: OscillatorNode | null = null;
let currentGain: GainNode | null = null;

export function playSynthPreview(freq = 440, onStop?: () => void) {
  stopSynthPreview();
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Warm chord effect
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    currentOsc = osc;
    currentGain = gain;

    setTimeout(() => {
      stopSynthPreview();
      onStop?.();
    }, 3600);
  } catch {
    // Web audio not supported in current environment
  }
}

export function stopSynthPreview() {
  try {
    if (currentOsc) {
      currentOsc.stop();
      currentOsc.disconnect();
      currentOsc = null;
    }
    if (audioCtx && audioCtx.state !== "closed") {
      audioCtx.close().catch(() => undefined);
      audioCtx = null;
    }
  } catch {
    // ignore
  }
}
