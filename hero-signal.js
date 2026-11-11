/* Thalamic — hero signal field.

   Three ambient treatments for the space to the right of the hero type, each
   drawn from a different part of the subject's own world. Pick one with ?hero=:

     raster     continuous wideband traces, one per channel, that become
                discrete event ticks at the NPU gate. What crosses the skull
                is the reduced stream, never the waveform.
     threshold  a wideband trace against a detection threshold; every crossing
                emits an event onto the train below it. The chip's first job.
     lattice    orthogonal on-die routing, static, with pulses running the
                routes. The silicon rather than the signal.

   ?hero=off disables it. All three are deterministic (seeded, so the field is
   identical on every load), quiet by construction, masked away from the type in
   CSS, hidden below 900px, and frozen to a single frame under
   prefers-reduced-motion. */
(function () {
  var canvas = document.getElementById('hero-signal');
  if (!canvas || !canvas.getContext) return;

  var DEFAULT = 'raster';
  var mode = (new URLSearchParams(location.search).get('hero') || DEFAULT).toLowerCase();
  if (mode === 'off') return;

  /* All four are the original weights lifted 30% — the first pass sat too far
     back to register against the paper. */
  var INK   = 'rgba(28,28,24,0.143)';  /* --ink, hairline weight   */
  var FAINT = 'rgba(28,28,24,0.078)';  /* --ink, structure only    */
  var ACC   = 'rgba(43,75,173,0.442)'; /* sRGB of oklch(0.45 0.16 266) */
  var TRACE = 'rgba(28,28,24,0.247)';  /* a lone stroke needs more than a field of ticks */

  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1, raf = 0, last = 0, visible = true;

  /* mulberry32 — seeded so every visitor sees the same field */
  var seed = 1;
  function reseed(n) { seed = n >>> 0; }
  function rnd() {
    seed = seed + 0x6d2b79f5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /* ------------------------------------------------------------- raster */
  /* Wideband in, events out. Left of the gate every channel is a continuous
     trace — the raw signal as the electrode sees it. Each spike deflection
     drifts right at the same rate as the trace it sits in, and at the gate the
     waveform stops and the deflection carries on as a discrete tick: the same
     event, now a symbol. That is the whole product in one image — what crosses
     the skull is the tick, never the waveform. */
  var raster = {
    ROWS: 80, SPEED: 87, GATE: 0.75, FROM: 0.38, PAD: 26,
    NOISE: 1.75, SPIKE_H: 7.6, SPIKE_N: 22, RATE: 0.0052, SYNC: 5.5,
    /* the same three under 900px, where the field is full-bleed */
    ROWS_N: 26, GATE_N: 0.5, FROM_N: 0.02,
    /* population-burst pitch, in columns — held apart from SPEED so the banding
       keeps its spacing on screen when the stream is run faster or slower */
    BAND: 34, PITCH0: 21,

    init: function () {
      reseed(0x51ED5);
      /* On a phone the field is full-bleed rather than masked to one side, and
         it runs down the page instead of across it — a portrait screen has the
         room along its long axis, not its short one. The field is still built
         in its own landscape space; `vertical` transposes it on the way to the
         canvas (see paint), so w is the time axis and h the channel axis
         whichever way round the two end up on screen. The channel count also
         drops until a lane is wide enough to read at arm's length. */
      this.vertical = W < 900;
      this.w = this.vertical ? H : W;          /* time axis    */
      this.h = this.vertical ? W : H;          /* channel axis */
      this.rowN = this.vertical ? this.ROWS_N : this.ROWS;
      this.gate = this.vertical ? this.GATE_N : this.GATE;
      this.from = this.vertical ? this.FROM_N : this.FROM;
      var span = Math.max(this.h - this.PAD * 2, 1), i;
      /* deflections are sized off the lane pitch, not fixed pixels — at 80
         channels a lane is a quarter what it was at 20, and a full-height spike
         would run straight through its neighbour. PITCH0 is the pitch the
         amplitudes above were drawn for; narrower lanes scale down from it. */
      this.vs = Math.min((span / this.rowN) / this.PITCH0, 1);
      this.n = this.w + 96;
      this.head = 0;
      this.count = 0;
      this.acc = 0;
      this.syncIn = this.BAND * 2;
      this.rows = [];
      for (i = 0; i < this.rowN; i++) {
        this.rows.push({
          y: Math.round(this.PAD + span * (i + 0.5) / this.rowN) + 0.5,
          buf: new Float32Array(this.n),
          gain: 0.7 + rnd() * 0.6,   /* channels sit at different distances */
          spike: 0,
          events: []
        });
      }
      for (i = 0; i < this.n; i++) this.push();   /* prime the full width */
    },

    /* sharp upward deflection, slower rebound — an extracellular spike shape */
    wave: function (k) {
      var t = k / this.SPIKE_N, h = this.SPIKE_H * this.vs;
      return -Math.exp(-Math.pow((t - 0.22) / 0.10, 2)) * h
           +  Math.exp(-Math.pow((t - 0.50) / 0.18, 2)) * h * 0.32;
    },

    push: function () {
      var pop = false, i, row;
      /* population events — cortex is bursty, so the raster should band */
      if (--this.syncIn <= 0) {
        this.syncIn = this.BAND * (3.5 + rnd() * 4);
        pop = true;
      }
      for (i = 0; i < this.rows.length; i++) {
        row = this.rows[i];
        var v = (rnd() - 0.5) * 2 * this.NOISE * this.vs;
        if (row.spike > 0) {
          v += this.wave(this.SPIKE_N - row.spike) * row.gain;
          row.spike--;
        } else if (rnd() < this.RATE || (pop && rnd() < 0.45)) {
          row.spike = this.SPIKE_N;
          row.events.push(this.count);
        }
        row.buf[(this.head - 1 + this.n) % this.n] = v;
        while (row.events.length && this.count - row.events[0] > this.w + 4) row.events.shift();
      }
      this.head = (this.head - 1 + this.n) % this.n;
      this.count++;
    },

    step: function (dt) {
      this.acc += this.SPEED * dt;
      while (this.acc >= 1) { this.push(); this.acc -= 1; }
    },

    draw: function () {
      var gate = Math.round(this.w * this.gate), from = Math.round(this.w * this.from);
      var i, j, c, row, x, y;

      ctx.fillStyle = FAINT;
      ctx.fillRect(gate, this.PAD * 0.5, 1, Math.max(this.h - this.PAD, 0));

      /* the continuous side — only the stretch the mask actually reveals.
         Strokes, not ticks, so they carry the heavier of the two ink weights. */
      ctx.strokeStyle = TRACE;
      ctx.lineWidth = 1;
      for (i = 0; i < this.rows.length; i++) {
        row = this.rows[i];
        ctx.beginPath();
        for (c = from; c <= gate; c++) {
          y = row.y + row.buf[(this.head + c) % this.n];
          if (c === from) ctx.moveTo(c + 0.5, y); else ctx.lineTo(c + 0.5, y);
        }
        ctx.stroke();
      }

      /* the discrete side — the same events, past the gate. Ticks shrink with
         the lane too, but never below the point where they stop reading. */
      var th = Math.max(4 * this.vs, 2.5);
      ctx.fillStyle = ACC;
      for (i = 0; i < this.rows.length; i++) {
        row = this.rows[i];
        for (j = 0; j < row.events.length; j++) {
          x = this.count - row.events[j];
          if (x <= gate || x > this.w + 2) continue;
          ctx.fillRect(x, row.y - th, 2, th * 2);
        }
      }
    }
  };

  /* ---------------------------------------------------------- threshold */
  var threshold = {
    SPEED: 102, AMP: 4.6, TH: 19, SPIKE: 26, RATE: 0.016,

    init: function () {
      reseed(0xBEEF1);
      this.n = W + 80;
      this.buf = new Float32Array(this.n);   /* circular: column c -> buf[(head+c)%n] */
      this.head = 0;
      this.count = 0;
      this.acc = 0;
      this.spike = 0;
      this.events = [];
      this.mid = Math.round(H * 0.44) + 0.5;
      this.evy = Math.round(H * 0.60) + 0.5;
      for (var i = 0; i < this.n; i++) this.push();   /* prime the whole width */
    },

    /* sharp upward deflection, slower rebound — an extracellular spike shape */
    wave: function (k) {
      var t = k / this.SPIKE;
      return -Math.exp(-Math.pow((t - 0.20) / 0.09, 2)) * this.AMP * 6.2
           +  Math.exp(-Math.pow((t - 0.46) / 0.17, 2)) * this.AMP * 1.9;
    },

    push: function () {
      var v = (rnd() - 0.5) * 2 * this.AMP;
      if (this.spike > 0) {
        v += this.wave(this.SPIKE - this.spike);
        this.spike--;
      } else if (rnd() < this.RATE) {
        this.spike = this.SPIKE;
        this.events.push(this.count);
      }
      this.head = (this.head - 1 + this.n) % this.n;
      this.buf[this.head] = v;
      this.count++;
      while (this.events.length && this.count - this.events[0] > W) this.events.shift();
    },

    step: function (dt) {
      this.acc += this.SPEED * dt;
      while (this.acc >= 1) { this.push(); this.acc -= 1; }
    },

    draw: function () {
      var c, x, i;

      ctx.strokeStyle = FAINT;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(0, this.mid - this.TH);
      ctx.lineTo(W, this.mid - this.TH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = TRACE;
      ctx.beginPath();
      for (c = 0; c < W; c++) {
        var y = this.mid + this.buf[(this.head + c) % this.n];
        if (c === 0) ctx.moveTo(0.5, y); else ctx.lineTo(c + 0.5, y);
      }
      ctx.stroke();

      ctx.fillStyle = ACC;
      for (i = 0; i < this.events.length; i++) {
        x = this.count - this.events[i];
        if (x < 0 || x > W) continue;
        ctx.fillRect(x - 1, this.mid - this.TH - 1.5, 3, 3);   /* the crossing */
        ctx.fillRect(x, this.evy - 4.5, 2, 9);                 /* the event out */
      }
    }
  };

  /* ------------------------------------------------------------ lattice */
  var lattice = {
    PITCH: 24, ROUTES: 9, SPEED: 95, LEN: 30, SPAWN: 0.7,

    init: function () {
      reseed(0x10CA1);
      var lanes = Math.max(Math.floor((H - 48) / this.PITCH), 3), r, i;
      this.routes = [];
      this.pulses = [];
      this.next = 0.4;

      for (r = 0; r < this.ROUTES; r++) {
        var y = 24 + (1 + Math.floor(rnd() * (lanes - 2))) * this.PITCH;
        var pts = [{ x: -24, y: y }], x = -24;
        while (x < W + 24) {
          x += this.PITCH * (2 + Math.floor(rnd() * 6));
          pts.push({ x: x, y: y });
          if (rnd() < 0.62 && x < W) {
            y += (rnd() < 0.5 ? -1 : 1) * this.PITCH * (1 + Math.floor(rnd() * 2));
            y = Math.min(Math.max(y, 24), H - 24);
            pts.push({ x: x, y: y });
          }
        }
        this.routes.push(this.prep(pts));
      }

      /* the routing itself never moves — bake it once */
      this.plate = document.createElement('canvas');
      this.plate.width = W * dpr;
      this.plate.height = H * dpr;
      var p = this.plate.getContext('2d');
      p.setTransform(dpr, 0, 0, dpr, 0, 0);
      p.strokeStyle = FAINT;
      p.lineWidth = 1;
      for (r = 0; r < this.routes.length; r++) {
        var pts2 = this.routes[r].pts;
        p.beginPath();
        for (i = 0; i < pts2.length; i++) {
          var px = Math.round(pts2[i].x) + 0.5, py = Math.round(pts2[i].y) + 0.5;
          if (i === 0) p.moveTo(px, py); else p.lineTo(px, py);
        }
        p.stroke();
        p.fillStyle = FAINT;
        for (i = 1; i < pts2.length - 1; i++) {
          if (pts2[i].y !== pts2[i + 1].y) {   /* a bend is a via */
            p.fillRect(Math.round(pts2[i].x) - 1.5, Math.round(pts2[i].y) - 1.5, 3, 3);
          }
        }
      }
      /* prime a full traversal, so pulses are spread along the routes and not
         all still bunched in the masked-out left edge */
      var longest = 0;
      for (r = 0; r < this.routes.length; r++) longest = Math.max(longest, this.routes[r].total);
      for (var t = 0; t < longest / this.SPEED; t += 0.05) this.step(0.05);
    },

    prep: function (pts) {
      var acc = [0], i, total = 0;
      for (i = 1; i < pts.length; i++) {
        total += Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
        acc.push(total);
      }
      return { pts: pts, acc: acc, total: total };
    },

    step: function (dt) {
      var live = [], i;
      this.next -= dt;
      if (this.next <= 0) {
        this.next = this.SPAWN * (0.5 + rnd() * 1.6);
        this.pulses.push({ r: Math.floor(rnd() * this.routes.length), d: 0 });
      }
      for (i = 0; i < this.pulses.length; i++) {
        this.pulses[i].d += this.SPEED * dt;
        if (this.pulses[i].d - this.LEN < this.routes[this.pulses[i].r].total) {
          live.push(this.pulses[i]);
        }
      }
      this.pulses = live;
    },

    /* stroke the part of a route between two distances along it */
    span: function (route, d0, d1) {
      var pts = route.pts, acc = route.acc, i, a, b, s, e, t0, t1;
      ctx.beginPath();
      for (i = 1; i < pts.length; i++) {
        s = acc[i - 1]; e = acc[i];
        if (e <= d0 || s >= d1) continue;
        a = pts[i - 1]; b = pts[i];
        t0 = (Math.max(d0, s) - s) / (e - s || 1);
        t1 = (Math.min(d1, e) - s) / (e - s || 1);
        ctx.moveTo(a.x + (b.x - a.x) * t0 + 0.5, a.y + (b.y - a.y) * t0 + 0.5);
        ctx.lineTo(a.x + (b.x - a.x) * t1 + 0.5, a.y + (b.y - a.y) * t1 + 0.5);
      }
      ctx.stroke();
    },

    draw: function () {
      ctx.drawImage(this.plate, 0, 0, W, H);
      ctx.strokeStyle = ACC;
      ctx.lineWidth = 1.5;
      for (var i = 0; i < this.pulses.length; i++) {
        var p = this.pulses[i];
        this.span(this.routes[p.r], Math.max(p.d - this.LEN, 0), p.d);
      }
      ctx.lineWidth = 1;
    }
  };

  var FIELDS = { raster: raster, threshold: threshold, lattice: lattice };
  var field = FIELDS[mode] || FIELDS[DEFAULT];
  document.documentElement.dataset.hero = FIELDS[mode] ? mode : DEFAULT;

  /* ---------------------------------------------------------- lifecycle */
  function measure() {
    var r = canvas.getBoundingClientRect();
    W = Math.round(r.width);
    H = Math.round(r.height);
    if (W < 2 || H < 2) return false;         /* hidden at narrow widths */
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    field.init();
    return true;
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    /* A field that asked to run down the page is still drawn in its own
       landscape space and transposed here — swapping the two axes, so its time
       axis becomes the screen's vertical one and its channels become columns.
       Everything it draws follows: the gate turns into a horizontal line, and
       an event tick into a dash across its column. */
    if (field.vertical) ctx.setTransform(0, dpr, dpr, 0, 0, 0);
    field.draw();
    canvas.dataset.ready = '';
  }

  function frame(now) {
    raf = 0;
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    field.step(dt);
    paint();
    if (visible) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf || reduced || !visible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  if (!measure()) return;
  paint();
  if (reduced) return;   /* one still frame is the whole treatment */

  /* run only while the hero is on screen and the tab is in front */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting && !document.hidden;
      if (visible) start(); else stop();
    }, { threshold: 0 }).observe(canvas);
  } else {
    visible = true;
  }
  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
    if (visible) start(); else stop();
  });
  start();

  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      stop();
      if (measure()) { paint(); start(); }
    }, 180);
  });
})();
