using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

using AKSongs.Models;

using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;

namespace AKSongs.Controllers
{
    [HubName("notificationHub")]
    public class NotificationHub : Hub
    {
    }
}