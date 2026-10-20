import { ArrowLeft, ChevronRight, CircleCheck, Eye, Lock, Play, Square } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { getItem, getLesson, getSequence, itemsForLesson, type Lesson, type LessonSection } from '../../content';
import { t, type MessageKey } from '../../i18n';
import { usePlaybackStore } from '../../playback/store';
import { compareScales, getScale } from '../../theory';
import { useNav } from '../nav';
import { LiveFretboard } from '../player/Player';
import { isUnlocked, usePractice } from '../practiceStore';

function Section({ n, title, section, children }: { n: number; title: MessageKey; section?: LessonSection; children?: ReactNode }) {
  return (
    <section className="card lesson-section">
      <div className="section-label">{String(n).padStart(2, '0')}</div>
      <h2>{t(title)}</h2>
      {section?.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      {section?.bullets && (
        <ul>
          {section.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}
      {children}
    </section>
  );
}

function Compare({ lesson }: { lesson: Lesson }) {
  const c = lesson.related.compare;
  if (!c) return null;
  const a = getScale(c.from.tonic, c.from.scale);
  const b = getScale(c.to.tonic, c.to.scale);
  const diff = compareScales(a, b);
  const fmt = (xs: string[]) => (xs.length ? xs.join(' ') : t('lessons.compareNone'));
  return (
    <div className="compare">
      <div><span className="label">{a.tonic} {a.name}</span>{a.notes.join(' ')}</div>
      <div><span className="label">{b.tonic} {b.name}</span>{b.notes.join(' ')}</div>
      <div className="row" style={{ marginTop: 4 }}>
        <span className="badge badge-new">{t('lessons.compareAdded')}</span> {fmt(diff.added)}
        <span className="badge badge-review" style={{ marginLeft: 12 }}>{t('lessons.compareRemoved')}</span> {fmt(diff.removed)}
      </div>
    </div>
  );
}

function Quiz({ lesson }: { lesson: Lesson }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => lesson.quiz.map(() => null));
  const saveQuiz = usePractice((s) => s.saveQuiz);
  const done = answers.every((a) => a !== null);
  const score = answers.filter((a, i) => a === lesson.quiz[i].answer).length;
  useEffect(() => {
    if (done) void saveQuiz(lesson.id, score);
  }, [done, score, lesson.id, saveQuiz]);
  return (
    <div>
      {lesson.quiz.map((q, qi) => (
        <div key={qi} className="quiz-q">
          <p><span className="mono faint">{qi + 1}.</span> {q.question}</p>
          <div className="quiz-options">
            {q.options.map((o, oi) => {
              const chosen = answers[qi] === oi;
              const cls = answers[qi] === null ? '' : oi === q.answer ? 'correct' : chosen ? 'wrong' : '';
              return (
                <button
                  key={oi}
                  className={`btn btn-sm quiz-option ${cls}`}
                  disabled={answers[qi] !== null}
                  onClick={() => setAnswers(answers.map((a, i) => (i === qi ? oi : a)))}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {answers[qi] !== null && <p className="muted small">{q.explain}</p>}
        </div>
      ))}
      {done && (
        <p className="notice notice-ok" style={{ marginTop: 10 }}>
          <CircleCheck size={14} />
          <span>{t('lessons.quizScore', { n: score, total: lesson.quiz.length })}</span>
        </p>
      )}
    </div>
  );
}

export function LessonPage({ id }: { id: string }) {
  const go = useNav((s) => s.go);
  const lesson = getLesson(id);
  const { progress, startLesson, completeLesson } = usePractice();
  const audition = usePlaybackStore((s) => s.audition);
  const auditioning = usePlaybackStore((s) => s.auditioning);
  const playing = usePlaybackStore((s) => s.playing);

  useEffect(() => () => usePlaybackStore.getState().stop(), []);

  if (!lesson) return <div className="page">Not found</div>;
  const p = progress.get(lesson.id);
  const unlocked = isUnlocked(lesson.id, progress);
  const items = itemsForLesson(lesson.id);
  const back = { name: 'lesson', id: lesson.id } as const;
  const listening = auditioning !== null && playing;
  const isPlaying = (seqId: string) => auditioning === seqId && playing;

  const playSeq = (seqId: string) => {
    const seq = getSequence(seqId);
    if (seq) void audition(seq);
  };
  const PlayIcon = ({ seqId }: { seqId: string }) =>
    isPlaying(seqId) ? <Square size={12} fill="currentColor" /> : <Play size={13} fill="currentColor" />;

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm back" onClick={() => go({ name: 'lessons' })}>
        <ArrowLeft size={15} />
        {t('lessons.back')}
      </button>
      <header className="lesson-header">
        <div className="lesson-num">{lesson.order}</div>
        <div>
          <h1>{lesson.title}</h1>
          <p>{lesson.subtitle}</p>
        </div>
        <div>
          {!p?.startedAt && (
            <button className="btn btn-primary" disabled={!unlocked} onClick={() => void startLesson(lesson.id)}>
              {!unlocked && <Lock size={14} />}
              {unlocked ? t('lessons.start') : t('lessons.locked')}
            </button>
          )}
          {p?.startedAt && !p.completedAt && (
            <button className="btn" onClick={() => void completeLesson(lesson.id)}>
              <CircleCheck size={15} />
              {t('lessons.markDone')}
            </button>
          )}
          {p?.completedAt && <span className="badge badge-apply"><CircleCheck size={12} />{t('lessons.completed')}</span>}
        </div>
      </header>

      {listening && (
        <div className="stage audition-stage" style={{ marginBottom: 12 }}>
          <LiveFretboard />
        </div>
      )}

      <div className="lesson-body">
        <Section n={1} title="lessons.what" section={lesson.what}>
          {lesson.what.formula && (
            <div className="formula">
              <span className="faint">{t('lessons.formula')}</span>
              <span>{lesson.what.formula}</span>
            </div>
          )}
          {lesson.what.shapeSequenceId && (
            <div className="row">
              <button className="btn" onClick={() => playSeq(lesson.what.shapeSequenceId!)}>
                <PlayIcon seqId={lesson.what.shapeSequenceId} />
                {isPlaying(lesson.what.shapeSequenceId) ? t('lessons.stop') : t('lessons.listen')}
              </button>
              <button className="btn" onClick={() => go({ name: 'practice', itemId: lesson.what.shapeSequenceId!, back })}>
                <Eye size={15} />
                {t('lessons.showShape')}
              </button>
            </div>
          )}
        </Section>

        <Section n={2} title="lessons.sound" section={lesson.sound}>
          <div className="row">
            {lesson.sound.auditions.map((a) => (
              <button key={a.sequenceId} className={`btn ${isPlaying(a.sequenceId) ? 'active' : ''}`} onClick={() => playSeq(a.sequenceId)}>
                <PlayIcon seqId={a.sequenceId} />
                {a.label}
              </button>
            ))}
          </div>
        </Section>

        <Section n={3} title="lessons.related" section={lesson.related}>
          <Compare lesson={lesson} />
        </Section>

        <Section n={4} title="lessons.usage" section={lesson.usage} />

        <Section n={5} title="lessons.pitfalls">
          <ul>
            {lesson.pitfalls.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Section>

        <Section n={6} title="lessons.tryNow">
          <p className="task">{lesson.tryNow.task}</p>
          <button className="btn btn-primary" onClick={() => go({ name: 'practice', itemId: lesson.tryNow.itemId, back })}>
            {t('lessons.doTask')}：{getItem(lesson.tryNow.itemId)?.title}
            <ChevronRight size={15} />
          </button>
        </Section>

        <section className="card">
          <h2 style={{ marginBottom: 8 }}>{t('lessons.practiceItems')}</h2>
          <ul className="item-list">
            {items.map((it) => (
              <li key={it.id}>
                <span className="badge">{t(`kind.${it.kind}`)}</span>
                <button className="link" onClick={() => go({ name: 'practice', itemId: it.id, back })}>{it.title}</button>
                <button className={`btn btn-icon btn-sm ${isPlaying(it.sequenceId) ? 'active' : ''}`} onClick={() => playSeq(it.sequenceId)} aria-label={t('lessons.listen')}>
                  <PlayIcon seqId={it.sequenceId} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 style={{ marginBottom: 4 }}>{t('lessons.quiz')}</h2>
          <Quiz key={lesson.id} lesson={lesson} />
        </section>
      </div>
    </div>
  );
}
