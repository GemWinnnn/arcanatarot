/* ---------------------------------------------------------------
   Critters Tarot — the room.

   Stages: ask → shuffle → desk (place) → reveal (flip) → summary.
   The summary is a one-way door: once it exists the spread is
   frozen and only "Restart the room" can undo it.
   --------------------------------------------------------------- */

(() => {
"use strict";

const KEY = "critters.spread.v1";
const $  = id => document.getElementById(id);

const el = {
  room: $("room"), rail: $("rail"),
  question: $("questionText"), questionRow: $("questionRow"), rename: $("btnRename"),
  cleanUp: $("btnCleanUp"), restart: $("btnRestart"),
  seal: $("seal"),
  renameInline: $("btnRenameInline"), deckBtn: $("btnDeck"), start: $("btnStart"),
  scrimDeck: $("scrimDeck"), deckPick: $("deckPick"),
  stageIntro: $("stageIntro"),
  stageShuffle: $("stageShuffle"), stageDesk: $("stageDesk"),
  readyShuffle: $("btnReadyShuffle"), doneShuffle: $("btnDoneShuffle"),
  slots: $("slots"), fan: $("fan"),
  says: $("deskSays"), lead: $("deskLead"), hint: $("deskHint"), fanCount: $("fanCount"),
  deckStack: $("deckStack"), deckCount: $("deckCount"),
  spreadPick: $("spreadPick"),
  scrimAsk: $("scrimAsk"), askForm: $("askForm"), spreadsField: $("spreadsField"),
  fQuestion: $("fQuestion"), fBirth: $("fBirth"), fYear: $("fYear"),
  eQuestion: $("eQuestion"), eBirth: $("eBirth"), eYear: $("eYear"),
  scrimWipe: $("scrimWipe"), wipeYes: $("btnWipeYes"),
  scrimSum: $("scrimSum"), sumBody: $("sumBody"),
  live: $("live"), sound: $("btnSound")
};

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ─── sound ────────────────────────────────────────────────────── */

// one listener in the capture phase covers every button in the room,
// including the ones rendered into modals long after boot
document.addEventListener("pointerdown", e => {
  if (e.target.closest("button, .spread, .card")) Sound.click();
}, true);

function paintSound() {
  el.sound.setAttribute("aria-pressed", Sound.enabled() ? "true" : "false");
}

el.sound.addEventListener("click", () => {
  const nowOn = Sound.toggle();
  paintSound();
  // the bed follows the switch, but only where it belongs
  if (nowOn && S.stage !== "intro") Sound.startMusic(); else Sound.stopMusic();
  say(nowOn ? "Sound on." : "Sound off.");
});

paintSound();

/* ─── state ────────────────────────────────────────────────────── */

const S = {
  question: "", birth: "", year: null,
  spread: "three",              // which layout — see Spread.SPREADS
  order: [],                    // shuffled deck: [{id, reversed}]
  slots: [null, null, null],    // {id, reversed, faceup}
  stage: "intro",
  shuffled: false,
  summary: null,
  locked: false
};

const shape = () => Spread.SPREADS[S.spread] || Spread.SPREADS.three;
const emptySlots = () => Array.from({ length: shape().count }, () => null);

let wipeMode = "clean";         // which button opened the confirm

/* ─── persistence ──────────────────────────────────────────────── */

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || !d.question) return false;
    Object.assign(S, d);
    return true;
  } catch (e) { return false; }
}

/* ─── deck ─────────────────────────────────────────────────────── */

function freshOrder() {
  const a = DECK.map(c => ({ id: c.id, reversed: false }));
  return shuffleInPlace(a);
}

function shuffleInPlace(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  a.forEach(c => { c.reversed = Math.random() < 0.35; });
  return a;
}

const cardDef  = id => DECK.find(c => c.id === id);
const inSlots  = id => S.slots.some(s => s && s.id === id);
const fanCards = () => S.order.filter(c => !inSlots(c.id));
const placedAll = () => S.slots.every(Boolean);
const revealedAll = () => placedAll() && S.slots.every(s => s.faceup);

