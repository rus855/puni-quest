// ===== ぷにまるの ひみつきち =====
// かぐを かって、へやの すきな ところに おく。なかまが へやを あるきまわる。
// かぐを おくと「きらきら度」が たまり、へやが ひろく なったり、2つめの へやが ひらいたりする。
"use strict";

// set：base（ふつう）・国の id（国の セット）・sp（とくべつ）
// w：よこはば（1か2）、wall：かべに かざる、max：もてる かず、kira：きらきら度
// gift：ショップに ならばない（おつかい・おかえりで もらえる）、need：ショップに ならぶ じょうけん
const FURN = [
  // --- ふつうの かぐ ---
  { id: "f_bed", name: "ベッド", em: "🛏️", set: "base", w: 2, price: 160, kira: 6, max: 2 },
  { id: "f_sofa", name: "ソファ", em: "🛋️", set: "base", w: 2, price: 150, kira: 6, max: 2 },
  { id: "f_chair", name: "いす", em: "🪑", set: "base", price: 60, kira: 3, max: 4 },
  { id: "f_plant", name: "はちうえ", em: "🪴", set: "base", price: 50, kira: 3, max: 4 },
  { id: "f_shelf", name: "ほんだな", em: "📚", set: "base", price: 120, kira: 5, max: 2 },
  { id: "f_bear", name: "くまの ぬいぐるみ", em: "🧸", set: "base", price: 90, kira: 4, max: 2 },
  { id: "f_candle", name: "キャンドル", em: "🕯️", set: "base", price: 50, kira: 2, max: 3 },
  { id: "f_basket", name: "かご", em: "🧺", set: "base", price: 40, kira: 2, max: 3 },
  { id: "f_ball", name: "ボール", em: "⚽", set: "base", price: 40, kira: 2, max: 2 },
  { id: "f_balloon", name: "ふうせん", em: "🎈", set: "base", price: 30, kira: 2, max: 4 },
  { id: "f_gift", name: "プレゼントばこ", em: "🎁", set: "base", price: 60, kira: 3, max: 3 },
  { id: "f_clock", name: "はしらどけい", em: "🕰️", set: "base", price: 100, kira: 4, max: 1 },
  { id: "f_tv", name: "テレビ", em: "📺", set: "base", price: 200, kira: 6, max: 1 },
  { id: "f_window", name: "まど", em: "🪟", set: "base", wall: 1, price: 80, kira: 4, max: 2 },
  { id: "f_pic", name: "え", em: "🖼️", set: "base", wall: 1, price: 100, kira: 4, max: 3 },
  // しきもの（ゆかに しく。上に ほかの かぐを おける）。h：おくゆき、rc：いろ
  { id: "f_rug1", name: "ふわふわラグ", em: "🩷", set: "base", rug: 1, w: 2, h: 2, price: 120, kira: 4, max: 2, rc: ["#ffc6dc", "#ff8fb8"] },
  { id: "f_rug2", name: "しましまラグ", em: "🔵", set: "base", rug: 1, w: 3, h: 2, price: 180, kira: 5, max: 2, rc: ["#bfe3ff", "#fffdf5"], pat: "stripe" },
  { id: "f_rug3", name: "ほしぞらラグ", em: "🌌", set: "base", rug: 1, w: 2, h: 2, price: 250, kira: 6, max: 1, rc: ["#3b3f8f", "#ffe066"], pat: "star" },
  { id: "f_rug4", name: "はっぱの ラグ", em: "🍃", set: "base", rug: 1, w: 2, h: 2, price: 150, kira: 4, max: 2, rc: ["#a8e6a1", "#4f9e4c"], pat: "border" },
  // --- 漢字の国 ---
  { id: "f_k1", name: "ちょうちん", em: "🏮", set: "kanji", wall: 1, price: 220, mat: { moji: 3 }, kira: 8 },
  { id: "f_k2", name: "ひなにんぎょう", em: "🎎", set: "kanji", price: 300, mat: { moji: 5 }, kira: 8 },
  { id: "f_k3", name: "たなばたの ささ", em: "🎋", set: "kanji", price: 260, mat: { moji: 4 }, kira: 8 },
  { id: "f_k4", name: "おちゃセット", em: "🍵", set: "kanji", price: 200, mat: { moji: 3 }, kira: 8 },
  { id: "f_k5", name: "かどまつ", em: "🎍", set: "kanji", price: 320, mat: { moji: 5, kinsumi: 1 }, kira: 10 },
  // --- ことばの国 ---
  { id: "f_t1", name: "おめん", em: "🎭", set: "kotoba", wall: 1, price: 220, mat: { koto: 3 }, kira: 8 },
  { id: "f_t2", name: "おおきな えほん", em: "📖", set: "kotoba", price: 260, mat: { koto: 4 }, kira: 8 },
  { id: "f_t3", name: "ポスト", em: "📮", set: "kotoba", price: 300, mat: { koto: 5 }, kira: 8 },
  { id: "f_t4", name: "まきもの", em: "📜", set: "kotoba", wall: 1, price: 200, mat: { koto: 3 }, kira: 8 },
  { id: "f_t5", name: "グランドピアノ", em: "🎹", set: "kotoba", w: 2, price: 320, mat: { koto: 5, kotohana: 1 }, kira: 10 },
  // --- 算数の国 ---
  { id: "f_m1", name: "じょうぎ", em: "📐", set: "math", wall: 1, price: 200, mat: { suuji: 3 }, kira: 8 },
  { id: "f_m2", name: "そろばん", em: "🧮", set: "math", price: 260, mat: { suuji: 4 }, kira: 8 },
  { id: "f_m3", name: "おおきな サイコロ", em: "🎲", set: "math", price: 220, mat: { suuji: 3 }, kira: 8 },
  { id: "f_m4", name: "パズル", em: "🧩", set: "math", price: 300, mat: { suuji: 5 }, kira: 8 },
  { id: "f_m5", name: "てんびん", em: "⚖️", set: "math", price: 320, mat: { suuji: 5, haguruma: 1 }, kira: 10 },
  // --- 理科の国 ---
  { id: "f_s1", name: "わくせいの もけい", em: "🪐", set: "sci", wall: 1, price: 260, mat: { kagaku: 4 }, kira: 8 },
  { id: "f_s2", name: "ぼうえんきょう", em: "🔭", set: "sci", price: 300, mat: { kagaku: 5 }, kira: 8 },
  { id: "f_s3", name: "じっけんセット", em: "🧪", set: "sci", price: 200, mat: { kagaku: 3 }, kira: 8 },
  { id: "f_s4", name: "けんびきょう", em: "🔬", set: "sci", price: 220, mat: { kagaku: 3 }, kira: 8 },
  { id: "f_s5", name: "きょうりゅうの もけい", em: "🦕", set: "sci", w: 2, price: 320, mat: { kagaku: 5, flask: 1 }, kira: 10 },
  // --- 社会の国 ---
  { id: "f_h1", name: "にほんちず", em: "🗾", set: "soc", wall: 1, price: 260, mat: { rekishi: 4 }, kira: 8 },
  { id: "f_h2", name: "おしろの もけい", em: "🏯", set: "soc", price: 300, mat: { rekishi: 5 }, kira: 8 },
  { id: "f_h3", name: "つぼ", em: "🏺", set: "soc", price: 200, mat: { rekishi: 3 }, kira: 8 },
  { id: "f_h4", name: "せきぞう", em: "🗿", set: "soc", price: 220, mat: { rekishi: 3 }, kira: 8 },
  { id: "f_h5", name: "とりい", em: "⛩️", set: "soc", w: 2, price: 320, mat: { rekishi: 5, magatama: 1 }, kira: 10 },
  // --- とくべつ ---
  { id: "f_kake", name: "かけじく", em: "🖌️", set: "sp", wall: 1, price: 300, mat: { moji: 3 }, kira: 12,
    need: () => kakeList().length > 0, hint: "漢字カードを ★5に すると ならぶよ" },
  { id: "f_trophy", name: "トロフィーだな", em: "🏆", set: "sp", w: 2, price: 300, kira: 12,
    need: () => Object.keys(S.treasures || {}).length >= 3, hint: "たからものを 3つ あつめると ならぶよ" },
  { id: "f_hiken", name: "ひけんの かざりだい", em: "🗡️", set: "sp", price: 400, kira: 15,
    need: () => typeof hasHiken === "function" && WORLDS.some((w) => hasHiken(w.id)), hint: "ひみつの けんを 見つけると ならぶよ" },
  { id: "f_niji", name: "にじの まど", em: "🌈", set: "sp", wall: 1, price: 500, mat: { niji: 1 }, kira: 20,
    need: () => typeof otMaou === "function" && otMaou(), hint: "まおうを たおすと ならぶよ" },
  { id: "f_okaeri", name: "おかえりの ソファ", em: "💝", set: "sp", w: 2, gift: 1, kira: 15, hint: "ひさしぶりに あそびに くると もらえるかも…" },
];
// ねだんの ちょうせい：ぜんたい 2ばい、レアな そざいを つかう かぐは 2.5ばい、とくべつな かぐは 3ばい
FURN.forEach((f) => {
  if (!f.price) return;
  const rare = Object.keys(f.mat || {}).some((k) => MATS[k] && MATS[k].rare);
  f.price = Math.round((f.price * (f.set === "sp" ? 3 : rare ? 2.5 : 2)) / 10) * 10;
});
const furnById = (id) => FURN.find((f) => f.id === id);
// かぐの しゅるい（えらぶ ときの なかま分け）。かべの かぐは ぜんぶ「かべ」
const FKIND = {
  sleep: { name: "ねる", em: "🛏️", ids: ["f_bed", "f_okaeri"] },
  sit: { name: "すわる", em: "🪑", ids: ["f_sofa", "f_chair"] },
  table: { name: "つくえ", em: "🍵", ids: ["f_k4"] },
  light: { name: "あかり", em: "💡", ids: ["f_candle"] },
  play: { name: "あそぶ", em: "🧸", ids: ["f_bear", "f_ball", "f_balloon", "f_gift", "f_tv", "f_t5", "f_m3", "f_m4"] },
  study: { name: "まなぶ", em: "📚", ids: ["f_shelf", "f_t2", "f_m2", "f_m5", "f_s2", "f_s3", "f_s4"] },
  store: { name: "しゅうのう", em: "🗄️", ids: [] },
  nature: { name: "しぜん", em: "🌿", ids: ["f_plant", "f_basket", "f_k3", "f_k5"] },
  deco: { name: "おきもの", em: "🏺", ids: ["f_clock", "f_k2", "f_t3", "f_s5", "f_h2", "f_h3", "f_h4", "f_h5", "f_trophy", "f_hiken"] },
  rug: { name: "しきもの", em: "🧶", ids: [] },
  wall: { name: "かべ", em: "🖼️", ids: [] },
};
const fKind = (f) => (f.wall ? "wall" : f.rug ? "rug" : f.k ? f.k : Object.keys(FKIND).find((k) => FKIND[k].ids.includes(f.id)) || "deco");
let roomCat = "all"; // しまってある かぐの なかま分け
const FURN_SETS = ["kanji", "kotoba", "math", "sci", "soc"];
const fMax = (f) => f.max || 1;
// きらきら度の ごほうび（へやが ひろく なる・2つめの へや）
const ROOM_BIG = 60, ROOM_TWO = 150;

