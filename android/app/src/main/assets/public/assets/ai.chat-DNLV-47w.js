import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { t as r } from "./useNavigate-BJOrhi-q.js";
import { t as i } from "./bot-BCpRT35K.js";
import { t as a } from "./loader-circle-CbE-4Efj.js";
import { E as o, L as s, T as c, k as l, lt as u, u as d } from "./index-BPJbQuiK.js";
import { n as f } from "./ai-client--xbxNFq7.js";
var p = t(e()),
  m = n();
function h() {
  let e = r(),
    { session: t } = d(),
    [n, h] = (0, p.useState)([
      {
        id: `intro`,
        sender: `ai`,
        text: `Hello! I am your Opexnal AI co-pilot. Ask me for viral reels hooks, caption variations, or visual composition concepts.`,
        timestamp: new Date().toISOString(),
      },
    ]),
    [g, _] = (0, p.useState)(``),
    [v, y] = (0, p.useState)(!1);
  return (0, m.jsx)(c, {
    activeTab: `ai`,
    children: (0, m.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-28 max-w-xl mx-auto flex flex-col`,
      children: [
        (0, m.jsx)(o, { title: `Opex AI Co-Pilot`, showBack: !0, onBack: () => e({ to: `/ai` }) }),
        (0, m.jsxs)(`div`, {
          className: `flex-1 p-4 space-y-3 overflow-y-auto`,
          children: [
            n.map((e) =>
              (0, m.jsxs)(
                `div`,
                {
                  className: `flex items-start gap-2.5 ${e.sender === `user` ? `flex-row-reverse` : ``}`,
                  children: [
                    (0, m.jsx)(`div`, {
                      className: `w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${e.sender === `user` ? `bg-purple-600` : `bg-[#1f1f1f] text-[#8B5CF6]`}`,
                      children:
                        e.sender === `user`
                          ? (0, m.jsx)(l, { className: `w-3.5 h-3.5` })
                          : (0, m.jsx)(i, { className: `w-3.5 h-3.5` }),
                    }),
                    (0, m.jsx)(`div`, {
                      className: `max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${e.sender === `user` ? `bg-[#8B5CF6] text-white rounded-tr-none` : `bg-[#141414] border border-[#222] text-gray-200 rounded-tl-none whitespace-pre-line`}`,
                      children: e.text,
                    }),
                  ],
                },
                e.id,
              ),
            ),
            v &&
              (0, m.jsxs)(`div`, {
                className: `flex items-center gap-2 text-xs text-purple-400`,
                children: [
                  (0, m.jsx)(a, { className: `w-4 h-4 animate-spin` }),
                  (0, m.jsx)(`span`, { children: `Opex AI is brainstorming...` }),
                ],
              }),
          ],
        }),
        (0, m.jsxs)(`form`, {
          onSubmit: async (e) => {
            e.preventDefault();
            let t = g.trim();
            if (!t || v) return;
            let r = {
              id: `usr_${Date.now()}`,
              sender: `user`,
              text: t,
              timestamp: new Date().toISOString(),
            };
            (h((e) => [...e, r]), _(``), y(!0));
            try {
              let e = n.map((e) => ({
                  role: e.sender === `ai` ? `model` : `user`,
                  content: e.text,
                })),
                r = await f({ messages: e, prompt: t });
              h((e) => [
                ...e,
                {
                  id: `asst_${Date.now()}`,
                  sender: `ai`,
                  text: r,
                  timestamp: new Date().toISOString(),
                },
              ]);
            } catch {
              u.error(`Failed to generate AI response.`);
            } finally {
              y(!1);
            }
          },
          className: `fixed bottom-14 max-w-xl w-full px-4 py-2 bg-black/90 backdrop-blur-md border-t border-[#1c1c1c] flex gap-2`,
          children: [
            (0, m.jsx)(`input`, {
              type: `text`,
              value: g,
              onChange: (e) => _(e.target.value),
              placeholder: `Ask for captions, reels hooks, or ideas...`,
              disabled: v,
              className: `flex-1 h-11 px-4 bg-[#141414] border border-[#262626] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6]`,
            }),
            (0, m.jsx)(`button`, {
              type: `submit`,
              disabled: v || !g.trim(),
              className: `w-11 h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50`,
              children: (0, m.jsx)(s, { className: `w-4 h-4` }),
            }),
          ],
        }),
      ],
    }),
  });
}
export { h as component };
