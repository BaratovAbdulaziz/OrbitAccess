const { GITHUB_MARK, SPIKE } = require("./icons");

const NOTION_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>`;

const ORBIT_OBJECT = `
<div class="hero-stage oo-root" data-orbit-object>
  <div class="oo-stage">
    <svg class="oo-arcs" aria-hidden="true">
      <path class="oo-arc" stroke="var(--primary)" stroke-width="1.5" fill="none" stroke-dasharray="8 12" stroke-dashoffset="0"/>
      <path class="oo-arc" stroke="var(--teal)" stroke-width="1.5" fill="none" stroke-dasharray="8 12" stroke-dashoffset="0"/>
    </svg>
    <div class="oo-node oo-node--gh" aria-hidden="true" style="--node-color: var(--primary);">${GITHUB_MARK}</div>
    <div class="oo-node oo-node--nt" aria-hidden="true" style="--node-color: var(--teal);">${NOTION_ICON}</div>
    <button type="button" class="oo-hub" aria-expanded="false" aria-controls="oo-panel" aria-label="Toggle Orbit preview">
      <span class="oo-hub-glow" aria-hidden="true"></span>
      <span class="oo-hub-core" aria-hidden="true">${SPIKE}</span>
      <span class="oo-hub-ring" aria-hidden="true"></span>
      <span class="oo-hub-ring oo-hub-ring--2" aria-hidden="true"></span>
    </button>
    <div class="oo-panel" id="oo-panel" hidden>
      <div class="oo-panel-inner">
        <header class="oo-panel-head">
          <h2 class="oo-panel-title">Your sources, one orbit</h2>
          <button type="button" class="oo-close" aria-label="Collapse Orbit">&times;</button>
        </header>
        <div class="oo-panel-body">
          <div class="oo-col oo-col--gh">
            <div class="oo-col-icon" style="color: var(--primary);" aria-hidden="true">${GITHUB_MARK}</div>
            <h3 class="oo-col-title">GitHub</h3>
            <ul class="oo-col-list">
              <li><span class="oo-count" data-count="24">0</span> repositories</li>
              <li><span class="oo-count" data-count="6">0</span> organizations</li>
              <li><span class="oo-count" data-count="128">0</span> stars</li>
            </ul>
          </div>
          <div class="oo-merge" aria-hidden="true">
            <span class="oo-merge-arrow">&rarr;</span>
          </div>
          <div class="oo-col oo-col--nt">
            <div class="oo-col-icon" style="color: var(--teal);" aria-hidden="true">${NOTION_ICON}</div>
            <h3 class="oo-col-title">Notion</h3>
            <ul class="oo-col-list">
              <li><span class="oo-count" data-count="42">0</span> pages</li>
              <li><span class="oo-count" data-count="8">0</span> databases</li>
              <li><span class="oo-count" data-count="15">0</span> workspaces</li>
            </ul>
          </div>
        </div>
        <footer class="oo-panel-foot">
          <div class="oo-result" aria-hidden="true">
            <span class="oo-result-icon">${SPIKE}</span>
            <span class="oo-result-text">One dashboard</span>
          </div>
          <p class="oo-note">Sign in with GitHub &middot; connect Notion once</p>
        </footer>
      </div>
    </div>
  </div>
</div>
<script src="/orbit-object.js" defer></script>`;

const MARQUEE = `
<div class="marquee-band" aria-hidden="true">
  <div class="marquee-track">
    <div class="chip-set">
      <span>One dashboard</span><span>OAuth 2.0</span><span>No passwords</span><span>HttpOnly sessions</span>
      <span>CSRF state checks</span><span>GitHub API</span><span>Notion API</span><span>Instant search</span><span>Dark mode</span><span>Server-rendered</span>
    </div>
    <div class="chip-set">
      <span>One dashboard</span><span>OAuth 2.0</span><span>No passwords</span><span>HttpOnly sessions</span>
      <span>CSRF state checks</span><span>GitHub API</span><span>Notion API</span><span>Instant search</span><span>Dark mode</span><span>Server-rendered</span>
    </div>
  </div>
</div>`;

const STATS = `
<section class="landing-stats-band">
  <div class="container landing-stats" data-reveal-group>
    <div class="stat-item">
      <span class="stat-num" data-count="2">0</span>
      <span class="stat-label">providers, one view</span>
    </div>
    <div class="stat-item">
      <span class="stat-num" data-count="0">0</span>
      <span class="stat-label">passwords collected or stored</span>
    </div>
    <div class="stat-item">
      <span class="stat-num" data-count="100" data-suffix="%">0%</span>
      <span class="stat-label">standard OAuth 2.0 flow</span>
    </div>
    <div class="stat-item">
      <span class="stat-num" data-count="60" data-suffix="s" data-prefix="<">&lt;1s</span>
      <span class="stat-label">from sign-in to dashboard</span>
    </div>
  </div>
