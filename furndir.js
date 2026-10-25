// ===== かぐの むき =====
// d：0＝まえ（こちら むき）、1＝みぎ むき、2＝うしろ むき（かべの ほう）、3＝ひだり むき
// ・1マスの いす・テレビ・つくえ などは 4方向、2マスの ソファは まえ・うしろ、ベッドなどは 左右反転
// ・ふつうは 近くの テレビ・つくえ・テーブル（いすなら）や いす（テレビ・つくえなら）の ほうを 自動で むく
// ・じぶんで むきを かえた かぐ（p.man）は、自動では かわらない。「じどうに もどす」で もとに もどる
"use strict";

// ---------- むきごとの 絵 ----------
const sk = (c) => fSt(c);
const FVIEW = {
  // いす（もとの 絵は よこ むき）
  chair: {
    front: (c) => `<rect x="28" y="8" width="7" height="58" fill="${fDk(c.a)}"/><rect x="65" y="8" width="7" height="58" fill="${fDk(c.a)}"/>
      <rect x="28" y="10" width="44" height="30" rx="5" fill="${c.b || c.a}" ${sk(c.b || c.a)}/>
      <rect x="34" y="60" width="5" height="26" fill="${fDk(c.a, -0.4)}"/><rect x="61" y="60" width="5" height="26" fill="${fDk(c.a, -0.4)}"/>
      <path d="M20 56 H80 L76 68 H24Z" fill="${c.b || c.a}" ${sk(c.b || c.a)}/>
      <rect x="22" y="66" width="7" height="30" fill="${fDk(c.a)}"/><rect x="71" y="66" width="7" height="30" fill="${fDk(c.a)}"/>`,
    back: (c) => `<path d="M20 56 H80 L76 68 H24Z" fill="${c.b || c.a}" ${sk(c.b || c.a)}/>
      <rect x="22" y="66" width="7" height="30" fill="${fDk(c.a)}"/><rect x="71" y="66" width="7" height="30" fill="${fDk(c.a)}"/>
      <rect x="26" y="6" width="48" height="56" rx="5" fill="${c.a}" ${sk(c.a)}/><rect x="32" y="12" width="36" height="6" rx="3" fill="${fDk(c.a, 0.2)}"/>
      <rect x="30" y="62" width="6" height="32" fill="${fDk(c.a, -0.3)}"/><rect x="64" y="62" width="6" height="32" fill="${fDk(c.a, -0.3)}"/>`,
  },
  // ゆりいす（もとの 絵は よこ むき）
  rocking: {
    front: (c) => FVIEW.chair.front({ a: c.a, b: c.b }) + `<path d="M12 94 Q50 102 88 94" fill="none" stroke="${fDk(c.a)}" stroke-width="6" stroke-linecap="round"/>`,
    back: (c) => FVIEW.chair.back({ a: c.a, b: c.b }) + `<path d="M12 94 Q50 102 88 94" fill="none" stroke="${fDk(c.a)}" stroke-width="6" stroke-linecap="round"/>`,
  },
  // おうさまの いす（もとの 絵は まえ むき）
  throne: {
    back: (c) => `<rect x="18" y="58" width="64" height="14" rx="5" fill="${c.b}" ${sk(c.b)}/><path d="M24 92 V24 Q24 8 50 4 Q76 8 76 24 V92Z" fill="${c.a}" ${sk(c.a)}/>
      <path d="M34 20 Q50 12 66 20" fill="none" stroke="${fDk(c.a, 0.25)}" stroke-width="4"/><path d="M40 4 L44 -2 L50 4 L56 -2 L60 4" fill="none" stroke="${c.a}" stroke-width="3"/>`,
    side: (c) => `<path d="M18 92 V20 Q18 6 30 4 L36 4 V92Z" fill="${c.a}" ${sk(c.a)}/><rect x="30" y="58" width="52" height="14" rx="5" fill="${c.b}" ${sk(c.b)}/>
      <rect x="34" y="44" width="46" height="8" rx="4" fill="${c.a}" ${sk(c.a)}/><rect x="74" y="44" width="8" height="48" rx="3" fill="${c.a}"/><rect x="36" y="70" width="8" height="22" fill="${c.a}"/>`,
  },
  // ざいす（もとの 絵は まえ むき）
  zaisu: {
    back: (c) => `<rect x="16" y="74" width="68" height="18" rx="6" fill="${c.b}" ${sk(c.b)}/><path d="M24 28 Q24 22 30 22 H70 Q76 22 76 28 V80 H24Z" fill="${c.a}" ${sk(c.a)}/>`,
    side: (c) => `<rect x="18" y="74" width="66" height="18" rx="6" fill="${c.b}" ${sk(c.b)}/><path d="M18 30 Q18 24 24 24 L32 24 L36 80 L20 80Z" fill="${c.a}" ${sk(c.a)}/>`,
  },
  // テレビ（まえ むき）
  tv: {
    front: (c) => `<rect x="30" y="80" width="6" height="14" fill="#555"/><rect x="64" y="80" width="6" height="14" fill="#555"/>
      <line x1="40" y1="20" x2="30" y2="4" stroke="#666" stroke-width="3"/><line x1="60" y1="20" x2="70" y2="4" stroke="#666" stroke-width="3"/>
      <rect x="12" y="20" width="76" height="62" rx="8" fill="${c.a || "#c9c3d6"}" ${sk(c.a || "#c9c3d6")}/><rect x="19" y="27" width="62" height="46" rx="5" fill="${c.s || "#5fc4ee"}"/>
      <path d="M24 32 Q34 30 40 36" stroke="#fff" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>`,
    back: (c) => `<rect x="30" y="80" width="6" height="14" fill="#555"/><rect x="64" y="80" width="6" height="14" fill="#555"/>
      <line x1="40" y1="20" x2="30" y2="4" stroke="#666" stroke-width="3"/><line x1="60" y1="20" x2="70" y2="4" stroke="#666" stroke-width="3"/>
      <rect x="12" y="20" width="76" height="62" rx="8" fill="${fDk(c.a || "#c9c3d6", -0.15)}" ${sk(c.a || "#c9c3d6")}/>
      ${[34, 42, 50, 58].map((y) => `<line x1="30" y1="${y}" x2="70" y2="${y}" stroke="${fDk(c.a || "#c9c3d6", -0.35)}" stroke-width="2"/>`).join("")}`,
    side: (c) => `<rect x="44" y="80" width="6" height="14" fill="#555"/><line x1="46" y1="20" x2="52" y2="4" stroke="#666" stroke-width="3"/>
      <path d="M30 20 H58 Q66 20 66 30 V72 Q66 82 58 82 H30Z" fill="${c.a || "#c9c3d6"}" ${sk(c.a || "#c9c3d6")}/><rect x="62" y="22" width="8" height="58" rx="3" fill="${c.s || "#5fc4ee"}"/>`,
  },
  // つくえ（もとの 絵は まえ むき）
  desk: {
    back: (c) => `<rect x="8" y="40" width="84" height="9" rx="3" fill="${c.a}" ${sk(c.a)}/><rect x="12" y="49" width="76" height="40" fill="${fDk(c.a, 0.12)}" ${sk(c.a)}/>
      <rect x="12" y="88" width="7" height="8" fill="${fDk(c.a)}"/><rect x="81" y="88" width="7" height="8" fill="${fDk(c.a)}"/><rect x="58" y="28" width="22" height="12" rx="2" fill="#fff" ${sk("#ddd")}/>`,
    side: (c) => `<rect x="22" y="40" width="56" height="9" rx="3" fill="${c.a}" ${sk(c.a)}/><rect x="24" y="49" width="24" height="47" fill="${c.b || c.a}" ${sk(c.b || c.a)}/>
      <rect x="70" y="49" width="7" height="47" fill="${fDk(c.a)}"/>`,
  },
  // ソファ（もとの 絵は まえ むき）
  sofa: {
    back: (c) => `<rect x="6" y="48" width="30" height="40" rx="12" fill="${fDk(c.a, -0.1)}" ${sk(c.a)}/><rect x="164" y="48" width="30" height="40" rx="12" fill="${fDk(c.a, -0.1)}" ${sk(c.a)}/>
      <rect x="14" y="26" width="172" height="62" rx="16" fill="${c.a}" ${sk(c.a)}/><path d="M30 40 H170" stroke="${fDk(c.a, 0.2)}" stroke-width="3" stroke-linecap="round"/>
      <rect x="22" y="86" width="8" height="10" fill="${fDk(c.a, -0.4)}"/><rect x="170" y="86" width="8" height="10" fill="${fDk(c.a, -0.4)}"/>`,
  },
};
FART.tv = FVIEW.tv.front;
// いすの よこ むき（せもたれが 左、右を むいて すわる）。向きが はっきり わかる 形に かきなおす
FART.chair = (c) => `<rect x="24" y="8" width="9" height="88" rx="3" fill="${fDk(c.a)}"/><rect x="21" y="10" width="15" height="42" rx="5" fill="${c.b || c.a}" ${sk(c.b || c.a)}/>
  <rect x="24" y="56" width="58" height="11" rx="4" fill="${c.b || c.a}" ${sk(c.b || c.a)}/><rect x="72" y="64" width="7" height="32" fill="${fDk(c.a)}"/><rect x="44" y="64" width="5" height="26" fill="${fDk(c.a, -0.4)}"/>`;
