// ===== ひけん（国ごとの ひみつの けん）と ひほう =====
// ・その国の てきを たおすと まれに（3%）ひけんが 手に はいる（60体 たおしても 出なければ 次は かならず）
// ・区切りの ボス（漢字の国：エリアの 最初の 章、ほかの 国：3章ごと）を はじめて たおすと ひほうが 1こ。
//   ほかの ボスは まれに（10%・15回 出なければ 次は かならず）
// ・ひけん ＋ ひほう 1こ → しんか1、＋3こ → しんか2、＋5こ → しんか3
// ・5つの 国の しんか3 と にじの せいけんが そろうと さいごの けん「ほしくだき」が うまれる（にじの せいけんは なくなる）
// ・5年生・6年生の ボス（国の 後ろの ほうの 章）は ひけんで ないと バリアで ダメージが 半分
"use strict";

// 国ごとの ひけん［しんか0〜3の 名前］、こうげきの 属性、とっこうの 属性、色
const HIKEN = [
  { w: "kanji", el: "fire", tok: "thunder", color: "#ff7043", hk: "hk_kanji",
    names: ["すみの ひけん", "ほむらの すみけん", "りゅうもじ ほむら丸", "でんせつの もじけん ほむらりゅう"] },
  { w: "kotoba", el: "water", tok: "leaf", color: "#4aa8ff", hk: "hk_kotoba",
    names: ["ことだまの ひけん", "しずくの ことのは剣", "こだま みなも丸", "でんせつの ことのは剣 あおなみ"] },
  { w: "math", el: "thunder", tok: "fire", color: "#ffc400", hk: "hk_math",
    names: ["すうじの ひけん", "いなずまの じょうぎ剣", "むげん いかずち丸", "でんせつの かず剣 らいめい"] },
  { w: "sci", el: "leaf", tok: "water", color: "#4cc46a", hk: "hk_sci",
    names: ["かがくの ひけん", "みどりの フラスコ剣", "せいめい ガイア丸", "でんせつの かがく剣 ガイアノヴァ"] },
  { w: "soc", el: "none", tok: "fire", color: "#b9a2ff", hk: "hk_soc",
    names: ["れきしの ひけん", "むしゃの ひけん", "てんかむそう 丸", "でんせつの れきし剣 てんかいっとう"] },
];
const HIKEN_ATK = [30, 48, 62, 76];
const HIKEN_ATK_SOC = [36, 58, 74, 90]; // 社会の国は 属性なし（弱点を つけない）なので 高め
const HIKEN_NEED = [0, 1, 3, 5]; // しんかに ひつような ひほうの 数（しんか1・2・3）
const HIKEN_FINAL = "wh_final";
const hikenId = (w, lv) => `wh_${w}${lv}`;
const hikenOf = (w) => HIKEN.find((h) => h.w === w);

// ひほう（そざいとして もつ）
Object.assign(MATS, {
  hk_kanji: { name: "まぼろしの もじ札", em: "🎴", rare: 4, hihou: "kanji" },
  hk_kotoba: { name: "ことだまの すず", em: "🔔", rare: 4, hihou: "kotoba" },
  hk_math: { name: "むげんの サイコロ", em: "🎲", rare: 4, hihou: "math" },
  hk_sci: { name: "いのちの らせん", em: "🧬", rare: 4, hihou: "sci" },
  hk_soc: { name: "おうじゃの かんむり", em: "👑", rare: 4, hihou: "soc" },
});

// ひけんの そうび（ショップには ならばない）
HIKEN.forEach((h) => h.names.forEach((name, lv) => ITEMS.push({
  id: hikenId(h.w, lv), type: "weapon", name, atk: (h.w === "soc" ? HIKEN_ATK_SOC : HIKEN_ATK)[lv], el: h.el, price: 0, drop: "hiken", look: "hiken",
  hc: h.color, lv, series: h.w, hiken: h.w, sp: { world: h.w, tok: h.tok },
})));
ITEMS.push({ id: HIKEN_FINAL, type: "weapon", name: "さいごの けん ほしくだき", atk: 95, el: "star", price: 0, drop: "hiken", look: "hikenfinal",
  lv: 4, hiken: "all", sp: { world: "all", maou: 2 } });

