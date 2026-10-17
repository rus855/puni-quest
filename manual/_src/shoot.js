// 説明書用：ヘッドレスChromeで ゲーム画面を 撮影する
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const OUT = path.join(__dirname, "shots");
fs.mkdirSync(OUT, { recursive: true });
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// デモ用の データ（クラウドには 送らない）
const SETUP = `
Cloud.markDirty=()=>{}; Cloud.push=()=>Promise.resolve();
S = newSave(); S.name="ぷにまる"; SL.cur=0; SL.slots[0]=S; S.tut={map2:1,battle:1,egg:1}; S.sound=true;
S.coins=2480; S.gems=6;
["kinoko","donguri","kai","moji","suuji","koto"].forEach((k,i)=>addMat(k,3+i));
S.owned=["w_stick","a_cloth","h_none","w_fire1","w_heart","a_dress","h_bunny","w_harisen","h_afro","a_box","h_crown","w_water1","w_leaf1","a_leather","h_ribbon"].filter(id=>itemById(id));
S.owned.push("x_none","x_heart","x_kirame","x_dragon","x_cloud","a_knight","a_bear","x_skate","x_hearts","x_tear");
S.eq={weapon:"w_heart",armor:"a_dress",hat:"h_bunny",acc:"x_none"};
["kinsumi","hidama","raitama"].forEach((k,i)=>addMat(k,1+i));
PETS.slice(0,7).forEach((p,i)=>{ S.petUid++; S.pets.push({u:S.petUid, sp:p.id, lv:[6,5,4,7,3,5,2][i], xp:0, bred:""}); S.petDex[p.id]=1; }); S.partner=1;
S.eggs=[{r:0,p:12,n:20,sp:"",f:false},{r:1,p:18,n:35,sp:"",f:false}];
[24,31,18,40,27,35,22].forEach((n,i)=>{ const d=nowDate(); d.setDate(d.getDate()-6+i); S.stats.days[dateKey(d)]={tot:n,cor:Math.round(n*0.85)}; });
CHAPTERS.filter(c=>["k1a","k1b","m1","m4","h1","s1","w1"].includes(c.id)).forEach(c=>c.items.forEach((id,j)=>{ if(j%3===2) return; const cc=card(id); cc.s=1+(j%4); cc.tot=4; cc.cor=3; cc.last=yesterday(); }));
["k1a-1","k1a-2","k1a-3","k1a-4","k1b-1","k1b-2","m1-1","m1-2"].forEach((k,i)=>S.stClear[k]=[3,3,2,3,2,3,3,1][i]); S.tierClear[1]=true;
S.stats.tot=420; S.stats.cor=356; S.login={last:today(), streak:4};
ensureDaily(); S.daily.prog = { q10: 10, starup3: 2 };
save(); window.SAVED=JSON.stringify(S);
window.RESTORE=()=>{ S=JSON.parse(window.SAVED); SL.slots[0]=S; };
window.FAKE=(k)=>{ const N=64,c=document.createElement("canvas"); c.width=c.height=N; const g=c.getContext("2d",{willReadFrequently:true}); g.translate(N/2,N/2); g.rotate(-0.05); g.scale(0.92,1.05); g.translate(-N/2,-N/2); g.font=(N*0.78)+"px serif"; g.textAlign="center"; g.textBaseline="middle"; g.fillText(k,N/2+1,N/2+2); const sk=thinGrid(gridOf(g,N,100),N), st=[]; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(sk[y*N+x]) st.push([[x/N+Math.sin(y/7)*0.012,y/N+Math.sin(x/8)*0.012]]); return st; };
window.WQ=(sid)=>{ startBattle(sid); TR.strokes=FAKE(TR.k); redrawTrace(); };
window.QB=(sid,id,kind)=>{ startBattle(sid); B.q=makeQ(id,kind); B.q.special=false; showQ(); };
"ok"`;

