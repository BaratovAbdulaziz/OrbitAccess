const { esc, send } = require("../lib/util");
const { SPIKE, GITHUB_MARK, SUN_IC, MOON_IC } = require("./icons");

const TOGGLE_SCRIPT = `
<script>
(function () {
  var b = document.getElementById("themeToggle");
  if (b) b.addEventListener("click", function () {
    var d = document.documentElement;
    var next = d.dataset.theme === "dark" ? "light" : "dark";
    d.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
  var p = location.pathname;
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var h = a.getAttribute("href");
    if (h === p || (h === "/notion" && p.indexOf("/notion") === 0)) a.classList.add("active");
  });
  
  var menuToggle = document.getElementById("menuToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", function () {
      var expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", !expanded);
      mobileMenu.classList.toggle("open");
    });
    
    document.addEventListener("click", function (e) {
      if (!menuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
        menuToggle.setAttribute("aria-expanded", "false");
        mobileMenu.classList.remove("open");
      }
    });
  }
})();
</script>`;

function navRight(session) {
  const user = session?.user;
  if (user) {
    return `<div class="nav-right">
      <span class="nav-handle">@${esc(user.login)}</span>
      <img class="avatar-sm" src="${esc(user.avatar_url)}" alt="">
      <a class="nav-link" href="/refresh" title="Re-sync your GitHub data">Refresh</a>
      <a class="nav-link" href="/logout">Log out</a>
    </div>`;
  }
  return `<div class="nav-right">
    <a class="btn btn-primary" href="/login">${GITHUB_MARK}<span>Sign in with GitHub</span></a>
  </div>`;
}

function pageShell(content, session = null, extras = []) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Orbit Access — Team access control for GitHub & Notion</title>
<meta name="description" content="One dashboard for GitHub repositories and Notion workspaces. Audit who has access, invite collaborators, manage permissions.">
<meta property="og:title" content="Orbit Access">
<meta property="og:description" content="Team access control for GitHub & Notion">
<meta property="og:type" content="website">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
<script>
(function(){try{var t=localStorage.getItem("theme");document.documentElement.dataset.theme=t||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");}catch(e){}document.documentElement.classList.add("js");})();
</script>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to content</a>
<header class="top-nav">
  <div class="container">
    <div class="nav-left">
      <a class="wordmark" href="/">${SPIKE}<span>Orbit Access</span></a>
      <button class="menu-toggle" id="menuToggle" type="button" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mobileMenu">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
    </div>
    <nav class="nav-links" aria-label="Main navigation">
      <a class="nav-link" href="/">GitHub</a>
      <a class="nav-link" href="/notion">Notion</a>
      <a class="nav-link" href="/docs">Docs</a>
    </nav>
    <div class="nav-area"><button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle dark mode" title="Toggle theme">${SUN_IC}${MOON_IC}</button>${navRight(session)}</div>
  </div>
</header>
<nav class="mobile-menu" id="mobileMenu" aria-label="Mobile navigation">
  <a class="mobile-link" href="/">GitHub</a>
  <a class="mobile-link" href="/notion">Notion</a>
  <a class="mobile-link" href="/docs">Docs</a>
  ${session?.user ? `
  <div class="mobile-user">
    <img class="avatar-sm" src="${esc(session.user.avatar_url)}" alt="">
    <span class="nav-handle">@${esc(session.user.login)}</span>
  </div>
  <a class="mobile-link" href="/refresh">Refresh</a>
  <a class="mobile-link" href="/logout">Log out</a>
  ` : `
  <a class="btn btn-primary mobile-link" href="/login">${GITHUB_MARK}<span>Sign in with GitHub</span></a>
  `}
</nav>
<main id="main-content">${content}</main>
<footer class="footer">
  <div class="container">
    <span class="wordmark">${SPIKE}<span>Orbit Access</span></span>
    <nav aria-label="Footer navigation"><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav>
    <span>&copy; 2026 Orbit Access</span>
  </div>
</footer>
${TOGGLE_SCRIPT}
${extras.join("\n")}
</body>
</html>`;
}

function html(res, content, status = 200, session = null, extras = []) {
  send(res, pageShell(content, session, extras), status, { "Content-Type": "text/html; charset=utf-8" });
}

module.exports = { pageShell, html };
