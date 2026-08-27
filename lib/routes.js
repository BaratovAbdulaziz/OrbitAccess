const http = require("http");
const fs = require("fs");
const path = require("path");

const { CLIENT_ID, CLIENT_SECRET, PORT, NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, NOTION_REDIRECT_URI } = require("./config");
const { sessions } = require("./sessions");
const { esc, send, parseCookies, readBody, rateLimit } = require("./util");
const {
  githubToken, githubUser, githubRepos, githubOrgs,
  githubCollaborators, githubResolveUser, githubAddCollaborator,
} = require("./github");
const { notionToken, notionSearch } = require("./notion");
const notionStore = require("./store");
const notionAccess = require("./notionAccess");
const sessionStore = require("./sessionStore");
const { html } = require("../views/shell");
const { homeLoggedOut } = require("../views/landing");
const { homeLoggedIn } = require("../views/panel");
const { messagePage, STATIC_PAGES, staticPage, docsPage, notionPage } = require("../views/pages");

const NOTION_REDIRECT = NOTION_REDIRECT_URI || `http://localhost:${PORT}/notion/callback`;
const SID_MAX_AGE = 2592000;
const NID_MAX_AGE = 31536000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const LANDING_SCRIPTS = [
  `<script src="/vendor/anime.min.js"></script>`,
  `<script src="/landing.js"></script>`,
];

function normalizeNotion(n) {
  if (n && !n.token && n.access_token) n.token = n.access_token;
  return n;
}

function resolveSession(cookies) {
  const mem = sessions.get(cookies.sid);
  if (mem) return mem;
  
  // Check disk store for GitHub session
  const savedSession = cookies.sid ? sessionStore.get(cookies.sid) : null;
  if (savedSession) {
    // Check if session has expired
    if (savedSession.expiresAt && Date.now() > savedSession.expiresAt) {
      sessionStore.del(cookies.sid);
      return null;
    }
    // Restore to in-memory store
    sessions.set(cookies.sid, savedSession.data || savedSession);
    return savedSession.data || savedSession;
  }
  
  const saved = cookies.nid ? normalizeNotion(notionStore.get(cookies.nid)) : null;
  if (saved) {
    // Check if there's a GitHub session on disk to merge
    const githubSession = savedSession?.data || savedSession || null;
    return { 
      user: githubSession?.user || null, 
      ownPublic: githubSession?.ownPublic || [], 
      ownPrivate: githubSession?.ownPrivate || [], 
      orgs: githubSession?.orgs || [],
      token: githubSession?.token || null,
      notion: saved 
    };
  }
  return null;
}

function sidCookie(sid) {
  const secure = IS_PRODUCTION ? "; Secure" : "";
  return `sid=${sid}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SID_MAX_AGE}${secure}`;
}

function nidCookie(nid) {
  const secure = IS_PRODUCTION ? "; Secure" : "";
  return `nid=${nid}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${NID_MAX_AGE}${secure}`;
}

/* ── Static file serving ── */

const DIST_DIR = path.join(__dirname, "..", "app", "dist");

const STATIC_MIME = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const STATIC_FILES = {
  "/style.css": () => fs.readFileSync("style.css"),
  "/vendor/anime.min.js": () => fs.readFileSync("node_modules/animejs/dist/bundles/anime.umd.min.js"),
  "/landing.js": () => fs.readFileSync("public/landing.js"),
  "/orbit-object.js": () => fs.readFileSync("public/orbit-object.js"),
  "/notion.js": () => fs.readFileSync("public/notion.js"),
  "/favicon.svg": () => fs.readFileSync("public/favicon.svg"),
  "/robots.txt": () => fs.readFileSync("public/robots.txt"),
};

function serveStatic(req, res, url) {
  // First: legacy static files
  const loader = STATIC_FILES[url.pathname];
  if (loader) {
    try {
      const ext = path.extname(url.pathname);
      send(res, loader(), 200, { "Content-Type": STATIC_MIME[ext] || "application/octet-stream" });
      return true;
    } catch {
      // File missing — fall through to next handler
    }
  }

  // Second: React build assets (app/dist/assets/*)
  if (url.pathname.startsWith("/assets/")) {
    const filePath = path.join(DIST_DIR, url.pathname);
    try {
      const data = fs.readFileSync(filePath);
      const ext = path.extname(filePath);
      send(res, data, 200, {
        "Content-Type": STATIC_MIME[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      });
      return true;
    } catch {}
  }

  return false;
}

/* ── OAuth: GitHub ── */

function startLogin(res) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    html(res, messagePage(
      "Configuration missing",
      "GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET are not set. Add them to your .env file and restart.",
      { error: true }
    ), 500);
    return;
  }
  const state = require("crypto").randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: "read:user repo read:org",
    state,
  });
  send(res, "", 302, {
    Location: `https://github.com/login/oauth/authorize?${params}`,
    "Set-Cookie": `oauth_state=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax`,
  });
}

