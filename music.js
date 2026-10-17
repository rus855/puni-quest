// ===== BGM（WebAudioで その場で 作る 音楽） =====
// ・音声ファイルは 使わない（<audio>要素は マナーモードでも 鳴るため 使わない）
// ・「ambient（まわりの音）」として 鳴らすので、iPhoneの マナーモード中は スピーカーから 鳴らない
// ・せっていで オフに できる（さいしょは オフ）
// ・曲は さいしょに 1回 まるごと 音の 波を 計算して つくり、それを くりかえし 鳴らす
//   → 画面の 動きが おもくても とぎれず、さいごまで いったら さいしょに もどる
"use strict";
let bgmHere = "home"; // いまの 画面の 曲（地図・国の 画面で かえる）

// iPhone（Safari 16.4〜）：マナーモードに したがう 音の 種類に する
function setAmbient() {
  try { if (navigator.audioSession) navigator.audioSession.type = "ambient"; } catch (e) { /* 対応していない */ }
}
setAmbient();

const BGM = (() => {
  // 音名 → 半音の 番号（例 "C5" "F#4" "Bb3"）
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midi = (t) => {
    const m = t.match(/^([A-G])([#b]?)(\d)$/);
    if (!m) return 0;
    return SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + (Number(m[3]) + 1) * 12;
  };
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
  // 楽ふ：1こ = 8分音符。「-」は のばす、「.」は やすみ、「|」は 小節の くぎり
  const parse = (s) => {
    const tk = s.split(/\s+/).filter((x) => x && x !== "|"), out = [];
    tk.forEach((x, i) => {
      if (x === "-" || x === ".") { out.push(null); return; }
      let len = 1;
      while (tk[i + len] === "-") len++;
      out.push({ n: midi(x), len });
    });
    return out;
  };

  // 曲：bpm、メロディの 音色、メロディ、ベース、ドラム（16分音符 16こで 1小節：k たいこ s スネア h ハイハット o オープンハット t タム）、
  //     scale：調（和音の 3度を きめる）、arp：和音の アルペジオ、bassWave：ベースの 音色
  const SONGS = {
    // ホーム：明るく 元気
    home: { name: "ホーム", bpm: 120, wave: "square", vol: 0.05, scale: [0, 2, 4, 5, 7, 9, 11], arp: "triangle", bassWave: "sawtooth",
      lead: "E5 . G5 . A5 G5 E5 . | F5 . A5 . G5 - - . | E5 . G5 . C6 B5 A5 . | G5 - - - . . . . | A5 . C6 . B5 A5 G5 . | F5 . A5 . G5 F5 E5 . | D5 . E5 F5 G5 . B4 . | C5 - - - . . . .",
      bass: "C3 . C4 . C3 . G3 . | F2 . F3 . F2 . C3 . | C3 . C4 . C3 . G3 . | G2 . G3 . G2 . D3 . | F2 . F3 . F2 . C3 . | C3 . C4 . A2 . A3 . | G2 . G3 . G2 . B2 . | C3 . C4 . C3 . G2 .",
      drum: "kh . h . sh . h kh . kh h . sh . h o" },
    // 漢字の国：和風（こと・たいこ）
    kanji: { name: "漢字の国（和風）", bpm: 100, wave: "triangle", vol: 0.09, pluck: true, scale: [0, 2, 4, 7, 9], arp: null, bassWave: "triangle",
      lead: "D5 . E5 G5 A5 - G5 . | E5 . D5 E5 G5 - - . | A5 . B5 A5 G5 . E5 . | D5 - - - . . . . | G5 . A5 . B5 D6 B5 . | A5 . G5 A5 E5 - - . | G5 . E5 . D5 E5 G5 A5 | D5 - - - . . . .",
      bass: "D3 . . D3 A2 . . . | D3 . . D3 A2 . . . | G2 . . G2 D3 . . . | D3 . . D3 A2 . . . | G2 . . G2 D3 . . . | A2 . . A2 E3 . . . | G2 . . G2 A2 . . . | D3 . . D3 D2 . . .",
      drum: "k . . k . . t . k . k . s . t t" },
    // ことばの国：やさしいけど はずむ
    kotoba: { name: "ことばの国", bpm: 108, wave: "sine", vol: 0.11, scale: [0, 2, 4, 5, 7, 9, 10], arp: "sine", bassWave: "triangle",
      lead: "A5 - G5 F5 G5 - A5 . | C6 - A5 - G5 - - . | F5 - G5 A5 Bb5 - A5 G5 | A5 - - - . . . . | D6 - C6 Bb5 A5 - G5 . | F5 - G5 A5 C6 - - . | Bb5 - A5 G5 E5 - G5 . | F5 - - - . . . .",
      bass: "F2 . F3 . C3 . F3 . | F2 . F3 . C3 . F3 . | Bb2 . Bb3 . F3 . Bb3 . | F2 . F3 . C3 . F3 . | Bb2 . Bb3 . F3 . Bb3 . | F2 . F3 . C3 . A3 . | C3 . C4 . G3 . C4 . | F2 . F3 . C3 . F2 .",
      drum: "k . h . s . h . k . h k s . h ." },
    // 算数の国：ぴょんぴょん はずむ
    math: { name: "算数の国", bpm: 138, wave: "square", vol: 0.045, pluck: true, scale: [0, 2, 4, 5, 7, 9, 11], arp: "square", bassWave: "square",
      lead: "G5 B5 D6 B5 G5 . D5 . | E5 G5 C6 G5 E5 . C5 . | D5 F#5 A5 F#5 D5 . A4 . | B4 D5 G5 . . . G5 . | C6 B5 A5 G5 F#5 G5 A5 . | B5 A5 G5 F#5 E5 F#5 G5 . | A5 . D5 . F#5 . A5 . | G5 . D5 . G4 . . .",
      bass: "G2 . G3 . D3 . G3 . | C3 . C4 . G2 . C3 . | D3 . D4 . A2 . D3 . | G2 . G3 . G2 . D3 . | C3 . C4 . G2 . C3 . | E2 . E3 . B2 . E3 . | D3 . D4 . A2 . F#2 . | G2 . G3 . D3 . G2 .",
      drum: "kh h sh h kh h sh h kh h sh h kh kh sh o" },
    // 理科の国：なぞめいた 実験室
    sci: { name: "理科の国", bpm: 96, wave: "sine", vol: 0.11, echo: true, scale: [0, 2, 3, 5, 7, 8, 11], arp: "sine", bassWave: "sawtooth",
      lead: "A5 . E5 . C6 . B5 . | A5 - - . G#5 - - . | F5 . C5 . A5 . G5 . | E5 - - - . . . . | D5 . F5 . A5 . C6 . | B5 - - . E5 - - . | F5 . A5 . E6 . D6 . | C6 . B5 . A5 - - .",
      bass: "A2 . A2 . E3 . A2 . | A2 . A2 . E3 . E2 . | F2 . F2 . C3 . F2 . | E2 . E2 . B2 . E2 . | D2 . D2 . A2 . D2 . | E2 . E2 . G#2 . E2 . | F2 . F2 . C3 . F2 . | E2 . E2 . A2 . A2 .",
      drum: "k . . h . . s . . h k . s . h h" },
    // 社会の国：いさましい 行進
    soc: { name: "社会の国（行進）", bpm: 120, wave: "square", vol: 0.05, scale: [0, 2, 3, 5, 7, 9, 10], arp: "triangle", bassWave: "sawtooth",
      lead: "D5 . D5 E5 F5 . A5 . | G5 . F5 E5 D5 - - . | C5 . C5 D5 E5 . G5 . | F5 . E5 D5 E5 - - . | D5 . D5 E5 F5 . A5 . | D6 . C6 A5 G5 - A5 . | Bb5 . A5 G5 F5 . E5 . | D5 - - - . . . .",
      bass: "D3 . A2 . D3 . A2 . | G2 . D3 . G2 . D3 . | C3 . G2 . C3 . G2 . | A2 . E3 . A2 . C#3 . | D3 . A2 . D3 . A2 . | F2 . C3 . F2 . C3 . | Bb2 . F3 . A2 . E3 . | D3 . A2 . D3 . . .",
      drum: "k . s s k . s . k . s s k s s s" },
    // ショップ：のんびり おかいもの
    shop: { name: "ショップ", bpm: 108, wave: "triangle", vol: 0.1, scale: [0, 2, 4, 5, 7, 9, 10], arp: "sine", bassWave: "triangle",
      lead: "C6 . A5 . F5 G5 A5 . | G5 . E5 . C5 - - . | D5 . F5 . A5 G5 F5 . | E5 - - - . . . . | C6 . A5 . F5 G5 A5 . | Bb5 . G5 . E5 F5 G5 . | A5 . G5 . E5 . D5 . | F5 - - - . . . .",
      bass: "F2 . A2 . C3 . A2 . | C3 . E3 . G3 . E3 . | Bb2 . D3 . F3 . D3 . | C3 . G2 . E2 . C2 . | F2 . A2 . C3 . A2 . | G2 . Bb2 . C3 . E3 . | C3 . E3 . G3 . E3 . | F2 . C3 . F2 . . .",
      drum: "k . h . s . h h k . h . s . h ." },
    // ボス：はやくて きんちょうする 曲
    boss: { name: "ボス", bpm: 168, wave: "sawtooth", vol: 0.045, scale: [0, 2, 3, 5, 7, 8, 11], arp: "square", bassWave: "sawtooth", heavy: true,
      lead: "E5 . . E5 G5 . F#5 . | E5 . . B4 D5 - - . | C5 . . C5 E5 . D#5 . | B4 - - - - . . . | E5 . . G5 B5 . A5 . | G5 . F#5 . E5 - D5 . | C5 . E5 . A5 . G5 . | F#5 - - - D#5 - - .",
      bass: "E2 E2 E3 E2 E2 E2 E3 E2 | E2 E2 E3 E2 G2 G2 G3 G2 | C2 C2 C3 C2 C2 C2 C3 C2 | B1 B1 B2 B1 B1 B1 B2 B1 | E2 E2 E3 E2 E2 E2 E3 E2 | C2 C2 C3 C2 D2 D2 D3 D2 | A1 A1 A2 A1 C2 C2 C3 C2 | B1 B1 B2 B1 B1 B1 B2 B1",
      drum: "kh h sh h kh kh sh h kh h sh h kh kh sh sh" },
  };
  Object.values(SONGS).forEach((s) => { s.L = parse(s.lead); s.Bs = parse(s.bass); s.D = s.drum.split(/\s+/); });

  // ---------- 1曲ぶんを 音に する ----------
  // WebAudio の 部品を たくさん つかうと おそいので、音の 波を じぶんで 計算して つくる（1曲 0.1秒ほど）。
  // 音は くりかえしの 長さで まわりこむように 書くので、さいごから さいしょへ 自然に つながる。
  const RATE = 22050, TW = 2048;
  // 波の 形（倍音を へらして 耳に やさしく）
  const table = (harm) => { const t = new Float32Array(TW); for (let i = 0; i < TW; i++) { let v = 0; harm.forEach(([h, a]) => { v += a * Math.sin((2 * Math.PI * h * i) / TW); }); t[i] = v; } let m = 0; t.forEach((v) => { m = Math.max(m, Math.abs(v)); }); for (let i = 0; i < TW; i++) t[i] /= m; return t; };
  const WT = {
    sine: table([[1, 1]]),
    square: table([1, 3, 5, 7, 9, 11].map((h) => [h, 1 / h])),
    sawtooth: table([1, 2, 3, 4, 5, 6, 7, 8].map((h) => [h, 1 / h])),
    triangle: table([1, 3, 5, 7].map((h, k) => [h, (k % 2 ? -1 : 1) / (h * h)])),
    bass: table([1, 2, 3, 4].map((h) => [h, 1 / h])),
  };
  const cache = {};
  function render(name) {
    if (cache[name]) return cache[name];
    // 1回の くりかえし ＝ Aメロ（そのまま）＋ A'（メロディを 1オクターブ 上げて もりあげる）
    const s = SONGS[name], spb = 30 / s.bpm, half = s.L.length, steps = half * 2;
    const N = Math.round(steps * spb * RATE);
    const lead = new Float32Array(N), mix = new Float32Array(N);
    const at = (t) => Math.round(t * RATE);
    // 音を 1つ 書く（pluck：はじく音、それ以外は のばす音）
    const note = (buf, tb, n, dur, peak, wave, o = {}) => {
      const f = hz(n) * (o.detune ? Math.pow(2, o.detune / 1200) : 1), w = WT[wave] || WT.sine;
      const s0 = at(tb), len = at(dur + (o.pluck ? 0.05 : 0.06)), att = Math.max(1, at(o.a || 0.008)), rel = at(0.06), body = at(dur);
      const dec = o.dec || dur, step = (f * TW) / RATE;
      let ph = 0;
      for (let i = 0; i < len; i++) {
        let e;
        if (i < att) e = i / att;
        else if (o.pluck) e = Math.exp(-(i - att) / (dec * RATE * 0.45));
        else e = i < body ? 1 : Math.max(0, 1 - (i - body) / rel);
        buf[(s0 + i) % N] += peak * e * w[ph | 0];
        ph += step; if (ph >= TW) ph -= TW;
      }
    };
    // ノイズ（たいこ用）。kind：h ハイハット、s スネア、c シンバル
    let seed = 12345;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x3fffffff - 1; };
    const noiseHit = (tb, len, peak, kind) => {
      const s0 = at(tb), L = at(len); let prev = 0, lp = 0;
      for (let i = 0; i < L; i++) {
        const x = rnd(); let v;
        if (kind === "s") { lp += 0.35 * (x - lp); v = x - lp * 0.6; } // すこし こもった ノイズ
        else { v = x - prev; prev = x; } // 高い ノイズ
        mix[(s0 + i) % N] += peak * v * Math.exp(-i / (L * 0.3));
      }
    };
    const sweep = (tb, f0, f1, len, peak, tau) => {
      const s0 = at(tb), L = at(len); let ph = 0;
      for (let i = 0; i < L; i++) {
        const t = i / RATE, f = f1 + (f0 - f1) * Math.exp(-t / tau);
        ph += (2 * Math.PI * f) / RATE;
        mix[(s0 + i) % N] += peak * Math.sin(ph) * Math.exp(-t / (len * 0.35));
      }
    };
    const kick = (tb) => { sweep(tb, s.heavy ? 170 : 150, 42, 0.26, s.heavy ? 0.95 : 0.8, 0.03); noiseHit(tb, 0.012, 0.25, "h"); };
    const snare = (tb) => { noiseHit(tb, 0.17, 0.5, "s"); sweep(tb, 200, 170, 0.08, 0.3, 0.05); };
    const tom = (tb) => sweep(tb, 230, 110, 0.25, 0.55, 0.08);
    const third = (r) => (s.scale.includes((r + 4) % 12) ? 4 : 3);
    const fifth = (r) => (s.scale.includes((r + 7) % 12) ? 7 : 6);

    noiseHit(0, 1.2, 0.16, "h"); // シンバル（くりかえしの あたま）
    let root = 48;
    for (let i = 0; i < steps; i++) {
      const t = i * spb, j = i % half, up = i >= half, n = s.L[j], b = s.Bs[j % s.Bs.length];
      // A' では メロディを 1オクターブ 上に（高すぎる 音は そのまま）
      const shift = up && n && n.n && n.n + 12 <= 93 ? 12 : 0;
      // それぞれの さいごの 1小節は ドラムの「おかず」（フィルイン）
      const fill = j >= half - 4;
      if (n && n.n) {
        const dur = n.len * spb * 0.92, v = shift ? s.vol * 0.8 : s.vol, o = { pluck: s.pluck, dec: Math.min(dur, 0.5) };
        note(lead, t, n.n + shift, dur, v, s.wave, o);
        note(lead, t, n.n + shift, dur, v * 0.6, s.wave, Object.assign({ detune: 9 }, o));
        if (shift) note(lead, t, n.n, dur, v * 0.35, s.wave, o);
      }
      if (b && b.n) { root = b.n; note(mix, t, b.n, Math.min(b.len, 2) * spb * 0.8, s.heavy ? 0.34 : 0.3, "bass", { a: 0.004 }); }
      if (s.arp) {
        const r = 60 + (root % 12), chord = [r, r + third(r % 12), r + fifth(r % 12), r + 12];
        for (let k = 0; k < 2; k++) note(mix, t + (k * spb) / 2, chord[(i * 2 + k) % 4], (spb / 2) * 0.9, 0.04, s.arp, { pluck: true, dec: spb / 2 });
      }
      for (let k = 0; k < 2; k++) {
        let d = s.D[(i * 2 + k) % s.D.length] || ".";
        const tt = t + (k * spb) / 2;
        if (fill) d = (j === half - 1 && k === 1 ? "ks" : "s") + (up ? "h" : "");
        if (d.includes("k")) kick(tt);
        if (d.includes("s")) snare(tt);
        if (d.includes("t")) tom(tt);
        if (d.includes("h")) noiseHit(tt, 0.035, 0.12, "h");
        if (d.includes("o")) noiseHit(tt, 0.2, 0.09, "h");
      }
    }
    // メロディに こだま（エコー）を つけて まぜる（まわりこみ も ふくめて 2回 まわす）
    const D = at(spb * 1.5), fb = 0.28, wet = s.echo ? 0.45 : 0.18, eb = new Float32Array(N);
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < N; i++) eb[i] = lead[i] + fb * eb[(i - D + N) % N];
    for (let i = 0; i < N; i++) mix[i] += lead[i] + wet * (eb[i] - lead[i]);
    // 音を まるく まとめる（大きすぎる ところを やわらかく おさえる）
    let pk = 0;
    for (let i = 0; i < N; i++) { mix[i] = Math.tanh(mix[i] * 1.1); pk = Math.max(pk, Math.abs(mix[i])); }
    const g = pk > 0 ? 0.9 / pk : 1;
    const out = AC.createBuffer(1, N, RATE), ch = out.getChannelData(0);
    for (let i = 0; i < N; i++) ch[i] = mix[i] * g;
    cache[name] = Promise.resolve(out);
    return cache[name];
  }

  // ---------- 鳴らす ----------
  let cur = "", src = null, gain = null, want = "", forced = false;
  const ctxReady = () => { if (!AC) { setAmbient(); AC = new (window.AudioContext || window.webkitAudioContext)(); } return AC; };
  const enabled = () => forced || !!(S && S.bgm);

  function stopNow() {
    cur = ""; want = "";
    if (src) {
      const s2 = src, g = gain;
      try { g.gain.setTargetAtTime(0, AC.currentTime, 0.08); setTimeout(() => { try { s2.stop(); } catch (e) { /* 無視 */ } g.disconnect(); }, 500); } catch (e) { /* 無視 */ }
      src = null; gain = null;
    }
  }
  // 曲を かける（同じ 曲なら そのまま）
  function play(name) {
    if (!enabled() || document.visibilityState === "hidden") { stopNow(); return; }
    if (!SONGS[name]) name = "home";
    if ((cur === name && src) || want === name) return;
    try {
      ctxReady();
      if (AC.state === "suspended") AC.resume();
      want = name;
      render(name).then((buf) => {
        if (want !== name || !enabled()) return;
        stopNow();
        cur = name;
        src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
        gain = AC.createGain(); gain.gain.setValueAtTime(0.0001, AC.currentTime); gain.gain.exponentialRampToValueAtTime(0.8, AC.currentTime + 0.4);
        src.connect(gain).connect(AC.destination);
        src.start();
      }).catch(() => { want = ""; });
    } catch (e) { cur = ""; want = ""; }
  }

  // 画面に あわせて 曲を えらぶ
  function auto(cls) {
    if (forced) return;
    let name = "home";
    if (cls === "bg-battle" && typeof B !== "undefined" && B && B.e) {
      name = B.e.boss || (B.st && B.st.n === 4) ? "boss" : B.st && B.st.ch && SONGS[B.st.ch.w] ? B.st.ch.w : "sci";
    } else if (cls === "bg-map") name = bgmHere;
    else if (cls === "bg-shop") name = "shop";
    play(name);
  }
  let lastCls = "";
  return {
    songs: () => Object.keys(SONGS).map((k) => ({ id: k, name: SONGS[k].name })),
    auto(cls) { lastCls = cls; auto(cls); },
    refresh() { if (enabled()) { stopNow(); auto(lastCls); } else stopNow(); },
    stop: stopNow,
    // デバッグ：せっていに かかわらず その曲を 鳴らす（name なしで やめる）
    preview(name) { if (!name) { forced = false; stopNow(); auto(lastCls); return; } forced = true; stopNow(); play(name); },
    previewing: () => (forced ? cur || want : ""),
    bufferOf: (name) => { ctxReady(); return render(name); }, // 確認用
    // 画面に もどったときに 再開
    resume() { if (!enabled()) return; if (AC && AC.state === "suspended") AC.resume(); if (!cur && !want) auto(lastCls); },
    pause() { if (AC && AC.state === "running") AC.suspend().catch(() => {}); },
  };
})();

// ほかの アプリに うつったら 止める／もどったら 再開
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") BGM.pause(); else BGM.resume(); });
// さいしょの タッチで 音を 出せる じょうたいに する（iPhoneは タッチの あとしか 鳴らせない）
document.addEventListener("pointerdown", () => { if (S && S.bgm) BGM.resume(); }, { passive: true });
