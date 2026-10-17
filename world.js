// ===== 国・章・ステージ（ぼうけんの地図） =====
"use strict";

// 国の一覧（章は各 c_*.js で CHAPTERS に追加する）
const WORLDS = [
  { id: "kanji", name: "漢字の国", icon: "📖", bg: ["#ffe3ef", "#ffb3d1"] },
  { id: "kotoba", name: "ことばの国", icon: "💬", bg: ["#fff3cf", "#ffd66b"] },
  { id: "math", name: "算数の国", icon: "🔢", bg: ["#dff3ff", "#8cc9ff"] },
  { id: "sci", name: "理科の国", icon: "🔬", bg: ["#e2f8e4", "#86d993"] },
  { id: "soc", name: "社会の国", icon: "🗾", bg: ["#efe6ff", "#b9a2ff"] },
];

// ---------- 問題バンク（ことば・理科・社会・算数の知識問題） ----------
// BANK[id] = { w: 国, q: 問題, a: 正解, ng: まちがい, ex: 解説, t: カードの名前, type: choice/order/input, svg: 図 }
const BANK = {};
function bank(w, chId, list) {
  return list.map((it, i) => {
    const id = `q:${chId}-${i + 1}`;
    BANK[id] = Object.assign({ w, type: it.order ? "order" : it.input !== undefined ? "input" : "choice" }, it);
    return id;
  });
}

// ---------- 算数の計算問題（その場で数字をつくる） ----------
// MATH[id] = { name: カードの名前, gen() → { q, a, unit, ng(4択のとき), input(数字入力のとき), svg, ex } }
const MATH = {};

// 章：{ id, w: 国, name, icon, items: 出題する項目の id }
const CHAPTERS = [];

// ---------- 敵のつよさ（ティア 1〜6） ----------
const TIER = [null,
  { hp: 40, atk: 7, bhp: 130, batk: 11 },
  { hp: 90, atk: 14, bhp: 260, batk: 19 },
  { hp: 155, atk: 21, bhp: 420, batk: 27 },
  { hp: 225, atk: 29, bhp: 580, batk: 35 },
  { hp: 310, atk: 37, bhp: 760, batk: 43 },
  { hp: 390, atk: 41, bhp: 1250, batk: 46 },
];
// ティアごとの そざい [ふつうの敵, ボス]
const TMAT = [null, ["kinoko", "donguri"], ["kai", "shizuku"], ["yogan", "honoo"], ["yuki", "hyou"], ["denki", "kaku"], ["yami", "yami"]];
const TBG = [null, ["#c8f7c5", "#7fd88a"], ["#bfe9ff", "#ffe9a8"], ["#ffd0b0", "#ff8a65"], ["#eef7ff", "#b8d8f5"], ["#e6dcff", "#9f8cff"], ["#3a2a5c", "#1d1433"]];
const ELS4 = ["fire", "water", "thunder", "leaf"];
const EL_PREFIX = { fire: "メラ", water: "アクア", thunder: "ビリ", leaf: "リーフ", none: "ゴロ" };
const SHAPE_NAME = { blob: "ぷるる", ghost: "ふわりん", rock: "ゴロン", mush: "キノコロ", crab: "カニッチ" };
const SHAPES = ["blob", "ghost", "rock", "mush", "crab"];

const worldChapters = (w) => CHAPTERS.filter((c) => c.w === w);
const chapterOf = (id) => CHAPTERS.find((c) => c.id === id);

// 章の じゅんばんから ティア と 属性を きめる
function prepareChapters() {
  WORLDS.forEach((w) => {
    const list = worldChapters(w.id);
    list.forEach((ch, i) => {
      ch.idx = i;
      ch.tier = Math.min(6, 1 + Math.floor((i * 6) / list.length));
      const seed = i + w.id.length * 3;
      ch.els = [ELS4[seed % 4], ELS4[(seed + 1 + (i % 2)) % 4]];
      ch.last = i === list.length - 1;
    });
  });
}

// ステージ n（1〜4）の 出題範囲：1〜3は 章の 1/3ずつ、4（ボス）は ぜんぶ
function stageItems(ch, n) {
  if (n === 4) return ch.items.slice();
  const k = Math.ceil(ch.items.length / 3);
  const part = ch.items.slice((n - 1) * k, n * k);
  return part.length >= 3 ? part : ch.items.slice();
}

// 中立の属性（つよくも よわくもない）… ボスの「きかない」に つかう
function neutralOf(el) { return ELS4.find((x) => x !== el && x !== BEATS[el] && BEATS[x] !== el); }