// ---------- 5年生・6年生の 強い てき ----------
// 漢字の国は 5年生・6年生の エリア、ほかの 国は 後ろの ほうの 章（ティア5・6）
function chHard(ch) {
  if (!ch || ch.write || ch.maou) return 0;
  if (ch.w === "kanji") { const g = Number(String(ch.sec || "").slice(1)); return g >= 5 ? g : 0; }
  return ch.tier >= 5 ? ch.tier : 0;
}
// 同じ 強さの 章の 中で 何番目か（0〜1）… あとの 章ほど 少し 強い
function hardPos(ch) {
  const gl = chHard(ch);
  const grp = CHAPTERS.filter((c) => c.w === ch.w && chHard(c) === gl);
  return grp.length > 1 ? grp.indexOf(ch) / (grp.length - 1) : 0;
}
// ［ふつうの てき hp・atk の はじめ→おわり、ボス hp・atk の はじめ→おわり］
const HARD = {
  5: { hp: [330, 400], atk: [39, 42], bhp: [1800, 2000], batk: [50, 52] }, // しんか1で なんとか
  6: { hp: [430, 500], atk: [44, 47], bhp: [2100, 2400], batk: [54, 56] }, // しんか2で なんとか
};
// 漢字の国の 5・6年生エリアは 章が 多いので、前半は やさしめに して だんだん 強く
const HARD_KANJI = {
  5: { hp: [260, 400], atk: [34, 42], bhp: [1100, 2000], batk: [44, 52] },
  6: { hp: [380, 500], atk: [40, 47], bhp: [1700, 2400], batk: [50, 56] },
};
function hardStats(ch, boss) {
  const gl = chHard(ch);
  if (!gl) return null;
  const H = (ch.w === "kanji" ? HARD_KANJI : HARD)[gl], p = hardPos(ch), L = (a) => Math.round(a[0] + (a[1] - a[0]) * p);
  return boss ? { hp: L(H.bhp), atk: L(H.batk) } : { hp: L(H.hp), atk: L(H.atk) };
}

// ---------- ひけん・ひほうを 手に いれる ----------
const hasHiken = (w) => [0, 1, 2, 3].some((lv) => S.owned.includes(hikenId(w, lv)));
const hikenLv = (w) => [3, 2, 1, 0].find((lv) => S.owned.includes(hikenId(w, lv)));
// てきを たおしたとき（ふつうの 章・かきとり道場）
function hikenDrop(e) {
  const ch = B.st.ch, h = ch && hikenOf(ch.w);
  if (!h || ch.maou) return null;
  const got = {};
  // ひみつの けん（3%。その国で 60体 たおしても 出なければ 次は かならず）
  if (!hasHiken(h.w) && !S.owned.includes(HIKEN_FINAL)) {
    S.hs = S.hs || {};
    S.hs[h.w] = (S.hs[h.w] || 0) + 1;
    if (S.hs[h.w] > 60 || Math.random() < 0.03) { S.owned.push(hikenId(h.w, 0)); got.sword = hikenId(h.w, 0); }
  }
  // ひほう（ボス）
  if (e.boss) {
    S.hk = S.hk || {};
    const r = S.hk[h.w] || (S.hk[h.w] = { first: 0, miss: 0 });
    let give = false;
    // 区切りの ボスを はじめて たおすと かならず（漢字の国：エリアの 最初の 章、ほかの 国：3章ごと）
    const mile = !stStars(B.sid) && !ch.write && (ch.w === "kanji" ? ch.no === 1 : ch.idx % 3 === 0);
    if (mile || !r.first) { r.first = 1; give = true; }
    else if (r.miss >= 15 || Math.random() < 0.1) { r.miss = 0; give = true; }
    else r.miss++;
    if (give) { addMat(h.hk); got.hihou = h.hk; }
  }
  return got.sword || got.hihou ? got : null;
}

