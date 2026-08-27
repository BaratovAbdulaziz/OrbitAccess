const fs = require("fs");

const DIR = ".data";
const FILE = `${DIR}/sessions.json`;
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

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
  fs.writeFileSync(FILE, JSON.stringify(data));
}

function cleanup() {
  const data = load();
  const now = Date.now();
  let changed = false;
  
  for (const [id, session] of Object.entries(data)) {
    // Handle both old format (plain object) and new format (wrapped with expiresAt)
    const expiresAt = session.expiresAt || (session.createdAt && session.createdAt + SESSION_TTL);
    if (expiresAt && now > expiresAt) {
      delete data[id];
      changed = true;
    }
  }
  
  if (changed) {
    persist(data);
  }
}

function get(id) {
  if (!id) return null;
  const data = load();
  const session = data[id];
  if (!session) return null;
  
  // Check if session has expired
  const expiresAt = session.expiresAt || (session.createdAt && session.createdAt + SESSION_TTL);
  if (expiresAt && Date.now() > expiresAt) {
    delete data[id];
    persist(data);
    return null;
  }
  
  return session;
}

function set(id, value) {
  if (!id) return;
  const data = load();
  
  // Wrap session data with metadata if not already wrapped
  if (!value.createdAt) {
    data[id] = {
      data: value,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL
    };
  } else {
    data[id] = value;
  }
  
  persist(data);
  
  // Run cleanup periodically (1% chance on each write)
  if (Math.random() < 0.01) {
    cleanup();
  }
}

function del(id) {
  if (!id) return;
  const data = load();
  if (!(id in data)) return;
  delete data[id];
  persist(data);
}

// Run cleanup on startup
cleanup();

module.exports = { get, set, del, cleanup };
