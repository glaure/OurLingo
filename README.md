# OurLingo

A family vocabulary learning app with MORE! 1, Units 1-15, MORE! 2, Units 1-15 plus Irregular Verbs, and MORE! 3 and MORE! 4, Units 1-14 each.

For the Windows workspace transition and proposed Tauri v2 packaging work, see [Development Handoff](DEVELOPMENT-HANDOFF.md).

## Current Features

- Open in kid space by default, with a unit library and practice for approved units only.
- On first start, a welcome window asks which MORE! book(s) the family uses (several can be ticked) and notes that this can be changed later in Settings. Kid space then shows completed units plus the next one of each chosen book; Settings > Units can switch to all units.
- Switch to parent space to create, review, approve or delete units in MORE! 1 to MORE! 4.
- Select units or filter by book; vocabulary and answer choices stay separate for each unit.
- Review user-photo transcriptions: MORE! 1 has 42/41/31/42/43/38/28/27/40/44/38 entries in Units 1-11; visible portions of Units 12-15 add 65/41/44/23 entries. MORE! 2 has 45/39/33/35/37/35/30/33/31/26/29/33/33/38/24 entries in Units 1-15.
- Word File illustrations are included with explicitly labelled suggested German translations. Editing those translations marks them as parent translations; their provenance is preserved on save and download.
- Edit English, German and examples, search across all fields, and add or remove entries.
- The 59 bundled lessons are ready to practise; parent-created units require approval first.
- MORE! 2 includes a separate Irregular Verbs unit with 59 photographed verb rows. English answers contain the base form, past tense and past participle together, separated by ` - `, alongside the German meaning.
- Practise in either direction with 5, 10 or all words, then retry missed words.
- Description practice (requested by the class teacher) shows a short English description, such as "When nobody speaks and you cannot hear anything", and asks for the English word ("silence"). Choose **Description → English** for typed answers or multiple choice, or **English + Description** for matching pairs. Words that share a description, such as "What's the time?" and "What time is it?", accept either answer and never appear as each other's distractor or on the same matching board.
- Every bundled word except the Irregular Verbs list has a suggested English description, marked `descriptionSource: "suggested"`. They were drafted for this app, not transcribed from the textbook. In Review vocabulary a parent can edit or clear a description; edited and cleared descriptions are marked `parent` and are never replaced. Saved libraries receive the suggested descriptions once, tracked by `describedUnitKeys`; words without a description are left out of description practice.
- Choose typed answers or multiple choice. Multiple choice has one correct answer and up to three distinct distractors, excluding known overlapping translations and prompts. Small units use fewer choices; questions without a safe distractor are omitted.
- Matching pairs shows up to five English words on the left and their German translations independently shuffled on the right. Select either side first; correct pairs stay in place and lock, while a wrong match can be tried again. Boards exclude overlapping answers in both languages and need at least two unambiguous pairs.
- A matching round has up to three boards with different words, so up to 15 words; small units get fewer boards. Every word appears once, and the result counts first-try matches across all boards (for example 14 / 15). Retrying missed words uses just enough boards for them, filled up with other words from the same unit. Matching pairs English with German or, with **English + Description**, with descriptions; it does not use the round-size setting.
- Parent space includes a learning report with known, still-learning and not-tried words for each unit. A word is marked known after three correct first attempts in a row.
- The app version is visible in the page footer.
- Settings (in both spaces) choose a System, Light or Dark theme and which MORE! books appear. The library, book filter, new-unit form and learning report only show the selected books; at least one stays selected. Settings are saved on the device under `ourlingo.settings.v1`. On Android, the status and navigation bar icons follow the chosen theme.
- To add another MORE! book, extend `books` in `src/vocabulary.ts` and list its unit files in `bundledUnitFiles`; it then appears in Settings and the book filter.
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

## Windows Native Setup (Android First)

