// ===== かぐの え と、国を すすめると ふえる かぐ =====
// 絵文字に ない かぐ（ふとん・ねぶくろ・てんがいベッドなど）を SVG で かく。
// 色ちがい・かたちちがいの かぐは、その国の 章を クリアするほど ショップに ならぶ。
"use strict";

// ---------- かぐの え（よこ 100×たて 100。2マスの かぐは 200×100。下が ゆか） ----------
const fDk = (c, p = -0.25) => shade(c, p);
const fSt = (c) => `stroke="${fDk(c, -0.35)}" stroke-width="2.2" stroke-linejoin="round"`;
const FART = {
  // ベッド（a：わく、b：かけぶとん、p：まくら）
  bed: (c) => `<rect x="10" y="30" width="16" height="66" rx="5" fill="${c.a}" ${fSt(c.a)}/><rect x="174" y="52" width="16" height="44" rx="5" fill="${c.a}" ${fSt(c.a)}/>
    <rect x="18" y="60" width="164" height="24" rx="6" fill="#fff" ${fSt("#e6e0ea")}/><ellipse cx="46" cy="56" rx="18" ry="9" fill="${c.p || "#fff"}" ${fSt(c.p || "#ddd")}/>
    <path d="M70 52 H180 V82 H70 Q62 67 70 52Z" fill="${c.b}" ${fSt(c.b)}/><path d="M70 52 Q80 60 70 70" fill="none" stroke="${fDk(c.b, 0.3)}" stroke-width="3"/>
    <rect x="22" y="84" width="8" height="12" fill="${fDk(c.a)}"/><rect x="168" y="84" width="8" height="12" fill="${fDk(c.a)}"/>`,
  // てんがいベッド
  canopy: (c) => FART.bed(c) + `<rect x="12" y="6" width="6" height="90" fill="${c.a}" ${fSt(c.a)}/><rect x="182" y="6" width="6" height="90" fill="${c.a}" ${fSt(c.a)}/>
    <path d="M8 6 H192 L188 16 H12Z" fill="${c.d}" ${fSt(c.d)}/><path d="M18 14 Q30 50 22 80 L14 80 Q20 46 14 14Z" fill="${c.d}" opacity=".75"/><path d="M182 14 Q170 50 178 80 L186 80 Q180 46 186 14Z" fill="${c.d}" opacity=".75"/>
    <circle cx="100" cy="6" r="5" fill="${c.g || "#ffd23f"}"/>`,
  // 2だんベッド
  bunk: (c) => `<rect x="8" y="4" width="10" height="92" rx="3" fill="${c.a}" ${fSt(c.a)}/><rect x="182" y="4" width="10" height="92" rx="3" fill="${c.a}" ${fSt(c.a)}/>
    ${[18, 62].map((y) => `<rect x="16" y="${y + 12}" width="168" height="10" rx="3" fill="${c.a}" ${fSt(c.a)}/><rect x="18" y="${y + 2}" width="164" height="12" rx="4" fill="#fff"/><ellipse cx="40" cy="${y}" rx="14" ry="6" fill="#fff" ${fSt("#ddd")}/><path d="M62 ${y - 3} H180 V${y + 12} H62Z" fill="${y < 40 ? c.b : c.p}" ${fSt(y < 40 ? c.b : c.p)}/>`).join("")}
    <g stroke="${fDk(c.a)}" stroke-width="3"><line x1="160" y1="10" x2="160" y2="96"/><line x1="176" y1="10" x2="176" y2="96"/>${[30, 46, 62, 78].map((y) => `<line x1="160" y1="${y}" x2="176" y2="${y}"/>`).join("")}</g>`,
  // ふとん
  futon: (c) => `<rect x="10" y="80" width="180" height="14" rx="5" fill="#fbf8f2" ${fSt("#e2dccd")}/><ellipse cx="36" cy="76" rx="20" ry="8" fill="${c.p || "#fff"}" ${fSt(c.p || "#ddd")}/>
    <path d="M60 70 Q58 64 66 64 H184 Q190 64 190 72 V86 H60Z" fill="${c.b}" ${fSt(c.b)}/>${[80, 110, 140, 168].map((x, i) => `<circle cx="${x}" cy="${74 + (i % 2) * 6}" r="3.5" fill="${c.d || "#fff"}" opacity=".9"/>`).join("")}`,
  // ねぶくろ
  sleepbag: (c) => `<rect x="12" y="62" width="176" height="32" rx="16" fill="${c.b}" ${fSt(c.b)}/><circle cx="34" cy="74" r="16" fill="${fDk(c.b, 0.25)}" ${fSt(c.b)}/><circle cx="34" cy="74" r="9" fill="#3a2a2a" opacity=".25"/>
    <path d="M52 66 H180" stroke="${c.d || "#fff"}" stroke-width="3" stroke-dasharray="5 4"/>${c.star ? [70, 110, 150, 130, 90].map((x, i) => `<circle cx="${x}" cy="${74 + (i % 3) * 6}" r="2" fill="#fff8b0"/>`).join("") : ""}`,
  // ハンモック
  hammock: (c) => `<rect x="10" y="20" width="8" height="76" rx="3" fill="${c.a}" ${fSt(c.a)}/><rect x="182" y="20" width="8" height="76" rx="3" fill="${c.a}" ${fSt(c.a)}/>
    <path d="M18 34 Q100 100 182 34 L182 42 Q100 108 18 42Z" fill="${c.b}" ${fSt(c.b)}/><path d="M30 44 Q100 96 170 44" fill="none" stroke="${c.d || "#fff"}" stroke-width="2.5" stroke-dasharray="6 5"/>`,
  // いす
  chair: (c) => `<rect x="26" y="10" width="10" height="58" rx="3" fill="${c.a}" ${fSt(c.a)}/><rect x="26" y="12" width="44" height="26" rx="5" fill="${c.b || c.a}" ${fSt(c.b || c.a)}/>
    <rect x="22" y="58" width="56" height="10" rx="4" fill="${c.b || c.a}" ${fSt(c.b || c.a)}/><rect x="26" y="66" width="7" height="30" fill="${fDk(c.a)}"/><rect x="68" y="66" width="7" height="30" fill="${fDk(c.a)}"/>`,
  // まるい いす
  stool: (c) => `<rect x="34" y="56" width="6" height="40" fill="${fDk(c.a)}" transform="rotate(8 37 76)"/><rect x="60" y="56" width="6" height="40" fill="${fDk(c.a)}" transform="rotate(-8 63 76)"/><rect x="47" y="58" width="6" height="38" fill="${c.a}"/>
    <ellipse cx="50" cy="56" rx="26" ry="9" fill="${c.b || c.a}" ${fSt(c.b || c.a)}/>`,
  // ゆりいす
  rocking: (c) => `<path d="M20 20 Q24 8 36 10 L40 62 L28 62Z" fill="${c.a}" ${fSt(c.a)}/><rect x="26" y="56" width="52" height="10" rx="4" fill="${c.b}" ${fSt(c.b)}/>
    <rect x="30" y="64" width="6" height="22" fill="${c.a}"/><rect x="70" y="64" width="6" height="22" fill="${c.a}"/><path d="M10 84 Q50 100 92 84" fill="none" stroke="${fDk(c.a)}" stroke-width="6" stroke-linecap="round"/>`,
  // ビーズクッション
  beanbag: (c) => `<path d="M14 92 Q8 60 30 44 Q50 30 72 44 Q94 58 88 92Z" fill="${c.b}" ${fSt(c.b)}/><path d="M30 60 Q50 50 70 60" fill="none" stroke="${fDk(c.b, 0.3)}" stroke-width="3"/><ellipse cx="38" cy="54" rx="8" ry="4" fill="#fff" opacity=".35"/>`,
  // ざいす
  zaisu: (c) => `<path d="M24 28 Q24 22 30 22 H70 Q76 22 76 28 V74 H24Z" fill="${c.a}" ${fSt(c.a)}/><rect x="30" y="30" width="40" height="40" rx="6" fill="${c.b}"/><rect x="16" y="74" width="68" height="18" rx="6" fill="${c.b}" ${fSt(c.b)}/>`,
  // おうさまの いす
  throne: (c) => `<path d="M24 92 V24 Q24 8 50 4 Q76 8 76 24 V92Z" fill="${c.a}" ${fSt(c.a)}/><path d="M34 26 Q50 14 66 26 V60 H34Z" fill="${c.b}"/>
    <rect x="18" y="58" width="64" height="14" rx="5" fill="${c.b}" ${fSt(c.b)}/><rect x="14" y="44" width="10" height="48" rx="4" fill="${c.a}" ${fSt(c.a)}/><rect x="76" y="44" width="10" height="48" rx="4" fill="${c.a}" ${fSt(c.a)}/>
    <path d="M40 4 L44 -2 L50 4 L56 -2 L60 4" fill="none" stroke="${c.a}" stroke-width="3"/><circle cx="50" cy="20" r="4" fill="#ff4d6d"/>`,
  // しかくい いす（カラフル）
  cube: (c) => `<path d="M20 44 L50 32 L80 44 L50 56Z" fill="${c.a}" ${fSt(c.a)}/><path d="M20 44 L50 56 V92 L20 80Z" fill="${c.b}" ${fSt(c.b)}/><path d="M80 44 L50 56 V92 L80 80Z" fill="${c.d}" ${fSt(c.d)}/>`,
  // まるい テーブル
  table: (c) => `<rect x="46" y="44" width="8" height="46" fill="${fDk(c.a)}"/><ellipse cx="50" cy="92" rx="20" ry="5" fill="${fDk(c.a)}"/><ellipse cx="50" cy="42" rx="40" ry="11" fill="${c.a}" ${fSt(c.a)}/>${c.b ? `<ellipse cx="50" cy="40" rx="30" ry="7" fill="${c.b}" opacity=".6"/>` : ""}`,
  // ちゃぶだい
  chabudai: (c) => `<rect x="24" y="72" width="7" height="22" fill="${fDk(c.a)}"/><rect x="69" y="72" width="7" height="22" fill="${fDk(c.a)}"/><ellipse cx="50" cy="70" rx="42" ry="10" fill="${c.a}" ${fSt(c.a)}/><ellipse cx="44" cy="66" rx="6" ry="3" fill="#fff" opacity=".8"/><circle cx="62" cy="64" r="4" fill="#c0392b"/>`,
  // つくえ
  desk: (c) => `<rect x="8" y="40" width="84" height="9" rx="3" fill="${c.a}" ${fSt(c.a)}/><rect x="12" y="49" width="30" height="47" fill="${c.b || c.a}" ${fSt(c.b || c.a)}/>
    ${[58, 72, 86].map((y) => `<line x1="16" y1="${y}" x2="38" y2="${y}" stroke="${fDk(c.a)}" stroke-width="2"/><circle cx="27" cy="${y - 6}" r="1.8" fill="${fDk(c.a, -0.4)}"/>`).join("")}<rect x="82" y="49" width="7" height="47" fill="${fDk(c.a)}"/>
    <rect x="58" y="28" width="22" height="12" rx="2" fill="#fff" ${fSt("#ddd")}/>`,
  // こたつ
  kotatsu: (c) => `<path d="M10 54 L90 54 L96 92 L4 92Z" fill="${c.b}" ${fSt(c.b)}/><rect x="6" y="44" width="88" height="10" rx="3" fill="${c.a}" ${fSt(c.a)}/>${[24, 50, 76].map((x) => `<circle cx="${x}" cy="72" r="5" fill="${c.d || "#fff"}" opacity=".7"/>`).join("")}<circle cx="60" cy="38" r="7" fill="#ff9f1c"/>`,
  // スタンドライト
  floorlamp: (c) => `<ellipse cx="50" cy="94" rx="18" ry="4" fill="${fDk(c.a)}"/><rect x="47" y="30" width="6" height="64" fill="${c.a}"/><path d="M28 34 L36 8 H64 L72 34Z" fill="${c.b}" ${fSt(c.b)}/><ellipse cx="50" cy="34" rx="22" ry="4" fill="#fff6c8" opacity=".9"/>`,
  // あんどん
  andon: (c) => `<rect x="30" y="18" width="40" height="64" rx="3" fill="#fff8e0" ${fSt("#c9a26b")}/><g stroke="${c.a}" stroke-width="3"><line x1="30" y1="40" x2="70" y2="40"/><line x1="30" y1="62" x2="70" y2="62"/><line x1="50" y1="18" x2="50" y2="82"/></g>
    <rect x="26" y="82" width="48" height="8" fill="${c.a}"/><rect x="30" y="90" width="6" height="6" fill="${c.a}"/><rect x="64" y="90" width="6" height="6" fill="${c.a}"/><rect x="36" y="22" width="28" height="56" fill="#ffd27a" opacity=".45"/>`,
  // ざぶとん
  zabuton: (c) => `<path d="M14 80 Q50 68 86 80 Q92 88 86 94 Q50 100 14 94 Q8 88 14 80Z" fill="${c.b}" ${fSt(c.b)}/><circle cx="50" cy="84" r="3" fill="${fDk(c.b, -0.4)}"/>`,
  // びょうぶ
  byobu: (c) => `${[0, 1, 2, 3].map((i) => `<path d="M${14 + i * 44} ${i % 2 ? 20 : 12} L${58 + i * 44} ${i % 2 ? 12 : 20} L${58 + i * 44} ${i % 2 ? 92 : 96} L${14 + i * 44} ${i % 2 ? 96 : 92}Z" fill="${c.b}" ${fSt(c.a)}/>`).join("")}
    <path d="M30 70 Q60 40 90 62 Q120 80 160 50" fill="none" stroke="${c.d}" stroke-width="5" opacity=".8"/><circle cx="150" cy="38" r="9" fill="${c.d}"/>`,
  // たんす
  tansu: (c) => `<rect x="12" y="14" width="76" height="80" rx="4" fill="${c.a}" ${fSt(c.a)}/>${[18, 38, 58, 76].map((y) => `<rect x="18" y="${y}" width="64" height="${y === 76 ? 13 : 16}" rx="2" fill="${fDk(c.a, 0.12)}"/><rect x="44" y="${y + 6}" width="12" height="3" rx="1.5" fill="${c.b || "#c9a26b"}"/>`).join("")}`,
  // ソファ（2マス）
  sofa: (c) => `<rect x="14" y="30" width="172" height="36" rx="14" fill="${c.a}" ${fSt(c.a)}/><rect x="6" y="48" width="30" height="40" rx="12" fill="${c.a}" ${fSt(c.a)}/><rect x="164" y="48" width="30" height="40" rx="12" fill="${c.a}" ${fSt(c.a)}/>
    <rect x="30" y="58" width="68" height="26" rx="8" fill="${c.b || fDk(c.a, 0.15)}" ${fSt(c.a)}/><rect x="102" y="58" width="68" height="26" rx="8" fill="${c.b || fDk(c.a, 0.15)}" ${fSt(c.a)}/>
    <rect x="22" y="86" width="8" height="10" fill="${fDk(c.a, -0.4)}"/><rect x="170" y="86" width="8" height="10" fill="${fDk(c.a, -0.4)}"/>${c.g ? `<path d="M40 40 H160" stroke="${c.g}" stroke-width="3" stroke-dasharray="2 8"/>` : ""}`,
};
function furnArtSVG(f) {
  const w = f.w || 1;
  return `<svg class="fart" viewBox="0 -8 ${w * 100} 108" preserveAspectRatio="xMidYMax meet">${FART[f.art](f.c)}</svg>`;
}

