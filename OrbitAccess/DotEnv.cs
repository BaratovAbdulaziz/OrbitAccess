namespace OrbitAccess;

/// <summary>
/// Minimal .env loader: exposes KEY=VALUE entries as environment variables so
/// the configuration system picks them up. Real env vars always win over the file.
/// </summary>
public static class DotEnv
{
    public static void Load(string path = ".env")
    {
        var full = Path.GetFullPath(path);
        if (!File.Exists(full)) return;
        foreach (var raw in File.ReadAllLines(full))
        {
            var line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;
            var eq = line.IndexOf('=');
            if (eq <= 0) continue;
            var key = line[..eq].Trim();
            var value = line[(eq + 1)..].Trim();
            if (value.Length >= 2 && value[0] == '"' && value[^1] == '"') value = value[1..^1];
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                Environment.SetEnvironmentVariable(key, value);
        }
    }
}