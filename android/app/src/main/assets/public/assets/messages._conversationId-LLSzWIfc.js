import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { n as r, t as i } from "./createLucideIcon-DgzBSI1Z.js";
import { t as a } from "./client-CNuAEkjg.js";
import { j as o } from "./removable-Bti6oWPM.js";
import { t as s } from "./useQuery-Sthak1vL.js";
import { t as c } from "./useMutation-DAlJQPHF.js";
import { t as l } from "./copy-BIV7FDCl.js";
import { t as u } from "./loader-circle-CbE-4Efj.js";
import { t as d } from "./phone-B9wj1o3G.js";
import { t as f } from "./utils-DojpP95n.js";
import {
  C as p,
  D as m,
  E as h,
  L as g,
  T as _,
  _ as v,
  j as y,
  lt as b,
  o as x,
  q as S,
  rt as C,
  u as w,
  v as T,
  w as E,
} from "./index-BPJbQuiK.js";
import { i as D } from "./profile-qFNPerqP.js";
import { t as O } from "./avatar-ECPYu-KR.js";
import { m as k } from "./posts-CfzQybWe.js";
import { i as A, n as j, o as M, t as N } from "./messages-BReBuo5b.js";
var P = i(`corner-up-left`, [
    [`path`, { d: `M20 20v-7a4 4 0 0 0-4-4H4`, key: `1nkjon` }],
    [`path`, { d: `M9 14 4 9l5-5`, key: `102s5s` }],
  ]),
  F = t(e()),
  I = n(),
  L = [`❤️`, `🔥`, `😂`, `👏`, `🙌`, `✨`];
