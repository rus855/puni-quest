// ===== ぷにまるクエスト：学習データ・ゲームデータ =====

// --- 算数の公式（5・6年） ---
// name: 公式名, ans: 正しい式, ng: まちがいの式, skill: 必殺技の名前, gen: 計算問題をつくる関数
// 乱数ヘルパー
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
// 小数の誤差をなくす（小数第2位まで）
const r2 = (x) => Math.round(x * 100) / 100;

const FORMULAS = [
  {
    id: "enshu", name: "円周の長さ", ans: "直径 × 3.14", ng: ["半径 × 3.14", "直径 × 直径 × 3.14", "直径 ÷ 3.14"],
    skill: "リングスラッシュ",
    gen() { const d = ri(3, 12); return { q: `直径 ${d}cm の 円の 円周を もとめる 式は？`, a: `${d}×3.14`, unit: "", ng: [`${d}×${d}×3.14`, `${d}÷2×3.14`, `${d}×2×3.14`] }; },
  },
  {
    id: "enmen", name: "円の面積", ans: "半径 × 半径 × 3.14", ng: ["半径 × 2 × 3.14", "直径 × 直径 × 3.14", "半径 × 3.14"],
    skill: "サークルバスター",
    gen() { const r = ri(3, 10); return { q: `半径 ${r}cm の 円の 面積を もとめる 式は？`, a: `${r}×${r}×3.14`, unit: "", ng: [`${r}×2×3.14`, `${r * 2}×${r * 2}×3.14`, `${r}×3.14`] }; },
  },
  {
    id: "sankaku", name: "三角形の面積", ans: "底辺 × 高さ ÷ 2", ng: ["底辺 × 高さ", "(底辺 + 高さ) × 2", "底辺 × 高さ × 2"],
    skill: "トライアングルビーム",
    gen() { const b = ri(2, 12) * 2, h = ri(3, 12); return { q: `底辺 ${b}cm、高さ ${h}cm の三角形の面積は？`, a: b * h / 2, unit: "cm²", ng: [b * h, b + h, b * h * 2] }; },
  },
  {
    id: "heiko", name: "平行四辺形の面積", ans: "底辺 × 高さ", ng: ["底辺 × 高さ ÷ 2", "(底辺 + 高さ) × 2", "底辺 + 高さ"],
    skill: "ナナメシールド",
    gen() { const b = ri(3, 12), h = ri(3, 12); return { q: `底辺 ${b}cm、高さ ${h}cm の平行四辺形の面積は？`, a: b * h, unit: "cm²", ng: [b * h / 2, (b + h) * 2, b * h * 2] }; },
  },
  {
    id: "daikei", name: "台形の面積", ans: "(上底 + 下底) × 高さ ÷ 2", ng: ["上底 × 下底 × 高さ ÷ 2", "(上底 + 下底) × 高さ", "上底 + 下底 × 高さ ÷ 2"],
    skill: "ダイケイクラッシュ",
    gen() { const a = ri(2, 8), b = a + ri(2, 8), h = ri(2, 6) * 2; return { q: `上底 ${a}cm、下底 ${b}cm、高さ ${h}cm の台形の面積は？`, a: (a + b) * h / 2, unit: "cm²", ng: [(a + b) * h, a * b * h / 2, (a + b) * 2] }; },
  },
  {
    id: "hishi", name: "ひし形の面積", ans: "対角線 × 対角線 ÷ 2", ng: ["対角線 × 対角線", "対角線 + 対角線 ÷ 2", "対角線 × 4"],
    skill: "ダイヤモンドスター",
    gen() { const p = ri(2, 8) * 2, q = ri(3, 12); return { q: `対角線が ${p}cm と ${q}cm のひし形の面積は？`, a: p * q / 2, unit: "cm²", ng: [p * q, p + q, p * q * 2] }; },
  },
  {
    id: "chokuho", name: "直方体の体積", ans: "たて × 横 × 高さ", ng: ["たて × 横 × 高さ ÷ 2", "(たて + 横) × 高さ", "たて × 横 + 高さ"],
    skill: "ブロックプレス",
    gen() { const a = ri(2, 6), b = ri(2, 6), c = ri(2, 6); return { q: `たて ${a}cm、横 ${b}cm、高さ ${c}cm の直方体の体積は？`, a: a * b * c, unit: "cm³", ng: [a * b + c, (a + b) * c, a * b * c * 2] }; },
  },
  {
    id: "kakuchu", name: "角柱・円柱の体積", ans: "底面積 × 高さ", ng: ["底面積 × 高さ ÷ 2", "底面積 + 高さ", "底面積 × 高さ × 2"],
    skill: "タワーフォール",
    gen() { const s = ri(3, 15), h = ri(2, 9); return { q: `底面積 ${s}cm²、高さ ${h}cm の角柱の体積は？`, a: s * h, unit: "cm³", ng: [s * h / 2, s + h, s * h * 2] }; },
  },
  {
    id: "hayasa", name: "速さ", ans: "道のり ÷ 時間", ng: ["道のり × 時間", "時間 ÷ 道のり", "道のり + 時間"],
    skill: "ソニックダッシュ",
    gen() { const v = ri(3, 12) * 5, t = ri(2, 5); return { q: `${v * t}km を ${t}時間 で進んだ。時速は？`, a: v, unit: "km/時", ng: [v * t * t, v * t - t, v * t + t] }; },
  },
  {
    id: "michinori", name: "道のり", ans: "速さ × 時間", ng: ["速さ ÷ 時間", "時間 ÷ 速さ", "速さ + 時間"],
    skill: "ロングジャンプ",
    gen() { const v = ri(3, 12) * 5, t = ri(2, 5); return { q: `時速 ${v}km で ${t}時間 進んだ。道のりは？`, a: v * t, unit: "km", ng: [v + t, r2(v / t), v * t + v] }; },
  },
  {
    id: "jikan", name: "時間", ans: "道のり ÷ 速さ", ng: ["道のり × 速さ", "速さ ÷ 道のり", "道のり − 速さ"],
    skill: "タイムストップ",
    gen() { const v = ri(3, 12) * 5, t = ri(2, 6); return { q: `${v * t}km を 時速 ${v}km で進むと、何時間かかる？`, a: t, unit: "時間", ng: [t + 1, t * 2, v] }; },
  },
  {
    id: "wariai", name: "割合", ans: "比べる量 ÷ もとにする量", ng: ["もとにする量 ÷ 比べる量", "比べる量 × もとにする量", "比べる量 − もとにする量"],
    skill: "パーセントキャノン",
    gen() { const b = [20, 40, 50, 80, 100, 200][ri(0, 5)], p = ri(1, 9) * 10, a = b * p / 100; return { q: `もとにする量が ${b}、比べる量が ${a} のとき、割合は？`, a: r2(a / b), unit: "", ng: [r2(b / a), r2(a / b * 10), r2(a / b / 10)] }; },
  },
  {
    id: "heikin", name: "平均", ans: "合計 ÷ 個数", ng: ["合計 × 個数", "個数 ÷ 合計", "いちばん大きい数 ÷ 2"],
    skill: "バランスブレイク",
    gen() { const n = ri(3, 5), m = ri(10, 20); const xs = []; let s = 0; for (let i = 0; i < n - 1; i++) { const x = m + ri(-3, 3); xs.push(x); s += x; } xs.push(m * n - s); return { q: `${xs.join("、")} の平均は？`, a: m, unit: "", ng: [m + 1, m - 1, m * n] }; },
  },
  {
    id: "hirei", name: "比例の式", ans: "y = きまった数 × x", ng: ["x × y = きまった数", "y = x + きまった数", "y = きまった数 ÷ x"],
    skill: "グングンアッパー",
    gen() { const k = ri(2, 6), x1 = ri(2, 4), x2 = ri(5, 9); return { q: `y は x に比例。x=${x1} のとき y=${k * x1}。x=${x2} のとき y は？`, a: k * x2, unit: "", ng: [k * x1 + x2, x2 + k, k * x2 + k] }; },
  },
  {
    id: "hanpirei", name: "反比例の式", ans: "x × y = きまった数", ng: ["y = きまった数 × x", "x + y = きまった数", "y = x ÷ きまった数"],
    skill: "シーソーリバース",
    gen() { const pairs = [[2, 12, 6], [3, 12, 4], [2, 18, 6], [4, 6, 8], [3, 8, 6], [2, 24, 8]]; const [x1, y1, x2] = pairs[ri(0, pairs.length - 1)]; return { q: `y は x に反比例。x=${x1} のとき y=${y1}。x=${x2} のとき y は？`, a: x1 * y1 / x2, unit: "", ng: [y1 * x2 / x1, x1 * y1, y1 - x2 + x1] }; },
  },
  {
    id: "naikaku", name: "多角形の角の和", ans: "180 × (辺の数 − 2)", ng: ["180 × 辺の数", "360 × (辺の数 − 2)", "90 × 辺の数"],
    skill: "ポリゴンストーム",
    gen() { const n = ri(4, 8); const nm = { 4: "四角形", 5: "五角形", 6: "六角形", 7: "七角形", 8: "八角形" }[n]; return { q: `${nm}の角の大きさの和は？`, a: 180 * (n - 2), unit: "度", ng: [180 * n, 360 * (n - 2), 180 * (n - 1)] }; },
  },
];

