import { n as e, s as t } from "./jsx-runtime-B5yqYJvp.js";
import { E as n, V as r, t as i } from "./useStore-CsvkxJ4J.js";
import { t as a } from "./useRouter-pwcVhHDy.js";
import { n as o, t as s } from "./matchContext-CDWQjNQi.js";
var c = t(e(), 1),
  l = {
    get() {},
    subscribe() {
      return { unsubscribe() {} };
    },
  };
function u(e, t) {
  let n = c.useRef();
  return (i) => {
    let a = e?.select ? e.select(i) : i;
    return (e?.structuralSharing ?? t.options.defaultStructuralSharing)
      ? (n.current = r(n.current, a))
      : a;
  };
}
function d(e) {
  let t = a(),
    r = c.useContext(e.from ? s : o),
    d = e.from ? t.stores.getRouteMatchStore(e.from) : t.stores.matchStores.get(r),
    f = u(e, t),
    p = i(d ?? l, (e) => (e ? f(e) : l));
  if (p !== l) return p;
  (e.shouldThrow ?? !0) && n();
}
export { u as n, d as t };
