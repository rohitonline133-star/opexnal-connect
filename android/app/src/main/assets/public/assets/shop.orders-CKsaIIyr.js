import { t as e } from "./jsx-runtime-B5yqYJvp.js";
import { t } from "./createLucideIcon-DgzBSI1Z.js";
import { t as n } from "./useNavigate-BJOrhi-q.js";
import { E as r, T as i } from "./index-BPJbQuiK.js";
var a = t(`shopping-bag`, [
    [`path`, { d: `M16 10a4 4 0 0 1-8 0`, key: `1ltviw` }],
    [`path`, { d: `M3.103 6.034h17.794`, key: `awc11p` }],
    [
      `path`,
      {
        d: `M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z`,
        key: `o988cm`,
      },
    ],
  ]),
  o = e();
function s() {
  let e = n();
  return (0, o.jsx)(i, {
    activeTab: `explore`,
    children: (0, o.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, o.jsx)(r, {
          title: `Orders & Receipts`,
          showBack: !0,
          onBack: () => e({ to: `/shop` }),
        }),
        (0, o.jsxs)(`div`, {
          className: `p-4 text-center py-20 space-y-3`,
          children: [
            (0, o.jsx)(`div`, {
              className: `w-16 h-16 rounded-full bg-[#1e1e1e] flex items-center justify-center mx-auto text-gray-500`,
              children: (0, o.jsx)(a, { className: `w-8 h-8` }),
            }),
            (0, o.jsxs)(`div`, {
              children: [
                (0, o.jsx)(`h3`, {
                  className: `text-base font-bold text-white`,
                  children: `No Orders Yet`,
                }),
                (0, o.jsx)(`p`, {
                  className: `text-xs text-gray-400 mt-1 max-w-xs mx-auto`,
                  children: `When you purchase merchandise or digital tools from verified creators, your receipts and tracking will appear here.`,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
export { s as component };
