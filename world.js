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
function bank(w, chId, list, offset = 0) {
  return list.map((it, i) => {
    const id = `q:${chId}-${offset + i + 1}`;
    BANK[id] = Object.assign({ w, ch: chId, type: it.order ? "order" : it.input !== undefined ? "input" : "choice" }, it);
    return id;
  });
}

// 章に 問題を 追加する（前の 問題の 番号は かえない。あたらしい 問題は 章の 中に まんべんなく まぜる）
// 問題を べつの 章へ うつす（カードの 番号は かえない。t：問題の 名前）
function moveQ(t, from, to) {
  const a = CHAPTERS.find((c) => c.id === from), b = CHAPTERS.find((c) => c.id === to);
  const id = a && a.items.find((x) => BANK[x] && BANK[x].t === t);
  if (!id || !b) return;
  a.items = a.items.filter((x) => x !== id);
  b.items.push(id);
}
function addQs(w, chId, list) {
  const ch = CHAPTERS.find((c) => c.id === chId);
  const offset = Object.keys(BANK).filter((k) => k.startsWith(`q:${chId}-`)).length;
  const nw = bank(w, chId, list, offset), old = ch.items, merged = [];
  let j = 0;
  old.forEach((o, i) => { merged.push(o); const to = Math.round(((i + 1) * nw.length) / old.length); while (j < to) merged.push(nw[j++]); });
  while (j < nw.length) merged.push(nw[j++]);
  ch.items = merged;
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
// 中学受験用の 章と 問題（保護者の 設定で のぞける）
const EXAM_CH = new Set(["w1", "w2", "m3", "m7", "m9", "m13", "m14", "m16", "m17"]);
const EXAM_T = new Set(["浮力", "浮力の計算", "フェーン現象", "加藤高明", "電流計の端子"]);
function applyGrades() {
  setGrades(GRADE_MAP);
  CHAPTERS.forEach((c) => { c.exam = EXAM_CH.has(c.id); });
  Object.values(BANK).forEach((b) => { if (EXAM_T.has(b.t)) b.exam = true; });
}

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
  // 中学受験用の 章を のぞく 設定
  if (cfg.noExam && ch.exam) return false;
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
  return { g: cfg.g, ch, noExam: cfg.noExam, at: cfg.at || Date.now() };
}
// 設定の ようすを みじかい 文に する
function cfgSummary(cfg) {
  const n = cfg && cfg.ch ? Object.keys(cfg.ch).length : 0;
  return `${cfg && cfg.g ? `${cfg.g}年生まで` : "すべての 学年"}${cfg && cfg.noExam ? "・中学受験用を のぞく" : ""}${n ? `（くわしい設定 ${n}章）` : ""}`;
}
const activeChapters = (w) => worldChapters(w).filter(chapterOn);
const chapterOf = (id) => CHAPTERS.find((c) => c.id === id) || (typeof EXTRA_CH !== "undefined" ? EXTRA_CH.find((c) => c.id === id) : null);

// 章の じゅんばんから ティア と 属性を きめる
function prepareChapters() {
  applyGrades();
  WORLDS.forEach((w) => {
    const list = worldChapters(w.id);
    list.forEach((ch, i) => {
      // 区切り（sec）が あるときは、区切りの 中で ティアを きめる
      const grp = list.filter((c) => c.sec === ch.sec), j = grp.indexOf(ch);
      ch.idx = i; ch.no = j + 1;
      // 漢字の国の 1〜3年生エリアは やさしめ（1年：ティア1〜2、2年：1〜3、3年：1〜4）
      const g = w.id === "kanji" ? Number(String(ch.sec || "").slice(1)) : 0, top = { 1: 2, 2: 3, 3: 4 }[g] || 6;
      ch.tier = Math.min(top, 1 + Math.floor((j * top) / grp.length));
      const seed = i + w.id.length * 3;
      ch.els = [ELS4[seed % 4], ELS4[(seed + 1 + (i % 2)) % 4]];
      ch.last = i === list.length - 1;
    });
  });
}

