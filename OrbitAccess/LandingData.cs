namespace OrbitAccess;

public record IconAndText(string Title, string Body, string Icon, bool Dark);

public static class LandingData
{
    private const string Svg =
        @"<svg viewBox=""0 0 24 24"" width=""36"" height=""36"" fill=""none"" stroke=""currentColor"" stroke-width=""2"" stroke-linecap=""round"" stroke-linejoin=""round"" aria-hidden=""true"">";

    public static readonly List<IconAndText> Features = new()
    {
        new(
            "Secure by design",
            "Real OAuth 2.0 with state verification and HttpOnly cookies. Access tokens stay server-side &mdash; they never reach the browser.",
            $"{Svg}<rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"2\" ry=\"2\"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/></svg>",
            false),
        new(
            "Your data, your control",
            "Scoped permissions only. Disconnect Notion or log out in one click and everything is wiped. No lock-in.",
            $"{Svg}<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/></svg>",
            true),
        new(
            "Fast &amp; lightweight",
            "Lean server-rendered pages that load instantly, even on slow connections. Built on ASP.NET Core with zero framework overhead in the browser.",
            $"{Svg}<polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\"/></svg>",
            false),
        new(
            "Built to grow",
            "Start with your personal accounts today. Shared workspaces, team management, and audit logs are on the roadmap.",
            $"{Svg}<path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\"/><polyline points=\"3.27 6.96 12 12.01 20.73 6.96\"/><line x1=\"12\" y1=\"22.08\" x2=\"12\" y2=\"12\"/></svg>",
            false),
    };
}