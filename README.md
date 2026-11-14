# Word Shooter

A typing game for kids (made for a 12 year old). Monsters fall from the sky, each carrying a word. Type the word to shoot it down before it reaches the line. Installable as an app (PWA) and works offline.

The interface is in English, the falling words are Swedish.

## How to play
- Type the word under a monster. The first letter you type locks on to that monster, and the cannon turns towards it.
- A wrong letter only shakes the word and breaks your combo. Backspace unlocks the current monster.
- A monster that reaches the pink line costs one heart (5 hearts). Every 10 words in a row gives a heart back.
- After every minute the game pauses and shows your speed in words per minute (WPM) and accuracy. The next minute is a little faster, and the words get a bit longer.
- Settings: Slow / Normal / Fast speed, sound on/off, and "Accents optional" (type a instead of å or ä, o instead of ö).
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
- Words: copy `words/sv.json` to `words/xx.json`. It has three lists: `easy` (3-5 letters), `medium` and `hard`.
- Choose them with `?ui=xx&words=yy` (defaults are `en` and `sv`), and add the new files to `FILES` in `sw.js`.

## Releases and updates
Bump `VERSION` in `sw.js` for every release. Installed apps download the new version in the background, then show a "New version available" bar with an Update button. The version is shown at the bottom of the start screen.

## Files
- `js/game.js` game logic and drawing, `js/fx.js` particles and starfield, `js/audio.js` synthesised sounds (no audio files), `js/main.js` menus, HUD, input and updates, `js/i18n.js` languages.

## Support
If you like the app, you can support the author on [PayPal](https://paypal.me/neckfors). Thank you!