// --- ぞくせい（属性） ---
const ELEMENTS = {
  none: { icon: "・", name: "なし", color: "#aaa" },
  fire: { icon: "🔥", name: "ほのお", color: "#ff7a59" },
  water: { icon: "💧", name: "みず", color: "#4aa8ff" },
  thunder: { icon: "⚡", name: "かみなり", color: "#ffc400" },
  leaf: { icon: "🌿", name: "くさ", color: "#4cc46a" },
  star: { icon: "✨", name: "ほし", color: "#c77dff" },
};
// あいしょう：🔥は🌿に強い → 🌿は⚡に強い → ⚡は💧に強い → 💧は🔥に強い
const BEATS = { fire: "leaf", leaf: "thunder", thunder: "water", water: "fire" };

// こうげきの属性(att) が 相手の属性(def) に どれだけ効くか
// imm：相手が「きかない」属性（none なら ぞくせいなしの こうげきが きかない）
function effect(att, def, imm) {
  if (imm && att === imm) return 0;
  if (att === "star") return 1.25;
  if (att === "none" || def === "none" || !def) return 1;
  if (BEATS[att] === def) return 2;
  if (BEATS[def] === att || att === def) return 0.5;
  return 1;
}
const EFFECT_LABEL = (x) => (x === 0 ? "きかない" : x >= 2 ? "こうかばつぐん" : x < 1 ? "いまひとつ" : x > 1 ? "よくきく" : "ふつう");
const EFFECT_MARK = (x) => (x === 0 ? "✖" : x >= 2 ? "◎" : x < 1 ? "△" : "○");

// --- そざい（てきが おとす。そうびを つくるのに つかう） ---
const MATS = {
  kinoko: { name: "もりのキノコ", em: "🍄" },
  donguri: { name: "ヌシのドングリ", em: "🌰" },
  kai: { name: "きれいなかいがら", em: "🐚" },
  shizuku: { name: "うみのしずく", em: "💠" },
  yogan: { name: "ようがんいし", em: "🪨" },
  honoo: { name: "ほのおのかけら", em: "🔶" },
  yuki: { name: "ゆきのけっしょう", em: "❄️" },
  hyou: { name: "えいきゅうひょう", em: "🧊" },
  denki: { name: "でんきいし", em: "🔋" },
  kaku: { name: "かみなりのかく", em: "🌩️" },
  yami: { name: "やみのかけら", em: "🌑" },
  // 国ごとの そざい（その国の 章で 手に はいる）
  moji: { name: "もじのかけら", em: "📜" },
  koto: { name: "ことだまのしおり", em: "🔖" },
  suuji: { name: "すうじのクリスタル", em: "🔷" },
  kagaku: { name: "ふしぎなすいしょう", em: "🔮" },
  rekishi: { name: "れきしのつぼ", em: "🏺" },
};
const WORLD_MAT = { kanji: "moji", kotoba: "koto", math: "suuji", sci: "kagaku", soc: "rekishi" };

