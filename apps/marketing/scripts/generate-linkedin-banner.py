#!/usr/bin/env python3
"""
LinkedIn Company Page cover banner (no logo — profile image overlaps bottom-left).

Best-practice references (LinkedIn Help, 2026):
- Upload 4200 × 700 px (6:1), PNG or JPEG, max 3 MB
- Keep critical copy in the central ~75% width; avoid bottom-left (logo) & corners
- At ~191 px display height: one headline + one short tagline max
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "store-assets"
INCLUSION_IMAGE = ROOT / "public" / "images" / "inclusion-visual.jpg"
SRGB_ICC = Path("/System/Library/ColorSync/Profiles/sRGB Profile.icc")

# LinkedIn cover: max 3 MB; Help Center suggests larger files look clearer after recompression
LINKEDIN_JPEG_TARGET_KB = 2600
LINKEDIN_JPEG_MAX_KB = 2950

WIDTH = 4200
HEIGHT = 700
RENDER_SCALE = 3  # supersample → downscale for crisp type

FOREST_CANOPY = (6, 78, 59)
FOREST_LIGHT = (6, 95, 70)
DATA_EMERALD = (16, 185, 129)
WHITE = (255, 255, 255)
WHITE_GLOW = (248, 255, 252)

HEADLINE = "From plot mapping to EUDR filing"
HEADLINE_LINES = ["From plot mapping", "to EUDR filing"]

TEXT_X0 = 0.17
TEXT_X1 = 0.66
TEXT_ANCHOR_MIN = 0.32  # minimum 32% from left (~1344px at 4200)
TEXT_PAD_AFTER = 48
SAFE_X0 = 0.12
SAFE_X1 = 0.88
SAFE_Y0 = 0.18
SAFE_Y1 = 0.82
# LinkedIn company logo overlaps bottom-left of cover (see safe-zones export)
LOGO_BLOCK = (0.0, 0.44, 0.28, 1.0)
LOGO_TEXT_PAD = 64
TEXT_TOP = 0.13  # anchor copy high — keep lower lines above / right of logo

_fade_start_px = 0
_fade_end_px = 0
_photo_left_px = 0
_panel_x0 = 0
_panel_w = 0


def _font(size: int, *, bold: bool = False, semibold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if semibold:
        candidates: list[tuple[str, int | None]] = [
            ("/System/Library/Fonts/HelveticaNeue.ttc", 1),
            ("/System/Library/Fonts/SFNS.ttf", None),
        ]
    elif bold:
        candidates = [
            ("/System/Library/Fonts/HelveticaNeue.ttc", 1),
            ("/System/Library/Fonts/SFNS.ttf", None),
            ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", None),
        ]
    else:
        candidates = [
            ("/System/Library/Fonts/HelveticaNeue.ttc", 0),
            ("/System/Library/Fonts/SFNS.ttf", None),
        ]
    for path, index in candidates:
        if not Path(path).exists():
            continue
        try:
            if index is None:
                return ImageFont.truetype(path, size)
            return ImageFont.truetype(path, size, index=index)
        except OSError:
            continue
    return ImageFont.load_default()


def _lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def _smoothstep(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def _s(value: int | float, scale: int) -> int:
    return int(round(value * scale))


def _bg_color(x: int, y: int, *, scale: int = 1) -> tuple[int, int, int]:
    h = _s(HEIGHT, scale)
    t_y = y / max(h - 1, 1)
    return _lerp(FOREST_CANOPY, FOREST_LIGHT, t_y * 0.14)


def _text_width(text: str, font: ImageFont.ImageFont) -> int:
    bbox = font.getbbox(text)
    return bbox[2] - bbox[0]


def _text_height(font: ImageFont.ImageFont, sample: str = "Ag") -> int:
    bbox = font.getbbox(sample)
    return bbox[3] - bbox[1]


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


def _logo_x1(scale: int = 1) -> int:
    return _s(WIDTH * LOGO_BLOCK[2], scale)


def _logo_y0(scale: int = 1) -> int:
    return _s(HEIGHT * LOGO_BLOCK[1], scale)


def _text_x(scale: int = 1) -> int:
    return max(
        _logo_x1(scale) + _s(LOGO_TEXT_PAD, scale),
        _s(int(WIDTH * TEXT_ANCHOR_MIN), scale),
    )


def _draw_headline_line(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.ImageFont,
    scale: int,
) -> None:
    x, y = xy
    offset = max(1, _s(2, scale))
    shadow = (2, 48, 36)
    draw.text((x + offset, y + offset), text, font=font, fill=shadow)
    draw.text((x, y), text, font=font, fill=WHITE_GLOW)


def _headline_lines(scale: int, text_w: float) -> tuple[list[str], ImageFont.FreeTypeFont | ImageFont.ImageFont]:
    """Two-line layout — allows much larger type than a single long line."""
    lines = HEADLINE_LINES
    font = _fit_font_size(
        max(lines, key=len),
        text_w * 0.98,
        _s(168, scale),
        bold=True,
        floor=_s(108, scale),
    )
    return lines, font


def _layout_fonts(scale: int = 1) -> dict[str, object]:
    x_text = _text_x(scale)
    text_w = _s(WIDTH * TEXT_X1, scale) - x_text
    headline_lines, title_font = _headline_lines(scale, text_w)
    return {
        "headline_lines": headline_lines,
        "x_text": x_text,
        "title_font": title_font,
    }


def _measure_text_layout(scale: int = 1) -> tuple[int, int]:
    layout = _layout_fonts(scale)
    x_text = layout["x_text"]
    title_font = layout["title_font"]
    line_rights = [x_text + _text_width(line, title_font) for line in layout["headline_lines"]]
    return x_text, max(line_rights)


def _cover_crop(
    image: Image.Image,
    target_w: int,
    target_h: int,
    *,
    focal_x: float = 0.52,
    focal_y: float = 0.38,
) -> Image.Image:
    src_w, src_h = image.size
    scale = max(target_w / src_w, target_h / src_h)
    new_w = max(1, int(src_w * scale))
    new_h = max(1, int(src_h * scale))
    resized = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
    cx = int(focal_x * new_w)
    cy = int(focal_y * new_h)
    left = max(0, min(new_w - target_w, cx - target_w // 2))
    top = max(0, min(new_h - target_h, cy - target_h // 2))
    return resized.crop((left, top, left + target_w, top + target_h))


def _panel_green_overlay_alpha(local_x: int, panel_w: int) -> float:
    """
    home-problem-section style: from forest-canopy → via ~35% → transparent.
    local_x=0 is the fade start (right edge of text); local_x=panel_w-1 is full photo.
    """
    if panel_w <= 1:
        return 0.0
    t = local_x / (panel_w - 1)
    if t <= 0.38:
        u = t / 0.38
        return 1.0 - _smoothstep(u) * 0.62  # 1.0 → 0.38
    u = (t - 0.38) / 0.62
    return 0.38 * (1.0 - _smoothstep(u))  # 0.38 → 0


def _configure_panel(text_block_right: int, scale: int = 1) -> None:
    global _fade_start_px, _fade_end_px, _photo_left_px, _panel_x0, _panel_w
    w = _s(WIDTH, scale)
    _fade_start_px = text_block_right + _s(TEXT_PAD_AFTER, scale)
    _panel_x0 = _fade_start_px
    _panel_w = w - _panel_x0
    _photo_left_px = _panel_x0
    _fade_end_px = w


def draw_background(base: Image.Image, scale: int = 1) -> None:
    w, h = _s(WIDTH, scale), _s(HEIGHT, scale)
    px = base.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = _bg_color(x, y, scale=scale)

    if not INCLUSION_IMAGE.exists():
        return

    _, text_block_right = _measure_text_layout(scale)
    _configure_panel(text_block_right, scale)
    if _panel_w <= 0:
        return

    photo = Image.open(INCLUSION_IMAGE).convert("RGB")
    cover = _cover_crop(photo, _panel_w, h, focal_x=0.54, focal_y=0.36)

    panel_rgba = cover.convert("RGBA")
    overlay = Image.new("RGBA", (_panel_w, h), (0, 0, 0, 0))
    overlay_px = overlay.load()

    for lx in range(_panel_w):
        alpha = _panel_green_overlay_alpha(lx, _panel_w)
        if alpha <= 0:
            continue
        for y in range(h):
            bg = _bg_color(_panel_x0 + lx, y, scale=scale)
            overlay_px[lx, y] = (*bg, int(alpha * 255))

    blended = Image.alpha_composite(panel_rgba, overlay)
    base.paste(blended.convert("RGB"), (_panel_x0, 0))


def draw_copy(base: Image.Image, scale: int = 1) -> None:
    draw = ImageDraw.Draw(base)
    layout = _layout_fonts(scale)
    x = layout["x_text"]
    title_font = layout["title_font"]
    lines = layout["headline_lines"]

    title_line_h = _text_height(title_font)
    line_gap = _s(6, scale)
    title_leading = title_line_h + line_gap
    accent_h = _s(5, scale)
    accent_gap = _s(20, scale)

    first_line_w = _text_width(lines[0], title_font)
    accent_w = min(first_line_w, _s(200, scale))

    block_h = title_leading * len(lines) - line_gap + accent_gap + accent_h
    safe_top = _s(int(HEIGHT * SAFE_Y0), scale)
    safe_bottom = _logo_y0(scale) - _s(36, scale)
    y = safe_top + max(0, (safe_bottom - safe_top - block_h) // 2)

    y_cursor = y
    for i, line in enumerate(lines):
        _draw_headline_line(draw, (x, y_cursor), line, title_font, scale)
        y_cursor += title_leading

    accent_y = y + title_leading * len(lines) - line_gap + accent_gap
    draw.rounded_rectangle(
        [x, accent_y, x + accent_w, accent_y + accent_h],
        radius=_s(3, scale),
        fill=DATA_EMERALD,
    )


def draw_safe_guides(base: Image.Image, scale: int = 1) -> None:
    draw = ImageDraw.Draw(base)
    draw.rectangle(
        [
            _s(int(WIDTH * TEXT_X0), scale),
            _s(int(HEIGHT * SAFE_Y0), scale),
            _s(int(WIDTH * TEXT_X1), scale),
            _s(int(HEIGHT * SAFE_Y1), scale),
        ],
        outline=(120, 200, 255),
        width=max(1, scale),
    )
    if _fade_start_px:
        draw.line([(_fade_start_px, 0), (_fade_start_px, _s(HEIGHT, scale))], fill=(255, 220, 80), width=max(1, scale))
    if _fade_end_px:
        draw.line([(_fade_end_px, 0), (_fade_end_px, _s(HEIGHT, scale))], fill=(255, 120, 80), width=max(1, scale))
    draw.rectangle(
        [
            _s(int(WIDTH * LOGO_BLOCK[0]), scale),
            _s(int(HEIGHT * LOGO_BLOCK[1]), scale),
            _s(int(WIDTH * LOGO_BLOCK[2]), scale),
            _s(int(HEIGHT * LOGO_BLOCK[3]), scale),
        ],
        outline=(255, 180, 60),
        width=max(1, scale),
    )


def render(*, guides: bool = False, scale: int = RENDER_SCALE) -> Image.Image:
    w, h = _s(WIDTH, scale), _s(HEIGHT, scale)
    base = Image.new("RGB", (w, h), FOREST_CANOPY)
    draw_background(base, scale)
    draw_copy(base, scale)
    if guides:
        draw_safe_guides(base, scale)
    if scale != 1:
        base = base.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    return base


def _load_srgb_icc() -> bytes | None:
    if SRGB_ICC.exists():
        return SRGB_ICC.read_bytes()
    return None


def _sharpen_for_linkedin(img: Image.Image) -> Image.Image:
    """Light unsharp mask — LinkedIn recompression softens edges; pre-sharpen helps."""
    return img.filter(ImageFilter.UnsharpMask(radius=1.1, percent=115, threshold=2))


def _save_jpeg(img: Image.Image, path: Path, *, quality: int) -> int:
    icc = _load_srgb_icc()
    rgb = img.convert("RGB")
    save_kw: dict = {
        "quality": quality,
        "subsampling": 0,
        "optimize": False,
        "progressive": False,
    }
    if icc:
        save_kw["icc_profile"] = icc
    rgb.save(path, **save_kw)
    return path.stat().st_size


def _save_linkedin_upload_jpeg(img: Image.Image, path: Path) -> tuple[int, int]:
    """High-bitrate JPEG sized for LinkedIn's 3 MB cap (Help: larger uploads stay sharper)."""
    sharpened = _sharpen_for_linkedin(img)
    target = LINKEDIN_JPEG_TARGET_KB * 1024
    max_bytes = LINKEDIN_JPEG_MAX_KB * 1024
    lo, hi = 88, 100
    best_q = hi
    best_size = 0
    while lo <= hi:
        q = (lo + hi) // 2
        size = _save_jpeg(sharpened, path, quality=q)
        if size <= max_bytes:
            best_q, best_size = q, size
            if size < target:
                lo = q + 1
            else:
                break
        else:
            hi = q - 1
    if best_size == 0:
        best_size = _save_jpeg(sharpened, path, quality=88)
        best_q = 88
    return best_q, best_size


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    banner = render()
    upload_ready = _sharpen_for_linkedin(banner)

    primary_png = OUT_DIR / "linkedin-company-banner-4200x700.png"
    primary_jpg = OUT_DIR / "linkedin-company-banner-4200x700.jpg"
    linkedin_jpg = OUT_DIR / "linkedin-company-banner-linkedin-upload.jpg"
    preview = OUT_DIR / "linkedin-company-banner-1128x191-preview.png"
    guides = OUT_DIR / "linkedin-company-banner-4200x700-safe-zones.png"

    upload_ready.save(primary_png, compress_level=3)
    _save_jpeg(upload_ready, primary_jpg, quality=97)
    upload_q, upload_bytes = _save_linkedin_upload_jpeg(banner, linkedin_jpg)
    upload_ready.resize((1128, 191), Image.Resampling.LANCZOS).save(preview, compress_level=3)
    render(guides=True, scale=1).save(guides, optimize=True)

    _, text_right = _measure_text_layout(1)
    print(f"Headline: {HEADLINE}")
    print(f"Rendered at {RENDER_SCALE}x supersampling · sRGB ICC embedded in JPEGs")
    print(f"UPLOAD THIS → {linkedin_jpg} (q={upload_q}, {upload_bytes / 1024:.0f} KB)")
    print(f"  LinkedIn recompresses all uploads; a ~2.5 MB JPEG usually survives best.")
    print(f"Alt: {primary_png} ({primary_png.stat().st_size / 1024:.0f} KB PNG if JPEG still soft)")
    print(f"Preview: {preview}")


if __name__ == "__main__":
    main()
