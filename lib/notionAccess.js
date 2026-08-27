const fs = require("fs");
const crypto = require("crypto");

const DIR = ".data";
const FILE = `${DIR}/notion-access.json`;
const LINKS_KEY = "_links";

let cache;

function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (typeof cache !== "object" || cache === null) cache = {};
  } catch {
    cache = {};
  }
  return cache;
}

function persist(data) {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function getGrants(pageId) {
  if (!pageId) return {};
  return load()[pageId] || {};
}

function grant(pageId, email, level, grantedBy) {
  if (!pageId || !email) return false;
  const normalized = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return false;
  const data = load();
  if (!data[pageId]) data[pageId] = {};
  data[pageId][normalized] = {
    level: ["read", "write", "admin"].includes(level) ? level : "read",
    grantedAt: new Date().toISOString(),
    grantedBy: grantedBy || "unknown",
  };
  persist(data);
  return true;
}

function revoke(pageId, email) {
  if (!pageId || !email) return false;
  const normalized = email.toLowerCase().trim();
  const data = load();
  if (!data[pageId] || !data[pageId][normalized]) return false;
  delete data[pageId][normalized];
  if (Object.keys(data[pageId]).length === 0) delete data[pageId];
  persist(data);
  return true;
}

function hasAccess(pageId, email) {
  if (!pageId || !email) return false;
  const normalized = email.toLowerCase().trim();
  const grants = getGrants(pageId);
  return normalized in grants;
}

function getLevel(pageId, email) {
  if (!pageId || !email) return null;
  const normalized = email.toLowerCase().trim();
  const grants = getGrants(pageId);
  return grants[normalized]?.level || null;
}

function getAccessiblePages(email) {
  if (!email) return [];
  const normalized = email.toLowerCase().trim();
  const data = load();
  return Object.keys(data).filter((pageId) => normalized in data[pageId]);
}

function getAllGrants() {
  return load();
}

function revokeAllByEmail(email) {
  if (!email) return 0;
  const normalized = email.toLowerCase().trim();
  const data = load();
  let count = 0;
  for (const pageId of Object.keys(data)) {
    if (pageId === LINKS_KEY) continue;
    if (normalized in data[pageId]) {
      delete data[pageId][normalized];
      count++;
      if (Object.keys(data[pageId]).length === 0) delete data[pageId];
    }
  }
  if (count > 0) persist(data);
  return count;
}

/* ── Share links ── */

function getLinks(data) {
  return data[LINKS_KEY] || {};
}

function createLink(pageId, createdBy) {
  if (!pageId) return null;
  const token = crypto.randomBytes(16).toString("hex");
  const data = load();
  const links = getLinks(data);
  links[token] = {
    pageId,
    createdAt: new Date().toISOString(),
    createdBy: createdBy || "unknown",
  };
  data[LINKS_KEY] = links;
  persist(data);
  return token;
}

function getLink(token) {
  if (!token) return null;
  const data = load();
  const links = getLinks(data);
  return links[token] || null;
}

function getLinkForPage(pageId) {
  if (!pageId) return null;
  const data = load();
  const links = getLinks(data);
  for (const [token, info] of Object.entries(links)) {
    if (info.pageId === pageId) return { token, ...info };
  }
  return null;
}

function revokeLink(token) {
  if (!token) return false;
  const data = load();
  const links = getLinks(data);
  if (!(token in links)) return false;
  delete links[token];
  data[LINKS_KEY] = links;
  persist(data);
  return true;
}

function revokeLinkByPage(pageId) {
  if (!pageId) return false;
  const data = load();
  const links = getLinks(data);
  let found = false;
  for (const [token, info] of Object.entries(links)) {
    if (info.pageId === pageId) {
      delete links[token];
      found = true;
    }
  }
  if (found) {
    data[LINKS_KEY] = links;
    persist(data);
  }
  return found;
}

function getAllLinks() {
  return getLinks(load());
}

module.exports = {
  getGrants, grant, revoke, hasAccess, getLevel, getAccessiblePages, getAllGrants, revokeAllByEmail,
  createLink, getLink, getLinkForPage, revokeLink, revokeLinkByPage, getAllLinks,
};
