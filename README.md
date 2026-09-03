# Sillage

A diary for your most neglected sense. Journal the smells you want to keep, train your nose on what is
already in your kitchen, and keep a record of what is on your shelf and how often you actually reach for it.

Free and complete. No account, no subscription, no ads, and no internet permission at all.

- **Play listing:** https://play.google.com/store/apps/details?id=com.mohdshayan.sillage
- **Site:** https://shayanmohd.github.io/sillage/
- **Try it in a browser:** https://shayanmohd.github.io/sillage/play/
- **Privacy policy:** https://shayanmohd.github.io/sillage/privacy-policy.html

## How it is built

`web/` is the whole app: plain HTML, CSS and JavaScript, no build step and no dependencies.

- `js/lexicon.js` is the content that makes the app worth having: 352 cards across fifteen families, each
  with what the thing is, where you meet it, and the cards that sit near it. It is data, never logic, and
  a related id that was never written is dropped once at load rather than rendering as a dead chip.
- `js/content.js` is the curriculum: the eight pantry shelves and their sixty four household materials, the
  fourteen Foundations sessions, the twenty four Conservatory rounds generated from the shelves, the eight
  point emotion wheel and the twelve anchor scaffolds. Tracks are data, so a new track is new writing.
- `js/store.js` holds every piece of state in one `localStorage` record under `sillage.v1`, and is also the
  resurfacing engine, the vocabulary counter and the shelf statistics. All three are pure functions over
  the record. Nothing is cached and no score is stored, which is what makes the whole thing auditable:
  delete an entry and the words in it stop counting, because they were never counted anywhere else.
- `js/art.js` draws everything the app shows that is not text: the emotion wheel, the bottle silhouettes on
  the shelf, and the four charts on the skill page. All SVG built in JavaScript so it inherits the theme.
  The bottles are why the app needs no camera permission: six silhouettes and two stoppers picked by a hash
  of the bottle's own name, tinted by the family of its dominant note.
- `js/app.js` is four tab screens, six pushed pages, three sheets, the drill runner, the notification
  planner, and `window.App` for the shell's Back gesture and lifecycle callbacks.

The drills are self-scored and the app says so on screen. Sillage cannot smell anything, so an accuracy
curve is a record of the user's honesty as much as their nose. Recording the true answer after a miss is
what lets the skill page point at the right shelf and the right lexicon card, which is the reason marking a
miss is framed as worth more than marking a hit.

`android/` is a thin Kotlin WebView shell that serves `web/` from an app private https origin through
`WebViewAssetLoader`, adds a haptic tap, local notification scheduling and file export, and declares
`VIBRATE` and `POST_NOTIFICATIONS` as its only permissions. The web core is copied into the app's assets by
the `syncWebAssets` Gradle task on every build.

`docs/` is the GitHub Pages site: landing page, privacy policy, and a playable copy of the app.

`store/` holds the brand spec, the screenshot spec, the seed data used for the screenshots, the generated
Play assets and the listing copy. The icon and feature graphic are drawn procedurally from
`store/brand.json`; nothing is model generated.

## Build

```sh
cd android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew bundleRelease assembleRelease
```

Signing reads `android/keystore.properties`, which is not in this repository.

## Regenerate the assets

```sh
python _shiptools/brand.py store/brand.json --out store --res android/app/src/main/res
python _shiptools/privacy.py store/policy.json --out docs/privacy-policy.html
python3 -m http.server 8761 --directory web
node _shiptools/shots.js store/shots.json
cp store/screenshots/*.png docs/shots/
rsync -a --delete web/ docs/play/
```

`docs/privacy-policy.html` is generated, so edit `store/policy.json` rather than the HTML.

## What is deliberately not here

No batch code decoding. Decoding a production date from a batch code needs a brand by brand pattern library
that nobody outside those brands can verify, and it goes stale silently. A half correct one would be worse
than none, so the feature is absent and the listing says so.

No weather triggered resurfacing. The original design brought petrichor entries back when it rained, which
needs a live forecast, which needs a network. Entries return by anniversary and by the same week of the
year instead, which turns out to carry most of the idea.

No photographs. A photo pipeline needs either a camera permission or a picker, and storing images in
`localStorage` would blow the quota within a few bottles. Bottles are drawn from their own names instead,
which is a better shelf and a much cleaner privacy story.

No community, no shelf sharing, no clubs and no reviews anyone else can read. All of it needs a server, and
a server needs an account.

No partner drill mode. Two people and one phone is a real drill, but the app cannot verify any of it, and
the solo self-scored loop is the honest version of the same idea.

Backup is a plain JSON or CSV export written to Downloads, not an encrypted archive: there is no vendored
crypto library here and shipping a half built one would be worse than being clear about it.

English only, no widgets, no Wear OS companion, and no paid tier of any kind.
