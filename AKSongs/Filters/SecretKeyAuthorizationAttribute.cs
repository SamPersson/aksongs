using System.Configuration;
using System.Net.Http.Headers;
using System.Web.Http;
using System.Web.Http.Controllers;

namespace AKSongs.Filters
{
  public class SecretKeyAuthorizationAttribute : AuthorizeAttribute
  {
    protected override bool IsAuthorized(HttpActionContext context)
    {
      AuthenticationHeaderValue authorization = context.Request.Headers.Authorization;
      return authorization != null && authorization.Parameter == ConfigurationManager.AppSettings["ApiKey"];
    }
  }
}