// --- そうびの とくしゅ能力（sp） ---
// 武器 crit:かいしん率 hit:あたる確率 extra:ついげき率 multi:2回目の強さ stun:しびれ率 drain:きゅうしゅう率
//      boss:ボスに強い pierce:いまひとつを無視 exec:とどめ first:先制 combo:コンボ強化 gauge:ゲージ+ coin:コイン+
// 防具 reflect:はんげき dodge:かいひ regen:正解で回復 endure:くいしばり guard1:最初の こうげきを 半分
// ぼうし hint:ヒント egg:タマゴ成長 mat:そざい petfast:なかまチャージ coin:コイン+ regen:正解で回復
function spText(sp) {
  if (!sp) return "";
  const t = [];
  if (sp.crit) t.push(`かいしん${Math.round(sp.crit * 100)}%（2ばい）`);
  if (sp.hit) t.push(`大ぶり（あたる確率${Math.round(sp.hit * 100)}%）`);
  if (sp.extra) t.push(`ついげき${Math.round(sp.extra * 100)}%`);
  if (sp.multi) t.push("2回こうげき");
  if (sp.stun) t.push(`しびれ${Math.round(sp.stun * 100)}%`);
  if (sp.drain) t.push(`ダメージの${Math.round(sp.drain * 100)}%を きゅうしゅう`);
  if (sp.boss) t.push("ボスに 1.5ばい");
  if (sp.pierce) t.push("いまひとつ・きかないを むし");
  if (sp.exec) t.push("のこり少ない てきに 2ばい");
  if (sp.first) t.push("さいしょの 一撃 2ばい");
  if (sp.combo) t.push("コンボで さらに 強くなる");
  if (sp.gauge) t.push(`ゲージ +${sp.gauge}`);
  if (sp.coin) t.push(`コイン +${Math.round(sp.coin * 100)}%`);
  if (sp.reflect) t.push(`はんげき${Math.round(sp.reflect * 100)}%`);
  if (sp.dodge) t.push(`かいひ${Math.round(sp.dodge * 100)}%`);
  if (sp.regen) t.push(`正解で ❤️${Math.round(sp.regen * 100)}% かいふく`);
  if (sp.endure) t.push("くいしばり（1回 たえる）");
  if (sp.guard1) t.push("さいしょの こうげき 半分");
  if (sp.hint) t.push("てきごとに 1回 ヒント");
  if (sp.egg) t.push(`タマゴが ${sp.egg}ばい そだつ`);
  if (sp.mat) t.push("そざいが 出やすい");
  if (sp.petfast) t.push("なかまの チャージが 早い");
  return t.join("・");
}

