// ===== ぷにまるクエスト：ゲーム本体 =====
"use strict";

const SAVE_KEY = "puniquest_save_v1";
const KFONT = '"Hiragino Maru Gothic ProN","Hiragino Sans","Yu Gothic","Meiryo",sans-serif';
const BODY_COLORS = ["#ffc4dd", "#bdf0d8", "#fff0a8", "#c6e2ff", "#e3d0ff"];
// からだの色ごとの足の色
const FEET = { "#ffc4dd": "#ff6f91", "#bdf0d8": "#3cbf86", "#fff0a8": "#ffad33", "#c6e2ff": "#4f95f0", "#e3d0ff": "#a070f0" };

// ---------- 小さな道具 ----------
const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const itemById = (id) => ITEMS.find((x) => x.id === id);
const kanjiOf = (id) => KANJI.find((x) => x.k === id.slice(2));
const formulaOf = (id) => FORMULAS.find((x) => x.id === id.slice(2));
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => dateKey(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dateKey(d); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- セーブデータ ----------
function newSave() {
  return {
    v: 1, name: "", color: BODY_COLORS[0], coins: 150, gems: 0, sound: true,
    owned: ["w_stick", "a_cloth", "h_none"], eq: { weapon: "w_stick", armor: "a_cloth", hat: "h_none" },
    cards: {}, cleared: {}, stats: { tot: 0, cor: 0, days: {} },
    daily: { date: "", prog: {}, claimed: {}, ngGems: 0 }, login: { last: "", streak: 0 }, tut: {},
  };
}
let S;
function load() {
  try {
    const t = localStorage.getItem(SAVE_KEY);
    if (t) { S = Object.assign(newSave(), JSON.parse(t)); return; }
  } catch (e) { /* 保存できない環境でも遊べるようにする */ }
  S = newSave();
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* 無視 */ } }

// 毎日ミッションの日付切りかえ
function ensureDaily() {
  if (S.daily.date !== today()) S.daily = { date: today(), prog: {}, claimed: {}, ngGems: 0 };
}
function addProg(key, n = 1) { ensureDaily(); S.daily.prog[key] = (S.daily.prog[key] || 0) + n; }

// ---------- ステータス ----------
const totalStars = () => Object.values(S.cards).reduce((a, c) => a + c.s, 0);
const pAtk = () => 8 + itemById(S.eq.weapon).atk;
const pDef = () => itemById(S.eq.armor).def;
const pMaxHp = () => 100 + itemById(S.eq.hat).hp + totalStars();

// ---------- カード（間隔をあけた反復で★が上がる） ----------
function card(id) { return S.cards[id] || (S.cards[id] = { s: 0, last: "", ng: false, st: 0, cor: 0, tot: 0 }); }

function recordStat(ok) {
  const d = today();
  S.stats.tot++; if (ok) S.stats.cor++;
  const day = S.stats.days[d] || (S.stats.days[d] = { tot: 0, cor: 0 });
  day.tot++; if (ok) day.cor++;
}

// 正解：はじめて→★1、ちがう日にまた正解→★+1（同じ日は上がらない）
// ニガテ状態のカードは、2回正解するとニガテ解除（解除するまで★は上がらない）
function onCorrect(id) {
  const c = card(id), d = today();
  c.cor++; c.tot++; recordStat(true); addProg("correct10");
  let ev = null;
  if (c.ng) {
    c.st++;
    if (c.st >= 2) { c.ng = false; c.st = 0; ev = "cleared"; }
    if (c.s === 0) { c.s = 1; c.last = d; ev = "new"; }
  } else if (c.s === 0) { c.s = 1; c.last = d; ev = "new"; }
  else if (c.last !== d && c.s < 5) { c.s++; c.last = d; ev = "up"; }
  if (ev === "new" || ev === "up") addProg("starup3");
  return ev;
}
function onWrong(id) {
  const c = card(id);
  c.tot++; c.ng = true; c.st = 0; recordStat(false);
}
const nigateIds = () => Object.keys(S.cards).filter((id) => S.cards[id].ng);

// ---------- 効果音（WebAudioで鳴らす） ----------
let AC = null;
function snd(type) {
  if (!S.sound) return;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    const seq = {
      ok: [[660, 0.07], [990, 0.12]], ng: [[260, 0.12], [200, 0.2]], hit: [[160, 0.07]], coin: [[988, 0.05], [1319, 0.12]],
      win: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.3]], hurt: [[120, 0.18]], tap: [[700, 0.04]],
      special: [[523, 0.06], [784, 0.06], [1047, 0.06], [1568, 0.25]], lose: [[392, 0.2], [330, 0.2], [262, 0.4]],
    }[type];
    let t = AC.currentTime;
    for (const [f, d] of seq) {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type === "ng" || type === "hurt" ? "sawtooth" : type === "win" || type === "special" ? "triangle" : "square";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.07, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g).connect(AC.destination);
      o.start(t); o.stop(t + d + 0.02);
      t += d;
    }
  } catch (e) { /* 音が出せなくても続ける */ }
}

// ---------- 色の明るさを変える ----------
function shade(hex, p) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(p < 0 ? c * (1 + p) : c + (255 - c) * p)));
  return "#" + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
}

// ---------- キャラクターの絵（そうびで見た目がかわる） ----------
let svgN = 0;
function charSVG(eq, color, cls = "") {
  const w = itemById(eq.weapon), a = itemById(eq.armor), h = itemById(eq.hat);
  const dark = shade(color, -0.3), n = ++svgN;
  return `<svg viewBox="-10 -10 230 210" class="chr ${cls}">
    <defs><clipPath id="cb${n}"><circle cx="100" cy="112" r="62"/></clipPath></defs>
    <ellipse cx="100" cy="186" rx="62" ry="8" fill="rgba(0,0,0,.13)"/>
    <ellipse cx="68" cy="172" rx="27" ry="14" fill="${FEET[color] || dark}"/>
    <ellipse cx="132" cy="172" rx="27" ry="14" fill="${FEET[color] || dark}"/>
    ${h.id === "h_none" || h.id === "h_ribbon" || h.id === "h_halo" ? `
    <path d="M100 54 C100 42 101 36 103 30" stroke="#47a84a" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M103 31 C 90 16, 76 22, 79 31 C 89 37, 98 35, 103 31Z" fill="#6ccf6a"/>
    <path d="M103 31 C 116 15, 131 21, 128 30 C 118 36, 108 35, 103 31Z" fill="#8ee08a"/>` : ""}
    <ellipse cx="40" cy="124" rx="16" ry="14" fill="${color}" stroke="${dark}" stroke-width="2"/>
    <circle cx="100" cy="112" r="62" fill="${color}"/>
    <g clip-path="url(#cb${n})">${armorSVG(a)}</g>
    <circle cx="100" cy="112" r="62" fill="none" stroke="${dark}" stroke-width="2.5"/>
    <ellipse cx="74" cy="78" rx="17" ry="9" fill="rgba(255,255,255,.55)" transform="rotate(-30 74 78)"/>
    <ellipse cx="84" cy="100" rx="7.5" ry="13" fill="#2b2140"/><ellipse cx="116" cy="100" rx="7.5" ry="13" fill="#2b2140"/>
    <ellipse cx="85.5" cy="94" rx="3.2" ry="5" fill="#fff"/><ellipse cx="117.5" cy="94" rx="3.2" ry="5" fill="#fff"/>
    <ellipse cx="66" cy="119" rx="11" ry="6" fill="#ff6f9f" opacity=".5"/><ellipse cx="134" cy="119" rx="11" ry="6" fill="#ff6f9f" opacity=".5"/>
    <path d="M93 121 Q100 131 107 121 Z" fill="#e0526e" stroke="#2b2140" stroke-width="2.5" stroke-linejoin="round"/>
    ${hatSVG(h, color, dark)}
    ${weaponSVG(w)}
    <ellipse cx="162" cy="124" rx="16" ry="14" fill="${color}" stroke="${dark}" stroke-width="2"/>
  </svg>`;
}

