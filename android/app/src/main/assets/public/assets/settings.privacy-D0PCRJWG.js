import { t as e } from "./jsx-runtime-B5yqYJvp.js";
import { n as t } from "./createLucideIcon-DgzBSI1Z.js";
import { t as n } from "./client-CNuAEkjg.js";
import { j as r } from "./removable-Bti6oWPM.js";
import { t as i } from "./useQuery-Sthak1vL.js";
import { a, i as o, n as s, r as c, t as l } from "./select-NAbSpRwj.js";
import { t as u } from "./loader-circle-CbE-4Efj.js";
import { E as d, T as f, f as p, lt as m, rt as h, u as g } from "./index-BPJbQuiK.js";
import { n as _ } from "./profile-qFNPerqP.js";
import { t as v } from "./label-Oe9ke0jm.js";
var y = e(),
  b = [
    { value: `everyone`, label: `Everyone` },
    { value: `followers`, label: `People you follow` },
    { value: `nobody`, label: `No one` },
  ];
function x() {
  let { user: e } = g(),
    x = r(),
    { data: S, isLoading: C } = i({
      queryKey: [`profile`, e?.id],
      queryFn: () => (e?.id ? _(e.id) : null),
      enabled: !!e?.id,
    });
  async function w(t) {
    if (e)
      try {
        let { error: r } = await n.from(`profiles`).update(t).eq(`id`, e.id);
        if (r) {
          m.error(r.message);
          return;
        }
        (await x.invalidateQueries({ queryKey: [`profile`, e.id] }), m.success(`Privacy updated`));
      } catch (e) {
        m.error(e instanceof Error ? e.message : `Failed to update privacy settings`);
      }
  }
  return (0, y.jsx)(f, {
    header: (0, y.jsx)(d, {
      title: `Privacy`,
      left: (0, y.jsx)(t, {
        to: `/settings`,
        "aria-label": `Back`,
        className: `text-muted-foreground hover:text-foreground`,
        children: (0, y.jsx)(h, { className: `h-5 w-5`, "aria-hidden": `true` }),
      }),
    }),
    children:
      C || !S
        ? (0, y.jsx)(`div`, {
            className: `flex justify-center py-20`,
            children: (0, y.jsx)(u, {
              className: `h-5 w-5 animate-spin text-muted-foreground`,
              "aria-hidden": `true`,
            }),
          })
        : (0, y.jsxs)(`div`, {
            className: `space-y-3 px-4 py-4`,
            children: [
              (0, y.jsxs)(`div`, {
                className: `flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3.5`,
                children: [
                  (0, y.jsxs)(`div`, {
                    className: `min-w-0 flex-1`,
                    children: [
                      (0, y.jsx)(v, {
                        htmlFor: `private-account`,
                        className: `text-sm font-medium`,
                        children: `Private account`,
                      }),
                      (0, y.jsx)(`p`, {
                        className: `mt-0.5 text-xs text-muted-foreground`,
                        children: `Only approved followers can see your posts.`,
                      }),
                    ],
                  }),
                  (0, y.jsx)(p, {
                    id: `private-account`,
                    checked: S.is_private,
                    onCheckedChange: (e) => w({ is_private: e }),
                  }),
                ],
              }),
              (0, y.jsxs)(`div`, {
                className: `flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3.5`,
                children: [
                  (0, y.jsxs)(`div`, {
                    className: `min-w-0 flex-1`,
                    children: [
                      (0, y.jsx)(v, {
                        htmlFor: `activity-status`,
                        className: `text-sm font-medium`,
                        children: `Show activity status`,
                      }),
                      (0, y.jsx)(`p`, {
                        className: `mt-0.5 text-xs text-muted-foreground`,
                        children: `Let people see when you were last active.`,
                      }),
                    ],
                  }),
                  (0, y.jsx)(p, {
                    id: `activity-status`,
                    checked: S.show_activity_status,
                    onCheckedChange: (e) => w({ show_activity_status: e }),
                  }),
                ],
              }),
              (0, y.jsxs)(`div`, {
                className: `rounded-2xl border border-border bg-surface px-4 py-3.5`,
                children: [
                  (0, y.jsx)(v, {
                    htmlFor: `tags`,
                    className: `text-sm font-medium`,
                    children: `Who can tag you`,
                  }),
                  (0, y.jsxs)(l, {
                    value: S.allow_tags_from,
                    onValueChange: (e) => w({ allow_tags_from: e }),
                    children: [
                      (0, y.jsx)(o, {
                        id: `tags`,
                        className: `mt-2 h-11 rounded-xl bg-background`,
                        children: (0, y.jsx)(a, {}),
                      }),
                      (0, y.jsx)(s, {
                        children: b.map((e) =>
                          (0, y.jsx)(c, { value: e.value, children: e.label }, e.value),
                        ),
                      }),
                    ],
                  }),
                ],
              }),
              (0, y.jsxs)(`div`, {
                className: `rounded-2xl border border-border bg-surface px-4 py-3.5`,
                children: [
                  (0, y.jsx)(v, {
                    htmlFor: `mentions`,
                    className: `text-sm font-medium`,
                    children: `Who can mention you`,
                  }),
                  (0, y.jsxs)(l, {
                    value: S.allow_mentions_from,
                    onValueChange: (e) => w({ allow_mentions_from: e }),
                    children: [
                      (0, y.jsx)(o, {
                        id: `mentions`,
                        className: `mt-2 h-11 rounded-xl bg-background`,
                        children: (0, y.jsx)(a, {}),
                      }),
                      (0, y.jsx)(s, {
                        children: b.map((e) =>
                          (0, y.jsx)(c, { value: e.value, children: e.label }, e.value),
                        ),
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
