// Shared script for the 90s homepage: / and /ua/.
(() => {
  // Animations: the button at the top stops them all, and the choice is remembered.
  // With no saved choice, the system's "reduce motion" setting decides.
  const MOTION_KEY = "hz90s-motion";
  const MOTION_TEXT = {
    en: { stop: "Stop animations", play: "Play animations" },
    uk: { stop: "Зупинити анімацію", play: "Увімкнути анімацію" },
  }[document.documentElement.lang] ?? { stop: "Stop animations", play: "Play animations" };
  let saved = null;
  try { saved = localStorage.getItem(MOTION_KEY); } catch {}
  let motion = saved ? saved === "on" : !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionToggle = document.getElementById("motion-toggle");
  const applyMotion = () => {
    document.documentElement.classList.toggle("no-motion", !motion);
    document.documentElement.classList.toggle("motion-on", motion);
    motionToggle.innerHTML = motion
      ? `<span aria-hidden="true">■</span> ${MOTION_TEXT.stop}`
      : `<span aria-hidden="true">▶</span> ${MOTION_TEXT.play}`;
  };
  applyMotion();
  motionToggle.hidden = false;
  motionToggle.addEventListener("click", () => {
    motion = !motion;
    try { localStorage.setItem(MOTION_KEY, motion ? "on" : "off"); } catch {}
    applyMotion();
  });

  // Real counter: AWS Lambda + DynamoDB, see _infra/visitor-counter.
  // Each browser is counted once; later visits only read the number.
  const API_URL = "https://5xswyi5y55xzsyrqgizq2sp3qy0ymcwz.lambda-url.eu-north-1.on.aws/";
  const COUNTER_URL = `${API_URL}?id=90s`;
  const COUNTED_KEY = "hz90s-counted";
  const counter = document.getElementById("counter");

  const show = (text) => {
    counter.setAttribute("aria-label", /^\d+$/.test(text) ? String(Number(text)) : text.replace(/[^\w]/g, "") || "…");
    counter.innerHTML = text
      .padStart(7, "0")
      .split("")
      .map((d) => `<span>${d}</span>`)
      .join("");
  };

  show("???????");

  let counted = false;
  try { counted = localStorage.getItem(COUNTED_KEY) === "1"; } catch {}

  fetch(COUNTER_URL, { method: counted ? "GET" : "POST" })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(({ count }) => {
      show(String(count));
      if (!counted) {
        try { localStorage.setItem(COUNTED_KEY, "1"); } catch {}
      }
    })
    .catch(() => show("-ERROR-"));

  // Weather for Kyiv and Kremenchuk. It comes from the same Lambda as the counter, which fetches and
  // caches it, so a visitor's browser never talks to a weather provider. No geolocation, nothing stored.
  // The pictures are clip art in the style of the cloud on the social cards (_og/card-90s.html): it's
  // the very same cloud, and every shape gets its outline the same way, a fat black copy underneath.
  const OUTLINE = 'stroke="#000" stroke-width="3.3" stroke-linejoin="round"';
  const puffs = (circles) => circles.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join("");
  const CLOUD_BODY = puffs([[95, 160, 70], [175, 115, 88], [262, 160, 70], [125, 215, 58], [220, 218, 60], [52, 215, 44], [292, 218, 42], [172, 232, 48]]);
  const CLOUD_BELLY = puffs([[125, 232, 44], [220, 236, 44], [60, 228, 30], [288, 230, 30], [172, 248, 38]]);
  const cloud = (top = "#fff", belly = "#d8ecff") => `<g class="bob"><g transform="translate(18.4 -2.9) scale(.33)">
    <g stroke="#000" stroke-width="10" fill="#000">${CLOUD_BODY}</g><g fill="${top}">${CLOUD_BODY}</g><g fill="${belly}">${CLOUD_BELLY}</g>
  </g></g>`;
  const sun = (cx, cy, r) => {
    const ray = `M${cx - r * 0.24} ${cy - r}L${cx} ${cy - r * 1.42}L${cx + r * 0.24} ${cy - r}Z`;
    const rays = Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30} ${cx} ${cy})" d="${ray}"/>`);
    return `<g class="rays" fill="#ff9900" stroke="#000" stroke-width="2" stroke-linejoin="round">${rays.join("")}</g>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffdd00" ${OUTLINE}/>
      <circle cx="${cx - r * 0.42}" cy="${cy - r * 0.45}" r="${r * 0.16}" fill="#fff"/>`;
  };
  const moon = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff4b8" ${OUTLINE}/>
    <g fill="#ecdc8e">${puffs([[cx - r * 0.6, cy - r * 0.5, r * 0.16], [cx + r * 0.6, cy + r * 0.55, r * 0.2], [cx + r * 0.55, cy - r * 0.55, r * 0.11]])}</g>`;
  const STARS = [[14, 16, 0], [136, 14, 0.4], [20, 92, 0.7], [130, 96, 0.2], [118, 30, 0.9], [34, 52, 0.55]]
    .map(([x, y, delay]) => `<g class="star" style="animation-delay:-${delay}s"><path transform="translate(${x} ${y})" d="M0-5L1.2-1.2 5 0 1.2 1.2 0 5-1.2 1.2-5 0-1.2-1.2Z" fill="#ffff66"/></g>`)
    .join("");
  // Rain and snow fall from under the cloud. Each piece has its own start, so they don't move in step.
  const falling = (kind, shape) => [[40, 0], [58, 0.5], [76, 0.2], [94, 0.7], [112, 0.35]]
    .map(([x, delay]) => `<g class="${kind}" style="animation-delay:-${delay}s"><g transform="translate(${x} 103)">${shape}</g></g>`)
    .join("");
  const DROP = '<path d="M0-6C3-1 4 1 4 3A4 4 0 0 1-4 3C-4 1-3-1 0-6Z" fill="#33aaff" stroke="#000"/>';
  const FLAKE = '<path d="M-5 0H5M-2.5-4.3L2.5 4.3M-2.5 4.3L2.5-4.3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
  const FOG = '<g class="fog" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-dasharray="46 16"><path d="M-40 84H190"/><path d="M-20 96H190" opacity=".8"/><path d="M-50 108H190" opacity=".6"/></g>';
  const STORM = '<path class="bolt" d="M84 76L62 98H74L60 116L94 92H80L94 76Z" fill="#ffee00" stroke="#000" stroke-width="2" stroke-linejoin="round"/>';
  const WEATHER_SCENES = {
    sun: sun(75, 52, 35),
    moon: STARS + moon(75, 52, 36),
    partly: sun(34, 30, 17) + cloud(),
    partlyNight: STARS + moon(34, 28, 16) + cloud(),
    cloud: cloud(),
    fog: cloud() + FOG,
    rain: cloud() + falling("drop", DROP),
    snow: cloud() + falling("flake", FLAKE),
    storm: '<rect class="flash" width="150" height="116" fill="#fff"/>' + cloud("#e4e7f0", "#aeb6cc") + STORM,
    offline: cloud("#d0d0d0", "#a8a8a8"),
  };
  // WMO weather codes, in order: each entry covers the codes up to its upTo.
  const WEATHER_SKIES = [
    { upTo: 0, art: "sun", night: "moon", en: "Clear", uk: "Ясно" },
    { upTo: 1, art: "sun", night: "moon", en: "Mostly clear", uk: "Майже ясно" },
    { upTo: 2, art: "partly", night: "partlyNight", en: "Partly cloudy", uk: "Мінлива хмарність" },
    { upTo: 3, art: "cloud", en: "Overcast", uk: "Похмуро" },
    { upTo: 48, art: "fog", en: "Foggy", uk: "Туман" },
    { upTo: 57, art: "rain", en: "Drizzle", uk: "Мряка" },
    { upTo: 67, art: "rain", en: "Rain", uk: "Дощ" },
    { upTo: 77, art: "snow", en: "SNOW!!!", uk: "СНІГ!!!" },
    { upTo: 82, art: "rain", en: "Showers", uk: "Злива" },
    { upTo: 86, art: "snow", en: "Snow showers", uk: "Снігопад" },
    { upTo: 99, art: "storm", en: "THUNDERSTORM!!!", uk: "ГРОЗА!!!" },
  ];
  // The temperature is colored like the words in the cloud on the card: blue when it's cold, red when it's hot.
  const WEATHER_TEMPS = [
    { upTo: -10, color: "#0000cc" },
    { upTo: 0, color: "#0066cc" },
    { upTo: 10, color: "#008080" },
    { upTo: 20, color: "#00a000" },
    { upTo: 28, color: "#d14800" },
    { upTo: Infinity, color: "#cc0000" },
  ];
  const WEATHER_TEXT = {
    en: { updated: (time) => `${time} Kyiv time.`, offline: "No carrier =(" },
    uk: { updated: (time) => `Станом на ${time}.`, offline: "No carrier =(" },
  };
  const weatherLang = WEATHER_TEXT[document.documentElement.lang] ? document.documentElement.lang : "en";
  const weatherBox = document.getElementById("weather");
  const cities = [...weatherBox.querySelectorAll(".city")];
  const paintSky = (city, art, night = false) => {
    const scene = city.querySelector(".scene");
    scene.dataset.sky = art;
    scene.classList.toggle("night", night);
    city.querySelector(".sky").innerHTML = WEATHER_SCENES[art];
  };
  cities.forEach((city) => paintSky(city, "offline"));
  weatherBox.hidden = false;

  fetch(`${API_URL}?id=weather`)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((weather) => {
      cities.forEach((city) => {
        const { temp, code, day } = weather[city.dataset.city];
        const sky = WEATHER_SKIES.find((s) => code <= s.upTo);
        const degrees = Math.round(temp);
        const label = city.querySelector(".temp");
        label.textContent = `${degrees > 0 ? "+" : ""}${degrees}°C`;
        label.style.color = WEATHER_TEMPS.find((t) => degrees <= t.upTo).color;
        paintSky(city, (!day && sky.night) || sky.art, !day);
        city.querySelector(".sky-text").textContent = sky[weatherLang];
      });
      document.getElementById("weather-updated").textContent = WEATHER_TEXT[weatherLang].updated(weather.updated);
    })
    .catch(() => {
      cities.forEach((city) => {
        city.querySelector(".temp").textContent = "--°C";
        city.querySelector(".sky-text").textContent = WEATHER_TEXT[weatherLang].offline;
      });
    });

  // Closable windows: × hides a window, the MeNu brings it back, and closing them all shows a dialog.
  // Each time everything gets closed the dialog gets grumpier, until the last one only offers a reload.
  const windows = [...document.querySelectorAll("section.window")];
  const allClosed = document.getElementById("all-closed");
  const restoreAll = document.getElementById("restore-all");
  // The dialog text lives here, so each page picks its language from <html lang>.
  const STAGES = {
    en: [
      { kind: "error", bar: "Error", icon: "×", text: "Ooops, you closed everything :( Did you not like it?", button: "Sorry!! Ctrl+Z everything" },
      { kind: "error", bar: "Error", icon: "×", text: "Oops!... you did it again.", button: "Ctrl+Z me baby one more time" },
      { kind: "error", bar: "Error", icon: "×", text: ">:( >:( >:( Why do you keep closing everything?! This is not a toy, it's a REAL WEB SITE!!!", button: "OK OK, my mistake" },
      { kind: "warning", bar: "Warning", icon: "!", text: "Please STOP!!! You are using up all our computing power. CPU core overload imminent!!!", button: "I swear it's the last time" },
      { kind: "fatal", bar: "Fatal error", icon: "×", text: "A fatal exception 0E has occurred: CORE OVERLOAD. The Internet must be rebooted. Please refresh the page.", button: "Reboot (F5)" },
    ],
    uk: [
      { kind: "error", bar: "Помилка", icon: "×", text: "Ой, усе закрито :( Тобі не сподобалось?", button: "Вибач!! Ctrl+Z на все" },
      { kind: "error", bar: "Помилка", icon: "×", text: "Oops!... і знову все закрито.", button: "Ctrl+Z me baby one more time" },
      { kind: "error", bar: "Помилка", icon: "×", text: ">:( >:( >:( Навіщо ти знову все закриваєш?! Це не іграшка, це СПРАВЖНІЙ ВЕБСАЙТ!!!", button: "Добре, добре, моя помилка" },
      { kind: "warning", bar: "Попередження", icon: "!", text: "Будь ласка, ЗУПИНИСЯ!!! Ти забираєш усю нашу обчислювальну потужність. Ядро процесора ось-ось перевантажиться!!!", button: "Клянуся, це востаннє" },
      { kind: "fatal", bar: "Фатальна помилка", icon: "×", text: "Сталася фатальна помилка 0E: ПЕРЕВАНТАЖЕННЯ ЯДРА. Інтернет треба перезавантажити. Будь ласка, онови сторінку.", button: "Перезавантажити (F5)" },
    ],
  };
  const stages = STAGES[document.documentElement.lang] ?? STAGES.en;
  let timesClosed = 0;
  const stage = () => stages[Math.min(timesClosed, stages.length) - 1];

  const syncDialog = () => {
    const wasHidden = allClosed.hidden;
    allClosed.hidden = windows.some((w) => !w.hidden);
    if (!wasHidden || allClosed.hidden) return;
    timesClosed++;
    const { kind, bar, icon, text, button } = stage();
    allClosed.className = `dialog ${kind}`;
    document.getElementById("all-closed-bar").textContent = bar;
    document.getElementById("all-closed-icon").textContent = icon;
    document.getElementById("all-closed-text").textContent = text;
    restoreAll.textContent = button;
  };

  windows.forEach((w, i) => {
    const close = w.querySelector(".close");
    const title = w.querySelector(".bar h2");
    // "Close window: ABOUT_ME.TXT - Notepad", so a screen reader can tell the × buttons apart.
    close.setAttribute("aria-label", `${close.getAttribute("aria-label")}: ${title.textContent}`);
    title.tabIndex = -1;
    close.addEventListener("click", () => {
      w.hidden = true;
      syncDialog();
      // The button just vanished, so keyboard focus moves to the window that took its place.
      // preventScroll: focusing something off-screen would make the page jump.
      const next = windows.slice(i + 1).find((x) => !x.hidden) ?? windows.slice(0, i).reverse().find((x) => !x.hidden);
      (allClosed.hidden ? next.querySelector(".bar h2") : restoreAll).focus({ preventScroll: true });
    });
  });

  document.querySelectorAll('nav.sidebar a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      const target = document.getElementById(link.hash.slice(1));
      if (target && target.hidden) {
        target.hidden = false;
        syncDialog();
      }
    });
  });

  restoreAll.addEventListener("click", () => {
    if (stage().kind === "fatal") {
      location.reload();
      return;
    }
    windows.forEach((w) => { w.hidden = false; });
    syncDialog();
    windows[0].scrollIntoView({ behavior: motion ? "smooth" : "auto", block: "start" });
    document.getElementById("main").focus({ preventScroll: true });
  });

  // "Was it worth it?" Yes and No get the same honest reply; a button with data-answer gets its own.
  const worthAnswer = document.getElementById("worth-answer");
  const worthText = document.getElementById("worth-answer-text");
  const honestReply = worthText.textContent;
  document.querySelectorAll(".worth-btns button").forEach((b) => {
    b.addEventListener("click", () => {
      worthText.textContent = b.dataset.answer ?? honestReply;
      worthAnswer.showModal();
    });
  });
  document.getElementById("worth-ok").addEventListener("click", () => worthAnswer.close());

  // The "cheat codes" link under the Vice City photo opens them in a Notepad dialog.
  const cheats = document.getElementById("cheats");
  document.getElementById("cheats-open").addEventListener("click", () => cheats.showModal());
  document.getElementById("cheats-ok").addEventListener("click", () => cheats.close());

  document.querySelectorAll(".year").forEach((el) => { el.textContent = new Date().getFullYear(); });

  const year = document.querySelector("button.year");
  const yearTip = document.getElementById("year-tip");
  const setTip = (open) => {
    yearTip.classList.toggle("open", open);
    year.setAttribute("aria-expanded", open);
  };
  year.addEventListener("click", () => setTip(!yearTip.classList.contains("open")));
  document.addEventListener("click", (e) => { if (e.target !== year) setTip(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setTip(false); });

  const ring = [
    "https://github.com/hlib-zinchenko/Hlibz.EntityFrameworkCore.ModelRules",
    "https://github.com/hlib-zinchenko/Hlibz.TypeRules.Analyzers",
    "https://github.com/hlib-zinchenko/Hlibz.Redoc",
    "https://hlib-zinchenko.github.io/flashcards-pwa/",
  ];
  document.getElementById("random-site").addEventListener("click", (e) => {
    e.preventDefault();
    location.href = ring[Math.floor(Math.random() * ring.length)];
  });

  // Wake up, Neo... Half-width katakana and digits, like the code in The Matrix.
  const glyphs = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789";
  const glyph = () => glyphs[Math.floor(Math.random() * glyphs.length)];
  let last = 0;
  addEventListener("pointermove", (e) => {
    if (!motion) return;
    const now = performance.now();
    if (now - last < 40) return;
    last = now;
    const s = document.createElement("span");
    s.className = "trail";
    s.setAttribute("aria-hidden", "true");
    s.textContent = glyph();
    s.style.left = `${e.clientX + 6}px`;
    s.style.top = `${e.clientY + 6}px`;
    document.body.appendChild(s);
    const flicker = setInterval(() => { s.textContent = glyph(); }, 100);
    // animationcancel fires when "Stop animations" kills the fall mid-way, so no symbol gets stuck on screen.
    const done = () => {
      clearInterval(flicker);
      s.remove();
    };
    s.addEventListener("animationend", done);
    s.addEventListener("animationcancel", done);
  });
})();
