// ===== ぷにまるクエスト：学習データ・ゲームデータ =====

// --- 6年生の漢字（試作版：50字） ---
// k: 漢字, w: [[ことば, よみ], ...], sim: 形のにている漢字（書きの問題のまちがい選択肢）
const KANJI = [
  { k: "宇", w: [["宇宙", "うちゅう"], ["宇宙人", "うちゅうじん"]], sim: ["字", "守", "宅"] },
  { k: "宙", w: [["宙返り", "ちゅうがえり"], ["宇宙", "うちゅう"]], sim: ["宝", "宇", "宮"] },
  { k: "机", w: [["机", "つくえ"], ["勉強机", "べんきょうづくえ"]], sim: ["札", "材", "林"] },
  { k: "卵", w: [["卵", "たまご"], ["卵黄", "らんおう"]], sim: ["乳", "印", "危"] },
  { k: "乳", w: [["牛乳", "ぎゅうにゅう"], ["乳歯", "にゅうし"]], sim: ["礼", "乱", "卵"] },
  { k: "骨", w: [["骨", "ほね"], ["骨折", "こっせつ"]], sim: ["背", "滑", "胃"] },
  { k: "胸", w: [["胸", "むね"], ["度胸", "どきょう"]], sim: ["脳", "腸", "肺"] },
  { k: "脳", w: [["頭脳", "ずのう"], ["脳", "のう"]], sim: ["悩", "胸", "肺"] },
  { k: "腸", w: [["胃腸", "いちょう"], ["大腸", "だいちょう"]], sim: ["場", "湯", "腹"] },
  { k: "肺", w: [["肺", "はい"], ["肺活量", "はいかつりょう"]], sim: ["市", "姉", "背"] },
  { k: "背", w: [["背中", "せなか"], ["背景", "はいけい"]], sim: ["骨", "北", "育"] },
  { k: "腹", w: [["腹", "はら"], ["空腹", "くうふく"]], sim: ["復", "複", "腸"] },
  { k: "泉", w: [["泉", "いずみ"], ["温泉", "おんせん"]], sim: ["原", "皇", "線"] },
  { k: "洗", w: [["洗う", "あらう"], ["洗面器", "せんめんき"]], sim: ["先", "流", "泳"] },
  { k: "潮", w: [["潮", "しお"], ["満潮", "まんちょう"]], sim: ["朝", "湖", "測"] },
  { k: "砂", w: [["砂", "すな"], ["砂場", "すなば"]], sim: ["秒", "石", "妙"] },
  { k: "糖", w: [["砂糖", "さとう"], ["糖分", "とうぶん"]], sim: ["精", "粉", "康"] },
  { k: "暖", w: [["暖かい", "あたたかい"], ["暖房", "だんぼう"]], sim: ["温", "援", "晴"] },
  { k: "窓", w: [["窓", "まど"], ["窓口", "まどぐち"]], sim: ["空", "究", "穴"] },
  { k: "穴", w: [["穴", "あな"], ["落とし穴", "おとしあな"]], sim: ["六", "空", "突"] },
  { k: "宝", w: [["宝", "たから"], ["宝石", "ほうせき"]], sim: ["玉", "宇", "室"] },
  { k: "磁", w: [["磁石", "じしゃく"], ["磁力", "じりょく"]], sim: ["滋", "慈", "誌"] },
  { k: "鋼", w: [["鉄鋼", "てっこう"], ["鋼", "はがね"]], sim: ["銅", "網", "鉄"] },
  { k: "劇", w: [["劇", "げき"], ["演劇", "えんげき"]], sim: ["刻", "激", "割"] },
  { k: "激", w: [["激しい", "はげしい"], ["感激", "かんげき"]], sim: ["劇", "放", "救"] },
  { k: "敵", w: [["敵", "てき"], ["強敵", "きょうてき"]], sim: ["適", "滴", "散"] },
  { k: "奮", w: [["興奮", "こうふん"], ["奮い立つ", "ふるいたつ"]], sim: ["奪", "奏", "番"] },
  { k: "勤", w: [["出勤", "しゅっきん"], ["勤める", "つとめる"]], sim: ["動", "勧", "難"] },
  { k: "届", w: [["届ける", "とどける"], ["届く", "とどく"]], sim: ["屈", "居", "局"] },
  { k: "忘", w: [["忘れる", "わすれる"], ["忘れ物", "わすれもの"]], sim: ["忙", "亡", "志"] },
  { k: "探", w: [["探す", "さがす"], ["探検", "たんけん"]], sim: ["深", "採", "授"] },
  { k: "誕", w: [["誕生日", "たんじょうび"], ["誕生", "たんじょう"]], sim: ["延", "証", "認"] },
  { k: "拝", w: [["拝む", "おがむ"], ["参拝", "さんぱい"]], sim: ["拍", "持", "押"] },
  { k: "将", w: [["将来", "しょうらい"], ["将棋", "しょうぎ"]], sim: ["状", "特", "荘"] },
  { k: "装", w: [["装備", "そうび"], ["服装", "ふくそう"]], sim: ["製", "衣", "荘"] },
  { k: "層", w: [["地層", "ちそう"], ["高層", "こうそう"]], sim: ["増", "僧", "届"] },
  { k: "盛", w: [["盛る", "もる"], ["大盛り", "おおもり"]], sim: ["成", "感", "城"] },
  { k: "操", w: [["体操", "たいそう"], ["操縦", "そうじゅう"]], sim: ["繰", "燥", "探"] },
  { k: "縦", w: [["縦", "たて"], ["縦書き", "たてがき"]], sim: ["従", "線", "総"] },
  { k: "樹", w: [["樹木", "じゅもく"], ["果樹園", "かじゅえん"]], sim: ["森", "株", "横"] },
  { k: "秘", w: [["秘密", "ひみつ"], ["神秘", "しんぴ"]], sim: ["必", "私", "秒"] },
  { k: "密", w: [["秘密", "ひみつ"], ["密林", "みつりん"]], sim: ["蜜", "宮", "宿"] },
  { k: "幕", w: [["開幕", "かいまく"], ["幕府", "ばくふ"]], sim: ["墓", "暮", "募"] },
  { k: "晩", w: [["今晩", "こんばん"], ["晩ご飯", "ばんごはん"]], sim: ["勉", "晴", "暖"] },
  { k: "優", w: [["優しい", "やさしい"], ["優勝", "ゆうしょう"]], sim: ["億", "像", "夏"] },
  { k: "若", w: [["若い", "わかい"], ["若者", "わかもの"]], sim: ["苦", "右", "菜"] },
  { k: "呼", w: [["呼ぶ", "よぶ"], ["呼吸", "こきゅう"]], sim: ["吸", "平", "叫"] },
  { k: "吸", w: [["吸う", "すう"], ["呼吸", "こきゅう"]], sim: ["呼", "級", "及"] },
  { k: "痛", w: [["痛い", "いたい"], ["頭痛", "ずつう"]], sim: ["通", "病", "疲"] },
  { k: "危", w: [["危ない", "あぶない"], ["危険", "きけん"]], sim: ["色", "角", "仮"] },
];

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
    gen() { const d = ri(2, 12); return { q: `直径 ${d}cm の円の、円周の長さは？`, a: r2(d * 3.14), unit: "cm", ng: [r2(d * 2 * 3.14), r2(d * d * 3.14), r2(d + 3.14)] }; },
  },
  {
    id: "enmen", name: "円の面積", ans: "半径 × 半径 × 3.14", ng: ["半径 × 2 × 3.14", "直径 × 直径 × 3.14", "半径 × 3.14"],
    skill: "サークルバスター",
    gen() { const r = ri(2, 10); return { q: `半径 ${r}cm の円の面積は？`, a: r2(r * r * 3.14), unit: "cm²", ng: [r2(r * 2 * 3.14), r2(r * 2 * r * 2 * 3.14), r2(r * 3.14)] }; },
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
};

