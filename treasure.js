// ===== たからもの（トロフィー・メダル・表彰状） =====
"use strict";

// 国を ぜんぶ クリアしたか（保護者の 設定で お休みの 章は のぞく）
const worldAllClear = (w) => { const l = activeChapters(w); return l.length > 0 && l.every(chapterDone); };
const allWorldsClear = () => WORLDS.every((w) => !activeChapters(w.id).length || worldAllClear(w.id)) && WORLDS.some((w) => activeChapters(w.id).length);
const goodCount = () => (S.stats && S.stats.cor) || 0;
const kiraCount = () => Object.values(S.cards || {}).filter((c) => c.s >= 5).length;
const dexCount = () => Object.keys(S.petDex || {}).length;
const writeAllClear = () => typeof EXTRA_CH !== "undefined" && EXTRA_CH.filter((c) => c.write && chapterOn(c)).every(chapterDone) && EXTRA_CH.some((c) => c.write && chapterOn(c));

// たからものの 一覧（kind：trophy トロフィー／medal メダル／cert 表彰状）
const TREASURES = [
  ...WORLDS.map((w) => ({ id: "hero_" + w.id, kind: "trophy", name: `${w.name}の 英雄トロフィー`, icon: w.icon, color: w.bg[1],
    desc: `${w.name}の 章を ぜんぶ クリアした あかし。${w.name}を すくった 英雄だ！`, hint: "ある 国の 章を ぜんぶ クリアすると…", check: () => worldAllClear(w.id) })),
  { id: "maou1", kind: "trophy", name: "まおう たいじ トロフィー", icon: "🌑", color: "#9575cd", desc: "まおう ドンヨリを たおした あかし。", hint: "まおうの しろで…", check: () => stStars("z1-4") > 0 },
  { id: "world_hero", kind: "trophy", big: true, name: "全世界の 英雄トロフィー", icon: "🌏", color: "#ffd23f", desc: "5つの 国を すべて すくい、しんの まおうを たおした 全世界の 英雄だけが もらえる トロフィー。", hint: "すべての 国を すくい、さいごの てきを たおすと…", check: () => allWorldsClear() && stStars("z2-4") > 0 },
  { id: "cert", kind: "cert", name: "全世界の 英雄 表彰状", icon: "📜", color: "#c99a00", desc: "ぷにまる王国の 王さまから おくられた 表彰状。", hint: "すべての 国を すくい、さいごの てきを たおすと…", check: () => allWorldsClear() && stStars("z2-4") > 0 },
  { id: "write_all", kind: "medal", name: "かきとり名人 メダル", icon: "✍️", color: "#e8a33d", desc: "6つの かきとり道場を ぜんぶ クリアした あかし。", hint: "かきとり道場を ぜんぶ クリアすると…", check: writeAllClear },
  ...[[100, "#cd7f32"], [500, "#b0bec5"], [1000, "#ffd23f"], [3000, "#4fc3f7"]].map(([n, c]) => ({ id: "cor" + n, kind: "medal", name: `${n}問 正解 メダル`, num: n, color: c,
    desc: `問題に ぜんぶで ${n}問 正解した あかし。こつこつ がんばったね！`, hint: `問題に たくさん 正解すると…`, check: () => goodCount() >= n })),
  { id: "kira100", kind: "medal", name: "キラカード 100まい メダル", icon: "🌟", color: "#c77dff", desc: "★5の キラカードを 100まい あつめた あかし。", hint: "キラカードを たくさん あつめると…", check: () => kiraCount() >= 100 },
  { id: "pet20", kind: "medal", name: "なかま 20しゅるい メダル", icon: "🐾", color: "#4cc46a", desc: "なかまずかんに 20しゅるい あつめた あかし。", hint: "なかまを たくさん あつめると…", check: () => dexCount() >= 20 },
  { id: "petall", kind: "trophy", name: "なかま コンプリート トロフィー", icon: "🐣", color: "#ff8fb0", desc: "なかま 53しゅるいを ぜんぶ あつめた あかし。", hint: "なかまを ぜんぶ あつめると…", check: () => dexCount() >= PETS.length },
  { id: "login7", kind: "medal", name: "7日 れんぞく メダル", icon: "📅", color: "#ff7a59", desc: "7日 つづけて あそんだ あかし。", hint: "まいにち あそぶと…", check: () => (S.login || {}).streak >= 7 },
  { id: "login30", kind: "medal", name: "30日 れんぞく メダル", icon: "🗓️", color: "#e53935", desc: "30日 つづけて あそんだ あかし。すごい！", hint: "まいにち あそぶと…", check: () => (S.login || {}).streak >= 30 },
];

