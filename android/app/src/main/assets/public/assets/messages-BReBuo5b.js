import { t as e } from "./client-CNuAEkjg.js";
(new Date(Date.now() - 9e5).toISOString(), new Date(Date.now() - 72e5).toISOString());
var t = `opexnal_local_messages`,
  n = {};
function r(e) {
  let r = n[e];
  if (r) return r;
  if (typeof window > `u`) return [];
  try {
    let n = localStorage.getItem(`${t}_${e}`);
    return n ? JSON.parse(n) : [];
  } catch {
    return [];
  }
}
function i(e, i) {
  if (typeof window > `u`) {
    let t = n[e] ?? [];
    (t.push(i), (n[e] = t));
    return;
  }
  try {
    let a = r(e);
    (a.push(i), (n[e] = a), localStorage.setItem(`${t}_${e}`, JSON.stringify(a)));
  } catch {}
}
async function a(t) {
  try {
    let { data: n, error: r } = await e
      .from(`conversation_members`)
      .select(`conversation_id, last_read_at`)
      .eq(`user_id`, t);
    if (!r && n && n.length > 0) {
      let r = n,
        i = r.map((e) => e.conversation_id),
        [a, o, s] = await Promise.all([
          e.from(`conversations`).select(`id, last_message_at`).in(`id`, i),
          e
            .from(`conversation_members`)
            .select(`conversation_id, user_id`)
            .in(`conversation_id`, i),
          e
            .from(`messages`)
            .select(`conversation_id, body, created_at`)
            .in(`conversation_id`, i)
            .order(`created_at`, { ascending: !1 }),
        ]),
        c = a.data ?? [],
        l = o.data ?? [],
        u = s.data ?? [],
        d = Array.from(new Set(l.filter((e) => e.user_id !== t).map((e) => e.user_id))),
        { data: f } = d.length
          ? await e
              .from(`profiles`)
              .select(`id, username, display_name, avatar_url, is_verified`)
              .in(`id`, d)
          : { data: [] },
        p = new Map(
          (f ?? []).map((e) => [
            e.id,
            {
              id: e.id,
              username: e.username,
              display_name: e.display_name,
              avatar_url: e.avatar_url,
              is_verified: e.is_verified,
            },
          ]),
        ),
        m = new Map();
      for (let e of u)
        m.has(e.conversation_id) ||
          m.set(e.conversation_id, { body: e.body, created_at: e.created_at });
      let h = new Map(r.map((e) => [e.conversation_id, e.last_read_at]));
      return c
        .map((e) => {
          let n = m.get(e.id) ?? null,
            r = h.get(e.id);
          return {
            id: e.id,
            lastMessageAt: e.last_message_at,
            lastMessage: n?.body ?? null,
            others: l
              .filter((n) => n.conversation_id === e.id && n.user_id !== t)
              .map((e) => p.get(e.user_id))
              .filter((e) => !!e),
            unread: !!(n && r && new Date(n.created_at) > new Date(r)),
          };
        })
        .sort((e, t) => (e.lastMessageAt < t.lastMessageAt ? 1 : -1));
    }
  } catch {}
  return [];
}
async function o(t, n) {
  let { data: r } = await e.from(`conversation_members`).select(`conversation_id`).eq(`user_id`, t),
    i = (r ?? []).map((e) => e.conversation_id);
  if (i.length > 0) {
    let { data: t } = await e
        .from(`conversation_members`)
        .select(`conversation_id`)
        .eq(`user_id`, n)
        .in(`conversation_id`, i),
      r = (t ?? [])[0]?.conversation_id;
    if (r) return r;
  }
  let { data: a, error: o } = await e
    .from(`conversations`)
    .insert({ created_by: t })
    .select(`id`)
    .single();
  if (o) throw o;
  let { error: s } = await e.from(`conversation_members`).insert([
    { conversation_id: a.id, user_id: t },
    { conversation_id: a.id, user_id: n },
  ]);
  if (s) throw s;
  return a.id;
}
async function s(t) {
  try {
    let { data: n, error: r } = await e
      .from(`messages`)
      .select(`*`)
      .eq(`conversation_id`, t)
      .order(`created_at`, { ascending: !0 });
    if (!r && n) return n;
  } catch {}
  return r(t);
}
async function c(t, n) {
  try {
    let { data: r } = await e
        .from(`conversation_members`)
        .select(`user_id`)
        .eq(`conversation_id`, t),
      i = (r ?? []).map((e) => e.user_id).filter((e) => e !== n);
    if (i.length > 0) {
      let { data: t } = await e
        .from(`profiles`)
        .select(`id, username, display_name, avatar_url, is_verified`)
        .in(`id`, i);
      if (t && t.length > 0)
        return t.map((e) => ({
          id: e.id,
          username: e.username,
          display_name: e.display_name,
          avatar_url: e.avatar_url,
          is_verified: e.is_verified,
        }));
    }
  } catch {}
  return [];
}
async function l(t, n, r) {
  let a =
      typeof t == `string`
        ? { conversationId: t, senderId: n ?? ``, body: r ?? `` }
        : {
            conversationId: t.conversationId,
            senderId: `sender` in t ? t.sender : t.senderId,
            body: `text` in t ? t.text : t.body,
          },
    o = a.body.trim();
  if (!a.conversationId) throw Error(`conversationId is required`);
  if (!a.senderId) throw Error(`senderId is required`);
  if (!o) throw Error(`Message cannot be empty`);
  let s = typeof process < `u` && !0,
    c = a.senderId;
  try {
    let { data: t, error: n } = await e.auth.getUser();
    if (n || !t.user) {
      if (s) throw Error(`Authentication required`);
    } else c = t.user.id;
  } catch (e) {
    if (s) throw e;
  }
  try {
    let { data: t, error: n } = await e
      .from(`messages`)
      .insert({ conversation_id: a.conversationId, sender_id: c, body: o })
      .select(`*`)
      .single();
    if (!n && t) return { ...t, text: t.body };
  } catch {}
  let l = new Date().toISOString(),
    u = {
      id: `local_message_${Date.now()}`,
      conversation_id: a.conversationId,
      sender_id: c,
      body: o,
      created_at: l,
      text: o,
    };
  return (i(a.conversationId, u), u);
}
async function u(t, n) {
  try {
    await e
      .from(`conversation_members`)
      .update({ last_read_at: new Date().toISOString() })
      .eq(`conversation_id`, t)
      .eq(`user_id`, n);
  } catch {}
}
export { o as a, u as i, s as n, l as o, a as r, c as t };
