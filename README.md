# OurLingo

A family vocabulary learning app, starting with MORE! 1, Unit 1.

## Current Features

- Review the 42 entries and 40 example sentences transcribed from the supplied workbook photo.
- Edit English, German and examples, search across all fields, and add or remove entries.
- Approve and save a unit before practising it.
- Practise in either direction with 5, 10 or all words, then retry missed words.
- Choose typed answers or multiple choice. Multiple choice has one correct answer and up to three distinct distractors, excluding known overlapping translations and prompts. Small units use fewer choices; questions without a safe distractor are omitted.
- Accept listed translation alternatives, optional workbook forms, and differences in case or final punctuation.
- Download a JSON copy of vocabulary, including unsaved edits.
- Responsive review and practice layouts for desktop, tablets and phones.

## Run

Requires a Node.js version supported by Vite 8 (20.19+ or 22.12+) and npm.

```sh
npm install
npm run dev -- --host 0.0.0.0
```

Open the local or network URL printed by Vite. A phone or tablet must be on a network that can reach this computer. Firewall rules and Wi-Fi client isolation can prevent access. The server must remain running.

The development server has no authentication. Use it only on a trusted local network; do not expose it to the internet. "Parent space" is a view label, not an access restriction.

## Data and Limitations

The initial dataset is `public/data/more-1-unit-1.json`. It is a manual transcription of a user-provided photo, not an automated OCR result. It remains pending until approved in the app.

Saved vocabulary is held in localStorage under `ourlingo.more-1-unit-1.v1`, separately for each browser and URL origin. It is not written back to the source file or synchronized to other devices. Clearing site data removes saved vocabulary. Unsaved edits trigger a browser warning when leaving the page. JSON downloads are an extra copy; a restore/import screen is not implemented yet.

Practice scores last for the current round only. Separate learner profiles, persistent learning progress, additional units, MORE! 2 navigation, image uploads and automated page scanning are not implemented in this first slice. The data model allows both books, but the current UI opens MORE! 1, Unit 1 only.

The app does not translate automatically or judge unlisted synonyms. German umlauts matter. Example sentences are shown after an answer, not used as answer targets.

Display fonts are fetched from Google Fonts, with local fallbacks if unavailable. The study image is stored locally; source: [Unsplash image](https://images.unsplash.com/photo-1455390582262-044cdead277a).

## Verification

```sh
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

Unit tests cover workbook integrity, validation, answer variants and random rounds. Browser tests cover editing and persistence, validation, deletion, JSON downloads, practice and retries, corrupt storage recovery, image loading, and layout/text fit at 1440, 768, 390 and 320 pixels. Browser tests start their own server on port 5178.
