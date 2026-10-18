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
  let STEM = null, OKU = null; // STEM[k]：送りがなの つく 読み、OKU[送りがな]：[漢字, 読みの頭] の 一覧
  function build() {
    KR = {}; STEM = {}; OKU = {};
    const add = (k, p) => { if (!p) return false; KR[k] = KR[k] || new Set(); if (KR[k].has(p)) return false; KR[k].add(p); return true; };
    const all = [];
    KANJI.forEach((K) => K.w.forEach(([w, r]) => all.push([w, r])));
    all.forEach(([w, r]) => {
      const ks = [...w].filter(isK);
      if (ks.length !== 1) return;
      const i = w.indexOf(ks[0]), pre = w.slice(0, i), post = w.slice(i + 1);
      if (r.startsWith(pre) && r.endsWith(post) && r.length > pre.length + post.length) {
        const stem = r.slice(pre.length, r.length - post.length);
        add(ks[0], stem);
        // 送りがなの つく ことば（白い・学ぶ など）
        if (post && !pre) { (STEM[ks[0]] = STEM[ks[0]] || new Set()).add(stem); (OKU[post] = OKU[post] || []).push([ks[0], stem]); }
      }
    });
    for (let it = 0; it < 4; it++) all.forEach(([w, r]) => {
      if (w.length !== 2 || !isK(w[0]) || !isK(w[1])) return;
      const [a, b] = w;
      // いちばん 長く 合う 読みだけを 使う（皇族：「こう」が わかっていれば「こ＋うぞく」とは 分けない）
      const va = [...(KR[a] || [])].flatMap(variants).filter((v) => r.startsWith(v) && r.length > v.length).sort((x, y) => y.length - x.length)[0];
      if (va) add(b, r.slice(va.length));
      const vb = [...(KR[b] || [])].flatMap(variants).filter((v) => r.endsWith(v) && r.length > v.length).sort((x, y) => y.length - x.length)[0];
      if (vb) add(a, r.slice(0, r.length - vb.length));
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
        if (/[ゃゅょ]$/.test(part)) continue; // 「ちゅ」「しょ」で おわる 読みは ない
        const sc = score + (ok ? 3 : likely(part));
        if (c === k && !tgt) go(ci + 1, ri + L, { s: ri, e: ri + L }, sc);
        else if (c !== k || tgt) { if (ok || !known.size || relaxed) go(ci + 1, ri + L, tgt, sc); }
      }
    };
    go(0, 0, null, 0);
    if (!best) return null;
    return { pre: reading.slice(0, best.s), p: reading.slice(best.s, best.e), suf: reading.slice(best.e) };
  }

  // ほんとうに ある ことばの 読み（漢字の ことば・ことばの国の ことば・よく つかう ことば）
  let LEX = null;
  const COMMON = ("こねこ こじか こうま こうし こぶた こがも こぐま こざる こいぬ こども ことり こえだ こぶね こゆび こづつみ こもり こいし こがね こなゆき " +
    "とんぼ さくらんぼ たんぽぽ たんす たんい たいこ たまご たけのこ たぬき たから たんじょうび " +
    "かいしゃ かいだん かいごう かいすい かいてん かいもの かいがら かいし かいじょう かいわ かいぎ かいけつ かいせい かいが かいとう かいふく " +
    "がくせい がっこう がっき がくしゅう がくひ がくねん がくもん せんせい せんしゅ せんろ せんたく せんす " +
    "にっき にっし にっこう にちじ にちよう まいにち まいあさ まいばん まいとし まいしゅう " +
    "はなび はなみ はなし はなぢ はなや はなたば はなばたけ ひばな ひなた ひかり ひこうき ひるま ひるね " +
    "すいでん すいぞう すいえい すいどう すいへい すいとう すいか すいせい すいよう でんしゃ でんわ でんき でんち " +
    "やまみち やまびこ やまおく やまのぼり かわら かわぎし かわぐち おがわ おおかわ みずうみ うみべ はまべ " +
    "いぬごや ねこぜ うまごや とりごや さかなや やおや ほんや くすりや はなや にくや " +
    "あおい あかい しろい くろい きいろい ちいさい おおきい ながい みじかい たかい ひくい ふかい あさい ふとい ほそい あつい さむい あたたかい つめたい " +
    "あたらしい ふるい つよい よわい はやい おそい おもい かるい ひろい せまい あかるい くらい うれしい かなしい たのしい やさしい むずかしい " +
    "うみ やま かわ そら くも あめ ゆき かぜ ほし つき はな くさ き いし すな みず ひ た はたけ もり はやし いけ ぬま しま おか たに " +
    "いぬ ねこ うし うま とり さかな むし くま しか さる ぶた かめ へび かえる うさぎ ねずみ きつね たぬき " +
    "め みみ はな くち て あし あたま かお くび むね せなか はら ゆび こころ " +
    "ほん かみ ふで えんぴつ つくえ いす まど と いえ へや にわ もん みち はし えき みせ まち むら " +
    "ちち はは あに あね おとうと いもうと そふ そぼ おや こ まご " +
    "いちねん にねん さんねん きょねん ことし らいねん がんねん しょうねん せいねん ちゅうねん " +
    "こうえん こうじょう こうばん こうてい こうか こうしゃ こうさく こうつう こうぎょう こうちょう こうせい " +
    "しんぶん しんごう しんせつ しんぱい しんか しんかい しんりん しんじつ " +
    "じしん じしゃく じかん じこ じしょ じてん じどう じぶん じゆう じょうず " +
    "がいこく がいしゅつ がいらい こくご こくばん こくみん こくりつ こっか こっき " +
    "せかい せかいじゅう せいかつ せいかく せいき せいじ せいと せいふ せいめい せいり ").split(/\s+/).filter(Boolean);
  function lex() {
    if (LEX) return LEX;
    LEX = new Set(COMMON);
    KANJI.forEach((K) => K.w.forEach(([, r]) => LEX.add(r)));
    if (typeof BANK !== "undefined") Object.values(BANK).forEach((b) => { if (b.label === "読みかたは？" && /^[ぁ-ん]+$/.test(b.a)) LEX.add(b.a); });
    return LEX;
  }

  // その 漢字の ことばから わかる 読み（ほかの 字の ことばから おしはかった 読みは まぜない）
  let OWN = null;
  function own(K) {
    if (!OWN) OWN = {};
    if (OWN[K.k]) return OWN[K.k];
    const set = new Set();
    K.w.forEach(([w, r]) => { const sp = w === K.k ? { p: r } : split(w, r, K.k); if (sp && sp.p) set.add(sp.p); });
    return (OWN[K.k] = set);
  }
  // 同じ 形の ことば（目当ての 字だけが ちがう 本物の 熟語）：周囲 → 範囲・包囲、子犬 → 子馬・子牛
  let FRAME = null;
  function frames() {
    if (FRAME) return FRAME;
    FRAME = {};
    KANJI.forEach((K) => K.w.forEach(([w, r]) => {
      const ch = [...w];
      ch.forEach((c, i) => { if (!isK(c)) return; const key = ch.map((x, j) => (j === i ? "＊" : x)).join(""); (FRAME[key] = FRAME[key] || new Map()).set(c, r); });
    }));
    return FRAME;
  }

  // まちがいの 選択肢を 3つ つくる（自然な ことばが 3つ そろわなければ null → 書きの 問題に する）
  // Ａ 目当ての 字だけ ちがう 本物の 熟語の 読み（周囲 → はんい・ほうい）
  // Ｂ 同じ 送りがなの ことば（白い → くろい・あかい、学ぶ → あそぶ・えらぶ）
  // Ｃ その 漢字の べつの 読み（子犬 → こけん、腹筋 → はらきん：知らないと まよう）
  // Ｄ 前後の 読みが 3文字以上 同じ 本物の ことば
  function distractors(K, word, reading) {
    if (word === K.k) return null; // 1字だけの ことばは ほかの 読みも 正しく なるので 読みの 問題に しない（書きで 出す）
    const sp = split(word, reading, K.k);
    if (!sp) return null;
    const { pre, p, suf } = sp;
    const L = lex(), cand = [];
    const push = (x, sc) => { if (x && x !== reading && !cand.some((c) => c.x === x)) cand.push({ x, sc: sc + Math.random() }); };
    const okLen = (m) => m.length >= 1 && Math.abs(m.length - p.length) <= (p.length >= 3 ? 2 : 1);
    const kanaTail = word.slice(word.indexOf(K.k) + 1);
    const okuri = !pre && kanaTail && suf === kanaTail && !/[一-鿿]/.test(kanaTail);
    // Ａ
    const ch = [...word], i = ch.indexOf(K.k), key = ch.map((x, j) => (j === i ? "＊" : x)).join("");
    (frames()[key] || new Map()).forEach((r2, c2) => { if (c2 !== K.k && r2.startsWith(pre) && r2.endsWith(suf) && r2.length > pre.length + suf.length) push(r2, 11); });
    // Ｂ（送りがなの つく ことば）
    if (okuri) (OKU[kanaTail] || []).forEach(([k2, st]) => { if (k2 !== K.k && okLen(st)) push(st + suf, 9); });
    // Ｃ（送りがなの 読みの 頭や、音読みに 送りがなを つけた 不自然な 形は のぞく）
    const stems = STEM[K.k] || new Set();
    const mine = own(K), kr = new Set(readings(K.k));
    // 「うふく」「うし」のように、前の 字の「う・い」が まざった 読みは のぞく
    const fake = (q) => /^[うい]/.test(q) && (mine.has(q.slice(1)) || kr.has(q.slice(1)));
    if (!okuri) [...mine].filter((q) => !variants(p).includes(q) && !stems.has(q) && okLen(q) && !fake(q) && !/^[ぱぴぷぺぽんっゃゅょ]/.test(q)).forEach((q) => push(pre + q + suf, 6));
    // Ｄ
    if (!okuri && pre.length + suf.length >= 3) L.forEach((x) => {
      if (x.length <= pre.length + suf.length || !x.startsWith(pre) || !x.endsWith(suf)) return;
      const m = x.slice(pre.length, x.length - suf.length);
      if (Math.abs(m.length - p.length) <= 1 && Math.abs(x.length - reading.length) <= 1) push(x, 5);
    });
    const good = cand.filter((c) => !/んん|^ん|^っ|っ$|っん|んっ|っっ/.test(c.x)).sort((a, b) => b.sc - a.sc);
    if (good.length < 3) return null;
    // 種類が かたよらないように：Ｃを 1つ まぜる
    const out = [], ownC = good.filter((c) => c.sc >= 6 && c.sc < 7);
    if (ownC.length) out.push(ownC[0].x);
    good.forEach((c) => { if (out.length < 3 && !out.includes(c.x)) out.push(c.x); });
    return out.slice(0, 3);
  }
  return { distractors, split, readings };
})();
