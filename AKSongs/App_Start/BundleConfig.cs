using System.Web.Optimization;

namespace AKSongs
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/Scripts/bundle").IncludeDirectory(
                "~/Scripts/", "*.js")
            );

            /*bundles.Add(new StyleBundle("~/Content/bootstrap").Include(
                 "~/Content/bootstrap.css")
            );*/
        } 
    }
}