import { n as e, s as t, t as n } from "./jsx-runtime-B5yqYJvp.js";
var r = t(e(), 1),
  i = n(),
  a = r.createContext(void 0),
  o = (e) => {
    let t = r.useContext(a);
    if (e) return e;
    if (!t) throw Error(`No QueryClient set, use QueryClientProvider to set one`);
    return t;
  },
  s = ({ client: e, children: t }) => (
    r.useEffect(
      () => (
        e.mount(),
        () => {
          e.unmount();
        }
      ),
      [e],
    ),
    (0, i.jsx)(a.Provider, { value: e, children: t })
  ),
  c = {
    setTimeout: (e, t) => setTimeout(e, t),
    clearTimeout: (e) => clearTimeout(e),
    setInterval: (e, t) => setInterval(e, t),
    clearInterval: (e) => clearInterval(e),
  },
  l = new (class {
    #e = c;
    setTimeoutProvider(e) {
      this.#e = e;
    }
    setTimeout(e, t) {
      return this.#e.setTimeout(e, t);
    }
    clearTimeout(e) {
      this.#e.clearTimeout(e);
    }
    setInterval(e, t) {
      return this.#e.setInterval(e, t);
    }
    clearInterval(e) {
      this.#e.clearInterval(e);
    }
  })();