// --- ショップのアイテム ---
// type: weapon / armor / hat, atk: こうげき, def: ぼうぎょ, hp: たいりょく, el: 属性
// res: この属性の こうげきを 半分にする, weak: この属性の こうげきを 1.5ばい うける
// price: コイン, mat: ひつような そざい, gem: ほうせき
// unlock: このステージをクリアするとショップに並ぶ（0 は最初から）
const ITEMS = [
  { id: "w_stick", type: "weapon", name: "きのぼう", atk: 3, el: "none", price: 0, unlock: 0 },
  { id: "w_fire1", type: "weapon", name: "ほのおのつえ", atk: 8, el: "fire", price: 60, mat: { kinoko: 3 }, unlock: 0 },
  { id: "w_hammer", type: "weapon", name: "いしのハンマー", atk: 10, el: "none", price: 120, mat: { kinoko: 4, donguri: 1 }, unlock: 1 },
  { id: "w_thunder1", type: "weapon", name: "いなずまハンマー", atk: 12, el: "thunder", price: 150, mat: { kinoko: 2, donguri: 2 }, unlock: 1 },
  { id: "w_water1", type: "weapon", name: "しずくのけん", atk: 16, el: "water", price: 300, mat: { kai: 4, shizuku: 2 }, unlock: 2 },
  { id: "w_leaf1", type: "weapon", name: "はっぱブーメラン", atk: 18, el: "leaf", price: 300, mat: { yogan: 4, honoo: 1 }, unlock: 3 },
  { id: "w_thunder2", type: "weapon", name: "サンダーボルト", atk: 26, el: "thunder", price: 450, mat: { kai: 3, yogan: 3, honoo: 2 }, unlock: 3 },
  { id: "w_steel", type: "weapon", name: "はがねのつるぎ", atk: 22, el: "none", price: 450, mat: { yuki: 3, yogan: 3 }, unlock: 4 },
  { id: "w_leaf2", type: "weapon", name: "せいれいのゆみ", atk: 30, el: "leaf", price: 600, mat: { yuki: 4, hyou: 2 }, unlock: 4 },
  { id: "w_fire2", type: "weapon", name: "ドラゴンフレイム", atk: 30, el: "fire", price: 600, mat: { yogan: 4, yuki: 2, hyou: 1 }, unlock: 4 },
  { id: "w_water2", type: "weapon", name: "オーシャンブレード", atk: 32, el: "water", price: 900, mat: { denki: 4, kaku: 2 }, unlock: 5 },
  { id: "w_star", type: "weapon", name: "スターロッド", atk: 46, el: "star", price: 3000, gem: 8, mat: { yami: 4 }, unlock: 6 },

  { id: "a_cloth", type: "armor", name: "ぬののふく", def: 0, price: 0, color: "#ffffff", unlock: 0 },
  { id: "a_leather", type: "armor", name: "かわのよろい", def: 4, price: 40, mat: { kinoko: 2 }, color: "#c98a4b", unlock: 0 },
  { id: "a_leaf", type: "armor", name: "はっぱのよろい", def: 6, res: "leaf", weak: "fire", price: 100, mat: { kinoko: 4 }, color: "#6ccf6a", unlock: 1 },
  { id: "a_iron", type: "armor", name: "てつのよろい", def: 9, price: 250, mat: { kai: 3 }, color: "#9fb3c8", unlock: 2 },
  { id: "a_fire", type: "armor", name: "ほのおのよろい", def: 10, res: "fire", weak: "water", price: 300, mat: { kai: 3, shizuku: 1 }, color: "#ff8a5c", unlock: 2 },
  { id: "a_water", type: "armor", name: "みずのよろい", def: 13, res: "water", weak: "thunder", price: 400, mat: { yogan: 4, honoo: 1 }, color: "#5fb4ff", unlock: 3 },
  { id: "a_thunder", type: "armor", name: "かみなりのよろい", def: 16, res: "thunder", weak: "leaf", price: 500, mat: { yuki: 4, hyou: 1 }, color: "#ffd54a", unlock: 4 },
  { id: "a_gold", type: "armor", name: "ゴールドアーマー", def: 18, price: 800, mat: { yuki: 3, denki: 3 }, color: "#f5c400", unlock: 5 },
  { id: "a_star", type: "armor", name: "ほしぞらのローブ", def: 24, res: "all", price: 2500, gem: 6, mat: { yami: 4 }, color: "#6a5cff", unlock: 6 },

  { id: "h_none", type: "hat", name: "なし", hp: 0, price: 0, unlock: 0 },
  { id: "h_ribbon", type: "hat", name: "リボン", hp: 10, price: 50, unlock: 0 },
  { id: "h_cat", type: "hat", name: "ネコみみ", hp: 15, price: 120, unlock: 1 },
  { id: "h_wizard", type: "hat", name: "まほうのぼうし", hp: 25, price: 250, unlock: 3 },
  { id: "h_crown", type: "hat", name: "おうかん", hp: 40, price: 500, gem: 3, unlock: 5 },
  { id: "h_halo", type: "hat", name: "てんしのわっか", hp: 60, price: 1200, gem: 6, unlock: 6 },
];

