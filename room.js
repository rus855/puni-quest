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
  { id: "f_trophy", name: "トロフィーだな", em: "🏆", set: "sp", price: 300, kira: 12,
    need: () => Object.keys(S.treasures || {}).length >= 3, hint: "たからものを 3つ あつめると ならぶよ" },
  { id: "f_hiken", name: "ひけんの かざりだい", em: "🗡️", set: "sp", price: 400, kira: 15,
    need: () => typeof hasHiken === "function" && WORLDS.some((w) => hasHiken(w.id)), hint: "ひみつの けんを 見つけると ならぶよ" },
  { id: "f_niji", name: "にじの まど", em: "🌈", set: "sp", wall: 1, price: 500, mat: { niji: 1 }, kira: 20,
    need: () => typeof otMaou === "function" && otMaou(), hint: "まおうを たおすと ならぶよ" },
  { id: "f_okaeri", name: "おかえりの ソファ", em: "💝", set: "sp", w: 2, gift: 1, kira: 15, hint: "ひさしぶりに あそびに くると もらえるかも…" },
];
const furnById = (id) => FURN.find((f) => f.id === id);
const FURN_SETS = ["kanji", "kotoba", "math", "sci", "soc"];
const fMax = (f) => f.max || 1;
// きらきら度の ごほうび（へやが ひろく なる・2つめの へや）
const ROOM_BIG = 60, ROOM_TWO = 150;

function roomData() {
  if (!S.room) S.room = { cur: 0, rooms: [[], []], pets: [], kake: "", stamps: {} };
  S.furn = S.furn || {};
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
  R.rooms.forEach((r) => r.forEach((p) => { k += furnById(p.id).kira; }));
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
  const group = [["base", "🏠 ふつうの かぐ"], ...FURN_SETS.map((w) => [w, `${WORLDS.find((x) => x.id === w).icon} ${WORLDS.find((x) => x.id === w).name}セット`]), ["sp", "✨ とくべつな かぐ"]];
  return group.map(([g, title]) => {
    const items = FURN.filter((f) => f.set === g && !f.gift).map((f) => {
      if (f.need && !f.need()) return `<div class="sitem locked"><div class="sprev qmark">？</div><div class="sname"><b>？？？</b><small>${f.hint}</small></div><button class="sbtn" disabled>🔒</button></div>`;
      const own = fOwn(f.id), full = own >= fMax(f);
      const matOk = Object.entries(f.mat || {}).every(([k, v]) => (S.mats[k] || 0) >= v);
      const can = S.coins >= f.price && matOk;
      const need = f.mat && !full ? `<span class="mneed">${Object.entries(f.mat).map(([k, v]) => `<i class="${(S.mats[k] || 0) >= v ? "" : "lack"}">${MATS[k].em}${S.mats[k] || 0}/${v}</i>`).join("")}</span>` : "";
      return `<div class="sitem ${full ? "own" : ""}">
        <div class="sprev fprev">${f.em}</div>
        <div class="sname"><b>${f.name}</b><small>✨きらきら +${f.kira}${f.wall ? "・かべに かざる" : ""}${fMax(f) > 1 ? `・もってる ${own}/${fMax(f)}` : ""}</small>${need}</div>
        ${full ? `<button class="sbtn" disabled>もってる</button>` : `<button class="sbtn ${can ? "" : "no"}" onclick="buyFurn('${f.id}')">🪙${f.price}</button>`}
      </div>`;
    }).join("");
    return `<div class="fgroup">${title}${g !== "base" && g !== "sp" ? `<small>5つ ぜんぶ おくと スタンプ！</small>` : ""}</div>${items}`;
  }).join("") + `<p class="note">かった かぐは ホームの「🏠 ひみつきち」に おけるよ。</p>`;
}
function buyFurn(id) {
  const f = furnById(id);
  if (!f || f.gift || fOwn(id) >= fMax(f) || (f.need && !f.need())) return;
  const lack = Object.entries(f.mat || {}).filter(([k, v]) => (S.mats[k] || 0) < v);
  if (lack.length) { snd("ng"); toast(`そざいが たりないよ（${lack.map(([k]) => MATS[k].em + MATS[k].name).join("・")}）`); return; }
  if (S.coins < f.price) { snd("ng"); toast("コインが たりないよ"); return; }
  S.coins -= f.price;
  Object.entries(f.mat || {}).forEach(([k, v]) => { S.mats[k] -= v; });
  giveFurn(id); save(); snd("coin");
  toast(`${f.em} ${f.name}を かったよ！ ひみつきちに おこう`);
  shop();
}

// ---------- ひみつきち の 画面 ----------
let RM = { sel: "", move: -1 }; // sel：おこうと している かぐ、move：うごかしている かぐの ばんごう
let roomTimer = 0;

