# Handoff: TL Engine (Thought-Leadership Dashboard)

## Overview
TL Engine is an internal Natural Intelligence tool that helps cast members ("Personal" mode) create thought-leadership content, and lets Directors ("Mastermind" mode) manage a cohort of cast members' content pipelines. It covers idea capture, drafting, humanizing/BS-checking posts, scheduling, engagement analytics, gamified streaks, and Director-side review/approval workflows.

## About the Design Files
The bundled file (`TL Engine Wireframes.dc.html`) is a **design reference built in HTML** — a single scrollable canvas of wireframe/UI screens laid out as labeled option cards (each with an id like `1d`, `3a`, `6b`). It is a prototype for visual and flow reference, **not production code to copy directly**. The task is to recreate these screens in the target codebase's existing environment (React, Vue, native, etc.), following its established component patterns, state management, and libraries — or, if no frontend environment exists yet, to choose the framework best suited to the project and implement the designs there.

`support.js` is a runtime helper used only to render the `.dc.html` file in its authoring tool; it is not application logic and should not be ported.

## Fidelity
**Mid-to-high fidelity wireframes.** Layout, spacing, navigation structure, copy, and component hierarchy are intentional and should be followed closely. Colors are directional (e.g., indigo for Personal chrome, navy for Mastermind chrome) rather than final brand hex values — apply the target codebase's real design tokens/colors where the wireframe uses a placeholder color. Icons are inline SVG placeholders referencing a shared `<symbol>` sprite (`#i-pen`, `#i-chart`, etc.) — swap for the target codebase's icon set.

## Screens / Views
The file is organized into two chronological turns, each containing multiple screen options (all viewable by scrolling/searching the id in the HTML):

**Turn 4 — Personal & shared flows** (ids in order): `1d` (login), `3a` (onboarding), `3e`, `3b`, `5c`, `5d`, `3d`, `5a` (personal dashboard — Create tab, incl. new Today's Tasks card and gamification hero), `1e`, `2a`, `1f`, `1g`, `1h`.

**Turn 5 — Mastermind & cross-cutting flows** (ids in order): `1i`, `1j`, `6b`, `3c`, `1k`, `6d`, `1l`, `6c`, `6a`, `1m`.

**New in this handoff — `1n`: Homescreen, Personal-only access.** Shown to a cast member who is not part of any Mastermind cohort. Layout: top bar (logo, search, bell, avatar) → greeting header with streak chip → two-card row (left: active "Personal View" entry card with stat tiles and CTA "Enter Personal View"; right: muted "No Mastermind cohort yet" empty-state card, explaining Mastermind is Director-only and cast members are added by a Director) → "Pick up where you left off" resume-cards row.

### Key components referenced throughout
- **Top bar** (`.top`): brand mark, product name, Personal/Mastermind view switcher (`.sw`/`.swi`), search, streak pill (flame icon + week count), bell icon, avatar circle. This exact set (including streak pill and bell) must appear identically on every Personal-mode screen.
- **Side nav** (`.side`): section label "My space", then nav items (`.nv`, active state `.nv on`) in fixed order — Create, Newsletter, Insights & Data, divider, Brain (with count pill), Core, Output, Milestones, then a bottom-pinned "Switch view" item. Sub-items (e.g. under Create or Insights & Data) are indented nav rows at 12.5px font.
- **Today's Tasks card**: title + "X of Y done" counter, checklist rows with a filled checkbox (checked, strikethrough label) or outlined checkbox (unchecked, bold label, optional "Due today" pill), footer "+ Add a task" ghost button. Appears on both Personal (indigo accent) and Mastermind (navy accent) homepages with mode-appropriate task content.
- **Gamification hero card**: streak count, badge grid, milestone progress bar.
- **Cards** (`.card`): white surface, rounded corners, used for stat tiles, empty states, and list rows throughout.

## Interactions & Behavior
- View switcher (`Personal` / `Mastermind`) in the top bar toggles the whole app chrome (indigo vs. navy) and the side-nav item set.
- Checklist items in Today's Tasks toggle checked/unchecked state; checking updates the "X of Y done" counter.
- Chat is a floating bubble that expands into a full window; supports approving/rejecting Director-authored drafts inline.
- Draft composer flags AI-sounding phrasing via inline "Humanizer" tips.
- Engagement Predictor shows a factor breakdown, a confidence range, and historical accuracy — not a single opaque score.
- Archive supports multi-select bulk actions and a permanent-delete confirmation step.

## State Management
- Current view mode: `personal | mastermind` (drives chrome color + side-nav set).
- Per-user streak count, task list with completion state, badge/milestone progress.
- Draft/post status pipeline (idea → draft → in review → scheduled → published → archived).
- Cohort membership: whether the signed-in user belongs to any Mastermind cohort (drives the `1n` empty state vs. the two-card entry screen).

## Design Tokens
This wireframe uses placeholder/directional values only. For production, use the attached **NI Deck Agent Design System** tokens (`colors_and_type.css`) instead of the values below:
- Personal chrome accent: indigo (`--a` in the wireframe, ~`#4d5cff`/`#3b48d6`)
- Mastermind chrome accent: navy
- Neutral text/borders: grays (`#6b6d7c`, `#8a8c99`, `#d4d4de`, `#e7e7ee`, `#f6f6f9`)
- Card radius: ~12–16px in the wireframe; use the design system's `--r-lg`/`--r-xl`/`--r-2xl` scale instead
- Font: wireframe uses "Inter Tight" as a placeholder; production should use the design system's **Google Sans** family

## Assets
All icons are inline SVG `<use>` references to a local `<symbol>` sprite defined in the same HTML file (search for `<symbol id="i-...">`) — placeholders only. No external images are used; avatar/photo slots are text-initial placeholders (e.g. "SH", "RM"). For production imagery, follow the design system's photography guidance (warm-toned portraits, rounded 46px corners, pink vertical bar trim).

## Files
- `TL Engine Wireframes.dc.html` — full wireframe set, all screens (main reference)
- `support.js` — authoring-tool runtime only, not app logic
