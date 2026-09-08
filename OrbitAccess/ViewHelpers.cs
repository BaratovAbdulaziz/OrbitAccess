using OrbitAccess.Models;

namespace OrbitAccess;

public static class ViewHelpers
{
    private static readonly Dictionary<string, string> LangColors = new()
    {
        ["JavaScript"] = "#f1e05a", ["TypeScript"] = "#3178c6", ["Python"] = "#3572A5",
        ["HTML"] = "#e34c26", ["CSS"] = "#563d7c", ["Go"] = "#00ADD8", ["Rust"] = "#dea584",
        ["Java"] = "#b07219", ["C++"] = "#f34b7d", ["C"] = "#555555", ["C#"] = "#178600",
        ["Ruby"] = "#701516", ["PHP"] = "#4F5D95", ["Swift"] = "#F05138", ["Kotlin"] = "#A97BFF",
        ["Shell"] = "#89e051", ["Dart"] = "#00B4AB", ["Vue"] = "#41b883", ["Svelte"] = "#ff3e00",
        ["Elixir"] = "#6e4a7e", ["Lua"] = "#000080", ["Zig"] = "#ec915c", ["Haskell"] = "#5e5086",
        ["Scala"] = "#c22d40",
    };

    public static string LangColor(string? lang)
        => lang != null && LangColors.TryGetValue(lang, out var c) ? c : "";

    public const string StarIcon =
        @"<svg class=""star-ic"" viewBox=""0 0 16 16"" width=""12"" height=""12"" fill=""currentColor"" aria-hidden=""true""><path d=""M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z""/></svg>";

    public const string LockIcon =
        @"<svg class=""lock-ic"" viewBox=""0 0 16 16"" width=""11"" height=""11"" fill=""currentColor"" aria-hidden=""true""><title>Private repository</title><path d=""M4 4a4 4 0 0 1 8 0v2h.25c.69 0 1.25.56 1.25 1.25v5.5c0 .69-.56 1.25-1.25 1.25h-9.5C2.06 14 1.5 13.44 1.5 12.75v-5.5C1.5 6.56 2.06 6 2.75 6H4Zm6.5 0v2h-5V4a2.5 2.5 0 0 1 5 0Z""/></svg>";

    public const string DatabaseIcon =
        @"<svg viewBox=""0 0 16 16"" width=""14"" height=""14"" fill=""currentColor"" aria-hidden=""true""><path d=""M8 1.5c-3.6 0-6.5 1-6.5 2.25v8.5C1.5 13.5 4.4 14.5 8 14.5s6.5-1 6.5-2.25v-8.5C14.5 2.5 11.6 1.5 8 1.5Zm5 10.75c0 .35-1.7 1.25-5 1.25s-5-.9-5-1.25V9.86c1.2.62 3.03 1.02 5 1.02s3.8-.4 5-1.02v2.39Zm0-4c0 .35-1.7 1.25-5 1.25S3 8.6 3 8.25V5.86c1.2.62 3.03 1.02 5 1.02s3.8-.4 5-1.02v2.39Z""/></svg>";

    public const string PageIcon =
        @"<svg viewBox=""0 0 16 16"" width=""14"" height=""14"" fill=""currentColor"" aria-hidden=""true""><path d=""M4 1.5A1.5 1.5 0 0 0 2.5 3v10A1.5 1.5 0 0 0 4 14.5h8a1.5 1.5 0 0 0 1.5-1.5V5.62L9.88 1.5H4Zm5.5 1.81L12.19 6H9.5V3.31Z""/></svg>";

    public const string NotionIcon =
        @"<svg viewBox=""0 0 24 24"" width=""18"" height=""18"" fill=""none"" stroke=""currentColor"" stroke-width=""2.2"" stroke-linecap=""round"" aria-hidden=""true""><rect x=""3"" y=""3"" width=""18"" height=""18"" rx=""2""/><path d=""M9 9h6M9 13h6M9 17h4""/></svg>";

    /// <summary>"Pushed Mon 5" style date like the original.</summary>
    public static string ShortDate(string? iso)
    {
        if (string.IsNullOrEmpty(iso)) return "";
        try { return DateTimeOffset.Parse(iso).ToLocalTime().ToString("MMM d"); }
        catch { return ""; }
    }
}