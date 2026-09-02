/* ---------------------------------------------------------------
   Critters Tarot — shuffle, fan, and a single-card reading.
   One card per reading: once a card is chosen the fan is locked.
   --------------------------------------------------------------- */

const scene    = document.getElementById("scene");
const deckEl   = document.getElementById("deck");
const actionBtn = document.getElementById("action");
const againBtn = document.getElementById("again");
const subtitle = document.getElementById("subtitle");

const readingEl      = document.getElementById("reading");
const plateEl        = document.getElementById("plate");
const plateMount     = document.getElementById("plateMount");
const glowEl         = document.getElementById("glow");
const readingName    = document.getElementById("readingName");
const readingOrient  = document.getElementById("readingOrient");
const readingKeys    = document.getElementById("readingKeys");
const readingLens    = document.getElementById("readingLens");
const readingBody    = document.getElementById("readingBody");
const readingWhisper = document.getElementById("readingWhisper");
const readingCloser  = document.getElementById("readingCloser");

const intentForm   = document.getElementById("intentForm");
const intentInput  = document.getElementById("intentInput");
const intentQuick  = document.getElementById("intentQuick");
const answerAsked  = document.getElementById("answerAsked");
const answerTopic  = document.getElementById("answerTopic");
const answerRecall = document.getElementById("answerRecalled");
const cacheNote    = document.getElementById("cacheNote");
const thinkingLead = document.getElementById("thinkingLead");
const askAgainBtn  = document.getElementById("askAgain");

const isMobile = () => window.matchMedia("(max-width: 700px)").matches;

/* How many face-down cards go on the table. On a phone a 22-card fan
   collapses into unsplittable slivers, so we lay out fewer positions and
   deal them from the same shuffled deck. */
const layoutCount = () => (isMobile() ? 9 : DECK.length);

let N = layoutCount();
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let cards = [];        // DOM wrappers
let assignment = [];   // card element index -> DECK index
let phase = "idle";    // idle | shuffling | fanned | reading
let drawn = null;

/* --------------------------------------------------------- helpers */

const wait = ms => new Promise(r => setTimeout(r, REDUCED ? Math.min(ms, 30) : ms));
const rand = (a, b) => a + Math.random() * (b - a);

// per-card jitter so the resting stack never looks machine-made
const jitter = Array.from({ length: DECK.length }, () => ({
  x: rand(-2.2, 2.2), y: rand(-1.2, 1.2), r: rand(-1.6, 1.6)
}));

function setTF(el, tf, dur = 0.5, delay = 0) {
  el.style.setProperty("--dur", dur + "s");
  el.style.setProperty("--delay", delay + "s");
  el.style.setProperty("--tf", tf);
}

/* ------------------------------------------------------- positions */

const ARC_R = () => (isMobile() ? 520 : 1250);
const SPREAD = () => (isMobile() ? 46 : 56);
const CURVE = 0.55;   // flattens the arc so the fan reads as a row

function stackTF(i) {
  const j = jitter[i];
  return `translate(${j.x}px, ${-i * 0.85 + j.y}px) rotate(${j.r}deg)`;
}

function splitTF(i) {
  const side = i % 2 ? 1 : -1;
  const k = Math.floor(i / 2);
  return `translate(${side * 138}px, ${-k * 1.6}px) rotate(${side * 7}deg)`;
}

function cutTF(i) {
  return i >= N / 2
    ? `translate(96px, ${-72 - (i - N / 2) * 1.2}px) rotate(5deg)`
    : `translate(-16px, ${-i * 0.9}px) rotate(-1.5deg)`;
}

function fanAngle(i) {
  const spread = SPREAD();
  return -spread / 2 + (spread * i) / (N - 1);
}

function fanTF(i) {
  const a = fanAngle(i);
  const rad = (a * Math.PI) / 180;
  const x = ARC_R() * Math.sin(rad);
  const y = ARC_R() * (1 - Math.cos(rad)) * CURVE;
  return `translate(${x}px, ${y - 34}px) rotate(${a}deg)`;
}

/* Where the card comes to rest: dead centre of the plate's mount.
   The plate never transforms, so this measurement is valid at any
   point in its fade-in. */
function drawnGeom() {
  const mount = plateMount.getBoundingClientRect();
  const origin = deckEl.getBoundingClientRect();   // 0×0 element: its own origin
  if (!mount.width) return null;

  // the deck is itself scaled, so viewport deltas convert to local units
  const fs = parseFloat(deckEl.style.getPropertyValue("--fan-scale")) || 1;
  const cardW = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--card-w"));

  return {
    scale: mount.width / cardW / fs,
    dx: (mount.left + mount.width / 2 - origin.left) / fs,
    dy: (mount.top + mount.height / 2 - origin.top) / fs,
    fs
  };
}

function drawnTF() {
  const g = drawnGeom();
  if (!g) return "translate(0px, 0px) scale(1.6)";
  return `translate(${g.dx}px, ${g.dy}px) rotate(0deg) scale(${g.scale})`;
}

