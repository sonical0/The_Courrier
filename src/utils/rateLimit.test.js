// Le module teste vit dans api/utils/ (partage entre server.mjs et les
// fonctions serverless). Le test est ici parce que Create React App fixe
// roots a <rootDir>/src et refuse de le surcharger : un test place dans
// api/ ne serait jamais collecte.
import { rateLimit, clientKey, enforceRateLimit } from "../../api/utils/rateLimit.mjs";

// Chaque test utilise un prefixe de cle unique : les buckets vivent dans un
// module partage, donc reutiliser une cle ferait fuiter l'etat d'un test a
// l'autre.
let seq = 0;
const freshKey = () => `test-${++seq}-${Math.random()}`;

function fakeRes() {
  const res = { statusCode: null, body: null, headers: {} };
  res.setHeader = (k, v) => {
    res.headers[k] = v;
  };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
}

describe("rateLimit", () => {
  it("autorise jusqu'a la limite puis refuse", () => {
    const key = freshKey();
    const opts = { limit: 3, windowMs: 60_000 };

    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(true);

    const refused = rateLimit(key, opts);
    expect(refused.allowed).toBe(false);
    expect(refused.remaining).toBe(0);
    expect(refused.retryAfter).toBeGreaterThan(0);
  });

  it("decremente remaining a chaque appel", () => {
    const key = freshKey();
    const opts = { limit: 3, windowMs: 60_000 };

    expect(rateLimit(key, opts).remaining).toBe(2);
    expect(rateLimit(key, opts).remaining).toBe(1);
    expect(rateLimit(key, opts).remaining).toBe(0);
  });

  it("des cles distinctes ont des compteurs independants", () => {
    const a = freshKey();
    const b = freshKey();
    const opts = { limit: 1, windowMs: 60_000 };

    expect(rateLimit(a, opts).allowed).toBe(true);
    expect(rateLimit(a, opts).allowed).toBe(false);
    // b n'est pas affecte par la saturation de a
    expect(rateLimit(b, opts).allowed).toBe(true);
  });

  it("la fenetre expiree remet le compteur a zero", () => {
    const key = freshKey();
    const opts = { limit: 1, windowMs: 20 };

    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(false);

    jest.spyOn(Date, "now").mockReturnValue(Date.now() + 1000);
    try {
      expect(rateLimit(key, opts).allowed).toBe(true);
    } finally {
      Date.now.mockRestore();
    }
  });
});

describe("clientKey", () => {
  it("prend la premiere IP de x-forwarded-for", () => {
    const req = { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } };
    expect(clientKey(req, "nexus")).toBe("nexus:1.2.3.4");
  });

  it("accepte x-forwarded-for sous forme de tableau", () => {
    const req = { headers: { "x-forwarded-for": ["5.6.7.8", "10.0.0.1"] } };
    expect(clientKey(req, "steam")).toBe("steam:5.6.7.8");
  });

  it("retombe sur la socket sans x-forwarded-for", () => {
    const req = { headers: {}, socket: { remoteAddress: "127.0.0.1" } };
    expect(clientKey(req, "nexus")).toBe("nexus:127.0.0.1");
  });

  it("retourne unknown si rien n'est identifiable", () => {
    expect(clientKey({ headers: {} }, "nexus")).toBe("nexus:unknown");
  });

  it("separe les scopes pour une meme IP", () => {
    const req = { headers: { "x-forwarded-for": "1.2.3.4" } };
    expect(clientKey(req, "nexus")).not.toBe(clientKey(req, "steam"));
  });
});

describe("enforceRateLimit", () => {
  const reqFor = (ip) => ({ headers: { "x-forwarded-for": ip } });

  it("laisse passer sous la limite et expose les en-tetes", () => {
    const res = fakeRes();
    const rejected = enforceRateLimit(reqFor(freshKey()), res, {
      scope: "nexus",
      limit: 2,
      windowMs: 60_000,
    });

    expect(rejected).toBe(false);
    expect(res.statusCode).toBeNull();
    expect(res.headers["X-RateLimit-Limit"]).toBe("2");
    expect(res.headers["X-RateLimit-Remaining"]).toBe("1");
  });

  it("repond 429 avec Retry-After au-dela de la limite", () => {
    const ip = freshKey();
    const opts = { scope: "nexus", limit: 1, windowMs: 60_000 };

    enforceRateLimit(reqFor(ip), fakeRes(), opts);

    const res = fakeRes();
    const rejected = enforceRateLimit(reqFor(ip), res, opts);

    expect(rejected).toBe(true);
    expect(res.statusCode).toBe(429);
    expect(res.body).toMatchObject({ success: false, scope: "nexus" });
    expect(Number(res.headers["Retry-After"])).toBeGreaterThan(0);
  });
});