// --- ステージ（ワールド6） ---
// kanji: 出題する漢字の範囲, fo: 出題する公式の範囲, mix: 公式問題が出る確率
// mat / bmat: ふつうの敵 / ボスが おとす そざい
// 敵 n: 名前, hp: 体力, atk: こうげき力, el: 属性（rand なら els から ランダム）, imm: きかない属性
//    phases: ラスボスの 属性の うつりかわり
const STAGES = [
  {
    id: 1, name: "ふわふわの森", bg: ["#c8f7c5", "#7fd88a"], kanji: [0, 12], fo: [2, 4], mix: 0.25, mat: "kinoko", bmat: "donguri",
    enemies: [
      { n: "スライモン", hp: 40, atk: 7, el: "leaf", shape: "blob", color: "#7ad36b" },
      { n: "コロコロイシ", hp: 50, atk: 8, el: "none", shape: "rock", color: "#a1887f" },
      { n: "キノコロ", hp: 45, atk: 7, el: "leaf", shape: "mush", color: "#e86a6a" },
      { n: "もりのヌシ", hp: 130, atk: 11, el: "leaf", shape: "blob", color: "#3fa34d", boss: true },
    ],
  },
  {
    id: 2, name: "しおかぜビーチ", bg: ["#bfe9ff", "#ffe9a8"], kanji: [10, 22], fo: [0, 3], mix: 0.3, mat: "kai", bmat: "shizuku",
    enemies: [
      { n: "カニッチ", hp: 90, atk: 14, el: "water", shape: "crab", color: "#ff7f6e" },
      { n: "ヤシノミン", hp: 85, atk: 13, el: "leaf", shape: "mush", color: "#8bc34a" },
      { n: "クラゲン", hp: 95, atk: 14, el: "water", shape: "ghost", color: "#9ad0ff" },
      { n: "うみのヌシ", hp: 260, atk: 19, el: "water", shape: "blob", color: "#2f7fd8", boss: true },
    ],
  },
  {
    id: 3, name: "メラメラ火山", bg: ["#ffd0b0", "#ff8a65"], kanji: [20, 32], fo: [6, 9], mix: 0.3, mat: "yogan", bmat: "honoo",
    enemies: [
      { n: "ヒノコン", hp: 150, atk: 21, el: "fire", shape: "ghost", color: "#ff8c42" },
      { n: "まぼろしスライム", hp: 150, atk: 21, el: "rand", els: ["fire", "water", "leaf"], shape: "blob", color: "#b388ff" },
      { n: "マグマル", hp: 165, atk: 22, el: "fire", shape: "blob", color: "#d84315" },
      { n: "かざんのヌシ", hp: 420, atk: 27, el: "fire", imm: "thunder", shape: "rock", color: "#8d3a1f", boss: true },
    ],
  },
  {
    id: 4, name: "カチコチ雪山", bg: ["#eef7ff", "#b8d8f5"], kanji: [30, 42], fo: [8, 12], mix: 0.35, mat: "yuki", bmat: "hyou",
    enemies: [
      { n: "ユキダマン", hp: 220, atk: 28, el: "water", shape: "blob", color: "#e8f4ff" },
      { n: "ビリユキ", hp: 220, atk: 29, el: "thunder", shape: "ghost", color: "#fff59d" },
      { n: "ツララン", hp: 235, atk: 29, el: "water", shape: "rock", color: "#8fd3ff" },
      { n: "こおりのヌシ", hp: 580, atk: 35, el: "water", shape: "ghost", color: "#5aa9e6", boss: true },
    ],
  },
  {
    id: 5, name: "ゴロゴロの塔", bg: ["#e6dcff", "#9f8cff"], kanji: [38, 50], fo: [11, 16], mix: 0.4, mat: "denki", bmat: "kaku",
    enemies: [
      { n: "ビリビリン", hp: 300, atk: 36, el: "thunder", shape: "ghost", color: "#ffe066" },
      { n: "まぼろしスライム", hp: 300, atk: 36, el: "rand", els: ["fire", "water", "thunder", "leaf"], shape: "blob", color: "#b388ff" },
      { n: "まほうゴーレム", hp: 320, atk: 37, el: "thunder", imm: "none", shape: "rock", color: "#f2b705" },
      { n: "かみなりのヌシ", hp: 760, atk: 43, el: "thunder", shape: "blob", color: "#b58900", boss: true },
    ],
  },
  {
    id: 6, name: "ラスボスの城", bg: ["#3a2a5c", "#1d1433"], kanji: [0, 50], fo: [0, 16], mix: 0.4, final: true, mat: "yami", bmat: "yami",
    enemies: [
      { n: "やみのしもべ", hp: 380, atk: 41, el: "rand", els: ["fire", "water", "thunder", "leaf"], shape: "ghost", color: "#7e57c2" },
      { n: "やみのしもべ", hp: 380, atk: 41, el: "rand", els: ["fire", "water", "thunder", "leaf"], shape: "rock", color: "#5e35b1" },
      // ラスボスは 体力が へるたびに 属性が かわる
      { n: "ダーク・ドンドロス", hp: 1250, atk: 46, el: "water", phases: ["water", "leaf", "fire"], shape: "boss", color: "#5b3d8f", boss: true },
    ],
  },
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
  { id: "konta", name: "コンタ", em: "🦊", el: "fire", r: 1, ab: "attack", pow: 1.5, cd: 3, waza: "きつねび" },
  { id: "kumagoro", name: "クマゴロー", em: "🐻", el: "none", r: 1, ab: "shield", pow: 1, cd: 5, waza: "どっしりガード" },
  { id: "hoho", name: "ホーホー", em: "🦉", el: "thunder", r: 1, ab: "hint", pow: 1, cd: 3, waza: "ちえのささやき" },
  { id: "pandan", name: "パンダン", em: "🐼", el: "leaf", r: 1, ab: "heal", pow: 25, cd: 4, waza: "ささのはヒール" },
  { id: "takorin", name: "タコリン", em: "🐙", el: "water", r: 1, ab: "stun", pow: 1, cd: 5, waza: "すみはき" },
  { id: "penta", name: "ペンタ", em: "🐧", el: "water", r: 1, ab: "gauge", pow: 2, cd: 3, waza: "ペンギンダンス" },
  { id: "gaou", name: "ガオウ", em: "🦁", el: "fire", r: 2, ab: "atkup", pow: 0.8, cd: 4, waza: "ライオンのほえごえ" },
  { id: "yuniko", name: "ユニコ", em: "🦄", el: "star", r: 2, ab: "heal", pow: 40, cd: 4, waza: "にじいろヒール" },
  { id: "draco", name: "ドラコ", em: "🐲", el: "fire", r: 2, ab: "attack", pow: 2.5, cd: 4, waza: "ドラゴンブレス" },
  { id: "birihamu", name: "ビリハム", em: "🐹", el: "thunder", r: 2, ab: "stun", pow: 1, cd: 4, waza: "しびれほっぺ" },
  // ここから下は かけあわせ でしか生まれない
  { id: "toramaru", name: "トラマル", em: "🐯", el: "fire", r: 1, ab: "attack", pow: 1.8, cd: 3, waza: "タイガークロー", fusion: true },
  { id: "kujiran", name: "クジラン", em: "🐳", el: "water", r: 1, ab: "heal", pow: 35, cd: 4, waza: "しおふきシャワー", fusion: true },
  { id: "washitaka", name: "ワシタカ", em: "🦅", el: "thunder", r: 1, ab: "attack", pow: 1.8, cd: 3, waza: "いなずまダイブ", fusion: true },
  { id: "goriran", name: "ゴリラン", em: "🦍", el: "none", r: 1, ab: "atkup", pow: 0.6, cd: 3, waza: "ドラミング", fusion: true },
  { id: "tokagen", name: "トカゲン", em: "🦎", el: "leaf", r: 1, ab: "stun", pow: 1, cd: 4, waza: "かくれんぼ", fusion: true },
  { id: "koaran", name: "コアラン", em: "🐨", el: "leaf", r: 1, ab: "coin", pow: 15, cd: 2, waza: "おたからハンター", fusion: true },
  { id: "tiranon", name: "ティラノン", em: "🦖", el: "fire", r: 2, ab: "attack", pow: 3.2, cd: 4, waza: "ダイナソーバイト", fusion: true },
  { id: "ryuou", name: "リュウオウ", em: "🐉", el: "star", r: 3, ab: "attack", pow: 4.5, cd: 4, waza: "てんくうのいかずち", fusion: true },
];

