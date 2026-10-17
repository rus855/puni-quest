// ===== 漢字の 読みの 問題で「それらしい まちがい」を つくる =====
// 例：子犬（こいぬ）→ 子の 読み「こ」は そのまま、犬の 部分だけ かえる（こけん・こいね・こたい …）
//     田んぼ（たんぼ）→「んぼ」は そのまま、田の 部分だけ かえる（でんんぼ・ゆんぼ …）
// こうすると、ほかの 字の 読みや ひらがなの 部分から 消去法で 答えが わからない
"use strict";

const YOMI = (() => {
  const isK = (c) => /[一-鿿々]/.test(c);
  const DAKU = { か: "が", き: "ぎ", く: "ぐ", け: "げ", こ: "ご", さ: "ざ", し: "じ", す: "ず", せ: "ぜ", そ: "ぞ", た: "だ", ち: "ぢ", つ: "づ", て: "で", と: "ど", は: "ば", ひ: "び", ふ: "ぶ", へ: "べ", ほ: "ぼ" };
  const HAN = { は: "ぱ", ひ: "ぴ", ふ: "ぷ", へ: "ぺ", ほ: "ぽ" };
  let KR = null; // 漢字 → 読みの 集合

  // 読みの かわりかた（にごる・小さい つ）も ふくめる
  function variants(p) {
    const out = new Set([p]);
    const f = p[0];
    if (DAKU[f]) out.add(DAKU[f] + p.slice(1));
    if (HAN[f]) out.add(HAN[f] + p.slice(1));
    if (p.length >= 2 && /[つくちき]$/.test(p)) out.add(p.slice(0, -1) + "っ");
    return [...out];
  }
  // 1つの 漢字の 読みを あつめる（漢字1字の ことば → 2字の 熟語を くりかえし 分ける）
  function build() {
    KR = {};
    const add = (k, p) => { if (!p) return false; KR[k] = KR[k] || new Set(); if (KR[k].has(p)) return false; KR[k].add(p); return true; };
    const all = [];
    KANJI.forEach((K) => K.w.forEach(([w, r]) => all.push([w, r])));
    all.forEach(([w, r]) => {
      const ks = [...w].filter(isK);
      if (ks.length !== 1) return;
      const i = w.indexOf(ks[0]), pre = w.slice(0, i), post = w.slice(i + 1);
      if (r.startsWith(pre) && r.endsWith(post) && r.length > pre.length + post.length) add(ks[0], r.slice(pre.length, r.length - post.length));
    });
    for (let it = 0; it < 4; it++) all.forEach(([w, r]) => {
      if (w.length !== 2 || !isK(w[0]) || !isK(w[1])) return;
      const [a, b] = w;
      [...(KR[a] || [])].forEach((p) => variants(p).forEach((v) => { if (r.startsWith(v) && r.length > v.length) add(b, r.slice(v.length)); }));
      [...(KR[b] || [])].forEach((p) => variants(p).forEach((v) => { if (r.endsWith(v) && r.length > v.length) add(a, r.slice(0, r.length - v.length)); }));
    });
  }
  const readings = (k) => { if (!KR) build(); return [...(KR[k] || [])]; };

  // ことばの 読みを「目当ての 漢字の 前・漢字の 読み・後ろ」に 分ける
  // 分け方を ぜんぶ ためして、知っている 読みと 合う 分け方ほど 点を 高く する
  // 読みの 長さの それらしさ（音読みは「ん・う・い・く・つ・き・ち」で おわる 2文字が 多い）
  const likely = (part) => (part.length === 2 && /[んういくつきち]$/.test(part) ? 1.2 : part.length === 1 ? 0.6 : part.length === 2 ? 0.8 : 0.2);
  function split(word, reading, k) { return split1(word, reading, k, false) || split1(word, reading, k, true); }
  function split1(word, reading, k, relaxed) {
    if (!KR) build();
    const ch = [...word];
    let best = null, bestScore = -1;
    const go = (ci, ri, tgt, score) => {
      if (ci === ch.length) {
        if (ri === reading.length && tgt && score > bestScore) { best = tgt; bestScore = score; }
        return;
      }
      const c = ch[ci];
      if (!isK(c)) { if (reading[ri] === c) go(ci + 1, ri + 1, tgt, score); return; }
      const known = new Set(readings(c).flatMap(variants));
      for (let L = 1; L <= 5 && ri + L <= reading.length; L++) {
        const part = reading.slice(ri, ri + L), ok = known.has(part);
        // 漢字の 読みは「ん・っ・ゃ」などから はじまらない
        if (/^[んっゃゅょぁぃぅぇぉー]/.test(part)) continue;
        const sc = score + (ok ? 3 : likely(part));
        if (c === k && !tgt) go(ci + 1, ri + L, { s: ri, e: ri + L }, sc);
        else if (c !== k || tgt) { if (ok || !known.size || relaxed) go(ci + 1, ri + L, tgt, sc); }
      }
    };
    go(0, 0, null, 0);
    if (!best) return null;
    return { pre: reading.slice(0, best.s), p: reading.slice(best.s, best.e), suf: reading.slice(best.e) };
  }

  // 1文字 ちがいの にた 読み（母音を かえる）
  const ROWS = ["あいうえお", "かきくけこ", "がぎぐげご", "さしすせそ", "ざじずぜぞ", "たちつてと", "だでど", "なにぬねの", "はひふへほ", "ばびぶべぼ", "ぱぴぷぺぽ", "まみむめも", "やゆよ", "らりるれろ", "わを"];
  function mutate(p) {
    const out = [];
    [...p].forEach((c, i) => {
      const row = ROWS.find((r) => r.includes(c));
      if (!row) return;
      [...row].forEach((x) => { if (x !== c) out.push(p.slice(0, i) + x + p.slice(i + 1)); });
    });
    return out;
  }

  // まちがいの 選択肢を 3つ つくる（作れなければ null）
  function distractors(K, word, reading) {
    const sp = split(word, reading, K.k);
    if (!sp) return null;
    const { pre, p, suf } = sp;
    const mk = (q) => pre + q + suf;
    // 日本語として ありえない ならび（「んん」や 小さい つで おわる など）は つかわない
    const odd = (x) => /んん|^ん|^っ|っ$|っん|んっ|っっ|^ー/.test(x) || /(^|[^きしちにひみりぎじぢびぴ])[ゃゅょ]/.test(x) || (/[ぢづ]/.test(x) && !/[ぢづ]/.test(reading));
    const near = (q) => Math.abs(q.length - p.length) <= 1;
    const pickFrom = (list) => shuffle(list.filter((q) => q && q !== p && near(q) && mk(q) !== reading));
    // ① その 漢字の べつの 読み（知らないと まよう）
    const own = pickFrom(readings(K.k).filter((q) => !variants(p).includes(q)));
    // ② 形の にた 漢字の 読み
    const sim = pickFrom((K.sim || []).flatMap(readings));
    // ③ 同じ 学年の ほかの 漢字の 読み
    const grade = pickFrom(shuffle(KANJI.filter((x) => x.g === K.g && x.k !== K.k)).slice(0, 40).flatMap((x) => readings(x.k)));
    // ④ 1文字 ちがい
    const mut = pickFrom(mutate(p));
    const out = [];
    const take = (list, n) => { for (const q of list) { if (out.length >= 3 || n <= 0) break; const s = mk(q); if (!out.includes(s) && s !== reading && !odd(s)) { out.push(s); n--; } } };
    take(own, 1); take(sim, 1); take(mut, 1); take(grade, 3); take(own, 3); take(sim, 3); take(mut, 3);
    return out.length >= 3 ? out : null;
  }
  return { distractors, split, readings };
})();
