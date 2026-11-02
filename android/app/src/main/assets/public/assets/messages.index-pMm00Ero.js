import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { n as r, t as i } from "./createLucideIcon-DgzBSI1Z.js";
import { t as a } from "./useNavigate-BJOrhi-q.js";
import { t as o } from "./useQuery-Sthak1vL.js";
import { t as s } from "./loader-circle-CbE-4Efj.js";
import { t as c } from "./utils-DojpP95n.js";
import {
  C as l,
  E as u,
  I as d,
  R as f,
  T as p,
  _ as m,
  b as h,
  lt as g,
  rt as _,
  u as v,
  v as y,
  w as b,
  x,
  y as S,
} from "./index-BPJbQuiK.js";
import { i as C } from "./profile-qFNPerqP.js";
import { t as w } from "./avatar-ECPYu-KR.js";
import { m as T } from "./posts-CfzQybWe.js";
import { r as E } from "./messages-BReBuo5b.js";
var D = i(`message-square-plus`, [
    [
      `path`,
      {
        d: `M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z`,
        key: `18887p`,
      },
    ],
    [`path`, { d: `M12 8v6`, key: `1ib9pf` }],
    [`path`, { d: `M9 11h6`, key: `1fldmi` }],
  ]),
  O = t(e()),
  k = n();
