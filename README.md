# Word Shooter

A typing game for kids (made for a 12 year old). Monsters fall from the sky, each carrying a word. Type the word to shoot it down before it reaches the line. Installable as an app (PWA) and works offline.

The interface is in English, the falling words are Swedish.

Play online: https://neckfors.github.io/word-shooter/

## How to play
- Type the word under a monster. The first letter you type locks on to that monster, and the cannon turns towards it.
- A wrong letter turns red and blocks input until you press Backspace (it also breaks your combo). Backspace with no red letter lets go of the current monster. Monsters stay near the middle of the screen. The minute clock starts when you type the first letter.
- A monster that reaches the pink line costs one heart (5 hearts). Every 10 words in a row gives a heart back.
- After every minute the game pauses and shows your speed in words per minute (WPM) and accuracy. The next minute is a little faster, and the words get a bit longer.
- The pace follows you: the faster you type, the faster and more monsters come, so 5 wpm and 100 wpm both get a steady, fair game. There is always something to shoot at. Each minute asks a bit more of you.
- **Multiplication mode** (pick it on the start screen, tables 2-9 always): the lowest monster is locked on automatically and shows a problem like `7 × 8`. Type the answer digits. A wrong digit turns red and blocks input until Backspace. There is no WPM; the HUD and minute pause show problems solved instead.
- **Progress grid** (multiplication mode): an 8x8 grid coloured from green (you know it) towards red (needs practice), based on your last 10 tries of each problem (7x8 and 8x7 count as one fact). Problems you struggle with come up more often. Progress is stored only in your browser.
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
- Words: copy `words/sv.json` to `words/xx.json`. It has three lists: `easy` (short), `medium` and `hard`. Mix word classes (nouns, verbs, adjectives, adverbs, pronouns, prepositions, numbers). Avoid spaces in words.
- Choose them with `?ui=xx&words=yy` (defaults are `en` and `sv`), and add the new files to `FILES` in `sw.js`.

## Releases and updates
Bump `VERSION` in `sw.js` for every release. Installed apps download the new version in the background, then show a "New version available" bar with an Update button. The version is shown at the bottom of the start screen.

## Files
- `js/game.js` game logic and drawing, `js/players.js` local players and per-player storage, `js/mathstats.js` multiplication history and grid colours, `js/fx.js` particles and starfield, `js/audio.js` synthesised sounds (no audio files), `js/main.js` menus, HUD, input and updates, `js/i18n.js` languages.

## Support
If you like the app, you can support the author on [PayPal](https://paypal.me/neckfors). Thank you!