function roomData() {
  if (!S.room) S.room = { cur: 0, rooms: [[], []], pets: [], kake: "", stamps: {} };
  S.furn = S.furn || {};
  if (!S.room.v2) {
    S.room.v2 = 1;
    // トロフィーだなが 2マスに なった：となりが ふさがっている ときは しまう
    const C = S.room.big ? 6 : 5;
    S.room.rooms.forEach((r) => { for (let i = r.length - 1; i >= 0; i--) { const p = r[i]; if (p.id !== "f_trophy") continue;
      const busy = r.some((q) => q !== p && q.y === p.y && !furnById(q.id).rug && q.x <= p.x + 1 && p.x + 1 < q.x + (furnById(q.id).w || 1));
      if (busy || p.x + 2 > C) r.splice(i, 1); } });
  }
  return S.room;
}
const fOwn = (id) => (S.furn || {})[id] || 0;
// おいている かず（2つの へや あわせて）
const fPlaced = (id) => roomData().rooms.reduce((n, r) => n + r.filter((p) => p.id === id).length, 0);
// ★5の 漢字（かけじくに かざれる）
const kakeList = () => Object.keys(S.cards || {}).filter((id) => id.startsWith("k:") && S.cards[id].s >= 5);

// セットが そろったか（その国の 5つを ぜんぶ おいている）
const setDone = (w) => FURN.filter((f) => f.set === w).every((f) => fPlaced(f.id) > 0);
function kiraScore() {
  const R = roomData();
  let k = 0;
  R.rooms.forEach((r) => { r.forEach((p) => { k += furnById(p.id).kira; }); k += roomCombos(r).length * COMBO_KIRA; });
  return k + FURN_SETS.filter((w) => R.stamps[w]).length * 20;
}
// へやの おおきさ（よこ C・たて R の ゆか）
const roomSize = () => (kiraScore() >= ROOM_BIG || roomData().big ? { C: 6, R: 5 } : { C: 5, R: 4 });
const roomTwo = () => kiraScore() >= ROOM_TWO || !!roomData().two;

