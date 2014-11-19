using System;

namespace AKSongs.Models
{
  public class Notification
  {
    public int Id { get; set; }
    public string SongId { get; set; }
    public Song Song { get; set; }
    public DateTime Created { get; set; }
  }
}