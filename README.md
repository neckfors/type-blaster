# Type Blaster

A typing game for kids (made for a 12 year old). Monsters fall from the sky, each carrying a word. Type the word, then press SPACE to shoot it down before it reaches the line. It is not installable as an app; play it in the browser.

The interface is in English, the falling words are Swedish.

Play online: https://neckfors.github.io/type-blaster/

## How to play
- The closest monster is always locked on (the cannon aims at it); type its word. The other monsters can't be typed until it is gone.
- **Between minutes:** the minute summary, pause and game-over screens only close with Enter (or their button), never Space, so a space typed mid-word does not skip them. They also ignore keys for the first second.
- **Press SPACE to shoot** (words mode): when the whole word is typed the monster shows a green "SPACE to shoot!" label and nothing happens until you press space, like the space between words in a typing test. Extra letters are ignored meanwhile. On phones, tapping the screen also shoots a finished word. Multiplication mode still fires on the last digit.
- A wrong letter turns red and blocks input until you press Backspace (it also breaks your combo). Backspace with no red letter removes the last correct letter. Monsters stay near the middle of the screen. The minute clock starts when you type the first letter. Only finished words count (letters plus their space), as on 10fastfingers; half-typed words do not. After a minute break or pause, a half-typed word starts over.
- A monster that reaches the pink line costs one heart (5 hearts). Every 10 words in a row gives a heart back.
- After every minute the game pauses and shows your speed in words per minute (WPM) and accuracy. The next minute is a little faster, and the words get a bit longer. WPM follows the usual typing-test convention (as on 10fastfingers): every 5 characters count as one word, and each word includes its trailing space, so short and long words are treated evenly. You never wait for a word: at least 4 are always on screen and a new one appears at the top as soon as you shoot one, so WPM is plain finished words per 60 seconds, like 10fastfingers.
- The pace follows you: the faster you type, the faster and more monsters come, so 5 wpm and 100 wpm both get a steady, fair game. There is always something to shoot at. Each minute asks a bit more of you. The first few words arrive quickly, and new words appear on screen (not from above it). Words stay near the middle of the screen.
- **Maths mode** (pick it on the start screen): the lowest monster is locked on automatically and shows a problem like `7 × 8` (× orange) or `47 + 38` (+ cyan). Type the answer digits. A wrong digit turns red and blocks input until Backspace. A card on the start screen chooses what to practise: multiplication only, addition only or both; tables 0×–9× one by one; additions of 1+1, 2+2 and/or 1+2 digits. There is no WPM; the HUD and minute pause show problems solved instead.
- **Progress grid** (maths mode): a 10x10 grid (0–9) of times tables coloured from green (you know it) towards red (needs practice), based on your last 10 tries of each problem (7x8 and 8x7 count as one fact). Problems you struggle with come up more often. Additions are not tracked. Progress is stored only in your browser.
- Settings: Slow / Normal / Fast speed, sound on/off, and "Accents optional" (type a instead of å or ä, o instead of ö).
- **Targeting:** the locked monster is bigger, has a pulsing ring and arrows around its label, and a dotted aim line runs from the cannon. The other monsters are dimmed.
- **Players:** pick or create a player (name only, no password) on the start screen. Each player keeps their own settings, best scores and multiplication grid in this browser. **Guest** saves nothing. The first player created adopts progress saved before players existed.
- Esc pauses. Works with a keyboard, and with the on-screen keyboard on phones and tablets.

## Run locally
Any static file server works, for example:

```
py -3 -m http.server 8765
```

Then open http://localhost:8765. For a short test round add `?minute=10` (seconds per round).

## Adding another language
Interface text and word lists are separate from the code.

- UI text: copy `lang/en.json` to `lang/xx.json` and translate it.
- Words: copy `words/sv.json` to `words/xx.json`. It has three lists: `easy` (short), `medium` and `hard`. Mix word classes (nouns, verbs, adjectives, adverbs, pronouns, prepositions, numbers). Avoid spaces in words. Read the whole list through for anything vulgar or embarrassing for a child (including look-alikes in English) before releasing.
- Choose them with `?ui=xx&words=yy` (defaults are `en` and `sv`).

## Files
- `js/game.js` game logic and drawing, `js/players.js` local players and per-player storage, `js/mathset.js` + `css/mathset.css` question types and the settings card (same copy in Math Clicker), `js/mathstats.js` multiplication history and grid colours, `js/fx.js` particles and starfield, `js/audio.js` synthesised sounds (no audio files), `js/main.js` menus, HUD, input, `js/i18n.js` languages.

## Support
If you like the app, you can support the author on [PayPal](https://paypal.me/neckfors). Thank you!
