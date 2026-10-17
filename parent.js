// ===== 保護者ページ：クラウドの セーブデータを 読んで 学習の ようすを 表示する（見るだけ） =====
"use strict";

// cloud.js と 同じ Firebase の 設定（このページでは 書きこみは しない）
const P_FIREBASE = { apiKey: "AIzaSyDUNwtZ4KxpvrIKuGl9X48qWjTzHqGG3As", projectId: "puni-quest" };
const P_KEY = "puniquest_parent_v1";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const pct = (c, t) => (t ? Math.round((c / t) * 100) + "%" : "－");
const fmtTime = (ts) => { if (!ts) return "－"; const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`; };

// codes：登録した ふっかつコード（最大3つ。お子さん ごと）、labels：コードごとの なまえ、ci：いま 見ている コード
let P = { code: "", codes: ["", "", ""], labels: ["", "", ""], ci: 0, slots: [], cfgs: [], cur: 0, loadedAt: 0, view: "" };
try {
  const t = JSON.parse(localStorage.getItem(P_KEY) || "{}");
  if (t.codes) { P.codes = t.codes; P.labels = t.labels || ["", "", ""]; P.ci = t.ci || 0; }
  else if (t.code) P.codes[0] = t.code; // 前の 版（コード 1つ）
  P.cur = t.cur || 0;
  if (!P.codes[P.ci]) P.ci = Math.max(0, P.codes.findIndex(Boolean));
  P.code = P.codes[P.ci] || "";
} catch (e) { /* 無視 */ }
const remember = () => { try { localStorage.setItem(P_KEY, JSON.stringify({ codes: P.codes, labels: P.labels, ci: P.ci, cur: P.cur })); } catch (e) { /* 無視 */ } };
const fmtCode = (c) => (c ? c.replace(/(.{4})(.{4})(.{4})/, "$1-$2-$3") : "");

// ---------- カードの 名前・国 ----------
function cardLabel(id) {
  if (id.startsWith("k:")) return id.slice(2);
  if (id.startsWith("f:")) { const F = FORMULAS.find((x) => x.id === id.slice(2)); return F ? F.name : id; }
  if (id.startsWith("m:")) return (MATH[id.slice(2)] || {}).name || id;
  return (BANK[id] || {}).t || id;
}
function cardWorld(id) {
  if (id.startsWith("k:")) return "kanji";
  if (id.startsWith("f:") || id.startsWith("m:")) return "math";
  return (BANK[id] || {}).w || "kotoba";
}
const worldCards = (w) => [...new Set(CHAPTERS.filter((c) => c.w === w).flatMap((c) => c.items))];
const worldOf = (w) => WORLDS.find((x) => x.id === w);

// ---------- クラウドから 読む ----------
async function fetchSlots(code) {
  const url = `https://firestore.googleapis.com/v1/projects/${P_FIREBASE.projectId}/databases/(default)/documents/saves/${code}?key=${P_FIREBASE.apiKey}`;
  const r = await fetch(url, { cache: "no-store" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(String(r.status));
  const f = (await r.json()).fields || {};
  const js = (k) => { try { const s = f[k] && f[k].stringValue; return s ? JSON.parse(s) : null; } catch (e) { return null; } };
  // s1〜s3：セーブデータ、c1〜c3：このページで 変えた 出題の設定
  return { slots: [1, 2, 3].map((n) => js("s" + n)), cfgs: [1, 2, 3].map((n) => js("c" + n)) };
}

// 出題の設定を クラウドに 書く（c1〜c3 だけを 書きかえる。セーブデータには さわらない）
async function writeCfg(i, cfg) {
  const n = i + 1;
  const url = `https://firestore.googleapis.com/v1/projects/${P_FIREBASE.projectId}/databases/(default)/documents/saves/${P.code}?key=${P_FIREBASE.apiKey}&updateMask.fieldPaths=c${n}`;
  const r = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: { ["c" + n]: { stringValue: JSON.stringify(cfg) } } }) });
  if (!r.ok) throw new Error(String(r.status));
}
// いまの 設定：ゲームで 変えたものと、このページで 変えたものの 新しいほう
function curCfg() {
  const a = migrateCfg((P.slots[P.cur] || {}).cfg) || {}, b = P.cfgs[P.cur] || {};
  return JSON.parse(JSON.stringify((b.at || 0) > (a.at || 0) ? b : a));
}
let cfgTimer = null;
function saveCfg(cfg, msgId) {
  cfg.at = Date.now();
  P.cfgs[P.cur] = cfg;
  clearTimeout(cfgTimer);
  cfgTimer = setTimeout(async () => {
    try { await writeCfg(P.cur, P.cfgs[P.cur]); if ($(msgId)) $(msgId).innerHTML = "✅ 保存しました（お子さんの ゲームに 数分で 反映されます）"; }
    catch (e) { if ($(msgId)) $(msgId).innerHTML = `<span class="pg-err">保存できませんでした（${e.message === "403" ? "Firebaseの ルールの 更新が 必要です" : "通信を ご確認ください"}）</span>`; }
  }, 700);
}