/* ─── card elements ────────────────────────────────────────────── */

function makeCard(entry, { placed }) {
  const def = cardDef(entry.id);
  const d = document.createElement("div");
  d.className = "card" + (placed ? " is-placed" : " card--fan");
  if (entry.reversed) d.classList.add("is-reversed");
  if (placed && entry.faceup) d.classList.add("is-faceup");
  if (placed && S.locked) d.classList.add("is-locked");
  d.dataset.id = entry.id;

  const facing = placed && entry.faceup;
  d.setAttribute("role", "button");
  d.tabIndex = 0;
  d.setAttribute("aria-label",
    facing ? `${def.name}${entry.reversed ? ", reversed" : ""}`
           : placed ? "Face-down card. Activate to flip."
                    : `Deck card. Activate to place it on the desk.`);

  // only a placed card ever shows its face — giving all 22 fan backs a face
  // image would pull the entire 6MB deck down to render a row of backs
  const face = placed
    ? `<div class="card__face" style="background-image:url('assets/cards/${def.id}.png')"></div>`
    : `<div class="card__face"></div>`;

  d.innerHTML = `
    <div class="card__inner">
      <div class="card__back"></div>
      ${face}
    </div>
    ${placed && !entry.faceup ? '<span class="card__flip">flip</span>' : ""}`;
  return d;
}

/* ─── render ───────────────────────────────────────────────────── */

function render() {
  const intro = S.stage === "intro";

  el.question.textContent = S.question || "…";
  el.questionRow.hidden = intro || !S.question;

  // the commands belong to the desk. The homepage is a doorway and the
  // shuffle is a held breath — neither wants a menu sitting next to it.
  el.rail.hidden = S.stage !== "desk";
  el.stageIntro.hidden   = !intro;
  el.stageShuffle.hidden = S.stage !== "shuffle";
  el.stageDesk.hidden    = S.stage !== "desk";

  if (S.stage === "shuffle") renderRiffle();
  if (S.stage === "desk")  { renderSlots(); renderFan(); }

  el.doneShuffle.disabled = !S.shuffled;

  // the seal exists only once every card is face up
  const showSeal = revealedAll();
  if (showSeal && el.seal.hidden) el.seal.hidden = false;
  if (!showSeal) el.seal.hidden = true;

  renderHint();
  save();
}

/* ─── the desk's voice ─────────────────────────────────────────────
   The instruction is not a label — it drifts through a few phrasings,
   crossfading, and then leaves the table entirely once every card is
   down. Nothing on a settled desk should still be talking.            */

const lines = () => S.slots.length === 1
  ? ["Drag your card to your desk",
     "Take the one your hand goes to",
     "You are not choosing wrong",
     "The deck is patient"]
  : ["Drag your cards to your desk",
     "Take the ones your hand goes to",
     "You are not choosing wrong",
     "The deck is patient"];

let lineIdx = 0, lineTimer = null;

function renderHint() {
  // the desk only speaks while it is the thing on screen and still empty
  const done = placedAll() || S.stage !== "desk";

  el.says.classList.toggle("is-gone", done);
  el.says.setAttribute("aria-hidden", done ? "true" : "false");

  if (done) { stopHintCycle(); return; }

  el.lead.textContent = S.slots.length === 1 ? "Place your card" : "Place your cards";
  startHintCycle();
}

function startHintCycle() {
  if (lineTimer || reduceMotion) {
    if (reduceMotion) el.hint.textContent = lines()[0];
    return;
  }
  const L = lines();
  el.hint.textContent = L[lineIdx % L.length];
  lineTimer = setInterval(() => {
    el.hint.classList.add("is-fading");
    setTimeout(() => {
      const cur = lines();
      lineIdx = (lineIdx + 1) % cur.length;
      el.hint.textContent = cur[lineIdx];
      el.hint.classList.remove("is-fading");
    }, 460);
  }, 3600);
}

function stopHintCycle() {
  clearInterval(lineTimer);
  lineTimer = null;
}

