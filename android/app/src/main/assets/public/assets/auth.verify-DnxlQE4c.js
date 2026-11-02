import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { n as r } from "./createLucideIcon-DgzBSI1Z.js";
import { t as i } from "./useNavigate-BJOrhi-q.js";
import { t as a } from "./arrow-left-CPTA-aqL.js";
import { t as o } from "./key-round-Bo-BHNma.js";
import { t as s } from "./loader-circle-CbE-4Efj.js";
import { t as c } from "./mail-Bfwhevaf.js";
import { t as l } from "./phone-B9wj1o3G.js";
import { et as u, lt as d, s as f, tt as p } from "./index-BPJbQuiK.js";
var m = t(e()),
  h = n();
function g() {
  let e = f.useSearch(),
    t = i(),
    [n, g] = (0, m.useState)(e.contact),
    [_, v] = (0, m.useState)(e.type),
    [y, b] = (0, m.useState)(``),
    [x, S] = (0, m.useState)(!1),
    [C, w] = (0, m.useState)(60),
    [T, E] = (0, m.useState)(null),
    [D, O] = (0, m.useState)(!1);
  return (
    (0, m.useEffect)(() => {
      if (C > 0) {
        let e = setTimeout(() => w(C - 1), 1e3);
        return () => clearTimeout(e);
      }
    }, [C]),
    (0, h.jsxs)(`div`, {
      className: `w-full`,
      children: [
        (0, h.jsx)(`div`, {
          className: `mb-4`,
          children: (0, h.jsxs)(r, {
            to: `/auth/login`,
            className: `inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition`,
            children: [
              (0, h.jsx)(a, { className: `w-3.5 h-3.5` }),
              (0, h.jsx)(`span`, { children: `Back to Login` }),
            ],
          }),
        }),
        (0, h.jsxs)(`div`, {
          className: `text-center mb-6`,
          children: [
            (0, h.jsx)(`div`, {
              className: `w-12 h-12 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center mx-auto mb-3 text-[#8B5CF6]`,
              children:
                _ === `phone`
                  ? (0, h.jsx)(l, { className: `w-6 h-6` })
                  : (0, h.jsx)(c, { className: `w-6 h-6` }),
            }),
            (0, h.jsx)(`h2`, {
              className: `text-2xl font-bold text-white mb-1`,
              children: D ? `Contact Verified!` : `Two-Step Verification`,
            }),
            (0, h.jsx)(`p`, {
              className: `text-xs text-gray-400 font-medium`,
              children: D
                ? `Your contact method is securely confirmed.`
                : `Enter the code sent to ${n || `your registered contact`}`,
            }),
          ],
        }),
        T &&
          (0, h.jsxs)(`div`, {
            role: `alert`,
            className: `w-full mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-200`,
            children: [
              (0, h.jsx)(p, { className: `w-4 h-4 shrink-0 text-red-400 mt-0.5` }),
              (0, h.jsx)(`span`, { className: `flex-1 leading-relaxed`, children: T }),
            ],
          }),
        D
          ? (0, h.jsxs)(`div`, {
              className: `text-center py-6 space-y-4`,
              children: [
                (0, h.jsx)(u, { className: `w-12 h-12 text-emerald-400 mx-auto animate-bounce` }),
                (0, h.jsx)(`p`, {
                  className: `text-sm font-semibold text-white`,
                  children: `Redirecting you to Opexnal...`,
                }),
              ],
            })
          : (0, h.jsxs)(`form`, {
              onSubmit: async (r) => {
                if ((r.preventDefault(), !y.trim())) {
                  E(`Please enter your 6-digit verification code`);
                  return;
                }
                (S(!0), E(null));
                try {
                  let r = await fetch(`/api/auth/phone/otp/verify`, {
                      method: `POST`,
                      headers: { "Content-Type": `application/json` },
                      body: JSON.stringify({ [_]: n.trim(), code: y.trim() }),
                    }),
                    i = await r.json();
                  if (!r.ok) {
                    E(i.error || `Invalid verification code`);
                    return;
                  }
                  (O(!0),
                    d.success(`Contact successfully verified!`),
                    setTimeout(() => {
                      t({ to: e.redirect || `/home`, replace: !0 });
                    }, 1500));
                } catch {
                } finally {
                  S(!1);
                }
              },
              className: `w-full space-y-4`,
              children: [
                (0, h.jsxs)(`div`, {
                  className: `relative flex items-center`,
                  children: [
                    (0, h.jsx)(`span`, {
                      className: `absolute left-4 text-gray-400`,
                      children: (0, h.jsx)(o, { size: 18 }),
                    }),
                    (0, h.jsx)(`input`, {
                      type: `text`,
                      placeholder: `6-digit verification code`,
                      value: y,
                      onChange: (e) => b(e.target.value),
                      disabled: x,
                      autoFocus: !0,
                      required: !0,
                      className: `w-full h-12 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition font-mono tracking-widest text-center`,
                    }),
                  ],
                }),
                (0, h.jsx)(`button`, {
                  type: `submit`,
                  disabled: x,
                  className: `w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50`,
                  children: x
                    ? (0, h.jsx)(s, { className: `w-4 h-4 animate-spin` })
                    : `Verify Code`,
                }),
                (0, h.jsxs)(`div`, {
                  className: `flex justify-between items-center text-xs pt-1 px-1`,
                  children: [
                    (0, h.jsx)(`button`, {
                      type: `button`,
                      onClick: async () => {
                        if (!(C > 0)) {
                          if (!n.trim()) {
                            E(`Please provide a valid contact method.`);
                            return;
                          }
                          (S(!0), E(null));
                          try {
                            let e = await fetch(`/api/auth/phone/otp/request`, {
                                method: `POST`,
                                headers: { "Content-Type": `application/json` },
                                body: JSON.stringify({ [_]: n.trim() }),
                              }),
                              t = await e.json();
                            if (!e.ok) {
                              E(t.error || `Failed to resend code`);
                              return;
                            }
                            (w(60),
                              d.success(t.message || `A new verification code has been sent!`));
                          } catch {
                            (w(60), d.info(`Verification code sent!`));
                          } finally {
                            S(!1);
                          }
                        }
                      },
                      disabled: C > 0 || x,
                      className: `text-[#8B5CF6] font-semibold hover:underline disabled:text-gray-500 disabled:no-underline`,
                      children: C > 0 ? `Resend code (${C}s)` : `Resend code`,
                    }),
                    (0, h.jsxs)(`button`, {
                      type: `button`,
                      onClick: () => {
                        (v(_ === `email` ? `phone` : `email`), g(``));
                      },
                      className: `text-gray-400 hover:text-white`,
                      children: [`Change to `, _ === `email` ? `Phone` : `Email`],
                    }),
                  ],
                }),
              ],
            }),
      ],
    })
  );
}
export { g as component };
