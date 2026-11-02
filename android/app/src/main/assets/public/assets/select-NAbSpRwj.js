import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
import { r, t as i } from "./createLucideIcon-DgzBSI1Z.js";
import { t as a } from "./utils-DojpP95n.js";
import { n as o, r as s } from "./dist-DCH1LIdf.js";
import { i as c, n as l, r as u, t as d } from "./dist-Bo_8JIpx.js";
import {
  a as f,
  i as p,
  l as m,
  n as h,
  o as g,
  r as _,
  s as v,
  t as y,
  u as b,
} from "./es2015-iSXIpcIY.js";
import { t as x } from "./dist-lrCrpv5H.js";
import { t as S } from "./dist-OOZw2UK_.js";
import { it as C } from "./index-BPJbQuiK.js";
var w = i(`chevron-down`, [[`path`, { d: `m6 9 6 6 6-6`, key: `qrunsl` }]]),
  T = i(`chevron-up`, [[`path`, { d: `m18 15-6-6-6 6`, key: `153udz` }]]),
  E = t(e(), 1),
  D = t(r(), 1),
  O = Object.defineProperty,
  k = (e, t) => O(e, `name`, { value: t, configurable: !0 });
function A(e, [t, n]) {
  return Math.min(n, Math.max(t, e));
}
k(A, `clamp`);
var j = n(),
  M = Object.defineProperty,
  N = (e, t) => M(e, `name`, { value: t, configurable: !0 });
