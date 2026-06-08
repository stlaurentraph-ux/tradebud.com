#!/usr/bin/env python3
"""Build 1200x630 Open Graph image from farmer hero + Tracebud logo."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUT = PUBLIC / "og-image.png"
HERO = PUBLIC / "images" / "farmer-hero.jpg"
LOGO = PUBLIC / "images" / "tracebud-logo.png"

OG_W, OG_H = 1200, 630


def cover_crop(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    resized = img.resize((round(src_w * scale), round(src_h * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def main() -> None:
    hero = Image.open(HERO).convert("RGB")
    canvas = cover_crop(hero, OG_W, OG_H)

    overlay = Image.new("RGBA", (OG_W, OG_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for x in range(OG_W):
        alpha = int(170 - (x / OG_W) * 90)
        draw.line([(x, 0), (x, OG_H)], fill=(6, 78, 59, alpha))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay)

    logo = Image.open(LOGO).convert("RGBA")
    logo_w = 120
    logo_h = round(logo.height * (logo_w / logo.width))
    logo = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    canvas.paste(logo, (56, 52), logo)

    font_paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    title_font = None
    body_font = None
    for path in font_paths:
        if Path(path).exists():
            title_font = ImageFont.truetype(path, 46)
            body_font = ImageFont.truetype(path, 24)
            break
    if title_font is None:
        title_font = ImageFont.load_default()
        body_font = ImageFont.load_default()

    text_x, text_y = 56, 200
    draw = ImageDraw.Draw(canvas)
    draw.text(
        (text_x, text_y),
        "Traceability infrastructure\nfor the whole chain.",
        fill=(255, 255, 255, 255),
        font=title_font,
        spacing=8,
    )
    draw.text(
        (text_x, text_y + 150),
        "EUDR-ready compliance from field to export.",
        fill=(209, 250, 229, 255),
        font=body_font,
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(OUT, format="PNG", optimize=True)
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
