#!/usr/bin/env python3
"""Generate iOS/Android/web icon assets from assets/images/tracebud-logo.png."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "images" / "tracebud-logo.png"
OUT = ROOT / "assets" / "images"

# Matches HEADER_GRADIENT_COLORS in constants/compactTabHeader.ts
BRAND_GREEN = (10, 127, 89)  # #0A7F59


def load_logo() -> Image.Image:
    return Image.open(SRC).convert("RGBA")


def fit_logo(logo: Image.Image, max_side: int) -> Image.Image:
    out = logo.copy()
    out.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    return out


def paste_centered(canvas: Image.Image, logo: Image.Image) -> None:
    x = (canvas.width - logo.width) // 2
    y = (canvas.height - logo.height) // 2
    if canvas.mode == "RGBA":
        canvas.paste(logo, (x, y), logo)
    else:
        rgba = Image.new("RGBA", canvas.size, (*BRAND_GREEN, 255))
        rgba.paste(logo, (x, y), logo)
        canvas.paste(rgba, (0, 0), rgba)


def icon_on_green(size: int, logo_scale: float) -> Image.Image:
    canvas = Image.new("RGB", (size, size), BRAND_GREEN)
    logo = fit_logo(load_logo(), int(size * logo_scale))
    paste_centered(canvas, logo)
    return canvas


def adaptive_foreground(size: int) -> Image.Image:
    """Android safe zone ≈ 66% diameter — keep logo inside it."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    logo = fit_logo(load_logo(), int(size * 0.58))
    paste_centered(canvas, logo)
    return canvas


def adaptive_background(size: int) -> Image.Image:
    return Image.new("RGB", (size, size), BRAND_GREEN)


def monochrome_foreground(size: int) -> Image.Image:
    """Themed icon: white glyph on transparent."""
    logo = fit_logo(load_logo(), int(size * 0.58))
    alpha = logo.split()[3]
    white = Image.new("RGBA", logo.size, (255, 255, 255, 255))
    white.putalpha(alpha)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    paste_centered(canvas, white)
    return canvas


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source logo: {SRC}")

    icon_on_green(1024, 0.72).save(OUT / "icon.png", optimize=True)
    icon_on_green(1024, 0.62).save(OUT / "splash-icon.png", optimize=True)
    adaptive_foreground(1024).save(OUT / "android-icon-foreground.png", optimize=True)
    adaptive_background(1024).save(OUT / "android-icon-background.png", optimize=True)
    monochrome_foreground(1024).save(OUT / "android-icon-monochrome.png", optimize=True)
    icon_on_green(48, 0.72).save(OUT / "favicon.png", optimize=True)

    print(f"Wrote Tracebud icons to {OUT}")


if __name__ == "__main__":
    main()
