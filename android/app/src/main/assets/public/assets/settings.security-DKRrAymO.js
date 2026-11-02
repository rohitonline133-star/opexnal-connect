import { n as e, o as t, r as n, s as r, t as i } from "./jsx-runtime-B5yqYJvp.js";
import { a, o } from "./auth-client-sF2KzMXy.js";
import { u as s } from "./index-BPJbQuiK.js";
import { t as c } from "./__vite-browser-external-wI31kqez.js";
var l = r(e(), 1),
  u = i();
function d({ children: e }) {
  return (0, u.jsx)(`div`, {
    className: `min-h-screen bg-background text-foreground`,
    children: e,
  });
}
function f({ title: e }) {
  return (0, u.jsx)(`div`, {
    className: `flex items-center justify-between pb-4 border-b`,
    children: (0, u.jsx)(`h1`, { className: `text-xl font-bold`, children: e }),
  });
}
var p = n((e, t) => {
    var n = c(),
      r = {};
    ((r.gen = function (e, t) {
      ((e ||= ``), (t ||= {}));
      var r = t.counter || 0,
        i = 6,
        s = new Buffer(a(r)),
        c = o(n.createHmac(`sha1`, new Buffer(e)).update(s).digest(`hex`)),
        l = c[19] & 15,
        u =
          ((c[l] & 127) << 24) |
          ((c[l + 1] & 255) << 16) |
          ((c[l + 2] & 255) << 8) |
          (c[l + 3] & 255);
      return ((u += ``), u.substr(u.length - i, i));
    }),
      (r.verify = function (e, t, n) {
        n ||= {};
        for (var r = n.window || 50, i = n.counter || 0, a = i - r; a <= i + r; ++a)
          if (((n.counter = a), this.gen(t, n) === e)) return { delta: a - i };
        return null;
      }));
    var i = {};
    ((i.gen = function (e, t) {
      t ||= {};
      var n = t.time || 30,
        i = new Date().getTime();
      if (t._t) throw Error(`cannot overwrite time in non-test environment!`);
      return ((t.counter = Math.floor(i / 1e3 / n)), r.gen(e, t));
    }),
      (i.verify = function (e, t, n) {
        n ||= {};
        var i = n.time || 30,
          a = new Date().getTime();
        if (n._t) throw Error(`cannot overwrite time in non-test environment!`);
        return ((n.counter = Math.floor(a / 1e3 / i)), r.verify(e, t, n));
      }),
      (t.exports.hotp = r),
      (t.exports.totp = i));
    var a = function (e) {
        for (var t = [], n = 7; n >= 0; --n) ((t[n] = e & 255), (e >>= 8));
        return t;
      },
      o = function (e) {
        for (var t = [], n = 0; n < e.length; n += 2) t.push(parseInt(e.substr(n, 2), 16));
        return t;
      };
  }),
  m = n((e) => {
    var t = [
      255, 255, 26, 27, 28, 29, 30, 31, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 1, 2, 3, 4,
      5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255,
      255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 255, 255, 255, 255, 255,
    ];
    function n(e) {
      var t = Math.floor(e.length / 5);
      return e.length % 5 == 0 ? t : t + 1;
    }
    ((e.encode = function (e) {
      Buffer.isBuffer(e) || (e = new Buffer(e));
      for (var t = 0, r = 0, i = 0, a = 0, o = new Buffer(n(e) * 8); t < e.length;) {
        var s = e[t];
        (i > 3
          ? ((a = s & (255 >> i)),
            (i = (i + 5) % 8),
            (a = (a << i) | ((t + 1 < e.length ? e[t + 1] : 0) >> (8 - i))),
            t++)
          : ((a = (s >> (8 - (i + 5))) & 31), (i = (i + 5) % 8), i === 0 && t++),
          (o[r] = `ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`.charCodeAt(a)),
          r++);
      }
      for (t = r; t < o.length; t++) o[t] = 61;
      return o;
    }),
      (e.decode = function (e) {
        var n = 0,
          r = 0,
          i,
          a = 0;
        Buffer.isBuffer(e) || (e = new Buffer(e));
        for (
          var o = new Buffer(Math.ceil((e.length * 5) / 8)), s = 0;
          s < e.length && e[s] !== 61;
          s++
        ) {
          var c = e[s] - 48;
          if (c < t.length)
            ((r = t[c]),
              n <= 3
                ? ((n = (n + 5) % 8),
                  n === 0 ? ((i |= r), (o[a] = i), a++, (i = 0)) : (i |= 255 & (r << (8 - n))))
                : ((n = (n + 5) % 8),
                  (i |= 255 & (r >>> n)),
                  (o[a] = i),
                  a++,
                  (i = 255 & (r << (8 - n)))));
          else throw Error(`Invalid input - it is not base32 encoded string`);
        }
        return o.slice(0, a);
      }));
  }),
  h = n((e) => {
    var t = m();
    ((e.encode = t.encode), (e.decode = t.decode));
  }),
  g = n((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.verifyToken = e.generateToken = e.generateSecret = void 0));
    var n = (a(), t(o)),
      r = n.__importDefault(p()),
      i = n.__importDefault(c()),
      s = n.__importDefault(h());
    function l(e) {
      let t = {
          name: encodeURIComponent(e?.name ?? `App`),
          account: encodeURIComponent(e?.account ? `:${e.account}` : ``),
        },
        n = i.default.randomBytes(20),
        r = s.default
          .encode(n)
          .toString(`utf8`)
          .replace(/=/g, ``)
          .toLowerCase()
          .replace(/(\w{4})/g, `$1 `)
          .trim()
          .split(` `)
          .join(``)
          .toUpperCase(),
        a = `?secret=${r}&issuer=${t.name}`,
        o = a.replace(`?`, `%3F`).replace(`&`, `%26`),
        c = `otpauth://totp/${t.name}${t.account}`;
      return {
        secret: r,
        uri: `${c}${a}`,
        qr: `https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=${c}${o}`,
      };
    }
    e.generateSecret = l;
    function u(e) {
      if (!e || !e.length) return null;
      let t = e.replace(/\W+/g, ``).toUpperCase(),
        n = s.default.decode(t);
      return { token: r.default.totp.gen(n) };
    }
    e.generateToken = u;
    function d(e, t, n = 4) {
      if (!t || !t.length) return null;
      let i = e.replace(/\W+/g, ``).toUpperCase(),
        a = s.default.decode(i);
      return r.default.totp.verify(t.replace(/\W+/g, ``), a, { window: n, time: 30 });
    }
    e.verifyToken = d;
  })();
