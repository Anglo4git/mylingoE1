import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const quizPath = path.resolve(process.cwd(), 'site/shared/quiz.html');
const source = fs.readFileSync(quizPath, 'utf8');

describe('Milestone 3 question experience', () => {
  it('reads question_type before falling back to legacy question text', () => {
    expect(source).toContain("function rawType(q)");
    expect(source).toContain("typeof q.question_text==='string'?q.question_text");
    expect(source).toContain("rawType(q),text=questionText(q)");
  });

  it('keeps legacy radio schema and grading path', () => {
    expect(source).toContain("const q=data.questions[i],type=rawType(q),answers=answerList(q)");
    expect(source).toContain("type==='radio'||type==='dropdown'");
    expect(source).toContain("const ci=correctIndexes(q,answers)[0]");
    expect(source).toContain("ok=idx===ci");
  });

  it('supports all requested extensible question types', () => {
    for (const type of ['radio','checkbox','dropdown','text','short_text','number','date','matching','ranking','fill_in_the_blank','banner']) {
      expect(source).toContain(`type==='${type}'`);
    }
    expect(source).toContain("t==='comparison'");
    expect(source).toContain("t==='reorganizer'||t==='reorganizer_task'");
    expect(source).toContain("t==='complete_question'||t==='complete-question'");
  });

  it('supports dedicated image and audio media containers without autoplay', () => {
    expect(source).toContain('id="qimgWrap"');
    expect(source).toContain('id="qaudioWrap"');
    expect(source).toContain("$('qaudio').src=au.src");
    expect(source).toContain('preload="none"');
    expect(source).not.toContain('qaudio.autoplay=true');
  });

  it('uses consistent question/media/option radius tokens', () => {
    for (const token of ['--question-card-radius:24px','--media-card-radius:18px','--audio-card-radius:16px','--image-card-radius:18px','--option-radius:14px']) {
      expect(source).toContain(token);
    }
    expect(source).toContain('border-radius:var(--question-card-radius)');
    expect(source).toContain('border-radius:var(--option-radius)');
  });

  it('fails safely on unsupported or malformed types', () => {
    expect(source).toContain("return 'Unsupported question type: '+type+'.'");
    expect(source).toContain("if(!d||typeof d!=='object') return 'Quiz data is not a valid object.'");
    expect(source).toContain("if(!Array.isArray(d.questions)||d.questions.length===0)");
  });

  it('keeps keyboard support and reduced-motion behavior', () => {
    expect(source).toContain("e.key==='ArrowRight'||e.key==='ArrowDown'");
    expect(source).toContain("e.key==='Enter'||e.key===' '");
    expect(source).toContain('@media(prefers-reduced-motion:reduce)');
  });
});
