// ===== かきとり道場・まおうの しろ =====
"use strict";

// とくべつな 章（CHAPTERS とは べつに もつ。国の 進み具合には 入れない）
const EXTRA_CH = [];
// かきとり道場の ボスを はじめて たおすと もらえる アクセサリー（学年ごと）
const WRITE_REWARD = { 1: "x_kirame", 2: "x_cloud", 3: "x_whale", 4: "x_horse", 5: "x_gold", 6: "x_dragon" };
const WRITE_STAGE_NAMES = {
  1: ["すずりの 間", "えんぴつの 間", "とめはねの 間", "ヌシの はじめての 書院"],
  2: ["ふでならしの 間", "はらいの 間", "おれの 間", "ヌシの 花の 書院"],
  3: ["しおかぜの 書き場", "なみの 書き場", "うずの 書き場", "ヌシの 海の 書院"],
  4: ["山びこの 書き場", "がけの 書き場", "とうげの 書き場", "ヌシの 山の 書院"],
  5: ["てらこやの 机", "おしょさんの 机", "まき物の 机", "ヌシの 古い 書院"],
  6: ["星あかりの 書き場", "月あかりの 書き場", "天の川の 書き場", "ヌシの 星の 書院"],
};

// 章の 準備（prepareChapters の あとに よぶ）
function prepareExtra() {
  EXTRA_CH.length = 0;
  for (let g = 1; g <= 6; g++) {
    const sec = "a" + g;
    const items = [...new Set(CHAPTERS.filter((c) => c.w === "kanji" && c.sec === sec).flatMap((c) => c.items).filter((x) => x.startsWith("k:")))];
    EXTRA_CH.push({ id: "kw" + g, w: "kanji", sec, g, name: "かきとり道場", icon: "✍️", items, write: true, tier: Math.min(5, g), idx: 100 + g,
      els: [ELS4[g % 4], ELS4[(g + 2) % 4]], last: false, desc: "漢字を 自分で 書いて たたかう 道場。ごほうびが たっぷり！" });
    CH_STAGE_NAMES["kw" + g] = WRITE_STAGE_NAMES[g];
  }
  EXTRA_CH.push({ id: "z1", w: "final", name: "まおうの しろ", icon: "🌑", maou: 1, tier: 6, idx: 200, els: ["fire", "water"], last: false, items: [], desc: "5つの 国の ちからを ためされる…" });
  EXTRA_CH.push({ id: "z2", w: "final", name: "しんの まおうの しろ", icon: "🌌", maou: 2, tier: 6, idx: 201, els: ["thunder", "leaf"], last: false, items: [], desc: "すべての 国を すくった ゆうしゃだけが 入れる" });
  CH_STAGE_NAMES.z1 = ["", "", "", "まおうの 玉座"];
  CH_STAGE_NAMES.z2 = ["", "", "", "やみの はての 玉座"];
}

// かきとり道場：その学年の 章を 1つでも クリアすると ひらく
function writeOpen(ch) {
  if (window.PQ_DEBUG && window.PQ_OPEN) return true;
  return stStars(`${ch.id}-1`) > 0 || activeChapters("kanji").some((c) => c.sec === ch.sec && chapterDone(c));
}

