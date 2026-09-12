# Personal UI/UX & Branding Style Guide

*Frozen from the Mylingo project — reusable on future projects.*

> **One conflict was found and resolved before freezing this.** Mylingo's landing
> hub used brand blue (`#1959d1`) throughout, but the quiz-taking screen had
> inherited a leftover Duolingo-style green (`#58cc02`) as its "primary" color for
> buttons, the logo mark, and the progress bar — a real inconsistency, not a
> stylistic choice. This guide resolves it: **blue is the one brand primary.**
> Green and red are kept, but demoted to *semantic* colors only (correct/incorrect
> feedback) — never used for buttons, logos, or brand chrome. Apply this guide as
> written and that conflict won't reappear.
>
> **Status in this codebase:** applied. See `DESIGN_SYSTEM_APPLIED.md` for the
> exact file-by-file changes made to `site/` to bring it in line with this guide.

---

## 1. Color

### Brand (use for everything identity-related: buttons, logo, links, active states, badges)

| Token | Hex | Use |
|---|---|---|
| Brand primary | `#1959d1` | Buttons, logo mark, active nav, links, primary badges |
| Brand primary (pressed/dark) | `#0e45ae` | Button "3D press" shadow, pressed states |

### Semantic (status only — never for branding/buttons/logos)

| Token | Hex | Use |
|---|---|---|
| Success | `#58cc02` | Correct-answer state only |
| Success (dark) | `#46a302` | Correct-answer shadow/accent only |
| Success soft bg | `#e9f8df` / `#effbe9` | Correct-answer background fill only |
| Error | `#ff4b4b` | Wrong-answer state only |
| Error soft bg | `#fff0f0` | Wrong-answer background fill only |
| Error text | `#a52626` | Wrong-answer/error text only |

### Neutrals

| Token | Hex | Use |
|---|---|---|
| Ink (primary text) | `#17202b` | Body text, headings |
| Muted text | `#687386` | Secondary text, captions |
| Line/border | `#e6eaf0` | Borders, dividers |
| Page background | `#f7f9fc` | App background |
| Card background | `#ffffff` | Cards, modals |

**Rule:** if a color decision is about *brand identity*, it's blue. If it's about
*feedback on an action*, it's green (good) or red (bad). Never mix the two roles.

---

## 2. Typography

- **Font stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` — no custom/loaded fonts. System-native, fast, no FOUT.
- **Headline (h1 / hero):** `clamp(40px, 6vw, 66px)`, letter-spacing `-3px`, line-height `1.02`. Tight, large, confident.
- **Section heading (h2):** `26px`, letter-spacing `-1px`.
- **Splash wordmark:** `clamp(60px, 12vw, 110px)`, **font-weight 780** (not 900 — a slightly lighter weight reads as calmer/more premium at that size), letter-spacing `-1px` (not tighter — tight tracking at huge sizes looks cramped, not confident).
- **Body:** default weight, `var(--ink)` color.
- **Labels/badges/buttons:** heavy weight (800–900), never regular weight — small bold text reads as more "app-like" than small regular text.

**Rule:** the bigger the text, the tighter the letter-spacing — *except* the splash wordmark, which gets slightly opened-up spacing on purpose (overly tight spacing at that size looked aggressive, not calm).

---

## 3. Shape & Elevation

- **Buttons, badges, chips, pills:** `border-radius: 999px` (full pill) — always, no exceptions.
- **Cards:** `border-radius: 20–24px`.
- **Logo mark / icon boxes:** `border-radius: 24–25px` (large but not full pill — a squircle, not a circle).
- **Card shadow:** soft, low-opacity, no hard edges — e.g. `0 5px 20px rgba(23,32,43,0.05)` or `0 10px 30px rgba(23,33,43,.08)`.
- **Primary button "3D press" effect:** a solid offset shadow in the darker brand shade, e.g. `box-shadow: 0 5px 0 #0e45ae`, giving a tactile, pressable look (Duolingo-style). Pair with `:active { transform: translateY(2px); box-shadow: none }` if interactivity is added.
- **Borders:** thin (1–2px), always the neutral `--line` color, never a brand color (brand color is for fills/text, not hairline borders).

---

## 4. Motion

