# morse-trainer

A browser-based Morse code trainer. Learn the alphabet, numbers and signs
step by step, then practise them, or whole words, by keying Morse with the
space bar or by typing `.` and `-`. A built-in cheatsheet shows every code
and plays it on click.

**Try it:** https://nvmchris.github.io/morse-trainer/

## Features

- **Learn**: timing rules plus 11 lessons that introduce a few characters at
  a time (letters, numbers, signs, prosigns). Each lesson has listenable cards
  and a "practise this lesson" button; a lesson is ticked off after 10 right
  answers in a row.
- **Practice** with letters, numbers, signs, prosigns and whole words, in two
  directions:
  - _Send_: see text, answer in Morse, either by typing `.` and `-` (space
    between letters) or by keying with the **space bar** (tap = dot, hold =
    dash, pause = next letter). Works with touch on the on-screen key too.
  - _Read_: see or only hear Morse, type the text.
- **Cheatsheet**: every code, searchable, click to hear. Also available as a
  side panel while practising.
- Adjustable speed (5–35 WPM) and sound on/off, saved in the browser.

No build step and no runtime dependencies: plain HTML, CSS and ES modules.

## Install

Requires Node.js 20 or newer.

```bash
npm install
```

## Run

```bash
npm start
```

Then open http://localhost:8000. Set `PORT` to use another port, e.g.
`PORT=8123 npm start`.

## Test

```bash
npm test
npm run lint
```

Owner: nvmchris
