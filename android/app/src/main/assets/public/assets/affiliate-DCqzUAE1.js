import { t as e } from "./jsx-runtime-B5yqYJvp.js";
import { t } from "./useNavigate-BJOrhi-q.js";
import { E as n, F as r, T as i } from "./index-BPJbQuiK.js";
var a = e();
function o() {
  let e = t();
  return (0, a.jsx)(i, {
    activeTab: `profile`,
    children: (0, a.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, a.jsx)(n, {
          title: `Affiliate Program`,
          showBack: !0,
          onBack: () => e({ to: `/creator` }),
        }),
        (0, a.jsxs)(`div`, {
          className: `p-4 space-y-6`,
          children: [
            (0, a.jsxs)(`div`, {
              className: `p-4 bg-gradient-to-r from-emerald-950/40 to-black border border-emerald-800/50 rounded-2xl space-y-2`,
              children: [
                (0, a.jsxs)(`div`, {
                  className: `flex items-center gap-2 text-emerald-400 font-bold text-sm`,
                  children: [
                    (0, a.jsx)(r, { className: `w-5 h-5` }),
                    (0, a.jsx)(`span`, { children: `Affiliate Account Active` }),
                  ],
                }),
                (0, a.jsx)(`p`, {
                  className: `text-xs text-gray-300 leading-relaxed`,
                  children: `Tag partner products in your posts, reels and stories to earn up to 15% revenue share on qualifying purchases.`,
                }),
              ],
            }),
            (0, a.jsxs)(`div`, {
              className: `grid grid-cols-2 gap-3`,
              children: [
                (0, a.jsxs)(`div`, {
                  className: `p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-1`,
                  children: [
                    (0, a.jsx)(`span`, {
                      className: `text-[11px] text-gray-400 font-medium`,
                      children: `Commission Rate`,
                    }),
                    (0, a.jsx)(`p`, {
                      className: `text-xl font-bold text-white`,
                      children: `8% - 15%`,
                    }),
                  ],
                }),
                (0, a.jsxs)(`div`, {
                  className: `p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-1`,
                  children: [
                    (0, a.jsx)(`span`, {
                      className: `text-[11px] text-gray-400 font-medium`,
                      children: `Cookie Window`,
                    }),
                    (0, a.jsx)(`p`, {
                      className: `text-xl font-bold text-white`,
                      children: `30 Days`,
                    }),
                  ],
                }),
              ],
            }),
            (0, a.jsxs)(`div`, {
              className: `p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-2`,
              children: [
                (0, a.jsx)(`h4`, {
                  className: `text-xs font-bold text-white`,
                  children: `Branded Content Disclosure`,
                }),
                (0, a.jsx)(`p`, {
                  className: `text-[11px] text-gray-400 leading-relaxed`,
                  children: `In accordance with advertising transparency standards, posts containing affiliate links will automatically include the "Eligible for commission" badge.`,
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
