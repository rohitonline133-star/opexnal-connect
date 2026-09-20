import { authClient } from "./auth-client";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const authHeaders = authClient.getAuthHeader();
  for (const [k, v] of Object.entries(authHeaders)) {
    if (!headers.has(k)) {
      headers.set(k, v);
    }
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = (await response.json()) as { error?: string };
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // not json
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export type GenericEntity = Record<string, unknown>;

export const apiClient = {
  posts: {
    getFeed: () => request<{ posts: GenericEntity[] }>("/api/v1/posts/feed"),
    getExplore: () => request<{ posts: GenericEntity[] }>("/api/v1/posts/explore"),
    getById: (id: string) => request<{ post: GenericEntity }>(`/api/v1/posts/${id}`),
    getByUser: (userId: string) =>
      request<{ posts: GenericEntity[] }>(`/api/v1/posts/user/${userId}`),
    create: (data: {
      caption?: string;
      mediaUrls: string[];
      locationName?: string;
      visibility?: string;
    }) =>
      request<{ post: GenericEntity }>("/api/v1/posts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/v1/posts/${id}`, { method: "DELETE" }),
    like: (id: string) =>
      request<{ success: boolean; liked: boolean }>(`/api/v1/posts/${id}/like`, { method: "POST" }),
    unlike: (id: string) =>
      request<{ success: boolean; liked: boolean }>(`/api/v1/posts/${id}/like`, {
        method: "DELETE",
      }),
    save: (id: string) =>
      request<{ success: boolean; saved: boolean }>(`/api/v1/posts/${id}/save`, { method: "POST" }),
    unsave: (id: string) =>
      request<{ success: boolean; saved: boolean }>(`/api/v1/posts/${id}/save`, {
        method: "DELETE",
      }),
  },

  reels: {
    list: () => request<{ reels: GenericEntity[] }>("/api/v1/reels"),
    getById: (id: string) => request<{ reel: GenericEntity }>(`/api/v1/reels/${id}`),
    create: (data: {
      caption?: string;
      videoUrl: string;
      thumbnailUrl?: string;
      audioTitle?: string;
      duration?: number;
    }) =>
      request<{ reel: GenericEntity }>("/api/v1/reels", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/v1/reels/${id}`, { method: "DELETE" }),
    like: (id: string) =>
      request<{ success: boolean; liked: boolean }>(`/api/v1/reels/${id}/like`, { method: "POST" }),
    unlike: (id: string) =>
      request<{ success: boolean; liked: boolean }>(`/api/v1/reels/${id}/like`, {
        method: "DELETE",
      }),
  },

  stories: {
    getTray: () => request<{ tray: GenericEntity[] }>("/api/v1/stories/tray"),
    getByUser: (userId: string) =>
      request<{ stories: GenericEntity[] }>(`/api/v1/stories/user/${userId}`),
    create: (data: { mediaUrl: string; mediaType?: string; caption?: string; audience?: string }) =>
      request<{ story: GenericEntity }>("/api/v1/stories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    recordView: (id: string) =>
      request<{ success: boolean }>(`/api/v1/stories/${id}/view`, { method: "POST" }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/v1/stories/${id}`, { method: "DELETE" }),
  },

  comments: {
    listByPost: (postId: string) =>
      request<{ comments: GenericEntity[] }>(`/api/v1/comments/post/${postId}`),
    create: (data: { postId: string; text: string; parentId?: string }) =>
      request<{ comment: GenericEntity }>("/api/v1/comments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/v1/comments/${id}`, { method: "DELETE" }),
    like: (id: string) =>
      request<{ success: boolean; liked: boolean }>(`/api/v1/comments/${id}/like`, {
        method: "POST",
      }),
    unlike: (id: string) =>
      request<{ success: boolean; liked: boolean }>(`/api/v1/comments/${id}/like`, {
        method: "DELETE",
      }),
  },

  messages: {
    listConversations: () =>
      request<{ conversations: GenericEntity[] }>("/api/v1/messages/conversations"),
    createConversation: (recipientId: string) =>
      request<{ conversation: GenericEntity }>("/api/v1/messages/conversations", {
        method: "POST",
        body: JSON.stringify({ recipientId }),
      }),
    getMessages: (conversationId: string) =>
      request<{ messages: GenericEntity[] }>(`/api/v1/messages/conversation/${conversationId}`),
    sendMessage: (data: { conversationId: string; body?: string; mediaUrl?: string }) =>
      request<{ message: GenericEntity }>("/api/v1/messages/send", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    markRead: (conversationId: string) =>
      request<{ success: boolean }>("/api/v1/messages/read", {
        method: "POST",
        body: JSON.stringify({ conversationId }),
      }),
  },

  users: {
    getProfile: (usernameOrId: string) =>
      request<{ profile: GenericEntity }>(`/api/v1/users/profile/${usernameOrId}`),
    updateProfile: (data: Record<string, unknown>) =>
      request<{ profile: GenericEntity }>("/api/v1/users/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    follow: (targetId: string) =>
      request<{ success: boolean; isFollowing: boolean }>(`/api/v1/users/follow/${targetId}`, {
        method: "POST",
      }),
    unfollow: (targetId: string) =>
      request<{ success: boolean; isFollowing: boolean }>(`/api/v1/users/follow/${targetId}`, {
        method: "DELETE",
      }),
    block: (targetId: string) =>
      request<{ success: boolean; isBlocked: boolean }>(`/api/v1/users/block/${targetId}`, {
        method: "POST",
      }),
    unblock: (targetId: string) =>
      request<{ success: boolean; isBlocked: boolean }>(`/api/v1/users/block/${targetId}`, {
        method: "DELETE",
      }),
    search: (query: string) =>
      request<{ users: GenericEntity[] }>(`/api/v1/users/search?q=${encodeURIComponent(query)}`),
  },

  settings: {
    get: () => request<{ settings: GenericEntity }>("/api/v1/settings"),
    update: (data: Record<string, unknown>) =>
      request<{ success: boolean; settings: GenericEntity }>("/api/v1/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    getSessions: () => request<{ sessions: GenericEntity[] }>("/api/v1/security/sessions"),
    revokeSession: (sessionId: string) =>
      request<{ success: boolean }>(`/api/v1/security/sessions/${sessionId}`, {
        method: "DELETE",
      }),
    revokeOtherSessions: () =>
      request<{ success: boolean; revokedCount: number }>(
        "/api/v1/security/sessions/revoke-others",
        { method: "POST" },
      ),
    triggerContainment: (reason?: string) =>
      request<{ success: boolean; message: string }>("/api/v1/security/containment", {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
  },

  storage: {
    upload: async (file: File, bucket = "post-media") => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);

      const headers = new Headers(authClient.getAuthHeader());
      const res = await fetch("/api/v1/storage/upload", {
        method: "POST",
        headers,
        body: formData,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: "Upload failed" }))) as {
          error?: string;
        };
        throw new Error(err.error || "Upload failed");
      }
      return res.json() as Promise<{ storagePath: string; publicUrl: string }>;
    },
  },
};
