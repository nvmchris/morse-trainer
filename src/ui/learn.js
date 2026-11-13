// Learn view: timing rules, then lessons that introduce a few characters
// at a time and hand off to practice.
import { LESSONS } from '../lessons.js';
import { displayText } from '../items.js';
import { el, codeView } from './dom.js';

function introCard() {
  const rules = [
    ['Dot', '1 unit'],
    ['Dash', '3 units'],
    ['Gap inside a letter', '1 unit'],
    ['Gap between letters', '3 units'],
    ['Gap between words', '7 units'],
  ];
  return el(
    'section',
    { class: 'card intro' },
    el('h2', {}, 'How Morse works'),
    el(
      'p',
      {},
      'Every character is a pattern of short signals (dots) and long signals (dashes). ',
      'Learn the sound, not the picture: say “di” for a dot and “dah” for a dash, so A is “di-dah”.',
    ),
    el(
      'table',
      { class: 'rules' },
      el(
        'tbody',
        {},
        rules.map(([name, length]) => el('tr', {}, el('th', {}, name), el('td', {}, length))),
      ),
    ),
    el('h3', {}, 'Two ways to answer'),
    el(
      'ul',
      {},
      el(
        'li',
        {},
        el('strong', {}, 'Type: '),
        'type . and - , a space between letters, and / between words. Press Enter to check.',
      ),
      el(
        'li',
        {},
        el('strong', {}, 'Space bar key: '),
        'tap Space for a dot, hold it for a dash. Pause to finish a letter. The speed setting (WPM) sets how long a dot is.',
      ),
    ),
    el(
      'p',
      { class: 'muted' },
      'Work through the lessons in order. A lesson is ticked off after 10 right answers in a row.',
    ),
  );
}

export function createLearn({ getCompleted, onPlay, onPlaySequence, onPractice }) {
  const list = el('div', { class: 'lesson-list' });
  const detail = el('div', { class: 'lesson-detail card', hidden: true });

  function renderList() {
    const completed = new Set(getCompleted());
    list.replaceChildren(
      ...LESSONS.map((lesson, index) =>
        el(
          'button',
          {
            type: 'button',
            class: `lesson-button ${completed.has(index) ? 'done' : ''}`,
            onClick: () => showLesson(index),
          },
          el('span', { class: 'lesson-number' }, `Lesson ${index + 1}`),
          el('span', { class: 'lesson-title' }, lesson.title),
          el('span', { class: 'lesson-chars' }, lesson.items.map(displayText).join(' ')),
          completed.has(index) ? el('span', { class: 'lesson-check' }, '✓ done') : null,
        ),
      ),
    );
  }

  function showLesson(index) {
    const lesson = LESSONS[index];
    const includeEarlier = el('input', {
      type: 'checkbox',
      checked: index > 0,
      disabled: index === 0,
    });
    detail.replaceChildren(
      el('h2', {}, `Lesson ${index + 1}: ${lesson.title}`),
      el('p', { class: 'muted' }, 'Click a card to hear it. Listen a few times, then practise.'),
      el(
        'div',
        { class: 'learn-grid' },
        lesson.items.map((item) =>
          el(
            'button',
            { type: 'button', class: 'learn-card', onClick: () => onPlay(item) },
            el('span', { class: 'learn-char' }, displayText(item)),
            codeView(item.code, 'large'),
            el('span', { class: 'learn-code' }, item.code),
            item.note ? el('span', { class: 'learn-note' }, item.note) : null,
          ),
        ),
      ),
      el(
        'div',
        { class: 'row' },
        el('button', { type: 'button', onClick: () => onPlaySequence(lesson.items) }, '▶ Play all'),
        el(
          'button',
          {
            type: 'button',
            class: 'primary',
            onClick: () => onPractice(index, includeEarlier.checked),
          },
          'Practise this lesson →',
        ),
        el('label', { class: 'check' }, includeEarlier, ' include earlier lessons'),
      ),
    );
    detail.hidden = false;
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const root = el('div', { class: 'learn' }, introCard(), el('h2', {}, 'Lessons'), list, detail);
  renderList();
  return { root, refresh: renderList };
}