Use a native Windows PowerShell terminal in this checkout, not a WSL terminal. Do not share `node_modules` or build output with a WSL checkout. Tauri packages this existing React app; it does not replace the browser version or alter the bundled vocabulary files.

### 1. Check Existing Tools

In PowerShell, check which tools are already available:

```powershell
Get-Command git,node,npm,rustup,rustc,cargo,java,adb -ErrorAction SilentlyContinue
```

Git is required. Vite 8 requires Node.js 20.19+ or 22.12+; install a currently supported Node.js LTS release, which includes npm. Rust must use the Windows MSVC toolchain. Android development also needs a JDK and the Android SDK/NDK. On the Windows machine used to prepare this guide, Visual Studio Build Tools 2022 (including MSVC and a Windows SDK) and the WebView2 Runtime are already installed; check before reinstalling them.

### 2. Install Node.js LTS

1. Download the Windows installer for the current LTS release from [nodejs.org](https://nodejs.org/en/download).
2. Run the installer interactively with its default options, including npm. Approve any Windows permission prompt yourself.
3. Close and reopen PowerShell, then verify:

```powershell
node --version
npm --version
```

### 3. Install Rust for Windows

1. Install Rust using the official [rustup instructions](https://www.rust-lang.org/tools/install) for Windows.
2. Select the stable `x86_64-pc-windows-msvc` toolchain when prompted. Do not choose the GNU toolchain.
3. Close and reopen PowerShell, then verify:

```powershell
rustup show active-toolchain
rustc --version
cargo --version
```

The active toolchain should include `stable-x86_64-pc-windows-msvc`.

### 4. Install Android Studio and SDK Packages

1. Download and install [Android Studio](https://developer.android.com/studio). Complete its first-run setup interactively and allow it to install the Android SDK.
2. Open **Tools > SDK Manager**. Install an Android SDK Platform, **Android SDK Platform-Tools**, **Android SDK Build-Tools**, **Android SDK Command-line Tools (latest)**, and **NDK (Side by side)**.
3. Do not guess or pin SDK/NDK versions at this stage. After Tauri's Android project is initialized, install the versions required by its generated Gradle configuration if they differ from the installed defaults.
4. In SDK Manager, note the **Android SDK Location**. In Android Studio's installation directory, locate its bundled `jbr` folder (the JDK).

### 5. Set Android Environment Variables

In Windows, search for **Edit environment variables for your account** and add these as user variables:

- `JAVA_HOME`: the Android Studio `jbr` directory, not its `bin` subdirectory.
- `ANDROID_HOME`: the Android SDK Location shown in SDK Manager.
- `NDK_HOME`: the installed NDK directory under `<ANDROID_HOME>\ndk\<version>`.

Use the actual paths on this machine; do not paste the example variable names as literal path values. Close and reopen PowerShell after changing environment variables. `ANDROID_SDK_ROOT` is not needed when using `ANDROID_HOME`.

### 6. Add Rust Android Targets

Run this in PowerShell after Rustup is available:

```powershell
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

### 7. Enable Windows Developer Mode

Tauri's Android build creates symbolic links for native libraries. On Windows, enable **Developer Mode** in **Settings > System > For developers** before building. You can open that Settings page with:

```powershell
Start-Process 'ms-settings:developers'
```

Turn on **Developer Mode**, then reopen PowerShell. If your organization manages this setting and prevents enabling it, ask your administrator; do not change the system security policy yourself.

### 8. Verify Prerequisites and the Browser App

Confirm the tools and paths are visible in a newly opened PowerShell window:

```powershell
node --version
npm --version
rustup show active-toolchain
rustup target list --installed
& "$env:JAVA_HOME\bin\java.exe" -version
& "$env:ANDROID_HOME\platform-tools\adb.exe" version
Test-Path "$env:ANDROID_HOME\platform-tools\adb.exe"
Test-Path $env:NDK_HOME
```

Both `Test-Path` commands should return `True`. Verify the existing browser app before building the native app:

```powershell
npm ci
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:e2e -- --workers=2
```

Keep using `npm run dev` for the browser version. This checkout now includes the Tauri v2 CLI, Vite integration and generated Android project. Build an arm64 debug APK from the repository root:

```powershell
npx tauri android build --debug --apk --target aarch64
```

The first build may download Gradle and any Android SDK Platform required by the generated project. Tauri writes the APK to `src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk`. For a friendlier filename to share, copy it to Downloads:

```powershell
Copy-Item -Force src-tauri\gen\android\app\build\outputs\apk\universal\debug\app-universal-debug.apk "$env:USERPROFILE\Downloads\OurLingo-debug.apk"
```

To install it on a connected Android device with USB debugging enabled, run:

```powershell
& "$env:ANDROID_HOME\platform-tools\adb.exe" install -r "$env:USERPROFILE\Downloads\OurLingo-debug.apk"
```

Use `adb devices -l` to confirm a device is connected. Test the packaged app with Wi-Fi and mobile data disabled to verify bundled units load offline. The Android WebView has separate localStorage from the browser, and there is no library import/restore yet; use test data in the native app until a full-library backup and restore path exists. Windows desktop packaging can follow later; this machine already has the documented C++ Build Tools and WebView2 prerequisites. See the [official Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) if a toolchain update is needed.

## Play Store Release

Release builds are Android App Bundles for arm64 and armv7, signed with the upload key registered in the Play Console. Keep the key outside the repository (`*.jks` is ignored by git) and back it up; Google only accepts uploads signed with it.

1. Raise the version in `package.json`, `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml` (and their lock files). Tauri derives the Play version code from it, e.g. `0.2.0` becomes `2000`; every upload needs a higher code.
2. Place the key at `~/OurLingo-signing/ourlingo-upload.jks` on Linux or `%USERPROFILE%\OurLingo-signing\ourlingo-upload.jks` on Windows.
3. Run `scripts/build-android-release.sh` on Linux or `scripts\build-android-release.ps1` on Windows. Both ask for the keystore and key passwords, build the bundle, verify its signature and copy it to `Downloads/OurLingo-release.aab` with its SHA-256 checksum.
4. Upload `OurLingo-release.aab` in the Play Console.

## Web App (iPhone and iPad)

The same app runs in the browser at <https://glaure.github.io/OurLingo/app/>. On iOS, open it in Safari and use Share > Add to Home Screen; it then starts full screen and works offline. Start it from the home screen icon: Safari may delete the data of websites that were not opened for seven days, but not of home screen apps. Progress in a Safari tab and in the home screen app is stored separately.

- `npm run build:web` builds into `dist/` with the base path `/OurLingo/app/`, adds `sw.js` (a service worker caching every built file, from `web/service-worker.js`) and asks the browser to keep the stored progress. The normal `npm run build` used by Tauri has neither.
- Test it locally with `npx vite preview --mode web` and open `http://localhost:4173/OurLingo/app/`.
- `.github/workflows/pages.yml` runs the unit tests, builds the web app and publishes `docs/` with the app in `app/` on every push to `main`. In the repository's Settings > Pages, the source must be set to "GitHub Actions".
- A new version reaches devices the next time the app is opened online; it is active from the following start.

## Data and Limitations

The bundled datasets under `public/data/` cover MORE! 1, Units 1-15, MORE! 2, Units 1-15 plus Irregular Verbs, and MORE! 3 and MORE! 4, Units 1-14 each. They are manual transcriptions of user-provided photos, not automated OCR results. These 59 lessons are approved for immediate practice. Parent-created units still start pending until approved. Existing saved edits are preserved when approval is migrated; deleted bundled lessons stay deleted.

The special MORE! 2 Irregular Verbs unit uses the identity `irregular-verbs`, leaving numeric Unit 16 available. It transcribes 59 rows from the supplied year-1 sheet without adding example sentences. The three English columns are retained as `base form - past tense - past participle`; typed English answers require that complete sequence. The printed `read` forms have identical spelling despite different pronunciation; the handwritten pronunciation annotations are not answer text. Existing practice modes use the complete sequence against its German meaning, not individual conjugation questions.

Each additional bundled unit is added once to existing libraries without replacing populated units or their approval. Empty pending drafts receive the matching transcription, retaining their titles. `bundledUnitKeys` remembers imported units so deletion stays permanent. A failed download does not prevent other units loading or remove saved vocabulary; refreshing retries failed additions. The files to load are listed in `bundledUnitFiles` in `src/vocabulary.ts`.

MORE! 1 Unit 3 contains 26 bilingual-table entries, 24 examples and five additional illustrated pirate terms; the illustrated ship is already in the table. Unit 4 contains 42 bilingual entries and 32 examples. Unit 5 contains 35 bilingual entries, 31 examples and eight illustrated music terms. Unit 6 contains 38 bilingual entries and 33 examples. Unit 7 contains 26 bilingual-table entries, 23 examples and two additional illustrated terms; the breakfast and lunch labels and the frequency adverbs already appear in the table. Unit 8 contains 15 bilingual-table entries, 14 examples and 12 illustrated clothes terms. Unit 9 contains 36 bilingual entries and examples plus four illustrated pet-container terms. Unit 10 contains 34 bilingual-table entries, 24 examples and ten illustrated number terms. Unit 11 contains 38 bilingual entries and 30 examples. Units 12-15 are partial page transcriptions: Unit 12 has 38 visible table entries and 27 ordinal-number illustration labels; Unit 13 has 41 visible table entries; Unit 14 has 44 visible table entries; Unit 15 has 14 visible table entries and nine illustrated holiday activities. The cropped photos do not show the complete tables for these units. MORE! 2 Unit 1 contains 34 bilingual-table entries with examples and 11 illustrated school subjects. Unit 2 contains 39 bilingual entries and examples. Unit 3 contains 27 bilingual entries with examples and six additional illustrated Halloween terms; "Trick or treat!" is already in the table and is not duplicated. Unit 4 contains 35 bilingual entries and examples. Unit 5 contains 28 bilingual entries and examples plus nine illustrated directions. Unit 6 contains 25 bilingual entries and examples plus ten illustrated adventure-camp terms. Unit 7 contains 22 bilingual entries, 21 examples and eight illustrated activities. Unit 8 contains 26 bilingual entries and examples plus seven illustrated science-fiction terms. Unit 9 contains 26 bilingual entries and examples plus five illustrated restaurant terms. Illustration-only translations are suggestions, not transcribed textbook text; they carry `origin: "word-file"` and `translationSource: "suggested"` until a parent edits the translation.

MORE! 2 Unit 10 has 22 visible table entries and four illustrated family labels; Unit 11 has 23 visible table entries and six illustrated possessive pronouns; Unit 12 has 25 visible table entries and eight illustrated aches-and-pains terms. Unit 13 adds 33 visible table entries (one dialogue has no example); Unit 14 has 25 table entries and 13 illustrated sports labels; Unit 15 has 14 table entries and ten illustrated pet-care labels. Unit 13 is a cropped continuation page, so its dataset contains only the visible rows. Illustration-only German translations are suggestions, marked with `origin: "word-file"` and `translationSource: "suggested"`.

MORE! 3 and MORE! 4 were transcribed from one workbook photo per unit; only MORE! 3 Unit 1 and MORE! 4 Unit 1 show a printed unit number, so the others follow the photo order. MORE! 3: Unit 1 "Audition" has 33 table entries and 7 Word File terms; Unit 2 "Activities" has 35 table entries and 7 Word File terms; Unit 3 "Travelling" has 35 table entries and 19 Word File terms; Unit 4 "Adjectives describing animals" has 37 table entries and 9 Word File terms; Unit 5 "Luck" has 33 table entries and 8 Word File terms; Unit 6 "Places around town" has 34 table entries and 11 Word File terms; Unit 7 "Relationships" has 28 table entries and 6 Word File terms; Unit 8 "Inventions" has 39 table entries and 8 Word File terms; Unit 9 "Teen activities" has 23 table entries and 16 Word File terms; Unit 10 "Getting the message across" has 41 table entries and 12 Word File terms; Unit 11 "Places and sights in Death Valley" has 29 table entries and 8 Word File terms; Unit 12 "Natural disasters" has 34 table entries and 16 Word File terms; Unit 13 "Making decisions" has 28 table entries and 6 Word File terms; Unit 14 "Holiday plans" has 27 table entries and 10 Word File terms. MORE! 4: Unit 1 "Ireland's history" has 36 table entries and 10 Word File terms; Unit 2 "Crime" has 34 table entries and 9 Word File terms; Unit 3 "Danger" has 33 table entries and 7 Word File terms; Unit 4 "Professions" has 31 table entries and 21 Word File terms; Unit 5 "Food quality" has 32 table entries and 11 Word File terms; Unit 6 "Making a difference" has 28 table entries and 10 Word File terms; Unit 7 "Australian outback" has 28 table entries and 8 Word File terms; Unit 8 "Life experiences" has 34 table entries and 10 Word File terms; Unit 9 "Weddings" has 38 table entries and 5 Word File terms; Unit 10 "Feelings" has 32 table entries and 9 Word File terms; Unit 11 "Types of books" has 34 table entries and 9 Word File terms; Unit 12 "Space" has 34 table entries and 6 Word File terms; Unit 13 "Holiday plans" has 31 table entries and 12 Word File terms; Unit 14 "Talking Turkeys" has 27 table entries and 8 Word File terms. MORE! 3 Unit 14 ends at the start of section 13, so its table probably continues on a page that was not photographed. Word File terms carry suggested German translations. Typographic quotes, dashes and ellipses are stored as plain ASCII. Two printed misprints were corrected: "Kassenbohn" to "Kassenbon" (MORE! 4 Unit 2) and "to execute so." to "to execute sb." (MORE! 4 Unit 8). Each book has its own colour: MORE! 1 green, MORE! 2 red, MORE! 3 blue and MORE! 4 violet. Settings saved before a book was added select the new book automatically once.

The library is held in localStorage under `ourlingo.library.v1`, separately for each browser and URL origin. Existing Unit 1 data from `ourlingo.more-1-unit-1.v1` is migrated automatically when no library exists, retaining edits and approval. The legacy copy is kept. Each book/unit pair has its own vocabulary; duplicate pairs cannot be created.

In parent space, choose **Add unit**, select the book and unit number, and optionally enter a title. A new unit is saved as an empty draft. Add vocabulary in its review screen and choose **Save & approve** when complete. Pending units are visible but not playable in kid space. Unit deletion and abandoning unsaved edits or unfinished rounds require confirmation.

The 59 supplied units come with visible photo transcriptions; illustrated Word File translations are marked as suggestions. MORE! 1 Units 12-15, MORE! 2 Unit 13 and MORE! 3 Unit 14 are incomplete until the missing page portions are supplied. Other units must be entered by a parent; no unseen textbook contents are invented. Saved data is not written back to source files or synchronized to other devices. Clearing site data removes the library. JSON downloads copy the selected unit, including unsaved edits; restore/import is not implemented yet.

Round scores are shown after each round. Per-word first-attempt counts and correct streaks are saved locally under `ourlingo.learning.v1`; the parent report marks a word known after three correct completed rounds in a row. Progress is separate on every browser/app installation and does not sync between devices. There are no separate learner profiles yet. Image uploads and automated page scanning are not implemented.

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
