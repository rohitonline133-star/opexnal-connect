import { t as e } from "./jsx-runtime-B5yqYJvp.js";
import { t } from "./useNavigate-BJOrhi-q.js";
import { E as n, T as r } from "./index-BPJbQuiK.js";
var i = e();
function a() {
  let e = t();
  return (0, i.jsx)(r, {
    activeTab: `ai`,
    children: (0, i.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, i.jsx)(n, { title: `AI Prompt History`, showBack: !0, onBack: () => e({ to: `/ai` }) }),
        (0, i.jsx)(`div`, {
          className: `p-4 space-y-4`,
          children: (0, i.jsx)(`div`, {
            className: `space-y-3`,
            children: [
              {
                id: `ai_h1`,
                tool: `Viral Caption Generator`,
                prompt: `Golden hour coffee roast in Bangalore`,
                result: `Golden light hits different when the beans are freshly roasted. ☕✨ #BangaloreCafes`,
                time: `2 hours ago`,
              },
              {
                id: `ai_h2`,
                tool: `Reel Hook Generator`,
                prompt: `Coding aesthetic workspace`,
                result: `Stop scrolling if your desk setup looks like this... here is how I built it for under $200.`,
                time: `Yesterday`,
              },
            ].map((e) =>
              (0, i.jsxs)(
                `div`,
                {
                  className: `p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-2 text-xs`,
                  children: [
                    (0, i.jsxs)(`div`, {
                      className: `flex justify-between items-center text-gray-400`,
                      children: [
                        (0, i.jsx)(`span`, {
                          className: `font-semibold text-purple-400`,
                          children: e.tool,
                        }),
                        (0, i.jsx)(`span`, { className: `text-[10px]`, children: e.time }),
                      ],
                    }),
                    (0, i.jsxs)(`p`, {
                      className: `text-gray-300 font-medium`,
                      children: [`"`, e.prompt, `"`],
                    }),
                    (0, i.jsx)(`div`, {
                      className: `p-2.5 bg-black/60 rounded-xl border border-[#222] text-gray-200 text-[11px] leading-relaxed`,
                      children: e.result,
                    }),
                  ],
                },
                e.id,
              ),
            ),
          }),
        }),
      ],
    }),
  });
}
export { a as component };
