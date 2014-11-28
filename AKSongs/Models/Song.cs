using System;
using System.Collections.Generic;
using System.Linq;

using TypeLite;

namespace AKSongs.Models
{
    [TsClass]
    public class Song
    {
        [TsProperty(IsOptional = true)]
        public string Id { get; set; }
        public string Name { get; set; }
        public string Lyrics { get; set; }
        public string Melody { get; set; }
        public string Author { get; set; }
        public int? Year { get; set; }
        [TsProperty(IsOptional = true)]
        public DateTime Modified { get; set; }
        [TsProperty(IsOptional = true)]
        public DateTime Created { get; set; }
    }
}