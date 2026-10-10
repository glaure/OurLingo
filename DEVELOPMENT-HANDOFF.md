# OurLingo Development Handoff

Prepared on 2026-10-10 for moving development from WSL2 to native Windows.

## Goal and Next Step

OurLingo is a vocabulary learning app for the user's daughters, accompanying MORE! 1 and MORE! 2. It should remain usable on PCs, phones and tablets. Parents enter vocabulary or supply workbook-page photos; children practise it.

The user wants installed Windows and Android apps and has chosen to investigate Tauri v2. Tauri v2 can package the existing React interface for Windows, Android, macOS, Linux and iOS. Start with Android, then Windows, retaining the browser version.

Tauri v2 is integrated into the existing Vite app. The Tauri CLI, Vite configuration, Rust project and generated Android project are present. Bundled units are approved by default and already-installed pending bundles migrate without overwriting edits or restoring deletions. An arm64 debug APK builds and installs in the Android 37 emulator; bundled units load with networking disabled, and typed practice works offline. The launcher icon matches the app's BookOpen mark. Matching now uses three shuffled passes in the browser app; native offline matching still needs testing. A physical-device test, full-library backup/restore and Windows desktop build remain outstanding.

The current Windows machine has Node.js 24.21.0, npm 11.19.0, Rust 1.99.0 with the MSVC toolchain, Android Studio's JDK 25, Android SDK Platforms 36 and 37, Build-Tools 36.0.0, Command-line Tools 23.0, NDK 30.0.16248370, Visual Studio Build Tools 2022 and WebView2. Windows Developer Mode is enabled for Android build symlinks. Recheck tools and environment variables if moving to another machine.

Android development could remain in WSL, but the user prefers a separate Windows clone to avoid extra device/emulator integration and prepare for Windows builds. Do not share node_modules or build artifacts between Windows and WSL checkouts. Exchange changes through Git.

## Windows Setup

Clone https://github.com/glaure/OurLingo.git into a normal Windows development directory and open that folder in native Windows VS Code, not a WSL-connected window. Use the existing repository rather than generating a new frontend.

Prerequisites to check:

- Git and Node.js LTS with npm. Vite 8 requires Node 20.19+ or 22.12+; use a currently supported LTS version.
- Rust via rustup, using the Windows MSVC host toolchain.
- Visual Studio C++ Build Tools with the Desktop development with C++ workload, MSVC and Windows SDK, for Windows desktop builds. These are not required merely to package Android.
- WebView2 Runtime for the Windows desktop app.
- Android Studio or Android command-line tools, with a compatible JDK, Android SDK platform, build-tools, platform-tools and side-by-side NDK.
- An Android device or emulator for testing. Configure JAVA_HOME, ANDROID_HOME and NDK_HOME as required by the current Tauri documentation.

Check the current Tauri v2 prerequisites and Android setup documentation before choosing exact SDK/NDK versions and Rust Android targets. Android Studio's bundled JDK can be used if compatible. Install only the tools required for the selected target; do not run elevated installers unattended.

Bootstrap and verify the existing browser app in Windows PowerShell:

```powershell
npm ci
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:e2e -- --workers=2
npm run dev
```

For network browser access, use `npm run dev -- --host 0.0.0.0`. Only expose the development server on a trusted network.

## Verified Project State

The application checkpoint is commit `3445167` on main, already pushed to origin. The GitHub repository began with a license-only initial commit; our local commits were rebased onto it and pushed normally. No force push was needed. The handoff itself is a later documentation commit.

The project uses React 19, TypeScript, Vite 8 and lucide-react. The latest verified gates passed: build, lint, 18 unit tests and 27 Playwright browser tests (45 tests total). Test counts may increase in subsequent work.

Current features:

- Kid space and unit library open by default on every reload.
- Parent space supports creation, review, approval and deletion of units in both books. The switch has no PIN or authentication.
- Only approved units can be practised.
- Typed and multiple-choice practice in both language directions, with scoring and missed-word retries.
- Matching-pairs mode: up to five English/German pairs, independently shuffled columns, either-side-first selection, locked matched tiles and mismatch feedback. Each board repeats for three full passes, reshuffling between passes; results score first-try matches from pass one. Retry prioritises missed words and fills from the same unit. Ambiguous or overlapping translations are excluded; small units use fewer pairs, with at least two required.
- Parent-space learning report records per-word first-attempt outcomes locally. Three correct completed rounds in a row marks a word known; there are no separate learner profiles or cross-device sync.
- The app version is displayed in the page footer and matches npm/Tauri version `0.1.0`.
- The interface follows the operating system light/dark appearance preference.
- Search, add/remove/edit vocabulary and example sentences; selected-unit JSON downloads include unsaved edits.
- Responsive layouts tested at 1440, 768, 390 and 320 pixels, plus five short matching pairs visible on a 320x844 phone.
- User-approved font sizes: vocabulary 16px, multiple-choice options 18px, typed answers 20px. Preserve this readability and existing visual style.

