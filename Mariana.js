var express = require('express');
var app = express();
var port = process.env.PORT || 80;

//get all route method moudlue:
var routes = require('./routes/routes');

var bodyParser = require('body-parser'); //body-parser doesn't handle multipart bodies, so can be used alongside formidable.
var cookieParser = require('cookie-parser');

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var url = 'mongodb://mariana:Mariana_mongoDB@210.77.91.195:27017/test';

var path = require('path');
//set views and view engine;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

//serve static files:
app.use('/scripts', express.static('scripts'));
app.use('/styles', express.static('styles'));
app.use('/lib', express.static('../lib'));

//connect to mongodb, and stay connected ever since.
MongoClient.connect(url, function(err, db) {
    if (err) {
        winston.info(GetCurrentDatetime(), err);
    }

    app.get('/', routes.showHome(db));

    app.get('/details?', routes.showDetails(db));

    app.get('/upload', routes.showUpload(db));
    /**
     * routes for getting datas to display
     */
    app.get('/records?', routes.setRecords(db));

    //app.get('/count?', getCount);

    app.get('/staff', routes.getStaffs(db));

    app.get('/about', routes.showAbout(db));

    app.post('/authentication', routes.validateUser(db))

    app.post('/add_new_post', routes.addNewPost(db))

    app.post('/delete', routes.deleteOne(db))

    app.listen(port);

});
