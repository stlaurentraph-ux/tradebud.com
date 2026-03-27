# Tracebud - AI Coding & Brand Guidelines

**Context:** Tracebud provides offline-first technology, satellite AI verification, and regulatory integration for global agricultural supply chains. The aesthetic is "High-Tech Organic."

**AI Directive:** When generating UI code for this project, you MUST strictly adhere to the design tokens, rules, and components defined in this document. Do not invent new colors, spacings, or font sizes.

---

## 1. Core Design Tokens

### 1.1 Colors
Never use raw hex codes in component code. Always use the predefined semantic variables (Tailwind classes for Web, Theme object for App).

**Brand Colors:**
- Primary / Forest Canopy: `#064E3B` (Use for headers, nav, primary text/icons)
- Action / Data Emerald: `#10B981` (Use for buttons, links, success states)
- Accent / Mountain Clay: `#78350F` (Use sparingly for warmth, alerts, agricultural context)
- Hover / Forest Light: `#065F46` (Use for secondary button hover)
- Hover / Emerald Light: `#34D399` (Use for primary button hover)
- Accent Light / Clay Light: `#92400E` (Use for deadline badges)

**Neutral & UI Colors:**
- Background: `#F9FAFB` (Page backgrounds)
- Foreground: `#1F2937` (Main body text, headings)
- Muted: `#6B7280` (Secondary text, captions)
- Border: `#E5E7EB` (Dividers, card borders)
- Surface/White: `#FFFFFF` (Cards, overlays)

### 1.2 Typography
**Fonts:**
- Primary: `Geist Sans` (UI, headings, body)
- Monospace: `Geist Mono` (Code, data tables, coordinates)

**Scale & Weights:**
- Hero (H1): Desktop 72-96px | Mobile 48-56px | Bold (700) | Leading 1.1
- Section (H2): Desktop 48-60px | Mobile 36-40px | Bold (700) | Leading 1.2
- Card Title (H3): Desktop 24-32px | Mobile 20-24px | Semibold (600) | Leading 1.3
- Body Large: Desktop 20-24px | Mobile 18-20px | Regular (400) | Leading 1.6
- Body: 16-18px | Regular (400) | Leading 1.6
- Caption: 14px | Regular (400) | Leading 1.5
- Button: 18-20px | Bold (700) | Leading 1.2

**Typography Rules:**
- Apply `text-balance` (web) to all H1, H2, and H3 elements.
- Max line length for body text is `75ch`.

---

## 2. Spacing & Layout System

**AI Directive:** Never use arbitrary padding/margin values. Stick to this 8px grid system.

- **Base Unit:** `8px` (Tailwind `2`)
- **Spacing Scale:**
  - `xs`: 4px (Tailwind `1`)
  - `sm`: 8px (Tailwind `2`)
  - `md`: 16px (Tailwind `4`) - Default gap for UI elements
  - `lg`: 24px (Tailwind `6`) - Standard container padding
  - `xl`: 32px (Tailwind `8`) - Section spacing
  - `2xl`: 48px (Tailwind `12`)
  - `3xl`: 64px (Tailwind `16`) - Loose page sectioning
- **Web Max Width:** Use `max-w-7xl` (1280px) for standard page containers, centered with `mx-auto`.
- **Mobile Safe Areas:** Always account for iOS/Android safe area insets on mobile app screens.

---

## 3. Component Guidelines

### 3.1 Buttons
- **Primary Button:** Background Data Emerald, Text Forest Canopy, Font Bold 18-20px, Padding 24px X / 28px Y, Border-radius Full (9999px). Hover: Lighter Emerald. Active (Press): Scale 0.98.
- **Secondary Button:** Background Forest Canopy, Text White, Font Bold 18-20px, Padding 24px X / 28px Y, Border-radius Full. Hover: Forest Light. Active (Press): Scale 0.98.
- **Outline Button:** Background Transparent, Border 2px White/60%, Text White, Border-radius Full. Hover: White/10% background.

### 3.2 Cards
- Background: White (`#FFFFFF`)
- Border: 1px solid UI Border (`#E5E7EB`)
- Border Radius: 24px (`rounded-3xl`)
- Padding: 24px to 32px
- Hover Effect: Scale up to `1.02` and increase shadow slightly.

