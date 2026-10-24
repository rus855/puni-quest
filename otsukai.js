// ===== なかまの おつかい =====
// あいぼう いがいの なかまを 国へ おつかいに 出す（本当の 時間で 1・4・8じかん）。
// かえってくると、なかまが ニガテから 1問 クイズを 出す。正解すると おみやげが 1.5ばい。
"use strict";

// おつかいの 時間（u：おみやげの 量の めやす。8じかんで ステージ 2つぶん くらい）
const OT_TIMES = [
  { h: 1, u: 1, name: "ちょっとだけ" },
  { h: 4, u: 3, name: "はんにち" },
  { h: 8, u: 5, name: "1日がかり" },
];
const OT_HOUR = 3600000;

// おつかいの わく（はじめ 1つ・なかまずかん 10しゅるいで 2つ・まおうを たおすと 3つ）
const otDex = () => PETS.filter((p) => S.petDex[p.id]).length;
const otMaou = () => typeof stStars === "function" && stStars("z1-4") > 0;
const otSlots = () => 1 + (otDex() >= 10 ? 1 : 0) + (otMaou() ? 1 : 0);
const otList = () => (S.otsukai = S.otsukai || []);
// その なかまが おつかい中か
const onErrand = (u) => otList().some((o) => o.u === u);
// かえってきた おつかい
const otBack = () => otList().filter((o) => Date.now() >= o.end);

// なかまの つよさで おみやげが ふえる（Lv と レア度）
const otPow = (pet) => 1 + 0.08 * (pet.lv - 1) + 0.15 * petSp(pet.sp).r;

// おみやげを きめる（出かける ときに きめておく。ひけん・ひほうは 出ない）
function otRoll(pet, w, t) {
  const f = otPow(pet), u = t.u, el = petSp(pet.sp).el;
  const mats = {};
  const add = (k, n) => { if (n > 0) mats[k] = (mats[k] || 0) + n; };
  add(WORLD_MAT[w], Math.max(1, Math.round(u * 0.8 * f)));
  // ぞくせいの たま（ぞくせいなし・ほしの なかまは いろいろ）
  const orbs = Math.max(1, Math.round(u * 0.5 * f));
  for (let i = 0; i < orbs; i++) add(ELEM_MAT[el] || pick(Object.values(ELEM_MAT)), 1);
  const rare = [];
  if (Math.random() < Math.min(0.9, 0.06 * u * f)) rare.push(WORLD_RARE[w][0]);
  if (t.h >= 8 && Math.random() < 0.05 * f) rare.push(WORLD_RARE[w][1]);
  const eggP = t.h >= 8 ? 0.2 : t.h >= 4 ? 0.08 : 0;
  const egg = Math.random() < eggP ? (Math.random() < 0.15 * f ? 1 : 0) : -1;
  return { coin: Math.round(15 * u * f), mats, rare, egg, xp: 2 * u };
}

