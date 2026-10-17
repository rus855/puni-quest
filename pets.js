// ===== なかま（タマゴ・ふか・かけあわせ・バトルのおてつだい） =====
"use strict";

const MAX_EGGS = 4;
const BREED_COST = 100;
const BREED_LV = 3;
const MAX_PET_LV = 10;

const petSp = (id) => PETS.find((p) => p.id === id);
const partner = () => (S && S.partner ? S.pets.find((p) => p.u === S.partner) : null);
const xpNeed = (lv) => lv * 6;

// レベルでわざが強くなる（ストップ・ヒント・ゲージは回数で固定）
function petPow(pet) {
  const sp = petSp(pet.sp), k = 1 + 0.12 * (pet.lv - 1);
  switch (sp.ab) {
    case "heal": case "coin": return Math.round(sp.pow * k);
    case "attack": case "atkup": return Math.round(sp.pow * k * 100) / 100;
    case "shield": return Math.min(1, Math.round(sp.pow * (1 + 0.1 * (pet.lv - 1)) * 100) / 100);
    default: return sp.pow;
  }
}
const petDesc = (pet) => ABILITY[petSp(pet.sp).ab].desc(petPow(pet));

// ---------- タマゴの絵 ----------
function eggSVG(egg, cls = "") {
  const fusion = egg && egg.f;
  const [base, spot] = fusion ? ["#fff7fb", "#ff7eb3"] : RARITY[egg ? egg.r : 0].egg;
  const spots = fusion ? ["#ff7eb3", "#4aa8ff", "#ffc400", "#4cc46a"] : [spot, spot, spot, spot];
  return `<svg viewBox="0 0 100 120" class="egg ${cls}">
    <ellipse cx="50" cy="113" rx="30" ry="5" fill="rgba(0,0,0,.12)"/>
    <path d="M50 6 C 80 6, 92 60, 90 78 C 88 100, 70 112, 50 112 C 30 112, 12 100, 10 78 C 8 60, 20 6, 50 6Z" fill="${base}" stroke="${shade(spot, -0.2)}" stroke-width="3"/>
    <circle cx="34" cy="52" r="8" fill="${spots[0]}"/><circle cx="63" cy="34" r="6" fill="${spots[1]}"/>
    <circle cx="66" cy="78" r="10" fill="${spots[2]}"/><circle cx="36" cy="92" r="5" fill="${spots[3]}"/>
    <ellipse cx="33" cy="28" rx="7" ry="12" fill="rgba(255,255,255,.7)" transform="rotate(25 33 28)"/>
  </svg>`;
}

// ---------- タマゴを手に入れる・そだてる ----------
function giveEgg(r, sp) {
  if (S.eggs.length >= MAX_EGGS) return false;
  const rr = sp ? petSp(sp).r : r;
  S.eggs.push({ r: rr, p: 0, n: RARITY[rr].need, sp: sp || "", f: !!sp });
  return true;
}

// 敵をたおしたときのタマゴ（ステージが進むほどレアが出やすい）
function rollEgg(stageNo, boss, sure) {
  if (!sure && Math.random() > (boss ? 0.4 : 0.1)) return null;
  const x = Math.random(), sr = 0.03 * stageNo * (boss ? 2 : 1), rr = 0.12 * stageNo * (boss ? 1.5 : 1);
  const r = x < sr ? 2 : x < sr + rr ? 1 : 0;
  return giveEgg(r) ? r : "full";
}

// 正解するたびに、すべてのタマゴが育つ
function growEggs() {
  let ready = false;
  for (const e of S.eggs) {
    if (e.p < e.n) { e.p++; if (e.p >= e.n) ready = true; }
  }
  return ready;
}
const readyEggs = () => S.eggs.filter((e) => e.p >= e.n);

// ---------- タマゴがかえる ----------
function pickSpecies(egg) {
  if (egg.sp) return egg.sp;
  const cand = PETS.filter((p) => p.r === egg.r && !p.fusion);
  // まだ持っていないなかまが出やすい
  const ws = cand.map((p) => (S.petDex[p.id] ? 1 : 3));
  let x = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cand.length; i++) { x -= ws[i]; if (x <= 0) return cand[i].id; }
  return cand[cand.length - 1].id;
}