// ステージ n（1〜4）の 出題範囲：ステージ1は 章の はじめの 1/3、2は 2/3まで、3と ボスは ぜんぶ
// （新しい 問題は 出やすく、正解した 問題は 出にくいので、前の 問題は ふくしゅうとして ときどき 出る）
function stageItems(ch, n) {
  const all = ch.items.filter(itemOn);
  const items = all.length >= 3 ? all : ch.items.slice();
  if (n >= 3) return items;
  const k = Math.max(Math.ceil(items.length / 3), Math.min(10, items.length)); // ステージ1でも 10種類 以上
  const part = items.slice(0, n * k);
  return part.length >= 3 ? part : items.slice();
}
// 中学受験用の 問題（章の 中の 一部）… 保護者の 設定で のぞける
const EXAM_ITEMS = new Set(["m:yokai", "m:kitai", "m:bane", "m:furiko", "m:nenrei", "m:tsurukame", "m:wasa", "m:ryusui"]);
const isExamItem = (id) => EXAM_ITEMS.has(id) || !!(typeof BANK !== "undefined" && BANK[id] && BANK[id].exam);
function itemOn(id) { const c = typeof S !== "undefined" && S && S.cfg; return !(c && c.noExam && isExamItem(id)); }

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
  // 5年生・6年生の 強い てき（hiken.js）。ボスは ひけんで ないと やぶれない バリアを もつ
  const H = typeof hardStats === "function" ? hardStats(ch, boss) : null;
  if (H) { e.hp = Math.round(H.hp * (0.95 + ((n + k) % 3) * 0.05)); e.atk = H.atk; if (boss) e.barrier = ch.w; }
  if (el === "rand") { e.name = "まぼろしスライム"; e.shape = "blob"; e.color = "#b388ff"; }
  return e;
}

