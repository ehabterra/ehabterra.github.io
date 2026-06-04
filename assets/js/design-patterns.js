/* =====================================================================
   Design Patterns learning section — progress, quiz, TOC, scrollspy.
   No dependencies. State persisted in localStorage under "dp-progress".
   ===================================================================== */
(function () {
  "use strict";

  var STORE_KEY = "dp-progress";

  /* ---------- progress store ---------- */
  function loadLearned() {
    try { return new Set(JSON.parse(localStorage.getItem(STORE_KEY) || "[]")); }
    catch (e) { return new Set(); }
  }
  function saveLearned(set) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(Array.from(set))); } catch (e) {}
  }
  var learned = loadLearned();

  function isLearned(slug) { return learned.has(slug); }
  function setLearned(slug, on) {
    if (on) learned.add(slug); else learned.delete(slug);
    saveLearned(learned);
    document.dispatchEvent(new CustomEvent("dp:progress", { detail: { slug: slug, on: on } }));
  }

  /* ---------- mark-as-learned button (pattern page) ---------- */
  function initLearnButton() {
    var btn = document.querySelector("[data-dp-learn]");
    if (!btn) return;
    var slug = btn.getAttribute("data-dp-learn");
    function render() {
      var on = isLearned(slug);
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.querySelector("[data-dp-learn-label]").textContent = on ? "Learned ✓" : "Mark as learned";
    }
    btn.addEventListener("click", function () { setLearned(slug, !isLearned(slug)); render(); });
    render();
  }

  /* ---------- cards + progress bars (landing / section pages) ---------- */
  function pct(done, total) { return total ? Math.round((done / total) * 100) : 0; }

  function paintCards() {
    document.querySelectorAll(".dp-card[data-slug]").forEach(function (card) {
      card.classList.toggle("is-learned", isLearned(card.getAttribute("data-slug")));
    });
  }

  function paintProgressBars() {
    // each [data-dp-progress] holds data-slugs="a,b,c" for its group
    document.querySelectorAll("[data-dp-progress]").forEach(function (el) {
      var slugs = (el.getAttribute("data-slugs") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      var done = slugs.filter(isLearned).length;
      var p = pct(done, slugs.length);
      var fill = el.querySelector(".dp-progress__fill");
      var label = el.querySelector(".dp-progress__label");
      if (fill) fill.style.width = p + "%";
      if (label) label.textContent = done + " / " + slugs.length + " · " + p + "%";
    });
  }

  function initProgressViews() {
    if (!document.querySelector(".dp-card[data-slug], [data-dp-progress]")) return;
    paintCards();
    paintProgressBars();
    document.addEventListener("dp:progress", function () { paintCards(); paintProgressBars(); });
    // cross-tab / back-from-pattern-page sync
    window.addEventListener("storage", function (e) {
      if (e.key === STORE_KEY) { learned = loadLearned(); paintCards(); paintProgressBars(); }
    });
  }

  /* ---------- reset progress ---------- */
  function initReset() {
    var btn = document.querySelector("[data-dp-reset]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (!window.confirm("Reset your learning progress? This clears all 'learned' marks.")) return;
      learned = new Set(); saveLearned(learned);
      paintCards(); paintProgressBars();
      document.querySelectorAll("[data-dp-learn]").forEach(function () {});
    });
  }

  /* ---------- auto TOC + scrollspy (pattern page) ---------- */
  function slugify(s) {
    return s.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function initToc() {
    var tocList = document.querySelector("[data-dp-toc]");
    var body = document.querySelector(".dp-article__body");
    if (!tocList || !body) return;
    var heads = body.querySelectorAll("h2, h3");
    if (!heads.length) { var wrap = document.querySelector(".dp-article__toc"); if (wrap) wrap.style.display = "none"; return; }
    var items = [];
    heads.forEach(function (h) {
      if (!h.id) h.id = slugify(h.textContent);
      var li = document.createElement("li");
      li.className = h.tagName === "H3" ? "lvl-3" : "lvl-2";
      var a = document.createElement("a");
      a.href = "#" + h.id; a.textContent = h.textContent;
      li.appendChild(a); tocList.appendChild(li);
      items.push({ id: h.id, link: a, el: h });
    });
    var spy = function () {
      var top = window.scrollY + 110, current = items[0];
      for (var i = 0; i < items.length; i++) {
        if (items[i].el.offsetTop <= top) current = items[i];
      }
      items.forEach(function (it) { it.link.classList.toggle("is-active", it === current); });
    };
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      window.requestAnimationFrame(function () { spy(); ticking = false; });
    });
    spy();
  }

  /* ---------- quiz ---------- */
  function initQuiz() {
    var quiz = document.querySelector("[data-dp-quiz]");
    if (!quiz) return;
    var total = quiz.querySelectorAll(".dp-q").length;
    var answered = 0, correct = 0;
    var scoreEl = quiz.querySelector("[data-dp-score]");
    function updateScore() { if (scoreEl) scoreEl.textContent = "Score: " + correct + " / " + total; }
    updateScore();
    quiz.querySelectorAll(".dp-q").forEach(function (q) {
      var done = false;
      q.querySelectorAll(".dp-opt").forEach(function (opt) {
        opt.addEventListener("click", function () {
          if (done) return; done = true; answered++;
          var right = opt.getAttribute("data-correct") === "true";
          if (right) { opt.classList.add("is-correct"); correct++; }
          else {
            opt.classList.add("is-wrong");
            var good = q.querySelector('.dp-opt[data-correct="true"]');
            if (good) good.classList.add("is-correct");
          }
          q.querySelectorAll(".dp-opt").forEach(function (o) { o.disabled = true; });
          var ex = q.querySelector(".dp-q__explain"); if (ex) ex.classList.add("is-shown");
          updateScore();
        });
      });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    initLearnButton();
    initProgressViews();
    initReset();
    initToc();
    initQuiz();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
