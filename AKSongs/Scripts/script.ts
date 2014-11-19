///<reference path="typings/knockout/knockout.d.ts"/>
///<reference path="typings/lodash/lodash.d.ts"/>
///<reference path="lunrSwe.ts"/>

interface KnockoutUtils {
  canSetPrototype;
  setPrototypeOfOrExtend;
}

ko.utils.canSetPrototype = false;
ko.utils.setPrototypeOfOrExtend = ko.utils.extend;

declare function ga(field: string, ...parameters: any[]) : void;

function slug(s:string) {
  return s.toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

function request(
    method: string,
    url: string,
    data: any,
    onSuccess: (data: string) => void,
    onError: (error: any) => void = undefined) {
  var r = new XMLHttpRequest();
  r.open(method, url, true);

  var password = localStorage.getItem("password");
  if (password) {
    r.setRequestHeader("Authorization", "SECRET " + password);
  }
  r.setRequestHeader("Accept", "application/json");
  r.setRequestHeader("Content-Type", "application/json");

  r.onload = () => {
    if (r.status >= 200 && r.status < 400) {
      onSuccess(r.responseText);
    } else if(onError) {
      onError(r);
    }
  }

  if (onError) {
    r.onerror = () => {
      onError(r);
    }
  }

  if (data !== undefined && data !== null) {
    r.send(JSON.stringify(data));
  } else {
    r.send();
  }

  return r;
}

function formatDate(d: Date) {
  var curr_year = d.getFullYear();
  var curr_month = (d.getMonth() + 1).toString(); //Months are zero based
  if (curr_month.length < 2) curr_month = "0" + curr_month;
  var curr_date = d.getDate().toString();
  if (curr_date.length < 2) curr_date = "0" + curr_date;
  var curr_hour = d.getHours().toString();
  if (curr_hour.length < 2) curr_hour = "0" + curr_hour;
  var curr_min = d.getMinutes().toString();
  if (curr_min.length < 2) curr_min = "0" + curr_min;
  var curr_sec = d.getSeconds().toString();
  if (curr_sec.length < 2) curr_sec = "0" + curr_sec;

  return curr_year + "-" + curr_month + "-" + curr_date + " " + curr_hour + ":" + curr_min + ":" + curr_sec;
}

interface KnockoutSubscribable<T> extends KnockoutSubscribableFunctions<T> {
  limit(c : Function);
}

class Song {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.lyrics = data.lyrics;
    this.melody = data.melody;
    this.author = data.author;
    this.year = data.year;
    this.modified = new Date(data.modified);
  }

  name : string;
  id: string;
  lyrics: string;
  melody: string;
  author: string;
  year: number;
  category = "";
  modified: Date;

  select() {
    var location = getLocation(window.location.href);
    window.history.replaceState(
      { active: this.id, scroll: window.pageYOffset },
      viewModel.currentPageTitle(),
      location.pathname + location.search);

    viewModel.selectedSong(this);
    window.history.pushState({ song: this.id }, this.name, this.id);

    window.scrollTo(0, 0);

    ga("ec:addProduct", { id: this.id, name: this.name, price: "10.00", quantity: 1 });
    ga("ec:setAction", "detail");
    ga("send", { hitType: "pageview", page: "/" + this.id });
  }
}

class ViewModel {
  songs : KnockoutObservable<_.Dictionary<Song>> = ko.observable(null);
  selectedSong = ko.observable(null);
  search = ko.observable("");
  idx: any;
  activeSong = ko.observable(null);
  time = ko.observable(Date.now() / 1000 | 0);

  resolvingUrl: boolean = false;

  loadSongs(data : any[]) {
    this.songs(
      _.indexBy(
        _(data)
          .map(songData => new Song(songData))
          .sortBy(song => song.Name)
        .value(),
        "id"));

    this.idx = LunrSwe.create(idx => {
      idx.field("name", { boost: 10 });
      idx.field("lyrics");
      idx.ref("id");
    });
    _.forEach(this.songs(), song => this.idx.add(song));
  }

