/* ==========================================================================
   BOOTH 02 · Stargazing Tent — connect the stars, unlock a memory
   ========================================================================== */
(() => {
  const SHAPES = [
    { // heart
      pts: [[.5, .34], [.37, .2], [.2, .22], [.12, .4], [.24, .6], [.5, .84], [.76, .6], [.88, .4], [.8, .22], [.63, .2]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 0]]
    },
    { // M
      pts: [[.16, .82], [.22, .2], [.5, .6], [.78, .2], [.84, .82]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4]]
    },
    { // star
      pts: [0, 1, 2, 3, 4].map((i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        return [.5 + Math.cos(a) * .36, .54 + Math.sin(a) * .36];
      }),
      edges: [[0, 2], [2, 4], [4, 1], [1, 3], [3, 0]]
    }
  ];

  C.booths.stars = {
    title: "Stargazing Tent",
    sub: "Connect the bright stars. Tap one, then the next.",
    colors: ["#2b2a6e", "#fff3dc"],
    icon: "🔭",
    mount(stage, api) {
      const { cfg, el, audio: A } = C;
      const memories = cfg.memories || [];
      let level = 0, raf, sel = -1, drawn = new Set(), ptr = null, dragging = false, doneAt = 0;

      const wrap = el("div", { class: "scope-wrap" });
      const cv = el("canvas", { class: "scope", "aria-label": "Star map. Tap stars to connect them." });
      const out = el("div", { class: "scope-out" });
      wrap.append(cv);
      stage.append(wrap, out);
      const cx = cv.getContext("2d");

      let S = 320;
      const bg = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.1 + .2, p: Math.random() * 6 }));
      function size() {
        S = Math.min(stage.clientWidth - 60, 420, innerHeight * 0.52);   // room for the brass rim
        const d = Math.min(devicePixelRatio || 1, 2);
        cv.width = S * d; cv.height = S * d;
        cv.style.width = cv.style.height = `${S}px`;
        cx.setTransform(d, 0, 0, d, 0, 0);
      }
      size();
      addEventListener("resize", size);

      const shape = () => SHAPES[level];
      const P = (i) => ({ x: shape().pts[i][0] * S, y: shape().pts[i][1] * S });
      const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
      const remaining = (i) => shape().edges.some(([a, b]) => (a === i || b === i) && !drawn.has(key(a, b)));
      const complete = () => drawn.size === shape().edges.length;

      function setSub() {
        api.setSub(`Constellation ${level + 1} of ${SHAPES.length} · tap a star, then the next one`);
      }
      setSub();

      function hit(x, y) {
        let best = -1, bd = 34;
        shape().pts.forEach((_, i) => {
          const p = P(i), d = Math.hypot(p.x - x, p.y - y);
          if (d < bd) { bd = d; best = i; }
        });
        return best;
      }
      const local = (e) => {
        const r = cv.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };

      function connect(a, b) {
        const k = key(a, b);
        const ok = shape().edges.some(([x, y]) => key(x, y) === k);
        if (ok && !drawn.has(k)) {
          drawn.add(k);
          A.tone(440 * Math.pow(2, drawn.size / 7), 0.4, "sine", 0.22);
          if (complete()) finish();
        } else if (!ok) {
          A.tone(200, 0.12, "triangle", 0.12);
        }
        sel = complete() ? -1 : b;
      }

      cv.addEventListener("pointerdown", (e) => {
        if (complete()) return;
        const p = local(e), i = hit(p.x, p.y);
        ptr = p;
        if (i < 0) { sel = -1; return; }
        cv.setPointerCapture(e.pointerId);
        if (sel >= 0 && i !== sel) connect(sel, i);
        else { sel = i; A.tap(); }
        dragging = true;
      });
      cv.addEventListener("pointermove", (e) => { ptr = local(e); });
      cv.addEventListener("pointerup", (e) => {
        if (dragging && sel >= 0) {
          const p = local(e), i = hit(p.x, p.y);
          if (i >= 0 && i !== sel) connect(sel, i);
        }
        dragging = false;
      });

      function finish() {
        doneAt = performance.now();
        A.chime();
        const r = cv.getBoundingClientRect();
        C.fx.burst(r.left + r.width / 2, r.top + r.height / 2, 50, 0.7);
        const m = memories[level] || { title: "A memory", text: "" };
        out.innerHTML = "";
        const note = el("article", { class: "note", style: `--tilt:${level % 2 ? 1.5 : -1.5}deg` },
          el("h3", {}, m.title), el("p", {}, m.text));
        out.append(note);
        setTimeout(() => out.scrollIntoView({ behavior: "smooth", block: "nearest" }), 300);
        api.foot.innerHTML = "";
        if (level < SHAPES.length - 1) {
          api.foot.append(el("button", { class: "btn", type: "button", onclick: next }, "Next constellation →"));
        } else {
          api.win();
        }
      }
      function next() {
        level++; drawn = new Set(); sel = -1; doneAt = 0;
        out.innerHTML = ""; api.foot.innerHTML = "";
        setSub();
        A.whoosh();
      }

      function draw(t) {
        raf = requestAnimationFrame(draw);
        cx.clearRect(0, 0, S, S);
        // telescope lens
        const g = cx.createRadialGradient(S / 2, S / 2, S * 0.1, S / 2, S / 2, S / 2);
        g.addColorStop(0, "#1b1640"); g.addColorStop(0.8, "#0e0b24"); g.addColorStop(1, "#06050f");
        cx.fillStyle = g;
        cx.beginPath(); cx.arc(S / 2, S / 2, S / 2, 0, 6.283); cx.fill();
        cx.save();
        cx.beginPath(); cx.arc(S / 2, S / 2, S / 2 - 2, 0, 6.283); cx.clip();
        cx.fillStyle = "#fff3dc";
        for (const s of bg) {
          cx.globalAlpha = 0.25 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.0015 + s.p));
          cx.beginPath(); cx.arc(s.x * S, s.y * S, s.r, 0, 6.283); cx.fill();
        }
        cx.globalAlpha = 1;

        const glowAmt = doneAt ? Math.min(1, (t - doneAt) / 700) : 0;
        // drawn lines
        cx.lineCap = "round";
        cx.shadowColor = "#ffcf6b";
        cx.shadowBlur = 10 + glowAmt * 14;
        cx.strokeStyle = glowAmt ? `rgba(255,242,196,${0.85 + glowAmt * 0.15})` : "#ffcf6b";
        cx.lineWidth = 2.4 + glowAmt * 1.2;
        shape().edges.forEach(([a, b]) => {
          if (!drawn.has(key(a, b))) return;
          const p = P(a), q = P(b);
          cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(q.x, q.y); cx.stroke();
        });
        // rubber band
        if (sel >= 0 && dragging && ptr) {
          const p = P(sel);
          cx.shadowBlur = 0;
          cx.setLineDash([4, 6]);
          cx.strokeStyle = "rgba(255,207,107,.6)"; cx.lineWidth = 1.5;
          cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(ptr.x, ptr.y); cx.stroke();
          cx.setLineDash([]);
        }
        // stars
        shape().pts.forEach((_, i) => {
          const p = P(i), live = remaining(i);
          const pulse = live ? 0.5 + 0.5 * Math.sin(t * 0.005 + i) : 0;
          cx.shadowColor = "#fff2c4";
          cx.shadowBlur = 12 + pulse * 10;
          cx.fillStyle = "#fff8e6";
          cx.beginPath(); cx.arc(p.x, p.y, 4.5 + pulse * 1.5 + glowAmt * 1.5, 0, 6.283); cx.fill();
          if (i === sel) {
            cx.shadowBlur = 0;
            cx.strokeStyle = "#ffcf6b"; cx.lineWidth = 2;
            cx.beginPath(); cx.arc(p.x, p.y, 13 + Math.sin(t * 0.01) * 2, 0, 6.283); cx.stroke();
          }
        });
        cx.shadowBlur = 0;
        if (glowAmt) {
          cx.globalAlpha = glowAmt;
          cx.fillStyle = "#fff2c4";
          cx.font = `italic 300 ${Math.round(S * 0.075)}px Fraunces, serif`;
          cx.textAlign = "center";
          cx.fillText((memories[level] || {}).title || "", S / 2, S * 0.96);
          cx.globalAlpha = 1;
        }
        cx.restore();
        // brass rim
        cx.strokeStyle = "#d9932c"; cx.lineWidth = 3;
        cx.beginPath(); cx.arc(S / 2, S / 2, S / 2 - 1.5, 0, 6.283); cx.stroke();
      }
      raf = requestAnimationFrame(draw);

      return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); };
    }
  };
})();
