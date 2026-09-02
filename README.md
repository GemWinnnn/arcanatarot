# Critters Tarot

A working build of the Figma file **critters**
([section 165:2321](https://www.figma.com/design/oSG9mJqZU16RU1WjRygP17/critters?node-id=165-2321),
[homepage 169:28](https://www.figma.com/design/oSG9mJqZU16RU1WjRygP17/critters?node-id=169-28)).
Homepage, Rename question, Shuffling, Selecting cards, Revealing cards,
Summary and Clean up — wired into one page under a persistent masthead.

No build step, no dependencies.

```bash
python3 serve.py
```

`serve.py` is plain `http.server` plus `Cache-Control: no-store`. Without it
Chrome applies heuristic freshness to `app.js` and quietly serves a stale copy
after an edit — producing errors whose line numbers no longer exist in the file.

## The flow

| Stage | What happens |
|---|---|
| **Intro** | The homepage: *ArcanaTarot* masthead, "What do you need guidance with?", six backs dealt into an arc, and **Start your reading**. A first visitor meets the room, not a form. |
| **Ask** | A compulsory modal: question (≥10 chars), birth date, year in focus. The spread is chosen here too, but only on a first ask — afterwards it belongs to *Change deck*, and the modal is just the three fields. Nothing else is reachable until all three validate. |
| **Shuffle** | A deck of 20 stacked leaves with real thickness. *Ready to shuffle* cuts it into two halves that part, bridge, zip back together leaf by leaf, and square up — twice — while Fisher–Yates reorders the real 22-card array and marks ~35% reversed. *Done Shuffling* unlocks only once the riffle has finished. |
| **Place** | Drag a card from the fan into a slot. It lands **face down**. A plain click drops into the first free slot — this is also the keyboard path. The desk's instruction crossfades through a few phrasings while you choose, then leaves the table entirely once the last card is down. |
| **Reveal** | Hovering a face-down card lifts it and shows **flip**. Clicking runs a real 3D `rotateY` flip. Reversed cards hang upside down. |
| **Summarize** | The seal appears *only* once every card is face up, and rotates continuously — the ring turns, the white eye stays upright. A ring pulses out of it four times and the line **Press to read your spread** sits underneath, because the circling text names the action but never asks for the press. Clicking it builds the reading and **seals it**. |

## Spreads

Chosen once when you first ask, and changed afterwards from *Change deck* on
the rail. Changing it mid-reading returns the cards to the deck and starts the
draw over, since the old slots no longer exist.

| Spread | Cards | Reads as |
|---|---|---|
| **Three card** | 3 | Persona, obstacle, solution — woven into one movement |
| **One card** | 1 | A single, direct answer with nothing to soften it |
| **Yes or no** | 1 | A verdict: upright is yes, reversed is no, with its reasoning |
| **Daily tarot** | 1 | The posture for the day rather than a forecast |

## The rail

Every command lives on the right-hand rail — nothing floats over the table.
The rail belongs to the desk: it is hidden on the homepage, which is a doorway,
and during the shuffle, which is a held breath. On screens under 1200px it
collapses to a row of icons above the room.

| Command | Does |
|---|---|
| **Your question** | Reopens the intake modal — question, birth date, year |
| **Change deck** | Picks the spread: three card, one card, yes or no, daily tarot |
| **Clean up cards** | Returns the cards to the deck, keeps the question |
| **Restart the room** | Wipes everything back to the homepage |

Changing the deck mid-reading clears the desk, since a different spread needs a
different number of slots.

## A finished reading

Once the seal is clicked the reading is written down and its own cards stay as
they fell — they cannot be flipped back, dragged out, or swapped underneath it,
so what the reading says never stops being true of what was drawn. It is saved
to `localStorage` and restored verbatim on reload.

That is where the finality ends. The reading is a record, not a cage, and every
way onward is one click:

| From the summary | Does |
|---|---|
| **Draw new cards** | Keeps your question, returns to a fresh shuffled deck |
| **Ask a new question** | Same, and reopens the intake with your last answers |

The rail stays live too. *Your question* on a finished reading clears it and
starts a new draw; *Change deck* switches the spread; *Clean up cards* empties
the desk but keeps the question; *Restart the room* goes back to the homepage.

## Sound

The riffle, the card-place and the flip are recordings; everything else is
synthesised with the Web Audio API.

| Cue | How it is made |
|---|---|
| **Click** | A 35ms noise tap plus a quiet triangle blip |
| **Card placed** | `assets/place.ogg`, with a little playback-rate jitter so three cards in a row are not identical. Falls back to a synthesised thud. |
| **Flip** | A slice of `assets/flip.ogg`. That file is 8s holding several takes with silence between; three of them are cut out by offset and length, level-matched to a common peak, and rotated so consecutive flips differ. Each slice is ≤ 500ms, inside the 600ms flip. |
| **Riffle** | `assets/shuffle.ogg`, played straight. Its length drives the shuffle animation — the hands finish squaring up as the sound dies, and swapping the clip retimes the motion with no other change. A synthesised riffle (~90 noise grains) stands in if the file cannot be decoded. |
| **The seal** | Three tones into a generated reverb |
| **The bed** | Four detuned voices (root, fifth, octave) under a lowpass, each on its own slow swell, plus a C-pentatonic bell every 5–12s. No melody to learn. |

The reverb is a decaying noise burst used as a convolver impulse. The context is
built lazily on the first gesture, because browsers refuse to start audio
otherwise; the samples are fetched at load and decoded on that same first
gesture, so they are ready well before anyone needs them. Slices get a 12ms
fade at each end, so cutting mid-file never clicks. The bed begins when your question does — never on the homepage — and
stops when you go back to the door.

The switch in the masthead silences everything and is remembered across visits.

## Files

| File | Role |
|---|---|
| `index.html` | Structure, the seal SVG (circular `textPath` + the gold eye) |
| `styles.css` | The whole design system — white desk, Playfair Display, Poppins |
| `cards.js` | The 22 Major Arcana: keys, body, whisper, and five topic lenses each |
| `oracle.js` | Topic detection (`detectTopic` → `{ topic, score, confident }`) |
| `spread.js` | Spread definitions, and the reading each one builds |
| `audio.js` | Three recorded samples, every other sound synthesised |
| `app.js` | Stages, drag and drop, flipping, the riffle, modals, persistence |
| `serve.py` | No-cache static dev server |
| `legacy/` | The previous single-card night-theme build, kept intact |

## Positions

The Figma slots are unlabelled, so the roles live in the summary rather than on
the desk — for the three-card spread: **Persona** (who you are in the question),
**Obstacle** (what is in the way), **Solution** (what you are invited to do).

## Assets

Card faces are the 22 `MW_*` exports, renamed to their card ids
(`assets/cards/death.png`). The card back is `assets/card-back-eye.png` and the
seal's eye is `assets/seal-eye.png`, both pulled from the Figma file. The eye
ships as gold foil and is turned white in CSS with `brightness(0) invert(1)`,
which flattens every colour to black and lifts it to white while leaving the
alpha channel alone — no second copy of the asset to keep in step.

Only placed cards load a face image — the fan would otherwise pull all 6MB of
art down to render a row of backs. The deck's buried leaves drop their back art
at rest for the same reason, and get it back for the length of a shuffle, when
they briefly become whole cards.

## Notes

- The homepage hand is two nested layers: the slot owns the fan angle and the
  deal-in, the card owns the idle drift. Separating them keeps the breathing from
  fighting the fan. The hand is looked at, not handled — it takes no pointer
  events at all.
- Respects `prefers-reduced-motion`: the seal holds still, the riffle is skipped,
  the flip drops to 200ms, and the homepage hand fans without dealing or drifting.
- Responsive below 1200px — the rail becomes a row of icons, slots stack, the
  fan scrolls horizontally, and the seal moves above the question.
- The fan rail carries 58px of top padding, cancelled by an equal negative
  margin. `overflow-x: auto` forces the other axis to compute to `auto` too, so
  without that headroom a hovered card lifting out of the box loses its top edge.
- The fan always holds every remaining card. If they cannot all fit at the
  minimum overlap the rail scrolls rather than running them off the edge, and a
  count under the desk says how many are left.
- The reading is deterministic: the same cards and question always produce the
  same words, so a reload never rewrites a sealed reading.