function u(e) {
  setTimeout(e, 0);
}
var d = typeof window > `u` || `Deno` in globalThis;
function f() {}
function p(e, t) {
  return typeof e == `function` ? e(t) : e;
}
function m(e) {
  return typeof e == `number` && e >= 0 && e !== 1 / 0;
}
function h(e, t) {
  return Math.max(e + (t || 0) - Date.now(), 0);
}
function g(e, t) {
  return typeof e == `function` ? e(t) : e;
}
function _(e, t) {
  return typeof e == `function` ? e(t) : e;
}
function v(e, t) {
  let { type: n = `all`, exact: r, fetchStatus: i, predicate: a, queryKey: o, stale: s } = e;
  if (o) {
    if (r) {
      if (t.queryHash !== b(o, t.options)) return !1;
    } else if (!S(t.queryKey, o)) return !1;
  }
  if (n !== `all`) {
    let e = t.isActive();
    if ((n === `active` && !e) || (n === `inactive` && e)) return !1;
  }
  return !(
    (typeof s == `boolean` && t.isStale() !== s) ||
    (i && i !== t.state.fetchStatus) ||
    (a && !a(t))
  );
}
function y(e, t) {
  let { exact: n, status: r, predicate: i, mutationKey: a } = e;
  if (a) {
    if (!t.options.mutationKey) return !1;
    if (n) {
      if (x(t.options.mutationKey) !== x(a)) return !1;
    } else if (!S(t.options.mutationKey, a)) return !1;
  }
  return !((r && t.state.status !== r) || (i && !i(t)));
}
function b(e, t) {
  return (t?.queryKeyHashFn || x)(e);
}
function x(e) {
  return JSON.stringify(e, (e, t) =>
    D(t)
      ? Object.keys(t)
          .sort()
          .reduce((e, n) => ((e[n] = t[n]), e), {})
      : t,
  );
}
function S(e, t) {
  if (e === t) return !0;
  if (typeof e != typeof t) return !1;
  if (e && t && typeof e == `object` && typeof t == `object`) {
    if (Array.isArray(e) && Array.isArray(t)) {
      for (let n = 0; n < t.length; n++) if (!S(e[n], t[n])) return !1;
      return !0;
    }
    let n = Object.keys(t);
    for (let r of n) if (!S(e[r], t[r])) return !1;
    return !0;
  }
  return !1;
}
var C = Object.prototype.hasOwnProperty;
function w(e, t, n = 0) {
  if (e === t) return e;
  if (n > 500) return t;
  let r = E(e) && E(t);
  if (!r && !(D(e) && D(t))) return t;
  let i = (r ? e : Object.keys(e)).length,
    a = r ? t : Object.keys(t),
    o = a.length,
    s = r ? Array(o) : {},
    c = 0;
  for (let l = 0; l < o; l++) {
    let o = r ? l : a[l],
      u = e[o],
      d = t[o];
    if (u === d) {
      ((s[o] = u), (r ? l < i : C.call(e, o)) && c++);
      continue;
    }
    if (u === null || d === null || typeof u != `object` || typeof d != `object`) {
      s[o] = d;
      continue;
    }
    let f = w(u, d, n + 1);
    ((s[o] = f), f === u && c++);
  }
  return i === o && c === i ? e : s;
}
function T(e, t) {
  if (!t || Object.keys(e).length !== Object.keys(t).length) return !1;
  for (let n in e) if (e[n] !== t[n]) return !1;
  return !0;
}
function E(e) {
  return Array.isArray(e) && e.length === Object.keys(e).length;
}
function D(e) {
  if (!O(e)) return !1;
  let t = e.constructor;
  if (t === void 0) return !0;
  let n = t.prototype;
  return !(
    !O(n) ||
    !n.hasOwnProperty(`isPrototypeOf`) ||
    Object.getPrototypeOf(e) !== Object.prototype
  );
}
function O(e) {
  return Object.prototype.toString.call(e) === `[object Object]`;
}
function k(e) {
  return new Promise((t) => {
    l.setTimeout(t, e);
  });
}
function A(e, t, n) {
  return typeof n.structuralSharing == `function`
    ? n.structuralSharing(e, t)
    : n.structuralSharing === !1
      ? t
      : w(e, t);
}
function j(e, t, n = 0) {
  let r = [...e, t];
  return n && r.length > n ? r.slice(1) : r;
}
function M(e, t, n = 0) {
  let r = [t, ...e];
  return n && r.length > n ? r.slice(0, -1) : r;
}
var N = Symbol();
function P(e, t) {
  return !e.queryFn && t?.initialPromise
    ? () => t.initialPromise
    : !e.queryFn || e.queryFn === N
      ? () => Promise.reject(Error(`Missing queryFn: '${e.queryHash}'`))
      : e.queryFn;
}
function F(e, t) {
  return typeof e == `function` ? e(...t) : !!e;
}
function I(e, t, n) {
  let r = !1,
    i;
  return (
    Object.defineProperty(e, "signal", {
      enumerable: !0,
      get: () => (
        (i ??= t()),
        r ? i : ((r = !0), i.aborted ? n() : i.addEventListener(`abort`, n, { once: !0 }), i)
      ),
    }),
    e
  );
}
var L = (() => {
    let e = () => d;
    return {
      isServer() {
        return e();
      },
      setIsServer(t) {
        e = t;
      },
    };
  })(),
  R = class {
    constructor() {
      ((this.listeners = new Set()), (this.subscribe = this.subscribe.bind(this)));
    }
    subscribe(e) {
      return (
        this.listeners.add(e),
        this.onSubscribe(),
        () => {
          (this.listeners.delete(e), this.onUnsubscribe());
        }
      );
    }
    hasListeners() {
      return this.listeners.size > 0;
    }
    onSubscribe() {}
    onUnsubscribe() {}
  },
  z = new (class extends R {
    #e;
    #t;
    #n;
    constructor() {
      (super(),
        (this.#n = (e) => {
          if (typeof window < `u` && window.addEventListener) {
            let t = () => e();
            return (
              window.addEventListener(`visibilitychange`, t, !1),
              () => {
                window.removeEventListener(`visibilitychange`, t);
              }
            );
          }
        }));
    }
    onSubscribe() {
      this.#t || this.setEventListener(this.#n);
    }
    onUnsubscribe() {
      this.hasListeners() || (this.#t?.(), (this.#t = void 0));
    }
    setEventListener(e) {
      ((this.#n = e),
        this.#t?.(),
        (this.#t = e((e) => {
          typeof e == `boolean` ? this.setFocused(e) : this.onFocus();
        })));
    }
    setFocused(e) {
      this.#e !== e && ((this.#e = e), this.onFocus());
    }
    onFocus() {
      let e = this.isFocused();
      this.listeners.forEach((t) => {
        t(e);
      });
    }
    isFocused() {
      return typeof this.#e == `boolean`
        ? this.#e
        : globalThis.document?.visibilityState !== `hidden`;
    }
  })(),
  B = u;
