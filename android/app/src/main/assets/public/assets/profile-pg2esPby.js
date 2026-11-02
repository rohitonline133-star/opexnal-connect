import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { n as r, t as i } from "./createLucideIcon-DgzBSI1Z.js";
import { t as a } from "./useQuery-Sthak1vL.js";
import { t as o } from "./bookmark-ClGYgWxW.js";
import { n as s, t as c } from "./post-grid-GIMTBcU9.js";
import { t as l } from "./grid-3x3-CKCl9sVb.js";
import { t as u } from "./loader-circle-CbE-4Efj.js";
import { t as d } from "./utils-DojpP95n.js";
import {
  C as f,
  E as p,
  H as m,
  O as h,
  Q as g,
  R as _,
  T as v,
  _ as y,
  b,
  ct as x,
  lt as S,
  st as C,
  u as w,
  v as T,
  w as E,
  x as D,
} from "./index-BPJbQuiK.js";
import { i as O, n as k } from "./profile-qFNPerqP.js";
import { t as A } from "./avatar-ECPYu-KR.js";
var j = i(`settings`, [
    [
      `path`,
      {
        d: `M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915`,
        key: `1i5ecw`,
      },
    ],
    [`circle`, { cx: `12`, cy: `12`, r: `3`, key: `1v7zrd` }],
  ]),
  M = t(e()),
  N = n();
