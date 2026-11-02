import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { t as r } from "./useNavigate-BJOrhi-q.js";
import { E as i, F as a, T as o, f as s } from "./index-BPJbQuiK.js";
var c = t(e()),
  l = n();
function u() {
  let e = r(),
    [t, n] = (0, c.useState)(!0);
  return (0, l.jsx)(o, {
    activeTab: `profile`,
    children: (0, l.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, l.jsx)(i, {
          title: `Branded Content`,
          showBack: !0,
          onBack: () => e({ to: `/professional` }),
        }),
        (0, l.jsxs)(`div`, {
          className: `p-4 space-y-6`,
          children: [
            (0, l.jsxs)(`div`, {
              className: `p-4 bg-gradient-to-r from-purple-950/40 to-black border border-purple-800/50 rounded-2xl flex items-center gap-3`,
              children: [
                (0, l.jsx)(a, { className: `w-6 h-6 text-purple-400 shrink-0` }),
                (0, l.jsxs)(`div`, {
                  children: [
                    (0, l.jsx)(`h4`, {
                      className: `text-xs font-bold text-white`,
                      children: `Eligible for Paid Partnerships`,
                    }),
                    (0, l.jsx)(`p`, {
                      className: `text-[11px] text-gray-400`,
                      children: `You can tag sponsor brands in your posts, reels, and stories with the Paid Partnership disclosure label.`,
                    }),
                  ],
                }),
              ],
            }),
            (0, l.jsxs)(`div`, {
              className: `space-y-3`,
              children: [
                (0, l.jsx)(`h3`, {
                  className: `text-xs font-bold uppercase tracking-wider text-gray-400`,
                  children: `Tagging Approvals`,
                }),
                (0, l.jsxs)(`div`, {
                  className: `p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between`,
                  children: [
                    (0, l.jsxs)(`div`, {
                      className: `space-y-0.5`,
                      children: [
                        (0, l.jsx)(`span`, {
                          className: `text-sm font-semibold text-white`,
                          children: `Manually Approve Brand Partners`,
                        }),
                        (0, l.jsx)(`p`, {
                          className: `text-xs text-gray-400`,
                          children: `Brands must request permission before tagging your account`,
                        }),
                      ],
                    }),
                    (0, l.jsx)(s, { checked: t, onCheckedChange: n }),
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
export { u as component };
