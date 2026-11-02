import { t as e } from "./jsx-runtime-B5yqYJvp.js";
import { n as t } from "./createLucideIcon-DgzBSI1Z.js";
import { t as n } from "./useNavigate-BJOrhi-q.js";
import { t as r } from "./arrow-right-DCS8A9mL.js";
import { t as i } from "./award-DOw-8v5O.js";
import { E as a, T as o, Y as s } from "./index-BPJbQuiK.js";
var c = e();
function l() {
  let e = n();
  return (0, c.jsx)(o, {
    activeTab: `profile`,
    children: (0, c.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, c.jsx)(a, {
          title: `Professional Dashboard`,
          showBack: !0,
          onBack: () => e({ to: `/profile` }),
        }),
        (0, c.jsxs)(`div`, {
          className: `p-4 space-y-6`,
          children: [
            (0, c.jsxs)(`div`, {
              className: `grid grid-cols-2 gap-3`,
              children: [
                (0, c.jsxs)(`div`, {
                  className: `p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-1`,
                  children: [
                    (0, c.jsx)(`span`, {
                      className: `text-[11px] text-gray-400`,
                      children: `Accounts Reached (30d)`,
                    }),
                    (0, c.jsx)(`p`, {
                      className: `text-xl font-bold text-white`,
                      children: `48.2K`,
                    }),
                    (0, c.jsx)(`span`, {
                      className: `text-[11px] text-emerald-400 font-semibold`,
                      children: `+14.2%`,
                    }),
                  ],
                }),
                (0, c.jsxs)(`div`, {
                  className: `p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-1`,
                  children: [
                    (0, c.jsx)(`span`, {
                      className: `text-[11px] text-gray-400`,
                      children: `Total Followers`,
                    }),
                    (0, c.jsx)(`p`, {
                      className: `text-xl font-bold text-white`,
                      children: `12,840`,
                    }),
                    (0, c.jsx)(`span`, {
                      className: `text-[11px] text-emerald-400 font-semibold`,
                      children: `+412 this week`,
                    }),
                  ],
                }),
              ],
            }),
            (0, c.jsxs)(`div`, {
              className: `space-y-2`,
              children: [
                (0, c.jsx)(`h3`, {
                  className: `text-xs font-bold uppercase tracking-wider text-gray-400`,
                  children: `Creator Monetization`,
                }),
                (0, c.jsxs)(t, {
                  to: `/monetization`,
                  className: `p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between hover:bg-[#1a1a1a] transition`,
                  children: [
                    (0, c.jsxs)(`div`, {
                      className: `flex items-center gap-3`,
                      children: [
                        (0, c.jsx)(`div`, {
                          className: `p-2.5 rounded-xl bg-purple-500/10 text-purple-400`,
                          children: (0, c.jsx)(s, { className: `w-5 h-5` }),
                        }),
                        (0, c.jsxs)(`div`, {
                          children: [
                            (0, c.jsx)(`h4`, {
                              className: `text-xs font-bold text-white`,
                              children: `Monetization & Payouts`,
                            }),
                            (0, c.jsx)(`p`, {
                              className: `text-[11px] text-gray-400`,
                              children: `Subscriptions, gifts, and partner payouts`,
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, c.jsx)(r, { className: `w-4 h-4 text-gray-500` }),
                  ],
                }),
                (0, c.jsxs)(t, {
                  to: `/branded-content`,
                  className: `p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between hover:bg-[#1a1a1a] transition`,
                  children: [
                    (0, c.jsxs)(`div`, {
                      className: `flex items-center gap-3`,
                      children: [
                        (0, c.jsx)(`div`, {
                          className: `p-2.5 rounded-xl bg-blue-500/10 text-blue-400`,
                          children: (0, c.jsx)(i, { className: `w-5 h-5` }),
                        }),
                        (0, c.jsxs)(`div`, {
                          children: [
                            (0, c.jsx)(`h4`, {
                              className: `text-xs font-bold text-white`,
                              children: `Branded Content Tools`,
                            }),
                            (0, c.jsx)(`p`, {
                              className: `text-[11px] text-gray-400`,
                              children: `Paid partnership tags and sponsor approvals`,
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, c.jsx)(r, { className: `w-4 h-4 text-gray-500` }),
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
export { l as component };
