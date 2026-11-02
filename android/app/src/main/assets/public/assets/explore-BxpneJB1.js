import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { n as r, t as i } from "./createLucideIcon-DgzBSI1Z.js";
import { t as a } from "./client-CNuAEkjg.js";
import { j as ee } from "./removable-Bti6oWPM.js";
import { t as o } from "./useQuery-Sthak1vL.js";
import { t as te } from "./grid-3x3-CKCl9sVb.js";
import { t as s } from "./hash-Dy8_d-Qs.js";
import { t as ne } from "./history-DBuwN939.js";
import { t as c } from "./loader-circle-CbE-4Efj.js";
import { t as l } from "./map-pin-B24Bgmng.js";
import { t as u } from "./music-qVA_D1c0.js";
import { t as d } from "./play-BxKOOuxW.js";
import { t as re } from "./user-plus-BKH1pxu8.js";
import { t as f } from "./x-CeqC2pJc.js";
import { t as ie } from "./utils-DojpP95n.js";
import {
  C as ae,
  E as p,
  H as m,
  O as oe,
  P as h,
  Q as se,
  R as g,
  S as _,
  T as v,
  U as y,
  Z as ce,
  _ as b,
  b as x,
  lt as S,
  nt as C,
  st as w,
  u as le,
  v as T,
  w as E,
  x as D,
  y as O,
} from "./index-BPJbQuiK.js";
import { i as k } from "./profile-qFNPerqP.js";
import { t as A } from "./avatar-ECPYu-KR.js";
import { o as ue } from "./posts-CfzQybWe.js";
import { t as j } from "./use-signed-media-url-D4B_BLP0.js";
var de = i(`flame`, [
    [
      `path`,
      {
        d: `M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4`,
        key: `1slcih`,
      },
    ],
  ]),
  M = t(e()),
  N = n(),
  P = [
    { tag: `opexnal`, posts: `12.4K`, category: `Community` },
    { tag: `creatorlife`, posts: `8.9K`, category: `Lifestyle` },
    { tag: `aesthetics`, posts: `24.1K`, category: `Design` },
    { tag: `techvibes`, posts: `6.2K`, category: `Tech` },
    { tag: `buildinpublic`, posts: `15.8K`, category: `Startup` },
    { tag: `reelsindia`, posts: `32.0K`, category: `Video` },
    { tag: `streetphotography`, posts: `18.3K`, category: `Photography` },
    { tag: `minimalism`, posts: `9.5K`, category: `Art` },
  ],
  F = [
    { id: `a1`, title: `Aesthetic Lo-Fi Beats`, artist: `Opexnal Sound Lab`, reelsCount: `42.8K` },
    { id: `a2`, title: `Chill Synthwave Sunset`, artist: `Retro Vibes`, reelsCount: `19.3K` },
    { id: `a3`, title: `Golden Hour Acoustic`, artist: `Priya Roy`, reelsCount: `8.6K` },
    { id: `a4`, title: `Cyber City Ambient`, artist: `Tech Collective`, reelsCount: `14.1K` },
  ],
  I = [
    { id: `p1`, name: `Bandra Bandstand`, city: `Mumbai, India`, postsCount: `34.5K` },
    { id: `p2`, name: `Indiranagar 100ft Road`, city: `Bengaluru, India`, postsCount: `28.1K` },
    { id: `p3`, name: `Connaught Place`, city: `New Delhi, India`, postsCount: `52.4K` },
    { id: `p4`, name: `Dumbo Brooklyn`, city: `New York, USA`, postsCount: `120.8K` },
  ];
