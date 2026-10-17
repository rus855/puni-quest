// ===== デバッグ用の 操作メニュー（作成者だけが 使う） =====
"use strict";
(function () {
  const ss = (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* 無視 */ } };

  // 画面の すみに いつも 出す ボタン
  const btn = document.createElement("button");
  btn.id = "dbgbtn"; btn.textContent = "🛠";
  btn.onclick = () => openDebug();
  document.body.appendChild(btn);
  const st = document.createElement("style");
  st.textContent = `
    #dbgbtn { position: fixed; left: 8px; bottom: calc(env(safe-area-inset-bottom) + 8px); z-index: 70; width: 46px; height: 46px; border-radius: 50%;
      border: 3px solid #fff; background: #37474f; color: #fff; font-size: 22px; box-shadow: 0 3px 8px rgba(0,0,0,.3); }
    #dbgtag { position: fixed; right: 8px; bottom: calc(env(safe-area-inset-bottom) + 14px); z-index: 70; background: #37474f; color: #fff; font-size: 11px;
      border-radius: 99px; padding: 3px 10px; pointer-events: none; opacity: .85; }
    .dbg h3 { margin: 10px 0 4px; font-size: 14px; text-align: left; color: #37474f; }
    .dbg .dgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .dbg .dgrid button { border: 0; border-radius: 12px; padding: 10px 6px; font-weight: bold; font-size: 13px; background: #eceff1; box-shadow: 0 3px 0 #cfd8dc; }
    .dbg .dgrid button.on { background: #ffe082; }
    .dbgans { outline: 4px dashed #00c853 !important; }
    .dbghint { text-align: center; font-size: 12px; color: #00a040; font-weight: bold; }`;
  document.head.appendChild(st);
  const tag = document.createElement("div");
  tag.id = "dbgtag";
  document.body.appendChild(tag);
  const refreshTag = () => { tag.textContent = `🛠 デバッグ ver.${window.APP_V || "-"}${window.PQ_DAY ? `・+${window.PQ_DAY}日` : ""}`; };
  refreshTag();

  const inBattle = () => B && !B.over && document.querySelector(".battle");
  const needS = () => { if (!S) { toast("先に ぼうけんのしょを えらんでね"); return false; } return true; };
  const done = (msg) => { save(); closeModal(); toast(msg); refreshTag(); };

  window.openDebug = function () {
    const on = (f) => (f ? "on" : "");
    modal(`<div class="mtitle">🛠 デバッグ</div>
      <p class="small">本番とは 別の データです（クラウドには 送りません）。</p>
      <div class="dbg">
        <h3>もちもの・なかま</h3>
        <div class="dgrid">
          <button onclick="dbg.maxAll()">ぜんぶ そろえる</button>
          <button onclick="dbg.money()">コイン・ほうせき・そざい MAX</button>
          <button onclick="dbg.pets()">なかま ぜんぶ（Lv10）</button>
          <button onclick="dbg.eggs()">タマゴを すぐ かえす</button>
          <button onclick="dbg.gearAll()">そうび・アクセ ぜんぶ</button>
          <button onclick="dbg.accAll()">アクセサリー ぜんぶ</button>
        </div>
        <h3>進み具合</h3>
        <div class="dgrid">
          <button class="${on(window.PQ_OPEN)}" onclick="dbg.toggleOpen()">全ステージ 解放：${window.PQ_OPEN ? "ON" : "OFF"}</button>
          <button onclick="dbg.clearAll()">全ステージ クリア済みに</button>
          <button onclick="dbg.resetStars()">クリア状況を リセット</button>
          <button onclick="dbg.nextDay()">日付を 1日 進める（いま +${window.PQ_DAY || 0}日）</button>
          <button class="${on(window.PQ_ZUKANALL)}" onclick="dbg.toggleZukan()">ずかん 全表示：${window.PQ_ZUKANALL ? "ON" : "OFF"}</button>
        </div>
        <h3>バトル</h3>
        <div class="dgrid">
          <button class="${on(window.PQ_SHOWANS)}" onclick="dbg.toggleAns()">正解を 表示：${window.PQ_SHOWANS ? "ON" : "OFF"}</button>
          <button onclick="dbg.kill()">敵を 一撃で たおす</button>
          <button onclick="dbg.heal()">体力 ぜんかいふく</button>
          <button onclick="dbg.auto()">自動プレイ（全問正解）</button>
        </div>
        <h3>BGM を きく（せっていが オフでも 鳴るよ）</h3>
        <div class="dgrid">
          ${BGM.songs().map((x) => `<button class="${BGM.previewing() === x.id ? "on" : ""}" onclick="dbg.bgm('${x.id}')">🎵 ${x.name}</button>`).join("")}
          <button onclick="dbg.bgm('')">⏹ とめる（ふつうに もどす）</button>
        </div>
        <h3>そのほか</h3>
        <div class="dgrid">
          <button onclick="closeModal();parentPanel()">保護者メニュー（旧）</button>
          <button onclick="closeModal();goTitle()">タイトルへ</button>
          <button onclick="dbg.reset()">デバッグの データを 消す</button>
          <button onclick="closeModal()">とじる</button>
        </div>
      </div>`);
  };

  window.dbg = {
    money() {
      if (!needS()) return;
      S.coins = 99999; S.gems = 999;
      Object.keys(MATS).forEach((k) => { S.mats[k] = 99; });
      done("コイン・ほうせき・そざいを MAXに したよ");
    },
    pets() {
      if (!needS()) return;
      PETS.forEach((p) => {
        if (!S.pets.some((x) => x.sp === p.id)) { S.petUid = (S.petUid || 0) + 1; S.pets.push({ u: S.petUid, sp: p.id, lv: MAX_PET_LV, xp: 0, bred: "" }); }
        S.petDex[p.id] = 1;
      });
      S.pets.forEach((x) => { x.lv = MAX_PET_LV; });
      if (!S.partner && S.pets[0]) S.partner = S.pets[0].u;
      done(`なかまを ${PETS.length}しゅるい そろえたよ`);
    },
    eggs() {
      if (!needS()) return;
      while (S.eggs.length < MAX_EGGS) S.eggs.push({ r: S.eggs.length % 3, p: 0, n: RARITY[S.eggs.length % 3].need, sp: "", f: false });
      S.eggs.forEach((e) => { e.p = e.n; });
      save(); closeModal(); home();
    },
    maxAll() {
      if (!needS()) return;
      S.owned = ITEMS.map((x) => x.id);
      if (!S.eq.acc) S.eq.acc = "x_none";
      for (let t = 1; t <= 6; t++) S.tierClear[t] = true;
      S.tut = Object.assign(S.tut || {}, { map2: 1, battle: 1, egg: 1 });
      this.pets();
      S.coins = 99999; S.gems = 999; Object.keys(MATS).forEach((k) => { S.mats[k] = 99; });
      done("ぜんぶ そろえたよ（装備・なかま・コイン・そざい）");
    },
    gearAll() {
      if (!needS()) return;
      ITEMS.forEach((x) => { if (!S.owned.includes(x.id)) S.owned.push(x.id); });
      if (!S.eq.acc) S.eq.acc = "x_none";
      done(`そうびを ${ITEMS.length}こ ぜんぶ そろえたよ（アクセサリーも）`);
    },
    accAll() {
      if (!needS()) return;
      const acc = ITEMS.filter((x) => x.type === "acc");
      acc.forEach((x) => { if (!S.owned.includes(x.id)) S.owned.push(x.id); });
      if (!S.eq.acc) S.eq.acc = "x_none";
      done(`アクセサリーを ${acc.length}こ ぜんぶ そろえたよ`);
    },
    bgm(id) { BGM.preview(id); closeModal(); openDebug(); toast(id ? "🎵 さいせい中（まわりの 音に 注意）" : "BGMを ふつうに もどしたよ"); },
    toggleOpen() { window.PQ_OPEN = !window.PQ_OPEN; closeModal(); openDebug(); },
    toggleZukan() { window.PQ_ZUKANALL = !window.PQ_ZUKANALL; ss("pq_debug_zukan", window.PQ_ZUKANALL ? "1" : "0"); closeModal(); openDebug(); },
    clearAll() {
      if (!needS()) return;
      CHAPTERS.forEach((c) => [1, 2, 3, 4].forEach((n) => { S.stClear[`${c.id}-${n}`] = 3; }));
      for (let t = 1; t <= 6; t++) S.tierClear[t] = true;
      done("全ステージを クリア済み（⭐3）に したよ");
    },
    resetStars() { if (!needS()) return; S.stClear = {}; done("クリア状況を リセットしたよ"); },
    nextDay() {
      window.PQ_DAY = (window.PQ_DAY || 0) + 1; ss("pq_debug_day", String(window.PQ_DAY));
      closeModal(); toast(`日付を ${window.PQ_DAY}日 進めたよ`); refreshTag();
      if (S) home();
    },
    toggleAns() {
      window.PQ_SHOWANS = !window.PQ_SHOWANS; ss("pq_debug_ans", window.PQ_SHOWANS ? "1" : "0");
      closeModal(); if (inBattle() && !B.busy) showQ();
    },
    kill() {
      if (!inBattle()) { toast("バトル中に 使ってね"); return; }
      closeModal(); B.e.hp = 0; B.busy = false;
      // 1回 正解して たおす
      window.dbgSolve();
    },
    heal() { if (!inBattle()) { toast("バトル中に 使ってね"); return; } B.php = pMaxHp(); updBars(); closeModal(); },
    async auto() {
      if (!inBattle()) { toast("バトル中に 使ってね"); return; }
      closeModal(); toast("自動プレイ中…（タイトルなどに もどると 止まる）");
      for (let i = 0; i < 300 && inBattle(); i++) {
        if (document.getElementById("tc")) { dbgTrace(); }
        else if ($("modal").classList.contains("show")) closeModal();
        else if (!B.busy) window.dbgSolve();
        await wait(250);
      }
    },
    reset() {
      if (!confirm("デバッグの データを すべて 消しますか？（本番の データは 消えません）")) return;
      ["puniquest_debug_slots_v1", "puniquest_debug_cloud_v1"].forEach((k) => { try { localStorage.removeItem(k); } catch (e) { /* 無視 */ } });
      location.reload();
    },
  };

  // いまの 問題に 正しく 答える
  window.dbgSolve = function () {
    const q = B.q;
    if (!q || B.busy) return;
    if (q.kind === "choice") answer(q.ai);
    else if (q.kind === "input") { B.inp = String(q.ans); submitInput(); }
    else if (q.kind === "write") { glyphStrokes(); writeJudge(); }
    else { q.picked = []; q.items.forEach((_, i) => orderTap(i)); }
  };
  // 字の 形を 線に して TR.strokes に 入れる
  function glyphStrokes() {
    const N = 60, c = document.createElement("canvas"); c.width = c.height = N;
    const g = c.getContext("2d"); drawGlyph(g, N, TR.k, "#000");
    const d = g.getImageData(0, 0, N, N).data, strokes = [];
    for (let y = 0; y < N; y += 2) { let run = null; for (let x = 0; x < N; x++) { const on = d[(y * N + x) * 4 + 3] > 100; if (on && !run) run = [[x / N, y / N]]; if (!on && run) { run.push([(x - 1) / N, y / N]); strokes.push(run); run = null; } } }
    TR.strokes = strokes;
  }
  // なぞり書きは 字の 形を なぞったことに する
  window.dbgTrace = function () {
    const N = 60, c = document.createElement("canvas"); c.width = c.height = N;
    const g = c.getContext("2d"); drawGlyph(g, N, TR.k, "#000");
    const d = g.getImageData(0, 0, N, N).data, strokes = [];
    for (let y = 0; y < N; y += 2) { let run = null; for (let x = 0; x < N; x++) { const on = d[(y * N + x) * 4 + 3] > 100; if (on && !run) run = [[x / N, y / N]]; if (!on && run) { run.push([(x - 1) / N, y / N]); strokes.push(run); run = null; } } }
    TR.strokes = strokes; traceJudge();
  };
  // 正解の 表示
  window.debugMarkAnswer = function (q) {
    if (q.kind === "choice") { const b = document.querySelectorAll(".ch")[q.ai]; if (b) b.classList.add("dbgans"); }
    else if (q.kind === "input") $("qpanel").insertAdjacentHTML("beforeend", `<p class="dbghint">🛠 こたえ：${q.ans}</p>`);
    else $("qpanel").insertAdjacentHTML("beforeend", `<p class="dbghint">🛠 じゅんばん：${q.items.join(" → ")}</p>`);
  };
})();
