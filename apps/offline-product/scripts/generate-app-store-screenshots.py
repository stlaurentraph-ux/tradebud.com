#!/usr/bin/env python3
"""Generate iPhone 6.7\" App Store screenshots (1290×2796) for Tracebud."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "assets" / "images" / "tracebud-logo.png"
OUT = ROOT / "store-assets" / "app-store" / "ios" / "6.7-inch"

W, H = 1290, 2796

GREEN = (10, 127, 89)
GREEN_DARK = (11, 111, 80)
WHITE = (255, 255, 255)
BG = (248, 248, 248)
TEXT = (17, 17, 17)
MUTED = (102, 102, 102)
BORDER = (236, 236, 236)
CARD = (255, 255, 255)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size=size)
            except OSError:
                continue
    return ImageFont.load_default()


FONT_TITLE = load_font(52, bold=True)
FONT_HEAD = load_font(40, bold=True)
FONT_BODY = load_font(32)
FONT_BODY_BOLD = load_font(32, bold=True)
FONT_CAPTION = load_font(26)
FONT_SMALL = load_font(24)
FONT_STAT = load_font(44, bold=True)
FONT_TAB = load_font(22)


def new_screen() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)


def gradient_header(img: Image.Image, height: int = 200) -> ImageDraw.ImageDraw:
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(height - 1, 1)
        r = int(GREEN[0] * (1 - t) + GREEN_DARK[0] * t)
        g = int(GREEN[1] * (1 - t) + GREEN_DARK[1] * t)
        b = int(GREEN[2] * (1 - t) + GREEN_DARK[2] * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
    return draw


def paste_logo(img: Image.Image, x: int, y: int, size: int) -> None:
    logo = Image.open(LOGO).convert("RGBA")
    logo.thumbnail((size, size), Image.Resampling.LANCZOS)
    img.paste(logo, (x, y), logo)


def draw_status_bar(draw: ImageDraw.ImageDraw) -> None:
    draw.text((48, 62), "9:41", fill=WHITE, font=FONT_CAPTION)
    draw.rounded_rectangle([W - 180, 58, W - 48, 88], radius=18, fill=(255, 255, 255, 40))


def draw_header_bar(
    img: Image.Image,
    *,
    center_title: str | None = None,
    back: bool = False,
) -> ImageDraw.ImageDraw:
    draw = gradient_header(img, 210)
    draw_status_bar(draw)
    paste_logo(img, 48, 108, 56)
    draw.text((120, 118), "Tracebud", fill=WHITE, font=FONT_BODY_BOLD)
    lang_w = 88
    draw.rounded_rectangle([W - lang_w - 48, 108, W - 48, 156], radius=28, fill=(255, 255, 255, 45))
    draw.text((W - lang_w - 30, 118), "EN", fill=WHITE, font=FONT_CAPTION)
    if back:
        draw.text((48, 178), "‹ Back", fill=WHITE, font=FONT_BODY)
    if center_title:
        tw = draw.textlength(center_title, font=FONT_BODY_BOLD)
        draw.text(((W - tw) / 2, 178), center_title, fill=WHITE, font=FONT_BODY_BOLD)
    return draw


def card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int = 28) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=CARD, outline=BORDER, width=2)


def draw_tab_bar(draw: ImageDraw.ImageDraw, active: str) -> None:
    y = H - 150
    draw.rectangle([0, y, W, H], fill=WHITE)
    draw.line([0, y, W, y], fill=BORDER, width=2)
    tabs = [("Home", "⌂"), ("My Plots", "▦"), ("Settings", "⚙")]
    slot = W // 3
    for i, (label, icon) in enumerate(tabs):
        cx = slot * i + slot // 2
        color = GREEN if label == active else MUTED
        draw.text((cx - 12, y + 28), icon, fill=color, font=FONT_TAB)
        tw = draw.textlength(label, font=FONT_SMALL)
        draw.text((cx - tw / 2, y + 72), label, fill=color, font=FONT_SMALL)


def screen_home() -> Image.Image:
    img, draw = new_screen()
    draw_header_bar(img)
    y = 240

    # Welcome card
    welcome = Image.new("RGB", (W - 96, 280), GREEN)
    wdraw = ImageDraw.Draw(welcome)
    for row in range(280):
        t = row / 279
        c = (
            int(GREEN[0] * (1 - t) + GREEN_DARK[0] * t),
            int(GREEN[1] * (1 - t) + GREEN_DARK[1] * t),
            int(GREEN[2] * (1 - t) + GREEN_DARK[2] * t),
        )
        wdraw.line([(0, row), (W - 96, row)], fill=c)
    wdraw.text((36, 36), "Welcome back,", fill=(210, 240, 225), font=FONT_CAPTION)
    wdraw.text((36, 78), "Maria Santos", fill=WHITE, font=FONT_HEAD)
    for i, (label, val) in enumerate([("Plots", "3"), ("Ready", "2"), ("Pending", "0")]):
        bx = 36 + i * 210
        wdraw.rounded_rectangle([bx, 168, bx + 180, 248], radius=20, fill=(20, 150, 105))
        wdraw.text((bx + 20, 182), label, fill=(220, 245, 235), font=FONT_SMALL)
        wdraw.text((bx + 20, 210), val, fill=WHITE, font=FONT_STAT)
    img.paste(welcome, (48, y))
    y += 310

    tiles = [
        ("Register plot", "Map your field with GPS", (191, 238, 219), (11, 123, 89)),
        ("Log harvest", "Record delivery weight", (248, 237, 200), (180, 90, 0)),
        ("Documents", "Land permits & evidence", (220, 233, 255), (36, 84, 215)),
        ("My vouchers", "Compliance QR codes", (240, 227, 255), (122, 31, 209)),
    ]
    tw, th = (W - 120) // 2, 200
    for idx, (title, sub, tint, accent) in enumerate(tiles):
        col, row = idx % 2, idx // 2
        x = 48 + col * (tw + 24)
        ty = y + row * (th + 24)
        card(draw, (x, ty, x + tw, ty + th))
        draw.rounded_rectangle([x + 24, ty + 24, x + 88, ty + 88], radius=18, fill=tint)
        draw.ellipse([x + 40, ty + 40, x + 72, ty + 72], fill=accent)
        draw.text((x + 24, ty + 104), title, fill=TEXT, font=FONT_BODY_BOLD)
        draw.text((x + 24, ty + 148), sub, fill=MUTED, font=FONT_SMALL)

    y += 460
    card(draw, (48, y, W - 48, y + 140))
    draw.text((80, y + 32), "☁  Sync status", fill=TEXT, font=FONT_BODY_BOLD)
    draw.rounded_rectangle([W - 280, y + 36, W - 80, y + 84], radius=22, fill=(56, 161, 105, 36))
    draw.text((W - 250, y + 46), "0 pending", fill=GREEN, font=FONT_CAPTION)
    draw.text((80, y + 92), "Backed up — your plots are safe on this device.", fill=MUTED, font=FONT_SMALL)

    draw_tab_bar(draw, "Home")
    return img


def screen_map_plot() -> Image.Image:
    img, draw = new_screen()
    draw_header_bar(img, center_title="Register plot", back=True)

    map_top = 230
    map_h = H - map_top - 420
    draw.rectangle([0, map_top, W, map_top + map_h], fill=(212, 228, 210))
    # Satellite-ish blocks
    for block in [(40, 60, 380, 280), (420, 120, 760, 400), (100, 420, 520, 720), (560, 480, 980, 860)]:
        x1, y1, x2, y2 = block
        draw.rectangle(
            [x1, map_top + y1, x2, map_top + y2],
            fill=(180 + (x1 % 40), 200 + (y1 % 30), 165),
        )
    # Plot polygon
    poly = [
        (320, map_top + 200),
        (620, map_top + 160),
        (880, map_top + 340),
        (760, map_top + 620),
        (400, map_top + 580),
    ]
    draw.polygon(poly, fill=(28, 163, 107, 120), outline=GREEN)
    draw.line(poly + [poly[0]], fill=GREEN, width=6)
    for px, py in poly:
        draw.ellipse([px - 14, py - 14, px + 14, py + 14], fill=WHITE, outline=GREEN, width=4)

    card(draw, (48, map_top + map_h + 24, W - 48, map_top + map_h + 320))
    draw.text((80, map_top + map_h + 56), "Finca Norte", fill=TEXT, font=FONT_HEAD)
    draw.text((80, map_top + map_h + 112), "Walking perimeter…", fill=MUTED, font=FONT_BODY)
    draw.text((80, map_top + map_h + 168), "0.42 ha", fill=GREEN, font=FONT_STAT)
    draw.rounded_rectangle([80, map_top + map_h + 230, W - 80, map_top + map_h + 300], radius=32, fill=GREEN)
    draw.text((W // 2 - 90, map_top + map_h + 248), "Continue", fill=WHITE, font=FONT_BODY_BOLD)

    draw_tab_bar(draw, "Home")
    return img


def screen_my_plots() -> Image.Image:
    img, draw = new_screen()
    draw_header_bar(img, center_title="My Plots", back=True)
    y = 250
    plots = [
        ("Finca Norte", "0.42 ha · Coffee", "Ready"),
        ("El Roble", "1.15 ha · Cocoa", "2 photos needed"),
        ("La Colina", "0.88 ha · Coffee", "Ready"),
    ]
    for name, meta, status in plots:
        card(draw, (48, y, W - 48, y + 220))
        draw.rounded_rectangle([72, y + 28, 252, y + 192], radius=20, fill=(200, 220, 195))
        draw.polygon(
            [(110, y + 150), (160, y + 60), (210, y + 120), (180, y + 170)],
            fill=(28, 163, 107),
            outline=GREEN,
        )
        draw.text((280, y + 40), name, fill=TEXT, font=FONT_BODY_BOLD)
        draw.text((280, y + 92), meta, fill=MUTED, font=FONT_CAPTION)
        ok = status == "Ready"
        pill_color = (56, 161, 105) if ok else (221, 107, 32)
        draw.rounded_rectangle([280, y + 140, 280 + 220, y + 188], radius=20, fill=(*pill_color, 30))
        draw.text((300, y + 150), status, fill=pill_color, font=FONT_SMALL)
        y += 244

    draw_tab_bar(draw, "My Plots")
    return img


def screen_offline() -> Image.Image:
    img, draw = new_screen()
    draw_header_bar(img)
    y = 260
    card(draw, (48, y, W - 48, y + 520))
    draw.rounded_rectangle([80, y + 40, 160, y + 120], radius=40, fill=(191, 238, 219))
    draw.text((96, y + 62), "📡", fill=GREEN, font=FONT_HEAD)
    draw.text((190, y + 52), "Works offline", fill=TEXT, font=FONT_HEAD)
    draw.text(
        (80, y + 140),
        "Map your field without mobile data.\nPlots save on this device and sync\nwhen you are back online.",
        fill=MUTED,
        font=FONT_BODY,
    )
    draw.rounded_rectangle([80, y + 360, W - 80, y + 460], radius=28, fill=(234, 248, 241))
    draw.text((110, y + 392), "✓  GPS boundary capture", fill=GREEN, font=FONT_BODY)
    draw.text((110, y + 440), "✓  Photos stored locally", fill=GREEN, font=FONT_CAPTION)

    y += 560
    card(draw, (48, y, W - 48, y + 380))
    draw.text((80, y + 40), "Offline maps", fill=TEXT, font=FONT_BODY_BOLD)
    draw.rounded_rectangle([80, y + 100, W - 80, y + 340], radius=24, fill=(212, 228, 210))
    draw.text((W // 2 - 200, y + 200), "Satellite tiles downloaded", fill=MUTED, font=FONT_CAPTION)

    draw_tab_bar(draw, "Home")
    return img


def screen_backup() -> Image.Image:
    img, draw = new_screen()
    draw_header_bar(img, center_title="Settings", back=True)
    y = 250
    card(draw, (48, y, W - 48, y + 320))
    draw.text((80, y + 36), "☁  Back up to Tracebud", fill=TEXT, font=FONT_BODY_BOLD)
    draw.text(
        (80, y + 96),
        "Sign in to save your plots to the cloud\nand share with your cooperative.",
        fill=MUTED,
        font=FONT_BODY,
    )
    draw.rounded_rectangle([80, y + 210, W - 80, y + 280], radius=32, fill=GREEN)
    draw.text((W // 2 - 110, y + 228), "Back up now", fill=WHITE, font=FONT_BODY_BOLD)

    y += 360
    card(draw, (48, y, W - 48, y + 260))
    draw.text((80, y + 36), "📱  Storage on this device", fill=TEXT, font=FONT_BODY_BOLD)
    draw.rounded_rectangle([80, y + 100, W - 80, y + 120], radius=8, fill=BORDER)
    draw.rounded_rectangle([80, y + 100, W // 2, y + 120], radius=8, fill=GREEN)
    draw.text((80, y + 148), "24 MB used by Tracebud on this device", fill=MUTED, font=FONT_CAPTION)

    y += 300
    card(draw, (48, y, W - 48, y + 200))
    draw.text((80, y + 36), "🌐  Language", fill=TEXT, font=FONT_BODY_BOLD)
    draw.text((80, y + 100), "English", fill=TEXT, font=FONT_BODY)

    draw_tab_bar(draw, "Settings")
    return img


SCREENS = [
    ("01-home.png", screen_home),
    ("02-map-plot.png", screen_map_plot),
    ("03-my-plots.png", screen_my_plots),
    ("04-offline.png", screen_offline),
    ("05-backup-settings.png", screen_backup),
]


def main() -> None:
    if not LOGO.exists():
        raise SystemExit(f"Missing logo: {LOGO}")
    OUT.mkdir(parents=True, exist_ok=True)
    for name, builder in SCREENS:
        path = OUT / name
        builder().save(path, optimize=True)
        print(f"Wrote {path}")
    print(f"\nUpload the PNGs in {OUT} to App Store Connect → iPhone 6.7\" display.")


if __name__ == "__main__":
    main()
