var dbPool = require('../mysql.js').dbPool;

function retErr(res) {
    res.status(500).json({ status: 500, error: "Internal Server Error" });
}

function tryParseInt(str, def) {
    var num = parseInt(str, 10);
    return isNaN(num) ? def : num;
}

exports.user = function (req, res) {
    dbPool.getConnection(function (err, db) {
        if (err) {
            console.error("Lookup db con", err);
            retErr(res);
        } else {
            let offset = tryParseInt(req.query.offset || 0, 0);
            let limit = tryParseInt(req.query.limit || 100, 100);
            console.log("Lookup for " + req.params.user + " using offset " + offset + " and limit " + limit);
            if (offset < 0) {
                res.status(400).json({ status: 400, error: "offset must be positive or 0" });
            } else if (limit < 1 || limit > 500) {
                res.status(400).json({ status: 400, error: "limit must be between 1 and 500" });
            } else {
                db.query('SELECT channels.*, mods.* FROM channels LEFT JOIN mods ON channels.channel = mods.channel WHERE mods.username = ? LIMIT ? OFFSET ?', [req.params.user, limit, offset], function (err, rows) {
                    if (err) {
                        console.error("Lookup query", err);
                        retErr(res);
                        db.release();
                    } else if (!rows) {
                        retErr(res);
                        db.release();
                    } else {
                        db.query('SELECT COUNT(1) AS count FROM channels LEFT JOIN mods ON channels.channel = mods.channel WHERE mods.username = ?', [req.params.user], function (err, row) {
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
                                res.status(200).json({ status: 200, user: req.params.user, count: row[0].count, channels: ret }); 
                            }
                        });
                    }
                });
            }
        }
    });
}
