// Script for the cyberpunk experiment: /2077/. Same mechanics as 90s.js, new paint.
(() => {
  // Animations: the button at the top stops them all, and the choice is remembered.
  // With no saved choice, the system's "reduce motion" setting decides.
  const MOTION_KEY = "hz2077-motion";
  let saved = null;
  try { saved = localStorage.getItem(MOTION_KEY); } catch {}
  let motion = saved ? saved === "on" : !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionToggle = document.getElementById("motion-toggle");
  const applyMotion = () => {
    document.documentElement.classList.toggle("no-motion", !motion);
    document.documentElement.classList.toggle("motion-on", motion);
    motionToggle.innerHTML = motion
      ? '<span aria-hidden="true">■</span> Kill animations'
      : '<span aria-hidden="true">▶</span> Run animations';
  };
  applyMotion();
  motionToggle.hidden = false;
  motionToggle.addEventListener("click", () => {
    motion = !motion;
    try { localStorage.setItem(MOTION_KEY, motion ? "on" : "off"); } catch {}
    applyMotion();
  });

  // The counter belongs to the 90s page, so this page only reads it and never adds a visit.
  const COUNTER_URL = "https://5xswyi5y55xzsyrqgizq2sp3qy0ymcwz.lambda-url.eu-north-1.on.aws/?id=90s";
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
  fetch(COUNTER_URL)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(({ count }) => show(String(count)))
    .catch(() => show("OFFLINE"));

  // Closable shards: × hides one, the QUICKHACKS menu brings it back, and closing them all shows a message.
  // Each time everything gets closed the message gets grumpier, until the last one only offers a reload.
  const shards = [...document.querySelectorAll("section.shard")];
  const allClosed = document.getElementById("all-closed");
  const restoreAll = document.getElementById("restore-all");
  const stages = [
    { kind: "error", bar: "SYSTEM ERROR", icon: "×", text: "Whoa, choom, you closed every shard :( Not preem enough for you?", button: "Sorry!! Restore from backup" },
    { kind: "error", bar: "SYSTEM ERROR", icon: "×", text: "Again?! This node won't fade away that easy, choom.", button: "Never fade away (restore)" },
    { kind: "error", bar: "SYSTEM ERROR", icon: "×", text: ">:( >:( >:( Why do you keep closing everything?! This is not a braindance, it's a REAL DATAFORT, you gonk!!!", button: "OK OK, crystal, my bad" },
    { kind: "warning", bar: "WARNING", icon: "!", text: "STOP!!! You're frying our neural net. Core temperature critical, the server is going hexed!!!", button: "I swear it's the last time, choom" },
    { kind: "fatal", bar: "FATAL ERROR", icon: "×", text: "FATAL EXCEPTION 0x2077: NEURAL OVERLOAD. The server got flatlined. The Net must be rebooted: refresh the page.", button: "Reboot (F5)" },
  ];
  let timesClosed = 0;
  const stage = () => stages[Math.min(timesClosed, stages.length) - 1];

  const syncDialog = () => {
    const wasHidden = allClosed.hidden;
    allClosed.hidden = shards.some((s) => !s.hidden);
    if (!wasHidden || allClosed.hidden) return;
    timesClosed++;
    const { kind, bar, icon, text, button } = stage();
    allClosed.className = `dialog ${kind}`;
    document.getElementById("all-closed-bar").textContent = bar;
    document.getElementById("all-closed-icon").textContent = icon;
    document.getElementById("all-closed-text").textContent = text;
    restoreAll.textContent = button;
  };

  shards.forEach((s, i) => {
    const close = s.querySelector(".close");
    const title = s.querySelector(".bar h2");
    // "Close shard: PROFILE.shard", so a screen reader can tell the × buttons apart.
    close.setAttribute("aria-label", `${close.getAttribute("aria-label")}: ${title.textContent}`);
    title.tabIndex = -1;
    close.addEventListener("click", () => {
      s.hidden = true;
      syncDialog();
      // The button just vanished, so keyboard focus moves to the shard that took its place.
      // preventScroll: focusing something off-screen would make the page jump.
      const next = shards.slice(i + 1).find((x) => !x.hidden) ?? shards.slice(0, i).reverse().find((x) => !x.hidden);
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
    shards.forEach((s) => { s.hidden = false; });
    syncDialog();
    shards[0].scrollIntoView({ behavior: motion ? "smooth" : "auto", block: "start" });
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

  // The "cheat codes" link under the Vice City photo.
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

})();
