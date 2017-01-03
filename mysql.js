var mysql = require('mysql');

exports.dbPool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASS,
    database: 'mods',
    supportBigNumbers: true,
    connectionLimit: 20
});