function A() {
  let { user: e } = v(),
    t = a(),
    [n, i] = (0, O.useState)(`primary`),
    [A, j] = (0, O.useState)(``),
    [M, N] = (0, O.useState)(!1),
    [P, F] = (0, O.useState)(``),
    { data: I, isLoading: L } = o({
      queryKey: [`conversations`, e?.id],
      queryFn: () => E(e.id),
      enabled: !!e?.id,
    }),
    R = I ?? [],
    z = (0, O.useMemo)(() => {
      let e = A.trim().toLowerCase();
      return (I ?? []).filter((t) => {
        let n = t.others[0]?.username?.toLowerCase() || ``,
          r = t.lastMessage?.toLowerCase() || ``;
        return !e || n.includes(e) || r.includes(e);
      });
    }, [I, A]);
  return (0, k.jsxs)(p, {
    header: (0, k.jsx)(u, {
      title: (0, k.jsxs)(`div`, {
        className: `flex items-center gap-1.5 font-bold`,
        children: [
          (0, k.jsx)(`span`, { children: `Messages` }),
          R.some((e) => e.unread) &&
            (0, k.jsx)(`span`, { className: `h-2 w-2 rounded-full bg-primary` }),
        ],
      }),
      left: (0, k.jsx)(r, {
        to: `/home`,
        "aria-label": `Back`,
        className: `text-muted-foreground hover:text-foreground`,
        children: (0, k.jsx)(_, { className: `h-5 w-5`, "aria-hidden": `true` }),
      }),
      right: (0, k.jsx)(`button`, {
        type: `button`,
        onClick: () => N(!0),
        "aria-label": `New message`,
        className: `text-muted-foreground hover:text-foreground h-9 w-9 flex items-center justify-center rounded-xl hover:bg-surface transition-colors`,
        children: (0, k.jsx)(D, { className: `h-5 w-5`, "aria-hidden": `true` }),
      }),
    }),
    children: [
      (0, k.jsxs)(`div`, {
        className: `p-3 space-y-3 max-w-md mx-auto`,
        children: [
          (0, k.jsxs)(`div`, {
            className: `relative`,
            children: [
              (0, k.jsx)(f, { className: `absolute left-3.5 top-3 h-4 w-4 text-muted-foreground` }),
              (0, k.jsx)(l, {
                placeholder: `Search conversations...`,
                value: A,
                onChange: (e) => j(e.target.value),
                className: `pl-10 h-10 rounded-2xl bg-surface border-border text-xs`,
              }),
            ],
          }),
          (0, k.jsx)(`div`, {
            className: `flex bg-surface border border-border p-1 rounded-2xl gap-1`,
            children: [
              { id: `primary`, label: `Primary` },
              { id: `general`, label: `General` },
              { id: `requests`, label: `Requests` },
            ].map((e) =>
              (0, k.jsx)(
                `button`,
                {
                  type: `button`,
                  onClick: () => i(e.id),
                  className: c(
                    `flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all`,
                    n === e.id
                      ? `bg-card text-foreground shadow-xs`
                      : `text-muted-foreground hover:text-foreground`,
                  ),
                  children: e.label,
                },
                e.id,
              ),
            ),
          }),
          L
            ? (0, k.jsx)(`div`, {
                className: `flex justify-center py-16`,
                children: (0, k.jsx)(s, {
                  className: `h-5 w-5 animate-spin text-muted-foreground`,
                  "aria-hidden": `true`,
                }),
              })
            : n === `requests`
              ? (0, k.jsxs)(`div`, {
                  className: `py-12 text-center text-xs text-muted-foreground space-y-1 bg-card border border-border rounded-3xl p-6`,
                  children: [
                    (0, k.jsx)(d, { className: `h-8 w-8 text-muted-foreground/40 mx-auto mb-2` }),
                    (0, k.jsx)(`p`, {
                      className: `font-semibold text-foreground`,
                      children: `No Message Requests`,
                    }),
                    (0, k.jsx)(`p`, {
                      className: `text-[11px]`,
                      children: `Messages from accounts you don't follow will appear here.`,
                    }),
                  ],
                })
              : z.length === 0
                ? (0, k.jsxs)(`div`, {
                    className: `py-12 text-center text-xs text-muted-foreground space-y-2 bg-card border border-border rounded-3xl p-6`,
                    children: [
                      (0, k.jsx)(`p`, {
                        className: `font-semibold text-foreground`,
                        children: `No messages found`,
                      }),
                      (0, k.jsx)(`p`, {
                        className: `text-[11px]`,
                        children: `Open someone's profile and tap Message to start one.`,
                      }),
                      (0, k.jsx)(b, {
                        asChild: !0,
                        size: `sm`,
                        className: `mt-2 brand-gradient-bg text-white rounded-xl text-xs`,
                        children: (0, k.jsx)(r, { to: `/explore`, children: `Explore Creators` }),
                      }),
                    ],
                  })
                : (0, k.jsx)(`ul`, {
                    className: `divide-y divide-border bg-card border border-border rounded-3xl overflow-hidden shadow-xs`,
                    children: z.map((e) => {
                      let t = e.others[0];
                      return (0, k.jsx)(
                        `li`,
                        {
                          children: (0, k.jsxs)(r, {
                            to: `/messages/$conversationId`,
                            params: { conversationId: e.id },
                            className: `flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors`,
                            children: [
                              (0, k.jsx)(w, {
                                path: t?.avatar_url ?? null,
                                fallback: t ? C(t) : `?`,
                                className: `h-11 w-11`,
                              }),
                              (0, k.jsxs)(`div`, {
                                className: `min-w-0 flex-1`,
                                children: [
                                  (0, k.jsx)(`p`, {
                                    className: c(`truncate text-sm`, e.unread && `font-semibold`),
                                    children: t?.username ?? `Conversation`,
                                  }),
                                  (0, k.jsx)(`p`, {
                                    className: `truncate text-xs text-muted-foreground`,
                                    children: e.lastMessage ?? `No messages yet`,
                                  }),
                                ],
                              }),
                              (0, k.jsx)(`span`, {
                                className: `shrink-0 text-xs text-muted-foreground`,
                                children: T(e.lastMessageAt),
                              }),
                            ],
                          }),
                        },
                        e.id,
                      );
                    }),
                  }),
        ],
      }),
      (0, k.jsx)(m, {
        open: M,
        onOpenChange: N,
        children: (0, k.jsxs)(y, {
          className: `max-w-xs rounded-3xl p-5 bg-card border-border`,
          children: [
            (0, k.jsxs)(h, {
              children: [
                (0, k.jsxs)(x, {
                  className: `text-sm font-bold flex items-center gap-2`,
                  children: [
                    (0, k.jsx)(D, { className: `h-4 w-4 text-primary` }),
                    `New Conversation`,
                  ],
                }),
                (0, k.jsx)(S, {
                  className: `text-xs text-muted-foreground pt-1`,
                  children: `Start a one-on-one direct chat with any creator on Opexnal.`,
                }),
              ],
            }),
            (0, k.jsxs)(`form`, {
              onSubmit: async (e) => {
                e.preventDefault();
                let n = P.trim().replace(/^@/, ``);
                n && (g.info(`Opening chat with @${n}...`), N(!1), t({ to: `/explore` }));
              },
              className: `space-y-3 py-2`,
              children: [
                (0, k.jsxs)(`div`, {
                  children: [
                    (0, k.jsx)(`label`, {
                      className: `text-xs font-semibold block mb-1`,
                      children: `Creator Username`,
                    }),
                    (0, k.jsx)(l, {
                      placeholder: `e.g. alex_creator`,
                      value: P,
                      onChange: (e) => F(e.target.value),
                      className: `h-10 rounded-xl bg-surface border-border text-xs`,
                      required: !0,
                    }),
                  ],
                }),
                (0, k.jsxs)(`div`, {
                  className: `flex gap-2 pt-2`,
                  children: [
                    (0, k.jsx)(b, {
                      type: `button`,
                      variant: `surface`,
                      onClick: () => N(!1),
                      className: `flex-1 text-xs rounded-xl`,
                      children: `Cancel`,
                    }),
                    (0, k.jsx)(b, {
                      type: `submit`,
                      className: `flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold`,
                      children: `Start Chat`,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
export { A as component };