</section>`;

const FEATURES_ICON = `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`;

const FEATURES = [
  {
    title: "Secure by design",
    body: "Real OAuth 2.0 with state verification and HttpOnly cookies. Access tokens stay server-side &mdash; they never reach the browser.",
    icon: `${FEATURES_ICON}<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    dark: false,
  },
  {
    title: "Your data, your control",
    body: "Scoped permissions only. Disconnect Notion or log out in one click and everything is wiped. No lock-in.",
    icon: `${FEATURES_ICON}<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    dark: true,
  },
  {
    title: "Fast &amp; lightweight",
    body: "Zero framework overhead. A lean Node.js server with server-rendered pages that load instantly, even on slow connections.",
    icon: `${FEATURES_ICON}<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    dark: false,
  },
  {
    title: "Built to grow",
    body: "Start with your personal accounts today. Shared workspaces, team management, and audit logs are on the roadmap.",
    icon: `${FEATURES_ICON}<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    dark: false,
  },
];

function homeLoggedOut() {
  return `
<section class="hero-band">
  <div id="scroll-progress"></div>
  <div class="hero-orbs" aria-hidden="true"><span class="orb orb-a"></span><span class="orb orb-b"></span><span class="orb orb-c"></span></div>
  <div class="container hero-grid">
    <div class="hero-copy">
      <span class="badge-pill">GitHub + Notion, together</span>
      <h1 class="display-xl">Your code and your docs.<br>One <span class="grad-word">dashboard</span>.</h1>
      <p class="body-strong">Connect GitHub and Notion once. Get a single live view of your repositories, organizations, and workspace pages &mdash; ready for you and your team.</p>
      <div class="button-row">
        <a class="btn btn-primary" href="/login">${GITHUB_MARK}<span>Start free with GitHub</span></a>
        <a class="btn btn-secondary" href="#how">See how it works</a>
      </div>
    </div>
    ${ORBIT_OBJECT}
  </div>
</section>
${MARQUEE}
${STATS}
<section class="steps-band" id="how">
  <div class="container">
    <div class="section-head" data-reveal>
      <span class="badge-pill">How it works</span>
      <h2 class="display-lg">Up and running in three steps.</h2>
      <p class="body-md">No setup, no config files, nothing to install. You're one authorization away.</p>
    </div>
    <div class="steps-grid" data-reveal-group>
      <div class="step-tile">
        <span class="step-num">01</span>
        <h3 class="title-md">Sign in</h3>
        <p class="body-md">Authorize with GitHub through the official OAuth flow. We never see your password &mdash; only a scoped access token.</p>
      </div>
      <div class="step-tile">
        <span class="step-num">02</span>
        <h3 class="title-md">Connect Notion</h3>
        <p class="body-md">One click links your workspace. Pick the pages you want visible. Revoke access anytime, on either side.</p>
      </div>
      <div class="step-tile">
        <span class="step-num">03</span>
        <h3 class="title-md">Everything, one place</h3>
        <p class="body-md">Repos, orgs, and docs render side by side in a fast dashboard that's there every time you come back.</p>
      </div>
    </div>
  </div>
</section>
<section class="features-band" id="features">
  <div class="container">
    <div class="section-head" data-reveal>
      <span class="badge-pill">Why Orbit</span>
      <h2 class="display-lg">Built to be trusted.</h2>
      <p class="body-md">Security isn't a feature bolted on at the end &mdash; it's how the whole thing is wired.</p>
    </div>
    <div class="card-grid four" data-reveal-group>
      ${FEATURES.map((f) => `
      <div class="feature-card${f.dark ? " feature-card--dark" : ""}">
        <div class="feature-icon">${f.icon}</div>
        <h3 class="title-md">${f.title}</h3>
        <p class="body-md">${f.body}</p>
      </div>`).join("")}
    </div>
  </div>
</section>
<section class="cta-band">
  <div class="cta-glow" aria-hidden="true"></div>
  <div class="container" data-reveal>
    <span class="badge-coral">Get started</span>
    <h2 class="display-lg">Ready when you are.</h2>
    <p class="body-md">Connect your accounts in under a minute. No credit card, no setup wizard.</p>
    <div class="button-row button-row--center">
      <a class="btn btn-primary" href="/login">${GITHUB_MARK}<span>Start free with GitHub</span></a>
      <a class="btn btn-secondary" href="/docs">Read the docs</a>
    </div>
  </div>
</section>`;
}

module.exports = { homeLoggedOut };
