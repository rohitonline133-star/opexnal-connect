import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { n as r } from "./createLucideIcon-DgzBSI1Z.js";
import { t as i } from "./useNavigate-BJOrhi-q.js";
import { t as a } from "./client-CNuAEkjg.js";
import { j as o } from "./removable-Bti6oWPM.js";
import { t as s } from "./useQuery-Sthak1vL.js";
import { a as c, i as l, n as u, r as d, t as f } from "./select-NAbSpRwj.js";
import { t as p } from "./loader-circle-CbE-4Efj.js";
import { a as m, i as h, n as g, r as _, t as v } from "./types-CuvG8GNf.js";
import {
  C as y,
  E as b,
  T as x,
  d as S,
  lt as C,
  rt as w,
  u as T,
  w as E,
} from "./index-BPJbQuiK.js";
import { i as D, n as O, t as k } from "./profile-qFNPerqP.js";
import { t as A } from "./avatar-ECPYu-KR.js";
import { t as j } from "./label-Oe9ke0jm.js";
var M = t(e()),
  N = n(),
  P = _({
    display_name: h().trim().max(50, `Name must be 50 characters or fewer`),
    username: h()
      .trim()
      .toLowerCase()
      .regex(k, `3–30 characters: lowercase letters, numbers, dots or underscores`),
    bio: h().trim().max(160, `Bio must be 160 characters or fewer`),
    website: m([g(``), h().trim().url(`Enter a valid URL`).max(200)]),
    account_type: v([`personal`, `creator`, `business`]),
  });
