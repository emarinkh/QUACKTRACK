# Answers

## 1. How to run

No installs are required. This project uses plain HTML, CSS, and JavaScript.

Steps:

1. Open the project folder.
2. Open `index.html` in a modern browser.

There is no deployed URL for this version.

## 2. Stack & design choices

I chose vanilla HTML, CSS, and JavaScript because this is a small single-page habit tracker. A framework would add setup and build steps without much benefit, and the assessment specifically works well as a browser-only app.

I used a weekly table grid because the main task is comparing habits across days. Habits run down the left side, days run across the top, and each checkmark sits where the habit and day meet, so progress is readable at a glance.

I highlighted today's column with a soft green background and stronger header line. The rest of the grid stays quiet so the user's eye lands on the most important action: what needs to be checked off today.

The week starts on Monday because it groups weekdays together and keeps the weekend at the end, which matches how many people plan routines.

## 3. Responsive & accessibility

On a 360px-wide phone, the layout keeps the header and add form compact, and the habit grid scrolls horizontally so the seven-day structure stays readable instead of being crushed. On a 1440px laptop, the app uses a wider max width so more habit names and grid cells are visible at once.

Accessibility handled: buttons have screen-reader labels, focus states are visible, and habit names can be opened for renaming with keyboard Enter or Space.

Accessibility skipped: I did not add a full live region announcement when a habit is checked or unchecked. With another day, I would add a small `aria-live` status message so screen reader users get immediate feedback after toggling a cell.

## 4. AI usage

I used ChatGPT/Codex to review and improve the frontend. I asked it to fix the broken button interactivity, simplify the add-habit placeholder, show dates more clearly, remove the bottom legend, and check the submission requirements.

One change I made from the AI-assisted output was keeping the app fully static. The tool first tried to verify with Node, but Node is not allowed or installed for this project, so the final run instructions use only opening `index.html` in the browser.

I also adjusted the UI text to remove example habits from the input and empty state because the final version should feel cleaner and less crowded.

## 5. Honest gap

The least polished part is testing and validation. The main interactions are implemented, but there is no automated browser test for adding, checking, reloading, and navigating weeks. With another day, I would add a small manual test checklist or browser-based tests and improve the rename/delete flows with custom confirmation UI instead of the default browser confirm dialog.

Streak rule: the streak counts consecutive checked days going backward from today. If today is unchecked, it still shows the streak through yesterday, which lets users keep seeing an active streak before they complete today's habit.
