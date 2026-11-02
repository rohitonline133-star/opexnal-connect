import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { t as r } from "./useNavigate-BJOrhi-q.js";
import { B as i, E as a, T as o, lt as s } from "./index-BPJbQuiK.js";
var c = t(e()),
  l = n();
function u() {
  let e = r(),
    [t, n] = (0, c.useState)(``),
    [u, d] = (0, c.useState)(`public`);
  return (0, l.jsx)(o, {
    activeTab: `create`,
    children: (0, l.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, l.jsx)(a, { title: `Go Live`, showBack: !0, onBack: () => e({ to: `/live` }) }),
        (0, l.jsxs)(`form`, {
          onSubmit: (n) => {
            if ((n.preventDefault(), !t.trim())) {
              s.error(`Please enter a broadcast title.`);
              return;
            }
            (s.info(`Broadcast prepared. Starting real-time stream...`), e({ to: `/live` }));
          },
          className: `p-4 space-y-5`,
          children: [
            (0, l.jsxs)(`div`, {
              className: `space-y-1.5`,
              children: [
                (0, l.jsx)(`label`, {
                  className: `text-xs font-semibold text-gray-300`,
                  children: `Broadcast Title`,
                }),
                (0, l.jsx)(`input`, {
                  type: `text`,
                  value: t,
                  onChange: (e) => n(e.target.value),
                  placeholder: `What are you discussing live?`,
                  required: !0,
                  className: `w-full h-11 px-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition`,
                }),
              ],
            }),
            (0, l.jsxs)(`div`, {
              className: `space-y-1.5`,
              children: [
                (0, l.jsx)(`label`, {
                  className: `text-xs font-semibold text-gray-300`,
                  children: `Audience Visibility`,
                }),
                (0, l.jsxs)(`select`, {
                  value: u,
                  onChange: (e) => d(e.target.value),
                  className: `w-full h-11 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500`,
                  children: [
                    (0, l.jsx)(`option`, {
                      value: `public`,
                      children: `Public (Anyone can tune in)`,
                    }),
                    (0, l.jsx)(`option`, {
                      value: `close_friends`,
                      children: `Close Friends Only`,
                    }),
                    (0, l.jsx)(`option`, { value: `subscribers`, children: `Subscribers Only` }),
                  ],
                }),
              ],
            }),
            (0, l.jsxs)(`div`, {
              className: `p-3 bg-[#121212] border border-[#222] rounded-xl text-xs text-gray-400 space-y-1`,
              children: [
                (0, l.jsx)(`span`, {
                  className: `font-semibold text-gray-300`,
                  children: `Live Safety Architecture:`,
                }),
                (0, l.jsx)(`p`, {
                  className: `text-[11px] leading-relaxed`,
                  children: `Real-time comment filtering, moderator assignments, and community safety strikes apply to all livestreams.`,
                }),
              ],
            }),
            (0, l.jsxs)(`button`, {
              type: `submit`,
              className: `w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2`,
              children: [
                (0, l.jsx)(i, { className: `w-4 h-4 animate-pulse` }),
                (0, l.jsx)(`span`, { children: `Start Live Broadcast` }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
export { u as component };
