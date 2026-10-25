// ===== ひみつきちの みため =====
// おくゆきの ある へや（おくほど 小さく 見える）・かげ・もようがえ（テーマ）・しきもの（ラグ）
// かぐの くみあわせ・まどの けしき・あかり・きらきらの つぶ
"use strict";

// ---------- おくゆきの けいさん ----------
// へやの わく（はば・たかさを 1 として）：かべの たかさ WH、ゆかは WH〜1。
// t：ゆかの おくゆき（0＝いちばん おく、R＝いちばん てまえ）
const RG = { B: 0.1, A: 0.7 }; // B：おくの かべの すぼまり、A：おくの 列の たかさ（てまえを 1 として）
function rgeo() {
  const { C, R } = roomSize();
  const H = R * 0.9 + 1.5; // へやの たかさ（マスの はば で）
  const WH = 1.5 / H;
  const d = (t) => { const u = Math.max(0, Math.min(1, t / R)); return u * (RG.A + (1 - RG.A) * u); };
  const Y = (t) => WH + (1 - WH) * d(t);
  const ins = (t) => RG.B * (1 - d(t));
  const X = (x, t) => ins(t) + (1 - 2 * ins(t)) * (x / C);
  const cw = (t) => (1 - 2 * ins(t)) / C; // その おくゆきの マスの はば
  const sc = (t) => 0.72 + 0.28 * d(t); // 大きさ
  const WX = (x) => RG.B + (1 - 2 * RG.B) * (x / C); // おくの かべの よこ
  return { C, R, H, WH, d, Y, X, cw, sc, WX };
}
const pc = (v) => `${(v * 100).toFixed(3)}%`;
const pt = (g, x, t) => `${(g.X(x, t) * 100).toFixed(2)},${(g.Y(t) * 100).toFixed(2)}`;
const quad = (g, x0, t0, x1, t1) => `${pt(g, x0, t0)} ${pt(g, x1, t0)} ${pt(g, x1, t1)} ${pt(g, x0, t1)}`;
// ためしに 時間を かえる ことが できる（デバッグ用）
const roomHour = () => (typeof window.PQ_HOUR === "number" ? window.PQ_HOUR : new Date().getHours());
const dayPart = (h = roomHour()) => (h >= 5 && h < 9 ? "morning" : h >= 9 && h < 16 ? "day" : h >= 16 && h < 19 ? "evening" : "night");

// ---------- もようがえ（かべと ゆかの テーマ） ----------
// need：その国の セットの スタンプで ひらく
const THEMES = {
  base: { name: "もくせいの へや", icon: "🏠", wall: "#fbe7d0", wline: "#f1d6b8", side: "#f0d3b2", floor: "#d9a86c", fline: "#b98650", wpat: "stripe", fpat: "wood" },
  kanji: { name: "わしつ", icon: "📖", need: "kanji", wall: "#f6efdc", wline: "#c9b48a", side: "#e6dcc0", floor: "#cfd88f", fline: "#5d7a3c", wpat: "fusuma", fpat: "tatami" },
  kotoba: { name: "しょさい", icon: "💬", need: "kotoba", wall: "#e9ddf6", wline: "#d2bdea", side: "#d9c8ee", floor: "#b5525f", fline: "#8e3644", wpat: "wainscot", fpat: "carpet" },
  math: { name: "ほうがんの へや", icon: "🔢", need: "math", wall: "#eef6ff", wline: "#b9d6f5", side: "#dbe9fa", floor: "#cfe0f2", fline: "#9dbbdb", wpat: "grid", fpat: "tile" },
  sci: { name: "けんきゅうじょ", icon: "🔬", need: "sci", wall: "#e4f7ef", wline: "#a9d9c3", side: "#d2eee1", floor: "#dfe7ea", fline: "#a8b8bf", wpat: "panel", fpat: "tile" },
  soc: { name: "おしろの へや", icon: "🗾", need: "soc", wall: "#e2d9c6", wline: "#b9aa8c", side: "#d2c7b0", floor: "#b8ab92", fline: "#8d7f66", wpat: "brick", fpat: "stone" },
};
const roomTheme = () => { const R = roomData(); R.themes = R.themes || ["base", "base"]; const t = R.themes[R.cur] || "base"; return THEMES[t] && themeOpen(t) ? t : "base"; };
const themeOpen = (t) => !THEMES[t].need || !!roomData().stamps[THEMES[t].need];