function hatchEgg(idx) {
  const egg = S.eggs[idx];
  if (!egg || egg.p < egg.n) return;
  S.eggs.splice(idx, 1);
  const spId = pickSpecies(egg), sp = petSp(spId);
  const isNew = !S.petDex[spId];
  S.petDex[spId] = 1;
  S.petUid = (S.petUid || 0) + 1;
  const pet = { u: S.petUid, sp: spId, lv: 1, xp: 0, bred: "" };
  S.pets.push(pet);
  if (!S.partner) S.partner = pet.u;
  save();
  snd("special");
  modal(`<div class="mtitle">あれれ…？ タマゴが…！</div><div class="hatchwrap">${eggSVG(egg, "shake2")}</div>`, "hatch");
  setTimeout(() => {
    snd("win");
    modal(`<div class="mtitle">${isNew ? "🎉 はじめての なかま！" : "なかまが うまれた！"}</div>
      <div class="petbig born" style="--pc:${ELEMENTS[sp.el].color}">${sp.em}</div>
      <div class="pname2">${sp.name} <small>${RARITY[sp.r].stars}</small></div>
      <p class="small">${ELEMENTS[sp.el].icon} ${ELEMENTS[sp.el].name} ／ とくいわざ「${sp.waza}」<br>${ABILITY[sp.ab].icon} ${petDesc(pet)}</p>
      ${S.partner === pet.u ? `<p class="tip">あいぼうに なったよ！ バトルで いっしょに たたかってくれる！</p>` : ""}
      <button class="big-btn primary" onclick="closeModal();home()">やったー！</button>`, "hatch");
  }, 1600);
}

// ホームにもどったとき：かえるタマゴ・はじめてのタマゴ
function petEvents() {
  if (!S.tut.egg) {
    S.tut.egg = 1;
    if (S.eggs.length < MAX_EGGS) { S.eggs.push({ r: 0, p: 0, n: 5, sp: "", f: false }); }
    save();
    modal(`<div class="mtitle">タマゴを もらったよ！</div><div class="hatchwrap">${eggSVG({ r: 0 }, "wobble")}</div>
      <p><b>問題に 正解すると タマゴが そだつよ。</b><br>かえると「なかま」に なって、バトルを てつだってくれる！</p>
      <p class="small">てきを たおすと ときどき タマゴが 手に はいるよ。</p>
      <button class="big-btn primary" onclick="closeModal()">そだてる！</button>`);
    return true;
  }
  const i = S.eggs.findIndex((e) => e.p >= e.n);
  if (i >= 0) { hatchEgg(i); return true; }
  return false;
}

// ---------- なかまのレベルアップ ----------
function petGainXp(n = 1) {
  const pet = partner();
  if (!pet || pet.lv >= MAX_PET_LV) return false;
  pet.xp += n;
  if (pet.xp >= xpNeed(pet.lv)) { pet.xp -= xpNeed(pet.lv); pet.lv++; return true; }
  return false;
}

// ---------- バトルでのおてつだい ----------
function petBattleHTML() {
  const pet = partner();
  if (!pet) return "";
  const sp = petSp(pet.sp);
  return `<div class="petb" id="petb" style="--pc:${ELEMENTS[sp.el].color}" onclick="petInfo()"><span class="pem">${sp.em}</span><span class="pch" id="pch"></span></div>`;
}
function updPet() {
  const pet = partner(), el = $("pch");
  if (!pet || !el) return;
  const cd = petSp(pet.sp).cd;
  el.innerHTML = Array.from({ length: cd }, (_, i) => `<i class="${i < B.petC ? "on" : ""}"></i>`).join("");
  $("petb").classList.toggle("ready", B.petC >= cd);
}
function petInfo() {
  const pet = partner(); if (!pet) return;
  const sp = petSp(pet.sp);
  toast(`${sp.em} ${sp.name} Lv${pet.lv}：あと ${Math.max(0, sp.cd - B.petC)}問 正解で「${sp.waza}」`);
}