function L() {
  let { user: e } = le(),
    t = ee(),
    [n, i] = (0, M.useState)(``),
    [y, j] = (0, M.useState)(`trending`),
    [L, B] = (0, M.useState)(null),
    [V, H] = (0, M.useState)(null),
    [U, W] = (0, M.useState)(() => {
      if (typeof window > `u`) return [`maya_codes`, `aesthetics`, `creatorlife`, `reelsindia`];
      try {
        let e = localStorage.getItem(`opexnal_recent_searches`);
        return e ? JSON.parse(e) : [`maya_codes`, `aesthetics`, `creatorlife`, `reelsindia`];
      } catch {
        return [`maya_codes`, `aesthetics`, `creatorlife`, `reelsindia`];
      }
    }),
    G = (e) => {
      let t = e.trim();
      t &&
        W((e) => {
          let n = [t, ...e.filter((e) => e.toLowerCase() !== t.toLowerCase())].slice(0, 8);
          try {
            localStorage.setItem(`opexnal_recent_searches`, JSON.stringify(n));
          } catch {}
          return n;
        });
    },
    K = () => {
      W([]);
      try {
        localStorage.removeItem(`opexnal_recent_searches`);
      } catch {}
    },
    q = n.trim().toLowerCase(),
    J = o({
      queryKey: [`search-people`, q],
      enabled: q.length >= 1,
      queryFn: async () => {
        let { data: e, error: t } = await a
          .from(`profiles`)
          .select(
            `id, username, display_name, avatar_url, is_verified, is_private, followers_count, bio`,
          )
          .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
          .eq(`is_deactivated`, !1)
          .order(`followers_count`, { ascending: !1 })
          .limit(20);
        if (t) throw t;
        return e || [];
      },
    }),
    Y = o({ queryKey: [`explore-feed`, e?.id], queryFn: () => ue(e?.id ?? null) }),
    X = o({
      queryKey: [`suggested-creators`, e?.id],
      queryFn: async () => {
        let { data: t, error: n } = await a
          .from(`profiles`)
          .select(
            `id, username, display_name, avatar_url, is_verified, is_private, followers_count`,
          )
          .eq(`is_deactivated`, !1)
          .order(`followers_count`, { ascending: !1 })
          .limit(10);
        if (n) throw n;
        return (t || []).filter((t) => t.id !== e?.id);
      },
    }),
    Z = Y.data || [],
    Q = Z.filter((e) => e.media.some((e) => e.media_type === `video`));
  async function $(n, r) {
    if (e)
      try {
        let { data: e, error: i } = await a.rpc(`request_follow`, { _target_id: n });
        if (i) {
          S.error(i.message || `Follow failed`);
          return;
        }
        (S.success(e === `requested` ? `Follow request sent` : `Following @${r}`),
          t.invalidateQueries({ queryKey: [`suggested-creators`] }),
          t.invalidateQueries({ queryKey: [`search-people`] }));
      } catch {
        S.error(`Could not complete follow action`);
      }
  }
  let fe = (e) => {
    i(e);
  };
  return (0, N.jsxs)(v, {
    header: (0, N.jsx)(p, {
      title: `Explore`,
      right: (0, N.jsxs)(r, {
        to: `/ai`,
        "aria-label": `Opexnal AI Studio`,
        className: `flex items-center gap-1 text-xs font-semibold text-primary hover:underline`,
        children: [(0, N.jsx)(h, { className: `h-4 w-4 text-primary` }), `AI Studio`],
      }),
    }),
    children: [
      (0, N.jsxs)(`div`, {
        className: `px-3 sm:px-4 py-3 space-y-3.5 max-w-lg mx-auto`,
        children: [
          (0, N.jsxs)(`div`, {
            className: `relative`,
            children: [
              (0, N.jsx)(g, {
                className: `pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`,
                "aria-hidden": `true`,
              }),
              (0, N.jsx)(ae, {
                value: n,
                onChange: (e) => i(e.target.value),
                placeholder: `Search creators, hashtags, audio, places...`,
                "aria-label": `Search Opexnal`,
                maxLength: 60,
                className: `h-11 rounded-2xl bg-surface pl-10 pr-9 text-xs sm:text-sm placeholder:text-muted-foreground`,
              }),
              n &&
                (0, N.jsx)(`button`, {
                  type: `button`,
                  onClick: () => i(``),
                  className: `absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground`,
                  children: (0, N.jsx)(f, { className: `h-4 w-4` }),
                }),
            ],
          }),
          !q &&
            U.length > 0 &&
            (0, N.jsxs)(`div`, {
              className: `space-y-1.5`,
              children: [
                (0, N.jsxs)(`div`, {
                  className: `flex items-center justify-between text-xs`,
                  children: [
                    (0, N.jsxs)(`span`, {
                      className: `font-semibold text-muted-foreground flex items-center gap-1.5`,
                      children: [(0, N.jsx)(ne, { className: `h-3.5 w-3.5` }), ` Recent Searches`],
                    }),
                    (0, N.jsx)(`button`, {
                      type: `button`,
                      onClick: K,
                      className: `text-primary hover:underline text-[11px] font-medium`,
                      children: `Clear all`,
                    }),
                  ],
                }),
                (0, N.jsx)(`div`, {
                  className: `flex flex-wrap gap-1.5`,
                  children: U.map((e) =>
                    (0, N.jsx)(
                      `button`,
                      {
                        type: `button`,
                        onClick: () => i(e),
                        className: `rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-foreground hover:bg-secondary hover:border-primary/40 transition-colors`,
                        children: e.startsWith(`#`) ? e : `@${e}`,
                      },
                      e,
                    ),
                  ),
                }),
              ],
            }),
          !q &&
            (0, N.jsx)(`div`, {
              className: `flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar`,
              children: [
                { id: `trending`, label: `Top`, icon: de },
                { id: `people`, label: `Accounts`, icon: oe },
                { id: `reels`, label: `Reels`, icon: se },
                { id: `audio`, label: `Audio`, icon: u },
                { id: `tags`, label: `Hashtags`, icon: s },
                { id: `places`, label: `Places`, icon: l },
              ].map((e) => {
                let t = e.icon,
                  n = y === e.id;
                return (0, N.jsxs)(
                  `button`,
                  {
                    type: `button`,
                    onClick: () => j(e.id),
                    className: ie(
                      `flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border`,
                      n
                        ? `brand-gradient-bg text-primary-foreground border-primary shadow-xs`
                        : `bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-secondary`,
                    ),
                    children: [(0, N.jsx)(t, { className: `h-3.5 w-3.5` }), e.label],
                  },
                  e.id,
                );
              }),
            }),
          !q &&
            U.length > 0 &&
            y === `trending` &&
            (0, N.jsxs)(`div`, {
              className: `p-3 bg-card border border-border rounded-2xl space-y-2`,
              children: [
                (0, N.jsxs)(`div`, {
                  className: `flex items-center justify-between`,
                  children: [
                    (0, N.jsxs)(`span`, {
                      className: `text-xs font-bold text-muted-foreground flex items-center gap-1`,
                      children: [(0, N.jsx)(ce, { className: `h-3.5 w-3.5` }), ` Recent Searches`],
                    }),
                    (0, N.jsx)(`button`, {
                      type: `button`,
                      onClick: () => {
                        (W([]), S.success(`Recent searches cleared`));
                      },
                      className: `text-[11px] text-primary hover:underline`,
                      children: `Clear all`,
                    }),
                  ],
                }),
                (0, N.jsx)(`div`, {
                  className: `flex flex-wrap gap-1.5`,
                  children: U.map((e) =>
                    (0, N.jsxs)(
                      _,
                      {
                        variant: `secondary`,
                        onClick: () => fe(e),
                        className: `cursor-pointer text-[11px] py-1 px-2.5 hover:bg-secondary flex items-center gap-1`,
                        children: [
                          (0, N.jsx)(`span`, { children: e }),
                          (0, N.jsx)(f, {
                            className: `h-3 w-3 text-muted-foreground hover:text-foreground ml-0.5`,
                            onClick: (t) => {
                              (t.stopPropagation(), W((t) => t.filter((t) => t !== e)));
                            },
                          }),
                        ],
                      },
                      e,
                    ),
                  ),
                }),
              ],
            }),
          q.length >= 1
            ? (0, N.jsxs)(`div`, {
                className: `space-y-4`,
                children: [
                  (0, N.jsxs)(`div`, {
                    className: `flex items-center justify-between`,
                    children: [
                      (0, N.jsxs)(`h2`, {
                        className: `text-xs font-semibold uppercase tracking-wider text-muted-foreground`,
                        children: [`Search Results for "`, q, `"`],
                      }),
                      J.isFetching &&
                        (0, N.jsx)(c, { className: `h-3.5 w-3.5 animate-spin text-primary` }),
                    ],
                  }),
                  (0, N.jsxs)(r, {
                    to: `/tag/$tag`,
                    params: { tag: q.replace(/^#/, ``) },
                    onClick: () => G(`#${q.replace(/^#/, ``)}`),
                    className: `flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3 transition-colors hover:bg-primary/10`,
                    children: [
                      (0, N.jsx)(`div`, {
                        className: `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl brand-gradient-bg text-primary-foreground`,
                        children: (0, N.jsx)(s, { className: `h-5 w-5` }),
                      }),
                      (0, N.jsxs)(`div`, {
                        className: `min-w-0 flex-1`,
                        children: [
                          (0, N.jsxs)(`p`, {
                            className: `font-semibold text-sm text-foreground`,
                            children: [`#`, q.replace(/^#/, ``)],
                          }),
                          (0, N.jsxs)(`p`, {
                            className: `text-xs text-muted-foreground`,
                            children: [`Explore posts tagged #`, q.replace(/^#/, ``)],
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, N.jsxs)(`div`, {
                    className: `space-y-1`,
                    children: [
                      J.data?.length === 0 &&
                        (0, N.jsxs)(`p`, {
                          className: `py-12 text-center text-xs text-muted-foreground`,
                          children: [`No accounts found matching "`, q, `".`],
                        }),
                      J.data?.map((t) =>
                        (0, N.jsxs)(
                          `div`,
                          {
                            className: `flex items-center justify-between gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/60`,
                            children: [
                              (0, N.jsxs)(r, {
                                to: `/u/$username`,
                                params: { username: t.username },
                                onClick: () => G(t.username),
                                className: `flex min-w-0 flex-1 items-center gap-3`,
                                children: [
                                  (0, N.jsx)(A, {
                                    path: t.avatar_url,
                                    fallback: k(t),
                                    className: `h-11 w-11`,
                                  }),
                                  (0, N.jsxs)(`div`, {
                                    className: `min-w-0`,
                                    children: [
                                      (0, N.jsxs)(`p`, {
                                        className: `flex items-center gap-1 truncate text-sm font-semibold`,
                                        children: [
                                          `@`,
                                          t.username,
                                          t.is_verified &&
                                            (0, N.jsx)(w, {
                                              className: `h-3.5 w-3.5 text-primary`,
                                              "aria-label": `Verified`,
                                            }),
                                          t.is_private &&
                                            (0, N.jsx)(m, {
                                              className: `h-3 w-3 text-muted-foreground`,
                                              "aria-label": `Private`,
                                            }),
                                        ],
                                      }),
                                      (0, N.jsxs)(`p`, {
                                        className: `truncate text-xs text-muted-foreground`,
                                        children: [
                                          t.display_name || `Opexnal member`,
                                          t.followers_count > 0 &&
                                            ` • ${t.followers_count} followers`,
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              e &&
                                e.id !== t.id &&
                                (0, N.jsxs)(E, {
                                  size: `sm`,
                                  variant: `outline`,
                                  onClick: () => $(t.id, t.username),
                                  className: `h-8 rounded-lg text-xs font-semibold hover:border-primary hover:text-primary`,
                                  children: [
                                    (0, N.jsx)(re, { className: `mr-1 h-3.5 w-3.5` }),
                                    `Follow`,
                                  ],
                                }),
                            ],
                          },
                          t.id,
                        ),
                      ),
                    ],
                  }),
                ],
              })
            : (0, N.jsxs)(N.Fragment, {
                children: [
                  y === `trending` &&
                    (0, N.jsxs)(`div`, {
                      className: `space-y-5`,
                      children: [
                        (0, N.jsxs)(`div`, {
                          className: `space-y-2`,
                          children: [
                            (0, N.jsxs)(`div`, {
                              className: `flex items-center justify-between`,
                              children: [
                                (0, N.jsxs)(`h2`, {
                                  className: `text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5`,
                                  children: [
                                    (0, N.jsx)(h, { className: `h-3.5 w-3.5 text-primary` }),
                                    ` Suggested Creators`,
                                  ],
                                }),
                                (0, N.jsx)(`button`, {
                                  type: `button`,
                                  onClick: () => j(`people`),
                                  className: `text-xs font-semibold text-primary hover:underline`,
                                  children: `See All`,
                                }),
                              ],
                            }),
                            (0, N.jsx)(`div`, {
                              className: `flex gap-2.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar`,
                              children: X.data
                                ?.slice(0, 6)
                                .map((e) =>
                                  (0, N.jsxs)(
                                    `div`,
                                    {
                                      className: `flex w-32 shrink-0 flex-col items-center rounded-2xl border border-border bg-surface p-3 text-center shadow-xs`,
                                      children: [
                                        (0, N.jsx)(r, {
                                          to: `/u/$username`,
                                          params: { username: e.username },
                                          children: (0, N.jsx)(A, {
                                            path: e.avatar_url,
                                            fallback: k(e),
                                            className: `h-12 w-12 text-sm ring-2 ring-primary/20`,
                                          }),
                                        }),
                                        (0, N.jsxs)(`p`, {
                                          className: `mt-2 truncate w-full text-xs font-semibold flex items-center justify-center gap-0.5`,
                                          children: [
                                            `@`,
                                            e.username,
                                            e.is_verified &&
                                              (0, N.jsx)(w, {
                                                className: `h-3 w-3 text-primary shrink-0`,
                                              }),
                                          ],
                                        }),
                                        (0, N.jsxs)(`p`, {
                                          className: `text-[10px] text-muted-foreground truncate w-full`,
                                          children: [e.followers_count, ` followers`],
                                        }),
                                        (0, N.jsx)(E, {
                                          size: `sm`,
                                          onClick: () => $(e.id, e.username),
                                          className: `mt-2.5 h-7 w-full rounded-lg text-[11px] font-semibold brand-gradient-bg text-primary-foreground`,
                                          children: `Follow`,
                                        }),
                                      ],
                                    },
                                    e.id,
                                  ),
                                ),
                            }),
                          ],
                        }),
                        (0, N.jsxs)(`div`, {
                          className: `space-y-2`,
                          children: [
                            (0, N.jsx)(`div`, {
                              className: `flex items-center justify-between`,
                              children: (0, N.jsxs)(`h2`, {
                                className: `text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5`,
                                children: [
                                  (0, N.jsx)(te, { className: `h-3.5 w-3.5 text-primary` }),
                                  ` Discover Posts`,
                                ],
                              }),
                            }),
                            Y.isLoading
                              ? (0, N.jsx)(`div`, {
                                  className: `flex justify-center py-16`,
                                  children: (0, N.jsx)(c, {
                                    className: `h-6 w-6 animate-spin text-primary`,
                                  }),
                                })
                              : Z.length === 0
                                ? (0, N.jsx)(`div`, {
                                    className: `py-12 text-center text-xs text-muted-foreground`,
                                    children: `No explore posts yet. Be the first to publish!`,
                                  })
                                : (0, N.jsx)(`div`, {
                                    className: `grid grid-cols-3 gap-0.5 rounded-2xl overflow-hidden`,
                                    children: Z.map((e) => (0, N.jsx)(R, { post: e }, e.id)),
                                  }),
                          ],
                        }),
                      ],
                    }),
                  y === `people` &&
                    (0, N.jsxs)(`div`, {
                      className: `space-y-2`,
                      children: [
                        (0, N.jsx)(`h2`, {
                          className: `text-xs font-semibold uppercase tracking-wider text-muted-foreground`,
                          children: `Suggested Accounts`,
                        }),
                        (0, N.jsx)(`div`, {
                          className: `divide-y divide-border rounded-2xl border border-border bg-surface`,
                          children: X.data?.map((e) =>
                            (0, N.jsxs)(
                              `div`,
                              {
                                className: `flex items-center justify-between p-3 transition-colors hover:bg-secondary/40`,
                                children: [
                                  (0, N.jsxs)(r, {
                                    to: `/u/$username`,
                                    params: { username: e.username },
                                    className: `flex min-w-0 flex-1 items-center gap-3`,
                                    children: [
                                      (0, N.jsx)(A, {
                                        path: e.avatar_url,
                                        fallback: k(e),
                                        className: `h-10 w-10`,
                                      }),
                                      (0, N.jsxs)(`div`, {
                                        className: `min-w-0`,
                                        children: [
                                          (0, N.jsxs)(`p`, {
                                            className: `flex items-center gap-1 truncate text-xs font-semibold text-foreground`,
                                            children: [
                                              `@`,
                                              e.username,
                                              e.is_verified &&
                                                (0, N.jsx)(w, {
                                                  className: `h-3 w-3 text-primary`,
                                                  "aria-label": `Verified`,
                                                }),
                                            ],
                                          }),
                                          (0, N.jsxs)(`p`, {
                                            className: `truncate text-[11px] text-muted-foreground`,
                                            children: [e.followers_count, ` followers`],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, N.jsx)(E, {
                                    size: `sm`,
                                    onClick: () => $(e.id, e.username),
                                    className: `h-7 rounded-lg text-xs font-semibold brand-gradient-bg text-primary-foreground`,
                                    children: `Follow`,
                                  }),
                                ],
                              },
                              e.id,
                            ),
                          ),
                        }),
                      ],
                    }),
                  y === `reels` &&
                    (0, N.jsxs)(`div`, {
                      className: `space-y-3`,
                      children: [
                        (0, N.jsx)(`h2`, {
                          className: `text-xs font-semibold uppercase tracking-wider text-muted-foreground`,
                          children: `Trending Reels`,
                        }),
                        Q.length === 0
                          ? (0, N.jsx)(`div`, {
                              className: `py-16 text-center text-xs text-muted-foreground`,
                              children: `No vertical video reels available. Tap “Create” to share one!`,
                            })
                          : (0, N.jsx)(`div`, {
                              className: `grid grid-cols-2 gap-2`,
                              children: Q.map((e) =>
                                (0, N.jsxs)(
                                  r,
                                  {
                                    to: `/p/$postId`,
                                    params: { postId: e.id },
                                    className: `group relative aspect-9/16 overflow-hidden rounded-2xl bg-zinc-900 shadow-xs`,
                                    children: [
                                      (0, N.jsx)(z, { post: e }),
                                      (0, N.jsxs)(`div`, {
                                        className: `absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5`,
                                        children: [
                                          (0, N.jsxs)(`p`, {
                                            className: `text-xs font-semibold text-white truncate`,
                                            children: [`@`, e.author?.username],
                                          }),
                                          (0, N.jsx)(`p`, {
                                            className: `text-[10px] text-white/80 line-clamp-1`,
                                            children: e.caption || `Opexnal Reel`,
                                          }),
                                          (0, N.jsxs)(`div`, {
                                            className: `flex items-center gap-1 text-[10px] text-white/70 mt-0.5`,
                                            children: [
                                              (0, N.jsx)(d, {
                                                className: `h-2.5 w-2.5 fill-white text-white`,
                                              }),
                                              (0, N.jsxs)(`span`, {
                                                children: [e.likes_count, ` likes`],
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  },
                                  e.id,
                                ),
                              ),
                            }),
                      ],
                    }),
                  y === `audio` &&
                    (0, N.jsxs)(`div`, {
                      className: `space-y-3`,
                      children: [
                        (0, N.jsx)(`h2`, {
                          className: `text-xs font-semibold uppercase tracking-wider text-muted-foreground`,
                          children: `Trending Audio & Music`,
                        }),
                        (0, N.jsx)(`div`, {
                          className: `space-y-2`,
                          children: F.map((e) =>
                            (0, N.jsxs)(
                              `div`,
                              {
                                onClick: () => B(e),
                                className: `p-3.5 bg-card border border-border rounded-2xl flex items-center justify-between hover:bg-surface cursor-pointer shadow-xs transition-colors`,
                                children: [
                                  (0, N.jsxs)(`div`, {
                                    className: `flex items-center gap-3`,
                                    children: [
                                      (0, N.jsx)(`div`, {
                                        className: `h-10 w-10 rounded-xl brand-gradient-bg flex items-center justify-center text-white`,
                                        children: (0, N.jsx)(u, { className: `h-5 w-5` }),
                                      }),
                                      (0, N.jsxs)(`div`, {
                                        children: [
                                          (0, N.jsx)(`p`, {
                                            className: `text-xs font-bold text-foreground`,
                                            children: e.title,
                                          }),
                                          (0, N.jsx)(`p`, {
                                            className: `text-[11px] text-muted-foreground`,
                                            children: e.artist,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, N.jsxs)(`div`, {
                                    className: `flex items-center gap-2`,
                                    children: [
                                      (0, N.jsxs)(`span`, {
                                        className: `text-[11px] text-muted-foreground`,
                                        children: [e.reelsCount, ` reels`],
                                      }),
                                      (0, N.jsx)(C, { className: `h-4 w-4 text-muted-foreground` }),
                                    ],
                                  }),
                                ],
                              },
                              e.id,
                            ),
                          ),
                        }),
                      ],
                    }),
                  y === `tags` &&
                    (0, N.jsxs)(`div`, {
                      className: `space-y-2`,
                      children: [
                        (0, N.jsx)(`h2`, {
                          className: `text-xs font-semibold uppercase tracking-wider text-muted-foreground`,
                          children: `Popular Hashtags`,
                        }),
                        (0, N.jsx)(`div`, {
                          className: `space-y-1.5`,
                          children: P.map((e) =>
                            (0, N.jsxs)(
                              r,
                              {
                                to: `/tag/$tag`,
                                params: { tag: e.tag },
                                className: `flex items-center justify-between rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-secondary`,
                                children: [
                                  (0, N.jsxs)(`div`, {
                                    className: `flex items-center gap-3`,
                                    children: [
                                      (0, N.jsx)(`div`, {
                                        className: `flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary`,
                                        children: (0, N.jsx)(s, { className: `h-4 w-4` }),
                                      }),
                                      (0, N.jsxs)(`div`, {
                                        children: [
                                          (0, N.jsxs)(`p`, {
                                            className: `text-xs font-semibold text-foreground`,
                                            children: [`#`, e.tag],
                                          }),
                                          (0, N.jsxs)(`p`, {
                                            className: `text-[10px] text-muted-foreground`,
                                            children: [e.category, ` Category`],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, N.jsxs)(`span`, {
                                    className: `text-xs font-semibold text-primary`,
                                    children: [e.posts, ` posts`],
                                  }),
                                ],
                              },
                              e.tag,
                            ),
                          ),
                        }),
                      ],
                    }),
                  y === `places` &&
                    (0, N.jsxs)(`div`, {
                      className: `space-y-2`,
                      children: [
                        (0, N.jsx)(`h2`, {
                          className: `text-xs font-semibold uppercase tracking-wider text-muted-foreground`,
                          children: `Trending Places & Locations`,
                        }),
                        (0, N.jsx)(`div`, {
                          className: `space-y-2`,
                          children: I.map((e) =>
                            (0, N.jsxs)(
                              `div`,
                              {
                                onClick: () => H(e),
                                className: `p-3.5 bg-card border border-border rounded-2xl flex items-center justify-between hover:bg-surface cursor-pointer shadow-xs transition-colors`,
                                children: [
                                  (0, N.jsxs)(`div`, {
                                    className: `flex items-center gap-3`,
                                    children: [
                                      (0, N.jsx)(`div`, {
                                        className: `h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center`,
                                        children: (0, N.jsx)(l, { className: `h-5 w-5` }),
                                      }),
                                      (0, N.jsxs)(`div`, {
                                        children: [
                                          (0, N.jsx)(`p`, {
                                            className: `text-xs font-bold text-foreground`,
                                            children: e.name,
                                          }),
                                          (0, N.jsx)(`p`, {
                                            className: `text-[11px] text-muted-foreground`,
                                            children: e.city,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, N.jsxs)(`div`, {
                                    className: `flex items-center gap-2`,
                                    children: [
                                      (0, N.jsxs)(`span`, {
                                        className: `text-[11px] text-muted-foreground`,
                                        children: [e.postsCount, ` posts`],
                                      }),
                                      (0, N.jsx)(C, { className: `h-4 w-4 text-muted-foreground` }),
                                    ],
                                  }),
                                ],
                              },
                              e.id,
                            ),
                          ),
                        }),
                      ],
                    }),
                ],
              }),
        ],
      }),
      (0, N.jsx)(b, {
        open: !!L,
        onOpenChange: () => B(null),
        children: (0, N.jsxs)(T, {
          className: `max-w-xs rounded-3xl p-5 bg-card border-border`,
          children: [
            (0, N.jsxs)(x, {
              children: [
                (0, N.jsxs)(D, {
                  className: `text-sm font-bold flex items-center gap-2`,
                  children: [(0, N.jsx)(u, { className: `h-4 w-4 text-primary` }), L?.title],
                }),
                (0, N.jsxs)(O, {
                  className: `text-xs text-muted-foreground pt-1`,
                  children: [
                    `By `,
                    L?.artist,
                    ` • `,
                    L?.reelsCount,
                    ` reels created with this audio`,
                  ],
                }),
              ],
            }),
            (0, N.jsxs)(`div`, {
              className: `flex gap-2 pt-3`,
              children: [
                (0, N.jsx)(E, {
                  variant: `surface`,
                  onClick: () => B(null),
                  className: `flex-1 text-xs rounded-xl`,
                  children: `Close`,
                }),
                (0, N.jsx)(E, {
                  asChild: !0,
                  className: `flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold`,
                  children: (0, N.jsx)(r, { to: `/create`, children: `Use in Reel` }),
                }),
              ],
            }),
          ],
        }),
      }),
      (0, N.jsx)(b, {
        open: !!V,
        onOpenChange: () => H(null),
        children: (0, N.jsxs)(T, {
          className: `max-w-xs rounded-3xl p-5 bg-card border-border`,
          children: [
            (0, N.jsxs)(x, {
              children: [
                (0, N.jsxs)(D, {
                  className: `text-sm font-bold flex items-center gap-2`,
                  children: [(0, N.jsx)(l, { className: `h-4 w-4 text-emerald-400` }), V?.name],
                }),
                (0, N.jsxs)(O, {
                  className: `text-xs text-muted-foreground pt-1`,
                  children: [V?.city, ` • `, V?.postsCount, ` photos & stories tagged here`],
                }),
              ],
            }),
            (0, N.jsxs)(`div`, {
              className: `flex gap-2 pt-3`,
              children: [
                (0, N.jsx)(E, {
                  variant: `surface`,
                  onClick: () => H(null),
                  className: `flex-1 text-xs rounded-xl`,
                  children: `Close`,
                }),
                (0, N.jsx)(E, {
                  asChild: !0,
                  className: `flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold`,
                  children: (0, N.jsx)(r, { to: `/create`, children: `Tag in Post` }),
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
function R({ post: e }) {
  let t = e.media[0],
    n = j(t?.storage_path),
    i = t?.media_type === `video`,
    a = e.media.length > 1;
  return (0, N.jsxs)(r, {
    to: `/p/$postId`,
    params: { postId: e.id },
    className: `group relative aspect-square overflow-hidden bg-secondary transition-opacity hover:opacity-90`,
    children: [
      n
        ? i
          ? (0, N.jsx)(`video`, {
              src: n,
              className: `h-full w-full object-cover`,
              muted: !0,
              playsInline: !0,
            })
          : (0, N.jsx)(`img`, {
              src: n,
              alt: e.caption || `Explore post`,
              className: `h-full w-full object-cover transition-transform duration-300 group-hover:scale-105`,
              loading: `lazy`,
            })
        : (0, N.jsx)(`div`, {
            className: `flex h-full w-full items-center justify-center bg-secondary`,
          }),
      i &&
        (0, N.jsx)(`div`, {
          className: `absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white backdrop-blur`,
          children: (0, N.jsx)(d, { className: `h-3 w-3 fill-white` }),
        }),
      a &&
        (0, N.jsx)(`div`, {
          className: `absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white backdrop-blur`,
          children: (0, N.jsx)(y, { className: `h-3 w-3` }),
        }),
    ],
  });
}
function z({ post: e }) {
  let t = e.media.find((e) => e.media_type === `video`),
    n = j(t?.storage_path);
  return n
    ? (0, N.jsx)(`video`, {
        src: n,
        className: `h-full w-full object-cover`,
        muted: !0,
        playsInline: !0,
      })
    : (0, N.jsx)(`div`, { className: `h-full w-full bg-secondary animate-pulse` });
}
export { L as component };
