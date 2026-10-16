/* ==========================================================================
   BOOTH 04 · Claw Machine — grab capsules, open messages from the family
   ========================================================================== */
(() => {
  const CAP = 54, RAIL = 14, GRIP = 26;
  const COLORS = ["#e2344f", "#ffcf6b", "#7fdcc6", "#ff7a98", "#b78cff", "#fff3dc"];

  C.booths.claw = {
    title: "Claw of Love",
    sub: "Move with ◀ ▶, then hit DROP to grab a capsule.",
    colors: ["#ff7a98", "#fff3dc"],
    icon: "🧸",
    mount(stage, api) {
      const { cfg, el, audio: A } = C;
      const msgs = (cfg.familyMessages || []).length ? cfg.familyMessages : [{ from: "Everyone", text: "We love you!" }];
      const total = msgs.length;
      let opened = 0, misses = 0;

      const machine = el("div", { class: "claw-machine" });
      const top = el("div", { class: "cm-top" }, el("span", {}, "CLAW · OF · LOVE"));
      const glass = el("div", { class: "cm-glass" });
      const rail = el("div", { class: "cm-rail" });
      const claw = el("div", { class: "cm-claw" });
      const cable = el("div", { class: "cm-cable" });
      const head = el("div", { class: "cm-head", html: `
        <svg viewBox="0 0 60 52" aria-hidden="true">
          <g class="prong prong-l"><path d="M24 14 L10 34 Q8 44 16 50" fill="none" stroke="#c9cbd3" stroke-width="4" stroke-linecap="round"/></g>
          <g class="prong prong-r"><path d="M36 14 L50 34 Q52 44 44 50" fill="none" stroke="#c9cbd3" stroke-width="4" stroke-linecap="round"/></g>
          <rect x="18" y="0" width="24" height="18" rx="5" fill="#ffcf6b"/>
          <circle cx="30" cy="9" r="4" fill="#e2344f"/>
        </svg>` });
      claw.append(cable, head);
      const chute = el("div", { class: "cm-chute" }, el("span", {}, "PRIZE"));
      glass.append(rail, chute);
      // background pile (decor only)
      for (let i = 0; i < 9; i++) {
        glass.append(el("div", { class: "cap decor", style: `--c:${COLORS[i % COLORS.length]};left:${24 + i * 9}%;bottom:${30 + (i % 3) * 10}px;transform:rotate(${i * 40}deg) scale(.85)` }));
      }
      const caps = msgs.map((m, i) => {
        const c = el("div", { class: "cap", style: `--c:${COLORS[i % COLORS.length]}` }, el("span", {}, "♥"));
        glass.append(c);
        return { el: c, msg: m, taken: false, x: 0 };
      });
      glass.append(claw);

      const left = el("button", { class: "cm-btn", type: "button", "aria-label": "Move left" }, "◀");
      const right = el("button", { class: "cm-btn", type: "button", "aria-label": "Move right" }, "▶");
      const drop = el("button", { class: "cm-drop", type: "button" }, "DROP");
      const panel = el("div", { class: "cm-panel" }, el("div", { class: "cm-arrows" }, left, right), drop);
      machine.append(top, glass, panel);
      stage.append(machine);

      const booth = C.$("#booth");
      let reveal = null;

      let GW = 300, GH = 320, x = 150, cableLen = 24, open = 28, dir = 0, phase = "idle", timer = 0, holding = null, raf, last = 0;
      const REST = 24;
      const chuteX = () => GW * 0.12;
      const floorCable = () => GH - 12 - CAP - GRIP - RAIL;

      function layout() {
        GW = glass.clientWidth; GH = glass.clientHeight;
        const usable = GW * 0.76, start = GW * 0.26;
        caps.forEach((c, i) => {
          c.x = start + (usable * (i + 0.5)) / caps.length;
          if (!c.taken) { c.el.style.left = `${c.x - CAP / 2}px`; c.el.style.top = `${GH - 12 - CAP}px`; }
        });
        x = Math.min(Math.max(x, GW * 0.1), GW * 0.92);
      }
      layout();
      addEventListener("resize", layout);

      const setSub = () => api.setSub(`${opened} of ${total} capsules opened · move with ◀ ▶ then DROP`);
      setSub();

      const hold = (btn, d) => {
        const on = (e) => { e.preventDefault(); if (phase === "idle") dir = d; };
        const off = () => { if (dir === d) dir = 0; };
        btn.addEventListener("pointerdown", on);
        ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, off));
      };
      hold(left, -1); hold(right, 1);
      const doDrop = () => { if (phase !== "idle" || reveal) return; dir = 0; phase = "down"; A.tone(300, 0.6, "sawtooth", 0.05, 0, 160); };
      drop.addEventListener("click", doDrop);
      const onKey = (e) => {
        if (reveal) return;
        if (e.key === "ArrowLeft") dir = -1;
        else if (e.key === "ArrowRight") dir = 1;
        else if (e.code === "Space" || e.key === "Enter" || e.key === "ArrowDown") { e.preventDefault(); doDrop(); }
      };
      const onKeyUp = (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") dir = 0; };
      document.addEventListener("keydown", onKey);
      document.addEventListener("keyup", onKeyUp);

      function grab() {
        const tol = misses >= 2 ? CAP * 1.6 : CAP * 0.6;
        let best = null, bd = tol;
        caps.forEach((c) => {
          if (c.taken) return;
          const d = Math.abs(c.x - x);
          if (d < bd) { bd = d; best = c; }
        });
        if (best) {
          holding = best; best.taken = true;
          best.el.classList.add("held");
          if (misses >= 2) C.toast(glass, "lucky claw! ✨");
          misses = 0;
          A.good();
        } else {
          misses++;
          C.toast(glass, misses >= 2 ? "so close! next one's lucky…" : "so close!");
          A.bad();
        }
      }

      function step(dt) {
        if (phase === "idle") {
          if (dir) x = Math.min(Math.max(x + dir * 3.2 * dt, GW * 0.1), GW * 0.92);
          open = Math.min(28, open + dt * 2);
        } else if (phase === "down") {
          cableLen += 4.5 * dt;
          if (cableLen >= floorCable()) { cableLen = floorCable(); phase = "grip"; timer = 22; }
        } else if (phase === "grip") {
          open = Math.max(holding ? 10 : 3, open - 2.4 * dt);
          if ((timer -= dt) <= 0) { grab(); phase = "up"; }
        } else if (phase === "up") {
          cableLen -= 3.6 * dt;
          if (cableLen <= REST) { cableLen = REST; phase = holding ? "carry" : "idle"; }
        } else if (phase === "carry") {
          const d = chuteX() - x;
          x += Math.sign(d) * Math.min(Math.abs(d), 3.4 * dt);
          if (Math.abs(d) < 1) { phase = "release"; timer = 18; }
        } else if (phase === "release") {
          open = Math.min(30, open + 3 * dt);
          if ((timer -= dt) <= 0 && holding) {
            const c = holding;
            holding = null;
            c.el.classList.remove("held");
            c.el.classList.add("falling");
            A.whoosh();
            setTimeout(() => { c.el.remove(); showReveal(c); }, 520);
            phase = "wait";
          }
        }
      }

      function render() {
        claw.style.transform = `translateX(${x - 30}px)`;
        cable.style.height = `${cableLen}px`;
        head.style.setProperty("--o", `${open}deg`);
        if (holding) {
          holding.el.style.left = `${x - CAP / 2}px`;
          holding.el.style.top = `${RAIL + cableLen + GRIP - 4}px`;
        }
      }

      function loop(t) {
        raf = requestAnimationFrame(loop);
        const dt = last ? Math.min(2.5, (t - last) / 16.67) : 1;
        last = t;
        step(dt);
        render();
      }
      raf = requestAnimationFrame(loop);

      function showReveal(c) {
        opened++;
        setSub();
        A.chime();
        C.fx.burst(innerWidth / 2, innerHeight * 0.45, 50, 0.8);
        const m = c.msg;
        const capsule = el("div", { class: "rv-capsule", style: `--c:${c.el.style.getPropertyValue("--c")}` },
          el("span", { class: "rv-top" }), el("span", { class: "rv-bot" }));
        const note = el("article", { class: "note", style: `--tilt:${opened % 2 ? -2 : 1.5}deg` },
          el("h3", {}, `from ${m.from}`), el("p", {}, m.text || ""));
        if (m.audio) {
          const au = el("audio", { src: m.audio, preload: "auto" });
          const play = el("button", { class: "btn ghost rv-play", type: "button" }, "▶ play voice note");
          play.onclick = () => { if (au.paused) { au.play(); play.textContent = "❚❚ pause"; } else { au.pause(); play.textContent = "▶ play voice note"; } };
          au.onended = () => (play.textContent = "▶ play again");
          note.append(play, au);
        }
        const last = opened >= total;
        const btn = el("button", { class: "btn", type: "button" }, last ? "That's all of them ♥" : "Grab another →");
        reveal = el("div", { class: "claw-reveal" }, capsule, note, btn);
        booth.append(reveal);
        btn.onclick = () => {
          reveal.querySelectorAll("audio").forEach((a) => a.pause());
          reveal.remove(); reveal = null;
          phase = "idle";
          if (last) api.win();
        };
      }

      return () => {
        cancelAnimationFrame(raf);
        removeEventListener("resize", layout);
        document.removeEventListener("keydown", onKey);
        document.removeEventListener("keyup", onKeyUp);
        if (reveal) reveal.remove();
      };
    }
  };
})();