// --- ショップのアイテム ---
// type: weapon / armor / hat, atk: こうげき, def: ぼうぎょ, hp: たいりょく, el: 属性
// res: この属性の こうげきを 半分にする, weak: この属性の こうげきを 1.5ばい うける
// price: コイン, mat: ひつような そざい, gem: ほうせき, look: 見た目
// unlock: この強さ（ティア）の 章を クリアすると ショップに 並ぶ（0 は最初から）
// series: 国の そうび
const ITEMS = [
  { id: "w_stick", type: "weapon", name: "きのぼう", atk: 3, el: "none", price: 0, unlock: 0 },
  { id: "w_sling", type: "weapon", name: "ぱちんこ", atk: 5, el: "none", price: 100, mat: { kinoko: 4 }, unlock: 0, look: "sling", sp: { first: 2 } },
  { id: "w_fire1", type: "weapon", name: "ほのおのつえ", atk: 8, el: "fire", price: 120, mat: { kinoko: 6 }, unlock: 0 },
  { id: "w_hammer", type: "weapon", name: "いしのハンマー", atk: 10, el: "none", price: 240, mat: { kinoko: 8, donguri: 2 }, unlock: 1 },
  { id: "w_thunder1", type: "weapon", name: "いなずまハンマー", atk: 12, el: "thunder", price: 300, mat: { kinoko: 4, donguri: 4 }, unlock: 1 },
  { id: "w_axe", type: "weapon", name: "おおきな オノ", atk: 17, el: "none", price: 400, mat: { kinoko: 10, donguri: 4 }, unlock: 1, look: "axe", sp: { hit: 0.75 } },
  { id: "w_water1", type: "weapon", name: "しずくのけん", atk: 16, el: "water", price: 600, mat: { kai: 8, shizuku: 4 }, unlock: 2 },
  { id: "w_knife", type: "weapon", name: "ぎんの ナイフ", atk: 11, el: "none", price: 560, mat: { kai: 8 }, unlock: 2, look: "knife", sp: { crit: 0.3 } },
  { id: "w_leaf1", type: "weapon", name: "はっぱブーメラン", atk: 18, el: "leaf", price: 600, mat: { yogan: 8, honoo: 2 }, unlock: 3 },
  { id: "w_thunder2", type: "weapon", name: "サンダーボルト", atk: 26, el: "thunder", price: 900, mat: { kai: 6, yogan: 6, honoo: 4 }, unlock: 3 },
  { id: "w_whip", type: "weapon", name: "いばらの ムチ", atk: 19, el: "leaf", price: 900, mat: { yogan: 6, honoo: 2 }, unlock: 3, look: "whip", sp: { extra: 0.35 } },
  { id: "w_steel", type: "weapon", name: "はがねのつるぎ", atk: 22, el: "none", price: 900, mat: { yuki: 6, yogan: 6 }, unlock: 4 },
  { id: "w_leaf2", type: "weapon", name: "せいれいのゆみ", atk: 30, el: "leaf", price: 1200, mat: { yuki: 8, hyou: 4 }, unlock: 4 },
  { id: "w_fire2", type: "weapon", name: "ドラゴンフレイム", atk: 30, el: "fire", price: 1200, mat: { yogan: 8, yuki: 4, hyou: 2 }, unlock: 4 },
  { id: "w_spear", type: "weapon", name: "こおりの やり", atk: 27, el: "water", price: 1500, mat: { yuki: 8, hyou: 2 }, unlock: 4, look: "spear", sp: { stun: 0.15 } },
  { id: "w_water2", type: "weapon", name: "オーシャンブレード", atk: 32, el: "water", price: 1800, mat: { denki: 8, kaku: 4 }, unlock: 5 },
  { id: "w_vamp", type: "weapon", name: "きゅうけつの つるぎ", atk: 29, el: "none", price: 2000, mat: { denki: 6, kaku: 2 }, unlock: 5, look: "knife", sp: { drain: 0.15 } },
  { id: "w_giant", type: "weapon", name: "きょじんの たいけん", atk: 54, el: "none", price: 3600, mat: { yami: 6 }, unlock: 6, look: "axe", sp: { hit: 0.7 } },
  { id: "w_rainbow", type: "weapon", name: "にじの ブーメラン", atk: 34, el: "star", price: 4400, gem: 4, mat: { yami: 6 }, unlock: 6, sp: { multi: 0.5 } },
  { id: "w_star", type: "weapon", name: "スターロッド", atk: 46, el: "star", price: 6000, gem: 8, mat: { yami: 8 }, unlock: 6 },
  // 国の そうび（その国の そざいで つくる）
  { id: "w_k1", type: "weapon", name: "まほうの ふで", atk: 14, el: "none", price: 600, mat: { moji: 6 }, unlock: 2, look: "brush", series: "kanji", sp: { crit: 0.25 } },
  { id: "w_k2", type: "weapon", name: "きんの ふで", atk: 26, el: "fire", price: 1600, mat: { moji: 12 }, unlock: 4, look: "brush", series: "kanji", sp: { crit: 0.3 } },
  { id: "w_k3", type: "weapon", name: "でんせつの ふで", atk: 40, el: "none", price: 3600, mat: { moji: 20 }, unlock: 6, look: "brush", series: "kanji", sp: { crit: 0.35, pierce: true } },
  { id: "w_w1", type: "weapon", name: "ことだまの つえ", atk: 12, el: "leaf", price: 600, mat: { koto: 6 }, unlock: 2, series: "kotoba", sp: { gauge: 1 } },
  { id: "w_w2", type: "weapon", name: "ひびきの ハープ", atk: 24, el: "water", price: 1600, mat: { koto: 12 }, unlock: 4, look: "harp", series: "kotoba", sp: { gauge: 1, stun: 0.1 } },
  { id: "w_w3", type: "weapon", name: "ことのはの つるぎ", atk: 38, el: "thunder", price: 3600, mat: { koto: 20 }, unlock: 6, series: "kotoba", sp: { gauge: 2 } },
  { id: "w_m1", type: "weapon", name: "じょうぎ ソード", atk: 13, el: "none", price: 600, mat: { suuji: 6 }, unlock: 2, look: "ruler", series: "math", sp: { combo: true } },
  { id: "w_m2", type: "weapon", name: "コンパス ランス", atk: 24, el: "thunder", price: 1600, mat: { suuji: 12 }, unlock: 4, look: "spear", series: "math", sp: { multi: 0.35 } },
  { id: "w_m3", type: "weapon", name: "むげんの ものさし", atk: 38, el: "none", price: 3600, mat: { suuji: 20 }, unlock: 6, look: "ruler", series: "math", sp: { combo: true, exec: true } },
  { id: "w_s1", type: "weapon", name: "じしゃく ハンマー", atk: 13, el: "thunder", price: 600, mat: { kagaku: 6 }, unlock: 2, series: "sci", sp: { stun: 0.12 } },
  { id: "w_s2", type: "weapon", name: "フラスコ ボム", atk: 25, el: "fire", price: 1600, mat: { kagaku: 12 }, unlock: 4, look: "flask", series: "sci", sp: { extra: 0.4 } },
  { id: "w_s3", type: "weapon", name: "うちゅう レーザー", atk: 39, el: "none", price: 3600, mat: { kagaku: 20 }, unlock: 6, look: "spear", series: "sci", sp: { pierce: true, extra: 0.3 } },
  { id: "w_h1", type: "weapon", name: "ぶしの かたな", atk: 14, el: "none", price: 600, mat: { rekishi: 6 }, unlock: 2, look: "katana", series: "soc", sp: { first: 2 } },
  { id: "w_h2", type: "weapon", name: "しょうぐんの やり", atk: 26, el: "leaf", price: 1600, mat: { rekishi: 12 }, unlock: 4, look: "spear", series: "soc", sp: { boss: 1.5 } },
  { id: "w_h3", type: "weapon", name: "てんかの めいとう", atk: 40, el: "fire", price: 3600, mat: { rekishi: 20 }, unlock: 6, look: "katana", series: "soc", sp: { boss: 1.5, crit: 0.2 } },

  { id: "a_cloth", type: "armor", name: "ぬののふく", def: 0, price: 0, color: "#ffffff", unlock: 0 },
  { id: "a_leather", type: "armor", name: "かわのよろい", def: 4, price: 80, mat: { kinoko: 4 }, color: "#c98a4b", unlock: 0 },
  { id: "a_leaf", type: "armor", name: "はっぱのよろい", def: 6, res: "leaf", weak: "fire", price: 200, mat: { kinoko: 8 }, color: "#6ccf6a", unlock: 1 },
  { id: "a_iron", type: "armor", name: "てつのよろい", def: 9, price: 500, mat: { kai: 6 }, color: "#9fb3c8", unlock: 2 },
  { id: "a_fire", type: "armor", name: "ほのおのよろい", def: 10, res: "fire", weak: "water", price: 600, mat: { kai: 6, shizuku: 2 }, color: "#ff8a5c", unlock: 2 },
  { id: "a_spike", type: "armor", name: "トゲトゲよろい", def: 8, price: 640, mat: { kai: 6, donguri: 2 }, color: "#8d6e63", unlock: 2, sp: { reflect: 0.25 } },
  { id: "a_water", type: "armor", name: "みずのよろい", def: 13, res: "water", weak: "thunder", price: 800, mat: { yogan: 8, honoo: 2 }, color: "#5fb4ff", unlock: 3 },
  { id: "a_ninja", type: "armor", name: "しのびの ふく", def: 7, price: 800, mat: { yogan: 6 }, color: "#37474f", unlock: 3, sp: { dodge: 0.2 } },
  { id: "a_thunder", type: "armor", name: "かみなりのよろい", def: 16, res: "thunder", weak: "leaf", price: 1000, mat: { yuki: 8, hyou: 2 }, color: "#ffd54a", unlock: 4 },
  { id: "a_gold", type: "armor", name: "ゴールドアーマー", def: 18, price: 1600, mat: { yuki: 6, denki: 6 }, color: "#f5c400", unlock: 5 },
  { id: "a_angel", type: "armor", name: "てんしの はごろも", def: 14, price: 2000, mat: { denki: 8 }, color: "#fff8e1", unlock: 5, sp: { regen: 0.04 } },
  { id: "a_mirror", type: "armor", name: "かがみの よろい", def: 20, price: 3600, mat: { yami: 6 }, color: "#cfd8dc", unlock: 6, sp: { reflect: 0.4 } },
  { id: "a_star", type: "armor", name: "ほしぞらのローブ", def: 24, res: "all", price: 5000, gem: 6, mat: { yami: 8 }, color: "#6a5cff", unlock: 6 },
  { id: "a_k", type: "armor", name: "もじの はかま", def: 11, price: 1000, mat: { moji: 8 }, color: "#3949ab", unlock: 3, series: "kanji", sp: { endure: true } },
  { id: "a_w", type: "armor", name: "ことだまの マント", def: 11, price: 1000, mat: { koto: 8 }, color: "#ffb74d", unlock: 3, series: "kotoba", sp: { regen: 0.03 } },
  { id: "a_m", type: "armor", name: "すうじの よろい", def: 13, price: 1000, mat: { suuji: 8 }, color: "#4fc3f7", unlock: 3, series: "math", sp: { guard1: true } },
  { id: "a_s", type: "armor", name: "かがくの はくい", def: 10, price: 1000, mat: { kagaku: 8 }, color: "#f5f5f5", unlock: 3, series: "sci", sp: { dodge: 0.15 } },
  { id: "a_h", type: "armor", name: "ぶしの よろい", def: 15, price: 1000, mat: { rekishi: 8 }, color: "#b71c1c", unlock: 3, series: "soc", sp: { reflect: 0.2 } },

  { id: "h_none", type: "hat", name: "なし", hp: 0, price: 0, unlock: 0 },
  { id: "h_ribbon", type: "hat", name: "リボン", hp: 10, price: 100, unlock: 0 },
  { id: "h_flower", type: "hat", name: "はなかんむり", hp: 10, price: 300, mat: { kinoko: 6 }, unlock: 1, sp: { egg: 2 } },
  { id: "h_cat", type: "hat", name: "ネコみみ", hp: 15, price: 240, unlock: 1 },
  { id: "h_goggles", type: "hat", name: "たんけん ゴーグル", hp: 15, price: 600, mat: { kagaku: 4 }, unlock: 2, series: "sci", sp: { mat: 0.2 } },
  { id: "h_mortar", type: "hat", name: "がくしゃ ぼう", hp: 15, price: 600, mat: { moji: 4 }, unlock: 2, series: "kanji", sp: { hint: true } },
  { id: "h_bow", type: "hat", name: "ことばの リボン", hp: 15, price: 600, mat: { koto: 4 }, unlock: 2, series: "kotoba", sp: { coin: 0.3 } },
  { id: "h_starclip", type: "hat", name: "ほしの かみかざり", hp: 15, price: 600, mat: { suuji: 4 }, unlock: 2, series: "math", sp: { petfast: true } },
  { id: "h_wizard", type: "hat", name: "まほうのぼうし", hp: 25, price: 500, unlock: 3 },
  { id: "h_kabuto", type: "hat", name: "しょうぐんの かぶと", hp: 35, price: 1200, mat: { rekishi: 6 }, unlock: 4, series: "soc" },
  { id: "h_crown", type: "hat", name: "おうかん", hp: 40, price: 1000, gem: 3, unlock: 5 },
  { id: "h_halo", type: "hat", name: "てんしのわっか", hp: 60, price: 2400, gem: 6, unlock: 6, sp: { regen: 0.02 } },
  // ---- 見た目 重視の そうび（fun：おもしろ／かわいい／キラキラ／かっこいい） ----
  { id: "w_ladle", type: "weapon", name: "おたま", atk: 7, el: "fire", price: 150, unlock: 0, look: "ladle", fun: "おもしろ", sp: { first: 2.5 } },
  { id: "w_harisen", type: "weapon", name: "ハリセン", atk: 9, el: "none", price: 300, mat: { kinoko: 4 }, unlock: 1, look: "harisen", fun: "おもしろ", sp: { stun: 0.25 } },
  { id: "w_bread", type: "weapon", name: "フランスパン", atk: 12, el: "none", price: 500, mat: { kai: 4 }, unlock: 2, look: "bread", fun: "おもしろ", sp: { drain: 0.2 } },
  { id: "w_heart", type: "weapon", name: "ハートの ステッキ", atk: 16, el: "leaf", price: 600, mat: { kai: 3 }, unlock: 2, look: "heart", fun: "かわいい", sp: { coin: 0.3 } },
  { id: "w_tuna", type: "weapon", name: "まぐろ ソード", atk: 22, el: "water", price: 900, mat: { yogan: 4, kai: 4 }, unlock: 3, look: "tuna", fun: "おもしろ", sp: { extra: 0.3 } },
  { id: "w_starwand", type: "weapon", name: "ながれぼしの つえ", atk: 30, el: "star", price: 2000, gem: 3, mat: { yuki: 4 }, unlock: 4, look: "starwand", fun: "キラキラ" },
  { id: "w_shine", type: "weapon", name: "きらめきの つるぎ", atk: 36, el: "thunder", price: 2400, mat: { denki: 6 }, unlock: 5, look: "shine", fun: "キラキラ", sp: { crit: 0.3 } },
  { id: "a_pajama", type: "armor", name: "しましま パジャマ", def: 5, price: 300, mat: { kinoko: 4 }, unlock: 1, color: "#a0c4ff", pattern: "stripes", fun: "かわいい", sp: { regen: 0.05 } },
  { id: "a_box", type: "armor", name: "ダンボール よろい", def: 9, price: 400, mat: { kai: 4 }, unlock: 2, color: "#c49a6c", pattern: "box", fun: "おもしろ", sp: { reflect: 0.15 } },
  { id: "a_tux", type: "armor", name: "タキシード", def: 12, price: 900, mat: { yogan: 4 }, unlock: 3, color: "#263238", pattern: "tux", fun: "かっこいい", sp: { dodge: 0.12 } },
  { id: "a_dress", type: "armor", name: "フリルの ドレス", def: 12, price: 900, mat: { yogan: 4 }, unlock: 3, color: "#ffb3d1", pattern: "frill", fun: "かわいい", sp: { regen: 0.03 } },
  { id: "a_space", type: "armor", name: "うちゅうふく", def: 16, price: 1600, mat: { yuki: 5 }, unlock: 4, color: "#eceff1", pattern: "space", fun: "かっこいい", sp: { guard1: true } },
  { id: "a_shine", type: "armor", name: "きらきら スーツ", def: 20, price: 2600, gem: 2, mat: { denki: 5 }, unlock: 5, color: "#d6a8ff", pattern: "sparkle", fun: "キラキラ", sp: { dodge: 0.1, reflect: 0.1 } },
  { id: "h_party", type: "hat", name: "パーティー ぼうし", hp: 10, price: 200, unlock: 0, fun: "おもしろ", sp: { coin: 0.2 } },
  { id: "h_chonmage", type: "hat", name: "ちょんまげ", hp: 15, price: 250, unlock: 1, fun: "おもしろ" },
  { id: "h_bunny", type: "hat", name: "うさみみ", hp: 18, price: 400, unlock: 2, fun: "かわいい", sp: { petfast: true } },
  { id: "h_glasses", type: "hat", name: "サングラス", hp: 15, price: 400, unlock: 2, fun: "かっこいい", sp: { mat: 0.15 } },
  { id: "h_afro", type: "hat", name: "アフロ", hp: 25, price: 700, unlock: 3, fun: "おもしろ", sp: { egg: 2 } },
  { id: "h_pumpkin", type: "hat", name: "かぼちゃ ぼうし", hp: 30, price: 1000, unlock: 4, fun: "かわいい" },
  { id: "h_helmet", type: "hat", name: "うちゅう ヘルメット", hp: 40, price: 1600, unlock: 5, fun: "かっこいい" },
  { id: "h_tiara", type: "hat", name: "きらきら ティアラ", hp: 45, price: 1800, gem: 2, unlock: 5, fun: "キラキラ", sp: { regen: 0.02 } },
];

