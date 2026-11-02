import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { t as r } from "./useNavigate-BJOrhi-q.js";
import { j as i } from "./removable-Bti6oWPM.js";
import { t as a } from "./useQuery-Sthak1vL.js";
import { t as o } from "./useMutation-DAlJQPHF.js";
import { t as s } from "./calendar-Clxci-S9.js";
import { t as c } from "./loader-circle-CbE-4Efj.js";
import { t as l } from "./mail-Bfwhevaf.js";
import { t as u } from "./phone-B9wj1o3G.js";
import { t as d } from "./save-AfvqHWga.js";
import { E as f, F as p, T as m, g as h, lt as g, p as _, u as v } from "./index-BPJbQuiK.js";
var y = t(e()),
  b = n();
function x() {
  let e = r(),
    t = i(),
    { session: n } = v(),
    x = n?.userId || `user_maya`,
    { data: S, isLoading: C } = a({ queryKey: [`settings`, x], queryFn: () => _(x) }),
    [w, T] = (0, y.useState)(S?.email || n?.user?.email || `maya@opexnal.local`),
    [E, D] = (0, y.useState)(S?.phone || `+91 98765 43210`),
    [O, k] = (0, y.useState)(S?.dateOfBirth || `2000-05-15`),
    [A, j] = (0, y.useState)(S?.recoveryEmail || `maya.backup@gmail.com`),
    M = o({
      mutationFn: async () => h(x, { email: w, phone: E, dateOfBirth: O, recoveryEmail: A }),
      onSuccess: () => {
        (t.invalidateQueries({ queryKey: [`settings`, x] }),
          g.success(`Account information saved successfully.`));
      },
      onError: () => {
        g.error(`Failed to update account information.`);
      },
    });
  return (0, b.jsx)(m, {
    activeTab: `profile`,
    children: (0, b.jsxs)(`div`, {
      className: `min-h-screen bg-black text-white pb-20 max-w-xl mx-auto`,
      children: [
        (0, b.jsx)(f, {
          title: `Account Details`,
          showBack: !0,
          onBack: () => e({ to: `/settings` }),
        }),
        (0, b.jsxs)(`div`, {
          className: `p-4 space-y-6`,
          children: [
            (0, b.jsxs)(`div`, {
              className: `p-3.5 bg-[#121212] border border-[#262626] rounded-xl flex items-center gap-3 text-xs text-gray-300`,
              children: [
                (0, b.jsx)(p, { className: `w-5 h-5 text-emerald-400 shrink-0` }),
                (0, b.jsx)(`p`, {
                  children: `Your contact details are encrypted and used for account verification and security notifications.`,
                }),
              ],
            }),
            (0, b.jsxs)(`form`, {
              onSubmit: (e) => {
                (e.preventDefault(), M.mutate());
              },
              className: `space-y-4`,
              children: [
                (0, b.jsxs)(`div`, {
                  className: `space-y-1.5`,
                  children: [
                    (0, b.jsx)(`label`, {
                      className: `text-xs font-semibold text-gray-300`,
                      children: `Primary Email`,
                    }),
                    (0, b.jsxs)(`div`, {
                      className: `relative flex items-center`,
                      children: [
                        (0, b.jsx)(`span`, {
                          className: `absolute left-3.5 text-gray-400`,
                          children: (0, b.jsx)(l, { size: 16 }),
                        }),
                        (0, b.jsx)(`input`, {
                          type: `email`,
                          value: w,
                          onChange: (e) => T(e.target.value),
                          required: !0,
                          className: `w-full h-11 pl-10 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition`,
                        }),
                      ],
                    }),
                  ],
                }),
                (0, b.jsxs)(`div`, {
                  className: `space-y-1.5`,
                  children: [
                    (0, b.jsx)(`label`, {
                      className: `text-xs font-semibold text-gray-300`,
                      children: `Mobile Phone`,
                    }),
                    (0, b.jsxs)(`div`, {
                      className: `relative flex items-center`,
                      children: [
                        (0, b.jsx)(`span`, {
                          className: `absolute left-3.5 text-gray-400`,
                          children: (0, b.jsx)(u, { size: 16 }),
                        }),
                        (0, b.jsx)(`input`, {
                          type: `tel`,
                          value: E,
                          onChange: (e) => D(e.target.value),
                          className: `w-full h-11 pl-10 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition`,
                        }),
                      ],
                    }),
                  ],
                }),
                (0, b.jsxs)(`div`, {
                  className: `space-y-1.5`,
                  children: [
                    (0, b.jsx)(`label`, {
                      className: `text-xs font-semibold text-gray-300`,
                      children: `Date of Birth`,
                    }),
                    (0, b.jsxs)(`div`, {
                      className: `relative flex items-center`,
                      children: [
                        (0, b.jsx)(`span`, {
                          className: `absolute left-3.5 text-gray-400`,
                          children: (0, b.jsx)(s, { size: 16 }),
                        }),
                        (0, b.jsx)(`input`, {
                          type: `date`,
                          value: O,
                          onChange: (e) => k(e.target.value),
                          required: !0,
                          className: `w-full h-11 pl-10 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition`,
                        }),
                      ],
                    }),
                    (0, b.jsx)(`p`, {
                      className: `text-[11px] text-gray-500`,
                      children: `Used to verify age compliance and provide age-appropriate experiences.`,
                    }),
                  ],
                }),
                (0, b.jsxs)(`div`, {
                  className: `space-y-1.5`,
                  children: [
                    (0, b.jsx)(`label`, {
                      className: `text-xs font-semibold text-gray-300`,
                      children: `Backup Recovery Email`,
                    }),
                    (0, b.jsxs)(`div`, {
                      className: `relative flex items-center`,
                      children: [
                        (0, b.jsx)(`span`, {
                          className: `absolute left-3.5 text-gray-400`,
                          children: (0, b.jsx)(l, { size: 16 }),
                        }),
                        (0, b.jsx)(`input`, {
                          type: `email`,
                          value: A,
                          onChange: (e) => j(e.target.value),
                          placeholder: `backup@example.com`,
                          className: `w-full h-11 pl-10 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition`,
                        }),
                      ],
                    }),
                    (0, b.jsx)(`p`, {
                      className: `text-[11px] text-gray-500`,
                      children: `Used strictly to verify account ownership if your primary email is compromised.`,
                    }),
                  ],
                }),
                (0, b.jsxs)(`button`, {
                  type: `submit`,
                  disabled: M.isPending,
                  className: `w-full h-11 mt-4 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50`,
                  children: [
                    M.isPending
                      ? (0, b.jsx)(c, { className: `w-4 h-4 animate-spin` })
                      : (0, b.jsx)(d, { className: `w-4 h-4` }),
                    (0, b.jsx)(`span`, { children: `Save Account Information` }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
export { x as component };