function V() {
  let e = [],
    t = 0,
    n = (e) => {
      e();
    },
    r = (e) => {
      e();
    },
    i = B,
    a = (r) => {
      t
        ? e.push(r)
        : i(() => {
            n(r);
          });
    },
    o = () => {
      let t = e;
      ((e = []),
        t.length &&
          i(() => {
            r(() => {
              t.forEach((e) => {
                n(e);
              });
            });
          }));
    };
  return {
    batch: (e) => {
      let n;
      t++;
      try {
        n = e();
      } finally {
        (t--, t || o());
      }
      return n;
    },
    batchCalls:
      (e) =>
      (...t) => {
        a(() => {
          e(...t);
        });
      },
    schedule: a,
    setNotifyFunction: (e) => {
      n = e;
    },
    setBatchNotifyFunction: (e) => {
      r = e;
    },
    setScheduler: (e) => {
      i = e;
    },
  };
}
var H = V(),
  U = new (class extends R {
    #e = !0;
    #t;
    #n;
    constructor() {
      (super(),
        (this.#n = (e) => {
          if (typeof window < `u` && window.addEventListener) {
            let t = () => e(!0),
              n = () => e(!1);
            return (
              window.addEventListener(`online`, t, !1),
              window.addEventListener(`offline`, n, !1),
              () => {
                (window.removeEventListener(`online`, t), window.removeEventListener(`offline`, n));
              }
            );
          }
        }));
    }
    onSubscribe() {
      this.#t || this.setEventListener(this.#n);
    }
    onUnsubscribe() {
      this.hasListeners() || (this.#t?.(), (this.#t = void 0));
    }
    setEventListener(e) {
      ((this.#n = e), this.#t?.(), (this.#t = e(this.setOnline.bind(this))));
    }
    setOnline(e) {
      this.#e !== e &&
        ((this.#e = e),
        this.listeners.forEach((t) => {
          t(e);
        }));
    }
    isOnline() {
      return this.#e;
    }
  })();
function W(e) {
  return Math.min(1e3 * 2 ** e, 3e4);
}
function G(e) {
  return (e ?? `online`) !== `online` || U.isOnline();
}
var K = class extends Error {
  constructor(e) {
    (super(`CancelledError`), (this.revert = e?.revert), (this.silent = e?.silent));
  }
};
function q(e) {
  let t = !1,
    n = 0,
    r,
    i = `pending`,
    a,
    o,
    s = new Promise((e, t) => {
      ((a = e), (o = t));
    });
  s.catch(f);
  let c = () => i !== `pending`,
    l = (t) => {
      if (!c()) {
        let n = new K(t);
        (g(n), e.onCancel?.(n));
      }
    },
    u = () => {
      t = !0;
    },
    d = () => {
      t = !1;
    },
    p = () => z.isFocused() && (e.networkMode === `always` || U.isOnline()) && e.canRun(),
    m = () => G(e.networkMode) && e.canRun(),
    h = (e) => {
      c() || (r?.(), (i = `resolved`), a(e));
    },
    g = (e) => {
      c() || (r?.(), (i = `rejected`), o(e));
    },
    _ = () =>
      new Promise((t) => {
        ((r = (e) => {
          (c() || p()) && t(e);
        }),
          e.onPause?.());
      }).then(() => {
        ((r = void 0), c() || e.onContinue?.());
      }),
    v = () => {
      if (c()) return;
      let r,
        i = n === 0 ? e.initialPromise : void 0;
      try {
        r = i ?? e.fn();
      } catch (e) {
        r = Promise.reject(e);
      }
      Promise.resolve(r)
        .then(h)
        .catch((r) => {
          if (c()) return;
          let i = e.retry ?? (L.isServer() ? 0 : 3),
            a = e.retryDelay ?? W,
            o = typeof a == `function` ? a(n, r) : a,
            s = i === !0 || (typeof i == `number` && n < i) || (typeof i == `function` && i(n, r));
          if (t || !s) {
            g(r);
            return;
          }
          (n++,
            e.onFail?.(n, r),
            k(o)
              .then(() => (p() ? void 0 : _()))
              .then(() => {
                t ? g(r) : v();
              }));
        });
    };
  return {
    promise: s,
    status: () => i,
    cancel: l,
    continue: () => (r?.(), s),
    cancelRetry: u,
    continueRetry: d,
    canStart: m,
    start: () => (m() ? v() : _().then(v), s),
  };
}
var J = class {
  #e;
  destroy() {
    this.clearGcTimeout();
  }
  scheduleGc() {
    (this.clearGcTimeout(),
      m(this.gcTime) &&
        (this.#e = l.setTimeout(() => {
          this.optionalRemove();
        }, this.gcTime)));
  }
  updateGcTime(e) {
    this.gcTime = Math.max(this.gcTime || 0, e ?? (L.isServer() ? 1 / 0 : 3e5));
  }
  clearGcTimeout() {
    this.#e !== void 0 && (l.clearTimeout(this.#e), (this.#e = void 0));
  }
};
export {
  s as A,
  _ as C,
  N as D,
  F as E,
  h as O,
  A as S,
  T,
  m as _,
  U as a,
  f as b,
  R as c,
  j as d,
  M as f,
  b as g,
  x as h,
  q as i,
  o as j,
  l as k,
  L as l,
  p as m,
  K as n,
  H as o,
  P as p,
  G as r,
  z as s,
  J as t,
  I as u,
  y as v,
  g as w,
  S as x,
  v as y,
};
