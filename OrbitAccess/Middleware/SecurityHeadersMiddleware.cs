namespace OrbitAccess.Middleware;

/// <summary>
/// Adds the same security headers as the original server.js.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public Task Invoke(HttpContext context)
    {
        var h = context.Response.Headers;
        h["x-content-type-options"] = "nosniff";
        h["x-frame-options"] = "DENY";
        h["x-xss-protection"] = "1; mode=block";
        h["referrer-policy"] = "strict-origin-when-cross-origin";
        h["permissions-policy"] = "camera=(), microphone=(), geolocation=()";
        h["content-security-policy"] =
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https://avatars.githubusercontent.com data:; connect-src 'self'; frame-ancestors 'none'";
        return _next(context);
    }
}