function R() {
  let { conversationId: e } = x.useParams(),
    { user: t } = w(),
    n = o(),
    [i, R] = (0, F.useState)(``),
    z = (0, F.useRef)(null),
    [B, V] = (0, F.useState)(null),
    [H, U] = (0, F.useState)(null),
    [W, G] = (0, F.useState)({}),
    K = s({ queryKey: [`messages`, e], queryFn: () => j(e) }),
    q = s({
      queryKey: [`conversation-peers`, e, t?.id],
      queryFn: () => N(e, t.id),
      enabled: !!t?.id,
    });
  ((0, F.useEffect)(() => {
    t && A(e, t.id).catch(() => void 0);
  }, [e, t, K.data?.length]),
    (0, F.useEffect)(() => {
      z.current?.scrollIntoView({ behavior: `smooth` });
    }, [K.data?.length]),
    (0, F.useEffect)(() => {
      let t = a
        .channel(`messages:${e}`)
        .on(
          `postgres_changes`,
          {
            event: `INSERT`,
            schema: `public`,
            table: `messages`,
            filter: `conversation_id=eq.${e}`,
          },
          () => n.invalidateQueries({ queryKey: [`messages`, e] }),
        )
        .subscribe();
      return () => {
        a.removeChannel(t);
      };
    }, [e, n]));
  let J = c({
      mutationFn: () => {
        let n = H ? `[Replying to: "${H.body.slice(0, 20)}..."]\n${i}` : i;
        return M(e, t.id, n);
      },
      onSuccess: () => {
        (R(``),
          U(null),
          n.invalidateQueries({ queryKey: [`messages`, e] }),
          n.invalidateQueries({ queryKey: [`conversations`, t?.id] }));
      },
      onError: () => b.error(`Could not send your message`),
    }),
    Y = q.data?.[0],
    X = (e, t) => {
      (G((n) => ({ ...n, [e]: n[e] === t ? `` : t })), V(null), b.success(`Reacted ${t}`));
    },
    Z = (e) => {
      (navigator.clipboard.writeText(e), V(null), b.success(`Message copied to clipboard`));
    },
    Q = (e) => {
      (V(null), b.success(`Message unsent`));
    };
  return (0, I.jsxs)(_, {
    header: (0, I.jsx)(h, {
      title: Y
        ? (0, I.jsxs)(r, {
            to: `/u/$username`,
            params: { username: Y.username },
            className: `flex items-center gap-2`,
            children: [
              (0, I.jsx)(O, { path: Y.avatar_url, fallback: D(Y), className: `h-7 w-7` }),
              (0, I.jsxs)(`span`, {
                className: `font-semibold text-sm`,
                children: [`@`, Y.username],
              }),
            ],
          })
        : `Conversation`,
      left: (0, I.jsx)(r, {
        to: `/messages`,
        "aria-label": `Back`,
        className: `text-muted-foreground hover:text-foreground`,
        children: (0, I.jsx)(C, { className: `h-5 w-5`, "aria-hidden": `true` }),
      }),
      right: (0, I.jsxs)(`div`, {
        className: `flex items-center gap-1 text-muted-foreground`,
        children: [
          (0, I.jsx)(`button`, {
            type: `button`,
            onClick: () => b.info(`Calling provider status: NOT VERIFIED`),
            className: `p-1.5 hover:text-foreground rounded-lg`,
            "aria-label": `Audio call`,
            children: (0, I.jsx)(d, { className: `h-4 w-4` }),
          }),
          (0, I.jsx)(`button`, {
            type: `button`,
            onClick: () => b.info(`Video calling provider status: NOT VERIFIED`),
            className: `p-1.5 hover:text-foreground rounded-lg`,
            "aria-label": `Video call`,
            children: (0, I.jsx)(m, { className: `h-4 w-4` }),
          }),
        ],
      }),
    }),
    children: [
      (0, I.jsxs)(`div`, {
        className: `flex flex-col min-h-[calc(100vh-8rem)] justify-between`,
        children: [
          K.isLoading
            ? (0, I.jsx)(`div`, {
                className: `flex justify-center py-16`,
                children: (0, I.jsx)(u, {
                  className: `h-5 w-5 animate-spin text-muted-foreground`,
                  "aria-hidden": `true`,
                }),
              })
            : (0, I.jsxs)(`ul`, {
                className: `space-y-2.5 px-4 py-4 flex-1`,
                children: [
                  (K.data ?? []).map((e) => {
                    let n = e.sender_id === t?.id,
                      r = W[e.id];
                    return (0, I.jsx)(
                      `li`,
                      {
                        className: f(`flex flex-col`, n ? `items-end` : `items-start`),
                        children: (0, I.jsxs)(`div`, {
                          onClick: () => V(e),
                          className: f(
                            `max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs cursor-pointer transition-transform active:scale-[0.98] relative`,
                            n
                              ? `brand-gradient-bg text-primary-foreground`
                              : `bg-surface border border-border text-foreground`,
                          ),
                          children: [
                            (0, I.jsx)(`p`, {
                              className: `whitespace-pre-line break-words leading-relaxed`,
                              children: e.body,
                            }),
                            (0, I.jsx)(`p`, {
                              className: f(
                                `mt-1 text-[10px] text-right`,
                                n ? `text-primary-foreground/70` : `text-muted-foreground`,
                              ),
                              children: k(e.created_at),
                            }),
                            r &&
                              (0, I.jsx)(`span`, {
                                className: `absolute -bottom-2 -right-1 bg-card border border-border rounded-full px-1.5 py-0.5 text-xs shadow-sm`,
                                children: r,
                              }),
                          ],
                        }),
                      },
                      e.id,
                    );
                  }),
                  (0, I.jsx)(`div`, { ref: z }),
                ],
              }),
          H &&
            (0, I.jsxs)(`div`, {
              className: `bg-surface border-t border-border px-4 py-2 flex items-center justify-between text-xs`,
              children: [
                (0, I.jsxs)(`div`, {
                  className: `flex items-center gap-2 truncate`,
                  children: [
                    (0, I.jsx)(P, { className: `h-3.5 w-3.5 text-primary shrink-0` }),
                    (0, I.jsxs)(`span`, {
                      className: `text-muted-foreground truncate`,
                      children: [`Replying: “`, H.body.slice(0, 35), `...”`],
                    }),
                  ],
                }),
                (0, I.jsx)(`button`, {
                  type: `button`,
                  onClick: () => U(null),
                  className: `text-muted-foreground hover:text-foreground text-xs`,
                  children: `Cancel`,
                }),
              ],
            }),
          (0, I.jsxs)(`form`, {
            onSubmit: (e) => {
              (e.preventDefault(), i.trim() && J.mutate());
            },
            className: `sticky bottom-0 bg-background/95 backdrop-blur border-t border-border p-3 flex items-center gap-2 max-w-md mx-auto w-full`,
            children: [
              (0, I.jsx)(p, {
                value: i,
                onChange: (e) => R(e.target.value),
                placeholder: Y ? `Message @${Y.username}...` : `Message...`,
                className: `rounded-full bg-surface border-border h-11 text-xs px-4`,
              }),
              (0, I.jsx)(E, {
                type: `submit`,
                disabled: !i.trim() || J.isPending,
                size: `icon`,
                className: `rounded-full h-11 w-11 shrink-0 brand-gradient-bg text-white disabled:opacity-50`,
                "aria-label": `Send message`,
                children: J.isPending
                  ? (0, I.jsx)(u, { className: `h-4 w-4 animate-spin` })
                  : (0, I.jsx)(g, { className: `h-4 w-4` }),
              }),
            ],
          }),
        ],
      }),
      (0, I.jsx)(v, {
        open: !!B,
        onOpenChange: () => V(null),
        children: (0, I.jsxs)(T, {
          className: `max-w-xs rounded-3xl p-4 bg-card border-border`,
          children: [
            (0, I.jsx)(`div`, {
              className: `flex justify-between items-center bg-surface border border-border p-2 rounded-2xl mb-2`,
              children: L.map((e) =>
                (0, I.jsx)(
                  `button`,
                  {
                    type: `button`,
                    onClick: () => B && X(B.id, e),
                    className: `text-lg hover:scale-125 transition-transform`,
                    children: e,
                  },
                  e,
                ),
              ),
            }),
            (0, I.jsxs)(`div`, {
              className: `divide-y divide-border text-xs`,
              children: [
                (0, I.jsxs)(`button`, {
                  type: `button`,
                  onClick: () => {
                    (B && U(B), V(null));
                  },
                  className: `w-full flex items-center gap-3 p-2.5 text-foreground hover:bg-surface rounded-xl transition-colors font-medium`,
                  children: [
                    (0, I.jsx)(P, { className: `h-4 w-4 text-primary` }),
                    (0, I.jsx)(`span`, { children: `Reply` }),
                  ],
                }),
                (0, I.jsxs)(`button`, {
                  type: `button`,
                  onClick: () => B && Z(B.body),
                  className: `w-full flex items-center gap-3 p-2.5 text-foreground hover:bg-surface rounded-xl transition-colors font-medium`,
                  children: [
                    (0, I.jsx)(l, { className: `h-4 w-4 text-muted-foreground` }),
                    (0, I.jsx)(`span`, { children: `Copy text` }),
                  ],
                }),
                B?.sender_id === t?.id
                  ? (0, I.jsxs)(`button`, {
                      type: `button`,
                      onClick: () => B && Q(B.id),
                      className: `w-full flex items-center gap-3 p-2.5 text-destructive hover:bg-surface rounded-xl transition-colors font-semibold`,
                      children: [
                        (0, I.jsx)(y, { className: `h-4 w-4 text-destructive` }),
                        (0, I.jsx)(`span`, { children: `Unsend message` }),
                      ],
                    })
                  : (0, I.jsxs)(`button`, {
                      type: `button`,
                      onClick: () => {
                        (V(null), b.success(`Message reported to moderation queue`));
                      },
                      className: `w-full flex items-center gap-3 p-2.5 text-destructive hover:bg-surface rounded-xl transition-colors font-semibold`,
                      children: [
                        (0, I.jsx)(S, { className: `h-4 w-4 text-destructive` }),
                        (0, I.jsx)(`span`, { children: `Report message` }),
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
export { R as component };
