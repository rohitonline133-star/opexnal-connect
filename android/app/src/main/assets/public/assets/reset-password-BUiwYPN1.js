import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { n as r } from "./createLucideIcon-DgzBSI1Z.js";
import { t as i } from "./useNavigate-BJOrhi-q.js";
import { t as a } from "./client-CNuAEkjg.js";
import { t as o } from "./arrow-left-CPTA-aqL.js";
import { t as s } from "./eye-off-BTNjnLZQ.js";
import { t as c } from "./key-round-Bo-BHNma.js";
import { t as l } from "./loader-circle-CbE-4Efj.js";
import { i as u } from "./types-CuvG8GNf.js";
import {
  C as d,
  F as f,
  H as p,
  J as m,
  it as h,
  lt as g,
  tt as _,
  w as v,
} from "./index-BPJbQuiK.js";
import { t as y } from "./label-Oe9ke0jm.js";
import { n as b, t as x } from "./logo-CKS7tkKV.js";
var S = t(e()),
  C = n(),
  w = u()
    .min(10, `Password must be at least 10 characters`)
    .max(128)
    .regex(/[a-z]/, `Must include at least one lowercase letter`)
    .regex(/[A-Z]/, `Must include at least one uppercase letter`)
    .regex(/[0-9]/, `Must include at least one number`);
