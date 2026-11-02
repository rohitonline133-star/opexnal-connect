import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { n as r, t as i } from "./createLucideIcon-DgzBSI1Z.js";
import { t as ee } from "./useNavigate-BJOrhi-q.js";
import { t as a } from "./bookmark-ClGYgWxW.js";
import { t as o } from "./ellipsis-BEtnLQCg.js";
import { t as s } from "./eye-off-BTNjnLZQ.js";
import { t as c } from "./map-pin-B24Bgmng.js";
import { t as l } from "./message-circle-KQTsD60l.js";
import { t as u } from "./sliders-vertical-BKVqb5uL.js";
import { t as d } from "./utils-DojpP95n.js";
import {
  $ as f,
  K as p,
  L as m,
  M as h,
  Z as g,
  _,
  b as v,
  ct as y,
  j as b,
  lt as x,
  m as S,
  p as C,
  q as w,
  st as T,
  v as E,
  w as D,
  x as O,
  y as k,
} from "./index-BPJbQuiK.js";
import { i as te } from "./profile-qFNPerqP.js";
import { t as ne } from "./avatar-ECPYu-KR.js";
import { _ as re, f as ie, g as ae, i as A, m as oe } from "./posts-CfzQybWe.js";
import { t as j } from "./post-media-zVhS5BrX.js";
var M = i(`pen-line`, [
    [`path`, { d: `M13 21h8`, key: `1jsn5i` }],
    [
      `path`,
      {
        d: `M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z`,
        key: `1a8usu`,
      },
    ],
  ]),
  N = i(`user-minus`, [
    [`path`, { d: `M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2`, key: `1yyitq` }],
    [`circle`, { cx: `9`, cy: `7`, r: `4`, key: `nufk8` }],
    [`line`, { x1: `22`, x2: `16`, y1: `11`, y2: `11`, key: `1shjgl` }],
  ]),
  P = t(e(), 1),
  F = n();
