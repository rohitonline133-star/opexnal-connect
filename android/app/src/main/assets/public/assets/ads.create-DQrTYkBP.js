import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { t as r } from "./useNavigate-BJOrhi-q.js";
import { E as i, T as a, lt as o } from "./index-BPJbQuiK.js";
var s = t(e()),
  c = n();
function l() {
  let e = r(),
    [t, n] = (0, s.useState)(`profile_visits`),
    [l, u] = (0, s.useState)(`automatic`),
    [d, f] = (0, s.useState)(`5`),
    [p, m] = (0, s.useState)(`6`);
  return (0, c.jsx)(a, {
    activeTab: `profile`,
    children: (0, c.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, c.jsx)(i, { title: `Create Promotion`, showBack: !0, onBack: () => e({ to: `/ads` }) }),
        (0, c.jsxs)(`form`, {
          onSubmit: (t) => {
            (t.preventDefault(),
              o.info(`Campaign draft configured. Connect payment method in settings to activate.`),
              e({ to: `/ads` }));
          },
          className: `p-4 space-y-5`,
          children: [
            (0, c.jsxs)(`div`, {
              className: `space-y-1.5`,
              children: [
                (0, c.jsx)(`label`, {
                  className: `text-xs font-semibold text-gray-300`,
                  children: `Campaign Goal`,
                }),
                (0, c.jsxs)(`select`, {
                  value: t,
                  onChange: (e) => n(e.target.value),
                  className: `w-full h-11 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]`,
                  children: [
                    (0, c.jsx)(`option`, {
                      value: `profile_visits`,
                      children: `More Profile Visits`,
                    }),
                    (0, c.jsx)(`option`, {
                      value: `website_taps`,
                      children: `More Website / Link Taps`,
                    }),
                    (0, c.jsx)(`option`, { value: `messages`, children: `More Direct Messages` }),
                  ],
                }),
              ],
            }),
            (0, c.jsxs)(`div`, {
              className: `space-y-1.5`,
              children: [
                (0, c.jsx)(`label`, {
                  className: `text-xs font-semibold text-gray-300`,
                  children: `Audience Targeting`,
                }),
                (0, c.jsxs)(`select`, {
                  value: l,
                  onChange: (e) => u(e.target.value),
                  className: `w-full h-11 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]`,
                  children: [
                    (0, c.jsx)(`option`, {
                      value: `automatic`,
                      children: `Automatic (AI matches people similar to your followers)`,
                    }),
                    (0, c.jsx)(`option`, {
                      value: `local`,
                      children: `Local Reach (Within 25km radius)`,
                    }),
                    (0, c.jsx)(`option`, {
                      value: `custom`,
                      children: `Custom (Specify locations and creator interests)`,
                    }),
                  ],
                }),
              ],
            }),
            (0, c.jsxs)(`div`, {
              className: `space-y-1.5`,
              children: [
                (0, c.jsxs)(`div`, {
                  className: `flex justify-between items-center text-xs`,
                  children: [
                    (0, c.jsx)(`span`, {
                      className: `font-semibold text-gray-300`,
                      children: `Daily Budget`,
                    }),
                    (0, c.jsxs)(`span`, {
                      className: `font-bold text-[#8B5CF6]`,
                      children: [`$`, d, `/day`],
                    }),
                  ],
                }),
                (0, c.jsx)(`input`, {
                  type: `range`,
                  min: `1`,
                  max: `50`,
                  value: d,
                  onChange: (e) => f(e.target.value),
                  className: `w-full accent-[#8B5CF6]`,
                }),
              ],
            }),
            (0, c.jsxs)(`div`, {
              className: `space-y-1.5`,
              children: [
                (0, c.jsxs)(`div`, {
                  className: `flex justify-between items-center text-xs`,
                  children: [
                    (0, c.jsx)(`span`, {
                      className: `font-semibold text-gray-300`,
                      children: `Duration`,
                    }),
                    (0, c.jsxs)(`span`, {
                      className: `font-bold text-[#8B5CF6]`,
                      children: [p, ` days`],
                    }),
                  ],
                }),
                (0, c.jsx)(`input`, {
                  type: `range`,
                  min: `1`,
                  max: `30`,
                  value: p,
                  onChange: (e) => m(e.target.value),
                  className: `w-full accent-[#8B5CF6]`,
                }),
              ],
            }),
            (0, c.jsxs)(`div`, {
              className: `p-3 bg-[#121212] border border-[#222] rounded-xl text-xs text-gray-400 space-y-1`,
              children: [
                (0, c.jsx)(`span`, {
                  className: `font-semibold text-gray-300`,
                  children: `Estimated Reach:`,
                }),
                (0, c.jsxs)(`p`, {
                  className: `text-[11px]`,
                  children: [
                    (parseInt(d, 10) * 450).toLocaleString(),
                    ` –`,
                    ` `,
                    (parseInt(d, 10) * 1200).toLocaleString(),
                    ` accounts over `,
                    p,
                    ` `,
                    `days.`,
                  ],
                }),
              ],
            }),
            (0, c.jsx)(`button`, {
              type: `submit`,
              className: `w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg`,
              children: `Review Promotion Draft`,
            }),
          ],
        }),
      ],
    }),
  });
}
export { l as component };