/* The deck is drawn as LEAVES stacked leaf-on-leaf, each nudged a hair
   off the one below, so the block reads as a real deck with thickness
   rather than four loose cards laid side by side. */
const LEAVES = 20;

function renderRiffle() {
  if (el.deckStack.childElementCount) return;
  el.deckStack.innerHTML = "";
  for (let i = 0; i < LEAVES; i++) {
    const leaf = document.createElement("div");
    leaf.className = "leaf";
    leaf.dataset.i = i;
    // the top leaf is the only one showing the full back; the rest are edges
    if (i === LEAVES - 1) leaf.classList.add("leaf--top");
    leaf.style.setProperty("--i", i);
    leaf.style.setProperty("--jx", (Math.random() * 1.6 - 0.8).toFixed(2));
    leaf.style.setProperty("--jr", (Math.random() * 0.8 - 0.4).toFixed(2));
    leaf.style.zIndex = i + 1;
    leaf.style.transform = leafRest(leaf);
    el.deckStack.appendChild(leaf);
  }
  el.deckCount.textContent = `${S.order.length} cards, face down`;
}

function leafRest(leaf) {
  const i = +leaf.dataset.i;
  const jx = leaf.style.getPropertyValue("--jx") || 0;
  const jr = leaf.style.getPropertyValue("--jr") || 0;
  return `translate(${(+jx + i * 0.28).toFixed(2)}px, ${(-i * 0.85).toFixed(2)}px) rotate(${jr}deg)`;
}

function renderSlots() {
  el.slots.innerHTML = "";
  el.slots.dataset.count = S.slots.length;
  S.slots.forEach((entry, i) => {
    const slot = document.createElement("div");
    slot.className = "slot" + (entry ? " is-filled" : "");
    const pos = shape().positions[i];
    if (pos) slot.dataset.label = pos.label;
    slot.dataset.slot = i;
    if (entry) {
      const c = makeCard(entry, { placed: true });
      c.style.position = "absolute";
      c.style.inset = "0";
      c.style.width = "100%";
      c.style.height = "100%";
      slot.appendChild(c);
    }
    el.slots.appendChild(slot);
  });
}

function renderFan() {
  const cards = fanCards();
  el.fan.innerHTML = "";
  if (!cards.length) return;

  // measure a real card — --card-w is a clamp() and cannot be parsed
  const probe = document.createElement("div");
  probe.className = "card";
  probe.style.visibility = "hidden";
  el.fan.appendChild(probe);
  const cardW = probe.getBoundingClientRect().width || 274;
  probe.remove();

  const w = el.fan.parentElement.clientWidth || el.fan.clientWidth || 1640;

  // every remaining card must be reachable: if they cannot all fit at the
  // minimum overlap, the rail scrolls rather than running them off the edge
  const MIN_STEP = 34;
  const step = cards.length > 1
    ? Math.min(150, Math.max(MIN_STEP, (w - cardW) / (cards.length - 1)))
    : 0;
  const span = step * (cards.length - 1) + cardW;
  el.fan.style.width = Math.max(w, span) + "px";
  const x0 = Math.max(0, (w - span) / 2);

  el.fanCount.textContent =
    `${cards.length} card${cards.length === 1 ? "" : "s"} left in the deck`;

  cards.forEach((entry, i) => {
    const c = makeCard(entry, { placed: false });
    c.style.transform = `translateX(${x0 + i * step}px)`;
    c.style.zIndex = i + 1;
    c.dataset.fanX = x0 + i * step;
    c.dataset.fanI = i;
    el.fan.appendChild(c);
  });
  el.fan._step = step;
}

/* fan hover: the card rises and its neighbours part to make room */
el.fan.addEventListener("pointerover", e => {
  const card = e.target.closest(".card--fan");
  if (!card || dragging) return;
  const i = +card.dataset.fanI;
  [...el.fan.children].forEach(c => {
    const d = +c.dataset.fanI - i;
    const x = +c.dataset.fanX;
    const push = d === 0 ? 0 : (d > 0 ? 1 : -1) * Math.max(0, 22 - Math.abs(d) * 7);
    c.style.transform = `translateX(${x + push}px)` + (d === 0 ? " translateY(-18px)" : "");
  });
});

