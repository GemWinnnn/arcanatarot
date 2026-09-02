/* ---------------------------------------------------------------
   Sound — the room's voice.

   The riffle, the card-place and the flip are recordings (assets/*.ogg);
   the flip file holds several takes and is sliced per use. Everything
   else is synthesised with the Web Audio API.

   Card sounds are noise shaped by filters (that is genuinely what
   card-on-felt is). The ambient bed is a slow drone plus occasional
   pentatonic bells through a generated reverb — no melody to learn,
   nothing to get stuck in your head.

   The riffle's length is the clock the shuffle animation runs on; see
   shuffleDuration().

   Audio cannot start without a gesture, so ctx is built lazily on the
   first interaction and every entry point calls wake() first.
   --------------------------------------------------------------- */

const Sound = (() => {

  const KEY = "critters.sound.v1";

  let ctx = null, master = null, fx = null, music = null, verb = null;
  let noise = null;
  let droneNodes = [], bellTimer = null, playing = false;
  let on = true;

  try { const v = localStorage.getItem(KEY); if (v !== null) on = v === "1"; } catch (e) {}

  /* ─── recorded samples ───────────────────────────────────────────
     Fetched at load (no context needed for that) so the bytes are in
     memory long before anyone needs them, then decoded on the first
     gesture, when the context finally exists. If either step fails —
     an old browser with no Ogg Opus, say — the caller quietly falls
     back to its synthesised version. */

  const SAMPLES = {
    riffle: "assets/shuffle.ogg",
    place:  "assets/place.ogg",
    flip:   "assets/flip.ogg"
  };

  /* flip.ogg is eight seconds holding several separate takes with silence
     between them. Rather than play the lot, each entry below is one take:
     a start offset, a length that fits inside the 600ms flip, and a gain
     that levels it against the others (their peaks differ by ~1.7x).
     Rotating through them means two flips in a row never sound the same. */
  const FLIPS = [
    { at: 7.36, dur: 0.30, gain: 0.70 },   // peak .299 -> .21
    { at: 5.14, dur: 0.48, gain: 0.73 },   // peak .288 -> .21
    { at: 2.66, dur: 0.50, gain: 0.72 }    // peak .293 -> .21
  ];
  // the take at 0.72s is left out on purpose: it peaks six times quieter
  // than these three, and its tail runs past 600ms so it would be cut
  // mid-sound rather than landing in silence
  let flipIdx = Math.floor(Math.random() * FLIPS.length);

  const sample = {};   // name -> { bytes, buf, tried }

  const fetched = Promise.all(Object.entries(SAMPLES).map(([name, url]) => {
    sample[name] = { bytes: null, buf: null, tried: false };
    return fetch(url)
      .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then(b => { sample[name].bytes = b; })
      .catch(() => {});
  }));

  function decodeAll() {
    if (!ctx) return;
    for (const s of Object.values(sample)) {
      if (s.buf || s.tried || !s.bytes) continue;
      s.tried = true;
      // decodeAudioData detaches the buffer, so hand it a copy
      ctx.decodeAudioData(s.bytes.slice(0))
        .then(buf => { s.buf = buf; })
        .catch(() => { s.buf = null; });
    }
  }

  /* Play a decoded sample, or a slice of one. `at` and `dur` cut a window
     out of a longer file so a single recording can hold several takes.
     Returns false if the sample is not decoded yet. */
  function play(name, gain = 0.85, rate = 1, at = 0, dur = null) {
    const s = sample[name];
    if (!s || !s.buf) return false;
    const src = ctx.createBufferSource();
    src.buffer = s.buf;
    src.playbackRate.value = rate;

    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.value = gain;

    src.connect(g).connect(fx);
    if (dur) {
      // a short fade at each end, so cutting mid-file never clicks
      const fade = Math.min(0.012, dur / 6);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + fade);
      g.gain.setValueAtTime(gain, t + dur - fade);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.start(t, at, dur);
    } else {
      src.start(t, at);
    }
    return true;
  }

  /* ─── graph ──────────────────────────────────────────────────── */

  function wake() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();

      master = ctx.createGain();
      master.gain.value = on ? 1 : 0;
      master.connect(ctx.destination);

      fx = ctx.createGain();
      fx.gain.value = 0.5;
      fx.connect(master);

      music = ctx.createGain();
      music.gain.value = 0;            // faded in when the bed starts
      music.connect(master);

      verb = ctx.createConvolver();
      verb.buffer = impulse(2.6, 2.2);
      const verbGain = ctx.createGain();
      verbGain.gain.value = 0.5;
      verb.connect(verbGain).connect(master);
      verb._send = verbGain;

      noise = noiseBuffer(2);
      fetched.then(decodeAll);
      decodeAll();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /* a decaying noise burst makes a serviceable small room */
  function impulse(seconds, decay) {
    const n = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < n; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
      }
    }
    return buf;
  }

  function noiseBuffer(seconds) {
    const n = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  /* ─── grains ─────────────────────────────────────────────────── */

  /* one shaped burst of noise — the atom every card sound is built from */
  function grain({ at = 0, dur = 0.12, gain = 0.3, type = "lowpass",
                   f0 = 1800, f1 = 400, q = 0.9, send = 0 }) {
    const t = ctx.currentTime + at;

    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.5;

    const filt = ctx.createBiquadFilter();
    filt.type = type;
    filt.Q.value = q;
    filt.frequency.setValueAtTime(f0, t);
    filt.frequency.exponentialRampToValueAtTime(Math.max(60, f1), t + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.012, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(filt).connect(g).connect(fx);
    if (send > 0) {
      const s = ctx.createGain();
      s.gain.value = send;
      g.connect(s).connect(verb);
    }
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  /* a pitched body, for clicks and bells */
  function tone({ at = 0, freq = 880, dur = 0.4, gain = 0.2,
                  type = "sine", send = 0 }) {
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o.connect(g).connect(fx);
    if (send > 0) {
      const s = ctx.createGain();
      s.gain.value = send;
      g.connect(s).connect(verb);
    }
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /* ─── the room's sounds ──────────────────────────────────────── */

  const api = {

    /* a soft, dry tap for anything you press */
    click() {
      if (!on || !wake()) return;
      grain({ dur: 0.035, gain: 0.16, f0: 2600, f1: 900 });
      tone({ freq: 1180, dur: 0.06, gain: 0.045, type: "triangle" });
    },

    /* a card meeting the table */
    place() {
      if (!on || !wake()) return;
      // a touch of rate jitter so three cards in a row are not identical
      if (play("place", 0.8, 0.96 + Math.random() * 0.09)) return;
      grain({ dur: 0.15, gain: 0.34, f0: 1500, f1: 220, send: 0.12 });
      tone({ freq: 150, dur: 0.11, gain: 0.07, type: "sine" });
    },

    /* the short rip of a card turning over — a different take each time */
    flip() {
      if (!on || !wake()) return;
      const v = FLIPS[flipIdx];
      flipIdx = (flipIdx + 1) % FLIPS.length;
      if (play("flip", v.gain, 1, v.at, v.dur)) return;
      grain({ dur: 0.09, gain: 0.26, type: "bandpass", f0: 900, f1: 2600, q: 1.4 });
      grain({ at: 0.07, dur: 0.13, gain: 0.2, f0: 2000, f1: 320, send: 0.1 });
    },

    /* How long a shuffle should take. The recording is the authority —
       the animation is timed to it, rather than the clip being pitched
       up or down to fit an animation someone picked by eye. */
    shuffleDuration() {
      return sample.riffle.buf ? sample.riffle.buf.duration : null;
    },

    /* the real riffle if it decoded, the synthesised one if it did not */
    shuffle(seconds = 1.2) {
      if (!on || !wake()) return;

      if (play("riffle", 0.85)) return;

      const n = Math.round(seconds * 34);
      for (let i = 0; i < n; i++) {
        // bunched towards the middle, the way a real bridge sounds
        const p = i / n;
        const bunch = 0.5 - Math.cos(p * Math.PI * 2) * 0.18;
        grain({
          at: p * seconds + (Math.random() - 0.5) * 0.012,
          dur: 0.022 + Math.random() * 0.02,
          gain: (0.06 + Math.random() * 0.07) * bunch * 2,
          f0: 2200 + Math.random() * 2200,
          f1: 600 + Math.random() * 500
        });
      }
      grain({ at: seconds + 0.04, dur: 0.16, gain: 0.22, f0: 1200, f1: 200, send: 0.14 });
    },

    /* the seal opening a reading */
    chime() {
      if (!on || !wake()) return;
      [523.25, 784, 1046.5].forEach((f, i) =>
        tone({ at: i * 0.09, freq: f, dur: 2.4, gain: 0.075, send: 0.55 }));
    },

    /* ─── the ambient bed ──────────────────────────────────────── */

    startMusic() {
      if (!on || playing || !wake()) return;
      playing = true;

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 520;
      lp.Q.value = 0.4;
      lp.connect(music);

      // a root, its fifth and octave, each detuned a hair so the pad moves
      [65.41, 98.0, 130.81, 196.0].forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = i > 1 ? "sine" : "triangle";
        o.frequency.value = f;
        o.detune.value = (Math.random() - 0.5) * 12;

        const g = ctx.createGain();
        g.gain.value = i > 1 ? 0.06 : 0.11;

        // slow swell, each voice on its own clock
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.03 + Math.random() * 0.05;
        const lfoAmt = ctx.createGain();
        lfoAmt.gain.value = g.gain.value * 0.6;
        lfo.connect(lfoAmt).connect(g.gain);

        o.connect(g).connect(lp);
        o.start(); lfo.start();
        droneNodes.push(o, lfo);
      });

      // C-major pentatonic, struck rarely and never in a pattern
      const NOTES = [523.25, 587.33, 659.25, 784.0, 880.0, 1046.5];
      const ring = () => {
        if (!playing) return;
        const f = NOTES[Math.floor(Math.random() * NOTES.length)];
        const t = ctx.currentTime;
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
        const s = ctx.createGain();
        s.gain.value = 0.7;
        o.connect(g).connect(music);
        g.connect(s).connect(verb);
        o.start(t); o.stop(t + 4.2);
        bellTimer = setTimeout(ring, 5000 + Math.random() * 7000);
      };
      bellTimer = setTimeout(ring, 2500);

      music.gain.cancelScheduledValues(ctx.currentTime);
      music.gain.setValueAtTime(music.gain.value, ctx.currentTime);
      music.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 4);
    },

    stopMusic() {
      if (!playing || !ctx) return;
      playing = false;
      clearTimeout(bellTimer);
      const t = ctx.currentTime;
      music.gain.cancelScheduledValues(t);
      music.gain.setValueAtTime(music.gain.value, t);
      music.gain.linearRampToValueAtTime(0.0001, t + 1.4);
      droneNodes.forEach(n => { try { n.stop(t + 1.6); } catch (e) {} });
      droneNodes = [];
    },

    /* ─── the switch ───────────────────────────────────────────── */

    enabled() { return on; },

    toggle() {
      on = !on;
      try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
      if (!ctx) { if (on) wake(); return on; }
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(on ? 1 : 0.0001, t + 0.25);
      if (on) ctx.resume(); else clearTimeout(bellTimer);
      return on;
    },

    isPlaying() { return playing; },

    /* what the graph is actually doing — used by the sound switch and
       handy when a browser has quietly refused to start the context */
    state() {
      return {
        on,
        ctx: ctx ? ctx.state : "none",
        music: music ? +music.gain.value.toFixed(3) : 0,
        playing,
        voices: droneNodes.length,
        samples: Object.fromEntries(Object.entries(sample).map(([k, v]) =>
          [k, v.buf ? +v.buf.duration.toFixed(3) : (v.bytes ? "undecoded" : "none")]))
      };
    }
  };

  return api;
})();
