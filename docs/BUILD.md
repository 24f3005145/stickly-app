# Build guide

Requirements: Node 20+, Android Studio (latest stable), JDK 21 (bundled with recent Android Studio).

## 1. Install and run the web UI
```bash
npm install
npm test          # unit tests for the schedule logic
npm run dev       # browser preview (dev mock only: no real notifications)
```

## 2. Add Android and drop in the native files
```bash
npm run build
npx cap add android
```
This generates `android/` with the package `com.example.stickly`. Then, from this project's `android/` folder:

1. **Delete** `android/app/src/main/java/com/example/stickly/MainActivity.java` (replaced by `MainActivity.kt`).
2. **Copy over** the files from this project into the generated `android/`, overwriting:
   - `build.gradle`, `app/build.gradle`
   - `app/src/main/AndroidManifest.xml`
   - everything under `app/src/main/java/com/example/stickly/`
   - `app/src/main/res/drawable/*`, `res/values/stickly_colors.xml`, `res/mipmap-anydpi-v26/*`
3. If your generated `variables.gradle` / AGP version differs from the ones in `build.gradle`, keep the template's AGP version and only add the two Kotlin/KSP `classpath` lines.
4. In `app/build.gradle`, `kotlinOptions.jvmTarget` must equal the Java version in `app/capacitor.build.gradle` (21 for Capacitor 7).

```bash
npx cap sync android
npx cap open android      # opens Android Studio; let Gradle sync finish
```
Run on a device/emulator with the green Run button, or `npm run cap:sync` after each web change.

## 3. Use your own package ID
Replace `com.example.stickly` **before publishing** in: `capacitor.config.ts`, `android/app/build.gradle` (`namespace`, `applicationId`), the Kotlin `package` lines and folder path, and the manifest if you add absolute class names. Easiest: change `appId` in `capacitor.config.ts`, delete `android/`, rerun step 2 and move the Kotlin folder to match.

## 4. Builds
```bash
cd android
./gradlew assembleDebug      # Windows: gradlew.bat assembleDebug
./gradlew assembleRelease
./gradlew bundleRelease
```
| Output | Location |
|---|---|
| Debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Release APK | `android/app/build/outputs/apk/release/app-release.apk` (signed only if `keystore.properties` exists, otherwise `-unsigned`) |
| Signed AAB (Play Store) | `android/app/build/outputs/bundle/release/app-release.aab` |

Install a debug APK: `adb install -r app/build/outputs/apk/debug/app-debug.apk`.

## 5. Signing
```bash
keytool -genkeypair -v -keystore stickly-release.jks -alias stickly -keyalg RSA -keysize 2048 -validity 10000
```
Create `android/keystore.properties` (already git-ignored):
```
storeFile=../stickly-release.jks
storePassword=YOUR_PASSWORD
keyAlias=stickly
keyPassword=YOUR_PASSWORD
```
**Back up the keystore.** Also enrol in Play App Signing when you upload the first AAB.

## 6. Versioning
In `android/app/build.gradle`: raise `versionCode` by 1 for every Play upload; `versionName` is the visible version.

## 7. Icons and splash
An adaptive launcher icon (amber background, note with a check) and a status-bar notification icon are included as vectors. For PNG fallbacks and a custom splash, put a 1024px `icon.png` and 2732px `splash.png` in `assets/` and run `npx @capacitor/assets generate --android`.

## Known things to check on a real device
- **Android 15 edge-to-edge:** the UI pads for system bars with `env(safe-area-inset-*)`. If content sits under the status bar on your Capacitor version, adjust `--sat` in `src/styles/tokens.css`.
- **Gradle versions** are my best match for Capacitor 7 and were not compiled here. If Gradle complains, send me the error.

## No Android Studio? Build the APK in the cloud (GitHub Actions)
The Android files live in `native-overlay/`; the workflow in `.github/workflows/build-apk.yml` generates the Android project, applies the overlay, and builds a debug APK on GitHub's servers.
1. Create a free GitHub account and a new repository.
2. Upload this project's files to it (keep the folder structure; the `.github` folder must be included. If your uploader skips it, use Add file > Create new file, name it `.github/workflows/build-apk.yml`, and paste the file's contents).
3. Open the **Actions** tab > **Build Stickly APK** > **Run workflow**.
4. When it finishes (about 5-10 minutes), open the run and download the **stickly-debug-apk** artifact (a zip containing `app-debug.apk`).
5. Send the APK to your phone, open it, and allow "Install unknown apps" for your browser/files app when asked.

For local builds, use `native-overlay/` wherever step 2 above says "this project's android/ folder".
