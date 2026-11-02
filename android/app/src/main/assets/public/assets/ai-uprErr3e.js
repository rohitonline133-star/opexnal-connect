import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { t as r } from "./createLucideIcon-DgzBSI1Z.js";
import { t as i } from "./useNavigate-BJOrhi-q.js";
import { t as a } from "./bot-BCpRT35K.js";
import { t as o } from "./copy-BIV7FDCl.js";
import { t as ee } from "./file-text-D6gwwmni.js";
import { t as te } from "./hash-Dy8_d-Qs.js";
import { n as s, t as c } from "./refresh-cw-Bz3isKCO.js";
import { t as l } from "./share-2-Cttt8bCg.js";
import { t as ne } from "./user-check-BRT0F-8x.js";
import { t as u } from "./x-CeqC2pJc.js";
import { t as d } from "./utils-DojpP95n.js";
import {
  C as f,
  D as p,
  E as m,
  G as h,
  L as re,
  P as g,
  T as ie,
  d as ae,
  it as _,
  lt as v,
  u as oe,
  w as y,
} from "./index-BPJbQuiK.js";
import { n as b, t as x } from "./ai-client--xbxNFq7.js";
var se = r(`compass`, [
    [`circle`, { cx: `12`, cy: `12`, r: `10`, key: `1mglay` }],
    [
      `path`,
      {
        d: `m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z`,
        key: `9ktpf1`,
      },
    ],
  ]),
  S = r(`wand-sparkles`, [
    [
      `path`,
      {
        d: `m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72`,
        key: `ul74o6`,
      },
    ],
    [`path`, { d: `m14 7 3 3`, key: `1r5n42` }],
    [`path`, { d: `M5 6v4`, key: `ilb8ba` }],
    [`path`, { d: `M19 14v4`, key: `blhpug` }],
    [`path`, { d: `M10 2v2`, key: `7u0qdc` }],
    [`path`, { d: `M7 8H3`, key: `zfb6yr` }],
    [`path`, { d: `M21 16h-4`, key: `1cnmox` }],
    [`path`, { d: `M11 3H9`, key: `1obp7u` }],
  ]),
  C = t(e()),
  w = n(),
  ce = [
    `✨ Generate 3 viral captions for my new photo`,
    `🔥 Find high-engagement trending hashtags for tech & design`,
    `💡 Give me 3 creative reel hooks & concepts for this week`,
    `✍️ Write a modern Hinglish bio for my creator profile`,
    `🌟 Tips to increase my story views and engagement organically`,
  ],
  T = [
    `Aesthetic & Minimalist`,
    `Viral & Energetic`,
    `Hinglish / Trendy`,
    `Storytelling & Deep`,
    `Professional & Crisp`,
    `Funny & Witty`,
  ],
  E = [`English`, `Hinglish (Hindi + English)`, `Hindi (हिन्दी)`, `Spanish`, `French`];
