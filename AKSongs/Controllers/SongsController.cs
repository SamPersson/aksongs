using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;

using AKSongs.Filters;
using AKSongs.Models;

using Microsoft.AspNet.SignalR;

using WebApi.OutputCache.V2;

namespace AKSongs.Controllers
{
    public class SongsController : ApiController
    {
        private Context db = new Context();

        // GET: api/Songs
        [CacheOutput(Private = true)]
        public IEnumerable<Song> GetSongs()
        {
            return db.Songs.ToArray();
        }

        // GET: api/Songs/5
        [ResponseType(typeof(Song))]
        public async Task<IHttpActionResult> GetSong(string id)
        {
            Song song = await db.Songs.FindAsync(id);
            if (song == null)
            {
                return NotFound();
            }

            return Ok(song);
        }

        // PUT: api/Songs/5
        [SecretKeyAuthorization]
        [ResponseType(typeof(void))]
        public async Task<IHttpActionResult> PutSong(string id, Song song)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != song.Id)
            {
                return BadRequest();
            }

            Song dbSong = await db.Songs.FindAsync(id);
            dbSong.Name = song.Name;
            dbSong.Lyrics = song.Lyrics;
            dbSong.Melody = song.Melody;
            dbSong.Author = song.Author;
            dbSong.Year = song.Year;
            dbSong.Modified = DateTime.Now;

            db.Entry(dbSong).State = EntityState.Modified;

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SongExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return StatusCode(HttpStatusCode.NoContent);
        }


        // POST: api/Songs
        [SecretKeyAuthorization]
        [ResponseType(typeof(Song))]
        public async Task<IHttpActionResult> PostSong(Song song)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var id = song.Name.ToLowerInvariant();
            id = Regex.Replace(id, @"\s+", "-");
            id = Regex.Replace(id, @"å|ä", "a");
            id = Regex.Replace(id, @"ö", "o");
            id = Regex.Replace(id, @"[^a-z0-9\-]+", "");
            id = Regex.Replace(id, @"\-\-+", "-");
            song.Id = id.Trim('-');

            if(song.Id == "")
            {
                return BadRequest(ModelState);
            }

            song.Created = DateTime.Now;
            song.Modified = DateTime.Now;

            db.Songs.Add(song);

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (SongExists(song.Id))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtRoute("DefaultApi", new { id = song.Id }, song);
        }

        // DELETE: api/Songs/5
        [SecretKeyAuthorization]
        [ResponseType(typeof(Song))]
        public async Task<IHttpActionResult> DeleteSong(string id)
        {
            Song song = await db.Songs.FindAsync(id);
            if (song == null)
            {
                return NotFound();
            }

            db.Songs.Remove(song);
            await db.SaveChangesAsync();

            return Ok(song);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool SongExists(string id)
        {
            return db.Songs.Count(e => e.Id == id) > 0;
        }
    }
}