function room() {
  const R = roomData();
  if (R.cur && !roomTwo()) R.cur = 0;
  const { C } = roomSize();
  const k = kiraScore(), next = k < ROOM_BIG ? ROOM_BIG : k < ROOM_TWO ? ROOM_TWO : 0;
  const prev = k < ROOM_BIG ? 0 : ROOM_BIG;
  const stock = FURN.filter((f) => fOwn(f.id) - fPlaced(f.id) > 0);
  setScreen(`${topBar("ひみつきち")}
    <div class="kira"><b>✨ きらきら度 ${k}</b>${next ? `<span class="bar"><i style="width:${Math.min(100, ((k - prev) / (next - prev)) * 100)}%"></i></span><small>${next === ROOM_BIG ? "へやが ひろく なる" : "2つめの へやが できる"}まで あと ${next - k}</small>` : `<small>へやは ぜんぶ ひらいたよ！</small>`}</div>
    ${roomTwo() ? `<div class="tabs">${[0, 1].map((i) => `<button class="${R.cur === i ? "on" : ""}" onclick="roomData().cur=${i};RM={sel:'',move:-1};room()">へや ${i + 1}</button>`).join("")}</div>` : ""}
    <div class="stamps">${FURN_SETS.map((w) => `<span class="${R.stamps[w] ? "on" : ""}" title="${WORLDS.find((x) => x.id === w).name}セット">${WORLDS.find((x) => x.id === w).icon}</span>`).join("")}<small>セットの スタンプ</small></div>
    <div id="roombox">${roomHTML()}</div>
    <div class="rmhint" id="rmhint">${roomHint()}</div>
    <div class="sub">🪑 しまってある かぐ</div>
    <div class="fstock">${stock.length ? stock.map((f) => `<button class="${RM.sel === f.id ? "on" : ""}" onclick="roomPick('${f.id}')"><span>${f.em}</span><small>${f.name}</small>${fOwn(f.id) - fPlaced(f.id) > 1 ? `<i>×${fOwn(f.id) - fPlaced(f.id)}</i>` : ""}</button>`).join("") : `<p class="small">ショップの「かぐ」で かえるよ。おいた かぐを タップすると しまえるよ。</p>`}</div>
    <div class="row"><button class="big-btn" onclick="roomPets()">🐾 へやの なかまを えらぶ</button><button class="big-btn" onclick="go('shop','furn')">🛒 かぐを かう</button></div>
    <p class="small" style="text-align:center">へやの ひろさ：よこ ${C}マス${roomData().rooms[1].length || roomTwo() ? "・へやは 2つ" : ""}</p>`, "bg-home");
  roomWalk();
}

function roomHint() {
  if (RM.sel) { const f = furnById(RM.sel); return `${f.em} ${f.name}：${f.wall ? "かべの" : "ゆかの"} おきたい ところを タップしてね <button class="mini" onclick="RM={sel:'',move:-1};room()">やめる</button>`; }
  if (RM.move >= 0) { const f = furnById(roomList()[RM.move].id); return `${f.em} ${f.name}を どこへ うごかす？ <button class="mini" onclick="RM={sel:'',move:-1};room()">やめる</button>`; }
  return "かぐを えらんで、へやの すきな ところに おこう！";
}
const roomList = () => roomData().rooms[roomData().cur];

// へやの え（かべ ＋ ゆか）
function roomHTML() {
  const { C, R } = roomSize(), list = roomList();
  const f0 = RM.sel ? furnById(RM.sel) : RM.move >= 0 ? furnById(list[RM.move].id) : null;
  const placing = !!f0;
  const cells = [];
  // かべ（y = -1 の 1れつ）
  for (let x = 0; x < C; x++) cells.push(`<button class="rc wallc ${placing && f0.wall && canPlace(f0, x, -1) ? "ok" : ""}" style="left:${(x / C) * 100}%;top:0;width:${100 / C}%;height:var(--wh)" onclick="roomTap(${x},-1)"></button>`);
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) cells.push(`<button class="rc ${placing && !f0.wall && canPlace(f0, x, y) ? "ok" : ""}" style="left:${(x / C) * 100}%;top:calc(var(--wh) + (100% - var(--wh)) * ${y / R});width:${100 / C}%;height:calc((100% - var(--wh)) / ${R})" onclick="roomTap(${x},${y})"></button>`);
  const items = list.map((p, i) => {
    const f = furnById(p.id), w = f.w || 1;
    if (p.x + w > C || p.y >= R) return ""; // ひろさが かわって はみでた ものは 出さない（ねんのため）
    const top = p.y < 0 ? "0px" : `calc(var(--wh) + (100% - var(--wh)) * ${p.y / R})`;
    const h = p.y < 0 ? "var(--wh)" : `calc((100% - var(--wh)) / ${R})`;
    let inner = `<span class="fem ${w > 1 ? "w2" : ""}">${f.em}</span>`;
    if (p.id === "f_kake") inner = `<span class="kake">${roomData().kake ? esc(roomData().kake.slice(2)) : "？"}</span>`;
    if (p.id === "f_trophy") inner += `<i class="fcount">${Object.keys(S.treasures || {}).length}</i>`;
    if (p.id === "f_okaeri") inner = `<span class="fem w2">🛋️</span><i class="fheart">💗</i>`;
    return `<div class="fi ${RM.move === i ? "moving" : ""}" style="left:${(p.x / C) * 100}%;top:${top};width:${(w / C) * 100}%;height:${h}">${inner}</div>`;
  }).join("");
  // ぷにまると なかま（あるきまわる）
  const pets = roomPetList().map((u) => { const pet = S.pets.find((p) => p.u === u); return pet ? `<div class="ract rpet">${petSp(pet.sp).em}</div>` : ""; }).join("");
  return `<div class="room" style="--wh:${(1.4 / (R + 1.4)) * 100}%;aspect-ratio:${C} / ${R + 1.4}">${cells.join("")}${items}<div class="ract rme">${charSVG(S.eq, S.color)}</div>${pets}</div>`;
}