function armorSVG(a) {
  if (a.id === "a_cloth") {
    return `<rect x="30" y="136" width="140" height="13" rx="6" fill="#fff" stroke="#e7d9e9" stroke-width="2"/>
      <path d="M128 146 l10 22 l9 -4 l-8 -20Z" fill="#fff" stroke="#e7d9e9" stroke-width="2"/>`;
  }
  const c = a.color, d = shade(c, -0.25);
  let deco = `<circle cx="100" cy="158" r="9" fill="${shade(c, 0.5)}" stroke="${d}" stroke-width="2"/>`;
  if (a.id === "a_gold") deco = `<path d="M100 148 l3 7 7 0 -6 4 2 7 -6 -4 -6 4 2 -7 -6 -4 7 0Z" fill="#fff6c2" stroke="#c99a00" stroke-width="1.5"/>`;
  if (a.id === "a_star") deco = `<circle cx="70" cy="160" r="2.5" fill="#fff"/><circle cx="125" cy="150" r="2" fill="#fff"/><circle cx="140" cy="166" r="2.5" fill="#fff"/><path d="M100 146 l3 7 7 0 -6 4 2 7 -6 -4 -6 4 2 -7 -6 -4 7 0Z" fill="#ffe066"/>`;
  return `<rect x="30" y="134" width="140" height="60" fill="${c}"/>
    <rect x="30" y="134" width="140" height="8" fill="${d}"/>${deco}`;
}

function hatSVG(h, color, dark) {
  switch (h.id) {
    case "h_ribbon":
      return `<g transform="translate(140 62) rotate(20)"><path d="M0 0 L-20 -13 L-20 13Z" fill="#ff5c8a"/><path d="M0 0 L20 -13 L20 13Z" fill="#ff5c8a"/><circle r="7" fill="#ff8fb0"/></g>`;
    case "h_cat":
      return `<path d="M52 78 L56 34 L88 56Z" fill="${color}" stroke="${dark}" stroke-width="2.5" stroke-linejoin="round"/><path d="M60 68 L62 46 L78 58Z" fill="#ff9cbc"/>
        <path d="M148 78 L144 34 L112 56Z" fill="${color}" stroke="${dark}" stroke-width="2.5" stroke-linejoin="round"/><path d="M140 68 L138 46 L122 58Z" fill="#ff9cbc"/>`;
    case "h_wizard":
      return `<path d="M62 62 Q100 50 138 62 L112 -4 Q106 -10 104 0Z" fill="#7b5cff" stroke="#4b33c4" stroke-width="2.5"/>
        <ellipse cx="100" cy="62" rx="48" ry="10" fill="#6a4cf0" stroke="#4b33c4" stroke-width="2.5"/>
        <path d="M100 28 l3 6 6 0 -5 4 2 6 -6 -4 -6 4 2 -6 -5 -4 6 0Z" fill="#ffe066"/>`;
    case "h_crown":
      return `<path d="M70 62 L66 26 L84 44 L100 18 L116 44 L134 26 L130 62Z" fill="#ffd23f" stroke="#c99a00" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="100" cy="48" r="5" fill="#ff4d6d"/><circle cx="82" cy="54" r="3.5" fill="#4aa8ff"/><circle cx="118" cy="54" r="3.5" fill="#4cc46a"/>`;
    case "h_halo":
      return `<ellipse cx="100" cy="18" rx="34" ry="9" fill="none" stroke="#ffd23f" stroke-width="6"/><ellipse cx="100" cy="18" rx="34" ry="9" fill="none" stroke="#fff6c2" stroke-width="2"/>`;
    default: return "";
  }
}

function weaponSVG(w) {
  const big = w.atk >= 28;
  const glow = big ? `<circle cx="0" cy="-74" r="26" fill="${ELEMENTS[w.el].color}" opacity=".25"/>` : "";
  const handle = `<rect x="-4" y="-62" width="8" height="78" rx="4" fill="${big ? "#6d4c41" : "#a0704a"}"/>`;
  let top = "";
  switch (w.el) {
    case "none": return `<g transform="translate(164 122) rotate(25)"><rect x="-5" y="-66" width="10" height="82" rx="5" fill="#b07a4a" stroke="#7a5230" stroke-width="2"/><circle cx="0" cy="-48" r="3" fill="#7a5230"/></g>`;
    case "fire":
      top = `<path d="M0 -100 C 18 -80, 16 -66, 0 -60 C -16 -66, -18 -80, 0 -100Z" fill="#ff7a29"/><path d="M0 -86 C 8 -76, 8 -68, 0 -64 C -8 -68, -8 -76, 0 -86Z" fill="#ffd23f"/>`;
      if (big) top += `<path d="M-14 -70 C -24 -78, -22 -90, -14 -96 C -12 -86, -6 -80, -14 -70Z" fill="#ff4d2e"/><path d="M14 -70 C 24 -78, 22 -90, 14 -96 C 12 -86, 6 -80, 14 -70Z" fill="#ff4d2e"/>`;
      return `<g transform="translate(164 122) rotate(18)">${glow}${handle}${top}</g>`;
    case "water":
      return `<g transform="translate(164 122) rotate(20)">${glow}<rect x="-4" y="-6" width="8" height="22" rx="3" fill="#5b4636"/><rect x="-14" y="-10" width="28" height="7" rx="3" fill="${big ? "#ffd23f" : "#9fb3c8"}"/>
        <path d="M-7 -10 L-7 -${big ? 92 : 78} L0 -${big ? 104 : 90} L7 -${big ? 92 : 78} L7 -10Z" fill="${big ? "#3d8bff" : "#7cc4ff"}" stroke="#2a6fd1" stroke-width="2"/><path d="M-2 -16 L-2 -${big ? 88 : 74}" stroke="#fff" stroke-width="2" opacity=".7"/></g>`;
    case "thunder":
      return `<g transform="translate(164 122) rotate(15)">${glow}${handle}<rect x="-${big ? 24 : 20}" y="-${big ? 96 : 88}" width="${big ? 48 : 40}" height="30" rx="6" fill="#ffc400" stroke="#c99a00" stroke-width="2.5"/>
        <path d="M2 -${big ? 92 : 84} L-6 -${big ? 79 : 71} L1 -${big ? 79 : 71} L-3 -${big ? 69 : 61} L8 -${big ? 83 : 75} L1 -${big ? 83 : 75}Z" fill="#fff"/></g>`;
    case "leaf":
      if (big) return `<g transform="translate(164 122) rotate(-5)">${glow}<path d="M0 -96 Q 34 -46 0 8" fill="none" stroke="#2e7d32" stroke-width="6" stroke-linecap="round"/><path d="M0 -96 L0 8" stroke="#c8f7c5" stroke-width="2"/><path d="M-10 -44 L22 -44" stroke="#8d6e63" stroke-width="3"/><path d="M22 -44 l-8 -5 0 10Z" fill="#4cc46a"/></g>`;
      return `<g transform="translate(166 116) rotate(-20)"><path d="M0 0 Q -10 -40 -34 -54 Q -16 -34 -8 0Z" fill="#4cc46a" stroke="#2e7d32" stroke-width="2"/><path d="M0 0 Q 30 -26 46 -18 Q 24 -12 6 6Z" fill="#6ccf6a" stroke="#2e7d32" stroke-width="2"/></g>`;
    case "star":
      return `<g transform="translate(164 122) rotate(15)"><circle cx="0" cy="-82" r="30" fill="#c77dff" opacity=".25"/>${handle.replace("#6d4c41", "#ff8fb0").replace("#a0704a", "#ff8fb0")}
        <path d="M0 -110 l8 17 19 2 -14 13 4 19 -17 -9 -17 9 4 -19 -14 -13 19 -2Z" fill="#ffe066" stroke="#e0a800" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="-5" cy="-82" r="2.2" fill="#2b2140"/><circle cx="5" cy="-82" r="2.2" fill="#2b2140"/></g>`;
  }
  return "";
}