## Important Files

- `src/main.tsx`: application entry point, using `src/OurLingo.tsx` and `src/theme.css`.
- `src/OurLingo.tsx`: library loading, kid/parent navigation, review and all practice modes.
- `src/OurLingo.css` and `src/theme.css`: responsive styling and fonts.
- `src/vocabulary.ts`: data types, validation, library merge/update helpers, accepted answer variants, choice generation and matching-round selection.
- `src/vocabulary.test.ts`: Node tests run through tsx.
- `tests/workflow.spec.ts` and `playwright.config.ts`: browser tests, with a dedicated test server on port 5178.
- `tsconfig.node.json`: checks both test suites and Playwright configuration using Node and DOM types.
- `public/data/`: five supplied workbook datasets.
- `README.md`: current features, startup instructions and storage limitations.

Original Vite starter files such as `src/App.tsx`, `src/App.css` and `src/index.css` remain unused. Do not confuse them with the active implementation or remove them as unrelated cleanup during packaging.

## Vocabulary and Storage

Bundled manual transcriptions:

| Book | Unit | Entries | Example sentences |
| --- | --- | --- | --- |
| MORE! 1 | 1 | 42 | 40 |
| MORE! 1 | 2 | 41 | 37 |
| MORE! 2 | 1 | 45 | 34 |
| MORE! 2 | 2 | 39 | 39 |
| MORE! 2 | 3 | 33 | 27 |

The five bundled datasets are approved for immediate practice; parent-created units remain pending. MORE! 2 Units 1 and 3 include 11 and six illustrated Word File terms with suggested German translations, explicitly marked using origin and translationSource metadata. Editing a suggestion changes its source to parent. Preserve that provenance when saving, exporting or importing.

Browser storage uses localStorage key `ourlingo.library.v1`. Units are identified by book plus unit number. Legacy `ourlingo.more-1-unit-1.v1` data migrates automatically with edits and approval retained. The old copy is kept.

`bundledUnitFiles` lists supplementary datasets; `installBundledUnits` loads them independently. `mergeBundledUnits` preserves populated units and approvals, fills empty pending drafts while retaining titles, and records bundledUnitKeys so deleted imports do not reappear. Failed downloads do not discard saved vocabulary or prevent other bundles loading.

Browser data is separate for each browser and URL origin. It is not written into Git or source JSON. Windows cloning and Tauri installation will not copy browser-saved vocabulary or approval automatically. Clearing site data removes the library. Progress is stored under `ourlingo.learning.v1`, separately per installation. There are no separate learner profiles, backend or cross-device synchronization.

Before migrating real data, provide and test an import/restore path. Existing JSON downloads cover one selected unit, not the complete library. A full-library backup and restore workflow would be useful before switching origins or storage backends. Do not clear existing browser storage or silently replace parent edits.

## Tauri Packaging Considerations

Setup progress and remaining work:

1. Windows prerequisites and the browser baseline are verified; build, lint, 20 unit tests and 30 browser tests pass.
2. Tauri v2 is configured to use Vite and `dist`; Android support is initialized. `npm run tauri` is required by generated Gradle tasks.
3. The arm64 debug APK builds at `src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk` and launches in the API 37 emulator.
4. The offline library, review/approval and a correct typed-practice answer are smoke-tested. Verify multiple-choice and matching modes offline and test a physical device.
5. Provide and test full-library backup/restore, then decide on native data persistence deliberately. Browser and native WebView storage are separate.
6. Build and test the Windows app using the installed Windows toolchain, then address release signing and distribution separately.

Prefer current official Tauri documentation and minimal permissions; do not add native plugins or capabilities without a concrete need. Do not commit signing keys, passwords or machine-specific SDK paths.

Browser localStorage inside a native WebView is separate from Chrome/Edge data. Review persistence and backup behaviour before relying on it for the installed app. The current JSON download mechanism uses a Blob URL and anchor; Android WebView downloads must be tested and may require a native save/share implementation.

Fonts currently come from Google Fonts with local fallbacks. For fully offline, consistent native rendering, bundle the permitted font assets locally rather than relying on an external request. The study photograph is already local. There is no PWA/service worker implementation; packaged Tauri assets do not require one merely to launch offline.

Photos have been transcribed in chat and committed as JSON. Automatic image upload/OCR in the application is still not implemented.

## Resume in a New Chat

Suggested initial request in the Windows workspace:

> Read DEVELOPMENT-HANDOFF.md and README.md. Continue setting up Tauri v2 for Android first and Windows later, using the existing React app. Check installed prerequisites before making changes. Preserve existing vocabulary data and the working browser version.

The WSL chat and private Copilot memory may not appear in the new Windows workspace. This committed note is the portable context; confirm current code and tool versions rather than assuming the old environment still applies.