// --- 毎日ミッション ---
const MISSIONS = [
  { id: "correct10", text: "問題に10回せいかいする", goal: 10, reward: { coin: 40 } },
  { id: "nigate1", text: "ニガテモンスターを1体たおす", goal: 1, reward: { gem: 1 } },
  { id: "starup3", text: "カードの★を3つアップする", goal: 3, reward: { coin: 50 } },
];

// --- なかま（タマゴからうまれる動物・モンスター） ---
// r: レア度（0 ノーマル / 1 レア / 2 スーパーレア / 3 レジェンド）
// ab: とくいわざの種類, pow: わざの強さ, cd: わざを使うまでに必要な正解の数
// fusion: かけあわせでしか生まれないなかま
const PETS = [
  { id: "pyomaru", name: "ピヨまる", em: "🐥", el: "none", r: 0, ab: "heal", pow: 15, cd: 3, waza: "ピヨピヨのうた" },
  { id: "nyanta", name: "ニャンタ", em: "🐱", el: "none", r: 0, ab: "attack", pow: 0.8, cd: 3, waza: "ねこパンチ" },
  { id: "wanta", name: "ワンタ", em: "🐶", el: "none", r: 0, ab: "atkup", pow: 0.3, cd: 3, waza: "がんばれワンワン" },
  { id: "pyonkichi", name: "ピョンキチ", em: "🐰", el: "leaf", r: 0, ab: "coin", pow: 6, cd: 2, waza: "コインさがし" },
  { id: "kamessy", name: "カメッシー", em: "🐢", el: "water", r: 0, ab: "shield", pow: 0.5, cd: 4, waza: "こうらガード" },
  { id: "kerosuke", name: "ケロスケ", em: "🐸", el: "water", r: 0, ab: "attack", pow: 0.8, cd: 3, waza: "みずでっぽう" },
  { id: "nezumin", name: "ネズミン", em: "🐭", el: "thunder", r: 0, ab: "mat", pow: 1, cd: 4, waza: "そざい さがし" },
  { id: "butappi", name: "ブタッピ", em: "🐷", el: "none", r: 0, ab: "egg", pow: 3, cd: 3, waza: "ぬくぬく タマゴあたため" },
  { id: "hachimitsu", name: "ハチミツ", em: "🐝", el: "leaf", r: 0, ab: "poison", pow: 0.3, cd: 3, waza: "チクチクばり" },
  { id: "konta", name: "コンタ", em: "🦊", el: "fire", r: 1, ab: "attack", pow: 1.5, cd: 3, waza: "きつねび" },
  { id: "kumagoro", name: "クマゴロー", em: "🐻", el: "none", r: 1, ab: "shield", pow: 1, cd: 5, waza: "どっしりガード" },
  { id: "hoho", name: "ホーホー", em: "🦉", el: "thunder", r: 1, ab: "hint", pow: 1, cd: 3, waza: "ちえのささやき" },
  { id: "pandan", name: "パンダン", em: "🐼", el: "leaf", r: 1, ab: "heal", pow: 25, cd: 4, waza: "ささのはヒール" },
  { id: "takorin", name: "タコリン", em: "🐙", el: "water", r: 1, ab: "stun", pow: 1, cd: 5, waza: "すみはき" },
  { id: "penta", name: "ペンタ", em: "🐧", el: "water", r: 1, ab: "gauge", pow: 2, cd: 3, waza: "ペンギンダンス" },
  { id: "saruta", name: "サルタ", em: "🐵", el: "leaf", r: 1, ab: "combo", pow: 3, cd: 3, waza: "ウキウキ おうえん" },
  { id: "hebinu", name: "ヘビーヌ", em: "🐍", el: "leaf", r: 1, ab: "poison", pow: 0.5, cd: 4, waza: "どくの きば" },
  { id: "koumori", name: "コウモリン", em: "🦇", el: "none", r: 1, ab: "drain", pow: 1.2, cd: 4, waza: "きゅうけつ アタック" },
  { id: "gaou", name: "ガオウ", em: "🦁", el: "fire", r: 2, ab: "atkup", pow: 0.8, cd: 4, waza: "ライオンのほえごえ" },
  { id: "yuniko", name: "ユニコ", em: "🦄", el: "star", r: 2, ab: "heal", pow: 40, cd: 4, waza: "にじいろヒール" },
  { id: "draco", name: "ドラコ", em: "🐲", el: "fire", r: 2, ab: "attack", pow: 2.5, cd: 4, waza: "ドラゴンブレス" },
  { id: "birihamu", name: "ビリハム", em: "🐹", el: "thunder", r: 2, ab: "stun", pow: 1, cd: 4, waza: "しびれほっぺ" },
  { id: "ookami", name: "オオカミン", em: "🐺", el: "thunder", r: 2, ab: "multi", pow: 0.9, cd: 4, waza: "れんぞく かみつき" },
  { id: "kujaku", name: "クジャクイン", em: "🦚", el: "star", r: 2, ab: "revive", pow: 50, cd: 1, waza: "ふっかつの はね" },
  // ここから下は かけあわせ でしか生まれない
  { id: "toramaru", name: "トラマル", em: "🐯", el: "fire", r: 1, ab: "attack", pow: 1.8, cd: 3, waza: "タイガークロー", fusion: true },
  { id: "kujiran", name: "クジラン", em: "🐳", el: "water", r: 1, ab: "heal", pow: 35, cd: 4, waza: "しおふきシャワー", fusion: true },
  { id: "washitaka", name: "ワシタカ", em: "🦅", el: "thunder", r: 1, ab: "attack", pow: 1.8, cd: 3, waza: "いなずまダイブ", fusion: true },
  { id: "goriran", name: "ゴリラン", em: "🦍", el: "none", r: 1, ab: "atkup", pow: 0.6, cd: 3, waza: "ドラミング", fusion: true },
  { id: "tokagen", name: "トカゲン", em: "🦎", el: "leaf", r: 1, ab: "stun", pow: 1, cd: 4, waza: "かくれんぼ", fusion: true },
  { id: "koaran", name: "コアラン", em: "🐨", el: "leaf", r: 1, ab: "coin", pow: 15, cd: 2, waza: "おたからハンター", fusion: true },
  { id: "niwatori", name: "ニワトリン", em: "🐔", el: "fire", r: 1, ab: "egg", pow: 6, cd: 3, waza: "コケコッコー あたため", fusion: true },
  { id: "ushimo", name: "ウシモー", em: "🐮", el: "none", r: 1, ab: "barrier", pow: 2, cd: 5, waza: "モーモー バリア", fusion: true },
  { id: "umataro", name: "ウマタロ", em: "🐴", el: "thunder", r: 1, ab: "gauge", pow: 3, cd: 3, waza: "いなずま ダッシュ", fusion: true },
  { id: "hitsujin", name: "ヒツジン", em: "🐑", el: "none", r: 1, ab: "stun", pow: 1, cd: 4, waza: "ねむりの うた", fusion: true },
  { id: "ahirun", name: "アヒルン", em: "🦆", el: "water", r: 1, ab: "coin", pow: 12, cd: 2, waza: "ガアガア コインひろい", fusion: true },
  { id: "kanikani", name: "カニカニ", em: "🦀", el: "water", r: 1, ab: "reflect", pow: 0.8, cd: 4, waza: "はさみ カウンター", fusion: true },
  { id: "yamaarashi", name: "ハリネズン", em: "🦔", el: "leaf", r: 1, ab: "reflect", pow: 1, cd: 4, waza: "トゲトゲ カウンター", fusion: true },
  { id: "chocho", name: "チョウチョ", em: "🦋", el: "leaf", r: 1, ab: "heal", pow: 30, cd: 3, waza: "りんぷん ヒール", fusion: true },
  { id: "sukanku", name: "スカンクン", em: "🦨", el: "none", r: 1, ab: "poison", pow: 0.7, cd: 4, waza: "くさい ガス", fusion: true },
  { id: "kabao", name: "カバオ", em: "🦛", el: "water", r: 1, ab: "barrier", pow: 3, cd: 5, waza: "どっしり バリア", fusion: true },
  { id: "sameddo", name: "サメッド", em: "🦈", el: "water", r: 2, ab: "attack", pow: 2.6, cd: 4, waza: "シャークバイト", fusion: true },
  { id: "sasorin", name: "サソリン", em: "🦂", el: "fire", r: 2, ab: "poison", pow: 1.1, cd: 4, waza: "もうどくの しっぽ", fusion: true },
  { id: "wanio", name: "ワニオ", em: "🐊", el: "leaf", r: 2, ab: "drain", pow: 1.8, cd: 4, waza: "ワニワニ かぶりつき", fusion: true },
  { id: "manmos", name: "マンモス", em: "🦣", el: "none", r: 2, ab: "atkup", pow: 1.0, cd: 4, waza: "こおりの ほうこう", fusion: true },
  { id: "zouzou", name: "ゾウゾウ", em: "🐘", el: "water", r: 2, ab: "barrier", pow: 3, cd: 4, waza: "はなみず シャワー", fusion: true },
  { id: "kirin", name: "キリリン", em: "🦒", el: "leaf", r: 2, ab: "critnext", pow: 1, cd: 3, waza: "たかみの けんぶつ", fusion: true },
  { id: "yukihyo", name: "ユキヒョウ", em: "🐆", el: "water", r: 2, ab: "multi", pow: 1.3, cd: 4, waza: "ゆきの れんげき", fusion: true },
  { id: "flamingo", name: "フラミンゴ", em: "🦩", el: "fire", r: 2, ab: "revive", pow: 70, cd: 1, waza: "ほのおの ふっかつ", fusion: true },
  { id: "tiranon", name: "ティラノン", em: "🦖", el: "fire", r: 2, ab: "attack", pow: 3.2, cd: 4, waza: "ダイナソーバイト", fusion: true },
  { id: "stego", name: "ステゴン", em: "🦕", el: "leaf", r: 2, ab: "barrier", pow: 4, cd: 4, waza: "こうらの とりで", fusion: true },
  { id: "dodo", name: "ドードー", em: "🦤", el: "none", r: 2, ab: "chgel", pow: 1, cd: 5, waza: "ふしぎな まほう", fusion: true },
  { id: "orca", name: "オルカン", em: "🐋", el: "water", r: 3, ab: "multi", pow: 1.8, cd: 4, waza: "だいかいしょう", fusion: true },
  { id: "ryuou", name: "リュウオウ", em: "🐉", el: "star", r: 3, ab: "attack", pow: 4.5, cd: 4, waza: "てんくうのいかずち", fusion: true },
];