async function handleOauthCallback(req, res, url, cookies) {
  const crypto = require("crypto");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== cookies.oauth_state) {
    html(res, messagePage(
      "Sign-in failed",
      "The request could not be verified (invalid state). This can happen if the link expired — please try again.",
      { error: true }
    ), 400);
    return;
  }
  const token = await githubToken(code);
  const user = await githubUser(token);
  const [ownPublic, ownPrivate, orgs] = await Promise.all([
    githubRepos(token, "public"),
    githubRepos(token, "private"),
    githubOrgs(token),
  ]);
  const sid = crypto.randomBytes(32).toString("hex");
  const savedNotion = cookies.nid ? normalizeNotion(notionStore.get(cookies.nid)) : null;
  const sessionData = { token, user, ownPublic, ownPrivate, orgs, ...(savedNotion ? { notion: savedNotion } : {}) };
  sessions.set(sid, sessionData);
  
  // Persist to disk for cross-restart survival
  sessionStore.set(sid, { token, user, ownPublic, ownPrivate, orgs });
  
  send(res, "", 302, {
    Location: "/",
    "Set-Cookie": [
      sidCookie(sid),
      "oauth_state=; HttpOnly; Path=/; Max-Age=0",
    ],
  });
}

/* ── OAuth: Notion ── */

function startNotionLogin(res) {
  if (!NOTION_CLIENT_ID || !NOTION_CLIENT_SECRET) {
    html(res, messagePage(
      "Notion integration not configured",
      "Create a public integration at notion.so/my-integrations, register the redirect URI <code>http://localhost:3000/notion/callback</code>, then add NOTION_CLIENT_ID and NOTION_CLIENT_SECRET to your .env and restart."
    ), 200, null);
    return;
  }
  const state = require("crypto").randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: NOTION_CLIENT_ID,
    redirect_uri: NOTION_REDIRECT,
    response_type: "code",
    owner: "user",
    state,
  });
  send(res, "", 302, {
    Location: `https://api.notion.com/v1/oauth/authorize?${params}`,
    "Set-Cookie": `notion_state=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax`,
  });
}

async function handleNotionCallback(res, url, cookies) {
  const crypto = require("crypto");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== cookies.notion_state) {
    html(res, messagePage(
      "Notion connection failed",
      "The request could not be verified (invalid state). Please try connecting again.",
      { error: true }
    ), 400);
    return;
  }
  const data = await notionToken(code, NOTION_REDIRECT);
  let items = [];
  try {
    items = await notionSearch(data.access_token);
  } catch (err) {
    console.error("Notion search failed:", err.message);
  }
  const payload = { ...data, token: data.access_token, items };
  const nid = crypto.randomBytes(16).toString("hex");
  notionStore.set(nid, payload);
  if (cookies.nid && cookies.nid !== nid) notionStore.del(cookies.nid);
  
  // Check for existing in-memory or disk-backed session
  const session = resolveSession(cookies);
  if (session) {
    session.notion = payload;
    // Persist updated session to disk
    sessionStore.set(cookies.sid, { 
      token: session.token, 
      user: session.user, 
      ownPublic: session.ownPublic, 
      ownPrivate: session.ownPrivate, 
      orgs: session.orgs 
    });
    send(res, "", 302, {
      Location: "/notion",
      "Set-Cookie": [
        nidCookie(nid),
        sidCookie(cookies.sid),
        "notion_state=; HttpOnly; Path=/; Max-Age=0",
      ],
    });
    return;
  }
  
  // Check for GitHub session on disk to merge
  const savedGithubSession = cookies.sid ? sessionStore.get(cookies.sid) : null;
  if (savedGithubSession) {
    // Restore GitHub session and add Notion
    const restoredSession = { ...savedGithubSession, notion: payload };
    sessions.set(cookies.sid, restoredSession);
    send(res, "", 302, {
      Location: "/notion",
      "Set-Cookie": [
        nidCookie(nid),
        sidCookie(cookies.sid),
        "notion_state=; HttpOnly; Path=/; Max-Age=0",
      ],
    });
    return;
  }
  
  // No existing session - create new one with Notion only
  const sid = crypto.randomBytes(32).toString("hex");
  sessions.set(sid, { user: null, ownPublic: [], ownPrivate: [], orgs: [], notion: payload });
  send(res, "", 302, {
    Location: "/notion",
    "Set-Cookie": [
      sidCookie(sid),
      nidCookie(nid),
      "notion_state=; HttpOnly; Path=/; Max-Age=0",
    ],
  });
}

