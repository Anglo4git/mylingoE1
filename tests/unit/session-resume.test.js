import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const quizPath = path.resolve(process.cwd(), 'site/shared/quiz.html');
const source = fs.readFileSync(quizPath, 'utf8');

describe('Learner session resume', () => {
  it('uses a versioned session object with the required fields', () => {
    expect(source).toContain("const SESSION_KEY='mylingo.sessions.v2';");
    expect(source).toContain("const LEGACY_SESSION_KEY='mylingo.session.v1';");
    expect(source).toContain("const SESSION_SHARD_PREFIX='mylingo.sessions.v3.';");
    expect(source).toContain("const SESSION_INDEX_KEY='mylingo.sessions.v3.index';");
    expect(source).toContain('function readSessionStore()');
    expect(source).toContain('const sessions={};');
    expect(source).toContain('localStorage.setItem(sessionShardKey(legacy.quizId),JSON.stringify(legacy));');
    for (const field of ['version:1','quizId:data.id','quizVersion:String(data.version||1)','questionIndex:i','answers','score',"status:'in-progress'",'startedAt:sessionStartedAt','updatedAt:Date.now()']) {
      expect(source).toContain(field);
    }
  });

  it('offers Resume Quiz only for a valid matching session and Start Over clears it', () => {
    expect(source).toContain('id="resumeBtn"');
    expect(source).toContain('sessionForCurrentQuiz()');
    expect(source).toContain("$('startBtn').textContent=hasResume?'Start over':'Start quiz';");
    expect(source).toContain("$('resumeBtn').onclick=resumeSession;");
    expect(source).toContain('clearSession(data.id);');
  });

  it('restores the saved question, score, submitted answers, and answer UI', () => {
    expect(source).toContain('i=session.questionIndex;score=session.score;');
    expect(source).toContain('session.answers.forEach');
    expect(source).toContain('applyResponseToUI(entry.response);');
    expect(source).toContain("finishAnswer(entry.correct,entry.correctText||'',entry.response)");
    expect(source).toContain('function applyResponseToUI(input)');
  });

  it('clears resumable state on completion and explicit restart', () => {
    expect(source).toContain('save(true);\n  clearSession(data.id);');
    expect(source).toContain("$('again').onclick=()=>{startFresh()};");
  });

  it('ignores malformed or incompatible sessions safely', () => {
    expect(source).toContain('version===2&&v.sessions');
    expect(source).toContain('legacy.version===1&&legacy.quizId');
    expect(source).toContain('v.quizId!==data.id||v.quizVersion!==expectedVersion');
  });

  it('keeps multiple quiz sessions independently resumable', () => {
    expect(source).toContain('localStorage.setItem(sessionShardKey(quizId),JSON.stringify(session));');
    expect(source).toContain('readSession(data.id)');
    expect(source).toContain('localStorage.removeItem(sessionShardKey(quizId));');
  });

  it('shards each resumable quiz session independently instead of rewriting one giant v2 blob', () => {
    expect(source).toContain('function sessionShardKey(quizId)');
    expect(source).toContain('localStorage.setItem(sessionShardKey(quizId),JSON.stringify(session));');
    expect(source).toContain('localStorage.removeItem(sessionShardKey(quizId));');
    expect(source).toContain('writeSessionIndex({version:1,quizIds:ids});');
    expect(source).toContain('migrateSessionShards();');
  });

  it('migrates the existing v2 multi-session envelope into v3 shards', () => {
    expect(source).toContain('v&&typeof v===\'object\'&&v.version===2&&v.sessions&&typeof v.sessions===\'object\'');
    expect(source).toContain('Object.keys(v.sessions)');
    expect(source).toContain('localStorage.removeItem(SESSION_KEY);');
  });
});