// 撮る 画面（js：画面を 出す、wait：待つ時間）
const SHOTS = [
  ["01_title", `RESTORE(); title()`],
  ["02_setup", `S=newSave(); setup(); document.querySelector("input").value="ぷにまる"; document.querySelector("input").blur()`],
  ["03_home", `RESTORE(); home()`],
  ["04_map", `RESTORE(); map()`],
  ["05_world", `RESTORE(); openWorld("kanji")`],
  ["06_chapter", `RESTORE(); openChapter("k1b")`],
  ["07_battle", `RESTORE(); QB("k1b-3", CHAPTERS.find(c=>c.id==="k1b").items[3], "kread")`],
  ["08_maru", `RESTORE(); QB("k1b-3", CHAPTERS.find(c=>c.id==="k1b").items[3], "kread"); setTimeout(()=>answer(B.q.ai), 300)`, 560],
  ["09_wrong", `setTimeout(()=>{ if (B) B.over=true; RESTORE(); QB("k1b-3", CHAPTERS.find(c=>c.id==="k1b").items[5], "kwrite"); setTimeout(()=>answer((B.q.ai+1)%4), 300); setTimeout(()=>window.scrollTo(0, document.body.scrollHeight), 700); }, 2500)`, 3700],
  ["10_input", `RESTORE(); QB("m4-1", "m:sokudo"); ["1","0","0"].forEach(k=>keyIn(k))`],
  ["11_order", `RESTORE(); QB("h1-2", CHAPTERS.find(c=>c.id==="h1").items.find(x=>BANK[x]&&BANK[x].type==="order")); orderTap(B.q.shown.indexOf(0)===-1?0:0)`],
  ["12_special", `RESTORE(); QB("m1-2", "m:tani"); B.gauge=5; updBars()`],
  ["13_trace", `RESTORE(); startBattle("k1b-4"); B.ei=B.enemies.length-1; nextEnemy(); B.e.hp=0; updBars(); startTrace()`, 700],
  ["14_clear", `RESTORE(); startBattle("k1b-2"); B.miss=0; B.coins=46; B.mats={kinoko:2,moji:1}; B.news=CHAPTERS.find(c=>c.id==="k1b").items.slice(0,3); B.ups=[CHAPTERS.find(c=>c.id==="k1b").items[4]]; B.eggs=[0]; B.ei=B.enemies.length; B.e.hp=0; stageClear()`, 900],
  ["15_shop", `RESTORE(); S.tierClear={1:true,2:true}; shop("hat")`],
  ["16_equip", `RESTORE(); equip()`],
  ["17_nakama", `RESTORE(); nakama("pets")`],
  ["18_egg", `RESTORE(); S.eggs[0].p=20; nakama("egg")`],
  ["19_breed", `RESTORE(); S.pets[0].lv=6; S.pets[3].lv=7; nakama("breed")`],
  ["20_dex", `RESTORE(); nakama("dex")`],
  ["21_zukan", `RESTORE(); zukan("kanji")`],
  ["22_mats", `RESTORE(); zukan("mats")`],
  ["23_missions", `RESTORE(); missions()`],
  ["24_settings", `RESTORE(); parent()`],
  ["25_chart", `RESTORE(); map(); showChart()`],
    ["28_write", `RESTORE(); S.stClear["k1a-4"]=3; WQ("kw1-2")`, 900],
  ["29_writemaru", `RESTORE(); S.stClear["k1a-4"]=3; WQ("kw1-2"); setTimeout(()=>writeJudge(), 400)`, 680],
  ["30_writebtn", `RESTORE(); openWorld("kanji"); setTimeout(()=>document.querySelector(".stage.write").scrollIntoView({block:"center"}), 100)`, 900],
  ["31_maoumap", `RESTORE(); WORLDS.forEach(w=>worldChapters(w.id).slice(0,3).forEach(c=>S.stClear[c.id+"-4"]=3)); map(); setTimeout(()=>window.scrollTo(0, document.body.scrollHeight), 100)`, 900],
  ["32_maou", `RESTORE(); WORLDS.forEach(w=>worldChapters(w.id).slice(0,5).forEach(c=>S.stClear[c.id+"-4"]=3)); startBattle("z1-4"); B.ei=2; nextEnemy()`, 1000],
  ["33_costume", `RESTORE(); S.eq={weapon:"w_heart",armor:"a_knight",hat:"h_none",acc:"x_dragon"}; equip()`],
  ["34_shopacc", `RESTORE(); S.tierClear={1:true,2:true,3:true}; shop("acc")`],
  ["35_dressup", `RESTORE(); const cs=[["w_heart","a_bear","h_none","x_cloud"],["w_tuna","a_swim","h_glasses","x_whale"],["w_niji","a_knight","h_none","x_dragon"],["w_mugen","a_robot","h_none","x_rocket"],["w_h1","a_ninja2","h_none","x_horse"],["w_shine","a_bolt","h_crown","x_none"],["w_starwand","a_starry","h_tiara","x_rainbow"],["w_harisen","a_box","h_afro","x_tear"],["w_stick","a_cloth","h_party","x_heart"]]; setScreen('<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:18px 8px;background:#fff7fb;min-height:720px">'+cs.map(c=>'<div style="text-align:center">'+charSVG({weapon:c[0],armor:c[1],hat:c[2],acc:c[3]},S.color)+'</div>').join("")+'</div>',"bg-home")`],
  ["27_hatch", `RESTORE(); S.eggs[0].p=20; nakama("egg"); hatchEgg(0)`, 2800],
];