// 正解したとき：わざのチャージ
function petCharge() {
  const pet = partner();
  if (!pet) return;
  B.petC = Math.min(petSp(pet.sp).cd, B.petC + 1);
  if (petGainXp()) { fxText(`${petSp(pet.sp).em} レベルアップ！ Lv${pet.lv}`, "card"); snd("coin"); }
  updPet();
}

// チャージがたまったら わざを使う
async function petAct() {
  const pet = partner();
  if (!pet) return;
  const sp = petSp(pet.sp), e = B.e;
  if (B.petC < sp.cd) return;
  B.petC = 0;
  const pw = petPow(pet);
  anim($("petb"), "petgo");
  fxText(`${sp.em} ${sp.waza}！`, "skill");
  snd("special");
  await wait(350);
  switch (sp.ab) {
    case "attack": {
      const x = effect(sp.el, e.el, e.imm);
      const d = x === 0 ? 0 : Math.max(1, Math.round(pAtk() * pw * x));
      e.hp -= d; anim($("enemy"), "hurt"); snd("hit");
      fxText(`${d}${effFx(x)}`, effCls(x));
      break;
    }
    case "heal": {
      const mx = pMaxHp(), h = Math.round(mx * pw / 100);
      B.php = Math.min(mx, B.php + h); fxText(`+${h}`, "heal"); break;
    }
    case "atkup": B.buff = 2; B.buffPow = pw; fxText("💪 パワーアップ！", "card"); break;
    case "coin": S.coins += pw; B.coins += pw; fxText(`🪙 +${pw}`, "card"); snd("coin"); break;
    case "shield": B.shield = pw; fxText("🛡️ ガード じゅんび！", "card"); break;
    case "stun": e.turn += 1; fxText("💫 てきが うごけない！", "card"); break;
    case "hint": B.hint = true; fxText("💡 つぎの 問題で ヒント！", "card"); break;
    case "gauge": B.gauge = Math.min(5, B.gauge + pw); fxText("✨ ゲージ アップ！", "card"); break;
  }
  updBars(); updPet(); save();
  await wait(600);
}

// ---------- なかまの画面 ----------
let nkTab = "pets";
let breedSel = [0, 0];
function nakama(tab) {
  if (tab) nkTab = tab;
  const tabs = [["pets", "なかま"], ["egg", "タマゴ"], ["breed", "かけあわせ"], ["dex", "ずかん"]];
  let body = "";
  if (nkTab === "pets") body = petsTab();
  else if (nkTab === "egg") body = eggTab();
  else if (nkTab === "breed") body = breedTab();
  else body = dexTab();
  setScreen(`${topBar("なかま")}
    <div class="tabs">${tabs.map(([k, l]) => `<button class="${k === nkTab ? "on" : ""}" onclick="nakama('${k}')">${l}${k === "egg" && readyEggs().length ? " 🐣" : ""}</button>`).join("")}</div>
    ${body}`, "bg-shop");
}

function petCard(pet, onclick, extra = "") {
  const sp = petSp(pet.sp);
  return `<button class="pcard ${S.partner === pet.u ? "partner" : ""}" onclick="${onclick}" style="--pc:${ELEMENTS[sp.el].color}">
    <span class="pem2">${sp.em}</span>
    <span class="pinfo"><b>${sp.name} <small>Lv${pet.lv}</small></b><small>${RARITY[sp.r].stars} ${ELEMENTS[sp.el].icon} ${ABILITY[sp.ab].icon}${ABILITY[sp.ab].name}</small>
    <span class="bar xb"><i style="width:${pet.lv >= MAX_PET_LV ? 100 : (pet.xp / xpNeed(pet.lv)) * 100}%"></i></span></span>
    ${S.partner === pet.u ? '<i class="curtag">あいぼう</i>' : ""}${extra}</button>`;
}

function petsTab() {
  if (!S.pets.length) return `<div class="empty-note"><div class="bigicon">🥚</div><p>まだ なかまが いないよ。<br>問題に 正解して タマゴを かえそう！</p></div>`;
  return `<p class="note">タップすると くわしく 見られるよ。あいぼうは バトルで いっしょに たたかうよ。</p>
    <div class="plist">${S.pets.map((p) => petCard(p, `petDetail(${p.u})`)).join("")}</div>`;
}