// ---------- 画面 ----------
// コードの 登録・変更（最大 3つ）
function codeView(msg) {
  const has = P.codes.some(Boolean);
  $("papp").innerHTML = `<div class="pg-wrap">
    ${has ? `<div class="pg-top"><button class="back" onclick="load()">◀ もどる</button><b>コードの 追加・変更</b><span></span></div>` : `<h1 class="pg-title">🐣 ぷにまるクエスト<br><small>保護者ページ</small></h1>`}
    <div class="pg-manuals"><a href="manual/kids.html?from=parent">📘 こども用 せつめいしょ</a><a href="manual/parents.html">📗 保護者用 せつめいしょ</a></div>
    <div class="pg-card">
      <p>お子さんの ゲームの ⚙️せってい画面に 表示される <b>ふっかつコード（12文字）</b> を 入れてください。お子さんが 複数いる ときは、<b>最大 3人分</b> 登録できます。</p>
      ${msg ? `<p class="pg-err">${msg}</p>` : ""}
      ${[0, 1, 2].map((i) => `<div class="pg-codebox ${P.codes[i] && i === P.ci ? "on" : ""}">
        <div class="pg-codehead"><b>コード ${i + 1}</b>${P.labels[i] ? `<span>${esc(P.labels[i])}</span>` : ""}</div>
        <input id="pcode${i}" class="pg-in" maxlength="16" placeholder="XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" value="${esc(fmtCode(P.codes[i]))}">
        <div class="pg-codebtns">
          <button class="big-btn primary" onclick="saveCode(${i})">${P.codes[i] ? "変更して 見る" : "登録して 見る"}</button>
          ${P.codes[i] ? `<button class="big-btn" onclick="openCode(${i})">見る</button><button class="big-btn" onclick="delCode(${i})">消す</button>` : ""}
        </div></div>`).join("")}
      <p class="pg-note">コードは この端末に 記憶されます。ここで 変えられるのは「出題の 設定」だけです。お子さんの もちものや 進み具合が 書きかわることは ありません。</p>
    </div></div>`;
}
const loginView = codeView;

async function saveCode(i) {
  const c = $("pcode" + i).value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length !== 12) return codeView(`コード ${i + 1}：コードは 12文字です。`);
  if (P.codes.some((x, j) => x === c && j !== i)) return codeView(`コード ${i + 1}：その コードは もう 登録されています。`);
  $("papp").innerHTML = `<div class="loading">コードを たしかめています…</div>`;
  try {
    const res = await fetchSlots(c);
    if (!res) return codeView(`コード ${i + 1}：この コードの データが 見つかりません。コードを ご確認ください。`);
  } catch (e) { return codeView("通信に 失敗しました。ネットの 接続を ご確認ください。"); }
  P.codes[i] = c; P.labels[i] = ""; openCode(i);
}
function openCode(i) { P.ci = i; P.code = P.codes[i]; P.cur = 0; P.view = ""; remember(); load(); }
function delCode(i) {
  if (!confirm(`コード ${i + 1}${P.labels[i] ? `（${P.labels[i]}）` : ""} を この端末から 消しますか？（お子さんの データは 消えません）`)) return;
  P.codes[i] = ""; P.labels[i] = "";
  if (P.ci === i) { P.ci = Math.max(0, P.codes.findIndex(Boolean)); P.code = P.codes[P.ci] || ""; P.cur = 0; }
  remember(); codeView();
}

async function load() {
  $("papp").innerHTML = `<div class="loading">データを 読みこみ中…</div>`;
  try {
    const res = await fetchSlots(P.code);
    if (!res) return codeView("この コードの データが 見つかりません。コードを ご確認ください。");
    P.slots = res.slots; P.cfgs = res.cfgs; P.loadedAt = Date.now();
    // コードの なまえ（ぼうけんのしょの なまえ）を おぼえる
    P.labels[P.ci] = P.slots.filter(Boolean).map((x) => x.name).join("・"); remember();
    if (!P.slots[P.cur]) P.cur = Math.max(0, P.slots.findIndex(Boolean));
    if (P.view === "settings") renderSettings(); else render();
  } catch (e) { codeView("読みこみに 失敗しました。ネットの 接続を ご確認ください。"); }
}

