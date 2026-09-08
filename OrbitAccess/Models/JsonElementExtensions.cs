namespace OrbitAccess.Models;

public static class JsonElementExtensions
{
    public static string? GetString(this JsonElement e, string name)
    {
        return e.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.String ? p.GetString() : null;
    }

    public static bool GetBool(this JsonElement e, string name)
    {
        return e.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.True;
    }

    public static int GetInt(this JsonElement e, string name)
    {
        return e.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.Number ? p.GetInt32() : 0;
    }

    public static long GetInt64(this JsonElement e, string name)
    {
        return e.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.Number ? p.GetInt64() : 0;
    }
}
