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

let P = { code: "", slots: [], cur: 0, loadedAt: 0 };
try { const t = JSON.parse(localStorage.getItem(P_KEY) || "{}"); P.code = t.code || ""; P.cur = t.cur || 0; } catch (e) { /* 無視 */ }
const remember = () => { try { localStorage.setItem(P_KEY, JSON.stringify({ code: P.code, cur: P.cur })); } catch (e) { /* 無視 */ } };

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
  return [1, 2, 3].map((n) => { try { const s = f["s" + n] && f["s" + n].stringValue; return s ? JSON.parse(s) : null; } catch (e) { return null; } });
}

// ---------- 画面 ----------
function loginView(msg) {
  $("papp").innerHTML = `<div class="pg-wrap">
    <h1 class="pg-title">🐣 ぷにまるクエスト<br><small>保護者ページ</small></h1>
    <div class="pg-card">
      <p>お子さんの ゲームの ⚙️ →「保護者の方へ」に 表示される <b>ふっかつコード（12文字）</b> を入力してください。</p>
      <input id="pcode" class="pg-in" maxlength="16" placeholder="XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" value="${esc(P.code ? P.code.replace(/(.{4})(.{4})(.{4})/, "$1-$2-$3") : "")}">
      <label class="pg-chk"><input type="checkbox" id="prem" checked> この端末に コードを 記憶する</label>
      <button class="big-btn primary" onclick="doLogin()">学習の ようすを 見る</button>
      ${msg ? `<p class="pg-err">${msg}</p>` : ""}
      <p class="pg-note">このページは 見るだけです。お子さんの データが 書きかわることは ありません。</p>
    </div></div>`;
}

async function doLogin() {
  const c = $("pcode").value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length !== 12) return loginView("コードは 12文字です。");
  P.code = c;
  if ($("prem").checked) remember(); else localStorage.removeItem(P_KEY);
  await load();
}

async function load() {
  $("papp").innerHTML = `<div class="loading">データを 読みこみ中…</div>`;
  try {
    const slots = await fetchSlots(P.code);
    if (!slots) return loginView("この コードの データが 見つかりません。コードを ご確認ください。");
    P.slots = slots; P.loadedAt = Date.now();
    if (!P.slots[P.cur]) P.cur = Math.max(0, P.slots.findIndex(Boolean));
    render();
  } catch (e) { loginView("読みこみに 失敗しました。ネットの 接続を ご確認ください。"); }
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
    <div class="pg-card"><div class="pg-sub">⚙️ 出題の 設定</div>
      <p>漢字：${((S.cfg || {}).kg || [1, 2, 3, 4, 5, 6]).map((g) => g + "年").join("・")}</p>
      ${Object.keys((S.cfg || {}).off || {}).length ? `<p>お休み中の 章：${Object.keys(S.cfg.off).map((id) => { const c = CHAPTERS.find((x) => x.id === id); return c ? esc(c.name) : id; }).join("、")}</p>` : "<p>ほかの 国：すべての 章を 出題中</p>"}
      <p class="pg-note">設定の 変更は、お子さんの ゲームの ⚙️ →「保護者の方へ」→「出題の設定」で できます。</p></div>
    <p class="pg-note center">読みこみ：${fmtTime(P.loadedAt)}（ゲームで 遊ぶと 数秒〜数分で 反映されます）</p>
    <button class="big-btn" onclick="load()">🔄 最新に する</button>
    <button class="big-btn" onclick="logout()">コードを 入れなおす</button>
  </div>`;
}

function head() {
  return `<h1 class="pg-title sm">🐣 ぷにまるクエスト <small>保護者ページ</small></h1>`;
}
function logout() { localStorage.removeItem(P_KEY); P.code = ""; loginView(); }

// 開いたままに しておいても 新しく なるように、画面に もどったときに 読みなおす
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && P.slots.length && Date.now() - P.loadedAt > 60000) load(); });

if (P.code) load(); else loginView();
