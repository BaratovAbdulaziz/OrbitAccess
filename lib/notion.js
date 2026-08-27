const { NOTION_CLIENT_ID, NOTION_CLIENT_SECRET } = require("./config");

function notionAuthorizeUrl(redirectUri, state) {
  const params = new URLSearchParams({
    client_id: NOTION_CLIENT_ID,
    response_type: "code",
    owner: "user",
    redirect_uri: redirectUri,
    state,
  });
  return `https://api.notion.com/v1/oauth/authorize?${params}`;
}

async function notionToken(code, redirectUri) {
  const basic = Buffer.from(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`).toString("base64");
  const r = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
  });
  if (!r.ok) {
    let detail = "";
    try { detail = JSON.stringify(await r.json()); } catch {}
    throw new Error(`Notion token exchange failed (${r.status}) ${detail}`.trim());
  }
  return r.json();
}

function plainTitle(item) {
  if (item.object === "database") return (item.title || []).map((t) => t.plain_text).join("").trim();
  const props = item.properties || {};
  for (const key of Object.keys(props)) {
    const p = props[key];
    if (p && p.type === "title") return (p.title || []).map((t) => t.plain_text).join("").trim();
  }
  return "";
}

const PARENT_LABELS = { database_id: "In a database", page_id: "Sub-page", block_id: "Nested block", workspace: "Top level" };

async function notionSearch(token) {
  const r = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({ page_size: 100 }),
  });
  if (!r.ok) throw new Error(`Notion search failed (${r.status})`);
  const data = await r.json();
  return (data.results || [])
    .map((item) => ({
      object: item.object,
      id: item.id,
      url: item.url,
      title: plainTitle(item) || "Untitled",
      icon: item.icon && item.icon.type === "emoji" ? item.icon.emoji : "",
      parent: PARENT_LABELS[item.parent?.type] || "Workspace",
      edited: item.last_edited_time || "",
    }))
    .sort((a, b) => (b.edited || "").localeCompare(a.edited || ""));
}

module.exports = { notionAuthorizeUrl, notionToken, notionSearch };
