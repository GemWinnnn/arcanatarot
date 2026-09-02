/* ---------------------------------------------------------------
   Spread — turns three placed cards into one locked reading.

   The single-card Oracle answers "what does this card say". This
   answers "what do these three say together", which is a different
   job: each card is read through its POSITION, and then the three
   are woven into one close.

   Everything here is deterministic. The reading is generated once,
   frozen, and persisted — so a reload gives back the same words
   rather than a fresh improvisation.
   --------------------------------------------------------------- */

const Spread = (() => {

  /* ------------------------------------------------------ spreads */

  const SPREADS = {
    three: {
      id: "three", name: "Three card", count: 3,
      blurb: "Persona, obstacle, solution",
      positions: [
        { label: "Persona",  role: "who you are inside this question right now" },
        { label: "Obstacle", role: "what is standing between you and the answer" },
        { label: "Solution", role: "what you are being invited to do next" }
      ]
    },
    one: {
      id: "one", name: "One card", count: 1,
      blurb: "A single, direct answer",
      positions: [
        { label: "The answer", role: "the whole of it, in one card" }
      ]
    },
    yesno: {
      id: "yesno", name: "Yes or no", count: 1,
      blurb: "A verdict, with its reasoning",
      positions: [
        { label: "The verdict", role: "which way the deck falls, and why" }
      ]
    },
    daily: {
      id: "daily", name: "Daily tarot", count: 1,
      blurb: "What today is asking of you",
      positions: [
        { label: "Today", role: "the shape of the day in front of you" }
      ]
    }
  };

  const ORDER = ["three", "one", "yesno", "daily"];

  const POSITIONS = SPREADS.three.positions;

  /* Closing prose is topic-shaped: the same three cards should land
     differently on a question about money than one about love. */
  const CLOSERS = {
    love: {
      pivot:  ["performing and start being seen", "managing the feeling and start naming it"],
      ask:    "What would you say to them if you were certain it could not be held against you?"
    },
    work: {
      pivot:  ["proving and start receiving", "pushing harder and start asking plainly"],
      ask:    "What would you do differently if you genuinely believed the right opportunity was already on its way?"
    },
    money: {
      pivot:  ["bracing and start planning", "guarding the number and start using it"],
      ask:    "What does 'enough' actually look like, in figures, written down?"
    },
    growth: {
      pivot:  ["fixing yourself and start tending to yourself", "waiting to feel ready and start moving anyway"],
      ask:    "What would change if you stopped treating this as a flaw to correct and started treating it as information?"
    },
    choice: {
      pivot:  ["gathering more evidence and start choosing", "hedging and start committing"],
      ask:    "If both doors closed tomorrow, which one would you grieve?"
    },
    open: {
      pivot:  ["holding on so tightly and start letting the answer arrive", "explaining and start listening"],
      ask:    "What have you already decided, underneath the asking?"
    }
  };

  /* A stable pick — same cards, same question, same words, forever. */
  function seedOf(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  function pick(list, seed) { return list[seed % list.length]; }

  function byId(id) { return DECK.find(c => c.id === id); }

  function ageFrom(birthISO, onDate) {
    const b = new Date(birthISO);
    const d = onDate ? new Date(onDate) : new Date();
    if (isNaN(b)) return null;
    let a = d.getFullYear() - b.getFullYear();
    const m = d.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && d.getDate() < b.getDate())) a--;
    return a >= 0 && a < 130 ? a : null;
  }

  /* Trim a line into a single clause that can sit mid-sentence.
     Whispers are often two sentences ("Step. The ground arrives underfoot.")
     and splicing both in whole produces run-ons — so take the meatiest
     sentence and lowercase its opening. */
  function clause(text) {
    const best = String(text)
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)[0] || String(text);
    return best.replace(/[.!?]+$/, "").replace(/^[A-Z]/, c => c.toLowerCase());
  }

  /* clause() lowercases so a fragment can be spliced mid-sentence; when the
     fragment has to OPEN a sentence instead, put the capital back */
  function cap(text) {
    return String(text).replace(/^[a-z]/, c => c.toUpperCase());
  }

  /* ------------------------------------------------------- build */

  function build({ question, birth, year, placed, spread }) {
    const shape = SPREADS[spread] || SPREADS.three;

    // detectTopic returns { topic, score, confident } — not a bare key
    const detected = Oracle.detectTopic(question);
    const topicKey = (detected && detected.confident && detected.topic) || "open";
    const topic    = Oracle.TOPICS[topicKey] || Oracle.TOPICS.open;
    const closer   = CLOSERS[topicKey] || CLOSERS.open;
    const age      = ageFrom(birth);
    const seed     = seedOf(question + "|" + placed.map(p => p.id + p.reversed).join("|"));

    const cards = placed.map((p, i) => {
      const def  = byId(p.id);
      const side = p.reversed ? def.rev : def.up;
      const pos  = shape.positions[i] || shape.positions[shape.positions.length - 1];

      return {
        id:        def.id,
        name:      def.name + (p.reversed ? " Reversed" : ""),
        plain:     def.name,
        numeral:   def.numeral,
        image:     "assets/cards/" + def.id + ".png",
        reversed:  p.reversed,
        orient:    p.reversed ? "Reversed" : "Upright",
        position:  pos.label,
        role:      pos.role,
        keys:      side.keys.slice(0, 3),
        detail:    side.body,
        lensLabel: topic.label,
        lens:      def.lens[topicKey] || def.lens.growth,
        takeaway:  side.whisper
      };
    });

    const [a, b, c] = cards;
    const when  = year ? `Across ${year}` : "Right now";
    const who   = age != null ? `, at ${age},` : "";
    const pivot = pick(closer.pivot, seed);

    let overall, takeaway, verdict = null;

    if (shape.count === 3) {
      /* three cards read as one movement */
      overall =
        `${when}${who} the spread opens on ${a.name} — ${clause(a.takeaway)}. ` +
        `${b.name} is what sits in the way: ${clause(b.takeaway)}. ` +
        `And ${c.name} is the door out — ${clause(c.takeaway)}. ` +
        `Read end to end, the cards are less interested in whether the answer is yes than in ` +
        `whether you are still holding the question the same way you were when you first asked it.`;

      // the tail comes from the solution card's topic lens, not its whisper —
      // the whisper has already been spent in the Overall
      takeaway =
        `Stop ${pivot}. ${a.name} and ${c.name} together suggest the real turning point is not more ` +
        `effort but a change of grip — ${clause(c.lens)}.`;

    } else if (shape.id === "yesno") {
      /* one card, and it has to actually commit to an answer */
      const yes = !a.reversed;
      verdict = yes ? "Yes" : "No";
      overall =
        `${a.plain} came up ${a.orient.toLowerCase()}, and that is the whole answer: ` +
        `${yes ? "yes" : "no"}. ${a.detail} ` +
        `${when}${who} that reads as ${yes
          ? "a green light you are allowed to take at your own pace"
          : "a no that is closer to “not like this” than to “never”"}.`;
      takeaway =
        `${verdict} — but stop ${pivot}. ${cap(clause(a.lens))}.`;

    } else if (shape.id === "daily") {
      overall =
        `Today arrives as ${a.name}. ${a.detail} ` +
        `Held against ${year || "the year"}${who ? " and where you are in it" : ""}, ` +
        `this is less a forecast than a posture — the way to stand while the day happens to you.`;
      takeaway = `${a.takeaway} Stop ${pivot}.`;

    } else {
      /* a single, direct read */
      overall =
        `${when}${who} the deck answers with one card and does not hedge: ${a.name}. ` +
        `${a.detail} There is no second card to soften it, which is usually the point.`;
      takeaway = `Stop ${pivot}. ${cap(clause(a.lens))}.`;
    }

    return {
      version:  2,
      at:       new Date().toISOString(),
      question, birth, year, age,
      spread:     shape.id,
      spreadName: shape.name,
      topicKey,
      topicLabel: topic.label,
      verdict,
      cards,
      overall,
      takeaway,
      ask: closer.ask
    };
  }

  return { build, SPREADS, ORDER, POSITIONS };
})();