// ---------- なかま画面の「おつかい」タブ ----------
function otsukaiTab() {
  const n = otSlots(), list = otList();
  let html = `<p class="note">あいぼう いがいの なかまを 国へ おつかいに 出せるよ。<br>かえってくると おみやげを もってくる！</p><div class="otlist">`;
  for (let i = 0; i < 3; i++) {
    const o = list[i];
    if (i >= n) {
      html += `<div class="otslot lock">🔒 ${i === 1 ? "なかまずかんを 10しゅるい あつめると ふえる" : "まおうを たおすと ふえる"}</div>`;
    } else if (!o) {
      html += `<button class="otslot empty" onclick="otPickPet()">＋ おつかいに 出す なかまを えらぶ</button>`;
    } else {
      const pet = S.pets.find((p) => p.u === o.u), sp = petSp(pet.sp), wd = WORLDS.find((x) => x.id === o.w);
      const left = o.end - Date.now(), pct = Math.min(100, ((Date.now() - o.start) / (o.end - o.start)) * 100);
      html += `<div class="otslot" style="--pc:${ELEMENTS[sp.el].color}"><span class="pem2">${sp.em}</span>
        <span class="otinfo"><b>${sp.name} <small>Lv${pet.lv}</small></b><small>${wd.icon} ${wd.name}${left <= 0 ? "から かえってきた！" : "へ おつかい中"}</small>
        <span class="bar xb"><i style="width:${pct}%"></i></span></span>
        ${left <= 0 ? `<button class="big-btn primary otgo" onclick="otReturn(${i})">むかえる</button>` : `<span class="otleft">あと<br><b>${otLeftText(left)}</b></span>`}</div>`;
    }
  }
  return html + `</div><p class="small">おみやげ：その国の そざい・なかまの ぞくせいの たま・コイン。ときどき レアな そざいや タマゴも！<br>Lvが 高い なかま・レアな なかまほど たくさん もってくるよ。</p>`;
}
function otLeftText(ms) {
  const m = Math.ceil(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}じかん${m % 60 ? m % 60 + "ふん" : ""}` : `${m}ふん`;
}

// おつかいに 出す なかまを えらぶ
function otPickPet() {
  snd("tap");
  const list = S.pets.filter((p) => p.u !== S.partner && !onErrand(p.u));
  if (!list.length) { toast(S.pets.length <= 1 ? "あいぼう いがいの なかまが いると おつかいに 出せるよ" : "出せる なかまが いないよ"); return; }
  list.sort((a, b) => otPow(b) - otPow(a));
  modal(`<div class="mtitle">だれを おつかいに 出す？</div><div class="plist sm">${list.map((p) => petCard(p, `otPickWorld(${p.u})`)).join("")}</div>
    <button class="big-btn" onclick="closeModal()">とじる</button>`);
}
let otSel = { u: 0, w: "" };
// 行き先と 時間を えらぶ
function otPickWorld(u) {
  snd("tap");
  otSel = { u, w: otSel.w || WORLDS[0].id };
  const pet = S.pets.find((p) => p.u === u), sp = petSp(pet.sp);
  modal(`<div class="mtitle">${sp.em} ${sp.name}の おつかい</div>
    <div class="sub">どこへ 行く？</div>
    <div class="otworlds">${WORLDS.map((x) => `<button class="${x.id === otSel.w ? "on" : ""}" onclick="otSetWorld(this,'${x.id}')"><span>${x.icon}</span>${x.name}<small>${MATS[WORLD_MAT[x.id]].em}</small></button>`).join("")}</div>
    <div class="sub">どれくらい？</div>
    <div class="ottimes">${OT_TIMES.map((t, i) => `<button class="big-btn ${i === 2 ? "primary" : ""}" onclick="otSend(${i})">${t.h}じかん <small>（${t.name}）</small></button>`).join("")}</div>
    <p class="small">ながく 行くほど おみやげが ふえるよ。</p>
    <button class="big-btn" onclick="otPickPet()">◀ なかまを えらびなおす</button>`);
}
// 行き先を かえる（ポップアップは そのまま、えらんだ ボタンだけ かえる）
function otSetWorld(btn, w) {
  snd("tap"); otSel.w = w;
  btn.parentElement.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === btn));
}
function otSend(ti) {
  const pet = S.pets.find((p) => p.u === otSel.u), t = OT_TIMES[ti];
  if (!pet || pet.u === S.partner || onErrand(pet.u) || otList().length >= otSlots()) return;
  const now = Date.now();
  otList().push({ u: pet.u, w: otSel.w, h: t.h, start: now, end: now + t.h * OT_HOUR, rw: otRoll(pet, otSel.w, t) });
  save(); snd("ok"); closeModal(); nakama("otsukai");
  toast(`${petSp(pet.sp).name}が おつかいに 出かけたよ！`);
}

// ---------- かえってきた とき：なかまの クイズ ----------
// ニガテの 問題から 1問（ニガテが ない ときは おぼえた 問題から）。えらぶ 形の 問題だけ
function otQuiz() {
  const ng = nigateIds(), known = Object.keys(S.cards).filter((id) => S.cards[id].s > 0);
  for (const pool of [ng, known]) {
    const ids = shuffle(pool.slice());
    for (let i = 0; i < Math.min(ids.length, 12); i++) {
      try {
        const q = makeQ(ids[i]);
        if (q && q.kind === "choice" && q.opts && q.opts.length >= 2) return { id: q.id, head: q.head, cls: q.cls || "", opts: q.opts, ai: q.ai, explain: q.explain || "", ng: pool === ng };
      } catch (e) { /* 作れない 問題は とばす */ }
    }
  }
  return null;
}
function otReturn(i) {
  const o = otList()[i];
  if (!o || Date.now() < o.end) return;
  snd("special");
  // 問題は 1回 きめたら かわらない（よみこみ なおしで かえられない）
  if (o.quiz === undefined) { o.quiz = otQuiz(); save(); }
  if (!o.quiz) return otReward(i, false);
  const pet = S.pets.find((p) => p.u === o.u), sp = petSp(pet.sp), q = o.quiz;
  modal(`<div class="mtitle">${sp.em} ${sp.name}が かえってきた！</div>
    <p class="small">「おつかいの とちゅうで、この 問題を おもいだしたよ。<br>わかるかな？ 正解したら おみやげ 1.5ばい！」</p>
    <div class="otquiz">${q.ng ? `<div class="otng">👻 ニガテから</div>` : ""}${q.head}
    <div class="choices ${q.cls}">${q.opts.map((t, k) => `<button class="ch otch" onclick="otAnswer(${i},${k})">${t}</button>`).join("")}</div></div>`);
}
let otBusy = false;
function otAnswer(i, k) {
  const o = otList()[i];
  if (otBusy || !o || !o.quiz) return;
  otBusy = true;
  const q = o.quiz, ok = k === q.ai, btns = document.querySelectorAll(".otch");
  btns[q.ai].classList.add("right");
  if (!ok) btns[k].classList.add("wrong");
  if (ok) { snd("pinpon"); onCorrect(q.id); } else { snd("ng"); onWrong(q.id); }
  if (q.explain) { const p = document.createElement("p"); p.className = "otex"; p.textContent = (ok ? "⭕ せいかい！ " : "こたえ：") + q.explain; document.querySelector(".otquiz").appendChild(p); }
  setTimeout(() => { otBusy = false; otReward(i, ok); }, ok ? 1100 : 1800);
}

// おみやげを うけとる
function otReward(i, ok) {
  const o = otList()[i];
  if (!o) return;
  const pet = S.pets.find((p) => p.u === o.u), r = o.rw, k = ok ? 1.5 : 1;
  const coin = Math.round(r.coin * k);
  S.coins += coin;
  const got = [];
  Object.entries(r.mats).forEach(([m, n]) => { const c = ok ? Math.max(n + 1, Math.round(n * k)) : n; addMat(m, c); got.push(`${MATS[m].em}×${c}`); });
  r.rare.forEach((m) => { addMat(m); got.push(`${MATS[m].em}<small>${MATS[m].name}</small>`); });
  let eggTxt = "";
  if (r.egg >= 0) eggTxt = giveEgg(r.egg) ? `🥚 ${RARITY[r.egg].name}の タマゴ` : "🪙 +50（タマゴが いっぱいだったので）";
  if (r.egg >= 0 && eggTxt.startsWith("🪙")) S.coins += 50;
  // なかまの けいけんち
  let up = false;
  if (pet && pet.lv < MAX_PET_LV) {
    pet.xp += Math.round(r.xp * k);
    while (pet.lv < MAX_PET_LV && pet.xp >= xpNeed(pet.lv)) { pet.xp -= xpNeed(pet.lv); pet.lv++; up = true; }
    if (pet.lv >= MAX_PET_LV) pet.xp = 0;
  }
  otList().splice(i, 1);
  save(); snd(ok ? "special" : "ok");
  const sp = pet ? petSp(pet.sp) : null;
  modal(`<div class="mtitle">🎒 おみやげ${ok ? " <b class=\"otx\">1.5ばい！</b>" : ""}</div>
    ${sp ? `<div class="petbig sm" style="--pc:${ELEMENTS[sp.el].color}">${sp.em}</div>` : ""}
    <div class="okgift otgift"><span>🪙 +${coin}</span>${got.map((g) => `<span>${g}</span>`).join("")}${eggTxt ? `<span>${eggTxt}</span>` : ""}</div>
    ${sp ? `<p class="small">${sp.name}${up ? `は <b>Lv${pet.lv}</b>に あがった！` : pet.lv >= MAX_PET_LV ? "は もう Lv MAX！" : "も けいけんちを もらったよ"}</p>` : ""}
    ${ok ? "" : `<p class="small">まちがえた 問題は ニガテに 入るよ。バトルで リベンジしよう！</p>`}
    <button class="big-btn primary" onclick="closeModal();nakama('otsukai')">やったね！</button>`);
}

// ホームの おしらせ
const otBanner = () => (otBack().length ? `<button class="okbar otbar" onclick="go('nakama','otsukai')">🎒 おつかいから かえってきたよ！</button>` : "");
