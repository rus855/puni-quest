// ===== アクセサリー・全身いしょうの 絵 =====
// charSVG（app.js）から よばれる。座標は キャラの 絵（からだの 中心 100,112 半径 62）に あわせている
"use strict";

// 小さな 星（gear.js 用）
const gStar = (x, y, r, c) => `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}Z" fill="${c}"/>`;
const gHeart = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 6 C-10 -2 -8 -10 -3 -10 C-1 -10 0 -8 0 -7 C0 -8 1 -10 3 -10 C8 -10 10 -2 0 6Z" fill="${c}"/>`;
const gBolt = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M2 -14 L-7 2 L-1 2 L-4 14 L7 -3 L1 -3Z" fill="${c}" stroke="#e0a000" stroke-width="1.2" stroke-linejoin="round"/>`;

// うしろに かく もの（オーラ・マント・のりもの・よろいの 背景）
function backSVG(x, a) {
  let s = "";
  // よろいの 背景
  if (a && a.bg === "bolt") s += [[-2, 60, 1.6], [196, 70, 1.5], [10, 150, 1.1], [190, 150, 1.2], [30, 20, 1], [172, 18, 1]].map(([px, py, k]) => gBolt(px, py, k, "#ffe14d")).join("");
  if (a && a.bg === "stars") s += [[0, 40, 7], [20, 100, 5], [190, 50, 8], [200, 120, 5], [12, 160, 6], [185, 165, 6], [40, 10, 4], [165, 8, 5]].map(([px, py, r]) => gStar(px, py, r, "#fff59d")).join("") + `<circle cx="100" cy="110" r="92" fill="#7986cb" opacity=".18"/>`;
  if (!x || !x.acc) return s;
  switch (x.acc) {
    case "hearts": s += [[5, 70, 1.4], [195, 80, 1.3], [20, 150, 1], [180, 155, 1.1], [30, 15, 1], [170, 20, 1.2]].map(([px, py, k]) => gHeart(px, py, k, "#ff7eb3")).join(""); break;
    case "fireaura": s += `<path d="M100 196 C40 196 18 150 30 110 C36 130 46 132 46 132 C38 92 58 60 78 40 C76 64 86 72 86 72 C88 40 104 18 122 4 C116 36 132 52 132 52 C138 40 148 34 156 28 C150 58 166 76 166 76 C172 66 176 58 178 50 C196 92 188 196 100 196Z" fill="#ff7043" opacity=".85"/>
      <path d="M100 190 C56 190 40 156 50 126 C58 142 64 142 64 142 C60 110 76 86 92 70 C92 92 100 98 100 98 C104 76 118 62 130 54 C128 76 140 92 140 92 C146 84 150 78 154 72 C166 108 156 190 100 190Z" fill="#ffca28" opacity=".9"/>`; break;
    case "gold": s += `<defs><radialGradient id="gglow"><stop offset="0" stop-color="#fff6c2"/><stop offset=".6" stop-color="#ffd54f" stop-opacity=".7"/><stop offset="1" stop-color="#ffd54f" stop-opacity="0"/></radialGradient></defs>
      <circle cx="100" cy="112" r="100" fill="url(#gglow)"/>${[[10, 40, 7], [190, 40, 8], [0, 120, 6], [200, 130, 6], [30, 175, 5], [172, 178, 5]].map(([px, py, r]) => gStar(px, py, r, "#fff")).join("")}`; break;
    case "rainbow": s += ["#ff5252", "#ffab40", "#ffee58", "#69f0ae", "#40c4ff", "#b388ff"].map((c, i) => `<path d="M${-6 + i * 7} 150 A${106 - i * 7} ${106 - i * 7} 0 0 1 ${206 - i * 7} 150" fill="none" stroke="${c}" stroke-width="7" opacity=".85"/>`).join(""); break;
    case "cape": s += `<path d="M58 96 Q100 108 142 96 L172 186 Q100 200 28 186Z" fill="#d32f2f" stroke="#8e1b1b" stroke-width="2.5" stroke-linejoin="round"/><path d="M58 96 Q100 108 142 96 L150 116 Q100 126 50 116Z" fill="#b71c1c"/>`; break;
    // のりもの（足の 下）
    case "skate": s += `<rect x="36" y="181" width="128" height="9" rx="4.5" fill="#ff7043" stroke="#bf360c" stroke-width="1.5"/><circle cx="60" cy="195" r="6" fill="#455a64"/><circle cx="140" cy="195" r="6" fill="#455a64"/>`; break;
    case "cloud": s += [[52, 184, 18], [78, 190, 20], [122, 190, 20], [148, 184, 18], [100, 182, 18], [28, 190, 12], [172, 190, 12]].map(([px, py, r]) => `<circle cx="${px}" cy="${py}" r="${r}" fill="#fff" stroke="#bbdefb" stroke-width="2"/>`).join("") + [[52, 184, 18], [78, 190, 20], [122, 190, 20], [148, 184, 18], [100, 182, 18]].map(([px, py, r]) => `<circle cx="${px}" cy="${py}" r="${r - 2}" fill="#fff"/>`).join(""); break;
    case "broom": s += `<g transform="rotate(-6 100 186)"><rect x="-2" y="182" width="176" height="7" rx="3.5" fill="#8d6e63"/><path d="M172 176 L212 166 L214 204 L172 194Z" fill="#ffcc80" stroke="#e0a050" stroke-width="2"/><path d="M180 178 L208 172 M180 186 L210 186 M180 192 L208 198" stroke="#e0a050" stroke-width="1.5"/></g>${gStar(-2, 168, 6, "#fff59d")}${gStar(14, 196, 4, "#fff59d")}`; break;
    case "rocket": s += `<path d="M14 176 L150 176 Q196 186 150 198 L14 198Z" fill="#eceff1" stroke="#90a4ae" stroke-width="2.5"/><path d="M150 176 Q196 186 150 198Z" fill="#ef5350"/><circle cx="128" cy="187" r="6" fill="#4fc3f7" stroke="#0277bd" stroke-width="2"/>
      <path d="M14 176 L-2 164 L28 176Z M14 198 L-2 210 L28 198Z" fill="#ef5350"/><path d="M14 180 L-10 187 L14 194Z" fill="#ffca28"/>`; break;
    case "whale": s += `<path d="M2 168 Q-8 150 6 140 Q10 158 20 166Z" fill="#3d8bd9"/><ellipse cx="104" cy="182" rx="94" ry="17" fill="#5aa9e6"/><ellipse cx="110" cy="190" rx="70" ry="8" fill="#d6ecff"/>
      <circle cx="184" cy="176" r="3.5" fill="#1c2b4a"/><path d="M196 166 q4 -14 -2 -24 M196 166 q10 -8 12 -18 M196 166 q-8 -10 -14 -14" stroke="#81d4fa" stroke-width="3" fill="none" stroke-linecap="round"/>`; break;
    case "horse": s += `<path d="M20 176 Q4 186 8 198" stroke="#5d4037" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="100" cy="182" rx="82" ry="15" fill="#a1714f"/>
      <path d="M40 194 l-3 8 M70 196 l0 6 M130 196 l0 6 M160 194 l3 8" stroke="#6d4c41" stroke-width="6" stroke-linecap="round"/>
      <path d="M168 176 Q176 146 196 140 Q214 146 212 160 Q206 168 194 166 Q186 182 176 186Z" fill="#a1714f"/><path d="M172 170 Q178 142 196 136 L190 148 Q182 156 180 170Z" fill="#5d4037"/><circle cx="200" cy="152" r="2.5" fill="#2b2140"/>`; break;
    case "dragon": s += `<path d="M62 92 Q10 40 -6 70 Q14 74 6 96 Q26 92 24 112 Q44 104 62 118Z" fill="#43a047" stroke="#1b5e20" stroke-width="2"/><path d="M138 92 Q190 40 206 70 Q186 74 194 96 Q174 92 176 112 Q156 104 138 118Z" fill="#43a047" stroke="#1b5e20" stroke-width="2"/>
      <path d="M22 180 Q-6 176 -8 196 Q8 186 22 192Z" fill="#2e7d32"/><ellipse cx="100" cy="182" rx="84" ry="15" fill="#4caf50"/><ellipse cx="104" cy="189" rx="60" ry="7" fill="#c5e1a5"/>
      <path d="M170 178 Q182 146 202 146 Q216 154 210 168 Q200 174 186 172 Q182 184 176 188Z" fill="#4caf50"/><path d="M196 146 l2 -12 l6 10Z" fill="#fff59d"/><circle cx="202" cy="157" r="2.5" fill="#2b2140"/>`; break;
  }
  return s;
}