// かけあわせのレシピ（順番は関係なし）
const RECIPES = [
  [["nyanta", "konta"], "toramaru"],
  [["kamessy", "takorin"], "kujiran"],
  [["pyomaru", "hoho"], "washitaka"],
  [["wanta", "kumagoro"], "goriran"],
  [["kerosuke", "pandan"], "tokagen"],
  [["pyonkichi", "penta"], "koaran"],
  [["kumagoro", "draco"], "tiranon"],
  [["draco", "gaou"], "ryuou"],
];

// レア度ごとの情報（need: かえるまでに必要な正解の数）
const RARITY = [
  { name: "ノーマル", stars: "★", need: 15, egg: ["#ffffff", "#ffb3d1"] },
  { name: "レア", stars: "★★", need: 25, egg: ["#d6ecff", "#4aa8ff"] },
  { name: "スーパーレア", stars: "★★★", need: 40, egg: ["#fff3b0", "#ffb800"] },
  { name: "レジェンド", stars: "★★★★", need: 50, egg: ["#f3e0ff", "#c77dff"] },
];

// とくいわざの説明（pow は レベルで強くなる）
const ABILITY = {
  heal: { icon: "💚", name: "かいふく", desc: (p) => `たいりょくを ${p}% かいふく` },
  attack: { icon: "💥", name: "こうげき", desc: (p) => `てきに こうげき（つよさ ${Math.round(p * 100)}%）` },
  atkup: { icon: "💪", name: "パワーアップ", desc: (p) => `つぎの 2回の こうげきが ${Math.round(p * 100)}% アップ` },
  coin: { icon: "🪙", name: "コイン", desc: (p) => `コインを ${p}まい ひろってくる` },
  shield: { icon: "🛡️", name: "ガード", desc: (p) => (p >= 1 ? "てきの こうげきを 1回 ふせぐ" : `てきの こうげきを ${Math.round(p * 100)}% へらす`) },
  stun: { icon: "💫", name: "ストップ", desc: () => "てきの うごきを 1ターン とめる" },
  hint: { icon: "💡", name: "ヒント", desc: () => "まちがいの 答えを 1つ けしてくれる" },
  gauge: { icon: "✨", name: "ゲージ", desc: (p) => `ひっさつゲージを ${p} ためる` },
};
