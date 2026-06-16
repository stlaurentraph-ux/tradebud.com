#!/usr/bin/env python3
"""Sync Google Play store assets from app icon and iOS 6.7\" screenshots."""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ICON_SRC = ROOT / "assets" / "images" / "icon.png"
LOGO = ROOT / "assets" / "images" / "tracebud-logo.png"
IOS_DIR = ROOT / "store-assets" / "app-store" / "ios" / "6.7-inch"
OUT = ROOT / "store-assets" / "google-play"

GREEN = (10, 127, 89)
GREEN_DARK = (11, 111, 80)
WHITE = (255, 255, 255)
MUTED = (220, 245, 235)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def write_app_icon() -> None:
    img = Image.open(ICON_SRC).convert("RGBA")
    img = img.resize((512, 512), Image.Resampling.LANCZOS)
    out = OUT / "app-icon-512.png"
    img.save(out, "PNG")
    print(f"Wrote {out.relative_to(ROOT)}")


def write_feature_graphic() -> None:
    w, h = 1024, 500
    img = Image.new("RGB", (w, h), GREEN_DARK)
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(GREEN[0] * (1 - t) + GREEN_DARK[0] * t)
        g = int(GREEN[1] * (1 - t) + GREEN_DARK[1] * t)
        b = int(GREEN[2] * (1 - t) + GREEN_DARK[2] * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    if LOGO.exists():
        logo = Image.open(LOGO).convert("RGBA")
        logo.thumbnail((120, 120), Image.Resampling.LANCZOS)
        img.paste(logo, (64, (h - logo.height) // 2), logo)

    title_font = load_font(56, bold=True)
    body_font = load_font(28)
    draw.text((220, 160), "Tracebud", fill=WHITE, font=title_font)
    draw.text((220, 240), "EUDR plot capture & compliance — offline-first", fill=MUTED, font=body_font)
    draw.text((220, 290), "Walk boundaries · harvest logs · photo vault", fill=MUTED, font=body_font)

    out = OUT / "feature-graphic-1024x500.png"
    img.save(out, "PNG")
    print(f"Wrote {out.relative_to(ROOT)}")


def sync_phone_screenshots() -> None:
    phone_dir = OUT / "phone"
    phone_dir.mkdir(parents=True, exist_ok=True)
    for stale in phone_dir.glob("*.png"):
        stale.unlink()
    ios_shots = sorted(IOS_DIR.glob("*.png"))
    if len(ios_shots) < 4:
        raise SystemExit(f"Need at least 4 iOS screenshots in {IOS_DIR}")
    for src in ios_shots[:8]:
        dest = phone_dir / src.name
        shutil.copy2(src, dest)
        print(f"Copied {src.name} → {dest.relative_to(ROOT)}")


def sync_tablet_screenshots() -> None:
    for tablet in ("tablet-7-inch", "tablet-10-inch"):
        dest_dir = OUT / tablet
        dest_dir.mkdir(parents=True, exist_ok=True)
        for stale in dest_dir.glob("*.png"):
            stale.unlink()
        for src in sorted(IOS_DIR.glob("*.png"))[:5]:
            shutil.copy2(src, dest_dir / src.name)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    write_app_icon()
    write_feature_graphic()
    sync_phone_screenshots()
    sync_tablet_screenshots()
    print("Google Play assets synced.")


if __name__ == "__main__":
    main()