function petDetail(u) {
  const pet = S.pets.find((p) => p.u === u), sp = petSp(pet.sp);
  snd("tap");
  modal(`<div class="petbig" style="--pc:${ELEMENTS[sp.el].color}">${sp.em}</div>
    <div class="pname2">${sp.name} <small>${RARITY[sp.r].stars}</small></div>
    <p class="small">Lv <b>${pet.lv}</b>${pet.lv < MAX_PET_LV ? `（つぎの レベルまで あと ${xpNeed(pet.lv) - pet.xp}問 正解）` : "（MAX）"}</p>
    <div class="abox"><b>${ABILITY[sp.ab].icon} ${sp.waza}</b><br>${petDesc(pet)}<br><small>${ELEMENTS[sp.el].icon} ${ELEMENTS[sp.el].name} ぞくせい ／ ${sp.cd}問 正解ごとに つかう</small></div>
    ${S.partner === u ? `<p class="tip">いまの あいぼう</p>` : `<button class="big-btn primary" onclick="setPartner(${u})">あいぼうに する</button>`}
    <button class="big-btn" onclick="closeModal()">とじる</button>`);
}
function setPartner(u) { S.partner = u; save(); snd("ok"); closeModal(); nakama("pets"); toast("あいぼうを かえたよ！"); }

function eggTab() {
  const cells = [];
  for (let i = 0; i < MAX_EGGS; i++) {
    const e = S.eggs[i];
    if (!e) { cells.push(`<div class="ecell empty">あき</div>`); continue; }
    const ready = e.p >= e.n;
    cells.push(`<div class="ecell ${ready ? "ready" : ""}">
      ${eggSVG(e, ready ? "wobble" : e.p / e.n > 0.7 ? "wobble slow" : "")}
      <small>${e.f ? "かけあわせ" : RARITY[e.r].name}</small>
      <span class="bar mb"><i style="width:${Math.min(100, (e.p / e.n) * 100)}%"></i><span>${ready ? "かえる！" : `あと ${e.n - e.p}問`}</span></span>
      ${ready ? `<button class="sbtn" onclick="hatchEgg(${i})">かえす！</button>` : ""}</div>`);
  }
  return `<p class="note">問題に 正解するたびに、ぜんぶの タマゴが そだつよ（さいだい ${MAX_EGGS}こ）。</p><div class="egrid">${cells.join("")}</div>`;
}

// ---------- かけあわせ ----------
function breedable(pet) { return pet.lv >= BREED_LV && pet.bred !== today(); }
function breedTab() {
  const box = (k) => {
    const pet = S.pets.find((p) => p.u === breedSel[k]);
    return `<button class="bbox" onclick="breedPick(${k})">${pet ? `<span class="pem2">${petSp(pet.sp).em}</span><small>${petSp(pet.sp).name} Lv${pet.lv}</small>` : `<span class="plus">＋</span><small>えらぶ</small>`}</button>`;
  };
  const a = S.pets.find((p) => p.u === breedSel[0]), b = S.pets.find((p) => p.u === breedSel[1]);
  const ok = a && b && S.coins >= BREED_COST && S.eggs.length < MAX_EGGS;
  return `<div class="breed">
    <p class="note">2ひきの なかまを かけあわせると、あたらしい タマゴが うまれるよ！<br>とくべつな くみあわせで しか うまれない なかまも いる…？</p>
    <div class="brow">${box(0)}<span class="bx">×</span>${box(1)}</div>
    <div class="bres">${a && b ? `${eggSVG({ r: 0, f: true }, "wobble slow")}<small>なにが うまれるかな？</small>` : ""}</div>
    <button class="big-btn primary" ${ok ? "" : "disabled"} onclick="doBreed()">かけあわせる！（🪙${BREED_COST}）</button>
    <p class="note">じょうけん：どちらも Lv${BREED_LV}いじょう ／ 1ぴき 1日1回まで ／ タマゴは ${MAX_EGGS}こまで</p></div>`;
}
function breedPick(k) {
  snd("tap");
  const other = breedSel[1 - k];
  const list = S.pets.filter((p) => p.u !== other);
  if (!list.length) { toast("なかまが 2ひき いると かけあわせ できるよ"); return; }
  modal(`<div class="mtitle">なかまを えらぶ</div><div class="plist sm">${list.map((p) => {
    const why = p.lv < BREED_LV ? `Lv${BREED_LV}から` : p.bred === today() ? "きょうは おやすみ" : "";
    return petCard(p, why ? `toast('${why}')` : `breedSet(${k},${p.u})`, why ? `<i class="ngtag">${why}</i>` : "");
  }).join("")}</div><button class="big-btn" onclick="closeModal()">とじる</button>`);
}
function breedSet(k, u) { breedSel[k] = u; closeModal(); nakama("breed"); }

