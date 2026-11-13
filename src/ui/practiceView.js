// Practice view: shows a prompt, takes an answer (typed or keyed with the
// space bar), checks it and keeps score.
import { CATEGORIES, displayText, letterCount } from '../items.js';
import { LESSONS, lessonPracticeItems } from '../lessons.js';
import { DIRECTION, buildPool, filterForDirection, pickNext, checkAnswer } from '../practice.js';
import { Keyer, LETTER_GAP_RANGE_MS } from '../keyer.js';
import { decode, decodeSymbol } from '../morse.js';
import { isKnown, selectionWeight, toPercent } from '../mastery.js';
import { el, codeView } from './dom.js';

const INPUT = Object.freeze({ TYPE: 'type', KEY: 'key' });
const CORRECT_ADVANCE_MS = 700;
const DECODE_AUTOPLAY_DELAY_MS = 250;
const KEYER_POLL_MS = 15;
const LESSON_PASS_STREAK = 10;
const ALLOWED_CODE_CHARS = /[^.\-\s/·•_–—]/g;

function radioGroup(name, options, current, onChange) {
  return el(
    'div',
    { class: 'segmented', role: 'radiogroup' },
    options.map(([value, label]) =>
      el(
        'label',
        {},
        el('input', {
          type: 'radio',
          name,
          value,
          checked: value === current,
          onChange: () => onChange(value),
        }),
        el('span', {}, label),
      ),
    ),
  );
}

