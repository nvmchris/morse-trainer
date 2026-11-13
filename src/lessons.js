// Lessons introduce characters a few at a time, simplest codes first.
import { CATEGORIES, itemForChar } from './items.js';

function charLesson(title, chars) {
  return { title, items: [...chars].map(itemForChar) };
}

export const LESSONS = Object.freeze([
  charLesson('One symbol', 'ET'),
  charLesson('Two symbols', 'IANM'),
  charLesson('Three symbols', 'SURWDKGO'),
  charLesson('Four symbols I', 'HVFL'),
  charLesson('Four symbols II', 'PJBX'),
  charLesson('Four symbols III', 'CYZQ'),
  charLesson('Numbers 1–5', '12345'),
  charLesson('Numbers 6–0', '67890'),
  charLesson('Common signs', '.,?/='),
  charLesson('More signs', '\'!()&:;+-_"$@'),
  { title: 'Prosigns', items: CATEGORIES.prosigns.items },
]);

// Items for practising a lesson, optionally with every earlier lesson too
// so older characters keep being repeated.
export function lessonPracticeItems(index, includeEarlier) {
  if (!LESSONS[index]) throw new Error(`No lesson ${index}`);
  const lessons = includeEarlier ? LESSONS.slice(0, index + 1) : [LESSONS[index]];
  return lessons.flatMap((lesson) => lesson.items);
}
