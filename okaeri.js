// ===== おかえりイベント =====
// 3日いじょう あいてから 開くと、ぷにまるが 手紙と プレゼントで むかえる。
// その日は「おかえりブースト」（コイン・タマゴの そだち 2ばい）と「おかえりミッション」つき。
"use strict";

const OKAERI_DAYS = 3;
// あいた 日数ごとの プレゼント
const OKAERI_GIFT = [
  { min: 14, coin: 300, egg: 2 },
  { min: 7, coin: 200, egg: 1 },
  { min: 3, coin: 100, egg: 0 },
];
// おかえりの 日だけの ミッション（key：すすみぐあいを かぞえる 名前）
const OKAERI_MISSIONS = [
  { id: "ok_correct", key: "correct10", text: "おかえり！ 問題に 5回 せいかいする", goal: 5, reward: { coin: 60 } },
  { id: "ok_stage", key: "stage1", text: "おかえり！ ステージを 1つ クリアする", goal: 1, reward: { gem: 1 } },
  { id: "ok_nigate", key: "nigate1", text: "おかえり！ ニガテモンスターを 1体 たおす", goal: 1, reward: { coin: 60 } },
];
// アップデートの おしらせ（おかえりの 手紙に のせる。v：その 版の 番号）
const NEWS = [
  { v: 32, t: "🔬 理科の 問題が 3ばいに ふえた" },
  { v: 33, t: "🗾 社会の 問題が 3ばいに ふえた" },
  { v: 34, t: "💬 ことばの 問題が 3ばいに ふえた" },
  { v: 35, t: "🔢 算数の 問題が 3ばいに ふえた" },
  { v: 36, t: "📖 漢字の ことばが ふえた" },
  { v: 37, t: "🗡️ ひみつの けん「ひけん」が どこかに ねむっている…" },
  { v: 47, t: "💌 おかえりイベントが はじまった" },
  { v: 48, t: "🎒 なかまを おつかいに 出せるように なった" },
  { v: 49, t: "🏠 ぷにまるの ひみつきちが できた" },
  { v: 50, t: "🪑 おつかいや おかえりで かぐが もらえるように なった" },
  { v: 51, t: "💬 ひみつきちの なかまを タップすると しゃべるように なった" },
  { v: 52, t: "🎨 ひみつきちが おくゆきの ある へやに なって、もようがえ・ラグ・くみあわせが ふえた" },
  { v: 53, t: "🛏️ かぐが 40しゅるい ふえた（国を すすめると ショップに ならぶよ）" },
  { v: 54, t: "👆 ひみつきちの かぐを ドラッグで うごかせるように なった" },
  { v: 55, t: "📁 ひみつきちの へやを きろく・よみこみ できるように なった" },
  { v: 57, t: "🆕 ずかんに あたらしい カードを 見られる タブが できた" },
];

const daysBetween = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
const okaeriToday = () => !!(S.okaeri && S.okaeri.date === today());
// おかえりブースト中か（コイン・タマゴの そだち 2ばい）
const okaeriBoost = () => okaeriToday();
// きょうの ミッション（おかえりの 日は 3つ ふえる）
const allMissions = () => (okaeriToday() ? MISSIONS.concat(OKAERI_MISSIONS) : MISSIONS);

// ログインの とき（loginBonus から よぶ）。おかえりなら 手紙を 出して true
function okaeriCheck(last, bonus) {
  if (!last) return false;
  const gap = daysBetween(last, today());
  if (gap < OKAERI_DAYS) return false;
  const g = OKAERI_GIFT.find((x) => gap >= x.min);
  S.okaeri = { date: today(), gap };
  S.coins += g.coin;
  // タマゴ（もちきれない ときは コインに）
  let eggTxt = "";
  if (giveEgg(g.egg)) eggTxt = `🥚 ${RARITY[g.egg].name}の タマゴ`;
  else { S.coins += 100; eggTxt = "🪙 +100（タマゴが いっぱいだったので）"; }
  // かぐ（7日いじょう：ふつうの かぐ、14日いじょう：おかえりの ソファ）
  let furnTxt = "";
  if (gap >= 7 && typeof FURN !== "undefined") {
    let fu = gap >= 14 && fOwn("f_okaeri") < 1 ? furnById("f_okaeri") : null;
    if (!fu) { const fl = FURN.filter((x) => x.set === "base" && fOwn(x.id) < fMax(x)); fu = fl.length ? pick(fl) : null; }
    if (fu) { giveFurn(fu.id); furnTxt = `${fu.id === "f_okaeri" ? "💝" : fu.em} ${fu.name}（かぐ）`; }
  }
  // まだ 見ていない おしらせ
  const seen = S.newsV || 0, news = NEWS.filter((n) => n.v > seen && n.v <= (window.APP_V || 999)).slice(-4);
  if (window.APP_V) S.newsV = window.APP_V;
  save();
  const ch = S.lastCh && typeof chapterOf === "function" ? chapterOf(S.lastCh) : null;
  setTimeout(() => {
    snd("special");
    modal(`<div class="okaeri">
      <div class="mtitle">💌 ぷにまるからの てがみ</div>
      <div class="hero sm">${charSVG(S.eq, S.color, "bounce")}</div>
      <p class="letter"><b>${gap}日ぶり</b>だね！ ずっと まってたよ。<br>また いっしょに ぼうけんしよう！</p>
      <div class="sub">おかえりの プレゼント</div>
      <div class="okgift"><span>🪙 +${g.coin + bonus}</span><span>${eggTxt}</span>${furnTxt ? `<span>${furnTxt}</span>` : ""}</div>
      <p class="okboost">🌟 きょうは <b>おかえりブースト</b>！<br><small>正解の コインと タマゴの そだちが 2ばい。おかえりミッションも あるよ</small></p>
      ${news.length ? `<div class="sub">あたらしく なったこと</div><ul class="oknews">${news.map((n) => `<li>${n.t}</li>`).join("")}</ul>` : ""}
      ${ch && !ch.maou ? `<button class="big-btn primary" onclick="closeModal();openChapter('${ch.id}')">▶ 前の つづきから（${esc(ch.name)}）</button>` : ""}
      <button class="big-btn ${ch && !ch.maou ? "" : "primary"}" onclick="closeModal();home()">ただいま！</button></div>`, "tmodal");
  }, 300);
  return true;
}
