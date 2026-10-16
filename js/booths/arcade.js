/* ==========================================================================
   BOOTH 03 · Arcade Cabinet — "Mommy Run", collect hearts, unlock photos
   ========================================================================== */
(() => {
  const GOAL = 8;
  const HAZARDS = ["🧺", "⏰", "🍳", "🧹", "🧦"];

  C.booths.arcade = {
    title: "Arcade Cabinet",
    sub: `Tap to jump (tap twice to double jump). Collect ${GOAL} hearts!`,
    colors: ["#7fdcc6", "#e2344f"],
    icon: "🕹️",
    mount(stage, api) {
      const { cfg, el, audio: A } = C;
      const cab = el("div", { class: "cabinet" });
      const marquee = el("div", { class: "cab-marquee" }, el("span", {}, `${cfg.name.toUpperCase()} RUN`));
      const screen = el("div", { class: "cab-screen" });
      const cv = el("canvas", { "aria-label": "Arcade game. Tap to jump." });
      const jump = el("button", { class: "cab-jump", type: "button", "aria-label": "Jump" }, "JUMP");
      const deck = el("div", { class: "cab-deck" }, el("span", { class: "cab-stick", "aria-hidden": "true" }), jump, el("span", { class: "cab-coin", "aria-hidden": "true" }, "INSERT LOVE"));
      screen.append(cv);
      cab.append(marquee, screen, deck);
      const gallery = el("div", { class: "arcade-gallery" });
      stage.append(cab, gallery);
      const cx = cv.getContext("2d");

      const face = new Image();
      let faceOk = false;
      face.onload = () => (faceOk = true);
      face.src = cfg.faceImage;

      let W, H, k, ground;
      function size() {
        W = Math.min(stage.clientWidth - 84, 560);   // stage padding + cabinet frame
        H = Math.round(Math.max(240, Math.min(W * 0.66, 340)));
        const d = Math.min(devicePixelRatio || 1, 2);
        cv.width = W * d; cv.height = H * d;
        cv.style.width = `${W}px`; cv.style.height = `${H}px`;
        cx.setTransform(d, 0, 0, d, 0, 0);
        k = H / 300;
        ground = H - 46 * k;
      }
      size();
      addEventListener("resize", size);

      // world
      let state = "ready", raf, last = 0, t0 = 0;
      const pl = { x: 0, y: 0, vy: 0, jumps: 0, hurt: 0 };
      let items = [], hearts = 0, speed, spawnIn = 0, dist = 0;
      const tents = Array.from({ length: 6 }, (_, i) => ({ x: i * 120, h: C.rand(40, 80), c: i % 2 ? "#3a1b4f" : "#2b1440" }));

      function reset() {
        pl.x = 70 * k; pl.y = ground; pl.vy = 0; pl.jumps = 0; pl.hurt = 0;
        items = []; hearts = 0; speed = 4.2; spawnIn = 60; dist = 0;
      }
      reset();

      function doJump() {
        if (state === "ready") { state = "play"; A.good(); return; }
        if (state !== "play") return;
        if (pl.jumps < 2) {
          pl.vy = (pl.jumps ? -10.5 : -12.5) * k;
          pl.jumps++;
          A.tone(pl.jumps === 1 ? 520 : 780, 0.12, "square", 0.08, 0, pl.jumps === 1 ? 900 : 1200);
        }
      }
      cv.addEventListener("pointerdown", (e) => { e.preventDefault(); doJump(); });
      jump.addEventListener("pointerdown", (e) => { e.preventDefault(); doJump(); });
      const onKey = (e) => { if (e.code === "Space" || e.key === "ArrowUp") { e.preventDefault(); doJump(); } };
      document.addEventListener("keydown", onKey);

      function spawn() {
        const r = Math.random();
        const hz = 34 * k;
        if (r < 0.5) {
          items.push({ type: "hz", x: W + 20, y: ground, s: hz, e: HAZARDS[Math.floor(Math.random() * HAZARDS.length)] });
          if (Math.random() < 0.6) items.push({ type: "heart", x: W + 20, y: ground - C.rand(90, 120) * k, s: 15 * k });
        } else {
          items.push({ type: "heart", x: W + 20, y: ground - (Math.random() < 0.5 ? 26 : C.rand(70, 130)) * k, s: 15 * k });
        }
        spawnIn = C.rand(55, 95) / (speed / 4.2);
      }

      function heartPath(x, y, s) {
        cx.beginPath();
        cx.moveTo(x, y + s * 0.35);
        cx.bezierCurveTo(x, y - s * 0.3, x - s, y - s * 0.3, x - s, y + s * 0.15);
        cx.bezierCurveTo(x - s, y + s * 0.6, x - s * 0.2, y + s * 0.85, x, y + s * 1.1);
        cx.bezierCurveTo(x + s * 0.2, y + s * 0.85, x + s, y + s * 0.6, x + s, y + s * 0.15);
        cx.bezierCurveTo(x + s, y - s * 0.3, x, y - s * 0.3, x, y + s * 0.35);
        cx.closePath();
      }

      function update(dt) {
        dist += speed * dt;
        speed = Math.min(7.2, 4.2 + dist / 4000);
        pl.vy += 0.68 * k * dt;
        pl.y += pl.vy * dt;
        if (pl.y >= ground) { pl.y = ground; pl.vy = 0; pl.jumps = 0; }
        if (pl.hurt > 0) pl.hurt -= dt;
        if ((spawnIn -= dt) <= 0) spawn();
        const R = 22 * k, px = pl.x, py = pl.y - R;
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.x -= speed * k * dt;
          if (it.x < -40) { items.splice(i, 1); continue; }
          if (it.type === "heart") {
            if (Math.hypot(it.x - px, it.y + it.s * 0.4 - py) < R + it.s) {
              items.splice(i, 1);
              hearts++;
              A.pop(hearts);
              if (hearts >= GOAL) win();
            }
          } else if (pl.hurt <= 0) {
            const hx = it.x, hy = it.y - it.s * 0.45;
            if (Math.abs(hx - px) < R * 0.6 + it.s * 0.38 && Math.abs(hy - py) < R * 0.6 + it.s * 0.38) {
              pl.hurt = 70;
              if (hearts > 0) hearts--;
              A.bad();
              if (navigator.vibrate) navigator.vibrate(60);
              C.toast(screen, ["oops!", "ouch!", "careful, mommy!"][Math.floor(Math.random() * 3)]);
            }
          }
        }
      }

      function draw(t) {
        // sky
        const g = cx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#150f30"); g.addColorStop(1, "#4a1d47");
        cx.fillStyle = g; cx.fillRect(0, 0, W, H);
        // moon
        cx.fillStyle = "#fff2c4"; cx.shadowColor = "#fff2c4"; cx.shadowBlur = 20;
        cx.beginPath(); cx.arc(W - 50 * k, 46 * k, 18 * k, 0, 6.283); cx.fill();
        cx.shadowBlur = 0;
        // distant tents (parallax)
        const off = (dist * 0.25 * k) % 120;
        tents.forEach((tn, i) => {
          const x = ((i * 120 - off) % (6 * 120) + 6 * 120) % (6 * 120) - 60;
          cx.fillStyle = tn.c;
          cx.beginPath(); cx.moveTo(x, ground); cx.lineTo(x + 50 * k, ground - tn.h * k); cx.lineTo(x + 100 * k, ground); cx.fill();
        });
        // string lights
        cx.fillStyle = "#ffcf6b";
        for (let x = -((dist * 0.5 * k) % 30); x < W; x += 30) {
          const y = 70 * k + Math.sin((x + dist * 0.5 * k) / 60) * 8 * k;
          cx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 0.004 + x);
          cx.beginPath(); cx.arc(x, y, 2.5 * k, 0, 6.283); cx.fill();
        }
        cx.globalAlpha = 1;
        // boardwalk
        cx.fillStyle = "#2a1530"; cx.fillRect(0, ground, W, H - ground);
        cx.fillStyle = "#e2344f"; cx.fillRect(0, ground, W, 4 * k);
        cx.fillStyle = "rgba(255,207,107,.25)";
        for (let x = -((dist * k) % 40); x < W; x += 40) cx.fillRect(x, ground + 14 * k, 20 * k, 3 * k);

        // items
        items.forEach((it) => {
          if (it.type === "heart") {
            const bob = Math.sin(t * 0.006 + it.x * 0.05) * 3 * k;
            cx.fillStyle = "#ff7a98"; cx.shadowColor = "#ff7a98"; cx.shadowBlur = 14;
            heartPath(it.x, it.y - it.s + bob, it.s);
            cx.fill(); cx.shadowBlur = 0;
          } else {
            cx.font = `${it.s}px serif`; cx.textAlign = "center"; cx.textBaseline = "alphabetic";
            cx.fillText(it.e, it.x, it.y - 2 * k);
          }
        });

        // player
        const R = 22 * k, px = pl.x, py = pl.y - R;
        if (!(pl.hurt > 0 && Math.floor(pl.hurt / 6) % 2)) {
          cx.fillStyle = "rgba(0,0,0,.3)";
          cx.beginPath(); cx.ellipse(px, ground + 3 * k, R * (1 - (ground - pl.y) / (260 * k)), 4 * k, 0, 0, 6.283); cx.fill();
          cx.save();
          cx.translate(px, py);
          cx.rotate(pl.jumps === 2 ? (t * 0.02) % 6.283 : 0);
          // crown of hair / ring
          cx.fillStyle = "#ffcf6b";
          cx.beginPath(); cx.arc(0, 0, R + 3 * k, 0, 6.283); cx.fill();
          cx.beginPath(); cx.arc(0, 0, R, 0, 6.283); cx.clip();
          if (faceOk) {
            const s = Math.min(face.width, face.height);
            cx.drawImage(face, (face.width - s) / 2, (face.height - s) / 2, s, s, -R, -R, R * 2, R * 2);
          } else {
            cx.fillStyle = "#f2c6a0"; cx.fillRect(-R, -R, R * 2, R * 2);
            cx.fillStyle = "#3b2216"; cx.beginPath(); cx.arc(0, -R * 0.55, R * 1.05, Math.PI, 0); cx.fill();
            cx.fillStyle = "#241427";
            cx.beginPath(); cx.arc(-R * 0.35, -R * 0.05, R * 0.11, 0, 6.283); cx.arc(R * 0.35, -R * 0.05, R * 0.11, 0, 6.283); cx.fill();
            cx.strokeStyle = "#e2344f"; cx.lineWidth = 2 * k;
            cx.beginPath(); cx.arc(0, R * 0.2, R * 0.32, 0.15 * Math.PI, 0.85 * Math.PI); cx.stroke();
            cx.fillStyle = "rgba(255,122,152,.5)";
            cx.beginPath(); cx.arc(-R * 0.55, R * 0.25, R * 0.14, 0, 6.283); cx.arc(R * 0.55, R * 0.25, R * 0.14, 0, 6.283); cx.fill();
          }
          cx.restore();
        }

        // HUD
        cx.font = `700 ${Math.round(14 * k)}px "Space Mono", monospace`;
        cx.textAlign = "left"; cx.textBaseline = "top";
        cx.fillStyle = "#fff3dc";
        cx.fillText(`♥ ${hearts}/${GOAL}`, 14 * k, 12 * k);
        cx.fillStyle = "rgba(255,243,220,.15)"; cx.fillRect(14 * k, 34 * k, 110 * k, 6 * k);
        cx.fillStyle = "#ff7a98"; cx.fillRect(14 * k, 34 * k, 110 * k * (hearts / GOAL), 6 * k);

        if (state === "ready") {
          cx.fillStyle = "rgba(18,13,38,.62)"; cx.fillRect(0, 0, W, H);
          cx.textAlign = "center"; cx.textBaseline = "middle";
          cx.fillStyle = "#ffcf6b";
          cx.font = `${Math.round(30 * k)}px "Bagel Fat One", sans-serif`;
          cx.fillText(`${cfg.name.toUpperCase()} RUN`, W / 2, H * 0.36);
          cx.font = `${Math.round(19 * k)}px Caveat, cursive`;
          cx.fillStyle = "#fff3dc";
          cx.fillText("dodge the chores · grab the hearts", W / 2, H * 0.5);
          if (Math.floor(t / 500) % 2) {
            cx.font = `700 ${Math.round(14 * k)}px "Space Mono", monospace`;
            cx.fillStyle = "#ffcf6b";
            cx.fillText("▶ TAP TO START", W / 2, H * 0.66);
          }
        }
        if (state === "won") {
          cx.fillStyle = "rgba(18,13,38,.55)"; cx.fillRect(0, 0, W, H);
          cx.textAlign = "center"; cx.textBaseline = "middle";
          cx.fillStyle = "#ffcf6b";
          cx.font = `${Math.round(40 * k)}px "Bagel Fat One", sans-serif`;
          cx.fillText("YOU WIN!", W / 2, H * 0.42);
          cx.font = `${Math.round(20 * k)}px Caveat, cursive`;
          cx.fillStyle = "#fff3dc";
          cx.fillText("photos unlocked ↓", W / 2, H * 0.58);
        }
        // scanlines
        cx.fillStyle = "rgba(0,0,0,.08)";
        for (let y = 0; y < H; y += 3) cx.fillRect(0, y, W, 1);
      }

      function loop(t) {
        raf = requestAnimationFrame(loop);
        const dt = last ? Math.min(2.5, (t - last) / 16.67) : 1;
        last = t;
        if (state === "play") update(dt);
        draw(t);
      }
      raf = requestAnimationFrame(loop);

      function win() {
        state = "won";
        const r = cv.getBoundingClientRect();
        C.fx.burst(r.left + r.width / 2, r.top + r.height / 2, 80);
        gallery.innerHTML = "";
        (cfg.photos || []).slice(0, 4).forEach((p, i) => {
          const f = C.photo(p, [-6, 4, -3, 7][i]);
          f.style.animationDelay = `${i * 0.12}s`;
          gallery.append(f);
        });
        setTimeout(() => gallery.scrollIntoView({ behavior: "smooth", block: "start" }), 600);
        api.win();
      }

      return () => {
        cancelAnimationFrame(raf);
        removeEventListener("resize", size);
        document.removeEventListener("keydown", onKey);
      };
    }
  };
})();
