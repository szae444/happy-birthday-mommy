/* ==========================================================================
   BOOTH 05 · Scratch-Off Stand — scratch tickets to reveal coupons
   ========================================================================== */
(() => {
  C.booths.scratch = {
    title: "Scratch-Off Stand",
    sub: "Rub the gold foil with your finger. Every ticket wins!",
    colors: ["#ffcf6b", "#5a1d47"],
    icon: "🎟️",
    mount(stage, api) {
      const { cfg, el, audio: A } = C;
      const cards = [...(cfg.coupons || []), { ...(cfg.jackpot || { prize: "JACKPOT!", fine: "" }), jackpot: true }];
      let idx = 0, cleanupCard = null;

      const deck = el("div", { class: "scratch-deck" });
      const count = el("p", { class: "scratch-count" });
      stage.append(count, deck);

      function show() {
        const c = cards[idx];
        deck.innerHTML = "";
        api.foot.innerHTML = "";
        count.textContent = `ticket ${idx + 1} of ${cards.length}`;
        const left = cards.length - idx - 1;
        for (let i = Math.min(left, 3); i > 0; i--) deck.append(el("div", { class: "scard ghost", style: `--i:${i}` }));
        const card = el("div", { class: `scard${c.jackpot ? " jackpot" : ""}` });
        const under = el("div", { class: "scard-under" },
          el("span", { class: "sc-kicker" }, c.jackpot ? "★ GRAND PRIZE ★" : "YOU WON"),
          el("strong", { class: "sc-prize" }, c.prize),
          el("span", { class: "sc-fine" }, c.fine || ""),
          el("span", { class: "sc-serial" }, `valid forever · for ${cfg.name} only · Nº ${String(idx + 1).padStart(4, "0")}`));
        const cv = el("canvas", { class: "scard-foil", "aria-label": "Scratch to reveal" });
        card.append(under, cv);
        deck.append(card);
        requestAnimationFrame(() => (cleanupCard = foil(cv, card, c)));
      }

      function foil(cv, card, c) {
        const r = card.getBoundingClientRect(), W = r.width, H = r.height;
        const d = Math.min(devicePixelRatio || 1, 2);
        cv.width = W * d; cv.height = H * d;
        const cx = cv.getContext("2d");
        cx.scale(d, d);
        // gold foil
        const g = cx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, "#f7d27a"); g.addColorStop(0.3, "#fff1c1"); g.addColorStop(0.55, "#d9a441"); g.addColorStop(0.8, "#ffe39a"); g.addColorStop(1, "#c98d2c");
        cx.fillStyle = g; cx.fillRect(0, 0, W, H);
        for (let i = 0; i < 1400; i++) {
          cx.fillStyle = `rgba(${Math.random() < 0.5 ? "255,255,255" : "120,70,10"},${Math.random() * 0.18})`;
          cx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
        }
        cx.fillStyle = "rgba(91,58,7,.55)";
        cx.font = '700 11px "Space Mono", monospace';
        cx.textAlign = "center";
        for (let y = 18; y < H; y += 28)
          for (let x = (y / 28) % 2 ? 40 : 90; x < W; x += 110) cx.fillText("✦ SCRATCH ✦", x, y);
        cx.fillStyle = "#5b3a07";
        cx.font = `${Math.round(H * 0.17)}px "Bagel Fat One", sans-serif`;
        cx.fillText(c.jackpot ? "JACKPOT?" : "SCRATCH ME", W / 2, H / 2 + H * 0.06);

        cx.globalCompositeOperation = "destination-out";
        cx.lineCap = cx.lineJoin = "round";
        cx.lineWidth = Math.max(34, W * 0.11);
        let down = false, lastP = null, moves = 0, done = false, lastSnd = 0;
        const pos = (e) => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
        const scratch = (p) => {
          cx.beginPath();
          if (lastP) { cx.moveTo(lastP.x, lastP.y); cx.lineTo(p.x, p.y); cx.stroke(); }
          else { cx.arc(p.x, p.y, cx.lineWidth / 2, 0, 6.283); cx.fill(); }
          lastP = p;
          const now = performance.now();
          if (now - lastSnd > 70) { A.noise(0.06, 0.05, 0, 3000); lastSnd = now; }
          if (++moves % 8 === 0) check();
        };
        const check = () => {
          if (done) return;
          const data = cx.getImageData(0, 0, cv.width, cv.height).data;
          let clear = 0, n = 0;
          for (let i = 3; i < data.length; i += 4 * 40) { n++; if (data[i] < 40) clear++; }
          if (clear / n > 0.5) reveal();
        };
        const reveal = () => {
          done = true;
          cv.classList.add("gone");
          card.classList.add("won");
          const b = card.getBoundingClientRect();
          if (c.jackpot) { A.chime(); C.fx.burst(b.left + b.width / 2, b.top + b.height / 2, 140, 1.2); C.fx.rain(80); }
          else { A.good(); C.fx.burst(b.left + b.width / 2, b.top + b.height / 2, 40, 0.7); }
          if (idx < cards.length - 1) {
            api.foot.append(el("button", { class: "btn", type: "button", onclick: () => { idx++; A.whoosh(); show(); } }, "Next ticket →"));
          } else {
            api.win();
          }
        };
        const onDown = (e) => { e.preventDefault(); down = true; lastP = null; cv.setPointerCapture(e.pointerId); scratch(pos(e)); };
        const onMove = (e) => { if (down && !done) scratch(pos(e)); };
        const onUp = () => { down = false; lastP = null; check(); };
        cv.addEventListener("pointerdown", onDown);
        cv.addEventListener("pointermove", onMove);
        cv.addEventListener("pointerup", onUp);
        cv.addEventListener("pointercancel", onUp);
        return () => {};
      }

      show();
      return () => { if (cleanupCard) cleanupCard(); };
    }
  };
})();
