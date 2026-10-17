// ===== ぷにまるクエスト：ゲーム本体 =====
"use strict";

// デバッグページ（PQ_DEBUG）では 本番とは 別の 場所に 保存する
const PQ_DEBUG = !!window.PQ_DEBUG;
const SLOTS_KEY = PQ_DEBUG ? "puniquest_debug_slots_v1" : "puniquest_slots_v1";
const OLD_SAVE_KEY = "puniquest_save_v1";
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
// デバッグでは 日付を 進められる（PQ_DAY 日 先）
const nowDate = () => new Date(Date.now() + (PQ_DEBUG ? (window.PQ_DAY || 0) * 86400000 : 0));
const today = () => dateKey(nowDate());
const yesterday = () => { const d = nowDate(); d.setDate(d.getDate() - 1); return dateKey(d); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- セーブデータ ----------
function newSave() {
  return {
    v: 1, name: "", color: BODY_COLORS[0], coins: 50, gems: 0, sound: false, bgm: false, aud: 1, mats: {},
    owned: ["w_stick", "a_cloth", "h_none", "x_none"], eq: { weapon: "w_stick", armor: "a_cloth", hat: "h_none", acc: "x_none" },
    cards: {}, cleared: {}, stClear: {}, tierClear: {}, stats: { tot: 0, cor: 0, days: {} },
    eggs: [], pets: [], partner: 0, petDex: {}, petUid: 0,
    daily: { date: "", prog: {}, claimed: {}, ngGems: 0 }, login: { last: "", streak: 0 }, tut: {},
  };
}
// 3つの「ぼうけんのしょ」。cur は いま遊んでいる番号（0〜2）
let SL = { cur: 0, slots: [null, null, null] };
let S = null;
function loadSlots() {
  try {
    const t = localStorage.getItem(SLOTS_KEY);
    if (t) { SL = Object.assign({ cur: 0, slots: [null, null, null] }, JSON.parse(t)); return; }
    // 以前のバージョンのデータは「ぼうけんのしょ1」に引っこす
    const o = PQ_DEBUG ? null : localStorage.getItem(OLD_SAVE_KEY);
    if (o) { SL.slots[0] = Object.assign(newSave(), JSON.parse(o), { savedAt: Date.now() }); writeSlots(); }
  } catch (e) { /* 保存できない環境でも遊べるようにする */ }
}
function writeSlots() { try { localStorage.setItem(SLOTS_KEY, JSON.stringify(SL)); } catch (e) { /* 無視 */ } }
// 自動セーブ：いまのぼうけんのしょに保存して、クラウドにも送る
function save() {
  if (!S) return;
  S.savedAt = Date.now();
  SL.slots[SL.cur] = S;
  writeSlots();
  Cloud.markDirty(SL.cur);
}

// 毎日ミッションの日付切りかえ
function ensureDaily() {
  if (S.daily.date !== today()) S.daily = { date: today(), prog: {}, claimed: {}, ngGems: 0 };
}
function addProg(key, n = 1) { ensureDaily(); S.daily.prog[key] = (S.daily.prog[key] || 0) + n; }

// ---------- ステータス ----------
const totalStars = () => Object.values(S.cards).reduce((a, c) => a + c.s, 0);
const pAtk = () => 5 + itemById(S.eq.weapon).atk;
// てきの じゃくてん（その属性に 強い属性）
const weakOf = (el) => Object.keys(BEATS).find((k) => BEATS[k] === el) || null;
const effNow = (wEl) => effect(wEl, B.e.el, B.e.imm);
// よろいの 属性で うけるダメージが かわる
function armorFactor(el) {
  const a = itemById(S.eq.armor);
  if (a.res === "all") return 0.75;
  if (a.res && a.res === el) return 0.5;
  if (a.weak && a.weak === el) return 1.5;
  return 1;
}
const effFx = (x) => (x === 0 ? "<small>きかない…</small>" : x >= 2 ? "<small>こうかばつぐん!</small>" : x < 1 ? "<small>いまひとつ…</small>" : "");
const effCls = (x) => (x === 0 ? "dmg nope" : x >= 2 ? "dmg weak" : x < 1 ? "dmg resist" : "dmg");
// そうびの せつめい文
function itemStat(it) {
  const sp = spText(it.sp);
  return baseStat(it) + (sp ? `<br><span class="spt">✨${sp}</span>` : "");
}
function baseStat(it) {
  if (it.type === "weapon") return `⚔️${it.atk} ${it.el === "none" ? "ぞくせいなし（いつも ふつう）" : it.el === "star" ? "✨ほし（ぜんぶに よくきく）" : `${ELEMENTS[it.el].icon}${ELEMENTS[it.el].name}`}`;
  if (it.type === "armor") {
    if (it.res === "all") return `🛡️${it.def} ぜんぶの こうげきに つよい`;
    return `🛡️${it.def}${it.res ? ` ${ELEMENTS[it.res].icon}に つよい` : ""}${it.weak ? ` ${ELEMENTS[it.weak].icon}に よわい` : ""}`;
  }
  if (it.type === "acc") return it.sp ? "🎀 アクセサリー" : "🎀 見た目の アクセサリー";
  return `❤️+${it.hp}`;
}
function addMat(k, n = 1) { S.mats[k] = (S.mats[k] || 0) + n; S.matSeen = S.matSeen || {}; S.matSeen[k] = 1; }
// 一度でも 手に入れた そざいか（前の版の データは もちものに 名前が あれば）
const matSeen = (k) => (PQ_DEBUG && window.PQ_ZUKANALL) || !!((S.matSeen || {})[k] || (S.mats || {})[k] !== undefined);
const pDef = () => itemById(S.eq.armor).def;
// カードの★10こで たいりょく+1（さいだい+100）
const starHp = () => Math.min(100, Math.floor(totalStars() / 10));
const pMaxHp = () => 100 + itemById(S.eq.hat).hp + starHp();

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
  // れんぞく正解の数・今日 正解した数（出題の 頻度に 使う）
  c.cs = (c.cs || 0) + 1;
  if (c.td !== d) { c.td = d; c.tc = 0; }
  c.tc++;
  if (typeof B !== "undefined" && B && B.done) B.done[id] = (B.done[id] || 0) + 1;
  let ev = null;
  if (c.ng) {
    c.st++;
    if (c.st >= 2) { c.ng = false; c.st = 0; ev = "cleared"; }
    if (c.s === 0) { c.s = 1; c.last = d; ev = "new"; }
  } else if (c.s === 0) { c.s = 1; c.last = d; ev = "new"; }
  else if (c.last !== d && c.s < 5) { c.s++; c.last = d; ev = "up"; }
  if (ev === "new" || ev === "up") addProg("starup3");
  // タマゴもいっしょに育つ
  if (growEggs(hsp().egg || 1) && typeof B !== "undefined" && B && $("fx")) fxText("🥚 タマゴが うごいた！", "card");
  return ev;
}
function onWrong(id) {
  const c = card(id);
  c.tot++; c.ng = true; c.st = 0; c.cs = 0; recordStat(false);
  if (typeof B !== "undefined" && B && B.done) B.done[id] = 0;
}
const nigateIds = () => Object.keys(S.cards).filter((id) => S.cards[id].ng);

// ---------- 効果音（WebAudioで鳴らす） ----------
let AC = null;
function snd(type) {
  if (S && !S.sound) return;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    // 正解の「ピンポン！」（チャイムのような 2つの 音）
    if (type === "pinpon") {
      const t0 = AC.currentTime;
      [[1319, 0], [1047, 0.2]].forEach(([f, dt]) => {
        [1, 2].forEach((h) => {
          const o = AC.createOscillator(), g = AC.createGain();
          o.type = "sine"; o.frequency.value = f * h;
          const v = h === 1 ? 0.16 : 0.03;
          g.gain.setValueAtTime(0.0001, t0 + dt);
          g.gain.exponentialRampToValueAtTime(v, t0 + dt + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.6);
          o.connect(g).connect(AC.destination);
          o.start(t0 + dt); o.stop(t0 + dt + 0.65);
        });
      });
      return;
    }
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
  const w = itemById(eq.weapon), a = itemById(eq.armor), h = itemById(eq.hat), x = itemById(eq.acc || "x_none");
  const dark = shade(color, -0.3), n = ++svgN;
  return `<svg viewBox="-10 -10 230 210" class="chr ${cls}">
    <defs><clipPath id="cb${n}"><circle cx="100" cy="112" r="62"/></clipPath></defs>
    ${backSVG(x, a)}
    <ellipse cx="100" cy="186" rx="62" ry="8" fill="rgba(0,0,0,.13)"/>
    <ellipse cx="68" cy="172" rx="27" ry="14" fill="${FEET[color] || dark}"/>
    <ellipse cx="132" cy="172" rx="27" ry="14" fill="${FEET[color] || dark}"/>
    ${["h_none", "h_ribbon", "h_halo", "h_flower", "h_bow", "h_starclip", "h_goggles", "h_glasses", "h_helmet"].includes(h.id) && !(a.full && fullHidesSprout(a)) ? `
    <path d="M100 54 C100 42 101 36 103 30" stroke="#47a84a" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M103 31 C 90 16, 76 22, 79 31 C 89 37, 98 35, 103 31Z" fill="#6ccf6a"/>
    <path d="M103 31 C 116 15, 131 21, 128 30 C 118 36, 108 35, 103 31Z" fill="#8ee08a"/>` : ""}
    <ellipse cx="40" cy="124" rx="16" ry="14" fill="${color}" stroke="${dark}" stroke-width="2"/>
    <circle cx="100" cy="112" r="62" fill="${color}"/>
    <g clip-path="url(#cb${n})">${a.full ? fullSVG(a, color) : armorSVG(a)}</g>
    <circle cx="100" cy="112" r="62" fill="none" stroke="${dark}" stroke-width="2.5"/>
    ${a.full ? fullOutSVG(a) : ""}
    <ellipse cx="74" cy="78" rx="17" ry="9" fill="rgba(255,255,255,.55)" transform="rotate(-30 74 78)"/>
    <ellipse cx="84" cy="100" rx="7.5" ry="13" fill="#2b2140"/><ellipse cx="116" cy="100" rx="7.5" ry="13" fill="#2b2140"/>
    <ellipse cx="85.5" cy="94" rx="3.2" ry="5" fill="#fff"/><ellipse cx="117.5" cy="94" rx="3.2" ry="5" fill="#fff"/>
    <ellipse cx="66" cy="119" rx="11" ry="6" fill="#ff6f9f" opacity=".5"/><ellipse cx="134" cy="119" rx="11" ry="6" fill="#ff6f9f" opacity=".5"/>
    <path d="M93 121 Q100 131 107 121 Z" fill="#e0526e" stroke="#2b2140" stroke-width="2.5" stroke-linejoin="round"/>
    ${faceSVG(x)}
    ${hatSVG(h, color, dark)}
    ${weaponSVG(w)}
    <ellipse cx="162" cy="124" rx="16" ry="14" fill="${color}" stroke="${dark}" stroke-width="2"/>
  </svg>`;
}