/* ── Session refresh ── */

async function refreshSession(session) {
  if (!session?.token) return;
  try {
    const [user, ownPublic, ownPrivate, orgs] = await Promise.all([
      githubUser(session.token),
      githubRepos(session.token, "public"),
      githubRepos(session.token, "private"),
      githubOrgs(session.token),
    ]);
    Object.assign(session, { user, ownPublic, ownPrivate, orgs });
  } catch (err) {
    console.error("Refresh failed:", err.message);
  }
}

/* ── API: Access control ── */

async function handleApiAccess(req, res, url, session) {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 4 || !session?.token) {
    send(res, JSON.stringify({ error: "unauthorized" }), 401, { "Content-Type": "application/json" });
    return;
  }
  const [owner, repo] = [parts[2], parts[3]];
  if (req.method === "POST") {
    if (!rateLimit(`api:${session.user?.id || "anon"}`, 10, 60000)) {
      send(res, JSON.stringify({ ok: false, message: "Rate limit exceeded. Try again in a minute." }), 429, { "Content-Type": "application/json" });
      return;
    }
    const body = await readBody(req);
    const input = String(body.user || "").trim();
    const permission = ["pull", "triage", "push", "maintain", "admin"].includes(body.permission) ? body.permission : "push";
    if (!input) {
      send(res, JSON.stringify({ ok: false, message: "Enter a GitHub username or email." }), 200, { "Content-Type": "application/json" });
      return;
    }
    const username = await githubResolveUser(session.token, input);
    if (!username) {
      send(res, JSON.stringify({ ok: false, message: `Couldn't resolve "${input}" to a GitHub account.` }), 200, { "Content-Type": "application/json" });
      return;
    }
    const result = await githubAddCollaborator(session.token, owner, repo, username, permission);
    result.reload = !!result.ok;
    result.message = result.ok ? `${username} invited with ${permission} access.` : result.message;
    send(res, JSON.stringify(result), 200, { "Content-Type": "application/json" });
    return;
  }
  const list = await githubCollaborators(session.token, owner, repo);
  send(res, JSON.stringify(list), 200, { "Content-Type": "application/json" });
}

/* ── API: Notion access control ── */