// ステージの 敵の ならび
function stageEnemies(ch, n) {
  if (ch.maou) return maouEnemies(ch);
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
// 章ごとの ステージ名（ステージ1〜3 と ボス）。章の テーマと 国の 場所から つけた なまえ
const CH_STAGE_NAMES = {
  // 漢字の国：わかばの森
  k1a: ["かぞえうたの 小道", "にじいろの はらっぱ", "いろえんぴつの 森", "ヌシの アトリエ"],
  k1b: ["おひさまの 丘", "あまつぶの 小道", "くもの ゆりかご", "ヌシの 天空だい"],
  k1c: ["かけっこ 広場", "たいそうの 草はら", "ジャンプの いずみ", "ヌシの どうじょう"],
  k1d: ["とうこうの 道", "こうていの すな場", "しょうてんがいの 角", "ヌシの 大時計台"],
  // はなの丘
  k2a: ["だんらんの にわ", "おるすばんの へや", "ゆうげの 台所", "ヌシの 大やしき"],
  k2b: ["はるかぜの 坂", "せみしぐれの 林", "もみじの 小道", "ヌシの こよみ塔"],
  k2c: ["ちょうちょの 花畑", "めだかの 小川", "どんぐりの 林", "ヌシの 大樹"],
  k2d: ["こくばんの へや", "ずこうの 作業台", "おんがく室の 回ろう", "ヌシの 図書館"],
  k2e: ["きたかぜの 四つ角", "ひがしの 商店街", "みなみの えき前", "ヌシの 見はらし台"],
  k2f: ["はしれ はしれ 坂", "よみきかせの 木かげ", "うたごえの 広場", "ヌシの げき場"],
  k2g: ["きいろい 花道", "まるい 池の ほとり", "ふとい 木の 下", "ヌシの いろどり城"],
  k2h: ["おちゃの 間", "ゆみやの 練習場", "こめぐらの うら", "ヌシの 道具ぐら"],
  // なみの海辺
  k3a: ["ほうたいの 浜", "くすり箱の いわば", "しんさつ室の 灯台", "ヌシの 大病院"],
  k3b: ["みなとの えき", "はしの たもと", "しまの 船着き場", "ヌシの 県ちょう"],
  k3c: ["れんしゅうの 浜辺", "ふでばこの 入り江", "もんだいの 岩場", "ヌシの 研究じょ"],
  k3d: ["しおかぜの 浜", "なみうちぎわ", "さんごの 入り江", "ヌシの うず潮"],
  k3e: ["しあわせの 貝がら浜", "なみだの みさき", "ゆうきの いわば", "ヌシの まつり舞台"],
  k3f: ["およぎの 入り江", "かけっこの すな浜", "がけの のぼり道", "ヌシの 灯台"],
  k3g: ["まちあわせの さんばし", "おくりものの 浜", "しあいの 広場", "ヌシの 大あみ"],
  k3h: ["りょうしの みなと", "おみせの 通り", "やくばの まど口", "ヌシの 大会社"],
  k3i: ["ようふく屋の 前", "にもつの そうこ", "にわの ある家", "ヌシの デパート"],
  k3j: ["あさやけの 浜", "まひるの すな丘", "よるの みなと", "ヌシの 時の塔"],
  // こだまの山
  k4a: ["北のくにの 峠", "ゆきぐにの 道", "みずうみの 里", "ヌシの 天守かく"],
  k4b: ["西のくにの 峠", "みかん山の 坂", "火の山の ふもと", "ヌシの 大がらん"],
  k4c: ["ねがいの ほこら", "ゆうきの つり橋", "きぼうの 見はらし岩", "ヌシの 山小屋"],
  k4d: ["れんしゅうの 山道", "じっけんの 岩屋", "きろくの 石ひ", "ヌシの 大教室"],
  k4e: ["はたの なびく 丘", "ぎかいの 石だん", "ほうりつの 門", "ヌシの ぎじどう"],
  k4f: ["わかばの 谷", "さくらの 尾根", "まつかぜの 峠", "ヌシの 雪けい"],
  k4g: ["ぼく場の 道", "すみやき小屋", "りょう師の 沢", "ヌシの 大農園"],
  k4h: ["ものさしの 尾根", "はかりの 岩", "一億の 星空", "ヌシの 計算城"],
  k4i: ["なかまの たき火", "まごの まつ里", "きょうりょくの 橋", "ヌシの 大広間"],
  k4j: ["とびはねる 谷", "つづら おり道", "ころがり 坂", "ヌシの 山頂"],
  // むかしの町
  k5a: ["ようがんの 道", "じしゃくの 小路", "ゆげの 湯治場", "ヌシの からくり屋敷"],
  k5b: ["ゆめみ 通り", "まよい 小路", "なさけの 長屋", "ヌシの 茶屋"],
  k5c: ["ぶけ屋敷の 道", "おふれの 高札場", "せいじの 大門", "ヌシの 奉行所"],
  k5d: ["てらこやの 縁側", "しょどうの 間", "そろばんの 座敷", "ヌシの 学問所"],
  k5e: ["はたおりの 家", "かまどの 土間", "ちょきん箱の 蔵", "ヌシの 大店"],
  k5f: ["かじ屋の 通り", "ぎょせんの 河岸", "にぎわう 市場", "ヌシの 大問屋"],
  k5g: ["わたしぶねの 渡し", "ぜにの かけ橋", "ひっこしの 坂", "ヌシの 関所"],
  k5h: ["ぶしの 屋敷町", "まき物の 書庫", "はいくの いおり", "ヌシの お城"],
  k5i: ["きそくの 門", "じょうけんの 番所", "ゆるしの 木戸", "ヌシの お白州"],
  k5j: ["ちょうちん 横丁", "かんざし 小路", "ふうりん 通り", "ヌシの 五重塔"],
  // ほしの塔
  k6a: ["しんぞうの 回廊", "のうの 迷路", "こきゅうの 階だん", "ヌシの 医務室"],
  k6b: ["うちゅうの 窓", "わくせいの 回廊", "銀河の らせん階段", "ヌシの 天文台"],
  k6c: ["つくえの 間", "まどべの 回廊", "たからの 宝物庫", "ヌシの 居間"],
  k6d: ["ろうどくの 間", "はいくの 階", "とうろんの 円卓", "ヌシの 大講堂"],
  k6e: ["ゆうびんの 塔", "ぎんこうの 金庫", "しょうぼうの はしご", "ヌシの 管制室"],
  k6f: ["けんぽうの 間", "ないかくの 会議室", "さいばんの 法廷", "ヌシの 玉座"],
  k6g: ["ちゅうせいの 鏡", "そんけいの 階", "ゆうじょうの 鐘", "ヌシの 心の間"],
  k6h: ["たんけんの 階段", "はっしゃ台", "ほうもんの 扉", "ヌシの 時計じかけ"],
  k6i: ["ひみつの 書だな", "げきの 舞台", "ぎんの 鏡の 間", "ヌシの 宝石の 間"],
  k6j: ["せいざの 回廊", "ほしくずの 階段", "オーロラの 窓", "ヌシの 塔の てっぺん"],
  // ことばの国
  w1: ["よみがなの 門", "ふりがなの 小道", "なぞの 熟語ぐら", "ヌシの 読書室"],
  w2: ["しおどきの 浜", "ぞうきばやし", "いえじの 坂", "ヌシの こんりゅう寺"],
  w3: ["おくりがなの 道", "かきとりの 机", "とめはねの 庭", "ヌシの 書道場"],
  w4: ["同じ音の こだま谷", "うつしの 鏡池", "おさめの くら", "ヌシの まちがい屋敷"],
  w5: ["一石二鳥の 森", "以心伝心の 橋", "日進月歩の 坂", "ヌシの 四字道場"],
  w6: ["右往左往の 迷路", "一進一退の 坂", "古今東西の 門", "ヌシの はんたい城"],
  w7: ["ねこに小判の 店", "石の上の 小屋", "さるの 木のぼり林", "ヌシの ことわざ寺"],
  w8: ["慣用句の 入り口", "慣用句の 小道", "慣用句の おく", "ヌシの からだ劇場"],
  w9: ["部首の 入り口", "部首の 小道", "部首の おく", "ヌシの 部首迷宮"],
  w10: ["ことばの 入り口", "ことばの 小道", "ことばの おく", "ヌシの 天びん台"],
  w11: ["カタカナ ストリート", "アイデア ラボ", "ルールの 広場", "ヌシの スタジオ"],
  w12: ["三寒四温の 野", "四苦八苦の 坂", "百発百中の 的場", "ヌシの 千差万別館"],
  w13: ["灯台もと暗しの 岬", "井の中の かえる池", "石橋の わたし場", "ヌシの 金棒城"],
  w14: ["手を やく 工房", "耳に たこの 港", "胸を はる 坂", "ヌシの 歯が立たぬ岩"],
  w15: ["敬語の 入り口", "敬語の 小道", "敬語の おく", "ヌシの おもてなし御殿"],
  // 算数の国
  m1: ["単位の 入り口", "単位の 小道", "単位の おく", "ヌシの 単位工場"],
  m2: ["計算の 入り口", "計算の 小道", "計算の おく", "ヌシの けいさん塔"],
  m3: ["時計の 入り口", "時計の 小道", "時計の おく", "ヌシの 大時計"],
  m4: ["速さの 入り口", "速さの 小道", "速さの おく", "ヌシの 特急ホーム"],
  m5: ["割合の 入り口", "割合の 小道", "割合の おく", "ヌシの 大バーゲン"],
  m6: ["比の 入り口", "比の 小道", "比の おく", "ヌシの わけまえ城"],
  m7: ["集合の 入り口", "集合の 小道", "集合の おく", "ヌシの 集合ホール"],
  m8: ["データの 入り口", "データの 小道", "データの おく", "ヌシの グラフ城"],
  m9: ["きそくの 入り口", "きそくの 小道", "きそくの おく", "ヌシの きまり迷路"],
  m10: ["面積の 入り口", "面積の 小道", "面積の おく", "ヌシの 公式神殿"],
  m11: ["図形の 入り口", "図形の 小道", "図形の おく", "ヌシの 分度器城"],
  m12: ["立体の 入り口", "立体の 小道", "立体の おく", "ヌシの 立体迷宮"],
  m13: ["場合の数の 入り口", "場合の数の 小道", "場合の数の おく", "ヌシの 大工事現場"],
  m14: ["推理の 入り口", "推理の 小道", "推理の おく", "ヌシの 探偵事務所"],
  m15: ["分数の 入り口", "分数の 小道", "分数の おく", "ヌシの 分数パーラー"],
  m16: ["旅人算の 入り口", "旅人算の 小道", "旅人算の おく", "ヌシの 鉄橋"],
  m17: ["特殊算の 入り口", "特殊算の 小道", "特殊算の おく", "ヌシの 特殊算道場"],
  m18: ["逆算の 入り口", "逆算の 小道", "逆算の おく", "ヌシの 逆さま城"],
  // 理科の国
  s1: ["水よう液の 入り口", "水よう液の 小道", "水よう液の おく", "ヌシの 薬品だな"],
  s2: ["中和の 入り口", "中和の 小道", "中和の おく", "ヌシの 調合室"],
  s3: ["とけ方の 入り口", "とけ方の 小道", "とけ方の おく", "ヌシの ミョウバン城"],
  s4: ["気体の 入り口", "気体の 小道", "気体の おく", "ヌシの 気体タンク"],
  s5: ["燃焼の 入り口", "燃焼の 小道", "燃焼の おく", "ヌシの かまど"],
  s6: ["電気の 入り口", "電気の 小道", "電気の おく", "ヌシの 発電所"],
  s7: ["つりあいの 入り口", "つりあいの 小道", "つりあいの おく", "ヌシの つりあい城"],
  s8: ["ふりこと 光の 入り口", "ふりこと 光の 小道", "ふりこと 光の おく", "ヌシの ひかりの塔"],
  s9: ["からだの 入り口", "からだの 小道", "からだの おく", "ヌシの からだ研究所"],
  s10: ["植物の 入り口", "植物の 小道", "植物の おく", "ヌシの 大温室"],
  s11: ["生き物の 入り口", "生き物の 小道", "生き物の おく", "ヌシの 生き物館"],
  s12: ["天気の 入り口", "天気の 小道", "天気の おく", "ヌシの 気象台"],
  s13: ["宇宙の 入り口", "宇宙の 小道", "宇宙の おく", "ヌシの プラネタリウム"],
  s14: ["大地の 入り口", "大地の 小道", "大地の おく", "ヌシの 火山口"],
  s15: ["エネルギーの 入り口", "エネルギーの 小道", "エネルギーの おく", "ヌシの エネルギー塔"],
  s16: ["季節の 入り口", "季節の 小道", "季節の おく", "ヌシの 冬眠の 穴"],
  s17: ["実験室の 入り口", "実験室の 小道", "実験室の おく", "ヌシの 理科準備室"],
  // 社会の国
  h1: ["古代の 入り口", "古代の 小道", "古代の おく", "ヌシの 平安京"],
  h2: ["武士の 世の 入り口", "武士の 世の 小道", "武士の 世の おく", "ヌシの 室町御所"],
  h3: ["戦国・江戸の 入り口", "戦国・江戸の 小道", "戦国・江戸の おく", "ヌシの 江戸城"],
  h4: ["近代の 入り口", "近代の 小道", "近代の おく", "ヌシの 近代の 港"],
  p1: ["政治の 入り口", "政治の 小道", "政治の おく", "ヌシの 三権の塔"],
  p2: ["憲法の 入り口", "憲法の 小道", "憲法の おく", "ヌシの 憲法記念館"],
  g1: ["気候の 入り口", "気候の 小道", "気候の おく", "ヌシの 季節風の 岬"],
  g2: ["産業の 入り口", "産業の 小道", "産業の おく", "ヌシの 自動車工場"],
  g3: ["世界遺産の 入り口", "世界遺産の 小道", "世界遺産の おく", "ヌシの 世界遺産の 島"],
  g4: ["県庁の 道", "四十七の 橋", "日本地図の 広場", "ヌシの 首都タワー"],
  g5: ["工業の 入り口", "工業の 小道", "工業の おく", "ヌシの 貿易船"],
  p3: ["世界の 入り口", "世界の 小道", "世界の おく", "ヌシの 地球会議場"],
  h5: ["人物カードの 間", "肖像画の 回廊", "歴史絵巻の 部屋", "ヌシの 英雄の 殿堂"],
};
const stageName = (ch, n) => (CH_STAGE_NAMES[ch.id] || STAGE_NAMES[ch.w] || STAGE_NAMES.kanji)[n - 1];

// ステージの情報（バトルで つかう）
function stageInfo(ch, n) {
  // ごほうび（コイン・そざい）は 強さに 合わせる（5・6年生の 強い 章は ティア5・6 なみ）
  const rt = Math.max(ch.tier, typeof chHard === "function" ? chHard(ch) : 0);
  return {
    key: `${ch.id}-${n}`, ch, n, tier: ch.tier, id: ch.tier, rt,
    name: stageName(ch, n), bg: TBG[rt],
    mat: TMAT[rt][0], bmat: TMAT[rt][1], final: ch.last && n === 4,
  };
}

// ---------- クリア状況 ----------
const stStars = (key) => (S.stClear || {})[key] || 0;
// 区切りの 最初の 章と、一度 遊んだ 章は ひらいている。ほかは 1つ前の（出題する）章を クリアすると ひらく
function chapterOpen(ch) {
  if (window.PQ_DEBUG && window.PQ_OPEN) return true; // デバッグ：ぜんぶ ひらく
  if (ch.write) return writeOpen(ch);
  if (ch.maou) return maouOpen(ch.maou);
  const list = activeChapters(ch.w).filter((c) => c.sec === ch.sec), i = list.indexOf(ch);
  if (stStars(`${ch.id}-1`) > 0) return true;
  if (i <= 0) return !kanjiHighLocked(ch);
  return chapterDone(list[i - 1]);
}
// 漢字の国の 5・6年生エリア：4年生エリアの ボスを 1体 たおすまで とじている
function kanjiHighLocked(ch) {
  if (ch.w !== "kanji" || !["a5", "a6"].includes(ch.sec)) return false;
  const a4 = activeChapters("kanji").filter((c) => c.sec === "a4");
  return a4.length > 0 && !a4.some(chapterDone);
}
const stageOpen = (ch, n) => chapterOpen(ch) && (n === 1 || !!ch.maou || (window.PQ_DEBUG && window.PQ_OPEN) || stStars(`${ch.id}-${n - 1}`) > 0);
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
      ${maouButton()}
    </div>`, "bg-map");
  if (!S.tut.map2) {
    S.tut.map2 = 1; save();
    modal(`<div class="mtitle">ぼうけんの ヒント</div><div class="bigicon">🗺️</div>
      <p>5つの 国が あるよ。<b>すきな 国から</b> ぼうけんしよう！<br>章を クリアすると つぎの 章が ひらくよ。</p>
      <p>てきには <b>ぞくせい</b> があって、あいしょうの いい ぶきなら <b>2ばい</b>！<br>てきを たおすと <b>そざい</b> が 手に はいって、ショップで そうびが つくれるよ。</p>
      <p>⭐は ステージの できばえ（ノーミスで ⭐3つ）。</p>
      <button class="big-btn primary" onclick="closeModal()">わかった！</button>`);
  } else if (typeof maou2Reveal === "function") maou2Reveal();
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
      return `<button class="stage ${open ? "" : "locked"} ${ch.tier === 6 ? "sfinal" : ""}" ${open ? `onclick="openChapter('${ch.id}')"` : ""} style="--b1:${TBG[ch.tier][0]};--b2:${TBG[ch.tier][1]}">
        <span class="snum">${ch.icon || i + 1}</span>
        <span class="sinfo"><b>${i + 1}. ${ch.name}</b><small>${open ? `てき ${els}${ch.tier >= 2 ? "❓" : ""}　そざい ${MATS[TMAT[stageInfo(ch, 1).rt][0]].em}${MATS[TMAT[stageInfo(ch, 1).rt][1]].em}　⭐${st}/12` : kanjiHighLocked(ch) ? "こだまの山の ボスを 1たい たおすと ひらく" : "まえの 章を クリアしよう"}</small></span>
        <span class="sstate">${!open ? "🔒" : done ? "👑" : "▶"}</span></button>`;
    }).join("") + writeButton(curWorld, curSec[curWorld]) : `<div class="chhead" style="--b1:#fff;--b2:#f3ecff"><div class="bigicon">💤</div><b>いまは おやすみ中</b><small>おうちの人の せっていで、この国の 章は お休みに なっているよ</small></div>`}</div>`, "bg-map");
}

