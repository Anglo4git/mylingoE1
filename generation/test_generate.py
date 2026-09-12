#!/usr/bin/env python3
"""
Unit tests for generation/generate.py.

Run from the project root:
    python3 -m unittest generation.test_generate -v
or directly:
    python3 generation/test_generate.py
"""

import csv
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generate  # noqa: E402
import model_classifier  # noqa: E402

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import build as build_module  # noqa: E402


def raw_row(text, category, tags, explanation, correct_index, *answers):
    row = {
        "question_text": text,
        "question_category": category,
        "question_tags": tags,
        "explanation": explanation,
        "correct_index": str(correct_index),
    }
    for i, a in enumerate(answers, start=1):
        row[f"answer_{i}"] = a
    for i in range(len(answers) + 1, 10):
        row[f"answer_{i}"] = ""
    return row


def make_topic_rows(n, category="Topic", tags="Grammar,A1", start=1):
    return [
        raw_row(f"Question {i} about {category}?", category, tags,
                f"Explanation for question {i}.", 1, "correct", "wrong")
        for i in range(start, start + n)
    ]


class TestCanonicalization(unittest.TestCase):
    def test_category_aliases_case_insensitive(self):
        self.assertEqual(generate.canonicalize_category("grammar"), "Grammar")
        self.assertEqual(generate.canonicalize_category("GRAMMAR"), "Grammar")
        self.assertEqual(generate.canonicalize_category(" Academic English "), "Academic English")
        self.assertIsNone(generate.canonicalize_category("history"))

    def test_level_must_be_known(self):
        self.assertEqual(generate.canonicalize_level("a1"), "A1")
        self.assertEqual(generate.canonicalize_level(" B2 "), "B2")
        self.assertIsNone(generate.canonicalize_level("Z9"))
        self.assertIsNone(generate.canonicalize_level(""))


class TestParseRawRow(unittest.TestCase):
    def test_valid_row_parses(self):
        row = raw_row("Pick one.", "Articles", "Grammar,A1", "Because grammar.", 1, "a", "an")
        parsed, issue = generate.parse_raw_row(row, 2)
        self.assertIsNone(issue)
        self.assertEqual(parsed["level"], "A1")
        self.assertEqual(parsed["quiz_category"], "Grammar")
        self.assertEqual(parsed["quiz_tags"], "Grammar,A1")
        self.assertEqual(parsed["title"], "Articles")
        self.assertEqual(parsed["answers"], ["a", "an"])

    def test_missing_explanation_is_generated(self):
        row = raw_row("Pick one.", "Articles", "Grammar,A1", "", 1, "a", "an")
        parsed, issue = generate.parse_raw_row(row, 2)
        self.assertIsNone(issue)
        self.assertIn('The correct answer is "a"', parsed["explanation"])

    def test_invalid_level_hint_falls_back_to_inference(self):
        row = raw_row("Pick one.", "Articles", "Grammar,Z9", "Because.", 1, "a", "an")
        parsed, issue = generate.parse_raw_row(row, 2)
        self.assertIsNone(issue)
        self.assertIn(parsed["level"], generate.LEVELS)

    def test_invalid_category_hint_falls_back_to_inference(self):
        row = raw_row("Pick one.", "Articles", "Nonsense,A1", "Because.", 1, "a", "an")
        parsed, issue = generate.parse_raw_row(row, 2)
        self.assertIsNone(issue)
        self.assertIn(parsed["quiz_category"], set(generate.CATEGORY_ALIASES.values()))

    def test_correct_index_out_of_range_rejected(self):
        row = raw_row("Pick one.", "Articles", "Grammar,A1", "Because.", 5, "a", "an")
        parsed, issue = generate.parse_raw_row(row, 2)
        self.assertIsNone(parsed)
        self.assertIn("out of range", issue.reason)

    def test_duplicate_answers_rejected(self):
        row = raw_row("Pick one.", "Articles", "Grammar,A1", "Because.", 1, "a", "a")
        parsed, issue = generate.parse_raw_row(row, 2)
        self.assertIsNone(parsed)
        self.assertIn("duplicate", issue.reason)

    def test_too_few_answers_rejected(self):
        row = raw_row("Pick one.", "Articles", "Grammar,A1", "Because.", 1, "a")
        parsed, issue = generate.parse_raw_row(row, 2)
        self.assertIsNone(parsed)

    def test_explicit_level_column_overrides_tags(self):
        row = raw_row("Pick one.", "Articles", "Grammar,A1", "Because.", 1, "a", "an")
        row["level"] = "B2"
        parsed, issue = generate.parse_raw_row(row, 2)
        self.assertIsNone(issue)
        self.assertEqual(parsed["level"], "B2")


