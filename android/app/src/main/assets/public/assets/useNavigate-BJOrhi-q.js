import { n as e, s as t } from "./jsx-runtime-B5yqYJvp.js";
import { t as n } from "./useRouter-pwcVhHDy.js";
var r = t(e(), 1);
function i(e) {
  let t = n();
  return r.useCallback((n) => t.navigate({ ...n, from: n.from ?? e?.from }), [e?.from, t]);
}
export { i as t };
