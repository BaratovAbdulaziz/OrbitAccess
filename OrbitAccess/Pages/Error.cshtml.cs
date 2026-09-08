using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace OrbitAccess.Pages;

public class ErrorModel : PageModel
{
    public string ErrorMessage { get; private set; } = "Please try again or return to the home page.";

    public void OnGet()
    {
        if (Response.StatusCode == 404)
            ErrorMessage = "The page you're looking for doesn't exist or has moved.";
    }
}