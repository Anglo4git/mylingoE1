# Agent 139 — iPhone/Safari UX Hardening Handoff

## Baseline
Continued from `MYLINGO_AGENT138_FINAL_HARDENING.zip`.
Canonical release identity remains **v118**; no release tag was changed.

## Changes
- Hardened the fullscreen lesson player for iPhone Safari:
  - Increased bottom document clearance so the fixed Back/Continue player controls cannot cover the final lesson content, including the practice slide.
  - Added `touch-action: manipulation` to lesson chapter/slide trail controls for more reliable touch interaction.
  - Added native `<video playsinline>` so direct media can play inline on iPhone instead of forcing an unnecessary fullscreen transition.
- Rebuilt `offline/packs/core.zip` from the canonical `offline/core-manifest.json` after the lesson-player change; all 85 manifest files now match the packaged bytes exactly.

## Verification
- All standalone JavaScript files: `node --check` PASS (22/22).
- All JSON files: parse PASS.
- Placement bank: 120 questions — exactly 40 A1 / 40 A2 / 40 B1; 120 unique IDs.
- Placement-120 behavioral regression: PASS:
  - all correct -> B1
  - A1 mastery only -> A2
  - all incorrect -> A1
- Core offline package: 85/85 files present, no extras, and every ZIP entry matches its source file byte-for-byte.
- Lesson player UX heuristics: PASS for safe-area bottom clearance, touch manipulation, native `playsinline`, and YouTube `playsinline=1`.
- Responsive course cards/actions: PASS; normal-width actions remain one row and wrap at ≤360px.
- Quiz mobile options: PASS; choice options collapse to one column at ≤620px.
- Shared dark-mode theme contract: PASS (`prefers-color-scheme: dark` plus dark token overrides).
- CSS brace balance: PASS for all CSS files.
- No remaining `Practice again` course-list CTA; the only remaining text occurrence is historical wording in the Agent 138 handoff itself.

## Browser limitation
A real iPhone/Safari device interaction pass is still **not executable in this environment**. No real-browser PASS is claimed. Static and runtime-contract checks were used instead.

## Exact manual deployment checks remaining
On the target iPhone/Safari:
1. Toggle system Dark Mode and inspect course cards, course/unit pages, placement, and quiz result text/controls for contrast.
2. Open a multi-chapter lesson and tap each reached trail item plus Back/Continue.
3. Play every shipped native audio/video item; confirm direct video remains inline and YouTube video opens/plays correctly.
4. Rotate/narrow the viewport and verify course cards remain readable and action buttons wrap only at very narrow widths.
5. Start the 120-question placement assessment, close/reopen if applicable, resume, answer through question 120, and confirm the A1/A2/B1 result and Continue action.

## Packaging
Root contents are packaged directly; do not add an enclosing `site/` directory.