// ---------- 敵の絵 ----------
function enemySVG(e) {
  const c = e.color, d = shade(c, -0.3);
  const eyes = (y = 100, x1 = 82, x2 = 118) => `<path d="M${x1 - 12} ${y - 14} L${x1 + 8} ${y - 6}" stroke="#2b2140" stroke-width="4" stroke-linecap="round"/><path d="M${x2 + 12} ${y - 14} L${x2 - 8} ${y - 6}" stroke="#2b2140" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="${x1}" cy="${y + 2}" rx="6" ry="8" fill="#2b2140"/><ellipse cx="${x2}" cy="${y + 2}" rx="6" ry="8" fill="#2b2140"/><circle cx="${x1 + 1.5}" cy="${y - 1}" r="2.2" fill="#fff"/><circle cx="${x2 + 1.5}" cy="${y - 1}" r="2.2" fill="#fff"/>`;
  const mouth = (y = 126) => `<path d="M86 ${y} Q100 ${y - 8} 114 ${y}" stroke="#2b2140" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M90 ${y - 2} l3 6 3 -7Z M104 ${y - 3} l3 7 3 -6Z" fill="#fff"/>`;
  let body = "";
  switch (e.shape) {
    case "blob": body = `<path d="M34 160 Q24 76 100 48 Q176 76 166 160 Q100 182 34 160Z" fill="${c}" stroke="${d}" stroke-width="3"/><ellipse cx="72" cy="80" rx="14" ry="8" fill="rgba(255,255,255,.45)" transform="rotate(-30 72 80)"/>${eyes()}${mouth()}`; break;
    case "mush": body = `<rect x="64" y="96" width="72" height="70" rx="26" fill="#fff1d6" stroke="#d8b98a" stroke-width="3"/><path d="M24 104 Q30 38 100 34 Q170 38 176 104 Q100 120 24 104Z" fill="${c}" stroke="${d}" stroke-width="3"/>
      <circle cx="68" cy="66" r="10" fill="#fff"/><circle cx="118" cy="56" r="8" fill="#fff"/><circle cx="146" cy="84" r="7" fill="#fff"/>${eyes(128, 86, 114)}<path d="M92 152 Q100 146 108 152" stroke="#2b2140" stroke-width="3" fill="none"/>`; break;
    case "crab": body = `<circle cx="34" cy="92" r="20" fill="${c}" stroke="${d}" stroke-width="3"/><path d="M26 80 L34 92 L20 96" stroke="${d}" stroke-width="3" fill="none"/><circle cx="166" cy="92" r="20" fill="${c}" stroke="${d}" stroke-width="3"/><path d="M174 80 L166 92 L180 96" stroke="${d}" stroke-width="3" fill="none"/>
      <path d="M60 150 l-16 22 M76 158 l-8 22 M140 150 l16 22 M124 158 l8 22" stroke="${d}" stroke-width="5" stroke-linecap="round"/><ellipse cx="100" cy="128" rx="62" ry="40" fill="${c}" stroke="${d}" stroke-width="3"/>
      <line x1="84" y1="90" x2="84" y2="66" stroke="${d}" stroke-width="4"/><line x1="116" y1="90" x2="116" y2="66" stroke="${d}" stroke-width="4"/><circle cx="84" cy="62" r="11" fill="#fff" stroke="${d}" stroke-width="2"/><circle cx="116" cy="62" r="11" fill="#fff" stroke="${d}" stroke-width="2"/><circle cx="86" cy="63" r="5" fill="#2b2140"/><circle cx="114" cy="63" r="5" fill="#2b2140"/>${mouth(136)}`; break;
    case "ghost": body = `<path d="M40 170 L40 96 Q40 40 100 40 Q160 40 160 96 L160 170 L145 156 L130 170 L115 156 L100 170 L85 156 L70 170 L55 156Z" fill="${c}" stroke="${d}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="74" cy="72" rx="13" ry="7" fill="rgba(255,255,255,.5)" transform="rotate(-30 74 72)"/>${eyes()}${mouth()}`; break;
    case "rock": body = `<path d="M40 166 L28 110 L56 56 L104 38 L152 60 L176 112 L160 166Z" fill="${c}" stroke="${d}" stroke-width="3" stroke-linejoin="round"/><path d="M56 56 L80 90 L104 38 M152 60 L128 92 M28 110 L60 118" stroke="${d}" stroke-width="2" fill="none" opacity=".6"/>${eyes(108)}${mouth(134)}`; break;
    case "boss": body = `<path d="M60 60 L44 12 L82 46Z M140 60 L156 12 L118 46Z" fill="#ffe0f0" stroke="#2b2140" stroke-width="3"/><path d="M20 168 Q6 70 100 40 Q194 70 180 168 Q100 196 20 168Z" fill="${c}" stroke="${d}" stroke-width="4"/>
      <path d="M40 150 Q100 175 160 150 L170 176 Q100 200 30 176Z" fill="#c2185b" opacity=".85"/>${eyes(98, 76, 124)}<ellipse cx="76" cy="100" rx="6" ry="8" fill="#ff3d3d"/><ellipse cx="124" cy="100" rx="6" ry="8" fill="#ff3d3d"/>
      <path d="M72 128 Q100 112 128 128 Q100 140 72 128Z" fill="#2b2140"/><path d="M80 124 l4 8 4 -9Z M112 123 l4 9 4 -8Z" fill="#fff"/>`; break;
  }
  const crown = e.boss && e.shape !== "boss" ? `<path d="M76 46 L72 20 L88 34 L100 14 L112 34 L128 20 L124 46Z" fill="#ffd23f" stroke="#c99a00" stroke-width="2.5" stroke-linejoin="round"/>` : "";
  // ニガテモンスター（漢字）は、おなかに漢字の札をつける
  const label = e.label ? `<rect x="78" y="134" width="44" height="38" rx="10" fill="#fff" stroke="${d}" stroke-width="3"/><text x="100" y="163" text-anchor="middle" font-size="30" font-weight="bold" fill="#3b2a55" font-family='${KFONT}'>${esc(e.label)}</text>` : "";
  return `<svg viewBox="0 0 200 200" class="enemy-svg">${body}${crown}${label}</svg>`;
}

// ---------- 画面の切りかえ ----------
function setScreen(html, cls = "") {
  const app = $("app");
  app.className = cls;
  app.innerHTML = html;
  window.scrollTo(0, 0);
}
function go(name, arg) {
  snd("tap");
  ({ home, map, shop, equip, zukan, missions, parent })[name](arg);
}
function topBar(title, back = "home") {
  return `<div class="topbar"><button class="back" onclick="go('${back}')">◀ もどる</button><div class="ttl">${title}</div>
    <div class="money"><span>🪙${S.coins}</span><span>💎${S.gems}</span></div></div>`;
}

// ---------- ポップアップ ----------
function modal(html, cls = "") {
  const m = $("modal");
  m.innerHTML = `<div class="mbox ${cls}">${html}</div>`;
  m.classList.add("show");
}
// とじるまで待つポップアップ（バトルの進行を止めたいとき用）
let modalResolve = null;
function modalWait(html, cls = "") { modal(html, cls); return new Promise((r) => { modalResolve = r; }); }
function closeModal() {
  $("modal").classList.remove("show"); $("modal").innerHTML = "";
  if (modalResolve) { const r = modalResolve; modalResolve = null; r(); }
}
let toastTimer = null;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

// ---------- はじめての設定 ----------
let setupColor = BODY_COLORS[0];
function setup() {
  setScreen(`<div class="setup">
    <h1 class="logo">ぷにまる<br>クエスト</h1>
    <div class="hero" id="setupHero">${charSVG(S.eq, setupColor, "bounce")}</div>
    <p>きみの ぷにまるに なまえを つけよう！</p>
    <input id="nm" maxlength="8" placeholder="なまえ" autocomplete="off">
    <p>からだの いろ</p>
    <div class="colors">${BODY_COLORS.map((c) => `<button class="cdot" style="background:${c}" onclick="setupPick('${c}')"></button>`).join("")}</div>
    <button class="big-btn primary" onclick="setupDone()">ぼうけんを はじめる！</button></div>`, "bg-home");
}
function setupPick(c) { setupColor = c; $("setupHero").innerHTML = charSVG(S.eq, c, "bounce"); snd("tap"); }
function setupDone() {
  const n = $("nm").value.trim();
  if (!n) { toast("なまえを入れてね"); return; }
  S.name = n; S.color = setupColor; save(); snd("win"); home();
}

// ---------- ホーム ----------
function home() {
  ensureDaily();
  const claimable = MISSIONS.some((m) => (S.daily.prog[m.id] || 0) >= m.goal && !S.daily.claimed[m.id]);
  const ng = nigateIds().length;
  setScreen(`<div class="homewrap">
    <div class="topbar"><div class="money big"><span>🪙 ${S.coins}</span><span>💎 ${S.gems}</span></div><button class="gear" onclick="go('parent')" aria-label="せってい">⚙️</button></div>
    <h1 class="logo sm">ぷにまるクエスト</h1>
    <div class="hero" onclick="snd('tap');this.firstElementChild.classList.remove('jump');void this.offsetWidth;this.firstElementChild.classList.add('jump')">${charSVG(S.eq, S.color, "bounce")}</div>
    <div class="pname">${esc(S.name)}</div>
    <div class="stats"><span>⚔️ ${pAtk()}</span><span>🛡️ ${pDef()}</span><span>❤️ ${pMaxHp()}</span></div>
    <button class="big-btn primary" onclick="go('map')">⚔️ ぼうけんに でる！</button>
    <div class="menu4">
      <button onclick="go('shop')"><span class="mi">🛒</span>ショップ</button>
      <button onclick="go('equip')"><span class="mi">🎽</span>そうび</button>
      <button onclick="go('zukan')"><span class="mi">🃏</span>ずかん${ng ? `<i class="badge">${ng}</i>` : ""}</button>
      <button onclick="go('missions')"><span class="mi">📜</span>ミッション${claimable ? `<i class="badge">!</i>` : ""}</button>
    </div></div>`, "bg-home");
  loginBonus();
}

