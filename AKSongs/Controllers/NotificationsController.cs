using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;

using AKSongs.Filters;
using AKSongs.Models;

using Microsoft.AspNet.SignalR;

namespace AKSongs.Controllers
{
    [RequireHttps]
    public class NotificationsController : ApiController
    {
        private Context db = new Context();

        // GET: api/Notifications
        public IEnumerable<NotificationDto> GetNotifications()
        {
            return db.Notifications
                .OrderByDescending(n => n.Created)
                .Take(1)
                .ToArray()
                .Select(n => new NotificationDto { Song = n.SongId, Age = (int)(DateTime.Now-n.Created).TotalSeconds });
        }

        public class NotificationDto
        {
            public string Song { get; set; }
            public int Age { get; set; }
        }

        // GET: api/Notifications/5
        [ResponseType(typeof(Notification))]
        public async Task<IHttpActionResult> GetNotification(int id)
        {
            Notification notification = await db.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound();
            }

            return Ok(notification);
        }

        // PUT: api/Notifications/5
        [SecretKeyAuthorization]
        [ResponseType(typeof(void))]
        public async Task<IHttpActionResult> PutNotification(int id, Notification notification)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != notification.Id)
            {
                return BadRequest();
            }

            db.Entry(notification).State = EntityState.Modified;

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!NotificationExists(id))
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

        // POST: api/Notifications
        [SecretKeyAuthorization]
        [ResponseType(typeof(Notification))]
        public async Task<IHttpActionResult> PostNotification(Notification notification)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            notification.Created = DateTime.Now;

            db.Notifications.Add(notification);
            await db.SaveChangesAsync();

            GlobalHost.ConnectionManager.GetHubContext<NotificationHub>()
                      .Clients.All.notifyCurrentSong(new { song = notification.SongId });

            return CreatedAtRoute("DefaultApi", new { id = notification.Id }, notification);
        }

        // DELETE: api/Notifications/5
        [SecretKeyAuthorization]
        [ResponseType(typeof(Notification))]
        public async Task<IHttpActionResult> DeleteNotification(int id)
        {
            Notification notification = await db.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound();
            }

            db.Notifications.Remove(notification);
            await db.SaveChangesAsync();

            return Ok(notification);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool NotificationExists(int id)
        {
            return db.Notifications.Count(e => e.Id == id) > 0;
        }
    }
}