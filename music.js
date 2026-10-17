// ===== BGM（WebAudioで その場で 作る 音楽） =====
// ・音声ファイルは 使わない（<audio>要素は マナーモードでも 鳴るため 使わない）
// ・「ambient（まわりの音）」として 鳴らすので、iPhoneの マナーモード中は スピーカーから 鳴らない
// ・せっていで オフに できる（さいしょは オフ）
"use strict";
let bgmHere = "home"; // いまの 画面の 曲（地図・国の 画面で かえる）

// iPhone（Safari 16.4〜）：マナーモードに したがう 音の 種類に する
function setAmbient() {
  try { if (navigator.audioSession) navigator.audioSession.type = "ambient"; } catch (e) { /* 対応していない */ }
}
setAmbient();

const BGM = (() => {
  // 音名 → 周波数（例 "C5" "F#4" "Bb3"）
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const hz = (t) => {
    const m = t.match(/^([A-G])([#b]?)(\d)$/);
    if (!m) return 0;
    const n = SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + (Number(m[3]) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  };
  // 楽ふ：1こ = 8分音符。「-」は のばす、「.」は やすみ、「|」は 小節の くぎり（読みとばす）
  const parse = (s) => {
    const tk = s.split(/\s+/).filter((x) => x && x !== "|"), out = [];
    tk.forEach((x, i) => {
      if (x === "-" || x === ".") { out.push(null); return; }
      let len = 1;
      while (tk[i + len] === "-") len++;
      out.push({ f: hz(x), len });
    });
    return out;
  };

  // 曲：bpm、メロディの 音色、メロディ、ベース、ドラム（k:たいこ s:スネア h:ハイハット）
  const SONGS = {
    // ホーム：明るく 元気
    home: { bpm: 112, wave: "square", vol: 0.035,
      lead: "E5 . G5 . A5 G5 E5 . | F5 . A5 . G5 - - . | E5 . G5 . C6 B5 A5 . | G5 - - - . . . . | A5 . C6 . B5 A5 G5 . | F5 . A5 . G5 F5 E5 . | D5 . E5 F5 G5 . B4 . | C5 - - - . . . .",
      bass: "C3 . G3 . C3 . G3 . | F2 . C3 . F2 . C3 . | C3 . G3 . C3 . G3 . | G2 . D3 . G2 . D3 . | F2 . C3 . F2 . C3 . | C3 . G3 . A2 . E3 . | G2 . D3 . G2 . B2 . | C3 . G3 . C3 . . .",
      drum: "k . h . s . h ." },
    // もじの国：和風（こと の ような 音）
    kanji: { bpm: 96, wave: "triangle", vol: 0.06, pluck: true,
      lead: "D5 . E5 G5 A5 - G5 . | E5 . D5 E5 G5 - - . | A5 . B5 A5 G5 . E5 . | D5 - - - . . . . | G5 . A5 . B5 D6 B5 . | A5 . G5 A5 E5 - - . | G5 . E5 . D5 E5 G5 A5 | D5 - - - . . . .",
      bass: "D3 . . . A2 . . . | D3 . . . A2 . . . | G2 . . . D3 . . . | D3 . . . A2 . . . | G2 . . . D3 . . . | A2 . . . E3 . . . | G2 . . . A2 . . . | D3 . . . D3 . . .",
      drum: "k . . . k . s ." },
    // ことばの国：やさしい ふえの ような 曲
    kotoba: { bpm: 100, wave: "sine", vol: 0.07,
      lead: "A5 - G5 F5 G5 - A5 . | C6 - A5 - G5 - - . | F5 - G5 A5 Bb5 - A5 G5 | A5 - - - . . . . | D6 - C6 Bb5 A5 - G5 . | F5 - G5 A5 C6 - - . | Bb5 - A5 G5 E5 - G5 . | F5 - - - . . . .",
      bass: "F2 . C3 . A3 . C3 . | F2 . C3 . A3 . C3 . | Bb2 . F3 . D3 . F3 . | F2 . C3 . A3 . C3 . | Bb2 . F3 . D3 . F3 . | F2 . C3 . A3 . C3 . | C3 . G3 . E3 . G3 . | F2 . C3 . F2 . . .",
      drum: "k . . . h . . ." },
    // かずの国：ぴょんぴょん はずむ 曲
    math: { bpm: 132, wave: "square", vol: 0.03, pluck: true,
      lead: "G5 B5 D6 B5 G5 . D5 . | E5 G5 C6 G5 E5 . C5 . | D5 F#5 A5 F#5 D5 . A4 . | B4 D5 G5 . . . G5 . | C6 B5 A5 G5 F#5 G5 A5 . | B5 A5 G5 F#5 E5 F#5 G5 . | A5 . D5 . F#5 . A5 . | G5 . D5 . G4 . . .",
      bass: "G2 . D3 . G2 . D3 . | C3 . G2 . C3 . G2 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . . . | C3 . G2 . C3 . G2 . | E2 . B2 . E2 . B2 . | D3 . A2 . D3 . F#2 . | G2 . D3 . G2 . . .",
      drum: "k h s h k h s h" },
    // ふしぎの国：なぞめいた 実験室
    sci: { bpm: 90, wave: "sine", vol: 0.07, echo: true,
      lead: "A5 . E5 . C6 . B5 . | A5 - - . G#5 - - . | F5 . C5 . A5 . G5 . | E5 - - - . . . . | D5 . F5 . A5 . C6 . | B5 - - . E5 - - . | F5 . A5 . E6 . D6 . | C6 . B5 . A5 - - .",
      bass: "A2 - - - E3 - - - | A2 - - - E3 - - - | F2 - - - C3 - - - | E2 - - - B2 - - - | D2 - - - A2 - - - | E2 - - - G#2 - - - | F2 - - - C3 - - - | E2 - - - A2 - - -",
      drum: "k . . h . . h ." },
    // むかしの国：いさましい 行進
    soc: { bpm: 116, wave: "square", vol: 0.032,
      lead: "D5 . D5 E5 F5 . A5 . | G5 . F5 E5 D5 - - . | C5 . C5 D5 E5 . G5 . | F5 . E5 D5 E5 - - . | D5 . D5 E5 F5 . A5 . | D6 . C6 A5 G5 - A5 . | Bb5 . A5 G5 F5 . E5 . | D5 - - - . . . .",
      bass: "D3 . A2 . D3 . A2 . | G2 . D3 . G2 . D3 . | C3 . G2 . C3 . G2 . | A2 . E3 . A2 . C#3 . | D3 . A2 . D3 . A2 . | F2 . C3 . F2 . C3 . | Bb2 . F3 . A2 . E3 . | D3 . A2 . D3 . . .",
      drum: "k . s s k . s ." },
    // ショップ：のんびり おかいもの
    shop: { bpm: 104, wave: "triangle", vol: 0.07,
      lead: "C6 . A5 . F5 G5 A5 . | G5 . E5 . C5 - - . | D5 . F5 . A5 G5 F5 . | E5 - - - . . . . | C6 . A5 . F5 G5 A5 . | Bb5 . G5 . E5 F5 G5 . | A5 . G5 . E5 . D5 . | F5 - - - . . . .",
      bass: "F2 . A2 . C3 . A2 . | C3 . E3 . G3 . E3 . | Bb2 . D3 . F3 . D3 . | C3 . G2 . E2 . C2 . | F2 . A2 . C3 . A2 . | G2 . Bb2 . C3 . E3 . | C3 . E3 . G3 . E3 . | F2 . C3 . F2 . . .",
      drum: "k . h . s . h h" },
    // ボス：はやくて きんちょうする 曲
    boss: { bpm: 168, wave: "sawtooth", vol: 0.028,
      lead: "E5 . . E5 G5 . F#5 . | E5 . . B4 D5 - - . | C5 . . C5 E5 . D#5 . | B4 - - - - . . . | E5 . . G5 B5 . A5 . | G5 . F#5 . E5 - D5 . | C5 . E5 . A5 . G5 . | F#5 - - - D#5 - - .",
      bass: "E2 E2 E3 E2 E2 E2 E3 E2 | E2 E2 E3 E2 G2 G2 G3 G2 | C2 C2 C3 C2 C2 C2 C3 C2 | B1 B1 B2 B1 B1 B1 B2 B1 | E2 E2 E3 E2 E2 E2 E3 E2 | C2 C2 C3 C2 D2 D2 D3 D2 | A1 A1 A2 A1 C2 C2 C3 C2 | B1 B1 B2 B1 B1 B1 B2 B1",
      drum: "k h s h k k s h" },
  };
  Object.values(SONGS).forEach((s) => { s.L = parse(s.lead); s.Bs = parse(s.bass); s.D = s.drum.split(/\s+/); });

  let cur = "", step = 0, nextT = 0, timer = null, out = null, noise = null;

  const ctx = () => {
    if (!AC) { setAmbient(); AC = new (window.AudioContext || window.webkitAudioContext)(); }
    return AC;
  };
  const enabled = () => !!(S && S.bgm);

  // 1つの 音を ならす
  function tone(f, t, dur, wave, vol, pluck) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = wave; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    if (pluck) g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(dur, 0.45));
    else { g.gain.setValueAtTime(vol, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    o.connect(g).connect(out);
    o.start(t); o.stop(t + dur + 0.05);
  }
  // たいこの 音
  function drum(k, t) {
    if (k === "k") {
      const o = AC.createOscillator(), g = AC.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      o.connect(g).connect(out); o.start(t); o.stop(t + 0.2);
      return;
    }
    if (k !== "s" && k !== "h") return;
    if (!noise) {
      noise = AC.createBuffer(1, AC.sampleRate * 0.3, AC.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const n = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    n.buffer = noise;
    f.type = k === "s" ? "bandpass" : "highpass"; f.frequency.value = k === "s" ? 1800 : 7000;
    const len = k === "s" ? 0.12 : 0.04;
    g.gain.setValueAtTime(k === "s" ? 0.06 : 0.025, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    n.connect(f).connect(g).connect(out); n.start(t); n.stop(t + len + 0.02);
  }

  // 少し 先まで 楽ふを よやくする
  function tick() {
    if (!cur || !AC || AC.state !== "running") return;
    const s = SONGS[cur], spb = 30 / s.bpm; // 8分音符の 長さ（秒）
    if (nextT < AC.currentTime) nextT = AC.currentTime + 0.05;
    while (nextT < AC.currentTime + 0.25) {
      const i = step % s.L.length, b = step % s.Bs.length, d = step % s.D.length;
      const n = s.L[i], bn = s.Bs[b];
      if (n && n.f) {
        tone(n.f, nextT, n.len * spb, s.wave, s.vol, s.pluck);
        if (s.echo) tone(n.f, nextT + spb * 1.5, n.len * spb, s.wave, s.vol * 0.35, s.pluck);
      }
      if (bn && bn.f) tone(bn.f, nextT, bn.len * spb * 0.9, "triangle", 0.09, false);
      drum(s.D[d], nextT);
      nextT += spb; step++;
    }
  }

  function stopNow() {
    cur = "";
    if (out) { try { const o = out; o.gain.setTargetAtTime(0, AC.currentTime, 0.05); setTimeout(() => o.disconnect(), 400); } catch (e) { /* 無視 */ } out = null; }
    if (timer) { clearInterval(timer); timer = null; }
  }

  // 曲を かける（同じ 曲なら そのまま）
  function play(name) {
    if (!enabled() || document.visibilityState === "hidden") { stopNow(); return; }
    if (!SONGS[name]) name = "home";
    if (cur === name && out) return;
    try {
      ctx();
      stopNow();
      cur = name; step = 0; nextT = 0;
      out = AC.createGain(); out.gain.value = 0.8; out.connect(AC.destination);
      if (AC.state === "suspended") AC.resume();
      timer = setInterval(tick, 60);
      tick();
    } catch (e) { cur = ""; }
  }

  // 画面に あわせて 曲を えらぶ
  function auto(cls) {
    let name = "home";
    if (cls === "bg-battle" && typeof B !== "undefined" && B && B.e) {
      name = B.e.boss || (B.st && B.st.n === 4) ? "boss" : B.st && B.st.ch ? B.st.ch.w : "sci";
    } else if (cls === "bg-map") name = bgmHere;
    else if (cls === "bg-shop") name = "shop";
    play(name);
  }
  let lastCls = "";
  return {
    auto(cls) { lastCls = cls; auto(cls); },
    refresh() { if (enabled()) { stopNow(); auto(lastCls); } else stopNow(); },
    stop: stopNow,
    // 画面に もどったときに 再開
    resume() { if (enabled() && !cur) auto(lastCls); else if (enabled() && AC && AC.state === "suspended") AC.resume(); },
    pause() { stopNow(); if (AC && AC.state === "running") AC.suspend().catch(() => {}); },
  };
})();

// ほかの アプリに うつったら 止める／もどったら 再開
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") BGM.pause(); else BGM.resume(); });
// さいしょの タッチで 音を 出せる じょうたいに する（iPhoneは タッチの あとしか 鳴らせない）
document.addEventListener("pointerdown", () => { if (S && S.bgm) BGM.resume(); }, { passive: true });
