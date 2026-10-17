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
    BANK[id] = Object.assign({ w, ch: chId, type: it.order ? "order" : it.input !== undefined ? "input" : "choice" }, it);
    return id;
  });
}

// ---------- 算数の計算問題（その場で数字をつくる） ----------
// MATH[id] = { name: カードの名前, gen() → { q, a, unit, ng(4択のとき), input(数字入力のとき), svg, ex } }
const MATH = {};

// 章：{ id, w: 国, g: 学年, sec: 区切り（漢字の 学年など）, name, icon, items: 出題する項目の id }
const CHAPTERS = [];
// 章の 学年を まとめて つける（保護者の 出題設定で つかう）
function setGrades(map) { CHAPTERS.forEach((c) => { if (map[c.id]) c.g = map[c.id]; }); }
// 漢字いがいの 章の 学年（その単元を おもに 習う 学年の めやす）
const GRADE_MAP = {
  w1: 6, w2: 6, w3: 4, w4: 4, w5: 5, w6: 6, w7: 4, w8: 4, w9: 3, w10: 4, w11: 5, w12: 5, w13: 5, w14: 5, w15: 5,
  m1: 5, m2: 4, m3: 6, m4: 5, m5: 5, m6: 6, m7: 5, m8: 6, m9: 4, m10: 6, m11: 5, m12: 6, m13: 6, m14: 4, m15: 5, m16: 6, m17: 6, m18: 5,
  s1: 6, s2: 6, s3: 5, s4: 6, s5: 6, s6: 5, s7: 6, s8: 5, s9: 6, s10: 6, s11: 5, s12: 5, s13: 6, s14: 6, s15: 6, s16: 4, s17: 5,
  h1: 6, h2: 6, h3: 6, h4: 6, h5: 6, p1: 6, p2: 6, p3: 6, g1: 5, g2: 5, g3: 5, g4: 4, g5: 5,
};
const applyGrades = () => setGrades(GRADE_MAP);

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
// 保護者の 出題設定（S.cfg）
//   g  ＝ ざっくり設定：この 学年までの 章を 出す（なし ＝ すべて）
//   ch ＝ くわしい設定：章ごとの オン／オフ（ざっくり設定より 優先）
//   at ＝ 最後に 変えた 時刻（ほかの 端末で 変えた 設定と くらべる）
function cfgChapterOn(cfg, ch) {
  if (!cfg) return true;
  if (cfg.ch && cfg.ch[ch.id] !== undefined) return !!cfg.ch[ch.id];
  return !cfg.g || (ch.g || 1) <= cfg.g;
}
function chapterOn(ch) { return cfgChapterOn(typeof S !== "undefined" && S && S.cfg, ch); }
// 前の版（kg：漢字の学年、off：お休みの章）の 設定を 新しい 形に なおす
function migrateCfg(cfg) {
  if (!cfg || (!cfg.kg && !cfg.off)) return cfg;
  const ch = cfg.ch || {};
  CHAPTERS.forEach((c) => {
    if (cfg.kg && c.w === "kanji" && !cfg.kg.includes(c.g)) ch[c.id] = false;
    if (cfg.off && cfg.off[c.id]) ch[c.id] = false;
  });
  return { g: cfg.g, ch, at: cfg.at || Date.now() };
}
// 設定の ようすを みじかい 文に する
function cfgSummary(cfg) {
  const n = cfg && cfg.ch ? Object.keys(cfg.ch).length : 0;
  return `${cfg && cfg.g ? `${cfg.g}年生まで` : "すべての 学年"}${n ? `（くわしい設定 ${n}章）` : ""}`;
}
const activeChapters = (w) => worldChapters(w).filter(chapterOn);
const chapterOf = (id) => CHAPTERS.find((c) => c.id === id);

// 章の じゅんばんから ティア と 属性を きめる
function prepareChapters() {
  applyGrades();
  WORLDS.forEach((w) => {
    const list = worldChapters(w.id);
    list.forEach((ch, i) => {
      // 区切り（sec）が あるときは、区切りの 中で ティアを きめる
      const grp = list.filter((c) => c.sec === ch.sec), j = grp.indexOf(ch);
      ch.idx = i; ch.no = j + 1;
      ch.tier = Math.min(6, 1 + Math.floor((j * 6) / grp.length));
      const seed = i + w.id.length * 3;
      ch.els = [ELS4[seed % 4], ELS4[(seed + 1 + (i % 2)) % 4]];
      ch.last = i === list.length - 1;
    });
  });
}

