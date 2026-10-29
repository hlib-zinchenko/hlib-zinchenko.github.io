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
  const COUNTER_URL = "https://5xswyi5y55xzsyrqgizq2sp3qy0ymcwz.lambda-url.eu-north-1.on.aws/?id=90s";
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

  windows.forEach((w) => {
    const close = w.querySelector(".close");
    // "Close window: ABOUT_ME.TXT - Notepad", so a screen reader can tell the × buttons apart.
    close.setAttribute("aria-label", `${close.getAttribute("aria-label")}: ${w.querySelector(".bar h2").textContent}`);
    close.addEventListener("click", () => {
      w.hidden = true;
      syncDialog();
      // The button just vanished, so keyboard focus moves to something that still exists.
      if (!allClosed.hidden) restoreAll.focus();
      else document.querySelector(`nav.sidebar a[href="#${w.id}"]`)?.focus();
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