### 3.3 Badges & Pills
- **EUDR Badge:** Mountain Clay background, White text, small bold.
- **Success/Verified:** Data Emerald background, White text.
- **Warning:** `#F59E0B` background, White text.
- **Pending:** `#F97316` text on subtle orange background.

---

## 4. Form Inputs & Controls

**Context:** Tracebud requires significant data entry for compliance. Forms must be highly legible and accessible.

- **Text Inputs / Selects:**
  - Background: White (`#FFFFFF`)
  - Border: 1px solid UI Border (`#E5E7EB`)
  - Border Radius: 12px (`rounded-xl` for web, 12px for native)
  - Padding: 16px horizontal, 14px vertical
  - Text: Body 16px, UI Foreground (`#1F2937`)
  - Placeholder: Muted (`#6B7280`)
- **Focus State:** 2px ring/border of Data Emerald (`#10B981`) with no outline. Do not use default blue browser focus rings.
- **Error State:** Border changes to Mountain Clay (`#78350F`) or a standard Red.
- **Labels:** Caption size (14px), Semibold, UI Foreground. Always place above the input.

---

## 5. Shadows & Elevation

**Web Tailwind Values:**
- **Level 1 (Cards/Buttons):** `shadow-sm` (Subtle depth)
- **Level 2 (Dropdowns/Hover):** `shadow-md` (Interactive lift)
- **Level 3 (Modals/Popovers):** `shadow-xl` (High elevation, floating above UI)

**React Native Shadows:**
- Use a standard black shadow (`#000000`) with very low opacity (`0.05` to `0.1`).
- Card Elevation: `shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2`

---

## 6. Data Display & Tables

- **Tables:** White background, rounded corners (16px), 1px UI Border. Table headers should use Muted text (`#6B7280`), 14px, uppercase, tracking-wider.
- **Dividers:** Always use UI Border (`#E5E7EB`), 1px thickness.
- **Loading States:** Prefer subtle pulsing skeleton screens (Background `#F9FAFB` to `#E5E7EB`) over continuous spinning circles for data-heavy sections.

---

## 7. Motion & Animation

- **Durations:** Fast/UI: `300ms`, Slow/Transitions: `500ms`.
- **Easing:** `ease-out` for entrances, `ease-in` for exits.
- **Interactions:** Hover states scale `1.02`, click/press states scale `0.98`.

---

## 8. Web Implementation Rules (Tailwind & React/Next.js)

When writing code for the Web application:
1. Always use Tailwind CSS utility classes based on the extended config.
2. Prefix custom brand colors with `brand-` (e.g., `bg-brand-emerald`, `text-brand-forest`).
3. Prefix UI colors with `ui-` (e.g., `bg-ui-background`, `text-ui-foreground`, `border-ui-border`).
4. Use `clamp()` values for responsive typography to avoid excessive media queries.
5. Use Lucide React (`lucide-react`) for icons unless otherwise specified.

---

## 9. Mobile App Implementation Rules (React Native)

When writing code for the offline-first Mobile application:
1. Never use DOM elements (`div`, `span`, `p`). Always use React Native primitives (`View`, `Text`, `Pressable`, `Image`).
2. Do not use Tailwind class names unless NativeWind is explicitly configured. Use standard `StyleSheet.create()` or a defined Theme object.
3. Use `Pressable` instead of `TouchableOpacity` to implement the `0.98` scale down on press using the `pressed` state boolean.
4. Ensure all text components explicitly declare `fontFamily: 'GeistSans-Regular'` (or Bold/SemiBold), as React Native does not cascade fonts easily.
5. Minimum tap target size must be 48x48px for accessibility.

---

## 10. Tone & Copywriting Directives

If asked to generate placeholder text, copy, or UI messaging:
- **Tone:** Confident, Technical but Accessible, Action-Oriented.
- **Rules:** Lead with verbs (e.g., "Map Your Plot", not "Plot Mapping"). De-risk the language (focus on security, compliance, offline capabilities).
- **Target Audiences:** Keep farmer-facing UI extremely simple. Keep enterprise/exporter dashboards data-rich and efficient.