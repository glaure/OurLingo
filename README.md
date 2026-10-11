# OurLingo

A family vocabulary learning app with MORE! 1, Units 1-15, and MORE! 2, Units 1-15.

For the Windows workspace transition and proposed Tauri v2 packaging work, see [Development Handoff](DEVELOPMENT-HANDOFF.md).

## Current Features

- Open in kid space by default, with a unit library and practice for approved units only.
- Switch to parent space to create, review, approve or delete units in MORE! 1 and MORE! 2.
- Select units or filter by book; vocabulary and answer choices stay separate for each unit.
- Review user-photo transcriptions: MORE! 1 has 42/41/31/42/43/38/28/27/40/44/38 entries in Units 1-11; visible portions of Units 12-15 add 65/41/44/23 entries. MORE! 2 has 45/39/33/35/37/35/30/33/31/26/29/33/33/38/24 entries in Units 1-15.
- Word File illustrations are included with explicitly labelled suggested German translations. Editing those translations marks them as parent translations; their provenance is preserved on save and download.
- Edit English, German and examples, search across all fields, and add or remove entries.
- The thirty bundled lessons are ready to practise; parent-created units require approval first.
- Practise in either direction with 5, 10 or all words, then retry missed words.
- Choose typed answers or multiple choice. Multiple choice has one correct answer and up to three distinct distractors, excluding known overlapping translations and prompts. Small units use fewer choices; questions without a safe distractor are omitted.
- Matching pairs shows up to five English words on the left and their German translations independently shuffled on the right. Select either side first; correct pairs stay in place and lock, while a wrong match can be tried again. Boards exclude overlapping answers in both languages and need at least two unambiguous pairs.
- Each matching board repeats for three full passes, reshuffling between passes. Results appear after pass three and score first-try matches from pass one. Retry boards prioritise missed words and add other words from the same unit to fill the five-pair board. Matching uses both languages together and does not use the direction or round-size settings.
- Parent space includes a learning report with known, still-learning and not-tried words for each unit. A word is marked known after three correct first attempts in a row.
- The app version is visible in the page footer.
- The interface follows the device's light or dark appearance setting.
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

## Data and Limitations

The bundled datasets under `public/data/` cover MORE! 1, Units 1-15, and MORE! 2, Units 1-15. They are manual transcriptions of user-provided photos, not automated OCR results. These thirty lessons are approved for immediate practice. Parent-created units still start pending until approved. Existing saved edits are preserved when approval is migrated; deleted bundled lessons stay deleted.

Each additional bundled unit is added once to existing libraries without replacing populated units or their approval. Empty pending drafts receive the matching transcription, retaining their titles. `bundledUnitKeys` remembers imported units so deletion stays permanent. A failed download does not prevent other units loading or remove saved vocabulary; refreshing retries failed additions. The files to load are listed in `bundledUnitFiles` in `src/vocabulary.ts`.

MORE! 1 Unit 3 contains 26 bilingual-table entries, 24 examples and five additional illustrated pirate terms; the illustrated ship is already in the table. Unit 4 contains 42 bilingual entries and 32 examples. Unit 5 contains 35 bilingual entries, 31 examples and eight illustrated music terms. Unit 6 contains 38 bilingual entries and 33 examples. Unit 7 contains 26 bilingual-table entries, 23 examples and two additional illustrated terms; the breakfast and lunch labels and the frequency adverbs already appear in the table. Unit 8 contains 15 bilingual-table entries, 14 examples and 12 illustrated clothes terms. Unit 9 contains 36 bilingual entries and examples plus four illustrated pet-container terms. Unit 10 contains 34 bilingual-table entries, 24 examples and ten illustrated number terms. Unit 11 contains 38 bilingual entries and 30 examples. Units 12-15 are partial page transcriptions: Unit 12 has 38 visible table entries and 27 ordinal-number illustration labels; Unit 13 has 41 visible table entries; Unit 14 has 44 visible table entries; Unit 15 has 14 visible table entries and nine illustrated holiday activities. The cropped photos do not show the complete tables for these units. MORE! 2 Unit 1 contains 34 bilingual-table entries with examples and 11 illustrated school subjects. Unit 2 contains 39 bilingual entries and examples. Unit 3 contains 27 bilingual entries with examples and six additional illustrated Halloween terms; "Trick or treat!" is already in the table and is not duplicated. Unit 4 contains 35 bilingual entries and examples. Unit 5 contains 28 bilingual entries and examples plus nine illustrated directions. Unit 6 contains 25 bilingual entries and examples plus ten illustrated adventure-camp terms. Unit 7 contains 22 bilingual entries, 21 examples and eight illustrated activities. Unit 8 contains 26 bilingual entries and examples plus seven illustrated science-fiction terms. Unit 9 contains 26 bilingual entries and examples plus five illustrated restaurant terms. Illustration-only translations are suggestions, not transcribed textbook text; they carry `origin: "word-file"` and `translationSource: "suggested"` until a parent edits the translation.

MORE! 2 Unit 10 has 22 visible table entries and four illustrated family labels; Unit 11 has 23 visible table entries and six illustrated possessive pronouns; Unit 12 has 25 visible table entries and eight illustrated aches-and-pains terms. Unit 13 adds 33 visible table entries (one dialogue has no example); Unit 14 has 25 table entries and 13 illustrated sports labels; Unit 15 has 14 table entries and ten illustrated pet-care labels. Unit 13 is a cropped continuation page, so its dataset contains only the visible rows. Illustration-only German translations are suggestions, marked with `origin: "word-file"` and `translationSource: "suggested"`.

The library is held in localStorage under `ourlingo.library.v1`, separately for each browser and URL origin. Existing Unit 1 data from `ourlingo.more-1-unit-1.v1` is migrated automatically when no library exists, retaining edits and approval. The legacy copy is kept. Each book/unit pair has its own vocabulary; duplicate pairs cannot be created.

In parent space, choose **Add unit**, select the book and unit number, and optionally enter a title. A new unit is saved as an empty draft. Add vocabulary in its review screen and choose **Save & approve** when complete. Pending units are visible but not playable in kid space. Unit deletion and abandoning unsaved edits or unfinished rounds require confirmation.

The thirty supplied units come with visible photo transcriptions and marked Word File suggestions. MORE! 1 Units 12-15 and MORE! 2 Unit 13 are incomplete until the missing page portions are supplied. Other units must be entered by a parent; no unseen textbook contents are invented. Saved data is not written back to source files or synchronized to other devices. Clearing site data removes the library. JSON downloads copy the selected unit, including unsaved edits; restore/import is not implemented yet.

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
