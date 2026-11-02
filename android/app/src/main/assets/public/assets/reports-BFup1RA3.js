import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { t as r } from "./useNavigate-BJOrhi-q.js";
import { E as i, T as a } from "./index-BPJbQuiK.js";
var o = t(e()),
  s = n();
function c() {
  let e = r(),
    [t] = (0, o.useState)([
      {
        id: `rep_10482`,
        type: `Spam & Scam Account`,
        reportedUser: `crypto_doubler_bot`,
        date: `Yesterday`,
        status: `action_taken`,
        details: `Report reviewed: account was suspended for violating financial scam policies.`,
      },
      {
        id: `rep_09214`,
        type: `Copyright Audio Claim`,
        reportedUser: `remix_user_33`,
        date: `3 days ago`,
        status: `resolved`,
        details: `Audio match resolved: rights holder approved commercial creator sharing.`,
      },
    ]);
  return (0, s.jsx)(a, {
    activeTab: `profile`,
    children: (0, s.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, s.jsx)(i, {
          title: `Reports & Appeals`,
          showBack: !0,
          onBack: () => e({ to: `/safety` }),
        }),
        (0, s.jsxs)(`div`, {
          className: `p-4 space-y-4`,
          children: [
            (0, s.jsx)(`p`, {
              className: `text-xs text-gray-400`,
              children: `Track decisions made on reports you submitted or review pending content decisions.`,
            }),
            (0, s.jsx)(`div`, {
              className: `space-y-3`,
              children: t.map((e) =>
                (0, s.jsxs)(
                  `div`,
                  {
                    className: `p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-2 text-xs`,
                    children: [
                      (0, s.jsxs)(`div`, {
                        className: `flex justify-between items-center`,
                        children: [
                          (0, s.jsx)(`span`, {
                            className: `font-bold text-white`,
                            children: e.type,
                          }),
                          (0, s.jsx)(`span`, {
                            className: `px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30`,
                            children: `Action Taken`,
                          }),
                        ],
                      }),
                      (0, s.jsxs)(`p`, {
                        className: `text-[11px] text-gray-400`,
                        children: [
                          `Target: `,
                          (0, s.jsxs)(`strong`, {
                            className: `text-gray-200`,
                            children: [`@`, e.reportedUser],
                          }),
                          ` • Case #`,
                          e.id,
                        ],
                      }),
                      (0, s.jsx)(`p`, {
                        className: `text-[11px] text-gray-300 bg-black/40 p-2.5 rounded-xl border border-[#222]`,
                        children: e.details,
                      }),
                    ],
                  },
                  e.id,
                ),
              ),
            }),
          ],
        }),
      ],
    }),
  });
}
export { c as component };
