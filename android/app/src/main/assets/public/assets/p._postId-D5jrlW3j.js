import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { n as r } from "./createLucideIcon-DgzBSI1Z.js";
import { j as i } from "./removable-Bti6oWPM.js";
import { t as a } from "./useQuery-Sthak1vL.js";
import { t as o } from "./useMutation-DAlJQPHF.js";
import { t as s } from "./loader-circle-CbE-4Efj.js";
import { t as c } from "./post-card-pMCNYo3h.js";
import {
  C as l,
  E as u,
  K as d,
  T as f,
  a as p,
  lt as m,
  u as h,
  w as g,
} from "./index-BPJbQuiK.js";
import { i as _ } from "./profile-qFNPerqP.js";
import { t as v } from "./avatar-ECPYu-KR.js";
import { a as y, c as b, h as x, i as S, m as C, r as w, t as T } from "./posts-CfzQybWe.js";
var E = t(e()),
  D = n();
function O() {
  let { postId: e } = p.useParams(),
    { user: t } = h(),
    n = i(),
    [O, k] = (0, E.useState)(``),
    A = a({ queryKey: [`post`, e, t?.id], queryFn: () => b(e, t?.id) }),
    j = a({ queryKey: [`comments`, e, t?.id], queryFn: () => y(e, t?.id) }),
    M = o({
      mutationFn: () => T({ postId: e, userId: t.id, body: O }),
      onSuccess: () => {
        (k(``),
          n.invalidateQueries({ queryKey: [`comments`, e] }),
          n.invalidateQueries({ queryKey: [`post`, e] }));
      },
      onError: () => m.error(`Could not post your comment`),
    }),
    N = o({
      mutationFn: ({ id: e, liked: n }) => x(e, t.id, n),
      onSuccess: () => n.invalidateQueries({ queryKey: [`comments`, e] }),
      onError: () => m.error(`Could not update the like`),
    }),
    P = o({
      mutationFn: (e) => w(e),
      onSuccess: () => {
        (n.invalidateQueries({ queryKey: [`comments`, e] }),
          n.invalidateQueries({ queryKey: [`post`, e] }));
      },
      onError: () => m.error(`Could not delete the comment`),
    }),
    F = A.data;
  return (0, D.jsx)(f, {
    header: (0, D.jsx)(u, { title: `Post` }),
    children: A.isLoading
      ? (0, D.jsx)(`div`, {
          className: `flex justify-center py-16`,
          children: (0, D.jsx)(s, {
            className: `h-5 w-5 animate-spin text-muted-foreground`,
            "aria-hidden": `true`,
          }),
        })
      : F
        ? (0, D.jsxs)(D.Fragment, {
            children: [
              (0, D.jsx)(c, { post: F, viewerId: t?.id ?? null }),
              (0, D.jsxs)(`section`, {
                className: `space-y-4 px-4 py-4`,
                children: [
                  (j.data ?? []).map((e) =>
                    (0, D.jsxs)(
                      `div`,
                      {
                        className: `flex gap-3`,
                        children: [
                          (0, D.jsx)(v, {
                            path: e.author?.avatar_url ?? null,
                            fallback: e.author ? _(e.author) : `?`,
                            className: `h-8 w-8`,
                          }),
                          (0, D.jsxs)(`div`, {
                            className: `min-w-0 flex-1`,
                            children: [
                              (0, D.jsxs)(`p`, {
                                className: `text-sm`,
                                children: [
                                  e.author?.username
                                    ? (0, D.jsx)(r, {
                                        to: `/u/$username`,
                                        params: { username: e.author.username },
                                        className: `mr-1 font-semibold hover:underline`,
                                        children: e.author.username,
                                      })
                                    : (0, D.jsx)(`span`, {
                                        className: `mr-1 font-semibold`,
                                        children: `user`,
                                      }),
                                  e.body,
                                ],
                              }),
                              (0, D.jsxs)(`div`, {
                                className: `flex items-center gap-3 text-xs text-muted-foreground`,
                                children: [
                                  (0, D.jsx)(`span`, { children: C(e.created_at) }),
                                  e.likes_count > 0 &&
                                    (0, D.jsxs)(`span`, { children: [S(e.likes_count), ` likes`] }),
                                  t &&
                                    e.user_id === t.id &&
                                    (0, D.jsx)(`button`, {
                                      type: `button`,
                                      className: `hover:text-destructive`,
                                      onClick: () => P.mutate(e.id),
                                      children: `Delete`,
                                    }),
                                ],
                              }),
                            ],
                          }),
                          t &&
                            (0, D.jsx)(`button`, {
                              type: `button`,
                              "aria-label": e.liked ? `Unlike comment` : `Like comment`,
                              className: `pt-1 text-muted-foreground transition-colors hover:text-foreground`,
                              onClick: () => N.mutate({ id: e.id, liked: e.liked }),
                              children: (0, D.jsx)(d, {
                                className: `h-4 w-4 ${e.liked ? `fill-primary text-primary` : ``}`,
                                "aria-hidden": `true`,
                              }),
                            }),
                        ],
                      },
                      e.id,
                    ),
                  ),
                  (j.data ?? []).length === 0 &&
                    !j.isLoading &&
                    (0, D.jsx)(`p`, {
                      className: `text-sm text-muted-foreground`,
                      children: `No comments yet.`,
                    }),
                ],
              }),
              F.comments_enabled &&
                t &&
                (0, D.jsxs)(`form`, {
                  className: `sticky bottom-20 flex items-center gap-2 border-t border-border bg-background px-4 py-3`,
                  onSubmit: (e) => {
                    (e.preventDefault(), O.trim() && M.mutate());
                  },
                  children: [
                    (0, D.jsx)(l, {
                      value: O,
                      onChange: (e) => k(e.target.value),
                      maxLength: 1e3,
                      placeholder: `Add a comment…`,
                      "aria-label": `Add a comment`,
                    }),
                    (0, D.jsx)(g, {
                      type: `submit`,
                      variant: `brand`,
                      size: `sm`,
                      disabled: !O.trim() || M.isPending,
                      children: `Post`,
                    }),
                  ],
                }),
            ],
          })
        : (0, D.jsx)(`p`, {
            className: `px-4 py-16 text-center text-sm text-muted-foreground`,
            children: `This post is unavailable.`,
          }),
  });
}
export { O as component };
