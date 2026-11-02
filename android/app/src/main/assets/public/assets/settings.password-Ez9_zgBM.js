import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { t as r } from "./useNavigate-BJOrhi-q.js";
import { t as i } from "./client-CNuAEkjg.js";
import { t as a } from "./eye-off-BTNjnLZQ.js";
import { t as o } from "./loader-circle-CbE-4Efj.js";
import { t as s } from "./save-AfvqHWga.js";
import { E as c, F as l, H as u, J as d, T as f, lt as p, tt as m } from "./index-BPJbQuiK.js";
import { t as h } from "./account-security-j8xmFq3N.js";
var g = t(e()),
  _ = n();
function v() {
  let e = r(),
    [t, n] = (0, g.useState)(``),
    [v, y] = (0, g.useState)(``),
    [b, x] = (0, g.useState)(``),
    [S, C] = (0, g.useState)(!1),
    [w, T] = (0, g.useState)(!1),
    [E, D] = (0, g.useState)(null),
    O = h(v);
  return (0, _.jsx)(f, {
    activeTab: `profile`,
    children: (0, _.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, _.jsx)(c, {
          title: `Change Password`,
          showBack: !0,
          onBack: () => e({ to: `/settings/security` }),
        }),
        (0, _.jsxs)(`div`, {
          className: `p-4 space-y-6`,
          children: [
            (0, _.jsxs)(`div`, {
              className: `p-3.5 bg-[#121212] border border-[#262626] rounded-xl flex items-center gap-3 text-xs text-gray-300`,
              children: [
                (0, _.jsx)(l, { className: `w-5 h-5 text-emerald-400 shrink-0` }),
                (0, _.jsx)(`p`, {
                  children: `Your password should be at least 8 characters and include a combination of numbers, letters and special characters.`,
                }),
              ],
            }),
            E &&
              (0, _.jsxs)(`div`, {
                role: `alert`,
                className: `p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2`,
                children: [
                  (0, _.jsx)(m, { className: `w-4 h-4 shrink-0 text-red-400 mt-0.5` }),
                  (0, _.jsx)(`span`, { className: `flex-1`, children: E }),
                ],
              }),
            (0, _.jsxs)(`form`, {
              onSubmit: async (e) => {
                if ((e.preventDefault(), D(null), !t)) {
                  D(`Please enter your current password.`);
                  return;
                }
                if (!O.isValid) {
                  D(O.errors[0] || `New password is not strong enough.`);
                  return;
                }
                if (v !== b) {
                  D(`New passwords do not match.`);
                  return;
                }
                T(!0);
                try {
                  let { data: e, error: r } = await i.auth.getUser(),
                    a = e?.user?.email;
                  if (r || !a) {
                    D(`Your authenticated account could not be verified. Please sign in again.`);
                    return;
                  }
                  let { error: o } = await i.auth.signInWithPassword({ email: a, password: t });
                  if (o) {
                    D(`Your current password is incorrect. Please try again.`);
                    return;
                  }
                  let { error: s } = await i.auth.updateUser({ password: v });
                  if (s) {
                    (D(s.message), p.error(s.message));
                    return;
                  }
                  (p.success(`Password updated successfully.`), n(``), y(``), x(``));
                } finally {
                  T(!1);
                }
              },
              className: `space-y-4`,
              children: [
                (0, _.jsxs)(`div`, {
                  className: `space-y-1.5`,
                  children: [
                    (0, _.jsx)(`label`, {
                      className: `text-xs font-semibold text-gray-300`,
                      children: `Current Password`,
                    }),
                    (0, _.jsxs)(`div`, {
                      className: `relative flex items-center`,
                      children: [
                        (0, _.jsx)(`span`, {
                          className: `absolute left-3.5 text-gray-400`,
                          children: (0, _.jsx)(u, { size: 16 }),
                        }),
                        (0, _.jsx)(`input`, {
                          type: S ? `text` : `password`,
                          value: t,
                          onChange: (e) => n(e.target.value),
                          required: !0,
                          placeholder: `Enter current password`,
                          className: `w-full h-11 pl-10 pr-11 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition`,
                        }),
                      ],
                    }),
                  ],
                }),
                (0, _.jsxs)(`div`, {
                  className: `space-y-1.5`,
                  children: [
                    (0, _.jsx)(`label`, {
                      className: `text-xs font-semibold text-gray-300`,
                      children: `New Password`,
                    }),
                    (0, _.jsxs)(`div`, {
                      className: `relative flex items-center`,
                      children: [
                        (0, _.jsx)(`span`, {
                          className: `absolute left-3.5 text-gray-400`,
                          children: (0, _.jsx)(u, { size: 16 }),
                        }),
                        (0, _.jsx)(`input`, {
                          type: S ? `text` : `password`,
                          value: v,
                          onChange: (e) => y(e.target.value),
                          required: !0,
                          placeholder: `Enter new strong password`,
                          className: `w-full h-11 pl-10 pr-11 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition`,
                        }),
                        (0, _.jsx)(`button`, {
                          type: `button`,
                          onClick: () => C(!S),
                          className: `absolute right-3 text-gray-400 hover:text-white`,
                          children: S ? (0, _.jsx)(a, { size: 16 }) : (0, _.jsx)(d, { size: 16 }),
                        }),
                      ],
                    }),
                    v.length > 0 &&
                      (0, _.jsxs)(`div`, {
                        className: `space-y-1 pt-1`,
                        children: [
                          (0, _.jsxs)(`div`, {
                            className: `flex justify-between text-[11px]`,
                            children: [
                              (0, _.jsx)(`span`, {
                                className: `text-gray-400`,
                                children: `Strength:`,
                              }),
                              (0, _.jsx)(`span`, {
                                className: `font-semibold ${O.score >= 80 ? `text-emerald-400` : O.score >= 50 ? `text-amber-400` : `text-rose-400`}`,
                                children: O.label,
                              }),
                            ],
                          }),
                          (0, _.jsx)(`div`, {
                            className: `w-full h-1.5 bg-[#262626] rounded-full overflow-hidden`,
                            children: (0, _.jsx)(`div`, {
                              className: `h-full transition-all duration-300 ${O.score >= 80 ? `bg-emerald-500` : O.score >= 50 ? `bg-amber-500` : `bg-rose-500`}`,
                              style: { width: `${O.score}%` },
                            }),
                          }),
                        ],
                      }),
                  ],
                }),
                (0, _.jsxs)(`div`, {
                  className: `space-y-1.5`,
                  children: [
                    (0, _.jsx)(`label`, {
                      className: `text-xs font-semibold text-gray-300`,
                      children: `Confirm New Password`,
                    }),
                    (0, _.jsxs)(`div`, {
                      className: `relative flex items-center`,
                      children: [
                        (0, _.jsx)(`span`, {
                          className: `absolute left-3.5 text-gray-400`,
                          children: (0, _.jsx)(u, { size: 16 }),
                        }),
                        (0, _.jsx)(`input`, {
                          type: S ? `text` : `password`,
                          value: b,
                          onChange: (e) => x(e.target.value),
                          required: !0,
                          placeholder: `Re-type new password`,
                          className: `w-full h-11 pl-10 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition`,
                        }),
                      ],
                    }),
                  ],
                }),
                (0, _.jsxs)(`button`, {
                  type: `submit`,
                  disabled: w,
                  className: `w-full h-11 mt-4 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50`,
                  children: [
                    w
                      ? (0, _.jsx)(o, { className: `w-4 h-4 animate-spin` })
                      : (0, _.jsx)(s, { className: `w-4 h-4` }),
                    (0, _.jsx)(`span`, { children: `Update Password` }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
export { v as component };
