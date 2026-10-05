# Product Overview

Fretquency is a progressive web app (PWA) and Capacitor mobile app that helps guitarists memorize note positions on the fretboard.

## Core Concept

The app presents timed quiz questions in two modes:
- **By Fret**: shows a fret number, user identifies the note (using a circle-of-fifths or alphabetical note selector)
- **By Note**: shows a note name, user taps the correct fret(s) on a fret grid

## Stage System

The curriculum is structured into ~86 auto-generated stages covering:
- 6 guitar strings × 2 fret ranges (0–12, 12–21) × 6 difficulty configs (dots only, natural notes, full chromatic — each in both quiz directions)
- Multi-string pair stages (strings 6+5, 4+3, 2+1)
- Full-neck all-strings stages

Stages progress from simple landmark frets (dot positions) through natural notes to full chromatic mastery.

## Key Features

- Timed countdown per question with configurable seconds
- Audio playback of guitar notes (MIDI soundfont samples fetched from CDN)
- Haptic feedback on correct/wrong answers
- Per-stage history tracking with accuracy stats (localStorage)
- Adaptive suggestions (advance or go back based on accuracy)
- Onboarding flow for first-time users
- Custom stages (user-defined settings saved locally)
- Supports sharp/flat accidental modes and alpha/solfege notation
- Offline-capable via service worker (Workbox)
- Deployed to GitHub Pages; also builds as Android app via Capacitor
