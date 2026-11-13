// Grid of every code, grouped by category. Click a cell to hear it.
// Each cell shows how well the item is known.
import { CATEGORIES, displayText } from '../items.js';
import { el, codeView } from './dom.js';
import { isKnown, toPercent } from '../mastery.js';

const SHEET_CATEGORIES = ['letters', 'numbers', 'signs', 'prosigns'];

export function createCheatsheet({ onPlay, getScore, compact = false }) {
  const search = el('input', {
    type: 'search',
    class: 'sheet-search',
    placeholder: 'Filter by character or code…',
    'aria-label': 'Filter cheatsheet',
  });

  const scoreCells = [];
  const sections = SHEET_CATEGORIES.map((key) => {
    const cells = CATEGORIES[key].items.map((item) => {
      const scoreText = el('span', { class: 'sheet-score' });
      const scoreBar = el('span', { class: 'sheet-bar' }, el('span'));
      const cell = el(
        'button',
        {
          class: 'sheet-cell',
          type: 'button',
          title: item.note ?? `Play ${item.text}`,
          onClick: () => onPlay(item),
        },
        el('span', { class: 'sheet-char' }, displayText(item)),
        codeView(item.code),
        el('span', { class: 'sheet-text' }, item.code, scoreText),
        scoreBar,
      );
      cell.dataset.search = `${item.text} ${item.code}`.toLowerCase();
      scoreCells.push({ item, cell, scoreText });
      return cell;
    });
    const section = el(
      'section',
      { class: 'sheet-section' },
      el('h3', {}, CATEGORIES[key].label),
      el('div', { class: 'sheet-grid' }, cells),
    );
    return { section, cells };
  });

  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    for (const { section, cells } of sections) {
      let visible = 0;
      for (const cell of cells) {
        const show = !query || cell.dataset.search.includes(query);
        cell.hidden = !show;
        if (show) visible += 1;
      }
      section.hidden = visible === 0;
    }
  });

  function refresh() {
    for (const { item, cell, scoreText } of scoreCells) {
      const score = getScore(item);
      const seen = score !== undefined;
      cell.style.setProperty('--mastery', seen ? score : 0);
      cell.classList.toggle('known', isKnown(score));
      cell.classList.toggle('seen', seen);
      scoreText.textContent = seen ? ` · ${toPercent(score)}%` : '';
      cell.title = `${item.note ? `${item.note}. ` : ''}${seen ? `Known ${toPercent(score)}%` : 'Not practised yet'}`;
    }
  }

  const root = el(
    'div',
    { class: `cheatsheet ${compact ? 'compact' : ''}`.trim() },
    search,
    sections.map((s) => s.section),
  );
  refresh();
  return { root, refresh };
}
