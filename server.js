const http = require("http");
const { PORT } = require("./lib/config");
const { route } = require("./lib/routes");

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

function securityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", 
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https://avatars.githubusercontent.com data:; connect-src 'self'; frame-ancestors 'none'");
}

const server = http.createServer(async (req, res) => {
  try {
    securityHeaders(res);
    await route(req, res);
  } catch (err) {
    console.error(err);
    try {
      if (!res.headersSent) {
        securityHeaders(res);
        res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Error — Orbit Access</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg, #fff); color: var(--text, #1a1a1a); display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; }
    .error-container { text-align: max-width: 400px; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--error, #dc3545); }
    p { color: var(--muted, #6c757d); line-height: 1.5; margin-bottom: 1.5rem; }
    a { color: var(--accent, #0d6efd); text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>Something went wrong</h1>
    <p>An unexpected error occurred. Please try again or return to the <a href="/">home page</a>.</p>
  </div>
</body>
</html>`);
      }
    } catch {}
  }
});

server.on("error", (err) => {
  console.error("Server error:", err);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
