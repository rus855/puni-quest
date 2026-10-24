// ===== ひみつきちの なかまの おしゃべり =====
// へやを あるいている なかまを タップすると、へやの ようすを見て ひとこと しゃべる。
// しゃべりかた（くちょう）は なかまごとに ちがい、すきな かぐ・にがてな かぐも ある。
"use strict";

// ---------- くちょう ----------
// I：じぶんの よびかた、da：めいしの あと、yo：けいようし・〜たいの あと、
// ne／dane：「〜ね」の きもち（けいようしの あと／めいしの あと）、oh：おどろき、you：あいての よびかた
const TONE = {
  genki: { I: "ぼく", da: "だよ！", yo: "よ！", ne: "ね！", dane: "だね！", oh: "わあ！", you: "きみ" },
  teinei: { I: "わたし", da: "です。", yo: "です。", ne: "ですね。", dane: "ですね。", oh: "まあ、", you: "あなた" },
  cool: { I: "オレ", da: "だ。", yo: "ぜ。", ne: "な。", dane: "だな。", oh: "ふっ、", you: "おまえ" },
  ottori: { I: "わたし", da: "だよ〜", yo: "よ〜", ne: "ね〜", dane: "だね〜", oh: "あら〜", you: "きみ" },
  samurai: { I: "せっしゃ", da: "でござる。", yo: "でござる。", ne: "でござるな。", dane: "でござるな。", oh: "おお、", you: "おぬし" },
  ojou: { I: "わたくし", da: "ですわ！", yo: "ですわ！", ne: "ですわね。", dane: "ですわね。", oh: "まあ！", you: "あなた" },
  roujin: { I: "わし", da: "じゃ。", yo: "のじゃ。", ne: "のう。", dane: "じゃのう。", oh: "ほほう、", you: "おぬし" },
  kansai: { I: "わい", da: "やで！", yo: "で！", ne: "なぁ。", dane: "やなぁ。", oh: "おっ、", you: "あんた" },
  shy: { I: "ぼ、ぼく", da: "…だよ", yo: "…よ", ne: "…ね", dane: "…だね", oh: "あ…", you: "きみ" },
  hakase: { I: "わがはい", da: "なのだ。", yo: "のだ。", ne: "のだな。", dane: "なのだな。", oh: "ふむふむ、", you: "きみ" },
};
// なかまごとの くちょう［くちょう, なきごえ］
const PET_TONE = {
  pyomaru: ["genki", "ピヨ"], nyanta: ["ottori", "ニャ〜"], wanta: ["genki", "ワン！"], pyonkichi: ["genki", "ぴょん"],
  kamessy: ["ottori", ""], kerosuke: ["genki", "ケロ"], nezumin: ["shy", "チュウ"], butappi: ["ottori", "ブー"],
  hachimitsu: ["genki", "ブンブン"], konta: ["teinei", "コン"], kumagoro: ["ottori", ""], hoho: ["hakase", "ホー"],
  pandan: ["ottori", ""], takorin: ["kansai", ""], penta: ["genki", "ペン！"], saruta: ["genki", "ウキッ"],
  hebinu: ["cool", "シャー"], koumori: ["cool", ""], gaou: ["cool", "ガオー"], yuniko: ["ojou", ""],
  draco: ["cool", ""], birihamu: ["genki", "ビリッ"], ookami: ["cool", "ワオーン"], kujaku: ["ojou", ""],
  toramaru: ["samurai", ""], kujiran: ["ottori", ""], washitaka: ["samurai", ""], goriran: ["kansai", "ウホ"],
  tokagen: ["shy", ""], koaran: ["ottori", ""], niwatori: ["genki", "コケッ"], ushimo: ["ottori", "モ〜"],
  umataro: ["genki", "ヒヒーン"], hitsujin: ["ottori", "メェ〜"], ahirun: ["genki", "ガァ"], kanikani: ["kansai", "カニ"],
  yamaarashi: ["shy", ""], chocho: ["ojou", ""], sukanku: ["shy", ""], kabao: ["ottori", ""],
  sameddo: ["cool", ""], sasorin: ["cool", ""], wanio: ["kansai", "ワニ"], manmos: ["roujin", "パオ"],
  zouzou: ["ottori", "パオーン"], kirin: ["teinei", ""], yukihyo: ["cool", ""], flamingo: ["ojou", ""],
  tiranon: ["cool", "ガオー"], stego: ["ottori", ""], dodo: ["hakase", ""], orca: ["roujin", ""], ryuou: ["roujin", ""],
};
// しるしの ない なかまは 名前から きめる（いつも おなじ くちょうに なる）
function petTone(spId) {
  if (PET_TONE[spId]) return PET_TONE[spId];
  const keys = Object.keys(TONE);
  let h = 0;
  for (const c of spId) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return [keys[h % keys.length], ""];
}

