// ===== ぶきを えらびやすく する =====
// たたかいの 中：「いちばん きく ぶきに する」ボタン・おすすめ 3本・お気に入り（⭐）・ほかの ぶき（しぼりこみ・ならべかえ）
// そうび画面：⭐の 登録・ぞくせいで しぼりこみ・ならべかえ
"use strict";

const WFAV_MAX = 6; // お気に入りに できる 数
const wFavs = () => (S.wfav = (S.wfav || []).filter((id) => S.owned.includes(id)));
const isFav = (id) => wFavs().includes(id);
const ownedWeapons = () => ITEMS.filter((x) => x.type === "weapon" && S.owned.includes(x.id));
// 手に いれた じゅん（S.owned の ならび）
const ownIdx = (id) => S.owned.indexOf(id);

// いまの てきへの ダメージの めやす（こうげきの 計算と おなじ 考え方。かいしん・ついげき などは 平均で）
function wScore(w) {
  const sp = w.sp || {}, e = B.e, ch = B.st && B.st.ch;
  let d = (5 + w.atk) * wEff(w) * (sp.hit || 1) * (1 + (sp.crit || 0));
  if (sp.boss && e.boss) d *= sp.boss;
  if (sp.world && ch && !ch.maou && (sp.world === "all" || sp.world === ch.w)) d *= 1.5;
  if (sp.tok && e.el === sp.tok) d *= 1.5;
  if (sp.maou && ch && ch.maou) d *= sp.maou;
  d *= wBar(w);
  if (sp.extra) d *= 1 + sp.extra * 0.5;
  if (sp.multi) d *= 1 + sp.multi;
  return Math.round(d);
}

// ---------- たたかいの 中 ----------
let WP = { more: false, el: "all", sort: "eff" };
function swapWeapon() {
  if (B.busy) return;
  snd("tap");
  WP = { more: false, el: "all", sort: "eff" };
  const e = B.e, ws = ownedWeapons().map((w) => ({ w, s: wScore(w) })).sort((a, b) => b.s - a.s || b.w.atk - a.w.atk);
  const best = ws[0], cur = ws.find((x) => x.w.id === S.eq.weapon);
  const top = ws.slice(0, 3), topIds = top.map((x) => x.w.id);
  const favs = ws.filter((x) => isFav(x.w.id) && !topIds.includes(x.w.id));
  const bestBtn = best && cur && best.s > cur.s
    ? `<button class="big-btn primary wbest" onclick="setWeapon('${best.w.id}')">⚡ いちばん きく ぶきに する<small>${ELEMENTS[best.w.el].icon} ${esc(best.w.name)}（めやす ⚔️${best.s}）</small></button>`
    : `<p class="wbestok">👍 いまの ぶきが いちばん きくよ！</p>`;
  modal(`<div class="mtitle">ぶきを かえる</div><p class="small">${esc(e.name)}の ぞくせい：<b>${ELEMENTS[e.el].icon} ${ELEMENTS[e.el].name}</b></p>
    ${bestBtn}
    <div class="wsub">🌟 おすすめ</div><div class="wlist">${top.map((x) => wItemHTML(x.w, x.s)).join("")}</div>
    ${favs.length ? `<div class="wsub">⭐ お気に入り</div><div class="wlist">${favs.map((x) => wItemHTML(x.w, x.s)).join("")}</div>` : ""}
    ${ws.length > 3 ? `<button class="wmore" id="wmore" onclick="wpMore()">ほかの ぶきを 見る ▼ <small>（ぜんぶで ${ws.length}本）</small></button><div id="wrest"></div>` : ""}
    <button class="big-btn" onclick="closeModal()">とじる</button>`, "tmodal");
}
// ぶき 1本の ボタン（たたかいの 中）
function wItemHTML(w, s) {
  const x = wEff(w), bf = wBar(w), m = x * bf, ch = B.st && B.st.ch;
  const here = w.sp && w.sp.world && ch && !ch.maou && (w.sp.world === "all" || w.sp.world === ch.w);
  return `<button class="witem ${S.eq.weapon === w.id ? "sel" : ""} ${m >= 2 ? "good" : m < 1 ? "bad" : ""}" onclick="setWeapon('${w.id}')">
    <span class="wel">${ELEMENTS[w.el].icon}</span><b>${isFav(w.id) ? "⭐" : ""}${esc(w.name)}</b><small>めやす ⚔️${s}</small><span class="effs"><i class="eff">${EFFECT_MARK(x)} ${EFFECT_LABEL(x)}</i>${bf < 1 ? `<i class="eff bar">🛡️ ${bf === 0.5 ? "はんぶん" : "3/4"}</i>` : ""}${here ? `<i class="eff tok">🗡️この国で つよい</i>` : ""}</span></button>`;
}
// ほかの ぶき（ぞくせいで しぼる・ならべかえ）
function wpMore(key, val) {
  if (key) WP[key] = val; else WP.more = !WP.more;
  snd("tap");
  const box = $("wrest"), btn = $("wmore");
  if (!box) return;
  btn.innerHTML = `${WP.more ? "ほかの ぶきを とじる ▲" : "ほかの ぶきを 見る ▼"} <small>（ぜんぶで ${ownedWeapons().length}本）</small>`;
  if (!WP.more) { box.innerHTML = ""; return; }
  let ws = ownedWeapons().map((w) => ({ w, s: wScore(w) }));
  const els = [...new Set(ws.map((x) => x.w.el))];
  if (WP.el === "fav") ws = ws.filter((x) => isFav(x.w.id));
  else if (WP.el !== "all") ws = ws.filter((x) => x.w.el === WP.el);
  const sorts = { eff: (a, b) => b.s - a.s, atk: (a, b) => b.w.atk - a.w.atk, new: (a, b) => ownIdx(b.w.id) - ownIdx(a.w.id) };
  ws.sort(sorts[WP.sort] || sorts.eff);
  const good = (el) => effect(el, B.e.el, B.e.imm) >= 2;
  box.innerHTML = `<div class="fcats wcats"><button class="${WP.el === "all" ? "on" : ""}" onclick="wpMore('el','all')">すべて</button>${wFavs().length ? `<button class="${WP.el === "fav" ? "on" : ""}" onclick="wpMore('el','fav')">⭐</button>` : ""}${els.map((el) => `<button class="${WP.el === el ? "on" : ""} ${good(el) ? "goodel" : ""}" onclick="wpMore('el','${el}')">${el === "none" ? "なし" : ELEMENTS[el].icon}${good(el) ? "◎" : ""}</button>`).join("")}</div>
    <div class="fcats wsorts"><span>ならべかた</span>${[["eff", "きく順"], ["atk", "つよい順"], ["new", "あたらしい順"]].map(([k, l]) => `<button class="${WP.sort === k ? "on" : ""}" onclick="wpMore('sort','${k}')">${l}</button>`).join("")}</div>
    <div class="wlist">${ws.length ? ws.map((x) => wItemHTML(x.w, x.s)).join("") : `<p class="small">この ぞくせいの ぶきは もっていないよ</p>`}</div>`;
}

