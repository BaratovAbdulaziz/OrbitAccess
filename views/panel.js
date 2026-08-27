const { esc } = require("../lib/util");

const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", HTML: "#e34c26",
  CSS: "#563d7c", Go: "#00ADD8", Rust: "#dea584", Java: "#b07219", "C++": "#f34b7d",
  C: "#555555", "C#": "#178600", Ruby: "#701516", PHP: "#4F5D95", Swift: "#F05138",
  Kotlin: "#A97BFF", Shell: "#89e051", Dart: "#00B4AB", Vue: "#41b883", Svelte: "#ff3e00",
  Elixir: "#6e4a7e", Lua: "#000080", Zig: "#ec915c", Haskell: "#5e5086", Scala: "#c22d40",
};

const STAR_IC = `<svg class="star-ic" viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>`;

const LOCK_IC = `<svg class="lock-ic" viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true"><title>Private repository</title><path d="M4 4a4 4 0 0 1 8 0v2h.25c.69 0 1.25.56 1.25 1.25v5.5c0 .69-.56 1.25-1.25 1.25h-9.5C2.06 14 1.5 13.44 1.5 12.75v-5.5C1.5 6.56 2.06 6 2.75 6H4Zm6.5 0v2h-5V4a2.5 2.5 0 0 1 5 0Z"/></svg>`;

function sectionHead(title, sub, metaHref, metaLabel) {
  const meta = metaHref ? `<a class="text-link caption-link" href="${metaHref}" target="_blank" rel="noopener">${metaLabel}</a>` : "";
  return `<div class="section-head-row"><div class="section-head"><h2 class="display-sm">${title}</h2><p class="body-md">${sub}</p></div>${meta}</div>`;
}

