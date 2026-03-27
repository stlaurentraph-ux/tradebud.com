# Tracebud Brand Guidelines

**Version 1.0** | March 2026

---

## Brand Overview

### Mission Statement
Tracebud provides the fastest, safest, and most affordable pathway for smallholder production to enter EUDR and ESG-compliant markets. We de-risk global agricultural supply chains through offline-first technology, satellite AI verification, and seamless regulatory integration.

### Brand Essence
**"High-Tech Organic"** — Where cutting-edge digital infrastructure meets the raw authenticity of agricultural landscapes and the people who cultivate them.

### Tagline
**One Map. One Passport. Every Market.**

### Brand Personality
- **Trustworthy** — Built for compliance, security, and transparency
- **Accessible** — Simple enough for any farmer, powerful enough for enterprises
- **Grounded** — Rooted in real agricultural landscapes and communities
- **Innovative** — Leveraging satellite AI, offline-first tech, and blockchain-ready architecture

---

## Color Palette

### Primary Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Forest Canopy** | `#064E3B` | 6, 78, 59 | Primary brand color, headers, CTAs, navigation |
| **Data Emerald** | `#10B981` | 16, 185, 129 | Accent highlights, success states, interactive elements |
| **Mountain Clay** | `#78350F` | 120, 53, 15 | Secondary accent, warmth, agricultural authenticity |

### Secondary Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Forest Light** | `#065F46` | 6, 95, 70 | Hover states, secondary buttons |
| **Clay Light** | `#92400E` | 146, 64, 14 | Warm accents, deadline badges |

### Neutral Palette

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Background** | `#F9FAFB` | Page backgrounds, light sections |
| **Foreground** | `#1F2937` | Body text, headings |
| **Muted** | `#6B7280` | Secondary text, captions |
| **Border** | `#E5E7EB` | Dividers, card borders |
| **White** | `#FFFFFF` | Cards, overlays, clean backgrounds |

### Color Usage Rules
1. **Forest Canopy** is the dominant brand color — use for headers, navigation, and primary CTAs
2. **Data Emerald** is the action color — use for buttons, links, and success indicators
3. **Mountain Clay** adds warmth — use sparingly for alerts, deadlines, and agricultural contexts
4. Never use more than 3 colors in a single component
5. Maintain WCAG AA contrast ratios (4.5:1 for body text, 3:1 for large text)

---

## Typography

### Font Family

**Primary Font:** Geist Sans
- Clean, modern sans-serif optimized for digital interfaces
- Used for all headings, body text, and UI elements

**Monospace Font:** Geist Mono
- Used for code snippets, data displays, and technical information

### Type Scale

| Element | Size (Desktop) | Size (Mobile) | Weight | Line Height |
|---------|----------------|---------------|--------|-------------|
| H1 (Hero) | 72–96px | 48–56px | Bold (700) | 1.1 |
| H2 (Section) | 48–60px | 36–40px | Bold (700) | 1.2 |
| H3 (Card Title) | 24–32px | 20–24px | Semibold (600) | 1.3 |
| Body Large | 20–24px | 18–20px | Regular (400) | 1.6 |
| Body | 16–18px | 16px | Regular (400) | 1.6 |
| Caption | 14px | 14px | Regular (400) | 1.5 |
| Button | 18–20px | 16–18px | Bold (700) | 1.2 |

### Typography Rules
1. Use `text-balance` or `text-pretty` for headlines to ensure optimal line breaks
2. Maximum line length: 75 characters for body text
3. Minimum body text size: 16px
4. Always use sufficient contrast — dark text on light backgrounds, white text on dark overlays

---

## Logo

### Logo Composition
The Tracebud logo consists of two elements:
1. **Icon Mark:** A stylized leaf emerging from a map pin, symbolizing the intersection of agriculture and geolocation technology
2. **Wordmark:** "Tracebud" in Geist Sans Bold

