/* ==========================================================================
   Gate + carnival map
   ========================================================================== */
(() => {
  const { cfg, $, $$, el, audio: A } = C;
  const ORDER = ["stars", "arcade", "claw", "scratch", "wheel", "cake"];
  const defs = ORDER.map((id, i) => ({ id, order: i + 2, num: id === "cake" ? "THE FINALE" : `BOOTH 0${i + 2}`, ...C.booths[id] }));
  const BOOTHS = defs.filter((d) => d.id !== "cake");

  C.store.load();

  /* ---------- names everywhere ----------------------------------------- */
  $$("[data-name]").forEach((e) => (e.textContent = cfg.name));
  $$("[data-from]").forEach((e) => (e.textContent = cfg.from));
  $$(".t-bulbs").forEach((e) => (e.dataset.text = e.textContent));
  document.title = `${cfg.name}'s Birthday Carnival`;

  /* ---------- sound toggle --------------------------------------------- */
  const sb = $("#soundBtn");
  sb.addEventListener("click", () => {
    A.on = !A.on;
    sb.setAttribute("aria-pressed", A.on);
    sb.setAttribute("aria-label", A.on ? "Music and sound on" : "Music and sound off");
    $("#jukebox").classList.toggle("muted", !A.on);
    C.music.sync();
  });

  /* ==========================================================================
     THE GATE
     ========================================================================== */
  function initGate() {
    const code = String(cfg.gateCode);
    const slots = $("#codeSlots"), hint = $("#gateHint"), pad = $("#keypad"), lock = $("#padlock");
    let entry = "", misses = 0, busy = false;

    const hints = cfg.gateHints || [];
    const setHint = () => (hint.textContent = hints[Math.min(misses >= 4 ? 2 : misses >= 2 ? 1 : 0, hints.length - 1)] || "");
    setHint();

    const render = () => {
      slots.innerHTML = "";
      for (let i = 0; i < code.length; i++)
        slots.append(el("span", { class: i < entry.length ? "filled" : "" }, entry[i] || ""));
    };
    render();

    const press = (k) => {
      if (busy) return;
      if (k === "del") { entry = entry.slice(0, -1); A.tap(); render(); return; }
      if (k === "hint") { misses = Math.max(misses, 2) + 2; setHint(); A.tap(); return; }
      if (entry.length >= code.length) return;
      entry += k; A.tone(520 + entry.length * 90, 0.09, "triangle", 0.18); render();
      if (entry.length === code.length) check();
    };

    const check = async () => {
      busy = true;
      await C.wait(260);
      if (entry === code) {
        lock.classList.add("unlocked");
        A.good();
        await C.wait(500);
        $("#gate").classList.add("open");
        A.whoosh();
        A.chime();
        await C.wait(1500);
        C.store.data.gate = true; C.store.save();
        $("#gate").classList.add("leave");
        await C.wait(600);
        showMap(true);
      } else {
        misses++;
        lock.classList.remove("shake"); void lock.offsetWidth; lock.classList.add("shake");
        A.bad();
        if (navigator.vibrate) navigator.vibrate(120);
        entry = ""; render(); setHint();
        busy = false;
      }
    };

    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "hint", "0", "del"].forEach((k) => {
      const label = k === "del" ? "⌫" : k === "hint" ? "?" : k;
      const aria = k === "del" ? "Delete" : k === "hint" ? "Give me a hint" : k;
      pad.append(el("button", { class: `key${k.length > 1 ? " alt" : ""}`, type: "button", "aria-label": aria, onclick: () => press(k) }, label));
    });
    document.addEventListener("keydown", (e) => {
      if (!$("#gate").classList.contains("is-active")) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
    });
  }

  /* ==========================================================================
     THE MAP
     ========================================================================== */
  function tentSVG(a, b, icon, big) {
    const n = big ? 12 : 8, L = 8, R = 142, top = 16, eave = 64, w = (R - L) / n;
    let wedges = "", scallops = "", bulbs = "";
    for (let i = 0; i < n; i++) {
      const c = i % 2 ? b : a;
      wedges += `<polygon points="75,${top} ${L + i * w},${eave} ${L + (i + 1) * w},${eave}" fill="${c}"/>`;
      scallops += `<path d="M${L + i * w} ${eave} a${w / 2} ${w * 0.45} 0 0 0 ${w} 0z" fill="${c}"/>`;
      bulbs += `<circle cx="${L + i * w}" cy="${eave}" r="2.2" fill="#fff2c4"/>`;
    }
    bulbs += `<circle cx="${R}" cy="${eave}" r="2.2" fill="#fff2c4"/>`;
    return `<svg class="tent" viewBox="0 -2 150 128" aria-hidden="true">
      <ellipse cx="75" cy="120" rx="64" ry="6" fill="rgba(0,0,0,.35)"/>
      <line x1="75" y1="${top}" x2="75" y2="0" stroke="#d9932c" stroke-width="2"/>
      <path class="flag" d="M75 1 L97 6 L75 11z" fill="#e2344f"/>
      <rect x="20" y="${eave}" width="110" height="54" fill="#f6e6c8"/>
      <rect x="20" y="${eave}" width="110" height="54" fill="url(#bodyStripe)" opacity=".5"/>
      <rect x="20" y="${eave}" width="110" height="54" fill="${b}" opacity=".12"/>
      <path class="door-in" d="M57 118 V90 a18 18 0 0 1 36 0 V118z" fill="#2a1530"/>
      <path class="door-glow" d="M57 118 V90 a18 18 0 0 1 36 0 V118z" fill="#ffcf6b"/>
      <text x="75" y="110" text-anchor="middle" font-size="19">${icon}</text>
      <path d="M57 118 L57 90 Q58 73 75 72 Q63 88 65 118 Z" fill="${a}"/>
      <path d="M93 118 L93 90 Q92 73 75 72 Q87 88 85 118 Z" fill="${a}"/>
      ${wedges}${scallops}${bulbs}
      ${big ? `<rect x="40" y="38" width="70" height="16" rx="3" fill="#120d26" opacity=".85"/><text x="75" y="50" text-anchor="middle" font-family="Space Mono" font-weight="700" font-size="9" letter-spacing="3" fill="#ffcf6b">BIG TOP</text>` : ""}
    </svg>`;
  }

  function buildFerris() {
    const f = $("#ferris"), R = 90, N = 12;
    let spokes = "", cars = "";
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, x = Math.cos(a) * R, y = Math.sin(a) * R;
      spokes += `<line x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
      cars += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="gondola"><line x1="0" y1="0" x2="0" y2="6" stroke="#ffcf6b"/><rect x="-8" y="6" width="16" height="12" rx="3" fill="${i % 2 ? "#e2344f" : "#ffcf6b"}"/></g></g>`;
    }
    f.innerHTML = `
      <g stroke="#ffcf6b" stroke-width="2" fill="none">
        <line x1="0" y1="0" x2="-62" y2="146"/><line x1="0" y1="0" x2="62" y2="146"/>
      </g>
      <g class="wheel" stroke="#ffcf6b" stroke-width="1.2" fill="none">
        <circle r="${R}" stroke-width="2.5"/><circle r="${R - 14}" stroke-dasharray="3 5"/>
        ${spokes}${cars}
      </g>
      <circle r="7" fill="#ffcf6b"/>`;
  }

  function buildGarland() {
    const g = $("#garland"), W = g.clientWidth, H = 54;
    const colors = ["#ffcf6b", "#e2344f", "#fff3dc", "#7fdcc6", "#ff7a98"];
    const swags = W > 700 ? 3 : 2, sw = W / swags;
    let d = "", bulbs = "";
    for (let s = 0; s < swags; s++) {
      const x0 = s * sw, x1 = x0 + sw;
      d += `M${x0} 4 Q${x0 + sw / 2} ${H} ${x1} 4 `;
      const count = Math.max(5, Math.round(sw / 34));
      for (let i = 1; i < count; i++) {
        const t = i / count, x = x0 + sw * t;
        const y = (1 - t) * (1 - t) * 4 + 2 * (1 - t) * t * H + t * t * 4;
        bulbs += `<span class="bulb" style="left:${x}px;top:${y}px;--c:${colors[(s * count + i) % colors.length]};animation-delay:${-(i * 0.37) % 1.4}s"></span>`;
      }
    }
    g.innerHTML = `<svg><path d="${d}"/></svg>${bulbs}`;
  }

  let stopEls = [];
  function buildMidway() {
    const mid = $("#midway");
    $$(".stop", mid).forEach((s) => s.remove());
    stopEls = defs.map((d, i) => {
      const big = d.id === "cake";
      const b = el("button", { class: `stop${big ? " big" : ""}`, type: "button", style: `--tilt:${i % 2 ? 2 : -2}deg` });
      b.innerHTML = tentSVG(d.colors[0], d.colors[1], d.icon, big) +
        `<span class="sign"><span class="sign-no">${d.num}</span><span class="sign-name">${C.esc(d.title)}</span><span class="sign-state"></span></span>`;
      b.addEventListener("click", () => enter(d, b));
      mid.append(b);
      return b;
    });
    layout();
  }

  function layout() {
    const mid = $("#midway"), cw = mid.clientWidth;
    const xs = [0.3, 0.7, 0.3, 0.7, 0.3, 0.5].map((f) => (cw < 420 ? 0.5 + (f - 0.5) * 0.85 : f));
    const step = 250;
    const pts = [{ x: cw / 2, y: -30 }];
    stopEls.forEach((s, i) => {
      const x = xs[i] * cw, y = 20 + i * step + (i === 5 ? 30 : 0);
      s.style.left = `${x}px`; s.style.top = `${y}px`;
      pts.push({ x, y: y + (i === 5 ? 90 : 60) });
    });
    mid.style.height = `${20 + 5 * step + 30 + 330}px`;
    const curve = (list) => list.reduce((d, p, i) => {
      if (!i) return `M${p.x} ${p.y}`;
      const q = list[i - 1], dy = p.y - q.y;
      return `${d} C${q.x} ${q.y + dy * 0.55} ${p.x} ${p.y - dy * 0.55} ${p.x} ${p.y}`;
    }, "");
    mid.dataset.full = curve(pts);
    mid._pts = pts;
    mid._curve = curve;
    drawPath();
  }

  function drawPath() {
    const mid = $("#midway"), svg = $("#pathSvg");
    if (!mid._pts) return;
    const reach = Math.min(nextIndex() + 1, mid._pts.length - 1);
    svg.innerHTML = `<path class="trail" d="${mid.dataset.full}"/><path class="trail-lit" d="${mid._curve(mid._pts.slice(0, reach + 1))}"/>`;
  }

  const doneSet = () => new Set(C.store.data.done);
  const ticketCount = () => BOOTHS.filter((b) => doneSet().has(b.id)).length;
  function nextIndex() {
    const i = BOOTHS.findIndex((b) => !doneSet().has(b.id));
    return i === -1 ? 5 : i;
  }
  function stateOf(i) {
    const d = defs[i];
    if (doneSet().has(d.id)) return "done";
    if (d.id === "cake") return ticketCount() >= BOOTHS.length ? "open" : "locked";
    return i === nextIndex() ? "open" : "locked";
  }

  function refresh(fresh) {
    const n = ticketCount();
    const hud = $("#hudSlots");
    hud.innerHTML = "";
    BOOTHS.forEach((_, i) => hud.append(el("span", { class: `hud-slot${i < n ? " on" : ""}${fresh && i === n - 1 ? " fresh" : ""}` })));
    stopEls.forEach((s, i) => {
      const st = stateOf(i), big = defs[i].id === "cake";
      s.classList.remove("locked", "open", "done");
      s.classList.add(st);
      s.setAttribute("aria-label", `${defs[i].title}: ${st}`);
      $(".sign-state", s).textContent =
        st === "done" ? (big ? "see it again ↺" : "won! play again ↺")
        : st === "open" ? (big ? "the tent is open!" : "tap to play!")
        : big ? `needs ${BOOTHS.length - n} more ticket${BOOTHS.length - n === 1 ? "" : "s"}` : "🔒 locked";
    });
    drawPath();
    if (fresh) {
      const target = stopEls[Math.min(nextIndex(), 5)];
      if (n >= BOOTHS.length) C.fx.rain(120);
      setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
    }
  }

  function enter(d, btn) {
    const i = defs.indexOf(d);
    if (stateOf(i) === "locked") {
      A.bad();
      btn.animate([{ translate: "0 0" }, { translate: "-8px 0" }, { translate: "8px 0" }, { translate: "0 0" }], { duration: 360 });
      const msg = d.id === "cake" ? "Collect all 5 tickets first!" : "Finish the booth before!";
      const t = el("div", { class: "toast", style: "top:-10px;font-size:20px" }, msg);
      btn.append(t);
      setTimeout(() => t.remove(), 1150);
      return;
    }
    A.tap();
    C.booth.open(d);
  }

  function showMap(arriving) {
    $("#gate").classList.remove("is-active");
    $("#map").classList.add("is-active");
    buildFerris();
    buildGarland();
    buildMidway();
    refresh(false);
    window.scrollTo(0, 0);
    if (arriving) {
      C.fx.rain(140);
      A.chime();
    }
  }

  C.map = { refresh };

  let rz;
  addEventListener("resize", () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      if (!$("#map").classList.contains("is-active")) return;
      buildGarland();
      layout();
    }, 150);
  });

  /* ---------- body stripe pattern used by the tents -------------------- */
  document.body.insertAdjacentHTML("beforeend",
    `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
      <pattern id="bodyStripe" width="14" height="10" patternUnits="userSpaceOnUse"><rect width="7" height="10" fill="#e9d2ac"/></pattern>
    </defs></svg>`);

  /* ---------- start ---------------------------------------------------- */
  if (C.store.data.gate) showMap(false);
  else initGate();
})();