function loginBonus() {
  const d = today();
  if (S.login.last === d) return;
  S.login.streak = S.login.last === yesterday() ? S.login.streak + 1 : 1;
  S.login.last = d;
  const bonus = 30 + 10 * Math.min(S.login.streak - 1, 7);
  S.coins += bonus; save();
  setTimeout(() => {
    snd("coin");
    modal(`<div class="mtitle">ログインボーナス！</div><div class="bigicon">🎁</div>
      <p><b>${S.login.streak}日れんぞく</b> ログイン！</p><p class="reward">🪙 +${bonus}</p>
      <p class="small">まいにち くると ボーナスが ふえるよ</p><button class="big-btn primary" onclick="closeModal();home()">やったー！</button>`);
  }, 300);
}

// ---------- マップ ----------
function map() {
  const ng = nigateIds();
  const nodes = STAGES.map((st) => {
    const open = st.id === 1 || S.cleared[st.id - 1];
    const done = S.cleared[st.id];
    const weaks = [...new Set(st.enemies.map((e) => ELEMENTS[e[3]].icon))].join("");
    return `<button class="stage ${open ? "" : "locked"} ${st.final ? "final" : ""}" ${open ? `onclick="startBattle(${st.id})"` : ""} style="--b1:${st.bg[0]};--b2:${st.bg[1]}">
      <span class="snum">${st.final ? "👑" : st.id}</span>
      <span class="sinfo"><b>${st.name}</b><small>${open ? `じゃくてん ${weaks}` : "まえの ステージを クリアしよう"}</small></span>
      <span class="sstate">${!open ? "🔒" : done ? "⭐" : "▶"}</span></button>`;
  }).join("");
  setScreen(`${topBar("ワールド6")}
    <div class="maplist">
      <button class="stage nigate ${ng.length ? "" : "locked"}" ${ng.length ? `onclick="startBattle('nigate')"` : ""}>
        <span class="snum">👻</span><span class="sinfo"><b>ニガテモンスター たいじ</b><small>${ng.length ? `${ng.length}体 うろついている！ たおすと 💎` : "まちがえた問題が モンスターになるよ"}</small></span><span class="sstate">${ng.length ? "▶" : ""}</span></button>
      ${nodes}
    </div>`, "bg-map");
  if (!S.tut.map) {
    S.tut.map = 1; save();
    modal(`<div class="mtitle">ぼうけんの ヒント</div><div class="bigicon">💡</div>
      <p>てきには <b>じゃくてん</b> があるよ。<br>じゃくてんの ぶきで こうげきすると <b>2ばい</b> のダメージ！</p>
      <p>さいしょの森の てきは 🔥 に よわい。<br><b>ショップで「ほのおのつえ」</b>を かってみよう！</p>
      <button class="big-btn primary" onclick="closeModal()">わかった！</button>`);
  }
}

// ---------- 問題づくり ----------
// 出題する項目を、ニガテ・★を上げられるもの・新しいものを多めにえらぶ
function pickId(pool, recent) {
  const d = today();
  const ws = pool.map((id) => {
    const c = S.cards[id];
    let x = 1;
    if (!c || c.s === 0) x = 1.5;
    else if (c.ng) x = 3;
    else if (c.last !== d && c.s < 5) x = 2;
    else if (c.s >= 5) x = 0.4;
    else x = 0.6;
    if (recent.includes(id)) x *= 0.03;
    return x;
  });
  let r = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}

function mkOpts(q, ans, ds) {
  q.opts = shuffle([ans, ...ds.slice(0, 3)]);
  q.ai = q.opts.indexOf(ans);
  return q;
}
const fmtNum = (v, u) => `${v}${u ? " " + u : ""}`;

function makeQ(id, kind) {
  if (id.startsWith("k:")) {
    const K = kanjiOf(id);
    const [word, reading] = pick(K.w);
    kind = kind || (Math.random() < 0.5 ? "kread" : "kwrite");
    const q = { id, kind, word, reading, k: K.k, explain: `${word}（${reading}）` };
    if (kind === "kread") {
      // 文字数のちかい読みを、まちがいの選択肢にする
      const pool = [];
      KANJI.forEach((x) => x.w.forEach(([, r]) => { if (r !== reading && !pool.includes(r)) pool.push(r); }));
      const near = shuffle(pool.filter((r) => Math.abs(r.length - reading.length) <= 1));
      const ds = [];
      for (const r of near.concat(shuffle(pool))) { if (ds.length >= 3) break; if (!ds.includes(r)) ds.push(r); }
      return mkOpts(q, reading, ds);
    }
    return mkOpts(q, K.k, shuffle(K.sim.filter((s) => s !== K.k)));
  }
  const F = formulaOf(id);
  kind = kind || (Math.random() < 0.5 ? "ffill" : "fcalc");
  if (kind === "ffill") {
    const q = { id, kind, name: F.name, explain: `${F.name} ＝ ${F.ans}` };
    return mkOpts(q, F.ans, shuffle(F.ng));
  }
  const g = F.gen();
  const ds = [];
  for (const x of g.ng.concat([g.a + 1, g.a * 2, g.a + 10, r2(g.a / 2)])) {
    if (ds.length >= 3) break;
    if (x !== g.a && x > 0 && !ds.includes(x)) ds.push(x);
  }
  const q = { id, kind, name: F.name, text: g.q, explain: `${F.name} ＝ ${F.ans}<br>こたえ：${fmtNum(g.a, g.unit)}` };
  return mkOpts(q, fmtNum(g.a, g.unit), ds.map((x) => fmtNum(x, g.unit)));
}

// ---------- バトル ----------
let B = null;

function stagePools(st) {
  const kp = KANJI.slice(st.kanji[0], st.kanji[1]).map((x) => "k:" + x.k);
  const fp = FORMULAS.slice(st.fo[0], st.fo[1]).map((x) => "f:" + x.id);
  return { kp, fp };
}

function startBattle(sid) {
  snd("tap");
  let enemies, st;
  if (sid === "nigate") {
    // ニガテモンスター：まちがえた問題がモンスターになる（2回正解でたおせる）
    const ids = shuffle(nigateIds()).slice(0, 5);
    st = { id: "nigate", name: "ニガテたいじ", bg: ["#e9d8ff", "#b39ddb"] };
    enemies = ids.map((id) => ({
      name: id.startsWith("k:") ? `ニガテ「${id.slice(2)}」` : `ニガテ「${formulaOf(id).name}」`, hp: 0, atk: 6, weak: "none", shape: "ghost", color: "#9575cd", item: id,
      label: id.startsWith("k:") ? id.slice(2) : "",
    }));
  } else {
    st = STAGES.find((x) => x.id === sid);
    enemies = st.enemies.map(([name, hp, atk, weak, shape, color, boss, weak2]) => ({ name, hp, atk, weak, shape, color, boss: !!boss, weak2 }));
  }
  B = {
    st, sid, enemies, ei: 0, php: pMaxHp(), combo: 0, gauge: 0, coins: 0, gems: 0,
    news: [], ups: [], recent: [], busy: false, pools: sid === "nigate" ? null : stagePools(st), traceFails: 0,
  };
  nextEnemy();
  if (!S.tut.battle) {
    S.tut.battle = 1; save();
    modal(`<div class="mtitle">たたかいかた</div>
      <p>⭕ 正解すると こうげき！<br>れんぞく正解で <b>コンボ</b>、ダメージアップ！</p>
      <p>⚔️ てきは 3ターンごとに こうげきしてくる。<br>まちがえると すぐに こうげきされるよ。</p>
      <p>✨ ゲージが たまったら <b>ひっさつわざ</b>（公式の問題）で 3ばいダメージ！</p>
      <p>🔄「ぶき」ボタンで たたかいながら ぶきを かえられるよ。</p>
      <button class="big-btn primary" onclick="closeModal()">たたかう！</button>`);
  }
}

function nextEnemy() {
  const e = B.enemies[B.ei];
  if (B.sid === "nigate") e.hp = Math.round(pAtk() * 1.6);
  e.max = e.hp; e.phase = 1; e.turn = 3;
  B.e = e;
  renderBattle();
  nextQ();
}