### Logo Colors
- **Icon:** Dual-tone green (Data Emerald leaf + Forest Canopy pin base)
- **Wordmark:** Forest Canopy (#064E3B) on light backgrounds, White (#FFFFFF) on dark backgrounds

### Logo Variations
| Variant | Usage |
|---------|-------|
| Full Logo (Icon + Wordmark) | Primary use in headers, marketing materials |
| Icon Only | Favicons, app icons, social media profiles |
| Monochrome White | Dark backgrounds, overlays |
| Monochrome Dark | Light backgrounds, print materials |

### Clear Space
Maintain clear space around the logo equal to the height of the leaf element on all sides.

### Minimum Size
- Full logo: 120px width (digital), 30mm (print)
- Icon only: 32px (digital), 8mm (print)

### Logo Don'ts
- Do not rotate or skew the logo
- Do not change the logo colors outside the approved palette
- Do not add effects (shadows, gradients, outlines)
- Do not place on busy backgrounds without sufficient contrast

---

## Imagery

### Photography Style
**"Authentic Agricultural Technology"**

Images should convey the intersection of traditional farming and modern digital tools.

### Image Categories

#### 1. Hero/Landscape Imagery
- Aerial drone shots of farmland showing clear polygon boundaries
- Golden hour lighting preferred
- Show the contrast between cultivated land and natural forest
- Examples: Coffee plantations, cocoa farms, terraced hillsides

#### 2. People Imagery
- Real farmers and agricultural workers in their environment
- Show technology usage in context (smartphones, tablets)
- Diverse representation across producing regions
- Authentic, unposed moments preferred over staged shots

#### 3. Commodity Imagery
- Close-up shots of coffee cherries, cocoa pods, rubber trees
- Processing and export facilities
- Quality control and sorting operations

#### 4. Infrastructure Imagery
- Container ports and shipping logistics
- Warehouse operations
- Digital dashboards and interfaces

### Image Treatment
- Use dark gradient overlays (`from-black/70` to `transparent`) for text legibility on hero images
- Maintain color temperature consistency — warm, natural tones
- Avoid over-saturated or heavily filtered images

### Stock Photo Sources
- Prioritize authentic, high-resolution photography
- Preferred: Images from actual producing regions (Honduras, Colombia, Ghana, Ivory Coast, Indonesia)

---

## UI Components

### Buttons

#### Primary Button
```
Background: Data Emerald (#10B981)
Text: Forest Canopy (#064E3B)
Font: Bold, 18-20px
Padding: 24px horizontal, 28px vertical
Border Radius: Full (rounded-full)
Hover: Lighter emerald (#34D399)
```

#### Secondary Button
```
Background: Forest Canopy (#064E3B)
Text: White (#FFFFFF)
Font: Bold, 18-20px
Padding: 24px horizontal, 28px vertical
Border Radius: Full (rounded-full)
Hover: Forest Light (#065F46)
```

#### Outline Button
```
Background: Transparent
Border: 2px White/60%
Text: White
Hover: White/10% background
```

### Cards
- Background: White with subtle shadow
- Border Radius: 24px (rounded-3xl)
- Padding: 24-32px
- Hover: Slight scale (1.02) and shadow increase

### Navigation
- Fixed header with transparent-to-solid transition on scroll
- Scrolled state: White background with Forest Canopy text
- Mobile: Full-screen overlay menu with Forest Canopy background

### Badges/Pills
```
EUDR Badge: Mountain Clay background, white text
Status Badge (Success): Data Emerald background
Status Badge (Warning): Amber/Yellow background
Status Badge (Pending): Orange text
```

---

## Voice & Tone

### Brand Voice Characteristics

| Attribute | Description | Example |
|-----------|-------------|---------|
| **Confident** | State capabilities clearly without hedging | "De-risk your supply chain" not "Help reduce supply chain risk" |
| **Technical but Accessible** | Use industry terms but explain when needed | "Waypoint averaging filters GPS errors" |
| **Action-Oriented** | Lead with verbs and outcomes | "Start Mapping" not "Learn More" |
| **Empowering** | Position users as capable, technology as enabling | "Own your data. Access any market." |

### Messaging Hierarchy

#### Tier 1: Taglines & Headlines
- Short, punchy, memorable
- Focus on transformation and outcomes
- Examples: "One Map. One Passport. Every Market."

#### Tier 2: Value Propositions
- Feature + Benefit structure
- Speak to specific user pain points
- Examples: "Offline-first mapping works without internet. Your data syncs when connectivity returns."

#### Tier 3: Technical Details
- Precise specifications for technical audiences
- Include standards and integrations
- Examples: "WGS84 coordinates with HDOP logging, GeoJSON export, TRACES NT integration"

### Tone by Audience

| Audience | Tone | Focus |
|----------|------|-------|
| Farmers | Simple, empowering, practical | Data ownership, easy workflow, market access |
| Exporters | Professional, efficiency-focused | Batch management, compliance automation, speed |
| Importers | Sophisticated, risk-aware | Liability protection, audit-readiness, transparency |
| Countries | Formal, sovereignty-respecting | DPI infrastructure, data ownership, standards |

---

## Motion & Animation

### Principles
- **Purposeful:** Animation guides attention, not decorates
- **Subtle:** Transitions should feel natural, not flashy
- **Consistent:** Same easing curves and durations throughout

### Standard Values
```
Duration: 300-500ms for UI transitions
Easing: ease-out for entrances, ease-in for exits
Stagger: 100-200ms delay between sequential elements
```

### Common Animations
- **Page load:** Fade up with slight Y translation (30px → 0)
- **Scroll reveal:** Fade in with scale (0.95 → 1)
- **Hover:** Scale 1.02-1.05 with shadow increase
- **Button press:** Scale 0.98

---

## Application Examples

### Website Header
- Logo (left): Icon + Wordmark
- Navigation (center): Solutions dropdown, Technology, Compliance, Partners
- CTA (right): "Try the App" button in Data Emerald

### Hero Section
- Full-bleed agricultural imagery
- Dark gradient overlay for text contrast
- EUDR deadline badge in Mountain Clay
- Main headline in white with Data Emerald accent
- Dual CTAs: Primary (emerald) + Secondary (outline)

### Feature Cards
- White background with rounded corners
- Category icon in colored circle
- Bold title + descriptive subtitle
- Hover state with subtle lift

### Footer
- Forest Canopy background
- White text
- Logo + tagline
- Navigation links grouped by category
- Social icons

---

## File Formats & Assets

### Logo Files
- SVG (vector, scalable)
- PNG (transparent background, 2x resolution)
- Favicon set (16x16, 32x32, 180x180 for Apple)

### Image Specifications
- Hero images: 2000px minimum width, WebP or optimized JPEG
- Card images: 800px width, aspect ratios 16:9 or 4:3
- App screenshots: PNG with transparency where applicable

### Color Formats
- Web: Hex codes or CSS custom properties
- Print: CMYK conversions required for professional printing
- Digital design tools: RGB values

---

## Contact

For brand questions, asset requests, or partnership inquiries:

**Tracebud**
Website: tracebud.com
Email: brand@tracebud.com

---

*These guidelines ensure consistent, professional representation of the Tracebud brand across all touchpoints. When in doubt, prioritize clarity, authenticity, and trust.*
