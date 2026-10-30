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

  // "Who's the best turtle?" The votes sit in the same Lambda and table as the counter, which keep
  // nothing about the voter. Each browser votes once, and its vote is remembered only here.
  const VOTE_KEY = "hz90s-vote";
  const POLL_TEXT = {
    en: { total: (votes) => `Total votes: ${votes}`, offline: "No carrier =(" },
    uk: { total: (votes) => `Усього голосів: ${votes}`, offline: "No carrier =(" },
  };
  const pollText = POLL_TEXT[document.documentElement.lang] ?? POLL_TEXT.en;
  // Each turtle's name and bar are the color of its mask. The names sit on white tiles (see 90s.css),
  // because these colors are unreadable right on the green panel.
  const TURTLE_COLORS = { mikey: "#d14800", leo: "#0000cc", donnie: "#6600cc", raph: "#cc0000" };
  const poll = document.getElementById("poll");
  const pollForm = document.getElementById("poll-form");
  const pollResults = document.getElementById("poll-results");
  const pollNote = document.getElementById("poll-note");
  const pollVote = document.getElementById("poll-vote");
  const turtles = [...pollForm.elements.turtle].map((radio) => {
    radio.parentElement.style.color = TURTLE_COLORS[radio.value];
    return { id: radio.value, name: radio.parentElement.textContent.trim() };
  });
  let myVote = null;
  try { myVote = localStorage.getItem(VOTE_KEY); } catch {}

  const showResults = (votes) => {
    const total = turtles.reduce((sum, { id }) => sum + votes[id], 0);
    const rows = turtles.map(({ id, name }) => {
      const share = total ? Math.round((votes[id] / total) * 100) : 0;
      const mine = id === myVote ? ' <span class="hot">♥</span>' : "";
      return `<p><span class="poll-name" style="color:${TURTLE_COLORS[id]}">${name}${mine}</span><small>${votes[id]} (${share}%)</small><span class="poll-track"><span class="poll-bar" style="width:${share}%;background:${TURTLE_COLORS[id]}"></span></span></p>`;
    });
    pollResults.innerHTML = `${rows.join("")}<p class="poll-total">${pollText.total(total)}</p>`;
    pollResults.hidden = false;
    pollNote.textContent = "";
  };

  const askPoll = (method, query = "") => fetch(`${API_URL}?id=poll${query}`, { method })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
  const pollOffline = () => { pollNote.textContent = pollText.offline; };
  const loadResults = () => askPoll("GET").then(showResults).catch(pollOffline);

  pollForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const vote = pollForm.elements.turtle.value;
    pollVote.disabled = true; // A double click must not vote twice.
    askPoll("POST", `&vote=${vote}`)
      .then((votes) => {
        myVote = vote;
        try { localStorage.setItem(VOTE_KEY, vote); } catch {}
        showResults(votes);
        pollForm.hidden = true;
        // The focused button just vanished, so keyboard focus moves to what took its place.
        pollResults.focus({ preventScroll: true });
      })
      .catch(pollOffline)
      .finally(() => { pollVote.disabled = false; });
  });
  document.getElementById("poll-show").addEventListener("click", loadResults);

  if (myVote) {
    pollForm.hidden = true;
    loadResults();
  }
  poll.hidden = false;

  // "Best viewed in Netscape 4.0": reads the browser's own name and sends it nowhere.
  // The order matters: Edge and Opera also say Chrome, and Chrome also says Safari.
  const BROWSERS = [
    [/Edg(e|A|iOS)?\//, "Edge"],
    [/OPR\/|OPiOS\//, "Opera"],
    [/Vivaldi\//, "Vivaldi"],
    [/SamsungBrowser\//, "Samsung Internet"],
    [/Firefox\/|FxiOS\//, "Firefox"],
    [/Chrome\/|CriOS\//, "Chrome"],
    [/Safari\//, "Safari"],
  ];
  const SNIFFER_TEXT = {
    en: {
      future: (name) => `You're on ${name}, a browser from the FUTURE. Best viewed in Netscape 4.0.`,
      unknown: "You're on a browser from the FUTURE. Best viewed in Netscape 4.0.",
      robot: "You're a ROBOT. Greetings, fellow robot! Your note is at C:\\> HIRE_ME.EXE.",
    },
    uk: {
      future: (name) => `Ти в ${name}, браузері з МАЙБУТНЬОГО. Найкраще дивитися в Netscape 4.0.`,
      unknown: "Ти в браузері з МАЙБУТНЬОГО. Найкраще дивитися в Netscape 4.0.",
      robot: "Ти РОБОТ. Вітаю, колего-роботе! Твоя записка в C:\\> HIRE_ME.EXE.",
    },
  };
  const snifferText = SNIFFER_TEXT[document.documentElement.lang] ?? SNIFFER_TEXT.en;
  const sniff = (agent, isRobot) => {
    if (isRobot || /bot|crawl|spider|headless/i.test(agent)) return snifferText.robot;
    const browser = BROWSERS.find(([pattern]) => pattern.test(agent));
    return browser ? snifferText.future(browser[1]) : snifferText.unknown;
  };
  const sniffer = document.getElementById("sniffer");
  sniffer.textContent = sniff(navigator.userAgent, navigator.webdriver);
  sniffer.hidden = false;

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

  const reopenAll = () => {
    windows.forEach((w) => { w.hidden = false; });
    syncDialog();
  };

  restoreAll.addEventListener("click", () => {
    if (stage().kind === "fatal") {
      location.reload();
      return;
    }
    reopenAll();
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

  // The cheat codes from CHEATS.TXT, for real: type one anywhere on the page, or at the C:\> prompt.
  // The text lives here, so each page picks its language from <html lang>.
  const CHEAT_TEXT = {
    en: {
      activated: "CHEAT ACTIVATED",
      boom: "BOOM!!!",
      truck: "RUBBISH",
      still: "(Animations are off, so you'll have to imagine it.)",
      NUTTERTOOLS: "Minigun!!! Sorry about your monitor.",
      PROFESSIONALTOOLS: "A tight group. Very professional.",
      THUGSTOOLS: "Everybody starts somewhere.",
      PANZER: "Tank!!! Coming through!!!",
      BIGBANG: "Every window nearby goes BOOM!!!",
      LEAVEMEALONE: "Wanted level gone.",
      ASPIRINE: "Full health: every window is back.",
      RUBBISHCAR: "We had touched the forbidden. It also takes the bullet holes away.",
    },
    uk: {
      activated: "ЧИТ АКТИВОВАНО",
      boom: "БАБАХ!!!",
      truck: "СМІТТЯ",
      still: "(Анімацію вимкнено, тож доведеться уявити.)",
      NUTTERTOOLS: "Мініган!!! Вибач за монітор.",
      PROFESSIONALTOOLS: "Купчасто. Дуже професійно.",
      THUGSTOOLS: "Усі з чогось починали.",
      PANZER: "Танк!!! З дороги!!!",
      BIGBANG: "Усі вікна поруч — БАБАХ!!!",
      LEAVEMEALONE: "Без розшуку.",
      ASPIRINE: "Повне здоров'я: усі вікна повернулися.",
      RUBBISHCAR: "Ми торкнулися забороненого. А ще він забирає сліди від куль.",
    },
  };
  const cheatText = CHEAT_TEXT[document.documentElement.lang] ?? CHEAT_TEXT.en;

  const spawn = (className, html = "") => {
    const el = document.createElement("div");
    el.className = className;
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = html;
    document.body.appendChild(el);
    return el;
  };
  // Gone when its own animation ends. animationcancel is "Stop animations" killing it half-way,
  // and the target check skips the animations of whatever is inside, like a tank's wheels.
  const playOnce = (className, html) => {
    const el = spawn(className, html);
    const done = (e) => { if (e.target === el) el.remove(); };
    el.addEventListener("animationend", done);
    el.addEventListener("animationcancel", done);
    return el;
  };

  const page = document.querySelector(".page");
  const shake = () => {
    if (!motion) return;
    page.classList.remove("shake");
    void page.offsetWidth; // Forces a reflow, so a second shake starts over instead of doing nothing.
    page.classList.add("shake");
  };

  const wantedStars = spawn("wanted");
  let wanted = 0;
  const setWanted = (stars) => {
    wanted = Math.min(stars, 6);
    wantedStars.textContent = "★".repeat(wanted);
  };

  // Bullet holes are in the monitor glass, not the page: they stay put while the page scrolls under them.
  const HOLE = `<svg viewBox="-24 -24 48 48"><path d="M0 0L-20-8M0 0L-9-21M0 0L12-18M0 0L22-3M0 0L15 17M0 0L-2 22M0 0L-18 13" fill="none" stroke="#000" stroke-width="1.5"/><circle r="6" fill="#000" stroke="#555" stroke-width="2"/></svg>`;
  const MAX_HOLES = 60;
  const holes = [];
  const addHole = (x, y) => {
    const hole = spawn("fx-hole", HOLE);
    hole.style.left = `${x}px`;
    hole.style.top = `${y}px`;
    hole.style.rotate = `${Math.random() * 360}deg`;
    holes.push(hole);
    if (holes.length > MAX_HOLES) holes.shift().remove();
  };
  // spread is a share of the screen: 0.9 sprays all over it, 0.06 is one tight group.
  const shoot = (shots, spread, stars) => {
    setWanted(wanted + stars);
    shake();
    const midX = innerWidth * (0.2 + Math.random() * 0.6);
    const midY = innerHeight * (0.2 + Math.random() * 0.6);
    for (let i = 0; i < shots; i++) {
      const x = midX + (Math.random() - 0.5) * spread * innerWidth;
      const y = midY + (Math.random() - 0.5) * spread * innerHeight;
      setTimeout(() => addHole(x, y), motion ? i * 70 : 0);
    }
  };

  const wheels = (xs, y, r) => xs.map((x) => `<g class="wheel"><circle cx="${x}" cy="${y}" r="${r}" fill="#666" ${OUTLINE}/><path d="M${x - r} ${y}H${x + r}M${x} ${y - r}V${y + r}" stroke="#000" stroke-width="2.5"/></g>`).join("");
  const TANK = `<svg viewBox="0 0 230 112">
    <rect x="120" y="26" width="104" height="11" rx="3" fill="#5f7235" ${OUTLINE}/>
    <path d="M72 56C74 28 92 16 112 16H132C148 16 156 34 158 56Z" fill="#748a42" ${OUTLINE}/>
    <path d="M24 54H196L214 76H8Z" fill="#748a42" ${OUTLINE}/>
    <rect x="6" y="74" width="208" height="34" rx="17" fill="#333" ${OUTLINE}/>
    ${wheels([26, 67, 108, 149, 190], 91, 13)}
  </svg>`;
  const TRUCK = `<svg viewBox="0 0 270 122">
    <path d="M8 90V52L30 24H74V90Z" fill="#ffdd00" ${OUTLINE}/>
    <path d="M18 52L34 32H62V52Z" fill="#9be7ff" ${OUTLINE}/>
    <rect x="76" y="14" width="186" height="76" rx="8" fill="#2e8b57" ${OUTLINE}/>
    <text x="169" y="62">${cheatText.truck}</text>
    <rect x="6" y="88" width="258" height="10" fill="#555" ${OUTLINE}/>
    ${wheels([48, 122, 216], 102, 17)}
  </svg>`;
  const TANK_MS = 5000;
  const TRUCK_MS = 7000;
  const drive = (className, art, ms) => {
    if (!motion) return;
    playOnce(`fx-vehicle ${className}`, art).style.animationDuration = `${ms}ms`;
  };

  const panzer = () => drive("tank", TANK, TANK_MS);

  // The truck drives in from the right and picks each hole up as it gets there.
  const rubbishCar = () => {
    drive("truck", TRUCK, TRUCK_MS);
    holes.splice(0).forEach((hole) => {
      const arrival = (1 - parseFloat(hole.style.left) / innerWidth) * TRUCK_MS;
      setTimeout(() => hole.remove(), motion ? arrival : 0);
    });
  };

  const BURST = Array.from({ length: 28 }, (_, i) => {
    const radius = i % 2 ? 62 : 104;
    const angle = (i * Math.PI) / 14;
    return `${(Math.cos(angle) * radius).toFixed(1)},${(Math.sin(angle) * radius).toFixed(1)}`;
  }).join(" ");
  const BOOM = `<svg viewBox="-110 -110 220 220">
    <polygon points="${BURST}" fill="#ffdd00" stroke="#000" stroke-width="5" stroke-linejoin="round"/>
    <polygon points="${BURST}" fill="#ff5500" transform="scale(.7)"/>
    <text y="15">${cheatText.boom}</text>
  </svg>`;
  const BLOW_UP_MS = 1000;
  const allGone = (alive) => {
    alive.forEach((w) => {
      w.classList.remove("blown");
      w.hidden = true;
    });
    document.documentElement.classList.remove("exploding");
    syncDialog();
    if (!allClosed.hidden) restoreAll.focus();
  };
  const bigBang = () => {
    const alive = windows.filter((w) => !w.hidden);
    setWanted(wanted + 2);
    if (!motion) {
      allGone(alive);
      return;
    }
    shake();
    playOnce("fx-flash");
    for (let i = 0; i < 6; i++) {
      const boom = playOnce("fx-boom", BOOM);
      boom.style.left = `${10 + Math.random() * 80}%`;
      boom.style.top = `${10 + Math.random() * 80}%`;
      boom.style.animationDelay = `${i * 90}ms`;
    }
    // The windows fly past the edges of the page, which must not grow scrollbars for them.
    document.documentElement.classList.add("exploding");
    alive.forEach((w) => {
      const side = Math.random() < 0.5 ? -1 : 1;
      w.style.setProperty("--fly-x", `${side * (60 + Math.random() * 60)}vw`);
      w.style.setProperty("--fly-y", `${(Math.random() - 0.5) * 120}vh`);
      w.style.setProperty("--fly-spin", `${side * (180 + Math.random() * 540)}deg`);
      w.classList.add("blown");
    });
    setTimeout(() => allGone(alive), BLOW_UP_MS);
  };

  const aspirine = () => {
    const wasOnRestore = document.activeElement === restoreAll;
    reopenAll();
    if (wasOnRestore) document.getElementById("main").focus({ preventScroll: true });
  };

  const CHEATS = {
    NUTTERTOOLS: () => shoot(30, 0.9, 2),
    PROFESSIONALTOOLS: () => shoot(6, 0.06, 1),
    THUGSTOOLS: () => shoot(2, 0.2, 1),
    PANZER: panzer,
    BIGBANG: bigBang,
    LEAVEMEALONE: () => setWanted(0),
    ASPIRINE: aspirine,
    RUBBISHCAR: rubbishCar,
  };

  const toast = document.createElement("div");
  toast.className = "cheat-toast";
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  let toastTimer;

  const activate = (code) => {
    // A cheat typed while reading CHEATS.TXT would play behind the open dialog.
    document.querySelectorAll("dialog[open]").forEach((d) => d.close());
    CHEATS[code]();
    const missed = !motion && (code === "PANZER" || code === "RUBBISHCAR");
    const line = missed ? `${cheatText[code]} ${cheatText.still}` : cheatText[code];
    toast.textContent = `${cheatText.activated}\n${line}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.textContent = ""; }, 4000);
    return line;
  };

  const dosInput = document.getElementById("dos-input");
  const CODES = Object.keys(CHEATS);
  const LONGEST_CODE = Math.max(...CODES.map((c) => c.length));
  let keys = "";
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || e.target === dosInput) return;
    // e.code is for a Cyrillic layout, where e.key has no Latin letter: the keys still spell PANZER.
    const letter = /^[a-z]$/i.test(e.key) ? e.key.toUpperCase() : e.code?.match(/^Key([A-Z])$/)?.[1];
    if (!letter) return;
    keys = (keys + letter).slice(-LONGEST_CODE);
    const code = CODES.find((c) => keys.endsWith(c));
    if (code) {
      keys = "";
      activate(code);
    }
  });

  // The DOS prompt under the two static boxes. TYPE reads the real page rather than a copy,
  // so the prompt can't disagree with it, stays in the page's language and also sees closed windows.
  const DOS_TEXT = {
    en: {
      banner: "HLIB-DOS Version 6.22\nType HELP to see what this thing can do.",
      help: [
        "DIR           list the files",
        "TYPE <file>   show what's inside a file",
        "<file>.EXE    run a program",
        "CLS           clear the screen",
        "VER           show the version",
        "FORMAT C:     don't.",
        "",
        "Cheat codes work here too: see TYPE CHEATS.TXT",
      ].join("\n"),
      volume: "Volume in drive C is HLIB_1994",
      directory: "Directory of C:\\",
      total: (files, bytes) => `${files} file(s)  ${bytes} bytes`,
      badCommand: "Bad command or file name",
      layout: "(Psst: your keyboard isn't on English.)",
      notFound: (name) => `File not found - ${name}`,
      missing: "Required parameter missing",
      invalidDrive: "Invalid drive specification",
      invalidDirectory: "Invalid directory",
      denied: "Access denied. Nice try.",
      ls: "This is DOS, not Linux. Try DIR.",
      cat: "=^.^= I love cats too, but here it's TYPE.",
      sudo: "This is DOS. There is only you, and you're already in charge.",
      exit: "There is no escape from the 90s.",
      running: (name) => `Running ${name}...`,
      warning: "WARNING, ALL DATA ON NON-REMOVABLE DISK\nDRIVE C: WILL BE LOST!\nProceed with Format (Y/N)?",
      cancelled: "Smart move. Nothing was harmed.",
      formatting: "Formatting 1,994 MB...",
      progress: (percent) => `${percent} percent completed.`,
      formatted: "Format complete.\n\n0 bytes total disk space\n0 bytes available on disk\n\nOops. That was the whole web site.\nDon't worry, it's all on GitHub.",
      reboot: "Reboot",
    },
    uk: {
      banner: "HLIB-DOS версія 6.22\nВведи HELP, щоб побачити, що ця штука вміє.",
      help: [
        "DIR           показати файли",
        "TYPE <файл>   показати, що у файлі",
        "<файл>.EXE    запустити програму",
        "CLS           очистити екран",
        "VER           показати версію",
        "FORMAT C:     не треба.",
        "",
        "Чит-коди працюють і тут: дивись TYPE CHEATS.TXT",
      ].join("\n"),
      volume: "Том у дисководі C: HLIB_1994",
      directory: "Вміст каталогу C:\\",
      total: (files, bytes) => `Файлів: ${files}, байтів: ${bytes}`,
      badCommand: "Неправильна команда або ім'я файлу",
      layout: "(Псст: перемкни розкладку на English.)",
      notFound: (name) => `Файл не знайдено - ${name}`,
      missing: "Не вказано обов'язковий параметр",
      invalidDrive: "Неправильно вказаний диск",
      invalidDirectory: "Неправильний каталог",
      denied: "Доступ заборонено. Гарна спроба.",
      ls: "Це DOS, а не Linux. Спробуй DIR.",
      cat: "=^.^= Котиків я теж люблю, але тут це TYPE.",
      sudo: "Це DOS. Тут є тільки ти, і ти вже головний.",
      exit: "Із 90-х виходу немає.",
      running: (name) => `Запускаю ${name}...`,
      warning: "УВАГА! УСІ ДАНІ НА ЖОРСТКОМУ ДИСКУ C:\nБУДЕ ВТРАЧЕНО!\nПродовжити форматування (Y/N)?",
      cancelled: "Мудре рішення. Ніхто не постраждав.",
      formatting: "Форматування 1 994 МБ...",
      progress: (percent) => `Виконано ${percent}%.`,
      formatted: "Форматування завершено.\n\n0 байтів на диску\n0 байтів вільно\n\nОй. Це був увесь вебсайт.\nСпокійно, усе є на GitHub.",
      reboot: "Перезавантажити",
    },
  };
  const dosText = DOS_TEXT[document.documentElement.lang] ?? DOS_TEXT.en;

  const dos = document.getElementById("dos");
  const dosLog = document.getElementById("dos-log");
  const print = (text) => {
    const line = document.createElement("div");
    line.textContent = text;
    dosLog.appendChild(line);
    // The log just grew, and that must not push the line being typed on off the screen.
    if (document.activeElement === dosInput) dosInput.scrollIntoView({ block: "nearest" });
    return line;
  };

  const FILES = [
    ["ABOUT_ME.TXT", "#about .body"],
    ["WHATS_NEW.HTM", "#now .body"],
    ["KOOL_STUFF.EXE", "#work .body"],
    ["FREE_SOFTWARE.ZIP", "#oss .body"],
    ["MY_SKILLZ.XLS", "#stack .body"],
    ["LIKES.INI", "#hobbies .body"],
    ["FACTS.TXT", "#facts"],
    ["HIRE_ME.EXE", "#hire-me"],
    ["CHEATS.TXT", "#cheats .notepad"],
  ].map(([name, selector]) => ({ name, source: document.querySelector(selector) }));

  // By hand, because innerText only works on what's on screen, and a closed window isn't.
  const toText = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.data.replace(/\s+/g, " ");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    if (node.matches('[aria-hidden="true"], figure, dialog, .worth, .robots-prompt')) return "";
    const inner = [...node.childNodes].map(toText).join("");
    if (node.matches("dt, th")) return `\n${inner}: `;
    if (node.matches("li")) return `\n- ${inner}`;
    if (node.matches("tr")) return `\n${inner}`;
    return node.matches("p, h3, dl, ul, ol, table") ? `\n${inner}\n` : inner;
  };
  const fileText = (file) => toText(file.source).replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  const typeFile = ([path]) => {
    if (!path) return print(dosText.missing);
    const name = path.replace(/^C:\\/, "");
    const file = FILES.find((f) => f.name === name);
    return print(file ? fileText(file) : dosText.notFound(name));
  };

  const listFiles = () => {
    const sizes = FILES.map(fileText).map((text) => text.length);
    const rows = FILES.map(({ name }, i) => `${name.padEnd(18)}${sizes[i].toLocaleString("en-US").padStart(7)}  12-31-99`);
    const bytes = sizes.reduce((sum, size) => sum + size, 0).toLocaleString("en-US");
    print([` ${dosText.volume}`, ` ${dosText.directory}`, "", ...rows, "", dosText.total(FILES.length, bytes)].join("\n"));
  };

  const runProgram = (file) => {
    print(dosText.running(file.name));
    const target = file.source.closest("section");
    if (target.hidden) {
      target.hidden = false;
      syncDialog();
    }
    target.scrollIntoView({ behavior: motion ? "smooth" : "auto", block: "start" });
  };

  const formatScreen = document.getElementById("format-screen");
  const formatText = document.getElementById("format-text");
  const formatReboot = document.getElementById("format-reboot");
  formatReboot.textContent = dosText.reboot;
  formatReboot.addEventListener("click", () => location.reload());

  const eraseEverything = () => {
    const finish = () => {
      formatText.textContent = `C:\\> FORMAT C:\n${dosText.formatting}\n${dosText.progress(100)}\n${dosText.formatted}`;
      formatReboot.hidden = false;
      formatReboot.focus();
    };
    formatScreen.showModal();
    if (!motion) {
      finish();
      return;
    }
    let percent = 0;
    const tick = setInterval(() => {
      formatText.textContent = `C:\\> FORMAT C:\n${dosText.formatting}\n${dosText.progress(percent)}`;
      percent += 5;
      if (percent > 100) {
        clearInterval(tick);
        finish();
      }
    }, 120);
  };

  // Set while FORMAT C: waits for its Y/N, so the next line typed is the answer and not a command.
  let awaitingAnswer = false;
  const answer = (typed) => {
    const reply = typed.trim().toUpperCase();
    if (reply === "Y") {
      awaitingAnswer = false;
      eraseEverything();
    } else if (reply === "N") {
      awaitingAnswer = false;
      print(dosText.cancelled);
    } else {
      print(dosText.warning.split("\n").pop());
    }
  };

  const format = ([drive]) => {
    if (!drive) {
      print(dosText.missing);
    } else if (drive !== "C:") {
      print(dosText.invalidDrive);
    } else {
      awaitingAnswer = true;
      print(dosText.warning);
    }
  };

  const say = (text) => () => print(text);
  const COMMANDS = {
    HELP: say(dosText.help),
    "?": say(dosText.help),
    DIR: listFiles,
    TYPE: typeFile,
    CLS: () => dosLog.replaceChildren(),
    VER: say(dosText.banner),
    FORMAT: format,
    CD: ([path]) => print(path ? dosText.invalidDirectory : "C:\\"),
    DEL: say(dosText.denied),
    DELTREE: say(dosText.denied),
    RM: say(dosText.denied),
    LS: say(dosText.ls),
    CAT: say(dosText.cat),
    SUDO: say(dosText.sudo),
    EXIT: say(dosText.exit),
  };

  const run = (typed) => {
    const [command, ...args] = typed.trim().toUpperCase().split(/\s+/);
    if (!command) return;
    if (COMMANDS[command]) {
      COMMANDS[command](args);
    } else if (CHEATS[command]) {
      print(activate(command));
      // A phone's keyboard would hide the tank.
      if (matchMedia("(pointer: coarse)").matches) dosInput.blur();
    } else {
      const program = FILES.find((f) => f.name.endsWith(".EXE") && [f.name, f.name.slice(0, -4)].includes(command));
      if (program) runProgram(program);
      else print(/[а-яіїєґ]/i.test(command) ? `${dosText.badCommand} ${dosText.layout}` : dosText.badCommand);
    }
  };

  print(dosText.banner);
  dos.hidden = false;

  const typedBefore = [];
  let historyAt = -1;
  document.getElementById("dos-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const typed = dosInput.value;
    dosInput.value = "";
    if (typed.trim()) typedBefore.unshift(typed);
    historyAt = -1;
    const echo = print(`C:\\> ${typed}`);
    if (awaitingAnswer) answer(typed);
    else run(typed);
    // From the command down, not the very end: a long TYPE should open on its first line.
    dosLog.scrollTop = echo.isConnected ? echo.offsetTop : 0;
  });
  dosInput.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    historyAt = Math.max(-1, Math.min(historyAt + (e.key === "ArrowUp" ? 1 : -1), typedBefore.length - 1));
    dosInput.value = typedBefore[historyAt] ?? "";
  });
  dos.addEventListener("click", () => {
    if (!getSelection().toString()) dosInput.focus();
  });
})();
