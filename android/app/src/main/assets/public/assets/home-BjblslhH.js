import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { n as r } from "./createLucideIcon-DgzBSI1Z.js";
import { j as i } from "./removable-Bti6oWPM.js";
import { t as a } from "./useInfiniteQuery-CebkjBit.js";
import { t as o } from "./loader-circle-CbE-4Efj.js";
import { n as s, t as c } from "./refresh-cw-Bz3isKCO.js";
import { t as l } from "./post-card-pMCNYo3h.js";
import { t as u } from "./utils-DojpP95n.js";
import {
  B as d,
  E as f,
  M as p,
  N as m,
  P as h,
  T as g,
  lt as _,
  p as v,
  u as y,
  w as b,
} from "./index-BPJbQuiK.js";
import { s as x } from "./posts-CfzQybWe.js";
import { n as S } from "./logo-CKS7tkKV.js";
import { t as C } from "./story-tray-Dd2nkKhO.js";
var w = t(e()),
  T = n();
function E() {
  let { user: e } = y();
  i();
  let t = (0, w.useRef)(null),
    [n, E] = (0, w.useState)(`for_you`),
    [D, O] = (0, w.useState)(!1),
    {
      data: k,
      isLoading: A,
      isError: j,
      fetchNextPage: M,
      hasNextPage: N,
      isFetchingNextPage: P,
      refetch: F,
    } = a({
      queryKey: [`home-feed`, e?.id],
      enabled: !!e,
      initialPageParam: null,
      queryFn: ({ pageParam: t }) => x(e.id, t, 10),
      getNextPageParam: (e) => e.nextCursor,
    });
  (0, w.useEffect)(() => {
    let e = t.current;
    if (!e || !N) return;
    let n = new IntersectionObserver(
      (e) => {
        e[0]?.isIntersecting && !P && M();
      },
      { rootMargin: `400px` },
    );
    return (n.observe(e), () => n.disconnect());
  }, [N, P, M]);
  let I = (0, w.useMemo)(() => (k?.pages ?? []).flatMap((e) => e.items), [k?.pages]),
    L = (0, w.useMemo)(() => {
      if (n === `for_you`) return I;
      if (n === `favorites`) {
        let e = v().favoriteCreators;
        return e.length === 0 ? I : I.filter((t) => t.author && e.includes(t.author.username));
      }
      return I;
    }, [I, n]);
  return (0, T.jsxs)(g, {
    header: (0, T.jsx)(f, {
      title: (0, T.jsx)(`div`, {
        className: `flex items-center gap-2`,
        children: (0, T.jsx)(S, { className: `text-lg` }),
      }),
      right: (0, T.jsxs)(`div`, {
        className: `flex items-center gap-1`,
        children: [
          (0, T.jsx)(r, {
            to: `/live`,
            "aria-label": `Start Live broadcast`,
            className: `flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 transition-colors`,
            children: (0, T.jsx)(d, { className: `h-5 w-5` }),
          }),
          (0, T.jsx)(r, {
            to: `/ai`,
            "aria-label": `Opexnal AI Studio`,
            className: `flex h-9 w-9 items-center justify-center rounded-xl text-primary hover:bg-primary/10 transition-colors`,
            children: (0, T.jsx)(h, { className: `h-5 w-5` }),
          }),
          (0, T.jsx)(r, {
            to: `/messages`,
            "aria-label": `Direct Messages`,
            className: `flex h-9 w-9 items-center justify-center rounded-xl text-foreground hover:bg-secondary transition-colors`,
            children: (0, T.jsx)(s, { className: `h-5 w-5` }),
          }),
        ],
      }),
    }),
    children: [
      (0, T.jsxs)(`div`, {
        className: `sticky top-14 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-2 flex items-center justify-between`,
        children: [
          (0, T.jsx)(`div`, {
            className: `flex bg-surface border border-border p-0.5 rounded-xl gap-0.5`,
            children: [
              { id: `for_you`, label: `For You` },
              { id: `following`, label: `Following` },
              { id: `favorites`, label: `Favorites` },
            ].map((e) =>
              (0, T.jsx)(
                `button`,
                {
                  type: `button`,
                  onClick: () => E(e.id),
                  className: u(
                    `px-3 py-1 text-xs font-semibold rounded-lg transition-all`,
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
          (0, T.jsxs)(`div`, {
            className: `flex items-center gap-2`,
            children: [
              n === `favorites` &&
                (0, T.jsxs)(r, {
                  to: `/close-friends`,
                  className: `text-[11px] font-semibold text-amber-400 hover:underline flex items-center gap-1`,
                  children: [(0, T.jsx)(p, { className: `h-3 w-3` }), `Manage`],
                }),
              (0, T.jsx)(`button`, {
                type: `button`,
                onClick: async () => {
                  (O(!0), await F(), O(!1), _.success(`Feed refreshed ✨`));
                },
                disabled: D,
                className: `h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors`,
                "aria-label": `Refresh feed`,
                children: (0, T.jsx)(c, {
                  className: u(`h-3.5 w-3.5`, D && `animate-spin text-primary`),
                }),
              }),
            ],
          }),
        ],
      }),
      e && (0, T.jsx)(C, { viewerId: e.id }),
      A
        ? (0, T.jsx)(`div`, {
            className: `flex justify-center py-16`,
            children: (0, T.jsx)(o, {
              className: `h-5 w-5 animate-spin text-primary`,
              "aria-hidden": `true`,
            }),
          })
        : j
          ? (0, T.jsx)(`p`, {
              className: `px-4 py-16 text-center text-sm text-muted-foreground`,
              role: `alert`,
              children: `We couldn't load your feed. Pull down or try again in a moment.`,
            })
          : L.length === 0
            ? (0, T.jsxs)(`div`, {
                className: `flex flex-col items-center gap-4 px-6 py-16 text-center max-w-sm mx-auto`,
                children: [
                  (0, T.jsx)(`div`, {
                    className: `flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient-bg text-primary-foreground shadow-md`,
                    children: (0, T.jsx)(m, { className: `h-7 w-7`, "aria-hidden": `true` }),
                  }),
                  (0, T.jsx)(`h2`, {
                    className: `text-lg font-bold text-foreground`,
                    children:
                      n === `favorites` ? `No Posts from Favorites Yet` : `Welcome to Opexnal`,
                  }),
                  (0, T.jsx)(`p`, {
                    className: `text-xs text-muted-foreground`,
                    children:
                      n === `favorites`
                        ? `Add favorite creators to see their posts highlighted right here.`
                        : `Follow creators on Explore or share your first post with photos, videos, and AI magic captions.`,
                  }),
                  (0, T.jsx)(`div`, {
                    className: `flex flex-col w-full gap-2 pt-2`,
                    children:
                      n === `favorites`
                        ? (0, T.jsx)(b, {
                            asChild: !0,
                            className: `w-full brand-gradient-bg text-primary-foreground font-semibold rounded-xl text-xs`,
                            children: (0, T.jsx)(r, {
                              to: `/close-friends`,
                              children: `Manage Favorites`,
                            }),
                          })
                        : (0, T.jsxs)(T.Fragment, {
                            children: [
                              (0, T.jsx)(b, {
                                asChild: !0,
                                className: `w-full brand-gradient-bg text-primary-foreground font-semibold rounded-xl text-xs`,
                                children: (0, T.jsx)(r, {
                                  to: `/create`,
                                  children: `Create First Post`,
                                }),
                              }),
                              (0, T.jsx)(b, {
                                asChild: !0,
                                variant: `surface`,
                                className: `w-full rounded-xl text-xs`,
                                children: (0, T.jsx)(r, {
                                  to: `/explore`,
                                  children: `Explore Creators`,
                                }),
                              }),
                            ],
                          }),
                  }),
                ],
              })
            : (0, T.jsxs)(`div`, {
                children: [
                  L.map((t) => (0, T.jsx)(l, { post: t, viewerId: e?.id ?? null }, t.id)),
                  (0, T.jsx)(`div`, { ref: t, className: `h-8` }),
                  P &&
                    (0, T.jsx)(`div`, {
                      className: `flex justify-center py-4`,
                      children: (0, T.jsx)(o, {
                        className: `h-5 w-5 animate-spin text-primary`,
                        "aria-hidden": `true`,
                      }),
                    }),
                  !N &&
                    (0, T.jsx)(`p`, {
                      className: `py-8 text-center text-xs text-muted-foreground`,
                      children: `You're all caught up on Opexnal! ✨`,
                    }),
                ],
              }),
    ],
  });
}
export { E as component };