// ステージ n（1〜4）の 出題範囲：ステージ1は 章の はじめの 1/3、2は 2/3まで、3と ボスは ぜんぶ
// （新しい 問題は 出やすく、正解した 問題は 出にくいので、前の 問題は ふくしゅうとして ときどき 出る）
function stageItems(ch, n) {
  if (n >= 3) return ch.items.slice();
  const k = Math.ceil(ch.items.length / 3);
  const part = ch.items.slice(0, n * k);
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

// ステージの 名前（国ごとに ふんいきを かえる）［ステージ1, 2, 3, ボス］
const STAGE_NAMES = {
  kanji: ["もじの 入り口", "ふでの 小道", "すみの 森", "ヌシの 書院"],
  kotoba: ["ことばの 門", "ささやきの 道", "こだまの 谷", "ヌシの 舞台"],
  math: ["かずの 広場", "図形の めいろ", "計算の 塔", "ヌシの 研究室"],
  sci: ["実験の へや", "観察の 庭", "ふしぎの どうくつ", "ヌシの ラボ"],
  soc: ["れきしの 門", "地図の 道", "むかしの 町なみ", "ヌシの お城"],
};
const stageName = (ch, n) => (STAGE_NAMES[ch.w] || STAGE_NAMES.kanji)[n - 1];

// ステージの情報（バトルで つかう）
function stageInfo(ch, n) {
  return {
    key: `${ch.id}-${n}`, ch, n, tier: ch.tier, id: ch.tier,
    name: stageName(ch, n), bg: TBG[ch.tier],
    mat: TMAT[ch.tier][0], bmat: TMAT[ch.tier][1], final: ch.last && n === 4,
  };
}

// ---------- クリア状況 ----------
const stStars = (key) => (S.stClear || {})[key] || 0;
// 区切りの 最初の 章と、一度 遊んだ 章は ひらいている。ほかは 1つ前の（出題する）章を クリアすると ひらく
function chapterOpen(ch) {
  if (window.PQ_DEBUG && window.PQ_OPEN) return true; // デバッグ：ぜんぶ ひらく
  const list = activeChapters(ch.w).filter((c) => c.sec === ch.sec), i = list.indexOf(ch);
  if (i <= 0 || stStars(`${ch.id}-1`) > 0) return true;
  return chapterDone(list[i - 1]);
}
const stageOpen = (ch, n) => chapterOpen(ch) && (n === 1 || (window.PQ_DEBUG && window.PQ_OPEN) || stStars(`${ch.id}-${n - 1}`) > 0);
const chapterDone = (ch) => stStars(`${ch.id}-4`) > 0;
const chapterStars = (ch) => [1, 2, 3, 4].reduce((a, n) => a + stStars(`${ch.id}-${n}`), 0);
function worldProgress(w) {
  const list = activeChapters(w);
  return { done: list.filter(chapterDone).length, all: list.length };
}

// ---------- 地図の画面 ----------
// 国えらび
function map() {
  bgmHere = "home";
  const ng = nigateIds();
  const rec = recommend();
  setScreen(`${topBar("ぼうけん")}
    <button class="big-btn chartbtn" onclick="showChart()">📘 ぞくせいの あいしょう</button>
    ${rec ? `<button class="stage rec" onclick="openChapter('${rec.id}')" style="--b1:#fff7cc;--b2:#ffe066"><span class="snum">⭐</span><span class="sinfo"><b>きょうの おすすめ</b><small>${WORLDS.find((w) => w.id === rec.w).icon} ${rec.name}</small></span><span class="sstate">▶</span></button>` : ""}
    <div class="maplist">
      ${WORLDS.map((w) => {
        const p = worldProgress(w.id);
        return `<button class="stage world" onclick="openWorld('${w.id}')" style="--b1:${w.bg[0]};--b2:${w.bg[1]}">
          <span class="snum">${w.icon}</span><span class="sinfo"><b>${w.name}</b><small>${p.all ? `${p.done} / ${p.all} しょう クリア` : "💤 おやすみ中"}</small>
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

// その国で つぎに 遊ぶ章：区切りごとの いちばん手前の 未クリアの章のうち、進めている 区切りを 優先
function nextChapter(w) {
  const list = activeChapters(w);
  const fr = [...new Set(list.map((c) => c.sec))].map((s) => list.filter((c) => c.sec === s))
    .map((g) => ({ g, c: g.find((c) => !chapterDone(c)) })).filter((x) => x.c);
  const go = fr.find((x) => x.g.some(chapterDone)) || fr[0];
  return go && go.c;
}
// きょうの おすすめ：各国の つぎの 章から（日替わり）
function recommend() {
  const cands = WORLDS.map((w) => nextChapter(w.id)).filter(Boolean);
  if (!cands.length) return null;
  const d = new Date();
  return cands[(d.getDate() + d.getMonth()) % cands.length];
}

let curWorld = "kanji";
const curSec = {}; // 国ごとに えらんでいる 区切り（漢字の 学年）
function openWorld(w, sec) {
  if (w) curWorld = w;
  bgmHere = curWorld;
  snd("tap");
  const W = WORLDS.find((x) => x.id === curWorld);
  const all = activeChapters(curWorld);
  // 区切りが ある国は、タブで 1つの 区切りだけ 見せる
  const secs = [...new Set(all.map((c) => c.sec))].filter(Boolean);
  if (sec) curSec[curWorld] = sec;
  if (secs.length && !secs.includes(curSec[curWorld])) { const nx = nextChapter(curWorld); curSec[curWorld] = nx ? nx.sec : secs[0]; }
  const list = secs.length ? all.filter((c) => c.sec === curSec[curWorld]) : all;
  const tabs = secs.length > 1 ? `<div class="tabs wtabs">${secs.map((s) => {
    const g = all.filter((c) => c.sec === s);
    const lb = (typeof SEC_LABEL !== "undefined" && SEC_LABEL[s]) || { icon: "", name: s };
    return `<button class="${curSec[curWorld] === s ? "on" : ""}" onclick="openWorld('', '${s}')"><span class="ti">${lb.icon}</span><small>${lb.name}</small><small>${g.filter(chapterDone).length}/${g.length}</small></button>`;
  }).join("")}</div>` : "";
  setScreen(`${topBar(W.name, "map")}${tabs}
    <div class="maplist">${list.length ? list.map((ch, i) => {
      const open = chapterOpen(ch), done = chapterDone(ch), st = chapterStars(ch);
      const els = ch.els.map((e) => ELEMENTS[e].icon).join("");
      return `<button class="stage ${open ? "" : "locked"} ${ch.tier === 6 ? "final" : ""}" ${open ? `onclick="openChapter('${ch.id}')"` : ""} style="--b1:${TBG[ch.tier][0]};--b2:${TBG[ch.tier][1]}">
        <span class="snum">${ch.icon || i + 1}</span>
        <span class="sinfo"><b>${i + 1}. ${ch.name}</b><small>${open ? `てき ${els}${ch.tier >= 2 ? "❓" : ""}　そざい ${MATS[TMAT[ch.tier][0]].em}${MATS[TMAT[ch.tier][1]].em}　⭐${st}/12` : "まえの 章を クリアしよう"}</small></span>
        <span class="sstate">${!open ? "🔒" : done ? "👑" : "▶"}</span></button>`;
    }).join("") : `<div class="chhead" style="--b1:#fff;--b2:#f3ecff"><div class="bigicon">💤</div><b>いまは おやすみ中</b><small>おうちの人の せっていで、この国の 章は お休みに なっているよ</small></div>`}</div>`, "bg-map");
}

function openChapter(id) {
  const ch = chapterOf(id);
  curWorld = ch.w;
  bgmHere = curWorld;
  snd("tap");
  setScreen(`${topBar(ch.name, "openWorld")}
    <div class="chhead" style="--b1:${TBG[ch.tier][0]};--b2:${TBG[ch.tier][1]}"><div class="bigicon">${ch.icon || "📘"}</div><b>${ch.name}</b>
      <small>${ch.desc || ""}</small><small>カード ${ch.items.filter((x) => S.cards[x] && S.cards[x].s > 0).length} / ${ch.items.length} まい</small></div>
    <div class="maplist">${[1, 2, 3, 4].map((n) => {
      const open = stageOpen(ch, n), st = stStars(`${ch.id}-${n}`);
      const ens = stageEnemies(ch, n);
      return `<button class="stage ${open ? "" : "locked"} ${ch.tier === 6 ? "final" : ""}" ${open ? `onclick="startBattle('${ch.id}-${n}')"` : ""} style="--b1:${TBG[ch.tier][0]};--b2:${TBG[ch.tier][1]}">
        <span class="snum">${n === 4 ? "👑" : n}</span>
        <span class="sinfo"><b>${n === 4 ? `ボス：${stageName(ch, n)}` : `ステージ${n}：${stageName(ch, n)}`}</b><small>${open ? `てき ${ens.map((e) => (e.rand ? "❓" : ELEMENTS[e.el].icon)).join(" ")}` : "まえの ステージを クリアしよう"}</small></span>
        <span class="sstate stars">${!open ? "🔒" : "⭐".repeat(st) + "☆".repeat(3 - st)}</span></button>`;
    }).join("")}</div>`, "bg-map");
}
