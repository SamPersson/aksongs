using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Web.Mvc;
using System.Web.UI;

using AKSongs.Models;

using Microsoft.AspNet.SignalR;

namespace AKSongs.Controllers
{
    public class MainController : Controller
    {
        private Context db = new Context();

        //[OutputCache(Duration = 1, Location = OutputCacheLocation.Client)]
        public ActionResult Index(string song)
        {
          return View();
        }

        [Route("cachemanifest")]
        [OutputCache(NoStore = true, Duration = 0, VaryByParam = "None")]
        public ActionResult Manifest()
        {
          var manifestResult = new ManifestResult("000000024 " + db.Songs.OrderByDescending(s => s.Modified).Select(s => s.Modified).First())
          {
            CacheResources = new [] { 
              "Content/style.css",
              "Content/cherub.png",
              "Scripts/scripts.js",
              "Scripts/lodash.js",
              "Scripts/lunr.js",
              "Scripts/knockout-3.2.0.js",
              "Scripts/jquery-2.1.1.js",
              "Scripts/jquery.signalR-2.1.2.js",
              "signalr/hubs",
              "api/songs",
              "favicon.ico",
            },
            NetworkResources = new [] { "*" },
            FallbackResources = new Dictionary<string, string> { { "/", "/" } }
          };
          Response.Expires = 0;
          return manifestResult;
        }

        [Route("test")]
        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult TestPassword(string password)
        {
          if (password != ConfigurationManager.AppSettings["ApiKey"])
          {
            return HttpNotFound();
          }
          return new HttpStatusCodeResult(HttpStatusCode.OK);
        }

        [Route("drunkmode")]
        public ActionResult Drunkmode(bool on = true)
        {
            GlobalHost.ConnectionManager.GetHubContext<NotificationHub>()
                .Clients.All.drunkMode(on);
            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }
    }
}