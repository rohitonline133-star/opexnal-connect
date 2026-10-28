/**
 * Opexnal Notes System (Instagram Notes)
 *
 * Provides 24-hour status thoughts (up to 60 characters)
 * shared with followers or close friends in the Direct Messages tray.
 */

export interface UserNote {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  text: string;
  audience: "followers" | "close_friends";
  createdAt: string;
  expiresAt: string;
}

const NOTES_STORAGE_KEY = "opexnal_user_notes";

const SEED_NOTES: UserNote[] = [
  {
    id: "note_zenith",
    userId: "user_zenith",
    username: "zenith_design",
    displayName: "Zenith Creative",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    text: "Working on 3D spatial UI 🎧",
    audience: "followers",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 22 * 3600 * 1000).toISOString(),
  },
  {
    id: "note_alex",
    userId: "user_alex",
    username: "alex_adventures",
    displayName: "Alex Rivers",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    text: "Hiking the northern glaciers 🏔️",
    audience: "followers",
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
  },
  {
    id: "note_rohit",
    userId: "user_rohit",
    username: "rohit_visuals",
    displayName: "Rohit Sharma",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    text: "Grading new anamorphic cuts 🎬",
    audience: "close_friends",
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 23 * 3600 * 1000).toISOString(),
  },
];

let inMemoryNotes: UserNote[] = [...SEED_NOTES];

export function getStoredNotes(): UserNote[] {
  if (typeof window === "undefined") {
    const now = Date.now();
    return inMemoryNotes.filter((n) => new Date(n.expiresAt).getTime() > now);
  }
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(SEED_NOTES));
      inMemoryNotes = [...SEED_NOTES];
      return SEED_NOTES;
    }
    const parsed: UserNote[] = JSON.parse(raw);
    const now = Date.now();
    // Filter out expired notes (>24h)
    const valid = parsed.filter((n) => new Date(n.expiresAt).getTime() > now);
    const result = valid.length > 0 ? valid : SEED_NOTES;
    inMemoryNotes = result;
    return result;
  } catch {
    return inMemoryNotes;
  }
}

export function saveUserNote(note: {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  text: string;
  audience?: "followers" | "close_friends";
}): UserNote {
  const all = getStoredNotes().filter((n) => n.userId !== note.userId);
  const newNote: UserNote = {
    id: `note_${note.userId}_${Date.now()}`,
    userId: note.userId,
    username: note.username,
    displayName: note.displayName,
    avatarUrl: note.avatarUrl,
    text: note.text.slice(0, 60),
    audience: note.audience || "followers",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  };

  const updated = [newNote, ...all];
  inMemoryNotes = updated;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // quota
    }
  }
  return newNote;
}

export function deleteUserNote(userId: string): void {
  const filtered = getStoredNotes().filter((n) => n.userId !== userId);
  inMemoryNotes = filtered;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // quota
    }
  }
}