function D() {
  let { user: e } = oe(),
    t = i(),
    [n, r] = (0, C.useState)(`chat`),
    [D, O] = (0, C.useState)(``),
    [k, A] = (0, C.useState)(!1),
    [j, M] = (0, C.useState)(null),
    [N, P] = (0, C.useState)(null),
    F = (0, C.useRef)(null),
    I = e?.user_metadata?.username || e?.email?.split(`@`)[0] || ``,
    [L, R] = (0, C.useState)([
      {
        id: `welcome`,
        sender: `ai`,
        text: `Namaste & welcome ${I ? `@${I}` : ``}! I am **Opexnal AI** — your creative co-pilot. 🚀\n\nI can help you craft viral captions, script 15s reels with 3-second hooks, generate hashtag strategies, analyze images, and optimize your creator profile in English, Hindi, or Hinglish.\n\nHow can I help you create today?`,
        timestamp: `Just now`,
      },
    ]),
    [z, B] = (0, C.useState)(`caption`),
    [V, H] = (0, C.useState)(``),
    [U, W] = (0, C.useState)(T[0]),
    [G, le] = (0, C.useState)(E[0]),
    [K, q] = (0, C.useState)(``),
    [J, Y] = (0, C.useState)(!1),
    [X, Z] = (0, C.useState)(!1),
    ue = (e) => {
      let t = e.target.files?.[0];
      if (!t) return;
      if (!t.type.startsWith(`image/`)) {
        v.error(`Please choose an image file (PNG, JPG, WebP)`);
        return;
      }
      if (t.size > 10485760) {
        v.error(`Image must be under 10MB`);
        return;
      }
      let n = new FileReader();
      ((n.onload = () => {
        P({ base64: n.result, mime: t.type });
      }),
        n.readAsDataURL(t),
        F.current && (F.current.value = ``));
    },
    Q = async (e) => {
      let t = (e || D).trim();
      if ((!t && !N) || k) return;
      let n = {
        id: `u-${Date.now()}`,
        sender: `user`,
        text: t || `Analyze this image`,
        timestamp: new Date().toLocaleTimeString([], { hour: `2-digit`, minute: `2-digit` }),
        ...(N?.base64 ? { imagePreview: N.base64 } : {}),
      };
      (R((e) => [...e, n]), O(``));
      let r = N;
      (P(null), A(!0));
      try {
        let e = L.filter((e) => e.id !== `welcome`).map((e) => ({
          role: e.sender === `user` ? `user` : `model`,
          content: e.text,
        }));
        e.push({ role: `user`, content: n.text });
        let t = await b({
            messages: e,
            prompt: n.text,
            ...(r?.base64 ? { imageBase64: r.base64 } : {}),
            ...(r?.mime ? { imageMime: r.mime } : {}),
          }),
          i = {
            id: `ai-${Date.now()}`,
            sender: `ai`,
            text: t,
            timestamp: new Date().toLocaleTimeString([], { hour: `2-digit`, minute: `2-digit` }),
          };
        R((e) => [...e, i]);
      } catch (e) {
        let t = e;
        (v.error(t.message || `Failed to generate AI reply`),
          R((e) => [
            ...e,
            {
              id: `ai-err-${Date.now()}`,
              sender: `ai`,
              text: `I ran into a temporary hiccup processing that request. Please try asking again in a moment!`,
              timestamp: `Just now`,
            },
          ]));
      } finally {
        A(!1);
      }
    },
    de = async (e, t) => {
      try {
        (await navigator.clipboard.writeText(t),
          M(e),
          v.success(`Copied to clipboard`),
          setTimeout(() => M(null), 2e3));
      } catch {
        v.error(`Failed to copy`);
      }
    },
    $ = (e) => {
      try {
        sessionStorage.setItem(`opexnal_draft_caption`, e);
      } catch {}
      (v.success(`Caption copied! Redirecting to Create Post...`), t({ to: `/create` }));
    };
  return (0, w.jsx)(ie, {
    header: (0, w.jsx)(m, {
      title: `Opexnal AI`,
      right: (0, w.jsxs)(`div`, {
        className: `flex items-center gap-1`,
        children: [
          (0, w.jsx)(`span`, {
            className: `flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20`,
          }),
          (0, w.jsx)(`span`, {
            className: `text-[11px] font-medium text-emerald-500`,
            children: `Live`,
          }),
        ],
      }),
    }),
    children: (0, w.jsxs)(`div`, {
      className: `mx-auto flex flex-col h-[calc(100vh-8.5rem)] max-w-2xl px-3 sm:px-4 py-3`,
      children: [
        (0, w.jsxs)(`div`, {
          className: `flex rounded-xl bg-secondary/80 p-1 mb-3 border border-border/60`,
          children: [
            (0, w.jsxs)(`button`, {
              type: `button`,
              onClick: () => r(`chat`),
              className: d(
                `flex flex-1 items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all`,
                n === `chat`
                  ? `bg-background text-foreground shadow-sm`
                  : `text-muted-foreground hover:text-foreground`,
              ),
              children: [(0, w.jsx)(s, { className: `h-4 w-4 text-primary` }), `AI Co-Pilot Chat`],
            }),
            (0, w.jsxs)(`button`, {
              type: `button`,
              onClick: () => r(`studio`),
              className: d(
                `flex flex-1 items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all`,
                n === `studio`
                  ? `bg-background text-foreground shadow-sm`
                  : `text-muted-foreground hover:text-foreground`,
              ),
              children: [
                (0, w.jsx)(g, { className: `h-4 w-4 text-primary` }),
                `Creator Studio Tools`,
              ],
            }),
          ],
        }),
        n === `chat`
          ? (0, w.jsxs)(w.Fragment, {
              children: [
                (0, w.jsx)(`div`, {
                  className: `flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-2.5`,
                  children: ce.map((e) =>
                    (0, w.jsx)(
                      `button`,
                      {
                        type: `button`,
                        onClick: () => Q(e),
                        className: `shrink-0 text-xs px-3 py-1.5 rounded-full border border-border/80 bg-surface text-muted-foreground hover:text-foreground hover:bg-secondary transition-all`,
                        children: e,
                      },
                      e,
                    ),
                  ),
                }),
                (0, w.jsxs)(`div`, {
                  className: `flex-1 overflow-y-auto space-y-3.5 pr-1 pb-2`,
                  children: [
                    L.map((e) =>
                      (0, w.jsxs)(
                        `div`,
                        {
                          className: `flex gap-2.5 ${e.sender === `user` ? `justify-end` : `justify-start`}`,
                          children: [
                            e.sender === `ai` &&
                              (0, w.jsx)(`div`, {
                                className: `h-7 w-7 rounded-xl brand-gradient-bg text-primary-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-sm`,
                                children: (0, w.jsx)(a, { className: `h-4 w-4` }),
                              }),
                            (0, w.jsxs)(`div`, {
                              className: `flex flex-col max-w-[85%]`,
                              children: [
                                e.imagePreview &&
                                  (0, w.jsx)(`div`, {
                                    className: `mb-1.5 overflow-hidden rounded-xl border border-border max-w-[200px]`,
                                    children: (0, w.jsx)(`img`, {
                                      src: e.imagePreview,
                                      alt: `Uploaded attachment`,
                                      className: `h-auto w-full object-cover`,
                                    }),
                                  }),
                                (0, w.jsx)(`div`, {
                                  className: d(
                                    `rounded-2xl px-4 py-2.5 text-xs sm:text-sm whitespace-pre-line leading-relaxed`,
                                    e.sender === `user`
                                      ? `brand-gradient-bg text-primary-foreground font-medium rounded-br-sm shadow-sm`
                                      : `bg-surface border border-border/80 text-foreground rounded-bl-sm shadow-xs`,
                                  ),
                                  children: e.text,
                                }),
                                e.sender === `ai` &&
                                  (0, w.jsxs)(`div`, {
                                    className: `flex items-center gap-2 mt-1.5 ml-1`,
                                    children: [
                                      (0, w.jsxs)(`button`, {
                                        type: `button`,
                                        onClick: () => de(e.id, e.text),
                                        className: `flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors`,
                                        children: [
                                          j === e.id
                                            ? (0, w.jsx)(_, {
                                                className: `h-3 w-3 text-emerald-500`,
                                              })
                                            : (0, w.jsx)(o, { className: `h-3 w-3` }),
                                          j === e.id ? `Copied` : `Copy`,
                                        ],
                                      }),
                                      (0, w.jsx)(`span`, {
                                        className: `text-[10px] text-border`,
                                        children: `•`,
                                      }),
                                      (0, w.jsxs)(`button`, {
                                        type: `button`,
                                        onClick: () => $(e.text),
                                        className: `flex items-center gap-1 text-[10px] text-primary hover:underline font-medium`,
                                        children: [
                                          (0, w.jsx)(l, { className: `h-3 w-3` }),
                                          ` Use in Post`,
                                        ],
                                      }),
                                      (0, w.jsx)(`span`, {
                                        className: `text-[10px] text-muted-foreground/60 ml-auto`,
                                        children: e.timestamp,
                                      }),
                                    ],
                                  }),
                              ],
                            }),
                          ],
                        },
                        e.id,
                      ),
                    ),
                    k &&
                      (0, w.jsxs)(`div`, {
                        className: `flex items-center gap-2.5 text-xs text-muted-foreground pl-1`,
                        children: [
                          (0, w.jsx)(`div`, {
                            className: `h-7 w-7 rounded-xl brand-gradient-bg text-primary-foreground flex items-center justify-center shrink-0`,
                            children: (0, w.jsx)(a, { className: `h-4 w-4` }),
                          }),
                          (0, w.jsxs)(`div`, {
                            className: `flex items-center gap-2 rounded-2xl bg-surface border border-border px-3.5 py-2 text-xs text-muted-foreground`,
                            children: [
                              (0, w.jsx)(c, { className: `h-3.5 w-3.5 animate-spin text-primary` }),
                              (0, w.jsx)(`span`, {
                                children: `Opexnal AI is generating creative response...`,
                              }),
                            ],
                          }),
                        ],
                      }),
                  ],
                }),
                N &&
                  (0, w.jsxs)(`div`, {
                    className: `relative mb-2 inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-foreground`,
                    children: [
                      (0, w.jsx)(h, { className: `h-4 w-4 text-primary` }),
                      (0, w.jsx)(`span`, {
                        className: `truncate max-w-[200px]`,
                        children: `Image attached for vision analysis`,
                      }),
                      (0, w.jsx)(`button`, {
                        type: `button`,
                        onClick: () => P(null),
                        className: `rounded-full p-0.5 hover:bg-background/80 text-muted-foreground hover:text-foreground`,
                        children: (0, w.jsx)(u, { className: `h-3.5 w-3.5` }),
                      }),
                    ],
                  }),
                (0, w.jsxs)(`form`, {
                  onSubmit: (e) => {
                    (e.preventDefault(), Q());
                  },
                  className: `mt-auto flex items-center gap-2 pt-2 border-t border-border`,
                  children: [
                    (0, w.jsx)(`input`, {
                      type: `file`,
                      ref: F,
                      onChange: ue,
                      accept: `image/*`,
                      className: `hidden`,
                    }),
                    (0, w.jsx)(y, {
                      type: `button`,
                      variant: `outline`,
                      size: `icon`,
                      onClick: () => F.current?.click(),
                      title: `Attach photo for AI vision`,
                      className: `h-11 w-11 shrink-0 rounded-xl border-border bg-surface text-muted-foreground hover:text-foreground`,
                      children: (0, w.jsx)(h, { className: `h-4 w-4` }),
                    }),
                    (0, w.jsx)(f, {
                      value: D,
                      onChange: (e) => O(e.target.value),
                      placeholder: `Ask Opexnal AI in English, हिन्दी, or Hinglish...`,
                      disabled: k,
                      className: `h-11 flex-1 rounded-xl bg-surface px-4 text-sm placeholder:text-muted-foreground/70`,
                    }),
                    (0, w.jsx)(y, {
                      type: `submit`,
                      disabled: (!D.trim() && !N) || k,
                      size: `icon`,
                      className: `h-11 w-11 shrink-0 rounded-xl brand-gradient-bg text-primary-foreground shadow-sm`,
                      children: (0, w.jsx)(re, { className: `h-4 w-4` }),
                    }),
                  ],
                }),
              ],
            })
          : (0, w.jsxs)(`div`, {
              className: `flex-1 overflow-y-auto space-y-4 pr-1 pb-4`,
              children: [
                (0, w.jsx)(`div`, {
                  className: `grid grid-cols-3 gap-2`,
                  children: [
                    { id: `caption`, label: `Captions`, icon: ee },
                    { id: `reels_idea`, label: `Reels & Hooks`, icon: p },
                    { id: `hashtags`, label: `Hashtags`, icon: te },
                    { id: `bio`, label: `Creator Bio`, icon: ne },
                    { id: `rewrite`, label: `AI Rewriter`, icon: S },
                    { id: `image_analysis`, label: `Photo Vibe`, icon: se },
                  ].map((e) => {
                    let t = e.icon,
                      n = z === e.id;
                    return (0, w.jsxs)(
                      `button`,
                      {
                        type: `button`,
                        onClick: () => {
                          (B(e.id), q(``));
                        },
                        className: d(
                          `flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all`,
                          n
                            ? `border-primary bg-primary/10 text-primary font-semibold shadow-xs`
                            : `border-border bg-surface text-muted-foreground hover:bg-secondary hover:text-foreground`,
                        ),
                        children: [
                          (0, w.jsx)(t, { className: `h-4 w-4` }),
                          (0, w.jsx)(`span`, { className: `text-xs`, children: e.label }),
                        ],
                      },
                      e.id,
                    );
                  }),
                }),
                (0, w.jsxs)(`div`, {
                  className: `rounded-2xl border border-border bg-surface p-4 space-y-3.5`,
                  children: [
                    (0, w.jsxs)(`div`, {
                      children: [
                        (0, w.jsxs)(`label`, {
                          className: `text-xs font-semibold text-foreground mb-1.5 block`,
                          children: [
                            z === `caption` && `What is your post about?`,
                            z === `reels_idea` && `What is the topic or niche of your reel?`,
                            z === `hashtags` && `What is the post theme / industry?`,
                            z === `bio` && `Describe your identity, hobbies, or brand`,
                            z === `rewrite` && `Paste the draft caption or text to elevate`,
                            z === `image_analysis` && `Describe the photo visual elements`,
                          ],
                        }),
                        (0, w.jsx)(ae, {
                          value: V,
                          onChange: (e) => H(e.target.value),
                          placeholder:
                            z === `caption`
                              ? `e.g. Sunset rooftop shoot in Mumbai with friends, celebrating project launch`
                              : z === `reels_idea`
                                ? `e.g. Coding morning routine, 3 minimal desk setup tips`
                                : z === `hashtags`
                                  ? `e.g. Street photography, cinematic urban aesthetic`
                                  : z === `bio`
                                    ? `e.g. Tech founder & visual designer based in Bangalore, building AI tools`
                                    : `Enter text...`,
                          rows: 3,
                          className: `rounded-xl bg-background text-xs sm:text-sm resize-none`,
                        }),
                      ],
                    }),
                    (0, w.jsxs)(`div`, {
                      className: `grid grid-cols-2 gap-2.5`,
                      children: [
                        (0, w.jsxs)(`div`, {
                          children: [
                            (0, w.jsx)(`label`, {
                              className: `text-[11px] font-medium text-muted-foreground mb-1 block`,
                              children: `Tone / Aesthetic`,
                            }),
                            (0, w.jsx)(`select`, {
                              value: U,
                              onChange: (e) => W(e.target.value),
                              className: `w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary`,
                              children: T.map((e) =>
                                (0, w.jsx)(`option`, { value: e, children: e }, e),
                              ),
                            }),
                          ],
                        }),
                        (0, w.jsxs)(`div`, {
                          children: [
                            (0, w.jsx)(`label`, {
                              className: `text-[11px] font-medium text-muted-foreground mb-1 block`,
                              children: `Language`,
                            }),
                            (0, w.jsx)(`select`, {
                              value: G,
                              onChange: (e) => le(e.target.value),
                              className: `w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary`,
                              children: E.map((e) =>
                                (0, w.jsx)(`option`, { value: e, children: e }, e),
                              ),
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, w.jsx)(y, {
                      type: `button`,
                      onClick: async () => {
                        if (!V.trim() && z !== `image_analysis`) {
                          v.error(`Please provide a topic or prompt`);
                          return;
                        }
                        (Y(!0), q(``));
                        try {
                          let e = await x({
                            tool: z,
                            topic: V.trim(),
                            ...(U ? { tone: U } : {}),
                            ...(G ? { language: G } : {}),
                            contextText: V.trim(),
                          });
                          q(e);
                        } catch (e) {
                          let t = e;
                          v.error(t.message || `Failed to generate studio output`);
                        } finally {
                          Y(!1);
                        }
                      },
                      disabled: J || !V.trim(),
                      className: `w-full h-11 rounded-xl brand-gradient-bg text-primary-foreground font-semibold shadow-md shadow-primary/20`,
                      children: J
                        ? (0, w.jsxs)(w.Fragment, {
                            children: [
                              (0, w.jsx)(c, { className: `mr-2 h-4 w-4 animate-spin` }),
                              `Generating with Opexnal AI...`,
                            ],
                          })
                        : (0, w.jsxs)(w.Fragment, {
                            children: [
                              (0, w.jsx)(S, { className: `mr-2 h-4 w-4` }),
                              `Generate Magic Output`,
                            ],
                          }),
                    }),
                  ],
                }),
                K &&
                  (0, w.jsxs)(`div`, {
                    className: `rounded-2xl border border-primary/30 bg-surface p-4 shadow-sm space-y-3 animate-in fade-in-50`,
                    children: [
                      (0, w.jsxs)(`div`, {
                        className: `flex items-center justify-between border-b border-border/80 pb-2.5`,
                        children: [
                          (0, w.jsxs)(`div`, {
                            className: `flex items-center gap-2`,
                            children: [
                              (0, w.jsx)(g, { className: `h-4 w-4 text-primary` }),
                              (0, w.jsx)(`h3`, {
                                className: `text-xs font-semibold uppercase tracking-wider text-foreground`,
                                children: `AI Generated Result`,
                              }),
                            ],
                          }),
                          (0, w.jsxs)(`div`, {
                            className: `flex items-center gap-2`,
                            children: [
                              (0, w.jsxs)(y, {
                                variant: `outline`,
                                size: `sm`,
                                onClick: async () => {
                                  (await navigator.clipboard.writeText(K),
                                    Z(!0),
                                    v.success(`Result copied`),
                                    setTimeout(() => Z(!1), 2e3));
                                },
                                className: `h-7 text-xs rounded-lg gap-1 border-border`,
                                children: [
                                  X
                                    ? (0, w.jsx)(_, { className: `h-3 w-3 text-emerald-500` })
                                    : (0, w.jsx)(o, { className: `h-3 w-3` }),
                                  X ? `Copied` : `Copy`,
                                ],
                              }),
                              (0, w.jsxs)(y, {
                                size: `sm`,
                                onClick: () => $(K),
                                className: `h-7 text-xs rounded-lg gap-1 brand-gradient-bg text-primary-foreground`,
                                children: [(0, w.jsx)(l, { className: `h-3 w-3` }), ` Create Post`],
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, w.jsx)(`div`, {
                        className: `whitespace-pre-line text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal`,
                        children: K,
                      }),
                    ],
                  }),
              ],
            }),
      ],
    }),
  });
}
export { D as component };
