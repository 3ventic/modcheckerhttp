exports.index = function (req, res) {
    res.render('index', { title: 'Home', currentPath: req.path });
}

exports.lookup = function (req, res) {
    res.render('lookup', { title: res.params.user, currentPath: '/' });
}