/* the halo belongs to the card, so it travels with it into the mount */
function seatGlow() {
  const g = drawnGeom();
  if (!g) return;
  glowEl.style.transform = `translate(${g.dx}px, ${g.dy}px) scale(${g.scale * 1.35})`;
}

function dismissTF(i) {
  const a = fanAngle(i);
  return `translate(${a * 9}px, 340px) rotate(${a * 1.4}deg)`;
}

/* Scale the fan so it always clears the curtains at the edges. */
function fitFan() {
  const fanWidth = 2 * ARC_R() * Math.sin((SPREAD() / 2) * Math.PI / 180) + 170;
  const avail = window.innerWidth * (isMobile() ? 0.88 : 0.74);
  const byHeight = (window.innerHeight * (isMobile() ? 0.34 : 0.42)) / 247;
  const fan = Math.max(0.34, Math.min(1, avail / fanWidth, byHeight));
  // at rest the deck is a single object and can hold the room; the fan
  // needs the room back, so the spread zooms out as it opens
  const rest = Math.min(1.45, byHeight * 1.15);
  deckEl.style.setProperty("--fan-scale", (phase === "idle" ? rest : fan).toFixed(3));
}

/* ------------------------------------------------------ card build */

function buildDeck() {
  deckEl.innerHTML = "";
  cards = [];
  for (let i = 0; i < N; i++) {
    const el = document.createElement("div");
    el.className = "card";
    el.style.zIndex = i;
    el.tabIndex = -1;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Face-down card ${i + 1} of ${N}`);
    el.innerHTML =
      '<div class="card__lift"><div class="card__inner">' +
      '<div class="card__face card__face--back"></div>' +
      '<div class="card__face card__face--front"><div class="card__art"></div></div>' +
      '</div></div>';
    setTF(el, stackTF(i), 0.5);
    el.addEventListener("click", () => choose(i));
    el.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(i); }
    });
    deckEl.appendChild(el);
    cards.push(el);
  }
}

/* Deal a fresh random face to every card, plus its orientation. */
function reassign() {
  const order = DECK.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  assignment = order.slice(0, N).map(idx => ({ idx, reversed: Math.random() < 0.3 }));

  cards.forEach((el, i) => {
    const { idx, reversed } = assignment[i];
    const front = el.querySelector(".card__face--front");
    const art = el.querySelector(".card__art");
    art.style.backgroundImage = `url("assets/cards/${DECK[idx].id}.png")`;
    front.style.transform = `rotateY(180deg)${reversed ? " rotate(180deg)" : ""}`;
  });
}

/* -------------------------------------------------------- shuffling */

async function shuffle() {
  if (phase === "shuffling") return;
  phase = "shuffling";
  scene.classList.remove("is-fanned", "is-reading");
  scene.classList.add("is-shuffling");
  actionBtn.disabled = true;
  subtitle.textContent = "Shuffling…";
  fitFan();

  for (let round = 0; round < 3; round++) {
    cards.forEach((el, i) => setTF(el, splitTF(i), 0.34));
    await wait(370);
    cards.forEach((el, i) => setTF(el, stackTF(i), 0.3, (i % 2 ? i : N - i) * 0.008));
    await wait(430);
  }

  cards.forEach((el, i) => setTF(el, cutTF(i), 0.38));
  await wait(430);
  cards.forEach((el, i) => setTF(el, stackTF(i), 0.32, i * 0.006));
  await wait(360);

  reassign();
  fanOut();
}

function fanOut() {
  phase = "fanned";
  fitFan();
  cards.forEach((el, i) => {
    el.classList.remove("is-dismissed", "is-chosen");
    el.tabIndex = 0;
    setTF(el, fanTF(i), 0.62, i * 0.022);
  });
  scene.classList.remove("is-shuffling");
  scene.classList.add("is-fanned");
  subtitle.textContent = "One card only — take the one that pulls at you.";
  actionBtn.textContent = "Shuffle again";
  actionBtn.disabled = false;
}

/* ---------------------------------------------------------- drawing */

function choose(i) {
  if (phase !== "fanned") return;      // exactly one card per reading
  phase = "reading";
  drawn = assignment[i];

  scene.classList.remove("is-fanned");
  scene.classList.add("is-reading");
  fitFan();

  cards.forEach((el, k) => {
    el.tabIndex = -1;
    if (k === i) return;
    el.classList.add("is-dismissed");
    setTF(el, dismissTF(k), 0.55, Math.abs(k - i) * 0.012);
  });

  const el = cards[i];
  el.style.zIndex = 60;
  setTF(el, drawnTF(), 0.9);
  seatGlow();
  setTimeout(() => el.classList.add("is-chosen"), REDUCED ? 20 : 420);

  renderCard(drawn);
}

/* The card is named as soon as it turns over; what it *means* waits
   for the querent to say what they came to ask. */
function renderCard({ idx, reversed }) {
  const card = DECK[idx];
  readingName.textContent = card.name;
  readingOrient.textContent = `${card.numeral} · ${reversed ? "Reversed" : "Upright"}`;
  readingEl.dataset.step = "ask";
  intentInput.value = "";
  requestAnimationFrame(reseat);
  setTimeout(() => intentInput.focus({ preventScroll: true }), 1400);
}

const QUICK = [
  ["Love", "What do I need to know about my relationship?"],
  ["Work", "Should I take the opportunity in front of me?"],
  ["Money", "What should I do about my finances?"],
  ["Myself", "What am I not seeing about myself right now?"]
];

QUICK.forEach(([label, question]) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip";
  b.textContent = label;
  b.addEventListener("click", () => {
    intentInput.value = question;
    intentInput.focus();
  });
  intentQuick.appendChild(b);
});

async function ask(question) {
  const { topic } = Oracle.detectTopic(question);
  thinkingLead.textContent = `${Oracle.TOPICS[topic].opener} — the cards are considering`;
  readingEl.dataset.step = "wait";

  const { idx, reversed } = drawn;
  const result = Oracle.consult(DECK[idx], reversed, question);

  // A remembered reading comes back at once; a new one is deliberated over.
  await wait(result.cached ? 260 : 1150);

  renderAnswer(question, result);
  readingEl.dataset.step = "answer";
  requestAnimationFrame(reseat);
}

function renderAnswer(question, { reading, cached, askedBefore }) {
  answerAsked.textContent = `“${question}”`;
  answerTopic.textContent = reading.topicLabel;

  answerRecall.hidden = !cached;
  readingKeys.innerHTML = reading.keys.map(k => `<li>${k}</li>`).join("");
  readingLens.textContent = reading.lens || "";
  readingLens.hidden = !reading.lens;
  readingBody.textContent = reading.body;
  readingWhisper.textContent = reading.whisper;
  readingCloser.textContent = reading.closer;

  const { entries } = Oracle.stats();
  if (cached) {
    cacheNote.innerHTML =
      `The cards have answered this before — you asked “${escapeHtml(trim(askedBefore))}”. ` +
      `They do not change their minds. <button type="button" id="forget">Forget remembered readings</button>`;
  } else {
    cacheNote.innerHTML = entries > 1
      ? `Remembered, alongside ${entries - 1} earlier reading${entries === 2 ? "" : "s"}. ` +
        `<button type="button" id="forget">Forget remembered readings</button>`
      : "";
  }
  const forgetBtn = document.getElementById("forget");
  if (forgetBtn) forgetBtn.addEventListener("click", () => {
    Oracle.forget();
    cacheNote.textContent = "Forgotten. The next question starts fresh.";
  });
}

const trim = t => (t && t.length > 64 ? t.slice(0, 61) + "…" : t || "");
const escapeHtml = t => t.replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ----------------------------------------------------------- reset */

async function reset() {
  if (phase !== "reading") return;
  const chosen = cards.find(c => c.classList.contains("is-chosen"));
  scene.classList.remove("is-reading");
  if (chosen) chosen.classList.remove("is-chosen");
  phase = "idle";
  fitFan();

  cards.forEach((el, i) => {
    el.classList.remove("is-dismissed");
    el.style.zIndex = i;
    setTF(el, stackTF(i), 0.6, i * 0.008);
  });

  subtitle.textContent = "Hold your question in mind, then shuffle the deck.";
  readingEl.dataset.step = "ask";
  actionBtn.disabled = false;
  await wait(700);
  shuffle();
}

/* ------------------------------------------------------------ wire */

buildDeck();
reassign();
fitFan();

intentForm.addEventListener("submit", e => {
  e.preventDefault();
  const q = intentInput.value.trim();
  if (q.length < 2) { intentInput.focus(); return; }
  ask(q);
});

askAgainBtn.addEventListener("click", () => {
  readingEl.dataset.step = "ask";
  intentInput.value = "";
  intentInput.focus();
});

actionBtn.addEventListener("click", shuffle);
againBtn.addEventListener("click", reset);
/* The plate grows and shrinks as the reading unfolds; the mounted card
   follows its aperture rather than drifting off it. */
function reseat() {
  if (phase !== "reading") return;
  const chosen = cards.find(c => c.classList.contains("is-chosen"));
  if (chosen) setTF(chosen, drawnTF(), 0.35);
  seatGlow();
}

if (window.ResizeObserver) {
  new ResizeObserver(() => requestAnimationFrame(reseat))
    .observe(document.querySelector(".plate__frame"));
}

window.addEventListener("resize", () => {
  if (layoutCount() !== N && phase !== "reading") {
    N = layoutCount();
    buildDeck();
    reassign();
    if (phase === "fanned") fanOut();
  }
  fitFan();
  if (phase === "fanned") cards.forEach((el, i) => setTF(el, fanTF(i), 0.3));
  reseat();
});