el.fan.addEventListener("pointerleave", resetFanPositions);

function resetFanPositions() {
  [...el.fan.children].forEach(c => {
    c.style.transform = `translateX(${c.dataset.fanX}px)`;
  });
}

/* ─── drag and drop ────────────────────────────────────────────── */

let dragging = null;

el.fan.addEventListener("pointerdown", e => {
  if (S.locked || placedAll()) return;
  const card = e.target.closest(".card--fan");
  if (!card || e.button !== 0) return;

  e.preventDefault();
  const r = card.getBoundingClientRect();
  dragging = {
    card,
    id: card.dataset.id,
    dx: e.clientX - r.left,
    dy: e.clientY - r.top,
    w: r.width, h: r.height,
    moved: false
  };

  card.setPointerCapture(e.pointerId);
  card.classList.add("is-dragging");
  card.style.width = r.width + "px";
  card.style.height = r.height + "px";
  moveDrag(e.clientX, e.clientY);
});

el.fan.addEventListener("pointermove", e => {
  if (!dragging) return;
  dragging.moved = true;
  moveDrag(e.clientX, e.clientY);
  highlightSlotUnder(e.clientX, e.clientY);
});

function moveDrag(x, y) {
  dragging.card.style.left = (x - dragging.dx) + "px";
  dragging.card.style.top  = (y - dragging.dy) + "px";
  dragging.card.style.transform = "none";
}

function slotUnder(x, y) {
  const slots = [...el.slots.children];
  return slots.find((s, i) => {
    if (S.slots[i]) return false;
    const r = s.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }) || null;
}

function highlightSlotUnder(x, y) {
  const hit = slotUnder(x, y);
  [...el.slots.children].forEach(s => s.classList.toggle("is-over", s === hit));
}

el.fan.addEventListener("pointerup", endDrag);
el.fan.addEventListener("pointercancel", endDrag);

function endDrag(e) {
  if (!dragging) return;
  const { card, id, moved } = dragging;
  const hit = slotUnder(e.clientX, e.clientY);
  dragging = null;

  card.classList.remove("is-dragging");
  card.style.left = card.style.top = card.style.width = card.style.height = "";
  [...el.slots.children].forEach(s => s.classList.remove("is-over"));

  if (hit) {
    place(id, +hit.dataset.slot);
  } else if (!moved) {
    // a plain click drops into the first free slot — the keyboard path too
    const free = S.slots.findIndex(s => !s);
    if (free > -1) place(id, free); else resetFanPositions();
  } else {
    resetFanPositions();
  }
}

function place(id, slotIndex) {
  if (S.slots[slotIndex] || S.locked) return resetFanPositions();
  const entry = S.order.find(c => c.id === id);
  S.slots[slotIndex] = { id, reversed: entry.reversed, faceup: false };
  render();
  Sound.place();
  const node = el.slots.children[slotIndex].querySelector(".card");
  if (node && !reduceMotion) {
    node.animate(
      [{ transform: "translateY(-16px) scale(1.04)" }, { transform: "none" }],
      { duration: 340, easing: "cubic-bezier(.22,1,.36,1)" }
    );
  }
  say(`${cardDef(id).name} placed face down.`);
}

/* ─── flipping ─────────────────────────────────────────────────── */

el.slots.addEventListener("click", e => {
  const card = e.target.closest(".card");
  if (!card) return;
  const i = +card.closest(".slot").dataset.slot;
  const entry = S.slots[i];
  if (!entry) return;
  if (entry.faceup) { if (S.summary) openSummary(); return; }
  if (S.locked) return;
  flip(i, card);
});

el.slots.addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const card = e.target.closest(".card");
  if (!card) return;
  e.preventDefault();
  card.click();
});