// ---------- すき・にがて ----------
// かぐの とくちょう（しゅるいの ほかに つける）
const FTAG = {
  wa: ["f_k1", "f_k2", "f_k3", "f_k4", "f_k5", "f_h2", "f_h3", "f_h4", "f_h5", "f_kake", "f_t4"],
  sci: ["f_s1", "f_s2", "f_s3", "f_s4", "f_s5", "f_clock", "f_m5", "f_tv"],
  shiny: ["f_trophy", "f_hiken", "f_niji", "f_okaeri", "f_gift"],
  light: ["f_candle", "f_k1", "f_window", "f_niji"],
  soft: ["f_bed", "f_sofa", "f_bear", "f_okaeri"],
  art: ["f_pic", "f_t1", "f_t5", "f_k2", "f_kake"],
};
const fTags = (id) => { const f = furnById(id); return [fKind(f), ...Object.keys(FTAG).filter((t) => FTAG[t].includes(id))]; };
// くちょうごとの すき・にがて（とくちょうの なまえ）
const TONE_PREF = {
  genki: { like: ["play"], hate: ["study"] },
  teinei: { like: ["study", "art"], hate: [] },
  cool: { like: ["shiny", "sci"], hate: ["soft"] },
  ottori: { like: ["soft", "nature", "rest"], hate: [] },
  samurai: { like: ["wa"], hate: ["play"] },
  ojou: { like: ["art", "shiny"], hate: ["nature"] },
  roujin: { like: ["wa", "rest"], hate: [] },
  kansai: { like: ["play"], hate: ["study"] },
  shy: { like: ["soft", "nature"], hate: [] },
  hakase: { like: ["study", "sci"], hate: ["play"] },
};
// ぞくせいの すき
const EL_LIKE = { fire: ["light"], water: ["f_window"], leaf: ["nature"], thunder: ["sci"], star: ["shiny", "light"] };
// なかまごとの だいすきな かぐ・にがてな かぐ（かぐの id）
const PET_FAV = {
  pyomaru: { fav: ["f_basket"] }, nyanta: { fav: ["f_basket", "f_ball"], hate: ["f_t3"] }, wanta: { fav: ["f_ball", "f_bear"], hate: ["f_balloon"] },
  pyonkichi: { fav: ["f_plant"] }, kamessy: { fav: ["f_k4"] }, kerosuke: { fav: ["f_window", "f_plant"] }, nezumin: { fav: ["f_basket"], hate: ["f_clock"] },
  butappi: { fav: ["f_bed", "f_sofa"] }, hachimitsu: { fav: ["f_plant", "f_k3"], hate: ["f_candle"] }, konta: { fav: ["f_k1", "f_h5"] },
  kumagoro: { fav: ["f_bear", "f_bed"] }, hoho: { fav: ["f_shelf", "f_t2", "f_clock"] }, pandan: { fav: ["f_k3", "f_k5"] },
  takorin: { fav: ["f_t1"] }, penta: { fav: ["f_window"], hate: ["f_candle"] }, saruta: { fav: ["f_balloon", "f_ball"] },
  hebinu: { fav: ["f_h3"] }, koumori: { hate: ["f_window", "f_candle"] }, gaou: { fav: ["f_trophy"] }, yuniko: { fav: ["f_niji", "f_pic"] },
  draco: { fav: ["f_hiken", "f_candle"] }, birihamu: { fav: ["f_tv"] }, ookami: { fav: ["f_window"] }, kujaku: { fav: ["f_pic", "f_t5"] },
  toramaru: { fav: ["f_hiken", "f_k5"] }, kujiran: { fav: ["f_window"] }, washitaka: { fav: ["f_hiken", "f_h2"] }, goriran: { fav: ["f_ball", "f_tv"] },
  tokagen: { fav: ["f_h4"] }, koaran: { fav: ["f_plant", "f_bed"] }, niwatori: { fav: ["f_clock"] }, ushimo: { fav: ["f_sofa"] },
  umataro: { fav: ["f_ball"] }, hitsujin: { fav: ["f_bed", "f_bear"] }, ahirun: { fav: ["f_window"] }, kanikani: { fav: ["f_t3"] },
  yamaarashi: { fav: ["f_plant"], hate: ["f_balloon"] }, chocho: { fav: ["f_plant", "f_k3"] }, sukanku: { fav: ["f_basket"] }, kabao: { fav: ["f_sofa"] },
  sameddo: { fav: ["f_m3"] }, sasorin: { fav: ["f_candle"] }, wanio: { fav: ["f_tv"] }, manmos: { fav: ["f_s5"] },
  zouzou: { fav: ["f_t5"] }, kirin: { fav: ["f_s2", "f_window"] }, yukihyo: { fav: ["f_window"], hate: ["f_candle"] }, flamingo: { fav: ["f_pic", "f_t5"] },
  tiranon: { fav: ["f_s5", "f_trophy"] }, stego: { fav: ["f_s5", "f_plant"] }, dodo: { fav: ["f_s2", "f_shelf"] }, orca: { fav: ["f_window", "f_kake"] },
  ryuou: { fav: ["f_hiken", "f_kake", "f_niji"] },
};
// その なかまが その かぐを どう おもうか（2：だいすき、1：すき、-1：にがて、0：ふつう）
function petLikes(pet, id) {
  const sp = petSp(pet.sp), [tone] = petTone(pet.sp), p = PET_FAV[pet.sp] || {}, tags = fTags(id);
  if ((p.fav || []).includes(id)) return 2;
  if ((p.hate || []).includes(id)) return -1;
  const el = EL_LIKE[sp.el] || [];
  if (el.includes(id) || tags.some((t) => el.includes(t))) return 1;
  if (tags.some((t) => TONE_PREF[tone].like.includes(t))) return 1;
  if (tags.some((t) => TONE_PREF[tone].hate.includes(t))) return -1;
  return 0;
}