// かけあわせのレシピ（順番は関係なし）。かけあわせで うまれた なかまどうしも かけあわせられる
const RECIPES = [
  [["nyanta", "konta"], "toramaru"],
  [["kamessy", "takorin"], "kujiran"],
  [["pyomaru", "hoho"], "washitaka"],
  [["wanta", "kumagoro"], "goriran"],
  [["kerosuke", "pandan"], "tokagen"],
  [["pyonkichi", "penta"], "koaran"],
  [["pyomaru", "butappi"], "niwatori"],
  [["butappi", "wanta"], "ushimo"],
  [["pyonkichi", "nezumin"], "umataro"],
  [["nyanta", "pyomaru"], "hitsujin"],
  [["pyomaru", "kerosuke"], "ahirun"],
  [["kamessy", "kerosuke"], "kanikani"],
  [["nezumin", "kumagoro"], "yamaarashi"],
  [["hachimitsu", "pyonkichi"], "chocho"],
  [["nezumin", "hebinu"], "sukanku"],
  [["butappi", "kujiran"], "kabao"],
  [["takorin", "kerosuke"], "sameddo"],
  [["hachimitsu", "kanikani"], "sasorin"],
  [["tokagen", "kamessy"], "wanio"],
  [["kumagoro", "goriran"], "manmos"],
  [["ushimo", "kumagoro"], "zouzou"],
  [["umataro", "hebinu"], "kirin"],
  [["toramaru", "ookami"], "yukihyo"],
  [["ahirun", "kujaku"], "flamingo"],
  [["kumagoro", "draco"], "tiranon"],
  [["tiranon", "kamessy"], "stego"],
  [["ahirun", "niwatori"], "dodo"],
  [["sameddo", "kujiran"], "orca"],
  [["draco", "gaou"], "ryuou"],
];

