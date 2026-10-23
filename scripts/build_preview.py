"""Generate a self-contained preview from the collaborative source files."""
import base64
import mimetypes
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def local_file(reference):
    path = (ROOT / reference).resolve()
    if not path.is_relative_to(ROOT) or not path.is_file():
        raise ValueError(f"Missing or unsafe local resource: {reference}")
    return path


def embed_image(match):
    path = local_file(match[1])
    mime = mimetypes.guess_type(path.name)[0]
    if not mime or not mime.startswith("image/"):
        raise ValueError(f"Unsupported image: {path.name}")
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f'src="data:{mime};base64,{encoded}"'


def build():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "style.css").read_text(encoding="utf-8")
    css = re.sub(r'^@charset\s+"UTF-8";\s*', "", css)
    html = html.replace('<link rel="stylesheet" href="./style.css">', f"<style>\n{css}\n</style>")
    html = re.sub(r'src="(\./images/[^\"]+)"', embed_image, html)
    # Fail rather than silently shipping a preview with external dependencies.
    if re.search(r'<link\b|<script\b|\bsrc="(?!data:)|url\s*\(|@import', html, re.I):
        raise ValueError("Unembedded dependency detected; update this generator for the new resource.")
    (ROOT / "preview.html").write_text(html, encoding="utf-8")
    print("Generated preview.html (embedded CSS and images; no external dependencies)")


if __name__ == "__main__":
    build()
