import type { DemoTourStep } from './DemoTour';

// Step content for the first-time guided demo per practice domain
// (wishlist §L — a brand-new beginner's first round was a blind guess).
// Each array's last step uses `dismissOnInteract` so pressing Start (or
// answering the real first question) both ends the tour and begins the
// real drill in one natural action.

export const PRACTICE_DEMO_STEPS: DemoTourStep[] = [
  {
    selector: '.note-display, .fret-display',
    title: 'This is your question',
    body: "In \"by fret\" mode a fret number appears and you pick the matching note. In \"by note\" mode a note appears and you tap every matching fret.",
  },
  {
    selector: '.fret-grid, [data-demo="note-circle"]',
    title: 'Tap your answer here',
    body: 'Fret 0 is the open string — count up from there (fret 1, 2, 3…) to find the one you need.',
    dismissOnInteract: true,
  },
];

export const INTERVALS_DEMO_STEPS: DemoTourStep[] = [
  {
    selector: '.interval-exercise-cards',
    title: 'Pick what to practice',
    body: 'Identify an interval by ear, or find the target note on the neck.',
  },
  {
    selector: '.interval-selector .teacher-btn-primary',
    title: 'Start when ready',
    body: 'Tap Start to begin the drill with your picks above.',
    dismissOnInteract: true,
  },
];

export const SCALES_DEMO_STEPS: DemoTourStep[] = [
  {
    selector: '.scale-current-pick',
    title: 'Your current scale',
    body: 'This shows which scale and box you are practicing. New to scales? Start with the pentatonic or major chip here.',
  },
  {
    selector: '.scale-current-pick',
    title: 'Tap to begin',
    body: 'Pick a scale above, or just tap Start below to practice your current pick.',
    dismissOnInteract: true,
  },
];

export const STAFF_DEMO_STEPS: DemoTourStep[] = [
  {
    selector: '.staff-exercise-switcher',
    title: 'Choose an exercise',
    body: 'Name notes on the staff, find them on the neck, or read a short phrase.',
  },
  {
    selector: '[data-demo="start-btn"]',
    title: 'Start when ready',
    body: 'Tap Start to begin.',
    dismissOnInteract: true,
  },
];

export const TABS_DEMO_STEPS: DemoTourStep[] = [
  {
    selector: '.staff-exercise-switcher',
    title: 'Choose a topic',
    body: 'Single notes, chord shapes, or techniques (hammer-ons, slides, and more).',
  },
  {
    selector: '[data-demo="start-btn"]',
    title: 'Start when ready',
    body: 'Tap Start to begin.',
    dismissOnInteract: true,
  },
];

export const DAILY_CHALLENGE_DEMO_STEPS: DemoTourStep[] = [
  {
    selector: '.fotd-idle',
    title: 'Fret of the Day',
    body: 'One puzzle a day, the same for everyone. Find the note, and try to keep your streak going.',
  },
  {
    selector: '.start-btn',
    title: 'Tap to begin',
    body: 'Tap Start to try today’s puzzle.',
    dismissOnInteract: true,
  },
];