  currentPageTitle = ko.computed(() => {
    var selectedSong = this.selectedSong();
    return "AKs sångbok" + (selectedSong ? " - " + selectedSong.name : "");
  }, this);

  constructor() {
    this.search.subscribe(() => {
      if (!this.resolvingUrl) {
        this.selectedSong(null);
        var search = this.search();
        if (window.history.state !== null && window.history.state.search !== undefined) {
          window.history.replaceState({ search: search }, search, "/?q=" + search);
        } else {
          window.history.pushState({ search: search }, search, "/?q=" + search);
        }
        window.scroll(0, 0);
      }
    });

    this.search.limit(callback => {
      var timeoutInstance;
      return () => {
        if (timeoutInstance !== undefined) {
          clearTimeout(timeoutInstance);
          timeoutInstance = setTimeout(() => {
            timeoutInstance = undefined;
            callback();
          }, 300);
        } else {
          callback();
          timeoutInstance = setTimeout(() => {
            timeoutInstance = undefined;
          }, 300);
        }
      };
    });

    this.currentPageTitle.subscribe(value => {
      document.title = value;
    });

    setInterval(() => {
      this.time(Date.now() / 1000 | 0);
    }, 1000);

    var password = localStorage.getItem("password");
    request("POST", "/test", { password: password }, () => this.password(password));
  }

  mode = ko.observable("alphabetic");

  selectMode(mode) {
    return () => {
      this.mode(mode);
      this.menuVisible(false);
      this.selectedSong(null);
      this.editSong(null);
      window.history.pushState(null, "", "/");
      ga("send", { hitType: "pageview", page: "/" });
    }
  }

  toggle(observable: KnockoutObservable<boolean>) {
    return () => {
      observable(!observable());
    }
  }

  fontSize = ko.observable("14pt");

  modifyFontSize(ds: number) {
    return () => {
      var size = parseInt(this.fontSize().substring(0, this.fontSize().length - 2));
      this.fontSize((size + ds) + "pt");
    }
  }

  menuVisible = ko.observable(false);

  filteredSongs = ko.pureComputed(() => {
    var query = this.search();
    var songs = this.songs();

    if (songs === null) return [];
    if (query === "") return _.map(songs, s => s);

    var results: any[] = this.idx.search(query);
    if (results.length > 0) {
      return _.map(results, r => songs[r.ref]);
    }
    return _.filter(songs, s => s.name.toUpperCase().indexOf(query.toUpperCase()) === 0);
  });

  editSong = ko.observable(null);

  edit() {
    request("GET", "/api/songs/" + this.selectedSong().id, null, data => {
      var song = JSON.parse(data);
      var editSong = {
        id: song.id,
        name: ko.observable(song.name),
        lyrics: ko.observable(song.lyrics),
        melody: ko.observable(song.melody),
        author: ko.observable(song.author),
        year: ko.observable(song.year)
      };
      this.editSong(editSong);
      this.menuVisible(false);
    });

    ga("ec:addProduct", { id: this.selectedSong().id, name: this.selectedSong().name, price: "10.00", quantity: 1 });
    ga("ec:setAction", "purchase", {
      id: new Date().toString().replace(/\D/g, ""),
      affiliation: "store"
    });
    ga("send", { hitType: "pageview", page: "/" + this.selectedSong().id });
  }

  addSong() {
    this.editSong({ name: ko.observable(""), lyrics: ko.observable("") });
    this.menuVisible(false);
  }

  cancelEdit() {
    this.editSong(null);
  }

  saveEdit() {
    var editSong = this.editSong();
    var song = {
      id: editSong.id,
      name: editSong.name(),
      lyrics: editSong.lyrics(),
      melody: editSong.melody(),
      author: editSong.author(),
      year: editSong.year()
    };

    if (song.name.replace(/\s/g, "").length === 0) {
      return;
    }

    var onSuccess = () => {
      this.editSong(null);
      reloadSongs();
    }

    if (song.id !== undefined) {
      request("PUT", "/api/songs/" + song.id, song, onSuccess);
    } else {
      request("POST", "/api/songs", song, onSuccess);
    }
  }