- **Standard easing:** `cubic-bezier(.4, 0, .2, 1)` — the one curve used everywhere. Don't introduce a second easing curve in the same product.
- **Standard durations:** 120ms (micro, e.g. option press) → 160-220ms (content swap) → 260-320ms (page/view transitions). Nothing slower than ~320ms — motion should never make the user wait.
- **Page-to-page navigation** (e.g. opening a quiz/detail page): fade + scale, not just fade. Outgoing page: fade to 0 opacity + scale down to ~0.94. Incoming page: starts at scale ~1.04 opacity 0, animates to scale 1 opacity 1.
- **In-app layered navigation** (e.g. drilling into a category): directional slide — forward navigation slides the new view in from the right (~18px) while the old view exits slightly left; backward reverses it. Always pair with `history`/back-button integration.
- **Edge-swipe-back (touch):** only activate from within ~28px of the screen edge, live-follow the finger, commit past a threshold (~90px) or snap back below it. Hand off to the *same* navigation function the Back button uses.
- **Correct-answer feedback:** a quick "grow" animation (scale 1 → 1.045 → 1), ~550-600ms, bouncy easing (`cubic-bezier(.2,.85,.25,1.2)`).
- **Wrong-answer feedback:** a quick shake, ~350ms.
- **Always respect `prefers-reduced-motion: reduce`** — skip transforms entirely and use instant or opacity-only changes. Every transition should have a reduced-motion fallback.

---

## 5. Iconography

- **Style:** simple line icons only — stroke `currentColor`, `stroke-width: 2`, `fill: none`, `stroke-linecap/linejoin: round`. No filled icons, no two-tone, no custom icon font.
- **Source of truth for shapes:** Lucide/Feather-style minimalist icon set (document, grid, bar-chart, target/circle, expand/maximize, etc.). Avoid Unicode symbol characters (⌂ ▤ ◫ ◉) as icons.
- **Sizing in a bottom nav bar:** icon leads, label follows — icon ~24-25px, label ~9px/700 weight beneath it.

---

## 6. Copy & Voice

- **No em dashes.** Use a period, colon, or middot (`·`) instead — a strong "AI-generated" tell to remove everywhere, including code comments.
- **No hedging/over-explaining copy.** Say what a real, popular app would say: short, confident, benefit-first. ("Your results are saved automatically." / "You're all set. Let's practice!")
- **Middot (`·`) as the default separator** for compact multi-part labels ("Mylingo · Free forever · Practice anywhere"), not em dash or pipe.
- **Error/empty states get real information, not a dead end.** Say specifically what went wrong and what to check next — never a bare "Something went wrong."

---

## 7. Layout Patterns

- **Splash/launch screen:** logo mark + wordmark *only*. No tagline, no "tap to continue" button. Let it be seen for ~1.5s and move on.
- **Bottom mobile navigation:** icon-only-led, 4 items max, no "Home" item if the brand mark elsewhere already serves as a home button.
- **Progressive disclosure over dashboards:** show one meaningful layer at a time (e.g. Home → Category → Quiz), not everything at once.
- **Rich content cards** (e.g. quiz cards) should front-load scannable metadata (title, level, category, count, status badge) so the user can decide before tapping in.
- **Focus/immersive mode:** offer a clearly-labeled way to enter a distraction-free mode alongside the primary action — don't let it compete visually with the primary CTA.

---

## 8. Interaction Details Worth Repeating

- **Primary button = 1 per screen**, pill-shaped, brand blue, 3D-press shadow, horizontally centered on its own line (not sharing a row with a secondary action).
- **Secondary/utility buttons:** flat gray fill (`#f1f3f5`), pill-shaped, icon + label, clearly subordinate to the primary button (no drop shadow).
- **Content sanitization** for user/teacher-authored rich text: allow a small safe tag set (`<br> <p> <span> <strong> <em> <b> <i> <u> <mark> <sub> <sup>`), strip all attributes, unwrap or remove everything else.
- **Debounce expensive input-driven work** (e.g. fuzzy search) by ~120ms.

---

## How to apply this to a new project

1. Set the two brand color tokens (primary + pressed) and the neutral palette from Section 1 as CSS custom properties on `:root` — first thing, before any component work.
2. Reuse the exact easing curve and duration scale from Section 4 rather than picking new ones per project.
3. Pull icons from the same line-icon convention (Section 5) so a new project's icons never clash in style with this one.
4. Run new copy through the checks in Section 6 before shipping it.
5. If a project already has an inherited/legacy color scheme (as Mylingo's quiz engine did), audit for the brand-vs-semantic conflict described at the top of this doc before freezing anything — don't assume consistency, verify it.