async function handleNotionAccess(req, res, url, session) {
  if (!session?.notion?.token) {
    send(res, JSON.stringify({ error: "notion_not_connected" }), 401, { "Content-Type": "application/json" });
    return;
  }

  const user = session?.user;
  if (!user) {
    send(res, JSON.stringify({ error: "unauthorized" }), 401, { "Content-Type": "application/json" });
    return;
  }

  const isLink = url.pathname === "/api/notion/access/link";

  if (req.method === "GET") {
    if (isLink) {
      const pageId = url.searchParams.get("pageId");
      if (pageId) {
        const link = notionAccess.getLinkForPage(pageId);
        if (link) {
          const fullUrl = `${url.protocol}//${url.host}/share/${link.token}`;
          send(res, JSON.stringify({ ok: true, token: link.token, url: fullUrl, createdAt: link.createdAt }), 200, { "Content-Type": "application/json" });
        } else {
          send(res, JSON.stringify({ ok: false, message: "No share link for this page." }), 200, { "Content-Type": "application/json" });
        }
      } else {
        const allLinks = notionAccess.getAllLinks();
        send(res, JSON.stringify({ ok: true, links: allLinks }), 200, { "Content-Type": "application/json" });
      }
      return;
    }
    const pageId = url.searchParams.get("pageId");
    if (pageId) {
      const grants = notionAccess.getGrants(pageId);
      const list = Object.entries(grants).map(([email, g]) => ({
        email,
        level: g.level,
        grantedAt: g.grantedAt,
        grantedBy: g.grantedBy,
      }));
      const link = notionAccess.getLinkForPage(pageId);
      send(res, JSON.stringify({ ok: true, grants: list, link: link ? { token: link.token, url: `${url.protocol}//${url.host}/share/${link.token}` } : null }), 200, { "Content-Type": "application/json" });
    } else {
      const all = notionAccess.getAllGrants();
      send(res, JSON.stringify({ ok: true, grants: all }), 200, { "Content-Type": "application/json" });
    }
    return;
  }

  if (req.method === "POST") {
    if (!rateLimit(`notion:${user.id}`, 15, 60000)) {
      send(res, JSON.stringify({ ok: false, message: "Rate limit exceeded. Try again in a minute." }), 429, { "Content-Type": "application/json" });
      return;
    }
    if (isLink) {
      const body = await readBody(req);
      const { pageId } = body;
      if (!pageId) {
        send(res, JSON.stringify({ ok: false, message: "pageId is required." }), 200, { "Content-Type": "application/json" });
        return;
      }
      const existing = notionAccess.getLinkForPage(pageId);
      if (existing) {
        const fullUrl = `${url.protocol}//${url.host}/share/${existing.token}`;
        send(res, JSON.stringify({ ok: true, token: existing.token, url: fullUrl, message: "Share link already exists." }), 200, { "Content-Type": "application/json" });
        return;
      }
      const token = notionAccess.createLink(pageId, user.login);
      const fullUrl = `${url.protocol}//${url.host}/share/${token}`;
      send(res, JSON.stringify({ ok: true, token, url: fullUrl, message: "Share link created." }), 200, { "Content-Type": "application/json" });
      return;
    }
    const body = await readBody(req);
    const { pageId, email, level } = body;
    if (!pageId || !email) {
      send(res, JSON.stringify({ ok: false, message: "pageId and email are required." }), 200, { "Content-Type": "application/json" });
      return;
    }
    const ok = notionAccess.grant(pageId, email, level, user.login);
    if (!ok) {
      send(res, JSON.stringify({ ok: false, message: "Invalid email format." }), 200, { "Content-Type": "application/json" });
      return;
    }
    send(res, JSON.stringify({ ok: true, message: `Access granted to ${email} with ${level || "read"} level.` }), 200, { "Content-Type": "application/json" });
    return;
  }

  if (req.method === "DELETE") {
    if (isLink) {
      const body = await readBody(req);
      const { token, pageId } = body;
      if (token) {
        const ok = notionAccess.revokeLink(token);
        send(res, JSON.stringify({ ok, message: ok ? "Share link revoked." : "Link not found." }), 200, { "Content-Type": "application/json" });
      } else if (pageId) {
        const ok = notionAccess.revokeLinkByPage(pageId);
        send(res, JSON.stringify({ ok, message: ok ? "Share link revoked." : "No link found for this page." }), 200, { "Content-Type": "application/json" });
      } else {
        send(res, JSON.stringify({ ok: false, message: "token or pageId is required." }), 200, { "Content-Type": "application/json" });
      }
      return;
    }
    const body = await readBody(req);
    const { pageId, email } = body;
    if (!pageId || !email) {
      send(res, JSON.stringify({ ok: false, message: "pageId and email are required." }), 200, { "Content-Type": "application/json" });
      return;
    }
    const ok = notionAccess.revoke(pageId, email);
    send(res, JSON.stringify({ ok: !!ok, message: ok ? `Access revoked for ${email}.` : "No grant found." }), 200, { "Content-Type": "application/json" });
    return;
  }

  send(res, JSON.stringify({ error: "method_not_allowed" }), 405, { "Content-Type": "application/json" });
}

/* ── Share link resolver ── */

function handleShareLink(req, res, token, cookies) {
  const link = notionAccess.getLink(token);
  if (!link) {
    html(res, messagePage("Link not found", "This share link is invalid or has been revoked.", { error: true }), 404);
    return;
  }
  const session = resolveSession(cookies);
  if (session?.user) {
    const email = session.user.email;
    if (email) {
      notionAccess.grant(link.pageId, email, "read", "share-link");
    }
  }
  const notionItem = session?.notion?.items?.find((i) => i.id === link.pageId);
  if (notionItem?.url) {
    send(res, "", 302, { Location: notionItem.url });
  } else {
    send(res, "", 302, { Location: "/notion" });
  }
}

