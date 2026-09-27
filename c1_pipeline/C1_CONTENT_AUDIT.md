# C1 CONTENT AUDIT
# Agent 4 — Content Auditor. Input: C1_SAMPLE_QUIZZES.md (Agent 3),
# C1_LESSON_DRAFTS.md (Agent 2), C1_CURRICULUM_MAP.md,
# C1_CURRICULUM_ISSUES.md, CURRICULUM_SOURCE.md.
# Per MASTER_C1_HANDOFF.md section 10: audit content, produce this report,
# then STOP for the human approval gate. Does not integrate or ship
# anything.

## 1. STRUCTURAL VALIDATION
- 47/47 lessons have a matching quiz (16 grammar + 17 vocabulary/topical +
  14 functional) — full 1:1 coverage of C1_LESSON_DRAFTS.md.
- 235/235 questions present (5 per quiz), each with exactly one marked
  answer, 4 options.
- Quiz order and numbering (G1–G16, V1–V17, F1–F14) matches the lesson
  draft order exactly, so cross-referencing between the two files is
  straightforward for any later reviewer.

## 2. OVERLAP / "DEEP-DIVE NOT REPEAT" CHECK
Cross-checked every quiz flagged in C1_LESSON_DRAFTS.md as building on
lower-level content, confirming the quiz tests only the new C1 ground:

| Lesson | Claimed new ground | Quiz tests it? | Notes |
|---|---|---|---|
| G7 Participles | Reduced participle clauses, not -ed/-ing adjectives | Yes | Q5 explicitly asks what is NOT retested |
| G9 Ellipsis/elision | Elision (sound omission), not ellipsis (word omission) | Yes | Q5 is an explicit scope-check item |
| G10 Question tags | Intonation meaning + formal register, not tag formation | Yes | Q5 names the assumed-known content |
| G12 Relative clauses | Formal preposition-fronting, not defining/non-defining | Yes | Q5 names B2 content assumed known |
| G13 Mixed conditionals | "If"-free alternatives, not the mixed-conditional forms | Yes | Q4/Q5 both flag this; Q4 is slightly awkward (see 4.1) |
| G14 Passive | Reporting passive + "get" passive, not basic passive | Yes | Q5 names B2 content assumed known |
| G15 Inversions | Broader adverbials, explicitly excluding "Only" | Yes | Q4 directly tests that "Only" is excluded |
| G16 Reported speech | Free indirect style + attitude verbs, not B1/B2 basics | Yes | Q5 names assumed-known content |
| F5 Opinions register | Formal/informal axis, not strength (B2) | Yes | Q4/Q5 both make the distinction explicit |
| F6 Checking/clarifying | Checking side, not B2's giving-clarification | Yes | Q3/Q5 both name the B2 contrast |
| F8 Expanding | Expanding, not B2's example-only "Giving examples" | Yes | Q4/Q5 both make the distinction, Q5 uses a discriminating example |
| F10 Speculating | Formal/analytical register, not B2's everyday guessing | Yes | Q5 gives a genuine discriminating pair (formal vs. casual phrasing) |
| F12 Regrets | Hindsight framing, not B2's direct "I regret.../I wish" | Yes | Q5 discriminates correctly between the two phrasings |

**Result:** all 13 flagged overlap lessons pass — no quiz re-tests
lower-level content its own lesson says is already known.

## 3. F3 / F14 "DESCRIBING" DUPLICATE CHECK
Per C1_CURRICULUM_ISSUES.md issue 7, F3 and F14 need to be verifiably
distinguishable, not just described as distinguishable.
- F3's five questions all center on general concepts/processes/places
  ("the sheer scale of the place," "a simplified version of the...
  process"). None use a person as the subject.
- F14's five questions all center on people, objects, and situations
  (a person's character, an object's "quality," a room's atmosphere).
  None use an abstract concept or process as the subject.
- Each quiz's final question cross-references the other lesson by name,
  which makes the split auditable rather than assumed.
**Result:** the pair is distinguishable in the quiz layer. Recommend the
human still do a final read of both lesson explanations side by side
before shipping, since the underlying near-duplicate risk was flagged at
the curriculum stage, not introduced or resolved here.

## 4. ISSUES FOUND

### 4.1 Minor — G13 Q4 phrasing
Q4 in the Mixed Conditionals quiz ("Rewrite... using 'Provided that'")
sets up a question where the "correct" answer is that the rewrite doesn't
work well, then offers three incorrect options and one option restating
that. This tests the same discrimination as Q1–Q3 but in a more convoluted
way. **Recommendation:** replace with a cleaner positive item, e.g. asking
learners to identify which of four sentences correctly uses "provided
that" for a real (not counterfactual) condition. Not a blocking issue —
the item is answerable and correct, just awkwardly constructed.

### 4.2 Minor — G6 Q1 and Q4 answer-key caveats
Both items carry an inline parenthetical caveat in the answer key ("also
acceptable as a variant order..." / "size→shape; adjacent same-order
types generally take no comma"). These caveats are accurate but shouldn't
ship in learner-facing quiz output — they're audit-trail notes for this
sample-quiz stage. **Recommendation:** the Technical Integrator should
strip these parentheticals from any learner-facing rendering, keeping
only the letter answer.

### 4.3 No factual errors found
Spot-checked grammar explanations (participle clauses, inversion,
passive-reporting structures, mixed-conditional alternatives) and
vocabulary definitions against the lesson drafts' own explanations — all
quiz answers are consistent with what the lesson teaches. No question
contradicts its own lesson.

### 4.4 Sensitive-topic tone (V8, V9, V12, V14)
All four carry-forward sensitive-topic lessons produce quiz questions
using neutral, factual stems and answers that don't require the learner
to take a position (e.g. V8's correct answers are all workplace-statistics
or language-convention facts, not opinions on gender issues). This is
consistent with the lesson drafts' own tone notes.
**This does not resolve the human tone review** the lesson drafts already
flagged — it only confirms the quiz layer didn't introduce new tone risk
beyond what's already pending review.

### 4.5 AREA OBJECTIVES placeholder — untouched
Per MASTER_C1_HANDOFF.md's standing note, CURRICULUM_SOURCE.md's AREA
OBJECTIVES section remains an unconfirmed placeholder. This audit did not
touch it, since it doesn't affect lesson or quiz content — flagging again
only because section 14 of the master handoff requires it be resolved
before Final Handoff, not before this gate.

## 5. RECOMMENDATION
**CHANGES REQUIRED (minor) or APPROVED-WITH-NOTES** — no blocking issues.
The two items in 4.1 and 4.2 are polish-level, not content-correctness or
scope-violation problems. Recommend the human either (a) approve as-is and
let the Technical Integrator apply the two fixes during integration, or
(b) request the Quiz Author revise G13-Q4 and strip the G6 answer-key
parentheticals before approval. Everything else — coverage, overlap
handling, the F3/F14 split, and sensitive-topic tone — passes.

Per MASTER_C1_HANDOFF.md section 11: **STOPPING HERE for the human
approval gate.** Not proceeding to Technical Integration automatically.

END OF C1 CONTENT AUDIT