// かぐを もらう（おつかい・おかえり などから）。もてる かずを こえたら false
function giveFurn(id) {
  const f = furnById(id);
  if (!f || fOwn(id) >= fMax(f)) return false;
  S.furn = S.furn || {};
  S.furn[id] = fOwn(id) + 1;
  return true;
}

// ---------- ショップの「かぐ」タブ ----------
function furnShopList() {
  roomData();
  S.fseen = S.fseen || {};
  // ふつうの かぐ（はじめから ある もの・国を すすめると ふえる もの）は しゅるいべつ
  const kinds = Object.keys(FKIND).filter((k) => FURN.some((f) => (f.set === "base" || f.set === "more") && fKind(f) === k));
  const group = [...kinds.map((k) => [k, `${FKIND[k].em} ${FKIND[k].name}`]), ...FURN_SETS.map((w) => [w, `${WORLDS.find((x) => x.id === w).icon} ${WORLDS.find((x) => x.id === w).name}セット`]), ["sp", "✨ とくべつな かぐ"]];
  const inGroup = (f, g) => (FURN_SETS.includes(g) || g === "sp" ? f.set === g : (f.set === "base" || f.set === "more") && fKind(f) === g);
  const isNew = (f) => f.u && furnOpen(f) && !S.fseen[f.id];
  const chips = `<div class="fcats"><button class="${shopFCat === "all" ? "on" : ""}" onclick="shopFCat='all';shop('furn')">すべて</button>${[...kinds.map((k) => [k, FKIND[k].em + FKIND[k].name]), ["sets", "🌏 国セット"], ["sp", "✨ とくべつ"]].map(([g, t]) => `<button class="${shopFCat === g ? "on" : ""}" onclick="shopFCat='${g}';shop('furn')">${t}${FURN.some((f) => (g === "sets" ? FURN_SETS.includes(f.set) : inGroup(f, g)) && isNew(f)) ? `<i>NEW</i>` : ""}</button>`).join("")}</div>`;
  const show = group.filter(([g]) => shopFCat === "all" || shopFCat === g || (shopFCat === "sets" && FURN_SETS.includes(g)));
  const html = chips + show.map(([g, title]) => {
    let locked = 0;
    const list = FURN.filter((f) => inGroup(f, g) && !f.gift);
    // まだ ならばない かぐは、つぎに ひらく 2つだけ ヒントを 出す
    const shown = list.filter((f) => furnOpen(f)).concat(list.filter((f) => !furnOpen(f)).sort((a, b) => a.u[1] - b.u[1]).slice(0, 2));
    const items = shown.map((f) => {
      if (!furnOpen(f)) { locked++; return `<div class="sitem locked"><div class="sprev qmark">？</div><div class="sname"><b>？？？</b><small>${furnHint(f)}</small></div><button class="sbtn" disabled>🔒</button></div>`; }
      if (f.need && !f.need()) return `<div class="sitem locked"><div class="sprev qmark">？</div><div class="sname"><b>？？？</b><small>${f.hint}</small></div><button class="sbtn" disabled>🔒</button></div>`;
      const own = fOwn(f.id), full = own >= fMax(f);
      const matOk = Object.entries(f.mat || {}).every(([k, v]) => (S.mats[k] || 0) >= v);
      const can = S.coins >= f.price && matOk;
      const need = f.mat && !full ? `<span class="mneed">${Object.entries(f.mat).map(([k, v]) => `<i class="${(S.mats[k] || 0) >= v ? "" : "lack"}">${MATS[k].em}${S.mats[k] || 0}/${v}</i>`).join("")}</span>` : "";
      const from = f.u ? `<i class="fu">${WORLDS.find((w) => w.id === f.u[0]).icon}</i>` : "";
      return `<div class="sitem ${full ? "own" : ""}">
        <div class="sprev fprev">${fIcon(f)}</div>
        <div class="sname"><b>${from}${f.name}${isNew(f) ? `<i class="newtag">NEW</i>` : ""}</b><small>✨きらきら +${f.kira}${f.wall ? "・かべに かざる" : ""}${f.rug ? `・${f.w}×${f.h}マス、上に かぐを おける` : ""}${(f.w || 1) > 1 && !f.rug ? "・2マス" : ""}${fMax(f) > 1 ? `・もってる ${own}/${fMax(f)}` : ""}</small>${need}</div>
        ${full ? `<button class="sbtn" disabled>もってる</button>` : `<button class="sbtn ${can ? "" : "no"}" onclick="buyFurn('${f.id}')">🪙${f.price}</button>`}
      </div>`;
    }).join("");
    const more = list.filter((f) => !furnOpen(f)).length - locked;
    return `<div class="fgroup">${title}${FURN_SETS.includes(g) ? `<small>5つ ぜんぶ おくと スタンプ！</small>` : ""}</div>${items}${more > 0 ? `<p class="note">ほかにも ？？？ が ${more}こ。国の 章を すすめると ふえるよ</p>` : ""}`;
  }).join("") + `<p class="note">かった かぐは ホームの「🏠 ひみつきち」に おけるよ。<br>国の 章を クリアするほど、ならぶ かぐが ふえるよ。</p>`;
  // 見た あたらしい かぐは NEW を けす
  FURN.forEach((f) => { if (f.u && furnOpen(f) && show.some(([g]) => inGroup(f, g))) S.fseen[f.id] = 1; });
  save();
  return html;
}
function buyFurn(id) {
  const f = furnById(id);
  if (!f || f.gift || fOwn(id) >= fMax(f) || (f.need && !f.need()) || !furnOpen(f)) return;
  const lack = Object.entries(f.mat || {}).filter(([k, v]) => (S.mats[k] || 0) < v);
  if (lack.length) { snd("ng"); toast(`そざいが たりないよ（${lack.map(([k]) => MATS[k].em + MATS[k].name).join("・")}）`); return; }
  if (S.coins < f.price) { snd("ng"); toast("コインが たりないよ"); return; }
  S.coins -= f.price;
  Object.entries(f.mat || {}).forEach(([k, v]) => { S.mats[k] -= v; });
  giveFurn(id); save(); snd("coin");
  toast(`${f.em || "🪑"} ${f.name}を かったよ！ ひみつきちに おこう`);
  shop();
}