/* ── Router ── */

async function route(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const cookies = parseCookies(req);

  // Static files
  if (serveStatic(req, res, url)) return;

  // Notion OAuth callback
  if (url.pathname === "/notion/callback" && url.searchParams.has("code") && url.searchParams.has("state")) {
    await handleNotionCallback(res, url, cookies);
    return;
  }

  // GitHub OAuth callback
  if (url.searchParams.has("code") && url.searchParams.has("state")) {
    await handleOauthCallback(req, res, url, cookies);
    return;
  }

  // Page routes
  const session = resolveSession(cookies);

  switch (url.pathname) {
    case "/health":
      send(res, JSON.stringify({ ok: true, uptime: process.uptime() }), 200, { "Content-Type": "application/json" });
      break;

    case "/":
      if (session?.user) {
        html(res, homeLoggedIn(session.user, session), 200, session);
      } else {
        // Serve the React app landing page
        try {
          const reactHtml = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf8");
          send(res, reactHtml, 200, { "Content-Type": "text/html; charset=utf-8" });
        } catch {
          // Fallback to server-rendered landing if build missing
          html(res, homeLoggedOut(), 200, session, LANDING_SCRIPTS);
        }
      }
      break;

    case "/login":
      startLogin(res);
      break;

    case "/login/notion":
      startNotionLogin(res);
      break;

    case "/logout/notion": {
      if (session) delete session.notion;
      if (cookies.nid) notionStore.del(cookies.nid);
      send(res, "", 302, { Location: "/notion", "Set-Cookie": "nid=; HttpOnly; Path=/; Max-Age=0" });
      break;
    }

    case "/refresh/notion": {
      const rs = resolveSession(cookies);
      if (rs?.notion?.token) {
        try {
          rs.notion.items = await notionSearch(rs.notion.token);
          if (cookies.nid) notionStore.set(cookies.nid, rs.notion);
        } catch (err) {
          console.error("Notion refresh failed:", err.message);
        }
      }
      send(res, "", 302, { Location: "/notion" });
      break;
    }

    case "/refresh":
      await refreshSession(resolveSession(cookies));
      // Persist refreshed session to disk
      const refreshSessionData = resolveSession(cookies);
      if (refreshSessionData?.token) {
        sessionStore.set(cookies.sid, { 
          token: refreshSessionData.token, 
          user: refreshSessionData.user, 
          ownPublic: refreshSessionData.ownPublic, 
          ownPrivate: refreshSessionData.ownPrivate, 
          orgs: refreshSessionData.orgs 
        });
      }
      send(res, "", 302, { Location: "/" });
      break;

    case "/docs":
      html(res, docsPage(), 200, session);
      break;

    case "/about":
    case "/privacy":
    case "/terms":
      html(res, staticPage(...STATIC_PAGES[url.pathname]), 200, session);
      break;

    case "/notion":
      html(res, notionPage(resolveSession(cookies)), 200, session, [`<script src="/notion.js"></script>`]);
      break;

    case "/logout":
      // Clear from in-memory store
      sessions.delete(cookies.sid);
      // Clear from disk store
      if (cookies.sid) sessionStore.del(cookies.sid);
      // Optionally clear Notion session too
      if (cookies.nid) notionStore.del(cookies.nid);
      send(res, "", 302, { 
        Location: "/", 
        "Set-Cookie": [
          "sid=; HttpOnly; Path=/; Max-Age=0",
          "nid=; HttpOnly; Path=/; Max-Age=0"
        ] 
      });
      break;

    default:
      if (url.pathname.startsWith("/api/access/")) {
        await handleApiAccess(req, res, url, resolveSession(cookies));
      } else if (url.pathname === "/api/notion/access" || url.pathname === "/api/notion/access/link") {
        await handleNotionAccess(req, res, url, resolveSession(cookies));
      } else if (url.pathname.startsWith("/share/")) {
        const token = url.pathname.split("/share/")[1];
        if (token) handleShareLink(req, res, token, cookies);
        else html(res, messagePage("Invalid link", "The share link is malformed.", { error: true }), 400);
      } else {
        html(res, messagePage("Page not found", "The page you're looking for doesn't exist or has moved.", { error: true }), 404, resolveSession(cookies));
      }
      break;
  }
}

module.exports = { route };
