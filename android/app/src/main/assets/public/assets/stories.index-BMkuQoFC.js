import { t as e } from "./jsx-runtime-B5yqYJvp.js";
import { t } from "./useNavigate-BJOrhi-q.js";
import { E as n, T as r, u as i } from "./index-BPJbQuiK.js";
import { t as a } from "./story-tray-Dd2nkKhO.js";
var o = e();
function s() {
  let e = t(),
    { user: s } = i();
  return (0, o.jsx)(r, {
    activeTab: `home`,
    children: (0, o.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, o.jsx)(n, { title: `Stories`, showBack: !0, onBack: () => e({ to: `/home` }) }),
        (0, o.jsxs)(`div`, {
          className: `p-4 space-y-4`,
          children: [
            (0, o.jsx)(a, { viewerId: s?.id ?? `` }),
            (0, o.jsx)(`p`, {
              className: `text-xs text-gray-400 text-center pt-8`,
              children: `Stories automatically expire after 24 hours. Tap an avatar above to view their story moments.`,
            }),
          ],
        }),
      ],
    }),
  });
}
export { s as component };