// ---------- まおう ----------
// 国ごとに たおした ボスの 数
const bossCount = (w) => activeChapters(w).filter(chapterDone).length;
const maouNeed = (w) => Math.min(5, activeChapters(w).length);
function maouOpen(n) {
  if (window.PQ_DEBUG && window.PQ_OPEN) return true;
  const ws = WORLDS.filter((w) => activeChapters(w.id).length);
  if (!ws.length) return false;
  if (n === 1) return ws.every((w) => bossCount(w.id) >= maouNeed(w.id));
  return stStars("z1-4") > 0 && ws.every((w) => bossCount(w.id) >= activeChapters(w.id).length);
}
// まおうの 問題：クリアした 章の 問題から、むずかしめ（ティア3いじょう）を 中心に
function maouPool() {
  const done = CHAPTERS.filter((c) => chapterOn(c) && chapterDone(c));
  const hard = done.filter((c) => c.tier >= 3);
  const ids = (hard.length >= 4 ? hard : done).flatMap((c) => c.items).filter(itemOn);
  return ids.length ? ids : CHAPTERS.filter(chapterOn).flatMap((c) => c.items).filter(itemOn);
}
function maouEnemies(ch) {
  const mk = (o) => Object.assign({ phase: 0 }, o);
  if (ch.maou === 1) return [
    mk({ name: "まおうの しもべ ゴーレム", hp: 300, atk: 22, el: "leaf", shape: "rock", color: ELEMENTS.leaf.color, boss: false, imm: "none" }),
    mk({ name: "まおうの しもべ まぼろし", hp: 300, atk: 22, el: pick(ELS4), rand: true, shape: "ghost", color: "#b388ff", boss: false }),
    mk({ name: "まおう ドンヨリ", hp: 950, atk: 27, el: "fire", shape: "boss", color: "#5e35b1", boss: true, fast: true, phases: ["fire", "water", "thunder"] }),
  ];
  return [
    mk({ name: "まおう ドンヨリ（ふっかつ）", hp: 2000, atk: 54, el: "water", shape: "boss", color: "#4527a0", boss: false, fast: true, phases: ["water", "leaf", "fire"] }),
    mk({ name: "しんの まおう カオスドン", hp: 4200, atk: 60, el: "thunder", shape: "boss", color: "#1a0f3d", boss: true, fast: true, phases: ["thunder", "fire", "leaf"] }),
  ];
}
// 地図に 出す まおうの ボタン
function maouButton() {
  const o1 = maouOpen(1), o2 = maouOpen(2), c1 = stStars("z1-4") > 0;
  const prog = WORLDS.filter((w) => activeChapters(w.id).length).map((w) => `${w.icon}${Math.min(bossCount(w.id), maouNeed(w.id))}/${maouNeed(w.id)}`).join(" ");
  let h = `<button class="stage maou ${o1 ? "" : "locked"}" ${o1 ? `onclick="startBattle('z1-4')"` : ""}>
    <span class="snum">🌑</span><span class="sinfo"><b>まおうの しろ</b><small>${o1 ? (c1 ? `⭐${stStars("z1-4")}　もういちど いどめるよ` : "5つの 国の ちからを ためされる…") : `どの 国でも ボスを 5体 たおすと ひらく<br>${prog}`}</small></span><span class="sstate">${o1 ? "▶" : "🔒"}</span></button>`;
  if (c1) {
    const left = WORLDS.filter((w) => activeChapters(w.id).length).map((w) => `${w.icon}${bossCount(w.id)}/${activeChapters(w.id).length}`).join(" ");
    h += `<button class="stage maou2 ${o2 ? "" : "locked"}" ${o2 ? `onclick="startBattle('z2-4')"` : ""}>
      <span class="snum">🌌</span><span class="sinfo"><b>しんの まおうの しろ</b><small>${o2 ? "さいごの たたかい…！" : `すべての 国の 章を クリアすると ひらく<br>${left}`}</small></span><span class="sstate">${o2 ? "▶" : "🔒"}</span></button>`;
  }
  return h;
}

