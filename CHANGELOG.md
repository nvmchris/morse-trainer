# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Mastery score (0–100%) per item: right answers raise it slowly, wrong or
  hinted answers drop it sharply. Items under 90% come up 3–10× as often as
  known ones. Shown after each answer, in the cheatsheet and in the score line.
- Cancel button and Esc key in Practice to clear the current answer.

### Fixed

- Space bar keyer no longer ends a letter after a short pause; the pause
  that ends a letter is now a setting (default 800 ms) with a progress bar.

### Added

- Morse tables for letters, numbers, signs and prosigns, with encode/decode.
- Practice mode for letters, numbers, signs, prosigns and whole words, in
  Send (text → Morse) and Read (Morse → text) directions.
- Answering by typing `.` and `-` or by keying with the space bar, with sidetone.
- Learn section with timing rules and 11 lessons, with saved progress.
- Searchable cheatsheet, also as a side panel during practice.
- Speed (WPM) and sound settings.
- Local dev server, tests, ESLint, Prettier and GitHub Actions CI.