// ---------- へやの ようすを しらべる ----------
function roomStats() {
  const { C, R } = roomSize(), list = roomList();
  const floor = list.filter((p) => p.y >= 0), wall = list.filter((p) => p.y < 0);
  const used = floor.reduce((n, p) => n + (furnById(p.id).w || 1), 0);
  const count = (arr) => arr.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {});
  const sets = count(list.map((p) => furnById(p.id).set));
  const kinds = count(list.map((p) => fKind(furnById(p.id))));
  const tags = count(list.flatMap((p) => fTags(p.id).filter((t) => FTAG[t])));
  const ids = count(list.map((p) => p.id));
  const left = floor.filter((p) => p.x + (furnById(p.id).w || 1) / 2 <= C / 2).length;
  const rows = count(floor.map((p) => p.y));
  return { C, R, list, floor, wall, n: list.length, fill: used / (C * R), wallFill: wall.reduce((n, p) => n + (furnById(p.id).w || 1), 0) / C,
    sets, kinds, tags, ids, left, right: floor.length - left, maxRow: Math.max(0, ...Object.values(rows)) };
}
const topOf = (m) => Object.entries(m).sort((a, b) => b[1] - a[1])[0] || ["", 0];
const fName = (id) => furnById(id).name;

// ---------- しゃべる ことば ----------
// {I}{da}{yo}{ne}{dane}{oh}{you}{me}（ぷにまるの 名前）を くちょうで おきかえる
function talkFill(t, tone, extra) {
  const T = TONE[tone];
  return t.replace(/\{(\w+)\}/g, (m, k) => (k in T ? T[k] : k === "me" ? esc(S.name) : extra && k in extra ? extra[k] : m));
}

