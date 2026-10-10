# OurLingo

A family vocabulary learning app with MORE! 1, Units 1-2, and MORE! 2, Units 1-3.

## Current Features

- Open in kid space by default, with a unit library and practice for approved units only.
- Switch to parent space to create, review, approve or delete units in MORE! 1 and MORE! 2.
- Select units or filter by book; vocabulary and answer choices stay separate for each unit.
- Review user-photo transcriptions: MORE! 1 has 42/41 entries in Units 1/2; MORE! 2 has 45/39/33 entries in Units 1/2/3.
- Word File illustrations are included with explicitly labelled suggested German translations. Editing those translations marks them as parent translations; their provenance is preserved on save and download.
- Edit English, German and examples, search across all fields, and add or remove entries.
- Approve and save a unit before practising it.
- Practise in either direction with 5, 10 or all words, then retry missed words.
- Choose typed answers or multiple choice. Multiple choice has one correct answer and up to three distinct distractors, excluding known overlapping translations and prompts. Small units use fewer choices; questions without a safe distractor are omitted.
- Matching pairs shows up to five English words on the left and their German translations independently shuffled on the right. Select either side first; correct pairs stay in place and lock, while a wrong match can be tried again. Boards exclude overlapping answers in both languages and need at least two unambiguous pairs.
- Matching results count first-try matches. Retry boards prioritise missed words and add other words from the same unit to fill the five-pair board. Matching uses both languages together and does not use the direction or round-size settings.
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

The kid/parent switch separates learning from editing but has no password or PIN. Parent space is accessible to anyone using the browser. Every page reload returns to kid space.

## Data and Limitations

The bundled datasets under `public/data/` cover MORE! 1, Units 1-2, and MORE! 2, Units 1-3. They are manual transcriptions of user-provided photos, not automated OCR results. All new units remain pending until approved in the app.

Each additional bundled unit is added once to existing libraries without replacing populated units or their approval. Empty pending drafts receive the matching transcription, retaining their titles. `bundledUnitKeys` remembers imported units so deletion stays permanent. A failed download does not prevent other units loading or remove saved vocabulary; refreshing retries failed additions. The files to load are listed in `bundledUnitFiles` in `src/vocabulary.ts`.

MORE! 2 Unit 1 contains 34 bilingual-table entries with examples and 11 illustrated school subjects. Unit 2 contains 39 bilingual entries and examples. Unit 3 contains 27 bilingual entries with examples and six additional illustrated Halloween terms; "Trick or treat!" is already in the table and is not duplicated. Illustrations show English labels only: their German translations are suggestions, not transcribed textbook text. These entries carry `origin: "word-file"` and `translationSource: "suggested"` until a parent edits the translation.

The library is held in localStorage under `ourlingo.library.v1`, separately for each browser and URL origin. Existing Unit 1 data from `ourlingo.more-1-unit-1.v1` is migrated automatically when no library exists, retaining edits and approval. The legacy copy is kept. Each book/unit pair has its own vocabulary; duplicate pairs cannot be created.

In parent space, choose **Add unit**, select the book and unit number, and optionally enter a title. A new unit is saved as an empty draft. Add vocabulary in its review screen and choose **Save & approve** when complete. Pending units are visible but not playable in kid space. Unit deletion and abandoning unsaved edits or unfinished rounds require confirmation.

The five supplied units come with photo transcriptions and the marked Word File suggestions. Other units must be entered by a parent; no textbook contents are invented. Saved data is not written back to source files or synchronized to other devices. Clearing site data removes the library. JSON downloads copy the selected unit, including unsaved edits; restore/import is not implemented yet.

Practice scores last for the current round only. Separate learner profiles, persistent learning progress, image uploads and automated page scanning are not implemented yet.

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

Library tests also cover distinct book/unit identities, isolated updates, empty drafts, migration of old saved edits, kid-default reloads, creation and practice in both books, duplicate prevention, unsaved-edit confirmation and persistent deletion. Browser tests start their own server on port 5178.