// ---------- 国を すすめると ふえる かぐ ----------
// u：［国, 章の わりあい］その国の 章を この わりあい クリアすると ショップに ならぶ
// k：しゅるい、shine：きらきら ひかる、c：いろ
const FURN_MORE = [
  // 漢字の国（わふう）
  { id: "g_k01", name: "あいいろの ふとん", art: "futon", w: 2, k: "sleep", c: { b: "#3f5fa8", d: "#fff" }, u: ["kanji", 0.08], price: 300, kira: 5 },
  { id: "g_k02", name: "ざぶとん", art: "zabuton", k: "sit", c: { b: "#b23a48" }, u: ["kanji", 0.12], price: 160, kira: 3, max: 4 },
  { id: "g_k03", name: "ちゃぶだい", art: "chabudai", k: "table", c: { a: "#9a6a3c" }, u: ["kanji", 0.2], price: 360, kira: 5 },
  { id: "g_k04", name: "ざいす", art: "zaisu", k: "sit", c: { a: "#7a4e2d", b: "#d9534f" }, u: ["kanji", 0.3], price: 320, kira: 5, max: 2 },
  { id: "g_k05", name: "あんどん", art: "andon", k: "light", c: { a: "#5b3a1e" }, u: ["kanji", 0.4], price: 480, kira: 7, glow: "255,190,110" },
  { id: "g_k06", name: "さくらの ふとん", art: "futon", w: 2, k: "sleep", c: { b: "#ffb7cf", d: "#fff", p: "#fff0f5" }, u: ["kanji", 0.5], price: 620, kira: 8, mat: { moji: 4 } },
  { id: "g_k07", name: "こたつ", art: "kotatsu", k: "table", c: { a: "#8b5a2b", b: "#e2725b", d: "#ffd6a5" }, u: ["kanji", 0.6], price: 700, kira: 9, mat: { moji: 5 } },
  { id: "g_k08", name: "わだんす", art: "tansu", k: "store", c: { a: "#7a4b2a", b: "#d4af37" }, u: ["kanji", 0.75], price: 900, kira: 10, mat: { moji: 6 } },
  { id: "g_k09", name: "きんの びょうぶ", art: "byobu", w: 2, k: "deco", c: { a: "#7a5a1e", b: "#f4d36b", d: "#d9534f" }, u: ["kanji", 0.9], price: 1600, kira: 16, mat: { moji: 8, kinsumi: 1 }, shine: 1 },
  // ことばの国（しょさい・ふわふわ）
  { id: "g_t01", name: "そらいろの ベッド", art: "bed", w: 2, k: "sleep", c: { a: "#8fc1e3", b: "#4a90d9", p: "#fff" }, u: ["kotoba", 0.08], price: 340, kira: 5 },
  { id: "g_t02", name: "もくせいの つくえ", art: "desk", k: "table", c: { a: "#b07d4f" }, u: ["kotoba", 0.15], price: 300, kira: 5 },
  { id: "g_t03", name: "ゆりいす", art: "rocking", k: "sit", c: { a: "#8b5a2b", b: "#e8a87c" }, u: ["kotoba", 0.25], price: 380, kira: 6 },
  { id: "g_t04", name: "スタンドライト", art: "floorlamp", k: "light", c: { a: "#6b5b4b", b: "#ffe08a" }, u: ["kotoba", 0.35], price: 420, kira: 6, glow: "255,225,150" },
  { id: "g_t05", name: "ピンクの ビーズクッション", art: "beanbag", k: "sit", c: { b: "#ff8fb8" }, u: ["kotoba", 0.45], price: 450, kira: 6, max: 2 },
  { id: "g_t06", name: "むらさきの ソファ", art: "sofa", w: 2, k: "sit", c: { a: "#7b5ea7", b: "#9a7fc4" }, u: ["kotoba", 0.6], price: 760, kira: 9, mat: { koto: 5 } },
  { id: "g_t07", name: "おひめさまの てんがいベッド", art: "canopy", w: 2, k: "sleep", c: { a: "#fff0f6", b: "#ff9ec4", p: "#fff", d: "#ffc6dc", g: "#ffd23f" }, u: ["kotoba", 0.8], price: 1500, kira: 15, mat: { koto: 8, kotohana: 1 }, shine: 1 },
  { id: "g_t08", name: "まるい ティーテーブル", art: "table", k: "table", c: { a: "#f5e6d3", b: "#ff9ec4" }, u: ["kotoba", 0.7], price: 640, kira: 8 },
  // 算数の国（カラフル・かたち）
  { id: "g_m01", name: "きいろの まるいす", art: "stool", k: "sit", c: { a: "#888", b: "#ffd23f" }, u: ["math", 0.08], price: 200, kira: 4, max: 3 },
  { id: "g_m02", name: "ミントの ベッド", art: "bed", w: 2, k: "sleep", c: { a: "#e8f8f2", b: "#5fd3a8", p: "#fff" }, u: ["math", 0.15], price: 360, kira: 5 },
  { id: "g_m03", name: "キューブチェア", art: "cube", k: "sit", c: { a: "#ffd23f", b: "#4aa8ff", d: "#ff6b6b" }, u: ["math", 0.25], price: 400, kira: 6, max: 2 },
  { id: "g_m04", name: "オレンジの ソファ", art: "sofa", w: 2, k: "sit", c: { a: "#ff9f43", b: "#ffbe76" }, u: ["math", 0.35], price: 520, kira: 7 },
  { id: "g_m05", name: "みずたまの テーブル", art: "table", k: "table", c: { a: "#ffffff", b: "#4aa8ff" }, u: ["math", 0.45], price: 480, kira: 6 },
  { id: "g_m06", name: "にじいろ ビーズクッション", art: "beanbag", k: "sit", c: { b: "#b388ff" }, u: ["math", 0.55], price: 600, kira: 8, rainbow: 1 },
  { id: "g_m07", name: "カラフル 2だんベッド", art: "bunk", w: 2, k: "sleep", c: { a: "#4aa8ff", b: "#ffd23f", p: "#ff6b6b" }, u: ["math", 0.7], price: 980, kira: 11, mat: { suuji: 6 } },
  { id: "g_m08", name: "にじいろの キューブ", art: "cube", k: "sit", c: { a: "#fff", b: "#c77dff", d: "#5fd3a8" }, u: ["math", 0.9], price: 1400, kira: 14, mat: { suuji: 8, haguruma: 1 }, rainbow: 1, shine: 1 },
  // 理科の国（キャンプ・みらい）
  { id: "g_s01", name: "オレンジの ねぶくろ", art: "sleepbag", w: 2, k: "sleep", c: { b: "#ff8c42", d: "#fff" }, u: ["sci", 0.08], price: 280, kira: 4 },
  { id: "g_s02", name: "メタルの まるいす", art: "stool", k: "sit", c: { a: "#7d8a96", b: "#c0ccd6" }, u: ["sci", 0.15], price: 240, kira: 4, max: 3 },
  { id: "g_s03", name: "ハンモック", art: "hammock", w: 2, k: "sleep", c: { a: "#8b5a2b", b: "#5fbf77", d: "#fff" }, u: ["sci", 0.25], price: 460, kira: 7 },
  { id: "g_s04", name: "しろい じっけんづくえ", art: "desk", k: "table", c: { a: "#eef3f6", b: "#cfdbe3" }, u: ["sci", 0.35], price: 440, kira: 6 },
  { id: "g_s05", name: "ネオンライト", art: "floorlamp", k: "light", c: { a: "#444", b: "#6ff0ff" }, u: ["sci", 0.45], price: 560, kira: 8, glow: "110,240,255", shine: 1 },
  { id: "g_s06", name: "ぎんいろの いす", art: "chair", k: "sit", c: { a: "#9aa7b3", b: "#d7e0e8" }, u: ["sci", 0.55], price: 500, kira: 7, max: 2 },
  { id: "g_s07", name: "うちゅうの ねぶくろ", art: "sleepbag", w: 2, k: "sleep", c: { b: "#2b2f77", d: "#ffe066", star: 1 }, u: ["sci", 0.7], price: 900, kira: 11, mat: { kagaku: 6 } },
  { id: "g_s08", name: "みらいの カプセルベッド", art: "bed", w: 2, k: "sleep", c: { a: "#d6f6ff", b: "#3ad1e8", p: "#fff" }, u: ["sci", 0.9], price: 1500, kira: 15, mat: { kagaku: 8, flask: 1 }, shine: 1, glow: "120,230,255" },
  // 社会の国（おしろ・ゴージャス）
  { id: "g_h01", name: "あかい いす", art: "chair", k: "sit", c: { a: "#8b4a2b", b: "#c0392b" }, u: ["soc", 0.08], price: 240, kira: 4, max: 3 },
  { id: "g_h02", name: "だいりせきの テーブル", art: "table", k: "table", c: { a: "#f2f0ea", b: "#c9c3b5" }, u: ["soc", 0.15], price: 380, kira: 6 },
  { id: "g_h03", name: "おしろの ランプ", art: "floorlamp", k: "light", c: { a: "#b8860b", b: "#fff1b8" }, u: ["soc", 0.25], price: 460, kira: 7, glow: "255,215,120" },
  { id: "g_h04", name: "あかい ビロードの ソファ", art: "sofa", w: 2, k: "sit", c: { a: "#a8323e", b: "#c94450", g: "#ffd23f" }, u: ["soc", 0.4], price: 820, kira: 10, mat: { rekishi: 5 } },
  { id: "g_h05", name: "きんの ベッド", art: "bed", w: 2, k: "sleep", c: { a: "#e0b03a", b: "#c0392b", p: "#fff6d5" }, u: ["soc", 0.55], price: 1000, kira: 11, mat: { rekishi: 6 }, shine: 1 },
  { id: "g_h06", name: "きんの いす", art: "chair", k: "sit", c: { a: "#d4a017", b: "#ffd86b" }, u: ["soc", 0.65], price: 900, kira: 10, shine: 1 },
  { id: "g_h07", name: "おうさまの いす", art: "throne", k: "sit", c: { a: "#d4a017", b: "#b0203a" }, u: ["soc", 0.8], price: 1600, kira: 16, mat: { rekishi: 8, magatama: 1 }, shine: 1 },
  { id: "g_h08", name: "おうさまの てんがいベッド", art: "canopy", w: 2, k: "sleep", c: { a: "#d4a017", b: "#7b1fa2", p: "#fff6d5", d: "#b0203a", g: "#ffd23f" }, u: ["soc", 0.95], price: 2000, kira: 20, mat: { rekishi: 10, kinin: 1 }, shine: 1 },
];
FURN_MORE.forEach((f) => { f.set = "more"; f.em = ""; f.max = f.max || 1; FURN.push(f); });

// その国の 章を クリアした かず・ぜんぶの かず
const worldDone = (w) => { const l = worldChapters(w).filter((c) => !c.write && !c.maou); return [l.filter(chapterDone).length, l.length]; };
// ならぶのに ひつような 章の かず
const furnNeed = (f) => { const [, n] = worldDone(f.u[0]); return Math.max(1, Math.round(f.u[1] * n)); };
const furnOpen = (f) => !f.u || (PQ_DEBUG && window.PQ_FURNALL) || worldDone(f.u[0])[0] >= furnNeed(f);
const furnHint = (f) => { const [d] = worldDone(f.u[0]); return `${WORLDS.find((w) => w.id === f.u[0]).name}の 章を あと ${furnNeed(f) - d}こ クリアすると ならぶよ`; };
// まだ 見ていない あたらしい かぐ（ショップの NEW）
const newFurn = () => FURN.some((f) => f.u && furnOpen(f) && !fOwn(f.id) && !(S.fseen || {})[f.id]);
