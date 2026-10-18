// ===== ゲームの ページで JS を 動かして 結果を 表示する（確認用） =====
// つかいかた：node tools/eval_page.js しらべる.js
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9335;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const expr = fs.readFileSync(process.argv[2], "utf8");
  const prof = path.join(require("os").tmpdir(), "puniquest-eval-prof");
  const ch = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, "--no-first-run", "--mute-audio", "about:blank"], { stdio: "ignore" });
  let list;
  for (let i = 0; i < 40; i++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.find((t) => t.type === "page")) break; } catch (e) { /* 起動待ち */ } await sleep(250); }
  const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0; const wait = {};
  ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && wait[m.id]) { wait[m.id](m); delete wait[m.id]; } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable");
  await send("Page.navigate", { url: "http://localhost:8765/?eval=" + Date.now() });
  await sleep(4000);
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result.exceptionDetails) console.log("ERR", JSON.stringify(r.result.exceptionDetails).slice(0, 800));
  else fs.writeFileSync(path.join(__dirname, "eval_out.txt"), String(r.result.result.value)), console.log("written tools/eval_out.txt");
  ws.close(); ch.kill(); process.exit(0);
})();