class TestRawOnlyAuthoring(unittest.TestCase):
    def test_minimum_raw_payload_generates_all_metadata(self):
        rows = []
        for i in range(5):
            row = {
                "question_text": f"Choose the correct form for item {i}.",
                "correct_index": "1",
                "answer_1": "is",
                "answer_2": "are",
                "answer_3": "be",
            }
            rows.append(row)
        result = generate.generate(rows, existing_path=None, default_status="draft")
        self.assertEqual(len(result["new_rows"]), 5)
        for row in result["new_rows"]:
            for field in ("quiz_id", "level", "title", "description", "quiz_category",
                          "quiz_tags", "version", "status", "question_number",
                          "question_category", "question_tags", "explanation"):
                self.assertTrue(str(row[field]).strip(), field)
        errors, _, _ = build_module.validate(result["new_rows"])
        self.assertEqual(errors, [])


class TestGroupingAndAllocation(unittest.TestCase):
    def test_under_min_goes_to_pending(self):
        rows = make_topic_rows(3, category="New Topic")
        result = generate.generate(rows, existing_path=None, default_status="draft")
        self.assertEqual(len(result["new_rows"]), 0)
        self.assertEqual(len(result["pending"]), 1)
        self.assertIn("New Topic", result["pending"][0][1])

    def test_exact_min_creates_one_quiz(self):
        rows = make_topic_rows(5, category="New Topic")
        result = generate.generate(rows, existing_path=None, default_status="draft")
        self.assertEqual(len(result["new_rows"]), 5)
        quiz_ids = {r["quiz_id"] for r in result["new_rows"]}
        self.assertEqual(len(quiz_ids), 1)
        self.assertTrue(next(iter(quiz_ids)).startswith("a1-"))

    def test_over_max_chunks_into_multiple_quizzes(self):
        rows = make_topic_rows(153, category="Big Topic")  # 150 + 3 (3 < MIN -> pending)
        result = generate.generate(rows, existing_path=None, default_status="draft")
        quiz_ids = {r["quiz_id"] for r in result["new_rows"]}
        self.assertEqual(len(quiz_ids), 1)  # only the full 150-question chunk is written
        self.assertEqual(len(result["new_rows"]), 150)
        self.assertEqual(len(result["pending"]), 1)  # the leftover 3

    def test_question_numbers_are_contiguous_from_one(self):
        rows = make_topic_rows(6, category="Numbering Topic")
        result = generate.generate(rows, existing_path=None, default_status="draft")
        nums = sorted(int(r["question_number"]) for r in result["new_rows"])
        self.assertEqual(nums, list(range(1, 7)))

    def test_new_quizzes_default_to_requested_status(self):
        rows = make_topic_rows(5, category="Status Topic")
        result = generate.generate(rows, existing_path=None, default_status="draft")
        self.assertTrue(all(r["status"] == "draft" for r in result["new_rows"]))


