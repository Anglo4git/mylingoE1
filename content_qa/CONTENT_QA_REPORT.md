# Mylingo Content QA Report

- Generated: 2026-09-11T18:45:37.318133+00:00
- Source: `master_source.csv`
- Rows: 300
- Quizzes: 60
- Mode: strict
- Triage score: **98/100** (review-priority signal only; not a CEFR score)

## Outcome

- Errors: **0**
- Warnings: **0**
- Info: **61**

## Coverage

| level | rows |
| --- | --- |
| A1 | 50 |
| A2 | 50 |
| B1 | 50 |
| B2 | 50 |
| C1 | 50 |
| C2 | 50 |

| category | rows |
| --- | --- |
| Academic English | 20 |
| Grammar | 215 |
| Vocabulary | 45 |
| Writing | 20 |

## Thresholds

| min_questions_per_quiz | max_question_chars | min_explanation_chars | max_explanation_chars |
| --- | --- | --- | --- |
| 5 | 220 | 20 | 350 |

## Issues

| severity | code | scope | ref | message |
| --- | --- | --- | --- | --- |
| info | CQ-C07 | answers | row 157 (quiz_id=b2-002, q=1) | answer options have inconsistent capitalization shape; review parallelism |
| info | CQ-C07 | answers | row 158 (quiz_id=b2-002, q=2) | answer options have inconsistent capitalization shape; review parallelism |
| info | CQ-C07 | answers | row 159 (quiz_id=b2-002, q=3) | answer options have inconsistent capitalization shape; review parallelism |
| info | CQ-C07 | answers | row 160 (quiz_id=b2-002, q=4) | answer options have inconsistent capitalization shape; review parallelism |
| info | CQ-C07 | answers | row 161 (quiz_id=b2-002, q=5) | answer options have inconsistent capitalization shape; review parallelism |
| info | CQ-D02 | explanation | 102/103/104/105/106 | same normalized explanation reused 5 times across quiz(es): b1-001 |
| info | CQ-D02 | explanation | 107/108/109/110/111 | same normalized explanation reused 5 times across quiz(es): b1-002 |
| info | CQ-D02 | explanation | 112/113/114/115/116 | same normalized explanation reused 5 times across quiz(es): b1-003 |
| info | CQ-D02 | explanation | 117/118/119/120/121 | same normalized explanation reused 5 times across quiz(es): b1-004 |
| info | CQ-D02 | explanation | 12/13/14/15/16 | same normalized explanation reused 5 times across quiz(es): a1-003 |
| info | CQ-D02 | explanation | 122/123/124/125/126 | same normalized explanation reused 5 times across quiz(es): b1-005 |
| info | CQ-D02 | explanation | 127/128/129/130/131 | same normalized explanation reused 5 times across quiz(es): b1-006 |
| info | CQ-D02 | explanation | 132/133/134/135/136 | same normalized explanation reused 5 times across quiz(es): b1-007 |
| info | CQ-D02 | explanation | 137/138/139/140/141 | same normalized explanation reused 5 times across quiz(es): b1-008 |
| info | CQ-D02 | explanation | 142/143/144/145/146 | same normalized explanation reused 5 times across quiz(es): b1-009 |
| info | CQ-D02 | explanation | 147/148/149/150/151 | same normalized explanation reused 5 times across quiz(es): b1-010 |
| info | CQ-D02 | explanation | 152/153/154/155/156 | same normalized explanation reused 5 times across quiz(es): b2-001 |
| info | CQ-D02 | explanation | 157/158/159/160/161 | same normalized explanation reused 5 times across quiz(es): b2-002 |
| info | CQ-D02 | explanation | 162/163/164/165/166 | same normalized explanation reused 5 times across quiz(es): b2-003 |
| info | CQ-D02 | explanation | 167/168/169/170/171 | same normalized explanation reused 5 times across quiz(es): b2-004 |
| info | CQ-D02 | explanation | 17/18/19/20/21 | same normalized explanation reused 5 times across quiz(es): a1-004 |
| info | CQ-D02 | explanation | 172/173/174/175/176 | same normalized explanation reused 5 times across quiz(es): b2-005 |
| info | CQ-D02 | explanation | 177/178/179/180/181 | same normalized explanation reused 5 times across quiz(es): b2-006 |
| info | CQ-D02 | explanation | 182/183/184/185/186 | same normalized explanation reused 5 times across quiz(es): b2-007 |
| info | CQ-D02 | explanation | 187/188/189/190/191 | same normalized explanation reused 5 times across quiz(es): b2-008 |
| info | CQ-D02 | explanation | 192/193/194/195/196 | same normalized explanation reused 5 times across quiz(es): b2-009 |
| info | CQ-D02 | explanation | 197/198/199/200/201 | same normalized explanation reused 5 times across quiz(es): b2-010 |
| info | CQ-D02 | explanation | 2/3/4/5/6 | same normalized explanation reused 5 times across quiz(es): a1-001 |
| info | CQ-D02 | explanation | 202/203/204/205/206 | same normalized explanation reused 5 times across quiz(es): c1-001 |
| info | CQ-D02 | explanation | 207/208/209/210/211 | same normalized explanation reused 5 times across quiz(es): c1-002 |
| info | CQ-D02 | explanation | 212/213/214/215/216 | same normalized explanation reused 5 times across quiz(es): c1-003 |
| info | CQ-D02 | explanation | 217/218/219/220/221 | same normalized explanation reused 5 times across quiz(es): c1-004 |
| info | CQ-D02 | explanation | 22/23/24/25/26 | same normalized explanation reused 5 times across quiz(es): a1-005 |
| info | CQ-D02 | explanation | 222/223/224/225/226 | same normalized explanation reused 5 times across quiz(es): c1-005 |
| info | CQ-D02 | explanation | 227/228/229/230/231 | same normalized explanation reused 5 times across quiz(es): c1-006 |
| info | CQ-D02 | explanation | 232/233/234/235/236 | same normalized explanation reused 5 times across quiz(es): c1-007 |
| info | CQ-D02 | explanation | 237/238/239/240/241 | same normalized explanation reused 5 times across quiz(es): c1-008 |
| info | CQ-D02 | explanation | 242/243/244/245 | same normalized explanation reused 4 times across quiz(es): c1-009 |
| info | CQ-D02 | explanation | 247/248/250/251 | same normalized explanation reused 4 times across quiz(es): c1-010 |
| info | CQ-D02 | explanation | 252/253/254/255/256 | same normalized explanation reused 5 times across quiz(es): c2-001 |
| info | CQ-D02 | explanation | 257/258/259/260/261 | same normalized explanation reused 5 times across quiz(es): c2-002 |
| info | CQ-D02 | explanation | 262/263/264/265/266 | same normalized explanation reused 5 times across quiz(es): c2-003 |
| info | CQ-D02 | explanation | 267/268/269/270/271 | same normalized explanation reused 5 times across quiz(es): c2-004 |
| info | CQ-D02 | explanation | 27/28/29/30/31 | same normalized explanation reused 5 times across quiz(es): a1-006 |
| info | CQ-D02 | explanation | 272/273/274/275/276 | same normalized explanation reused 5 times across quiz(es): c2-005 |
| info | CQ-D02 | explanation | 277/278/279/280/281 | same normalized explanation reused 5 times across quiz(es): c2-006 |
| info | CQ-D02 | explanation | 287/288/289/290/291 | same normalized explanation reused 5 times across quiz(es): c2-008 |
| info | CQ-D02 | explanation | 292/293/294/295/296 | same normalized explanation reused 5 times across quiz(es): c2-009 |
| info | CQ-D02 | explanation | 297/298/299/300/301 | same normalized explanation reused 5 times across quiz(es): c2-010 |
| info | CQ-D02 | explanation | 32/33/34/35/36 | same normalized explanation reused 5 times across quiz(es): a1-007 |
| info | CQ-D02 | explanation | 37/38/39/40/41 | same normalized explanation reused 5 times across quiz(es): a1-008 |
| info | CQ-D02 | explanation | 42/43/44/45/46 | same normalized explanation reused 5 times across quiz(es): a1-009 |
| info | CQ-D02 | explanation | 52/53/54/55/56 | same normalized explanation reused 5 times across quiz(es): a2-001 |
| info | CQ-D02 | explanation | 57/58/59/60/61 | same normalized explanation reused 5 times across quiz(es): a2-002 |
| info | CQ-D02 | explanation | 62/63/64/65/66 | same normalized explanation reused 5 times across quiz(es): a2-003 |
| info | CQ-D02 | explanation | 67/68/69/70/71 | same normalized explanation reused 5 times across quiz(es): a2-004 |
| info | CQ-D02 | explanation | 72/73/74/75/76 | same normalized explanation reused 5 times across quiz(es): a2-005 |
| info | CQ-D02 | explanation | 77/78/79/80/81 | same normalized explanation reused 5 times across quiz(es): a2-006 |
| info | CQ-D02 | explanation | 82/83/84/85/86 | same normalized explanation reused 5 times across quiz(es): a2-007 |
| info | CQ-D02 | explanation | 87/88/89/90/91 | same normalized explanation reused 5 times across quiz(es): a2-008 |
| info | CQ-D02 | explanation | 92/93/94/95/96 | same normalized explanation reused 5 times across quiz(es): a2-009 |

## Interpretation

This audit is deliberately deterministic. It can detect structural and linguistic-risk signals at scale, but it does not claim to prove that a question is pedagogically perfect or officially CEFR-aligned. Human review remains required for meaning, factual correctness, naturalness, distractor validity, and level appropriateness.

Diagnostic mode is the default so a sparse starter dataset is observable without being falsely blocked. Strict mode is intended for a production promotion gate once the content library adopts the documented thresholds.

Strict mode (`--strict`) promotes the canonical blocking codes in `STRICT_BLOCKING_CODES` (currently: CQ-B01, CQ-B05, CQ-C06, CQ-C08, CQ-D02, CQ-S02) to errors; any other code remains at its diagnostic severity even under `--strict`.
