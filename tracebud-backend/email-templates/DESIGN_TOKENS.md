# Tracebud Email Design Tokens

All values are applied as **inline CSS** in email HTML templates.
Email-safe stack: `Arial, Helvetica, sans-serif`.

---

## Colors

| Token name         | Hex       | Usage                                         |
|--------------------|-----------|-----------------------------------------------|
| Forest canopy      | `#064E3B` | Brand bar (4 px top), footer links, numbered badge fill |
| Data emerald       | `#10B981` | Supabase confirm CTA, step list accent circle |
| CTA green          | `#16A34A` | Email A primary button (workspace ready)      |
| Resume blue        | `#1D4ED8` | Email B & C primary button (magic link)       |
| Body text          | `#022C22` | All paragraph and heading text                |
| Muted / footer     | `#64748B` | Footer prose, supporting copy, step subtitles |
| Subtle muted       | `#94A3B8` | Legal / ignore lines, copyright               |
| Page background    | `#F9FAFB` | `<body>` and outer wrapper background         |
| Card surface       | `#FFFFFF` | Email card (header, body, footer cells)       |
| Card border        | `#E5E7EB` | Card border, internal dividers                |
| Info card bg       | `#F9FAFB` | Workspace detail card, step checklist bg      |
| Status badge bg    | `#ECFDF5` | "Workspace ready" badge background (Email A)  |
| Status badge border| `#6EE7B7` | "Workspace ready" badge border (Email A)      |
| Status badge text  | `#064E3B` | "Workspace ready" badge text (Email A)        |
| Divider subtle     | `#F1F5F9` | Internal section divider above footnote lines |

---

## Typography

| Property       | Value                             |
|----------------|-----------------------------------|
| Font stack     | `Arial, Helvetica, sans-serif`    |
| Heading H1     | 22 px, weight 700, line-height 1.3|
| Body           | 16 px, weight 400, line-height 1.5–1.6 |
| Small / meta   | 14 px, weight 400                 |
| Footnote       | 13 px, weight 400                 |
| Legal / muted  | 12–13 px, weight 400              |
| Label caps     | 13 px, weight 700, letter-spacing 0.04 em, uppercase |

---

## Spacing

| Token             | Value  | Where used                              |
|-------------------|--------|-----------------------------------------|
| Outer top/bottom  | 32 px  | `<body>` wrapper top and bottom padding |
| Outer left/right  | 16 px  | `<body>` wrapper side padding (mobile gutter) |
| Card content pad  | 36 px (top/bottom) × 32 px (sides) | Main body `<td>` |
| Footer pad        | 24 px (top/bottom) × 32 px (sides) | Footer `<td>` |
| Logo pad          | 28 px (top/bottom) × 32 px (sides) | Logo header `<td>` |
| Section gap       | 20–28 px | Margin-bottom between body paragraphs |
| Info card pad     | 16–20 px | Workspace detail card, checklist card  |
| Brand bar height  | 4 px   | Top accent bar                         |
| Button radius     | 6 px   | All CTA buttons                        |
| Button min-height | 44 px  | WCAG 2.5.5 tap target size             |
| Button padding    | 14 px (top/bottom) × 36 px (sides) | CTA `<a>` |

---

## Layout

| Property         | Value   |
|------------------|---------|
| Max width        | 600 px  |
| Mobile min width | 320 px  |
| Card border      | 1 px solid `#E5E7EB` |
| Card border-radius | 8 px top, 8 px bottom (via brand bar + footer cell) |
| Table method     | `role="presentation"`, `cellpadding="0"`, `cellspacing="0"` |

---

## Button contrast (WCAG AA check)

| Button         | Background | Text    | Contrast ratio |
|----------------|-----------|---------|----------------|
| CTA green (A)  | `#16A34A` | `#FFFFFF` | ~5.0 : 1 ✓   |
| Resume blue (B/C) | `#1D4ED8` | `#FFFFFF` | ~7.5 : 1 ✓ |
| Confirm emerald (Supabase) | `#10B981` | `#FFFFFF` | ~3.1 : 1 — acceptable for large bold text (18 px equiv) |

---

## Merge tags reference

| Tag                   | Emails  | Description                                     |
|-----------------------|---------|-------------------------------------------------|
| `{{firstName}}`       | A, B, C | Recipient first name                            |
| `{{organizationName}}`| A       | Organization name set in wizard                 |
| `{{country}}`         | A       | Country of operation                            |
| `{{roleLabel}}`       | A       | Importer / Exporter / Compliance manager / etc. |
| `{{loginUrl}}`        | A       | `https://dashboard.tracebud.com/login`          |
| `{{resumeUrl}}`       | B, C    | Magic link → `/create-account?resume=workspace` |
| `{{year}}`            | A, B, C | Current year (e.g. 2026)                        |
| `{{ .ConfirmationURL }}` | Supabase | Injected by Supabase Auth (Go template syntax) |

---

## Subject lines & preheaders

| Email  | Subject                                              | Preheader                                          |
|--------|------------------------------------------------------|----------------------------------------------------|
| A      | Welcome to Tracebud — your workspace is ready        | Continue onboarding for {{organizationName}}        |
| B      | Finish setting up your Tracebud workspace            | Pick up where you left off — about 2 minutes        |
| C      | Reminder: your Tracebud workspace is almost ready   | Complete setup in under 2 minutes                   |
| Supabase | Confirm your Tracebud account                      | Confirm your email address to activate your account |