function makeEnemy(ch, el, boss, n, k) {
  const T = TIER[ch.tier];
  const shape = boss ? (ch.last ? "boss" : SHAPES[(ch.idx + 2) % SHAPES.length]) : SHAPES[(ch.idx + n + k) % SHAPES.length];
  const e = {
    name: boss ? `${ch.boss || ch.name}の ヌシ` : `${EL_PREFIX[el === "rand" ? "none" : el]}${SHAPE_NAME[shape]}`,
    hp: Math.round((boss ? T.bhp : T.hp) * (0.95 + ((n + k) % 3) * 0.05)), atk: boss ? T.batk : T.atk,
    el, shape, color: ELEMENTS[el === "rand" ? "star" : el].color, boss,
  };
  if (el === "rand") { e.name = "まぼろしスライム"; e.shape = "blob"; e.color = "#b388ff"; }
  return e;
}

// ステージの 敵の ならび
function stageEnemies(ch, n) {
  const [a, b] = ch.els;
  let list;
  if (n === 1) list = [[a], [a]];
  else if (n === 2) list = [[b], [a]];
  else if (n === 3) list = [[ch.tier >= 2 ? "rand" : b], [b]];
  else list = [[b], [a, true]];
  return list.map(([el, boss], k) => {
    const e = makeEnemy(ch, el, !!boss, n, k);
    if (e.el === "rand") { e.rand = true; e.el = pick(ELS4); }
    // ボスの とくべつな ちから
    if (boss && ch.last) e.phases = [a, b, ELS4.find((x) => x !== a && x !== b)];
    else if (boss && ch.tier >= 3) e.imm = neutralOf(a);
    if (!boss && ch.tier >= 5 && n === 2 && k === 0) { e.imm = "none"; e.name = "まほうゴーレム"; e.shape = "rock"; }
    return e;
  });
}

// ステージの情報（バトルで つかう）
function stageInfo(ch, n) {
  return {
    key: `${ch.id}-${n}`, ch, n, tier: ch.tier, id: ch.tier,
    name: `${ch.name} ${n === 4 ? "ボス" : n}`, bg: TBG[ch.tier],
    mat: TMAT[ch.tier][0], bmat: TMAT[ch.tier][1], final: ch.last && n === 4,
  };
}

// ---------- クリア状況 ----------
const stStars = (key) => (S.stClear || {})[key] || 0;
function chapterOpen(ch) {
  if (ch.idx === 0) return true;
  const prev = worldChapters(ch.w)[ch.idx - 1];
  return stStars(`${prev.id}-4`) > 0;
}
const stageOpen = (ch, n) => chapterOpen(ch) && (n === 1 || stStars(`${ch.id}-${n - 1}`) > 0);
const chapterDone = (ch) => stStars(`${ch.id}-4`) > 0;
const chapterStars = (ch) => [1, 2, 3, 4].reduce((a, n) => a + stStars(`${ch.id}-${n}`), 0);
function worldProgress(w) {
  const list = worldChapters(w);
  return { done: list.filter(chapterDone).length, all: list.length };
}

// ---------- 地図の画面 ----------
// 国えらび
function map() {
  const ng = nigateIds();
  const rec = recommend();
  setScreen(`${topBar("ぼうけん")}
    <button class="big-btn chartbtn" onclick="showChart()">📘 ぞくせいの あいしょう</button>
    ${rec ? `<button class="stage rec" onclick="openChapter('${rec.id}')" style="--b1:#fff7cc;--b2:#ffe066"><span class="snum">⭐</span><span class="sinfo"><b>きょうの おすすめ</b><small>${WORLDS.find((w) => w.id === rec.w).icon} ${rec.name}</small></span><span class="sstate">▶</span></button>` : ""}
    <div class="maplist">
      ${WORLDS.map((w) => {
        const p = worldProgress(w.id);
        return `<button class="stage world" onclick="openWorld('${w.id}')" style="--b1:${w.bg[0]};--b2:${w.bg[1]}">
          <span class="snum">${w.icon}</span><span class="sinfo"><b>${w.name}</b><small>${p.done} / ${p.all} しょう クリア</small>
          <span class="bar wb"><i style="width:${p.all ? (p.done / p.all) * 100 : 0}%"></i></span></span><span class="sstate">▶</span></button>`;
      }).join("")}
      <button class="stage nigate ${ng.length ? "" : "locked"}" ${ng.length ? `onclick="startBattle('nigate')"` : ""}>
        <span class="snum">👻</span><span class="sinfo"><b>ニガテモンスター たいじ</b><small>${ng.length ? `${ng.length}体 うろついている！ たおすと 💎` : "まちがえた問題が モンスターになるよ"}</small></span><span class="sstate">${ng.length ? "▶" : ""}</span></button>
    </div>`, "bg-map");
  if (!S.tut.map2) {
    S.tut.map2 = 1; save();
    modal(`<div class="mtitle">ぼうけんの ヒント</div><div class="bigicon">🗺️</div>
      <p>5つの 国が あるよ。<b>すきな 国から</b> ぼうけんしよう！<br>章を クリアすると つぎの 章が ひらくよ。</p>
      <p>てきには <b>ぞくせい</b> があって、あいしょうの いい ぶきなら <b>2ばい</b>！<br>てきを たおすと <b>そざい</b> が 手に はいって、ショップで そうびが つくれるよ。</p>
      <p>⭐は ステージの できばえ（ノーミスで ⭐3つ）。</p>
      <button class="big-btn primary" onclick="closeModal()">わかった！</button>`);
  }
}

