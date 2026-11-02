import { t as e } from "./jsx-runtime-B5yqYJvp.js";
import { n as t } from "./createLucideIcon-DgzBSI1Z.js";
import { t as n } from "./useQuery-Sthak1vL.js";
import { t as r } from "./loader-circle-CbE-4Efj.js";
import { E as i, T as a, n as o, u as s } from "./index-BPJbQuiK.js";
import { l as c } from "./posts-CfzQybWe.js";
import { n as l } from "./post-media-zVhS5BrX.js";
var u = e();
function d() {
  let { tag: e } = o.useParams(),
    { user: d } = s(),
    { data: f, isLoading: p } = n({
      queryKey: [`tag-posts`, e, d?.id],
      queryFn: () => c(e, d?.id),
    });
  return (0, u.jsx)(a, {
    header: (0, u.jsx)(i, { title: `#${e}` }),
    children: p
      ? (0, u.jsx)(`div`, {
          className: `flex justify-center py-16`,
          children: (0, u.jsx)(r, {
            className: `h-5 w-5 animate-spin text-muted-foreground`,
            "aria-hidden": `true`,
          }),
        })
      : (f ?? []).length === 0
        ? (0, u.jsx)(`p`, {
            className: `px-4 py-16 text-center text-sm text-muted-foreground`,
            children: `No posts with this hashtag yet.`,
          })
        : (0, u.jsx)(`div`, {
            className: `grid grid-cols-3 gap-0.5 p-0.5`,
            children: (f ?? []).map((e) =>
              (0, u.jsx)(
                t,
                {
                  to: `/p/$postId`,
                  params: { postId: e.id },
                  className: `aspect-square`,
                  children: (0, u.jsx)(l, {
                    media: e.media[0],
                    alt: e.caption || `Post`,
                    className: `h-full w-full`,
                  }),
                },
                e.id,
              ),
            ),
          }),
  });
}
export { d as component };