// ことばの こうほを あつめる［重み, ことば］
function talkLines(pet, isMe) {
  const st = roomStats(), L = [];
  const add = (w, t) => L.push([w, t]);
  const sp = pet ? petSp(pet.sp) : null;
  const hour = typeof roomHour === "function" ? roomHour() : new Date().getHours();

  // --- へやの かぐの かず ---
  if (st.n === 0) {
    add(30, "{oh}なにも ない へや{dane} ひろびろ{da}");
    add(30, "かぐを おいてほしい{ne} ショップの「かぐ」で かえる みたい{da}");
    add(20, "ここが {I}たちの ひみつきち{dane} これから たのしみ{da}");
  } else if (st.n <= 3) {
    add(12, "まだ かぐが すくない{ne} もっと ふやしたい{yo}");
    add(8, "すっきりした へや{dane}");
  }
  if (st.fill >= 0.6) { add(14, "{oh}かぐが ぎゅうぎゅう{dane} あるく ところが せまい{yo}"); add(8, "にぎやかな へや{dane} かくれんぼ できそう{da}"); }
  else if (st.fill >= 0.35) add(6, "ちょうど いい かんじ{dane} いごこちが いい{yo}");
  else if (st.n >= 4 && st.fill < 0.2) add(8, "ゆかが ひろびろ{dane} おいかけっこが できそう{da}");
  // --- かべ ---
  if (st.floor.length >= 3 && st.wall.length === 0) add(14, "かべが ちょっと さみしい{ne} まどや えを かざりたい{yo}");
  if (st.wallFill >= 0.8) add(10, "かべが かざりで いっぱい{dane} はなやか{da}");
  if (st.wall.length >= 2 && st.floor.length === 0) add(12, "かべは にぎやか なのに、ゆかが からっぽ{dane}");
  // --- かたより ---
  if (st.floor.length >= 4 && (st.left === 0 || st.right === 0)) add(16, `かぐが ${st.left ? "ひだり" : "みぎ"}がわに ばっかり{dane} へやが かたむきそう{da}`);
  else if (st.floor.length >= 5 && Math.abs(st.left - st.right) <= 1) add(8, "みぎと ひだりの バランスが いい{ne} きれいな へや{da}");
  if (st.maxRow >= 3) add(10, "かぐが いちれつに ならんだ、きちんと した へや{dane}");
  // --- 国の セットの かたより・まぜかた ---
  const [ts, tn] = topOf(Object.fromEntries(Object.entries(st.sets).filter(([k]) => FURN_SETS.includes(k))));
  if (ts && tn >= 3 && tn / st.n >= 0.5) {
    const w = WORLDS.find((x) => x.id === ts);
    add(18, `${w.icon} ${w.name}の ものが いっぱい{dane} ${w.name}に いるみたい{da}`);
  }
  const nset = Object.keys(st.sets).filter((k) => FURN_SETS.includes(k)).length;
  if (nset >= 4) add(14, "いろんな 国の かぐが いっぱい{dane} せかいりょこう してる みたい{da}");
  FURN_SETS.forEach((w) => { if (roomData().stamps[w] && st.sets[w] >= 5) add(10, `${WORLDS.find((x) => x.id === w).name}セットが ぜんぶ そろってる！ すごい{ne}`); });
  // --- しゅるいの かたより ---
  const [tk, tkn] = topOf(st.kinds);
  const KIND_TALK = {
    rest: "くつろげる ものが いっぱい{dane} ごろごろ したい{yo}",
    play: "あそぶ ものが いっぱい{dane} まるで あそびば{da}",
    study: "べんきょうの ものが いっぱい{dane} かしこく なれそう{da}",
    nature: "みどりが いっぱい{dane} もりの 中みたい{da}",
    deco: "おきものが いっぱい{dane} はくぶつかん みたい{da}",
    wall: "かべの かざりが じまん{dane}",
  };
  if (tk && tkn >= 3 && tkn / st.n >= 0.5) add(16, KIND_TALK[tk]);
  const [tt, ttn] = topOf(st.tags);
  const TAG_TALK = { wa: "わふうの へや{dane} おちゃが のみたい{yo}", sci: "けんきゅうじょ みたい{dane} なにか はつめい したい{yo}", shiny: "きらきら した ものが いっぱい{dane} まぶしい{yo}", soft: "ふかふかの ものが いっぱい{dane} ねむく なりそう{da}", art: "げいじゅつてきな へや{dane}" };
  if (tt && ttn >= 3) add(10, TAG_TALK[tt] || "");
  if (Object.keys(st.kinds).length >= 5) add(8, "かぐの しゅるいが いろいろ{dane} あきない へや{da}");
  // --- おなじ かぐが いっぱい ---
  const [ti, tin] = topOf(st.ids);
  if (tin >= 3) add(14, `${fName(ti)}が ${tin}こも{dane} そんなに すき なの？`);
  // --- とくべつな かぐ ---
  if (st.ids.f_kake && roomData().kake) add(14, `かけじくの「${esc(roomData().kake.slice(2))}」って 字、かっこいい{ne} {you}が ★5に した 字{dane}`);
  if (st.ids.f_kake && !roomData().kake) add(10, "かけじくが まっしろ{dane} タップして 漢字を えらんでね");
  if (st.ids.f_trophy) add(10, `たからものが ${Object.keys(S.treasures || {}).length}こ{dane} がんばった しるし{da}`);
  if (st.ids.f_okaeri) add(10, "おかえりの ソファ、すわると ほっと する かんじ{da}");
  if (st.ids.f_hiken) add(10, "ひけんの かざりだい、つよそう{dane} さわったら おこられそう{da}");
  if (st.ids.f_niji) add(10, "にじの まど、きれい{dane} まおうに かった しるし{da}");
  if (st.ids.f_tv) add(5, "テレビ、なにを みようかな？");
  if (st.ids.f_clock) add(4, `はしらどけいを 見たら、いまは ${hour}じ{dane}`);
  // --- くみあわせ・もようがえ・まど ---
  const cmb = typeof roomCombos === "function" ? roomCombos() : [];
  const CMB_TALK = {
    tv: "テレビタイム{da} ソファで いっしょに みよう！", read: "どくしょコーナーで ほんを よみたい{ne}", tea: "おちゃかいの じゅんびは ばっちり{dane}",
    sun: "まどの そばは ぽかぽか{dane} ひなたぼっこ さいこう！", star: "ぼうえんきょうで ほしを 見たい{ne}", music: "ピアノの えんそうかい、ききたい{ne}",
    game: "ゲームコーナーで しょうぶ{da}", wa: "かけじくと おちゃ…わの こころ{dane}", sleep: "おやすみセット{dane} よく ねむれそう{da}",
    dino: "きょうりゅうの けんきゅう、おもしろそう{dane}", lab: "じっけんしつ{dane} なにを まぜようかな", cozy: "ラグの 上は ふかふか{dane} ごろんと したい{yo}",
    garden: "おしろの おにわ みたい{dane} りっぱ{da}", party: "パーティー{da} わくわく{da}", museum: "ミニはくぶつかん{dane} たからものが いっぱい{da}", post: "おてがみ、だれに かこうかな？",
  };
  cmb.forEach((x) => add(12, CMB_TALK[x.c.id] || `${x.c.name}、いい かんじ{dane}`));
  if (cmb.length >= 3) add(14, `くみあわせが ${cmb.length}こも！ センスが いい{ne}`);
  if (typeof roomTheme === "function" && roomTheme() !== "base") add(10, `${THEMES[roomTheme()].name}の もよう、すてき{dane}`);
  if (st.ids.f_window || st.ids.f_niji) {
    const dp = dayPart();
    add(8, { morning: "まどの そとが あかるい{ne}", day: "まどの そとは いい てんき{dane}", evening: "まどの そとが ゆうやけ{dane} きれい{da}", night: "まどの そとに おつきさま{da}" }[dp]);
  }
  if (st.n >= 4 && !st.list.some((p) => furnById(p.id).rug)) add(6, "ラグを しいたら、もっと まとまりそう{da}");
  // --- きらきら度 ---
  const k = kiraScore();
  if (k >= ROOM_TWO) add(6, `きらきら度 ${k}！ りっぱな ひみつきち{dane}`);
  else if (k >= ROOM_TWO - 25) add(10, `きらきら度 あと ${ROOM_TWO - k}で 2つめの へや{da} がんばろう！`);
  else if (k < ROOM_BIG && k >= ROOM_BIG - 15) add(10, `きらきら度 あと ${ROOM_BIG - k}で へやが ひろく なる みたい{da}`);
  // --- じかん ---
  if (hour >= 20 || hour < 5) {
    add(10, st.ids.f_bed ? "ふわぁ… ねむい{ne} ベッドで ねようかな" : "ふわぁ… ねむい{ne} ベッドが あったら いいのに");
    add(6, "もう よる{dane} {you}も はやく ねてね");
  } else if (hour < 9) add(8, "おはよう！ きょうも いい てんき だと いい{ne}");
  else if (hour >= 15 && hour < 18) add(6, "おやつの じかん{dane} なにか たべたい{yo}");
  const wd = new Date().getDay();
  if (wd === 0 || wd === 6) add(5, "きょうは おやすみの 日{dane} いっぱい あそぼう！");
  // --- べんきょうの ようす ---
  const ng = nigateIds().length;
  if (ng >= 5) add(8, `ニガテモンスターが ${ng}ひき いる みたい{da} いっしょに たいじしよう！`);
  if (ng === 0 && Object.keys(S.cards || {}).length > 20) add(6, "ニガテが 0！ さすが {me}{dane}");

  if (isMe) {
    // ぷにまるの ことば
    add(10, "ここは {I}の ひみつきち{da} なかまと いっしょに すんでるんだ");
    add(6, "かぐを ふやして、もっと すてきな へやに したい{ne}");
    const pl = roomPetList().map((u) => S.pets.find((p) => p.u === u)).filter(Boolean);
    if (pl.length) add(8, `${petSp(pick(pl).sp).name}と いっしょで たのしい{yo}`);
    if (!pl.length) add(10, "なかまを へやに よびたい{ne}");
    return L.filter((x) => x[1]);
  }

  // --- すき・にがて（なかまだけ） ---
  const placed = [...new Set(st.list.map((p) => p.id))];
  const fav2 = placed.filter((id) => petLikes(pet, id) === 2), fav1 = placed.filter((id) => petLikes(pet, id) === 1), hate = placed.filter((id) => petLikes(pet, id) < 0);
  if (fav2.length) {
    const id = pick(fav2);
    add(26, `{oh}${fName(id)}！ {I}、${fName(id)}が だいすき{da}`);
    add(14, `${fName(id)}の そばに いると しあわせ{da}`);
  }
  if (fav1.length) {
    const id = pick(fav1);
    add(14, `${fName(id)}、いい{ne} {I}の このみ{da}`);
    add(8, `${fName(id)}を おいてくれて ありがとう！`);
  }
  if (hate.length) {
    const id = pick(hate);
    add(18, `${fName(id)}は ちょっと にがて{da}`);
    add(10, `う〜ん、${fName(id)}は {I}には あわない かんじ{da}`);
  }
  if (fav1.length + fav2.length >= 3 && !hate.length) add(16, "{I}の すきな ものが いっぱい！ さいこうの へや{da}");
  if (hate.length >= 3) add(14, "にがてな ものが おおくて おちつかない{yo}");
  // まだ おいていない だいすきな かぐを ほしがる
  const want = (PET_FAV[pet.sp] || {}).fav ? PET_FAV[pet.sp].fav.filter((id) => furnById(id) && !placed.includes(id)) : [];
  if (want.length) {
    const id = pick(want);
    add(12, fOwn(id) > fPlaced(id) ? `しまってある ${fName(id)}、おいてほしい{ne}` : `${fName(id)}が あったら うれしい{ne}`);
  }
  // じぶんに にている かぐ
  if (st.ids.f_s5 && ["tiranon", "stego", "manmos"].includes(pet.sp)) add(18, "きょうりゅうの もけい、{I}に そっくり{da}");
  if (st.ids.f_bear && pet.sp === "kumagoro") add(18, "くまの ぬいぐるみ…{I}の ともだち{da}");
  // --- じぶんの こと ---
  if (S.partner === pet.u) { add(12, "{I}は {me}の あいぼう{da} これからも よろしく！"); add(6, "バトルでも まかせて！"); }
  else add(5, "いつか あいぼうに えらんでほしい{ne}");
  if (pet.lv >= MAX_PET_LV) add(8, "{I}は もう Lv MAX{da} すっかり つよく なった きぶん{da}");
  else if (pet.lv <= 2) add(6, "もっと つよく なりたい{ne} いっしょに たたかおう！");
  const friends = roomPetList().filter((u) => u !== pet.u).map((u) => S.pets.find((p) => p.u === u)).filter(Boolean);
  if (!friends.length) add(10, "ひとりだと ちょっと さみしい{ne}");
  else {
    const f = pick(friends), same = petSp(f.sp).el === sp.el && sp.el !== "none";
    add(10, same ? `${petSp(f.sp).name}とは おなじ ${ELEMENTS[sp.el].name}ぞくせい{da} なかよし！` : `${petSp(f.sp).name}と あそぶの たのしい{yo}`);
    if (friends.length >= 2) add(6, "みんなで いると にぎやか{dane}");
  }
  if (typeof otList === "function" && otList().length) add(8, "おつかいに いった なかま、げんきかな？");
  // --- くちょうごとの ひとりごと ---
  const TONE_TALK = {
    genki: ["きょうも げんき いっぱい{da}", "ねえねえ、あそぼう！"],
    teinei: ["いつも ありがとうございます。", "おへやの おそうじは まかせて ください。"],
    cool: ["べつに、ここが すきって わけじゃ ない{yo}", "つぎの バトルが たのしみ{dane}"],
    ottori: ["のんびり するのが いちばん{da}", "ふわぁ… いい きもち{dane}"],
    samurai: ["しゅぎょうを おこたっては ならぬ。", "{me}どのを おまもり いたす。"],
    ojou: ["おちゃかいを ひらきたい{ne}", "うつくしい へやに して くださいね。"],
    roujin: ["むかしは のう、もっと せまい へやに すんでおったのじゃ。", "わかい ものは げんきで いい{ne}"],
    kansai: ["なんでやねん！ …って いうてみたかってん。", "もうかりまっか？ ぼちぼち{da}"],
    shy: ["は、はなしかけて くれて ありがとう…", "こ、ここは おちつく{yo}"],
    hakase: ["この へやは けんきゅうの しがいが ある{yo}", "べんきょうは まいにち すこしずつ が コツ{da}"],
  };
  TONE_TALK[petTone(pet.sp)[0]].forEach((t) => add(5, t));
  return L.filter((x) => x[1]);
}

