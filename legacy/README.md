# Critters Tarot — one-card reading

A single-card tarot draw. The artwork is from the `critters` Figma file
(node `159:143`); the surface around it is a night table — midnight plaster,
drifting gold dust, ink-and-gold frames. No build step, no dependencies.

## Run

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173 (the assets are loaded over HTTP, so opening
`index.html` from the filesystem is not enough).

## Flow

1. **Shuffle** — three riffles and a cut, animated on the face-down deck.
2. **Fan** — the deck spreads into an arc of face-down cards.
3. **Draw** — clicking (or Enter/Space on a focused card) sweeps the rest of the
   fan off the table, floats the chosen card to centre and flips it in 3D.
   Only one card can be drawn: the fan locks the moment a card is picked.
4. **Name the intention** — the card gives its name and orientation, then asks
   what you came to ask. Type a question (or tap a quick prompt).
5. **Read** — the question is classified into a topic, and the reading is
   composed for that card, that orientation and that topic. *Ask something else*
   keeps the same card and asks a new question; *Draw again* reshuffles.

## How a reading is composed

`Oracle.consult(card, reversed, question)` in [oracle.js](oracle.js):

1. **Topic detection** — keyword scoring over the question. Domain words
   (`promotion`, `debt`, `my ex`, `burnout`) score 1; decision words
   (`should I`, `whether`, `stay or`) score 0.5, so "should I" never outvotes
   the actual subject. Topics: love, work & opportunity, money, self & healing,
   a decision, and an open question when nothing matches.
2. **Composition** — the card's topic *lens* (written per card in `cards.js`),
   wrapped in an orientation frame, followed by the card's general meaning for
   that orientation, its whisper, and a topic-specific closing line. The frames
   and closers are picked at random, so nothing is composed the same way twice.

## Caching

Because the phrasing is randomised, the same question would otherwise come back
worded differently every time. Readings are therefore cached in `localStorage`
under `critters-tarot.readings.v1`, keyed by `cardId | orientation | topic`:

- **Hit** — the exact earlier reading is returned, marked *Recalled*, with the
  question that first produced it, and rendered near-instantly (260ms rather
  than the 1150ms deliberation) so the cards read as consistent rather than
  improvising.
- **Miss** — composed, shown, and stored. The store keeps the 240 most recent
  entries and is wrapped in `try`/`catch`, so private browsing degrades to
  "compose every time" rather than breaking.
- *Forget remembered readings* under the answer clears the store.

Ask "should I take the job?" and later "is this opportunity right for me?" on
the same card and you get the same answer back — both resolve to
`work`, and the cards do not change their minds.

Each draw reassigns the faces at random after the shuffle, and each card has a
30% chance of coming up reversed, which swaps in its reversed reading and flips
the artwork.

## Files

| file | what it holds |
| --- | --- |
| `index.html` | markup for the stage and the reading panel |
| `styles.css` | layout, card 3D flip, transitions, responsive rules |
| `app.js` | shuffle choreography, fan geometry, draw + intention + reset states |
| `oracle.js` | topic detection, reading composition, the localStorage cache |
| `cards.js` | the 22 Major Arcana: upright, reversed, and per-topic lenses |
| `assets/card-back.svg` | the card back, authored in the frame's grammar |
| `assets/dust-*.svg` | three parallax fields of drifting gold dust |
| `assets/cards/*.png` | the 22 card faces, exported at 2× from Figma |
| `assets/card-frame.webp` | the arch-frame reference the back is drawn from |
| `assets/backdrop.png`, `assets/card-back-roses.png` | superseded by the redesign, kept |

## The world

Everything on screen is one of two objects. **Night**: a plaster ground of
layered navy fields, a fine grain, three parallax star fields drifting at
different speeds, and two very slow warm breaths — that is the entire
background, and the only motion in it. **Frame**: an ink border, a gold rule
inset inside it, an arch, a crescent, a rising sun. The card backs wear the
frame with night inside them; the reading wears the same frame with parchment
inside it. The drawn card is then mounted *into* the reading plate — its
transform is measured against the plate's aperture and re-seated by a
`ResizeObserver`, so the card and the page are literally one object.

Type is Alike Angular for display (the face in the Figma file) over EB Garamond.
Gold `#d9a441` is the only accent; the card artwork supplies every other colour.

## Layout notes

On screens under 700px the table lays out 9 face-down positions instead of 22 —
a full 22-card fan collapses into untappable slivers on a phone — dealt from the
same shuffled deck. The fan is scaled at runtime (`fitFan`) so it always clears
the curtains at the edges of the backdrop.