function accTile(repo) {
  const color = LANG_COLORS[repo.language];
  const lang = repo.language ? `<span class="lang-dot"${color ? ` style="background:${esc(color)}"` : ""}></span>${esc(repo.language)}` : "";
  const pushed = new Date(repo.pushed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `
  <div class="acc-tile">
    <button class="acc-head" type="button" data-owner="${esc(repo.owner.login)}" data-repo="${esc(repo.name)}" aria-expanded="false">
      <svg class="chev" viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"/></svg>
      <span class="acc-id">
        <span class="acc-name">${esc(repo.name)}${repo.private ? LOCK_IC : ""}</span>
        <span class="acc-sub">${lang}<span>${STAR_IC}${esc(repo.stargazers_count)}</span><span class="acc-date">Pushed ${pushed}</span></span>
      </span>
    </button>
    <div class="acc-body" hidden>
      <div class="acc-skel"><span class="sk-avatar"></span><span class="sk-bar"></span></div>
      <div class="acc-skel"><span class="sk-avatar"></span><span class="sk-bar"></span></div>
    </div>
    <div class="acc-foot">
      <label class="caption" for="perm-${esc(repo.id)}">New members get</label>
      <select class="perm-select" id="perm-${esc(repo.id)}">
        <option selected>Read</option><option>Triage</option><option>Write</option><option>Maintain</option><option>Admin</option>
      </select>
    </div>
  </div>`;
}

const PANEL_SCRIPT = `
<script>
(function () {
  function note(text) {
    var p = document.createElement("p");
    p.className = "caption acc-note";
    p.textContent = text;
    return p;
  }
  function person(u) {
    var row = document.createElement("div");
    row.className = "acc-person";
    var img = document.createElement("img");
    img.className = "acc-avatar"; img.src = u.avatar_url || ""; img.alt = ""; img.loading = "lazy";
    var link = document.createElement("a");
    link.className = "acc-login"; link.href = u.html_url || "#";
    link.target = "_blank"; link.rel = "noopener"; link.textContent = u.login;
    var role = u.role_name || (u.permissions && u.permissions.admin ? "admin" : u.permissions && u.permissions.push ? "write" : "read");
    var chip = document.createElement("span");
    chip.className = "role-chip role-" + role; chip.textContent = role;
    row.appendChild(img); row.appendChild(link); row.appendChild(chip);
    return row;
  }
  function loginLink() {
    var a = document.createElement("a");
    a.href = "/login"; a.textContent = "sign in again";
    return a;
  }
  function skeleton() {
    var d = document.createElement("div"); d.className = "acc-skel";
    var a = document.createElement("span"); a.className = "sk-avatar";
    var b = document.createElement("span"); b.className = "sk-bar";
    d.appendChild(a); d.appendChild(b);
    return d;
  }
  function addForm(tile) {
    var f = document.createElement("form");
    f.className = "acc-add-form";
    var inp = document.createElement("input");
    inp.className = "acc-input"; inp.placeholder = "Username or email…";
    inp.autocomplete = "off"; inp.required = true;
    var sel = document.createElement("select"); sel.className = "perm-select";
    ["read", "triage", "write", "maintain", "admin"].forEach(function (p) {
      var o = document.createElement("option");
      o.value = p; o.textContent = p.charAt(0).toUpperCase() + p.slice(1);
      if (p === "write") o.selected = true;
      sel.appendChild(o);
    });
    var b = document.createElement("button");
    b.type = "submit"; b.className = "btn btn-primary btn-sm"; b.textContent = "Invite";
    var msg = document.createElement("p"); msg.className = "caption acc-note acc-msg";
    f.appendChild(inp); f.appendChild(sel); f.appendChild(b); f.appendChild(msg);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (f.dataset.busy) return;
      f.dataset.busy = "1"; b.disabled = true; b.textContent = "…";
      msg.textContent = "";
      var head = tile.querySelector(".acc-head");
      fetch("/api/access/" + encodeURIComponent(head.dataset.owner) + "/" + encodeURIComponent(head.dataset.repo), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: inp.value.trim(), permission: sel.value })
      })
        .then(function (r) { return r.json().then(function (j) { return { status: r.status, json: j }; }); })
        .then(function (res) {
          if (res.json.error === "unauthorized") {
            msg.textContent = "Session expired — ";
            msg.appendChild(loginLink());
            bodyOf(tile).dataset.loaded = "";
            return;
          }
          msg.textContent = res.json.message || "Something went wrong.";
          if (res.json.ok) inp.value = "";
          if (res.json.reload) loadList(tile);
        })
        .catch(function () { msg.textContent = "Network error — try again."; })
        .then(function () {
          delete f.dataset.busy; b.disabled = false; b.textContent = "Invite";
        });
    });
    return f;
  }
  function bodyOf(tile) { return tile.querySelector(".acc-body"); }
  function loadList(tile) {
    var body = bodyOf(tile);
    body.innerHTML = "";
    for (var i = 0; i < 3; i++) body.appendChild(skeleton());
    var head = tile.querySelector(".acc-head");
    fetch("/api/access/" + encodeURIComponent(head.dataset.owner) + "/" + encodeURIComponent(head.dataset.repo))
      .then(function (r) { return r.json(); })
      .then(function (list) {
        body.innerHTML = "";
        if (list && list.error === 401) {
          var p = note("Session expired — ");
          p.appendChild(loginLink());
          body.appendChild(p);
          return;
        }
        if (!Array.isArray(list)) {
          body.appendChild(note("Collaborator management needs admin access to this repository — the invite form is hidden because invites wouldn't go through."));
          return;
        }
        if (!list.length) {
          body.appendChild(note("Only the owner has access right now."));
        } else {
          list.forEach(function (u) { body.appendChild(person(u)); });
        }
        body.appendChild(addForm(tile));
      })
      .catch(function () {
        body.innerHTML = "";
        body.appendChild(note("Could not load collaborators — try again later."));
      });
  }
  document.querySelectorAll(".acc-head").forEach(function (head) {
    head.addEventListener("click", function () {
      var tile = head.parentNode;
      var body = bodyOf(tile);
      var open = tile.classList.toggle("open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
      body.hidden = !open;
      if (!open || body.dataset.loaded) return;
      body.dataset.loaded = "1";
      loadList(tile);
    });
  });
})();
</script>`;

function homeLoggedIn(user, data = {}) {
  const { ownPublic = [], ownPrivate = [], orgs = [] } = data;
  const ghReposUrl = `https://github.com/${user.login}?tab=repositories`;
  return `
<section class="dash-band">
  <div class="container">
    <div class="dash-head">
      <img class="avatar-lg" src="${esc(user.avatar_url)}" alt="">
      <div class="dash-copy">
        <span class="badge-coral">Access panel</span>
        <h1 class="display-lg">Welcome back, ${esc(user.name || user.login)}.</h1>
        <p class="body-md">Click any repository to see exactly who has access.${user.location ? ` &middot; ${esc(user.location)}` : ""} &middot; <a class="text-link" style="font-size:16px" href="${esc(user.html_url)}" target="_blank" rel="noopener">@${esc(user.login)}</a></p>
      </div>
    </div>
    <div class="stat-tiles four">
      <a class="connector-tile stat-link" href="#public"><span class="stat-num">${ownPublic.length}</span><span class="caption">Public repos</span></a>
      <a class="connector-tile stat-link" href="#private"><span class="stat-num">${ownPrivate.length}</span><span class="caption">Private repos</span></a>
      <a class="connector-tile stat-link" href="${esc(user.html_url)}?tab=followers" target="_blank" rel="noopener"><span class="stat-num">${esc(user.followers)}</span><span class="caption">Followers</span></a>
      <a class="connector-tile stat-link" href="#orgs"><span class="stat-num">${orgs.length}</span><span class="caption">Organizations</span></a>
    </div>
  </div>
</section>
<section class="repos-band">
  <div class="container" id="public">
    ${sectionHead("Public repositories", "Expand a repo to audit who can reach it.", ghReposUrl, "View all")}
    ${ownPublic.length ? `<div class="repo-grid">${ownPublic.map(accTile).join("")}</div>`
      : `<p class="empty-note body-md">No public repositories found on your account yet.</p>`}
  </div>
</section>
<section class="repos-band">
  <div class="container" id="private">
    ${sectionHead("Private repositories", "The sensitive ones — check them first.", ghReposUrl, "Manage on GitHub")}
    ${ownPrivate.length ? `<div class="repo-grid">${ownPrivate.map(accTile).join("")}</div>`
      : `<p class="empty-note body-md">No private repositories visible for this account.</p>`}
  </div>
</section>
<section class="repos-band">
  <div class="container" id="orgs">
    ${sectionHead("Organizations", "Team-owned repositories and their access.", "", "")}
    ${orgs.length ? orgs.map(({ org, repos }) => `
    <div class="org-block">
      <div class="org-head">
        <img class="org-avatar" src="${esc(org.avatar_url)}" alt="">
        <span class="repo-name">${esc(org.login)}</span>
        <span class="badge-pill">${repos.length} repo${repos.length === 1 ? "" : "s"}</span>
      </div>
      ${repos.length ? `<div class="repo-grid">${repos.map(accTile).join("")}</div>`
        : `<p class="empty-note body-md">No visible repositories in this organization.</p>`}
    </div>`).join("") : `<p class="empty-note body-md">You're not a member of any organizations yet.</p>`}
  </div>
</section>
${PANEL_SCRIPT}`;
}

module.exports = { homeLoggedIn };