class TestAppendToExisting(unittest.TestCase):
    def _write_existing(self, tmpdir):
        path = os.path.join(tmpdir, "master_source.csv")
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=generate.CANONICAL_COLUMNS)
            w.writeheader()
            row = {
                "quiz_id": "a1-001", "level": "A1", "title": "Present Simple",
                "description": "Practice Present Simple.", "quiz_category": "Grammar",
                "quiz_tags": "Grammar,A1", "version": "1", "status": "published",
                "question_number": "1", "question_text": "Existing question?",
                "question_category": "Grammar", "question_tags": "Grammar,A1",
                "explanation": "Existing explanation.", "correct_index": "1",
                "answer_1": "a", "answer_2": "b",
            }
            for col in generate.ANSWER_COLS[2:]:
                row[col] = ""
            w.writerow(row)
        return path

    def test_append_continues_numbering_and_keeps_status(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            existing_path = self._write_existing(tmpdir)
            rows = make_topic_rows(5, category="Present Simple")
            result = generate.generate(rows, existing_path=existing_path, default_status="draft")
            appended = [r for r in result["new_rows"] if r["quiz_id"] == "a1-001"]
            self.assertEqual(len(appended), 5)
            nums = sorted(int(r["question_number"]) for r in appended)
            self.assertEqual(nums, [2, 3, 4, 5, 6])
            self.assertTrue(all(r["status"] == "published" for r in appended))
            self.assertTrue(all(r["title"] == "Present Simple" for r in appended))

    def test_regenerating_twice_does_not_renumber_existing_rows(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            existing_path = self._write_existing(tmpdir)
            rows = make_topic_rows(5, category="Present Simple")
            result = generate.generate(rows, existing_path=existing_path, default_status="draft")

            # Simulate writing the output back out and regenerating from it
            merged_path = os.path.join(tmpdir, "merged.csv")
            generate.write_master_csv(merged_path, result["existing_rows"] + result["new_rows"])

            more_rows = make_topic_rows(2, category="Present Simple", start=99)
            result2 = generate.generate(more_rows, existing_path=merged_path, default_status="draft")
            appended2 = [r for r in result2["new_rows"] if r["quiz_id"] == "a1-001"]
            nums2 = sorted(int(r["question_number"]) for r in appended2)
            self.assertEqual(nums2, [7, 8])  # continues past the 6 already there, untouched


class TestValidateSafetyNet(unittest.TestCase):
    def test_output_always_passes_build_validate(self):
        rows = make_topic_rows(5, category="Safety Topic A") + \
            make_topic_rows(6, category="Safety Topic B", tags="Vocabulary,B1")
        result = generate.generate(rows, existing_path=None, default_status="published")
        errors, warnings, _ = build_module.validate(result["existing_rows"] + result["new_rows"])
        self.assertEqual(errors, [])

    def test_determinism_same_input_same_output(self):
        rows = make_topic_rows(6, category="Deterministic Topic")
        r1 = generate.generate(rows, existing_path=None, default_status="draft",
                                now="2026-01-01T00:00:00+00:00")
        r2 = generate.generate(rows, existing_path=None, default_status="draft",
                                now="2026-01-01T00:00:00+00:00")
        self.assertEqual(r1["new_rows"], r2["new_rows"])


class TestContentSchemaV2Dates(unittest.TestCase):
    """Content Schema v2 (07_CONTENT_SCHEMA_V2.md): date_added stamping."""

    def test_new_rows_get_a_valid_iso_date_added(self):
        rows = make_topic_rows(5, category="Date Topic")
        result = generate.generate(rows, existing_path=None, default_status="draft",
                                    now="2026-03-14T09:30:00+00:00")
        self.assertTrue(all(r["date_added"] == "2026-03-14T09:30:00+00:00"
                             for r in result["new_rows"]))

    def test_new_rows_have_blank_date_updated(self):
        rows = make_topic_rows(5, category="Date Topic Two")
        result = generate.generate(rows, existing_path=None, default_status="draft")
        self.assertTrue(all(r["date_updated"] == "" for r in result["new_rows"]))

    def test_a_run_uses_one_shared_timestamp_for_every_new_row(self):
        rows = make_topic_rows(5, category="Topic A") + \
            make_topic_rows(5, category="Topic B", tags="Vocabulary,B1")
        result = generate.generate(rows, existing_path=None, default_status="draft")
        stamps = {r["date_added"] for r in result["new_rows"]}
        self.assertEqual(len(stamps), 1)

    def test_existing_rows_without_date_columns_are_not_backfilled(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "master_source.csv")
            with open(path, "w", newline="", encoding="utf-8") as f:
                # Deliberately write a v1-shaped file with NO date columns
                # at all, to prove passthrough never invents history for it.
                v1_cols = [c for c in generate.CANONICAL_COLUMNS
                           if c not in generate.DATE_COLUMNS]
                w = csv.DictWriter(f, fieldnames=v1_cols)
                w.writeheader()
                row = {
                    "quiz_id": "a1-001", "level": "A1", "title": "Present Simple",
                    "description": "Practice Present Simple.", "quiz_category": "Grammar",
                    "quiz_tags": "Grammar,A1", "version": "1", "status": "published",
                    "question_number": "1", "question_text": "Existing question?",
                    "question_category": "Grammar", "question_tags": "Grammar,A1",
                    "explanation": "Existing explanation.", "correct_index": "1",
                    "answer_1": "a", "answer_2": "b",
                }
                for col in generate.ANSWER_COLS[2:]:
                    row[col] = ""
                w.writerow(row)

            rows = make_topic_rows(5, category="Fresh Topic")
            result = generate.generate(rows, existing_path=path, default_status="draft")
            self.assertEqual(len(result["existing_rows"]), 1)
            self.assertEqual(result["existing_rows"][0].get("date_added", ""), "")
            self.assertTrue(all(r["date_added"] for r in result["new_rows"]))

    def test_output_with_dates_still_passes_build_validate(self):
        rows = make_topic_rows(5, category="Validate Dates Topic")
        result = generate.generate(rows, existing_path=None, default_status="published")
        errors, warnings, _ = build_module.validate(result["existing_rows"] + result["new_rows"])
        self.assertEqual(errors, [])
        self.assertEqual([w for w in warnings if w.rule_id in ("V-H1", "V-H2")], [])


class TestModelBackedClassifier(unittest.TestCase):
    """Agent 5: the model-backed classifier behind derive_raw_metadata().

    These tests never make a real network call — they monkeypatch
    model_classifier._call_model_api with a fake so the batching, caching,
    hint-precedence, and fallback-on-failure behavior can be verified
    offline and deterministically, the same way generate.py itself never
    calls the network during `python3 -m unittest`.
    """

    def setUp(self):
        self._orig_call = model_classifier._call_model_api
        self._orig_env = {
            k: os.environ.get(k) for k in
            ("ANTHROPIC_API_KEY", "MYLINGO_CLASSIFIER_BACKEND")
        }
        model_classifier._CACHE.clear()
        model_classifier._DESCRIPTION_CACHE.clear()
        model_classifier.reset_stats()
        os.environ["ANTHROPIC_API_KEY"] = "test-key"
        os.environ["MYLINGO_CLASSIFIER_BACKEND"] = "model"

    def tearDown(self):
        model_classifier._call_model_api = self._orig_call
        for k, v in self._orig_env.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
        model_classifier._CACHE.clear()
        model_classifier._DESCRIPTION_CACHE.clear()
        model_classifier.reset_stats()

    def _fake_model(self, level="B1", category="Grammar", title="Conditionals", description=None):
        """A single fake standing in for the real Messages API. Routes on
        request shape: classification requests carry a `question_text` key
        per item, description requests (Agent 6) carry `sample_question`
        instead — see `_build_prompt` vs. `_build_description_prompt`."""
        calls = {"n": 0, "batches": [], "classify_batches": [], "describe_batches": []}

        def fake(prompt, max_tokens):
            calls["n"] += 1
            items = [json.loads(line) for line in prompt.splitlines() if line.startswith("{")]
            calls["batches"].append(len(items))
            if items and "sample_question" in items[0]:
                calls["describe_batches"].append(len(items))
                desc = description or f"Practice {title} (model-written)."
                return json.dumps([{"index": it["index"], "description": desc} for it in items])
            calls["classify_batches"].append(len(items))
            return json.dumps([
                {"index": it["index"], "level": level, "quiz_category": category, "title": title}
                for it in items
            ])
        model_classifier._call_model_api = fake
        return calls

    def test_heuristic_backend_default_with_no_api_key(self):
        os.environ.pop("ANTHROPIC_API_KEY", None)
        os.environ["MYLINGO_CLASSIFIER_BACKEND"] = "auto"
        self.assertFalse(model_classifier.model_backend_active())

    def test_model_backend_active_when_key_present(self):
        self.assertTrue(model_classifier.model_backend_active())

    def test_forced_heuristic_backend_never_calls_model(self):
        os.environ["MYLINGO_CLASSIFIER_BACKEND"] = "heuristic"
        calls = self._fake_model()
        rows = make_topic_rows(5, category="No Hints Topic", tags="")
        for r in rows:
            r.pop("question_category", None)
            r.pop("question_tags", None)
        result = generate.generate(rows, existing_path=None, default_status="draft")
        self.assertEqual(calls["n"], 0)
        self.assertEqual(result["classifier_backend"], "heuristic")
        self.assertEqual(result["classifier_stats"]["model_classified"], 0)

    def test_model_result_used_for_missing_fields(self):
        self._fake_model(level="B1", category="Grammar", title="Conditionals")
        rows = [{
            "question_text": f"If it rains tomorrow, we will stay home. Variant {i}.",
            "correct_index": "1", "answer_1": "will", "answer_2": "would",
        } for i in range(5)]
        result = generate.generate(rows, existing_path=None, default_status="draft")
        self.assertEqual(len(result["new_rows"]), 5)
        self.assertTrue(all(r["level"] == "B1" for r in result["new_rows"]))
        self.assertGreater(result["classifier_stats"]["model_classified"], 0)

    def test_explicit_hints_are_never_overridden_by_the_model(self):
        self._fake_model(level="C2", category="Writing", title="Wrong Title")
        row = {
            "question_text": "Pick the correct article.", "correct_index": "1",
            "answer_1": "a", "answer_2": "an",
            "level": "A1", "quiz_category": "Grammar", "question_category": "Articles",
        }
        parsed, issue = generate.parse_raw_row(row, 2)
        self.assertIsNone(issue)
        self.assertEqual((parsed["level"], parsed["quiz_category"], parsed["title"]),
                          ("A1", "Grammar", "Articles"))

    def test_batching_makes_one_call_for_many_rows(self):
        calls = self._fake_model()
        rows = [{
            "question_text": f"If it rains tomorrow, we will stay home. Variant {i}.",
            "correct_index": "1", "answer_1": "will", "answer_2": "would",
        } for i in range(12)]
        generate.generate(rows, existing_path=None, default_status="draft")
        # One batched call classifies all 12 rows; a second, separate,
        # batched call (Agent 6) describes the single new topic group they
        # all land in — not one call per row for either.
        self.assertEqual(calls["n"], 2)
        self.assertEqual(calls["classify_batches"], [12])
        self.assertEqual(calls["describe_batches"], [1])

    def test_prewarm_cache_avoids_a_second_call_per_row(self):
        calls = self._fake_model()
        rows = [{
            "question_text": f"If it rains tomorrow, we will stay home. Variant {i}.",
            "correct_index": "1", "answer_1": "will", "answer_2": "would",
        } for i in range(8)]
        generate.generate(rows, existing_path=None, default_status="draft")
        # One batched prewarm call classifies all 8, one batched prewarm
        # call describes their single new topic group; the per-row parse
        # pass and quiz-building that follow must hit those caches, not
        # call the model again.
        self.assertEqual(calls["n"], 2)

    def test_model_failure_falls_back_to_heuristic_without_crashing(self):
        def broken(prompt, max_tokens):
            raise RuntimeError("simulated outage")
        model_classifier._call_model_api = broken

        rows = make_topic_rows(5, category="Outage Topic", tags="")
        for r in rows:
            r.pop("question_category", None)
            r.pop("question_tags", None)
        result = generate.generate(rows, existing_path=None, default_status="draft")
        self.assertEqual(len(result["new_rows"]), 5)
        self.assertEqual(result["classifier_stats"]["heuristic_fallback"], 5)
        self.assertTrue(result["classifier_stats"]["errors"])
        errors, _, _ = build_module.validate(result["new_rows"])
        self.assertEqual(errors, [])

    def test_out_of_vocabulary_model_result_falls_back_to_heuristic(self):
        self._fake_model(level="Z9", category="Nonsense", title="X")
        rows = make_topic_rows(5, category="Bad Vocab Topic", tags="")
        for r in rows:
            r.pop("question_category", None)
            r.pop("question_tags", None)
        result = generate.generate(rows, existing_path=None, default_status="draft")
        self.assertEqual(len(result["new_rows"]), 5)
        self.assertTrue(all(r["level"] in generate.LEVELS for r in result["new_rows"]))
        self.assertEqual(result["classifier_stats"]["heuristic_fallback"], 5)

    def test_repeated_content_is_deterministic_via_cache(self):
        self._fake_model(level="B1", category="Grammar", title="Conditionals")
        rows = [{
            "question_text": f"If it rains tomorrow, we will stay home. Variant {i}.",
            "correct_index": "1", "answer_1": "will", "answer_2": "would",
        } for i in range(5)]
        r1 = generate.generate(rows, existing_path=None, default_status="draft",
                                now="2026-01-01T00:00:00+00:00")
        r2 = generate.generate(rows, existing_path=None, default_status="draft",
                                now="2026-01-01T00:00:00+00:00")
        self.assertEqual(r1["new_rows"], r2["new_rows"])


class TestModelBackedDescriptions(unittest.TestCase):
    """Agent 6: model-backed one-line topic descriptions, generated for
    brand-new quiz groups behind `derive_group_description()`.

    Same offline-testing approach as TestModelBackedClassifier: the real
    Messages API call is monkeypatched, so these tests never touch the
    network and stay deterministic.
    """

    def setUp(self):
        self._orig_call = model_classifier._call_model_api
        self._orig_env = {
            k: os.environ.get(k) for k in
            ("ANTHROPIC_API_KEY", "MYLINGO_CLASSIFIER_BACKEND")
        }
        model_classifier._CACHE.clear()
        model_classifier._DESCRIPTION_CACHE.clear()
        model_classifier.reset_stats()
        os.environ["ANTHROPIC_API_KEY"] = "test-key"
        os.environ["MYLINGO_CLASSIFIER_BACKEND"] = "model"

    def tearDown(self):
        model_classifier._call_model_api = self._orig_call
        for k, v in self._orig_env.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
        model_classifier._CACHE.clear()
        model_classifier._DESCRIPTION_CACHE.clear()
        model_classifier.reset_stats()

    def _fake_describer(self, description="Master the future with 'will'."):
        calls = {"n": 0, "batches": []}

        def fake(prompt, max_tokens):
            calls["n"] += 1
            items = [json.loads(line) for line in prompt.splitlines() if line.startswith("{")]
            calls["batches"].append(len(items))
            return json.dumps([{"index": it["index"], "description": description} for it in items])
        model_classifier._call_model_api = fake
        return calls

    def _fully_hinted_rows(self, n, level="A1", category="Grammar", title="Future Simple"):
        return [
            raw_row(f"Question {i} about {title}?", title, f"{category},{level}",
                    f"Explanation for question {i}.", 1, "correct", "wrong")
            for i in range(1, n + 1)
        ]

    def test_new_quiz_gets_model_written_description(self):
        self._fake_describer(description="Master the future with 'will'.")
        rows = self._fully_hinted_rows(5)
        result = generate.generate(rows, existing_path=None, default_status="draft")
        self.assertEqual(len(result["new_rows"]), 5)
        self.assertTrue(all(r["description"] == "Master the future with 'will'." for r in result["new_rows"]))
        self.assertEqual(result["classifier_stats"]["description_model"], 1)

    def test_one_description_call_per_topic_not_per_question(self):
        calls = self._fake_describer()
        rows = self._fully_hinted_rows(9)
        generate.generate(rows, existing_path=None, default_status="draft")
        # All 9 rows share one (level, category, title) group -> one
        # description call for the group, not nine.
        self.assertEqual(calls["n"], 1)
        self.assertEqual(calls["batches"], [1])

    def test_two_new_topics_describe_in_one_batched_call(self):
        calls = self._fake_describer()
        rows = (self._fully_hinted_rows(5, title="Future Simple") +
                self._fully_hinted_rows(5, title="Past Simple"))
        generate.generate(rows, existing_path=None, default_status="draft")
        self.assertEqual(calls["n"], 1)
        self.assertEqual(calls["batches"], [2])

    def test_appending_to_existing_quiz_never_calls_describer(self):
        calls = self._fake_describer()
        with tempfile.TemporaryDirectory() as tmp:
            existing_path = os.path.join(tmp, "master_source.csv")
            first_batch = self._fully_hinted_rows(5)
            r1 = generate.generate(first_batch, existing_path=None, default_status="draft")
            self.assertEqual(calls["n"], 1)  # the one new topic gets described
            fieldnames = list(r1["new_rows"][0].keys())
            with open(existing_path, "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
                w.writeheader()
                for r in r1["new_rows"]:
                    w.writerow(r)
            second_batch = self._fully_hinted_rows(3, title="Future Simple")
            for r in second_batch:
                r["question_text"] = r["question_text"].replace("Question", "Extra question")
            r2 = generate.generate(second_batch, existing_path=existing_path, default_status="draft")
            # Appended rows must carry the SAME description as the rest of
            # their quiz, not a fresh one — so no new describer call here.
            self.assertEqual(calls["n"], 1)
            self.assertEqual(len(r2["new_rows"]), 3)
            self.assertTrue(all(r["description"] == "Master the future with 'will'." for r in r2["new_rows"]))

    def test_describer_failure_falls_back_to_generic_description(self):
        def broken(prompt, max_tokens):
            raise RuntimeError("simulated outage")
        model_classifier._call_model_api = broken

        rows = self._fully_hinted_rows(5, title="Future Simple")
        result = generate.generate(rows, existing_path=None, default_status="draft")
        self.assertEqual(len(result["new_rows"]), 5)
        self.assertTrue(all(r["description"] == "Practice Future Simple." for r in result["new_rows"]))
        self.assertEqual(result["classifier_stats"]["description_fallback"], 1)

    def test_mixed_practice_pool_never_calls_describer(self):
        calls = self._fake_describer()
        # Three separate under-filled topics, same level/category, pooled
        # into one "Mixed Grammar Practice" quiz -- a synthetic title the
        # describer is deliberately never consulted for (see
        # `_heuristic_description`'s docstring).
        rows = (self._fully_hinted_rows(2, title="Topic One") +
                self._fully_hinted_rows(2, title="Topic Two") +
                self._fully_hinted_rows(2, title="Topic Three"))
        result = generate.generate(rows, existing_path=None, default_status="draft")
        self.assertEqual(calls["n"], 0)
        self.assertEqual(len(result["new_rows"]), 6)
        self.assertTrue(all(r["description"] == "Practice Mixed Grammar Practice." for r in result["new_rows"]))


if __name__ == "__main__":
    unittest.main()