function P() {
  let { user: e } = w(),
    [t, n] = (0, M.useState)(`posts`),
    [i, P] = (0, M.useState)(null),
    [F, I] = (0, M.useState)(``),
    { data: L, isLoading: R } = a({
      queryKey: [`profile`, e?.id],
      queryFn: () => (e?.id ? k(e.id) : null),
      enabled: !!e?.id,
    });
  return (0, N.jsxs)(v, {
    header: (0, N.jsx)(p, {
      title: L ? `@${L.username}` : `Profile`,
      right: (0, N.jsxs)(`div`, {
        className: `flex items-center gap-1`,
        children: [
          (0, N.jsx)(r, {
            to: `/archive`,
            "aria-label": `Archive`,
            className: `text-muted-foreground hover:text-foreground h-9 w-9 flex items-center justify-center rounded-xl hover:bg-surface`,
            children: (0, N.jsx)(x, { className: `h-5 w-5` }),
          }),
          (0, N.jsx)(r, {
            to: `/settings`,
            "aria-label": `Settings`,
            className: `text-muted-foreground hover:text-foreground h-9 w-9 flex items-center justify-center rounded-xl hover:bg-surface`,
            children: (0, N.jsx)(j, { className: `h-5 w-5`, "aria-hidden": `true` }),
          }),
        ],
      }),
    }),
    children: [
      R || !L
        ? (0, N.jsx)(`div`, {
            className: `flex justify-center py-20`,
            children: (0, N.jsx)(u, {
              className: `h-5 w-5 animate-spin text-muted-foreground`,
              "aria-hidden": `true`,
            }),
          })
        : (0, N.jsxs)(`div`, {
            children: [
              (0, N.jsxs)(`div`, {
                className: `flex items-center gap-5 px-4 pt-6`,
                children: [
                  (0, N.jsx)(A, {
                    path: L.avatar_url,
                    fallback: O(L),
                    className: `h-20 w-20 text-lg`,
                    ring: !0,
                  }),
                  (0, N.jsxs)(`dl`, {
                    className: `flex flex-1 justify-around text-center`,
                    children: [
                      (0, N.jsxs)(`div`, {
                        children: [
                          (0, N.jsx)(`dt`, {
                            className: `text-xs text-muted-foreground`,
                            children: `Posts`,
                          }),
                          (0, N.jsx)(`dd`, {
                            className: `text-lg font-semibold`,
                            children: L.posts_count,
                          }),
                        ],
                      }),
                      (0, N.jsxs)(`div`, {
                        onClick: () => P(`followers`),
                        className: `cursor-pointer hover:opacity-80 transition-opacity`,
                        children: [
                          (0, N.jsx)(`dt`, {
                            className: `text-xs text-muted-foreground`,
                            children: `Followers`,
                          }),
                          (0, N.jsx)(`dd`, {
                            className: `stat-num text-lg font-semibold`,
                            children: L.followers_count,
                          }),
                        ],
                      }),
                      (0, N.jsxs)(`div`, {
                        onClick: () => P(`following`),
                        className: `cursor-pointer hover:opacity-80 transition-opacity`,
                        children: [
                          (0, N.jsx)(`dt`, {
                            className: `text-xs text-muted-foreground`,
                            children: `Following`,
                          }),
                          (0, N.jsx)(`dd`, {
                            className: `text-lg font-semibold`,
                            children: L.following_count,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              (0, N.jsxs)(`div`, {
                className: `px-4 pt-4`,
                children: [
                  (0, N.jsxs)(`p`, {
                    className: `flex items-center gap-1.5 text-sm font-semibold`,
                    children: [
                      L.display_name || L.username,
                      L.is_verified &&
                        (0, N.jsx)(C, {
                          className: `h-4 w-4 text-primary`,
                          "aria-label": `Verified`,
                        }),
                      L.is_private &&
                        (0, N.jsx)(m, {
                          className: `h-3.5 w-3.5 text-muted-foreground`,
                          "aria-label": `Private account`,
                        }),
                    ],
                  }),
                  (0, N.jsxs)(`p`, {
                    className: `text-xs capitalize text-muted-foreground`,
                    children: [L.account_type, ` account`],
                  }),
                  L.bio &&
                    (0, N.jsx)(`p`, {
                      className: `mt-2 whitespace-pre-line text-sm`,
                      children: L.bio,
                    }),
                  L.website &&
                    (0, N.jsx)(`a`, {
                      href: L.website,
                      target: `_blank`,
                      rel: `noopener noreferrer nofollow`,
                      className: `mt-1 inline-block text-sm text-primary hover:underline`,
                      children: L.website.replace(/^https?:\/\//, ``),
                    }),
                ],
              }),
              (0, N.jsxs)(`div`, {
                id: `action-buttons`,
                className: `flex gap-2 px-4 pt-4`,
                children: [
                  (0, N.jsx)(E, {
                    asChild: !0,
                    variant: `surface`,
                    className: `flex-1 rounded-xl text-xs h-9`,
                    children: (0, N.jsx)(r, { to: `/profile/edit`, children: `Edit profile` }),
                  }),
                  (0, N.jsx)(E, {
                    type: `button`,
                    variant: `surface`,
                    onClick: () => {
                      let e = `${window.location.origin}/u/${L?.username || ``}`;
                      (navigator.clipboard.writeText(e),
                        S.success(`Profile link copied to clipboard`));
                    },
                    className: `flex-1 rounded-xl text-xs h-9`,
                    children: `Share profile`,
                  }),
                  (0, N.jsx)(E, {
                    asChild: !0,
                    variant: `surface`,
                    className: `flex-1 rounded-xl text-xs h-9`,
                    children: (0, N.jsx)(r, { to: `/creator`, children: `Dashboard` }),
                  }),
                ],
              }),
              (0, N.jsxs)(`div`, {
                className: `flex border-b border-border mt-6`,
                children: [
                  (0, N.jsxs)(`button`, {
                    type: `button`,
                    onClick: () => n(`posts`),
                    className: d(
                      `flex-1 flex justify-center items-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors`,
                      t === `posts`
                        ? `border-primary text-foreground`
                        : `border-transparent text-muted-foreground hover:text-foreground`,
                    ),
                    children: [
                      (0, N.jsx)(l, { className: `h-4 w-4` }),
                      (0, N.jsx)(`span`, { children: `Posts` }),
                    ],
                  }),
                  (0, N.jsxs)(`button`, {
                    type: `button`,
                    onClick: () => n(`reels`),
                    className: d(
                      `flex-1 flex justify-center items-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors`,
                      t === `reels`
                        ? `border-primary text-foreground`
                        : `border-transparent text-muted-foreground hover:text-foreground`,
                    ),
                    children: [
                      (0, N.jsx)(g, { className: `h-4 w-4` }),
                      (0, N.jsx)(`span`, { children: `Reels` }),
                    ],
                  }),
                  (0, N.jsxs)(`button`, {
                    type: `button`,
                    onClick: () => n(`saved`),
                    className: d(
                      `flex-1 flex justify-center items-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors`,
                      t === `saved`
                        ? `border-primary text-foreground`
                        : `border-transparent text-muted-foreground hover:text-foreground`,
                    ),
                    children: [
                      (0, N.jsx)(o, { className: `h-4 w-4` }),
                      (0, N.jsx)(`span`, { children: `Saved` }),
                    ],
                  }),
                  (0, N.jsxs)(`button`, {
                    type: `button`,
                    onClick: () => n(`tagged`),
                    className: d(
                      `flex-1 flex justify-center items-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors`,
                      t === `tagged`
                        ? `border-primary text-foreground`
                        : `border-transparent text-muted-foreground hover:text-foreground`,
                    ),
                    children: [
                      (0, N.jsx)(s, { className: `h-4 w-4` }),
                      (0, N.jsx)(`span`, { children: `Tagged` }),
                    ],
                  }),
                ],
              }),
              (0, N.jsx)(`div`, {
                children:
                  t === `posts`
                    ? (0, N.jsx)(c, {
                        userId: L.id,
                        viewerId: e?.id ?? null,
                        emptyMessage: `You haven't posted yet. Tap create to share your first photo or video.`,
                      })
                    : t === `reels`
                      ? (0, N.jsxs)(`div`, {
                          className: `p-8 text-center text-xs text-muted-foreground space-y-2`,
                          children: [
                            (0, N.jsx)(g, {
                              className: `h-8 w-8 text-muted-foreground/40 mx-auto`,
                            }),
                            (0, N.jsx)(`p`, {
                              children: `You haven't uploaded any video reels yet.`,
                            }),
                            (0, N.jsx)(E, {
                              asChild: !0,
                              size: `sm`,
                              className: `brand-gradient-bg text-white rounded-xl text-xs`,
                              children: (0, N.jsx)(r, { to: `/create`, children: `Upload Reel` }),
                            }),
                          ],
                        })
                      : t === `saved`
                        ? (0, N.jsxs)(`div`, {
                            className: `p-8 text-center text-xs text-muted-foreground space-y-2`,
                            children: [
                              (0, N.jsx)(o, {
                                className: `h-8 w-8 text-muted-foreground/40 mx-auto`,
                              }),
                              (0, N.jsx)(`p`, {
                                children: `Only you can see posts you have bookmarked.`,
                              }),
                              (0, N.jsx)(E, {
                                asChild: !0,
                                size: `sm`,
                                variant: `surface`,
                                className: `rounded-xl text-xs`,
                                children: (0, N.jsx)(r, {
                                  to: `/explore`,
                                  children: `Explore Content`,
                                }),
                              }),
                            ],
                          })
                        : (0, N.jsxs)(`div`, {
                            className: `p-8 text-center text-xs text-muted-foreground space-y-2`,
                            children: [
                              (0, N.jsx)(s, {
                                className: `h-8 w-8 text-muted-foreground/40 mx-auto`,
                              }),
                              (0, N.jsx)(`p`, {
                                children: `When people tag you in photos or reels, they will appear here.`,
                              }),
                            ],
                          }),
              }),
            ],
          }),
      (0, N.jsx)(y, {
        open: !!i,
        onOpenChange: () => P(null),
        children: (0, N.jsxs)(T, {
          className: `max-w-xs rounded-3xl p-5 bg-card border-border`,
          children: [
            (0, N.jsx)(b, {
              children: (0, N.jsxs)(D, {
                className: `text-sm font-bold capitalize flex items-center gap-2`,
                children: [
                  (0, N.jsx)(h, { className: `h-4 w-4 text-primary` }),
                  i === `followers` ? `Followers` : `Following`,
                ],
              }),
            }),
            (0, N.jsxs)(`div`, {
              className: `space-y-3 py-2`,
              children: [
                (0, N.jsxs)(`div`, {
                  className: `relative`,
                  children: [
                    (0, N.jsx)(_, {
                      className: `absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground`,
                    }),
                    (0, N.jsx)(f, {
                      placeholder: `Search...`,
                      value: F,
                      onChange: (e) => I(e.target.value),
                      className: `pl-8 h-8 rounded-xl bg-surface border-border text-xs`,
                    }),
                  ],
                }),
                (0, N.jsx)(`div`, {
                  className: `divide-y divide-border max-h-56 overflow-y-auto text-xs`,
                  children: [
                    { username: `maya_visuals`, name: `Maya Sharma` },
                    { username: `aarav_tech`, name: `Aarav Patel` },
                    { username: `sneha_art`, name: `Sneha Roy` },
                  ]
                    .filter((e) => e.username.includes(F) || e.name.includes(F))
                    .map((e) =>
                      (0, N.jsxs)(
                        `div`,
                        {
                          className: `py-2.5 flex items-center justify-between`,
                          children: [
                            (0, N.jsxs)(`div`, {
                              children: [
                                (0, N.jsxs)(`p`, {
                                  className: `font-semibold text-foreground`,
                                  children: [`@`, e.username],
                                }),
                                (0, N.jsx)(`p`, {
                                  className: `text-[11px] text-muted-foreground`,
                                  children: e.name,
                                }),
                              ],
                            }),
                            (0, N.jsx)(E, {
                              size: `sm`,
                              variant: `surface`,
                              onClick: () =>
                                S.success(
                                  i === `followers`
                                    ? `Removed @${e.username}`
                                    : `Unfollowed @${e.username}`,
                                ),
                              className: `h-7 text-[11px] px-2 rounded-lg`,
                              children: i === `followers` ? `Remove` : `Following`,
                            }),
                          ],
                        },
                        e.username,
                      ),
                    ),
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
export { P as component };
