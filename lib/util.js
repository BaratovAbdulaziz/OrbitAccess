function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function send(res, body, status = 200, headers = {}) {
  res.writeHead(status, { ...headers });
  res.end(body);
}

function parseCookies(req) {
  const out = {};
  const header = req.headers.cookie;
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    const timeout = setTimeout(() => { req.destroy(); }, 10000);
    req.on("data", (chunk) => { data += chunk; if (data.length > 10240) req.destroy(); });
    req.on("end", () => { clearTimeout(timeout); try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
    req.on("error", () => { clearTimeout(timeout); resolve({}); });
  });
}

// Simple in-memory rate limiter
const rateLimitBuckets = new Map();

function rateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);
  
  if (!bucket || now - bucket.start > windowMs) {
    rateLimitBuckets.set(key, { start: now, count: 1 });
    return true;
  }
  
  bucket.count++;
  if (bucket.count > maxRequests) return false;
  return true;
}

// Cleanup old rate limit buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets) {
    if (now - bucket.start > 120000) rateLimitBuckets.delete(key);
  }
}, 300000).unref();

module.exports = { esc, send, parseCookies, readBody, rateLimit };