// ---------- しんか ----------
function hikenCanEvolve(w) {
  const lv = hikenLv(w);
  if (lv === undefined || lv >= 3) return false;
  return (S.mats[hikenOf(w).hk] || 0) >= HIKEN_NEED[lv + 1];
}
const allLv3 = () => HIKEN.every((h) => S.owned.includes(hikenId(h.w, 3)));
// さいごの けん：5つの 国の しんか3 ＋ にじの せいけん（にじの せいけんは ざいりょうとして つかう）
const finalReady = () => allLv3() && S.owned.includes("w_niji") && !S.owned.includes(HIKEN_FINAL);
function hikenEvolve(w) {
  if (!hikenCanEvolve(w)) return;
  const h = hikenOf(w), lv = hikenLv(w), from = hikenId(w, lv), to = hikenId(w, lv + 1);
  S.mats[h.hk] -= HIKEN_NEED[lv + 1];
  S.owned = S.owned.filter((x) => x !== from);
  S.owned.push(to);
  if (S.eq.weapon === from) S.eq.weapon = to;
  save();
  hikenShow(from, to);
}
function hikenFinal() {
  if (!finalReady()) return;
  S.owned = S.owned.filter((x) => x !== "w_niji");
  S.owned.push(HIKEN_FINAL); S.eq.weapon = HIKEN_FINAL; save();
  hikenShow(null, HIKEN_FINAL);
}
function hikenShow(from, to) {
  const a = from && itemById(from), b = itemById(to);
  snd("special");
  equip();
  modal(`<div class="mtitle">✨ しんか！ ✨</div>
    ${a ? `<p class="small">${a.name}<br>⬇</p>` : `<p class="small">5つの 国の でんせつの けんと にじの せいけんが ひとつに なった！</p>`}
    <div class="hero sm">${charSVG({ ...S.eq, weapon: to }, S.color, "bounce")}</div>
    <p><b style="font-size:1.25em">${b.name}</b><br>⚔️${b.atk}　<small class="spt">${spText(b.sp)}</small></p>
    <button class="big-btn primary" onclick="closeModal()">やったー！</button>`);
}

// そうびの 画面（ぶき）に 出す ひけんの しんか パネル
function hikenPanel() {
  const rows = HIKEN.map((h) => {
    const W = WORLDS.find((x) => x.id === h.w), M = MATS[h.hk], have = (S.mats || {})[h.hk] || 0, lv = hikenLv(h.w);
    if (lv === undefined) {
      // けんは まだ。ひほうを もっていれば ヒントだけ
      return have || matSeen(h.hk) ? `<div class="hk lock"><b>${W.icon} ？？？</b><small>${W.name}の どこかに ひみつの けんが ねむっている…</small><span class="hkm">${M.em}×${have}</span></div>` : "";
    }
    const it = itemById(hikenId(h.w, lv));
    if (lv >= 3) return `<div class="hk max"><b>${W.icon} ${it.name}</b><small>さいごまで しんかした！</small></div>`;
    const need = HIKEN_NEED[lv + 1], ok = have >= need;
    return `<div class="hk"><b>${W.icon} ${it.name}<small>（しんか${lv}）</small></b><small>つぎの しんかに ${M.em}${M.name} が ${need}こ いるよ</small>
      <span class="hkm ${ok ? "" : "lack"}">${M.em}${have}/${need}</span><button class="sbtn ${ok ? "" : "no"}" ${ok ? `onclick="hikenEvolve('${h.w}')"` : "disabled"}>✨しんか</button></div>`;
  }).join("");
  const fin = S.owned.includes(HIKEN_FINAL) ? "" : finalReady()
    ? `<div class="hk final"><b>🌈 5つの でんせつの けんと にじの せいけんが そろった！</b><small>にじの せいけんを つかって しんかするよ</small><button class="sbtn" onclick="hikenFinal()">✨しんか</button></div>`
    : allLv3() ? `<div class="hk lock"><b>🌈 ？？？</b><small>5つの でんせつの けんが そろった！ あとは「にじの せいけん」が あれば…？</small></div>`
    : HIKEN.some((h) => S.owned.includes(hikenId(h.w, 3))) ? `<div class="hk lock"><b>🌈 ？？？</b><small>5つの 国の でんせつの けんを そろえると…？</small></div>` : "";
  return rows || fin ? `<div class="hkpanel"><div class="hkttl">🗡️ ひけん</div>${rows}${fin}</div>` : "";
}