function flip(i, node) {
  S.slots[i].faceup = true;
  Sound.flip();
  node.classList.add("is-faceup", "is-flipping");
  node.querySelector(".card__flip")?.remove();
  node.classList.remove("is-placed");
  node.classList.add("is-placed");
  setTimeout(() => node.classList.remove("is-flipping"), 620);

  const d = cardDef(S.slots[i].id);
  say(`${d.name}${S.slots[i].reversed ? ", reversed" : ""}.`);
  save();
  renderHint();

  if (revealedAll()) setTimeout(() => { el.seal.hidden = false; }, 380);
}

/* ─── the riffle shuffle ───────────────────────────────────────── */

let shuffling = false;

el.readyShuffle.addEventListener("click", async () => {
  if (shuffling) return;
  shuffleInPlace(S.order);
  S.shuffled = true;
  save();

  if (reduceMotion) {
    Sound.shuffle(0.5);
    el.doneShuffle.disabled = false;
    say("Deck shuffled.");
    return;
  }

  /* The recording is the clock. Every phase below is a fraction of the
     clip's real length, so the hands finish squaring up exactly as the
     sound dies — and if the clip is ever swapped for a longer or shorter
     one, the motion follows it without another number being touched. */
  const D = (Sound.shuffleDuration() || 2.4) * 1000;
  const PHASE = { cut: D * 0.30, bridge: D * 0.44, square: D * 0.16, settle: D * 0.10 };

  Sound.shuffle(D / 1000);

  // stay disabled for the length of the riffle — an enabled button that
  // silently does nothing is worse than an obviously waiting one
  shuffling = true;
  el.readyShuffle.disabled = true;
  el.doneShuffle.disabled = true;
  el.deckStack.classList.add("is-shuffling");

  const leaves = [...el.deckStack.children];
  const half = Math.ceil(leaves.length / 2);

  // one leaf, one phase: how long it takes and how late it starts
  const move = (leaf, ms, delay, transform) => {
    leaf.style.transitionDuration = `${Math.round(ms)}ms`;
    leaf.style.transitionDelay = `${Math.round(delay)}ms`;
    leaf.style.transform = transform;
  };

  // 1. cut — the deck splits into two halves that lift and part
  const cutStagger = PHASE.cut * 0.35 / half;
  leaves.forEach((leaf, i) => {
    const left = i < half;
    const n = left ? i : i - half;
    move(leaf, PHASE.cut * 0.65, n * cutStagger,
      `translate(${left ? -96 : 96}px, ${-n * 2.4 - 14}px) rotate(${left ? -9 : 9}deg)`);
  });
  await wait(PHASE.cut);

  // 2. bridge — the halves arch toward each other and zip together one
  //    leaf at a time, alternating side, the way a riffle reads from above
  const zipStagger = PHASE.bridge * 0.55 / half;
  leaves.forEach((leaf, i) => {
    const left = i < half;
    const n = left ? i : i - half;
    leaf.style.zIndex = n * 2 + (left ? 1 : 2);
    move(leaf, PHASE.bridge * 0.45, n * zipStagger,
      `translate(${left ? -16 : 16}px, ${-n * 1.5 - 4}px) rotate(${left ? -1.6 : 1.6}deg)`);
  });
  await wait(PHASE.bridge);

  // 3. square up — tap the edges flat on the table
  leaves.forEach((leaf, i) =>
    move(leaf, PHASE.square * 0.9, 0, `translate(0px, ${-i * 0.4}px) rotate(0deg)`));
  await wait(PHASE.square);

  // 4. settle back into a squared, resting deck
  const settleStagger = PHASE.settle * 0.4 / leaves.length;
  leaves.forEach((leaf, i) => {
    leaf.style.zIndex = i + 1;
    move(leaf, PHASE.settle * 0.7, i * settleStagger, leafRest(leaf));
  });
  await wait(PHASE.settle);

  leaves.forEach(leaf => {
    leaf.style.transitionDelay = "";
    leaf.style.transitionDuration = "";
  });
  el.deckStack.classList.remove("is-shuffling");

  shuffling = false;
  el.readyShuffle.disabled = false;
  el.doneShuffle.disabled = false;
  say("Deck shuffled. Ready when you are.");
});

el.doneShuffle.addEventListener("click", () => {
  if (!S.shuffled || shuffling) return;
  S.stage = "desk";
  render();
});