// かべと ゆかの え（SVG。0〜100 の わりあいで かく）
function roomBgSVG(g) {
  const T = THEMES[roomTheme()], { C, R, WH } = g, wh = WH * 100, B = RG.B * 100;
  const L = (x1, y1, x2, y2, c = T.wline, w = 1) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" vector-effect="non-scaling-stroke"/>`;
  let s = "";
  // おくの かべ・よこの かべ・ゆか
  s += `<rect x="0" y="0" width="100" height="${wh}" fill="${T.wall}"/>`;
  // かべの もよう（おくの かべ）
  const bx = (x) => (g.WX(x) * 100).toFixed(2);
  if (T.wpat === "stripe") for (let i = 1; i < C * 2; i++) s += L(bx(i / 2), 0, bx(i / 2), wh, T.wline, 1);
  if (T.wpat === "fusuma") {
    for (let i = 1; i < C; i++) s += L(bx(i), wh * 0.18, bx(i), wh, T.wline, 2);
    s += L(B, wh * 0.18, 100 - B, wh * 0.18, T.wline, 3);
    for (let i = 0; i < C; i++) s += `<circle cx="${bx(i + 0.85)}" cy="${(wh * 0.62).toFixed(2)}" r="0.9" fill="${T.wline}"/>`;
  }
  if (T.wpat === "wainscot") {
    for (let i = 0; i < C * 3; i += 2) s += `<rect x="${bx(i / 3)}" y="0" width="${((1 - 2 * RG.B) * 100 / (C * 3)).toFixed(2)}" height="${wh}" fill="${T.wline}" opacity=".45"/>`;
    s += `<rect x="0" y="${(wh * 0.7).toFixed(2)}" width="100" height="${(wh * 0.3).toFixed(2)}" fill="#a77b56"/>` + L(0, wh * 0.7, 100, wh * 0.7, "#7d5638", 2);
  }
  if (T.wpat === "grid") { for (let i = 1; i < C * 2; i++) s += L(bx(i / 2), 0, bx(i / 2), wh); for (let j = 1; j < 4; j++) s += L(B, (wh * j) / 4, 100 - B, (wh * j) / 4); }
  if (T.wpat === "panel") { s += L(B, wh * 0.4, 100 - B, wh * 0.4, T.wline, 2); for (let i = 1; i < C; i++) s += L(bx(i), 0, bx(i), wh, T.wline, 2); }
  if (T.wpat === "brick") for (let j = 0; j < 5; j++) { const y = (wh * j) / 5; s += L(0, y, 100, y); for (let i = 0; i <= C * 2; i++) { const x = bx(i / 2 + (j % 2 ? 0.25 : 0)); s += L(x, y, x, y + wh / 5); } }
  // よこの かべ（ななめ）
  s += `<polygon points="0,0 ${B},0 ${B},${wh} 0,100" fill="${T.side}"/><polygon points="100,0 ${100 - B},0 ${100 - B},${wh} 100,100" fill="${T.side}"/>`;
  s += `<polygon points="0,0 ${B},0 ${B},${wh} 0,100" fill="#000" opacity=".06"/><polygon points="100,0 ${100 - B},0 ${100 - B},${wh} 100,100" fill="#000" opacity=".06"/>`;
  // ゆか
  s += `<polygon points="${quad(g, 0, 0, C, R)}" fill="${T.floor}"/>`;
  const fl = (x0, t0, x1, t1, c = T.fline, w = 1) => L(g.X(x0, t0) * 100, g.Y(t0) * 100, g.X(x1, t1) * 100, g.Y(t1) * 100, c, w);
  if (T.fpat === "wood") {
    for (let i = 1; i < C * 2; i++) s += fl(i / 2, 0, i / 2, R);
    for (let r = 0; r < R * 2; r++) for (let i = r % 2; i < C * 2; i += 2) s += fl(i / 2, r / 2 + 0.5, i / 2 + 0.5, r / 2 + 0.5, T.fline, 1);
  }
  if (T.fpat === "tatami") for (let r = 0; r < R; r++) for (let x = r % 2 ? -1 : 0; x < C; x += 2) s += `<polygon points="${quad(g, Math.max(0, x), r, Math.min(C, x + 2), r + 1)}" fill="none" stroke="${T.fline}" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`;
  if (T.fpat === "tile") { for (let i = 1; i < C; i++) s += fl(i, 0, i, R); for (let r = 1; r < R; r++) s += fl(0, r, C, r); }
  if (T.fpat === "stone") for (let r = 0; r < R; r++) { s += fl(0, r, C, r); for (let i = r % 2 ? 0.5 : 1; i < C; i++) s += fl(i, r, i, r + 1); }
  if (T.fpat === "carpet") s += `<polygon points="${quad(g, 0.3, 0.3, C - 0.3, R - 0.3)}" fill="none" stroke="#f2c76b" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
  // はばき（かべと ゆかの さかい）
  s += `<polyline points="0,100 ${B},${wh} ${100 - B},${wh} 100,100" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="3" vector-effect="non-scaling-stroke"/>`;
  return s;
}

// ---------- しきもの（ラグ） ----------
function rugSVG(g, p, i) {
  const f = furnById(p.id), w = f.w || 1, h = f.h || 1, [c1, c2] = f.rc;
  const x0 = p.x + 0.08, x1 = p.x + w - 0.08, t0 = p.y + 0.08, t1 = p.y + h - 0.08;
  let s = `<g class="${RM.move === i ? "rgmove" : ""}" data-rug="${i}"><polygon points="${quad(g, x0, t0, x1, t1)}" fill="${c1}"/>`;
  if (f.pat === "stripe") for (let k = 0; k < w * 2; k += 2) s += `<polygon points="${quad(g, x0 + (k * (x1 - x0)) / (w * 2), t0, x0 + ((k + 1) * (x1 - x0)) / (w * 2), t1)}" fill="${c2}"/>`;
  if (f.pat === "border") s += `<polygon points="${quad(g, x0 + 0.15, t0 + 0.15, x1 - 0.15, t1 - 0.15)}" fill="none" stroke="${c2}" stroke-width="3" vector-effect="non-scaling-stroke"/>`;
  if (f.pat === "star") [[0.3, 0.3], [0.7, 0.55], [0.45, 0.8], [0.8, 0.2], [0.2, 0.7]].forEach(([a, b]) => { const [x, y] = pt(g, x0 + a * (x1 - x0), t0 + b * (t1 - t0)).split(","); s += `<circle cx="${x}" cy="${y}" r="0.8" fill="${c2}"/>`; });
  if (!f.pat) s += `<polygon points="${quad(g, x0 + 0.12, t0 + 0.12, x1 - 0.12, t1 - 0.12)}" fill="none" stroke="${c2}" stroke-width="2" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>`;
  return s + "</g>";
}

// ---------- かぐの くみあわせ ----------
const fw = (p) => furnById(p.id).w || 1, fh = (p) => furnById(p.id).h || 1;
// となり（ななめも）に あるか
const adjacent = (a, b) => Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + fw(a) - 1, b.x + fw(b) - 1)) <= 1 && Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + fh(a) - 1, b.y + fh(b) - 1)) <= 1;
const findPair = (L, a, bs, ok = adjacent) => { const as = [].concat(a); for (const p of L.filter((q) => as.includes(q.id) && q.y >= 0)) for (const q of L.filter((r) => bs.includes(r.id) && r.y >= 0)) if (ok(p, q)) return p; return null; };
// しゅるいで まとめた かぐの id（あたらしい ベッドや いすも くみあわせに つかえる）
const kindIds = (...ks) => FURN.filter((f) => ks.includes(fKind(f))).map((f) => f.id);
const COMBOS = [
  { id: "tv", name: "テレビタイム", em: "📺", find: (L) => findPair(L, "f_tv", SEATS, (a, b) => gapOf(a, b) <= 3 && faces(b, a, L) && faces(a, b, L)) },
  { id: "read", name: "どくしょコーナー", em: "📖", find: (L) => findPair(L, "f_shelf", kindIds("sit")) || findPair(L, "f_t2", kindIds("sit")) || findPair(L, "g_k08", kindIds("sit")) },
  { id: "tea", name: "おちゃかい", em: "🍵", find: (L) => findPair(L, "f_k4", [...kindIds("sit"), "f_k2"]) || findPair(L, "g_k03", ["g_k02", "g_k04"]) || findPair(L, "g_t08", kindIds("sit")) },
  { id: "sun", name: "ひなたぼっこ", em: "☀️", find: (L) => { for (const w of L.filter((p) => p.id === "f_window" || p.id === "f_niji")) { const q = L.find((p) => [...kindIds("sleep", "sit", "rug")].includes(p.id) && p.y >= 0 && p.y <= 1 && p.x <= w.x + 1 && p.x + fw(p) >= w.x); if (q) return q; } return null; } },
  { id: "star", name: "ほしぞら かんそく", em: "🔭", find: (L) => (L.some((p) => ["f_s1", "f_window", "f_niji"].includes(p.id)) ? L.find((p) => p.id === "f_s2") : null) },
  { id: "music", name: "おんがくかい", em: "🎹", find: (L) => findPair(L, "f_t5", [...kindIds("sit"), "f_bear"]) },
  { id: "game", name: "ゲームコーナー", em: "🎲", find: (L) => findPair(L, "f_m3", ["f_m4", "f_ball", "f_tv"]) || findPair(L, "f_m4", kindIds("sit")) },
  { id: "wa", name: "わの こころ", em: "🍡", find: (L) => (L.some((p) => p.id === "f_kake") ? L.find((p) => p.id === "f_k4" || p.id === "f_k2") : null) },
  { id: "sleep", name: "おやすみセット", em: "🌙", find: (L) => findPair(L, kindIds("sleep"), ["f_candle", "f_clock", "f_bear", ...kindIds("light")]) },
  { id: "dino", name: "きょうりゅう はかせ", em: "🦕", find: (L) => findPair(L, "f_s5", ["f_s4", "f_s3", "f_shelf"]) },
  { id: "lab", name: "じっけんしつ", em: "🧪", find: (L) => findPair(L, "f_s3", ["f_s4", "f_m5"]) },
  { id: "cozy", name: "ふかふかエリア", em: "🧸", find: (L) => { for (const r of L.filter((p) => furnById(p.id).rug)) { const q = L.find((p) => [...kindIds("sleep", "sit"), "f_bear"].includes(p.id) && p.y >= r.y && p.y < r.y + fh(r) && p.x >= r.x && p.x + fw(p) <= r.x + fw(r)); if (q) return q; } return null; } },
  { id: "garden", name: "おしろの おにわ", em: "🏯", find: (L) => findPair(L, "f_h2", ["f_plant", "f_h3", "f_h4", "f_k5", "f_h5"]) },
  { id: "party", name: "パーティー", em: "🎉", find: (L) => (L.filter((p) => ["f_balloon", "f_gift"].includes(p.id)).length >= 3 ? L.find((p) => p.id === "f_gift" || p.id === "f_balloon") : null) },
  { id: "museum", name: "ミニはくぶつかん", em: "🏛️", find: (L) => findPair(L, "f_trophy", ["f_hiken", "f_h3", "f_h4", "f_k2"]) || findPair(L, "f_hiken", ["f_h3", "f_h4"]) },
  { id: "study2", name: "べんきょうコーナー", em: "✏️", find: (L) => findPair(L, ["g_t02", "g_s04"], kindIds("sit")) },
  { id: "kotatsu", name: "こたつで ぬくぬく", em: "🍊", find: (L) => findPair(L, "g_k07", ["g_k02", "g_k04", ...kindIds("sleep")]) },
  { id: "camp", name: "キャンプごっこ", em: "🏕️", find: (L) => findPair(L, ["g_s01", "g_s07", "g_s03"], ["f_plant", "f_candle", "f_k3", "g_s05"]) },
  { id: "royal", name: "おうきゅうの へや", em: "👑", find: (L) => findPair(L, "g_h07", ["g_h08", "g_h04", "g_h05", "g_h03", "f_hiken"]) },
  { id: "post", name: "おてがみコーナー", em: "📮", find: (L) => findPair(L, "f_t3", ["f_chair", "f_t2", "f_shelf"]) },
];
const COMBO_KIRA = 5;
// その へやで できている くみあわせ（{ c: くみあわせ, p: めじるしの かぐ }）
const roomCombos = (L = roomList()) => COMBOS.map((c) => ({ c, p: c.find(L) })).filter((x) => x.p);
// はじめて できた くみあわせを おしらせ
function comboCheck() {
  const R = roomData();
  R.combos = R.combos || {};
  const neu = roomCombos().filter((x) => !R.combos[x.c.id]);
  neu.forEach((x) => { R.combos[x.c.id] = today(); });
  if (neu.length) setTimeout(() => toast(`✨ くみあわせ「${neu.map((x) => x.c.name).join("・")}」を 見つけた！ きらきら +${COMBO_KIRA * neu.length}`), 200);
}

// ---------- まどの けしき ----------
function windowHTML(niji) {
  const part = dayPart();
  const sky = { morning: ["#ffd1dc", "#bfe6ff"], day: ["#6ec6ff", "#d8f1ff"], evening: ["#ff8f5a", "#ffd27a"], night: ["#141c4a", "#34407e"] }[part];
  const deco = part === "night" ? `<i class="wmoon">🌙</i><i class="wst" style="left:20%;top:30%"></i><i class="wst" style="left:70%;top:60%"></i><i class="wst" style="left:45%;top:15%"></i>`
    : part === "evening" ? `<i class="wsun ev"></i>` : `<i class="wsun"></i><i class="wcloud"></i>`;
  return `<span class="win ${niji ? "niji" : ""}" style="--s1:${sky[0]};--s2:${sky[1]}">${deco}${niji ? `<i class="wrain"></i>` : ""}<i class="wbar"></i></span>`;
}

// ---------- へやの え ----------
function roomHTML() {
  const g = rgeo(), { C, R } = g, list = roomList();
  const f0 = RM.sel ? furnById(RM.sel) : RM.move >= 0 ? furnById(list[RM.move].id) : null;
  const placing = !!f0, part = dayPart(), skip = RM.move;
  const cells = [];
  // タップする マス（かべ・ゆか）。ゆかの マスは おくゆきに あわせた 台形
  const has = (x, y) => (!placing && itemAt(x, y) >= 0 ? "has" : "");
  for (let x = 0; x < C; x++) cells.push(`<button class="rc ${has(x, -1)} ${placing && f0.wall && fitSpot(f0, x, -1, skip) ? "ok" : ""}" data-x="${x}" data-y="-1" style="left:${pc(g.WX(x))};top:0;width:${pc(g.WX(x + 1) - g.WX(x))};height:${pc(g.WH)}" onclick="roomTap(${x},-1)"></button>`);
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
    const tl = g.X(x, y), tr = g.X(x + 1, y), bl = g.X(x, y + 1), br = g.X(x + 1, y + 1), top = g.Y(y), bot = g.Y(y + 1);
    const l = Math.min(tl, bl), r = Math.max(tr, br), W = r - l;
    const cp = `polygon(${pc((tl - l) / W)} 0, ${pc((tr - l) / W)} 0, ${pc((br - l) / W)} 100%, ${pc((bl - l) / W)} 100%)`;
    const ok = placing && !f0.wall && !!fitSpot(f0, x, y, skip);
    cells.push(`<button class="rc fl ${has(x, y)} ${ok ? "ok" : ""} ${placing ? "show" : ""}" data-x="${x}" data-y="${y}" style="left:${pc(l)};top:${pc(top)};width:${pc(W)};height:${pc(bot - top)};clip-path:${cp}" onclick="roomTap(${x},${y})"></button>`);
  }
  const combos = roomCombos(list), comboAt = new Map(combos.map((x) => [x.p, x.c]));
  const hasCombo = (id) => combos.some((x) => x.c.id === id);
  const glows = [];
  // かぐ（ラグは え の 中に かく）
  const items = list.map((p, i) => {
    const f = furnById(p.id), w = f.w || 1;
    if (f.rug || p.x + w > C || p.y >= R) return "";
    const d = effDir(p, list);
    let inner = f.art ? furnArtSVG(f, d) : `<span class="fem"${d === 3 ? ' style="display:inline-block;transform:scaleX(-1)"' : ""}>${f.em}</span>`;
    if (p.id === "f_kake") inner = `<span class="kake">${roomData().kake ? esc(roomData().kake.slice(2)) : "？"}</span>`;
    if (p.id === "f_window" || p.id === "f_niji") inner = windowHTML(p.id === "f_niji");
    if (p.id === "f_trophy") inner = trophyShelfHTML();
    if (p.id === "f_okaeri") inner += `<i class="fheart">💗</i>`;
    if (p.id === "f_tv" && hasCombo("tv") && d === 0) inner += `<i class="tvon"></i>`;
    if (p.id === "f_k4" && hasCombo("tea")) inner += `<i class="steam">♨️</i>`;
    const c = comboAt.get(p);
    const tag = c ? `<i class="ctag">${c.em}</i>` : "";
    if (p.y < 0) {
      // かべの かぐ：おくの かべの まんなかの たかさ
      const cx = g.WX(p.x + w / 2), cw = (g.WX(1) - g.WX(0)) * 0.86;
      if (["f_k1", "f_window", "f_niji"].includes(p.id)) glows.push({ x: cx, y: g.WH * 0.5, r: cw * (p.id === "f_k1" ? 2.4 : 2.8), c: p.id === "f_k1" ? "255,150,80" : part === "night" ? "120,150,255" : "255,245,200", k: p.id === "f_k1" ? "lamp" : "win" });
      return `<div class="fi wall ${RM.move === i ? "moving" : ""}" data-i="${i}" style="left:${pc(cx)};top:${pc(g.WH * 0.48)};--fw:${(cw * w).toFixed(4)};--w:${w};z-index:20">${inner}${tag}</div>`;
    }
    // ゆかの かぐ：マスの すこし てまえに たてる。おくほど 小さい
    const ta = p.y + 0.82, cx = g.X(p.x + w / 2, ta), cw = g.cw(ta);
    if (f.glow) glows.push({ x: cx, y: g.Y(ta) - (cw * 0.6 * C) / g.H, r: cw * 2.6, c: f.glow, k: "lamp" });
    if (p.id === "f_candle" || p.id === "f_tv" && hasCombo("tv")) glows.push({ x: cx, y: g.Y(ta) - (cw * 0.5 * C) / g.H, r: cw * (p.id === "f_tv" ? 1.6 : 2.2), c: p.id === "f_tv" ? "140,200,255" : "255,170,80", k: "lamp" });
    return `<div class="fi ${w > 1 ? "w2" : ""} ${f.art ? "art" : ""} ${f.shine ? "shine" : ""} ${f.rainbow ? "rainbow" : ""} ${p.id === "f_trophy" ? "tshelf" : ""} ${RM.move === i ? "moving" : ""} ${RM.rot === i ? "rotating" : ""}" data-i="${i}" style="left:${pc(cx)};top:${pc(g.Y(ta))};--fw:${(cw * w).toFixed(4)};--w:${w};z-index:${100 + Math.round(ta * 10)}"><i class="fsh"></i>${inner}${tag}</div>`;
  }).join("");
  // まどからの ひかり（ゆかに さしこむ）
  let beams = "";
  if (part !== "night") list.filter((p) => (p.id === "f_window" || p.id === "f_niji") && p.y < 0).forEach((p) => {
    const xl = g.WX(p.x + 0.2) * 100, xr = g.WX(p.x + 0.8) * 100, yw = g.WH * 100 * 0.78;
    const col = part === "evening" ? "#ffb070" : "#fff6c8";
    beams += `<polygon points="${xl},${yw} ${xr},${yw} ${pt(g, p.x + 1.5, 2.2)} ${pt(g, p.x + 0.6, 2.2)}" fill="${col}" opacity="${part === "evening" ? 0.28 : 0.32}" class="beam"/>`;
  });
  const rugs = list.map((p, i) => (furnById(p.id).rug && p.x + (furnById(p.id).w || 1) <= C && p.y + (furnById(p.id).h || 1) <= R ? rugSVG(g, p, i) : "")).join("");
  // ぷにまると なかま（あるきまわる）
  const pets = roomPetList().map((u) => { const pet = S.pets.find((p) => p.u === u); return pet ? `<div class="ract rpet" onclick="roomTalk(this,${u})"><span class="rbody">${petSp(pet.sp).em}</span><i class="fsh"></i></div>` : ""; }).join("");
  // あかり・きらきら
  const night = part === "night" ? 0.32 : part === "evening" ? 0.12 : 0;
  const glowHTML = glows.map((o) => `<i class="glow ${o.k}" style="left:${pc(o.x)};top:${pc(o.y)};width:${pc(o.r)};--gc:${o.c};opacity:${o.k === "win" && part !== "night" ? 0.55 : part === "night" ? 1 : 0.7}"></i>`).join("");
  const nSpark = Math.min(14, Math.floor(kiraScore() / 12));
  let sparks = "";
  for (let i = 0; i < nSpark; i++) sparks += `<i class="spark" style="left:${(8 + ((i * 37) % 84))}%;top:${(12 + ((i * 53) % 80))}%;animation-delay:${((i * 0.7) % 4).toFixed(1)}s"></i>`;
  return `<div class="room ${placing ? "placing" : ""} dp-${part}" style="aspect-ratio:${C} / ${g.H.toFixed(3)}">
    <svg class="rbg" viewBox="0 0 100 100" preserveAspectRatio="none">${roomBgSVG(g)}${rugs}${beams}</svg>
    ${cells.join("")}${items}
    <div class="ract rme" onclick="roomTalk(this,0)"><span class="rbody">${charSVG(S.eq, S.color)}</span><i class="fsh"></i></div>${pets}
    <i class="rshade" style="--night:${night}"></i><div class="rglows">${glowHTML}</div><div class="rsparks">${sparks}</div>
  </div>`;
}

// できている くみあわせの いちらん（へやの 下）
function comboStrip() {
  const c = roomCombos();
  if (!c.length && roomList().length < 3) return "";
  return `<div class="combos">${c.length ? c.map((x) => `<span>${x.c.em} ${x.c.name}</span>`).join("") : `<small>かぐを くみあわせて おくと ✨ くみあわせ ボーナス！（どんな くみあわせが あるかな？）</small>`}</div>`;
}

// ---------- おく ばしょの きまり ----------
// ラグは ラグどうしだけ かさならない（ラグの 上には かぐを おける）
function canPlace(f, x, y, skip = -1) {
  const { C, R } = roomSize(), w = f.w || 1, h = f.h || 1;
  if (!!f.wall !== (y < 0) || x < 0 || x + w > C || y + h > R) return false;
  return !roomList().some((p, i) => {
    if (i === skip) return false;
    const g = furnById(p.id);
    if (!!g.rug !== !!f.rug || !!g.wall !== !!f.wall) return false;
    const pw = g.w || 1, ph = g.h || 1;
    return x < p.x + pw && p.x < x + w && y < p.y + ph && p.y < y + h;
  });
}
// タップした ところに おけるように 少し ずらす（2マスの かぐの 右はし など）
function fitSpot(f, x, y, skip = -1) {
  for (let dy = 0; dy < (f.h || 1); dy++) for (let dx = 0; dx < (f.w || 1); dx++) if (canPlace(f, x - dx, y - dy, skip)) return [x - dx, y - dy];
  return null;
}
// その マスに ある かぐ（ラグより 上の かぐを えらぶ）
function itemAt(x, y) {
  const L = roomList();
  const hit = (p) => { const f = furnById(p.id); return x >= p.x && x < p.x + (f.w || 1) && y >= p.y && y < p.y + (f.h || 1) && !!f.wall === y < 0; };
  const i = L.findIndex((p) => hit(p) && !furnById(p.id).rug);
  return i >= 0 ? i : L.findIndex(hit);
}

// ---------- あるきまわる ----------
function roomWalk() {
  clearInterval(roomTimer);
  const move = () => {
    const box = document.querySelector(".room");
    if (!box) { clearInterval(roomTimer); return; }
    const g = rgeo();
    const free = [];
    for (let y = 0; y < g.R; y++) for (let x = 0; x < g.C; x++) { const i = itemAt(x, y); if (i < 0 || furnById(roomList()[i].id).rug) free.push([x, y]); }
    // すわれる ところ（2マスの ソファは 2人まで）
    const L = roomList(), seats = [];
    L.filter((p) => SEATS.includes(p.id) && p.y >= 0).forEach((p) => { for (let k = 0; k < fw(p); k++) seats.push({ p, x: p.x + k + 0.5, d: effDir(p, L) }); });
    const taken = new Set();
    box.querySelectorAll(".ract:not(.talking)").forEach((el) => {
      const free2 = seats.filter((s) => !taken.has(s));
      if (free2.length && Math.random() < 0.35) {
        const st = pick(free2); taken.add(st);
        const t = st.p.y + 0.62;
        el.style.left = pc(g.X(st.x, t));
        // うしろ むきの ソファでは、せもたれの むこうに 頭が 見える
        const back = st.d === 2;
        el.style.top = pc(g.Y(t) - (back ? 0.06 : 0.02));
        el.style.setProperty("--fw", (g.cw(t) * (el.classList.contains("rme") ? 0.95 : 0.85)).toFixed(4));
        el.style.zIndex = 100 + Math.round((st.p.y + 0.82) * 10) + (back ? -1 : 1);
        el.classList.add("sit");
        el.classList.toggle("flip", st.d === 3 ? true : st.d === 1 ? false : Math.random() < 0.5);
        return;
      }
      el.classList.remove("sit");
      // かぐの ない マスの 中の どこか（ラグの 上は あるける）
      const c = free.length ? pick(free) : [Math.random() * (g.C - 1), Math.random() * (g.R - 1)];
      const x = c[0] + 0.3 + Math.random() * 0.4, t = c[1] + 0.45 + Math.random() * 0.4;
      el.style.left = pc(g.X(x, t));
      el.style.top = pc(g.Y(t));
      el.style.setProperty("--fw", (g.cw(t) * (el.classList.contains("rme") ? 1.05 : 0.95)).toFixed(4));
      el.style.zIndex = 100 + Math.round(t * 10);
      el.classList.toggle("flip", Math.random() < 0.5);
    });
  };
  move();
  roomTimer = setInterval(move, 2600);
}

// ---------- もようがえ ----------
function roomThemePick() {
  snd("tap");
  const cur = roomTheme();
  modal(`<div class="mtitle">🎨 もようがえ</div><p class="small">かべと ゆかの もようを かえられるよ。国の セットを そろえると ふえる！</p>
    <div class="thlist">${Object.entries(THEMES).map(([k, t]) => themeOpen(k)
      ? `<button class="${k === cur ? "on" : ""}" onclick="roomData().themes[roomData().cur]='${k}';save();closeModal();room()"><span class="thsw" style="--a:${t.wall};--b:${t.floor};--c:${t.fline}"></span>${t.icon} ${t.name}</button>`
      : `<button class="lock" onclick="toast('${WORLDS.find((w) => w.id === t.need).name}セットを ぜんぶ おくと ひらくよ')"><span class="thsw" style="--a:#ddd;--b:#bbb;--c:#aaa"></span>🔒 ？？？</button>`).join("")}</div>
    <button class="big-btn" onclick="closeModal()">とじる</button>`);
}

// かぐの アイコン（ラグは いろの みほん）
const fIcon = (f) => (f.art ? `<span class="ficon ${f.rainbow ? "rainbow" : ""}">${furnArtSVG(f)}</span>` : f.rug ? `<span class="rugsw" style="--a:${f.rc[0]};--b:${f.rc[1]}"></span>` : f.em);

// ---------- トロフィーだな ----------
// もらった じゅんに たからものを よこに ならべる（ふえたら 2だんに）
function trophyShelfHTML() {
  const got = TREASURES.filter((t) => (S.treasures || {})[t.id]).sort((a, b) => S.treasures[a.id] - S.treasures[b.id]);
  const per = got.length > 6 ? Math.ceil(got.length / 2) : Math.max(3, got.length);
  const rows = got.length > 6 ? [got.slice(0, per), got.slice(per)] : [got];
  return `<span class="tshelf-in" style="--per:${per}">${rows.map((r) => `<span class="tsrow">${r.map((t) => `<span class="tsone">${treasureSVG(t, false)}</span>`).join("") || `<small class="tsempty">まだ からっぽ</small>`}</span>`).join("")}</span>`;
}

// ---------- ドラッグで かぐを うごかす ----------
// かぐの ある マスを おして うごかすと ドラッグ。うごかさずに はなすと いつもの タップ（メニュー）
let RD = null, roomDragEnd = 0;
function roomDragInit() {
  const box = document.querySelector(".room");
  if (!box || RM.sel || RM.move >= 0 || RM.rot >= 0) return;
  box.addEventListener("pointerdown", (e) => {
    const c = e.target.closest(".rc.has");
    if (!c || e.button > 0) return;
    const x = +c.dataset.x, y = +c.dataset.y, i = itemAt(x, y);
    if (i < 0) return;
    RD = { i, x, y, sx: e.clientX, sy: e.clientY, on: false, id: e.pointerId, tx: null, ty: null };
  });
  box.addEventListener("pointermove", (e) => {
    if (!RD || e.pointerId !== RD.id) return;
    if (!RD.on) {
      if (Math.hypot(e.clientX - RD.sx, e.clientY - RD.sy) < 8) return;
      dragStart(box);
    }
    e.preventDefault();
    dragMove(box, e);
  });
  const end = (e) => {
    if (!RD || e.pointerId !== RD.id) return;
    const d = RD; RD = null;
    if (!d.on) return; // うごかして いない → クリック（タップ）として あつかう
    roomDragEnd = Date.now();
    const p = roomList()[d.i], f = furnById(p.id);
    const sp = d.tx === null ? null : fitSpot(f, d.tx, d.ty, d.i);
    if (sp && (sp[0] !== p.x || sp[1] !== p.y)) { p.x = sp[0]; p.y = sp[1]; snd("ok"); afterPlace(); }
    else { if (d.tx !== null && !sp) { snd("ng"); toast("そこには おけないよ"); } room(); }
  };
  box.addEventListener("pointerup", end);
  box.addEventListener("pointercancel", (e) => { if (RD && RD.on) { RD = null; room(); } else RD = null; });
}
function dragStart(box) {
  RD.on = true;
  const p = roomList()[RD.i], f = furnById(p.id);
  try { box.setPointerCapture(RD.id); } catch (err) { /* うごかなくても よい */ }
  box.classList.add("dragging");
  // うごかす かぐを うすく、おける マスを みどりに
  const el = box.querySelector(`.fi[data-i="${RD.i}"], g[data-rug="${RD.i}"]`);
  if (el) el.classList.add(el.tagName === "g" ? "rgmove" : "moving");
  box.querySelectorAll(".rc").forEach((c) => c.classList.toggle("ok", !!fitSpot(f, +c.dataset.x, +c.dataset.y, RD.i)));
  const gh = document.createElement("div");
  gh.className = "rdrag";
  gh.innerHTML = fIcon(f);
  box.appendChild(gh);
  RD.gh = gh;
  snd("tap");
}
function dragMove(box, e) {
  const r = box.getBoundingClientRect();
  RD.gh.style.left = `${e.clientX - r.left}px`;
  RD.gh.style.top = `${e.clientY - r.top}px`;
  // ゆびの 下の マス（かぐや なかまは すどおり）
  const hit = document.elementsFromPoint(e.clientX, e.clientY).find((n) => n.classList && n.classList.contains("rc"));
  box.querySelectorAll(".rc.tgt").forEach((c) => c.classList.remove("tgt"));
  if (hit) { hit.classList.add("tgt"); RD.tx = +hit.dataset.x; RD.ty = +hit.dataset.y; } else { RD.tx = RD.ty = null; }
}
