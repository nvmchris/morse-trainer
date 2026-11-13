// Grid of every code, grouped by category. Click a cell to hear it.
import { CATEGORIES, displayText } from '../items.js';
import { el, codeView } from './dom.js';

const SHEET_CATEGORIES = ['letters', 'numbers', 'signs', 'prosigns'];

export function createCheatsheet({ onPlay, compact = false }) {
  const search = el('input', {
    type: 'search',
    class: 'sheet-search',
    placeholder: 'Filter by character or code…',
    'aria-label': 'Filter cheatsheet',
  });

  const sections = SHEET_CATEGORIES.map((key) => {
    const cells = CATEGORIES[key].items.map((item) => {
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
        el('span', { class: 'sheet-text' }, item.code),
      );
      cell.dataset.search = `${item.text} ${item.code}`.toLowerCase();
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

  return el(
    'div',
    { class: `cheatsheet ${compact ? 'compact' : ''}`.trim() },
    search,
    sections.map((s) => s.section),
  );
}