function render() {
  const S = P.slots[P.cur];
  const tabs = P.slots.map((d, i) => `<button class="${i === P.cur ? "on" : ""}" ${d ? `onclick="P.cur=${i};remember();render()"` : "disabled"}>${d ? esc(d.name) : "（からっぽ）"}</button>`).join("");
  if (!S) { $("papp").innerHTML = `<div class="pg-wrap">${head()}<div class="pg-tabs">${tabs}</div><div class="pg-card">データが ありません。</div></div>`; return; }

  const today = dateKey(new Date());
  const days = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = dateKey(d); days.push({ k, label: i === 13 || d.getDate() === 1 ? `${d.getMonth() + 1}/${d.getDate()}` : `${d.getDate()}`, ...(S.stats.days[k] || { tot: 0, cor: 0 }) }); }
  const td = S.stats.days[today] || { tot: 0, cor: 0 };
  const week = days.slice(7).reduce((a, d) => ({ tot: a.tot + d.tot, cor: a.cor + d.cor, play: a.play + (d.tot ? 1 : 0) }), { tot: 0, cor: 0, play: 0 });
  const mx = Math.max(10, ...days.map((d) => d.tot));
  const cards = S.cards || {};

  // 国ごとの 進み具合
  const stClear = S.stClear || {};
  const per = WORLDS.map((w) => {
    const ids = worldCards(w.id);
    const chs = CHAPTERS.filter((c) => c.w === w.id);
    const done = chs.filter((c) => stClear[`${c.id}-4`]).length;
    let cor = 0, tot = 0;
    ids.forEach((id) => { const c = cards[id]; if (c) { cor += c.cor; tot += c.tot; } });
    return { w, all: ids.length, got: ids.filter((x) => (cards[x] || {}).s > 0).length, master: ids.filter((x) => (cards[x] || {}).s >= 5).length, done, chs: chs.length, acc: pct(cor, tot), tot,
      next: chs.find((c) => !stClear[`${c.id}-4`]) };
  });

  // ニガテ・正答率の 低い問題・今日 おぼえた もの
  const ng = Object.keys(cards).filter((id) => cards[id].ng);
  const low = Object.keys(cards).filter((id) => cards[id].tot >= 3).map((id) => ({ id, r: cards[id].cor / cards[id].tot, ...cards[id] })).filter((x) => x.r < 0.7).sort((a, b) => a.r - b.r).slice(0, 10);
  const todayNew = Object.keys(cards).filter((id) => cards[id].last === today);
  const tag = (id) => `<span class="pg-tag w-${cardWorld(id)}">${worldOf(cardWorld(id)).icon} ${esc(cardLabel(id))}</span>`;

  $("papp").innerHTML = `<div class="pg-wrap">
    ${head()}
    <div class="pg-tabs">${tabs}</div>
    <div class="pg-card pg-row3">
      <div><small>最後に 遊んだ</small><b>${fmtTime(S.savedAt)}</b></div>
      <div><small>きょう</small><b>${td.tot}問</b><small>正答率 ${pct(td.cor, td.tot)}</small></div>
      <div><small>この7日間</small><b>${week.tot}問</b><small>${week.play}日 学習・${pct(week.cor, week.tot)}</small></div>
    </div>
    ${cfgCard()}
    <div class="pg-card"><div class="pg-sub">📅 14日間の 解答数</div>
      <div class="pg-chart">${days.map((d) => `<div class="pg-bar ${d.k === today ? "today" : ""}"><span>${d.tot || ""}</span><i style="height:${(d.tot / mx) * 100}%"></i><small>${d.label}</small></div>`).join("")}</div>
      <p class="pg-note">ぜんぶで ${S.stats.tot}問・正答率 ${pct(S.stats.cor, S.stats.tot)}</p></div>
    <div class="pg-card"><div class="pg-sub">🗺️ 国ごとの 進み具合</div>
      ${per.map((x) => `<div class="pg-world"><div class="pg-whead"><b>${x.w.icon} ${x.w.name}</b><span>章 ${x.done}/${x.chs}</span></div>
        <div class="pg-bars"><span class="pg-br"><i style="width:${(x.got / x.all) * 100}%"></i></span></div>
        <small>出会った ${x.got}/${x.all}・定着（★5）${x.master}・正答率 ${x.acc}${x.next ? `・つぎ：${esc(x.next.name)}` : "・ぜんぶ クリア！"}</small></div>`).join("")}
      <p class="pg-note">★は 違う日に 正解すると 1つ上がり、★5で「定着」です。</p></div>
    <div class="pg-card"><div class="pg-sub">👻 いまの ニガテ（${ng.length}）</div>
      ${ng.length ? `<div class="pg-tags">${ng.map(tag).join("")}</div>` : `<p class="pg-note">ありません</p>`}
      <p class="pg-note">まちがえた問題は「ニガテ」になり、2回正解すると解除されます。</p></div>
    <div class="pg-card"><div class="pg-sub">📉 正答率が 低い 問題（3回以上 出たもの）</div>
      ${low.length ? `<table class="pg-tbl">${low.map((x) => `<tr><td>${tag(x.id)}</td><td>${x.cor}/${x.tot}</td><td>${Math.round(x.r * 100)}%</td></tr>`).join("")}</table>` : `<p class="pg-note">ありません</p>`}</div>
    <div class="pg-card"><div class="pg-sub">✨ きょう ★が ついた・上がった カード（${todayNew.length}）</div>
      ${todayNew.length ? `<div class="pg-tags">${todayNew.slice(0, 60).map(tag).join("")}</div>` : `<p class="pg-note">まだ ありません</p>`}</div>
    <div class="pg-card pg-row3">
      <div><small>コイン</small><b>🪙 ${S.coins}</b></div>
      <div><small>なかま</small><b>🐾 ${(S.pets || []).length}</b><small>ずかん ${Object.keys(S.petDex || {}).length}/${PETS.length}</small></div>
      <div><small>連続ログイン</small><b>🔥 ${(S.login || {}).streak || 0}日</b></div>
    </div>
    <p class="pg-note center">読みこみ：${fmtTime(P.loadedAt)}（ゲームで 遊ぶと 数秒〜数分で 反映されます）</p>
    <button class="big-btn" onclick="load()">🔄 最新に する</button>
    <button class="big-btn" onclick="codeView()">➕ コードを 追加・変更する</button>
  </div>`;
}