  deleteSong() {
    if (confirm("Säkert att du vill ta bort '" + this.selectedSong().name + "'?")) {
      request("DELETE", "/api/songs/" + this.selectedSong().id, null, () => {
        this.editSong(null);
        this.selectedSong(null);
        reloadSongs();
      });
    }
  }

  password = ko.observable(null);

  admin() {
    var password = prompt("Lösenord");
    request("POST", "/test", { password: password }, () => {
      this.password(password);
      localStorage.setItem("password", password);
    });
  }

  publishSong() {
    if (confirm("Är du säker på att du vill publicera " + this.selectedSong().name + " nu?")) {
      request("POST", "/api/notifications", { songId: this.selectedSong().id },
        () => this.menuVisible(false));
    }
  }

  notification = ko.observable(null);

  selectNotificationSong() {
    this.songs()[this.notification().song].select();
    this.notification(null);
  }
}

var viewModel = new ViewModel();
ko.applyBindings(viewModel);

function loadSongs() {

  request("GET", "/api/songs", null, data => {
    viewModel.loadSongs(JSON.parse(data));

    resolveUrl();

    window.onpopstate = () => {
      resolveUrl();
      if (window.history.state) {
        viewModel.activeSong(window.history.state.active);
        if (window.history.state.scroll !== undefined) {
          window.scroll(0, window.history.state.scroll);
        }
      }
    }
  });

  request("GET", "/api/notifications", null, data => {
    var notifications = JSON.parse(data);
    if (notifications && notifications.length > 0) {
      var notification = notifications[0];
      notification.created = viewModel.time() - notification.age;
      viewModel.notification(notification);
    }
  });
}

loadSongs();

document.addEventListener("click", event => {
  if (!$(event.target).closest(".navbar").length) {
    viewModel.menuVisible(false);
  }
}, false);

function startsWith(s : string, searchString : string) {
  return s.lastIndexOf(searchString, 0) === 0;
}

function getLocation(href : string) {
  var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
    return match && {
    protocol: match[1],
    host: match[2],
    hostname: match[3],
    port: match[4],
    pathname: match[5],
    search: match[6],
    hash: match[7]
  }
}

function resolveUrl() {
  viewModel.resolvingUrl = true;

  var location = getLocation(window.location.href);

  var query = location.search.substring(1).split("&").map(q => decodeURIComponent(q));
  var path = location.pathname.substring(1);

  var search = _.find(query, q => startsWith(q, "q="));
  if (search && search.length > 2) {
    viewModel.search(search.substring(2));
    viewModel.selectedSong(null);
  }
  else if (path.length != null && path in viewModel.songs()) {
    viewModel.selectedSong(viewModel.songs()[path]);
    viewModel.search("");
    ga("send", { 'hitType': "pageview", 'page': "/" + path });
  } else {
    viewModel.selectedSong(null);
    viewModel.search("");
    ga("send", { 'hitType': "pageview", 'page': "/" + this.id });
  }

  viewModel.resolvingUrl = false;
}

function reloadSongs() {
  if (window.applicationCache.status === window.applicationCache.UNCACHED) {
    loadSongs();
  } else {
    window.applicationCache.update();
  }
}

window.applicationCache.addEventListener("error", e => {
  console.log("applicationCache error", e);
});

window.applicationCache.addEventListener("updateready", () => {
  window.applicationCache.swapCache();
  if (viewModel.editSong() === null) {
    window.location.reload();
  } else {
    loadSongs();
  }
});

if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
  window.applicationCache.swapCache();
  window.location.reload();
}

interface JQueryStatic {
  connection;
}

$(() => {

  $.connection.notificationHub.client.notifyCurrentSong = notification => {
    notification.created = viewModel.time();
    viewModel.notification(notification);
  }

  $.connection.hub.start();

});