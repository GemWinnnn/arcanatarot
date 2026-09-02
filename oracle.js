/* ---------------------------------------------------------------
   Oracle — turns a typed intention into a reading for a drawn card.

   A reading is (card × orientation × topic). Phrasing is picked at
   random, so the same question would otherwise come back worded
   differently every time. Readings are therefore cached in
   localStorage: ask about love with The Moon twice and the cards
   give you the same answer back, instantly.
   --------------------------------------------------------------- */

const Oracle = (() => {

  /* ------------------------------------------------------- topics */

  const TOPICS = {
    love:   { label: "Love & relationships", opener: "On the matter of the heart" },
    work:   { label: "Work & opportunity",   opener: "On work and what is opening" },
    money:  { label: "Money & security",     opener: "On money and what it is holding up" },
    growth: { label: "Self & healing",       opener: "On the state of you" },
    choice: { label: "A decision",           opener: "On the choice in front of you" },
    open:   { label: "An open question",     opener: "On the question as you asked it" }
  };

  /* Domain words score 1. Decision words score 0.5, because "should I"
     shows up in almost every question and should not outvote a subject. */
  const SIGNALS = [
    ["love", 1, ["love","loves","loving","relationship","relationships","partner","boyfriend","girlfriend","husband","wife","spouse","fiance","fiancee","crush","dating","date","romance","romantic","soulmate","marriage","marry","married","breakup","break up","broke up","ex","situationship","affection","intimacy","heartbreak","commitment","commit","propose","flirt","attracted","feelings for","fall for","fell for","together again","reconcile","the one","is he","is she","does he","does she","do they","will he","will she","my person","get back together","meet someone","find someone","single"]],
    ["work", 1, ["job","jobs","work","working","career","boss","manager","promotion","promoted","interview","resign","resigning","quit","quitting","fired","laid off","hired","hiring","employer","company","business","startup","project","client","clients","colleague","coworker","office","role","position","application","applying","freelance","contract","opportunity","opportunities","offer","offers","prospect","school","study","studying","exam","exams","degree","thesis","graduate","internship"]],
    ["money", 1, ["money","finance","financial","finances","salary","pay","raise","debt","debts","loan","loans","invest","investing","investment","savings","save","saving","budget","afford","rent","mortgage","income","cash","expensive","price","bills","broke","wealth","rich","poor","spending","spend"]],
    ["growth", 1, ["myself","my self","self","growth","grow","heal","healing","anxiety","anxious","depressed","depression","mental","therapy","purpose","meaning","spiritual","spirit","stuck","confidence","confident","worth","worthy","health","healthy","body","sleep","energy","tired","exhausted","burnout","burnt out","peace","happy","happiness","lonely","loneliness","forgive","forgiveness","identity","who am i","what am i","my life","my path","becoming"]],
    ["choice", 0.5, ["should i","should we","or should","decide","deciding","decision","choose","choosing","choice","which one","whether","move on","leave","stay","go or","take it","accept","reject","say yes","say no","worth it","right thing"]]
  ];

  function detectTopic(text) {
    const q = " " + text.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, " ").replace(/\s+/g, " ") + " ";
    const score = { love: 0, work: 0, money: 0, growth: 0, choice: 0 };

    for (const [topic, weight, words] of SIGNALS) {
      for (const w of words) {
        // whole-word / phrase match so "ex" does not fire inside "expensive"
        if (q.includes(" " + w + " ") || q.includes(" " + w + "'") ||
            q.includes(" " + w + "s ") || q.includes(" " + w + ",")) {
          score[topic] += weight;
        }
      }
    }

    let best = "open", bestScore = 0;
    for (const t of ["love", "work", "money", "growth", "choice"]) {
      if (score[t] > bestScore) { best = t; bestScore = score[t]; }
    }
    return { topic: best, score, confident: bestScore >= 1 };
  }

  /* ---------------------------------------------------- composition */

  const UPRIGHT_FRAMES = [
    "Read it straight:",
    "Upright, the card answers plainly:",
    "Taken at face value:",
    "The card does not hedge here:"
  ];

  const REVERSED_FRAMES = [
    "Reversed, take this as what is being asked of you rather than what is already here:",
    "Turned over, the same energy arrives in its unmet form:",
    "Reversed, the card points at the blockage rather than the gift:",
    "Inverted, read this as the thing to reach for, not the thing you hold:"
  ];

  const CLOSERS = {
    love:   ["Ask it of the person, not of the cards.", "Say it while it is still true.", "Love answers to honesty faster than to strategy."],
    work:   ["Do the next unglamorous piece of it.", "Ambition likes a specific verb.", "Put a date on it and it becomes real."],
    money:  ["Look at the actual number before you feel about it.", "Security is built slowly or not at all.", "Spend the way you would advise a friend to."],
    growth: ["Be as patient with yourself as you would be with anyone else.", "The change is already underway.", "Nothing here needs to be fixed by tonight."],
    choice: ["Choose, then stop relitigating it.", "The wrong decision made wholly beats the right one made halfway.", "You are allowed to change your mind later."],
    open:   ["Sit with it before you act on it.", "The question will sharpen with time.", "Ask again when you know what you are really asking."]
  };

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function compose(card, reversed, topic, question) {
    const frame = reversed ? pick(REVERSED_FRAMES) : pick(UPRIGHT_FRAMES);
    const lens = topic === "open" ? null : card.lens[topic];
    const face = reversed ? card.rev : card.up;

    return {
      cardId: card.id,
      name: card.name,
      numeral: card.numeral,
      reversed,
      topic,
      topicLabel: TOPICS[topic].label,
      opener: TOPICS[topic].opener,
      keys: face.keys,
      lens: lens ? `${frame} ${lens}` : null,
      body: face.body,
      whisper: face.whisper,
      closer: pick(CLOSERS[topic]),
      question,
      at: Date.now()
    };
  }

  /* --------------------------------------------------------- cache */

  const CACHE_KEY = "arcana.readings.v1";
  const MAX_ENTRIES = 240;

  function readCache() {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function writeCache(store) {
    try {
      const keys = Object.keys(store);
      if (keys.length > MAX_ENTRIES) {
        keys.sort((a, b) => store[a].at - store[b].at)
            .slice(0, keys.length - MAX_ENTRIES)
            .forEach(k => delete store[k]);
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(store));
    } catch (e) {
      /* private mode, or the quota is full — the reading still works */
    }
  }

  const cacheKey = (cardId, reversed, topic) =>
    `${cardId}|${reversed ? "rev" : "up"}|${topic}`;

  /* ---------------------------------------------------------- api */

  /* Returns { reading, cached, askedBefore } — cached readings come back
     verbatim, including the phrasing chosen the first time. */
  function consult(card, reversed, question) {
    const { topic, confident } = detectTopic(question);
    const store = readCache();
    const key = cacheKey(card.id, reversed, topic);
    const hit = store[key];

    if (hit) {
      hit.hits = (hit.hits || 1) + 1;
      hit.lastAt = Date.now();
      hit.question = question;          // newest phrasing of the same question
      writeCache(store);
      return { reading: hit, cached: true, confident, askedBefore: hit.firstQuestion };
    }

    const reading = compose(card, reversed, topic, question);
    reading.firstQuestion = question;
    reading.hits = 1;
    reading.lastAt = reading.at;
    store[key] = reading;
    writeCache(store);
    return { reading, cached: false, confident, askedBefore: null };
  }

  function stats() {
    const store = readCache();
    const keys = Object.keys(store);
    return { entries: keys.length, hits: keys.reduce((n, k) => n + (store[k].hits || 1), 0) };
  }

  function forget() {
    try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
  }

  return { consult, detectTopic, stats, forget, TOPICS };
})();
