import { t as e } from "./jsx-runtime-B5yqYJvp.js";
import { t } from "./useNavigate-BJOrhi-q.js";
import { E as n, T as r, et as i } from "./index-BPJbQuiK.js";
var a = e();
function o() {
  let e = t();
  return (0, a.jsx)(r, {
    activeTab: `profile`,
    children: (0, a.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, a.jsx)(n, {
          title: `Account Status`,
          showBack: !0,
          onBack: () => e({ to: `/safety` }),
        }),
        (0, a.jsxs)(`div`, {
          className: `p-4 space-y-6`,
          children: [
            (0, a.jsxs)(`div`, {
              className: `text-center py-6 space-y-3`,
              children: [
                (0, a.jsx)(`div`, {
                  className: `w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400`,
                  children: (0, a.jsx)(i, { className: `w-8 h-8` }),
                }),
                (0, a.jsxs)(`div`, {
                  children: [
                    (0, a.jsx)(`h2`, {
                      className: `text-lg font-bold text-white`,
                      children: `Your Account is in Good Standing`,
                    }),
                    (0, a.jsx)(`p`, {
                      className: `text-xs text-gray-400 mt-1 max-w-sm mx-auto`,
                      children: `Thank you for respecting the Opexnal community. You have no policy violations or active strikes.`,
                    }),
                  ],
                }),
              ],
            }),
            (0, a.jsxs)(`div`, {
              className: `space-y-2.5`,
              children: [
                (0, a.jsx)(`h3`, {
                  className: `text-xs font-bold uppercase tracking-wider text-gray-400`,
                  children: `Compliance Checklist`,
                }),
                (0, a.jsxs)(`div`, {
                  className: `p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between`,
                  children: [
                    (0, a.jsxs)(`div`, {
                      className: `space-y-0.5`,
                      children: [
                        (0, a.jsx)(`span`, {
                          className: `text-xs font-semibold text-white`,
                          children: `Community Guidelines`,
                        }),
                        (0, a.jsx)(`p`, {
                          className: `text-[11px] text-emerald-400`,
                          children: `0 violations`,
                        }),
                      ],
                    }),
                    (0, a.jsx)(i, { className: `w-4 h-4 text-emerald-400` }),
                  ],
                }),
                (0, a.jsxs)(`div`, {
                  className: `p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between`,
                  children: [
                    (0, a.jsxs)(`div`, {
                      className: `space-y-0.5`,
                      children: [
                        (0, a.jsx)(`span`, {
                          className: `text-xs font-semibold text-white`,
                          children: `Copyright & Intellectual Property`,
                        }),
                        (0, a.jsx)(`p`, {
                          className: `text-[11px] text-emerald-400`,
                          children: `No active claims or disputes`,
                        }),
                      ],
                    }),
                    (0, a.jsx)(i, { className: `w-4 h-4 text-emerald-400` }),
                  ],
                }),
                (0, a.jsxs)(`div`, {
                  className: `p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between`,
                  children: [
                    (0, a.jsxs)(`div`, {
                      className: `space-y-0.5`,
                      children: [
                        (0, a.jsx)(`span`, {
                          className: `text-xs font-semibold text-white`,
                          children: `Monetization & Partner Eligibility`,
                        }),
                        (0, a.jsx)(`p`, {
                          className: `text-[11px] text-emerald-400`,
                          children: `Eligible for payouts and creator subscriptions`,
                        }),
                      ],
                    }),
                    (0, a.jsx)(i, { className: `w-4 h-4 text-emerald-400` }),
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
export { o as component };
