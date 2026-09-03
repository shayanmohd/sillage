# Sillage: Play Store listing

**Package:** com.mohdshayan.sillage
**Category:** Lifestyle
**Pricing:** Free. No in-app purchases, no subscription, no ads.

## Title (27 / 30)
Sillage: Scent Diary & Nose

## Short description (75 / 80)
Journal smells, train your nose, log your perfumes. Offline, private, free.

## Full description (3992 / 4000)
You have ten thousand photographs and not one smell.

Smell is wired straight into memory's basement. One molecule of a stranger's perfume on a train and you are, involuntarily, in a hallway in 1998. We built whole industries for what we see and hear, and almost nothing for the sense that time travels.

Sillage is three things at once: a diary for smells, a training programme for your nose, and a record of your shelf. It is entirely offline and holds no account.

THE DIARY THAT TIME TRAVELS

An entry takes about forty seconds. What you smelled, note tags from a lexicon of 352 cards, an emotion wheel that tints the entry in the stream, the place, the people, the bottle you were wearing.

Then the part that matters: the anchor. You cannot record a smell, but you can encode one, and articulation is the encoding. The field hands you a sentence shape and asks for one line of comparison. Like wet cardboard and oranges, but warmer. Nine parts wet stone, one part hot butter.

Entries come back. On the anniversary, and on the same week of the year, so the first cold morning of autumn brings back last year's first cold morning.

TRAIN YOUR NOSE LIKE A PALATE

Thirty eight sessions across two tracks, five minutes or less each.

Foundations: fourteen sessions on four things you already own, coffee, a lemon, cloves and mint. Attention first, then description, then blind identification, then memory span.

The Pantry Conservatory: twenty four sessions across eight shelves of your own kitchen, four jars widening to eight.

You shuffle the jars and you mark yourself, because the app cannot smell anything. It says so on the screen. A miss is worth more than a hit: it is how the app knows which shelf to send you back to, and which card to put in front of you.

YOUR NOSE, CHARTED

Identification accuracy across every scored session. Vocabulary growth, the count of words you have actually used out of 352. The longest gap you have carried a smell across and still picked it out. Accuracy per shelf, and what gets past you.

YOUR SHELF, FINALLY ORGANISED

Bottles, decants and samples, with sizes, notes, seasons, a four step sillage scale and a three line take: opening, heart, drydown. One tap logs a wear.

About a fortnight later the log pays you back: reach-for rate, cost per wear, which months a bottle belongs to, and a quiet list of what has not been worn in months.

Every bottle is drawn in code from its own name and notes, so the shelf looks like a shelf without the app ever asking for your camera.

WORDS FOR WHAT YOU SMELL

352 cards across fifteen families, from the citrus grove to the animalic cellar to the vocabulary of the craft. What it is, where you meet it, what sits nearby.

Every card lists the entries and bottles where you have used it, so the lexicon is a map of your own nose rather than a glossary.

NOTHING LEAVES YOUR PHONE

Sillage does not request the internet permission, so Android will not let it open a connection at all. You can check that on this listing before you install.

No account, no sign in, no cloud, no analytics, no crash reporter, no advertising identifier. No camera permission, no photo picker, no location permission. Export everything as JSON or CSV whenever you like, or erase all of it in two taps.

WHAT SILLAGE DOES NOT DO

No batch code decoding: it needs a brand by brand database nobody outside those brands can verify, and a half correct one is worse than none. No community, shelf sharing or clubs: those need a server, and a server needs an account. No weather triggered resurfacing: entries return by anniversary and season instead. No photographs, no widgets, English only.

The training is written as a hobby, in the spirit of ear training or wine tasting. Sillage makes no medical claim. If your sense of smell has changed suddenly, that is a conversation for a doctor.

FREE AND COMPLETE

Every entry, every bottle, every session and all 352 cards. No paid tier, no subscription, no in-app purchase, no ads.

## Contact
Email: shayanm2002@gmail.com
Website: https://shayanmohd.github.io/sillage/
Privacy policy: https://shayanmohd.github.io/sillage/privacy-policy.html

## Declarations (read off the built manifest and the code, not assumed)
- Permissions declared: `android.permission.VIBRATE`, `android.permission.POST_NOTIFICATIONS`, and the
  signature-level `com.mohdshayan.sillage.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` that androidx.core
  adds to every app. No INTERNET. No CAMERA. No location. No microphone. No storage permission.
  Verified with `aapt2 dump permissions` on the release APK.
- Ads: none. No advertising SDK is present in the bundle.
- Data collected or shared: none. Nothing leaves the device, and the app cannot open a network connection.
- Advertising ID: not used.
- App access: every feature is available with no login of any kind.
- In-app purchases: none. The app is complete and free.
- Government, financial or health-device features: none.
- Health claims: none. The training tracks are framed throughout as a hobby skill, in the same register as
  ear training or wine tasting. The app never uses the words treatment, therapy, recovery or diagnosis, and
  both the privacy policy and the in-app copy tell a user whose sense of smell has changed suddenly to see
  a doctor. This matters because smell training has a clinical cousin; the app deliberately is not it.
- Camera and photos: the app has no camera permission and no photo picker, and cannot read the gallery.
  Bottles on the shelf screen are drawn procedurally from the name and note tags the user typed. This is
  worth stating plainly because a collection manager usually implies photo storage and this one has none.
- Location: no permission of any kind. The place on an entry is free text. The hemisphere setting is a
  two-way switch the user picks, used only to decide which season a date falls in.
- Notifications: scheduled locally through AlarmManager. No push service, no Firebase, no network. Content
  is composed on the device from words the user typed. The whole schedule is cancelled when the user turns
  reminders off.
- User-generated content: stays on the device. There is no upload path, no moderation surface, and no way
  for one user's text to reach another user.
- Brand names: the app ships with no perfume or brand database of any kind. Every bottle name in the app is
  typed by the user. The names visible in the store screenshots are invented for the demonstration data and
  do not refer to any real house or product.
- Target audience: 18 and over. Adult hobby content, including fragrance and personal journalling.
- Content rating questionnaire: no violence, no sexual content, no profanity, no controlled substances, no
  gambling, no user-to-user communication, no location sharing, no shared user-generated content. Lexicon
  cards describe smells including animalic and bodily ones (sweat, skin, leather, indole) in plain
  descriptive language; there is nothing sexual or graphic in them.
- AI-generated assets: none. The icon and feature graphic are drawn procedurally in code from
  `store/brand.json`; the six screenshots are captures of the running app.
