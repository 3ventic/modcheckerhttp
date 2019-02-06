var dbPool = require("../mysql.js").dbPool;

function retErr(res) {
	res.status(500).json({ status: 500, error: "Internal Server Error" });
}

function tryParseInt(str, def) {
	var num = parseInt(str, 10);
	return isNaN(num) ? def : num;
}

function encodeB64(str) {
	return Buffer.from(str, "utf8")
		.toString("base64")
		.replace(/[+=/]/g, function(c) {
			switch (c) {
				case "+":
					return "-";
				case "/":
					return "_";
				case "=":
					return ".";
				default:
					return c;
			}
		});
}

function decodeB64(str) {
	return Buffer.from(
		str.replace(/[_./]/g, function(c) {
			switch (c) {
				case "-":
					return "+";
				case "_":
					return "/";
				case ".":
					return "=";
				default:
					return c;
			}
		}),
		"base64"
	).toString("utf8");
}

exports.stats = function(req, res, stats) {
	res.status(200).json({ status: 200, stats: stats });
};

exports.top = function(req, res, toplists) {
	res.status(200).json({ status: 200, top: toplists });
};

exports.user = function(req, res) {
	var user = req.params.user.toLowerCase();
	dbPool.getConnection(function(err, db) {
		if (err) {
			console.error("Lookup db con", err);
			retErr(res);
		} else {
			let offset = tryParseInt(req.query.offset || 0, 0);
			let limit = tryParseInt(req.query.limit || 100, 100);
			console.log("Lookup for " + req.params.user + " using offset " + offset + " and limit " + limit);
			if (offset < 0) {
				res.status(400).json({ status: 400, error: "offset must be positive or 0" });
				db.release();
			} else if (limit < 1 || limit > 500) {
				res.status(400).json({ status: 400, error: "limit must be between 1 and 500" });
				db.release();
			} else {
				db.query(
					"SELECT channels.*, mods.* FROM channels LEFT JOIN mods ON channels.channel = mods.channel WHERE mods.username = ? LIMIT ? OFFSET ?",
					[user, limit, offset],
					function(err, rows) {
						if (err) {
							console.error("Lookup query", err);
							retErr(res);
							db.release();
						} else if (!rows) {
							retErr(res);
							db.release();
						} else {
							db.query(
								"SELECT COUNT(1) AS count FROM channels LEFT JOIN mods ON channels.channel = mods.channel WHERE mods.username = ?",
								[user],
								function(err, row) {
									if (err) {
										console.error("Lookup query", err);
										retErr(res);
										db.release();
									} else if (!rows) {
										retErr(res);
										db.release();
									} else {
										let ret = [];
										for (let i = 0; i < rows.length; i += 1) {
											ret.push({
												name: rows[i].channel,
												followers: rows[i].followers,
												views: rows[i].views,
												partnered: !!rows[i].partnered
											});
										}
										res.status(200).json({
											status: 200,
											user: user,
											count: row[0].count,
											channels: ret
										});
									}
								}
							);
						}
					}
				);
			}
		}
	});
};

exports.userv2 = function(req, res) {
	var user = req.params.user.toLowerCase();
	dbPool.getConnection(function(err, db) {
		if (err) {
			console.error("Lookup db con", err);
			retErr(res);
		} else {
			let cursor = req.query.cursor || "";
			if (cursor.length > 0) {
				cursor = decodeB64(cursor);
			}
			let limit = tryParseInt(req.query.limit || 100, 100);
			console.log("Lookup v2 for " + req.params.user + " using cursor " + cursor + " and limit " + limit);
			if (limit < 1 || limit > 1000) {
				res.status(400).json({ status: 400, error: "limit must be between 1 and 500" });
			} else {
				db.query(
					"SELECT channels.*, mods.* FROM channels LEFT JOIN mods ON channels.channel = mods.channel WHERE mods.username = ? AND mods.channel > ? LIMIT ?",
					[user, cursor, limit],
					function(err, rows) {
						if (err) {
							console.error("Lookup query", err);
							retErr(res);
							db.release();
						} else if (!rows) {
							retErr(res);
							db.release();
						} else {
							db.query(
								"SELECT COUNT(1) AS count FROM channels LEFT JOIN mods ON channels.channel = mods.channel WHERE mods.username = ?",
								[user],
								function(err, row) {
									if (err) {
										console.error("Lookup query", err);
										retErr(res);
										db.release();
									} else if (!rows) {
										retErr(res);
										db.release();
									} else {
										let ret = [];
										let retCursor = "";
										for (let i = 0; i < rows.length; i += 1) {
											ret.push({
												name: rows[i].channel,
												followers: rows[i].followers,
												views: rows[i].views,
												partnered: !!rows[i].partnered
											});
											retCursor = rows[i].channel;
										}
										res.status(200).json({
											status: 200,
											user: user,
											count: row[0].count,
											channels: ret,
											cursor: encodeB64(retCursor)
										});
									}
								}
							);
						}
					}
				);
			}
		}
	});
};
