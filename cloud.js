// ===== クラウドセーブ（Firebase Firestore の REST API を使う） =====
// ・ぼうけんのしょ 1つごとに ちがう「ふっかつコード」を もつ（きょうだいで 1台の スマホを つかっても べつべつに 管理できる）
// ・クラウドの 1つの 文書（saves/コード）に、その ぼうけんのしょを s1・t1、保護者ページの 出題設定を c1 として 入れる
// Firebaseの設定。空のあいだはクラウドセーブを使わず、スマホの中だけに保存する
const FIREBASE = { apiKey: "AIzaSyDUNwtZ4KxpvrIKuGl9X48qWjTzHqGG3As", projectId: "puni-quest" };

const Cloud = (() => {
  const KEY = window.PQ_DEBUG ? "puniquest_debug_cloud_v1" : "puniquest_cloud_v1";
  // codes：ぼうけんのしょ ごとの コード、dirty：まだ 送っていない ぼうけんのしょ、
  // clean：前の 版の コード（3つ ぶんを 1つの コードに 入れていた）から のこりを けす 必要が あるか
  let st = { codes: ["", "", ""], dirty: [false, false, false], clean: [false, false, false] };
  try {
    const t = JSON.parse(localStorage.getItem(KEY) || "null");
    if (t && t.codes) st = Object.assign(st, t);
    else if (t && t.code) {
      // 前の 版：コードは 1つ。ぼうけんのしょ1 が そのコードを ひきつぐ。2・3 には あたらしい コードを つける
      st.codes = [t.code, "", ""]; st.dirty = [false, true, true]; st.clean = [true, false, false]; st.migrated = t.code;
    }
  } catch (e) { /* 無視 */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* 無視 */ } };
  // デバッグページでは クラウドを 使わない（本番の データに さわらない）
  const enabled = () => !window.PQ_DEBUG && !!(FIREBASE.apiKey && FIREBASE.projectId);

  let timer = null, pulled = false, busy = null, lastOk = 0, lastErr = false;

  // まぎらわしい文字（0とO、1とIなど）をのぞいた12文字のコード
  const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function newCode() {
    const a = new Uint32Array(12);
    crypto.getRandomValues(a);
    return Array.from(a, (x) => ABC[x % ABC.length]).join("");
  }
  // その ぼうけんのしょの コード（なければ つくる）
  function code(i) {
    if (!st.codes[i]) {
      st.codes[i] = newCode();
      if (SL.slots[i]) st.dirty[i] = true;
      persist();
    }
    return st.codes[i];
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
  // あたらしく はじめる ぼうけんのしょには あたらしい コードを つける
  function freshCode(i) { st.codes[i] = ""; st.dirty[i] = false; st.clean[i] = false; persist(); }

  async function pushOne(i) {
    const d = SL.slots[i];
    if (!d && !st.codes[i]) { st.dirty[i] = false; return true; }
    const c = code(i), sent = (d && d.savedAt) || Date.now();
    const fields = { s1: { stringValue: d ? JSON.stringify(d) : "" }, t1: { integerValue: String(sent) } };
    let mask = "&updateMask.fieldPaths=s1&updateMask.fieldPaths=t1";
    // 前の 版の コード：ほかの ぼうけんのしょの のこり（s2・s3 など）を けす
    if (st.clean[i]) mask += ["s2", "t2", "s3", "t3", "c2", "c3"].map((k) => `&updateMask.fieldPaths=${k}`).join("");
    const r = await fetch(url(c) + mask, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) });
    if (!r.ok) throw new Error(String(r.status));
    // 送っているあいだに新しくセーブされた分は、つぎに送る
    const now = SL.slots[i];
    if (!now || now.savedAt === sent || !now.savedAt) st.dirty[i] = false;
    st.clean[i] = false;
    // けした ぼうけんのしょの コードは もう つかわない
    if (!d) st.codes[i] = "";
    return true;
  }
  async function push() {
    if (!enabled()) return false;
    if (busy) await busy;
    busy = (async () => {
      const idx = [0, 1, 2].filter((i) => st.dirty[i] || st.clean[i]);
      if (!idx.length) return true;
      try {
        for (const i of idx) await pushOne(i);
        persist(); lastOk = Date.now(); lastErr = false;
        return true;
      } catch (e) { persist(); lastErr = true; return false; }
    })();
    try { return await busy; } finally { busy = null; }
  }

  // 文書を 読む → [{ d, t, has, cfg }]（新しい 形は 1つ、前の 版の 形は 3つ）
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
      const cs = f["c" + n] && f["c" + n].stringValue;
      if (cs) { try { cfg = JSON.parse(cs); } catch (e) { cfg = null; } }
      return { d, t, has: "t" + n in f, cfg };
    });
  }
  // 設定は 新しい ほうを 使う
  const newerCfg = (sl, cfg) => cfg && sl && (cfg.at || 0) > ((sl.cfg && sl.cfg.at) || 0);

  // 起動したとき：ほかのスマホで新しく遊んだ分があれば取りこむ
  async function pullAll() {
    if (!enabled() || pulled) return false;
    pulled = true;
    let changed = false;
    try {
      // 前の 版から うつった ときは、保護者ページで 2・3 に つけた 設定も ひきつぐ
      if (st.migrated) {
        const old = await fetchDoc(st.migrated);
        if (old) [1, 2].forEach((i) => { if (newerCfg(SL.slots[i], old[i].cfg)) { SL.slots[i].cfg = old[i].cfg; changed = true; } });
        delete st.migrated; persist();
      }
      await Promise.all([0, 1, 2].map(async (i) => {
        if (!st.codes[i]) { if (SL.slots[i]) markDirty(i); return; }
        const docs = await fetchDoc(st.codes[i]);
        if (!docs) { if (SL.slots[i]) markDirty(i); return; }
        const { d, t, has, cfg } = docs[0];
        const lt = (SL.slots[i] && SL.slots[i].savedAt) || 0;
        if (has && d && t > lt && !st.dirty[i]) { SL.slots[i] = d; changed = true; }
        else if (lt > t) markDirty(i);
        if (newerCfg(SL.slots[i], cfg)) { SL.slots[i].cfg = cfg; changed = true; }
      }));
      if (changed) writeSlots();
      return changed;
    } catch (e) { if (changed) writeSlots(); return changed; }
  }

  // ふっかつコードで、ぼうけんのしょ 1つを 取りもどす（i：入れる ばしょ）
  async function restore(input, i) {
    const c = String(input).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length !== 12) return "bad";
    if (!enabled()) return "off";
    try {
      const docs = await fetchDoc(c);
      const hit = docs && docs.find((x) => x.d);
      if (!hit) return "notfound";
      const d = hit.d;
      if (newerCfg(d, hit.cfg)) d.cfg = hit.cfg;
      // ほかの ばしょで 同じ コードを つかっていたら はずす（同じ データが 2つに ならないように）
      st.codes.forEach((x, j) => { if (x === c && j !== i) { st.codes[j] = ""; SL.slots[j] = null; } });
      st.codes[i] = c; st.dirty[i] = false; st.clean[i] = docs.filter((x) => x.d).length > 1;
      persist();
      SL.slots[i] = d; SL.cur = i; writeSlots();
      return "ok";
    } catch (e) { return "net"; }
  }

  // 保護者ページで 変えた 設定だけを 読む（いまの ぼうけんのしょ。数分ごとに 確認する）
  async function fetchCfg(i) {
    if (!enabled() || !st.codes[i]) return null;
    try { const docs = await fetchDoc(st.codes[i]); return docs ? docs[0].cfg : null; } catch (e) { return null; }
  }

  function status() {
    if (!enabled()) return { icon: "📱", text: "このスマホに ほぞん" };
    if (st.dirty.some(Boolean)) return { icon: "⏳", text: lastErr ? "クラウドに まだ ほぞんしていない（ネットに つながったら ほぞん）" : "クラウドに ほぞんちゅう…" };
    return { icon: "☁️", text: "クラウドに ほぞんずみ" };
  }

  // アプリを閉じるときや、ネットにつながったときにも送る
  window.addEventListener("online", () => push());
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") push(); });

  // ぼうけんのしょを けす とき：さいしんの データを 送ってから コードを はずす。クラウドには のこるので、コードで もどせる
  async function detach(i) {
    const c = st.codes[i];
    if (enabled() && SL.slots[i]) { if (!c) code(i); st.dirty[i] = true; await push(); }
    const out = st.codes[i] || "", ok = !st.dirty[i];
    st.codes[i] = ""; st.dirty[i] = false; st.clean[i] = false; persist();
    return { code: out ? fmt(out) : "", saved: ok && !!out };
  }
  return { enabled, detach, code: (i) => fmt(code(i)), hasCode: (i) => !!st.codes[i], markDirty, freshCode, push, pullAll, restore, status, fetchCfg, lastOk: () => lastOk };
})();
