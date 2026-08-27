(function () {
  var root = document.documentElement;
  var A = window.anime;
  var reduced = false;
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  function bail() {
    root.classList.remove("js");
  }

  if (!A || reduced || !("IntersectionObserver" in window) || !document.querySelector(".hero-band")) { bail(); return; }

  try {
    var h1 = document.querySelector(".hero-copy .display-xl");
    if (h1 && !h1.dataset.split) {
      h1.dataset.split = "1";
      var frag = document.createDocumentFragment();
      Array.prototype.forEach.call(h1.childNodes, function (node) {
        if (node.nodeType === 3) {
          node.textContent.trim().split(/\s+/).forEach(function (w) {
            if (!w) return;
            var m = document.createElement("span"); m.className = "wmask";
            var s = document.createElement("span"); s.className = "word"; s.textContent = w;
            m.appendChild(s); frag.appendChild(m); frag.appendChild(document.createTextNode(" "));
          });
        } else if (node.nodeType === 1) {
          if (node.classList.contains("grad-word")) { frag.appendChild(node); frag.appendChild(document.createTextNode(" ")); return; }
          var text = node.textContent.trim();
          if (!text) return;
          var mm = document.createElement("span"); mm.className = "wmask";
          var ss = document.createElement("span"); ss.className = "word"; ss.textContent = text;
          mm.appendChild(ss); frag.appendChild(mm); frag.appendChild(document.createTextNode(" "));
        }
      });
      h1.innerHTML = "";
      h1.appendChild(frag);
    }

    var tl = A.createTimeline({ defaults: { ease: "out(4)", duration: 800 } });
    tl.add(".hero-copy .badge-pill", { translateY: [-14, 0], opacity: [0, 1], duration: 600 }, 0)
      .add(".hero-copy .wmask .word", { translateY: ["112%", "0%"], duration: 750, delay: A.stagger(42) }, "-=420")
      .add(".hero-copy .body-strong", { translateY: [18, 0], opacity: [0, 1] }, "-=540")
      .add(".button-row .btn", { translateY: [14, 0], opacity: [0, 1], delay: A.stagger(90) }, "-=480");

    if (document.querySelector(".mock-window")) {
      tl.add(".code-window-card", { translateX: [56, 0], rotate: [2.5, 0], opacity: [0, 1], duration: 950, ease: "out(3)" }, 180)
        .add(".code-block .line", { translateX: [-14, 0], opacity: [0, 1], delay: A.stagger(65), duration: 380 }, "-=680");
    } else {
      tl.add(".hero-stage", { opacity: [0, 1], scale: [0.96, 1], duration: 950, ease: "out(3)" }, 180);
    }

    var orbsVisible = Array.prototype.every.call(document.querySelectorAll(".orb"), function (o) { return o.offsetParent !== null; });
    if (orbsVisible) {
      A.animate(".orb-a", { translateX: [0, 46], translateY: [0, -30], duration: 11000, loop: true, alternate: true, ease: "inOutSine" });
      A.animate(".orb-b", { translateX: [0, -38], translateY: [0, 34], duration: 13000, loop: true, alternate: true, ease: "inOutSine" });
      A.animate(".orb-c", { scale: [1, 1.18], opacity: [0.35, 0.55], duration: 9000, loop: true, alternate: true, ease: "inOutSine" });
    }

    A.animate(".status-dot", { scale: [1, 1.35], duration: 1200, loop: true, alternate: true, ease: "inOutSine" });
    A.animate(".cta-glow", { opacity: [0.45, 0.9], scale: [0.92, 1.06], duration: 5000, loop: true, alternate: true, ease: "inOutSine" });

    var bar = document.getElementById("scroll-progress");
    if (bar) {
      var onScroll = function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    var band = document.querySelector(".hero-band");
    var orbs = band ? band.querySelectorAll(".orb") : [];
    if (band && orbs.length && window.matchMedia("(pointer:fine)").matches) {
      band.addEventListener("mousemove", function (e) {
        var r = band.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        A.animate(orbs[0], { translateX: dx * 70, translateY: dy * 44, duration: 900, ease: "out(3)" });
        if (orbs[1]) A.animate(orbs[1], { translateX: dx * -54, translateY: dy * -36, duration: 900, ease: "out(3)" });
        if (orbs[2]) A.animate(orbs[2], { translateX: dx * 26, translateY: dy * 20, duration: 900, ease: "out(3)" });
      });
    }

    document.querySelectorAll(".button-row .btn-primary").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        A.animate(b, { translateX: ((e.clientX - r.left) / r.width - 0.5) * 10, translateY: ((e.clientY - r.top) / r.height - 0.5) * 8, duration: 300, ease: "out(3)" });
      });
      b.addEventListener("mouseleave", function () {
        A.animate(b, { translateX: 0, translateY: 0, duration: 450, ease: "out(4)" });
      });
    });

    document.querySelectorAll(".feature-card").forEach(function (c) {
      c.addEventListener("mousemove", function (e) {
        var r = c.getBoundingClientRect();
        A.animate(c, {
          rotateX: ((e.clientY - r.top) / r.height - 0.5) * -6,
          rotateY: ((e.clientX - r.left) / r.width - 0.5) * 8,
          duration: 250, ease: "out(2)"
        });
      });
      c.addEventListener("mouseleave", function () {
        A.animate(c, { rotateX: 0, rotateY: 0, duration: 550, ease: "out(4)" });
      });
    });

    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var el = en.target;
        var target = parseFloat(el.dataset.count);
        var suffix = el.dataset.suffix || "";
        var prefix = el.dataset.prefix || "";
        if (!target) { el.textContent = prefix + "0" + suffix; return; }
        var obj = { v: 0 };
        A.animate(obj, {
          v: target, duration: 1500, ease: "out(3)",
          update: function () { el.textContent = prefix + Math.round(obj.v) + suffix; }
        });
      });
    }, { threshold: 0.6 });
    document.querySelectorAll("[data-count]").forEach(function (el) { cio.observe(el); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        var el = entry.target;
        var kids = el.hasAttribute("data-reveal-group") ? el.children : null;
        if (kids && kids.length) {
          A.animate(kids, { translateY: [26, 0], opacity: [0, 1], delay: A.stagger(90), duration: 650, ease: "out(3)" });
        } else {
          A.animate(el, { translateY: [24, 0], opacity: [0, 1], duration: 600, ease: "out(3)" });
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll("[data-reveal], [data-reveal-group]").forEach(function (el) { io.observe(el); });
  } catch (err) {
    bail();
  }
})();
