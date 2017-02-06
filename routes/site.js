var dbPool = require('../mysql.js').dbPool;
var ads = require('../ad.js').ads;

function getAd(acceptLanguages) {
    var languageAds = Object.keys(ads);
    console.log('Choosing an ad for', acceptLanguages);
    for (var i = 0; i < languageAds.length; i += 1) {
        var r = new RegExp('\\b' + languageAds[i] + '\\b');
        if (r.test(acceptLanguages)) {
            var randomIndex = Math.floor(Math.random() * ads[languageAds[i]].length);
            var ad = ads[languageAds[i]][randomIndex];
            console.log('Chose ad for', languageAds[i], randomIndex, ads[languageAds[i]], ad);
            return ad;
        }
    }
    return '';
}

exports.index = function (req, res) {
    res.render('index', { title: 'Lookup', currentPath: req.path, ad: getAd(req.get('Accept-Language')) });
}

exports.lookup = function (req, res) {
    res.render('lookup', { title: req.params.user, currentPath: '/', ad: getAd(req.get('Accept-Language')) });
}

exports.docs = function (req, res) {
    res.render('docs', { title: 'API Docs', currentPath: req.path, ad: getAd(req.get('Accept-Language')) });
}

exports.stats = function (req, res, stats) {
    res.render('stats', { title: 'Stats', currentPath: req.path, stats: stats, ad: getAd(req.get('Accept-Language')) });
}

exports.top = function (req, res, toplists) {
    res.render('top', { title: 'Top 500s', currentPath: req.path, toplists: toplists, ad: getAd(req.get('Accept-Language')) });
}