// きらきらの 小さな 星
const spark = (x, y, r = 5, c = "#fff") => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="${c}"/>`;

function armorSVG(a) {
  if (a.pattern) return patternSVG(a);
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


// 見た目重視の よろい（pattern）
function patternSVG(a) {
  const c = a.color, d = shade(c, -0.25), base = `<rect x="30" y="134" width="140" height="60" fill="${c}"/>`;
  switch (a.pattern) {
    case "stripes": return `${base}${[140, 156, 172, 188].map((y) => `<rect x="30" y="${y}" width="140" height="7" fill="#fff" opacity=".75"/>`).join("")}
      <circle cx="100" cy="150" r="3.5" fill="#ffe066"/><circle cx="100" cy="166" r="3.5" fill="#ffe066"/><path d="M76 134 L100 146 L124 134" fill="none" stroke="${d}" stroke-width="3"/>`;
    case "box": return `${base}<rect x="30" y="134" width="140" height="6" fill="${d}"/><rect x="92" y="134" width="16" height="60" fill="#e8d3a8" opacity=".85"/>
      <path d="M50 150 l10 10 M62 148 l-14 14" stroke="#8d6e63" stroke-width="2"/><text x="136" y="166" text-anchor="middle" font-size="11" font-weight="bold" fill="#6d4c41">こわれもの</text>
      <path d="M126 174 l6 -6 6 6 -3 0 0 6 -6 0 0 -6Z" fill="#6d4c41"/>`;
    case "tux": return `${base}<path d="M78 134 L100 176 L122 134Z" fill="#fff"/><path d="M90 140 L100 146 L110 140 L110 152 L100 146 L90 152Z" fill="#e53935"/>
      <circle cx="100" cy="160" r="2.5" fill="#263238"/><circle cx="100" cy="170" r="2.5" fill="#263238"/><path d="M60 150 l12 0" stroke="#fff" stroke-width="3"/><path d="M62 148 l8 -6" stroke="#ff8fb0" stroke-width="4" stroke-linecap="round"/>`;
    case "frill": return `${base}${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<circle cx="${34 + i * 15}" cy="136" r="8" fill="#fff"/>`).join("")}
      ${[[56, 160], [84, 176], [116, 162], [146, 178], [70, 186]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff" opacity=".8"/>`).join("")}
      <g transform="translate(100 152)"><path d="M0 0 L-14 -9 L-14 9Z" fill="#ff5c8a"/><path d="M0 0 L14 -9 L14 9Z" fill="#ff5c8a"/><circle r="4.5" fill="#ff8fb0"/></g>`;
    case "space": return `${base}<rect x="30" y="134" width="140" height="7" fill="#b0bec5"/><rect x="80" y="148" width="40" height="26" rx="5" fill="#455a64"/>
      <circle cx="90" cy="157" r="4" fill="#ff5252"/><circle cx="100" cy="157" r="4" fill="#ffd23f"/><circle cx="110" cy="157" r="4" fill="#69f0ae"/><rect x="86" y="165" width="28" height="4" rx="2" fill="#80deea"/>
      <circle cx="56" cy="156" r="8" fill="#1e88e5"/>${spark(56, 156, 5)}<rect x="132" y="150" width="20" height="12" fill="#ef5350"/><rect x="132" y="150" width="8" height="6" fill="#1565c0"/>`;
    case "robe": return `${base}<path d="M100 134 L100 196" stroke="#ffd54f" stroke-width="5"/><path d="M30 138 Q100 150 170 138" stroke="#ffd54f" stroke-width="5" fill="none"/>${[[62, 162, 5], [138, 170, 6], [80, 184, 3], [122, 150, 3]].map(([x, y, r]) => spark(x, y, r, "#fff59d")).join("")}<circle cx="100" cy="146" r="6" fill="#e53935" stroke="#ffd54f" stroke-width="2"/>`;
    case "sparkle": return `<defs><linearGradient id="gsp" x1="0" x2="1"><stop offset="0" stop-color="#d6a8ff"/><stop offset=".5" stop-color="#ffb3e6"/><stop offset="1" stop-color="#9fd8ff"/></linearGradient></defs>
      <rect x="30" y="134" width="140" height="60" fill="url(#gsp)"/>${[[50, 150, 6], [74, 172, 4], [100, 152, 8], [126, 176, 5], [150, 154, 6], [88, 186, 3], [138, 140, 3]].map(([x, y, r]) => spark(x, y, r)).join("")}`;
  }
  return base;
}

function hatSVG(h, color, dark) {
  const lk = hatLook(h);
  if (lk) return lk;
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
  if (w.look) return lookSVG(w);
  const big = w.atk >= 28;
  const glow = big ? `<circle cx="0" cy="-74" r="26" fill="${ELEMENTS[w.el].color}" opacity=".25"/>` : "";
  const handle = `<rect x="-4" y="-62" width="8" height="78" rx="4" fill="${big ? "#6d4c41" : "#a0704a"}"/>`;
  let top = "";
  switch (w.el) {
    case "none":
      if (w.id === "w_hammer") return `<g transform="translate(164 122) rotate(15)"><rect x="-4" y="-62" width="8" height="78" rx="4" fill="#a0704a"/><rect x="-20" y="-86" width="40" height="28" rx="8" fill="#9e9e9e" stroke="#616161" stroke-width="2.5"/><path d="M-12 -78 l8 4 M6 -70 l8 -4" stroke="#757575" stroke-width="2"/></g>`;
      if (w.id === "w_steel") return `<g transform="translate(164 122) rotate(20)"><rect x="-4" y="-6" width="8" height="22" rx="3" fill="#455a64"/><rect x="-15" y="-11" width="30" height="7" rx="3" fill="#90a4ae"/><path d="M-7 -11 L-7 -88 L0 -100 L7 -88 L7 -11Z" fill="#eceff1" stroke="#78909c" stroke-width="2"/><path d="M0 -16 L0 -88" stroke="#b0bec5" stroke-width="2"/></g>`;
      return `<g transform="translate(164 122) rotate(25)"><rect x="-5" y="-66" width="10" height="82" rx="5" fill="#b07a4a" stroke="#7a5230" stroke-width="2"/><circle cx="0" cy="-48" r="3" fill="#7a5230"/></g>`;
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

// 新しい 武器の 見た目（look）
function lookSVG(w) {
  const c = ELEMENTS[w.el].color, big = w.atk >= 26;
  const glow = big ? `<circle cx="0" cy="-70" r="24" fill="${c}" opacity=".22"/>` : "";
  const g = (rot, body) => `<g transform="translate(164 122) rotate(${rot})">${glow}${body}</g>`;
  switch (w.look) {
    case "sling": return g(15, `<rect x="-3" y="-40" width="6" height="56" rx="3" fill="#a0704a"/><path d="M0 -40 L-14 -66 M0 -40 L14 -66" stroke="#a0704a" stroke-width="6" stroke-linecap="round"/><path d="M-14 -66 Q0 -54 14 -66" stroke="#ff8a65" stroke-width="3" fill="none"/>`);
    case "axe": return g(15, `<rect x="-4" y="-80" width="8" height="96" rx="4" fill="#6d4c41"/><path d="M4 -84 Q40 -76 34 -50 Q20 -58 4 -56Z" fill="${big ? "#b0bec5" : "#9e9e9e"}" stroke="#546e7a" stroke-width="2.5"/><path d="M-4 -84 Q-28 -76 -24 -58 Q-14 -62 -4 -62Z" fill="#cfd8dc" stroke="#546e7a" stroke-width="2"/>`);
    case "knife": return g(20, `<rect x="-4" y="-6" width="8" height="20" rx="3" fill="${w.sp && w.sp.drain ? "#880e4f" : "#5d4037"}"/><rect x="-12" y="-10" width="24" height="6" rx="3" fill="#90a4ae"/><path d="M-6 -10 L-6 -58 L0 -70 L6 -58 L6 -10Z" fill="${w.sp && w.sp.drain ? "#e57373" : "#eceff1"}" stroke="#78909c" stroke-width="2"/>`);
    case "whip": return g(-10, `<rect x="-4" y="-10" width="8" height="26" rx="4" fill="#5d4037"/><path d="M0 -10 C 30 -40, -30 -60, 10 -100" stroke="#4caf50" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="6" cy="-40" r="3" fill="#ff7043"/><circle cx="-4" cy="-66" r="3" fill="#ff7043"/>`);
    case "spear": return g(20, `<rect x="-3" y="-92" width="6" height="108" rx="3" fill="#8d6e63"/><path d="M0 -112 L10 -92 L0 -86 L-10 -92Z" fill="${c}" stroke="#455a64" stroke-width="2"/>`);
    case "brush": return g(20, `<rect x="-4" y="-80" width="8" height="90" rx="4" fill="${w.atk >= 40 ? "#ffd23f" : w.atk >= 26 ? "#ffca28" : "#795548"}"/><path d="M-6 -80 Q0 -112 6 -80Z" fill="#212121"/><circle cx="0" cy="-4" r="5" fill="#e53935"/>`);
    case "harp": return g(10, `<path d="M-14 0 Q-20 -60 10 -80 L14 -76 Q-6 -56 0 0Z" fill="#ffd23f" stroke="#c99a00" stroke-width="2"/><path d="M-10 -6 L10 -76 M-6 -6 L12 -60 M-2 -6 L12 -44" stroke="#fff" stroke-width="1.5"/>`);
    case "ruler": return g(15, `<rect x="-7" y="-96" width="14" height="110" rx="2" fill="${w.atk >= 38 ? "#80deea" : "#ffe082"}" stroke="#f9a825" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="-7" y1="${-88 + i * 12}" x2="${i % 2 ? -1 : 2}" y2="${-88 + i * 12}" stroke="#795548" stroke-width="1.5"/>`).join("")}`);
    case "flask": return g(0, `<rect x="-3" y="-30" width="6" height="40" rx="3" fill="#8d6e63"/><path d="M-6 -66 L-6 -52 L-20 -30 Q-22 -22 -14 -22 L14 -22 Q22 -22 20 -30 L6 -52 L6 -66Z" fill="#e1f5fe" stroke="#0288d1" stroke-width="2"/><path d="M-16 -30 L16 -30 L19 -25 L-19 -25Z" fill="${c}"/><circle cx="-2" cy="-74" r="5" fill="${c}" opacity=".7"/>`);
    case "ladle": return g(18, `<rect x="-3" y="-66" width="6" height="82" rx="3" fill="#b0bec5" stroke="#78909c" stroke-width="1.5"/><path d="M-18 -80 Q-18 -58 0 -58 Q18 -58 18 -80Z" fill="#cfd8dc" stroke="#78909c" stroke-width="2"/><ellipse cx="0" cy="-80" rx="18" ry="4" fill="#ffcc80"/><circle cx="0" cy="12" r="4" fill="#78909c"/>`);
    case "harisen": return g(18, `<rect x="-6" y="-24" width="12" height="40" rx="3" fill="#fff" stroke="#9e9e9e" stroke-width="2"/><rect x="-6" y="-6" width="12" height="8" fill="#e53935"/><path d="M-6 -24 L-26 -100 L26 -100 L6 -24Z" fill="#fff" stroke="#9e9e9e" stroke-width="2" stroke-linejoin="round"/>${[-16, -8, 0, 8, 16].map((x) => `<path d="M${x / 4} -24 L${x} -100" stroke="#bdbdbd" stroke-width="1.5"/>`).join("")}`);
    case "bread": return g(22, `<ellipse cx="0" cy="-42" rx="12" ry="62" fill="#e0a85a" stroke="#a86b2d" stroke-width="2.5"/>${[-80, -60, -40, -20, 0].map((y) => `<path d="M-7 ${y + 6} Q0 ${y - 2} 7 ${y - 8}" stroke="#fff3d6" stroke-width="3" fill="none" stroke-linecap="round"/>`).join("")}`);
    case "heart": return g(15, `<rect x="-3" y="-66" width="6" height="82" rx="3" fill="#fff" stroke="#ff8fb0" stroke-width="2"/><path d="M0 -62 C-30 -80 -24 -106 -10 -104 C-4 -104 0 -98 0 -94 C0 -98 4 -104 10 -104 C24 -106 30 -80 0 -62Z" fill="#ff5c8a" stroke="#d81b60" stroke-width="2.5" stroke-linejoin="round"/>${spark(-10, -92, 4)}<path d="M-6 -60 q6 8 12 0" stroke="#ffd23f" stroke-width="3" fill="none"/>`);
    case "tuna": return g(12, `<path d="M0 8 L-12 22 L12 22Z" fill="#455a64"/><path d="M0 10 Q-18 -40 0 -108 Q18 -40 0 10Z" fill="#78909c" stroke="#37474f" stroke-width="2.5"/><path d="M0 4 Q-10 -40 0 -96" stroke="#eceff1" stroke-width="3" fill="none"/><circle cx="-4" cy="-92" r="3.5" fill="#fff" stroke="#212121" stroke-width="1.5"/><path d="M6 -60 l10 -6 -2 12Z" fill="#ffd23f"/>`);
    case "starwand": return g(10, `<circle cx="0" cy="-86" r="32" fill="#c77dff" opacity=".2"/><rect x="-3" y="-66" width="6" height="82" rx="3" fill="#ffd23f"/><path d="M0 -114 l8 17 19 2 -14 13 4 19 -17 -9 -17 9 4 -19 -14 -13 19 -2Z" fill="#fff6c2" stroke="#ffb300" stroke-width="2.5" stroke-linejoin="round"/>
      ${spark(-28, -70, 6, "#ffe066")}${spark(26, -108, 5, "#9fd8ff")}${spark(-22, -112, 4, "#ffb3e6")}${spark(20, -60, 4, "#fff")}`);
    case "shine": return g(20, `<circle cx="0" cy="-60" r="34" fill="#fff6c2" opacity=".35"/><rect x="-4" y="-6" width="8" height="22" rx="3" fill="#7e57c2"/><path d="M-16 -12 Q0 -4 16 -12 L14 -4 Q0 2 -14 -4Z" fill="#ffd23f" stroke="#c99a00" stroke-width="1.5"/><circle cx="0" cy="-8" r="4" fill="#4aa8ff"/>
      <path d="M-8 -12 L-8 -92 L0 -108 L8 -92 L8 -12Z" fill="#e3f2fd" stroke="#90caf9" stroke-width="2"/><path d="M0 -18 L0 -96" stroke="#fff" stroke-width="3"/>${spark(-18, -90, 7)}${spark(16, -50, 5, "#ffe066")}${spark(-14, -36, 4, "#ffb3e6")}`);
    case "bolt": return g(10, `<rect x="-4" y="-6" width="8" height="22" rx="3" fill="#5d4037"/><rect x="-13" y="-10" width="26" height="6" rx="3" fill="#ffd23f"/><path d="M-2 -10 L10 -50 L0 -50 L12 -100 L-12 -44 L-2 -44 L-10 -10Z" fill="#ffe14d" stroke="#e0a000" stroke-width="2.5" stroke-linejoin="round"/>${spark(16, -78, 6, "#fff59d")}`);
    case "magnet": return g(15, `<rect x="-4" y="-60" width="8" height="76" rx="4" fill="#8d6e63"/><path d="M-22 -60 L-22 -84 Q-22 -102 0 -102 Q22 -102 22 -84 L22 -60 L10 -60 L10 -84 Q10 -90 0 -90 Q-10 -90 -10 -84 L-10 -60Z" fill="#e53935" stroke="#8e1b1b" stroke-width="2"/><rect x="-22" y="-66" width="12" height="8" fill="#eceff1"/><rect x="10" y="-66" width="12" height="8" fill="#eceff1"/><path d="M-30 -96 l-6 -6 M30 -96 l6 -6 M-34 -80 l-8 0 M34 -80 l8 0" stroke="#ffd23f" stroke-width="2.5" stroke-linecap="round"/>`);
    case "kotostaff": return g(12, `<rect x="-3" y="-70" width="6" height="86" rx="3" fill="#a1887f"/><path d="M-20 -104 Q-20 -114 -10 -114 L18 -114 Q28 -114 28 -104 L28 -86 Q28 -76 18 -76 L2 -76 L-6 -66 L-6 -76 L-10 -76 Q-20 -76 -20 -86Z" fill="#fff" stroke="#66bb6a" stroke-width="2.5"/><path d="M-12 -102 L18 -102 M-12 -94 L20 -94 M-12 -86 L10 -86" stroke="#66bb6a" stroke-width="2.5" stroke-linecap="round"/>`);
    case "kotosword": return g(20, `<rect x="-4" y="-6" width="8" height="22" rx="3" fill="#33691e"/><path d="M-16 -12 Q0 -2 16 -12 L14 -4 Q0 4 -14 -4Z" fill="#ffd23f"/><path d="M-8 -12 L-8 -92 L0 -108 L8 -92 L8 -12Z" fill="#f1f8e9" stroke="#7cb342" stroke-width="2"/><text x="0" y="-74" text-anchor="middle" font-size="12" font-weight="bold" fill="#558b2f">こ</text><text x="0" y="-56" text-anchor="middle" font-size="12" font-weight="bold" fill="#558b2f">と</text><text x="0" y="-38" text-anchor="middle" font-size="12" font-weight="bold" fill="#558b2f">ば</text>`);
    case "rainbowboom": return g(-15, `${["#ff5252", "#ffab40", "#ffee58", "#69f0ae", "#40c4ff", "#b388ff"].map((cl, i) => `<path d="M${-34 + i * 3} -40 Q0 ${-96 + i * 4} ${34 - i * 3} -40" fill="none" stroke="${cl}" stroke-width="5" stroke-linecap="round"/>`).join("")}<circle cx="0" cy="-40" r="5" fill="#fff" stroke="#b388ff" stroke-width="2"/>${spark(-30, -84, 5)}${spark(30, -86, 4, "#fff59d")}`);
    case "laser": return g(30, `<rect x="-9" y="-10" width="18" height="26" rx="5" fill="#455a64"/><rect x="-12" y="-60" width="24" height="54" rx="8" fill="#eceff1" stroke="#90a4ae" stroke-width="2.5"/><rect x="-7" y="-52" width="14" height="10" rx="3" fill="#4fc3f7"/><circle cx="0" cy="-30" r="5" fill="#ef5350"/><rect x="-5" y="-74" width="10" height="16" rx="3" fill="#90a4ae"/><path d="M0 -74 L0 -112" stroke="#ff4081" stroke-width="5" stroke-linecap="round"/><path d="M0 -74 L0 -112" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`);
    case "gearsword": return g(20, `<rect x="-4" y="-6" width="8" height="22" rx="3" fill="#37474f"/><circle cx="0" cy="-8" r="11" fill="#ffd23f" stroke="#c99a00" stroke-width="2"/><circle cx="0" cy="-8" r="4" fill="#37474f"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-3" y="-23" width="6" height="7" fill="#ffd23f" transform="rotate(${a} 0 -8)"/>`).join("")}<path d="M-8 -20 L-8 -96 L0 -110 L8 -96 L8 -20Z" fill="#cfd8dc" stroke="#546e7a" stroke-width="2"/>${[-40, -64, -88].map((y) => `<circle cx="0" cy="${y}" r="5" fill="none" stroke="#546e7a" stroke-width="2"/>`).join("")}${spark(14, -70, 5, "#fff59d")}`);
    case "comet": return g(8, `<path d="M8 -86 Q40 -60 44 -14 Q24 -50 4 -70Z" fill="#b388ff" opacity=".55"/><path d="M8 -86 Q30 -64 30 -30 Q16 -56 2 -72Z" fill="#80d8ff" opacity=".7"/><rect x="-3" y="-66" width="6" height="82" rx="3" fill="#7e57c2"/><circle cx="0" cy="-86" r="16" fill="#fff59d" stroke="#ffb300" stroke-width="2.5"/><circle cx="0" cy="-86" r="7" fill="#fff"/>${spark(-22, -104, 5)}${spark(-18, -70, 4, "#b3e5fc")}`);
    case "rainbowsword": return g(18, `<circle cx="0" cy="-62" r="36" fill="#fff" opacity=".35"/><rect x="-4" y="-6" width="8" height="22" rx="3" fill="#7e57c2"/><path d="M-18 -12 Q0 -2 18 -12 L16 -4 Q0 4 -16 -4Z" fill="#ffd23f" stroke="#c99a00" stroke-width="1.5"/>
      ${["#ff5252", "#ffab40", "#ffee58", "#69f0ae", "#40c4ff", "#b388ff"].map((cl, i) => `<path d="M${-9 + i * 3} -12 L${-9 + i * 3} -98 L${-6 + i * 3} -104 L${-6 + i * 3} -12Z" fill="${cl}"/>`).join("")}<path d="M-9 -98 L0 -114 L9 -98" fill="#fff" stroke="#b388ff" stroke-width="1.5"/>${spark(-20, -90, 7)}${spark(18, -54, 5, "#fff59d")}${spark(-16, -40, 4, "#ffb3e6")}`);
    case "greatsword": return g(22, `<rect x="-5" y="-4" width="10" height="26" rx="3" fill="#3e2723"/><rect x="-22" y="-12" width="44" height="9" rx="4" fill="#78909c" stroke="#455a64" stroke-width="2"/><path d="M-13 -12 L-13 -100 L0 -118 L13 -100 L13 -12Z" fill="#b0bec5" stroke="#455a64" stroke-width="2.5"/><path d="M0 -18 L0 -104" stroke="#eceff1" stroke-width="3"/>`);
    case "katana": return g(22, `<rect x="-4" y="-4" width="8" height="22" rx="3" fill="#263238"/><ellipse cx="0" cy="-6" rx="11" ry="4" fill="#ffd23f"/><path d="M-4 -8 Q-8 -60 6 -104 L8 -102 Q0 -60 4 -8Z" fill="#eceff1" stroke="#90a4ae" stroke-width="1.5"/>`);
  }
  return "";
}