function I({ text: e }) {
  let t = e.split(/(#[A-Za-z0-9_]{1,50})/g);
  return (0, F.jsx)(F.Fragment, {
    children: t.map((e, t) =>
      e.startsWith(`#`)
        ? (0, F.jsx)(
            r,
            {
              to: `/tag/$tag`,
              params: { tag: e.slice(1).toLowerCase() },
              className: `text-primary hover:underline`,
              children: e,
            },
            `${e}-${t}`,
          )
        : (0, F.jsx)(P.Fragment, { children: e }, t),
    ),
  });
}
function L({ post: e, viewerId: t }) {
  let n = ee(),
    [i, L] = (0, P.useState)(e.liked),
    [R, z] = (0, P.useState)(e.likes_count),
    [B, V] = (0, P.useState)(e.saved),
    [H, U] = (0, P.useState)(!1),
    [W, G] = (0, P.useState)(e.caption || ``),
    [K, se] = (0, P.useState)(!1),
    [q, ce] = (0, P.useState)(!1),
    [le, J] = (0, P.useState)(!1),
    [Y, X] = (0, P.useState)(null),
    [Z, ue] = (0, P.useState)(W),
    Q = e.author,
    de = !!(t && Q && t === Q.id);
  async function fe() {
    if (!t) return;
    let n = !i;
    (L(n), z((e) => Math.max(0, e + (n ? 1 : -1))));
    try {
      await ae(e.id, t, i);
    } catch {
      (L(!n), z((e) => Math.max(0, e + (n ? -1 : 1))), x.error(`Could not update your like`));
    }
  }
  async function pe() {
    if (!t) return;
    let n = !B;
    V(n);
    try {
      await re(e.id, t, B);
    } catch {
      (V(!n), x.error(`Could not update your save`));
    }
  }
  async function me() {
    let n = `${window.location.origin}/p/${e.id}`;
    try {
      let r = typeof navigator.share == `function`;
      (r
        ? await navigator.share({ url: n, title: `Opexnal post` })
        : await navigator.clipboard.writeText(n),
        t && (await ie(e.id, t, r ? `native` : `link`)),
        r || x.success(`Link copied to clipboard`));
    } catch {}
  }
  let he = () => {
      (U(!0), J(!1), x.success(`Post hidden from your feed`));
    },
    ge = () => {
      (U(!0), J(!1), x.success(`Snoozed @${Q?.username || `creator`} for 30 days`));
    },
    $ = () => {
      (J(!1), x.success(`Unfollowed @${Q?.username || `creator`}`));
    },
    _e = () => {
      if (!Q) return;
      let e = C(),
        t = e.favoriteCreators.includes(Q.username),
        n = t
          ? e.favoriteCreators.filter((e) => e !== Q.username)
          : [...e.favoriteCreators, Q.username];
      (S({ favoriteCreators: n }),
        J(!1),
        x.success(
          t ? `Removed @${Q.username} from Favorites` : `Added @${Q.username} to Favorites ⭐`,
        ));
    },
    ve = () => {
      (G(Z), X(null), x.success(`Caption updated successfully`));
    },
    ye = () => {
      (U(!0), X(null), x.success(`Post moved to your private Archive`));
    },
    be = () => {
      (U(!0), X(null));
      let t = C(),
        n = {
          id: e.id,
          type: `post`,
          title: W.slice(0, 30) || `Post without caption`,
          deletedAt: `Just now`,
          daysRemaining: 30,
        };
      (S({ recentlyDeletedItems: [n, ...(t.recentlyDeletedItems || [])] }),
        x.success(`Post deleted — you can restore it from Recently Deleted within 30 days`));
    },
    xe = (e) => {
      (X(null), U(!0), x.success(`Thank you. We received your report for "${e}".`));
    };
  return H
    ? (0, F.jsxs)(`div`, {
        className: `p-4 border-b border-border bg-surface/50 text-center space-y-1.5`,
        children: [
          (0, F.jsx)(`p`, {
            className: `text-xs text-muted-foreground`,
            children: `This post has been hidden from your feed.`,
          }),
          (0, F.jsx)(`button`, {
            type: `button`,
            onClick: () => U(!1),
            className: `text-xs text-primary font-semibold hover:underline`,
            children: `Undo`,
          }),
        ],
      })
    : (0, F.jsxs)(`article`, {
        className: `border-b border-border pb-4`,
        children: [
          (0, F.jsxs)(`header`, {
            className: `flex items-center gap-3 px-4 py-3`,
            children: [
              Q
                ? (0, F.jsxs)(r, {
                    to: `/u/$username`,
                    params: { username: Q.username },
                    className: `flex items-center gap-3 min-w-0 flex-1`,
                    children: [
                      (0, F.jsx)(ne, {
                        path: Q.avatar_url,
                        fallback: te(Q),
                        className: `h-9 w-9 shrink-0`,
                      }),
                      (0, F.jsxs)(`div`, {
                        className: `min-w-0`,
                        children: [
                          (0, F.jsxs)(`p`, {
                            className: `flex items-center gap-1 truncate text-sm font-semibold`,
                            children: [
                              Q.username,
                              Q.is_verified &&
                                (0, F.jsx)(T, {
                                  className: `h-3.5 w-3.5 text-primary shrink-0`,
                                  "aria-hidden": `true`,
                                }),
                            ],
                          }),
                          e.location_name &&
                            (0, F.jsxs)(`p`, {
                              className: `flex items-center gap-1 truncate text-xs text-muted-foreground`,
                              children: [
                                (0, F.jsx)(c, {
                                  className: `h-3 w-3 shrink-0`,
                                  "aria-hidden": `true`,
                                }),
                                e.location_name,
                              ],
                            }),
                        ],
                      }),
                    ],
                  })
                : (0, F.jsx)(`p`, {
                    className: `text-sm text-muted-foreground flex-1`,
                    children: `Unknown author`,
                  }),
              (0, F.jsx)(`span`, {
                className: `text-xs text-muted-foreground mr-1`,
                children: oe(e.created_at),
              }),
              (0, F.jsx)(`button`, {
                type: `button`,
                onClick: () => J(!0),
                className: `h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface transition-colors`,
                "aria-label": `Post actions`,
                children: (0, F.jsx)(o, { className: `h-4 w-4` }),
              }),
            ],
          }),
          e.media.length > 0 && (0, F.jsx)(j, { media: e.media, alt: W || `Post media` }),
          (0, F.jsxs)(`div`, {
            className: `flex items-center gap-4 px-4 pt-3`,
            children: [
              (0, F.jsx)(`button`, {
                type: `button`,
                onClick: fe,
                "aria-label": i ? `Unlike` : `Like`,
                "aria-pressed": i,
                children: (0, F.jsx)(p, {
                  className: d(
                    `h-6 w-6 transition-colors`,
                    i ? `fill-primary text-primary` : `text-foreground`,
                  ),
                }),
              }),
              !K &&
                (0, F.jsx)(r, {
                  to: `/p/$postId`,
                  params: { postId: e.id },
                  "aria-label": `Comments`,
                  children: (0, F.jsx)(l, { className: `h-6 w-6` }),
                }),
              (0, F.jsx)(`button`, {
                type: `button`,
                onClick: me,
                "aria-label": `Share post`,
                children: (0, F.jsx)(m, { className: `h-6 w-6` }),
              }),
              (0, F.jsx)(`button`, {
                type: `button`,
                onClick: pe,
                className: `ml-auto`,
                "aria-label": B ? `Remove save` : `Save post`,
                "aria-pressed": B,
                children: (0, F.jsx)(a, {
                  className: d(
                    `h-6 w-6`,
                    B ? `fill-foreground text-foreground` : `text-foreground`,
                  ),
                }),
              }),
            ],
          }),
          (0, F.jsxs)(`div`, {
            className: `space-y-1 px-4 pt-2`,
            children: [
              !q &&
                (0, F.jsxs)(`p`, {
                  className: `text-sm font-semibold`,
                  children: [A(R), ` likes`],
                }),
              W &&
                (0, F.jsxs)(`p`, {
                  className: `whitespace-pre-wrap text-sm`,
                  children: [
                    Q &&
                      (0, F.jsx)(`span`, { className: `mr-1 font-semibold`, children: Q.username }),
                    (0, F.jsx)(I, { text: W }),
                  ],
                }),
              !K &&
                e.comments_count > 0 &&
                (0, F.jsxs)(`button`, {
                  type: `button`,
                  onClick: () => n({ to: `/p/$postId`, params: { postId: e.id } }),
                  className: `text-sm text-muted-foreground`,
                  children: [`View all `, A(e.comments_count), ` comments`],
                }),
              K &&
                (0, F.jsx)(`p`, {
                  className: `text-xs text-muted-foreground italic`,
                  children: `Comments are turned off`,
                }),
            ],
          }),
          (0, F.jsx)(_, {
            open: le,
            onOpenChange: J,
            children: (0, F.jsx)(E, {
              className: `max-w-xs rounded-3xl p-3 bg-card border-border`,
              children: (0, F.jsx)(`div`, {
                className: `divide-y divide-border text-xs`,
                children: de
                  ? (0, F.jsxs)(F.Fragment, {
                      children: [
                        (0, F.jsxs)(`button`, {
                          type: `button`,
                          onClick: () => {
                            (J(!1), X(`edit`));
                          },
                          className: `w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-semibold`,
                          children: [
                            (0, F.jsx)(M, { className: `h-4 w-4 text-primary` }),
                            (0, F.jsx)(`span`, { children: `Edit Caption` }),
                          ],
                        }),
                        (0, F.jsxs)(`button`, {
                          type: `button`,
                          onClick: () => {
                            (ce(!q),
                              J(!1),
                              x.success(q ? `Like count visible` : `Like count hidden`));
                          },
                          className: `w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors`,
                          children: [
                            (0, F.jsx)(u, { className: `h-4 w-4 text-muted-foreground` }),
                            (0, F.jsx)(`span`, {
                              children: q ? `Unhide like count` : `Hide like count`,
                            }),
                          ],
                        }),
                        (0, F.jsxs)(`button`, {
                          type: `button`,
                          onClick: () => {
                            (se(!K),
                              J(!1),
                              x.success(K ? `Comments enabled` : `Comments turned off`));
                          },
                          className: `w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors`,
                          children: [
                            (0, F.jsx)(l, { className: `h-4 w-4 text-muted-foreground` }),
                            (0, F.jsx)(`span`, {
                              children: K ? `Turn on commenting` : `Turn off commenting`,
                            }),
                          ],
                        }),
                        (0, F.jsxs)(`button`, {
                          type: `button`,
                          onClick: () => {
                            (J(!1), X(`archive`));
                          },
                          className: `w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors`,
                          children: [
                            (0, F.jsx)(y, { className: `h-4 w-4 text-muted-foreground` }),
                            (0, F.jsx)(`span`, { children: `Archive post` }),
                          ],
                        }),
                        (0, F.jsxs)(`button`, {
                          type: `button`,
                          onClick: () => {
                            (J(!1), X(`delete`));
                          },
                          className: `w-full flex items-center gap-3 p-3 text-destructive hover:bg-surface rounded-xl transition-colors font-semibold`,
                          children: [
                            (0, F.jsx)(b, { className: `h-4 w-4 text-destructive` }),
                            (0, F.jsx)(`span`, { children: `Delete post` }),
                          ],
                        }),
                      ],
                    })
                  : (0, F.jsxs)(F.Fragment, {
                      children: [
                        (0, F.jsxs)(`button`, {
                          type: `button`,
                          onClick: () => {
                            (J(!1), X(`why`));
                          },
                          className: `w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-semibold`,
                          children: [
                            (0, F.jsx)(f, { className: `h-4 w-4 text-primary` }),
                            (0, F.jsx)(`span`, { children: `Why am I seeing this post` }),
                          ],
                        }),
                        (0, F.jsxs)(`button`, {
                          type: `button`,
                          onClick: he,
                          className: `w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors`,
                          children: [
                            (0, F.jsx)(s, { className: `h-4 w-4 text-muted-foreground` }),
                            (0, F.jsx)(`span`, { children: `Hide post / Not Interested` }),
                          ],
                        }),
                        (0, F.jsxs)(`button`, {
                          type: `button`,
                          onClick: _e,
                          className: `w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors`,
                          children: [
                            (0, F.jsx)(h, { className: `h-4 w-4 text-amber-400` }),
                            (0, F.jsx)(`span`, { children: `Add/Remove from Favorites` }),
                          ],
                        }),
                        (0, F.jsxs)(`button`, {
                          type: `button`,
                          onClick: ge,
                          className: `w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors`,
                          children: [
                            (0, F.jsx)(g, { className: `h-4 w-4 text-muted-foreground` }),
                            (0, F.jsxs)(`span`, {
                              children: [`Snooze @`, Q?.username, ` for 30 days`],
                            }),
                          ],
                        }),
                        (0, F.jsxs)(`button`, {
                          type: `button`,
                          onClick: $,
                          className: `w-full flex items-center gap-3 p-3 text-destructive hover:bg-surface rounded-xl transition-colors font-medium`,
                          children: [
                            (0, F.jsx)(N, { className: `h-4 w-4 text-destructive` }),
                            (0, F.jsxs)(`span`, { children: [`Unfollow @`, Q?.username] }),
                          ],
                        }),
                        (0, F.jsxs)(`button`, {
                          type: `button`,
                          onClick: () => {
                            (J(!1), X(`report`));
                          },
                          className: `w-full flex items-center gap-3 p-3 text-destructive hover:bg-surface rounded-xl transition-colors font-semibold`,
                          children: [
                            (0, F.jsx)(w, { className: `h-4 w-4 text-destructive` }),
                            (0, F.jsx)(`span`, { children: `Report post` }),
                          ],
                        }),
                      ],
                    }),
              }),
            }),
          }),
          (0, F.jsx)(_, {
            open: Y === `why`,
            onOpenChange: () => X(null),
            children: (0, F.jsxs)(E, {
              className: `max-w-xs rounded-3xl p-5 bg-card border-border`,
              children: [
                (0, F.jsxs)(v, {
                  children: [
                    (0, F.jsxs)(O, {
                      className: `text-sm font-bold flex items-center gap-2`,
                      children: [
                        (0, F.jsx)(f, { className: `h-4 w-4 text-primary` }),
                        `Why You're Seeing This Post`,
                      ],
                    }),
                    (0, F.jsx)(k, {
                      className: `text-xs text-muted-foreground pt-1`,
                      children: `Opexnal shows content based on your connections and interests.`,
                    }),
                  ],
                }),
                (0, F.jsxs)(`div`, {
                  className: `space-y-3 py-2 text-xs`,
                  children: [
                    (0, F.jsxs)(`div`, {
                      className: `p-3 bg-surface border border-border rounded-xl space-y-1`,
                      children: [
                        (0, F.jsxs)(`p`, {
                          className: `font-semibold text-foreground`,
                          children: [`You follow @`, Q?.username],
                        }),
                        (0, F.jsx)(`p`, {
                          className: `text-[11px] text-muted-foreground`,
                          children: `This post was shared by an account you follow in your primary feed.`,
                        }),
                      ],
                    }),
                    (0, F.jsxs)(`div`, {
                      className: `p-3 bg-surface border border-border rounded-xl space-y-1`,
                      children: [
                        (0, F.jsx)(`p`, {
                          className: `font-semibold text-foreground`,
                          children: `Content Engagement`,
                        }),
                        (0, F.jsx)(`p`, {
                          className: `text-[11px] text-muted-foreground`,
                          children: `You frequently interact with photo posts and design content on Opexnal.`,
                        }),
                      ],
                    }),
                  ],
                }),
                (0, F.jsx)(D, {
                  variant: `surface`,
                  onClick: () => X(null),
                  className: `w-full text-xs rounded-xl`,
                  children: `Close`,
                }),
              ],
            }),
          }),
          (0, F.jsx)(_, {
            open: Y === `report`,
            onOpenChange: () => X(null),
            children: (0, F.jsxs)(E, {
              className: `max-w-xs rounded-3xl p-5 bg-card border-border`,
              children: [
                (0, F.jsxs)(v, {
                  children: [
                    (0, F.jsxs)(O, {
                      className: `text-sm font-bold text-destructive flex items-center gap-2`,
                      children: [(0, F.jsx)(w, { className: `h-4 w-4` }), `Report Post`],
                    }),
                    (0, F.jsx)(k, {
                      className: `text-xs text-muted-foreground pt-1`,
                      children: `Why are you reporting this post? Your report is anonymous.`,
                    }),
                  ],
                }),
                (0, F.jsx)(`div`, {
                  className: `space-y-1.5 py-2`,
                  children: [
                    `It's spam or a scam`,
                    `Hate speech or symbols`,
                    `Nudity or sexual content`,
                    `Violence or dangerous organizations`,
                    `Harassment or bullying`,
                    `Intellectual property violation`,
                  ].map((e) =>
                    (0, F.jsx)(
                      `button`,
                      {
                        type: `button`,
                        onClick: () => xe(e),
                        className: `w-full p-2.5 text-left text-xs bg-surface border border-border rounded-xl hover:bg-secondary transition-colors`,
                        children: e,
                      },
                      e,
                    ),
                  ),
                }),
              ],
            }),
          }),
          (0, F.jsx)(_, {
            open: Y === `edit`,
            onOpenChange: () => X(null),
            children: (0, F.jsxs)(E, {
              className: `max-w-xs rounded-3xl p-5 bg-card border-border`,
              children: [
                (0, F.jsx)(v, {
                  children: (0, F.jsxs)(O, {
                    className: `text-sm font-bold flex items-center gap-2`,
                    children: [
                      (0, F.jsx)(M, { className: `h-4 w-4 text-primary` }),
                      `Edit Caption`,
                    ],
                  }),
                }),
                (0, F.jsxs)(`div`, {
                  className: `py-2 space-y-3`,
                  children: [
                    (0, F.jsx)(`textarea`, {
                      rows: 3,
                      value: Z,
                      onChange: (e) => ue(e.target.value),
                      className: `w-full p-3 rounded-xl bg-surface border border-border text-xs focus:outline-none`,
                    }),
                    (0, F.jsxs)(`div`, {
                      className: `flex gap-2`,
                      children: [
                        (0, F.jsx)(D, {
                          variant: `surface`,
                          onClick: () => X(null),
                          className: `flex-1 text-xs rounded-xl`,
                          children: `Cancel`,
                        }),
                        (0, F.jsx)(D, {
                          onClick: ve,
                          className: `flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold`,
                          children: `Save`,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
          (0, F.jsx)(_, {
            open: Y === `archive`,
            onOpenChange: () => X(null),
            children: (0, F.jsxs)(E, {
              className: `max-w-xs rounded-3xl p-5 bg-card border-border`,
              children: [
                (0, F.jsxs)(v, {
                  children: [
                    (0, F.jsxs)(O, {
                      className: `text-sm font-bold flex items-center gap-2`,
                      children: [
                        (0, F.jsx)(y, { className: `h-4 w-4 text-primary` }),
                        `Archive Post?`,
                      ],
                    }),
                    (0, F.jsx)(k, {
                      className: `text-xs text-muted-foreground pt-1`,
                      children: `Only you will be able to see this post once archived. You can show it on your profile again at any time.`,
                    }),
                  ],
                }),
                (0, F.jsxs)(`div`, {
                  className: `flex gap-2 pt-2`,
                  children: [
                    (0, F.jsx)(D, {
                      variant: `surface`,
                      onClick: () => X(null),
                      className: `flex-1 text-xs rounded-xl`,
                      children: `Cancel`,
                    }),
                    (0, F.jsx)(D, {
                      onClick: ye,
                      className: `flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold`,
                      children: `Archive`,
                    }),
                  ],
                }),
              ],
            }),
          }),
          (0, F.jsx)(_, {
            open: Y === `delete`,
            onOpenChange: () => X(null),
            children: (0, F.jsxs)(E, {
              className: `max-w-xs rounded-3xl p-5 bg-card border-border`,
              children: [
                (0, F.jsxs)(v, {
                  children: [
                    (0, F.jsxs)(O, {
                      className: `text-sm font-bold text-destructive flex items-center gap-2`,
                      children: [(0, F.jsx)(b, { className: `h-4 w-4` }), `Delete Post?`],
                    }),
                    (0, F.jsx)(k, {
                      className: `text-xs text-muted-foreground pt-1`,
                      children: `This post will be moved to Recently Deleted. You can restore it within 30 days before it is permanently erased.`,
                    }),
                  ],
                }),
                (0, F.jsxs)(`div`, {
                  className: `flex gap-2 pt-2`,
                  children: [
                    (0, F.jsx)(D, {
                      variant: `surface`,
                      onClick: () => X(null),
                      className: `flex-1 text-xs rounded-xl`,
                      children: `Cancel`,
                    }),
                    (0, F.jsx)(D, {
                      variant: `destructive`,
                      onClick: be,
                      className: `flex-1 text-xs rounded-xl font-semibold`,
                      children: `Delete`,
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      });
}
export { L as t };
