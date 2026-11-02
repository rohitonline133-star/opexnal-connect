import { t as e } from "./jsx-runtime-B5yqYJvp.js";
import { t } from "./useNavigate-BJOrhi-q.js";
import { E as n, T as r } from "./index-BPJbQuiK.js";
var i = e();
function a() {
  let e = t();
  return (0, i.jsx)(r, {
    activeTab: `reels`,
    children: (0, i.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, i.jsx)(n, { title: `Create Reel`, showBack: !0, onBack: () => e({ to: `/reels` }) }),
        (0, i.jsxs)(`div`, {
          className: `p-4 space-y-4`,
          children: [
            (0, i.jsx)(`p`, {
              className: `text-xs text-gray-400`,
              children: `Publish short video reels with audio, sound sync, text overlays, and interactive stickers.`,
            }),
            (0, i.jsx)(`button`, {
              type: `button`,
              onClick: () => e({ to: `/create` }),
              className: `w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-xs font-semibold rounded-xl transition shadow-lg`,
              children: `Open Creative Studio`,
            }),
          ],
        }),
      ],
    }),
  });
}
export { a as component };