function renderBattle() {
  const e = B.e, w = itemById(S.eq.weapon);
  setScreen(`<div class="battle" style="--b1:${B.st.bg[0]};--b2:${B.st.bg[1]}">
    <div class="bhead"><button class="back" onclick="retreat()">にげる</button><div class="ttl">${B.st.name} <small>${B.ei + 1}/${B.enemies.length}</small></div><div class="money"><span>🪙+${B.coins}</span></div></div>
    <div class="field">
      <div class="ebox">
        <div class="ename">${e.boss ? "👑 " : ""}${esc(e.name)}</div>
        <div class="bar ehp"><i id="ehpbar"></i><span id="ehptxt"></span></div>
        <div class="einfo"><span id="eweak"></span><span id="eturn"></span></div>
        <div class="enemy ${e.boss ? "bossy" : ""}" id="enemy">${enemySVG(e)}</div>
      </div>
      <div class="pbox">
        <div class="pchr" id="pchr">${charSVG(S.eq, S.color)}</div>
        <div class="pstat">
          <div class="bar php"><i id="phpbar"></i><span id="phptxt"></span></div>
          <div class="prow"><button class="wbtn" onclick="swapWeapon()">🔄 ぶき <b id="wel">${ELEMENTS[w.el].icon}</b></button><span class="combo" id="combo"></span></div>
          <button class="special" id="special" onclick="useSpecial()">✨ ひっさつわざ</button>
          <div class="gauge"><i id="gauge"></i></div>
        </div>
      </div>
      <div id="fx"></div>
    </div>
    <div class="qpanel" id="qpanel"></div>
  </div>`, "bg-battle");
  updBars();
}

function updBars() {
  const e = B.e, mx = pMaxHp();
  $("ehpbar").style.width = Math.max(0, (e.hp / e.max) * 100) + "%";
  $("ehptxt").textContent = `${Math.max(0, e.hp)} / ${e.max}`;
  $("phpbar").style.width = Math.max(0, (B.php / mx) * 100) + "%";
  $("phptxt").textContent = `❤️ ${Math.max(0, B.php)} / ${mx}`;
  $("eweak").innerHTML = e.weak === "none" ? "" : `じゃくてん <b>${ELEMENTS[e.weak].icon}</b>`;
  $("eturn").innerHTML = `⚔️ あと<b>${e.turn}</b>`;
  $("combo").textContent = B.combo >= 2 ? `${B.combo} コンボ!` : "";
  $("gauge").style.width = (B.gauge / 5) * 100 + "%";
  $("special").classList.toggle("ready", B.gauge >= 5);
  $("special").disabled = B.gauge < 5;
  const w = itemById(S.eq.weapon);
  $("wel").textContent = ELEMENTS[w.el].icon;
  $("wel").parentElement.classList.toggle("good", w.el === e.weak);
}

function nextQ(special = false) {
  B.busy = false;
  let id;
  if (B.sid === "nigate") id = B.e.item;
  else if (special) id = pickId(B.pools.fp, B.recent);
  else id = Math.random() < B.st.mix ? pickId(B.pools.fp, B.recent) : pickId(B.pools.kp, B.recent);
  B.recent = [id, ...B.recent].slice(0, 4);
  B.q = makeQ(id, special ? "ffill" : null);
  B.q.special = special;
  showQ();
}

function showQ() {
  const q = B.q;
  let head = "";
  if (q.kind === "kread") head = `<div class="qlabel">よみかたは？</div><div class="qword">${esc(q.word).replace(q.k, `<span class="hl">${q.k}</span>`)}</div>`;
  else if (q.kind === "kwrite") head = `<div class="qlabel">□に 入る 漢字は？</div><div class="qruby">${q.reading}</div><div class="qword">${esc(q.word).replace(q.k, `<span class="blank">□</span>`)}</div>`;
  else if (q.kind === "ffill") head = `<div class="qlabel">${q.special ? "✨ ひっさつわざ！ 正しい公式は？" : "正しい公式は？"}</div><div class="qword fsm">${q.name} ＝ ？</div>`;
  else head = `<div class="qlabel">📐 ${q.name}</div><div class="qtext">${q.text}</div>`;
  const cls = q.kind === "kwrite" ? "kch" : q.kind === "ffill" ? "fch" : "";
  $("qpanel").innerHTML = `${head}<div class="choices ${cls}">${q.opts.map((o, i) => `<button class="ch" onclick="answer(${i})">${o}</button>`).join("")}</div>`;
}

