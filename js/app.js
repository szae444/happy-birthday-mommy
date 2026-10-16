/* ==========================================================================
   Core: helpers, progress, sound, sky, confetti, booth overlay, tickets
   ========================================================================== */
(() => {
  const C = (window.C = {});
  const cfg = (C.cfg = window.CARNIVAL);
  C.booths = {};

  /* ---------- helpers ---------------------------------------------------- */
  C.$ = (s, r = document) => r.querySelector(s);
  C.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  C.rand = (a, b) => a + Math.random() * (b - a);
  C.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  C.el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k === "style") e.style.cssText = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    kids.flat().forEach((k) => k != null && e.append(k));
    return e;
  };
  C.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // long-pressing a game control on a phone shouldn't pop up a menu
  document.addEventListener("contextmenu", (e) => { if (e.target.closest("canvas, button, .cake, .cm-glass")) e.preventDefault(); });
  C.toast = (parent, text) => {
    const t = C.el("div", { class: "toast" }, text);
    parent.append(t);
    setTimeout(() => t.remove(), 1150);
  };
  C.photo = (p, tilt) => {
    const fig = C.el("figure", { class: "polaroid", style: `--tilt:${tilt ?? C.rand(-4, 4).toFixed(1)}deg` });
    const img = C.el("img", { class: "ph", alt: p.caption || "", src: p.src, loading: "lazy" });
    img.onerror = () => img.replaceWith(C.el("div", { class: "ph-fallback", html: `<span><b>${C.esc(cfg.name)}</b>${C.esc(p.src)}</span>` }));
    fig.append(img, C.el("figcaption", {}, p.caption || ""));
    return fig;
  };

  /* ---------- progress (survives a reload; ?reset starts over) ---------- */
  const KEY = "mommy-carnival-v1";
  C.store = {
    data: { gate: false, done: [] },
    load() {
      try {
        const d = JSON.parse(localStorage.getItem(KEY));
        if (d) this.data = { ...this.data, ...d };
      } catch (e) {}
      if (new URLSearchParams(location.search).has("reset")) {
        this.data = { gate: false, done: [] };
        this.save();
      }
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {}
    }
  };

  /* ---------- sound (all synthesized — no files needed) ----------------- */
  const A = (C.audio = {
    on: true, ctx: null, master: null,
    init() {
      if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.session("playback");   // iPhone: play sounds even with the silent switch on
      const ctx = (this.ctx = new AC());
      this.master = ctx.createGain();
      this.master.gain.value = 0.5;
      const delay = ctx.createDelay(), fb = ctx.createGain(), wet = ctx.createGain();
      delay.delayTime.value = 0.19; fb.gain.value = 0.3; wet.gain.value = 0.28;
      this.master.connect(ctx.destination);
      this.master.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(ctx.destination);
    },
    session(type) {
      try { if (navigator.audioSession) navigator.audioSession.type = type; } catch (e) {}
    },
    tone(f, dur = 0.15, type = "sine", vol = 0.3, at = 0, slide) {
      if (!this.on || !this.ctx) return;
      const t = this.ctx.currentTime + at;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.05);
    },
    noise(dur = 0.3, vol = 0.2, at = 0, freq = 1200) {
      if (!this.on || !this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime + at;
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = buf; f.type = "bandpass"; f.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.master);
      s.start(t);
    },
    tap() { this.tone(660, 0.08, "triangle", 0.16); },
    pop(p = 0) { this.tone(700 + p * 90, 0.1, "sine", 0.25, 0, 300 + p * 40); },
    good() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.2, "triangle", 0.2, i * 0.07)); },
    bad() { this.tone(240, 0.28, "sawtooth", 0.1, 0, 130); },
    chime() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.6, "sine", 0.18, i * 0.09)); },
    ticket() { [1046, 1318, 1568, 2093].forEach((f, i) => this.tone(f, 0.7, "triangle", 0.16, i * 0.06)); this.noise(0.4, 0.06, 0, 5000); },
    whoosh() { this.noise(0.45, 0.14, 0, 700); },
    bell(f, at, vol = 0.2) {
      this.tone(f, 1.5, "sine", vol, at);
      this.tone(f * 2, 0.8, "sine", vol * 0.3, at);
      this.tone(f * 3.01, 0.35, "triangle", vol * 0.1, at);
    },
    birthday() {   // music-box "Happy Birthday"
      const N = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
      const song = [
        ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
        ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
        ["G4", .75], ["G4", .25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 2],
        ["F5", .75], ["F5", .25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 3]
      ];
      const beat = 0.42; let t = 0.15;
      song.forEach(([n, d]) => { this.bell(N[n], t); t += d * beat; });
      return t;
    }
  });
  document.addEventListener("pointerdown", () => A.init());
  document.addEventListener("keydown", () => A.init());

  /* ---------- background music (YouTube, or a local MP3) --------------- */
  C.music = (() => {
    const m = cfg.music || {};
    const box = C.$("#jukebox"), now = C.$("#jbNow");
    const VOL = m.volume ?? 55;
    let player = null, audio = null, ready = false, started = false, held = false, fadeId = null;

    const want = () => started && A.on && !held;
    const setPlaying = (p) => box.classList.toggle("playing", p);

    function fadeTo(target, ms = 1800, done) {
      clearInterval(fadeId);
      const get = () => (audio ? audio.volume * 100 : player.getVolume());
      const set = (v) => (audio ? (audio.volume = v / 100) : player.setVolume(v));
      const from = get(), steps = Math.max(1, Math.round(ms / 60));
      let i = 0;
      fadeId = setInterval(() => {
        set(from + ((target - from) * ++i) / steps);
        if (i >= steps) { clearInterval(fadeId); done && done(); }
      }, 60);
    }
    function sync() {
      if (!ready) return;
      if (want()) {
        if (audio) { audio.play().catch(() => {}); } else { player.playVideo(); }
        fadeTo(VOL);
      } else {
        fadeTo(0, 700, () => (audio ? audio.pause() : player.pauseVideo()));
      }
    }

    if (m.file) {
      audio = new Audio(m.file);
      audio.loop = true; audio.volume = 0; audio.preload = "auto";
      audio.addEventListener("play", () => setPlaying(true));
      audio.addEventListener("pause", () => setPlaying(false));
      ready = true;
      box.classList.add("no-video");
    } else if (m.youtube) {
      window.onYouTubeIframeAPIReady = () => {
        player = new YT.Player("ytPlayer", {
          videoId: m.youtube, width: 112, height: 63,
          playerVars: { autoplay: 0, controls: 0, disablekb: 1, loop: 1, playlist: m.youtube, playsinline: 1, rel: 0, fs: 0, iv_load_policy: 3 },
          events: {
            onReady: (e) => { e.target.setVolume(0); ready = true; sync(); },
            onError: () => {   // video refused to play here — keep the jukebox as a plain sound toggle
              ready = false;
              box.classList.remove("tap-to-play", "show-now", "playing");
              box.classList.add("no-video");
            },
            onStateChange: (e) => {
              setPlaying(e.data === 1);
              if (e.data === 1 && box.classList.contains("tap-to-play")) {
                box.classList.remove("tap-to-play", "show-now");
                if (!want()) player.pauseVideo();
                else player.setVolume(VOL);
              }
            }
          }
        });
      };
      document.head.append(C.el("script", { src: "https://www.youtube.com/iframe_api" }));
    } else {
      box.classList.add("no-video");
    }

    // Some phones (mostly iPhones) won't let a page start YouTube by itself —
    // if it didn't start, ask her to tap the record, which plays it directly.
    function checkBlocked(tries = 0) {
      if (!want()) return;
      const state = player && ready ? player.getPlayerState() : -1;
      // still loading (buffering, or the player isn't ready yet) — give it more time on slow data
      if (!audio && (state === 3 || !ready) && tries < 4) { setTimeout(() => checkBlocked(tries + 1), 2000); return; }
      const blocked = audio ? audio.paused : state !== 1;
      if (!blocked) return;
      if (audio) { audio.play().catch(() => {}); return; }
      box.classList.add("tap-to-play", "show-now");
      now.textContent = "♪ tap the record for music";
    }

    // keep the screen from dimming while she plays
    let lock = null;
    async function wake() {
      try { if ("wakeLock" in navigator && !lock) { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => (lock = null)); } } catch (e) {}
    }
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && started) wake(); });

    return {
      start() {             // first tap anywhere
        if (started) return;
        started = true;
        wake();
        sync();
        if (A.on && m.title) {
          now.textContent = `♪ ${m.title}`;
          box.classList.add("show-now");
          setTimeout(() => { if (!box.classList.contains("tap-to-play")) box.classList.remove("show-now"); }, 4500);
        }
        setTimeout(checkBlocked, 2500);
      },
      hold() { held = true; sync(); },       // e.g. while the mic listens
      release() { held = false; sync(); },
      sync
    };
  })();
  document.addEventListener("pointerdown", () => C.music.start());
  document.addEventListener("keydown", () => C.music.start());

  /* ---------- night sky ------------------------------------------------- */
  (() => {
    const cv = C.$("#sky"), cx = cv.getContext("2d");
    let W, H, stars = [], shoot = null;
    function size() {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * d; cv.height = H * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
      stars = Array.from({ length: Math.round((W * H) / 2600) }, () => ({
        x: Math.random() * W, y: Math.random() * H * 0.9,
        r: Math.random() * 1.3 + 0.2, p: Math.random() * 6.28, s: Math.random() * 1.5 + 0.4
      }));
    }
    function draw(t) {
      requestAnimationFrame(draw);
      if (document.body.classList.contains("in-booth")) return;
      const g = cx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#0b0820"); g.addColorStop(0.55, "#1d1236"); g.addColorStop(1, "#3d1a45");
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      const glow = cx.createRadialGradient(W / 2, H * 1.1, 0, W / 2, H * 1.1, H * 0.75);
      glow.addColorStop(0, "rgba(255,170,90,.28)"); glow.addColorStop(1, "rgba(255,170,90,0)");
      cx.fillStyle = glow; cx.fillRect(0, 0, W, H);
      cx.fillStyle = "#fff3dc";
      for (const s of stars) {
        cx.globalAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.s + s.p));
        cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.283); cx.fill();
      }
      cx.globalAlpha = 1;
      if (!shoot && Math.random() < 0.003)
        shoot = { x: C.rand(W * 0.3, W), y: C.rand(0, H * 0.3), vx: -C.rand(6, 10), vy: C.rand(3, 5), life: 1 };
      if (shoot) {
        cx.strokeStyle = `rgba(255,242,196,${shoot.life})`; cx.lineWidth = 1.6;
        cx.beginPath(); cx.moveTo(shoot.x, shoot.y); cx.lineTo(shoot.x - shoot.vx * 10, shoot.y - shoot.vy * 10); cx.stroke();
        shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life -= 0.02;
        if (shoot.life <= 0) shoot = null;
      }
    }
    addEventListener("resize", size);
    size();
    requestAnimationFrame(draw);
  })();

  /* ---------- confetti + fireworks ------------------------------------- */
  C.fx = (() => {
    const cv = C.$("#fx"), cx = cv.getContext("2d");
    const COLORS = ["#ffcf6b", "#e2344f", "#fff3dc", "#ff7a98", "#7fdcc6", "#fff2c4"];
    let W, H, ps = [], running = false;
    function size() {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * d; cv.height = H * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
    }
    function loop() {
      cx.clearRect(0, 0, W, H);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= p.decay;
        if (p.life <= 0 || p.y > H + 40) { ps.splice(i, 1); continue; }
        cx.save();
        cx.globalAlpha = Math.min(1, p.life * 1.5);
        cx.translate(p.x, p.y); cx.rotate(p.rot);
        cx.fillStyle = p.c;
        if (p.kind === "rect") { cx.scale(1, Math.cos(p.rot * 2)); cx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); }
        else { cx.beginPath(); cx.arc(0, 0, p.kind === "spark" ? p.size : p.size / 2, 0, 6.283); cx.fill(); }
        cx.restore();
      }
      if (ps.length) requestAnimationFrame(loop);
      else { running = false; cx.clearRect(0, 0, W, H); }
    }
    const start = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
    addEventListener("resize", size);
    size();
    return {
      burst(x = W / 2, y = H / 2, n = 80, power = 1) {
        for (let i = 0; i < n; i++) {
          const a = Math.random() * 6.283, v = C.rand(4, 11) * power;
          ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, g: 0.22, drag: 0.97, rot: Math.random() * 6, vr: C.rand(-0.3, 0.3),
            size: C.rand(6, 11), c: COLORS[i % COLORS.length], life: 1, decay: C.rand(0.006, 0.012), kind: Math.random() < 0.3 ? "circle" : "rect" });
        }
        start();
      },
      rain(n = 160) {
        for (let i = 0; i < n; i++)
          ps.push({ x: Math.random() * W, y: -20 - Math.random() * H, vx: C.rand(-1, 1), vy: C.rand(1, 3), g: 0.04, drag: 0.995, rot: Math.random() * 6,
            vr: C.rand(-0.2, 0.2), size: C.rand(6, 12), c: COLORS[i % COLORS.length], life: 2, decay: 0.0035, kind: Math.random() < 0.25 ? "circle" : "rect" });
        start();
      },
      firework(x, y) {
        const c = COLORS[Math.floor(Math.random() * COLORS.length)];
        for (let i = 0; i < 64; i++) {
          const a = (i / 64) * 6.283, v = C.rand(2.5, 5.5);
          ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.06, drag: 0.98, rot: 0, vr: 0,
            size: C.rand(1.4, 2.6), c, life: 1, decay: C.rand(0.012, 0.02), kind: "spark" });
        }
        A.noise(0.6, 0.1, 0, 420);
        start();
      },
      show(seconds = 6) {
        let t = 0;
        const id = setInterval(() => {
          this.firework(C.rand(W * 0.15, W * 0.85), C.rand(H * 0.1, H * 0.45));
          if ((t += 0.5) > seconds) clearInterval(id);
        }, 500);
      }
    };
  })();

  /* ---------- booth overlay -------------------------------------------- */
  C.booth = {
    current: null, cleanup: null,
    open(def) {
      const o = C.$("#booth");
      this.current = def;
      C.$("#boothNum").textContent = def.num;
      C.$("#boothTitle").textContent = def.title;
      C.$("#boothSub").textContent = def.sub;
      const stage = C.$("#boothStage"), foot = C.$("#boothFoot");
      stage.innerHTML = ""; foot.innerHTML = "";
      stage.scrollTop = 0;
      o.hidden = false;
      o.classList.remove("leaving");
      document.body.classList.add("in-booth");
      A.whoosh();
      this.cleanup = def.mount(stage, {
        win: (label) => this.win(label),
        foot,
        setSub: (t) => (C.$("#boothSub").textContent = t)
      }) || null;
    },
    close() {
      const o = C.$("#booth");
      if (o.hidden || o.classList.contains("leaving")) return;
      if (this.cleanup) try { this.cleanup(); } catch (e) {}
      this.cleanup = null;
      o.classList.add("leaving");
      document.body.classList.remove("in-booth");
      setTimeout(() => {
        o.hidden = true;
        o.classList.remove("leaving");
        C.$("#boothStage").innerHTML = "";
      }, 380);
    },
    win(label = "Collect your golden ticket") {
      const def = this.current, foot = C.$("#boothFoot");
      const already = C.store.data.done.includes(def.id);
      foot.innerHTML = "";
      const b = C.el("button", { class: "btn", type: "button" }, already ? "Back to the carnival →" : `${label} 🎟️`);
      b.onclick = () => (already ? this.close() : C.award(def));
      foot.append(b);
      A.chime();
    }
  };
  C.$("#boothBack").addEventListener("click", () => C.booth.close());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") C.booth.close(); });

  /* ---------- golden ticket award ------------------------------------- */
  C.award = (def) => {
    const pop = C.$("#ticketPop"), t = C.$("#gticket");
    C.$("#gtBooth").textContent = def.title;
    C.$("#gtNo").textContent = `Nº ${String(def.order).padStart(3, "0")} · ${new Date().getFullYear()}`;
    t.classList.remove("fly");
    pop.hidden = false;
    A.ticket();
    C.fx.burst(innerWidth / 2, innerHeight / 2, 70);
    const d = C.store.data;
    if (!d.done.includes(def.id)) d.done.push(def.id);
    C.store.save();
    setTimeout(() => {
      C.booth.close();
      const slot = C.$$(".hud-slot")[d.done.filter((id) => id !== "cake").length - 1];
      if (slot) {
        const r = slot.getBoundingClientRect(), tr = t.getBoundingClientRect();
        t.style.setProperty("--fx", `${r.left + r.width / 2 - (tr.left + tr.width / 2)}px`);
        t.style.setProperty("--fy", `${r.top + r.height / 2 - (tr.top + tr.height / 2)}px`);
      }
      t.classList.add("fly");
      setTimeout(() => {
        pop.hidden = true;
        t.classList.remove("fly");
        C.map.refresh(true);
      }, 800);
    }, 1800);
  };
})();