// ---------- ひみつきち の 画面 ----------
let shopFCat = "all"; // ショップの かぐの しぼりこみ
let RM = { sel: "", move: -1 }; // sel：おこうと している かぐ、move：うごかしている かぐの ばんごう
let roomTimer = 0;

function room() {
  const R = roomData();
  if (R.cur && !roomTwo()) R.cur = 0;
  const { C } = roomSize();
  const k = kiraScore(), next = k < ROOM_BIG ? ROOM_BIG : k < ROOM_TWO ? ROOM_TWO : 0;
  const prev = k < ROOM_BIG ? 0 : ROOM_BIG;
  const stockAll = FURN.filter((f) => fOwn(f.id) - fPlaced(f.id) > 0);
  const kinds = Object.keys(FKIND).filter((k) => stockAll.some((f) => fKind(f) === k));
  if (roomCat !== "all" && !kinds.includes(roomCat)) roomCat = "all";
  const stock = stockAll.filter((f) => roomCat === "all" || fKind(f) === roomCat);
  setScreen(`${topBar("ひみつきち")}
    <div class="kira"><b>✨ きらきら度 ${k}</b>${next ? `<span class="bar"><i style="width:${Math.min(100, ((k - prev) / (next - prev)) * 100)}%"></i></span><small>${next === ROOM_BIG ? "へやが ひろく なる" : "2つめの へやが できる"}まで あと ${next - k}</small>` : `<small>へやは ぜんぶ ひらいたよ！</small>`}</div>
    ${roomTwo() ? `<div class="tabs">${[0, 1].map((i) => `<button class="${R.cur === i ? "on" : ""}" onclick="roomData().cur=${i};RM={sel:'',move:-1};room()">へや ${i + 1}</button>`).join("")}</div>` : ""}
    <div class="stamps">${FURN_SETS.map((w) => `<span class="${R.stamps[w] ? "on" : ""}" title="${WORLDS.find((x) => x.id === w).name}セット">${WORLDS.find((x) => x.id === w).icon}</span>`).join("")}<small>セットの スタンプ</small></div>
    <div id="roombox">${roomHTML()}</div>
    ${comboStrip()}
    <div class="rmhint" id="rmhint">${roomHint()}</div>
    ${!RM.sel && RM.move < 0 && (roomPetList().length || 1) ? `<p class="small rmtip">💬 ぷにまるや なかまを タップすると おしゃべり するよ</p>` : ""}
    <div class="sub">🪑 しまってある かぐ</div>
    ${kinds.length > 1 ? `<div class="fcats"><button class="${roomCat === "all" ? "on" : ""}" onclick="roomCat='all';room()">すべて<i>${stockAll.length}</i></button>${kinds.map((k) => `<button class="${roomCat === k ? "on" : ""}" onclick="roomCat='${k}';room()">${FKIND[k].em}${FKIND[k].name}<i>${stockAll.filter((f) => fKind(f) === k).length}</i></button>`).join("")}</div>` : ""}
    <div class="fstock">${stock.length ? stock.map((f) => `<button class="${RM.sel === f.id ? "on" : ""}" onclick="roomPick('${f.id}')"><span>${fIcon(f)}</span><small>${f.name}</small>${fOwn(f.id) - fPlaced(f.id) > 1 ? `<i>×${fOwn(f.id) - fPlaced(f.id)}</i>` : ""}</button>`).join("") : `<p class="small">ショップの「かぐ」で かえるよ。おいた かぐを タップすると しまえるよ。</p>`}</div>
    <div class="row rmbtns"><button class="big-btn" onclick="roomPets()">🐾 なかま</button><button class="big-btn" onclick="roomThemePick()">🎨 もようがえ</button><button class="big-btn" onclick="go('shop','furn')">🛒 かぐ</button></div>
    <p class="small" style="text-align:center">へやの ひろさ：よこ ${C}マス${roomData().rooms[1].length || roomTwo() ? "・へやは 2つ" : ""}</p>`, "bg-home");
  roomWalk();
  roomDragInit();
}