function P(e) {
  let t = e + `CollectionProvider`,
    [n, r] = u(t),
    [i, a] = n(t, { collectionRef: { current: null }, itemMap: new Map() }),
    c = N((e) => {
      let { scope: t, children: n } = e,
        r = E.useRef(null),
        a = E.useRef(new Map()).current;
      return (0, j.jsx)(i, { scope: t, itemMap: a, collectionRef: r, children: n });
    }, `CollectionProvider`);
  c.displayName = t;
  let l = e + `CollectionSlot`,
    d = o(l),
    f = E.forwardRef((e, t) => {
      let { scope: n, children: r } = e,
        i = a(l, n),
        o = s(t, i.collectionRef);
      return (0, j.jsx)(d, { ref: o, children: r });
    });
  f.displayName = l;
  let p = e + `CollectionItemSlot`,
    m = `data-radix-collection-item`,
    h = o(p),
    g = E.forwardRef((e, t) => {
      let { scope: n, children: r, ...i } = e,
        o = E.useRef(null),
        c = s(t, o),
        l = a(p, n);
      return (
        E.useEffect(() => (l.itemMap.set(o, { ref: o, ...i }), () => void l.itemMap.delete(o))),
        (0, j.jsx)(h, { [m]: ``, ref: c, children: r })
      );
    });
  g.displayName = p;
  function _(t) {
    let n = a(e + `CollectionConsumer`, t);
    return E.useCallback(() => {
      let e = n.collectionRef.current;
      if (!e) return [];
      let t = Array.from(e.querySelectorAll(`[${m}]`));
      return Array.from(n.itemMap.values()).sort(
        (e, n) => t.indexOf(e.ref.current) - t.indexOf(n.ref.current),
      );
    }, [n.collectionRef, n.itemMap]);
  }
  return (N(_, `useCollection`), [{ Provider: c, Slot: f, ItemSlot: g }, _, r]);
}
N(P, `createCollection`);
var F = new WeakMap(),
  I = class e extends Map {
    static {
      N(this, `OrderedDict`);
    }
    #e;
    constructor(e) {
      (super(e), (this.#e = [...super.keys()]), F.set(this, !0));
    }
    set(e, t) {
      return (
        F.get(this) && (this.has(e) ? (this.#e[this.#e.indexOf(e)] = e) : this.#e.push(e)),
        super.set(e, t),
        this
      );
    }
    insert(e, t, n) {
      let r = this.has(t),
        i = this.#e.length,
        a = ee(e),
        o = a >= 0 ? a : i + a,
        s = o < 0 || o >= i ? -1 : o;
      if (s === this.size || (r && s === this.size - 1) || s === -1) return (this.set(t, n), this);
      let c = this.size + +!r;
      a < 0 && o++;
      let l = [...this.#e],
        u,
        d = !1;
      for (let e = o; e < c; e++)
        if (o === e) {
          let i = l[e];
          (l[e] === t && (i = l[e + 1]), r && this.delete(t), (u = this.get(i)), this.set(t, n));
        } else {
          !d && l[e - 1] === t && (d = !0);
          let n = l[d ? e : e - 1],
            r = u;
          ((u = this.get(n)), this.delete(n), this.set(n, r));
        }
      return this;
    }
    with(t, n, r) {
      let i = new e(this);
      return (i.insert(t, n, r), i);
    }
    before(e) {
      let t = this.#e.indexOf(e) - 1;
      if (!(t < 0)) return this.entryAt(t);
    }
    setBefore(e, t, n) {
      let r = this.#e.indexOf(e);
      return r === -1 ? this : this.insert(r, t, n);
    }
    after(e) {
      let t = this.#e.indexOf(e);
      if (((t = t === -1 || t === this.size - 1 ? -1 : t + 1), t !== -1)) return this.entryAt(t);
    }
    setAfter(e, t, n) {
      let r = this.#e.indexOf(e);
      return r === -1 ? this : this.insert(r + 1, t, n);
    }
    first() {
      return this.entryAt(0);
    }
    last() {
      return this.entryAt(-1);
    }
    clear() {
      return ((this.#e = []), super.clear());
    }
    delete(e) {
      let t = super.delete(e);
      return (t && this.#e.splice(this.#e.indexOf(e), 1), t);
    }
    deleteAt(e) {
      let t = this.keyAt(e);
      return t !== void 0 && this.delete(t);
    }
    at(e) {
      let t = L(this.#e, e);
      if (t !== void 0) return this.get(t);
    }
    entryAt(e) {
      let t = L(this.#e, e);
      if (t !== void 0) return [t, this.get(t)];
    }
    indexOf(e) {
      return this.#e.indexOf(e);
    }
    keyAt(e) {
      return L(this.#e, e);
    }
    from(e, t) {
      let n = this.indexOf(e);
      if (n === -1) return;
      let r = n + t;
      return (r < 0 && (r = 0), r >= this.size && (r = this.size - 1), this.at(r));
    }
    keyFrom(e, t) {
      let n = this.indexOf(e);
      if (n === -1) return;
      let r = n + t;
      return (r < 0 && (r = 0), r >= this.size && (r = this.size - 1), this.keyAt(r));
    }
    find(e, t) {
      let n = 0;
      for (let r of this) {
        if (Reflect.apply(e, t, [r, n, this])) return r;
        n++;
      }
    }
    findIndex(e, t) {
      let n = 0;
      for (let r of this) {
        if (Reflect.apply(e, t, [r, n, this])) return n;
        n++;
      }
      return -1;
    }
    filter(t, n) {
      let r = [],
        i = 0;
      for (let e of this) (Reflect.apply(t, n, [e, i, this]) && r.push(e), i++);
      return new e(r);
    }
    map(t, n) {
      let r = [],
        i = 0;
      for (let e of this) (r.push([e[0], Reflect.apply(t, n, [e, i, this])]), i++);
      return new e(r);
    }
    reduce(...e) {
      let [t, n] = e,
        r = 0,
        i = n ?? this.at(0);
      for (let n of this)
        ((i = r === 0 && e.length === 1 ? n : Reflect.apply(t, this, [i, n, r, this])), r++);
      return i;
    }
    reduceRight(...e) {
      let [t, n] = e,
        r = n ?? this.at(-1);
      for (let n = this.size - 1; n >= 0; n--) {
        let i = this.at(n);
        r = n === this.size - 1 && e.length === 1 ? i : Reflect.apply(t, this, [r, i, n, this]);
      }
      return r;
    }
    toSorted(t) {
      let n = [...this.entries()].sort(t);
      return new e(n);
    }
    toReversed() {
      let t = new e();
      for (let e = this.size - 1; e >= 0; e--) {
        let n = this.keyAt(e),
          r = this.get(n);
        t.set(n, r);
      }
      return t;
    }
    toSpliced(...t) {
      let n = [...this.entries()];
      return (n.splice(...t), new e(n));
    }
    slice(t, n) {
      let r = new e(),
        i = this.size - 1;
      if (t === void 0) return r;
      (t < 0 && (t += this.size), n !== void 0 && n > 0 && (i = n - 1));
      for (let e = t; e <= i; e++) {
        let t = this.keyAt(e),
          n = this.get(t);
        r.set(t, n);
      }
      return r;
    }
    every(e, t) {
      let n = 0;
      for (let r of this) {
        if (!Reflect.apply(e, t, [r, n, this])) return !1;
        n++;
      }
      return !0;
    }
    some(e, t) {
      let n = 0;
      for (let r of this) {
        if (Reflect.apply(e, t, [r, n, this])) return !0;
        n++;
      }
      return !1;
    }
  };
function L(e, t) {
  if (`at` in Array.prototype) return Array.prototype.at.call(e, t);
  let n = R(e, t);
  return n === -1 ? void 0 : e[n];
}
N(L, `at`);
function R(e, t) {
  let n = e.length,
    r = ee(t),
    i = r >= 0 ? r : n + r;
  return i < 0 || i >= n ? -1 : i;
}
N(R, `toSafeIndex`);
function ee(e) {
  return e !== e || e === 0 ? 0 : Math.trunc(e);
}
N(ee, `toSafeInteger`);
function z(e) {
  let t = e + `CollectionProvider`,
    [n, r] = u(t),
    [i, a] = n(t, {
      collectionElement: null,
      collectionRef: { current: null },
      collectionRefObject: { current: null },
      itemMap: new I(),
      setItemMap: N(() => void 0, `setItemMap`),
    }),
    c = N(
      ({ state: e, ...t }) => (e ? (0, j.jsx)(d, { ...t, state: e }) : (0, j.jsx)(l, { ...t })),
      `CollectionProvider`,
    );
  c.displayName = t;
  let l = N((e) => {
    let t = v();
    return (0, j.jsx)(d, { ...e, state: t });
  }, `CollectionInit`);
  l.displayName = t + `Init`;
  let d = N((e) => {
    let { scope: t, children: n, state: r } = e,
      a = E.useRef(null),
      [o, c] = E.useState(null),
      l = s(a, c),
      [u, d] = r;
    return (
      E.useEffect(() => {
        if (!o) return;
        let e = H(() => {});
        return (
          e.observe(o, { childList: !0, subtree: !0 }),
          () => {
            e.disconnect();
          }
        );
      }, [o]),
      (0, j.jsx)(i, {
        scope: t,
        itemMap: u,
        setItemMap: d,
        collectionRef: l,
        collectionRefObject: a,
        collectionElement: o,
        children: n,
      })
    );
  }, `CollectionProviderImpl`);
  d.displayName = t + `Impl`;
  let f = e + `CollectionSlot`,
    p = o(f),
    m = E.forwardRef((e, t) => {
      let { scope: n, children: r } = e,
        i = a(f, n),
        o = s(t, i.collectionRef);
      return (0, j.jsx)(p, { ref: o, children: r });
    });
  m.displayName = f;
  let h = e + `CollectionItemSlot`,
    g = o(h),
    _ = E.forwardRef((e, t) => {
      let { scope: n, children: r, ...i } = e,
        o = E.useRef(null),
        [c, l] = E.useState(null),
        u = s(t, o, l),
        { setItemMap: d } = a(h, n),
        f = E.useRef(i);
      B(f.current, i) || (f.current = i);
      let p = f.current;
      return (
        E.useEffect(() => {
          let e = p;
          return (
            d((t) =>
              c
                ? t.has(c)
                  ? t.set(c, { ...e, element: c }).toSorted(V)
                  : (t.set(c, { ...e, element: c }), t.toSorted(V))
                : t,
            ),
            () => {
              d((e) => (!c || !e.has(c) ? e : (e.delete(c), new I(e))));
            }
          );
        }, [c, p, d]),
        (0, j.jsx)(g, { "data-radix-collection-item": ``, ref: u, children: r })
      );
    });
  _.displayName = h;
  function v() {
    return E.useState(new I());
  }
  N(v, `useInitCollection`);
  function y(t) {
    let { itemMap: n } = a(e + `CollectionConsumer`, t);
    return n;
  }
  return (
    N(y, `useCollection`),
    [
      { Provider: c, Slot: m, ItemSlot: _ },
      { createCollectionScope: r, useCollection: y, useInitCollection: v },
    ]
  );
}
N(z, `createCollection`);
function B(e, t) {
  if (e === t) return !0;
  if (typeof e != `object` || typeof t != `object` || e == null || t == null) return !1;
  let n = Object.keys(e),
    r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (let r of n) if (!Object.prototype.hasOwnProperty.call(t, r) || e[r] !== t[r]) return !1;
  return !0;
}
N(B, `shallowEqual`);
function te(e, t) {
  return !!(t.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_PRECEDING);
}
N(te, `isElementPreceding`);
function V(e, t) {
  return !e[1].element || !t[1].element ? 0 : te(e[1].element, t[1].element) ? -1 : 1;
}
N(V, `sortByDocumentPosition`);
function H(e) {
  return new MutationObserver((t) => {
    for (let n of t)
      if (n.type === `childList`) {
        e();
        return;
      }
  });
}
N(H, `getChildListObserver`);
var ne = Object.defineProperty,
  re = (e, t) => ne(e, `name`, { value: t, configurable: !0 }),
  ie = E.createContext(void 0);
function ae(e) {
  let t = E.useContext(ie);
  return e || t || `ltr`;
}
re(ae, `useDirection`);
var oe = [`top`, `right`, `bottom`, `left`],
  U = Math.min,
  W = Math.max,
  se = Math.round,
  ce = Math.floor,
  G = (e) => ({ x: e, y: e }),
  le = { left: `right`, right: `left`, bottom: `top`, top: `bottom` };
function ue(e, t, n) {
  return W(e, U(t, n));
}
function K(e, t) {
  return typeof e == `function` ? e(t) : e;
}
function de(e) {
  return e.split(`-`)[0];
}
function fe(e) {
  return e.split(`-`)[1];
}
function pe(e) {
  return e === `x` ? `y` : `x`;
}
function me(e) {
  return e === `y` ? `height` : `width`;
}
function q(e) {
  let t = e[0];
  return t === `t` || t === `b` ? `y` : `x`;
}
function he(e) {
  return pe(q(e));
}
function ge(e, t, n) {
  n === void 0 && (n = !1);
  let r = fe(e),
    i = he(e),
    a = me(i),
    o =
      i === `x`
        ? r === (n ? `end` : `start`)
          ? `right`
          : `left`
        : r === `start`
          ? `bottom`
          : `top`;
  return (t.reference[a] > t.floating[a] && (o = Te(o)), [o, Te(o)]);
}
function _e(e) {
  let t = Te(e);
  return [ve(e), t, ve(t)];
}
function ve(e) {
  return e.includes(`start`) ? e.replace(`start`, `end`) : e.replace(`end`, `start`);
}
var ye = [`left`, `right`],
  be = [`right`, `left`],
  xe = [`top`, `bottom`],
  Se = [`bottom`, `top`];
function Ce(e, t, n) {
  switch (e) {
    case `top`:
    case `bottom`:
      return n ? (t ? be : ye) : t ? ye : be;
    case `left`:
    case `right`:
      return t ? xe : Se;
    default:
      return [];
  }
}
function we(e, t, n, r) {
  let i = fe(e),
    a = Ce(de(e), n === `start`, r);
  return (i && ((a = a.map((e) => e + `-` + i)), t && (a = a.concat(a.map(ve)))), a);
}
function Te(e) {
  let t = de(e);
  return le[t] + e.slice(t.length);
}
function Ee(e) {
  return { top: e.top ?? 0, right: e.right ?? 0, bottom: e.bottom ?? 0, left: e.left ?? 0 };
}
function De(e) {
  return typeof e == `number` ? { top: e, right: e, bottom: e, left: e } : Ee(e);
}
function Oe(e) {
  let { x: t, y: n, width: r, height: i } = e;
  return { width: r, height: i, top: n, left: t, right: t + r, bottom: n + i, x: t, y: n };
}
function ke(e, t, n) {
  let { reference: r, floating: i } = e,
    a = q(t),
    o = he(t),
    s = me(o),
    c = de(t),
    l = a === `y`,
    u = r.x + r.width / 2 - i.width / 2,
    d = r.y + r.height / 2 - i.height / 2,
    f = r[s] / 2 - i[s] / 2,
    p;
  switch (c) {
    case `top`:
      p = { x: u, y: r.y - i.height };
      break;
    case `bottom`:
      p = { x: u, y: r.y + r.height };
      break;
    case `right`:
      p = { x: r.x + r.width, y: d };
      break;
    case `left`:
      p = { x: r.x - i.width, y: d };
      break;
    default:
      p = { x: r.x, y: r.y };
  }
  let m = fe(t);
  return (m && (p[o] += f * (m === `end` ? 1 : -1) * (n && l ? -1 : 1)), p);
}
async function Ae(e, t) {
  t === void 0 && (t = {});
  let { x: n, y: r, platform: i, rects: a, elements: o, strategy: s } = e,
    {
      boundary: c = `clippingAncestors`,
      rootBoundary: l = `viewport`,
      elementContext: u = `floating`,
      altBoundary: d = !1,
      padding: f = 0,
    } = K(t, e),
    p = De(f),
    m = o[d ? (u === `floating` ? `reference` : `floating`) : u],
    h = Oe(
      await i.getClippingRect({
        element:
          ((await (i.isElement == null ? void 0 : i.isElement(m))) ?? !0)
            ? m
            : m.contextElement ||
              (await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(o.floating))),
        boundary: c,
        rootBoundary: l,
        strategy: s,
      }),
    ),
    g =
      u === `floating`
        ? { x: n, y: r, width: a.floating.width, height: a.floating.height }
        : a.reference,
    _ = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(o.floating)),
    v = ((await (i.isElement == null ? void 0 : i.isElement(_))) &&
      (await (i.getScale == null ? void 0 : i.getScale(_)))) || { x: 1, y: 1 },
    y = Oe(
      i.convertOffsetParentRelativeRectToViewportRelativeRect
        ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
            elements: o,
            rect: g,
            offsetParent: _,
            strategy: s,
          })
        : g,
    );
  return {
    top: (h.top - y.top + p.top) / v.y,
    bottom: (y.bottom - h.bottom + p.bottom) / v.y,
    left: (h.left - y.left + p.left) / v.x,
    right: (y.right - h.right + p.right) / v.x,
  };
}
var je = 50,
  Me = async (e, t, n) => {
    let { placement: r = `bottom`, strategy: i = `absolute`, middleware: a = [], platform: o } = n,
      s = o.detectOverflow ? o : { ...o, detectOverflow: Ae },
      c = await (o.isRTL == null ? void 0 : o.isRTL(t)),
      l = await o.getElementRects({ reference: e, floating: t, strategy: i }),
      { x: u, y: d } = ke(l, r, c),
      f = r,
      p = 0,
      m = {};
    for (let n = 0; n < a.length; n++) {
      let h = a[n];
      if (!h) continue;
      let { name: g, fn: _ } = h,
        {
          x: v,
          y,
          data: b,
          reset: x,
        } = await _({
          x: u,
          y: d,
          initialPlacement: r,
          placement: f,
          strategy: i,
          middlewareData: m,
          rects: l,
          platform: s,
          elements: { reference: e, floating: t },
        });
      ((u = v ?? u),
        (d = y ?? d),
        (m[g] = { ...m[g], ...b }),
        x &&
          p < je &&
          (p++,
          typeof x == `object` &&
            (x.placement && (f = x.placement),
            x.rects &&
              (l =
                x.rects === !0
                  ? await o.getElementRects({ reference: e, floating: t, strategy: i })
                  : x.rects),
            ({ x: u, y: d } = ke(l, f, c))),
          (n = -1)));
    }
    return { x: u, y: d, placement: f, strategy: i, middlewareData: m };
  },
  Ne = (e) => ({
    name: `arrow`,
    options: e,
    async fn(t) {
      let { x: n, y: r, placement: i, rects: a, platform: o, elements: s, middlewareData: c } = t,
        { element: l, padding: u = 0 } = K(e, t) || {};
      if (l == null) return {};
      let d = De(u),
        f = { x: n, y: r },
        p = he(i),
        m = me(p),
        h = await o.getDimensions(l),
        g = p === `y`,
        _ = g ? `top` : `left`,
        v = g ? `bottom` : `right`,
        y = g ? `clientHeight` : `clientWidth`,
        b = a.reference[m] + a.reference[p] - f[p] - a.floating[m],
        x = f[p] - a.reference[p],
        S = await (o.getOffsetParent == null ? void 0 : o.getOffsetParent(l)),
        C = S ? S[y] : 0;
      (!C || !(await (o.isElement == null ? void 0 : o.isElement(S)))) &&
        (C = s.floating[y] || a.floating[m]);
      let w = b / 2 - x / 2,
        T = C / 2 - h[m] / 2 - 1,
        E = U(d[_], T),
        D = U(d[v], T),
        O = C - h[m] - D,
        k = C / 2 - h[m] / 2 + w,
        A = ue(E, k, O),
        j =
          !c.arrow &&
          fe(i) != null &&
          k !== A &&
          a.reference[m] / 2 - (k < E ? E : D) - h[m] / 2 < 0,
        M = j ? (k < E ? k - E : k - O) : 0;
      return {
        [p]: f[p] + M,
        data: { [p]: A, centerOffset: k - A - M, ...(j && { alignmentOffset: M }) },
        reset: j,
      };
    },
  }),
  Pe = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: `flip`,
        options: e,
        async fn(t) {
          var n;
          let {
              placement: r,
              middlewareData: i,
              rects: a,
              initialPlacement: o,
              platform: s,
              elements: c,
            } = t,
            {
              mainAxis: l = !0,
              crossAxis: u = !0,
              fallbackPlacements: d,
              fallbackStrategy: f = `bestFit`,
              fallbackAxisSideDirection: p = `none`,
              flipAlignment: m = !0,
              ...h
            } = K(e, t);
          if ((n = i.arrow) != null && n.alignmentOffset) return {};
          let g = de(r),
            _ = q(o),
            v = de(o) === o,
            y = await (s.isRTL == null ? void 0 : s.isRTL(c.floating)),
            b = d || (v || !m ? [Te(o)] : _e(o)),
            x = p !== `none`;
          !d && x && b.push(...we(o, m, p, y));
          let S = [o, ...b],
            C = await s.detectOverflow(t, h),
            w = [],
            T = i.flip?.overflows || [];
          if ((l && w.push(C[g]), u)) {
            let e = ge(r, a, y);
            w.push(C[e[0]], C[e[1]]);
          }
          if (((T = [...T, { placement: r, overflows: w }]), !w.every((e) => e <= 0))) {
            let e = (i.flip?.index || 0) + 1,
              t = S[e];
            if (
              t &&
              (u !== `alignment` ||
                _ === q(t) ||
                T.every((e) => q(e.placement) !== _ || e.overflows[0] > 0))
            )
              return { data: { index: e, overflows: T }, reset: { placement: t } };
            let n = T.filter((e) => e.overflows[0] <= 0).sort(
              (e, t) => e.overflows[1] - t.overflows[1],
            )[0]?.placement;
            if (!n)
              switch (f) {
                case `bestFit`: {
                  let e = T.filter((e) => {
                    if (x) {
                      let t = q(e.placement);
                      return t === _ || t === `y`;
                    }
                    return !0;
                  })
                    .map((e) => [
                      e.placement,
                      e.overflows.filter((e) => e > 0).reduce((e, t) => e + t, 0),
                    ])
                    .sort((e, t) => e[1] - t[1])[0]?.[0];
                  e && (n = e);
                  break;
                }
                case `initialPlacement`:
                  n = o;
              }
            if (r !== n) return { reset: { placement: n } };
          }
          return {};
        },
      }
    );
  };
function Fe(e, t) {
  return {
    top: e.top - t.height,
    right: e.right - t.width,
    bottom: e.bottom - t.height,
    left: e.left - t.width,
  };
}
function Ie(e) {
  return oe.some((t) => e[t] >= 0);
}
var Le = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: `hide`,
        options: e,
        async fn(t) {
          let { rects: n, platform: r } = t,
            { strategy: i = `referenceHidden`, ...a } = K(e, t);
          switch (i) {
            case `referenceHidden`: {
              let e = Fe(
                await r.detectOverflow(t, { ...a, elementContext: `reference` }),
                n.reference,
              );
              return { data: { referenceHiddenOffsets: e, referenceHidden: Ie(e) } };
            }
            case `escaped`: {
              let e = Fe(await r.detectOverflow(t, { ...a, altBoundary: !0 }), n.floating);
              return { data: { escapedOffsets: e, escaped: Ie(e) } };
            }
            default:
              return {};
          }
        },
      }
    );
  },
  Re = new Set([`left`, `top`]);
async function ze(e, t) {
  let { placement: n, platform: r, elements: i } = e,
    a = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)),
    o = de(n),
    s = fe(n),
    c = q(n) === `y`,
    l = Re.has(o) ? -1 : 1,
    u = a && c ? -1 : 1,
    d = K(t, e),
    {
      mainAxis: f,
      crossAxis: p,
      alignmentAxis: m,
    } = typeof d == `number`
      ? { mainAxis: d, crossAxis: 0, alignmentAxis: null }
      : { mainAxis: d.mainAxis || 0, crossAxis: d.crossAxis || 0, alignmentAxis: d.alignmentAxis };
  return (
    s && typeof m == `number` && (p = s === `end` ? m * -1 : m),
    c ? { x: p * u, y: f * l } : { x: f * l, y: p * u }
  );
}
var Be = function (e) {
    return (
      e === void 0 && (e = 0),
      {
        name: `offset`,
        options: e,
        async fn(t) {
          var n;
          let { x: r, y: i, placement: a, middlewareData: o } = t,
            s = await ze(t, e);
          return a === o.offset?.placement && (n = o.arrow) != null && n.alignmentOffset
            ? {}
            : { x: r + s.x, y: i + s.y, data: { ...s, placement: a } };
        },
      }
    );
  },
  Ve = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: `shift`,
        options: e,
        async fn(t) {
          let { x: n, y: r, placement: i, platform: a } = t,
            {
              mainAxis: o = !0,
              crossAxis: s = !1,
              limiter: c = {
                fn: (e) => {
                  let { x: t, y: n } = e;
                  return { x: t, y: n };
                },
              },
              ...l
            } = K(e, t),
            u = { x: n, y: r },
            d = await a.detectOverflow(t, l),
            f = q(i),
            p = pe(f),
            m = u[p],
            h = u[f],
            g = (e, t) =>
              ue(t + d[e === `y` ? `top` : `left`], t, t - d[e === `y` ? `bottom` : `right`]);
          (o && (m = g(p, m)), s && (h = g(f, h)));
          let _ = c.fn({ ...t, [p]: m, [f]: h });
          return { ..._, data: { x: _.x - n, y: _.y - r, enabled: { [p]: o, [f]: s } } };
        },
      }
    );
  },
  He = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        options: e,
        fn(t) {
          let { x: n, y: r, placement: i, rects: a, middlewareData: o } = t,
            { offset: s = 0, mainAxis: c = !0, crossAxis: l = !0 } = K(e, t),
            u = { x: n, y: r },
            d = q(i),
            f = pe(d),
            p = u[f],
            m = u[d],
            h = K(s, t),
            g =
              typeof h == `number`
                ? { mainAxis: h, crossAxis: 0 }
                : { mainAxis: h.mainAxis ?? 0, crossAxis: h.crossAxis ?? 0 };
          if (c) {
            let e = f === `y` ? `height` : `width`,
              t = a.reference[f] - a.floating[e] + g.mainAxis,
              n = a.reference[f] + a.reference[e] - g.mainAxis;
            p < t ? (p = t) : p > n && (p = n);
          }
          if (l) {
            let e = f === `y` ? `width` : `height`,
              t = Re.has(de(i)),
              n =
                a.reference[d] -
                a.floating[e] +
                ((t && o.offset?.[d]) || 0) +
                (t ? 0 : g.crossAxis),
              r =
                a.reference[d] +
                a.reference[e] +
                (t ? 0 : o.offset?.[d] || 0) -
                (t ? g.crossAxis : 0);
            m < n ? (m = n) : m > r && (m = r);
          }
          return { [f]: p, [d]: m };
        },
      }
    );
  },
  Ue = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: `size`,
        options: e,
        async fn(t) {
          let { placement: n, rects: r, platform: i, elements: a } = t,
            { apply: o = () => {}, ...s } = K(e, t),
            c = await i.detectOverflow(t, s),
            l = de(n),
            u = fe(n),
            d = q(n) === `y`,
            { width: f, height: p } = r.floating,
            m,
            h;
          l === `top` || l === `bottom`
            ? ((m = l),
              (h =
                u === ((await (i.isRTL == null ? void 0 : i.isRTL(a.floating))) ? `start` : `end`)
                  ? `left`
                  : `right`))
            : ((h = l), (m = u === `end` ? `top` : `bottom`));
          let g = p - c.top - c.bottom,
            _ = f - c.left - c.right,
            v = U(p - c[m], g),
            y = U(f - c[h], _),
            b = t.middlewareData.shift,
            x = !b,
            S = v,
            C = y;
          (b != null && b.enabled.x && (C = _),
            b != null && b.enabled.y && (S = g),
            x && !u && (d ? (C = f - 2 * W(c.left, c.right)) : (S = p - 2 * W(c.top, c.bottom))),
            await o({ ...t, availableWidth: C, availableHeight: S }));
          let w = await i.getDimensions(a.floating);
          return f !== w.width || p !== w.height ? { reset: { rects: !0 } } : {};
        },
      }
    );
  };
