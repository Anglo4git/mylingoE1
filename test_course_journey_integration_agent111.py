import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def read_json(rel):
    with open(ROOT / rel, encoding='utf-8') as f:
        return json.load(f)

def read_text(rel):
    return (ROOT / rel).read_text(encoding='utf-8')

class CourseJourneyIntegrationAgent111(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.courses = read_json('course_content/courses.json')
        cls.units = read_json('course_content/units.json')
        cls.lessons = read_json('course_content/lessons.json')
        cls.levels = ['a1','a2','b1','b2','c1','c2']
        cls.manifests = {level: read_json(f'site/{level}/quizzes.json') for level in cls.levels}
        cls.quiz_ids = {q['id'] for items in cls.manifests.values() for q in items}
        cls.sources = {name: read_text(path) for name, path in {
            'journey':'site/courses/journey.html',
            'course':'site/courses/course.html',
            'lesson':'site/courses/lesson.html',
            'quiz':'site/shared/quiz.html',
            'progress':'site/main/progress.html',
        }.items()}

    def test_course_unit_lesson_exercise_graph(self):
        course_ids = {c['course_id'] for c in self.courses}
        unit_ids = {u['unit_id'] for u in self.units}
        lesson_ids = {l['lesson_id'] for l in self.lessons}
        self.assertTrue(self.courses and self.units and self.lessons)
        for course in self.courses:
            self.assertEqual(course['status'], 'published')
            expected = {u['unit_id'] for u in self.units if u['course_id'] == course['course_id']}
            self.assertEqual(set(course['unit_ids']), expected)
            self.assertTrue(set(course['unit_ids']) <= unit_ids)
        for unit in self.units:
            self.assertIn(unit['course_id'], course_ids)
            self.assertTrue(set(unit['lesson_ids']) <= lesson_ids)
        for lesson in self.lessons:
            self.assertIn(lesson['unit_id'], unit_ids)
            self.assertEqual(lesson['status'], 'published')
            self.assertTrue(lesson['exercise_quiz_ids'])
            self.assertTrue(set(lesson['exercise_quiz_ids']) <= self.quiz_ids)

    def test_each_course_uses_same_level_quizzes(self):
        for course in self.courses:
            level_ids = {q['id'] for q in self.manifests[course['level'].lower()]}
            unit_ids = {u['unit_id'] for u in self.units if u['course_id'] == course['course_id']}
            for lesson in self.lessons:
                if lesson['unit_id'] in unit_ids:
                    self.assertTrue(set(lesson['exercise_quiz_ids']) <= level_ids)

    def test_route_chain_and_context_parameters(self):
        journey, course, lesson, quiz = (self.sources[k] for k in ('journey','course','lesson','quiz'))
        for token in ('./lesson.html?lesson=', '&level=', '&redirect=', '../shared/quiz.html?quiz='):
            self.assertIn(token, journey)
        self.assertIn('./lesson.html?lesson=', course)
        self.assertIn('&unit=', course)
        self.assertIn('../shared/quiz.html?quiz=', lesson)
        self.assertIn('&course=', lesson)
        self.assertIn('&unit_title=', lesson)
        self.assertIn("const courseTitleParam=p.get('course');", quiz)
        self.assertIn("const unitTitleParam=p.get('unit_title');", quiz)

    def test_single_progress_source(self):
        for name in ('journey', 'course', 'quiz', 'progress'):
            source = self.sources[name]
            self.assertIn('mylingo.progress.v1', source)
            self.assertNotIn('mylingo.progress.v2', source)
        self.assertIn("status:done?'completed':'in-progress'", self.sources['quiz'])
        self.assertIn("status==='completed'", self.sources['journey'])
        self.assertIn("status==='completed'", self.sources['course'])

    def test_resume_completion_semantics(self):
        state = {'a1-001': {'status':'completed'}, 'a1-002': {'status':'in-progress'}}
        def status(ids):
            if not ids: return 'not-started'
            if all(state.get(i, {}).get('status') == 'completed' for i in ids): return 'completed'
            if any(i in state for i in ids): return 'in-progress'
            return 'not-started'
        self.assertEqual(status(['a1-001']), 'completed')
        self.assertEqual(status(['a1-002']), 'in-progress')
        self.assertEqual(status(['a1-003']), 'not-started')
        self.assertEqual(status(['a1-001','a1-002']), 'in-progress')

    def test_direct_practice_and_progress_destinations_remain(self):
        journey, course, progress = self.sources['journey'], self.sources['course'], self.sources['progress']
        self.assertIn('Practice this topic', journey)
        self.assertIn('Practice this level directly', journey)
        self.assertIn('Practice', course)
        self.assertIn('../shared/quiz.html?quiz=', progress)
        self.assertIn('href="../', progress)
        self.assertIn("+key+'/dashboard.html", progress)

if __name__ == '__main__':
    unittest.main()