const wait = ms => new Promise(r => setTimeout(r, ms));

/* ─── the seal → the summary ───────────────────────────────────── */

el.seal.addEventListener("click", () => {
  if (S.summary) return openSummary();
  if (!revealedAll()) return;

  Sound.chime();
  S.summary = Spread.build({
    question: S.question,
    birth: S.birth,
    year: S.year,
    spread: S.spread,
    placed: S.slots.map(s => ({ id: s.id, reversed: s.reversed }))
  });
  S.locked = true;
  save();
  render();
  openSummary();
  say("Your reading is sealed.");
});

function openSummary() {
  el.sumBody.innerHTML = summaryHTML(S.summary);
  $("actDraw").addEventListener("click", () => { closeModal(el.scrimSum); newDraw(); });
  $("actAsk").addEventListener("click", () => { closeModal(el.scrimSum); newDraw(); openAsk(); });
  openModal(el.scrimSum);
}

/* A finished reading is a record, not a cage: it keeps its own cards, but
   the deck is always one click from being yours again. */
function newDraw() {
  S.slots = emptySlots();
  S.summary = null;
  S.locked = false;
  S.order = freshOrder();
  S.shuffled = false;
  S.stage = "shuffle";
  el.seal.hidden = true;
  stopHintCycle();
  el.deckStack.innerHTML = "";   // rebuild the stack for the new deck
  render();
  say("A fresh deck. Shuffle when you are ready.");
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function summaryHTML(r) {
  const meta = [
    r.spreadName || "Three card",
    r.age != null ? `Age ${r.age}` : null,
    r.year ? `${r.year} in focus` : null,
    r.topicLabel
  ].filter(Boolean).join(" · ");

  const verdict = r.verdict
    ? `<p class="sum__verdict"><span>${esc(r.verdict)}</span></p>`
    : "";

  const cards = r.cards.map(c => `
    <article class="sum__card">
      <div>
        <img class="sum__art${c.reversed ? " sum__art--rev" : ""}"
             src="${esc(c.image)}" alt="${esc(c.plain)}">
      </div>
      <div>
        <h3 class="sum__name">${esc(c.name)}</h3>
        <p class="sum__orient">${esc(c.position)} · ${esc(c.role)}</p>
        <ul class="sum__keys">${c.keys.map(k => `<li>${esc(k)}</li>`).join("")}</ul>
        <p class="sum__detail">${esc(c.detail)}</p>
        <div class="sum__grid">
          <div>
            <h4 class="sum__h">${esc(c.lensLabel)}</h4>
            <p class="sum__p">${esc(c.lens)}</p>
          </div>
          <div>
            <h4 class="sum__h">Your takeaway</h4>
            <p class="sum__p">${esc(c.takeaway)}</p>
          </div>
        </div>
      </div>
    </article>`).join("");

  return `
    <p class="sum__q">${esc(r.question)}</p>
    <p class="sum__meta">${esc(meta)}</p>
    ${verdict}
    ${cards}
    <div class="sum__close">
      <div class="sum__grid">
        <div>
          <h4 class="sum__h">Overall</h4>
          <p class="sum__p">${esc(r.overall)}</p>
        </div>
        <div>
          <h4 class="sum__h">Your takeaway</h4>
          <p class="sum__p">${esc(r.takeaway)}</p>
          <h4 class="sum__h" style="margin-top:22px">Ask Yourself</h4>
          <p class="sum__p">${esc(r.ask)}</p>
        </div>
      </div>
    </div>
    <div class="sum__after">
      <p class="sum__locked">
        This reading is finished — its cards stay as they fell. Where next?
      </p>
      <div class="sum__acts">
        <button class="slab" id="actDraw" type="button">Draw new cards</button>
        <button class="slab" id="actAsk" type="button">Ask a new question</button>
      </div>
    </div>`;
}

/* ─── modals ───────────────────────────────────────────────────── */

let lastFocus = null;

function openModal(scrim) {
  lastFocus = document.activeElement;
  scrim.hidden = false;
  document.body.style.overflow = "hidden";   // keep the wheel inside the modal
  scrim.scrollTop = 0;                       // always open at the top

  /* Focus a text field if the modal is asking for one — but never a button.
     The summary's first button is "Draw new cards" at the very bottom, and
     focusing it scrolled the reading out from under the reader before they
     had seen a word of it. With no field, the dialog itself takes focus. */
  const field = scrim.querySelector("input:not([type=radio]), textarea");
  const dialog = scrim.querySelector(".modal");
  (field || dialog).focus({ preventScroll: true });
}

function closeModal(scrim) {
  scrim.hidden = true;
  if (!document.querySelector(".scrim:not([hidden])")) document.body.style.overflow = "";
  lastFocus?.focus?.();
}

/* Every modal closes. The intake used to be sealed until a question
   existed — that made sense when it opened itself on load, but it now
   opens from "Start your reading", and a door you chose to open has to
   be a door you can shut. Backing out just leaves you on the homepage. */
document.addEventListener("click", e => {
  const id = e.target.dataset?.close;
  if (id) closeModal($(id));
});

document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const open = [...document.querySelectorAll(".scrim:not([hidden])")].pop();
  if (open) closeModal(open);
});

