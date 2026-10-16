/* ==========================================================================
   THE BIG TENT · finale — build a cake, blow out the candles, open the letter
   ========================================================================== */
(() => {
  const FLAVORS = [
    { name: "Ube", c: "#8e5bb5" }, { name: "Chocolate", c: "#6b3b2a" }, { name: "Strawberry", c: "#f08ba5" },
    { name: "Mango", c: "#ffc24d" }, { name: "Vanilla", c: "#f6e2b8" }, { name: "Red Velvet", c: "#b5243b" }
  ];
  const FROSTING = [
    { name: "Cream", c: "#fff6e6" }, { name: "Pink", c: "#ffb3c7" }, { name: "Choco", c: "#4a2618" },
    { name: "Gold", c: "#ffd67a" }, { name: "Mint", c: "#a8ead9" }
  ];
  const TOPPINGS = ["🍓", "🍒", "🌸", "🫐", "🍫", "sprinkles"];
  const WIDTHS = [230, 186, 142];

  C.booths.cake = {
    title: "The Big Tent",
    sub: "Build your very own birthday cake.",
    colors: ["#e2344f", "#ffcf6b"],
    icon: "🎂",
    mount(stage, api) {
      const { cfg, el, audio: A } = C;
      const booth = C.$("#booth");
      let step = 0, layers = [], frosting = FROSTING[0].c, topping = TOPPINGS[0], candles = 4;
      let mic = null, micRaf = null, timers = [], observers = [];
      const later = (fn, ms) => timers.push(setTimeout(fn, ms));

      /* ---------- curtains ---------- */
      const curtain = el("div", { class: "curtains" }, el("span", { class: "cur cur-l" }), el("span", { class: "cur cur-r" }),
        el("p", { class: "cur-title" }, el("span", { class: "t-script" }, "welcome to"), el("span", { class: "cur-big" }, "THE BIG TENT")));
      booth.append(curtain);
      later(() => { curtain.classList.add("open"); A.whoosh(); A.chime(); }, 900);
      later(() => curtain.remove(), 2600);

      /* ---------- scene ---------- */
      const scene = el("div", { class: "cake-scene" });
      const cake = el("div", { class: "cake" });
      const tops = el("div", { class: "toppings" });
      const plate = el("div", { class: "plate" });
      const empty = el("p", { class: "cake-empty" }, "tap a flavor below to start ↓");
      scene.append(empty, cake, plate);
      cake.append(tops);
      const tray = el("div", { class: "tray" });
      const prompt = el("div", { class: "wish", hidden: "" });
      stage.append(prompt, scene, tray);

      function renderCake() {
        C.$$(".layer", cake).forEach((l) => l.remove());
        empty.hidden = layers.length > 0;
        layers.forEach((c, i) => {
          const l = el("div", { class: "layer", style: `--c:${c};--w:${WIDTHS[i]}px;--f:${frosting}` });
          cake.insertBefore(l, tops);
        });
        renderCandles();
      }
      function renderCandles(lit) {
        C.$$(".candles", cake).forEach((c) => c.remove());
        const top = C.$$(".layer", cake).pop();
        if (!top || step < 3) return;
        const row = el("div", { class: "candles" });
        const make = (cls, label, style, text) => {
          const cd = el("button", { class: `candle${cls}${lit ? " lit" : ""}`, type: "button", "aria-label": label, style },
            text ? el("b", {}, text) : null, el("span", { class: "flame" }));
          cd.addEventListener("click", () => blowOut(cd));
          return cd;
        };
        const minis = Array.from({ length: candles }, (_, i) => make("", `Candle ${i + 1}`, `--h:${26 + (i % 2) * 6}px`));
        const half = Math.ceil(minis.length / 2);
        row.append(...minis.slice(0, half), make(" num", "Number candle 4", "", "4"), make(" num", "Number candle 8", "", "8"), ...minis.slice(half));
        top.append(row);
      }
      const recolorFrosting = () => C.$$(".layer", cake).forEach((l) => l.style.setProperty("--f", frosting));

      // topping placement
      cake.addEventListener("pointerdown", (e) => {
        if (step !== 2) return;
        const r = cake.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100, y = ((e.clientY - r.top) / r.height) * 100;
        if (C.$$(".tp", tops).length > 60) return;
        if (topping === "sprinkles") {
          const cols = ["#e2344f", "#ffcf6b", "#7fdcc6", "#fff", "#ff7a98", "#8e5bb5"];
          for (let i = 0; i < 10; i++)
            tops.append(el("span", { class: "tp sprinkle", style: `left:${x + C.rand(-6, 6)}%;top:${y + C.rand(-5, 5)}%;background:${cols[i % cols.length]};transform:rotate(${C.rand(0, 180)}deg)` }));
        } else {
          tops.append(el("span", { class: "tp", style: `left:${x}%;top:${y}%;transform:translate(-50%,-50%) rotate(${C.rand(-20, 20)}deg)` }, topping));
        }
        A.pop(Math.random() * 4);
      });

      /* ---------- tray steps ---------- */
      const STEPS = ["Stack your layers", "Pick the frosting", "Add toppings", "Little candles around the 48"];
      function renderTray() {
        tray.innerHTML = "";
        api.setSub(["Tap a flavor to add a layer (up to 3).", "Choose a frosting color.", "Pick a topping, then tap the cake to place it.", "Your 48 is on! Add little candles, then light them."][step]);
        tray.append(el("p", { class: "tray-step" }, `STEP ${step + 1} / 4`), el("h3", { class: "tray-title" }, STEPS[step]));
        const row = el("div", { class: "chips" });
        if (step === 0) {
          FLAVORS.forEach((f) => row.append(chip(f.name, f.c, () => {
            if (layers.length >= 3) { A.bad(); return; }
            layers.push(f.c); tops.innerHTML = ""; A.pop(layers.length); renderCake(); renderFoot();
          })));
          if (layers.length) row.append(el("button", { class: "chip undo", type: "button", onclick: () => { layers.pop(); tops.innerHTML = ""; A.tap(); renderCake(); renderFoot(); } }, "↶ undo"));
        } else if (step === 1) {
          FROSTING.forEach((f) => row.append(chip(f.name, f.c, () => { frosting = f.c; recolorFrosting(); A.pop(2); }, frosting === f.c)));
        } else if (step === 2) {
          TOPPINGS.forEach((t) => {
            const b = el("button", { class: `chip emoji${topping === t ? " on" : ""}`, type: "button" }, t === "sprinkles" ? "sprinkles" : t);
            b.onclick = () => { topping = t; C.$$(".chip", row).forEach((c) => c.classList.remove("on")); b.classList.add("on"); A.tap(); };
            row.append(b);
          });
          row.append(el("button", { class: "chip undo", type: "button", onclick: () => { tops.innerHTML = ""; A.tap(); } }, "clear"));
        } else if (step === 3) {
          const n = el("output", { class: "candle-count" }, String(candles));
          const set = (d) => { candles = Math.min(6, Math.max(0, candles + d)); n.textContent = candles; renderCandles(); A.tap(); };
          row.append(el("button", { class: "chip round", type: "button", "aria-label": "Fewer candles", onclick: () => set(-1) }, "−"), n,
            el("button", { class: "chip round", type: "button", "aria-label": "More candles", onclick: () => set(1) }, "+"));
        }
        tray.append(row);
        renderFoot();
      }
      function chip(label, color, fn, on) {
        const b = el("button", { class: `chip${on ? " on" : ""}`, type: "button" }, el("i", { style: `background:${color}` }), label);
        b.onclick = () => {
          if (step === 1) { b.parentElement.querySelectorAll(".chip").forEach((c) => c.classList.remove("on")); b.classList.add("on"); }
          fn();
        };
        return b;
      }
      function renderFoot() {
        api.foot.innerHTML = "";
        if (step > 0) api.foot.append(el("button", { class: "btn ghost", type: "button", onclick: () => { step--; renderCake(); renderTray(); } }, "← back"));
        if (step < 3) {
          const next = el("button", { class: "btn", type: "button", onclick: () => { step++; A.tap(); renderCake(); renderTray(); } }, "Next →");
          if (!layers.length) next.disabled = true, next.style.opacity = ".4";
          api.foot.append(next);
        } else {
          api.foot.append(el("button", { class: "btn", type: "button", onclick: light }, "Light the candles 🔥"));
        }
      }
      renderCake();
      renderTray();

      /* ---------- make a wish ---------- */
      function light() {
        step = 4;
        tray.remove();
        api.foot.innerHTML = "";
        renderCandles(true);
        C.music.hold();   // quiet room for the wish (and so the mic only hears her)
        booth.classList.add("dim");
        A.noise(0.5, 0.08, 0, 2000);
        api.setSub("Close your eyes. Make a wish.");
        prompt.hidden = false;
        prompt.innerHTML = "";
        const meter = el("div", { class: "meter", hidden: "" }, el("span", {}));
        const micBtn = el("button", { class: "btn", type: "button" }, "🎤 Blow into your phone");
        prompt.append(
          el("p", { class: "wish-line" }, `Make a wish, ${cfg.name}…`),
          el("p", { class: "wish-sub" }, "then blow out the candles!"),
          meter);
        api.foot.append(micBtn);
        api.foot.append(el("p", { class: "wish-alt" }, "or tap each flame to blow it out"));
        micBtn.onclick = async () => {
          try {
            A.init();
            A.session("play-and-record");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
            micBtn.remove();
            meter.hidden = false;
            listen(stream, meter.firstChild);
          } catch (e) {
            A.session("playback");
            micBtn.textContent = "Mic not available. Tap the flames!";
            micBtn.disabled = true;
          }
        };
      }

      function listen(stream, bar) {
        const ac = A.ctx;
        const src = ac.createMediaStreamSource(stream), an = ac.createAnalyser();
        an.fftSize = 1024;
        src.connect(an);
        mic = { stream, src };
        const buf = new Uint8Array(an.frequencyBinCount);
        const t0 = performance.now();
        let base = 0, samples = 0, over = 0;
        (function tick() {
          micRaf = requestAnimationFrame(tick);
          an.getByteFrequencyData(buf);
          let s = 0;
          for (let i = 1; i < 24; i++) s += buf[i];
          const lvl = s / 23 / 255;
          if (performance.now() - t0 < 700) { base += lvl; samples++; bar.style.width = "0%"; return; }
          const floor = samples ? base / samples : 0;
          const thr = Math.max(0.3, floor + 0.22);
          bar.style.width = `${Math.min(100, (lvl / thr) * 70)}%`;
          bar.classList.toggle("hot", lvl > thr);
          if (lvl > thr) {
            if (++over % 7 === 0) {
              const lit = C.$$(".candle.lit", cake);
              if (lit.length) blowOut(lit[Math.floor(Math.random() * lit.length)]);
            }
            C.$$(".flame", cake).forEach((f) => f.classList.add("windy"));
          } else {
            C.$$(".flame", cake).forEach((f) => f.classList.remove("windy"));
          }
        })();
      }
      function stopMic() {
        cancelAnimationFrame(micRaf);
        if (mic) {
          mic.stream.getTracks().forEach((t) => t.stop());
          try { mic.src.disconnect(); } catch (e) {}
          mic = null;
          A.session("playback");
          if (A.ctx && A.ctx.state !== "running") A.ctx.resume();
        }
      }

      function blowOut(cd) {
        if (step !== 4 || !cd.classList.contains("lit")) return;
        cd.classList.remove("lit");
        cd.classList.add("out");
        A.noise(0.25, 0.08, 0, 900);
        if (!C.$$(".candle.lit", cake).length) celebrate();
      }

      /* ---------- the celebration ---------- */
      function celebrate() {
        step = 5;
        stopMic();
        api.foot.innerHTML = "";
        prompt.innerHTML = "";
        later(() => {
          booth.classList.remove("dim");
          booth.classList.add("party");
          api.setSub("");
          prompt.append(el("h2", { class: "marquee-title hb" },
            el("span", { class: "t-script" }, "Happy"),
            el("span", { class: "t-bulbs", "data-text": "BIRTHDAY" }, "BIRTHDAY"),
            el("span", { class: "t-serif" }, `${cfg.name}!`)));
          C.fx.rain(220);
          C.fx.show(9);
          const songLen = A.birthday();
          later(() => C.music.release(), songLen * 1000 + 600);
          C.store.data.done.includes("cake") || C.store.data.done.push("cake");
          C.store.save();
          later(() => {
            api.foot.append(el("button", { class: "btn", type: "button", onclick: openLetter }, "A letter for you 💌"));
          }, Math.min(songLen * 1000, 4500));
        }, 700);
      }

      function openLetter() {
        A.whoosh();
        api.foot.innerHTML = "";
        api.setSub("");
        stage.innerHTML = "";
        stage.scrollTop = 0;
        const env = el("div", { class: "envelope" },
          el("div", { class: "env-back" }),
          el("div", { class: "letter" }),
          el("div", { class: "env-front" }),
          el("div", { class: "env-flap" }),
          el("span", { class: "env-seal" }, "♥"));
        stage.append(env);
        const lines = cfg.letter || [];
        const card = el("article", { class: "letter-card" });
        lines.forEach((ln, i) => card.append(el(i === 0 ? "h3" : "p", { style: `animation-delay:${0.7 + i * 0.55}s` }, ln)));
        const sig = el("p", { class: "sig", style: `animation-delay:${0.7 + lines.length * 0.55}s` }, cfg.from);
        card.append(sig);
        later(() => { env.classList.add("open"); A.tone(880, 0.3, "sine", 0.12); }, 400);
        later(() => env.classList.add("out"), 1200);
        later(() => env.classList.add("gone"), 2100);
        later(() => { env.replaceWith(card); A.chime(); }, 2700);
        // the last button only shows up once she has read down to the signature
        let shown = false, ready = false, seen = false;
        const reveal = () => {
          if (shown || !ready || !seen) return;
          shown = true;
          api.foot.append(el("button", { class: "btn", type: "button", onclick: finalGift }, "One last surprise →"));
        };
        later(() => { ready = true; reveal(); }, 3600 + lines.length * 550);
        const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { seen = true; reveal(); io.disconnect(); } }, { root: stage, threshold: 0.6 });
        later(() => io.observe(sig), 2800);
        observers.push(io);
      }

      function finalGift() {
        A.chime();
        api.foot.innerHTML = "";
        stage.innerHTML = "";
        const card = el("div", { class: "gift" },
          el("div", { class: "gift-box", "aria-hidden": "true" }, el("span", { class: "gift-lid" }), el("span", { class: "gift-body" })),
          el("p", { class: "gift-text" }, cfg.finalGift || ""),
          el("p", { class: "gift-sign" }, `Happy birthday, ${cfg.name}. I love you.`));
        stage.append(card);
        later(() => {
          card.classList.add("open");
          C.fx.burst(innerWidth / 2, innerHeight * 0.4, 160, 1.3);
          C.fx.show(5);
        }, 500);
        later(() => {
          api.foot.append(
            el("button", { class: "btn ghost", type: "button", onclick: () => { C.music.hold(); setTimeout(() => C.music.release(), A.birthday() * 1000 + 600); } }, "♪ replay song"),
            el("button", { class: "btn", type: "button", onclick: () => C.booth.close() }, "Back to carnival"));
        }, 2200);
      }

      return () => {
        stopMic();
        timers.forEach(clearTimeout);
        observers.forEach((o) => o.disconnect());
        C.music.release();
        curtain.remove();
        booth.classList.remove("dim", "party");
        C.map.refresh(false);
      };
    }
  };
})();
