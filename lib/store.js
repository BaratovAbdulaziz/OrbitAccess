const fs = require("fs");

const DIR = ".data";
const FILE = `${DIR}/notion.json`;

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

function get(id) {
  if (!id) return null;
  return load()[id] || null;
}

function set(id, value) {
  if (!id) return;
  const data = load();
  data[id] = value;
  persist(data);
}

function del(id) {
  if (!id) return;
  const data = load();
  if (!(id in data)) return;
  delete data[id];
  persist(data);
}

module.exports = { get, set, del };