// ---------- タップで しゃべる ----------
let talkLast = {};
function talkOf(u) {
  const isMe = u === 0, pet = isMe ? null : S.pets.find((p) => p.u === u);
  if (!isMe && !pet) return "";
  const [tone, goe] = isMe ? ["genki", "ぷに"] : petTone(pet.sp);
  // おなじ ことばが つづかないように する
  const lines = talkLines(pet, isMe).filter((x) => x[1] !== talkLast[u]);
  const total = lines.reduce((n, x) => n + x[0], 0);
  let r = Math.random() * total, line = lines[0][1];
  for (const [w, t] of lines) { r -= w; if (r <= 0) { line = t; break; } }
  talkLast[u] = line;
  let s = talkFill(line, tone);
  if (goe && Math.random() < 0.6) s += ` ${goe}`;
  return s;
}
function roomTalk(el, u) {
  if (document.querySelector(".room.placing")) return;
  const box = $("roombox"), text = talkOf(u);
  if (!box || !text) return;
  snd("tap");
  // あるいている とちゅうでも、いまの ばしょで とまる
  const cs = getComputedStyle(el);
  el.style.transition = "none"; el.style.left = cs.left; el.style.top = cs.top; void el.offsetWidth; el.style.transition = "";
  el.classList.add("talking");
  el.classList.remove("hop"); void el.offsetWidth; el.classList.add("hop");
  document.querySelectorAll(".rbubble").forEach((b) => b.remove());
  const b = document.createElement("div");
  b.className = "rbubble";
  b.innerHTML = text;
  box.appendChild(b);
  // ふきだしを なかまの 上に（はみださないように）
  const br = box.getBoundingClientRect(), er = el.getBoundingClientRect();
  const w = b.offsetWidth, cx = er.left + er.width / 2 - br.left;
  const left = Math.max(4, Math.min(br.width - w - 4, cx - w / 2));
  b.style.left = `${left}px`;
  b.style.setProperty("--tail", `${Math.max(14, Math.min(w - 14, cx - left))}px`);
  const top = er.top - br.top - b.offsetHeight - 8;
  if (top < 0) { b.style.top = `${er.bottom - br.top + 8}px`; b.classList.add("below"); } else b.style.top = `${top}px`;
  clearTimeout(b._t);
  setTimeout(() => { b.remove(); el.classList.remove("talking"); }, 4200);
}