// レア度ごとの情報（need: かえるまでに必要な正解の数）
const RARITY = [
  { name: "ノーマル", stars: "★", need: 20, egg: ["#ffffff", "#ffb3d1"] },
  { name: "レア", stars: "★★", need: 35, egg: ["#d6ecff", "#4aa8ff"] },
  { name: "スーパーレア", stars: "★★★", need: 55, egg: ["#fff3b0", "#ffb800"] },
  { name: "レジェンド", stars: "★★★★", need: 80, egg: ["#f3e0ff", "#c77dff"] },
];

// とくいわざの説明（pow は レベルで強くなる）
const ABILITY = {
  heal: { icon: "💚", name: "かいふく", desc: (p) => `たいりょくを ${p}% かいふく` },
  attack: { icon: "💥", name: "こうげき", desc: (p) => `てきに こうげき（つよさ ${Math.round(p * 100)}%）` },
  multi: { icon: "⚡", name: "れんぞく", desc: (p) => `3回 れんぞくで こうげき（1回 ${Math.round(p * 40)}%）` },
  drain: { icon: "🩸", name: "きゅうしゅう", desc: (p) => `こうげき（${Math.round(p * 100)}%）して その半分 かいふく` },
  poison: { icon: "☠️", name: "どく", desc: (p) => `てきを どくに する（3回 ${Math.round(p * 100)}%の ダメージ）` },
  atkup: { icon: "💪", name: "パワーアップ", desc: (p) => `つぎの 2回の こうげきが ${Math.round(p * 100)}% アップ` },
  critnext: { icon: "🎯", name: "ひっちゅう", desc: () => "つぎの こうげきが かならず かいしん（2ばい）" },
  combo: { icon: "🔥", name: "コンボ", desc: (p) => `コンボを ${p} ふやす` },
  coin: { icon: "🪙", name: "コイン", desc: (p) => `コインを ${p}まい ひろってくる` },
  mat: { icon: "🧺", name: "そざい", desc: () => "ステージの そざいを 1つ 見つけてくる" },
  egg: { icon: "🥚", name: "タマゴ", desc: (p) => `タマゴを ${p}問ぶん そだてる` },
  shield: { icon: "🛡️", name: "ガード", desc: (p) => (p >= 1 ? "てきの こうげきを 1回 ふせぐ" : `てきの こうげきを ${Math.round(p * 100)}% へらす`) },
  barrier: { icon: "🔰", name: "バリア", desc: (p) => `てきの こうげき ${p}回ぶんを 半分にする` },
  reflect: { icon: "🪞", name: "カウンター", desc: (p) => `つぎの てきの こうげきの ${Math.round(p * 100)}% を はね返す` },
  stun: { icon: "💫", name: "ストップ", desc: () => "てきの うごきを 1ターン とめる" },
  hint: { icon: "💡", name: "ヒント", desc: () => "まちがいの 答えを 1つ けしてくれる" },
  gauge: { icon: "✨", name: "ゲージ", desc: (p) => `ひっさつゲージを ${p} ためる` },
  revive: { icon: "🪶", name: "ふっかつ", desc: (p) => `たおれたとき 1回だけ ${p}% で ふっかつ（いつでも）` },
  chgel: { icon: "🔄", name: "ぞくせいチェンジ", desc: () => "てきの ぞくせいを、いまの ぶきが ばつぐんに なる ぞくせいに かえる" },
};

