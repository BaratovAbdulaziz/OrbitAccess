using System.Collections.Concurrent;

namespace OrbitAccess.Services;

/// <summary>
/// Simple in-memory rate limiter (per-process). Mirrors lib/util.js rateLimit.
/// </summary>
public class RateLimiter
{
    private sealed class Bucket
    {
        public long Start;
        public int Count;
    }

    private readonly ConcurrentDictionary<string, Bucket> _buckets = new();

    public bool Allow(string key, int maxRequests = 10, long windowMs = 60_000)
    {
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var bucket = _buckets.GetOrAdd(key, _ => new Bucket { Start = now });
        lock (bucket)
        {
            if (now - bucket.Start > windowMs)
            {
                bucket.Start = now;
                bucket.Count = 1;
                return true;
            }
            bucket.Count++;
            if (bucket.Count > maxRequests) return false;
        }

        if (Random.Shared.NextDouble() < 0.05 && _buckets.Count > 1000)
        {
            var cutoff = now - 120_000;
            foreach (var kv in _buckets)
            {
                bool expired;
                lock (kv.Value) { expired = kv.Value.Start < cutoff; }
                if (expired) _buckets.TryRemove(kv.Key, out _);
            }
        }
        return true;
    }
}