// ---------- 出題の 設定 ----------
function cfgCard() {
  const cfg = curCfg();
  const on = CHAPTERS.filter((c) => cfgChapterOn(cfg, c)).length;
  const btn = (g, label) => `<button class="pg-gb ${(cfg.g || 0) === g ? "on" : ""}" onclick="setCoarse(${g})">${label}</button>`;
  return `<div class="pg-card"><div class="pg-sub">⚙️ 出題の 設定 <small>（お子さんの 画面には 学年は 出ません）</small></div>
    <p>いまの 設定：<b>${cfgSummary(cfg)}</b>　出題中 ${on}/${CHAPTERS.length}章</p>
    <p class="pg-note">ざっくり 設定（この 学年までの 章を 出す）</p>
    <div class="pg-gbs">${[1, 2, 3, 4, 5, 6].map((g) => btn(g, `${g}年生まで`)).join("")}${btn(0, "すべて")}</div>
    <label class="pg-ch pg-exam"><input type="checkbox" ${cfg.noExam ? "checked" : ""} onchange="setNoExam(this.checked)"><span>中学受験用の 問題を 出さない<br><small>特殊算・難読語など【中学受験用】の 章と 問題を のぞきます</small></span></label>
    <button class="big-btn" onclick="openSettings()">くわしい 設定（章ごと）▶</button>
    <p class="pg-note" id="cfgmsg"></p></div>`;
}
function setNoExam(on) {
  const cfg = curCfg(); cfg.noExam = on || undefined;
  saveCfg(cfg, "cfgmsg");
  const y = window.scrollY; render(); window.scrollTo(0, y);
  if ($("cfgmsg")) $("cfgmsg").textContent = "保存中…";
}
function setCoarse(g) {
  const cfg = curCfg(); cfg.g = g || undefined;
  saveCfg(cfg, "cfgmsg");
  const y = window.scrollY; render(); window.scrollTo(0, y);
  if ($("cfgmsg")) $("cfgmsg").textContent = "保存中…";
}