function T() {
  let e = i(),
    [t, n] = (0, S.useState)(``),
    [u, h] = (0, S.useState)(``),
    [T, D] = (0, S.useState)(!1),
    [O, k] = (0, S.useState)(!1),
    [A, j] = (0, S.useState)(!1),
    [M, N] = (0, S.useState)(null),
    [P, F] = (0, S.useState)(!1),
    [I, L] = (0, S.useState)(!0);
  (0, S.useEffect)(() => {
    let e = !0;
    (async () => {
      try {
        let { data: t, error: n } = await a.auth.getSession();
        if (!e) return;
        n || !t.session
          ? (F(!1),
            N(
              `This password-reset link is invalid or has expired. Please request a new reset link.`,
            ))
          : (F(!0), N(null));
      } catch {
        if (!e) return;
        (F(!1),
          N(`We could not verify your password-reset session. Please request a new reset link.`));
      } finally {
        e && L(!1);
      }
    })();
    let { data: t } = a.auth.onAuthStateChange((t) => {
      e && (t === `PASSWORD_RECOVERY` && (F(!0), N(null), L(!1)), t === `SIGNED_OUT` && F(!1));
    });
    return () => {
      ((e = !1), t.subscription.unsubscribe());
    };
  }, []);
  let R = {
    hasLength: t.length >= 10,
    hasLower: /[a-z]/.test(t),
    hasUpper: /[A-Z]/.test(t),
    hasNumber: /[0-9]/.test(t),
    matches: u.length > 0 && t === u,
  };
  async function z(n) {
    (n.preventDefault(), N(null));
    let r = w.safeParse(t);
    if (!r.success) {
      let e = r.error.issues[0]?.message ?? `Invalid password`;
      (N(e), g.error(e));
      return;
    }
    if (t !== u) {
      let e = `Passwords do not match`;
      (N(e), g.error(e));
      return;
    }
    if (!P) {
      let e = `Your password-reset session is missing or expired. Please request a new reset link.`;
      (N(e), g.error(e));
      return;
    }
    j(!0);
    try {
      let { error: t } = await a.auth.updateUser({ password: r.data });
      if (t) {
        (N(t.message), g.error(t.message));
        return;
      }
      (g.success(`Your password has been successfully updated!`), e({ to: `/home`, replace: !0 }));
    } catch (e) {
      let t = e instanceof Error ? e.message : `Failed to update password. Please try again.`;
      (N(t), g.error(t));
    } finally {
      j(!1);
    }
  }
  return (0, C.jsxs)(`main`, {
    className: `relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-10 sm:px-6`,
    children: [
      (0, C.jsx)(`div`, {
        className: `brand-glow pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70`,
        "aria-hidden": `true`,
      }),
      (0, C.jsxs)(`div`, {
        className: `relative w-full max-w-[440px]`,
        children: [
          (0, C.jsxs)(`div`, {
            className: `mb-6 flex flex-col items-center text-center`,
            children: [
              (0, C.jsxs)(r, {
                to: `/`,
                className: `group inline-flex items-center gap-3 transition-transform duration-200 active:scale-95`,
                children: [
                  (0, C.jsx)(x, {
                    className: `h-11 w-11 transition-all duration-300 group-hover:shadow-[0_0_24px_rgba(168,85,247,0.4)]`,
                  }),
                  (0, C.jsx)(b, { className: `text-2xl` }),
                ],
              }),
              (0, C.jsx)(`p`, {
                className: `mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground`,
                children: `Security & Authentication`,
              }),
            ],
          }),
          (0, C.jsxs)(`div`, {
            className: `rounded-3xl border border-border/80 bg-surface/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8 elevated`,
            children: [
              (0, C.jsxs)(`div`, {
                className: `mb-6`,
                children: [
                  (0, C.jsx)(`h1`, {
                    className: `text-xl font-bold tracking-tight text-foreground sm:text-2xl`,
                    children: `Set a new password`,
                  }),
                  (0, C.jsx)(`p`, {
                    className: `mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm`,
                    children: `Choose a strong, unique password to protect your Opexnal account.`,
                  }),
                ],
              }),
              M &&
                (0, C.jsxs)(`div`, {
                  role: `alert`,
                  className: `mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive-foreground animate-in fade-in-50`,
                  children: [
                    (0, C.jsx)(_, {
                      className: `mt-0.5 h-4 w-4 shrink-0 text-destructive`,
                      "aria-hidden": `true`,
                    }),
                    (0, C.jsx)(`div`, {
                      className: `flex-1 leading-relaxed text-destructive`,
                      children: M,
                    }),
                  ],
                }),
              (0, C.jsxs)(`form`, {
                className: `space-y-4`,
                onSubmit: z,
                noValidate: !0,
                children: [
                  (0, C.jsxs)(`div`, {
                    className: `space-y-1.5`,
                    children: [
                      (0, C.jsx)(y, {
                        htmlFor: `new-password`,
                        className: `text-xs font-medium text-muted-foreground`,
                        children: `New password`,
                      }),
                      (0, C.jsxs)(`div`, {
                        className: `relative`,
                        children: [
                          (0, C.jsx)(p, {
                            className: `pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`,
                            "aria-hidden": `true`,
                          }),
                          (0, C.jsx)(d, {
                            id: `new-password`,
                            type: T ? `text` : `password`,
                            autoComplete: `new-password`,
                            placeholder: `At least 10 characters`,
                            value: t,
                            onChange: (e) => {
                              (n(e.target.value), M && N(null));
                            },
                            className: `h-11 rounded-xl border-border/80 bg-secondary/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary`,
                            required: !0,
                            disabled: A,
                          }),
                          (0, C.jsx)(`button`, {
                            type: `button`,
                            onClick: () => D((e) => !e),
                            "aria-label": T ? `Hide password` : `Show password`,
                            className: `absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground`,
                            children: T
                              ? (0, C.jsx)(s, { className: `h-4 w-4` })
                              : (0, C.jsx)(m, { className: `h-4 w-4` }),
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, C.jsxs)(`div`, {
                    className: `space-y-1.5`,
                    children: [
                      (0, C.jsx)(y, {
                        htmlFor: `confirm-password`,
                        className: `text-xs font-medium text-muted-foreground`,
                        children: `Confirm new password`,
                      }),
                      (0, C.jsxs)(`div`, {
                        className: `relative`,
                        children: [
                          (0, C.jsx)(f, {
                            className: `pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`,
                            "aria-hidden": `true`,
                          }),
                          (0, C.jsx)(d, {
                            id: `confirm-password`,
                            type: O ? `text` : `password`,
                            autoComplete: `new-password`,
                            placeholder: `Repeat new password`,
                            value: u,
                            onChange: (e) => {
                              (h(e.target.value), M && N(null));
                            },
                            className: `h-11 rounded-xl border-border/80 bg-secondary/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary`,
                            required: !0,
                            disabled: A,
                          }),
                          (0, C.jsx)(`button`, {
                            type: `button`,
                            onClick: () => k((e) => !e),
                            "aria-label": O ? `Hide password` : `Show password`,
                            className: `absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground`,
                            children: O
                              ? (0, C.jsx)(s, { className: `h-4 w-4` })
                              : (0, C.jsx)(m, { className: `h-4 w-4` }),
                          }),
                        ],
                      }),
                    ],
                  }),
                  t.length > 0 &&
                    (0, C.jsxs)(`div`, {
                      className: `rounded-xl border border-border/60 bg-secondary/30 p-3 text-[11px] space-y-1.5`,
                      children: [
                        (0, C.jsx)(`p`, {
                          className: `font-semibold text-muted-foreground`,
                          children: `Requirements:`,
                        }),
                        (0, C.jsxs)(`div`, {
                          className: `grid grid-cols-2 gap-1.5`,
                          children: [
                            (0, C.jsx)(E, { met: R.hasLength, label: `10+ characters` }),
                            (0, C.jsx)(E, { met: R.hasLower, label: `Lowercase letter` }),
                            (0, C.jsx)(E, { met: R.hasUpper, label: `Uppercase letter` }),
                            (0, C.jsx)(E, { met: R.hasNumber, label: `At least 1 number` }),
                          ],
                        }),
                        u.length > 0 &&
                          (0, C.jsx)(`div`, {
                            className: `pt-1`,
                            children: (0, C.jsx)(E, { met: R.matches, label: `Passwords match` }),
                          }),
                      ],
                    }),
                  (0, C.jsx)(`div`, {
                    className: `pt-2`,
                    children: (0, C.jsxs)(v, {
                      type: `submit`,
                      variant: `brand`,
                      size: `xl`,
                      className: `w-full font-semibold shadow-lg shadow-primary/20`,
                      disabled: A,
                      children: [
                        A
                          ? (0, C.jsx)(l, {
                              className: `mr-2 h-4 w-4 animate-spin`,
                              "aria-hidden": `true`,
                            })
                          : (0, C.jsx)(c, { className: `mr-2 h-4 w-4`, "aria-hidden": `true` }),
                        A ? `Updating password...` : `Update password`,
                      ],
                    }),
                  }),
                ],
              }),
              (0, C.jsx)(`div`, {
                className: `mt-6 pt-4 border-t border-border/60 text-center`,
                children: (0, C.jsxs)(r, {
                  to: `/auth`,
                  search: { mode: `login` },
                  className: `inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground`,
                  children: [(0, C.jsx)(o, { className: `h-3.5 w-3.5` }), `Return to log in`],
                }),
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function E({ met: e, label: t }) {
  return (0, C.jsxs)(`div`, {
    className: `flex items-center gap-1.5 ${e ? `text-emerald-400` : `text-muted-foreground`}`,
    children: [
      e
        ? (0, C.jsx)(h, { className: `h-3.5 w-3.5 shrink-0` })
        : (0, C.jsx)(`span`, {
            className: `h-1.5 w-1.5 rounded-full bg-muted-foreground/40 ml-1 mr-0.5`,
          }),
      (0, C.jsx)(`span`, { children: t }),
    ],
  });
}
export { T as component };
