namespace OrbitAccess.Services;

/// <summary>
/// Async durable JSON-file key-value store. Mirrors the original kvStore.js:
/// sessions.json, notion.json, notion-access.json live under the data directory.
/// </summary>
public class JsonFileStore
{
    private readonly ILogger<JsonFileStore> _logger;
    private readonly string _dataDir;

    /// <summary>Namespace -> path-safe file name.</summary>
    private static string FileNameFor(string ns) => ns switch
    {
        "sessions" => "sessions.json",
        "notion" => "notion.json",
        "notion-access" => "notion-access.json",
        _ => $"{ns}.json",
    };

    public JsonFileStore(IConfiguration config, IWebHostEnvironment env, ILogger<JsonFileStore> logger)
    {
        _logger = logger;
        var configured = config["ConnectionStrings:DataDir"];
        _dataDir = string.IsNullOrWhiteSpace(configured)
            ? Path.Combine(env.ContentRootPath, ".data")
            : configured;
        _dataDir = Path.GetFullPath(_dataDir);
    }

    public string DataDir => _dataDir;

    private string PathFor(string ns) => Path.Combine(_dataDir, FileNameFor(ns));

    private Dictionary<string, JsonElement> Load(string ns)
    {
        var path = PathFor(ns);
        try
        {
            if (File.Exists(path))
            {
                var json = File.ReadAllText(path);
                var doc = JsonDocument.Parse(json);
                if (doc.RootElement.ValueKind == JsonValueKind.Object)
                {
                    var dict = new Dictionary<string, JsonElement>();
                    foreach (var prop in doc.RootElement.EnumerateObject())
                        dict[prop.Name] = prop.Value.Clone();
                    return dict;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read store {Namespace}", ns);
        }
        return new Dictionary<string, JsonElement>();
    }

    private void Persist(string ns, Dictionary<string, JsonElement> data)
    {
        Directory.CreateDirectory(_dataDir);
        var options = new JsonSerializerOptions { WriteIndented = true };
        var json = JsonSerializer.Serialize(data, options);
        File.WriteAllText(PathFor(ns), json);
    }

    private static T? Deserialize<T>(JsonElement e)
    {
        return JsonSerializer.Deserialize<T>(e.GetRawText());
    }

    private static JsonElement Serialize(object? value)
    {
        return JsonSerializer.SerializeToElement(value);
    }

    public async Task<Dictionary<string, JsonElement>> AllAsync(string ns)
    {
        return await Task.Run(() => Load(ns));
    }

    public async Task<T?> GetAsync<T>(string ns, string id)
    {
        if (string.IsNullOrEmpty(id)) return default;
        var data = await AllAsync(ns);
        return data.TryGetValue(id, out var e) ? Deserialize<T>(e) : default;
    }

    public bool Get(string ns, string id, out JsonElement value)
    {
        var data = Load(ns);
        return data.TryGetValue(id, out value);
    }

    public async Task SetAsync(string ns, string id, object? value)
    {
        if (string.IsNullOrEmpty(id)) return;
        var data = Load(ns);
        data[id] = Serialize(value);
        await Task.Run(() => Persist(ns, data));
    }

    public async Task DelAsync(string ns, string id)
    {
        if (string.IsNullOrEmpty(id)) return;
        var data = Load(ns);
        if (!data.Remove(id)) return;
        await Task.Run(() => Persist(ns, data));
    }

    public async Task<Dictionary<string, JsonElement>> ReplaceAsync(string ns, Func<Dictionary<string, JsonElement>, Dictionary<string, JsonElement>> transform)
    {
        var data = transform(Load(ns));
        await Task.Run(() => Persist(ns, data));
        return data;
    }
}
