var express = require("express");
var app = express();
var site = require("./routes/site.js");
var api = require("./routes/api.js");
var db = require("./mysql.js").dbPool;
var HotShots = require("hot-shots");
var onHeaders = require("on-headers");

var statsd = null;
if (process.env.STATSD_HOST) {
	statsd = new HotShots({
		port: process.env.STATSD_PORT || 8125,
		host: process.env.STATSD_HOST,
		prefix: "modlookup.",
		protocol: process.env.STATSD_PROTOCOL || "udp",
		errorHandler: function(err) {
			console.error("statsd", err);
		}
	});
}

var toplists = {
	modcount: [],
	views: [],
	followers: []
};

var stats = {};

app.set("trust proxy", "loopback");

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use(express.static("public"));

if (statsd) {
	app.use(function(req, res, next) {
		var start = Date.now();
		onHeaders(res, function() {
			var time = Date.now() - start;
			console.log("response " + res.statusCode + " sent in " + time + " ms for " + req.path);
			if (res.statusCode !== 404) {
				let statspath;
				switch (req.path) {
					case "":
					case "/":
						statspath = "index";
						break;
					default:
						parts = req.path.substring(1).split("/");
						switch (parts[0]) {
							case "u":
								statspath = "u.total";
								break;
							case "api":
								statspath = "api." + parts[1] + ".total";
								break;
							default:
								statspath = parts[0] + ".total";
						}
						break;
				}
				statsd.increment("counter.response." + statspath);
				statsd.timing("timing.response." + statspath, time);
			}
		});
		next();
	});
}

app.get("/", site.index);
app.get("/docs", site.docs);
app.get("/stats", (req, res) => site.stats(req, res, stats));
app.get("/top", site.top);
app.get("/u/:user", site.lookup);

app.get("/api/user/:user", api.user);
app.get("/api/user-totals/:user", api.usertotals);
app.get("/api/user-v2/:user", api.userv2);
app.get("/api/user-v3/:user", api.userv3);
app.get("/api/stats", (req, res) => api.stats(req, res, stats));
app.get("/api/top", (req, res) => api.top(req, res, toplists));

console.log("Using views from " + __dirname + "/views");

app.listen(process.env.PORT, function() {
	console.log("Listening on ", process.env.PORT);
});

function queryTopList(db, list) {
	db.query(
		"SELECT username AS name, swords AS modcount, partners, views, followers FROM users ORDER BY " +
			list +
			" DESC LIMIT 500",
		function(err, rows) {
			if (err) {
				console.error("Top " + list, err);
			} else if (rows) {
				toplists[list] = rows;
				console.log("Got top for ", list, rows[0]);
			}
		}
	);
}

function updateTopLists() {
	console.log("Updating top 500s and stats");
	queryTopList(db, "modcount");
	queryTopList(db, "partners");
	queryTopList(db, "views");
	queryTopList(db, "followers");
	db.query(
		"SELECT (SELECT COUNT(1) FROM mods) AS relations, (SELECT COUNT(1) FROM channels) AS channels_total, (SELECT COUNT(1) FROM users) AS users, (SELECT COUNT(1) FROM channels WHERE channel NOT IN (SELECT DISTINCT channel FROM mods)) AS channels_no_mods",
		function(err, rows) {
			if (err) {
				console.error("Stats", err);
			} else if (rows) {
				stats = rows[0];
				console.log("Got stats", rows[0]);
			}
		}
	);
}
setInterval(updateTopLists, 3600000);
updateTopLists();
