const { CLIENT_ID, CLIENT_SECRET } = require("./config");

async function githubToken(code) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.error_description || "Token exchange failed");
  return data.access_token;
}

function api(token, path, options = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
}

async function githubUser(token) {
  const res = await api(token, "/user");
  if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
  return res.json();
}

async function githubRepos(token, visibility) {
  const res = await api(token, `/user/repos?visibility=${visibility}&sort=pushed&direction=desc&per_page=6`);
  if (!res.ok) return [];
  return res.json();
}

async function githubOrgRepos(token, login) {
  const res = await api(token, `/orgs/${encodeURIComponent(login)}/repos?sort=pushed&direction=desc&per_page=6`);
  if (!res.ok) return [];
  return res.json();
}

async function githubOrgs(token) {
  const res = await api(token, "/user/orgs?per_page=8");
  if (!res.ok) return [];
  const orgs = await res.json();
  return Promise.all(orgs.map(async (org) => ({
    org,
    repos: await githubOrgRepos(token, org.login),
  })));
}

async function githubCollaborators(token, owner, repo) {
  const res = await api(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/collaborators?per_page=100`
  );
  if (!res.ok) return { error: res.status };
  return res.json();
}

async function githubResolveUser(token, input) {
  if (!input.includes("@")) return input;
  const q = encodeURIComponent(`${input} in:email`);
  const res = await api(token, `/search/users?q=${q}&per_page=1`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.items && json.items[0] ? json.items[0].login : null;
}

async function githubAddCollaborator(token, owner, repo, username, permission) {
  const res = await api(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/collaborators/${encodeURIComponent(username)}`,
    { method: "PUT", body: JSON.stringify({ permission }) }
  );
  if (res.status === 201 || res.status === 204) return { ok: true };
  const json = await res.json().catch(() => ({}));
  return { error: res.status, message: json.message || "GitHub refused this invite." };
}

module.exports = {
  githubToken,
  githubUser,
  githubRepos,
  githubOrgs,
  githubOrgRepos,
  githubCollaborators,
  githubResolveUser,
  githubAddCollaborator,
};
