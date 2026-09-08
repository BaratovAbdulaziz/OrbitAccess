using System.Collections.Concurrent;
using System.Security.Cryptography;
using OrbitAccess.Models;

namespace OrbitAccess.Services;

/// <summary>
/// Session management: in-memory cache backed by a JSON file store with a 30-day TTL.
/// Mirrors the original lib/sessions.js + lib/sessionStore.js.
/// </summary>
public class SessionService
{
    private const string NS = "sessions";
    private static readonly TimeSpan SessionTtl = TimeSpan.FromDays(30);

    private readonly ConcurrentDictionary<string, Session> _memory = new();
    private readonly JsonFileStore _store;
    private readonly ILogger<SessionService> _logger;

    public SessionService(JsonFileStore store, ILogger<SessionService> logger)
    {
        _store = store;
        _logger = logger;
    }

    /// <summary>In-memory store (mirrors lib/sessions.js Map).</summary>
    public ConcurrentDictionary<string, Session> Memory => _memory;

    /// <summary>Look up a session by id, first from memory then from the durable store.</summary>
    public async Task<Session?> ResolveAsync(string? sid)
    {
        if (string.IsNullOrEmpty(sid)) return null;

        if (_memory.TryGetValue(sid, out var mem)) return mem;

        var stored = await _store.GetAsync<StoredSession>(NS, sid);
        if (stored != null)
        {
            if (stored.ExpiresAt != 0 && DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() > stored.ExpiresAt)
            {
                await _store.DelAsync(NS, sid);
                return null;
            }
            var session = stored.Data ?? new Session();
            _memory[sid] = session;
            return session;
        }
        return null;
    }

    public void Cache(string sid, Session session) => _memory[sid] = session;

    public async Task SaveAsync(string sid, Session value)
    {
        _memory[sid] = value;
        await _store.SetAsync(NS, sid, new StoredSession
        {
            Data = value,
            CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            ExpiresAt = DateTimeOffset.UtcNow.Add(SessionTtl).ToUnixTimeMilliseconds(),
        });
    }

    public async Task DeleteAsync(string sid)
    {
        _memory.Remove(sid, out _);
        if (!string.IsNullOrEmpty(sid)) await _store.DelAsync(NS, sid);
    }

    public static string RandomHex(int bytes)
    {
        var arr = RandomNumberGenerator.GetBytes(bytes);
        return Convert.ToHexString(arr).ToLowerInvariant();
    }

    private class StoredSession
    {
        public Session? Data { get; set; }
        public long CreatedAt { get; set; }
        public long ExpiresAt { get; set; }
    }
}