// くわしい 設定（別の 画面）
let setWorld = "kanji";
function openSettings() { P.view = "settings"; renderSettings(); window.scrollTo(0, 0); }
function closeSettings() { P.view = ""; render(); window.scrollTo(0, 0); }
function renderSettings(w) {
  if (w) setWorld = w;
  const cfg = curCfg(), S = P.slots[P.cur];
  const list = CHAPTERS.filter((c) => c.w === setWorld);
  const grades = [...new Set(list.map((c) => c.g))].sort();
  const tabs = WORLDS.map((x) => {
    const l = CHAPTERS.filter((c) => c.w === x.id), on = l.filter((c) => cfgChapterOn(cfg, c)).length;
    return `<button class="${x.id === setWorld ? "on" : ""}" onclick="renderSettings('${x.id}')">${x.icon}<small>${on}/${l.length}</small></button>`;
  }).join("");
  $("papp").innerHTML = `<div class="pg-wrap">
    <div class="pg-top"><button class="back" onclick="closeSettings()">◀ もどる</button><b>くわしい 設定</b><span>${S ? esc(S.name) : ""}</span></div>
    <div class="pg-tabs pg-wtabs">${tabs}</div>
    <div class="pg-card"><div class="pg-sub">${worldOf(setWorld).icon} ${worldOf(setWorld).name}</div>
      <p class="pg-note">ざっくり設定（<b>${cfg.g ? `${cfg.g}年生まで` : "すべて"}</b>）を もとに、章ごとに オン／オフ できます。変えた 章には「個別」の しるしが つき、ざっくり設定より 優先されます。${cfg.noExam ? "<br>「中学受験用の 問題を 出さない」が オンなので、【中学受験用】の 章は 出ません。" : ""}</p>
      ${grades.map((g) => `<div class="pg-grade"><div class="pg-ghead"><b>${g}年</b>
          <span><button onclick="setGradeAll(${g}, true)">ぜんぶ オン</button><button onclick="setGradeAll(${g}, false)">ぜんぶ オフ</button></span></div>
        ${list.filter((c) => c.g === g).map((c) => {
          const ov = cfg.ch && cfg.ch[c.id] !== undefined;
          const lockEx = cfg.noExam && c.exam;
          return `<label class="pg-ch ${lockEx ? "pg-off" : ""}"><input type="checkbox" ${cfgChapterOn(cfg, c) ? "checked" : ""} ${lockEx ? "disabled" : ""} onchange="setChapter('${c.id}', this.checked)"><span>${c.icon || ""} ${esc(c.name)}${c.exam ? ' <b class="pg-exl">【中学受験用】</b>' : ""}</span>${ov && !lockEx ? '<i class="pg-ov">個別</i>' : ""}</label>`;
        }).join("")}</div>`).join("")}
      <button class="big-btn" onclick="resetWorld()">この国を ざっくり設定に もどす</button>
    </div>
    <p class="pg-note center" id="setmsg"></p>
  </div>`;
}
function rerenderKeep(msg) { const y = window.scrollY; renderSettings(); window.scrollTo(0, y); if ($("setmsg")) $("setmsg").textContent = msg; }
function setChapter(id, on) {
  const cfg = curCfg(); cfg.ch = cfg.ch || {}; cfg.ch[id] = on;
  saveCfg(cfg, "setmsg"); rerenderKeep("保存中…");
}
function setGradeAll(g, on) {
  const cfg = curCfg(); cfg.ch = cfg.ch || {};
  CHAPTERS.filter((c) => c.w === setWorld && c.g === g).forEach((c) => { cfg.ch[c.id] = on; });
  saveCfg(cfg, "setmsg"); rerenderKeep("保存中…");
}
function resetWorld() {
  const cfg = curCfg(); cfg.ch = cfg.ch || {};
  CHAPTERS.filter((c) => c.w === setWorld).forEach((c) => delete cfg.ch[c.id]);
  saveCfg(cfg, "setmsg"); rerenderKeep("保存中…");
}

function head() {
  const n = P.codes.filter(Boolean).length;
  return `<h1 class="pg-title sm">🐣 ぷにまるクエスト <small>保護者ページ</small></h1>
    <div class="pg-manuals"><a href="manual/kids.html?from=parent">📘 こども用 せつめいしょ</a><a href="manual/parents.html">📗 保護者用 せつめいしょ</a></div>
    ${n > 1 ? `<div class="pg-kids"><small>コード</small>${P.codes.map((c, i) => (c ? `<button class="${i === P.ci ? "on" : ""}" onclick="openCode(${i})">${i + 1}. ${esc(P.labels[i] || fmtCode(c))}</button>` : "")).join("")}</div>` : ""}`;
}

// 開いたままに しておいても 新しく なるように、画面に もどったときに 読みなおす
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && P.slots.length && Date.now() - P.loadedAt > 60000) load(); });

applyGrades();
if (P.code) load(); else codeView();