// 顔に つける もの（目の 上に かく）
function faceSVG(x) {
  if (!x || !x.acc) return "";
  switch (x.acc) {
    case "tear": return `<path d="M80 114 q-6 12 0 18 q6 -6 0 -18Z M120 114 q-6 12 0 18 q6 -6 0 -18Z" fill="#4fc3f7" stroke="#0288d1" stroke-width="1.2"/><path d="M76 112 q8 4 16 0 M108 112 q8 4 16 0" stroke="#4fc3f7" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case "heart": return `${gHeart(84, 101, 1.45, "#ff3d71")}${gHeart(116, 101, 1.45, "#ff3d71")}<circle cx="80" cy="94" r="2.5" fill="#fff"/><circle cx="112" cy="94" r="2.5" fill="#fff"/>`;
    case "kirame": return `${gStar(84, 99, 11, "#ffd54f")}${gStar(116, 99, 11, "#ffd54f")}${gStar(84, 99, 5, "#fff")}${gStar(116, 99, 5, "#fff")}${gStar(64, 80, 4, "#fff59d")}${gStar(138, 82, 4, "#fff59d")}`;
    case "guru": return [84, 116].map((cx) => `<circle cx="${cx}" cy="100" r="11" fill="#fff" stroke="#2b2140" stroke-width="2"/><path d="M${cx} 100 m0 -1 a1.5 1.5 0 1 1 -1.5 2 a4 4 0 1 1 5 -4 a7 7 0 1 1 -8.5 7" fill="none" stroke="#2b2140" stroke-width="2" stroke-linecap="round"/>`).join("");
    case "mayu": return `<path d="M70 80 L97 88" stroke="#2b2140" stroke-width="6" stroke-linecap="round"/><path d="M130 80 L103 88" stroke="#2b2140" stroke-width="6" stroke-linecap="round"/>`;
    case "band": return `<g transform="rotate(-25 134 120)"><rect x="120" y="114" width="28" height="11" rx="5" fill="#ffd7b0" stroke="#e0a87a" stroke-width="1.5"/><rect x="129" y="114" width="10" height="11" fill="#f5c193"/></g>`;
  }
  return "";
}

// からだ ぜんぶが かわる いしょう（からだの 丸の 中に かく）。face は 顔の 色
function fullSVG(a, face) {
  const c = a.color, d = shade(c, -0.25), hole = (rx = 44, ry = 31, y = 103) => `<ellipse cx="100" cy="${y}" rx="${rx}" ry="${ry}" fill="${face}"/>`;
  switch (a.full) {
    case "bear": return `<rect x="30" y="40" width="140" height="150" fill="${c}"/><ellipse cx="100" cy="156" rx="34" ry="24" fill="#e8c9a8"/>${hole(42, 30)}<ellipse cx="100" cy="76" rx="16" ry="6" fill="${d}" opacity=".35"/>`;
    case "swim": return `<rect x="30" y="128" width="140" height="70" fill="${c}"/>${[136, 150, 164, 178].map((y) => `<rect x="30" y="${y}" width="140" height="6" fill="#fff" opacity=".8"/>`).join("")}`;
    case "ninja": return `<rect x="30" y="40" width="140" height="150" fill="${c}"/><rect x="48" y="84" width="104" height="34" rx="15" fill="${face}"/><rect x="30" y="140" width="140" height="10" fill="#c62828"/>`;
    case "knight": return `<rect x="30" y="40" width="140" height="150" fill="${c}"/>${[64, 140, 160].map((y) => `<path d="M30 ${y} Q100 ${y + 10} 170 ${y}" stroke="${d}" stroke-width="3" fill="none"/>`).join("")}
      <rect x="58" y="82" width="84" height="44" rx="14" fill="${face}" stroke="${d}" stroke-width="3"/>${[[56, 150], [144, 150], [100, 172], [70, 70], [130, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#eceff1" stroke="${d}"/>`).join("")}
      <path d="M100 130 L100 186" stroke="#ffd54f" stroke-width="6"/><path d="M84 150 L116 150" stroke="#ffd54f" stroke-width="6"/>`;
    case "robot": return `<rect x="30" y="40" width="140" height="150" fill="${c}"/><rect x="58" y="78" width="84" height="50" rx="10" fill="#e0f7fa" stroke="#546e7a" stroke-width="3"/>
      <rect x="74" y="140" width="52" height="28" rx="6" fill="#455a64"/><circle cx="86" cy="150" r="4" fill="#ff5252"/><circle cx="100" cy="150" r="4" fill="#ffd23f"/><circle cx="114" cy="150" r="4" fill="#69f0ae"/><rect x="82" y="158" width="36" height="4" rx="2" fill="#80deea"/>
      ${[[48, 70], [152, 70], [44, 150], [156, 150]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#cfd8dc" stroke="#546e7a"/>`).join("")}`;
    case "bolt": return `<rect x="30" y="40" width="140" height="150" fill="${c}"/><path d="M30 132 L170 132" stroke="${d}" stroke-width="4"/>${hole(44, 30, 102)}${gBolt(100, 160, 1.6, "#fff59d")}${gBolt(62, 158, 0.8, "#fff")}${gBolt(138, 158, 0.8, "#fff")}`;
    case "starry": return `<rect x="30" y="40" width="140" height="150" fill="${c}"/>${hole(44, 30, 102)}${[[60, 150, 5], [90, 168, 4], [124, 152, 6], [150, 172, 4], [70, 176, 3], [136, 136, 3], [52, 128, 3]].map(([x, y, r]) => gStar(x, y, r, "#fff59d")).join("")}`;
  }
  return "";
}
// からだの 外に はみ出す ぶぶん（耳・うきわ・アンテナなど）
function fullOutSVG(a) {
  switch (a.full) {
    case "bear": return `<circle cx="56" cy="62" r="17" fill="${a.color}" stroke="${shade(a.color, -0.3)}" stroke-width="2.5"/><circle cx="56" cy="62" r="8" fill="#e8a5a5"/><circle cx="144" cy="62" r="17" fill="${a.color}" stroke="${shade(a.color, -0.3)}" stroke-width="2.5"/><circle cx="144" cy="62" r="8" fill="#e8a5a5"/>`;
    case "swim": return `<ellipse cx="100" cy="150" rx="74" ry="15" fill="none" stroke="#fff" stroke-width="14"/><ellipse cx="100" cy="150" rx="74" ry="15" fill="none" stroke="#ff5252" stroke-width="14" stroke-dasharray="26 26"/><ellipse cx="100" cy="150" rx="74" ry="15" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="1.5"/>`;
    case "ninja": return `<path d="M158 92 Q178 86 186 74 M158 98 Q180 100 190 90" stroke="${a.color}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    case "knight": return `<path d="M100 52 Q96 26 112 14 Q110 32 120 40 Q108 42 104 52Z" fill="#e53935" stroke="#b71c1c" stroke-width="2"/>`;
    case "robot": return `<path d="M100 51 L100 28" stroke="#546e7a" stroke-width="4"/><circle cx="100" cy="24" r="6" fill="#ff5252" stroke="#b71c1c" stroke-width="2"/>`;
  }
  return "";
}
// 頭の はっぱを かくす いしょう
const fullHidesSprout = (a) => ["bear", "ninja", "knight", "robot"].includes(a.full);

// そうびの とくしゅ能力を あわせる（アクセサリーの のうりょくも くわえる）
function mergeSp(base, extra, keys) {
  const r = Object.assign({}, base || {});
  Object.entries(extra || {}).forEach(([k, v]) => {
    if (keys && !keys.includes(k)) return;
    if (typeof v === "number") r[k] = k === "egg" ? (r[k] || 1) * v : (r[k] || 0) + v;
    else r[k] = r[k] || v;
  });
  return r;
}