function F() {
  let { user: e } = T(),
    t = i(),
    n = o(),
    m = (0, M.useRef)(null),
    { data: h, isLoading: g } = s({
      queryKey: [`profile`, e?.id],
      queryFn: () => O(e.id),
      enabled: !!e?.id,
    }),
    [_, v] = (0, M.useState)({
      display_name: ``,
      username: ``,
      bio: ``,
      website: ``,
      account_type: `personal`,
    }),
    [k, F] = (0, M.useState)(!1),
    [I, L] = (0, M.useState)(!1);
  (0, M.useEffect)(() => {
    h &&
      v({
        display_name: h.display_name ?? ``,
        username: h.username,
        bio: h.bio ?? ``,
        website: h.website ?? ``,
        account_type: h.account_type,
      });
  }, [h]);
  async function R(t) {
    let r = t.target.files?.[0];
    if (!r || !e) return;
    if (!r.type.startsWith(`image/`)) {
      C.error(`Choose an image file`);
      return;
    }
    if (r.size > 5242880) {
      C.error(`Images must be 5 MB or smaller`);
      return;
    }
    L(!0);
    let i = r.name.split(`.`).pop()?.toLowerCase() ?? `jpg`,
      o = `${e.id}/avatar-${Date.now()}.${i}`,
      { error: s } = await a.storage
        .from(`avatars`)
        .upload(o, r, { upsert: !0, contentType: r.type });
    if (s) {
      (L(!1), C.error(s.message));
      return;
    }
    let { error: c } = await a.from(`profiles`).update({ avatar_url: o }).eq(`id`, e.id);
    if ((L(!1), c)) {
      C.error(c.message);
      return;
    }
    (await n.invalidateQueries({ queryKey: [`profile`, e.id] }), C.success(`Photo updated`));
  }
  async function z(r) {
    if ((r.preventDefault(), !e)) return;
    let i = P.safeParse(_);
    if (!i.success) {
      C.error(i.error.issues[0]?.message ?? `Check your details`);
      return;
    }
    F(!0);
    let { error: o } = await a
      .from(`profiles`)
      .update({
        display_name: i.data.display_name,
        username: i.data.username,
        bio: i.data.bio,
        website: i.data.website || null,
        account_type: i.data.account_type,
      })
      .eq(`id`, e.id);
    if ((F(!1), o)) {
      let e =
        o?.code === `23505`
          ? `That username is already taken`
          : o.message || `Profile update failed`;
      C.error(e);
      return;
    }
    (await n.invalidateQueries({ queryKey: [`profile`, e.id] }),
      C.success(`Profile saved`),
      t({ to: `/profile` }));
  }
  return (0, N.jsx)(x, {
    header: (0, N.jsx)(b, {
      title: `Edit profile`,
      left: (0, N.jsx)(r, {
        to: `/profile`,
        "aria-label": `Back`,
        className: `text-muted-foreground hover:text-foreground`,
        children: (0, N.jsx)(w, { className: `h-5 w-5`, "aria-hidden": `true` }),
      }),
    }),
    children:
      g || !h
        ? (0, N.jsx)(`div`, {
            className: `flex justify-center py-20`,
            children: (0, N.jsx)(p, {
              className: `h-5 w-5 animate-spin text-muted-foreground`,
              "aria-hidden": `true`,
            }),
          })
        : (0, N.jsxs)(`form`, {
            className: `space-y-5 px-4 py-6`,
            onSubmit: z,
            noValidate: !0,
            children: [
              (0, N.jsxs)(`div`, {
                className: `flex flex-col items-center gap-3`,
                children: [
                  (0, N.jsx)(A, {
                    path: h.avatar_url,
                    fallback: D(h),
                    className: `h-24 w-24 text-xl`,
                  }),
                  (0, N.jsx)(`input`, {
                    ref: m,
                    type: `file`,
                    accept: `image/*`,
                    className: `sr-only`,
                    onChange: R,
                  }),
                  (0, N.jsx)(E, {
                    type: `button`,
                    variant: `ghost`,
                    className: `text-primary`,
                    onClick: () => m.current?.click(),
                    disabled: I,
                    children: I ? `Uploading…` : `Change photo`,
                  }),
                ],
              }),
              (0, N.jsxs)(`div`, {
                className: `space-y-1.5`,
                children: [
                  (0, N.jsx)(j, { htmlFor: `display_name`, children: `Name` }),
                  (0, N.jsx)(y, {
                    id: `display_name`,
                    value: _.display_name,
                    maxLength: 50,
                    onChange: (e) => v((t) => ({ ...t, display_name: e.target.value })),
                    className: `h-12 rounded-xl bg-surface`,
                  }),
                ],
              }),
              (0, N.jsxs)(`div`, {
                className: `space-y-1.5`,
                children: [
                  (0, N.jsx)(j, { htmlFor: `username`, children: `Username` }),
                  (0, N.jsx)(y, {
                    id: `username`,
                    value: _.username,
                    maxLength: 30,
                    onChange: (e) => v((t) => ({ ...t, username: e.target.value.toLowerCase() })),
                    className: `h-12 rounded-xl bg-surface`,
                  }),
                ],
              }),
              (0, N.jsxs)(`div`, {
                className: `space-y-1.5`,
                children: [
                  (0, N.jsx)(j, { htmlFor: `bio`, children: `Bio` }),
                  (0, N.jsx)(S, {
                    id: `bio`,
                    value: _.bio,
                    maxLength: 160,
                    rows: 3,
                    onChange: (e) => v((t) => ({ ...t, bio: e.target.value })),
                    className: `rounded-xl bg-surface`,
                  }),
                  (0, N.jsxs)(`p`, {
                    className: `text-right text-xs text-muted-foreground`,
                    children: [_.bio.length, `/160`],
                  }),
                ],
              }),
              (0, N.jsxs)(`div`, {
                className: `space-y-1.5`,
                children: [
                  (0, N.jsx)(j, { htmlFor: `website`, children: `Website` }),
                  (0, N.jsx)(y, {
                    id: `website`,
                    inputMode: `url`,
                    placeholder: `https://`,
                    value: _.website,
                    maxLength: 200,
                    onChange: (e) => v((t) => ({ ...t, website: e.target.value })),
                    className: `h-12 rounded-xl bg-surface`,
                  }),
                ],
              }),
              (0, N.jsxs)(`div`, {
                className: `space-y-1.5`,
                children: [
                  (0, N.jsx)(j, { htmlFor: `account_type`, children: `Account type` }),
                  (0, N.jsxs)(f, {
                    value: _.account_type,
                    onValueChange: (e) => v((t) => ({ ...t, account_type: e })),
                    children: [
                      (0, N.jsx)(l, {
                        id: `account_type`,
                        className: `h-12 rounded-xl bg-surface`,
                        children: (0, N.jsx)(c, {}),
                      }),
                      (0, N.jsxs)(u, {
                        children: [
                          (0, N.jsx)(d, { value: `personal`, children: `Personal` }),
                          (0, N.jsx)(d, { value: `creator`, children: `Creator` }),
                          (0, N.jsx)(d, { value: `business`, children: `Business` }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              (0, N.jsxs)(E, {
                type: `submit`,
                variant: `brand`,
                size: `xl`,
                disabled: k,
                children: [
                  k
                    ? (0, N.jsx)(p, { className: `h-4 w-4 animate-spin`, "aria-hidden": `true` })
                    : null,
                  `Save changes`,
                ],
              }),
            ],
          }),
  });
}
export { F as component };
