using System.Text.RegularExpressions;
using OrbitAccess.Models;

namespace OrbitAccess.Services;

/// <summary>
/// Notion page grants + share links. Mirrors lib/notionAccess.js.
/// Backed by the notion-access JSON store.
/// </summary>
public class NotionAccessService
{
    private const string NS = "notion-access";
    private const string LinksKey = "_links";
    private static readonly Regex EmailRegex = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);

    private readonly JsonFileStore _store;

    public NotionAccessService(JsonFileStore store)
    {
        _store = store;
    }

    public async Task<Dictionary<string, NotionGrant>> GetGrantsAsync(string? pageId)
    {
        if (string.IsNullOrEmpty(pageId)) return new();
        var all = await _store.AllAsync(NS);
        if (!all.TryGetValue(pageId, out var e)) return new();
        return JsonSerializer.Deserialize<Dictionary<string, NotionGrant>>(e.GetRawText()) ?? new();
    }

    public async Task<Dictionary<string, Dictionary<string, NotionGrant>>> GetAllGrantsAsync()
    {
        var result = new Dictionary<string, Dictionary<string, NotionGrant>>();
        var all = await _store.AllAsync(NS);
        foreach (var kv in all)
        {
            if (kv.Key == LinksKey) continue;
            result[kv.Key] = JsonSerializer.Deserialize<Dictionary<string, NotionGrant>>(kv.Value.GetRawText()) ?? new();
        }
        return result;
    }

    public async Task<bool> GrantAsync(string pageId, string email, string level, string? grantedBy)
    {
        if (string.IsNullOrEmpty(pageId) || string.IsNullOrEmpty(email)) return false;
        var normalized = email.ToLowerInvariant().Trim();
        if (!EmailRegex.IsMatch(normalized)) return false;
        var allowed = new[] { "read", "write", "admin" };
        var finalLevel = allowed.Contains(level) ? level : "read";
        await _store.ReplaceAsync(NS, data =>
        {
            if (!data.ContainsKey(pageId)) data[pageId] = JsonSerializer.SerializeToElement(new Dictionary<string, NotionGrant>());
            var grants = JsonSerializer.Deserialize<Dictionary<string, NotionGrant>>(data[pageId].GetRawText()) ?? new();
            grants[normalized] = new NotionGrant
            {
                Level = finalLevel,
                GrantedAt = DateTime.UtcNow.ToString("o"),
                GrantedBy = grantedBy ?? "unknown",
            };
            data[pageId] = JsonSerializer.SerializeToElement(grants);
            return data;
        });
        return true;
    }

    public async Task<bool> RevokeAsync(string pageId, string email)
    {
        if (string.IsNullOrEmpty(pageId) || string.IsNullOrEmpty(email)) return false;
        var normalized = email.ToLowerInvariant().Trim();
        var found = false;
        await _store.ReplaceAsync(NS, data =>
        {
            if (!data.ContainsKey(pageId)) return data;
            var grants = JsonSerializer.Deserialize<Dictionary<string, NotionGrant>>(data[pageId].GetRawText()) ?? new();
            if (!grants.Remove(normalized)) return data;
            found = true;
            if (grants.Count == 0) data.Remove(pageId);
            else data[pageId] = JsonSerializer.SerializeToElement(grants);
            return data;
        });
        return found;
    }

    public async Task<List<string>> GetAccessiblePagesAsync(string email)
    {
        var normalized = email.ToLowerInvariant().Trim();
        var result = new List<string>();
        foreach (var kv in await GetAllGrantsAsync())
        {
            if (kv.Value.ContainsKey(normalized)) result.Add(kv.Key);
        }
        return result;
    }

    public async Task<int> RevokeAllByEmailAsync(string email)
    {
        var normalized = email.ToLowerInvariant().Trim();
        var count = 0;
        await _store.ReplaceAsync(NS, data =>
        {
            foreach (var kv in data.ToList())
            {
                if (kv.Key == LinksKey) continue;
                var grants = JsonSerializer.Deserialize<Dictionary<string, NotionGrant>>(kv.Value.GetRawText()) ?? new();
                if (grants.Remove(normalized))
                {
                    count++;
                    if (grants.Count == 0) data.Remove(kv.Key);
                    else data[kv.Key] = JsonSerializer.SerializeToElement(grants);
                }
            }
            return data;
        });
        return count;
    }

    /* ── Share links ── */

    public async Task<string?> CreateLinkAsync(string pageId, string? createdBy)
    {
        if (string.IsNullOrEmpty(pageId)) return null;
        var token = SessionService.RandomHex(16);
        await _store.ReplaceAsync(NS, data =>
        {
            var links = GetLinks(data);
            links[token] = new NotionShareLink
            {
                PageId = pageId,
                CreatedAt = DateTime.UtcNow.ToString("o"),
                CreatedBy = createdBy ?? "unknown",
            };
            data[LinksKey] = JsonSerializer.SerializeToElement(links);
            return data;
        });
        return token;
    }

    public async Task<NotionShareLink?> GetLinkAsync(string token)
    {
        if (string.IsNullOrEmpty(token)) return null;
        var all = await _store.AllAsync(NS);
        var links = GetLinks(all);
        return links.TryGetValue(token, out var l) ? l : null;
    }

    public async Task<(string Token, NotionShareLink Link)?> GetLinkForPageAsync(string pageId)
    {
        if (string.IsNullOrEmpty(pageId)) return null;
        var all = await _store.AllAsync(NS);
        foreach (var kv in GetLinks(all))
        {
            if (kv.Value.PageId == pageId) return (kv.Key, kv.Value);
        }
        return null;
    }

    public async Task<Dictionary<string, NotionShareLink>> GetAllLinksAsync()
    {
        var all = await _store.AllAsync(NS);
        return GetLinks(all);
    }

    public async Task<bool> RevokeLinkAsync(string token)
    {
        if (string.IsNullOrEmpty(token)) return false;
        var found = false;
        await _store.ReplaceAsync(NS, data =>
        {
            var links = GetLinks(data);
            if (!links.Remove(token)) return data;
            found = true;
            data[LinksKey] = JsonSerializer.SerializeToElement(links);
            return data;
        });
        return found;
    }

    public async Task<bool> RevokeLinkByPageAsync(string pageId)
    {
        if (string.IsNullOrEmpty(pageId)) return false;
        var found = false;
        await _store.ReplaceAsync(NS, data =>
        {
            var links = GetLinks(data);
            foreach (var token in links.Keys.Where(t => links[t].PageId == pageId).ToList())
            {
                links.Remove(token);
                found = true;
            }
            data[LinksKey] = JsonSerializer.SerializeToElement(links);
            return data;
        });
        return found;
    }

    private static Dictionary<string, NotionShareLink> GetLinks(Dictionary<string, JsonElement> data)
    {
        if (data.TryGetValue(LinksKey, out var e))
            return JsonSerializer.Deserialize<Dictionary<string, NotionShareLink>>(e.GetRawText()) ?? new();
        return new();
    }
}