// ダメージ数字などの演出
function fxText(txt, cls) {
  const d = document.createElement("div");
  d.className = "fxt " + cls; d.innerHTML = txt;
  $("fx").appendChild(d);
  setTimeout(() => d.remove(), 1100);
}
function anim(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

async function answer(i) {
  if (B.busy) return;
  B.busy = true;
  const q = B.q, ok = i === q.ai;
  const btns = document.querySelectorAll(".ch");
  btns[q.ai].classList.add("right");
  if (!ok) btns[i].classList.add("wrong");
  const isNigate = B.sid === "nigate";
  if (ok) {
    snd(q.special ? "special" : "ok");
    const ev = onCorrect(q.id);
    if (ev === "new") B.news.push(q.id);
    if (ev === "up") B.ups.push(q.id);
    if (ev === "new" || ev === "up") fxText(ev === "new" ? "🃏 NEW カード！" : "⭐ ★アップ！", "card");
    B.combo++;
    if (!q.special) B.gauge = Math.min(5, B.gauge + 1); else B.gauge = 0;
    const got = 5 + Math.min(B.combo, 10);
    B.coins += got; S.coins += got;
    await attack(q.special ? 3 : 1, q.special ? formulaOf(q.id).skill : null);
  } else {
    snd("ng");
    onWrong(q.id);
    B.combo = 0;
    if (q.special) B.gauge = 0;
    save();
    // まちがえたら正しい答えを見せて、たしかめてからすすむ
    $("qpanel").insertAdjacentHTML("beforeend", `<div class="explain"><div>📖 ${q.explain}</div>
      <small>${isNigate ? "" : "まちがえた問題は ニガテモンスターに なったよ"}</small><button class="big-btn" onclick="afterWrong()">つぎへ</button></div>`);
    updBars();
  }
}

async function afterWrong() {
  if (!$("qpanel").querySelector(".explain")) return;
  $("qpanel").innerHTML = "";
  await enemyAttack();
  if (B.php > 0) { B.e.turn = 3; updBars(); nextQ(); }
}

async function attack(mult, skillName) {
  const e = B.e, w = itemById(S.eq.weapon);
  const weak = w.el === e.weak;
  let d = pAtk() * (weak ? 2 : w.el === "star" ? 1.3 : 1) * (1 + 0.1 * Math.min(B.combo, 10)) * mult;
  d = Math.max(1, Math.round(d * (0.9 + Math.random() * 0.2)));
  anim($("pchr"), "atk");
  if (skillName) fxText(skillName + "！", "skill");
  await wait(220);
  snd("hit");
  anim($("enemy"), "hurt");
  e.hp -= d;
  fxText(`${d}${weak ? '<small>じゃくてん!</small>' : ""}`, weak ? "dmg weak" : "dmg");
  e.turn--;
  updBars();
  save();
  await wait(650);
  // ラスボス：体力が半分になったら弱点がかわる
  if (e.weak2 && e.phase === 1 && e.hp > 0 && e.hp <= e.max / 2) {
    e.phase = 2; e.weak = e.weak2; updBars();
    anim($("enemy"), "phase");
    await modalWait(`<div class="mtitle">${esc(e.name)}が おこった！</div><div class="bigicon">💢</div>
      <p>じゃくてんが <b style="font-size:1.6em">${ELEMENTS[e.weak].icon}</b> に かわった！</p><p class="small">「🔄 ぶき」で そうびを かえよう</p>
      <button class="big-btn primary" onclick="closeModal()">まけないぞ！</button>`);
  }
  if (e.hp <= 0) {
    if (e.boss && B.sid !== "nigate") { e.hp = 0; updBars(); startTrace(); return; }
    return enemyDown();
  }
  if (e.turn <= 0) {
    await enemyAttack();
    if (B.php <= 0) return;
    e.turn = 3; updBars();
  }
  nextQ();
}

async function enemyAttack() {
  const e = B.e;
  const d = Math.max(1, Math.round((e.atk - pDef()) * (0.9 + Math.random() * 0.2)));
  anim($("enemy"), "lunge");
  await wait(250);
  snd("hurt");
  anim($("app").firstElementChild, "shake");
  anim($("pchr"), "hurt");
  B.php -= d;
  fxText(`-${d}`, "pdmg");
  updBars();
  await wait(600);
  if (B.php <= 0) lose();
}

async function enemyDown() {
  const e = B.e;
  anim($("enemy"), "down");
  snd("coin");
  if (B.sid === "nigate") {
    addProg("nigate1");
    ensureDaily();
    if (S.daily.ngGems < 3) { S.daily.ngGems++; S.gems++; B.gems++; fxText("💎 +1", "card"); }
    else { S.coins += 30; B.coins += 30; fxText("🪙 +30", "card"); }
  } else {
    const c = 15 * B.st.id;
    S.coins += c; B.coins += c;
    fxText(`🪙 +${c}`, "card");
  }
  save();
  await wait(900);
  B.ei++;
  if (B.ei >= B.enemies.length) return stageClear();
  // つぎの敵の前に 体力を少し回復
  B.php = Math.min(pMaxHp(), B.php + Math.round(pMaxHp() * 0.3));
  nextEnemy();
  toast("❤️ 体力が すこし かいふくした！");
}

function retreat() {
  modal(`<div class="mtitle">にげる？</div><p>ここまでの コイン（🪙${B.coins}）は もらえるよ。</p>
    <div class="row"><button class="big-btn" onclick="closeModal()">たたかう</button><button class="big-btn primary" onclick="closeModal();map()">にげる</button></div>`);
}

function lose() {
  snd("lose");
  save();
  const st = B.st;
  let hint = "そうびを つよくしてから また ちょうせんしよう！";
  if (st.enemies) {
    const weak = B.e.weak;
    if (weak !== "none" && itemById(S.eq.weapon).el !== weak) hint = `${ELEMENTS[weak].icon} の ぶきで こうげきすると 2ばいダメージ！`;
    else if (pDef() < 10) hint = "ショップで よろいを かうと ダメージが へるよ！";
    else hint = "ずかんの ★を ふやすと たいりょくが ふえるよ！";
  }
  modal(`<div class="mtitle">やられちゃった…</div><div class="hero sm">${charSVG(S.eq, S.color, "sad")}</div>
    <p>もらった コイン 🪙${B.coins} は そのまま！</p><p class="tip">💡 ${hint}</p>
    <div class="row"><button class="big-btn" onclick="closeModal();go('shop')">ショップへ</button><button class="big-btn primary" onclick="closeModal();startBattle(${typeof B.sid === "number" ? B.sid : "'nigate'"})">もういちど</button></div>`);
}

// ステージクリア：はじめてなら宝箱
function stageClear() {
  snd("win");
  const st = B.st, first = typeof B.sid === "number" && !S.cleared[st.id];
  let treasure = null;
  if (typeof B.sid === "number") {
    S.cleared[st.id] = true;
    if (first) {
      const bonus = 100 * st.id;
      S.coins += bonus; B.coins += bonus;
      const cand = ITEMS.filter((x) => x.type === "hat" && !x.gem && x.price > 0 && !S.owned.includes(x.id));
      if (st.final) { S.gems += 5; B.gems += 5; treasure = { icon: "💎", text: "ほうせき ×5" }; }
      else if (cand.length && st.id >= 2) { const it = cand[0]; S.owned.push(it.id); treasure = { icon: "🎩", text: `${it.name} を てにいれた！`, item: it.id }; }
      else { S.coins += 100; B.coins += 100; treasure = { icon: "🪙", text: "コイン +100" }; }
    } else { const c = 20 * st.id; S.coins += c; B.coins += c; }
  }
  save();
  const tiles = (ids, tag) => ids.map((id) => `<div class="mini-card"><b>${id.startsWith("k:") ? id.slice(2) : "📐"}</b><small>${id.startsWith("f:") ? formulaOf(id).name : ""}</small><i>${tag}</i></div>`).join("");
  const cards = B.news.length || B.ups.length ? `<div class="gotcards">${tiles(B.news, "NEW")}${tiles(B.ups, "★UP")}</div>` : "";
  const box = treasure ? `<div class="tbox" id="tbox" onclick="openBox()"><div class="chest">🎁</div><small>タップして あけよう！</small></div>
    <div class="treasure hidden" id="treasure"><div class="bigicon">${treasure.icon}</div><b>${treasure.text}</b>${treasure.item ? `<div class="hero xs">${charSVG({ ...S.eq, hat: treasure.item }, S.color)}</div>` : ""}</div>` : "";
  const finalMsg = st.final && first ? `<p class="final">🎉 ラスボスを たおした！ きみは ほんものの ゆうしゃだ！<br><small>つぎの ワールドは アップデートで とうじょう予定</small></p>` : "";
  setScreen(`<div class="clear">
    <div class="ctitle">${B.sid === "nigate" ? "ニガテ たいじ せいこう！" : "ステージ クリア！"}</div>
    <div class="hero">${charSVG(S.eq, S.color, "bounce")}</div>${finalMsg}
    <div class="rewards"><span>🪙 +${B.coins}</span>${B.gems ? `<span>💎 +${B.gems}</span>` : ""}</div>
    ${cards ? `<div class="sub">あたらしい カード・★アップ</div>${cards}` : ""}
    ${box}
    <div class="row"><button class="big-btn" onclick="go('home')">ホームへ</button><button class="big-btn primary" onclick="go('map')">つぎへ ▶</button></div>
  </div>`, "bg-clear");
}
function openBox() {
  const b = $("tbox");
  if (!b || b.classList.contains("opening")) return;
  b.classList.add("opening"); snd("special");
  setTimeout(() => { b.classList.add("hidden"); $("treasure").classList.remove("hidden"); snd("coin"); }, 700);
}

// バトル中にぶきを付けかえる
function swapWeapon() {
  if (B.busy) return;
  snd("tap");
  const ws = ITEMS.filter((x) => x.type === "weapon" && S.owned.includes(x.id));
  modal(`<div class="mtitle">ぶきを かえる</div><p class="small">てきの じゃくてん：<b>${ELEMENTS[B.e.weak].icon} ${ELEMENTS[B.e.weak].name}</b></p>
    <div class="wlist">${ws.map((w) => `<button class="witem ${S.eq.weapon === w.id ? "sel" : ""} ${w.el === B.e.weak ? "good" : ""}" onclick="setWeapon('${w.id}')">
      <span class="wel">${ELEMENTS[w.el].icon}</span><b>${w.name}</b><small>⚔️${w.atk}</small>${w.el === B.e.weak ? "<i>こうかばつぐん!</i>" : ""}</button>`).join("")}</div>
    <button class="big-btn" onclick="closeModal()">とじる</button>`);
}
function setWeapon(id) {
  S.eq.weapon = id; save(); closeModal(); snd("ok");
  $("pchr").innerHTML = charSVG(S.eq, S.color);
  anim($("pchr"), "jump");
  updBars();
}

// 必殺技：公式の問題に正解すると3倍ダメージ
function useSpecial() {
  if (B.busy || B.gauge < 5) return;
  snd("special");
  nextQ(true);
}

// ---------- トドメの書きとり（なぞり書き） ----------
let TR = null;
function startTrace() {
  B.busy = true;
  // ステージの漢字から、出会ったことのある字を優先してえらぶ
  const seen = B.pools.kp.filter((id) => S.cards[id] && S.cards[id].s > 0);
  const id = pick(seen.length ? seen : B.pools.kp);
  const K = kanjiOf(id);
  const [word, reading] = pick(K.w.filter(([w]) => w.includes(K.k)));
  TR = { id, k: K.k, word, reading, strokes: [], cur: null };
  snd("special");
  modal(`<div class="mtitle">⚡ トドメの かきとり！</div>
    <p class="small">うすい字を なぞって「<b>${esc(word)}</b>（${reading}）」の<br>「<b>${K.k}</b>」を 書こう！</p>
    <canvas id="tc" class="tcanvas"></canvas>
    <div class="row"><button class="big-btn" onclick="traceClear()">けす</button><button class="big-btn primary" onclick="traceJudge()">できた！</button></div>`, "trace");
  setupCanvas();
}

function drawGlyph(ctx, n, k, style) {
  ctx.font = `bold ${Math.round(n * 0.8)}px ${KFONT}`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = style;
  ctx.fillText(k, n / 2, n / 2 + n * 0.04);
}

function setupCanvas() {
  const cv = $("tc"), dpr = window.devicePixelRatio || 1;
  const size = Math.min(280, window.innerWidth - 80);
  cv.style.width = cv.style.height = size + "px";
  cv.width = cv.height = Math.round(size * dpr);
  TR.size = size; TR.cv = cv; TR.dpr = dpr;
  redrawTrace();
  const pos = (ev) => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height]; };
  cv.addEventListener("pointerdown", (ev) => { ev.preventDefault(); cv.setPointerCapture(ev.pointerId); TR.cur = [pos(ev)]; TR.strokes.push(TR.cur); redrawTrace(); });
  cv.addEventListener("pointermove", (ev) => { if (!TR.cur) return; ev.preventDefault(); TR.cur.push(pos(ev)); redrawTrace(); });
  const end = () => { TR.cur = null; };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
}

