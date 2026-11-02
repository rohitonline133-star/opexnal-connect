import { n as e, s as t } from "./jsx-runtime-B5yqYJvp.js";
import { p as n } from "./posts-CfzQybWe.js";
var r = t(e(), 1);
function i(e) {
  let [t, i] = (0, r.useState)(null);
  return (
    (0, r.useEffect)(() => {
      let t = !0;
      if (!e) {
        i(null);
        return;
      }
      return (
        n(e)
          .then((e) => t && i(e))
          .catch(() => t && i(null)),
        () => {
          t = !1;
        }
      );
    }, [e]),
    t
  );
}
export { i as t };
