"""Convert the canvas's .dc.html screens into plain, linked HTML pages in prototype/dist."""
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "screens"
STATIC = ROOT / "static"
DIST = ROOT / "dist"


def convert(source: str) -> str:
    title = re.search(r"<title>(.*?)</title>", source, re.S).group(1)
    helmet = re.search(r"<helmet>(.*?)</helmet>", source, re.S).group(1).strip()
    body = re.search(r"<x-dc>(.*?)</x-dc>", source, re.S).group(1)
    body = re.sub(r"<helmet>.*?</helmet>", "", body, flags=re.S).strip()
    page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
{helmet}
<link rel="stylesheet" href="frame.css">
</head>
<body>
{body}
<a class="proto-map" href="index.html">All screens</a>
<script src="app.js"></script>
</body>
</html>
"""
    return page.replace('.dc.html"', '.html"')


def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    for path in sorted(SRC.glob("*.dc.html")):
        out = DIST / path.name.replace(".dc.html", ".html")
        out.write_text(convert(path.read_text()))
        print("built", out.name)
    for path in STATIC.iterdir():
        shutil.copy(path, DIST / path.name)
        print("copied", path.name)


if __name__ == "__main__":
    main()
