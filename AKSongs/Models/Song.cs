using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AKSongs.Models
{
    public class Song
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Lyrics { get; set; }
        public string Melody { get; set; }
        public string Author { get; set; }
        public int? Year { get; set; }
        public DateTime Modified { get; set; }
        public DateTime Created { get; set; }
    }
}