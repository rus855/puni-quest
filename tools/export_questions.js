// ===== 問題の 一覧を 書き出す（Excel 用） =====
// つかいかた：puni-quest で python -m http.server 8765 を 動かしてから
//   node tools/export_questions.js            → tools/questions.json を つくる
//   python tools/export_xlsx.py               → Excel（.xlsx）を つくる
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9334;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ページの 中で うごかす：章ごとに 問題・正解・まちがいの 選択肢を あつめる
const COLLECT = `(() => {
  S = newSave();
  const strip = (h) => String(h == null ? "" : h).replace(/<br\\s*\\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/\\s+/g, " ").trim();
  const rows = [];
  const stageOf = (ch, id) => { const k = Math.ceil(ch.items.length / 3), i = ch.items.indexOf(id); return i < k ? "1〜" : i < 2 * k ? "2〜" : "3〜"; };
  const base = (ch, id) => ({ world: ch.w, ch: ch.id, chName: ch.name, g: ch.g || "", exam: ch.exam || (typeof isExamItem === "function" && isExamItem(id)) ? "中学受験用" : "", stage: stageOf(ch, id), id });
  const fromQ = (q) => {
    if (q.kind === "choice") { const ok = strip(q.opts[q.ai]); return { q: strip(q.head), ans: ok, ng: q.opts.filter((_, i) => i !== q.ai).map(strip), ex: strip(q.explain) }; }
    if (q.kind === "input") return { q: strip(q.head), ans: q.ans + (q.unit ? " " + q.unit : ""), ng: ["（数字を 入力）"], ex: strip(q.explain) };
    if (q.kind === "order") return { q: strip(q.head), ans: q.items.join(" → "), ng: ["（ならべかえ）"], ex: "" };
    return { q: strip(q.head), ans: "", ng: [], ex: "" };
  };
  const push = (ch, id, kind, o) => rows.push(Object.assign(base(ch, id), { kind }, o));
  for (const ch of CHAPTERS) {
    for (const id of ch.items) {
      if (id.startsWith("k:")) {
        const K = kanjiOf(id);
        K.w.forEach(([w, r]) => {
          const d = YOMI.distractors(K, w, r);
          push(ch, id, "漢字：読み", { card: K.k, q: w + " の よみかたは？", ans: r, ng: d || ["（自然な まちがいが そろわないので「書き」の 形で 出題）"], ex: "" });
          push(ch, id, "漢字：書き", { card: K.k, q: "（" + r + "）" + w.replace(K.k, "□") + " の □に 入る 漢字は？", ans: K.k, ng: K.sim.filter((x) => x !== K.k).slice(0, 3), ex: "" });
        });
        continue;
      }
      if (id.startsWith("f:")) {
        const F = formulaOf(id);
        push(ch, id, "公式：式", Object.assign({ card: F.name }, fromQ(makeQ(id, "ffill"))));
        for (let t = 0; t < 2; t++) push(ch, id, "公式：計算（例）", Object.assign({ card: F.name }, fromQ(makeQ(id, "fcalc"))));
        continue;
      }
      if (id.startsWith("m:")) {
        const M = MATH[id.slice(2)];
        for (let t = 0; t < 3; t++) push(ch, id, "計算（例）", Object.assign({ card: M.name }, fromQ(makeQ(id))));
        continue;
      }
      const Q = BANK[id];
      const q = fromBank(id, Object.assign({}, Q, { rq: undefined, ox: false }));
      push(ch, id, Q.type === "order" ? "ならべかえ" : Q.type === "input" ? "数字入力" : "えらぶ", Object.assign({ card: Q.t }, fromQ(q), { ex: strip(Q.ex) }));
      if (Q.rq) push(ch, id, "ぎゃくに きく", { card: Q.t, q: strip(Q.rq), ans: Q.ra || Q.t, ng: ["（同じ 章の ほかの 答えから 3つ）"], ex: "" });
    }
  }
  const extra = EXTRA_CH.filter((c) => c.write).map((c) => ({ id: c.id, name: c.name, g: c.g, n: c.items.length }));
  return JSON.stringify({ rows, worlds: WORLDS.map((w) => ({ id: w.id, name: w.name })), chapters: CHAPTERS.map((c) => ({ id: c.id, w: c.w, name: c.name, g: c.g || "", exam: !!c.exam, items: c.items.length })), extra, v: window.APP_V });
})()`;

(async () => {
  const prof = path.join(require("os").tmpdir(), "puniquest-export-prof");
  const ch = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, "--no-first-run", "--mute-audio", "about:blank"], { stdio: "ignore" });
  let list;
  for (let i = 0; i < 40; i++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.find((t) => t.type === "page")) break; } catch (e) { /* 起動待ち */ } await sleep(250); }
  const page = list.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0; const wait = {};
  ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && wait[m.id]) { wait[m.id](m); delete wait[m.id]; } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable");
  await send("Page.navigate", { url: "http://localhost:8765/?export=" + Date.now() });
  await sleep(4000);
  const r = await send("Runtime.evaluate", { expression: COLLECT, returnByValue: true });
  if (r.result.exceptionDetails) { console.log("ERR", JSON.stringify(r.result.exceptionDetails).slice(0, 800)); process.exit(1); }
  fs.writeFileSync(path.join(__dirname, "questions.json"), r.result.result.value);
  console.log("ok", JSON.parse(r.result.result.value).rows.length, "rows");
  ws.close(); ch.kill(); process.exit(0);
})();
