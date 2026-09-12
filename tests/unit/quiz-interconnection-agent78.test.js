import { describe,it,expect,beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.cwd(),'site');
describe('Agent 78 quiz interconnection',()=>{
 it('lesson pages route through the existing quiz engine',()=>{const s=fs.readFileSync(path.join(root,'courses/lesson.html'),'utf8');expect(s).toContain('../shared/quiz.html?quiz=');expect(s).toContain('exercise_quiz_ids');});
 it('quiz completion keeps the canonical progress key',()=>{const s=fs.readFileSync(path.join(root,'shared/quiz.html'),'utf8');expect(s).toContain("mylingo.progress.v1");expect(s).toContain("status:done?'completed':'in-progress'");expect(s).toContain('recordAndPersist');});
 it('homepage projection does not create a second progress store',()=>{const s=fs.readFileSync(path.join(root,'shared/js/course-progress.js'),'utf8');expect(s).toContain("mylingo.progress.v1");expect(s).toContain('mylingo.sessions.v3.');expect(s).not.toContain('courseProgress');});
});
