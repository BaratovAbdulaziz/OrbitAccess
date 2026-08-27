(function () {
  var modal = document.getElementById("nt-share-modal");
  if (!modal) return;

  var backdrop = modal.querySelector(".nt-modal-backdrop");
  var closeBtn = document.getElementById("nt-modal-close");
  var titleEl = document.getElementById("nt-share-title");
  var emailInput = document.getElementById("nt-share-email");
  var levelSelect = document.getElementById("nt-share-level");
  var submitBtn = document.getElementById("nt-share-submit");
  var msgEl = document.getElementById("nt-share-msg");
  var itemsEl = document.getElementById("nt-access-items");
  var linkRow = document.getElementById("nt-link-row");
  var linkCreateBtn = document.getElementById("nt-link-create");
  var linkMsg = document.getElementById("nt-link-msg");

  var currentPageId = null;

  function openModal(pageId, pageTitle) {
    currentPageId = pageId;
    titleEl.textContent = "Share \u201c" + pageTitle + "\u201d";
    emailInput.value = "";
    levelSelect.value = "read";
    msgEl.textContent = "";
    linkMsg.textContent = "";
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    emailInput.focus();
    loadGrants(pageId);
    loadLink(pageId);
  }

  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "";
    currentPageId = null;
  }

  function loadGrants(pageId) {
    itemsEl.innerHTML = '<p class="caption-note">Loading...</p>';
    fetch("/api/notion/access?pageId=" + encodeURIComponent(pageId))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok || !data.grants || data.grants.length === 0) {
          itemsEl.innerHTML = '<p class="caption-note">No one has access yet.</p>';
          return;
        }
        var html = "";
        data.grants.forEach(function (g) {
          html += '<div class="nt-access-row">' +
            '<span class="nt-access-email">' + escapeHtml(g.email) + '</span>' +
            '<span class="nt-access-level badge-pill">' + escapeHtml(g.level) + '</span>' +
            '<button class="nt-access-revoke btn btn-secondary btn-sm" data-email="' + escapeHtml(g.email) + '">Revoke</button>' +
            '</div>';
        });
        itemsEl.innerHTML = html;

        itemsEl.querySelectorAll(".nt-access-revoke").forEach(function (btn) {
          btn.addEventListener("click", function () {
            revokeAccess(pageId, btn.dataset.email);
          });
        });
      })
      .catch(function () {
        itemsEl.innerHTML = '<p class="caption-note">Failed to load access list.</p>';
      });
  }

  function loadLink(pageId) {
    linkRow.innerHTML = '<button class="btn btn-secondary btn-sm" id="nt-link-create" type="button" disabled>Loading...</button>';
    fetch("/api/notion/access/link?pageId=" + encodeURIComponent(pageId))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.ok && data.url) {
          renderActiveLink(data.url, data.token);
        } else {
          linkRow.innerHTML = '<button class="btn btn-secondary btn-sm" id="nt-link-create" type="button">Create link</button>';
          document.getElementById("nt-link-create").addEventListener("click", function () {
            createLink(pageId);
          });
        }
      })
      .catch(function () {
        linkRow.innerHTML = '<p class="caption-note">Failed to load link.</p>';
      });
  }

  function renderActiveLink(url, token) {
    linkRow.innerHTML =
      '<input type="text" class="acc-input nt-link-input" value="' + escapeHtml(url) + '" readonly>' +
      '<button class="btn btn-secondary btn-sm nt-link-copy" type="button">Copy</button>' +
      '<button class="btn btn-secondary btn-sm nt-link-revoke" type="button" title="Revoke link">&times;</button>';

    linkRow.querySelector(".nt-link-copy").addEventListener("click", function () {
      var input = linkRow.querySelector(".nt-link-input");
      input.select();
      navigator.clipboard.writeText(input.value).then(function () {
        linkMsg.textContent = "Link copied!";
        linkMsg.style.color = "var(--teal)";
        setTimeout(function () { linkMsg.textContent = ""; }, 2000);
      }).catch(function () {
        document.execCommand("copy");
        linkMsg.textContent = "Link copied!";
        linkMsg.style.color = "var(--teal)";
        setTimeout(function () { linkMsg.textContent = ""; }, 2000);
      });
    });

    linkRow.querySelector(".nt-link-revoke").addEventListener("click", function () {
      revokeLink(pageId, token);
    });
  }

  function createLink(pageId) {
    linkCreateBtn = document.getElementById("nt-link-create");
    if (linkCreateBtn) linkCreateBtn.disabled = true;
    linkMsg.textContent = "";
    fetch("/api/notion/access/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: pageId }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.ok && data.url) {
          renderActiveLink(data.url, data.token);
          linkMsg.textContent = "Share link created.";
          linkMsg.style.color = "var(--teal)";
          refreshTileLinkBadge(pageId, true);
        } else {
          linkMsg.textContent = data.message || "Failed to create link.";
          linkMsg.style.color = "var(--error)";
          if (linkCreateBtn) linkCreateBtn.disabled = false;
        }
      })
      .catch(function () {
        linkMsg.textContent = "Network error. Try again.";
        linkMsg.style.color = "var(--error)";
        if (linkCreateBtn) linkCreateBtn.disabled = false;
      });
  }

  function revokeLink(pageId, token) {
    fetch("/api/notion/access/link", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.ok) {
          loadLink(pageId);
          linkMsg.textContent = "Link revoked.";
          linkMsg.style.color = "var(--teal)";
          refreshTileLinkBadge(pageId, false);
        } else {
          linkMsg.textContent = data.message || "Failed to revoke link.";
          linkMsg.style.color = "var(--error)";
        }
      })
      .catch(function () {
        linkMsg.textContent = "Network error. Try again.";
        linkMsg.style.color = "var(--error)";
      });
  }

  function refreshTileLinkBadge(pageId, hasLink) {
    var tiles = document.querySelectorAll(".nt-share-btn");
    tiles.forEach(function (btn) {
      if (btn.dataset.pageId === pageId) {
        var tile = btn.closest(".acc-tile");
        if (!tile) return;
        var existing = tile.querySelector(".nt-link-badge");
        if (hasLink && !existing) {
          var span = document.createElement("span");
          span.className = "nt-link-badge";
          span.title = "Share link active";
          span.textContent = "\uD83D\uDD17 link";
          btn.parentNode.insertBefore(span, btn);
        } else if (!hasLink && existing) {
          existing.remove();
        }
      }
    });
  }

  function grantAccess(pageId, email, level) {
    if (!email || !pageId) return;
    submitBtn.disabled = true;
    msgEl.textContent = "";
    fetch("/api/notion/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: pageId, email: email, level: level }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        submitBtn.disabled = false;
        if (data.ok) {
          msgEl.textContent = data.message;
          msgEl.style.color = "var(--teal)";
          emailInput.value = "";
          loadGrants(pageId);
          refreshTileGrantCount(pageId);
        } else {
          msgEl.textContent = data.message || "Failed to grant access.";
          msgEl.style.color = "var(--error)";
        }
      })
      .catch(function () {
        submitBtn.disabled = false;
        msgEl.textContent = "Network error. Try again.";
        msgEl.style.color = "var(--error)";
      });
  }

  function revokeAccess(pageId, email) {
    if (!email || !pageId) return;
    fetch("/api/notion/access", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: pageId, email: email }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.ok) {
          loadGrants(pageId);
          refreshTileGrantCount(pageId);
        } else {
          msgEl.textContent = data.message || "Failed to revoke access.";
          msgEl.style.color = "var(--error)";
        }
      })
      .catch(function () {
        msgEl.textContent = "Network error. Try again.";
        msgEl.style.color = "var(--error)";
      });
  }

  function refreshTileGrantCount(pageId) {
    fetch("/api/notion/access?pageId=" + encodeURIComponent(pageId))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var tiles = document.querySelectorAll(".nt-share-btn");
        tiles.forEach(function (btn) {
          if (btn.dataset.pageId === pageId) {
            var tile = btn.closest(".acc-tile");
            if (!tile) return;
            var count = data.ok ? data.grants.length : 0;
            var existing = tile.querySelector(".nt-grant-count");
            if (count > 0) {
              if (existing) {
                existing.textContent = count + " shared";
                existing.title = count + " user(s) with access";
              } else {
                var span = document.createElement("span");
                span.className = "nt-grant-count";
                span.textContent = count + " shared";
                span.title = count + " user(s) with access";
                btn.parentNode.insertBefore(span, btn);
              }
            } else if (existing) {
              existing.remove();
            }
          }
        });
      });
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(s || ""));
    return div.innerHTML;
  }

  document.querySelectorAll(".nt-share-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openModal(btn.dataset.pageId, btn.dataset.pageTitle);
    });
  });

  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.style.display === "flex") closeModal();
  });

  submitBtn.addEventListener("click", function () {
    var email = emailInput.value.trim();
    var level = levelSelect.value;
    if (!email) {
      msgEl.textContent = "Enter an email address.";
      msgEl.style.color = "var(--error)";
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msgEl.textContent = "Enter a valid email address.";
      msgEl.style.color = "var(--error)";
      return;
    }
    grantAccess(currentPageId, email, level);
  });

  emailInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") submitBtn.click();
  });
})();
