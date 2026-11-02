import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { n as r } from "./createLucideIcon-DgzBSI1Z.js";
import { t as i } from "./arrow-left-CPTA-aqL.js";
import { n as a, t as o } from "./log-out-Bp14RzIZ.js";
import { t as s } from "./loader-circle-CbE-4Efj.js";
import { t as c } from "./map-pin-B24Bgmng.js";
import { t as l } from "./smartphone-DyfA3-E3.js";
import { j as u, lt as d, tt as f, u as p } from "./index-BPJbQuiK.js";
var m = t(e()),
  h = n();
function g() {
  let { session: e } = p(),
    t = e?.userId || `user_maya`,
    [n, g] = (0, m.useState)([]),
    [_, v] = (0, m.useState)(!0),
    [y, b] = (0, m.useState)(null),
    [x, S] = (0, m.useState)(null);
  (0, m.useEffect)(() => {
    let t = !0;
    return (
      (async () => {
        try {
          let n = await (
            await fetch(`/api/auth/sessions`, {
              headers: { Authorization: `Bearer ${e?.token || `user_maya`}` },
            })
          ).json();
          t && g(n.sessions || []);
        } catch {
        } finally {
          t && v(!1);
        }
      })(),
      () => {
        t = !1;
      }
    );
  }, [e?.token, t]);
  let C = async (e) => {
    b(e);
    try {
      (
        await fetch(`/api/auth/sessions/revoke`, {
          method: `POST`,
          headers: { "Content-Type": `application/json` },
          body: JSON.stringify({ userId: t, sessionId: e }),
        })
      ).ok &&
        (g((t) => t.filter((t) => t.id !== e)), d.success(`Device session revoked successfully.`));
    } catch {
      d.error(`Failed to revoke session.`);
    } finally {
      b(null);
    }
  };
  return (0, h.jsxs)(`div`, {
    className: `w-full`,
    children: [
      (0, h.jsx)(`div`, {
        className: `mb-4`,
        children: (0, h.jsxs)(r, {
          to: `/settings/security`,
          className: `inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition`,
          children: [
            (0, h.jsx)(i, { className: `w-3.5 h-3.5` }),
            (0, h.jsx)(`span`, { children: `Back to Security Settings` }),
          ],
        }),
      }),
      (0, h.jsxs)(`div`, {
        className: `text-center mb-6`,
        children: [
          (0, h.jsx)(`div`, {
            className: `w-12 h-12 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center mx-auto mb-3 text-[#8B5CF6]`,
            children: (0, h.jsx)(a, { className: `w-6 h-6` }),
          }),
          (0, h.jsx)(`h2`, {
            className: `text-2xl font-bold text-white mb-1`,
            children: `Where You're Logged In`,
          }),
          (0, h.jsx)(`p`, {
            className: `text-xs text-gray-400 font-medium`,
            children: `Review active devices and revoke access immediately if you see an unfamiliar login.`,
          }),
        ],
      }),
      x &&
        (0, h.jsxs)(`div`, {
          role: `alert`,
          className: `w-full mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2`,
          children: [
            (0, h.jsx)(f, { className: `w-4 h-4 shrink-0 text-red-400 mt-0.5` }),
            (0, h.jsx)(`span`, { className: `flex-1 leading-relaxed`, children: x }),
          ],
        }),
      _
        ? (0, h.jsx)(`div`, {
            className: `flex justify-center py-8`,
            children: (0, h.jsx)(s, { className: `w-6 h-6 animate-spin text-[#8B5CF6]` }),
          })
        : (0, h.jsxs)(`div`, {
            className: `space-y-4`,
            children: [
              (0, h.jsx)(`div`, {
                className: `space-y-2.5`,
                children: n.map((e) =>
                  (0, h.jsxs)(
                    `div`,
                    {
                      className: `p-3.5 bg-[#121212] border border-[#262626] rounded-xl flex items-start justify-between gap-3 text-xs`,
                      children: [
                        (0, h.jsxs)(`div`, {
                          className: `flex items-start gap-3`,
                          children: [
                            (0, h.jsx)(`div`, {
                              className: `p-2 rounded-lg bg-[#1f1f1f] text-gray-300 shrink-0 mt-0.5`,
                              children:
                                e.device.toLowerCase().includes(`iphone`) ||
                                e.device.toLowerCase().includes(`android`)
                                  ? (0, h.jsx)(l, { className: `w-4 h-4` })
                                  : (0, h.jsx)(a, { className: `w-4 h-4` }),
                            }),
                            (0, h.jsxs)(`div`, {
                              className: `space-y-1`,
                              children: [
                                (0, h.jsxs)(`div`, {
                                  className: `flex items-center gap-2`,
                                  children: [
                                    (0, h.jsx)(`span`, {
                                      className: `font-semibold text-white`,
                                      children: e.device,
                                    }),
                                    e.isCurrent &&
                                      (0, h.jsx)(`span`, {
                                        className: `px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md`,
                                        children: `This Device`,
                                      }),
                                  ],
                                }),
                                (0, h.jsxs)(`p`, {
                                  className: `text-[11px] text-gray-400`,
                                  children: [e.browser, ` • `, e.os],
                                }),
                                (0, h.jsxs)(`div`, {
                                  className: `flex items-center gap-1.5 text-[10px] text-gray-500 pt-0.5`,
                                  children: [
                                    (0, h.jsx)(c, { className: `w-3 h-3 text-gray-400` }),
                                    (0, h.jsx)(`span`, { children: e.location }),
                                    (0, h.jsxs)(`span`, { children: [`• IP: `, e.ipAddress] }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                        !e.isCurrent &&
                          (0, h.jsx)(`button`, {
                            type: `button`,
                            onClick: () => C(e.id),
                            disabled: y === e.id,
                            className: `p-2 text-rose-400 hover:bg-rose-950/40 rounded-lg transition disabled:opacity-50 shrink-0`,
                            title: `Revoke session`,
                            children:
                              y === e.id
                                ? (0, h.jsx)(s, { className: `w-4 h-4 animate-spin` })
                                : (0, h.jsx)(u, { className: `w-4 h-4` }),
                          }),
                      ],
                    },
                    e.id,
                  ),
                ),
              }),
              n.filter((e) => !e.isCurrent).length > 0 &&
                (0, h.jsxs)(`button`, {
                  type: `button`,
                  onClick: async () => {
                    if (window.confirm(`Are you sure you want to log out all other devices?`)) {
                      b(`all`);
                      try {
                        (
                          await fetch(`/api/auth/sessions/revoke-all`, {
                            method: `POST`,
                            headers: { "Content-Type": `application/json` },
                            body: JSON.stringify({ userId: t, keepCurrent: !0 }),
                          })
                        ).ok &&
                          (g((e) => e.filter((e) => e.isCurrent)),
                          d.success(`All other sessions logged out.`));
                      } catch {
                        d.error(`Failed to logout all devices.`);
                      } finally {
                        b(null);
                      }
                    }
                  },
                  disabled: y === `all`,
                  className: `w-full h-11 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2`,
                  children: [
                    y === `all`
                      ? (0, h.jsx)(s, { className: `w-4 h-4 animate-spin` })
                      : (0, h.jsx)(o, { className: `w-4 h-4` }),
                    (0, h.jsx)(`span`, { children: `Log Out All Other Devices` }),
                  ],
                }),
              (0, h.jsxs)(`div`, {
                className: `p-3 bg-[#121212] border border-[#222] rounded-xl text-[11px] text-gray-400 space-y-1`,
                children: [
                  (0, h.jsx)(`span`, {
                    className: `font-semibold text-gray-300`,
                    children: `Defense-in-depth:`,
                  }),
                  (0, h.jsx)(`p`, {
                    children: `Revoking a session immediately terminates its bearer token and prevents unauthorized background refreshes.`,
                  }),
                ],
              }),
            ],
          }),
    ],
  });
}
export { g as component };
