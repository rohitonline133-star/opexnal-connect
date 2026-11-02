import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { t as r } from "./useNavigate-BJOrhi-q.js";
import { t as i } from "./auth-client-sF2KzMXy.js";
import { t as a } from "./loader-circle-CbE-4Efj.js";
import { A as o, E as s, T as c, j as l, lt as u } from "./index-BPJbQuiK.js";
var d = t(e()),
  f = n();
function p() {
  let e = r(),
    [t, n] = (0, d.useState)(``),
    [p, m] = (0, d.useState)(`privacy`),
    [h, g] = (0, d.useState)(``),
    [_, v] = (0, d.useState)(!1);
  return (0, f.jsx)(c, {
    activeTab: `profile`,
    children: (0, f.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, f.jsx)(s, {
          title: `Delete Account`,
          showBack: !0,
          onBack: () => e({ to: `/settings` }),
        }),
        (0, f.jsxs)(`div`, {
          className: `p-4 space-y-6`,
          children: [
            (0, f.jsxs)(`div`, {
              className: `p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-2 text-xs text-rose-200`,
              children: [
                (0, f.jsxs)(`div`, {
                  className: `flex items-center gap-2 font-bold text-rose-400`,
                  children: [
                    (0, f.jsx)(o, { className: `w-5 h-5 shrink-0` }),
                    (0, f.jsx)(`span`, { children: `Permanent Deletion Notice` }),
                  ],
                }),
                (0, f.jsx)(`p`, {
                  className: `text-rose-300 text-[11px] leading-relaxed`,
                  children: `If you request deletion, your profile, posts, reels, stories and follower connections will be permanently scheduled for erasure. You have 30 days to cancel deletion by logging back in.`,
                }),
              ],
            }),
            (0, f.jsxs)(`form`, {
              onSubmit: async (n) => {
                if ((n.preventDefault(), h !== `DELETE`)) {
                  u.error(`Please type DELETE to confirm permanent removal.`);
                  return;
                }
                if (!t) {
                  u.error(`Please enter your password.`);
                  return;
                }
                v(!0);
                try {
                  (await i.signOut(),
                    u.success(
                      `Your deletion request has been submitted. 30-day grace period initiated.`,
                    ),
                    e({ to: `/auth/login`, replace: !0 }));
                } catch {
                  u.error(`Deletion request failed.`);
                } finally {
                  v(!1);
                }
              },
              className: `space-y-4`,
              children: [
                (0, f.jsxs)(`div`, {
                  className: `space-y-1.5`,
                  children: [
                    (0, f.jsx)(`label`, {
                      className: `text-xs font-semibold text-gray-300`,
                      children: `Why are you deleting your account?`,
                    }),
                    (0, f.jsxs)(`select`, {
                      value: p,
                      onChange: (e) => m(e.target.value),
                      className: `w-full h-11 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500`,
                      children: [
                        (0, f.jsx)(`option`, { value: `privacy`, children: `Privacy concerns` }),
                        (0, f.jsx)(`option`, {
                          value: `distraction`,
                          children: `Too distracting / taking a break`,
                        }),
                        (0, f.jsx)(`option`, {
                          value: `second_account`,
                          children: `Created a second account`,
                        }),
                        (0, f.jsx)(`option`, {
                          value: `trouble_getting_started`,
                          children: `Trouble getting started`,
                        }),
                        (0, f.jsx)(`option`, { value: `other`, children: `Something else` }),
                      ],
                    }),
                  ],
                }),
                (0, f.jsxs)(`div`, {
                  className: `space-y-1.5`,
                  children: [
                    (0, f.jsx)(`label`, {
                      className: `text-xs font-semibold text-gray-300`,
                      children: `Enter Your Password`,
                    }),
                    (0, f.jsx)(`input`, {
                      type: `password`,
                      value: t,
                      onChange: (e) => n(e.target.value),
                      required: !0,
                      placeholder: `Enter password to confirm`,
                      className: `w-full h-11 px-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition`,
                    }),
                  ],
                }),
                (0, f.jsxs)(`div`, {
                  className: `space-y-1.5`,
                  children: [
                    (0, f.jsxs)(`label`, {
                      className: `text-xs font-semibold text-gray-300`,
                      children: [
                        `Type `,
                        (0, f.jsx)(`strong`, { className: `text-rose-400`, children: `DELETE` }),
                        ` to confirm:`,
                      ],
                    }),
                    (0, f.jsx)(`input`, {
                      type: `text`,
                      value: h,
                      onChange: (e) => g(e.target.value),
                      required: !0,
                      placeholder: `DELETE`,
                      className: `w-full h-11 px-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition font-mono`,
                    }),
                  ],
                }),
                (0, f.jsxs)(`button`, {
                  type: `submit`,
                  disabled: _ || h !== `DELETE`,
                  className: `w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50`,
                  children: [
                    _
                      ? (0, f.jsx)(a, { className: `w-4 h-4 animate-spin` })
                      : (0, f.jsx)(l, { className: `w-4 h-4` }),
                    (0, f.jsx)(`span`, { children: `Permanently Delete My Account` }),
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
export { p as component };
