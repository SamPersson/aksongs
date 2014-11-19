using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Web;

using Newtonsoft.Json;

namespace AKSongs.Models
{
    public class Context : DbContext
    {
        public Context() : base("db")
        {
            Configuration.LazyLoadingEnabled = false;
        }

        static Context()
        {
            //Database.SetInitializer(new DBInitializer());
        }

        public DbSet<Song> Songs { get; set; }
        public DbSet<Notification> Notifications { get; set; }
    }

    public class DBInitializer : DropCreateDatabaseAlways<Context>
    {
        protected override void Seed(Context context)
        {
            var songsData = new StreamReader(Assembly.GetExecutingAssembly().GetManifestResourceStream("AKSongs.Models.data.js")).ReadToEnd();
            var songs = JsonConvert.DeserializeObject<IEnumerable<Song>>(songsData);

            foreach (var song in songs)
            {
                var id = song.Name.ToLowerInvariant();
                id = Regex.Replace(id, @"\s+", "-");
                id = Regex.Replace(id, @"å|ä", "a");
                id = Regex.Replace(id, @"ö", "o");
                id = Regex.Replace(id, @"[^a-z\-]+", "");
                id = Regex.Replace(id, @"\-\-+", "-");
                song.Id = id.Trim('-');

                song.Created = song.Modified = DateTime.Now;

                context.Songs.Add(song);
            }

            base.Seed(context);
        }
    }
}