const tShow = () => PQ_DEBUG && window.PQ_ZUKANALL; // デバッグ：ぜんぶ 見せる
const hasT = (id) => !!(S.treasures || {})[id] || tShow();

// もらえる たからものを しらべて、あたらしく もらった ものを かえす
function checkTreasures() {
  if (!S) return [];
  S.treasures = S.treasures || {};
  const got = [];
  TREASURES.forEach((t) => { if (!S.treasures[t.id] && t.check()) { S.treasures[t.id] = Date.now(); got.push(t.id); } });
  if (got.length) save();
  return got;
}
const unseenTreasures = () => Object.keys(S.treasures || {}).filter((id) => !(S.treasureSeen || {})[id]);

// ---------- 絵 ----------
// トロフィー（locked：まだ もらっていない かげ）
function trophySVG(t, locked) {
  const g = locked ? "#c9c9d3" : "url(#tg" + t.id + ")", dk = locked ? "#a8a8b4" : "#c99a00", band = locked ? "#b5b5c0" : t.color;
  return `<svg viewBox="0 0 120 140" class="tsvg">
    <defs><linearGradient id="tg${t.id}" x1="0" x2="1"><stop offset="0" stop-color="#fff3a6"/><stop offset=".45" stop-color="#ffd23f"/><stop offset="1" stop-color="#e0a800"/></linearGradient></defs>
    ${locked ? "" : `<g opacity=".8">${[[14, 22], [104, 30], [10, 70], [110, 74]].map(([x, y]) => `<path d="M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2}Z" fill="#fff59d"/>`).join("")}</g>`}
    <path d="M30 22 Q8 22 10 44 Q12 62 34 64" fill="none" stroke="${dk}" stroke-width="7"/><path d="M90 22 Q112 22 110 44 Q108 62 86 64" fill="none" stroke="${dk}" stroke-width="7"/>
    <path d="M26 14 L94 14 L90 52 Q86 78 60 82 Q34 78 30 52Z" fill="${g}" stroke="${dk}" stroke-width="3"/>
    ${locked ? "" : `<path d="M38 20 Q36 50 50 70" stroke="#fff" stroke-width="5" fill="none" opacity=".55" stroke-linecap="round"/>`}
    <rect x="52" y="80" width="16" height="18" fill="${g}" stroke="${dk}" stroke-width="2.5"/>
    <path d="M34 98 L86 98 L92 118 L28 118Z" fill="${g}" stroke="${dk}" stroke-width="3"/>
    <rect x="22" y="118" width="76" height="14" rx="4" fill="${band}" stroke="${dk}" stroke-width="2.5"/>
    <text x="60" y="56" text-anchor="middle" font-size="${t.big ? 30 : 26}">${locked ? "" : t.icon || ""}</text>
    ${locked ? `<text x="60" y="58" text-anchor="middle" font-size="30" font-weight="bold" fill="#fff">？</text>` : ""}
  </svg>`;
}
// メダル
function medalSVG(t, locked) {
  const c = locked ? "#c9c9d3" : t.color, dk = locked ? "#a8a8b4" : shade(t.color, -0.3);
  return `<svg viewBox="0 0 120 140" class="tsvg">
    <path d="M36 4 L58 54 L44 60 L22 10Z" fill="${locked ? "#bdbdc8" : "#e53935"}"/><path d="M84 4 L62 54 L76 60 L98 10Z" fill="${locked ? "#b5b5c0" : "#1e88e5"}"/>
    <circle cx="60" cy="88" r="40" fill="${c}" stroke="${dk}" stroke-width="4"/><circle cx="60" cy="88" r="31" fill="none" stroke="${locked ? "#e0e0e6" : "#fff"}" stroke-width="2.5" opacity=".7"/>
    ${locked ? `<text x="60" y="100" text-anchor="middle" font-size="34" font-weight="bold" fill="#fff">？</text>`
      : t.num ? `<text x="60" y="94" text-anchor="middle" font-size="${t.num >= 1000 ? 22 : 26}" font-weight="900" fill="#fff" stroke="${dk}" stroke-width="1">${t.num}</text><text x="60" y="110" text-anchor="middle" font-size="11" font-weight="bold" fill="#fff">もん</text>`
      : `<text x="60" y="100" text-anchor="middle" font-size="32">${t.icon}</text>`}
    ${locked ? "" : `<path d="M34 70 Q40 58 52 54" stroke="#fff" stroke-width="4" fill="none" opacity=".5" stroke-linecap="round"/>`}
  </svg>`;
}
// 表彰状
function certSVG(t, locked, big) {
  if (locked) return `<svg viewBox="0 0 120 140" class="tsvg"><rect x="14" y="20" width="92" height="104" rx="6" fill="#c9c9d3" stroke="#a8a8b4" stroke-width="3"/><rect x="24" y="30" width="72" height="84" fill="none" stroke="#e0e0e6" stroke-width="2"/><text x="60" y="84" text-anchor="middle" font-size="34" font-weight="bold" fill="#fff">？</text></svg>`;
  if (!big) return `<svg viewBox="0 0 120 140" class="tsvg"><rect x="14" y="20" width="92" height="104" rx="4" fill="#fffaf0" stroke="#c99a00" stroke-width="4"/><rect x="22" y="28" width="76" height="88" fill="none" stroke="#e0b84c" stroke-width="2"/>
    <text x="60" y="52" text-anchor="middle" font-size="15" font-weight="900" fill="#7a4b00">表彰状</text>${[64, 74, 84, 94].map((y) => `<rect x="32" y="${y}" width="56" height="3" rx="1.5" fill="#d7c08a"/>`).join("")}<circle cx="84" cy="108" r="9" fill="#e53935"/><text x="84" y="112" text-anchor="middle" font-size="9" fill="#fff" font-weight="bold">王</text></svg>`;
  const d = new Date((S.treasures || {})[t.id] || Date.now());
  const ds = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  const line = (y, s2, size = 13, w = "bold", fill = "#3b2a1a") => `<text x="150" y="${y}" text-anchor="middle" font-size="${size}" font-weight="${w}" fill="${fill}">${s2}</text>`;
  return `<svg viewBox="0 0 300 400" class="certsvg">
    <defs><linearGradient id="cfr" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ffe082"/><stop offset=".5" stop-color="#c99a00"/><stop offset="1" stop-color="#ffe082"/></linearGradient></defs>
    <rect x="4" y="4" width="292" height="392" rx="10" fill="url(#cfr)"/><rect x="16" y="16" width="268" height="368" fill="#fffaf0"/>
    <rect x="24" y="24" width="252" height="352" fill="none" stroke="#c99a00" stroke-width="2"/><rect x="29" y="29" width="242" height="342" fill="none" stroke="#e0b84c" stroke-width="1"/>
    ${[[34, 34], [266, 34], [34, 366], [266, 366]].map(([x, y]) => `<path d="M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2}Z" fill="#c99a00"/>`).join("")}
    ${line(76, "表 彰 状", 34, "900", "#7a4b00")}
    ${line(110, "全世界の 英雄", 18, "900", "#c62828")}
    ${line(150, `${esc(S.name)} どの`, 20, "900")}
    ${line(188, "あなたは 5つの 国を すべて すくい", 13)}
    ${line(210, "しんの まおうを たおしました", 13)}
    ${line(232, "その ゆうきと ちえと がんばりを たたえ", 13)}
    ${line(254, "全世界の 英雄として ここに 表彰します", 13)}
    ${line(298, ds, 14)}
    ${line(326, "ぷにまる王国 国王", 15, "900", "#7a4b00")}
    <circle cx="246" cy="346" r="19" fill="#e53935" opacity=".9"/><circle cx="246" cy="346" r="14.5" fill="none" stroke="#fff" stroke-width="1.5"/><text x="246" y="352" text-anchor="middle" font-size="15" font-weight="900" fill="#fff">王</text>
    <path d="M60 330 l-8 30 l10 -6 l6 10 l6 -32Z" fill="#c62828"/><circle cx="66" cy="326" r="16" fill="#ffd23f" stroke="#c99a00" stroke-width="2"/><text x="66" y="332" text-anchor="middle" font-size="14">🌏</text>
  </svg>`;
}
function treasureSVG(t, locked, big) {
  return t.kind === "cert" ? certSVG(t, locked, big) : t.kind === "medal" ? medalSVG(t, locked) : trophySVG(t, locked);
}

