using OrbitAccess;
using OrbitAccess.Middleware;
using OrbitAccess.Services;

DotEnv.Load(Path.Combine(Directory.GetCurrentDirectory(), ".env"));

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();
builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
{
    o.ValueLengthLimit = 10240;
    o.MultipartBodyLengthLimit = 10240;
});

builder.Services.AddSingleton<JsonFileStore>();
builder.Services.AddSingleton<SessionService>();
builder.Services.AddSingleton<GitHubService>();
builder.Services.AddSingleton<NotionService>();
builder.Services.AddSingleton<NotionAccessService>();
builder.Services.AddSingleton<RateLimiter>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseMiddleware<SecurityHeadersMiddleware>();

app.UseStaticFiles();

app.UseRouting();

app.MapRazorPages();
app.MapControllers();

app.MapGet("/health", () => Results.Json(new { ok = true, uptime = AppInstance.UptimeSeconds }));

app.Run();

static class AppInstance
{
    public static readonly DateTime Start = DateTime.UtcNow;
    public static double UptimeSeconds => (DateTime.UtcNow - Start).TotalSeconds;
}