function drawStrokes(ctx, n, strokes, color, width) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const s of strokes) {
    ctx.beginPath();
    ctx.moveTo(s[0][0] * n, s[0][1] * n);
    if (s.length === 1) ctx.lineTo(s[0][0] * n + 0.1, s[0][1] * n);
    for (const p of s) ctx.lineTo(p[0] * n, p[1] * n);
    ctx.stroke();
  }
}

function redrawTrace() {
  const cv = TR.cv, ctx = cv.getContext("2d"), n = cv.width;
  ctx.clearRect(0, 0, n, n);
  ctx.fillStyle = "#fffdf5"; ctx.fillRect(0, 0, n, n);
  // マス目の十字線
  ctx.strokeStyle = "#f0b8c8"; ctx.lineWidth = 2 * TR.dpr; ctx.setLineDash([8 * TR.dpr, 8 * TR.dpr]);
  ctx.beginPath(); ctx.moveTo(n / 2, 0); ctx.lineTo(n / 2, n); ctx.moveTo(0, n / 2); ctx.lineTo(n, n / 2); ctx.stroke();
  ctx.setLineDash([]);
  drawGlyph(ctx, n, TR.k, "rgba(90,70,140,.18)");
  drawStrokes(ctx, n, TR.strokes, "#3b2a6b", n * 0.075);
}

function traceClear() { TR.strokes = []; redrawTrace(); snd("tap"); }

// 字の形とどれだけ重なっているかで判定する
function traceScore() {
  const N = 120;
  const mk = () => { const c = document.createElement("canvas"); c.width = c.height = N; return c.getContext("2d", { willReadFrequently: true }); };
  const g = mk(); drawGlyph(g, N, TR.k, "#000");
  const gd = mk(); drawGlyph(gd, N, TR.k, "#000"); gd.strokeStyle = "#000"; gd.lineWidth = N * 0.09; gd.lineJoin = "round";
  gd.strokeText(TR.k, N / 2, N / 2 + N * 0.04);
  const ink = mk(); drawStrokes(ink, N, TR.strokes, "#000", N * 0.085);
  const A = g.getImageData(0, 0, N, N).data, D = gd.getImageData(0, 0, N, N).data, I = ink.getImageData(0, 0, N, N).data;
  let gl = 0, cov = 0, in_ = 0, prec = 0;
  for (let i = 3; i < A.length; i += 4) {
    const a = A[i] > 100, inked = I[i] > 100;
    if (a) { gl++; if (inked) cov++; }
    if (inked) { in_++; if (D[i] > 100) prec++; }
  }
  return { cov: gl ? cov / gl : 0, prec: in_ ? prec / in_ : 0 };
}

function traceJudge() {
  if (!TR.strokes.length) { toast("字を なぞってね"); return; }
  const { cov, prec } = traceScore();
  if (cov >= 0.6 && prec >= 0.65) {
    const perfect = cov >= 0.8 && prec >= 0.8;
    closeModal();
    const ev = onCorrect(TR.id);
    if (ev === "new") B.news.push(TR.id);
    if (ev === "up") B.ups.push(TR.id);
    const bonus = perfect ? 50 : 20;
    S.coins += bonus; B.coins += bonus; save();
    snd("special");
    fxText(perfect ? "パーフェクト！" : "トドメ！", "skill");
    B.traceFails = 0;
    setTimeout(() => enemyDown(), 500);
  } else {
    B.traceFails++;
    snd("ng");
    if (B.traceFails >= 3) {
      closeModal(); B.traceFails = 0;
      toast("なんとか たおした！");
      setTimeout(() => enemyDown(), 400);
      return;
    }
    toast(cov < 0.6 ? "おしい！ 字の 形を ぜんぶ なぞろう" : "おしい！ はみださないように なぞろう");
    TR.strokes = []; redrawTrace();
  }
}

// ---------- ショップ ----------
let shopTab = "weapon";
function shop(tab) {
  if (tab) shopTab = tab;
  const tabs = [["weapon", "ぶき"], ["armor", "よろい"], ["hat", "ぼうし"]];
  const list = ITEMS.filter((x) => x.type === shopTab && x.price > 0).map((it) => {
    const own = S.owned.includes(it.id);
    const can = S.coins >= it.price && S.gems >= (it.gem || 0);
    const stat = it.type === "weapon" ? `⚔️${it.atk} ${ELEMENTS[it.el].icon}${ELEMENTS[it.el].name}` : it.type === "armor" ? `🛡️${it.def}` : `❤️+${it.hp}`;
    const prev = { ...S.eq, [it.type]: it.id };
    return `<div class="sitem ${own ? "own" : ""}">
      <div class="sprev">${charSVG(prev, S.color)}</div>
      <div class="sname"><b>${it.name}</b><small>${stat}</small></div>
      ${own ? `<button class="sbtn" disabled>もってる</button>` : `<button class="sbtn ${can ? "" : "no"}" onclick="buy('${it.id}')">🪙${it.price}${it.gem ? `<br>💎${it.gem}` : ""}</button>`}
    </div>`;
  }).join("");
  setScreen(`${topBar("ショップ")}
    <div class="tabs">${tabs.map(([k, l]) => `<button class="${k === shopTab ? "on" : ""}" onclick="shop('${k}')">${l}</button>`).join("")}</div>
    <div class="slist">${list}</div>`, "bg-shop");
}
function buy(id) {
  const it = itemById(id);
  if (S.coins < it.price || S.gems < (it.gem || 0)) { snd("ng"); toast(it.gem && S.gems < it.gem ? "💎が たりないよ（ニガテモンスターを たおそう）" : "コインが たりないよ"); return; }
  S.coins -= it.price; S.gems -= it.gem || 0; S.owned.push(id); S.eq[it.type] = id; save();
  snd("coin");
  shop();
  modal(`<div class="mtitle">${it.name} を てにいれた！</div><div class="hero sm">${charSVG(S.eq, S.color, "bounce")}</div>
    <p>さっそく そうびしたよ！</p><button class="big-btn primary" onclick="closeModal()">やったー！</button>`);
}

// ---------- そうび ----------
function equip() {
  const sec = (type, label) => {
    const its = ITEMS.filter((x) => x.type === type && S.owned.includes(x.id));
    return `<div class="esec"><div class="sub">${label}</div><div class="elist">${its.map((it) => `<button class="eitem ${S.eq[type] === it.id ? "sel" : ""}" onclick="doEquip('${type}','${it.id}')">
      ${type === "weapon" ? ELEMENTS[it.el].icon + " " : ""}${it.name}<small>${type === "weapon" ? "⚔️" + it.atk : type === "armor" ? "🛡️" + it.def : "❤️+" + it.hp}</small></button>`).join("")}</div></div>`;
  };
  setScreen(`${topBar("そうび")}
    <div class="eqtop"><div class="hero">${charSVG(S.eq, S.color, "bounce")}</div>
    <div class="stats"><span>⚔️ ${pAtk()}</span><span>🛡️ ${pDef()}</span><span>❤️ ${pMaxHp()}</span></div>
    <small class="note">❤️ は ずかんの ★の数だけ ふえるよ（いま +${totalStars()}）</small></div>
    ${sec("weapon", "ぶき")}${sec("armor", "よろい")}${sec("hat", "ぼうし")}
    <div class="esec"><div class="sub">からだの いろ</div><div class="colors">${BODY_COLORS.map((c) => `<button class="cdot ${S.color === c ? "sel" : ""}" style="background:${c}" onclick="setColor('${c}')"></button>`).join("")}</div></div>`, "bg-shop");
}
function doEquip(type, id) { S.eq[type] = id; save(); snd("ok"); equip(); }
function setColor(c) { S.color = c; save(); snd("tap"); equip(); }

