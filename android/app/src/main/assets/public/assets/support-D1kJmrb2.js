import { t as e } from "./jsx-runtime-B5yqYJvp.js";
import { n as t, t as n } from "./createLucideIcon-DgzBSI1Z.js";
import { t as r } from "./useNavigate-BJOrhi-q.js";
import { t as i } from "./arrow-right-DCS8A9mL.js";
import { t as a } from "./file-text-D6gwwmni.js";
import { $ as o, E as s, T as c } from "./index-BPJbQuiK.js";
var l = n(`bug`, [
    [`path`, { d: `M12 20v-9`, key: `1qisl0` }],
    [`path`, { d: `M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z`, key: `uouzyp` }],
    [`path`, { d: `M14.12 3.88 16 2`, key: `qol33r` }],
    [`path`, { d: `M21 21a4 4 0 0 0-3.81-4`, key: `1b0z45` }],
    [`path`, { d: `M21 5a4 4 0 0 1-3.55 3.97`, key: `5cxbf6` }],
    [`path`, { d: `M22 13h-4`, key: `1jl80f` }],
    [`path`, { d: `M3 21a4 4 0 0 1 3.81-4`, key: `1fjd4g` }],
    [`path`, { d: `M3 5a4 4 0 0 0 3.55 3.97`, key: `1d7oge` }],
    [`path`, { d: `M6 13H2`, key: `82j7cp` }],
    [`path`, { d: `m8 2 1.88 1.88`, key: `fmnt4t` }],
    [`path`, { d: `M9 7.13V6a3 3 0 1 1 6 0v1.13`, key: `1vgav8` }],
  ]),
  u = n(`shield`, [
    [
      `path`,
      {
        d: `M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z`,
        key: `oel41y`,
      },
    ],
  ]),
  d = e();
function f() {
  let e = r();
  return (0, d.jsx)(c, {
    activeTab: `profile`,
    children: (0, d.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, d.jsx)(s, {
          title: `Support Center`,
          showBack: !0,
          onBack: () => e({ to: `/settings` }),
        }),
        (0, d.jsxs)(`div`, {
          className: `p-4 space-y-4`,
          children: [
            (0, d.jsxs)(`div`, {
              className: `p-4 bg-gradient-to-r from-purple-900/30 to-black border border-[#2a2a2a] rounded-2xl space-y-1`,
              children: [
                (0, d.jsx)(`h3`, {
                  className: `text-sm font-bold text-white`,
                  children: `How can we help today?`,
                }),
                (0, d.jsx)(`p`, {
                  className: `text-xs text-gray-400`,
                  children: `Browse common troubleshooting topics or contact our safety and engineering team.`,
                }),
              ],
            }),
            (0, d.jsx)(`div`, {
              className: `space-y-2`,
              children: [
                {
                  title: `Help Center & FAQs`,
                  desc: `Guides on account settings, stories, reels, and privacy`,
                  route: `/help`,
                  icon: o,
                },
                {
                  title: `Report a Problem`,
                  desc: `Report technical glitches, audio errors, and app crashes`,
                  route: `/report-problem`,
                  icon: l,
                },
                {
                  title: `Account Recovery Center`,
                  desc: `Restore hacked, lost or compromised accounts`,
                  route: `/auth/recovery`,
                  icon: u,
                },
                {
                  title: `Safety & Policy Appeals`,
                  desc: `Track strikes, copyright claims, and decisions`,
                  route: `/reports`,
                  icon: a,
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
                            className: `p-2.5 rounded-xl bg-[#1e1e1e] text-[#8B5CF6] shrink-0`,
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
                      (0, d.jsx)(i, {
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