// へやに いる なかま（えらんで いなければ あいぼう＋2ひき。おつかい中は いない）
function roomPetList() {
  const R = roomData();
  let l = R.pets.filter((u) => S.pets.some((p) => p.u === u));
  if (!R.pets.length) l = [S.partner, ...S.pets.map((p) => p.u).filter((u) => u !== S.partner)].filter(Boolean).slice(0, 3);
  return l.filter((u) => !(typeof onErrand === "function" && onErrand(u)));
}

// その ばしょに おけるか（ほかの かぐと かさならない・へやから はみださない）
function canPlace(f, x, y, skip = -1) {
  const { C, R } = roomSize(), w = f.w || 1;
  if (!!f.wall !== (y < 0) || x < 0 || x + w > C || y >= R) return false;
  return !roomList().some((p, i) => {
    if (i === skip) return false;
    const g = furnById(p.id), pw = g.w || 1;
    return p.y === y && x < p.x + pw && p.x < x + w;
  });
}
// その マスに ある かぐの ばんごう
function itemAt(x, y) {
  return roomList().findIndex((p) => { const w = furnById(p.id).w || 1; return p.y === y && x >= p.x && x < p.x + w; });
}

function roomPick(id) {
  snd("tap");
  RM = { sel: RM.sel === id ? "" : id, move: -1 };
  room();
}
function roomTap(x, y) {
  const list = roomList();
  if (RM.sel) {
    const f = furnById(RM.sel);
    // 2マスの かぐは、右はしを タップしても おけるように 1マス ずらす
    if (!canPlace(f, x, y) && (f.w || 1) > 1 && canPlace(f, x - 1, y)) x--;
    if (!canPlace(f, x, y)) { snd("ng"); toast(f.wall ? "かべの あいている ところを えらんでね" : "ゆかの あいている ところを えらんでね"); return; }
    list.push({ id: f.id, x, y });
    snd("ok");
    if (fOwn(f.id) - fPlaced(f.id) <= 0) RM.sel = "";
    afterPlace();
    return;
  }
  if (RM.move >= 0) {
    const p = list[RM.move], f = furnById(p.id);
    if (!canPlace(f, x, y, RM.move) && (f.w || 1) > 1 && canPlace(f, x - 1, y, RM.move)) x--;
    if (!canPlace(f, x, y, RM.move)) { snd("ng"); toast("そこには おけないよ"); return; }
    p.x = x; p.y = y; RM.move = -1; snd("ok");
    afterPlace();
    return;
  }
  const i = itemAt(x, y);
  if (i < 0) return;
  const f = furnById(list[i].id);
  snd("tap");
  modal(`<div class="mtitle">${f.em} ${f.name}</div>
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

// ぷにまると なかまが ゆかを あるきまわる
function roomWalk() {
  clearInterval(roomTimer);
  const move = () => {
    const box = document.querySelector(".room");
    if (!box) { clearInterval(roomTimer); return; }
    const { C, R } = roomSize();
    box.querySelectorAll(".ract").forEach((el) => {
      const x = Math.random() * (C - 0.9), y = Math.random() * (R - 0.6);
      el.style.left = `${(x / C) * 100}%`;
      el.style.top = `calc(var(--wh) + (100% - var(--wh)) * ${y / R} - 6%)`;
      el.classList.toggle("flip", Math.random() < 0.5);
    });
  };
  move();
  roomTimer = setInterval(move, 2600);
}
