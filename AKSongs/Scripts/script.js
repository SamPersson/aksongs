///<reference path="typings/knockout/knockout.d.ts"/>
///<reference path="typings/lodash/lodash.d.ts"/>
///<reference path="lunrSwe.ts"/>

function slug(s) {
    return s.toLowerCase().replace(/\s+/g, "-").replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o").replace(/[^a-z\-]+/g, "").replace(/\-\-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}

function formatDate(d) {
    var curr_year = d.getFullYear();
    var curr_month = (d.getMonth() + 1).toString();
    if (curr_month.length < 2)
        curr_month = "0" + curr_month;
    var curr_date = d.getDate().toString();
    if (curr_date.length < 2)
        curr_date = "0" + curr_date;
    var curr_hour = d.getHours().toString();
    if (curr_hour.length < 2)
        curr_hour = "0" + curr_hour;
    var curr_min = d.getMinutes().toString();
    if (curr_min.length < 2)
        curr_min = "0" + curr_min;
    var curr_sec = d.getSeconds().toString();
    if (curr_sec.length < 2)
        curr_sec = "0" + curr_sec;

    return curr_year + "-" + curr_month + "-" + curr_date + " " + curr_hour + ":" + curr_min + ":" + curr_sec;
}

var Song = (function () {
    function Song(data) {
        this.category = "";
        this.id = data.id;
        this.name = data.name;
        this.lyrics = data.lyrics;
        this.melody = data.melody;
        this.author = data.author;
        this.year = data.year;
        this.modified = new Date(data.modified);
    }
    Song.prototype.select = function () {
        var location = getLocation(window.location.href);
        window.history.replaceState({ active: this.id, scroll: window.pageYOffset }, viewModel.currentPageTitle(), location.pathname + location.search);

        viewModel.selectedSong(this);
        window.history.pushState({ song: this.id }, this.name, this.id);

        window.scrollTo(0, 0);

        ga("ec:addProduct", { id: this.id, name: this.name, price: "10.00", quantity: 1 });
        ga("ec:setAction", "detail");
        ga("send", { hitType: "pageview", page: "/" + this.id });
    };
    return Song;
})();

var ViewModel = (function () {
    function ViewModel() {
        var _this = this;
        this.songs = ko.observable(null);
        this.selectedSong = ko.observable(null);
        this.search = ko.observable("");
        this.activeSong = ko.observable(null);
        this.time = ko.observable(Date.now() / 1000 | 0);
        this.resolvingUrl = false;
        this.currentPageTitle = ko.computed(function () {
            var selectedSong = _this.selectedSong();
            return "AKs sångbok" + (selectedSong !== null ? " - " + selectedSong.name : "");
        }, this);
        this.mode = ko.observable("alphabetic");
        this.fontSize = ko.observable("14pt");
        this.menuVisible = ko.observable(false);
        this.filteredSongs = ko.pureComputed(function () {
            var query = _this.search();
            var songs = _this.songs();

            if (songs === null)
                return [];
            if (query === "")
                return _.map(songs, function (s) {
                    return s;
                });

            var results = _this.idx.search(query);
            if (results.length > 0) {
                return _.map(results, function (r) {
                    return songs[r.ref];
                });
            }
            return _.filter(songs, function (s) {
                return s.name.toUpperCase().indexOf(query.toUpperCase()) === 0;
            });
        });
        this.editSong = ko.observable(null);
        this.password = ko.observable(null);
        this.notification = ko.observable(null);
        this.search.subscribe(function () {
            if (!_this.resolvingUrl) {
                _this.selectedSong(null);
                var search = _this.search();
                if (window.history.state !== null && window.history.state.search !== undefined) {
                    window.history.replaceState({ search: search }, search, "/?q=" + search);
                } else {
                    window.history.pushState({ search: search }, search, "/?q=" + search);
                }
                window.scroll(0, 0);
            }
        });

        this.search.limit(function (callback) {
            var timeoutInstance;
            return function () {
                if (timeoutInstance !== undefined) {
                    clearTimeout(timeoutInstance);
                    timeoutInstance = setTimeout(function () {
                        timeoutInstance = undefined;
                        callback();
                    }, 300);
                } else {
                    callback();
                    timeoutInstance = setTimeout(function () {
                        timeoutInstance = undefined;
                    }, 300);
                }
            };
        });

        this.currentPageTitle.subscribe(function (value) {
            document.title = value;
        });

        setInterval(function () {
            _this.time(Date.now() / 1000 | 0);
        }, 1000);
    }
    ViewModel.prototype.loadSongs = function (data) {
        var _this = this;
        this.songs(_.indexBy(_(data).map(function (songData) {
            return new Song(songData);
        }).sortBy(function (song) {
            return song.Name;
        }).value(), "id"));

        this.idx = LunrSwe.create(function (idx) {
            idx.field("name", { boost: 10 });
            idx.field("lyrics");
            idx.ref("id");
        });
        _.forEach(this.songs(), function (song) {
            return _this.idx.add(song);
        });
    };

    ViewModel.prototype.selectMode = function (mode) {
        var _this = this;
        return function () {
            _this.mode(mode);
            _this.menuVisible(false);
            _this.selectedSong(null);
            _this.editSong(null);
        };
    };

    ViewModel.prototype.toggle = function (observable) {
        return function () {
            observable(!observable());
        };
    };

    ViewModel.prototype.modifyFontSize = function (ds) {
        var _this = this;
        return function () {
            var size = parseInt(_this.fontSize().substring(0, _this.fontSize().length - 2));
            _this.fontSize((size + ds) + "pt");
        };
    };

    ViewModel.prototype.edit = function () {
        var _this = this;
        $.get("/api/songs/" + this.selectedSong().id, function (song) {
            var editSong = {
                id: song.id,
                name: ko.observable(song.name),
                lyrics: ko.observable(song.lyrics),
                melody: ko.observable(song.melody),
                author: ko.observable(song.author),
                year: ko.observable(song.year)
            };
            _this.editSong(editSong);
            _this.menuVisible(false);
        });

        ga("ec:addProduct", { id: this.selectedSong().id, name: this.selectedSong().name, price: "10.00", quantity: 1 });
        ga("ec:setAction", "purchase", {
            id: new Date().toString().replace(/\D/g, ""),
            affiliation: "store"
        });
        ga("send", { hitType: "pageview", page: "/" + this.selectedSong().id });
    };

    ViewModel.prototype.addSong = function () {
        this.editSong({ name: ko.observable(""), lyrics: ko.observable("") });
        this.menuVisible(false);
    };

    ViewModel.prototype.cancelEdit = function () {
        this.editSong(null);
    };

    ViewModel.prototype.saveEdit = function () {
        var _this = this;
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

        if (song.id !== undefined) {
            $.ajax("/api/songs/" + song.id, {
                type: "PUT",
                contentType: "application/json",
                data: JSON.stringify(song),
                headers: { Authorization: "SECRET " + this.password() },
                success: function (data) {
                    _this.editSong(null);
                    reloadSongs();
                }
            });
        } else {
            $.ajax("/api/songs", {
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(song),
                headers: { Authorization: "SECRET " + this.password() },
                success: function (data) {
                    _this.editSong(null);
                    reloadSongs();
                }
            });
        }
    };

    ViewModel.prototype.deleteSong = function () {
        var _this = this;
        if (confirm("Säkert att du vill ta bort '" + this.selectedSong().name + "'?")) {
            $.ajax("/api/songs/" + this.selectedSong().id, {
                type: "DELETE",
                contentType: "application/json",
                headers: { Authorization: "SECRET " + this.password() },
                success: function (data) {
                    _this.editSong(null);
                    _this.selectedSong(null);
                    reloadSongs();
                }
            });
        }
    };

    ViewModel.prototype.admin = function () {
        var _this = this;
        var password = prompt("Lösenord?");
        $.ajax("/test", {
            type: "POST",
            data: { password: password },
            success: function (data) {
                _this.password(password);
            }
        });
    };

    ViewModel.prototype.publishSong = function () {
        var _this = this;
        if (confirm("Är du säker på att du vill publicera " + this.selectedSong().name + " nu?")) {
            $.ajax("/api/notifications", {
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({ songId: this.selectedSong().id }),
                headers: { Authorization: "SECRET " + this.password() },
                success: function (data) {
                    _this.menuVisible(false);
                }
            });
        }
    };

    ViewModel.prototype.selectNotificationSong = function () {
        this.songs()[this.notification().song].select();
        this.notification(null);
    };
    return ViewModel;
})();

var viewModel = new ViewModel();
ko.applyBindings(viewModel);

function loadSongs() {
    $.get("/api/songs", function (data) {
        viewModel.loadSongs(data);

        resolveUrl();

        window.onpopstate = function (event) {
            resolveUrl();
            if (window.history.state) {
                viewModel.activeSong(window.history.state.active);
                if (window.history.state.scroll !== undefined) {
                    window.scroll(0, window.history.state.scroll);
                }
            }
        };
    });

    $.get("/api/notifications", function (data) {
        if (data && data.length > 0) {
            var notification = data[0];
            notification.created = viewModel.time() - notification.age;
            viewModel.notification(notification);
        }
    });
}

loadSongs();

document.addEventListener("click", function (event) {
    if (!$(event.target).closest(".navbar").length) {
        viewModel.menuVisible(false);
    }
}, false);

function startsWith(s, searchString) {
    return s.lastIndexOf(searchString, 0) === 0;
}

function getLocation(href) {
    var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
    return match && {
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7]
    };
}

function resolveUrl() {
    viewModel.resolvingUrl = true;

    var location = getLocation(window.location.href);

    var query = location.search.substring(1).split("&").map(function (q) {
        return decodeURIComponent(q);
    });
    var path = location.pathname.substring(1);

    var search = _.find(query, function (q) {
        return startsWith(q, "q=");
    });
    if (search && search.length > 2) {
        viewModel.search(search.substring(2));
        viewModel.selectedSong(null);
    } else if (path.length != null && path in viewModel.songs()) {
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

window.applicationCache.addEventListener("error", function (e) {
    console.log(e);
});

window.applicationCache.addEventListener("updateready", function () {
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

$(function () {
    $.connection.notificationHub.client.notifyCurrentSong = function (notification) {
        notification.created = viewModel.time();
        viewModel.notification(notification);
    };

    $.connection.hub.start();
});
//# sourceMappingURL=script.js.map
