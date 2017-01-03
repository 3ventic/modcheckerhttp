var dbPool = require('../mysql.js').dbPool;

exports.index = function (req, res) {
    res.render('index', { title: 'Home', currentPath: req.path });
}

exports.lookup = function (req, res) {
    res.render('lookup', { title: req.params.user, currentPath: '/' });
}

exports.docs = function (req, res) {
    res.render('docs', { title: 'API Docs', currentPath: req.path });
}

exports.stats = function (req, res, stats) {
    res.render('stats', { title: 'Stats', currentPath: req.path, stats: stats });
}

exports.top = function (req, res, toplists) {
    res.render('top', { title: 'Top 500s', currentPath: req.path, toplists: toplists });
}
