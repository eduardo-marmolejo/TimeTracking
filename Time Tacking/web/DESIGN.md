---
name: Precision Chronometry
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002114'
  on-tertiary-container: '#069669'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  mono-timer-lg:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.02em
  mono-timer-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  mono-timer-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3rem
  space-xxs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2.5rem
---

## Brand & Style

The design system is engineered for modern SaaS project time-tracking, operational velocity, and meticulous resource accounting. Built for engineering leads, product designers, and technical agencies who demand clarity over decoration, the interface evokes focus, calm command, and surgical precision. 

The aesthetic is a high-craft fusion of **Minimalism** and **Tactile Precision**, taking direct structural cues from toolsets like Linear and Notion:
- **Atmosphere:** Distraction-free, dense without feeling cramped, and structurally dependable. 
- **Surfaces:** Pure, intentional transitions from tinted off-white canvas foundations into crystalline pure-white functional surfaces.
- **Micro-Details:** Hairline boundaries, monochromatic weight distribution, crisp tabular metadata, and muted confirmation states.
- **Emotional Output:** Unhurried competence, operational flow, and effortless accountability.

## Colors

The palette employs a restrained, structural light-mode composition where values dictate hierarchy rather than pure hue:

- **Canvas & Backgrounds:** The base canvas lives on an engineered slate tint (`#f8fafc`), giving elevation immediately to active working surfaces which sit on crisp white (`#ffffff`).
- **Primary (`#0f172a` Slate 900):** The voice of absolute certainty. Applied to primary text, active status ticks, dominant call-to-actions, and structural icon elements.
- **Secondary (`#4f46e5` Indigo 600):** Targeted focal points. Used for active running timers, interactive focus rings, primary selection toggles, and live-tracking pulses.
- **Tertiary / Success (`#059669` Emerald 600):** Functional validation. Utilized exclusively for billable milestones, finalized entries, positive budget variances, and synced time blocks.
- **Neutrals & Boundaries:** Subtle divider boundaries (`#e2e8f0` Slate 200) anchor items into a unified grid. Muted metadata relies on Slate 500 (`#64748b`), while structural iconography operates between Slate 400 and 700.

## Typography

Typography prioritizes information density, legibility, and proportional cadence. **Inter** acts as the core interface voice, configured with optical kerning and tight tracking on all display roles to achieve the compact, confident feel typical of modern productivity tools.

Key implementations:
- **Numerical Regularity:** All durations, timestamps, hourly rates, and invoice values strictly render via **JetBrains Mono** or Inter with enabled `font-feature-settings: "tnum" on, "cv05" on, "cv11" on`. This eliminates optical shifting during active stopwatch sessions.
- **Section & Header Tokens:** Column labels and project tags leverage `label-caps` in uppercase format with wide tracking (`0.04em`) to establish visual boundaries over time logs without visual clutter.
- **Mobile Density:** Headline scale clamps naturally down to `20px` on mobile breakpoints to preserve tabular workspace and avoid awkward line wraps in project titles.

## Layout & Spacing

The layout philosophy utilizes an adaptable fluid-grid system governed by an uncompromising 4px/8px micro-metric base. 

- **Grid Architecture:** 
  - Standard viewport runs a 12-column fluid grid across desktop devices (min-width: 1024px) capped at a maximum functional content container of `1440px`.
  - Tablet environments (768px - 1023px) compress to 8 columns with `1.5rem` outer gutters.
  - Mobile viewports (< 768px) drop to a 4-column flow with continuous `1rem` edge margins and consolidated vertical stacking.
- **Spacing Cadence:** Micro padding (`space-xs` to `space-sm`) separates interrelated data within active log rows. Structural gaps between distinct time sheets and analytical summary widgets leverage `space-xl` through `space-2xl`.
- **Row Architecture:** Daily logs and timeline records employ a fixed vertical height system (36px compact, 44px standard) ensuring seamless keyboard navigation and high row scanability.

## Elevation & Depth

Visual hierarchy abandons deep fuzzy drop shadows in favor of **low-contrast outlines** and **subtle ambient occlusion**:

- **Hairline Framework:** Depth begins at ground level through 1px crisp borders (`border-slate-200` / `#e2e8f0`). Cards sit directly on the off-white canvas with this border as their primary separator.
- **Ambient Shadow Layering:**
  - *Base Surface (Cards, Table Containers):* `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
  - *Interactive Popovers / Dropdowns:* `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
  - *Modal Overlays / Floating Timer Widgets:* `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`.
- **Interactive State Transitions:** Hovering over row items or modular cards does not lift the element in 3D space; it triggers an internal hairline tint shift (`#cbd5e1`) and a background shift to pure white (`#ffffff`).

## Shapes

The design system adopts a **Soft (Level 1)** geometric standard. This geometry strikes a deliberate middle ground between technical precision and tactile accessibility:

- **Interactive Nodes:** Form controls, action buttons, table filters, and input rows utilize a calibrated `0.25rem` (4px) corner radius.
- **Structural Modules:** Elevated cards, modal dialogs, and slide-out time audit panels utilize `rounded-lg` (`0.5rem` / 8px).
- **Exceptions:** Status pill tags and live stopwatch indicator pills employ full circular caps (`rounded-full` / 9999px) to contrast against rectangular data blocks and denote live states instantly.

## Components

### Buttons
- **Primary Action (Start Timer / Save Log):** Slate 900 background, white text, 4px radius, subtle bottom inner rim (`inset 0 -1px 0 rgba(255,255,255,0.12)`). Height: 32px (compact) or 38px (standard).
- **Secondary Action:** White background, 1px `#e2e8f0` border, Slate 700 text. Hover state transforms the border to `#cbd5e1` with background `#f8fafc`.
- **Active State (Timer Running):** Indigo 600 background, crisp white mono counter, pulsing Emerald 500 status beacon.

### Inputs & Time Formats
- **Inline Time Inputs:** Flat borderless fields that activate a 1px Indigo 600 ring on focus. Direct support for quick-entry parsing (`1h 30m`, `1.5`, `09:00-10:30`).
- **Standard Text Fields:** 1px `#e2e8f0` border, Slate 900 input value, Slate 400 placeholder, transition on focus to `#4f46e5` ring with 1px border.

### Chips & Badges
- **Project Identifiers:** Compact horizontal tags with a 6px colored indicator dot representing client or project identity. Background `#f1f5f9`, Slate 700 text, 4px radius.
- **Billable / Finalized Badge:** Light emerald wash (`#ecfdf5`), Emerald 700 text, subtle border (`#a7f3d0`), tabular font styling.

### Lists & Row Entries
- **Time Entries:** Edge-to-edge layout, separated by single-pixel horizontal rules (`#f1f5f9`). Left-aligned project/task metadata, right-aligned tabular duration and actionable edit triggers. 
- **Keyboard Selection:** `data-[selected=true]` triggers an Indigo 50 background wash with a left vertical 2px accent indicator.

### Checkboxes & Radios
- Small, geometric 14px boxes with 3px corners. Checked state fills with Slate 900 bearing a razor-thin white stroke checkmark.

### Cards & Grouping Surfaces
- Clean white surface (`#ffffff`), bounded by 1px `#e2e8f0`, holding an explicit 16px to 20px interior padding (`space-lg`). Card headers maintain hairline bottom dividers with muted metric labels.

### Floating Global Timer Bar
- Persistent bottom or top-anchored drawer. Semi-opaque white glass surface (`backdrop-blur-md bg-white/95`), housing an active mono timestamp, task description bar, project picker pill, and instant pause/stop keys.