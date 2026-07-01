#!/usr/bin/env python3
"""Generate iOS/Android/web icon assets from assets/images/tracebud-logo.png."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "images" / "tracebud-logo.png"
OUT = ROOT / "assets" / "images"
STORE_ICON = ROOT / "store-assets" / "google-play" / "app-icon-512.png"

TILE_WHITE = (255, 255, 255)
# Neutral launch canvas colors — keep in sync with app.json expo-splash-screen + compactTabHeader.ts
SPLASH_BACKGROUND_LIGHT = "#F9FAFB"
SPLASH_BACKGROUND_DARK = "#111827"

# Max fraction of canvas for the trimmed mark's longest side.
# iOS HIG: keep artwork in the central ~80%; 82% is a common professional maximum.
IOS_CONTENT_SCALE = 0.82
SPLASH_CONTENT_SCALE = 0.46

# Android adaptive foreground safe zone diameter ≈ 66% of 108dp canvas.
ANDROID_CONTENT_SCALE = 0.64
MONOCHROME_CONTENT_SCALE = 0.64

# Tiny inset after trimming source PNG transparency (anti-alias guard).
TRIM_PAD_RATIO = 0.015


def load_logo() -> Image.Image:
    return Image.open(SRC).convert("RGBA")


def trim_logo(logo: Image.Image) -> Image.Image:
    """Crop built-in transparent margins from the dashboard export."""
    bbox = logo.getbbox()
    if not bbox:
        return logo
    x0, y0, x1, y1 = bbox
    w, h = x1 - x0, y1 - y0
    pad = max(1, int(max(w, h) * TRIM_PAD_RATIO))
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(logo.width, x1 + pad)
    y1 = min(logo.height, y1 + pad)
    return logo.crop((x0, y0, x1, y1))


def fit_trimmed_logo(logo: Image.Image, canvas_size: int, content_scale: float) -> Image.Image:
    trimmed = trim_logo(logo)
    target = int(canvas_size * content_scale)
    out = trimmed.copy()
    out.thumbnail((target, target), Image.Resampling.LANCZOS)
    return out


def paste_centered(canvas: Image.Image, logo: Image.Image) -> None:
    x = (canvas.width - logo.width) // 2
    y = (canvas.height - logo.height) // 2
    canvas.paste(logo, (x, y), logo)


def icon_on_white_tile(size: int, content_scale: float) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (*TILE_WHITE, 255))
    logo = fit_trimmed_logo(load_logo(), size, content_scale)
    paste_centered(canvas, logo)
    return canvas.convert("RGB")


def adaptive_foreground(size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    logo = fit_trimmed_logo(load_logo(), size, ANDROID_CONTENT_SCALE)
    paste_centered(canvas, logo)
    return canvas


def adaptive_background(size: int) -> Image.Image:
    return Image.new("RGB", (size, size), TILE_WHITE)


def monochrome_foreground(size: int) -> Image.Image:
    logo = fit_trimmed_logo(load_logo(), size, MONOCHROME_CONTENT_SCALE)
    alpha = logo.split()[3]
    white = Image.new("RGBA", logo.size, (255, 255, 255, 255))
    white.putalpha(alpha)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    paste_centered(canvas, white)
    return canvas


def splash_launch(width: int = 900) -> Image.Image:
    """Logo on transparent canvas; neutral background comes from app.json."""
    logo = fit_trimmed_logo(load_logo(), width, SPLASH_CONTENT_SCALE)
    canvas = Image.new("RGBA", (width, logo.height + 32), (0, 0, 0, 0))
    paste_centered(canvas, logo)
    return canvas


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source logo: {SRC}")

    icon_on_white_tile(1024, IOS_CONTENT_SCALE).save(OUT / "icon.png", optimize=True)
    splash_launch(900).save(OUT / "splash-icon.png", optimize=True)
    adaptive_foreground(1024).save(OUT / "android-icon-foreground.png", optimize=True)
    adaptive_background(1024).save(OUT / "android-icon-background.png", optimize=True)
    monochrome_foreground(1024).save(OUT / "android-icon-monochrome.png", optimize=True)
    icon_on_white_tile(48, IOS_CONTENT_SCALE).save(OUT / "favicon.png", optimize=True)

    STORE_ICON.parent.mkdir(parents=True, exist_ok=True)
    icon_on_white_tile(512, IOS_CONTENT_SCALE).save(STORE_ICON, optimize=True)

    trimmed = trim_logo(load_logo())
    print(f"Wrote Tracebud icons to {OUT}")
    print(f"  trimmed source: {trimmed.width}x{trimmed.height} (from {load_logo().size[0]}px canvas)")
    print(f"  iOS mark max side: {IOS_CONTENT_SCALE * 100:.0f}% of icon ({int(1024 * IOS_CONTENT_SCALE)}px)")
    print(f"  Android mark max side: {ANDROID_CONTENT_SCALE * 100:.0f}% safe zone")
    print(f"Wrote Play Store icon to {STORE_ICON}")


if __name__ == "__main__":
    main()