// ひけんの 見た目（国の 色・しんかで かざりが ふえる）
function hikenSVG(w) {
  const g = (body) => `<g transform="translate(164 122) rotate(20)">${body}</g>`;
  if (w.look === "hikenfinal") {
    const cs = ["#ff5252", "#ffab40", "#ffee58", "#69f0ae", "#40c4ff", "#b388ff"];
    return g(`<circle cx="0" cy="-64" r="44" fill="#fff6c2" opacity=".45"/><path d="M-30 -40 Q-52 -70 -40 -96 Q-30 -76 -14 -70Z M30 -40 Q52 -70 40 -96 Q30 -76 14 -70Z" fill="#fff" stroke="#b388ff" stroke-width="2"/>
      <rect x="-4" y="-6" width="8" height="24" rx="3" fill="#4527a0"/><path d="M-20 -12 Q0 0 20 -12 L18 -3 Q0 6 -18 -3Z" fill="#ffd23f" stroke="#c99a00" stroke-width="1.5"/>
      ${cs.map((c, i) => `<path d="M${-10 + i * 3.4} -12 L${-10 + i * 3.4} -100 L${-6.6 + i * 3.4} -106 L${-6.6 + i * 3.4} -12Z" fill="${c}"/>`).join("")}
      <path d="M0 -132 l7 14 16 2 -12 11 3 16 -14 -8 -14 8 3 -16 -12 -11 16 -2Z" fill="#ffe066" stroke="#e0a800" stroke-width="2"/>${spark(-26, -110, 6, "#fff")}${spark(28, -86, 5, "#ffe066")}${spark(-30, -60, 4, "#b3e5fc")}`);
  }
  const c = w.hc, lv = w.lv || 0, d = shade(c, -0.3), len = 84 + lv * 6;
  const aura = lv >= 1 ? `<circle cx="0" cy="-60" r="${26 + lv * 6}" fill="${c}" opacity="${0.15 + lv * 0.06}"/>` : "";
  const wing = lv >= 3 ? `<path d="M-14 -16 Q-46 -30 -42 -64 Q-30 -40 -12 -34Z M14 -16 Q46 -30 42 -64 Q30 -40 12 -34Z" fill="#fff" stroke="${c}" stroke-width="2"/>` : "";
  const gem = `<circle cx="0" cy="-7" r="${4 + lv}" fill="${c}" stroke="#fff" stroke-width="1.5"/>`;
  const sp = lv >= 2 ? `${spark(-18, -len + 6, 5 + lv, "#fff")}${spark(16, -len / 2, 4 + lv, "#ffe066")}` : "";
  return g(`${aura}${wing}<rect x="-4" y="-4" width="8" height="24" rx="3" fill="#3e2723"/><path d="M-18 -12 Q0 -2 18 -12 L16 -4 Q0 4 -16 -4Z" fill="${lv >= 2 ? "#ffd23f" : "#b0bec5"}" stroke="${d}" stroke-width="1.5"/>${gem}
    <path d="M-8 -12 L-8 -${len} L0 -${len + 14} L8 -${len} L8 -12Z" fill="#f5f5f5" stroke="${d}" stroke-width="2"/><path d="M0 -16 L0 -${len + 4}" stroke="${c}" stroke-width="${2 + lv}"/>${sp}`);
}