// ---------- 画面 ----------
function treasures() {
  checkTreasures();
  const got = TREASURES.filter((t) => hasT(t.id)).length;
  setScreen(`${topBar("たからもの")}
    <div class="zhead">あつめた たからもの <b>${got} / ${TREASURES.length}</b></div>
    <p class="note">かげに なっている たからものは まだ ひみつ。タップすると ヒントが 見られるよ</p>
    <div class="tgrid">${TREASURES.map((t, i) => {
      const own = hasT(t.id), isNew = own && !(S.treasureSeen || {})[t.id];
      return `<button class="tcard ${own ? "own" : "lock"} ${t.big || t.kind === "cert" ? "special" : ""}" onclick="treasureDetail(${i})">${treasureSVG(t, !own)}<small>${own ? t.name : "？？？"}</small>${isNew ? '<i class="badge">NEW</i>' : ""}</button>`;
    }).join("")}</div>`, "bg-shop");
}
function treasureDetail(i) {
  const t = TREASURES[i];
  if (!hasT(t.id)) { snd("tap"); toast(`ヒント：${t.hint}`); return; }
  snd("special");
  S.treasureSeen = S.treasureSeen || {}; S.treasureSeen[t.id] = 1; save();
  const at = (S.treasures || {})[t.id], d = at ? new Date(at) : null;
  modal(`<div class="tdetail ${t.kind}">
    <div class="tbig">${treasureSVG(t, false, true)}</div>
    <div class="mtitle">${t.name}</div>
    <p>${t.desc}</p>
    ${d ? `<p class="small">🗓️ もらった日：${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日</p>` : ""}
    <button class="big-btn primary" onclick="closeModal();treasures()">◀ たからものに もどる</button></div>`, "tmodal");
}
// ホームで あたらしい たからものを 見せる（1つずつ）
function treasureEvents() {
  checkTreasures();
  const nw = unseenTreasures().filter((id) => TREASURES.find((t) => t.id === id));
  if (!nw.length) return false;
  const t = TREASURES.find((x) => x.id === nw[0]);
  S.treasureSeen = S.treasureSeen || {}; S.treasureSeen[t.id] = 1; save();
  snd("win");
  modal(`<div class="tdetail get"><div class="mtitle">🏆 たからものを てにいれた！</div>
    <div class="tbig shine">${treasureSVG(t, false, true)}</div><b class="tname">${t.name}</b><p>${t.desc}</p>
    <div class="row"><button class="big-btn" onclick="closeModal();treasures()">たからものを 見る</button><button class="big-btn primary" onclick="closeModal();treasureEvents()">やったー！</button></div></div>`, "tmodal");
  return true;
}
