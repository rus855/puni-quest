// ===== クラウドセーブ（Firebase Firestore の REST API を使う） =====
// Firebaseの設定。空のあいだはクラウドセーブを使わず、スマホの中だけに保存する
const FIREBASE = { apiKey: "AIzaSyDUNwtZ4KxpvrIKuGl9X48qWjTzHqGG3As", projectId: "puni-quest" };

const Cloud = (() => {
  const KEY = "puniquest_cloud_v1";
  // code: ふっかつコード, dirty: クラウドにまだ送っていないぼうけんのしょ
  let st = { code: "", dirty: [false, false, false] };
  try { const t = localStorage.getItem(KEY); if (t) st = Object.assign(st, JSON.parse(t)); } catch (e) { /* 無視 */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* 無視 */ } };
  const enabled = () => !!(FIREBASE.apiKey && FIREBASE.projectId);

  let timer = null, pulled = false, busy = null, lastOk = 0, lastErr = false;

  // まぎらわしい文字（0とO、1とIなど）をのぞいた12文字のコード
  const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function newCode() {
    const a = new Uint32Array(12);
    crypto.getRandomValues(a);
    return Array.from(a, (x) => ABC[x % ABC.length]).join("");
  }
  function code() {
    if (!st.code) {
      st.code = newCode();
      // 新しいコードには、いまあるデータをすべて送る
      SL.slots.forEach((d, i) => { if (d) st.dirty[i] = true; });
      persist();
    }
    return st.code;
  }
  const fmt = (c) => c.replace(/(.{4})(.{4})(.{4})/, "$1-$2-$3");
  const url = (c) => `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents/saves/${c}?key=${FIREBASE.apiKey}`;

  // セーブされたら、少し待ってからまとめてクラウドへ送る
  function markDirty(i) {
    st.dirty[i] = true; persist();
    if (!enabled()) return;
    clearTimeout(timer);
    timer = setTimeout(() => push(), 4000);
  }

  async function push() {
    if (!enabled()) return false;
    if (busy) await busy;
    busy = (async () => {
      const c = code();
      const idx = [0, 1, 2].filter((i) => st.dirty[i]);
      if (!idx.length) return true;
      const fields = {}, sent = {};
      let mask = "";
      for (const i of idx) {
        const d = SL.slots[i], n = i + 1;
        sent[i] = (d && d.savedAt) || Date.now();
        fields["s" + n] = { stringValue: d ? JSON.stringify(d) : "" };
        fields["t" + n] = { integerValue: String(sent[i]) };
        mask += `&updateMask.fieldPaths=s${n}&updateMask.fieldPaths=t${n}`;
      }
      try {
        const r = await fetch(url(c) + mask, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) });
        if (!r.ok) throw new Error(String(r.status));
        // 送っているあいだに新しくセーブされた分は、つぎに送る
        idx.forEach((i) => { const d = SL.slots[i]; if (!d || d.savedAt === sent[i] || !d.savedAt) st.dirty[i] = false; });
        persist(); lastOk = Date.now(); lastErr = false;
        return true;
      } catch (e) { lastErr = true; return false; }
    })();
    try { return await busy; } finally { busy = null; }
  }

  async function fetchDoc(c) {
    const r = await fetch(url(c), { cache: "no-store" });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(String(r.status));
    const f = (await r.json()).fields || {};
    return [1, 2, 3].map((n) => {
      const s = f["s" + n] && f["s" + n].stringValue;
      const t = Number((f["t" + n] && f["t" + n].integerValue) || 0);
      let d = null, cfg = null;
      if (s) { try { d = JSON.parse(s); } catch (e) { d = null; } }
      // c1〜c3：保護者ページで 変えた 出題の設定
      const cs = f["c" + n] && f["c" + n].stringValue;
      if (cs) { try { cfg = JSON.parse(cs); } catch (e) { cfg = null; } }
      return { d, t, has: "t" + n in f, cfg };
    });
  }

  // 起動したとき：ほかのスマホで新しく遊んだ分があれば取りこむ
  async function pullAll() {
    if (!enabled() || pulled || !st.code) return false;
    pulled = true;
    try {
      const docs = await fetchDoc(st.code);
      if (!docs) { SL.slots.forEach((d, i) => { if (d) markDirty(i); }); return false; }
      let changed = false;
      docs.forEach(({ d, t, has, cfg }, i) => {
        const lt = (SL.slots[i] && SL.slots[i].savedAt) || 0;
        if (has && t > lt && !st.dirty[i]) { SL.slots[i] = d; changed = true; }
        else if (lt > t) markDirty(i);
        // 保護者ページの 設定の ほうが 新しければ 使う
        const sl = SL.slots[i];
        if (cfg && sl && (cfg.at || 0) > ((sl.cfg && sl.cfg.at) || 0)) { sl.cfg = cfg; changed = true; }
      });
      if (changed) writeSlots();
      return changed;
    } catch (e) { return false; }
  }

  // ふっかつコードで、3つのぼうけんのしょをまるごと取りもどす
  async function restore(input) {
    const c = String(input).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length !== 12) return "bad";
    if (!enabled()) return "off";
    try {
      const docs = await fetchDoc(c);
      if (!docs) return "notfound";
      st.code = c; st.dirty = [false, false, false]; persist();
      SL.slots = docs.map((x) => x.d); SL.cur = 0; writeSlots();
      return "ok";
    } catch (e) { return "net"; }
  }

  // 保護者ページで 変えた 設定だけを 読む（数分ごとに 確認する）
  async function fetchCfg() {
    if (!enabled() || !st.code) return null;
    try { const docs = await fetchDoc(st.code); return docs ? docs.map((x) => x.cfg) : null; } catch (e) { return null; }
  }

  function status() {
    if (!enabled()) return { icon: "📱", text: "このスマホに ほぞん" };
    if (st.dirty.some(Boolean)) return { icon: "⏳", text: lastErr ? "クラウドに まだ ほぞんしていない（ネットに つながったら ほぞん）" : "クラウドに ほぞんちゅう…" };
    return { icon: "☁️", text: "クラウドに ほぞんずみ" };
  }

  // アプリを閉じるときや、ネットにつながったときにも送る
  window.addEventListener("online", () => push());
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") push(); });

  return { enabled, code: () => fmt(code()), hasCode: () => !!st.code, markDirty, push, pullAll, restore, status, fetchCfg, lastOk: () => lastOk };
})();