function We() {
  return typeof window < `u`;
}
function Ge(e) {
  return Ke(e) ? (e.nodeName || ``).toLowerCase() : `#document`;
}
function J(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function Y(e) {
  return ((Ke(e) ? e.ownerDocument : e.document) || window.document)?.documentElement;
}
function Ke(e) {
  return We() ? e instanceof Node || e instanceof J(e).Node : !1;
}
function X(e) {
  return We() ? e instanceof Element || e instanceof J(e).Element : !1;
}
function qe(e) {
  return We() ? e instanceof HTMLElement || e instanceof J(e).HTMLElement : !1;
}
function Je(e) {
  return !We() || typeof ShadowRoot > `u`
    ? !1
    : e instanceof ShadowRoot || e instanceof J(e).ShadowRoot;
}
function Ye(e) {
  let { overflow: t, overflowX: n, overflowY: r, display: i } = Z(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && i !== `inline` && i !== `contents`;
}
function Xe(e) {
  return /^(table|td|th)$/.test(Ge(e));
}
function Ze(e) {
  try {
    if (e.matches(`:popover-open`)) return !0;
  } catch {}
  try {
    return e.matches(`:modal`);
  } catch {
    return !1;
  }
}
var Qe = /transform|translate|scale|rotate|perspective|filter/,
  $e = /paint|layout|strict|content/,
  et = (e) => !!e && e !== `none`,
  tt;
function nt(e) {
  let t = X(e) ? Z(e) : e;
  return (
    et(t.transform) ||
    et(t.translate) ||
    et(t.scale) ||
    et(t.rotate) ||
    et(t.perspective) ||
    (!it() && (et(t.backdropFilter) || et(t.filter))) ||
    Qe.test(t.willChange || ``) ||
    $e.test(t.contain || ``)
  );
}
function rt(e) {
  let t = st(e);
  for (; qe(t) && !at(t);) {
    if (nt(t)) return t;
    if (Ze(t)) return null;
    t = st(t);
  }
  return null;
}
function it() {
  return (
    (tt ??= typeof CSS < `u` && CSS.supports && CSS.supports(`-webkit-backdrop-filter`, `none`)),
    tt
  );
}
function at(e) {
  return /^(html|body|#document)$/.test(Ge(e));
}
function Z(e) {
  return J(e).getComputedStyle(e);
}
function ot(e) {
  return X(e)
    ? { scrollLeft: e.scrollLeft, scrollTop: e.scrollTop }
    : { scrollLeft: e.scrollX, scrollTop: e.scrollY };
}
function st(e) {
  if (Ge(e) === `html`) return e;
  let t = e.assignedSlot || e.parentNode || (Je(e) && e.host) || Y(e);
  return Je(t) ? t.host : t;
}
function ct(e) {
  let t = st(e);
  return at(t) ? (e.ownerDocument || e).body : qe(t) && Ye(t) ? t : ct(t);
}
function lt(e, t, n) {
  (t === void 0 && (t = []), n === void 0 && (n = !0));
  let r = ct(e),
    i = r === e.ownerDocument?.body,
    a = J(r);
  if (i) {
    let e = ut(a);
    return t.concat(a, a.visualViewport || [], Ye(r) ? r : [], e && n ? lt(e) : []);
  }
  return t.concat(r, lt(r, [], n));
}
function ut(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function dt(e) {
  let t = Z(e),
    n = parseFloat(t.width) || 0,
    r = parseFloat(t.height) || 0,
    i = qe(e),
    a = i ? e.offsetWidth : n,
    o = i ? e.offsetHeight : r,
    s = se(n) !== a || se(r) !== o;
  return (s && ((n = a), (r = o)), { width: n, height: r, $: s });
}
function ft(e) {
  return X(e) ? e : e.contextElement;
}
function pt(e) {
  let t = ft(e);
  if (!qe(t)) return G(1);
  let n = t.getBoundingClientRect(),
    { width: r, height: i, $: a } = dt(t),
    o = (a ? se(n.width) : n.width) / r,
    s = (a ? se(n.height) : n.height) / i;
  return (
    (!o || !Number.isFinite(o)) && (o = 1),
    (!s || !Number.isFinite(s)) && (s = 1),
    { x: o, y: s }
  );
}
var mt = G(0);
function ht(e) {
  let t = J(e);
  return !it() || !t.visualViewport
    ? mt
    : { x: t.visualViewport.offsetLeft, y: t.visualViewport.offsetTop };
}
function gt(e, t, n) {
  return (t === void 0 && (t = !1), !!n && t && n === J(e));
}
function _t(e, t, n, r) {
  (t === void 0 && (t = !1), n === void 0 && (n = !1));
  let i = e.getBoundingClientRect(),
    a = ft(e),
    o = G(1);
  t && (r ? X(r) && (o = pt(r)) : (o = pt(e)));
  let s = gt(a, n, r) ? ht(a) : G(0),
    c = (i.left + s.x) / o.x,
    l = (i.top + s.y) / o.y,
    u = i.width / o.x,
    d = i.height / o.y;
  if (a && r) {
    let e = J(a),
      t = X(r) ? J(r) : r,
      n = e,
      i = ut(n);
    for (; i && t !== n;) {
      let e = pt(i),
        t = i.getBoundingClientRect(),
        r = Z(i),
        a = t.left + (i.clientLeft + parseFloat(r.paddingLeft)) * e.x,
        o = t.top + (i.clientTop + parseFloat(r.paddingTop)) * e.y;
      ((c *= e.x), (l *= e.y), (u *= e.x), (d *= e.y), (c += a), (l += o), (n = J(i)), (i = ut(n)));
    }
  }
  return Oe({ width: u, height: d, x: c, y: l });
}
function vt(e, t) {
  let n = ot(e).scrollLeft;
  return t ? t.left + n : _t(Y(e)).left + n;
}
function yt(e, t) {
  let n = e.getBoundingClientRect();
  return { x: n.left + t.scrollLeft - vt(e, n), y: n.top + t.scrollTop };
}
function bt(e) {
  let { elements: t, rect: n, offsetParent: r, strategy: i } = e,
    a = i === `fixed`,
    o = Y(r),
    s = t ? Ze(t.floating) : !1;
  if (r === o || (s && a)) return n;
  let c = { scrollLeft: 0, scrollTop: 0 },
    l = G(1),
    u = G(0),
    d = qe(r);
  if ((d || !a) && ((Ge(r) !== `body` || Ye(o)) && (c = ot(r)), d)) {
    let e = _t(r);
    ((l = pt(r)), (u.x = e.x + r.clientLeft), (u.y = e.y + r.clientTop));
  }
  let f = o && !d && !a ? yt(o, c) : G(0);
  return {
    width: n.width * l.x,
    height: n.height * l.y,
    x: n.x * l.x - c.scrollLeft * l.x + u.x + f.x,
    y: n.y * l.y - c.scrollTop * l.y + u.y + f.y,
  };
}
function xt(e) {
  return e.getClientRects ? Array.from(e.getClientRects()) : [];
}
function St(e) {
  let t = ot(e),
    n = e.ownerDocument.body,
    r = W(e.scrollWidth, e.clientWidth, n.scrollWidth, n.clientWidth),
    i = W(e.scrollHeight, e.clientHeight, n.scrollHeight, n.clientHeight),
    a = -t.scrollLeft + vt(e),
    o = -t.scrollTop;
  return (
    Z(n).direction === `rtl` && (a += W(e.clientWidth, n.clientWidth) - r),
    { width: r, height: i, x: a, y: o }
  );
}
var Ct = 25;
function wt(e, t, n) {
  n === void 0 && (n = `viewport`);
  let r = n === `layoutViewport`,
    i = J(e),
    a = Y(e),
    o = i.visualViewport,
    s = a.clientWidth,
    c = a.clientHeight,
    l = 0,
    u = 0;
  if (o) {
    let e = !it() || t === `fixed`;
    r
      ? e || ((l = -o.offsetLeft), (u = -o.offsetTop))
      : ((s = o.width), (c = o.height), e && ((l = o.offsetLeft), (u = o.offsetTop)));
  }
  if (vt(a) <= 0) {
    let e = a.ownerDocument,
      t = e.body,
      n = getComputedStyle(t),
      r =
        (e.compatMode === `CSS1Compat` && parseFloat(n.marginLeft) + parseFloat(n.marginRight)) ||
        0,
      i = Math.abs(a.clientWidth - t.clientWidth - r),
      o = getComputedStyle(a).scrollbarGutter === `stable both-edges` ? i / 2 : i;
    o <= Ct && (s -= o);
  }
  return { width: s, height: c, x: l, y: u };
}
function Tt(e, t) {
  let n = _t(e, !0, t === `fixed`),
    r = n.top + e.clientTop,
    i = n.left + e.clientLeft,
    a = pt(e);
  return { width: e.clientWidth * a.x, height: e.clientHeight * a.y, x: i * a.x, y: r * a.y };
}
function Et(e, t, n) {
  let r;
  if (t === `viewport` || t === `layoutViewport`) r = wt(e, n, t);
  else if (t === `document`) r = St(Y(e));
  else if (X(t)) r = Tt(t, n);
  else {
    let n = ht(e);
    r = { x: t.x - n.x, y: t.y - n.y, width: t.width, height: t.height };
  }
  return Oe(r);
}
function Dt(e, t) {
  let n = t.get(e);
  if (n) return n;
  let r = lt(e, [], !1).filter((e) => X(e) && Ge(e) !== `body`),
    i = null,
    a = Z(e).position === `fixed`,
    o = a ? st(e) : e;
  for (; X(o) && !at(o);) {
    let e = Z(o),
      t = nt(o),
      n = i ? i.position : a ? `fixed` : ``;
    (!t && (n === `fixed` || (n === `absolute` && e.position === `static`))
      ? (r = r.filter((e) => e !== o))
      : (i = e),
      (o = st(o)));
  }
  return (t.set(e, r), r);
}
function Ot(e) {
  let { element: t, boundary: n, rootBoundary: r, strategy: i } = e,
    a = [...(n === `clippingAncestors` ? (Ze(t) ? [] : Dt(t, this._c)) : [].concat(n)), r],
    o = Et(t, a[0], i),
    s = o.top,
    c = o.right,
    l = o.bottom,
    u = o.left;
  for (let e = 1; e < a.length; e++) {
    let n = Et(t, a[e], i);
    ((s = W(n.top, s)), (c = U(n.right, c)), (l = U(n.bottom, l)), (u = W(n.left, u)));
  }
  return { width: c - u, height: l - s, x: u, y: s };
}
function kt(e) {
  let { width: t, height: n } = dt(e);
  return { width: t, height: n };
}
function At(e, t, n) {
  let r = qe(t),
    i = Y(t),
    a = n === `fixed`,
    o = _t(e, !0, a, t),
    s = { scrollLeft: 0, scrollTop: 0 },
    c = G(0);
  if ((r || !a) && ((Ge(t) !== `body` || Ye(i)) && (s = ot(t)), r)) {
    let e = _t(t, !0, a, t);
    ((c.x = e.x + t.clientLeft), (c.y = e.y + t.clientTop));
  }
  !r && i && (c.x = vt(i));
  let l = i && !r && !a ? yt(i, s) : G(0);
  return {
    x: o.left + s.scrollLeft - c.x - l.x,
    y: o.top + s.scrollTop - c.y - l.y,
    width: o.width,
    height: o.height,
  };
}
function jt(e) {
  return Z(e).position === `static`;
}
function Mt(e, t) {
  if (!qe(e) || Z(e).position === `fixed`) return null;
  if (t) return t(e);
  let n = e.offsetParent;
  return (Y(e) === n && (n = n.ownerDocument.body), n);
}
function Nt(e, t) {
  let n = J(e);
  if (Ze(e)) return n;
  if (!qe(e)) {
    let t = st(e);
    for (; t && !at(t);) {
      if (X(t) && !jt(t)) return t;
      t = st(t);
    }
    return n;
  }
  let r = Mt(e, t);
  for (; r && Xe(r) && jt(r);) r = Mt(r, t);
  return r && at(r) && jt(r) && !nt(r) ? n : r || rt(e) || n;
}
var Pt = async function (e) {
  let t = this.getOffsetParent || Nt,
    n = this.getDimensions,
    r = await n(e.floating);
  return {
    reference: At(e.reference, await t(e.floating), e.strategy),
    floating: { x: 0, y: 0, width: r.width, height: r.height },
  };
};
function Ft(e) {
  return Z(e).direction === `rtl`;
}
var It = {
  convertOffsetParentRelativeRectToViewportRelativeRect: bt,
  getDocumentElement: Y,
  getClippingRect: Ot,
  getOffsetParent: Nt,
  getElementRects: Pt,
  getClientRects: xt,
  getDimensions: kt,
  getScale: pt,
  isElement: X,
  isRTL: Ft,
};
function Lt(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function Rt(e, t, n) {
  let r = null,
    i,
    a = Y(e);
  function o() {
    var e;
    (clearTimeout(i), (e = r) == null || e.disconnect(), (r = null));
  }
  function s(n, c) {
    (n === void 0 && (n = !1), c === void 0 && (c = 1), o());
    let l = e.getBoundingClientRect(),
      { left: u, top: d, width: f, height: p } = l;
    if ((n || t(), !f || !p)) return;
    let m = ce(d),
      h = ce(a.clientWidth - (u + f)),
      g = ce(a.clientHeight - (d + p)),
      _ = ce(u),
      v = {
        rootMargin: -m + `px ` + -h + `px ` + -g + `px ` + -_ + `px`,
        threshold: W(0, U(1, c)) || 1,
      },
      y = !0;
    function b(t) {
      let n = t[0].intersectionRatio;
      if (!Lt(l, e.getBoundingClientRect())) return s();
      if (n !== c) {
        if (!y) return s();
        n
          ? s(!1, n)
          : (i = setTimeout(() => {
              s(!1, 1e-7);
            }, 1e3));
      }
      y = !1;
    }
    try {
      r = new IntersectionObserver(b, { ...v, root: a.ownerDocument });
    } catch {
      r = new IntersectionObserver(b, v);
    }
    r.observe(e);
  }
  let c = J(e),
    l = () => s(n);
  return (
    c.addEventListener(`resize`, l),
    s(!0),
    () => {
      (c.removeEventListener(`resize`, l), o());
    }
  );
}
function zt(e, t, n, r) {
  r === void 0 && (r = {});
  let {
      ancestorScroll: i = !0,
      ancestorResize: a = !0,
      elementResize: o = typeof ResizeObserver == `function`,
      layoutShift: s = typeof IntersectionObserver == `function`,
      animationFrame: c = !1,
    } = r,
    l = ft(e),
    u = i || a ? [...(l ? lt(l) : []), ...(t ? lt(t) : [])] : [];
  u.forEach((e) => {
    (i && e.addEventListener(`scroll`, n), a && e.addEventListener(`resize`, n));
  });
  let d = l && s ? Rt(l, n, a) : null,
    f = -1,
    p = null;
  o &&
    ((p = new ResizeObserver((e) => {
      let [r] = e;
      (r &&
        r.target === l &&
        p &&
        t &&
        (p.unobserve(t),
        cancelAnimationFrame(f),
        (f = requestAnimationFrame(() => {
          var e;
          (e = p) == null || e.observe(t);
        }))),
        n());
    })),
    l && !c && p.observe(l),
    t && p.observe(t));
  let m,
    h = c ? _t(e) : null;
  c && g();
  function g() {
    let t = _t(e);
    (h && !Lt(h, t) && n(), (h = t), (m = requestAnimationFrame(g)));
  }
  return (
    n(),
    () => {
      var e;
      (u.forEach((e) => {
        (i && e.removeEventListener(`scroll`, n), a && e.removeEventListener(`resize`, n));
      }),
        d?.(),
        (e = p) == null || e.disconnect(),
        (p = null),
        c && cancelAnimationFrame(m));
    }
  );
}
var Bt = Be,
  Vt = Ve,
  Ht = Pe,
  Ut = Ue,
  Wt = Le,
  Gt = Ne,
  Kt = He,
  qt = (e, t, n) => {
    let r = new Map(),
      i = n ?? {},
      a = { ...It, ...i.platform, _c: r };
    return Me(e, t, { ...i, platform: a });
  },
  Jt = typeof document < `u` ? E.useLayoutEffect : function () {};
function Yt(e, t) {
  if (e === t) return !0;
  if (typeof e != typeof t) return !1;
  if (typeof e == `function` && e.toString() === t.toString()) return !0;
  let n, r, i;
  if (e && t && typeof e == `object`) {
    if (Array.isArray(e)) {
      if (((n = e.length), n !== t.length)) return !1;
      for (r = n; r-- !== 0;) if (!Yt(e[r], t[r])) return !1;
      return !0;
    }
    if (((i = Object.keys(e)), (n = i.length), n !== Object.keys(t).length)) return !1;
    for (r = n; r-- !== 0;) if (!{}.hasOwnProperty.call(t, i[r])) return !1;
    for (r = n; r-- !== 0;) {
      let n = i[r];
      if (!(n === `_owner` && e.$$typeof) && !Yt(e[n], t[n])) return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function Xt(e) {
  return typeof window > `u` ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function Zt(e, t) {
  let n = Xt(e);
  return Math.round(t * n) / n;
}
function Qt(e) {
  let t = E.useRef(e);
  return (
    Jt(() => {
      t.current = e;
    }),
    t
  );
}
function $t(e) {
  e === void 0 && (e = {});
  let {
      placement: t = `bottom`,
      strategy: n = `absolute`,
      middleware: r = [],
      platform: i,
      elements: { reference: a, floating: o } = {},
      transform: s = !0,
      whileElementsMounted: c,
      open: l,
    } = e,
    [u, d] = E.useState({
      x: 0,
      y: 0,
      strategy: n,
      placement: t,
      middlewareData: {},
      isPositioned: !1,
    }),
    [f, p] = E.useState(r);
  Yt(f, r) || p(r);
  let [m, h] = E.useState(null),
    [g, _] = E.useState(null),
    v = E.useCallback((e) => {
      e !== S.current && ((S.current = e), h(e));
    }, []),
    y = E.useCallback((e) => {
      e !== C.current && ((C.current = e), _(e));
    }, []),
    b = a || m,
    x = o || g,
    S = E.useRef(null),
    C = E.useRef(null),
    w = E.useRef(u),
    T = c != null,
    O = Qt(c),
    k = Qt(i),
    A = Qt(l),
    j = E.useCallback(() => {
      if (!S.current || !C.current) return;
      let e = { placement: t, strategy: n, middleware: f };
      (k.current && (e.platform = k.current),
        qt(S.current, C.current, e).then((e) => {
          let t = { ...e, isPositioned: A.current !== !1 };
          M.current &&
            !Yt(w.current, t) &&
            ((w.current = t),
            D.flushSync(() => {
              d(t);
            }));
        }));
    }, [f, t, n, k, A]);
  Jt(() => {
    l === !1 &&
      w.current.isPositioned &&
      ((w.current.isPositioned = !1), d((e) => ({ ...e, isPositioned: !1 })));
  }, [l]);
  let M = E.useRef(!1);
  (Jt(
    () => (
      (M.current = !0),
      () => {
        M.current = !1;
      }
    ),
    [],
  ),
    Jt(() => {
      if ((b && (S.current = b), x && (C.current = x), b && x)) {
        if (O.current) return O.current(b, x, j);
        j();
      }
    }, [b, x, j, O, T]));
  let N = E.useMemo(() => ({ reference: S, floating: C, setReference: v, setFloating: y }), [v, y]),
    P = E.useMemo(() => ({ reference: b, floating: x }), [b, x]),
    F = E.useMemo(() => {
      let e = { position: n, left: 0, top: 0 };
      if (!P.floating) return e;
      let t = Zt(P.floating, u.x),
        r = Zt(P.floating, u.y);
      return s
        ? {
            ...e,
            transform: `translate(` + t + `px, ` + r + `px)`,
            ...(Xt(P.floating) >= 1.5 && { willChange: `transform` }),
          }
        : { position: n, left: t, top: r };
    }, [n, s, P.floating, u.x, u.y]);
  return E.useMemo(
    () => ({ ...u, update: j, refs: N, elements: P, floatingStyles: F }),
    [u, j, N, P, F],
  );
}
var en = (e) => {
    function t(e) {
      return {}.hasOwnProperty.call(e, `current`);
    }
    return {
      name: `arrow`,
      options: e,
      fn(n) {
        let { element: r, padding: i } = typeof e == `function` ? e(n) : e;
        return r && t(r)
          ? r.current == null
            ? {}
            : Gt({ element: r.current, padding: i }).fn(n)
          : r
            ? Gt({ element: r, padding: i }).fn(n)
            : {};
      },
    };
  },
  tn = (e, t) => {
    let n = Bt(e);
    return { name: n.name, fn: n.fn, options: [e, t] };
  },
  nn = (e, t) => {
    let n = Vt(e);
    return { name: n.name, fn: n.fn, options: [e, t] };
  },
  rn = (e, t) => ({ fn: Kt(e).fn, options: [e, t] }),
  an = (e, t) => {
    let n = Ht(e);
    return { name: n.name, fn: n.fn, options: [e, t] };
  },
  on = (e, t) => {
    let n = Ut(e);
    return { name: n.name, fn: n.fn, options: [e, t] };
  },
  sn = (e, t) => {
    let n = Wt(e);
    return { name: n.name, fn: n.fn, options: [e, t] };
  },
  cn = (e, t) => {
    let n = en(e);
    return { name: n.name, fn: n.fn, options: [e, t] };
  },
  ln = Object.defineProperty,
  un = (e, t) => ln(e, `name`, { value: t, configurable: !0 }),
  dn = `Popper`,
  [fn, pn] = u(dn),
  [mn, hn] = fn(dn),
  gn = un((e) => {
    let { __scopePopper: t, children: n } = e,
      [r, i] = E.useState(null),
      [a, o] = E.useState(void 0);
    return (0, j.jsx)(mn, {
      scope: t,
      anchor: r,
      onAnchorChange: i,
      placementState: a,
      setPlacementState: o,
      children: n,
    });
  }, `Popper`),
  _n = `PopperAnchor`,
  vn = E.forwardRef(
    un(function (e, t) {
      let { __scopePopper: n, virtualRef: r, ...i } = e,
        a = hn(_n, n),
        o = E.useRef(null),
        c = a.onAnchorChange,
        l = E.useCallback(
          (e) => {
            ((o.current = e), e && c(e));
          },
          [c],
        ),
        u = s(t, l),
        d = E.useRef(null);
      E.useEffect(() => {
        if (!r) return;
        let e = d.current;
        ((d.current = r.current), e !== d.current && c(d.current));
      });
      let f = a.placementState && Tn(a.placementState),
        p = f?.[0],
        m = f?.[1];
      return r
        ? null
        : (0, j.jsx)(x.div, {
            "data-radix-popper-side": p,
            "data-radix-popper-align": m,
            ...i,
            ref: u,
          });
    }, `PopperAnchor`),
  ),
  yn = `PopperContent`,
  [bn, xn] = fn(yn),
  Sn = E.forwardRef(
    un(function (e, t) {
      let {
          __scopePopper: n,
          side: r = `bottom`,
          sideOffset: i = 0,
          align: a = `center`,
          alignOffset: o = 0,
          arrowPadding: c = 0,
          avoidCollisions: u = !0,
          collisionBoundary: d = [],
          collisionPadding: f = 0,
          sticky: p = `partial`,
          hideWhenDetached: h = !1,
          updatePositionStrategy: g = `optimized`,
          onPlaced: _,
          ...v
        } = e,
        y = hn(yn, n),
        [b, C] = E.useState(null),
        w = s(t, C),
        [T, D] = E.useState(null),
        O = S(T),
        k = O?.width ?? 0,
        A = O?.height ?? 0,
        M = r + (a === `center` ? `` : `-` + a),
        N = typeof f == `number` ? f : { top: 0, right: 0, bottom: 0, left: 0, ...f },
        P = Array.isArray(d) ? d : [d],
        F = P.length > 0,
        I = { padding: N, boundary: P.filter(Cn), altBoundary: F },
        {
          refs: L,
          floatingStyles: R,
          placement: ee,
          isPositioned: z,
          middlewareData: B,
        } = $t({
          strategy: `fixed`,
          placement: M,
          whileElementsMounted: un(
            (...e) => zt(...e, { animationFrame: g === `always` }),
            `whileElementsMounted`,
          ),
          elements: { reference: y.anchor },
          middleware: [
            tn({ mainAxis: i + A, alignmentAxis: o }),
            u &&
              nn({ mainAxis: !0, crossAxis: !1, limiter: p === `partial` ? rn() : void 0, ...I }),
            u && an({ ...I }),
            on({
              ...I,
              apply: un(({ elements: e, rects: t, availableWidth: n, availableHeight: r }) => {
                let { width: i, height: a } = t.reference,
                  o = e.floating.style;
                (o.setProperty(`--radix-popper-available-width`, `${n}px`),
                  o.setProperty(`--radix-popper-available-height`, `${r}px`),
                  o.setProperty(`--radix-popper-anchor-width`, `${i}px`),
                  o.setProperty(`--radix-popper-anchor-height`, `${a}px`));
              }, `apply`),
            }),
            T && cn({ element: T, padding: c }),
            wn({ arrowWidth: k, arrowHeight: A }),
            h && sn({ strategy: `referenceHidden`, ...I, boundary: F ? I.boundary : void 0 }),
          ],
        }),
        te = y.setPlacementState;
      l(
        () => (
          te(ee),
          () => {
            te(void 0);
          }
        ),
        [ee, te],
      );
      let [V, H] = Tn(ee),
        ne = m(_);
      l(() => {
        z && ne?.();
      }, [z, ne]);
      let re = B.arrow?.x,
        ie = B.arrow?.y,
        ae = B.arrow?.centerOffset !== 0,
        [oe, U] = E.useState();
      return (
        l(() => {
          b && U(window.getComputedStyle(b).zIndex);
        }, [b]),
        (0, j.jsx)(`div`, {
          ref: L.setFloating,
          "data-radix-popper-content-wrapper": ``,
          style: {
            ...R,
            transform: z ? R.transform : `translate(0, -200%)`,
            minWidth: `max-content`,
            zIndex: oe,
            "--radix-popper-transform-origin": [B.transformOrigin?.x, B.transformOrigin?.y].join(
              ` `,
            ),
            ...(B.hide?.referenceHidden && { visibility: `hidden`, pointerEvents: `none` }),
          },
          dir: e.dir,
          children: (0, j.jsx)(bn, {
            scope: n,
            placedSide: V,
            placedAlign: H,
            onArrowChange: D,
            arrowX: re,
            arrowY: ie,
            shouldHideArrow: ae,
            children: (0, j.jsx)(x.div, {
              "data-side": V,
              "data-align": H,
              ...v,
              ref: w,
              style: { ...v.style, animation: z ? v.style?.animation : `none` },
            }),
          }),
        })
      );
    }, `PopperContent`),
  );
function Cn(e) {
  return e !== null;
}
un(Cn, `isNotNull`);
var wn = un(
  (e) => ({
    name: `transformOrigin`,
    options: e,
    fn(t) {
      let { placement: n, rects: r, middlewareData: i } = t,
        a = i.arrow?.centerOffset !== 0,
        o = a ? 0 : e.arrowWidth,
        s = a ? 0 : e.arrowHeight,
        [c, l] = Tn(n),
        u = { start: `0%`, center: `50%`, end: `100%` }[l],
        d = (i.arrow?.x ?? 0) + o / 2,
        f = (i.arrow?.y ?? 0) + s / 2,
        p = ``,
        m = ``;
      return (
        c === `bottom`
          ? ((p = a ? u : `${d}px`), (m = `${-s}px`))
          : c === `top`
            ? ((p = a ? u : `${d}px`), (m = `${r.floating.height + s}px`))
            : c === `right`
              ? ((p = `${-s}px`), (m = a ? u : `${f}px`))
              : c === `left` && ((p = `${r.floating.width + s}px`), (m = a ? u : `${f}px`)),
        { data: { x: p, y: m } }
      );
    },
  }),
  `transformOrigin`,
);
function Tn(e) {
  let [t, n = `center`] = e.split(`-`);
  return [t, n];
}
un(Tn, `getSideAndAlignFromPlacement`);
var En = gn,
  Dn = vn,
  On = Sn,
  kn = Object.defineProperty,
  An = (e, t) => kn(e, `name`, { value: t, configurable: !0 });
function jn(e) {
  let t = E.useRef({ value: e, previous: e });
  return E.useMemo(
    () => (
      t.current.value !== e && ((t.current.previous = t.current.value), (t.current.value = e)),
      t.current.previous
    ),
    [e],
  );
}
An(jn, `usePrevious`);
var Mn = Object.freeze({
    position: `absolute`,
    border: 0,
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: `hidden`,
    clip: `rect(0, 0, 0, 0)`,
    whiteSpace: `nowrap`,
    wordWrap: `normal`,
  }),
  Nn = Object.defineProperty,
  Q = (e, t) => Nn(e, `name`, { value: t, configurable: !0 }),
  Pn = [` `, `Enter`, `ArrowUp`, `ArrowDown`],
  Fn = [` `, `Enter`],
  In = `Select`,
  [Ln, Rn, zn] = P(In),
  [Bn, Vn] = u(In, [zn, pn]),
  Hn = pn(),
  [Un, Wn] = Bn(In),
  [Gn, Kn] = Bn(In);
function qn(e) {
  let {
      __scopeSelect: t,
      children: n,
      open: r,
      defaultOpen: i,
      onOpenChange: a,
      value: o,
      defaultValue: s,
      onValueChange: c,
      dir: l,
      name: u,
      autoComplete: f,
      disabled: p,
      required: m,
      form: h,
      internal_do_not_use_render: g,
    } = e,
    _ = Hn(t),
    [v, y] = E.useState(null),
    [x, S] = E.useState(null),
    [C, w] = E.useState(!1),
    T = ae(l),
    [D, O] = d({ prop: r, defaultProp: i ?? !1, onChange: a, caller: In }),
    [k, A] = d({ prop: o, defaultProp: s, onChange: c, caller: In }),
    M = E.useRef(null),
    N = E.useRef(k);
  E.useEffect(() => {
    let e = h ? v?.ownerDocument.getElementById(h) : v?.form;
    if (e instanceof HTMLFormElement) {
      let t = Q(() => A(N.current), `reset`);
      return (e.addEventListener(`reset`, t), () => e.removeEventListener(`reset`, t));
    }
  }, [h, v, A]);
  let P = !v || !!h || !!v.closest(`form`),
    [F, I] = E.useState(new Set()),
    L = b(),
    R = Array.from(F)
      .map((e) => e.props.value)
      .join(`;`),
    ee = E.useCallback((e) => {
      I((t) => new Set(t).add(e));
    }, []),
    z = E.useCallback((e) => {
      I((t) => {
        let n = new Set(t);
        return (n.delete(e), n);
      });
    }, []),
    B = {
      required: m,
      trigger: v,
      onTriggerChange: y,
      valueNode: x,
      onValueNodeChange: S,
      valueNodeHasChildren: C,
      onValueNodeHasChildrenChange: w,
      contentId: L,
      value: k,
      onValueChange: A,
      open: D,
      onOpenChange: O,
      dir: T,
      triggerPointerDownPosRef: M,
      disabled: p,
      name: u,
      autoComplete: f,
      form: h,
      nativeOptions: F,
      nativeSelectKey: R,
      isFormControl: P,
    };
  return (0, j.jsx)(En, {
    ..._,
    children: (0, j.jsx)(Un, {
      scope: t,
      ...B,
      children: (0, j.jsx)(Ln.Provider, {
        scope: t,
        children: (0, j.jsx)(Gn, {
          scope: t,
          onNativeOptionAdd: ee,
          onNativeOptionRemove: z,
          children: Ir(g) ? g(B) : n,
        }),
      }),
    }),
  });
}
Q(qn, `SelectProvider`);
var Jn = Q((e) => {
    let { __scopeSelect: t, children: n, ...r } = e;
    return (0, j.jsx)(qn, {
      __scopeSelect: t,
      ...r,
      internal_do_not_use_render: ({ isFormControl: e }) =>
        (0, j.jsxs)(j.Fragment, { children: [n, e ? (0, j.jsx)(Fr, { __scopeSelect: t }) : null] }),
    });
  }, `Select`),
  Yn = `SelectTrigger`,
  Xn = E.forwardRef(
    Q(function (e, t) {
      let { __scopeSelect: n, disabled: r = !1, ...i } = e,
        a = Hn(n),
        o = Wn(Yn, n),
        l = o.disabled || r,
        u = s(t, o.onTriggerChange),
        d = Rn(n),
        f = E.useRef(`touch`),
        [p, m, h] = Rr((e) => {
          let t = d().filter((e) => !e.disabled),
            n = zr(
              t,
              e,
              t.find((e) => e.value === o.value),
            );
          n !== void 0 && o.onValueChange(n.value);
        }),
        g = Q((e) => {
          (l || (o.onOpenChange(!0), h()),
            e &&
              (o.triggerPointerDownPosRef.current = {
                x: Math.round(e.pageX),
                y: Math.round(e.pageY),
              }));
        }, `handleOpen`);
      return (0, j.jsx)(Dn, {
        asChild: !0,
        ...a,
        children: (0, j.jsx)(x.button, {
          type: `button`,
          role: `combobox`,
          "aria-controls": o.open ? o.contentId : void 0,
          "aria-expanded": o.open,
          "aria-required": o.required,
          "aria-autocomplete": `none`,
          dir: o.dir,
          "data-state": o.open ? `open` : `closed`,
          disabled: l,
          "data-disabled": l ? `` : void 0,
          "data-placeholder": Lr(o.value) ? `` : void 0,
          ...i,
          ref: u,
          onClick: c(i.onClick, (e) => {
            (e.currentTarget.focus(), f.current !== `mouse` && g(e));
          }),
          onPointerDown: c(i.onPointerDown, (e) => {
            f.current = e.pointerType;
            let t = e.target;
            (t.hasPointerCapture(e.pointerId) && t.releasePointerCapture(e.pointerId),
              e.button === 0 &&
                e.ctrlKey === !1 &&
                e.pointerType === `mouse` &&
                (g(e), e.preventDefault()));
          }),
          onKeyDown: c(i.onKeyDown, (e) => {
            let t = p.current !== ``;
            (!(e.ctrlKey || e.altKey || e.metaKey) && e.key.length === 1 && m(e.key),
              !(t && e.key === ` `) && Pn.includes(e.key) && (g(), e.preventDefault()));
          }),
        }),
      });
    }, `SelectTrigger`),
  ),
  Zn = `SelectValue`,
  Qn = E.forwardRef(
    Q(function (e, t) {
      let { __scopeSelect: n, className: r, style: i, children: a, placeholder: o = ``, ...c } = e,
        u = Wn(Zn, n),
        { onValueNodeHasChildrenChange: d } = u,
        f = a !== void 0,
        p = s(t, u.onValueNodeChange);
      l(() => {
        d(f);
      }, [d, f]);
      let m = Lr(u.value);
      return (0, j.jsx)(x.span, {
        ...c,
        asChild: !m && c.asChild,
        ref: p,
        style: { pointerEvents: `none` },
        children: (0, j.jsx)(E.Fragment, { children: m ? o : a }, m ? `placeholder` : `value`),
      });
    }, `SelectValue`),
  ),
  $n = E.forwardRef(
    Q(function (e, t) {
      let { __scopeSelect: n, children: r, ...i } = e;
      return (0, j.jsx)(x.span, { "aria-hidden": !0, ...i, ref: t, children: r || `▼` });
    }, `SelectIcon`),
  ),
  [er, tr] = Bn(`SelectPortal`, { forceMount: void 0 }),
  nr = Q((e) => {
    let { __scopeSelect: t, forceMount: n, ...r } = e;
    return (0, j.jsx)(er, {
      scope: e.__scopeSelect,
      forceMount: n,
      children: (0, j.jsx)(f, { asChild: !0, ...r }),
    });
  }, `SelectPortal`),
  rr = `SelectContent`,
  ir = E.forwardRef(
    Q(function (e, t) {
      let n = tr(rr, e.__scopeSelect),
        { forceMount: r = n.forceMount, ...i } = e,
        a = Wn(rr, e.__scopeSelect),
        [o, s] = E.useState();
      return (
        l(() => {
          s(new DocumentFragment());
        }, []),
        (0, j.jsx)(p, {
          present: r || a.open,
          children: ({ present: e }) =>
            e ? (0, j.jsx)(lr, { ...i, ref: t }) : (0, j.jsx)(ar, { ...i, fragment: o }),
        })
      );
    }, `SelectContent`),
  ),
  ar = E.forwardRef(
    Q(function (e, t) {
      let { __scopeSelect: n, children: r, fragment: i } = e;
      return i
        ? D.createPortal(
            (0, j.jsx)(or, {
              scope: n,
              children: (0, j.jsx)(Ln.Slot, {
                scope: n,
                children: (0, j.jsx)(`div`, { ref: t, children: r }),
              }),
            }),
            i,
          )
        : null;
    }, `SelectContentFragment`),
  ),
  $ = 10,
  [or, sr] = Bn(rr),
  cr = o(`SelectContent.RemoveScroll`),
  lr = E.forwardRef(
    Q(function (e, t) {
      let { __scopeSelect: n } = e,
        {
          position: r = `item-aligned`,
          onCloseAutoFocus: i,
          onEscapeKeyDown: a,
          onPointerDownOutside: o,
          side: l,
          sideOffset: u,
          align: d,
          alignOffset: f,
          arrowPadding: p,
          collisionBoundary: m,
          collisionPadding: b,
          sticky: x,
          hideWhenDetached: S,
          avoidCollisions: C,
          ...w
        } = e,
        T = Wn(rr, n),
        [D, O] = E.useState(null),
        [k, A] = E.useState(null),
        M = s(t, O),
        [N, P] = E.useState(null),
        [F, I] = E.useState(null),
        L = Rn(n),
        [R, ee] = E.useState(!1),
        z = E.useRef(!1);
      (E.useEffect(() => {
        if (D) return y(D);
      }, [D]),
        _());
      let B = E.useCallback(
          (e) => {
            let [t, ...n] = L().map((e) => e.ref.current),
              [r] = n.slice(-1),
              i = document.activeElement;
            for (let n of e)
              if (
                n === i ||
                (n?.scrollIntoView({ block: `nearest` }),
                n === t && k && (k.scrollTop = 0),
                n === r && k && (k.scrollTop = k.scrollHeight),
                n?.focus(),
                document.activeElement !== i)
              )
                return;
          },
          [L, k],
        ),
        te = E.useCallback(() => B([N, D]), [B, N, D]);
      E.useEffect(() => {
        R && te();
      }, [R, te]);
      let { onOpenChange: V, triggerPointerDownPosRef: H } = T;
      (E.useEffect(() => {
        if (D) {
          let e = { x: 0, y: 0 },
            t = Q((t) => {
              e = {
                x: Math.abs(Math.round(t.pageX) - (H.current?.x ?? 0)),
                y: Math.abs(Math.round(t.pageY) - (H.current?.y ?? 0)),
              };
            }, `handlePointerMove`),
            n = Q((n) => {
              (e.x <= 10 && e.y <= 10 ? n.preventDefault() : n.composedPath().includes(D) || V(!1),
                document.removeEventListener(`pointermove`, t),
                (H.current = null));
            }, `handlePointerUp`);
          return (
            H.current !== null &&
              (document.addEventListener(`pointermove`, t),
              document.addEventListener(`pointerup`, n, { capture: !0, once: !0 })),
            () => {
              (document.removeEventListener(`pointermove`, t),
                document.removeEventListener(`pointerup`, n, { capture: !0 }));
            }
          );
        }
      }, [D, V, H]),
        E.useEffect(() => {
          let e = Q(() => V(!1), `close`);
          return (
            window.addEventListener(`blur`, e),
            window.addEventListener(`resize`, e),
            () => {
              (window.removeEventListener(`blur`, e), window.removeEventListener(`resize`, e));
            }
          );
        }, [V]));
      let [ne, re] = Rr((e) => {
          let t = L().filter((e) => !e.disabled),
            n = zr(
              t,
              e,
              t.find((e) => e.ref.current === document.activeElement),
            );
          n && setTimeout(() => n.ref.current?.focus());
        }),
        ie = E.useCallback(
          (e, t, n) => {
            let r = !z.current && !n;
            ((T.value !== void 0 && T.value === t) || r) && (P(e), r && (z.current = !0));
          },
          [T.value],
        ),
        ae = E.useCallback(() => D?.focus(), [D]),
        oe = E.useCallback(
          (e, t, n) => {
            let r = !z.current && !n;
            ((T.value !== void 0 && T.value === t) || r) && I(e);
          },
          [T.value],
        ),
        U = r === `popper` ? dr : ur,
        W =
          U === dr
            ? {
                side: l,
                sideOffset: u,
                align: d,
                alignOffset: f,
                arrowPadding: p,
                collisionBoundary: m,
                collisionPadding: b,
                sticky: x,
                hideWhenDetached: S,
                avoidCollisions: C,
              }
            : {};
      return (0, j.jsx)(or, {
        scope: n,
        content: D,
        viewport: k,
        onViewportChange: A,
        itemRefCallback: ie,
        selectedItem: N,
        onItemLeave: ae,
        itemTextRefCallback: oe,
        focusSelectedItem: te,
        selectedItemText: F,
        position: r,
        isPositioned: R,
        searchRef: ne,
        children: (0, j.jsx)(h, {
          as: cr,
          allowPinchZoom: !0,
          children: (0, j.jsx)(g, {
            asChild: !0,
            trapped: T.open,
            onMountAutoFocus: (e) => {
              e.preventDefault();
            },
            onUnmountAutoFocus: c(i, (e) => {
              (T.trigger?.focus({ preventScroll: !0 }), e.preventDefault());
            }),
            children: (0, j.jsx)(v, {
              asChild: !0,
              disableOutsidePointerEvents: !0,
              onEscapeKeyDown: a,
              onPointerDownOutside: o,
              onFocusOutside: (e) => e.preventDefault(),
              onDismiss: () => T.onOpenChange(!1),
              children: (0, j.jsx)(U, {
                role: `listbox`,
                id: T.contentId,
                "data-state": T.open ? `open` : `closed`,
                dir: T.dir,
                onContextMenu: (e) => e.preventDefault(),
                ...w,
                ...W,
                onPlaced: () => ee(!0),
                ref: M,
                style: { display: `flex`, flexDirection: `column`, outline: `none`, ...w.style },
                onKeyDown: c(w.onKeyDown, (e) => {
                  let t = e.ctrlKey || e.altKey || e.metaKey;
                  if (
                    (e.key === `Tab` && e.preventDefault(),
                    !t && e.key.length === 1 && re(e.key),
                    [`ArrowUp`, `ArrowDown`, `Home`, `End`].includes(e.key))
                  ) {
                    let t = L()
                      .filter((e) => !e.disabled)
                      .map((e) => e.ref.current);
                    if (
                      ([`ArrowUp`, `End`].includes(e.key) && (t = t.slice().reverse()),
                      [`ArrowUp`, `ArrowDown`].includes(e.key))
                    ) {
                      let n = e.target,
                        r = t.indexOf(n);
                      t = t.slice(r + 1);
                    }
                    (setTimeout(() => B(t)), e.preventDefault());
                  }
                }),
              }),
            }),
          }),
        }),
      });
    }, `SelectContentImpl`),
  ),
  ur = E.forwardRef(
    Q(function (e, t) {
      let { __scopeSelect: n, onPlaced: r, ...i } = e,
        a = Wn(rr, n),
        o = sr(rr, n),
        [c, u] = E.useState(null),
        [d, f] = E.useState(null),
        p = s(t, f),
        m = Rn(n),
        h = E.useRef(!1),
        g = E.useRef(!0),
        { viewport: _, selectedItem: v, selectedItemText: y, focusSelectedItem: b } = o,
        S = E.useCallback(() => {
          if (a.trigger && a.valueNode && c && d && _ && v && y) {
            let e = a.trigger.getBoundingClientRect(),
              t = d.getBoundingClientRect(),
              n = a.valueNode.getBoundingClientRect(),
              i = y.getBoundingClientRect();
            if (a.dir !== `rtl`) {
              let r = i.left - t.left,
                a = n.left - r,
                o = e.left - a,
                s = e.width + o,
                l = Math.max(s, t.width),
                u = window.innerWidth - $,
                d = A(a, [$, Math.max($, u - l)]);
              ((c.style.minWidth = s + `px`), (c.style.left = d + `px`));
            } else {
              let r = t.right - i.right,
                a = window.innerWidth - n.right - r,
                o = window.innerWidth - e.right - a,
                s = e.width + o,
                l = Math.max(s, t.width),
                u = window.innerWidth - $,
                d = A(a, [$, Math.max($, u - l)]);
              ((c.style.minWidth = s + `px`), (c.style.right = d + `px`));
            }
            let o = m(),
              s = window.innerHeight - $ * 2,
              l = _.scrollHeight,
              u = window.getComputedStyle(d),
              f = parseInt(u.borderTopWidth, 10),
              p = parseInt(u.paddingTop, 10),
              g = parseInt(u.borderBottomWidth, 10),
              b = parseInt(u.paddingBottom, 10),
              x = f + p + l + b + g,
              S = Math.min(v.offsetHeight * 5, x),
              C = window.getComputedStyle(_),
              w = parseInt(C.paddingTop, 10),
              T = parseInt(C.paddingBottom, 10),
              E = e.top + e.height / 2 - $,
              D = s - E,
              O = v.offsetHeight / 2,
              k = v.offsetTop + O,
              j = f + p + k,
              M = x - j;
            if (j <= E) {
              let e = o.length > 0 && v === o[o.length - 1].ref.current;
              c.style.bottom = `0px`;
              let t = d.clientHeight - _.offsetTop - _.offsetHeight,
                n = j + Math.max(D, O + (e ? T : 0) + t + g);
              c.style.height = n + `px`;
            } else {
              let e = o.length > 0 && v === o[0].ref.current;
              c.style.top = `0px`;
              let t = Math.max(E, f + _.offsetTop + (e ? w : 0) + O) + M;
              ((c.style.height = t + `px`), (_.scrollTop = j - E + _.offsetTop));
            }
            ((c.style.margin = `${$}px 0`),
              (c.style.minHeight = S + `px`),
              (c.style.maxHeight = s + `px`),
              r?.(),
              requestAnimationFrame(() => (h.current = !0)));
          }
        }, [m, a.trigger, a.valueNode, c, d, _, v, y, a.dir, r]);
      l(() => S(), [S]);
      let [C, w] = E.useState();
      l(() => {
        d && w(window.getComputedStyle(d).zIndex);
      }, [d]);
      let T = E.useCallback(
        (e) => {
          e && g.current === !0 && (S(), b?.(), (g.current = !1));
        },
        [S, b],
      );
      return (0, j.jsx)(fr, {
        scope: n,
        contentWrapper: c,
        shouldExpandOnScrollRef: h,
        onScrollButtonChange: T,
        children: (0, j.jsx)(`div`, {
          ref: u,
          style: { display: `flex`, flexDirection: `column`, position: `fixed`, zIndex: C },
          children: (0, j.jsx)(x.div, {
            ...i,
            ref: p,
            style: { boxSizing: `border-box`, maxHeight: `100%`, ...i.style },
          }),
        }),
      });
    }, `SelectItemAlignedPosition`),
  ),
  dr = E.forwardRef(
    Q(function (e, t) {
      let { __scopeSelect: n, align: r = `start`, collisionPadding: i = $, ...a } = e,
        o = Hn(n);
      return (0, j.jsx)(On, {
        ...o,
        ...a,
        ref: t,
        align: r,
        collisionPadding: i,
        style: {
          boxSizing: `border-box`,
          ...a.style,
          "--radix-select-content-transform-origin": `var(--radix-popper-transform-origin)`,
          "--radix-select-content-available-width": `var(--radix-popper-available-width)`,
          "--radix-select-content-available-height": `var(--radix-popper-available-height)`,
          "--radix-select-trigger-width": `var(--radix-popper-anchor-width)`,
          "--radix-select-trigger-height": `var(--radix-popper-anchor-height)`,
        },
      });
    }, `SelectPopperPosition`),
  ),
  [fr, pr] = Bn(rr, {}),
  mr = `SelectViewport`,
  hr = E.forwardRef(
    Q(function (e, t) {
      let { __scopeSelect: n, nonce: r, ...i } = e,
        a = sr(mr, n),
        o = pr(mr, n),
        l = s(t, a.onViewportChange),
        u = E.useRef(0);
      return (0, j.jsxs)(j.Fragment, {
        children: [
          (0, j.jsx)(`style`, {
            dangerouslySetInnerHTML: {
              __html: `[data-radix-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-select-viewport]::-webkit-scrollbar{display:none}`,
            },
            nonce: r,
          }),
          (0, j.jsx)(Ln.Slot, {
            scope: n,
            children: (0, j.jsx)(x.div, {
              "data-radix-select-viewport": ``,
              role: `presentation`,
              ...i,
              ref: l,
              style: { position: `relative`, flex: 1, overflow: `hidden auto`, ...i.style },
              onScroll: c(i.onScroll, (e) => {
                let t = e.currentTarget,
                  { contentWrapper: n, shouldExpandOnScrollRef: r } = o;
                if (r?.current && n) {
                  let e = Math.abs(u.current - t.scrollTop);
                  if (e > 0) {
                    let r = window.innerHeight - $ * 2,
                      i = parseFloat(n.style.minHeight),
                      a = parseFloat(n.style.height),
                      o = Math.max(i, a);
                    if (o < r) {
                      let i = o + e,
                        a = Math.min(r, i),
                        s = i - a;
                      ((n.style.height = a + `px`),
                        n.style.bottom === `0px` &&
                          ((t.scrollTop = s > 0 ? s : 0), (n.style.justifyContent = `flex-end`)));
                    }
                  }
                }
                u.current = t.scrollTop;
              }),
            }),
          }),
        ],
      });
    }, `SelectViewport`),
  ),
  [gr, _r] = Bn(`SelectGroup`),
  vr = `SelectLabel`,
  yr = E.forwardRef(
    Q(function (e, t) {
      let { __scopeSelect: n, ...r } = e,
        i = _r(vr, n);
      return (0, j.jsx)(x.div, { id: i.id, ...r, ref: t });
    }, `SelectLabel`),
  ),
  br = `SelectItem`,
  [xr, Sr] = Bn(br),
  Cr = E.forwardRef(
    Q(function (e, t) {
      let { __scopeSelect: n, value: r, disabled: i = !1, textValue: a, ...o } = e,
        l = Wn(br, n),
        u = sr(br, n),
        d = l.value === r,
        [f, p] = E.useState(a ?? ``),
        [h, g] = E.useState(!1),
        _ = m((e) => u.itemRefCallback?.(e, r, i)),
        v = s(t, _),
        y = b(),
        S = E.useRef(`touch`),
        C = Q(() => {
          i || (l.onValueChange(r), l.onOpenChange(!1));
        }, `handleSelect`);
      return (0, j.jsx)(xr, {
        scope: n,
        value: r,
        disabled: i,
        textId: y,
        isSelected: d,
        onItemTextChange: E.useCallback((e) => {
          p((t) => t || (e?.textContent ?? ``).trim());
        }, []),
        children: (0, j.jsx)(Ln.ItemSlot, {
          scope: n,
          value: r,
          disabled: i,
          textValue: f,
          children: (0, j.jsx)(x.div, {
            role: `option`,
            "aria-labelledby": y,
            "data-highlighted": h ? `` : void 0,
            "aria-selected": d && h,
            "data-state": d ? `checked` : `unchecked`,
            "aria-disabled": i || void 0,
            "data-disabled": i ? `` : void 0,
            tabIndex: i ? void 0 : -1,
            ...o,
            ref: v,
            onFocus: c(o.onFocus, () => g(!0)),
            onBlur: c(o.onBlur, () => g(!1)),
            onClick: c(o.onClick, () => {
              S.current !== `mouse` && C();
            }),
            onPointerUp: c(o.onPointerUp, () => {
              S.current === `mouse` && C();
            }),
            onPointerDown: c(o.onPointerDown, (e) => {
              S.current = e.pointerType;
            }),
            onPointerMove: c(o.onPointerMove, (e) => {
              ((S.current = e.pointerType),
                i
                  ? u.onItemLeave?.()
                  : S.current === `mouse` && e.currentTarget.focus({ preventScroll: !0 }));
            }),
            onPointerLeave: c(o.onPointerLeave, (e) => {
              e.currentTarget === document.activeElement && u.onItemLeave?.();
            }),
            onKeyDown: c(o.onKeyDown, (e) => {
              i ||
                e.target !== e.currentTarget ||
                ((u.searchRef?.current === `` || e.key !== ` `) &&
                  (Fn.includes(e.key) && C(), e.key === ` ` && e.preventDefault()));
            }),
          }),
        }),
      });
    }, `SelectItem`),
  ),
  wr = `SelectItemText`,
  Tr = E.forwardRef(
    Q(function (e, t) {
      let { __scopeSelect: n, className: r, style: i, ...a } = e,
        o = Wn(wr, n),
        c = sr(wr, n),
        u = Sr(wr, n),
        d = Kn(wr, n),
        [f, p] = E.useState(null),
        h = m((e) => c.itemTextRefCallback?.(e, u.value, u.disabled)),
        g = s(t, p, u.onItemTextChange, h),
        _ = f?.textContent,
        v = E.useMemo(
          () =>
            (0, j.jsx)(`option`, { value: u.value, disabled: u.disabled, children: _ }, u.value),
          [u.disabled, u.value, _],
        ),
        { onNativeOptionAdd: y, onNativeOptionRemove: b } = d;
      return (
        l(() => (y(v), () => b(v)), [y, b, v]),
        (0, j.jsxs)(j.Fragment, {
          children: [
            (0, j.jsx)(x.span, { id: u.textId, ...a, ref: g }),
            u.isSelected && o.valueNode && !o.valueNodeHasChildren && !Lr(o.value)
              ? D.createPortal(a.children, o.valueNode)
              : null,
          ],
        })
      );
    }, `SelectItemText`),
  ),
  Er = `SelectItemIndicator`,
  Dr = E.forwardRef(
    Q(function (e, t) {
      let { __scopeSelect: n, ...r } = e;
      return Sr(Er, n).isSelected ? (0, j.jsx)(x.span, { "aria-hidden": !0, ...r, ref: t }) : null;
    }, `SelectItemIndicator`),
  ),
  Or = `SelectScrollUpButton`,
  kr = E.forwardRef(
    Q(function (e, t) {
      let n = sr(Or, e.__scopeSelect),
        r = pr(Or, e.__scopeSelect),
        [i, a] = E.useState(!1),
        o = s(t, r.onScrollButtonChange);
      return (
        l(() => {
          if (n.viewport && n.isPositioned) {
            let e = function () {
              let e = t.scrollTop > 0;
              a(e);
            };
            Q(e, `handleScroll`);
            let t = n.viewport;
            return (e(), t.addEventListener(`scroll`, e), () => t.removeEventListener(`scroll`, e));
          }
        }, [n.viewport, n.isPositioned]),
        i
          ? (0, j.jsx)(Mr, {
              ...e,
              ref: o,
              onAutoScroll: () => {
                let { viewport: e, selectedItem: t } = n;
                e && t && (e.scrollTop -= t.offsetHeight);
              },
            })
          : null
      );
    }, `SelectScrollUpButton`),
  ),
  Ar = `SelectScrollDownButton`,
  jr = E.forwardRef(
    Q(function (e, t) {
      let n = sr(Ar, e.__scopeSelect),
        r = pr(Ar, e.__scopeSelect),
        [i, a] = E.useState(!1),
        o = s(t, r.onScrollButtonChange);
      return (
        l(() => {
          if (n.viewport && n.isPositioned) {
            let e = function () {
              let e = t.scrollHeight - t.clientHeight,
                n = Math.ceil(t.scrollTop) < e;
              a(n);
            };
            Q(e, `handleScroll`);
            let t = n.viewport;
            return (e(), t.addEventListener(`scroll`, e), () => t.removeEventListener(`scroll`, e));
          }
        }, [n.viewport, n.isPositioned]),
        i
          ? (0, j.jsx)(Mr, {
              ...e,
              ref: o,
              onAutoScroll: () => {
                let { viewport: e, selectedItem: t } = n;
                e && t && (e.scrollTop += t.offsetHeight);
              },
            })
          : null
      );
    }, `SelectScrollDownButton`),
  ),
  Mr = E.forwardRef(
    Q(function (e, t) {
      let { __scopeSelect: n, onAutoScroll: r, ...i } = e,
        a = sr(`SelectScrollButton`, n),
        o = E.useRef(null),
        s = Rn(n),
        u = E.useCallback(() => {
          o.current !== null && (window.clearInterval(o.current), (o.current = null));
        }, []);
      return (
        E.useEffect(() => () => u(), [u]),
        l(() => {
          s()
            .find((e) => e.ref.current === document.activeElement)
            ?.ref.current?.scrollIntoView({ block: `nearest` });
        }, [s]),
        (0, j.jsx)(x.div, {
          "aria-hidden": !0,
          ...i,
          ref: t,
          style: { flexShrink: 0, ...i.style },
          onPointerDown: c(i.onPointerDown, () => {
            o.current === null && (o.current = window.setInterval(r, 50));
          }),
          onPointerMove: c(i.onPointerMove, () => {
            (a.onItemLeave?.(), o.current === null && (o.current = window.setInterval(r, 50)));
          }),
          onPointerLeave: c(i.onPointerLeave, () => {
            u();
          }),
        })
      );
    }, `SelectScrollButtonImpl`),
  ),
  Nr = E.forwardRef(
    Q(function (e, t) {
      let { __scopeSelect: n, ...r } = e;
      return (0, j.jsx)(x.div, { "aria-hidden": !0, ...r, ref: t });
    }, `SelectSeparator`),
  ),
  Pr = `SelectBubbleInput`,
  Fr = E.forwardRef(
    Q(function ({ __scopeSelect: e, ...t }, n) {
      let r = Wn(Pr, e),
        {
          value: i,
          onValueChange: a,
          required: o,
          disabled: c,
          name: l,
          autoComplete: u,
          form: d,
        } = r,
        { nativeOptions: f, nativeSelectKey: p } = r,
        m = E.useRef(null),
        h = s(n, m),
        g = i ?? ``,
        _ = jn(g),
        v = Array.from(f).some((e) => (e.props.value ?? ``) === ``);
      return (
        E.useEffect(() => {
          let e = m.current;
          if (!e) return;
          let t = window.HTMLSelectElement.prototype,
            n = Object.getOwnPropertyDescriptor(t, `value`).set;
          if (_ !== g && n) {
            let t = new Event(`change`, { bubbles: !0 });
            (n.call(e, g), e.dispatchEvent(t));
          }
        }, [_, g]),
        (0, j.jsxs)(
          x.select,
          {
            "aria-hidden": !0,
            required: o,
            tabIndex: -1,
            name: l,
            autoComplete: u,
            disabled: c,
            form: d,
            onChange: (e) => a(e.target.value),
            ...t,
            style: { ...Mn, ...t.style },
            ref: h,
            defaultValue: g,
            children: [Lr(i) && !v ? (0, j.jsx)(`option`, { value: `` }) : null, Array.from(f)],
          },
          p,
        )
      );
    }, `SelectBubbleInput`),
  );
function Ir(e) {
  return typeof e == `function`;
}
Q(Ir, `isFunction`);
function Lr(e) {
  return e === `` || e === void 0;
}
Q(Lr, `shouldShowPlaceholder`);
function Rr(e) {
  let t = m(e),
    n = E.useRef(``),
    r = E.useRef(0),
    i = E.useCallback(
      (e) => {
        let i = n.current + e;
        (t(i),
          Q(function e(t) {
            ((n.current = t),
              window.clearTimeout(r.current),
              t !== `` && (r.current = window.setTimeout(() => e(``), 1e3)));
          }, `updateSearch`)(i));
      },
      [t],
    ),
    a = E.useCallback(() => {
      ((n.current = ``), window.clearTimeout(r.current));
    }, []);
  return (E.useEffect(() => () => window.clearTimeout(r.current), []), [n, i, a]);
}
Q(Rr, `useTypeaheadSearch`);
function zr(e, t, n) {
  let r = t.length > 1 && Array.from(t).every((e) => e === t[0]) ? t[0] : t,
    i = n ? e.indexOf(n) : -1,
    a = Br(e, Math.max(i, 0));
  r.length === 1 && (a = a.filter((e) => e !== n));
  let o = a.find((e) => e.textValue.toLowerCase().startsWith(r.toLowerCase()));
  return o === n ? void 0 : o;
}
Q(zr, `findNextItem`);
function Br(e, t) {
  return e.map((n, r) => e[(t + r) % e.length]);
}
Q(Br, `wrapArray`);
var Vr = Jn,
  Hr = Qn,
  Ur = E.forwardRef(({ className: e, children: t, ...n }, r) =>
    (0, j.jsxs)(Xn, {
      ref: r,
      className: a(
        `flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1`,
        e,
      ),
      ...n,
      children: [
        t,
        (0, j.jsx)($n, {
          asChild: !0,
          children: (0, j.jsx)(w, { className: `h-4 w-4 opacity-50` }),
        }),
      ],
    }),
  );
Ur.displayName = Xn.displayName;
var Wr = E.forwardRef(({ className: e, ...t }, n) =>
  (0, j.jsx)(kr, {
    ref: n,
    className: a(`flex cursor-default items-center justify-center py-1`, e),
    ...t,
    children: (0, j.jsx)(T, { className: `h-4 w-4` }),
  }),
);
Wr.displayName = kr.displayName;
var Gr = E.forwardRef(({ className: e, ...t }, n) =>
  (0, j.jsx)(jr, {
    ref: n,
    className: a(`flex cursor-default items-center justify-center py-1`, e),
    ...t,
    children: (0, j.jsx)(w, { className: `h-4 w-4` }),
  }),
);
Gr.displayName = jr.displayName;
var Kr = E.forwardRef(({ className: e, children: t, position: n = `popper`, ...r }, i) =>
  (0, j.jsx)(nr, {
    children: (0, j.jsxs)(ir, {
      ref: i,
      className: a(
        `relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)`,
        n === `popper` &&
          `data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1`,
        e,
      ),
      position: n,
      ...r,
      children: [
        (0, j.jsx)(Wr, {}),
        (0, j.jsx)(hr, {
          className: a(
            `p-1`,
            n === `popper` &&
              `h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]`,
          ),
          children: t,
        }),
        (0, j.jsx)(Gr, {}),
      ],
    }),
  }),
);
Kr.displayName = ir.displayName;
var qr = E.forwardRef(({ className: e, ...t }, n) =>
  (0, j.jsx)(yr, { ref: n, className: a(`px-2 py-1.5 text-sm font-semibold`, e), ...t }),
);
qr.displayName = yr.displayName;
var Jr = E.forwardRef(({ className: e, children: t, ...n }, r) =>
  (0, j.jsxs)(Cr, {
    ref: r,
    className: a(
      `relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50`,
      e,
    ),
    ...n,
    children: [
      (0, j.jsx)(`span`, {
        className: `absolute right-2 flex h-3.5 w-3.5 items-center justify-center`,
        children: (0, j.jsx)(Dr, { children: (0, j.jsx)(C, { className: `h-4 w-4` }) }),
      }),
      (0, j.jsx)(Tr, { children: t }),
    ],
  }),
);
Jr.displayName = Cr.displayName;
var Yr = E.forwardRef(({ className: e, ...t }, n) =>
  (0, j.jsx)(Nr, { ref: n, className: a(`-mx-1 my-1 h-px bg-muted`, e), ...t }),
);
Yr.displayName = Nr.displayName;
export { Hr as a, Ur as i, Kr as n, Jr as r, Vr as t };
