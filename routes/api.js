var db = require("../mysql.js").dbPool;

function retErr(res) {
	res.status(500).json({ status: 500, error: "Internal Server Error" });
}

function retBadUser(res, login) {
	res.status(400).json({ status: 400, error: "Invalid user '" + login + "'" });
}

function tryParseInt(str, def) {
	var num = parseInt(str, 10);
	return isNaN(num) ? def : num;
}

function isValidLogin(login) {
	return /^[0-9a-z_]+$/.test(login);
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
	res.status(410).json({ status: 410, message: "This API has been removed. Please migrate to the new endpoints." });
};

exports.userv3 = async function(req, res) {
	var user = req.params.user.toLowerCase();
	if (!isValidLogin(user)) {
		retBadUser(res, user);
		return;
	}
	let cursor = req.query.cursor || "";
	if (cursor.length > 0) {
		cursor = decodeB64(cursor);
		if (!isValidLogin(cursor)) {
			res.status(400).json({ status: 400, error: "Invalid cursor" });
			return;
		}
	}
	let limit = tryParseInt(req.query.limit || 100, 100);
	console.log("Lookup v3 for " + req.params.user + " using cursor " + cursor + " and limit " + limit);
	if (!/^\d+$/.test(limit.toString()) || limit < 1 || limit > 10000) {
		res.status(400).json({ status: 400, error: "limit must be between 1 and 10000" });
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
	if (!isValidLogin) {
		retBadUser(res, user);
		return;
	}
	try {
		let totals = await queryAsync(
			"SELECT views, followers, swords AS total, partners FROM users WHERE username = ?",
			[user]
		);
		if (totals.length === 0) {
			res.status(200).json({
				status: 200,
				user: user,
				views: 0,
				follows: 0,
				total: 0,
				partners: 0
			});
		} else {
			res.status(200).json({
				status: 200,
				user: user,
				views: totals[0].views,
				follows: totals[0].followers,
				total: totals[0].total,
				partners: totals[0].partners
			});
		}
	} catch (e) {
		console.error("usertotals", e);
		retErr(res);
	}
};