// かきとり道場の ボタン（漢字の国の 学年ごと）
function writeButton(w, sec) {
  if (w !== "kanji" || typeof EXTRA_CH === "undefined") return "";
  const ch = EXTRA_CH.find((c) => c.write && c.sec === sec);
  if (!ch || !chapterOn(ch)) return "";
  const open = chapterOpen(ch), st = chapterStars(ch);
  return `<button class="stage write ${open ? "" : "locked"}" ${open ? `onclick="openChapter('${ch.id}')"` : ""}>
    <span class="snum">✍️</span><span class="sinfo"><b>かきとり道場</b><small>${open ? `お手本なしで 書く 道場。ごほうび たっぷり！　⭐${st}/12` : "この エリアの 章を 1つ クリアすると ひらく"}</small></span>
    <span class="sstate">${!open ? "🔒" : chapterDone(ch) ? "👑" : "▶"}</span></button>`;
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
      return `<button class="stage ${open ? "" : "locked"} ${ch.tier === 6 ? "sfinal" : ""}" ${open ? `onclick="startBattle('${ch.id}-${n}')"` : ""} style="--b1:${TBG[ch.tier][0]};--b2:${TBG[ch.tier][1]}">
        <span class="snum">${n === 4 ? "👑" : n}</span>
        <span class="sinfo"><b>${n === 4 ? `ボス：${stageName(ch, n)}` : `ステージ${n}：${stageName(ch, n)}`}</b><small>${open ? `てき ${ens.map((e) => (e.rand ? "❓" : ELEMENTS[e.el].icon)).join(" ")}` : "まえの ステージを クリアしよう"}</small></span>
        <span class="sstate stars">${!open ? "🔒" : "⭐".repeat(st) + "☆".repeat(3 - st)}</span></button>`;
    }).join("")}</div>`, "bg-map");
}