// ---------- かきとり（お手本なしで 書く）の 判定 ----------
const FS_N = 64;
// ほね組みに する（Zhang-Suen の 細線化）
function thinGrid(a, N) {
  const g = a.slice(); let changed = true;
  const at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? 0 : g[y * N + x]);
  while (changed) {
    changed = false;
    for (let step = 0; step < 2; step++) {
      const del = [];
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (!g[y * N + x]) continue;
        const p = [at(x, y - 1), at(x + 1, y - 1), at(x + 1, y), at(x + 1, y + 1), at(x, y + 1), at(x - 1, y + 1), at(x - 1, y), at(x - 1, y - 1)];
        const b = p.reduce((s2, v) => s2 + v, 0);
        if (b < 2 || b > 6) continue;
        let t = 0; for (let i = 0; i < 8; i++) if (!p[i] && p[(i + 1) % 8]) t++;
        if (t !== 1) continue;
        if (step === 0 ? p[0] * p[2] * p[4] || p[2] * p[4] * p[6] : p[0] * p[2] * p[6] || p[0] * p[4] * p[6]) continue;
        del.push(y * N + x);
      }
      if (del.length) { changed = true; del.forEach((i) => { g[i] = 0; }); }
    }
  }
  return g;
}
function gridOf(ctx, N, th) {
  const a = ctx.getImageData(0, 0, N, N).data, g = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) g[i] = a[i * 4 + 3] > th ? 1 : 0;
  return g;
}
function bboxOf(g, N) {
  let x0 = N, y0 = N, x1 = -1, y1 = -1;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (g[y * N + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  // ほそすぎる ときは まん中を 中心に ひろげる（「一」など）
  const m = N * 0.12; let w = x1 - x0 + 1, h = y1 - y0 + 1;
  if (w < m) { x0 -= (m - w) / 2; w = m; }
  if (h < m) { y0 -= (m - h) / 2; h = m; }
  return { x0, y0, w, h };
}
// かきとりの ○× 判定（あまめ）
// 字を 5×5 の ます目に わけ、それぞれの ますに「どの 向きの 線（─ │ ／ ＼）が どれだけ あるか」を くらべる。
// 書いた 位置・大きさ・多少の ゆがみには 強い。正しい字が、にた字＋ほかの 字（約80字）の 中で
// 上から 10番いない かつ にている度が 0.4 いじょう なら ○。
const DZ = 5;
function dirFeat(pts) {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  pts.forEach(([x, y]) => { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; });
  let w = x1 - x0, h = y1 - y0; const m = Math.max(w, h) * 0.35 || 0.1;
  if (w < m) { x0 -= (m - w) / 2; w = m; }
  if (h < m) { y0 -= (m - h) / 2; h = m; }
  const f = new Float32Array(DZ * DZ * 4);
  for (const [x, y, a] of pts) {
    const u = ((x - x0) / w) * DZ - 0.5, v = ((y - y0) / h) * DZ - 0.5;
    const t = ((a % Math.PI) + Math.PI) % Math.PI, bf = t / (Math.PI / 4), b0 = Math.floor(bf) % 4, b1 = (b0 + 1) % 4, fr = bf - Math.floor(bf);
    for (let zy = 0; zy < DZ; zy++) for (let zx = 0; zx < DZ; zx++) {
      const wg = Math.exp(-((zx - u) ** 2 + (zy - v) ** 2) / 0.8);
      if (wg < 0.02) continue;
      const i = (zy * DZ + zx) * 4; f[i + b0] += wg * (1 - fr); f[i + b1] += wg * fr;
    }
  }
  let n = 0; for (const v of f) n += v * v; n = Math.sqrt(n) || 1;
  for (let i = 0; i < f.length; i++) f[i] /= n;
  return f;
}
// ほね組みの 点と、その 向き
function skelPts(sk, N) {
  const pts = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (sk[y * N + x]) {
    let sxx = 0, syy = 0, sxy = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < N && yy < N && sk[yy * N + xx]) { sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
    }
    pts.push([x / N, y / N, 0.5 * Math.atan2(2 * sxy, sxx - syy)]);
  }
  return pts;
}
const featCache = {};
function refFeat(k) {
  if (featCache[k]) return featCache[k];
  const N = FS_N, c = document.createElement("canvas"); c.width = c.height = N;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.font = `${Math.round(N * 0.8)}px ${KFONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#000";
  g.fillText(k, N / 2, N / 2 + N * 0.04);
  return (featCache[k] = dirFeat(skelPts(thinGrid(gridOf(g, N, 100), N), N)));
}
// 書いた 線の 特ちょう（線の 向きを そのまま つかう）
function inkFeat(strokes) {
  const pts = []; let dots = 0;
  strokes.forEach((st) => {
    if (st.length < 2) { dots++; return; }
    for (let i = 1; i < st.length; i++) {
      const [ax, ay] = st[i - 1], [bx, by] = st[i], L = Math.hypot(bx - ax, by - ay);
      if (L < 1e-4) continue;
      const n = Math.max(1, Math.ceil(L / 0.015)), a = Math.atan2(by - ay, bx - ax);
      for (let j = 0; j < n; j++) pts.push([ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n, a]);
    }
  });
  if (!pts.length || dots > strokes.length / 2) {
    const N = FS_N, c = document.createElement("canvas"); c.width = c.height = N;
    const cx = c.getContext("2d", { willReadFrequently: true });
    drawStrokes(cx, N, strokes, "#000", N * 0.06);
    const sp = skelPts(thinGrid(gridOf(cx, N, 60), N), N);
    return sp.length ? dirFeat(sp) : null;
  }
  return dirFeat(pts);
}
const cosSim = (a, b) => { let s2 = 0; for (let i = 0; i < a.length; i++) s2 += a[i] * b[i]; return s2; };
function writeCheck(k, strokes) {
  const f = inkFeat(strokes);
  if (!f) return { ok: false, s: 0 };
  const me = cosSim(refFeat(k), f);
  const K = KANJI.find((x) => x.k === k);
  const same = KANJI.filter((x) => K && x.g === K.g && x.k !== k).map((x) => x.k);
  const cands = [...new Set([...(K ? K.sim : []), ...shuffle(same).slice(0, 40), ...shuffle(KANJI.map((x) => x.k)).slice(0, 40)])].filter((x) => x !== k);
  const higher = cands.filter((x) => cosSim(refFeat(x), f) > me).length;
  return { s: me, rank: higher + 1, ok: me >= 0.4 && higher < 10 };
}

// かきとりの 問題を つくる
function makeWriteQ(id) {
  const K = kanjiOf(id);
  const [word, reading] = pick(K.w.filter(([w]) => w.includes(K.k)));
  return { id, kind: "write", k: K.k, word, reading,
    explain: `<span class="wk">${K.k}</span>${esc(word)}（${reading}）`,
    head: `<div class="qlabel">✍️ □の 漢字を 書こう</div><div class="qruby">${reading}</div><div class="qword fsm">${esc(word).split(K.k).join('<span class="blank">□</span>')}</div>` };
}
function showWrite() {
  const q = B.q;
  TR = { id: q.id, k: q.k, word: q.word, reading: q.reading, strokes: [], cur: null, free: true, max: Math.max(150, Math.min(220, window.innerWidth - 90, window.innerHeight - 530)) };
  setupCanvas();
}
function writeJudge() {
  if (!B || B.busy || !B.q || B.q.kind !== "write") return;
  if (!TR.strokes.length) { toast("わくの 中に 字を 書いてね"); return; }
  const r = writeCheck(TR.k, TR.strokes);
  if (window.PQ_DEBUG) toast(`🛠 にている度 ${Math.round(r.s * 100)}${r.rank ? `・${r.rank}位` : ""}`);
  if (r.ok) { showMaru($("wbox")); judge(true); return; }
  // きかいで わからなかった ときは、お手本と くらべて じぶんで きめる
  B.busy = true;
  $("wbox").insertAdjacentHTML("beforeend", `<div class="wans">${TR.k}</div>`);
  $("qpanel").querySelector(".wrow").outerHTML = `<p class="wself">右の お手本と 同じ 字が 書けたかな？</p>
    <div class="row wrow"><button class="big-btn" onclick="writeSelf(false)">✕ ちがった</button><button class="big-btn primary" onclick="writeSelf(true)">○ 書けてた！</button></div>`;
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}
function writeSelf(ok) {
  // 2回 おしても 1回だけ（B.q.self が ついたら もう えらんだ）
  if (!B || B.over || !B.q || B.q.kind !== "write" || B.q.self || !$("qpanel").querySelector(".wself")) return;
  $("qpanel").querySelectorAll(".wrow button").forEach((b) => { b.disabled = true; });
  B.q.self = true; B.busy = false;
  if (ok) showMaru($("wbox"));
  judge(ok);
}
function writeGiveUp() {
  if (!B || B.busy || !B.q || B.q.kind !== "write") return;
  $("wbox").insertAdjacentHTML("beforeend", `<div class="wans">${TR.k}</div>`);
  judge(false);
}

// かきとり道場・まおうの ごほうび（stageClear から よぶ）。たからばこに 入れる ものを かえす
function extraRewards(st, first, stars, prev) {
  const ch = st.ch;
  const give = (k, n = 1) => { addMat(k, n); B.mats[k] = (B.mats[k] || 0) + n; };
  const getAcc = (id) => { if (!S.owned.includes(id)) { S.owned.push(id); return id; } return null; };
  if (ch.write) {
    // コイン 2ばい・ほうせき・漢字の国の レアそざい
    const add = B.coins; S.coins += add; B.coins += add;
    const gm = st.n === 4 ? 3 : 1; S.gems += gm; B.gems += gm;
    if (st.n === 4 || Math.random() < 0.5) give("kinsumi");
    if (st.n === 4 && Math.random() < 0.5) give("ryuhitsu");
    if (st.n === 4 && first) { const id = getAcc(WRITE_REWARD[ch.g]); if (id) return { icon: "🎀", text: `${itemById(id).name} を てにいれた！`, item: id }; }
    if (stars === 3 && prev < 3) {
      const cand = ITEMS.filter((x) => x.drop === "write" && !S.owned.includes(x.id));
      if (cand.length && Math.random() < 0.5) { const id = getAcc(pick(cand).id); return { icon: "🎀", text: `${itemById(id).name} を てにいれた！`, item: id }; }
    }
    return null;
  }
  if (ch.maou) {
    if (ch.maou === 1) {
      if (first) { S.tierClear.maou = true; give("niji"); S.gems += 20; B.gems += 20; const id = getAcc("x_cape"); return { icon: "🦸", text: id ? "えいゆうの マント を てにいれた！" : "にじの ほうぎょく！", item: id }; }
      if (Math.random() < 0.3) give("niji");
      S.gems += 5; B.gems += 5;
      return null;
    }
    if (first) { S.trueEnd = true; give("niji", 2); S.gems += 30; B.gems += 30; const id = getAcc("x_rainbow"); return { icon: "🌈", text: id ? "にじの オーラ を てにいれた！" : "にじの ほうぎょく ×2！", item: id }; }
    give("niji"); S.gems += 8; B.gems += 8;
  }
  return null;
}
