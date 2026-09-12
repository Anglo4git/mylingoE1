import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const journey = fs.readFileSync(path.join(root, 'site/courses/journey.html'), 'utf8');
const course = fs.readFileSync(path.join(root, 'site/courses/course.html'), 'utf8');

describe('Agent 77 journey UI', () => {
  it('provides the guided course → unit → lesson → revision path', () => {
    expect(journey).toContain("fetchJson('../course_content/courses.json')");
    expect(journey).toContain("fetchJson('../course_content/units.json')");
    expect(journey).toContain("fetchJson('../course_content/lessons.json')");
    expect(journey).toContain("./lesson.html?lesson=");
    expect(journey).toContain("./journey.html?level=");
  });

  it('uses the existing learner progress source of truth', () => {
    expect(journey).toContain("mylingo.progress.v1");
    expect(journey).toContain("status==='completed'");
    expect(journey).toContain('Course progress');
    expect(journey).toContain('Continue learning');
  });

  it('shows completed/current/upcoming states without locking direct practice', () => {
    expect(journey).toContain('Completed');
    expect(journey).toContain('Current');
    expect(journey).toContain('Upcoming');
    expect(journey).toContain('Practice this topic');
    expect(journey).toContain('Practice this level directly');
  });

  it('keeps revision optional by routing through Agent 76 without changing quiz scoring', () => {
    expect(journey).toContain("./lesson.html?lesson=");
    expect(journey).not.toContain('mylingo.progress.v2');
  });

  it('adds the journey entry point to the course page', () => {
    expect(course).toContain('id="journeyLink"');
    expect(course).toContain("./journey.html?level=");
  });

  it('has accessible progress semantics and reduced-motion support', () => {
    expect(journey).toContain('role="progressbar"');
    expect(journey).toContain('aria-valuenow=');
    expect(journey).toContain('.skip-link');
    expect(journey).toContain('prefers-reduced-motion:reduce');
  });
});