function doBreed() {
  const a = S.pets.find((p) => p.u === breedSel[0]), b = S.pets.find((p) => p.u === breedSel[1]);
  if (!a || !b || !breedable(a) || !breedable(b) || S.coins < BREED_COST || S.eggs.length >= MAX_EGGS) return;
  const rec = RECIPES.find(([pair]) => (pair[0] === a.sp && pair[1] === b.sp) || (pair[0] === b.sp && pair[1] === a.sp));
  if (rec) giveEgg(0, rec[1]);
  else {
    // レシピにない組み合わせは、親のレア度にちかいタマゴ（ときどき 1つ上）
    const r = Math.min(2, Math.max(petSp(a.sp).r, petSp(b.sp).r, 0) + (Math.random() < 0.25 ? 1 : 0));
    giveEgg(Math.min(r, 2));
  }
  S.coins -= BREED_COST;
  a.bred = b.bred = today();
  breedSel = [0, 0];
  save(); snd("special");
  const egg = S.eggs[S.eggs.length - 1];
  modal(`<div class="mtitle">${rec ? "✨ とくべつな タマゴ！" : "タマゴが うまれた！"}</div><div class="hatchwrap">${eggSVG(egg, "wobble")}</div>
    <p>問題に <b>${egg.n}問</b> 正解すると かえるよ！</p><button class="big-btn primary" onclick="closeModal();nakama('egg')">そだてる！</button>`);
}

// ---------- なかまずかん ----------
function dexTab() {
  const got = PETS.filter((p) => S.petDex[p.id]).length;
  return `<div class="zhead">なかまずかん <b>${got} / ${PETS.length}</b></div>
    <div class="dgrid">${PETS.map((p) => {
      if (S.petDex[p.id]) return `<button class="dcell" style="--pc:${ELEMENTS[p.el].color}" onclick="dexInfo('${p.id}')"><span>${p.em}</span><small>${p.name}</small></button>`;
      return `<button class="dcell lock" onclick="dexInfo('${p.id}')"><span>？</span><small>${p.fusion ? "かけあわせ" : RARITY[p.r].name}</small></button>`;
    }).join("")}</div>`;
}
function dexInfo(id) {
  const p = petSp(id);
  snd("tap");
  if (S.petDex[id]) {
    modal(`<div class="petbig" style="--pc:${ELEMENTS[p.el].color}">${p.em}</div><div class="pname2">${p.name} <small>${RARITY[p.r].stars}</small></div>
      <p class="small">${ELEMENTS[p.el].icon} ${ELEMENTS[p.el].name} ／「${p.waza}」<br>${ABILITY[p.ab].icon} ${ABILITY[p.ab].desc(p.pow)}</p><button class="big-btn" onclick="closeModal()">とじる</button>`);
    return;
  }
  let hint = `${RARITY[p.r].name}の タマゴから うまれるよ。`;
  if (p.fusion) {
    // 見つけたことのある親だけ 絵で ヒントを出す
    const pair = RECIPES.find((r) => r[1] === id)[0];
    const show = (x) => (S.petDex[x] ? petSp(x).em : "？");
    hint = `ヒント：${show(pair[0])} × ${show(pair[1])} を かけあわせると…？`;
  }
  modal(`<div class="petbig lock">？</div><p>${hint}</p><button class="big-btn" onclick="closeModal()">とじる</button>`);
}