// ---------- ずかん ----------
let zTab = "k";
function zukan(tab) {
  if (tab) zTab = tab;
  const ids = zTab === "k" ? KANJI.map((x) => "k:" + x.k) : FORMULAS.map((x) => "f:" + x.id);
  const got = ids.filter((id) => S.cards[id] && S.cards[id].s > 0).length;
  const tiles = ids.map((id) => {
    const c = S.cards[id];
    const lbl = zTab === "k" ? id.slice(2) : formulaOf(id).name;
    if (!c || c.s === 0) return `<button class="zc lock ${zTab}" onclick="toast('バトルで 正解すると カードに なるよ')"><b>？</b>${c && c.ng ? '<i class="ngm">👻</i>' : ""}</button>`;
    return `<button class="zc ${zTab} ${c.s >= 5 ? "shiny" : ""} ${c.ng ? "ngc" : ""}" onclick="cardDetail('${id}')"><b>${esc(lbl)}</b><span class="stars">${"★".repeat(c.s)}${"☆".repeat(5 - c.s)}</span>${c.ng ? '<i class="ngm">👻</i>' : ""}</button>`;
  }).join("");
  setScreen(`${topBar("ずかん")}
    <div class="tabs"><button class="${zTab === "k" ? "on" : ""}" onclick="zukan('k')">漢字カード</button><button class="${zTab === "f" ? "on" : ""}" onclick="zukan('f')">公式カード</button></div>
    <div class="zhead">あつめた カード <b>${got} / ${ids.length}</b>　★ごうけい <b>${totalStars()}</b>（❤️+${totalStars()}）</div>
    <p class="note">★は <b>ちがう日</b>に 正解すると 1つ アップ。★5で キラカードに！ 👻 は ニガテちゅう</p>
    <div class="zgrid ${zTab}">${tiles}</div>`, "bg-shop");
}
function cardDetail(id) {
  const c = S.cards[id];
  const stars = `<div class="stars big">${"★".repeat(c.s)}${"☆".repeat(5 - c.s)}</div>`;
  const next = c.ng ? "👻 ニガテちゅう！ あと " + (2 - c.st) + "回 正解で ニガテ解除" : c.s >= 5 ? "✨ キラカード！ かんぺき！" : c.last === today() ? "つぎの ★アップは あした いこうに 正解！" : "きょう 正解すると ★アップ！";
  let body;
  if (id.startsWith("k:")) {
    const K = kanjiOf(id);
    body = `<div class="kbig ${c.s >= 5 ? "shiny" : ""}">${K.k}</div><div class="words">${K.w.map(([w, r]) => `<div>${esc(w)}<small>（${r}）</small></div>`).join("")}</div>`;
  } else {
    const F = formulaOf(id);
    body = `<div class="fcard ${c.s >= 5 ? "shiny" : ""}"><b>${F.name}</b><div class="fml">${F.ans}</div><small>ひっさつわざ「${F.skill}」</small></div>`;
  }
  modal(`${body}${stars}<p class="small">${next}</p><p class="small">正解 ${c.cor} / ${c.tot} 回</p><button class="big-btn primary" onclick="closeModal()">とじる</button>`);
}

// ---------- ミッション ----------
function missions() {
  ensureDaily();
  const list = MISSIONS.map((m) => {
    const p = Math.min(m.goal, S.daily.prog[m.id] || 0), done = p >= m.goal, got = S.daily.claimed[m.id];
    const rw = m.reward.coin ? `🪙${m.reward.coin}` : `💎${m.reward.gem}`;
    return `<div class="mis ${got ? "got" : ""}"><div class="mtext"><b>${m.text}</b><div class="bar mb"><i style="width:${(p / m.goal) * 100}%"></i><span>${p} / ${m.goal}</span></div></div>
      <button class="sbtn ${done && !got ? "" : "no"}" ${done && !got ? `onclick="claim('${m.id}')"` : "disabled"}>${got ? "うけとった" : rw}</button></div>`;
  }).join("");
  setScreen(`${topBar("きょうの ミッション")}<div class="mlist">${list}</div>
    <p class="note">ミッションは まいにち あたらしくなるよ</p>`, "bg-shop");
}
function claim(id) {
  const m = MISSIONS.find((x) => x.id === id);
  S.daily.claimed[id] = true;
  if (m.reward.coin) S.coins += m.reward.coin;
  if (m.reward.gem) S.gems += m.reward.gem;
  save(); snd("coin"); missions();
  toast("ほうしゅうを うけとった！");
}

// ---------- 保護者メニュー ----------
let gateAns = 0;
function parent() {
  const a = 12 + Math.floor(Math.random() * 8), b = 13 + Math.floor(Math.random() * 7);
  gateAns = a * b;
  setScreen(`${topBar("せってい")}
    <div class="panel"><div class="sub">効果音</div><button class="big-btn" onclick="S.sound=!S.sound;save();parent()">${S.sound ? "🔊 オン" : "🔇 オフ"}</button></div>
    <div class="panel"><div class="sub">保護者の方へ</div><p class="small">学習の記録・バックアップは、次の計算の答えを入力すると開きます。</p>
    <div class="gate"><span>${a} × ${b} ＝</span><input id="gate" inputmode="numeric" autocomplete="off"><button class="sbtn" onclick="checkGate()">ひらく</button></div></div>`, "bg-shop");
}
function checkGate() {
  if (Number($("gate").value) === gateAns) parentPanel();
  else { snd("ng"); toast("答えが ちがいます"); }
}
function parentPanel() {
  const d = today(), td = S.stats.days[d] || { tot: 0, cor: 0 };
  const rate = (c, t) => (t ? Math.round((c / t) * 100) + "%" : "-");
  const kGot = KANJI.filter((x) => (S.cards["k:" + x.k] || {}).s > 0).length;
  const kMaster = KANJI.filter((x) => (S.cards["k:" + x.k] || {}).s >= 5).length;
  const fGot = FORMULAS.filter((x) => (S.cards["f:" + x.id] || {}).s > 0).length;
  const ng = nigateIds().map((id) => id.startsWith("k:") ? id.slice(2) : formulaOf(id).name);
  const last7 = [];
  for (let i = 6; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); const k = dateKey(dt); const v = S.stats.days[k] || { tot: 0, cor: 0 }; last7.push({ k: k.slice(5), ...v }); }
  const mx = Math.max(10, ...last7.map((x) => x.tot));
  setScreen(`${topBar("保護者メニュー", "parent")}
    <div class="panel"><div class="sub">きょう</div><p>解いた問題 <b>${td.tot}</b>問 ／ 正答率 <b>${rate(td.cor, td.tot)}</b></p>
      <div class="chart">${last7.map((x) => `<div class="cbar"><i style="height:${(x.tot / mx) * 100}%"></i><small>${x.k}</small><span>${x.tot}</span></div>`).join("")}</div>
      <p class="small">直近7日の解答数</p></div>
    <div class="panel"><div class="sub">これまで</div>
      <p>総解答 <b>${S.stats.tot}</b>問 ／ 正答率 <b>${rate(S.stats.cor, S.stats.tot)}</b></p>
      <p>漢字：出会った <b>${kGot}</b> / ${KANJI.length}字、★5（定着） <b>${kMaster}</b>字</p>
      <p>公式：出会った <b>${fGot}</b> / ${FORMULAS.length}</p>
      <p>苦手（ニガテ）：${ng.length ? ng.map(esc).join("、") : "なし"}</p></div>
    <div class="panel"><div class="sub">バックアップ</div>
      <p class="small">機種変更やデータ消去にそなえて、下の「コピー」でデータを保存しておけます（メモアプリ等に貼り付け）。</p>
      <textarea id="bk" rows="3" readonly>${btoa(unescape(encodeURIComponent(JSON.stringify(S))))}</textarea>
      <div class="row"><button class="big-btn" onclick="copyBk()">コピー</button><button class="big-btn" onclick="restoreBk()">復元する</button></div></div>
    <div class="panel"><div class="sub">データの初期化</div><button class="big-btn danger" onclick="resetAll()">はじめから やりなおす</button></div>`, "bg-shop");
}
function copyBk() {
  const t = $("bk"); t.select();
  try { navigator.clipboard.writeText(t.value).then(() => toast("コピーしました")); } catch (e) { document.execCommand("copy"); toast("コピーしました"); }
}
function restoreBk() {
  modal(`<div class="mtitle">データの復元</div><p class="small">保存しておいたコードを貼り付けてください。今のデータは上書きされます。</p>
    <textarea id="rk" rows="4"></textarea><div class="row"><button class="big-btn" onclick="closeModal()">やめる</button><button class="big-btn primary" onclick="doRestore()">復元</button></div>`);
}
function doRestore() {
  try {
    const o = JSON.parse(decodeURIComponent(escape(atob($("rk").value.trim()))));
    if (!o || o.v !== 1) throw new Error("bad");
    S = Object.assign(newSave(), o); save(); closeModal(); toast("復元しました"); home();
  } catch (e) { toast("コードが正しくありません"); }
}
function resetAll() {
  modal(`<div class="mtitle">本当に はじめから？</div><p class="small">コイン・そうび・カードが すべて きえます。</p>
    <div class="row"><button class="big-btn" onclick="closeModal()">やめる</button><button class="big-btn danger" onclick="S=newSave();save();closeModal();setup()">けす</button></div>`);
}

// ---------- 起動 ----------
load();
ensureDaily();
if (S.name) home(); else setup();
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
