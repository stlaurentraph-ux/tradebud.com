#!/usr/bin/env python3
"""
LinkedIn Company Page cover banner (no logo — profile image overlaps bottom-left).

Best-practice references (LinkedIn Help, 2026):
- Upload 4200 × 700 px (6:1), PNG or JPEG, max 3 MB
- Keep critical copy in the central ~75% width; avoid bottom-left (logo) & corners
- At ~191 px display height: one headline + one short tagline max

Design: unified brand green field, progressive photo reveal (home-problem-section),
typography hierarchy aligned with marketing site (eyebrow, H1, body tiers).
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "store-assets"
INCLUSION_IMAGE = ROOT / "public" / "images" / "inclusion-visual.jpg"

WIDTH = 4200
HEIGHT = 700

# Tracebud brand (apps/marketing/app/globals.css)
FOREST_CANOPY = (6, 78, 59)
FOREST_LIGHT = (6, 95, 70)
DATA_EMERALD = (16, 185, 129)
WHITE = (255, 255, 255)
WHITE_92 = (235, 245, 240)
WHITE_78 = (196, 220, 208)
WHITE_55 = (148, 178, 165)

TEXT_X0 = 0.10
TEXT_X1 = 0.56
PHOTO_X0 = 0.52
SAFE_X0 = 0.12
SAFE_X1 = 0.88
SAFE_Y0 = 0.18
SAFE_Y1 = 0.82
LOGO_BLOCK = (0.0, 0.52, 0.24, 1.0)


def _font(size: int, *, bold: bool = False, semibold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if semibold:
        candidates = [
            "/System/Library/Fonts/SFNSDisplay-Semibold.otf",
            "/System/Library/Fonts/SFNS.ttf",
            "/Library/Fonts/SFNSDisplay-Semibold.otf",
        ]
    elif bold:
        candidates = [
            "/System/Library/Fonts/SFNSDisplay-Bold.otf",
            "/System/Library/Fonts/SFNS.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/Library/Fonts/Arial Bold.ttf",
        ]
    else:
        candidates = [
            "/System/Library/Fonts/SFNSDisplay-Regular.otf",
            "/System/Library/Fonts/SFNS.ttf",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/Library/Fonts/Arial.ttf",
        ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def _smoothstep(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def _bg_color(x: int, y: int) -> tuple[int, int, int]:
    """Single brand green — subtle vertical depth only (no horizontal split)."""
    t_y = y / max(HEIGHT - 1, 1)
    return _lerp(FOREST_CANOPY, FOREST_LIGHT, t_y * 0.14)


def _text_width(text: str, font: ImageFont.ImageFont) -> int:
    bbox = font.getbbox(text)
    return bbox[2] - bbox[0]


def _text_height(font: ImageFont.ImageFont, sample: str = "Ag") -> int:
    bbox = font.getbbox(sample)
    return bbox[3] - bbox[1]


def _text_width_spaced(text: str, font: ImageFont.ImageFont, tracking: int) -> int:
    if not text:
        return 0
    return sum(_text_width(char, font) for char in text) + tracking * (len(text) - 1)


def _draw_text_spaced(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    tracking: int,
) -> None:
    x, y = xy
    for char in text:
        draw.text((x, y), char, font=font, fill=fill)
        x += _text_width(char, font) + tracking


def _fit_height_panel(
    image: Image.Image,
    panel_w: int,
    panel_h: int,
    global_x0: int,
) -> Image.Image:
    scale = panel_h / image.height
    new_w = max(1, int(image.width * scale))
    new_h = panel_h
    resized = image.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGB", (panel_w, panel_h))
    px = canvas.load()
    for y in range(panel_h):
        for x in range(panel_w):
            px[x, y] = _bg_color(global_x0 + x, y)

    paste_x = panel_w - new_w
    canvas.paste(resized, (paste_x, 0))
    return canvas


def _photo_overlay_alpha(panel_t: float) -> float:
    """Progressive reveal: opaque brand green → clear photo (ease-in-out)."""
    if panel_t >= 0.72:
        return 0.0
    u = panel_t / 0.72
    return (1.0 - _smoothstep(u)) * 0.98


def draw_background(base: Image.Image) -> None:
    px = base.load()
    for y in range(HEIGHT):
        for x in range(WIDTH):
            px[x, y] = _bg_color(x, y)

    photo_x0 = int(WIDTH * PHOTO_X0)
    panel_w = WIDTH - photo_x0
    if not INCLUSION_IMAGE.exists() or panel_w <= 0:
        return

    photo = Image.open(INCLUSION_IMAGE).convert("RGB")
    cover = _fit_height_panel(photo, panel_w, HEIGHT, photo_x0)
    base.paste(cover, (photo_x0, 0))

    photo_rgba = base.crop((photo_x0, 0, WIDTH, HEIGHT)).convert("RGBA")
    overlay = Image.new("RGBA", (panel_w, HEIGHT), (0, 0, 0, 0))
    overlay_px = overlay.load()
    for x in range(panel_w):
        alpha = _photo_overlay_alpha(x / max(panel_w - 1, 1))
        if alpha <= 0:
            continue
        for y in range(HEIGHT):
            bg = _bg_color(photo_x0 + x, y)
            overlay_px[x, y] = (*bg, int(alpha * 255))

    base.paste(Image.alpha_composite(photo_rgba, overlay).convert("RGB"), (photo_x0, 0))


def _fit_font_size(
    text: str,
    max_w: float,
    start: int,
    *,
    bold: bool = False,
    semibold: bool = False,
    floor: int = 28,
) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    size = start
    while size > floor and _text_width(text, _font(size, bold=bold, semibold=semibold)) > max_w:
        size -= 2
    return _font(size, bold=bold, semibold=semibold)


def draw_copy(base: Image.Image) -> None:
    draw = ImageDraw.Draw(base)

    text_left = int(WIDTH * TEXT_X0) + 40
    text_w = int(WIDTH * TEXT_X1) - text_left
    safe_top = int(HEIGHT * SAFE_Y0)
    safe_bottom = int(HEIGHT * SAFE_Y1)
    safe_h = safe_bottom - safe_top

    eyebrow = "EUDR TRACEABILITY"
    headline_lines = [
        "Traceability infrastructure",
        "for the whole chain",
    ]
    tagline_primary = "Plot mapping · Tenure & deforestation screening · EUDR filing & retention"
    tagline_secondary = "Self-serve, open to all, start anywhere"
    url = "tracebud.com"

    eyebrow_font = _font(34, semibold=True)
    eyebrow_tracking = 10

    title_font = _fit_font_size(
        max(headline_lines, key=len),
        text_w * 0.98,
        102,
        bold=True,
        floor=64,
    )
    title_line_h = _text_height(title_font)
    title_leading = int(title_line_h * 1.06)

    tag1_font = _fit_font_size(tagline_primary, text_w * 0.98, 44, floor=32)
    tag2_font = _fit_font_size(tagline_secondary, text_w * 0.98, 38, floor=28)
    url_font = _font(34, semibold=True)

    eyebrow_h = _text_height(eyebrow_font)
    tag1_h = _text_height(tag1_font)
    tag2_h = _text_height(tag2_font)
    url_h = _text_height(url_font)

    eyebrow_gap = 22
    headline_gap = 28
    accent_h = 6
    accent_gap_after = 26
    tag_gap = 16
    url_gap = 24

    block_h = (
        eyebrow_h
        + eyebrow_gap
        + title_leading * len(headline_lines)
        + headline_gap
        + accent_h
        + accent_gap_after
        + tag1_h
        + tag_gap
        + tag2_h
        + url_gap
        + url_h
    )

    x = text_left
    y = safe_top + (safe_h - block_h) // 2

    logo_x1 = int(WIDTH * LOGO_BLOCK[2])
    logo_y0 = int(HEIGHT * LOGO_BLOCK[1])
    if x < logo_x1 + 40 and y + block_h > logo_y0:
        x = max(x, logo_x1 + 52)

    _draw_text_spaced(draw, (x, y), eyebrow, eyebrow_font, DATA_EMERALD, eyebrow_tracking)
    y += eyebrow_h + eyebrow_gap

    for line in headline_lines:
        draw.text((x, y), line, font=title_font, fill=WHITE)
        y += title_leading

    y += headline_gap - (title_leading - title_line_h)
    draw.rounded_rectangle([x, y, x + 72, y + accent_h], radius=3, fill=DATA_EMERALD)
    y += accent_h + accent_gap_after

    draw.text((x, y), tagline_primary, font=tag1_font, fill=WHITE_92)
    y += tag1_h + tag_gap

    draw.text((x, y), tagline_secondary, font=tag2_font, fill=WHITE_78)
    y += tag2_h + url_gap

    draw.text((x, y), url, font=url_font, fill=DATA_EMERALD)


def draw_safe_guides(base: Image.Image) -> None:
    draw = ImageDraw.Draw(base)
    draw.rectangle(
        [int(WIDTH * TEXT_X0), int(HEIGHT * SAFE_Y0), int(WIDTH * TEXT_X1), int(HEIGHT * SAFE_Y1)],
        outline=(120, 200, 255),
        width=2,
    )
    draw.rectangle(
        [int(WIDTH * SAFE_X0), int(HEIGHT * SAFE_Y0), int(WIDTH * SAFE_X1), int(HEIGHT * SAFE_Y1)],
        outline=(255, 60, 60),
        width=2,
    )
    draw.rectangle(
        [int(WIDTH * PHOTO_X0), 0, WIDTH, HEIGHT],
        outline=(180, 255, 120),
        width=2,
    )
    draw.rectangle(
        [
            int(WIDTH * LOGO_BLOCK[0]),
            int(HEIGHT * LOGO_BLOCK[1]),
            int(WIDTH * LOGO_BLOCK[2]),
            int(HEIGHT * LOGO_BLOCK[3]),
        ],
        outline=(255, 180, 60),
        width=2,
    )


def render(*, guides: bool = False) -> Image.Image:
    base = Image.new("RGB", (WIDTH, HEIGHT), FOREST_CANOPY)
    draw_background(base)
    draw_copy(base)
    if guides:
        draw_safe_guides(base)
    return base


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    banner = render()

    primary_png = OUT_DIR / "linkedin-company-banner-4200x700.png"
    primary_jpg = OUT_DIR / "linkedin-company-banner-4200x700.jpg"
    preview = OUT_DIR / "linkedin-company-banner-1128x191-preview.png"
    guides = OUT_DIR / "linkedin-company-banner-4200x700-safe-zones.png"

    banner.save(primary_png, optimize=True)
    banner.convert("RGB").save(primary_jpg, quality=92, optimize=True, subsampling=0)
    banner.resize((1128, 191), Image.Resampling.LANCZOS).save(preview, optimize=True)
    render(guides=True).save(guides, optimize=True)

    png_kb = primary_png.stat().st_size / 1024
    jpg_kb = primary_jpg.stat().st_size / 1024
    print(f"Wrote {primary_png} ({png_kb:.0f} KB) — upload this or JPG")
    print(f"Wrote {primary_jpg} ({jpg_kb:.0f} KB)")
    print(f"Wrote {preview} (desktop preview only — do not upscale for upload)")
    print(f"Wrote {guides} (safe-zone reference — not for upload)")


if __name__ == "__main__":
    main()