// --- かけあわせの ヒントに 使う「なかまの ようす」 ---
const TRAIT = {
  pyomaru: "小さな ひよこ", nyanta: "ねこの なかま", wanta: "いぬの なかま", pyonkichi: "ぴょんぴょん はねる 子",
  kamessy: "こうらの ある 子", kerosuke: "みずべで ケロケロ なく 子", nezumin: "ちいさな ネズミ", butappi: "まるい ぶた",
  hachimitsu: "花の みつが すきな 虫", konta: "ほのおの けもの", kumagoro: "力もちの 子", hoho: "もの知りな とり",
  pandan: "ささが だいすきな 子", takorin: "あしが たくさん ある 子", penta: "さむい 国の とり", saruta: "木のぼり 上手",
  hebinu: "にょろにょろ した 子", koumori: "よるの 空の 子", gaou: "百じゅうの 王", yuniko: "つのの ある 子",
  draco: "りゅうの 子ども", birihamu: "ほっぺが ビリビリ する 子", ookami: "とおぼえ する 子", kujaku: "きれいな はねの とり",
  toramaru: "しまもようの けもの", kujiran: "うみの 大きな 子", washitaka: "空の ハンター", goriran: "むねを たたく 子",
  tokagen: "かくれんぼ 上手", koaran: "木に しがみつく 子", niwatori: "あさ はやく なく とり", ushimo: "もうもう なく 子",
  umataro: "はしるのが はやい 子", hitsujin: "もこもこの 子", ahirun: "ガアガア なく 子", kanikani: "はさみを もつ 子",
  yamaarashi: "トゲトゲの 子", chocho: "ひらひら とぶ 子", sukanku: "くさい においの 子", kabao: "大きな 口の 子",
  sameddo: "うみの ハンター", sasorin: "どくの しっぽの 子", wanio: "大きな 口の ハンター", manmos: "大むかしの けもの",
  zouzou: "はなが ながい 子", kirin: "首が ながい 子", yukihyo: "ゆきの けもの", flamingo: "かた足で 立つ とり",
  tiranon: "きょうりゅう", stego: "せなかに いたの ある きょうりゅう", dodo: "まぼろしの とり", orca: "うみの 王",
  ryuou: "でんせつの りゅう",
};
// ヒントを 出さない「ひみつの くみあわせ」
const SECRET_RECIPES = ["yukihyo", "flamingo", "stego", "dodo", "orca", "ryuou"];