function roomHint() {
  if (RM.sel) { const f = furnById(RM.sel); return `${fIcon(f)} ${f.name}：${f.wall ? "かべの" : "ゆかの"} おきたい ところを タップしてね <button class="mini" onclick="RM={sel:'',move:-1};room()">やめる</button>`; }
  if (RM.move >= 0) { const f = furnById(roomList()[RM.move].id); return `${fIcon(f)} ${f.name}を どこへ うごかす？ <button class="mini" onclick="RM={sel:'',move:-1};room()">やめる</button>`; }
  return "かぐを えらんで、へやの すきな ところに おこう！<br><small>おいた かぐは ドラッグで うごかせるよ</small>";
}
const roomList = () => roomData().rooms[roomData().cur];

// へやに いる なかま（えらんで いなければ あいぼう＋2ひき。おつかい中は いない）
function roomPetList() {
  const R = roomData();
  let l = R.pets.filter((u) => S.pets.some((p) => p.u === u));
  if (!R.pets.length) l = [S.partner, ...S.pets.map((p) => p.u).filter((u) => u !== S.partner)].filter(Boolean).slice(0, 3);
  return l.filter((u) => !(typeof onErrand === "function" && onErrand(u)));
}

function roomPick(id) {
  snd("tap");
  RM = { sel: RM.sel === id ? "" : id, move: -1 };
  room();
}
function roomTap(x, y) {
  if (Date.now() - roomDragEnd < 400) return; // ドラッグの おわりの クリックは むし
  const list = roomList();
  if (RM.sel) {
    const f = furnById(RM.sel);
    if (fOwn(f.id) - fPlaced(f.id) <= 0) { RM.sel = ""; room(); return; }
    // 2マスの かぐは、右はしを タップしても おけるように 1マス ずらす
    const sp = fitSpot(f, x, y);
    if (sp) [x, y] = sp;
    if (!sp) { snd("ng"); toast(f.wall ? "かべの あいている ところを えらんでね" : "ゆかの あいている ところを えらんでね"); return; }
    list.push({ id: f.id, x, y });
    snd("ok");
    if (fOwn(f.id) - fPlaced(f.id) <= 0) RM.sel = "";
    afterPlace();
    return;
  }
  if (RM.move >= 0) {
    const p = list[RM.move], f = furnById(p.id);
    const sp = fitSpot(f, x, y, RM.move);
    if (sp) [x, y] = sp;
    if (!sp) { snd("ng"); toast("そこには おけないよ"); return; }
    p.x = x; p.y = y; RM.move = -1; snd("ok");
    afterPlace();
    return;
  }
  const i = itemAt(x, y);
  if (i < 0) return;
  const f = furnById(list[i].id);
  snd("tap");
  modal(`<div class="mtitle">${fIcon(f)} ${f.name}</div>
    ${f.id === "f_kake" ? `<button class="big-btn primary" onclick="kakePick()">🖌️ かざる 漢字を えらぶ</button>` : ""}
    ${f.id === "f_trophy" ? `<p>たからもの <b>${Object.keys(S.treasures || {}).length}こ</b> を かざっているよ</p>` : ""}
    <button class="big-btn" onclick="closeModal();RM={sel:'',move:${i}};room()">↔️ うごかす</button>
    <button class="big-btn" onclick="roomStore(${i})">📦 しまう</button>
    <button class="big-btn" onclick="closeModal()">とじる</button>`);
}
function roomStore(i) {
  roomList().splice(i, 1);
  save(); closeModal(); snd("tap"); room();
}
// おいた あと：セットの スタンプ・へやが ひろがった おしらせ
function afterPlace() {
  const R = roomData(), before = { big: !!R.big, two: !!R.two };
  let msg = "";
  FURN_SETS.forEach((w) => {
    if (!R.stamps[w] && setDone(w)) {
      R.stamps[w] = today(); S.gems += 3;
      msg += `<p>${WORLDS.find((x) => x.id === w).icon} <b>${WORLDS.find((x) => x.id === w).name}セット</b> コンプリート！<br>スタンプと 💎3 を もらったよ</p>`;
    }
  });
  const k = kiraScore();
  // 一度 ひろがった へやは、かぐを しまっても せまく ならない
  if (k >= ROOM_BIG) R.big = 1;
  if (k >= ROOM_TWO) R.two = 1;
  if (!before.big && R.big) msg += `<p>✨ きらきら度が ${ROOM_BIG}に なった！<br><b>へやが ひろく なったよ</b></p>`;
  if (!before.two && R.two) msg += `<p>✨ きらきら度が ${ROOM_TWO}に なった！<br><b>2つめの へやが できたよ</b></p>`;
  // セットが そろうと もようがえが ふえる
  if (msg.includes("コンプリート")) msg += `<p class="small">🎨「もようがえ」で あたらしい かべと ゆかが えらべるように なったよ</p>`;
  comboCheck();
  save(); room();
  if (msg) { snd("special"); modal(`<div class="mtitle">🎉 やったね！</div>${msg}<button class="big-btn primary" onclick="closeModal()">うれしい！</button>`); }
}

