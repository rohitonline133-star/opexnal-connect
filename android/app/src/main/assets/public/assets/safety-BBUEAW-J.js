import { t as e } from "./jsx-runtime-B5yqYJvp.js";
import { n as t } from "./createLucideIcon-DgzBSI1Z.js";
import { t as n } from "./useNavigate-BJOrhi-q.js";
import { t as r } from "./arrow-right-DCS8A9mL.js";
import { t as i } from "./eye-off-BTNjnLZQ.js";
import { t as a } from "./user-x-CwklV8H9.js";
import { $ as o, E as s, F as c, T as l, q as u } from "./index-BPJbQuiK.js";
var d = e();
function f() {
  let e = n();
  return (0, d.jsx)(l, {
    activeTab: `profile`,
    children: (0, d.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, d.jsx)(s, {
          title: `Safety Center`,
          showBack: !0,
          onBack: () => e({ to: `/settings` }),
        }),
        (0, d.jsxs)(`div`, {
          className: `p-4 space-y-4`,
          children: [
            (0, d.jsxs)(`div`, {
              className: `p-4 bg-gradient-to-r from-purple-950/40 to-black border border-[#2a2a2a] rounded-2xl space-y-1.5`,
              children: [
                (0, d.jsxs)(`h3`, {
                  className: `text-sm font-bold text-white flex items-center gap-2`,
                  children: [
                    (0, d.jsx)(c, { className: `w-4 h-4 text-purple-400` }),
                    (0, d.jsx)(`span`, { children: `Opexnal Community Safety` }),
                  ],
                }),
                (0, d.jsx)(`p`, {
                  className: `text-xs text-gray-400 leading-relaxed`,
                  children: `We empower creators with proactive safety tools, granular privacy controls, and fair appeal mechanisms.`,
                }),
              ],
            }),
            (0, d.jsx)(`div`, {
              className: `space-y-2`,
              children: [
                {
                  title: `Account Status`,
                  desc: `Check if your account or posts have strikes or restrictions`,
                  route: `/account-status`,
                  icon: c,
                  color: `text-emerald-400`,
                },
                {
                  title: `Submitted Reports & Appeals`,
                  desc: `Track the status of content you reported or dispute a strike`,
                  route: `/reports`,
                  icon: u,
                  color: `text-amber-400`,
                },
                {
                  title: `Blocked & Restricted Accounts`,
                  desc: `Manage profiles that cannot interact with you`,
                  route: `/settings/blocked`,
                  icon: a,
                  color: `text-rose-400`,
                },
                {
                  title: `Hidden Words & Comment Filter`,
                  desc: `Customize automated keyword moderation for spam & harassment`,
                  route: `/settings/hidden-words`,
                  icon: i,
                  color: `text-purple-400`,
                },
                {
                  title: `Help & Community Guidelines`,
                  desc: `Read our policies on intellectual property, scams, and safety`,
                  route: `/help`,
                  icon: o,
                  color: `text-blue-400`,
                },
              ].map((e) => {
                let n = e.icon;
                return (0, d.jsxs)(
                  t,
                  {
                    to: e.route,
                    className: `p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between hover:bg-[#1a1a1a] transition group`,
                    children: [
                      (0, d.jsxs)(`div`, {
                        className: `flex items-center gap-3`,
                        children: [
                          (0, d.jsx)(`div`, {
                            className: `p-2.5 rounded-xl bg-[#1e1e1e] ${e.color} shrink-0`,
                            children: (0, d.jsx)(n, { className: `w-5 h-5` }),
                          }),
                          (0, d.jsxs)(`div`, {
                            children: [
                              (0, d.jsx)(`h4`, {
                                className: `text-xs font-bold text-white group-hover:text-purple-300 transition`,
                                children: e.title,
                              }),
                              (0, d.jsx)(`p`, {
                                className: `text-[11px] text-gray-400`,
                                children: e.desc,
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, d.jsx)(r, {
                        className: `w-4 h-4 text-gray-500 group-hover:text-white transition shrink-0`,
                      }),
                    ],
                  },
                  e.title,
                );
              }),
            }),
          ],
        }),
      ],
    }),
  });
}
export { f as component };