(async () => {
  const prof = path.join(require("os").tmpdir(), "puniquest-shot-prof");
  const ch = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, "--no-first-run", "--mute-audio", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
  let list;
  for (let i = 0; i < 40; i++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.find((t) => t.type === "page")) break; } catch (e) { /* 起動待ち */ } await sleep(250); }
  const page = list.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0; const wait = {};
  ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && wait[m.id]) { wait[m.id](m); delete wait[m.id]; } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async (js) => { const r = await send("Runtime.evaluate", { expression: js, awaitPromise: true, returnByValue: true }); if (r.result && r.result.exceptionDetails) console.log("ERR", r.result.exceptionDetails.exception && r.result.exceptionDetails.exception.description); return r.result && r.result.result && r.result.result.value; };
  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 720, deviceScaleFactor: 2, mobile: true });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  await send("Page.enable");
  await send("Page.navigate", { url: "http://localhost:8765/?shot=" + Date.now() });
  await sleep(3500);
  await evalJs("localStorage.clear()");
  console.log("setup:", await evalJs(SETUP));
  const only = process.argv[2];
  for (const [name, js, ms] of SHOTS) {
    if (only && !name.startsWith(only)) continue;
    await evalJs(`(function(){ var t=document.getElementById("toast"); if(t) t.style.display=""; })(); try{ closeModal(); }catch(e){} if (typeof B!=="undefined" && B) B.over=true; window.scrollTo(0,0); ${js}; "ok"`);
    await sleep(ms || 700);
    await evalJs(`(function(){ var t=document.getElementById("toast"); if(t){ t.className=""; t.style.display="none"; } })()`);
    const r = await send("Page.captureScreenshot", { format: "jpeg", quality: 88 });
    fs.writeFileSync(path.join(OUT, name + ".jpg"), Buffer.from(r.result.data, "base64"));
    console.log("shot", name);
  }
  // 保護者ページ（クラウドには つながず、見本の データで 表示）
  if (!only || only.startsWith("4")) {
    const demo = await evalJs("window.SAVED");
    await send("Page.navigate", { url: "http://localhost:8765/parent.html?shot=" + Date.now() });
    await sleep(3000);
    const mock = `window.saveCfg=function(c){c.at=Date.now();P.cfgs[P.cur]=c;}; P.code="ABCD-EFGH-JKLM"; P.slots=[JSON.parse(${JSON.stringify(demo)}),null,null]; P.cfgs=[]; P.cur=0; P.loadedAt=Date.now(); render(); "ok"`;
    console.log("parent:", await evalJs(mock));
    for (const [name, js, ms] of [["40_parent", "window.scrollTo(0,0)"], ["41_parentcfg", "document.querySelector('.pg-exam').scrollIntoView({block:'center'})"], ["42_parentdetail", "openSettings(); renderSettings('math'); setTimeout(()=>{ const e=[...document.querySelectorAll('.pg-ch')].find(x=>x.innerText.includes('中学受験')); if(e) e.scrollIntoView({block:'center'}); }, 100)"]]) {
      await evalJs(js); await sleep(ms || 700);
      const r = await send("Page.captureScreenshot", { format: "jpeg", quality: 88 });
      fs.writeFileSync(path.join(OUT, name + ".jpg"), Buffer.from(r.result.data, "base64"));
      console.log("shot", name);
    }
  }
  await evalJs("localStorage.clear()");
  ws.close(); ch.kill();
  process.exit(0);
})();