// かけじくに かざる 漢字
function kakePick() {
  const l = kakeList();
  modal(`<div class="mtitle">🖌️ どの 漢字を かざる？</div><p class="small">★5の 漢字カードから えらべるよ</p>
    <div class="kakel">${l.map((id) => `<button class="${roomData().kake === id ? "on" : ""}" onclick="roomData().kake='${id}';save();closeModal();room()">${esc(id.slice(2))}</button>`).join("")}</div>
    <button class="big-btn" onclick="closeModal()">とじる</button>`);
}

// へやに いる なかまを えらぶ（3びきまで）
let roomSel = [];
function roomPets() {
  snd("tap");
  roomSel = roomPetList().slice();
  roomPetsModal();
}
function roomPetsModal() {
  const list = S.pets.filter((p) => !(typeof onErrand === "function" && onErrand(p.u)));
  if (!list.length) { toast("なかまが いると へやに よべるよ"); return; }
  modal(`<div class="mtitle">🐾 へやに よぶ なかま（${roomSel.length}/3）</div>
    <div class="plist sm">${list.map((p) => petCard(p, `roomPetToggle(${p.u})`, roomSel.includes(p.u) ? '<i class="ngtag okt">へやに いる</i>' : "")).join("")}</div>
    <button class="big-btn primary" onclick="roomData().pets=roomSel.slice();save();closeModal();room()">これで けってい</button>`);
}
function roomPetToggle(u) {
  if (roomSel.includes(u)) roomSel = roomSel.filter((x) => x !== u);
  else if (roomSel.length < 3) roomSel.push(u);
  else { toast("3びきまで だよ"); return; }
  snd("tap");
  const sc = document.querySelector("#modal .plist") ? document.querySelector("#modal .plist").scrollTop : 0;
  roomPetsModal();
  const pl = document.querySelector("#modal .plist");
  if (pl) pl.scrollTop = sc;
}