// もとの 絵は どの むきか（ほかは まえ むき）
const ART_BASE = { chair: "side", rocking: "side" };

// ---------- 絵文字だった かぐを 絵に する（むきを かえられるように） ----------
[["f_chair", "chair", { a: "#8b5a2b", b: "#b5713c" }], ["f_sofa", "sofa", { a: "#3b6fd6", b: "#5d8de8" }], ["f_tv", "tv", { a: "#c9c3d6", s: "#5fc4ee" }],
  ["f_okaeri", "sofa", { a: "#ff8fb8", b: "#ffc2d9", g: "#fff" }]].forEach(([id, art, c]) => { const f = furnById(id); if (f) { f.art = art; f.c = c; } });

// ---------- むきの しゅるい ----------
const DIR4 = ["f_chair", "g_s06", "g_h01", "g_h06", "g_t03", "g_h07", "g_k04", "f_tv", "g_t02", "g_s04"];
const DIRFB = ["f_sofa", "g_t06", "g_m04", "g_h04", "f_okaeri"];
const DIRM = ["f_bed", "g_t01", "g_m02", "g_h05", "g_s08", "g_t07", "g_h08", "g_m07", "g_k01", "g_k06", "g_s01", "g_s07", "f_t5"];
const dirType = (id) => (DIR4.includes(id) ? 4 : DIRFB.includes(id) ? 2 : DIRM.includes(id) ? "m" : 0);
const DIR_NAME = ["まえ", "みぎ", "うしろ", "ひだり"];
// すわる ものと、すわって 向く もの
const SEATS = ["f_chair", "g_s06", "g_h01", "g_h06", "g_t03", "g_h07", "g_k04", "f_sofa", "g_t06", "g_m04", "g_h04", "f_okaeri", "g_k02", "g_t05", "g_m06", "g_m01", "g_s02", "g_m03", "g_m08"];
const FOCUS = ["f_tv", "g_t02", "g_s04", "f_k4", "g_k03", "g_k07", "g_t08", "g_m05", "g_h02", "f_t5"];
const SCREENS = ["f_tv", "g_t02", "g_s04"]; // いすの ほうを 向く もの