// clicking the dark ground outside a modal closes it too
document.addEventListener("mousedown", e => {
  if (!e.target.classList?.contains("scrim")) return;
  const scrim = e.target;
  const up = ev => {
    document.removeEventListener("mouseup", up);
    if (ev.target === scrim) closeModal(scrim);   // ignore drags that end outside
  };
  document.addEventListener("mouseup", up);
});

// keep focus inside an open modal
document.addEventListener("keydown", e => {
  if (e.key !== "Tab") return;
  const open = [...document.querySelectorAll(".scrim:not([hidden])")].pop();
  if (!open) return;
  const f = [...open.querySelectorAll("button, input, [href], textarea")]
    .filter(n => !n.disabled && n.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

/* ─── intake ───────────────────────────────────────────────────── */

el.rename.addEventListener("click", () => openAsk());
el.renameInline.addEventListener("click", () => openAsk());

function renderSpreadPick(host, active, name) {
  host.innerHTML = Spread.ORDER.map(id => {
    const s = Spread.SPREADS[id];
    return `<label class="spread${id === active ? " is-on" : ""}">
      <input type="radio" name="${name}" value="${id}"${id === active ? " checked" : ""}>
      <span class="spread__n">${s.name}</span>
      <span class="spread__b">${s.blurb}</span>
      <span class="spread__c">${s.count} card${s.count > 1 ? "s" : ""}</span>
    </label>`;
  }).join("");
}

el.spreadPick.addEventListener("change", e => {
  if (e.target.name !== "spread") return;
  [...el.spreadPick.children].forEach(l =>
    l.classList.toggle("is-on", l.querySelector("input").checked));
});

function openAsk() {
  // the spread is only chosen here on a first ask — after that it belongs
  // to "Change deck", and repeating it in this modal is a second front door
  const firstAsk = !S.question;
  el.spreadsField.hidden = !firstAsk;
  if (firstAsk) renderSpreadPick(el.spreadPick, S.spread, "spread");
  el.fQuestion.value = S.question || "";
  el.fBirth.value = S.birth || "";
  el.fYear.value = S.year || new Date().getFullYear();
  ["eQuestion", "eBirth", "eYear"].forEach(k => { el[k].textContent = ""; });
  [...el.askForm.querySelectorAll(".field")].forEach(f => f.classList.remove("is-bad"));
  openModal(el.scrimAsk);
}

el.askForm.addEventListener("submit", e => {
  e.preventDefault();
  const q = el.fQuestion.value.trim();
  const b = el.fBirth.value;
  const y = parseInt(el.fYear.value, 10);
  const thisYear = new Date().getFullYear();

  let ok = true;
  ok = mark("Question", q.length >= 10, "Give the cards a full question — at least 10 characters.") && ok;
  ok = mark("Birth", !!b && new Date(b) < new Date() && new Date(b).getFullYear() > 1900,
            "Enter a valid birth date.") && ok;
  ok = mark("Year", Number.isFinite(y) && y >= thisYear - 100 && y <= thisYear + 100,
            "Enter a year worth asking about.") && ok;
  if (!ok) return;

  const chosen = el.askForm.querySelector('input[name="spread"]:checked');
  const nextSpread = chosen ? chosen.value : S.spread;
  const first = !S.question;
  const spreadChanged = nextSpread !== S.spread;

  S.question = q; S.birth = b; S.year = y; S.spread = nextSpread;

  // changing the layout mid-reading would leave orphaned cards in slots that
  // no longer exist; and a new question deserves a new draw rather than the
  // last reading's cards sitting under it
  if (spreadChanged || first || S.locked) {
    S.slots = emptySlots();
    S.summary = null;
    S.locked = false;
    el.seal.hidden = true;
  }

  closeModal(el.scrimAsk);
  if (first) S.stage = "shuffle";
  Sound.startMusic();
  render();
  if (spreadChanged && !first) say(`Switched to the ${shape().name.toLowerCase()} spread.`);
});

function mark(name, pass, msg) {
  const input = el["f" + name], err = el["e" + name];
  input.closest(".field").classList.toggle("is-bad", !pass);
  err.textContent = pass ? "" : msg;
  return pass;
}

/* ─── change deck: which spread is on the table ────────────────── */

el.deckBtn.addEventListener("click", () => {
  renderSpreadPick(el.deckPick, S.spread, "deckspread");
  openModal(el.scrimDeck);
});

el.deckPick.addEventListener("change", e => {
  if (e.target.name !== "deckspread") return;
  const next = e.target.value;
  renderSpreadPick(el.deckPick, next, "deckspread");
  if (next === S.spread) return;

  // a different spread means a different number of slots, so any cards
  // already on the desk go back to the deck rather than being orphaned
  S.spread = next;
  S.slots = emptySlots();
  S.summary = null;
  S.locked = false;
  el.seal.hidden = true;
  if (S.stage === "desk") stopHintCycle();
  render();
  say(`${shape().name} spread. The desk is clear.`);
});

el.start.addEventListener("click", () => openAsk());

/* ─── clean up / restart ───────────────────────────────────────── */

el.cleanUp.addEventListener("click", () => { wipeMode = "clean";   openModal(el.scrimWipe); });
el.restart.addEventListener("click", () => { wipeMode = "restart"; openModal(el.scrimWipe); });

el.wipeYes.addEventListener("click", () => {
  closeModal(el.scrimWipe);
  S.slots = emptySlots();
  S.summary = null;
  S.locked = false;
  el.seal.hidden = true;

  if (wipeMode === "restart") {
    S.question = ""; S.birth = ""; S.year = null;
    S.order = freshOrder();
    S.shuffled = false;
    S.stage = "intro";          // all the way back to the door
    Sound.stopMusic();
    render();
  } else {
    render();
  }
  say(wipeMode === "restart" ? "The room is reset." : "Cards returned to the deck.");
});

/* ─── misc ─────────────────────────────────────────────────────── */

function say(msg) { el.live.textContent = msg; }

let rt;
addEventListener("resize", () => {
  clearTimeout(rt);
  rt = setTimeout(() => { if (S.stage === "desk") renderFan(); }, 140);
});

/* ─── boot ─────────────────────────────────────────────────────── */

if (!load()) {
  // a first visitor meets the room, not a form — the modal comes on "Start"
  S.order = freshOrder();
  S.stage = "intro";
  render();
} else {
  if (!S.order?.length) S.order = freshOrder();
  if (!Spread.SPREADS[S.spread]) S.spread = "three";
  if (S.stage === "intro" && S.question) S.stage = "shuffle";
  // a save written before this spread existed (or under another one) can
  // carry the wrong number of slots — rebuild rather than render a mismatch
  if (S.slots.length !== shape().count) {
    S.slots = emptySlots();
    S.summary = null;
    S.locked = false;
  }
  render();
  if (S.summary) el.seal.hidden = false;
}

})();
