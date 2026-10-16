/* ==========================================================================
   BOOTH 06 · Trivia Wheel — spin, land on a question, pick the answer
   ========================================================================== */
(() => {
  C.booths.wheel = {
    title: "Trivia Wheel",
    sub: "Spin the wheel and answer the question!",
    colors: ["#e2344f", "#fff3dc"],
    icon: "🎡",
    mount(stage, api) {
      const { cfg, el, audio: A } = C;
      const hunts = (cfg.quiz || []).length ? cfg.quiz
        : [{ label: "Love", q: "Who loves you the most?", options: ["Everyone"], answer: "any", yay: "Yes!" }];
      // at least 6 slices so the wheel looks full
      const slices = [];
      while (slices.length < 6 || slices.length % hunts.length) slices.push(slices.length % hunts.length);
      const N = slices.length, SEG = (Math.PI * 2) / N;
      const FILL = ["#e2344f", "#fff3dc", "#ffcf6b", "#5a1d47", "#ff7a98", "#7fdcc6"];
      const found = new Set();

      const wrap = el("div", { class: "wheel-wrap" });
      const cv = el("canvas", { class: "wheel-cv", "aria-hidden": "true" });
      const pointer = el("div", { class: "wheel-pointer", "aria-hidden": "true" });
      const spinBtn = el("button", { class: "wheel-hub", type: "button" }, "SPIN");
      wrap.append(cv, pointer, spinBtn);
      const out = el("div", { class: "wheel-out" });
      stage.append(wrap, out);
      const cx = cv.getContext("2d");

      let S = 320, angle = 0, spinning = false, raf;
      function size() {
        S = Math.min(stage.clientWidth - 40, 380, innerHeight * 0.5);
        const d = Math.min(devicePixelRatio || 1, 2);
        cv.width = cv.height = S * d;
        wrap.style.width = wrap.style.height = `${S}px`;
        cx.setTransform(d, 0, 0, d, 0, 0);
      }
      size();
      addEventListener("resize", size);

      const setSub = () => api.setSub(`${found.size} of ${hunts.length} questions answered · spin the wheel!`);
      setSub();

      function draw(t) {
        raf = requestAnimationFrame(draw);
        const R = S / 2;
        cx.clearRect(0, 0, S, S);
        cx.save();
        cx.translate(R, R);
        // rim
        cx.fillStyle = "#2a1530";
        cx.beginPath(); cx.arc(0, 0, R - 2, 0, 6.283); cx.fill();
        cx.rotate(angle);
        for (let i = 0; i < N; i++) {
          const h = slices[i], done = found.has(h);
          const a0 = i * SEG - Math.PI / 2 - SEG / 2;
          cx.beginPath(); cx.moveTo(0, 0); cx.arc(0, 0, R - 16, a0, a0 + SEG); cx.closePath();
          cx.fillStyle = FILL[i % FILL.length];
          cx.globalAlpha = done ? 0.35 : 1;
          cx.fill();
          cx.globalAlpha = 1;
          cx.strokeStyle = "rgba(42,21,48,.5)"; cx.lineWidth = 1.5; cx.stroke();
          cx.save();
          cx.rotate(a0 + SEG / 2);
          const dark = ["#fff3dc", "#ffcf6b", "#7fdcc6"].includes(FILL[i % FILL.length]);
          cx.fillStyle = dark ? "#2a1530" : "#fff3dc";
          cx.textAlign = "right"; cx.textBaseline = "middle";
          cx.font = `${Math.round(S * 0.052)}px "Bagel Fat One", sans-serif`;
          cx.fillText(done ? "✓" : hunts[h].label, R - 30, 0);
          cx.restore();
        }
        cx.restore();
        // bulbs on the rim
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * 6.283, on = (Math.floor(t / (spinning ? 90 : 400)) + i) % 2;
          cx.fillStyle = on ? "#fff2c4" : "#8a5a2a";
          cx.shadowColor = "#ffcf6b"; cx.shadowBlur = on ? 10 : 0;
          cx.beginPath(); cx.arc(R + Math.cos(a) * (R - 9), R + Math.sin(a) * (R - 9), 3.4, 0, 6.283); cx.fill();
        }
        cx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(draw);

      function spin() {
        if (spinning) return;
        const left = hunts.map((_, i) => i).filter((i) => !found.has(i));
        if (!left.length) return;
        const target = left[Math.floor(Math.random() * left.length)];
        const options = slices.map((h, i) => (h === target ? i : -1)).filter((i) => i >= 0);
        const slot = options[Math.floor(Math.random() * options.length)];
        // slice `slot` is centred at angle slot*SEG (from the top) — rotate it back to the pointer
        const jitter = C.rand(-SEG * 0.3, SEG * 0.3);
        const base = -slot * SEG + jitter;
        const now = angle % (Math.PI * 2);
        let delta = base - now;
        while (delta < 0) delta += Math.PI * 2;
        const from = angle, to = angle + delta + Math.PI * 2 * 5, dur = 4600, t0 = performance.now();
        spinning = true;
        out.innerHTML = "";
        api.foot.innerHTML = "";
        let lastTick = Math.floor(from / SEG);
        A.whoosh();
        const ease = (x) => 1 - Math.pow(1 - x, 4);
        (function anim(now) {
          const p = Math.min(1, (now - t0) / dur);
          angle = from + (to - from) * ease(p);
          const tick = Math.floor((angle + SEG / 2) / SEG);
          if (tick !== lastTick) { lastTick = tick; A.tone(1400, 0.03, "square", 0.05); }
          if (p < 1) requestAnimationFrame(anim);
          else { spinning = false; land(target); }
        })(t0);
      }
      spinBtn.addEventListener("click", spin);

      function land(h) {
        A.chime();
        const item = hunts[h];
        const card = el("article", { class: "note quiz", style: "--tilt:-1deg" },
          el("h3", {}, item.q));
        const opts = el("div", { class: "quiz-opts" });
        const msg = el("p", { class: "quiz-msg" });
        let solved = false;
        (item.options || []).forEach((label, i) => {
          const b = el("button", { class: "quiz-opt", type: "button" },
            el("span", { class: "quiz-key" }, "ABCDEF"[i]), label);
          b.onclick = () => {
            if (solved) return;
            const right = item.answer === "any" || item.answer === i;
            if (right) {
              solved = true;
              b.classList.add("right");
              msg.textContent = item.yay || "Correct!";
              msg.className = "quiz-msg yes";
              A.good();
              const r = b.getBoundingClientRect();
              C.fx.burst(r.left + r.width / 2, r.top + r.height / 2, 60, 0.8);
              found.add(h);
              setSub();
              if (found.size >= hunts.length) {
                api.win();
              } else {
                api.foot.append(el("button", { class: "btn", type: "button", onclick: () => { out.innerHTML = ""; api.foot.innerHTML = ""; spin(); } }, "Spin again →"));
              }
            } else {
              b.classList.add("wrong");
              b.disabled = true;
              msg.textContent = ["Nope! Try again 😜", "Not quite… guess again!", "Hmm, are you sure? 👀"][Math.floor(Math.random() * 3)];
              msg.className = "quiz-msg no";
              A.bad();
            }
          };
          opts.append(b);
        });
        card.append(opts, msg);
        out.append(card);
        setTimeout(() => card.scrollIntoView({ behavior: "smooth", block: "nearest" }), 200);
      }

      return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); };
    }
  };
})();
