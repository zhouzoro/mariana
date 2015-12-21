var express = require('express');
var app = express();

var favicon = require('serve-favicon');
var logger = require('morgan');

//get all route method moudlue:
var routes = require('./routes/routes');

//body-parser doesn't handle multipart bodies, so it can be used alongside formidable.
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');


var path = require('path');
//set views and view engine;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(favicon(__dirname + '/styles/ico/favicon.ico'));
//serve static files:
app.use('/scripts', express.static('scripts'));
app.use('/styles', express.static('styles'));
app.use('/lib', express.static('../lib'));
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
