var db = require("../mysql.js").dbPool;

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

function queryAsync(query, vars) {
	return new Promise((resolve, _) => {
		db.query(query, vars, function(err, rows) {
			if (err) {
				throw err;
			}
			resolve(rows);
		});
	});
}

exports.stats = function(req, res, stats) {
	res.status(200).json({ status: 200, stats: stats });
};

exports.top = function(req, res, toplists) {
	res.status(200).json({ status: 200, top: toplists });
};

exports.user = function(req, res) {
	var user = req.params.user.toLowerCase();
	let offset = tryParseInt(req.query.offset || 0, 0);
	let limit = tryParseInt(req.query.limit || 100, 100);
	console.log("Lookup for " + req.params.user + " using offset " + offset + " and limit " + limit);
	if (offset < 0) {
		res.status(400).json({ status: 400, error: "offset must be positive or 0" });
	} else if (limit < 1 || limit > 500) {
		res.status(400).json({ status: 400, error: "limit must be between 1 and 500" });
	} else {
		db.query(
			"SELECT channels.*, mods.* FROM channels LEFT JOIN mods ON channels.channel = mods.channel WHERE mods.username = ? LIMIT ? OFFSET ?",
			[user, limit, offset],
			function(err, rows) {
				if (err) {
					console.error("Lookup query", err);
					retErr(res);
				} else if (!rows) {
					retErr(res);
				} else {
					db.query(
						"SELECT COUNT(1) AS count FROM channels LEFT JOIN mods ON channels.channel = mods.channel WHERE mods.username = ?",
						[user],
						function(err, row) {
							if (err) {
								console.error("Lookup count query", err);
								retErr(res);
							} else if (!rows) {
								retErr(res);
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
};

exports.userv2 = function(req, res) {
	var user = req.params.user.toLowerCase();
	let cursor = req.query.cursor || "";
	if (cursor.length > 0) {
		cursor = decodeB64(cursor);
	}
	let limit = tryParseInt(req.query.limit || 100, 100);
	console.log("Lookup v2 for " + req.params.user + " using cursor " + cursor + " and limit " + limit);
	if (limit < 1 || limit > 1000) {
		res.status(400).json({ status: 400, error: "limit must be between 1 and 1000" });
	} else {
		db.query(
			"SELECT channels.*, mods.* FROM channels LEFT JOIN mods ON channels.channel = mods.channel WHERE mods.username = ? AND mods.channel > ? LIMIT ?",
			[user, cursor, limit],
			function(err, rows) {
				if (err) {
					console.error("Lookup v2 query", err);
					retErr(res);
				} else if (!rows) {
					retErr(res);
				} else {
					db.query(
						"SELECT COUNT(1) AS count FROM channels LEFT JOIN mods ON channels.channel = mods.channel WHERE mods.username = ?",
						[user],
						function(err, row) {
							if (err) {
								console.error("Lookup v2 count query", err);
								retErr(res);
							} else if (!rows) {
								retErr(res);
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
};

exports.userv3 = async function(req, res) {
	var user = req.params.user.toLowerCase();
	let cursor = req.query.cursor || "";
	if (cursor.length > 0) {
		cursor = decodeB64(cursor);
	}
	let limit = tryParseInt(req.query.limit || 100, 100);
	console.log("Lookup v3 for " + req.params.user + " using cursor " + cursor + " and limit " + limit);
	if (limit < 1 || limit > 50000) {
		res.status(400).json({ status: 400, error: "limit must be between 1 and 50000" });
	} else {
		try {
			let rows = await queryAsync(
				"SELECT channels.*, mods.* FROM channels LEFT JOIN mods ON channels.channel = mods.channel WHERE mods.username = ? AND mods.channel > ? LIMIT ?",
				[user, cursor, limit + 1]
			);
			let ret = [];
			let retCursor = "";
			for (let i = 0; i < rows.length; i += 1) {
				ret.push({
					name: rows[i].channel,
					followers: rows[i].followers,
					views: rows[i].views,
					partnered: !!rows[i].partnered
				});
			}
			if (ret.length > limit) {
				ret = ret.slice(0, limit);
				retCursor = ret[ret.length - 1].name;
			}
			res.status(200).json({
				status: 200,
				user: user,
				channels: ret,
				cursor: encodeB64(retCursor)
			});
		} catch (e) {
			console.error("userv3", e);
			retErr(res);
		}
	}
};

exports.usertotals = async function(req, res) {
	var user = req.params.user.toLowerCase();
	try {
		let totals = await queryAsync(
			"SELECT views, followers, swords AS total, partners FROM users WHERE username = ?",
			[user]
		);
		res.status(200).json({
			status: 200,
			user: user,
			views: totals[0].views,
			follows: totals[0].followers,
			total: totals[0].total,
			partners: totals[0].partners
		});
	} catch (e) {
		console.error("usertotals", e);
		retErr(res);
	}
};
