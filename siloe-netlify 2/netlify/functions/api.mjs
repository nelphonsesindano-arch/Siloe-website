import { getStore } from "@netlify/blobs";

const J = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const isAdmin = (req) => {
  const pw = process.env.ADMIN_PASSWORD || "";
  return pw.length > 0 && (req.headers.get("x-admin-key") || "") === pw;
};
const clip = (v, n = 200) => String(v == null ? "" : v).slice(0, n);
const campus = (k) => (k === "johannesburg" ? "johannesburg" : "lubumbashi");
const listAll = async (store, prefix) => {
  const { blobs } = await store.list({ prefix });
  const out = [];
  for (const b of blobs) { const r = await store.get(b.key, { type: "json" }); if (r) out.push(r); }
  return out;
};

export default async (req) => {
  const path = new URL(req.url).pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const store = getStore("siloe");
  const deny = () => J({ error: "auth" }, 401);
  try {
    // ---------- connexion administrateur (mot de passe = variable ADMIN_PASSWORD)
    if (path === "login" && req.method === "POST") {
      if (isAdmin(req)) return J({ ok: true });
      await new Promise((r) => setTimeout(r, 800));
      return deny();
    }
    // ---------- contenu du site
    if (path === "content") {
      if (req.method === "GET") return J((await store.get("content", { type: "json" })) || {});
      if (req.method === "PUT") {
        if (!isAdmin(req)) return deny();
        await store.setJSON("content", await req.json());
        return J({ ok: true });
      }
    }
    // ---------- photos
    if (path === "upload" && req.method === "POST") {
      if (!isAdmin(req)) return deny();
      const buf = await req.arrayBuffer();
      if (buf.byteLength > 4500000) return J({ error: "too big" }, 413);
      const id = crypto.randomUUID();
      await store.set("img/" + id, buf, { metadata: { type: req.headers.get("content-type") || "image/jpeg" } });
      return J({ url: "/api/img/" + id });
    }
    if (path.startsWith("img/") && req.method === "GET") {
      const r = await store.getWithMetadata(path, { type: "arrayBuffer" });
      if (!r) return new Response("Not found", { status: 404 });
      return new Response(r.data, { headers: { "content-type": (r.metadata && r.metadata.type) || "image/jpeg", "cache-control": "public, max-age=31536000, immutable" } });
    }
    // ---------- nouveaux visiteurs
    if (path === "visitor" && req.method === "POST") {
      const b = await req.json();
      if (b.website) return J({ ok: true });
      if (!clip(b.n) || !clip(b.p)) return J({ error: "missing" }, 400);
      const id = Date.now() + "-" + crypto.randomUUID().slice(0, 6);
      const rec = { id, d: new Date().toISOString(), k: campus(b.k) };
      for (const f of ["n", "sx", "ag", "p", "m", "q", "st", "sv", "sr", "dp", "nd", "src"]) rec[f] = clip(b[f], 300);
      await store.setJSON("reg/" + id, rec);
      return J({ ok: true });
    }
    if (path === "visitors" && req.method === "GET") {
      if (!isAdmin(req)) return deny();
      const out = await listAll(store, "reg/");
      out.sort((a, b) => (a.d < b.d ? -1 : 1));
      return J(out);
    }
    if (path === "visitors/delete" && req.method === "POST") {
      if (!isAdmin(req)) return deny();
      await store.delete("reg/" + clip((await req.json()).id, 80));
      return J({ ok: true });
    }
    // ---------- demandes de carte de membre (la carte n'est émise que par l'administrateur)
    if (path === "member" && req.method === "POST") {
      const b = await req.json();
      if (!clip(b.n) || !clip(b.p)) return J({ error: "missing" }, 400);
      const id = Date.now() + "-" + crypto.randomUUID().slice(0, 6);
      const rec = { id, dt: new Date().toISOString(), k: campus(b.k) };
      for (const f of ["n", "b", "a", "d", "p", "m"]) rec[f] = clip(b[f], 300);
      rec.ph = typeof b.ph === "string" && b.ph.startsWith("data:image/") && b.ph.length < 160000 ? b.ph : "";
      await store.setJSON("mem/" + id, rec);
      return J({ ok: true });
    }
    if (path === "members" && req.method === "GET") {
      if (!isAdmin(req)) return deny();
      const out = await listAll(store, "mem/");
      out.sort((a, b) => (a.dt < b.dt ? -1 : 1));
      return J(out);
    }
    if (path === "members/issue" && req.method === "POST") {
      if (!isAdmin(req)) return deny();
      const { id } = await req.json();
      const rec = await store.get("mem/" + clip(id, 80), { type: "json" });
      if (!rec) return J({ error: "not found" }, 404);
      if (!rec.num) {
        const ck = "counter/" + rec.k;
        const n = ((await store.get(ck, { type: "json" })) || 0) + 1;
        await store.setJSON(ck, n);
        rec.num = (rec.k === "johannesburg" ? "JNB" : "LUB") + "-" + String(new Date().getFullYear()).slice(2) + "-" + String(n).padStart(4, "0");
        rec.issued = new Date().toISOString();
        await store.setJSON("mem/" + rec.id, rec);
      }
      return J(rec);
    }
    if (path === "members/delete" && req.method === "POST") {
      if (!isAdmin(req)) return deny();
      await store.delete("mem/" + clip((await req.json()).id, 80));
      return J({ ok: true });
    }
    // ---------- commandes et dons (factures Johannesburg)
    if (path === "order" && req.method === "POST") {
      const b = await req.json();
      if (!clip(b.n) || !clip(b.p) || !Array.isArray(b.lines) || !b.lines.length || b.lines.length > 40) return J({ error: "invalid" }, 400);
      const id = "SMI-" + new Date().getFullYear() + "-" + (Math.floor(Math.random() * 90000) + 10000);
      const lines = b.lines.map((l) => ({ n: clip(l.n, 120), q: Math.max(1, Math.min(999, Number(l.q) || 1)), p: Math.max(0, Number(l.p) || 0) }));
      const total = lines.reduce((s, l) => s + l.q * l.p, 0);
      const rec = { id, d: new Date().toISOString(), k: "johannesburg", kind: b.kind === "donation" ? "donation" : "order", n: clip(b.n), p: clip(b.p), m: clip(b.m), method: clip(b.method, 60), lines, total, status: "pending" };
      await store.setJSON("ord/" + id, rec);
      return J({ id });
    }
    if (path.startsWith("order/") && req.method === "GET") {
      const r = await store.get("ord/" + clip(path.slice(6), 60), { type: "json" });
      if (!r) return J({ error: "not found" }, 404);
      return J({ id: r.id, status: r.status, total: r.total, d: r.d, kind: r.kind });
    }
    if (path === "orders" && req.method === "GET") {
      if (!isAdmin(req)) return deny();
      const out = await listAll(store, "ord/");
      out.sort((a, b) => (a.d < b.d ? -1 : 1));
      return J(out);
    }
    if (path === "orders/status" && req.method === "POST") {
      if (!isAdmin(req)) return deny();
      const { id, status } = await req.json();
      const r = await store.get("ord/" + clip(id, 60), { type: "json" });
      if (!r) return J({ error: "not found" }, 404);
      r.status = status === "paid" ? "paid" : "pending";
      if (r.status === "paid") r.paidAt = new Date().toISOString();
      await store.setJSON("ord/" + r.id, r);
      return J(r);
    }
    if (path === "orders/delete" && req.method === "POST") {
      if (!isAdmin(req)) return deny();
      await store.delete("ord/" + clip((await req.json()).id, 60));
      return J({ ok: true });
    }
    return J({ error: "not found" }, 404);
  } catch (e) {
    return J({ error: String(e && e.message ? e.message : e) }, 500);
  }
};

export const config = { path: "/api/*" };