// きょうの おすすめ：まだ クリアしていない章のうち、各国の いちばん手前（日替わり）
function recommend() {
  const cands = WORLDS.map((w) => worldChapters(w.id).find((c) => !chapterDone(c))).filter(Boolean);
  if (!cands.length) return null;
  const d = new Date();
  return cands[(d.getDate() + d.getMonth()) % cands.length];
}

let curWorld = "kanji";
function openWorld(w) {
  if (w) curWorld = w;
  snd("tap");
  const W = WORLDS.find((x) => x.id === curWorld);
  const list = worldChapters(curWorld);
  setScreen(`${topBar(W.name, "map")}
    <div class="maplist">${list.map((ch) => {
      const open = chapterOpen(ch), done = chapterDone(ch), st = chapterStars(ch);
      const els = ch.els.map((e) => ELEMENTS[e].icon).join("");
      return `<button class="stage ${open ? "" : "locked"} ${ch.tier === 6 ? "final" : ""}" ${open ? `onclick="openChapter('${ch.id}')"` : ""} style="--b1:${TBG[ch.tier][0]};--b2:${TBG[ch.tier][1]}">
        <span class="snum">${ch.icon || ch.idx + 1}</span>
        <span class="sinfo"><b>${ch.idx + 1}. ${ch.name}</b><small>${open ? `てき ${els}${ch.tier >= 2 ? "❓" : ""}　そざい ${MATS[TMAT[ch.tier][0]].em}${MATS[TMAT[ch.tier][1]].em}　⭐${st}/12` : "まえの 章を クリアしよう"}</small></span>
        <span class="sstate">${!open ? "🔒" : done ? "👑" : "▶"}</span></button>`;
    }).join("")}</div>`, "bg-map");
}

function openChapter(id) {
  const ch = chapterOf(id);
  curWorld = ch.w;
  snd("tap");
  setScreen(`${topBar(ch.name, "openWorld")}
    <div class="chhead" style="--b1:${TBG[ch.tier][0]};--b2:${TBG[ch.tier][1]}"><div class="bigicon">${ch.icon || "📘"}</div><b>${ch.name}</b>
      <small>${ch.desc || ""}</small><small>カード ${ch.items.filter((x) => S.cards[x] && S.cards[x].s > 0).length} / ${ch.items.length} まい</small></div>
    <div class="maplist">${[1, 2, 3, 4].map((n) => {
      const open = stageOpen(ch, n), st = stStars(`${ch.id}-${n}`);
      const ens = stageEnemies(ch, n);
      return `<button class="stage ${open ? "" : "locked"} ${ch.tier === 6 ? "final" : ""}" ${open ? `onclick="startBattle('${ch.id}-${n}')"` : ""} style="--b1:${TBG[ch.tier][0]};--b2:${TBG[ch.tier][1]}">
        <span class="snum">${n === 4 ? "👑" : n}</span>
        <span class="sinfo"><b>${n === 4 ? "ボス ステージ" : `ステージ ${n}`}</b><small>${open ? `てき ${ens.map((e) => (e.rand ? "❓" : ELEMENTS[e.el].icon)).join(" ")}` : "まえの ステージを クリアしよう"}</small></span>
        <span class="sstate stars">${!open ? "🔒" : "⭐".repeat(st) + "☆".repeat(3 - st)}</span></button>`;
    }).join("")}</div>`, "bg-map");
}