function _(e) {
  let t = (0, g.generateSecret)({ name: `Opexnal`, account: e });
  return { secret: t.secret, qrCodeUrl: t.qr, uri: t.uri };
}
function v(e, t) {
  let n = (0, g.verifyToken)(e, t);
  return n !== null && n.delta === 0;
}
var y = ({ userEmail: e }) => {
  let [t, n] = (0, l.useState)(``),
    [r, i] = (0, l.useState)(``),
    [a, o] = (0, l.useState)(``),
    [s, c] = (0, l.useState)(!1);
  return (0, u.jsxs)(`div`, {
    className: `p-4 border rounded-lg bg-gray-900 text-white my-4`,
    children: [
      (0, u.jsx)(`h3`, {
        className: `text-lg font-bold mb-2`,
        children: `Two-Factor Authentication (2FA)`,
      }),
      t
        ? (0, u.jsxs)(`div`, {
            className: `space-y-4`,
            children: [
              (0, u.jsx)(`p`, {
                className: `text-sm`,
                children: `Authenticator App (Google Authenticator) से QR कोड स्कैन करें:`,
              }),
              (0, u.jsx)(`img`, {
                src: t,
                alt: `2FA QR Code`,
                className: `w-48 h-48 bg-white p-2 rounded`,
              }),
              (0, u.jsxs)(`div`, {
                className: `flex gap-2`,
                children: [
                  (0, u.jsx)(`input`, {
                    type: `text`,
                    placeholder: `6-digit OTP`,
                    value: a,
                    onChange: (e) => o(e.target.value),
                    className: `p-2 rounded bg-gray-800 text-white border border-gray-700`,
                  }),
                  (0, u.jsx)(`button`, {
                    onClick: () => {
                      v(a, r)
                        ? (c(!0), alert(`2FA सफलतापूर्वक चालू हो गया है!`))
                        : alert(`गलत OTP कोड! दोबारा कोशिश करें।`);
                    },
                    className: `bg-green-600 px-4 py-2 rounded font-semibold text-white`,
                    children: `Verify`,
                  }),
                ],
              }),
            ],
          })
        : (0, u.jsx)(`button`, {
            onClick: async () => {
              let { secret: t, qrCodeUrl: r } = _(e);
              (i(t), n(r));
            },
            className: `bg-blue-600 px-4 py-2 rounded font-semibold text-white`,
            children: `2FA चालू करें`,
          }),
      s &&
        (0, u.jsx)(`p`, {
          className: `text-green-400 mt-2`,
          children: `✓ 2FA आपके अकाउंट पर एक्टिव है।`,
        }),
    ],
  });
};
function b() {
  let { session: e } = s(),
    t = e?.user?.email || `user@opexnal.com`;
  return (0, u.jsx)(d, {
    children: (0, u.jsxs)(`div`, {
      className: `max-w-2xl mx-auto p-4 space-y-6`,
      children: [
        (0, u.jsx)(f, { title: `Account Security` }),
        (0, u.jsxs)(`div`, {
          className: `bg-card rounded-lg p-6 border shadow-sm space-y-4`,
          children: [
            (0, u.jsx)(`h2`, {
              className: `text-xl font-semibold`,
              children: `Two-Factor Authentication (2FA)`,
            }),
            (0, u.jsx)(`p`, {
              className: `text-sm text-muted-foreground`,
              children: `TOTP-आधारित सुरक्षा सक्रिय करें। अपने Google Authenticator या Authy ऐप द्वारा अकाउंट को सुरक्षित करें।`,
            }),
            (0, u.jsx)(y, { userEmail: t }),
          ],
        }),
      ],
    }),
  });
}
export { b as component };
