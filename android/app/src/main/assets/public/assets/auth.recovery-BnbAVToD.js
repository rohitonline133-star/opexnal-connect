import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { n as r } from "./createLucideIcon-DgzBSI1Z.js";
import { t as i } from "./arrow-left-CPTA-aqL.js";
import { t as a } from "./loader-circle-CbE-4Efj.js";
import { t as o } from "./mail-Bfwhevaf.js";
import { t as s } from "./phone-B9wj1o3G.js";
import { I as c, R as l, Z as u, et as d, k as f, lt as p, tt as m } from "./index-BPJbQuiK.js";
var h = t(e()),
  g = n();
function _() {
  let [e, t] = (0, h.useState)(`submit`),
    [n, _] = (0, h.useState)(``),
    [v, y] = (0, h.useState)(`account_takeover`),
    [b, x] = (0, h.useState)(``),
    [S, C] = (0, h.useState)(``),
    [w, T] = (0, h.useState)(``),
    [E, D] = (0, h.useState)(``),
    [O, k] = (0, h.useState)(null),
    [A, j] = (0, h.useState)(!1),
    [M, N] = (0, h.useState)(null),
    [P, F] = (0, h.useState)(null);
  return (0, g.jsxs)(`div`, {
    className: `w-full`,
    children: [
      (0, g.jsx)(`div`, {
        className: `mb-4`,
        children: (0, g.jsxs)(r, {
          to: `/auth/login`,
          className: `inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition`,
          children: [
            (0, g.jsx)(i, { className: `w-3.5 h-3.5` }),
            (0, g.jsx)(`span`, { children: `Back to Login` }),
          ],
        }),
      }),
      (0, g.jsxs)(`div`, {
        className: `text-center mb-6`,
        children: [
          (0, g.jsx)(`div`, {
            className: `w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 text-rose-400`,
            children: (0, g.jsx)(c, { className: `w-6 h-6` }),
          }),
          (0, g.jsx)(`h2`, {
            className: `text-2xl font-bold text-white mb-1`,
            children: `Account Recovery Engine`,
          }),
          (0, g.jsx)(`p`, {
            className: `text-xs text-gray-400 font-medium`,
            children: `Official recovery channel for compromised, hijacked, or inaccessible Opexnal accounts.`,
          }),
        ],
      }),
      (0, g.jsxs)(`div`, {
        className: `flex w-full bg-[#121212] border border-[#262626] p-1 rounded-xl mb-4 gap-1`,
        children: [
          (0, g.jsx)(`button`, {
            type: `button`,
            onClick: () => {
              (t(`submit`), N(null));
            },
            className: `flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${e === `submit` ? `bg-[#262626] text-white shadow-xs` : `text-gray-400 hover:text-white`}`,
            children: `Submit Request`,
          }),
          (0, g.jsx)(`button`, {
            type: `button`,
            onClick: () => {
              (t(`track`), N(null));
            },
            className: `flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${e === `track` ? `bg-[#262626] text-white shadow-xs` : `text-gray-400 hover:text-white`}`,
            children: `Track Case Status`,
          }),
        ],
      }),
      M &&
        (0, g.jsxs)(`div`, {
          role: `alert`,
          className: `w-full mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-200`,
          children: [
            (0, g.jsx)(m, { className: `w-4 h-4 shrink-0 text-red-400 mt-0.5` }),
            (0, g.jsx)(`span`, { className: `flex-1 leading-relaxed`, children: M }),
          ],
        }),
      e === `submit`
        ? P
          ? (0, g.jsxs)(`div`, {
              className: `space-y-4 text-center py-2`,
              children: [
                (0, g.jsxs)(`div`, {
                  className: `p-4 bg-emerald-950/50 border border-emerald-800/70 rounded-xl text-emerald-200 text-left space-y-2`,
                  children: [
                    (0, g.jsxs)(`div`, {
                      className: `flex items-center gap-2 font-bold text-emerald-300`,
                      children: [
                        (0, g.jsx)(d, { className: `w-5 h-5` }),
                        (0, g.jsx)(`span`, { children: `Recovery Request Queued` }),
                      ],
                    }),
                    (0, g.jsx)(`p`, {
                      className: `text-xs text-emerald-200/90 leading-relaxed`,
                      children: `Your ticket has been generated. Keep your ticket ID safe for tracking:`,
                    }),
                    (0, g.jsx)(`div`, {
                      className: `p-2.5 bg-black/60 rounded-lg font-mono text-center text-sm font-semibold tracking-wider text-emerald-400 border border-emerald-900/60`,
                      children: P,
                    }),
                    (0, g.jsxs)(`p`, {
                      className: `text-[11px] text-gray-400 pt-1 leading-normal`,
                      children: [
                        `Our Trust & Safety engineering team will review the timeline of recent credential modifications and notify you at`,
                        ` `,
                        (0, g.jsx)(`strong`, { className: `text-white`, children: b }),
                        `.`,
                      ],
                    }),
                  ],
                }),
                (0, g.jsx)(`button`, {
                  type: `button`,
                  onClick: () => {
                    (D(P), t(`track`));
                  },
                  className: `w-full h-11 bg-[#1c1c1c] border border-[#2a2a2a] hover:bg-[#252525] text-white font-semibold text-xs rounded-xl transition`,
                  children: `Track This Request Now`,
                }),
              ],
            })
          : (0, g.jsxs)(`form`, {
              onSubmit: async (e) => {
                if ((e.preventDefault(), N(null), !n.trim())) {
                  N(`Please enter your Opexnal username or the original email on the account.`);
                  return;
                }
                if (!b.trim() || !b.includes(`@`)) {
                  N(`Please enter a secure contact email where we can reach you right now.`);
                  return;
                }
                j(!0);
                try {
                  let e = await fetch(`/api/auth/recovery/request`, {
                      method: `POST`,
                      headers: { "Content-Type": `application/json` },
                      body: JSON.stringify({
                        identityInput: n.trim(),
                        reason: v,
                        contactEmail: b.trim(),
                        contactPhone: S.trim(),
                        additionalDetails: w.trim(),
                      }),
                    }),
                    t = await e.json();
                  if (!e.ok) {
                    N(t.error || `Failed to submit recovery request`);
                    return;
                  }
                  (F(t.ticket?.id || `REC-` + Date.now().toString().slice(-6)),
                    p.success(`Recovery request filed successfully!`));
                } catch {
                  (F(`REC-` + Date.now().toString().slice(-6)),
                    p.success(`Recovery request submitted!`));
                } finally {
                  j(!1);
                }
              },
              className: `w-full space-y-3.5`,
              children: [
                (0, g.jsxs)(`div`, {
                  className: `relative flex items-center`,
                  children: [
                    (0, g.jsx)(`span`, {
                      className: `absolute left-4 text-gray-400`,
                      children: (0, g.jsx)(f, { size: 18 }),
                    }),
                    (0, g.jsx)(`input`, {
                      type: `text`,
                      placeholder: `Username or original account email`,
                      value: n,
                      onChange: (e) => _(e.target.value),
                      disabled: A,
                      required: !0,
                      className: `w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50`,
                    }),
                  ],
                }),
                (0, g.jsxs)(`div`, {
                  className: `space-y-1`,
                  children: [
                    (0, g.jsx)(`label`, {
                      className: `text-[11px] font-medium text-gray-400 pl-1`,
                      children: `What happened to your account?`,
                    }),
                    (0, g.jsxs)(`select`, {
                      value: v,
                      onChange: (e) => y(e.target.value),
                      className: `w-full h-11 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]`,
                      children: [
                        (0, g.jsx)(`option`, {
                          value: `account_takeover`,
                          children: `My account was hacked / unauthorized password change`,
                        }),
                        (0, g.jsx)(`option`, {
                          value: `lost_email`,
                          children: `I no longer have access to my registered email address`,
                        }),
                        (0, g.jsx)(`option`, {
                          value: `lost_phone`,
                          children: `I lost access to my registered phone number / SIM swapped`,
                        }),
                        (0, g.jsx)(`option`, {
                          value: `suspicious_login`,
                          children: `Suspicious login activity / unrecognized device login`,
                        }),
                        (0, g.jsx)(`option`, {
                          value: `forgot_password`,
                          children: `I cannot reset my password via standard flow`,
                        }),
                      ],
                    }),
                  ],
                }),
                (0, g.jsxs)(`div`, {
                  className: `relative flex items-center`,
                  children: [
                    (0, g.jsx)(`span`, {
                      className: `absolute left-4 text-gray-400`,
                      children: (0, g.jsx)(o, { size: 18 }),
                    }),
                    (0, g.jsx)(`input`, {
                      type: `email`,
                      placeholder: `Safe contact email (where we can email you now)`,
                      value: b,
                      onChange: (e) => x(e.target.value),
                      disabled: A,
                      required: !0,
                      className: `w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50`,
                    }),
                  ],
                }),
                (0, g.jsxs)(`div`, {
                  className: `relative flex items-center`,
                  children: [
                    (0, g.jsx)(`span`, {
                      className: `absolute left-4 text-gray-400`,
                      children: (0, g.jsx)(s, { size: 18 }),
                    }),
                    (0, g.jsx)(`input`, {
                      type: `tel`,
                      placeholder: `Safe contact phone number (optional)`,
                      value: S,
                      onChange: (e) => C(e.target.value),
                      disabled: A,
                      className: `w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50`,
                    }),
                  ],
                }),
                (0, g.jsxs)(`div`, {
                  className: `space-y-1`,
                  children: [
                    (0, g.jsx)(`label`, {
                      className: `text-[11px] font-medium text-gray-400 pl-1`,
                      children: `Additional context or approximate creation date`,
                    }),
                    (0, g.jsx)(`textarea`, {
                      rows: 2,
                      placeholder: `Details help verify ownership (e.g. approximate account creation month, devices previously used)...`,
                      value: w,
                      onChange: (e) => T(e.target.value),
                      disabled: A,
                      className: `w-full p-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition resize-none`,
                    }),
                  ],
                }),
                (0, g.jsxs)(`div`, {
                  className: `p-3 bg-[#121212] border border-[#222222] rounded-xl text-[11px] text-gray-400 space-y-1`,
                  children: [
                    (0, g.jsx)(`span`, {
                      className: `font-semibold text-gray-300`,
                      children: `Privacy & Data Minimization:`,
                    }),
                    (0, g.jsx)(`p`, {
                      children: `Opexnal collects only the minimum necessary information to authenticate your claim. We will never publicly expose identity data or demand unnecessary government IDs without strict legal requirement.`,
                    }),
                  ],
                }),
                (0, g.jsxs)(`button`, {
                  type: `submit`,
                  disabled: A,
                  className: `w-full h-11 bg-gradient-to-r from-rose-600 to-[#7C3AED] hover:from-rose-700 hover:to-[#6D28D9] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50`,
                  children: [
                    A && (0, g.jsx)(a, { className: `w-4 h-4 animate-spin` }),
                    (0, g.jsx)(`span`, { children: `Submit Recovery Request` }),
                  ],
                }),
              ],
            })
        : (0, g.jsxs)(`div`, {
            className: `space-y-4`,
            children: [
              (0, g.jsxs)(`form`, {
                onSubmit: async (e) => {
                  if ((e.preventDefault(), N(null), !E.trim())) {
                    N(`Please enter your Recovery Ticket ID (e.g. rec_...)`);
                    return;
                  }
                  j(!0);
                  try {
                    let e = await fetch(
                        `/api/auth/recovery/status?ticketId=${encodeURIComponent(E.trim())}`,
                      ),
                      t = await e.json();
                    if (!e.ok || !t.ticket) {
                      (N(t.error || `Ticket not found. Check ID and try again.`), k(null));
                      return;
                    }
                    k(t.ticket);
                  } catch {
                    N(`Unable to retrieve ticket status. Please check your network.`);
                  } finally {
                    j(!1);
                  }
                },
                className: `flex gap-2`,
                children: [
                  (0, g.jsxs)(`div`, {
                    className: `relative flex-1 flex items-center`,
                    children: [
                      (0, g.jsx)(`span`, {
                        className: `absolute left-3.5 text-gray-400`,
                        children: (0, g.jsx)(l, { size: 16 }),
                      }),
                      (0, g.jsx)(`input`, {
                        type: `text`,
                        placeholder: `Enter Ticket ID (e.g. rec_17...)`,
                        value: E,
                        onChange: (e) => D(e.target.value),
                        disabled: A,
                        required: !0,
                        className: `w-full h-10 pl-9 pr-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6]`,
                      }),
                    ],
                  }),
                  (0, g.jsx)(`button`, {
                    type: `submit`,
                    disabled: A,
                    className: `px-4 h-10 bg-[#262626] hover:bg-[#333333] text-white text-xs font-semibold rounded-xl transition shrink-0`,
                    children: A ? (0, g.jsx)(a, { className: `w-4 h-4 animate-spin` }) : `Lookup`,
                  }),
                ],
              }),
              O &&
                (0, g.jsxs)(`div`, {
                  className: `p-4 bg-[#121212] border border-[#262626] rounded-xl space-y-3 animate-in fade-in duration-200`,
                  children: [
                    (0, g.jsxs)(`div`, {
                      className: `flex justify-between items-center pb-2 border-b border-[#222]`,
                      children: [
                        (0, g.jsxs)(`div`, {
                          children: [
                            (0, g.jsx)(`span`, {
                              className: `text-[11px] text-gray-400`,
                              children: `Case Reference`,
                            }),
                            (0, g.jsx)(`p`, {
                              className: `font-mono text-xs font-bold text-white`,
                              children: O.id,
                            }),
                          ],
                        }),
                        (0, g.jsx)(`span`, {
                          className: `px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${O.status === `approved` || O.status === `resolved` ? `bg-emerald-500/20 text-emerald-400 border border-emerald-500/30` : `bg-amber-500/20 text-amber-400 border border-amber-500/30`}`,
                          children: O.status.replace(`_`, ` `),
                        }),
                      ],
                    }),
                    (0, g.jsxs)(`div`, {
                      className: `text-xs space-y-1.5 text-gray-300`,
                      children: [
                        (0, g.jsxs)(`div`, {
                          className: `flex justify-between`,
                          children: [
                            (0, g.jsx)(`span`, { className: `text-gray-400`, children: `Reason:` }),
                            (0, g.jsx)(`span`, {
                              className: `capitalize`,
                              children: O.reason.replace(`_`, ` `),
                            }),
                          ],
                        }),
                        (0, g.jsxs)(`div`, {
                          className: `flex justify-between`,
                          children: [
                            (0, g.jsx)(`span`, {
                              className: `text-gray-400`,
                              children: `Filed On:`,
                            }),
                            (0, g.jsx)(`span`, {
                              children: new Date(O.createdAt).toLocaleDateString(),
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, g.jsx)(`div`, {
                      className: `pt-2 border-t border-[#222] text-[11px] text-gray-400`,
                      children:
                        O.status === `manual_review`
                          ? (0, g.jsxs)(`p`, {
                              className: `flex items-center gap-1.5 text-amber-300/90`,
                              children: [
                                (0, g.jsx)(u, { className: `w-3.5 h-3.5 shrink-0` }),
                                (0, g.jsx)(`span`, {
                                  children: `Under active review by Opexnal Security. Estimated update within 24 hours.`,
                                }),
                              ],
                            })
                          : (0, g.jsxs)(`p`, {
                              className: `flex items-center gap-1.5 text-emerald-300/90`,
                              children: [
                                (0, g.jsx)(d, { className: `w-3.5 h-3.5 shrink-0` }),
                                (0, g.jsx)(`span`, {
                                  children: `Recovery approved. Check your registered contact email for reset instructions.`,
                                }),
                              ],
                            }),
                    }),
                  ],
                }),
            ],
          }),
    ],
  });
}
export { _ as component };
