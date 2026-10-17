# 説明書を ゲームの サイト用に 2つに わける（こども用・保護者用）
# つかいかた：
#   1) puni-quest で python -m http.server 8765 を 動かす
#   2) node manual/_src/shoot.js [画像名の はじめ]   … ゲーム画面を shots/ に 撮る（ぜんぶ または 一部）
#   3) manual/_src/puniquest-manual.html を 直す（画像は img/xx.jpg と 書く）
#   4) python manual/_src/build_site.py            … manual/kids.html・parents.html・img/ を つくる
import os, re, shutil
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "puniquest-manual.html")
OUT = os.path.dirname(HERE)  # manual/
os.makedirs(os.path.join(OUT, "img"), exist_ok=True)
lines = open(SRC, encoding="utf-8").read().split("\n")
txt = "\n".join(lines)

style = re.search(r"<style>(.*?)</style>", txt, re.S).group(1)
fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Zen+Maru+Gothic:wght@500;700;900&display=swap">'
extra_css = """
/* 上に 固定の もどるボタン */
body { padding-top: calc(env(safe-area-inset-top, 0px) + 62px); }
.backbar { position: fixed; top: 0; left: 0; right: 0; z-index: 50; display: flex; align-items: center; gap: 10px;
  padding: calc(env(safe-area-inset-top, 0px) + 8px) max(12px, env(safe-area-inset-right, 0px)) 8px max(12px, env(safe-area-inset-left, 0px));
  background: rgba(255, 248, 251, .94); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); box-shadow: 0 3px 10px rgba(59,42,85,.12); }
.backbar a { text-decoration: none; color: var(--ink); background: #fff; border: 2px solid #ffc6dd; border-bottom-width: 4px; border-radius: 14px; padding: 7px 14px; font-weight: 900; font-size: 15px; white-space: nowrap; }
.backbar span { font-weight: 900; font-size: 14px; color: var(--ink-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
section, header { scroll-margin-top: 80px; }
.parent { margin-top: 24px; }
.toplinks { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 0; }
.toplinks a { text-decoration: none; color: var(--parent); background: #fff; border: 2px solid #c9dbef; border-radius: 12px; padding: 8px 12px; font-weight: 900; font-size: 14px; }
"""

def doc(title, body):
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>{title}</title>
<link rel="icon" type="image/png" href="../icons/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{fonts}
<style>{style}{extra_css}</style>
</head>
<body>
{body}
</body>
</html>
"""

def block(start_pat, end_pat):
    a = txt.index(start_pat); b = txt.index(end_pat, a) + len(end_pat)
    return txt[a:b]

cover = block('<header class="cover">', "</header>").replace('<a href="#parents" class="par">おうちの方へ</a>', "")
kids_secs = txt[txt.index('  <!-- ===== 1 はじめかた'):txt.index('  <!-- ===== おうちの方へ')]
parent_sec = block('<section class="parent" id="parents">', "</section>")

# こども用：もどる先は タイトル（保護者ページから 来たときは 保護者ページ）
kids_back = """<div class="backbar"><a id="back" href="../index.html">◀ タイトルに もどる</a><span>📘 ぷにまるクエスト せつめいしょ</span></div>
<script>
  // 保護者ページから 来たときは 保護者ページに もどる
  if (/[?&]from=parent/.test(location.search)) { var b = document.getElementById("back"); b.href = "../parent.html"; b.textContent = "◀ 保護者ページに もどる"; }
</script>"""
kids = doc("ぷにまるクエスト せつめいしょ", kids_back + f"""
<div class="wrap">
  {cover}
{kids_secs}
  <footer>ぷにまるクエスト ぼうけんガイド</footer>
</div>""")
open(os.path.join(OUT, "kids.html"), "w", encoding="utf-8").write(kids)

# 保護者用
par_back = """<div class="backbar"><a href="../parent.html">◀ 保護者ページに もどる</a><span>📗 保護者用 せつめいしょ</span></div>"""
parents = doc("ぷにまるクエスト 保護者用せつめいしょ", par_back + f"""
<div class="wrap">
  <div class="toplinks"><a href="kids.html?from=parent">📘 こども用 せつめいしょ（遊び方）を 見る</a></div>
  {parent_sec}
  <footer>ぷにまるクエスト 保護者用せつめいしょ</footer>
</div>""")
open(os.path.join(OUT, "parents.html"), "w", encoding="utf-8").write(parents)

# 画像：つかっている ものだけ、小さくして コピー
used = sorted(set(re.findall(r'img/([0-9a-z_]+\.jpg)', kids + parents)))
for f in os.listdir(os.path.join(OUT, "img")):
    if f not in used: os.remove(os.path.join(OUT, "img", f))
for f in used:
    im = Image.open(os.path.join(HERE, "shots", f)).convert("RGB")
    im = im.resize((540, round(540 * im.height / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, "img", f), quality=80, optimize=True)
tot = sum(os.path.getsize(os.path.join(OUT, "img", f)) for f in used)
print("kids/parents ok", len(used), "images", round(tot / 1024), "KB")