export function createPractice({
  tone,
  getUnitMs,
  getLetterGapMs,
  setLetterGapMs,
  isSoundOn,
  getScore,
  recordResult,
  isActive,
  onLessonComplete,
  cheatsheet,
}) {
  const state = {
    direction: DIRECTION.ENCODE,
    input: INPUT.TYPE,
    categories: new Set(['letters']),
    listenOnly: false,
    lesson: null, // { index, items }
    item: null,
    answered: false,
    hinted: false,
    keyedLetters: [],
    score: { right: 0, total: 0, streak: 0, best: 0 },
  };
  const keyer = new Keyer(getUnitMs(), getLetterGapMs());
  let advanceTimer = null;

  // ---- elements -------------------------------------------------------
  const promptMain = el('div', { class: 'prompt-main' });
  const promptNote = el('div', { class: 'prompt-note muted' });
  const playButton = el('button', { type: 'button', onClick: () => playItem() }, '▶ Hear it');
  const answerInput = el('input', {
    type: 'text',
    class: 'answer-input',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: false,
    'aria-label': 'Your answer',
  });
  const keyButton = el(
    'button',
    { type: 'button', class: 'key-button' },
    'Hold SPACE (or press here)',
  );
  const keyedView = el('div', { class: 'keyed', 'aria-live': 'polite' });
  const pauseBar = el('div', { class: 'pause-bar' }, el('span'));
  const letterGapValue = el('output', {}, `${getLetterGapMs()} ms`);
  const letterGapInput = el('input', {
    type: 'range',
    ...LETTER_GAP_RANGE_MS,
    value: getLetterGapMs(),
    'aria-label': 'Pause that ends a letter',
    onInput: () => {
      const ms = Number(letterGapInput.value);
      keyer.letterGapMs = ms;
      letterGapValue.textContent = `${ms} ms`;
      setLetterGapMs(ms);
    },
  });
  const letterGapSetting = el(
    'label',
    { class: 'letter-gap muted' },
    'Pause that ends a letter: ',
    letterGapValue,
    letterGapInput,
  );
  const keyPad = el('div', { class: 'key-pad' }, keyButton, pauseBar, keyedView, letterGapSetting);
  const feedback = el('div', { class: 'feedback', 'aria-live': 'polite' });
  const scoreView = el('div', { class: 'score' });
  const lessonBanner = el('div', { class: 'lesson-banner', hidden: true });
  const emptyMessage = el(
    'p',
    { class: 'muted', hidden: true },
    'Pick at least one category above.',
  );

  const inputMethodGroup = radioGroup(
    'input-method',
    [
      [INPUT.TYPE, 'Type . and -'],
      [INPUT.KEY, 'Space bar key'],
    ],
    state.input,
    (value) => {
      state.input = value;
      next();
    },
  );
  const listenOnlyBox = el('input', {
    type: 'checkbox',
    onChange: (e) => {
      state.listenOnly = e.target.checked;
      renderPrompt();
    },
  });
  const listenOnlyLabel = el('label', { class: 'check' }, listenOnlyBox, ' listen only');
  const categoryBoxes = Object.entries(CATEGORIES).map(([key, { label }]) =>
    el(
      'label',
      { class: 'chip' },
      el('input', {
        type: 'checkbox',
        checked: state.categories.has(key),
        onChange: (e) => {
          if (e.target.checked) state.categories.add(key);
          else state.categories.delete(key);
          state.lesson = null;
          next();
        },
      }),
      el('span', {}, label),
    ),
  );
  const sheetPanel = el('aside', { class: 'sheet-panel card', hidden: true }, cheatsheet);
  const sheetToggle = el(
    'button',
    {
      type: 'button',
      onClick: () => {
        sheetPanel.hidden = !sheetPanel.hidden;
        sheetToggle.classList.toggle('active', !sheetPanel.hidden);
      },
    },
    'Cheatsheet',
  );

  const toolbar = el(
    'div',
    { class: 'toolbar card' },
    el(
      'div',
      { class: 'row' },
      radioGroup(
        'direction',
        [
          [DIRECTION.ENCODE, 'Send: text → Morse'],
          [DIRECTION.DECODE, 'Read: Morse → text'],
        ],
        state.direction,
        (value) => {
          state.direction = value;
          next();
        },
      ),
      inputMethodGroup,
      listenOnlyLabel,
      sheetToggle,
    ),
    el('div', { class: 'row chips' }, categoryBoxes),
  );

  const trainer = el(
    'div',
    { class: 'trainer card' },
    lessonBanner,
    emptyMessage,
    el('div', { class: 'prompt' }, promptMain, promptNote, playButton),
    el('div', { class: 'answer' }, answerInput, keyPad),
    feedback,
    el(
      'div',
      { class: 'row actions' },
      el('button', { type: 'button', onClick: () => submit() }, 'Check (Enter)'),
      el('button', { type: 'button', onClick: () => cancelInput() }, 'Cancel (Esc)'),
      el('button', { type: 'button', onClick: () => showHint() }, 'Hint'),
      el('button', { type: 'button', onClick: () => next() }, 'Skip'),
    ),
    scoreView,
  );

  const root = el(
    'div',
    { class: 'practice' },
    toolbar,
    el('div', { class: 'practice-layout' }, trainer, sheetPanel),
  );

  // ---- behaviour ------------------------------------------------------
  const isKeying = () => state.direction === DIRECTION.ENCODE && state.input === INPUT.KEY;

  function playItem() {
    if (!state.item || !isSoundOn()) return;
    tone.play(state.item.code, getUnitMs());
  }

  function currentPool() {
    if (state.lesson) return filterForDirection(state.lesson.items, state.direction);
    return buildPool([...state.categories], state.direction);
  }

  function next() {
    clearTimeout(advanceTimer);
    tone.stop();
    state.item = pickNext(currentPool(), state.item, Math.random, (item) =>
      selectionWeight(getScore(item)),
    );
    state.answered = false;
    state.hinted = false;
    state.keyedLetters = [];
    keyer.reset();
    answerInput.value = '';
    feedback.replaceChildren();
    feedback.className = 'feedback';
    renderControls();
    renderPrompt();
    renderKeyed();
    renderScore();
    if (!state.item) return;
    if (state.direction === DIRECTION.DECODE) setTimeout(playItem, DECODE_AUTOPLAY_DELAY_MS);
    if (isActive() && !isKeying()) answerInput.focus();
  }

  function renderControls() {
    const encoding = state.direction === DIRECTION.ENCODE;
    inputMethodGroup.hidden = !encoding;
    listenOnlyLabel.hidden = encoding;
    answerInput.hidden = isKeying();
    keyPad.hidden = !isKeying();
    answerInput.placeholder = encoding
      ? '.- with a space between letters, then Enter'
      : 'Type what you see or hear, then Enter';
    emptyMessage.hidden = Boolean(state.item);
    emptyMessage.textContent = state.lesson
      ? 'Prosigns can only be practised in Send mode.'
      : 'Pick at least one category above.';
    lessonBanner.hidden = !state.lesson;
    if (state.lesson) {
      const lesson = LESSONS[state.lesson.index];
      lessonBanner.replaceChildren(
        el('span', {}, `Practising lesson ${state.lesson.index + 1}: ${lesson.title}`),
        el(
          'button',
          {
            type: 'button',
            onClick: () => {
              state.lesson = null;
              next();
            },
          },
          'Back to free practice',
        ),
      );
    }
  }

  function renderPrompt() {
    const item = state.item;
    if (!item) {
      promptMain.replaceChildren();
      promptNote.textContent = '';
      return;
    }
    if (state.direction === DIRECTION.ENCODE) {
      promptMain.replaceChildren(el('span', { class: 'prompt-text' }, displayText(item)));
      promptNote.textContent =
        item.note ?? (item.kind === 'word' ? `${item.text.length} letters` : '');
    } else if (state.listenOnly) {
      promptMain.replaceChildren(el('span', { class: 'prompt-text muted' }, '🔊'));
      promptNote.textContent = 'Listen and type what you hear';
    } else {
      promptMain.replaceChildren(codeView(item.code, 'large'));
      promptNote.textContent = item.code;
    }
  }

  function renderKeyed() {
    const letters = state.keyedLetters.map((code) =>
      el('span', { class: 'keyed-letter' }, codeView(code), el('b', {}, decodeSymbol(code))),
    );
    const inProgress = keyer.current
      ? el('span', { class: 'keyed-letter pending' }, codeView(keyer.current), el('b', {}, '…'))
      : null;
    keyedView.replaceChildren(...letters, inProgress ?? '');
    if (!letters.length && !inProgress) {
      keyedView.append(
        el(
          'span',
          { class: 'muted' },
          'Tap for a dot, hold for a dash, pause between letters. Esc cancels.',
        ),
      );
    }
  }

  function renderScore() {
    const { right, total, streak, best } = state.score;
    const percent = total ? Math.round((right / total) * 100) : 0;
    const pool = currentPool();
    const known = pool.filter((item) => isKnown(getScore(item))).length;
    scoreView.textContent =
      `Right ${right} / ${total} (${percent}%) · Streak ${streak} · Best ${best}` +
      ` · Known (≥90%) ${known} / ${pool.length} in this set`;
  }

  function currentAnswer() {
    return isKeying() ? state.keyedLetters.join(' ') : answerInput.value;
  }

  function submit() {
    if (!state.item || state.answered) return;
    const answer = currentAnswer();
    if (!answer.trim()) return;
    state.answered = true;
    const item = state.item;
    const correct = checkAnswer(item, answer, state.direction) && !state.hinted;
    const score = state.score;
    score.total += 1;
    if (correct) {
      score.right += 1;
      score.streak += 1;
      score.best = Math.max(score.best, score.streak);
    } else {
      score.streak = 0;
    }
    const before = getScore(item);
    recordResult(item, correct);
    renderScore();
    showFeedback(correct, answer);
    feedback.append(masteryLine(item, before, getScore(item)));

    if (correct && state.lesson && score.streak >= LESSON_PASS_STREAK) {
      onLessonComplete(state.lesson.index);
      feedback.append(
        el('div', { class: 'lesson-passed' }, `🎉 Lesson ${state.lesson.index + 1} complete!`),
      );
    }
    if (correct) {
      advanceTimer = setTimeout(next, CORRECT_ADVANCE_MS);
    } else {
      playItem();
    }
  }

  function masteryLine(item, before, after) {
    const from = before === undefined ? 'new' : `${toPercent(before)}%`;
    return el(
      'div',
      { class: 'mastery-line' },
      el('span', {}, `${displayText(item)} known: ${from} → ${toPercent(after)}%`),
      el('span', { class: 'mastery-bar', style: `--mastery: ${after}` }, el('span')),
      isKnown(after) ? el('span', {}, '✓ known') : null,
    );
  }

  function showFeedback(correct, answer) {
    const item = state.item;
    feedback.className = `feedback ${correct ? 'good' : 'bad'}`;
    if (correct) {
      feedback.replaceChildren(el('strong', {}, state.hinted ? 'Right, with a hint' : '✓ Right'));
      return;
    }
    const yours =
      state.direction === DIRECTION.ENCODE
        ? [
            el('span', {}, 'You sent '),
            el('code', {}, answer),
            el('span', {}, ` (reads as “${decode(answer)}”)`),
          ]
        : [el('span', {}, 'You typed '), el('code', {}, answer.toUpperCase())];
    feedback.replaceChildren(
      el('div', {}, el('strong', {}, state.hinted ? 'Hint used' : '✗ Not quite')),
      el('div', {}, ...yours),
      el(
        'div',
        { class: 'correct-answer' },
        el('span', {}, `${displayText(item)} = `),
        codeView(item.code),
        el('code', {}, item.code),
      ),
      el('div', { class: 'muted' }, 'Press Enter or Space for the next one.'),
    );
  }

  function showHint() {
    if (!state.item || state.answered) return;
    state.hinted = true;
    const item = state.item;
    feedback.className = 'feedback hint';
    feedback.replaceChildren(
      el('span', {}, 'Hint: '),
      state.direction === DIRECTION.ENCODE
        ? el('code', {}, item.code)
        : el('strong', {}, displayText(item)),
    );
    playItem();
  }

  // ---- space bar keyer --------------------------------------------------
  function keyDown() {
    if (state.answered) return next();
    keyer.unitMs = getUnitMs();
    keyer.press(performance.now());
    keyButton.classList.add('down');
    if (isSoundOn()) tone.on();
  }

  // Throws away what has been entered so far, without checking it.
  function cancelInput() {
    if (!state.item || state.answered) return;
    keyer.reset();
    keyButton.classList.remove('down');
    tone.off();
    pauseBar.style.setProperty('--progress', 0);
    state.keyedLetters = [];
    answerInput.value = '';
    renderKeyed();
    if (!isKeying()) answerInput.focus();
  }

  function keyUp() {
    if (!keyer.isDown) return;
    keyer.release(performance.now());
    keyButton.classList.remove('down');
    tone.off();
    renderKeyed();
  }

  setInterval(() => {
    if (!isKeying() || state.answered || !state.item) return;
    const now = performance.now();
    pauseBar.style.setProperty('--progress', keyer.pauseProgress(now));
    const letter = keyer.poll(now);
    if (!letter) return;
    state.keyedLetters.push(letter);
    renderKeyed();
    if (state.keyedLetters.length >= letterCount(state.item)) submit();
  }, KEYER_POLL_MS);

  keyButton.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    keyButton.setPointerCapture(e.pointerId);
    keyDown();
  });
  keyButton.addEventListener('pointerup', keyUp);
  keyButton.addEventListener('pointercancel', keyUp);

  const isTextField = (target) => target === answerInput || target.matches?.('input[type=search]');

  document.addEventListener('keydown', (e) => {
    if (!isActive()) return;
    if (e.key === ' ') {
      if (isKeying() && !isTextField(e.target)) {
        e.preventDefault();
        if (!e.repeat) keyDown();
      } else if (state.answered && e.target === answerInput) {
        e.preventDefault();
        next();
      }
      return;
    }
    if (e.key === 'Enter') {
      if (e.target.tagName === 'BUTTON' && e.target !== keyButton) return;
      if (e.target.matches?.('input[type=search]')) return;
      e.preventDefault();
      if (state.answered) next();
      else submit();
      return;
    }
    if (e.key === 'Escape' && !e.target.matches?.('input[type=search]')) {
      e.preventDefault();
      cancelInput();
      return;
    }
    if (e.key === 'Backspace' && isKeying() && !isTextField(e.target)) {
      e.preventDefault();
      cancelInput();
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key !== ' ' || !isActive() || !isKeying() || isTextField(e.target)) return;
    e.preventDefault();
    keyUp();
  });

  answerInput.addEventListener('input', () => {
    if (state.direction !== DIRECTION.ENCODE) return;
    const cleaned = answerInput.value.replace(ALLOWED_CODE_CHARS, '');
    if (cleaned !== answerInput.value) answerInput.value = cleaned;
  });

  // ---- public API -------------------------------------------------------
  function startLesson(index, includeEarlier) {
    state.lesson = { index, items: lessonPracticeItems(index, includeEarlier) };
    state.score.streak = 0;
    next();
  }

  function onShow() {
    if (!state.item) next();
    else if (!isKeying()) answerInput.focus();
  }

  next();
  return { root, startLesson, onShow };
}