// 2つの かぐの 中心の ずれ（マス）
const cdx = (p, q) => q.x + fw(q) / 2 - (p.x + fw(p) / 2), cdy = (p, q) => q.y + fh(q) / 2 - (p.y + fh(p) / 2);
const gapOf = (p, q) => Math.max(0, Math.max(p.x, q.x) - Math.min(p.x + fw(p) - 1, q.x + fw(q) - 1), Math.max(p.y, q.y) - Math.min(p.y + fh(p) - 1, q.y + fh(q) - 1));
// p から q を 見た むき
function dirTo(p, q, type) {
  const dx = cdx(p, q), dy = cdy(p, q);
  if (type === 2) return dy < -0.01 ? 2 : 0;
  if (Math.abs(dy) >= Math.abs(dx) && Math.abs(dy) > 0.01) return dy < 0 ? 2 : 0;
  if (Math.abs(dx) > 0.01) return dx > 0 ? 1 : 3;
  return 0;
}
// 自動の むき：いすは 近くの テレビ・つくえ・テーブル、テレビ・つくえは 近くの いすの ほう
function autoDir(p, L) {
  const t = dirType(p.id);
  if (!t || t === "m" || p.y < 0) return 0;
  const isSeat = SEATS.includes(p.id), isScreen = SCREENS.includes(p.id);
  const cands = L.filter((q) => q !== p && q.y >= 0 && (isSeat ? FOCUS.includes(q.id) : isScreen ? SEATS.includes(q.id) : false));
  let best = null, bd = Infinity;
  cands.forEach((q) => {
    const g = gapOf(p, q);
    let d = g * 10 + Math.abs(cdx(p, q)) + Math.abs(cdy(p, q));
    // テレビ・つくえは、まえに ある いす・大きい ソファを ゆうせん
    if (isScreen) d += (fw(q) > 1 ? 0 : 100) + (cdy(p, q) > 0 ? 0 : 50);
    // テレビは はなれて 見るので 3マスまで、ほかは 2マスまで
    const range = q.id === "f_tv" || p.id === "f_tv" ? 3 : 2;
    if (g <= range && d < bd) { bd = d; best = q; }
  });
  return best ? dirTo(p, best, t) : 0;
}
// いまの むき（じぶんで きめた むき が あれば それ）
const effDir = (p, L = roomList()) => (p.man ? p.d || 0 : autoDir(p, L));
// p が q の ほうを 向いているか
const faces = (p, q, L) => { const t = dirType(p.id); return !t || t === "m" ? true : effDir(p, L) === dirTo(p, q, t); };
// つぎの むき
function nextDir(id, d) {
  const t = dirType(id);
  return t === 4 ? (d + 1) % 4 : t === 2 ? (d === 0 ? 2 : 0) : t === "m" ? (d === 3 ? 0 : 3) : 0;
}

// ---------- むきに あわせた 絵 ----------
function furnArtSVG(f, d = 0) {
  const w = f.w || 1, V = FVIEW[f.art] || {};
  let view = "front", mirror = false;
  if (d === 3) mirror = true;
  if (d === 2) view = "back";
  if (d === 1 || d === 3) view = dirType(f.id) === "m" ? "front" : "side";
  // もとの 絵の むき（いすは もとが よこ むき）
  const base = ART_BASE[f.art] || "front";
  let draw = FART[f.art];
  if (view !== base) draw = V[view] || (view === "side" && base === "front" ? FART[f.art] : FART[f.art]);
  return `<svg class="fart" viewBox="0 -8 ${w * 100} 108" preserveAspectRatio="xMidYMax meet"${mirror ? ' style="transform:scaleX(-1)"' : ""}>${draw(f.c)}</svg>`;
}
