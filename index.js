var express = require('express');
var app = express();
var site = require('./routes/site.js');
var api = require('./routes/api.js');

app.set('trust proxy', 'loopback');

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.use(express.static('public'));

app.get('/', site.index);

app.get('/u/:user', site.lookup);

app.get('/api/user/:user', api.user);

console.log("Using views from " + __dirname + '/views');

app.listen(process.env.PORT, function () {
    console.log("Listening on ", process.env.PORT);
});
