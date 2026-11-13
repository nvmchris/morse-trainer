// Wires the views, settings and audio together and handles tab navigation.
import { Tone } from './audio.js';
import { unitMsForWpm } from './keyer.js';
import { loadState, saveState } from './storage.js';
import { createCheatsheet } from './ui/cheatsheet.js';
import { createLearn } from './ui/learn.js';
import { createPractice } from './ui/practiceView.js';

const VIEWS = ['learn', 'practice', 'cheatsheet'];
const DEFAULT_VIEW = 'practice';

const state = loadState();
const tone = new Tone();
let activeView = null;

const getUnitMs = () => unitMsForWpm(state.wpm);
const isSoundOn = () => state.sound;

function play(item) {
  if (isSoundOn()) tone.play(item.code, getUnitMs());
}

// Plays items one after another with a word gap between them.
function playSequence(items) {
  const joined = items.map((item) => item.code).join(' / ');
  if (isSoundOn()) tone.play(joined, getUnitMs());
}

function markLessonComplete(index) {
  if (state.completedLessons.includes(index)) return;
  state.completedLessons = [...state.completedLessons, index];
  saveState(state);
  learn.refresh();
}

const practice = createPractice({
  tone,
  getUnitMs,
  isSoundOn,
  isActive: () => activeView === 'practice',
  onLessonComplete: markLessonComplete,
  cheatsheet: createCheatsheet({ onPlay: play, compact: true }),
});

const learn = createLearn({
  getCompleted: () => state.completedLessons,
  onPlay: play,
  onPlaySequence: playSequence,
  onPractice: (index, includeEarlier) => {
    practice.startLesson(index, includeEarlier);
    location.hash = 'practice';
  },
});

document.getElementById('view-learn').append(learn.root);
document.getElementById('view-practice').append(practice.root);
document.getElementById('view-cheatsheet').append(createCheatsheet({ onPlay: play }));

function showView(name) {
  const view = VIEWS.includes(name) ? name : DEFAULT_VIEW;
  activeView = view;
  for (const v of VIEWS) {
    document.getElementById(`view-${v}`).hidden = v !== view;
    document
      .querySelector(`[data-view="${v}"]`)
      .setAttribute('aria-current', v === view ? 'page' : 'false');
  }
  tone.stop();
  if (view === 'practice') practice.onShow();
}

window.addEventListener('hashchange', () => showView(location.hash.slice(1)));
showView(location.hash.slice(1));

// ---- settings -----------------------------------------------------------
const wpmInput = document.getElementById('wpm');
const wpmValue = document.getElementById('wpm-value');
const soundInput = document.getElementById('sound');

wpmInput.value = state.wpm;
wpmValue.textContent = state.wpm;
soundInput.checked = state.sound;

wpmInput.addEventListener('input', () => {
  state.wpm = Number(wpmInput.value);
  wpmValue.textContent = state.wpm;
  saveState(state);
});
soundInput.addEventListener('change', () => {
  state.sound = soundInput.checked;
  if (!state.sound) tone.stop();
  saveState(state);
});