// ---------- そうび画面の ぶき ----------
let WE = { el: "all", sort: "atk" };
function weaponEquipList() {
  let its = ownedWeapons();
  const els = [...new Set(its.map((w) => w.el))];
  if (WE.el === "fav") its = its.filter((w) => isFav(w.id));
  else if (WE.el !== "all") its = its.filter((w) => w.el === WE.el);
  const order = ["fire", "water", "thunder", "leaf", "star", "none"];
  const sorts = { atk: (a, b) => b.atk - a.atk, new: (a, b) => ownIdx(b.id) - ownIdx(a.id), el: (a, b) => order.indexOf(a.el) - order.indexOf(b.el) || b.atk - a.atk };
  its.sort(sorts[WE.sort] || sorts.atk);
  const nf = wFavs().length;
  return `<div class="esec">
    <div class="fcats wcats"><button class="${WE.el === "all" ? "on" : ""}" onclick="weSet('el','all')">すべて<i>${ownedWeapons().length}</i></button><button class="${WE.el === "fav" ? "on" : ""}" onclick="weSet('el','fav')">⭐<i>${nf}</i></button>${els.map((el) => `<button class="${WE.el === el ? "on" : ""}" onclick="weSet('el','${el}')">${el === "none" ? "なし" : ELEMENTS[el].icon}</button>`).join("")}</div>
    <div class="fcats wsorts"><span>ならべかた</span>${[["atk", "つよい順"], ["new", "あたらしい順"], ["el", "ぞくせい順"]].map(([k, l]) => `<button class="${WE.sort === k ? "on" : ""}" onclick="weSet('sort','${k}')">${l}</button>`).join("")}</div>
    <p class="small wfavnote">☆を おすと お気に入り（⭐）に なるよ。たたかいの 中で ぶきを かえる ときに 上に 出るよ（${WFAV_MAX}本まで）</p>
    <div class="elist">${its.length ? its.map((it) => `<div class="ewrap"><button class="eitem ${S.eq.weapon === it.id ? "sel" : ""}" onclick="doEquip('weapon','${it.id}')">
      <b>${it.series ? WORLDS.find((w) => w.id === it.series).icon : ""}${it.name}${funTag(it)}</b><small>⚔️${it.atk} ${ELEMENTS[it.el].icon}</small>${it.sp ? `<span class="spt">${spText(it.sp)}</span>` : ""}</button>
      <button class="wfav ${isFav(it.id) ? "on" : ""}" onclick="toggleFav('${it.id}')" aria-label="お気に入り">${isFav(it.id) ? "⭐" : "☆"}</button></div>`).join("") : `<p class="small">⭐の ぶきは まだ ないよ。☆を おして 登録しよう</p>`}</div></div>`;
}
function weSet(k, v) { const y = window.scrollY; WE[k] = v; snd("tap"); equip(); window.scrollTo(0, y); }
function toggleFav(id) {
  const y = window.scrollY, f = wFavs();
  if (f.includes(id)) S.wfav = f.filter((x) => x !== id);
  else if (f.length >= WFAV_MAX) { snd("ng"); toast(`お気に入りは ${WFAV_MAX}本まで だよ。ほかの ⭐を はずしてね`); return; }
  else S.wfav = [...f, id];
  save(); snd("tap"); equip(); window.scrollTo(0, y);
}