// 新しい ぼうしの 見た目
function hatLook(h) {
  switch (h.id) {
    case "h_flower": return `${[60, 80, 100, 120, 140].map((x, i) => `<circle cx="${x}" cy="${58 - (i % 2) * 6}" r="9" fill="${["#ff8fb0", "#ffe066", "#8fd3ff", "#ffb74d", "#c39bff"][i]}"/><circle cx="${x}" cy="${58 - (i % 2) * 6}" r="3.5" fill="#fff"/>`).join("")}`;
    case "h_goggles": return `<rect x="56" y="60" width="88" height="8" rx="4" fill="#5d4037"/><circle cx="82" cy="64" r="14" fill="#80deea" stroke="#5d4037" stroke-width="4"/><circle cx="118" cy="64" r="14" fill="#80deea" stroke="#5d4037" stroke-width="4"/><ellipse cx="78" cy="60" rx="4" ry="3" fill="#fff" opacity=".8"/>`;
    case "h_mortar": return `<path d="M72 62 Q100 48 128 62 L126 70 Q100 60 74 70Z" fill="#283593"/><path d="M58 50 L100 34 L142 50 L100 66Z" fill="#3949ab" stroke="#1a237e" stroke-width="2"/><path d="M128 54 L132 78" stroke="#ffd23f" stroke-width="3"/><circle cx="132" cy="80" r="4" fill="#ffd23f"/>`;
    case "h_bow": return `<g transform="translate(140 62) rotate(20)"><path d="M0 0 L-20 -13 L-20 13Z" fill="#4aa8ff"/><path d="M0 0 L20 -13 L20 13Z" fill="#4aa8ff"/><circle r="7" fill="#8fd3ff"/></g>`;
    case "h_starclip": return `<path d="M136 46 l5 10 11 1 -8 7 3 11 -11 -6 -11 6 3 -11 -8 -7 11 -1Z" fill="#ffe066" stroke="#e0a800" stroke-width="2" stroke-linejoin="round"/>`;
    case "h_party": return `<g transform="rotate(-12 100 56)"><path d="M78 60 L100 0 L122 60Z" fill="#4aa8ff" stroke="#1e6fd1" stroke-width="2" stroke-linejoin="round"/><path d="M90 30 L110 30 L114 42 L86 42Z" fill="#ffe066"/><path d="M83 50 L117 50 L120 58 L80 58Z" fill="#ff5c8a"/><circle cx="100" cy="0" r="7" fill="#ff8fb0"/></g>`;
    case "h_chonmage": return `<path d="M58 70 Q100 30 142 70 Q100 54 58 70Z" fill="#cfe8ff" opacity=".9"/><path d="M92 54 Q86 36 108 30 Q122 28 128 36 Q114 36 106 42 Q100 48 104 56Z" fill="#212121"/><rect x="96" y="46" width="12" height="7" rx="2" fill="#fff"/>`;
    case "h_bunny": return `<path d="M76 62 Q58 6 72 0 Q90 6 88 58Z" fill="#fff" stroke="#e0c4d4" stroke-width="2.5"/><path d="M76 54 Q66 16 73 10 Q83 18 83 52Z" fill="#ffc1d9"/>
      <path d="M124 62 Q142 6 128 0 Q110 6 112 58Z" fill="#fff" stroke="#e0c4d4" stroke-width="2.5"/><path d="M124 54 Q134 16 127 10 Q117 18 117 52Z" fill="#ffc1d9"/>`;
    case "h_glasses": return `<rect x="66" y="88" width="32" height="22" rx="9" fill="#212121"/><rect x="102" y="88" width="32" height="22" rx="9" fill="#212121"/><path d="M98 94 L102 94" stroke="#212121" stroke-width="4"/>
      <path d="M66 94 L44 88 M134 94 L156 88" stroke="#212121" stroke-width="3"/><path d="M72 92 L80 92" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/><path d="M108 92 L116 92" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;
    case "h_afro": return `${[[56, 66, 20], [70, 44, 24], [100, 34, 28], [130, 44, 24], [144, 66, 20], [86, 56, 20], [114, 56, 20]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#3e2723"/>`).join("")}
      ${[[78, 36], [104, 22], [128, 40], [62, 58], [140, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#5d4037"/>`).join("")}<g transform="translate(136 22) rotate(20)"><rect x="-3" y="0" width="6" height="18" fill="#ff5c8a"/><rect x="-9" y="-12" width="18" height="12" rx="2" fill="#ff5c8a"/></g>`;
    case "h_pumpkin": return `<path d="M100 22 Q100 10 108 6" stroke="#5d4037" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M108 10 Q122 2 126 14 Q114 16 108 10Z" fill="#4cc46a"/>
      <ellipse cx="78" cy="48" rx="22" ry="24" fill="#ff8f1f" stroke="#e65100" stroke-width="2"/><ellipse cx="122" cy="48" rx="22" ry="24" fill="#ff8f1f" stroke="#e65100" stroke-width="2"/><ellipse cx="100" cy="46" rx="22" ry="26" fill="#ffa726" stroke="#e65100" stroke-width="2"/>
      <path d="M90 40 l5 -8 5 8Z M104 40 l5 -8 5 8Z" fill="#5d2a00"/><path d="M88 54 Q100 62 112 54 l-4 4 -4 -3 -4 3 -4 -3 -4 3Z" fill="#5d2a00"/>`;
    case "h_helmet": return `<circle cx="100" cy="112" r="76" fill="#b3e5fc" opacity=".22" stroke="#eceff1" stroke-width="7"/><circle cx="100" cy="112" r="76" fill="none" stroke="#90a4ae" stroke-width="2"/>
      <path d="M52 64 Q66 46 86 42" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/><path d="M100 36 L100 18" stroke="#90a4ae" stroke-width="4"/><circle cx="100" cy="14" r="6" fill="#ff5252"/>`;
    case "h_tiara": return `<path d="M68 62 L74 40 L86 52 L100 26 L114 52 L126 40 L132 62 Q100 54 68 62Z" fill="#eceff1" stroke="#90a4ae" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="100" cy="44" r="6" fill="#ff5c8a"/><circle cx="82" cy="56" r="3.5" fill="#4aa8ff"/><circle cx="118" cy="56" r="3.5" fill="#c77dff"/>${spark(100, 18, 6, "#ffe066")}${spark(66, 32, 4, "#fff6c2")}${spark(136, 30, 4, "#fff6c2")}`;
    case "h_kabuto": return `<path d="M50 74 Q50 30 100 28 Q150 30 150 74 Z" fill="#37474f" stroke="#212121" stroke-width="2.5"/><path d="M44 74 L156 74 L150 82 L50 82Z" fill="#455a64"/><path d="M100 30 L78 4 L88 30Z M100 30 L122 4 L112 30Z" fill="#ffd23f" stroke="#c99a00" stroke-width="2"/><circle cx="100" cy="46" r="7" fill="#e53935"/>`;
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
  if (typeof BGM !== "undefined") BGM.auto(cls);
  if (typeof updateV !== "undefined" && updateV) $("updbar").classList.toggle("hidden", cls === "bg-battle");
  // 固定した 帯の 高さを はかって、タブを その下に 固定する
  const tb = app.querySelector(".topbar");
  if (tb) app.style.setProperty("--tbh", tb.getBoundingClientRect().height - 2 + "px");
  window.scrollTo(0, 0);
}
function go(name, arg) {
  snd("tap");
  ({ home, map, shop, equip, zukan, missions, parent, nakama, openWorld, openChapter, treasures })[name](arg);
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
    <div class="topbar"><button class="back" onclick="goTitle()">🏠 タイトル</button><div class="money big"><span>🪙 ${S.coins}</span><span>💎 ${S.gems}</span></div><button class="gear" onclick="go('parent')" aria-label="せってい">⚙️</button></div>
    <h1 class="logo sm">ぷにまるクエスト</h1>
    <div class="herowrap"><div class="hero" onclick="snd('tap');this.firstElementChild.classList.remove('jump');void this.offsetWidth;this.firstElementChild.classList.add('jump')">${charSVG(S.eq, S.color, "bounce")}</div>
      ${partner() ? `<button class="homepet" onclick="go('nakama','pets')" style="--pc:${ELEMENTS[petSp(partner().sp).el].color}">${petSp(partner().sp).em}</button>` : ""}</div>
    <div class="pname">${esc(S.name)}</div>
    <div class="stats"><span>⚔️ ${pAtk()}</span><span>🛡️ ${pDef()}</span><span>❤️ ${pMaxHp()}</span></div>
    ${eggStrip()}
    <button class="big-btn primary" onclick="go('map')">⚔️ ぼうけんに でる！</button>
    <div class="menu4 m6">
      <button onclick="go('shop')"><span class="mi">🛒</span>ショップ${newShop() ? `<i class="badge">NEW</i>` : ""}</button>
      <button onclick="go('equip')"><span class="mi">🎽</span>そうび</button>
      <button onclick="go('nakama')"><span class="mi">🐾</span>なかま${readyEggs().length ? `<i class="badge">🐣</i>` : ""}</button>
      <button onclick="go('zukan')"><span class="mi">🃏</span>ずかん${ng ? `<i class="badge">${ng}</i>` : ""}</button>
      <button onclick="go('missions')"><span class="mi">📜</span>ミッション${claimable ? `<i class="badge">!</i>` : ""}</button>
      <button onclick="saveMenu()"><span class="mi">💾</span>セーブ</button>
      <button class="tbtn" onclick="go('treasures')"><span class="mi">🏆</span>たからもの${unseenTreasures().length ? `<i class="badge">NEW</i>` : ""}</button>
    </div></div>`, "bg-home");
  // ログインボーナス → たからもの → タマゴがかえる の順に1つずつ見せる
  if (!loginBonus() && !treasureEvents()) petEvents();
}

// ホームのタマゴ表示（いちばん早くかえるタマゴまでの問題数）
function eggStrip() {
  if (!S.eggs.length) return "";
  const left = Math.min(...S.eggs.map((e) => Math.max(0, e.n - e.p)));
  return `<button class="eggstrip" onclick="go('nakama','egg')">${S.eggs.map((e) => eggSVG(e, e.p >= e.n ? "wobble" : "")).join("")}
    <span>${left === 0 ? "タマゴが かえるよ！" : `あと <b>${left}問</b> 正解で タマゴが かえる！`}</span></button>`;
}

function loginBonus() {
  const d = today();
  if (S.login.last === d) return false;
  S.login.streak = S.login.last === yesterday() ? S.login.streak + 1 : 1;
  S.login.last = d;
  const bonus = 20 + 5 * Math.min(S.login.streak - 1, 6);
  S.coins += bonus; save();
  setTimeout(() => {
    snd("coin");
    modal(`<div class="mtitle">ログインボーナス！</div><div class="bigicon">🎁</div>
      <p><b>${S.login.streak}日れんぞく</b> ログイン！</p><p class="reward">🪙 +${bonus}</p>
      <p class="small">まいにち くると ボーナスが ふえるよ</p><button class="big-btn primary" onclick="closeModal();home()">やったー！</button>`);
  }, 300);
  return true;
}

// あいしょう表
function showChart() {
  snd("tap");
  const ic = (k) => ELEMENTS[k].icon;
  modal(`<div class="mtitle">📘 ぞくせいの あいしょう</div>
    <div class="cycle">${ic("fire")} → ${ic("leaf")} → ${ic("thunder")} → ${ic("water")} → ${ic("fire")}</div>
    <p class="small">やじるしの 先の あいてに つよい！<br>（${ic("fire")}は${ic("leaf")}に、${ic("leaf")}は${ic("thunder")}に、${ic("thunder")}は${ic("water")}に、${ic("water")}は${ic("fire")}に つよい）</p>
    <div class="abox left">◎ こうかばつぐん … ダメージ 2ばい<br>△ いまひとつ … 半分（にがてな あいて・おなじ ぞくせい）<br>✖ きかない … ダメージ 0（とくべつな てき）<br>○ ぞくせいなしの ぶき … いつも ふつう<br>✨ ほしの ぶき … どの あいてにも よくきく</div>
    <div class="abox left">🛡️ よろいにも ぞくせいが あるよ。<br>おなじ ぞくせいの こうげきは 半分、にがてな ぞくせいの こうげきは 1.5ばい うけるよ。</div>
    <p class="small">❓ の てきは でてくるまで ぞくせいが わからない！</p>
    <button class="big-btn primary" onclick="closeModal()">わかった！</button>`);
}

// ---------- 問題づくり ----------
// 出題する項目を えらぶ
// ・まちがえた問題（ニガテ）と 新しい問題は 多め、★を上げられる問題も 多め
// ・何度も つづけて 正解している問題、今日 何回も 正解した問題、このバトルで 正解した問題は 少なめ
function pickId(pool, recent) {
  const d = today();
  const ws = pool.map((id) => {
    const c = S.cards[id];
    if (!c || c.tot === 0) return recent.includes(id) ? 0.05 : 1.6;
    if (c.ng) return recent.includes(id) ? 0.08 : 3;
    let x = c.last !== d && c.s < 5 ? 1.5 : 1;
    if (c.s >= 5) x *= 0.5;
    const cs = c.cs || 0;
    x *= cs >= 6 ? 0.12 : cs >= 4 ? 0.25 : cs >= 2 ? 0.55 : 1;
    const tc = c.td === d ? c.tc || 0 : 0;
    x *= tc >= 3 ? 0.12 : tc === 2 ? 0.3 : tc === 1 ? 0.6 : 1;
    const bd = (B && B.done && B.done[id]) || 0;
    x *= bd >= 2 ? 0.05 : bd === 1 ? 0.15 : 1;
    if (recent.includes(id)) x *= 0.03;
    return x;
  });
  let r = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}

// ふくしゅう：同じ国の、前に 正解した カードの 中から（★を 上げられる ものを 優先）
function reviewPool(ch) {
  const d = today();
  return worldCards(ch.w).filter((id) => { const c = S.cards[id]; return c && c.s > 0 && !c.ng && c.s < 5 && c.last !== d && !ch.items.includes(id); });
}

function mkOpts(q, ans, ds) {
  q.opts = shuffle([ans, ...ds.slice(0, 3)]);
  q.ai = q.opts.indexOf(ans);
  return q;
}
const fmtNum = (v, u) => `${v}${u ? " " + u : ""}`;

// カードの名前（ずかん・ニガテモンスターなどで使う）
function cardLabel(id) {
  if (id.startsWith("k:")) return id.slice(2);
  if (id.startsWith("f:")) return formulaOf(id).name;
  if (id.startsWith("m:")) return (MATH[id.slice(2)] || {}).name || "?";
  return (BANK[id] || {}).t || "?";
}
// カードが どの国のものか
function cardWorld(id) {
  if (id.startsWith("k:")) return "kanji";
  if (id.startsWith("f:") || id.startsWith("m:")) return "math";
  return (BANK[id] || {}).w || "kotoba";
}

// 4択の選択肢がながいときは 1れつに ならべる
const optCls = (opts) => (opts.some((o) => String(o).replace(/<[^>]+>/g, "").length > 9) ? "fch" : "");

function makeQ(id, kind) {
  // --- 漢字（よみ・かき） ---
  if (id.startsWith("k:")) {
    const K = kanjiOf(id);
    const [word, reading] = pick(K.w);
    // 聞き方を かえる：読み／□に入る漢字／ひらがなを漢字に／2つの□に共通の漢字
    if (!kind) { const r = Math.random(); kind = r < 0.3 ? "kread" : r < 0.6 ? "kwrite" : r < 0.8 ? "kword" : "kcommon"; }
    const multi = K.w.filter(([w]) => w.length >= 2);
    if (kind === "kword" && multi.length) {
      const [w, rd] = pick(multi);
      const ds = shuffle(K.sim.filter((x) => x !== K.k)).map((x) => w.replace(K.k, x));
      const q = { id, kind: "choice", explain: `${w}（${rd}）`, head: `<div class="qlabel">漢字で 書くと？</div><div class="qword fsm">${rd}</div>` };
      return mkOpts(q, w, ds);
    }
    if (kind === "kcommon" && K.w.length >= 2 && K.w[0][0] !== K.w[1][0]) {
      const [[w1, r1], [w2, r2]] = K.w;
      const q = { id, kind: "choice", cls: "kch", explain: `${w1}（${r1}）・${w2}（${r2}）`,
        head: `<div class="qlabel">2つの □に 共通して 入る 漢字は？</div><div class="qruby">${r1}・${r2}</div><div class="qword fsm">${esc(w1).replace(K.k, '<span class="blank">□</span>')}　${esc(w2).replace(K.k, '<span class="blank">□</span>')}</div>` };
      return mkOpts(q, K.k, shuffle(K.sim.filter((x) => x !== K.k)));
    }
    if (kind === "kword" || kind === "kcommon") kind = Math.random() < 0.5 ? "kread" : "kwrite";
    const q = { id, kind: "choice", explain: `${word}（${reading}）` };
    if (kind === "kread") {
      q.head = `<div class="qlabel">よみかたは？</div><div class="qword">${esc(word).replace(K.k, `<span class="hl">${K.k}</span>`)}</div>`;
      // 文字数のちかい読みを、まちがいの選択肢にする
      const pool = [];
      KANJI.forEach((x) => x.w.forEach(([, r]) => { if (r !== reading && !pool.includes(r)) pool.push(r); }));
      const near = shuffle(pool.filter((r) => Math.abs(r.length - reading.length) <= 1));
      const ds = [];
      for (const r of near.concat(shuffle(pool))) { if (ds.length >= 3) break; if (!ds.includes(r)) ds.push(r); }
      return mkOpts(q, reading, ds);
    }
    q.head = `<div class="qlabel">□に 入る 漢字は？</div><div class="qruby">${reading}</div><div class="qword">${esc(word).replace(K.k, `<span class="blank">□</span>`)}</div>`;
    q.cls = "kch";
    return mkOpts(q, K.k, shuffle(K.sim.filter((s) => s !== K.k)));
  }
  // --- 公式 ---
  if (id.startsWith("f:")) {
    const F = formulaOf(id);
    kind = kind || (Math.random() < 0.5 ? "ffill" : "fcalc");
    if (kind === "ffill") {
      const q = { id, kind: "choice", cls: "fch", explain: `${F.name} ＝ ${F.ans}`, skill: F.skill,
        head: `<div class="qlabel">正しい公式は？</div><div class="qword fsm">${F.name} ＝ ？</div>` };
      return mkOpts(q, F.ans, shuffle(F.ng));
    }
    return fromGen(id, F.name, Object.assign(F.gen(), { ex: `${F.name} ＝ ${F.ans}` }));
  }
  // --- 算数の計算 ---
  if (id.startsWith("m:")) {
    const M = MATH[id.slice(2)];
    return fromGen(id, M.name, M.gen());
  }
  // --- 知識の問題（ことば・理科・社会） ---
  return fromBank(id, BANK[id]);
}

// 計算問題：ng があれば4択、なければ 数字を入力
function fromGen(id, name, g) {
  if (g.order) return fromBank(id, { q: g.q, order: g.order, ex: g.ex, type: "order", label: name });
  const head = `<div class="qlabel">📝 ${name}</div><div class="qtext">${g.q}</div>${g.svg || ""}`;
  const explain = `こたえ：${fmtNum(g.a, g.unit)}${g.ex ? `<br><small>${g.ex}</small>` : ""}`;
  if (g.ng && g.ng.length) {
    const ds = [];
    for (const x of g.ng.concat(typeof g.a === "number" ? [g.a + 1, g.a * 2, g.a + 10, r2(g.a / 2)] : [])) {
      if (ds.length >= 3) break;
      if (x !== g.a && (typeof x !== "number" || x > 0) && !ds.includes(x)) ds.push(x);
    }
    const q = { id, kind: "choice", head, explain };
    mkOpts(q, fmtNum(g.a, g.unit), ds.map((x) => fmtNum(x, g.unit)));
    q.cls = optCls(q.opts);
    return q;
  }
  return { id, kind: "input", head, ans: Number(g.a), unit: g.unit || "", explain };
}

function fromBank(id, Q) {
  const head = `${Q.label ? `<div class="qlabel">${Q.label}</div>` : ""}<div class="qtext">${Q.q}</div>${Q.svg || ""}`;
  const exs = Q.ex ? `<br><small>${Q.ex}</small>` : "";
  if (Q.type === "order") {
    return { id, kind: "order", head, items: Q.order.slice(), shown: shuffle(Q.order.map((_, i) => i)), picked: [],
      explain: `正しい じゅんばん：<br>${Q.order.map((x, i) => `${i + 1}. ${x}`).join("<br>")}${exs}` };
  }
  if (Q.type === "input") return { id, kind: "input", head, ans: Number(Q.input), unit: Q.unit || "", explain: `こたえ：${fmtNum(Q.input, Q.unit)}${exs}` };
  // 逆向きの 聞き方（例：意味 → ことわざ）
  if (Q.rq && Math.random() < 0.35) {
    const ra = Q.ra || Q.t;
    const sib = [...new Set(Object.keys(BANK).filter((k) => BANK[k].ch === Q.ch && BANK[k].rq && k !== id).map((k) => BANK[k].ra || BANK[k].t))].filter((x) => x !== ra);
    if (sib.length >= 3) {
      const q = { id, kind: "choice", head: `<div class="qlabel">ぎゃくに きくよ</div><div class="qtext">${Q.rq}</div>`, explain: `こたえ：${ra}<br><small>${Q.q.replace(/<[^>]+>/g, "")} → ${Q.a}</small>` };
      mkOpts(q, ra, shuffle(sib));
      q.cls = optCls(q.opts);
      return q;
    }
  }
  // ⭕❌ で 答える
  if (Q.ox !== false && Math.random() < 0.15) {
    const right = Math.random() < 0.5, shown = right ? Q.a : pick(Q.ng);
    return { id, kind: "choice", cls: "oxch", opts: ["⭕ 正しい", "❌ まちがい"], ai: right ? 0 : 1, explain: `こたえ：${Q.a}${exs}`,
      head: `${head}<div class="oxans">こたえ「<b>${shown}</b>」</div><div class="qlabel">この こたえは 正しい？</div>` };
  }
  const q = { id, kind: "choice", head, explain: `こたえ：${Q.a}${exs}` };
  mkOpts(q, Q.a, shuffle(Q.ng));
  q.cls = optCls(q.opts);
  return q;
}

// ---------- バトル ----------
let B = null;

function startBattle(sid) {
  snd("tap");
  let enemies, st;
  if (sid === "nigate") {
    // ニガテモンスター：まちがえた問題がモンスターになる（2回正解でたおせる）
    const ids = shuffle(nigateIds()).slice(0, 5);
    st = { id: 1, tier: 1, name: "ニガテたいじ", bg: ["#e9d8ff", "#b39ddb"] };
    enemies = ids.map((id) => ({
      name: `ニガテ「${cardLabel(id)}」`, hp: 0, atk: 6, el: "none", shape: "ghost", color: "#9575cd", item: id,
      label: id.startsWith("k:") ? id.slice(2) : "",
    }));
  } else {
    const [chId, n] = sid.split("-");
    const ch = chapterOf(chId);
    if (ch.maou) ch.items = maouPool();
    st = stageInfo(ch, Number(n));
    enemies = stageEnemies(ch, Number(n));
  }
  B = {
    st, sid, enemies, ei: 0, php: pMaxHp(), combo: 0, gauge: 0, coins: 0, gems: 0, miss: 0,
    news: [], ups: [], recent: [], busy: false, pool: st.ch ? stageItems(st.ch, st.n) : [], traceFails: 0,
    petC: 0, buff: 0, buffPow: 0, shield: 0, hint: false, eggs: [], mats: {}, done: {},
  };
  nextEnemy();
  if (!S.tut.battle) {
    S.tut.battle = 1; save();
    modal(`<div class="mtitle">たたかいかた</div>
      <p>⭕ 正解すると こうげき！<br>れんぞく正解で <b>コンボ</b>、ダメージアップ！</p>
      <p>⚔️ てきは 3ターンごとに こうげきしてくる。<br>まちがえると すぐに こうげきされるよ。</p>
      <p>✨ ゲージが たまったら <b>ひっさつわざ</b>。正解すると 3ばいダメージ！</p>
      <p>🔄「ぶき」ボタンで たたかいながら ぶきを かえられるよ。</p>
      <button class="big-btn primary" onclick="closeModal()">たたかう！</button>`);
  }
}

function nextEnemy() {
  if (B.over) return;
  const e = B.enemies[B.ei];
  if (B.sid === "nigate") e.hp = Math.round(pAtk() * 1.6);
  e.max = e.hp; e.phase = 0; e.turn = e.fast ? 2 : 3;
  B.e = e; B.poison = null;
  if (hsp().hint) B.hint = true;
  renderBattle();
  nextQ();
  if (e.rand) setTimeout(() => toast(`❓ ${e.name}は ${ELEMENTS[e.el].icon}${ELEMENTS[e.el].name} だった！`), 300);
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
        <div class="pchr" id="pchr">${charSVG(S.eq, S.color)}</div>${petBattleHTML()}
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
  updBars(); updPet();
}

function updBars() {
  if (!$("ehpbar")) return;
  const e = B.e, mx = pMaxHp();
  $("ehpbar").style.width = Math.max(0, (e.hp / e.max) * 100) + "%";
  $("ehptxt").textContent = `${Math.max(0, e.hp)} / ${e.max}`;
  $("phpbar").style.width = Math.max(0, (B.php / mx) * 100) + "%";
  $("phptxt").textContent = `❤️ ${Math.max(0, B.php)} / ${mx}`;
  const wk = weakOf(e.el), immTxt = e.imm ? ` <span class="imm">きかない<b>${e.imm === "none" ? "・" : ELEMENTS[e.imm].icon}</b></span>` : "";
  $("eweak").innerHTML = e.el === "none" ? `ぞくせい なし${immTxt}` : `${ELEMENTS[e.el].icon} じゃくてん<b>${wk ? ELEMENTS[wk].icon : ""}</b>${immTxt}`;
  $("eturn").innerHTML = `⚔️ あと<b>${e.turn}</b>`;
  $("combo").textContent = B.combo >= 2 ? `${B.combo} コンボ!` : "";
  $("gauge").style.width = (B.gauge / 5) * 100 + "%";
  $("special").classList.toggle("ready", B.gauge >= 5);
  $("special").disabled = B.gauge < 5;
  const w = itemById(S.eq.weapon);
  const x = effNow(w.el);
  $("wel").textContent = `${ELEMENTS[w.el].icon}${EFFECT_MARK(x)}`;
  $("wel").parentElement.classList.toggle("good", x >= 2);
  $("wel").parentElement.classList.toggle("bad", x < 1);
}

function nextQ(special = false) {
  if (B.over) return;
  B.busy = false;
  let id;
  if (B.sid === "nigate") id = B.e.item;
  else {
    const rv = B.st.ch ? reviewPool(B.st.ch) : [];
    id = rv.length && Math.random() < 0.25 ? pickId(rv, B.recent) : pickId(B.pool, B.recent);
  }
  B.recent = [id, ...B.recent].slice(0, Math.min(4, Math.max(0, B.pool.length - 2)));
  // 必殺技：公式なら「正しい公式は？」、それ以外は ふつうの問題で 3ばい
  B.q = B.st.ch && B.st.ch.write && id.startsWith("k:") ? makeWriteQ(id) : makeQ(id, special && id.startsWith("f:") ? "ffill" : null);
  B.q.special = special;
  showQ();
}

function showQ() {
  if (!$("qpanel")) return;
  const q = B.q;
  const sp = q.special ? `<div class="splabel">✨ ひっさつわざ！ 正解で 3ばいダメージ</div>` : "";
  let body = "";
  if (q.kind === "choice") {
    body = `<div class="choices ${q.cls || ""}">${q.opts.map((o, i) => `<button class="ch" onclick="answer(${i})">${o}</button>`).join("")}</div>`;
  } else if (q.kind === "input") {
    B.inp = "";
    const keys = ["7", "8", "9", "⌫", "4", "5", "6", ".", "1", "2", "3", "0"];
    body = `<div class="inbox"><span id="inv" class="inv"> </span><span class="inu">${q.unit}</span><button class="okbtn" onclick="submitInput()">こたえる</button></div>
      <div class="keypad">${keys.map((k) => `<button class="key ${k === "⌫" ? "del" : ""}" onclick="keyIn('${k}')">${k}</button>`).join("")}</div>`;
  } else if (q.kind === "write") {
    body = `<div class="wbox" id="wbox"><canvas id="tc" class="tcanvas"></canvas></div>
      <div class="row wrow"><button class="big-btn" onclick="traceClear()">けす</button><button class="big-btn" onclick="writeGiveUp()">わからない</button><button class="big-btn primary" onclick="writeJudge()">できた！</button></div>`;
  } else {
    body = `<p class="note">じゅんばんに タップしてね</p><div class="olist">${q.shown.map((i) => `<button class="oitem" id="oi${i}" onclick="orderTap(${i})"><i></i>${q.items[i]}</button>`).join("")}</div>
      <button class="big-btn" onclick="orderReset()">やりなおす</button>`;
  }
  $("qpanel").innerHTML = sp + q.head + body;
  if (q.kind === "write") showWrite();
  if (PQ_DEBUG && window.PQ_SHOWANS) debugMarkAnswer(q);
  fitBattle();
  if (B.hint && q.kind === "choice") {
    B.hint = false;
    const wrongs = q.opts.map((_, i) => i).filter((i) => i !== q.ai);
    const b = document.querySelectorAll(".ch")[pick(wrongs)];
    b.classList.add("gone"); b.disabled = true;
  }
}

// 画面に 入りきらないときは 敵やキャラを 小さくして つめる（2だんかい）
function fitBattle() {
  const bt = $("app").firstElementChild;
  if (!bt || !bt.classList.contains("battle")) return;
  bt.classList.remove("compact", "compact2");
  const over = () => document.documentElement.scrollHeight > window.innerHeight + 2;
  if (over()) bt.classList.add("compact");
  if (over()) bt.classList.add("compact2");
}

// 数字の入力
function keyIn(k) {
  if (B.busy) return;
  snd("tap");
  if (k === "⌫") B.inp = B.inp.slice(0, -1);
  else if (B.inp.length < 8 && !(k === "." && B.inp.includes("."))) B.inp += k;
  $("inv").textContent = B.inp || " ";
}
function submitInput() {
  if (B.busy) return;
  if (!B.inp || B.inp === ".") { toast("数字を 入れてね"); return; }
  const ok = Math.abs(Number(B.inp) - B.q.ans) < 1e-9;
  $("inv").classList.add(ok ? "right" : "wrong");
  if (ok) showMaru($("inv"));
  judge(ok);
}

// ならべかえ
function orderTap(i) {
  const q = B.q;
  if (B.busy || q.picked.includes(i)) return;
  snd("tap");
  q.picked.push(i);
  const el = $("oi" + i);
  el.classList.add("on"); el.firstElementChild.textContent = q.picked.length;
  if (q.picked.length === q.items.length) {
    const ok = q.picked.every((x, k) => x === k);
    if (ok) showMaru(el.parentElement);
    judge(ok);
  }
}
function orderReset() {
  if (B.busy) return;
  B.q.picked = [];
  document.querySelectorAll(".oitem").forEach((el) => { el.classList.remove("on"); el.firstElementChild.textContent = ""; });
}

// 正解したところに 赤い 丸を 一瞬 出す
function showMaru(el) {
  if (!el) return;
  const m = document.createElement("div");
  m.className = "maru";
  el.classList.add("marubox");
  el.appendChild(m);
  setTimeout(() => m.remove(), 900);
}

// 4択
function answer(i) {
  if (B.busy) return;
  const q = B.q, ok = i === q.ai;
  const btns = document.querySelectorAll(".ch");
  btns[q.ai].classList.add("right");
  if (!ok) btns[i].classList.add("wrong");
  else showMaru(btns[i]);
  judge(ok);
}

// 正解・まちがいの しょり（どの形の問題でも おなじ）
async function judge(ok) {
  if (B.busy) return;
  B.busy = true;
  const q = B.q;
  const isNigate = B.sid === "nigate";
  if (ok) {
    snd("pinpon");
    if (q.special) setTimeout(() => snd("special"), 450);
    const ev = onCorrect(q.id);
    if (ev === "new") B.news.push(q.id);
    if (ev === "up") B.ups.push(q.id);
    if (ev === "new" || ev === "up") fxText(ev === "new" ? "🃏 NEW カード！" : "⭐ ★アップ！", "card");
    B.combo++;
    if (!q.special) B.gauge = Math.min(5, B.gauge + 1 + (wsp().gauge || 0)); else B.gauge = 0;
    // コイン：はんぱは 確率で もらえる（+30%なら 平均で 1.3ばい）
    const raw = (1 + Math.floor(Math.min(B.combo, 9) / 3)) * (1 + (wsp().coin || 0) + (hsp().coin || 0));
    const got = Math.floor(raw) + (Math.random() < raw % 1 ? 1 : 0);
    const rg = (asp().regen || 0) + (hsp().regen || 0);
    if (rg) B.php = Math.min(pMaxHp(), B.php + Math.max(1, Math.round(pMaxHp() * rg)));
    B.coins += got; S.coins += got;
    if (q.kind === "write" && !q.self) { B.coins += 3; S.coins += 3; fxText("✍️ +3", "card"); }
    petCharge();
    await attack(q.special ? 3 : q.kind === "write" ? 2 : 1, q.special ? q.skill || "スーパーアタック" : null);
  } else {
    snd("ng");
    onWrong(q.id);
    B.combo = 0; B.miss++;
    if (q.special) B.gauge = 0;
    save();
    // まちがえたら正しい答えを見せて、たしかめてからすすむ
    $("qpanel").insertAdjacentHTML("beforeend", `<div class="explain"><div>📖 ${q.explain}</div>
      <small>${isNigate ? "" : "まちがえた問題は ニガテモンスターに なったよ"}</small><button class="big-btn" onclick="afterWrong()">つぎへ</button></div>`);
    updBars();
  }
}

// ダメージ数字などの演出
function fxText(txt, cls) {
  if (!$("fx")) return;
  const d = document.createElement("div");
  d.className = "fxt " + cls; d.innerHTML = txt;
  $("fx").appendChild(d);
  setTimeout(() => d.remove(), 1100);
}
function anim(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

async function afterWrong() {
  if (!$("qpanel").querySelector(".explain")) return;
  $("qpanel").innerHTML = "";
  await enemyAttack();
  if (B.php > 0) { B.e.turn = B.e.fast ? 2 : 3; updBars(); nextQ(); }
}

// そうびの とくしゅ能力
// アクセサリーの のうりょくは、ぶき（かいしん）と ぼうし（コイン・そざい など）に たす
const accSp = () => (itemById(S.eq.acc || "x_none") || {}).sp || {};
const wsp = () => mergeSp(itemById(S.eq.weapon).sp, accSp(), ["crit"]);
const asp = () => itemById(S.eq.armor).sp || {};
const hsp = () => mergeSp(itemById(S.eq.hat).sp, accSp(), ["coin", "mat", "egg", "regen", "hint", "petfast"]);

// てきに ダメージを あたえる（武器の とくしゅ能力も ここで）
function hitEnemy(d, label, cls) {
  const e = B.e;
  e.hp -= d;
  fxText(`${d}${label || ""}`, cls || "dmg");
}

async function attack(mult, skillName) {
  const e = B.e, w = itemById(S.eq.weapon), sp = wsp();
  let x = effNow(w.el);
  // つらぬき：いまひとつ・きかない を むしする
  if (sp.pierce && x < 1) x = 1;
  anim($("pchr"), "atk");
  if (skillName) fxText(skillName + "！", "skill");
  await wait(220);
  // 大ぶりの 武器は ときどき はずれる
  if (sp.hit && Math.random() > sp.hit) {
    fxText("ミス！", "dmg nope");
    snd("ng");
  } else {
    let d = pAtk() * x * (1 + (sp.combo ? 0.1 : 0.05) * Math.min(B.combo, 10)) * mult;
    if (B.buff > 0) { d *= 1 + B.buffPow; B.buff--; }
    let tag = effFx(x), cls = effCls(x);
    const crit = B.critNext || (sp.crit && Math.random() < sp.crit);
    if (crit) { d *= 2; B.critNext = false; tag = "<small>かいしん！</small>"; cls = "dmg weak"; }
    if (sp.boss && e.boss) d *= sp.boss;
    if (sp.exec && e.hp < e.max * 0.25) { d *= 2; tag = "<small>とどめ！</small>"; }
    if (sp.first && !e.hitOnce) { d *= sp.first; tag = "<small>せんせい！</small>"; }
    e.hitOnce = true;
    d = x === 0 ? 0 : Math.max(1, Math.round(d * (0.9 + Math.random() * 0.2)));
    snd("hit");
    anim($("enemy"), "hurt");
    hitEnemy(d, tag, cls);
    // ついげき・2回こうげき・きゅうしゅう・しびれ
    if (d > 0 && sp.extra && Math.random() < sp.extra) { await wait(260); hitEnemy(Math.max(1, Math.round(d * 0.5)), "<small>ついげき！</small>", "dmg"); }
    if (d > 0 && sp.multi) { await wait(260); anim($("enemy"), "hurt"); hitEnemy(Math.max(1, Math.round(d * sp.multi)), "<small>2回め！</small>", "dmg"); }
    if (d > 0 && sp.drain) { const h = Math.max(1, Math.round(d * sp.drain)); B.php = Math.min(pMaxHp(), B.php + h); setTimeout(() => fxText(`+${h}`, "heal"), 200); }
    if (d > 0 && sp.stun && Math.random() < sp.stun) { e.turn += 1; setTimeout(() => fxText("💫 しびれた！", "card"), 300); }
    // どく（なかまの わざ）
    if (B.poison && B.poison.n > 0 && e.hp > 0) { await wait(260); B.poison.n--; hitEnemy(B.poison.d, "<small>どく</small>", "dmg resist"); }
  }
  e.turn--;
  updBars();
  save();
  await wait(650);
  // ラスボス：体力が へるたびに 属性が かわる
  const np = e.phases && e.hp > 0 ? (e.hp <= e.max / 3 ? 2 : e.hp <= (e.max * 2) / 3 ? 1 : 0) : e.phase;
  if (np !== e.phase) {
    e.phase = np; e.el = e.phases[np]; updBars();
    anim($("enemy"), "phase");
    const wk = weakOf(e.el);
    await modalWait(`<div class="mtitle">${esc(e.name)}が おこった！</div><div class="bigicon">💢</div>
      <p>ぞくせいが <b style="font-size:1.6em">${ELEMENTS[e.el].icon}</b> に かわった！<br>じゃくてんは <b style="font-size:1.4em">${ELEMENTS[wk].icon}</b></p><p class="small">「🔄 ぶき」で そうびを かえよう</p>
      <button class="big-btn primary" onclick="closeModal()">まけないぞ！</button>`);
  }
  // なかまのわざ（チャージがたまっていれば）
  if (e.hp > 0) await petAct();
  if (e.hp <= 0) {
    // 漢字の章の ボスは なぞり書きで トドメ
    if (e.boss && B.sid !== "nigate" && !B.st.ch.write && !B.st.ch.maou && B.pool.some((x) => x.startsWith("k:"))) { e.hp = 0; updBars(); startTrace(); return; }
    return enemyDown();
  }
  if (e.turn <= 0) {
    await enemyAttack();
    if (B.php <= 0) return;
    e.turn = e.fast ? 2 : 3; updBars();
  }
  nextQ();
}

async function enemyAttack() {
  const e = B.e, A = asp(), H = hsp();
  anim($("enemy"), "lunge");
  await wait(250);
  // かいひ
  if (A.dodge && Math.random() < A.dodge) {
    fxText("ひらりと かわした！", "card"); snd("tap");
    await wait(600); return;
  }
  const af = armorFactor(e.el);
  let d = Math.max(1, Math.round((e.atk - pDef()) * af * (0.9 + Math.random() * 0.2)));
  if (af < 1) setTimeout(() => fxText("🛡️ よろいが ふせいだ！", "card"), 200);
  if (af > 1) setTimeout(() => fxText("💦 よろいが にがてな こうげき！", "card"), 200);
  if (A.guard1 && !e.guarded) { e.guarded = true; d = Math.round(d / 2); }
  // なかまの ガード・バリア
  if (B.shield > 0) { d = Math.round(d * (1 - B.shield)); B.shield = 0; fxText("🛡️ ガード！", "card"); }
  else if (B.barrier > 0) { d = Math.round(d / 2); B.barrier--; fxText("🔰 バリア！", "card"); }
  snd("hurt");
  anim($("app").firstElementChild, "shake");
  anim($("pchr"), "hurt");
  B.php -= d;
  fxText(`-${d}`, "pdmg");
  // はんげき（そうび・なかま）。はんげきでは てきを たおさない
  const ref = (A.reflect || 0) + (B.reflect || 0);
  if (ref > 0 && d > 0) {
    const r = Math.max(1, Math.round(d * ref));
    e.hp = Math.max(1, e.hp - r); B.reflect = 0;
    setTimeout(() => fxText(`はんげき ${r}`, "card"), 300);
  }
  // くいしばり・ふっかつ
  if (B.php <= 0 && A.endure && !B.endured) { B.endured = true; B.php = 1; setTimeout(() => fxText("くいしばった！", "skill"), 300); }
  if (B.php <= 0) {
    const pet = partner();
    if (pet && petSp(pet.sp).ab === "revive" && !B.revived) {
      B.revived = true; B.php = Math.round(pMaxHp() * Math.min(100, petPow(pet)) / 100);
      setTimeout(() => fxText(`${petSp(pet.sp).em} ふっかつ！`, "skill"), 300); snd("special");
    }
  }
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
    else { S.coins += 15; B.coins += 15; fxText("🪙 +15", "card"); }
    if (Math.random() < 0.05) dropEgg(giveEgg(0) ? 0 : "full");
  } else {
    const c = 5 * B.st.tier;
    S.coins += c; B.coins += c;
    fxText(`🪙 +${c}`, "card");
    // そざい：ボスは かならず、ふつうの てきは ときどき。国の そざいも 出る
    const bonus = hsp().mat || 0;
    const got = e.boss ? [B.st.bmat, B.st.mat] : Math.random() < 0.5 + bonus ? [B.st.mat] : [];
    const wm = WORLD_MAT[B.st.ch.w];
    if (wm && (e.boss || Math.random() < 0.25 + bonus)) got.push(wm);
    // むずかしい 章ほど レアな そざいが 出る
    const t = B.st.tier, wr = WORLD_RARE[B.st.ch.w];
    if (wr) {
      if (Math.random() < (e.boss ? (t >= 2 ? 0.15 + 0.1 * t : 0) : t >= 3 ? 0.04 * t - 0.08 : 0) + bonus / 2) got.push(wr[0]);
      if (Math.random() < (e.boss ? (t >= 4 ? 0.08 * (t - 3) : 0) : t >= 5 ? 0.03 : 0)) got.push(wr[1]);
    }
    // ぞくせいの たま
    if (ELEM_MAT[e.el] && (e.boss || Math.random() < 0.2 + bonus / 2)) got.push(ELEM_MAT[e.el]);
    if (B.st.ch.maou) { got.length = 0; got.push(pick(["hidama", "mizutama", "raitama", "midotama"])); if (e.boss) got.push(pick(Object.values(WORLD_RARE).map((x) => x[1]))); }
    got.forEach((m) => { addMat(m); B.mats[m] = (B.mats[m] || 0) + 1; });
    if (got.length) setTimeout(() => fxText(`${got.map((m) => MATS[m].em).join("")} ゲット！`, "card"), 450);
    // タマゴ：3章ごとの ボスを はじめて たおすと かならず。ほかは ときどき
    const sure = e.boss && !stStars(B.sid) && (B.st.ch.idx % 3 === 2 || !!B.st.ch.maou);
    const r = rollEgg(B.st.tier, e.boss, sure);
    if (r !== null) dropEgg(r);
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

function dropEgg(r) {
  if (r === "full") { setTimeout(() => toast("タマゴが いっぱいで もてなかった…"), 400); return; }
  B.eggs.push(r);
  setTimeout(() => { snd("special"); fxText(`🥚 ${RARITY[r].name}の タマゴ！`, "skill"); }, 300);
}

function retreat() {
  modal(`<div class="mtitle">にげる？</div><p>ここまでの コイン（🪙${B.coins}）は もらえるよ。</p>
    <div class="row"><button class="big-btn" onclick="closeModal()">たたかう</button><button class="big-btn primary" onclick="closeModal();backFromBattle()">にげる</button></div>`);
}
function backFromBattle() { if (B) B.over = true; if (B && B.st.ch) openChapter(B.st.ch.id); else map(); }

function lose() {
  if (B.over) return;
  B.over = true;
  snd("lose");
  save();
  const st = B.st;
  let hint = "そうびを つよくしてから また ちょうせんしよう！";
  if (st.ch) {
    const e = B.e, wk = weakOf(e.el), cur = effNow(itemById(S.eq.weapon).el);
    const ownedW = ITEMS.filter((x) => x.type === "weapon" && S.owned.includes(x.id));
    if (cur < 1) hint = `いまの ぶきは ${e.name}に「${EFFECT_LABEL(cur)}」。「🔄 ぶき」で かえよう！`;
    else if (wk && !ownedW.some((x) => x.el === wk)) hint = `${e.name}には ${ELEMENTS[wk].icon} の ぶきが 2ばい きくよ。そざいを あつめて つくろう！`;
    else if (armorFactor(e.el) > 1) hint = `いまの よろいは ${ELEMENTS[e.el].icon} の こうげきに よわいよ。よろいを かえてみよう！`;
    else if (pDef() < 10) hint = "ショップで よろいを つくると ダメージが へるよ！";
    else hint = "ほかの 国の 章で そざいを あつめたり、なかまを そだてると つよくなれるよ！";
  }
  if (Object.keys(B.mats).length) hint += `<br><small>あつめた そざい ${Object.entries(B.mats).map(([k, v]) => MATS[k].em + "×" + v).join(" ")} は もちかえれたよ</small>`;
  modal(`<div class="mtitle">やられちゃった…</div><div class="hero sm">${charSVG(S.eq, S.color, "sad")}</div>
    <p>もらった コイン 🪙${B.coins} は そのまま！</p><p class="tip">💡 ${hint}</p>
    <div class="row"><button class="big-btn" onclick="closeModal();go('shop')">ショップへ</button><button class="big-btn primary" onclick="closeModal();startBattle('${B.sid}')">もういちど</button></div>`);
}

// ステージクリア：⭐の数、はじめてなら ボーナス、ボスなら 宝箱
function stageClear() {
  if (B.over) return;
  B.over = true;
  snd("win");
  const st = B.st, isStage = B.sid !== "nigate";
  const prev = isStage ? stStars(B.sid) : 0, first = isStage && !prev;
  const stars = B.miss === 0 ? 3 : B.miss <= 2 ? 2 : 1;
  let treasure = null, newItems = [];
  if (isStage) {
    S.stClear = S.stClear || {}; S.tierClear = S.tierClear || {};
    S.stClear[B.sid] = Math.max(prev, stars);
    if (first) {
      const bonus = (st.n === 4 ? 25 : 8) * st.tier;
      S.coins += bonus; B.coins += bonus;
    } else { const c = 5 * st.tier; S.coins += c; B.coins += c; }
    // ⭐3つを はじめて とったら ごほうび
    if (stars === 3 && prev < 3) { const g = 10 * st.tier; S.coins += g; B.coins += g; }
    if (st.ch.write || st.ch.maou) treasure = extraRewards(st, first, stars, prev);
    if (st.n === 4 && first && !st.ch.maou && !treasure) {
      // 章クリア：この強さの そうびが ショップに ならぶ
      if (!S.tierClear[st.tier]) { S.tierClear[st.tier] = true; newItems = ITEMS.filter((x) => x.unlock === st.tier && x.price > 0 && !x.drop); }
      const cand = ITEMS.filter((x) => x.type === "hat" && !x.gem && x.price > 0 && !S.owned.includes(x.id) && unlocked(x));
      if (st.final) { S.gems += 3; B.gems += 3; treasure = { icon: "💎", text: "ほうせき ×3" }; }
      else if (cand.length && Math.random() < 0.3) { const it = cand[0]; S.owned.push(it.id); treasure = { icon: "🎩", text: `${it.name} を てにいれた！`, item: it.id }; }
      else { const c = 15 * st.tier; S.coins += c; B.coins += c; treasure = { icon: "🪙", text: `コイン +${c}` }; }
    }
  }
  save();
  checkTreasures(); // もらった 日を きろくする（見せるのは ホームで）
  const tiles = (ids, tag) => ids.map((id) => `<div class="mini-card ${id.startsWith("k:") ? "" : "long"}"><b>${id.startsWith("k:") ? id.slice(2) : esc(cardLabel(id))}</b><i>${tag}</i></div>`).join("");
  const cards = B.news.length || B.ups.length ? `<div class="gotcards">${tiles(B.news, "NEW")}${tiles(B.ups, "★UP")}</div>` : "";
  const box = treasure ? `<div class="tbox" id="tbox" onclick="openBox()"><div class="chest">🎁</div><small>タップして あけよう！</small></div>
    <div class="treasure hidden" id="treasure"><div class="bigicon">${treasure.icon}</div><b>${treasure.text}</b>${treasure.item ? `<div class="hero xs">${charSVG({ ...S.eq, [itemById(treasure.item).type]: treasure.item }, S.color)}</div>` : ""}</div>` : "";
  const eggs = B.eggs.length ? `<div class="sub">タマゴを てにいれた！</div><div class="gotcards">${B.eggs.map((r) => `<div class="mini-egg">${eggSVG({ r })}<small>${RARITY[r].name}</small></div>`).join("")}</div>` : "";
  const hatch = readyEggs().length ? `<p class="tip">🐣 タマゴが かえりそう！ ホームに もどってみよう</p>` : "";
  const shopNew = newItems.length ? `<p class="tip">🛒 ショップに あたらしい そうびが ならんだ！<br><small>${newItems.map((x) => x.name).join("・")}</small></p>` : "";
  const chMsg = isStage && st.ch.maou && first ? `<p class="final">${st.ch.maou === 2 ? "🌈 しんの まおうを たおした！<br>ぷにまるは でんせつの ゆうしゃに なった！" : "🌑 まおうを たおした！<br>でも、しんの まおうが どこかに いるらしい…"}</p>`
    : isStage && st.n === 4 && first ? `<p class="final">${st.final ? `🎉 ${WORLDS.find((w) => w.id === st.ch.w).name}を ぜんぶ クリア！ すごい！` : `👑 「${st.ch.name}」の 章を クリア！`}</p>` : "";
  // つぎへ：ステージ1〜3 → つぎの ステージ、ボス → 国の 章えらび（つぎの 章へ）
  const next = !isStage || st.ch.maou ? "map()" : st.n < 4 ? `startBattle('${st.ch.id}-${st.n + 1}')` : `openWorld('${st.ch.w}')`;
  setScreen(`<div class="clear">
    <div class="ctitle">${isStage ? (st.n === 4 ? "ボス たおした！" : "ステージ クリア！") : "ニガテ たいじ せいこう！"}</div>
    ${isStage ? `<div class="bigstars">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div><small>${stars === 3 ? "ノーミス！ かんぺき！" : `ミス ${B.miss}回`}</small>` : ""}
    <div class="hero sm">${charSVG(S.eq, S.color, "bounce")}</div>${chMsg}
    <div class="rewards"><span>🪙 +${B.coins}</span>${B.gems ? `<span>💎 +${B.gems}</span>` : ""}</div>
    ${cards ? `<div class="sub">あたらしい カード・★アップ</div>${cards}` : ""}
    ${Object.keys(B.mats).length ? `<div class="sub">そざい</div><div class="matgot">${Object.entries(B.mats).map(([k, v]) => `<span>${MATS[k].em}<small>${MATS[k].name}</small>×${v}</span>`).join("")}</div>` : ""}
    ${eggs}${hatch}${shopNew}
    ${box}
    <div class="row"><button class="big-btn" onclick="go('home')">ホームへ</button><button class="big-btn primary" onclick="${next}">つぎへ ▶</button></div>
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
  const e = B.e;
  modal(`<div class="mtitle">ぶきを かえる</div><p class="small">${esc(e.name)}の ぞくせい：<b>${ELEMENTS[e.el].icon} ${ELEMENTS[e.el].name}</b></p>
    <div class="wlist">${ws.map((w) => { const x = effNow(w.el); return `<button class="witem ${S.eq.weapon === w.id ? "sel" : ""} ${x >= 2 ? "good" : x < 1 ? "bad" : ""}" onclick="setWeapon('${w.id}')">
      <span class="wel">${ELEMENTS[w.el].icon}</span><b>${w.name}${w.sp ? `<small class="spt">${spText(w.sp)}</small>` : ""}</b><small>⚔️${w.atk}</small><i class="eff">${EFFECT_MARK(x)} ${EFFECT_LABEL(x)}</i></button>`; }).join("")}</div>
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
  const kp = B.pool.filter((x) => x.startsWith("k:"));
  const seen = kp.filter((id) => S.cards[id] && S.cards[id].s > 0);
  const id = pick(seen.length ? seen : kp);
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
  const size = Math.min(TR.max || 280, window.innerWidth - 80);
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
  if (!TR.free) drawGlyph(ctx, n, TR.k, "rgba(90,70,140,.18)");
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
    const bonus = perfect ? 25 : 10;
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
// 見た目 重視の そうびの 札
const FUN_CLS = { "おもしろ": "f1", "かわいい": "f2", "キラキラ": "f3", "かっこいい": "f4" };
const funTag = (it) => (it.fun ? `<i class="fun ${FUN_CLS[it.fun] || ""}">${it.fun}</i>` : "");
let shopTab = "weapon";
// ステージクリアでショップに並ぶ
const unlocked = (it) => (PQ_DEBUG && window.PQ_OPEN) || !it.unlock || !!(S.tierClear || {})[it.unlock] || !!S.cleared[it.unlock];
// まだ ならんでいない しなものの ヒント
const lockHint = (it) => (it.unlock === "maou" ? "🌑 まおうを たおすと ならぶよ" : `${MATS[TMAT[it.unlock][0]].em} の 章を クリアすると ならぶよ`);
// まだ見ていない新商品があるか
function newShop() { return ITEMS.some((x) => x.price > 0 && !x.drop && unlocked(x) && !S.owned.includes(x.id) && !(S.seen || {})[x.id]); }

function shop(tab) {
  if (tab) shopTab = tab;
  const tabs = [["weapon", "ぶき"], ["armor", "よろい"], ["hat", "ぼうし"], ["acc", "アクセ"]];
  S.seen = S.seen || {};
  ITEMS.forEach((x) => { if (unlocked(x)) S.seen[x.id] = 1; });
  save();
  let lockShown = 0;
  const lockAll = ITEMS.filter((x) => x.type === shopTab && x.price > 0 && !x.drop && !unlocked(x)).length;
  const list = ITEMS.filter((x) => x.type === shopTab && x.price > 0 && !x.drop).map((it) => {
    if (!unlocked(it)) {
      if (++lockShown > 3) return "";
      return `<div class="sitem locked"><div class="sprev qmark">？</div><div class="sname"><b>？？？</b><small>${lockHint(it)}</small></div><button class="sbtn" disabled>🔒</button></div>`;
    }
    const own = S.owned.includes(it.id);
    const matOk = Object.entries(it.mat || {}).every(([k, v]) => (S.mats[k] || 0) >= v);
    const can = S.coins >= it.price && S.gems >= (it.gem || 0) && matOk;
    const stat = itemStat(it);
    const need = it.mat && !own ? `<span class="mneed">${Object.entries(it.mat).map(([k, v]) => `<i class="${(S.mats[k] || 0) >= v ? "" : "lack"}">${MATS[k].em}${S.mats[k] || 0}/${v}</i>`).join("")}</span>` : "";
    const prev = { ...S.eq, [it.type]: it.id };
    return `<div class="sitem ${own ? "own" : ""}">
      <div class="sprev">${charSVG(prev, S.color)}</div>
      <div class="sname"><b>${it.series ? `<i class="ser">${WORLDS.find((w) => w.id === it.series).icon}</i>` : ""}${it.name}${funTag(it)}</b><small>${stat}</small>${need}</div>
      ${own ? `<button class="sbtn" disabled>もってる</button>` : `<button class="sbtn ${can ? "" : "no"}" onclick="buy('${it.id}')">🪙${it.price}${it.gem ? `<br>💎${it.gem}` : ""}</button>`}
    </div>`;
  }).join("");
  const mats = Object.keys(MATS).filter((k) => S.mats[k]);
  setScreen(`${topBar("ショップ")}
    <div class="matbar">${mats.length ? mats.map((k) => `<span>${MATS[k].em}${S.mats[k]}</span>`).join("") : "<small>そざいは てきを たおすと 手に はいるよ</small>"}</div>
    <div class="tabs">${tabs.map(([k, l]) => `<button class="${k === shopTab ? "on" : ""}" onclick="shop('${k}')">${l}</button>`).join("")}</div>
    <div class="slist">${list}${lockAll > 3 ? `<p class="note">ほかにも ？？？ が ${lockAll - 3}こ あるよ</p>` : ""}
    ${shopTab === "acc" ? `<p class="note">✨ ショップに ない めずらしい アクセサリーも あるよ。<br>かきとり道場や まおうの しろで 手に 入るかも…？</p>` : ""}</div>`, "bg-shop");
}
function buy(id) {
  const it = itemById(id);
  const lack = Object.entries(it.mat || {}).filter(([k, v]) => (S.mats[k] || 0) < v);
  if (lack.length) { snd("ng"); toast(`そざいが たりないよ（${lack.map(([k]) => MATS[k].em + MATS[k].name).join("・")}）`); return; }
  if (S.coins < it.price || S.gems < (it.gem || 0)) { snd("ng"); toast(it.gem && S.gems < it.gem ? "💎が たりないよ（ニガテモンスターを たおそう）" : "コインが たりないよ"); return; }
  S.coins -= it.price; S.gems -= it.gem || 0;
  Object.entries(it.mat || {}).forEach(([k, v]) => { S.mats[k] -= v; }); S.owned.push(id); S.eq[it.type] = id; save();
  snd("coin");
  shop();
  modal(`<div class="mtitle">${it.name} を てにいれた！</div><div class="hero sm">${charSVG(S.eq, S.color, "bounce")}</div>
    <p>さっそく そうびしたよ！</p><button class="big-btn primary" onclick="closeModal()">やったー！</button>`);
}

// ---------- そうび ----------
let eqTab = "weapon";
function equip() {
  const sec = (type, label) => {
    const its = ITEMS.filter((x) => x.type === type && S.owned.includes(x.id));
    // みじかい せつめい（数字と 属性だけ）＋ とくしゅ能力
    const short = (it) => (it.type === "acc" ? (it.id === "x_none" ? "つけない" : "🎀") : it.type === "weapon" ? `⚔️${it.atk} ${ELEMENTS[it.el].icon}` : it.type === "armor" ? `🛡️${it.def}${it.res === "all" ? " ✨" : it.res ? ` ${ELEMENTS[it.res].icon}◎` : ""}${it.weak ? ` ${ELEMENTS[it.weak].icon}✕` : ""}` : `❤️+${it.hp}`);
    return `<div class="esec"><div class="elist">${its.map((it) => `<button class="eitem ${S.eq[type] === it.id ? "sel" : ""}" onclick="doEquip('${type}','${it.id}')">
      <b>${it.series ? WORLDS.find((w) => w.id === it.series).icon : ""}${it.name}${funTag(it)}</b><small>${short(it)}</small>${it.sp ? `<span class="spt">${spText(it.sp)}</span>` : ""}</button>`).join("")}</div></div>`;
  };
  // しゅるいを えらぶ タブ（キャラの すぐ 下）
  const tabs = [["weapon", "⚔️ ぶき"], ["armor", "🛡️ よろい"], ["hat", "🎩 ぼうし"], ["acc", "🎀 アクセ"], ["color", "🎨 いろ"]];
  const cnt = (t) => (t === "color" ? "" : `<small>${ITEMS.filter((x) => x.type === t && S.owned.includes(x.id)).length}</small>`);
  const body = eqTab === "color"
    ? `<div class="esec"><div class="colors">${BODY_COLORS.map((c) => `<button class="cdot ${S.color === c ? "sel" : ""}" style="background:${c}" onclick="setColor('${c}')"></button>`).join("")}</div></div>`
    : sec(eqTab);
  setScreen(`${topBar("そうび")}
    <div class="eqtop"><div class="hero">${charSVG(S.eq, S.color, "bounce")}</div>
    <div class="stats"><span>⚔️ ${pAtk()}</span><span>🛡️ ${pDef()}</span><span>❤️ ${pMaxHp()}</span></div>
    <small class="note">❤️ は ずかんの ★10こで +1 ふえるよ（いま +${starHp()}）</small></div>
    <div class="tabs eqtabs">${tabs.map(([k, l]) => `<button class="${eqTab === k ? "on" : ""}" onclick="eqTab='${k}';equip()">${l}${cnt(k)}</button>`).join("")}</div>
    ${body}`, "bg-shop");
}
function doEquip(type, id) { const y = window.scrollY; S.eq[type] = id; save(); snd("ok"); equip(); window.scrollTo(0, y); }
function setColor(c) { const y = window.scrollY; S.color = c; save(); snd("tap"); equip(); window.scrollTo(0, y); }

// ---------- ずかん ----------
let zTab = "kanji";
// その国の カード（章の出題項目 ＋ 公式）
function worldCards(w) {
  const set = [];
  activeChapters(w).forEach((ch) => ch.items.forEach((id) => { if (!set.includes(id)) set.push(id); }));
  return set;
}
// デバッグ：ずかん 全表示
const zukanAll = () => PQ_DEBUG && window.PQ_ZUKANALL;
function zukanTabs() {
  return `<div class="tabs wtabs">${WORLDS.map((w) => `<button class="${zTab === w.id ? "on" : ""}" onclick="zukan('${w.id}')">${w.icon}<small>${w.name.replace("の国", "")}</small></button>`).join("")}<button class="${zTab === "mats" ? "on" : ""}" onclick="zukan('mats')">🧺<small>そざい</small></button></div>`;
}
// そざいずかん：どこで 手に入るか（一度 手に入れた そざいだけ）
function matPlaces(k) {
  const t = TMAT.findIndex((x) => x && x.includes(k));
  if (t > 0) {
    const chs = CHAPTERS.filter((c) => c.tier === t && chapterOn(c));
    const by = WORLDS.map((w) => ({ w, l: chs.filter((c) => c.w === w.id) })).filter((x) => x.l.length);
    const boss = TMAT[t][1] === k && TMAT[t][0] !== k;
    return `${boss ? "ボスを たおすと 手に はいる。" : "てきを たおすと ときどき 手に はいる。"}<br>${by.map((x) => `${x.w.icon}「${esc(x.l[0].name)}」${x.l.length > 1 ? ` など ${x.l.length}章` : ""}`).join("<br>")}`;
  }
  const wr = Object.keys(WORLD_RARE).find((x) => WORLD_RARE[x].includes(k));
  if (wr) {
    const W = WORLDS.find((x) => x.id === wr), sup = WORLD_RARE[wr][1] === k;
    return sup ? `${W.icon}${W.name}の とても むずかしい 章の ボスが まれに おとす${wr === "kanji" ? "。かきとり道場の ボスでも 手に はいる" : ""}` : `${W.icon}${W.name}の むずかしい 章（後半）の つよい てきや ボスが ときどき おとす${wr === "kanji" ? "。かきとり道場では よく 手に はいる" : ""}`;
  }
  const el = Object.keys(ELEM_MAT).find((x) => ELEM_MAT[x] === k);
  if (el) return `${ELEMENTS[el].icon}${ELEMENTS[el].name}の てきを たおすと ときどき 手に はいる（ボスは かならず）`;
  if (k === "niji") return "🌑 まおうの しろで 手に はいる";
  const w = Object.keys(WORLD_MAT).find((x) => WORLD_MAT[x] === k);
  if (w) { const W = WORLDS.find((x) => x.id === w); return `${W.icon}${W.name}の 章で 手に はいる（ボスは かならず）`; }
  return "";
}
function matZukan() {
  const keys = Object.keys(MATS), got = keys.filter(matSeen).length;
  setScreen(`${topBar("ずかん")}${zukanTabs()}
    <div class="zhead">あつめた そざい <b>${got} / ${keys.length}</b></div>
    <p class="note">一度 手に入れた そざいは、どこで 手に はいるか 見られるよ</p>
    <div class="mlist2">${keys.map((k) => matSeen(k)
      ? `<div class="mcard"><span class="mem">${MATS[k].em}</span><div><b>${MATS[k].name}</b><small>もっている数：${(S.mats || {})[k] || 0}</small><small class="mplace">${matPlaces(k)}</small></div></div>`
      : `<div class="mcard lock"><span class="mem">？</span><div><b>？？？</b><small>まだ 見つけていない そざい</small></div></div>`).join("")}</div>`, "bg-shop");
}

function zukan(tab) {
  if (tab) zTab = tab;
  if (zTab === "mats") return matZukan();
  const ids = worldCards(zTab);
  const got = ids.filter((id) => S.cards[id] && S.cards[id].s > 0).length;
  const big = zTab === "kanji";
  const tiles = ids.map((id) => {
    const c = S.cards[id] || (zukanAll() ? { s: 0 } : null);
    if (!zukanAll() && (!c || c.s === 0)) return `<button class="zc lock ${big ? "" : "f"}" onclick="toast('バトルで 正解すると カードに なるよ')"><b>？</b>${c && c.ng ? '<i class="ngm">👻</i>' : ""}</button>`;
    return `<button class="zc ${big ? "" : "f"} ${c.s >= 5 ? "shiny" : ""} ${c.ng ? "ngc" : ""}" onclick="cardDetail('${id}')"><b>${esc(cardLabel(id))}</b><span class="stars">${"★".repeat(c.s)}${"☆".repeat(5 - c.s)}</span>${c.ng ? '<i class="ngm">👻</i>' : ""}</button>`;
  }).join("");
  setScreen(`${topBar("ずかん")}
    ${zukanTabs()}
    <div class="zhead">あつめた カード <b>${got} / ${ids.length}</b>　★ごうけい <b>${totalStars()}</b>（❤️+${starHp()}）</div>
    <p class="note">★は <b>ちがう日</b>に 正解すると 1つ アップ。★5で キラカードに！ 👻 は ニガテちゅう<br>★10こで ❤️+1（さいだい +100）</p>
    <div class="zgrid ${big ? "" : "f"}">${tiles}</div>`, "bg-shop");
}
function cardDetail(id) {
  const c = S.cards[id] || { s: 0, cor: 0, tot: 0, st: 0, last: "" };
  const stars = `<div class="stars big">${"★".repeat(c.s)}${"☆".repeat(5 - c.s)}</div>`;
  const next = c.ng ? "👻 ニガテちゅう！ あと " + (2 - c.st) + "回 正解で ニガテ解除" : c.s >= 5 ? "✨ キラカード！ かんぺき！" : c.last === today() ? "つぎの ★アップは あした いこうに 正解！" : "きょう 正解すると ★アップ！";
  let body;
  if (id.startsWith("k:")) {
    const K = kanjiOf(id);
    body = `<div class="kbig ${c.s >= 5 ? "shiny" : ""}">${K.k}</div><div class="words">${K.w.map(([w, r]) => `<div>${esc(w)}<small>（${r}）</small></div>`).join("")}</div>`;
  } else if (id.startsWith("f:")) {
    const F = formulaOf(id);
    body = `<div class="fcard ${c.s >= 5 ? "shiny" : ""}"><b>${F.name}</b><div class="fml">${F.ans}</div><small>ひっさつわざ「${F.skill}」</small></div>`;
  } else if (id.startsWith("m:")) {
    const M = MATH[id.slice(2)];
    body = `<div class="fcard ${c.s >= 5 ? "shiny" : ""}"><b>${M.name}</b><div class="fml sm">${M.memo || ""}</div></div>`;
  } else {
    const Q = BANK[id];
    const ans = Q.type === "order" ? Q.order.join(" → ") : Q.type === "input" ? fmtNum(Q.input, Q.unit) : Q.a;
    body = `<div class="fcard ${c.s >= 5 ? "shiny" : ""}"><b>${esc(Q.t)}</b><div class="qtext sm">${Q.q}</div><div class="fml sm">${ans}</div>${Q.ex ? `<small>${Q.ex}</small>` : ""}</div>`;
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
  setScreen(`${topBar("ミッション")}<div class="mlist">${list}</div>
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
    <div class="panel"><div class="sub">ぼうけんのしょ</div><p class="small">いまは「ぼうけんのしょ${SL.cur + 1}」で あそんでいます。</p>
      <button class="big-btn" onclick="goTitle()">📖 タイトルに もどる</button></div>
    <div class="panel"><div class="sub">音</div>
      <div class="sndrow"><span>🎵 BGM</span><button class="big-btn ${S.bgm ? "primary" : ""}" onclick="S.bgm=!S.bgm;save();BGM.refresh();parent()">${S.bgm ? "🔊 オン" : "🔇 オフ"}</button></div>
      <div class="sndrow"><span>🔔 効果音</span><button class="big-btn ${S.sound ? "primary" : ""}" onclick="S.sound=!S.sound;save();parent()">${S.sound ? "🔊 オン" : "🔇 オフ"}</button></div>
      <p class="small">マナーモードの ときは、イヤホンを つけていなければ 鳴らないように しています。<br>もし マナーモードで 音が 出てしまったら、ここで オフに してね。</p></div>
    ${Cloud.enabled() ? `<div class="panel"><div class="sub">🔑 ふっかつコード（ぼうけんのしょ${SL.cur + 1}）</div><p class="codebig">${Cloud.code(SL.cur)}</p>
      <p class="small">この ぼうけんのしょ だけの コードだよ。データが きえて しまった ときに つかうよ。<br>おうちの人にも おしえてあげてね（おうちの人の スマホから 学習の ようすが 見られるよ）。</p></div>` : ""}`, "bg-shop");
}
function checkGate() {
  if (Number($("gate").value) === gateAns) parentPanel();
  else { snd("ng"); toast("答えが ちがいます"); }
}
function parentPanel() {
  const d = today(), td = S.stats.days[d] || { tot: 0, cor: 0 };
  const rate = (c, t) => (t ? Math.round((c / t) * 100) + "%" : "-");
  const per = WORLDS.map((w) => { const ids = worldCards(w.id); return { w, all: ids.length, got: ids.filter((x) => (S.cards[x] || {}).s > 0).length, master: ids.filter((x) => (S.cards[x] || {}).s >= 5).length, ch: worldProgress(w.id) }; });
  const ng = nigateIds().map(cardLabel);
  const last7 = [];
  for (let i = 6; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); const k = dateKey(dt); const v = S.stats.days[k] || { tot: 0, cor: 0 }; last7.push({ k: k.slice(5), ...v }); }
  const mx = Math.max(10, ...last7.map((x) => x.tot));
  setScreen(`${topBar("保護者メニュー", "parent")}
    <div class="panel"><div class="sub">きょう</div><p>解いた問題 <b>${td.tot}</b>問 ／ 正答率 <b>${rate(td.cor, td.tot)}</b></p>
      <div class="chart">${last7.map((x) => `<div class="cbar"><i style="height:${(x.tot / mx) * 100}%"></i><small>${x.k}</small><span>${x.tot}</span></div>`).join("")}</div>
      <p class="small">直近7日の解答数</p></div>
    <div class="panel"><div class="sub">これまで</div>
      <p>総解答 <b>${S.stats.tot}</b>問 ／ 正答率 <b>${rate(S.stats.cor, S.stats.tot)}</b></p>
      ${per.map((x) => `<p>${x.w.icon}${x.w.name}：章 ${x.ch.done}/${x.ch.all}、出会った ${x.got}/${x.all}、★5（定着） ${x.master}</p>`).join("")}
      <p>苦手（ニガテ）：${ng.length ? ng.map(esc).join("、") : "なし"}</p></div>
    ${cfgPanel()}
    <div class="panel"><div class="sub">クラウドセーブ</div>${Cloud.enabled() ? `
      <p class="small">データは自動でクラウドにも保存されています。アプリやデータが消えても、タイトル画面の「ふっかつコードで もどす」に下のコードを入れると、このぼうけんのしょが元に戻ります（ぼうけんのしょごとに別のコードです）。<b>スクリーンショットやメモで控えておいてください。</b></p>
      <div class="rcode">${Cloud.code(SL.cur)}</div>
      <p class="small" id="cstat">${Cloud.status().icon} ${Cloud.status().text}</p>
      <button class="big-btn" onclick="cloudNow()">いますぐ クラウドに 保存</button>
      <div class="abox left"><b>📱 別のスマホや PC から 見る</b><br>保護者用ページ（見るだけ）で、このコードを 入れると 学習の ようすを 確認できます。<br><span class="purl">${location.origin}${location.pathname.replace(/[^/]*$/, "")}parent.html</span></div>` : `<p class="small">クラウドセーブは準備中です（Firebaseの設定後に使えるようになります）。それまでは下のバックアップをご利用ください。</p>`}</div>
    <div class="panel"><div class="sub">バックアップ（このぼうけんのしょ）</div>
      <p class="small">機種変更やデータ消去にそなえて、下の「コピー」でデータを保存しておけます（メモアプリ等に貼り付け）。</p>
      <textarea id="bk" rows="3" readonly>${btoa(unescape(encodeURIComponent(JSON.stringify(S))))}</textarea>
      <div class="row"><button class="big-btn" onclick="copyBk()">コピー</button><button class="big-btn" onclick="restoreBk()">復元する</button></div></div>
    <div class="panel"><div class="sub">データの削除</div><button class="big-btn danger" onclick="resetAll()">ぼうけんのしょ${SL.cur + 1} を けす</button></div>`, "bg-shop");
}
// ---------- 出題の設定（保護者） ----------
// S.cfg = { g: この学年まで, ch: { 章id: オン/オフ（くわしい設定） }, at: 変えた時刻 }。子どもの 画面には 学年は 出さない
function cfgPanel() {
  const cfg = S.cfg || {};
  const coarse = [1, 2, 3, 4, 5, 6].map((g) => `<button class="cfgb ${cfg.g === g ? "on" : ""}" onclick="cfgSetG(${g})">${g}年生まで</button>`).join("")
    + `<button class="cfgb ${!cfg.g ? "on" : ""}" onclick="cfgSetG(0)">すべて</button>`;
  const worlds = WORLDS.map((w) => {
    const list = worldChapters(w.id), on = list.filter((c) => cfgChapterOn(cfg, c)).length;
    const grades = [...new Set(list.map((c) => c.g))].sort();
    return `<details class="cfgw"><summary>${w.icon} ${w.name}（${on}/${list.length}章を 出題中）</summary>
      ${grades.map((g) => `<div class="cfggr">${g}年</div>${list.filter((c) => c.g === g).map((c) => {
        const ov = cfg.ch && cfg.ch[c.id] !== undefined;
        return `<label class="cfgc"><input type="checkbox" ${cfgChapterOn(cfg, c) ? "checked" : ""} onchange="cfgChapter('${c.id}', this.checked, this)"> ${esc(c.name)}<i class="ovr ${ov ? "" : "hidden"}">個別</i></label>`;
      }).join("")}`).join("")}
      <button class="cfgreset" onclick="cfgResetWorld('${w.id}')">この国を「◯年生まで」の 設定に もどす</button></details>`;
  }).join("");
  return `<div class="panel" id="cfgpanel"><div class="sub">⚙️ 出題の設定</div>
    <p class="small">ゲームの 画面には 学年は 表示されません。記録は 消えません。<br>いまの 設定：<b id="cfgsum">${cfgSummary(cfg)}</b></p>
    <p class="small"><b>ざっくり 設定</b>：この 学年までの 章を 出します</p><div class="cfgbs">${coarse}</div>
    <p class="small"><b>くわしい 設定</b>：章ごとに オン／オフ（ざっくり設定より 優先、「個別」の しるしが つきます）</p>${worlds}
    <p class="small" id="cfgmsg"></p></div>`;
}
function cfgSave() { S.cfg.at = Date.now(); save(); if ($("cfgsum")) $("cfgsum").textContent = cfgSummary(S.cfg); const m = $("cfgmsg"); if (m) { m.textContent = "✅ 保存しました"; setTimeout(() => { if ($("cfgmsg")) $("cfgmsg").textContent = ""; }, 1500); } }
function cfgSetG(g) {
  S.cfg = Object.assign({ ch: {} }, S.cfg, { g: g || undefined });
  cfgSave();
  const y = window.scrollY; parentPanel(); window.scrollTo(0, y);
}
function cfgChapter(id, on, el) {
  S.cfg = Object.assign({ ch: {} }, S.cfg); S.cfg.ch = S.cfg.ch || {};
  S.cfg.ch[id] = on;
  cfgSave();
  const mark = el && el.parentElement.querySelector(".ovr"); if (mark) mark.classList.remove("hidden");
}
function cfgResetWorld(w) {
  if (!S.cfg || !S.cfg.ch) return;
  worldChapters(w).forEach((c) => delete S.cfg.ch[c.id]);
  cfgSave();
  const y = window.scrollY; parentPanel(); window.scrollTo(0, y);
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
function resetAll() { delConfirm1(SL.cur); }

// ---------- データを けす（タイトル画面から） ----------
// けした データは クラウドに のこるので、ふっかつコードで もどせる。けした 記録は 5こまで のこす
const DEL_KEY = PQ_DEBUG ? "puniquest_debug_deleted_v1" : "puniquest_deleted_v1";
const delHistory = () => { try { return JSON.parse(localStorage.getItem(DEL_KEY) || "[]"); } catch (e) { return []; } };
function delMenu() {
  snd("tap");
  const has = SL.slots.some((d) => d && d.name);
  modal(`<div class="mtitle">🗑 データを けす</div>
    <p class="small">けしたい ぼうけんのしょを えらんでね。</p>
    <div class="rslots">${[0, 1, 2].map((i) => { const d = SL.slots[i]; return d && d.name
      ? `<button class="big-btn" onclick="delConfirm1(${i})">ぼうけんのしょ${i + 1}：${esc(d.name)}<small>⭐${Object.values(d.stClear || {}).reduce((a, b) => a + b, 0)}・🪙${d.coins}・さいごに あそんだ日 ${d.savedAt ? new Date(d.savedAt).toLocaleDateString("ja-JP") : "-"}</small></button>`
      : `<button class="big-btn" disabled>ぼうけんのしょ${i + 1}：からっぽ</button>`; }).join("")}</div>
    ${has ? "" : `<p class="small">けせる データが ないよ。</p>`}
    <button class="big-btn" onclick="closeModal()">やめる</button>`);
}
// 1回目の かくにん
function delConfirm1(i) {
  const d = SL.slots[i];
  if (!d) return;
  snd("tap");
  modal(`<div class="mtitle">ぼうけんのしょ${i + 1} を けす？</div>
    <div class="hero xs">${charSVG(d.eq, d.color)}</div>
    <p>「<b>${esc(d.name)}</b>」の コイン・そうび・カード・なかまが このスマホから きえます。<br>ほかの ぼうけんのしょは きえません。</p>
    <div class="row"><button class="big-btn primary" onclick="closeModal()">やめる</button><button class="big-btn danger" onclick="delConfirm2(${i})">けす</button></div>`);
}
// 2回目の かくにん
function delConfirm2(i) {
  const d = SL.slots[i];
  if (!d) return;
  snd("ng");
  modal(`<div class="mtitle">⚠️ さいごの かくにん</div>
    <p>ほんとうに「<b>${esc(d.name)}</b>」を けして いいですか？</p>
    <p class="small">けした あとでも、「🗂 けした データの ふっかつコード」で コードを たしかめて、「🔑 ふっかつコードで もどす」に 入れると もとに もどせます（ネットに つながっている とき）。</p>
    <div class="row"><button class="big-btn primary" onclick="closeModal()">やめる</button><button class="big-btn danger" onclick="doDelete(${i})">ほんとうに けす</button></div>`);
}
async function doDelete(i) {
  const d = SL.slots[i];
  if (!d) return;
  modal(`<div class="mtitle">けしています…</div><div class="bigicon">🗑</div>`);
  const r = await Cloud.detach(i).catch(() => ({ code: "", saved: false }));
  const hist = delHistory();
  hist.unshift({ name: d.name, code: r.code, at: Date.now(), saved: r.saved });
  try { localStorage.setItem(DEL_KEY, JSON.stringify(hist.slice(0, 5))); } catch (e) { /* 無視 */ }
  SL.slots[i] = null; writeSlots();
  if (SL.cur === i) S = null;
  snd("tap");
  title();
  modal(`<div class="mtitle">けしました</div>
    <p>「${esc(d.name)}」を けしました。</p>
    ${r.code ? `<p class="small">もどす ときの ふっかつコード：</p><p class="codebig">${r.code}</p>${r.saved ? "" : `<p class="small">⚠️ さいごの セーブを クラウドに 送れませんでした。もどすと、すこし 前の データに なります。</p>`}`
      : `<p class="small">クラウドに ほぞんしていない データなので、もとに もどすことは できません。</p>`}
    <button class="big-btn" onclick="closeModal()">とじる</button>`);
}
// けした データの 記録（5こまで）
function delList() {
  snd("tap");
  const h = delHistory();
  modal(`<div class="mtitle">🗂 けした データの ふっかつコード</div>
    <p class="small">さいきん けした 5こまで のこっているよ。もどしたい ときは コードを「🔑 ふっかつコードで もどす」に 入れてね。</p>
    ${h.length ? `<div class="dellist">${h.map((x) => `<div class="delrow"><b>${esc(x.name)}</b><small>けした日：${new Date(x.at).toLocaleDateString("ja-JP")} ${new Date(x.at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</small>
      ${x.code ? `<span class="codebig sm">${x.code}</span><button class="big-btn" onclick="restoreMenu('${x.code}')">🔑 この コードで もどす</button>` : `<small>（クラウドに なかった ので もどせません）</small>`}</div>`).join("")}</div>`
      : `<p class="small">まだ けした データは ないよ。</p>`}
    <button class="big-btn" onclick="closeModal()">とじる</button>`);
}
async function cloudNow() {
  $("cstat").textContent = "⏳ 保存しています…";
  const ok = await Cloud.push();
  const st = Cloud.status();
  if ($("cstat")) $("cstat").textContent = ok ? "☁️ クラウドに保存しました" : `${st.icon} ${st.text}`;
}

// ---------- タイトル画面（ぼうけんのしょを えらぶ） ----------
const fmtTime = (ts) => { if (!ts) return ""; const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`; };

function slotCard(i, mode) {
  const d = SL.slots[i];
  const isCur = mode === "save" && i === SL.cur;
  if (!d || !d.name) {
    return `<button class="slot empty" onclick="slotTap(${i},'${mode}')"><span class="snum">${i + 1}</span><span class="sinfo"><b>${mode === "start" ? "＋ あたらしく はじめる" : "（からっぽ）"}</b></span></button>`;
  }
  const stars = Object.values(d.cards || {}).reduce((a, c) => a + c.s, 0);
  return `<button class="slot ${isCur ? "cur" : ""}" onclick="slotTap(${i},'${mode}')">
    <span class="snum">${i + 1}</span><span class="sprev">${charSVG(d.eq, d.color)}</span>
    <span class="sinfo"><b>${esc(d.name)}</b><small>章 ${Object.keys(d.stClear || {}).filter((k) => k.endsWith("-4")).length} クリア ・ ★${stars} ・ 🪙${d.coins}</small><small>${fmtTime(d.savedAt)}</small></span>
    ${isCur ? '<i class="curtag">いま</i>' : ""}</button>`;
}

function title() {
  S = null;
  const cs = Cloud.status();
  setScreen(`<div class="titlewrap">
    <h1 class="logo">ぷにまる<br>クエスト</h1>
    <div class="sub center">ぼうけんのしょを えらんでね</div>
    <div class="slots">${[0, 1, 2].map((i) => slotCard(i, "start")).join("")}</div>
    <p class="note">${cs.icon} ${cs.text}</p>
    ${updateV ? `<button class="big-btn primary" onclick="goTitle()">🆕 アップデートする</button>` : ""}
    ${Cloud.enabled() ? `<button class="big-btn" onclick="restoreMenu()">🔑 ふっかつコードで もどす</button>` : ""}
    <a class="big-btn manualbtn" href="${window.PQ_BASE || ""}manual/kids.html">📘 せつめいしょ を 見る</a>
    <div class="row titlesub"><button class="big-btn" onclick="delMenu()">🗑 データを けす</button>${delHistory().length ? `<button class="big-btn" onclick="delList()">🗂 けした データの ふっかつコード</button>` : ""}</div>
    <p class="note">ver.${window.APP_V || "-"}</p>
  </div>`, "bg-home");
  // ほかのスマホで遊んだ分があれば取りこんで表示しなおす
  Cloud.pullAll().then((changed) => { if (changed && !S) title(); });
}

function slotTap(i, mode) {
  snd("tap");
  if (mode === "start") {
    SL.cur = i; writeSlots();
    if (SL.slots[i] && SL.slots[i].name) {
      S = Object.assign(newSave(), SL.slots[i]);
      S.cfg = migrateCfg(S.cfg);
      // 音は さいしょ オフ（マナーモードで 鳴らないように。前の 版の データも 一度 オフに する）
      if (S.aud !== 1) { S.sound = false; S.bgm = false; S.aud = 1; }
      // アクセサリー枠（前の 版の データには ない）
      if (!S.eq.acc) S.eq.acc = "x_none";
      if (!S.owned.includes("x_none")) S.owned.push("x_none");
      setTimeout(syncCfg, 500);
      Object.keys(S.cleared || {}).forEach((k) => { S.tierClear[k] = true; });
      SL.slots[i] = S;
      ensureDaily(); home();
    } else { Cloud.freshCode(i); S = newSave(); setup(); }
    return;
  }
  // 手動セーブ：いまのぼうけんのしょ、または別のぼうけんのしょ（コピー）に保存
  if (i === SL.cur) { manualSave(i); return; }
  const d = SL.slots[i];
  if (d && d.name) {
    modal(`<div class="mtitle">うわがき しても いい？</div><p>ぼうけんのしょ${i + 1} の「<b>${esc(d.name)}</b>」は きえて、<br>いまの ぼうけんが コピーされるよ。</p>
      <div class="row"><button class="big-btn" onclick="saveMenu()">やめる</button><button class="big-btn danger" onclick="manualSave(${i})">うわがき</button></div>`);
  } else manualSave(i);
}

function saveMenu() {
  snd("tap");
  modal(`<div class="mtitle">💾 セーブ</div><p class="small">どの ぼうけんのしょに セーブする？</p>
    <div class="slots">${[0, 1, 2].map((i) => slotCard(i, "save")).join("")}</div>
    <p class="note">ふだんは じどうで セーブされているよ。<br>ちがう ぼうけんのしょを えらぶと コピーが のこせるよ。</p>
    <button class="big-btn" onclick="closeModal()">とじる</button>`, "savebox");
}

async function manualSave(i) {
  save();
  if (i !== SL.cur) {
    SL.slots[i] = JSON.parse(JSON.stringify(S));
    writeSlots(); Cloud.markDirty(i);
  }
  modal(`<div class="mtitle">セーブしています…</div><div class="bigicon">💾</div>`);
  const ok = Cloud.enabled() ? await Cloud.push() : false;
  snd("coin");
  const where = !Cloud.enabled() ? "この スマホに セーブしたよ！" : ok ? "クラウドにも セーブしたよ！" : "この スマホに セーブしたよ！<br><small>（クラウドは ネットに つながったら セーブ）</small>";
  modal(`<div class="mtitle">セーブ かんりょう！</div><div class="bigicon">${ok ? "☁️" : "💾"}</div>
    <p>ぼうけんのしょ${i + 1} に ${where}</p><button class="big-btn primary" onclick="closeModal();home()">OK</button>`);
}

function restoreMenu(pre) {
  snd("tap");
  modal(`<div class="mtitle">🔑 ふっかつコード</div><p class="small">⚙️せってい画面に のっていた 12文字の コードを 入れて、もどす ばしょを えらんでね。</p>
    <input id="rcode" class="rinput" maxlength="16" placeholder="XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" value="${pre || ""}">
    <div class="rslots">${[0, 1, 2].map((i) => `<button class="big-btn" onclick="doCloudRestore(${i})">ぼうけんのしょ${i + 1} に もどす<small>${SL.slots[i] && SL.slots[i].name ? `いまの「${esc(SL.slots[i].name)}」は きえます` : "からっぽ"}</small></button>`).join("")}</div>
    <button class="big-btn" onclick="closeModal()">やめる</button>`);
}
async function doCloudRestore(i) {
  const d = SL.slots[i];
  if (d && d.name && !confirm(`ぼうけんのしょ${i + 1} の「${d.name}」は きえて しまうよ。ほんとうに もどす？`)) return;
  const r = await Cloud.restore($("rcode").value, i);
  const msg = { bad: "コードは 12文字だよ", off: "クラウドセーブが 使えません", notfound: "その コードの データが みつからないよ", net: "ネットに つながっているか たしかめてね" }[r];
  if (msg) { snd("ng"); toast(msg); return; }
  snd("win"); closeModal(); toast("データを もどしたよ！"); title();
}

// ---------- アップデートの確認 ----------
// version.json の 版が 新しくなっていたら、小さく お知らせする
let updateV = 0;
async function checkUpdate() {
  if (location.protocol === "file:") return;
  syncCfg();
  try {
    const j = await (await fetch((window.PQ_BASE || "") + "version.json?t=" + Date.now(), { cache: "no-store" })).json();
    if (j.v > (window.APP_V || 0)) { updateV = j.v; showUpdBar(); }
  } catch (e) { /* ネットに つながらないときは 何もしない */ }
}
// 保護者ページで 変えた 出題の設定を 取りこむ（新しい ほうを 使う）
async function syncCfg() {
  if (!S) return;
  const c = await Cloud.fetchCfg(SL.cur);
  if (c && (c.at || 0) > ((S.cfg && S.cfg.at) || 0)) { S.cfg = c; save(); }
}
function showUpdBar() {
  const b = $("updbar");
  b.innerHTML = "🆕 アップデートが あるよ！ <b>タイトルに もどると</b> あたらしく なるよ";
  b.onclick = goTitle;
  b.classList.toggle("hidden", $("app").className === "bg-battle");
}
// タイトルへ もどる（アップデートが あれば ここで あたらしい版に する）
function goTitle() {
  if (B) B.over = true;
  if (S) save();
  if (updateV) {
    $("app").innerHTML = `<div class="loading">あたらしい 版に しています…</div>`;
    Promise.resolve(Cloud.push()).finally(() => location.replace(location.pathname + "?v=" + updateV));
    return;
  }
  closeModal();
  title();
}
setTimeout(checkUpdate, 3000);
setInterval(checkUpdate, 5 * 60 * 1000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkUpdate(); });

// ---------- 起動 ----------
prepareChapters();
prepareExtra();
loadSlots();
title();
if ("serviceWorker" in navigator && location.protocol !== "file:" && !PQ_DEBUG) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
