// In-memory session store. Sessions are lost when the server restarts.
const sessions = new Map();

module.exports = { sessions };
