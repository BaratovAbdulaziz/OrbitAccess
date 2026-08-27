(function () {
  "use strict";

  const SELECTOR = "[data-orbit-object]";
  const HUB_SELECTOR = ".oo-hub";
  const NODE_SELECTOR = ".oo-node";
  const PANEL_SELECTOR = ".oo-panel";
  const CLOSE_SELECTOR = ".oo-close";
  const ARC_SELECTOR = ".oo-arc";

  const GITHUB_NODE = { name: "GitHub", key: "gh", radius: 140, speed: 0.00048, phase: 0, incline: 0.32, color: "var(--primary)" };
  const NOTION_NODE = { name: "Notion", key: "nt", radius: 195, speed: -0.00033, phase: 2.1, incline: -0.26, color: "var(--teal)" };
  const NODES = [GITHUB_NODE, NOTION_NODE];

  const PERSPECTIVE = 900;
  const HUB_SIZE = 56;
  const NODE_SIZE = 32;
  const OPEN_HUB_SCALE = 1.35;
  const DOCK_SCALE = 0.9;

  let host = null;
  let hub = null;
  let nodes = [];
  let arcs = [];
  let panel = null;
  let closeBtn = null;
  let stage = null;
  let band = null;
  let root = null;

  let state = "rest";
  let reducedMotion = false;
  let visible = true;
  let tabVisible = true;
  let lastTime = 0;
  let rafId = null;
  let angleA = GITHUB_NODE.phase;
  let angleB = NOTION_NODE.phase;
  let speedMul = 1;
  let targetSpeedMul = 1;
  let dockTargets = null;
  let openStartTime = 0;

  // Scroll-linked state
  let scrollProgress = 0;
  let scrollVelocity = 0;
  let lastScrollY = 0;
  let scrollTicking = false;
  let hasAutoOpened = false;

  const GITHUB_ICON = `<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>`;

  const NOTION_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>`;

  const SPIKE_LOGO = `<svg class="spike" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/></svg>`;

  function webglOK() {
    try {
      const canvas = document.createElement("canvas");
      return !!canvas.getContext("webgl") || !!canvas.getContext("experimental-webgl");
    } catch (e) {
      return false;
    }
  }

  function transformsOK() {
    const style = document.documentElement.style;
    return "transform" in style || "webkitTransform" in style;
  }

  function useFallback() {
    if (!band || !root) return;
    band.classList.add("hero-fallback");
    root.classList.remove("js");
    delete window.OrbitObject;
  }

  function getStageRect() {
    return stage.getBoundingClientRect();
  }

  function project(x, y, z) {
    const f = PERSPECTIVE / (PERSPECTIVE - z);
    return { x: x * f, y: y * f, scale: f };
  }

  function orbitPosition(node, angle) {
    const R = node.radius;
    const a = angle;
    const incl = node.incline;
    const x = R * Math.cos(a);
    const z = R * Math.sin(a) * Math.cos(incl);
    const y = -R * Math.sin(a) * Math.sin(incl);
    return { x, y, z };
  }

  function updateArcs() {
    const rect = getStageRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    nodes.forEach((nodeObj, i) => {
      const node = NODES[i];
      const angle = i === 0 ? angleA : angleB;
      const pos3d = orbitPosition(node, angle);
      const proj = project(pos3d.x, pos3d.y, pos3d.z);
      const hubEdgeX = (proj.x > 0 ? 1 : -1) * (HUB_SIZE / 2) * proj.scale;
      const hubEdgeY = (proj.y > 0 ? 1 : -1) * (HUB_SIZE / 2) * proj.scale * 0.5;
      const mx = (cx + proj.x + cx + hubEdgeX) / 2;
      const my = (cy + proj.y + cy + hubEdgeY) / 2 - 24 * proj.scale;
      const path = `M ${cx + proj.x} ${cy + proj.y} Q ${mx} ${my} ${cx + hubEdgeX} ${cy + hubEdgeY}`;
      arcs[i].setAttribute("d", path);
      const opacity = state === "rest" ? 0.35 : Math.max(0, 1 - (Date.now() - openStartTime) / 300);
      arcs[i].style.opacity = opacity;
    });
  }

  function updateNodes(dt) {
    if (state === "rest") {
      angleA += NODES[0].speed * dt * speedMul;
      angleB += NODES[1].speed * dt * speedMul;
    }
    const rect = getStageRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    nodes.forEach((el, i) => {
      const node = NODES[i];
      let angle = i === 0 ? angleA : angleB;
      let x, y, z, scale, opacity, zIndex;
      if (state === "rest" || state === "opening") {
        const pos3d = orbitPosition(node, angle);
        const proj = project(pos3d.x, pos3d.y, pos3d.z);
        x = cx + proj.x;
        y = cy + proj.y;
        scale = proj.scale;
        opacity = 0.55 + 0.45 * Math.max(0, Math.min(1, (pos3d.z + node.radius) / (2 * node.radius)));
        zIndex = pos3d.z > 0 ? 3 : 1;
      } else if (state === "open" && dockTargets) {
        const t = dockTargets[i];
        x = t.x;
        y = t.y;
        scale = DOCK_SCALE;
        opacity = 1;
        zIndex = 4;
      } else if (state === "closing" && dockTargets) {
        const t = dockTargets[i];
        const pos3d = orbitPosition(node, angle);
        const proj = project(pos3d.x, pos3d.y, pos3d.z);
        const prog = Math.min(1, (Date.now() - openStartTime) / 500);
        x = t.x + (cx + proj.x - t.x) * prog;
        y = t.y + (cy + proj.y - t.y) * prog;
        scale = DOCK_SCALE + (proj.scale - DOCK_SCALE) * prog;
        opacity = 1 - (1 - (0.55 + 0.45 * Math.max(0, Math.min(1, (pos3d.z + node.radius) / (2 * node.radius))))) * prog;
        zIndex = prog > 0.5 ? (pos3d.z > 0 ? 3 : 1) : 4;
      }
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
      el.style.opacity = opacity;
      el.style.zIndex = zIndex;
    });
  }

  function tick(time) {
    if (!lastTime) lastTime = time;
    const dt = Math.min(50, time - lastTime);
    lastTime = time;

    // Decay scroll velocity so juggle fades when scrolling stops
    scrollVelocity *= Math.pow(0.95, dt / 16.67);

    if (state === "rest" && visible && tabVisible && !reducedMotion) {
      speedMul += (targetSpeedMul - speedMul) * Math.min(1, dt * 0.006);
      // Scroll velocity adds a "juggle" - orbit tilts and speeds up
      const juggle = Math.max(-1, Math.min(1, scrollVelocity * 0.02));
      targetSpeedMul = 1 + Math.abs(juggle) * 4;
      // Apply subtle stage tilt based on scroll velocity
      if (stage) {
        stage.style.transform = `rotateX(${juggle * 6}deg) rotateY(${juggle * 3}deg)`;
        stage.style.transition = "transform 80ms linear";
      }
      updateNodes(dt);
      updateArcs();
    } else if (state === "opening") {
      updateNodes(dt);
      updateArcs();
    } else if (state === "closing") {
      updateNodes(dt);
      updateArcs();
    } else if (state === "open" && stage) {
      // Reset stage tilt when open
      stage.style.transform = "none";
      stage.style.transition = "transform 300ms ease";
    }

    rafId = requestAnimationFrame(tick);
  }

  function computeDockTargets() {
    const rect = getStageRect();
    const cx = rect.width / 2;
    const panelRect = panel.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const colGh = panel.querySelector(".oo-col--gh");
    const colNt = panel.querySelector(".oo-col--nt");
    if (!colGh || !colNt) return null;
    const ghRect = colGh.getBoundingClientRect();
    const ntRect = colNt.getBoundingClientRect();
    return [
      { x: ghRect.left - stageRect.left + ghRect.width / 2, y: ghRect.top - stageRect.top + ghRect.height / 2 },
      { x: ntRect.left - stageRect.left + ntRect.width / 2, y: ntRect.top - stageRect.top + ntRect.height / 2 }
    ];
  }

  function open() {
    if (state !== "rest") return;
    state = "opening";
    openStartTime = Date.now();
    targetSpeedMul = 0;
    hub.setAttribute("aria-expanded", "true");
    host.classList.add("is-opening");
    host.classList.remove("is-open");
    dockTargets = computeDockTargets();
    if (!dockTargets) {
      finishOpen();
      return;
    }
    const anime = window.anime;
    if (anime) {
      anime({
        targets: hub,
        scale: [1, OPEN_HUB_SCALE],
        duration: 500,
        easing: "out(3)"
      });
      nodes.forEach((el, i) => {
        const t = dockTargets[i];
        const rect = getStageRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const node = NODES[i];
        const angle = i === 0 ? angleA : angleB;
        const pos3d = orbitPosition(node, angle);
        const proj = project(pos3d.x, pos3d.y, pos3d.z);
        const startX = cx + proj.x;
        const startY = cy + proj.y;
        const startScale = proj.scale;
        anime({
          targets: el,
          translateX: [startX - cx, t.x - cx],
          translateY: [startY - cy, t.y - cy],
          scale: [startScale, DOCK_SCALE],
          opacity: [0.55 + 0.45 * Math.max(0, Math.min(1, (pos3d.z + node.radius) / (2 * node.radius))), 1],
          duration: 600,
          easing: "out(3)",
          delay: i * 80
        });
      });
    }
    setTimeout(finishOpen, 650);
  }

  function finishOpen() {
    state = "open";
    host.classList.add("is-open");
    host.classList.remove("is-opening");
    if (panel) {
      panel.hidden = false;
      requestAnimationFrame(() => {
        panel.classList.add("visible");
      });
    }
    if (closeBtn) closeBtn.focus({ preventScroll: true });
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function close() {
    if (state !== "open") return;
    state = "closing";
    openStartTime = Date.now();
    targetSpeedMul = 1;
    hub.setAttribute("aria-expanded", "false");
    host.classList.add("is-closing");
    host.classList.remove("is-open");
    if (panel) {
      panel.classList.remove("visible");
    }
    const anime = window.anime;
    if (anime) {
      anime({
        targets: hub,
        scale: [OPEN_HUB_SCALE, 1],
        duration: 400,
        easing: "inOutSine"
      });
      nodes.forEach((el, i) => {
        anime({
          targets: el,
          opacity: [1, 0.55 + 0.45 * 0.5],
          duration: 400,
          easing: "inOutSine"
        });
      });
    }
    setTimeout(finishClose, 450);
  }

  function finishClose() {
    state = "rest";
    host.classList.remove("is-closing");
    if (panel) panel.hidden = true;
    dockTargets = null;
    hub.focus({ preventScroll: true });
    if (!rafId) {
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    }
  }

  function onHubClick() {
    if (state === "rest") open();
    else if (state === "open") close();
  }

  function onCloseClick() {
    close();
  }

  function onKeydown(e) {
    if (e.key === "Escape" && state === "open") {
      e.preventDefault();
      close();
    }
  }

  function onVisibilityChange() {
    tabVisible = !document.hidden;
    if (tabVisible && visible && state === "rest" && !reducedMotion && !rafId) {
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    }
  }

  function onScroll() {
    const y = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = Math.min(1, Math.max(0, y / maxScroll));
    scrollVelocity = y - lastScrollY;
    lastScrollY = y;

    // Auto-open when scrolled past hero (progress ~0.3)
    if (!hasAutoOpened && scrollProgress > 0.25 && state === "rest") {
      hasAutoOpened = true;
      open();
    }

    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(() => { scrollTicking = false; });
    }
  }

  function initIntersectionObserver() {
    if (!stage) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        visible = entry.isIntersecting;
        if (visible && tabVisible && state === "rest" && !reducedMotion && !rafId) {
          lastTime = 0;
          rafId = requestAnimationFrame(tick);
        }
      });
    }, { root: null, rootMargin: "100px", threshold: 0 });
    obs.observe(stage);
  }

  function onResize() {
    if (state === "open") {
      dockTargets = computeDockTargets();
    }
    updateArcs();
  }

  function init() {
    if (window.OrbitObject?.init) return;
    host = document.querySelector(SELECTOR);
    if (!host) return;
    band = document.querySelector(".hero-band");
    root = document.documentElement;

    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!transformsOK()) {
      useFallback();
      return;
    }

    stage = host.querySelector(".oo-stage");
    hub = host.querySelector(HUB_SELECTOR);
    nodes = Array.from(host.querySelectorAll(NODE_SELECTOR));
    arcs = Array.from(host.querySelectorAll(ARC_SELECTOR));
    panel = host.querySelector(PANEL_SELECTOR);
    closeBtn = host.querySelector(CLOSE_SELECTOR);

    if (!hub || nodes.length !== 2 || arcs.length !== 2 || !panel || !closeBtn) {
      useFallback();
      return;
    }

    hub.addEventListener("click", onHubClick);
    closeBtn.addEventListener("click", onCloseClick);
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    if (reducedMotion) {
      angleA = GITHUB_NODE.phase;
      angleB = NOTION_NODE.phase;
      updateNodes(0);
      updateArcs();
      hub.setAttribute("aria-expanded", "false");
      return;
    }

    band.classList.add("has-orbit");
    initIntersectionObserver();
    lastTime = 0;
    rafId = requestAnimationFrame(tick);
  }

  window.OrbitObject = { init };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();