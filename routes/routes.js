var express = require('express');
var router = express.Router();
var _ = require('lodash');
var Promise = require('bluebird');
var md = require('markdown-it')();
var fs = require('fs-extra');
Promise.promisifyAll(fs);

var mongoDb = require('mongodb');
Promise.promisifyAll(mongoDb);
var MongoClient = mongoDb.MongoClient;
var ObjectID = mongoDb.ObjectID;
//mongorestore -h ds061464.mongolab.com:61464 -d zyoldb2 -u zhouzoro -p mydb1acc C:\zhouy\_wrkin\mongoDB-11-24\test
//mongorestore -d test -u zhouzoro -p mydb1acc C:\zhouy\_wrkin\mongoDB-11-24\test
var dbport = process.env.MONGO_PORT || 65123
    //var url = process.env.MONGOLAB_URL || 'mongodb://mariana:MarianaDB2@ds061464.mongolab.com:61464/zyoldb2';
var url = process.env.MONGO_URl || 'mongodb://127.0.0.1:' + dbport + '/mariana';
var coll_name = 'mariana'; //mongodb collection name

var formidable = require('formidable'); //formidable to handle form upload
var util = require('util');

var jade = require('jade');
var viewPathOf = function(vname) {
    return __dirname + '/../views/' + vname + '.jade'
}
var layoutJade = jade.compileFile(viewPathOf('layout')); //pre-compile jade into functions will be used a lot
var homeJade = jade.compileFile(viewPathOf('home'));
var detailsJade = jade.compileFile(viewPathOf('details'));
var recsJade = {
    news: jade.compileFile(viewPathOf('news')),
    mtin: jade.compileFile(viewPathOf('mtin')),
    data: jade.compileFile(viewPathOf('data')),
    refe: jade.compileFile(viewPathOf('refe'))
};
var staffJade = jade.compileFile(viewPathOf('staff'));
var aboutJade = jade.compileFile(viewPathOf('about'));
var uploadJade = jade.compileFile(viewPathOf('upload'));

var winston = require('winston'); //winston.js to log info and error
winston.add(winston.transports.File, {
    filename: __dirname + '/../public/logs.log',
    handleExceptions: true,
    humanReadableUnhandledException: true
});
var logErr = function(err) {
    Promise.resolve(winston.error(err.toString())).catch(function(errs) {
        winston.error(err)
    });
};


/**
 * middleware function to log info
 */

router.use(function(req, res, next) {
    winston.info(GetCurrentDatetime(), ': request from: ', req.ip, ', req.url: ', req.originalUrl);
    next();
});
/**
 * middleware function to check if it's a ajax req
 */
router.use(function(req, res, next) {
    if (!req.headers['x-requested-with'] && req.method == 'GET') {
        var reqUrl = req.originalUrl;
        var html = layoutJade({
            initUrl: reqUrl === '/' ? null : reqUrl
        });
        res.send(html);
    } else {
        next();
    }
});

router.get('/', function(req, res) {
    var html = layoutJade();
    res.send(html);
})

function saveFile(req, res, ftype) {
    var uDir = __dirname + '/../public/' + ftype;
    var form = new formidable.IncomingForm({
        uploadDir: uDir
    });
    form.on('progress', function(bytesReceived, bytesExpected) {
        var pct = (100 * (bytesReceived / bytesExpected)).toString();
        if (pct.substr(pct.lastIndexOf('.') + 1, 2) == '00') {
            var progress = pct.substring(0, pct.lastIndexOf('.')) + "%";
            console.log(progress);
        }
    });
    form.on('file', function(name, file) {
        var tempPath = file.path;
        var newPath = uDir + '/' + Date.now() + file.name;
        fs.rename(tempPath, newPath);
        res.json({
            location: newPath.substring(8)
        });
    });
    form.on('error', function(err) {
        console.log(err);
    });

    form.on('aborted', function() {
        console.log('ABORTED!');
    });
    form.parse(req);
}
router.post('/images', function(req, res, next) {
    saveFile(req, res, 'images');
});
router.post('/files', function(req, res, next) {
    saveFile(req, res, 'files');
});

//connect to mongodb.
MongoClient.connectAsync(url).then(function(db) {
        console.log('mongoDB connected!');
        var posts = db.collection(coll_name);
        var findPostsAsync = function(qFilter) {
            return new Promise(function(fulfill, reject) {
                if (qFilter.limit === 1) {
                    posts.findOneAsync(qFilter.selector).then(function(doc) {
                        fulfill(doc)
                    }).catch(function(err) {
                        reject(err)
                    });
                } else if (qFilter.limit > 1) {
                    posts.findAsync(qFilter.selector).then(function(cursor) {
                        return cursor.toArrayAsync()
                    }).then(function(docs) {
                        docs = _.slice(_.sortByOrder(docs, qFilter.sorter.iteratee, qFilter.sorter.order), qFilter.skip, qFilter.skip + qFilter.limit);
                        fulfill(docs);
                        //console.log(docs);
                    }).catch(function(err) {
                        reject(err)
                    });
                } else(reject({
                    message: 'int limit out of bound!'
                }))
            })
        }
        var defaultSorter = function() {
            return {
                iteratee: 'date',
                order: 'desc'
            }
        }
        var defaultFilter = function() {
                return {
                    selector: {
                        type: 'news'
                    },
                    skip: 0,
                    limit: 6,
                    sorter: defaultSorter()
                }
            }
            /**function to gather info from db and then render the home page;
             * takes No param, ends with res.render.
             */
        router.get('/home', function(req, res) {
            var qResults = {};
            var sendHtml = function(val) {
                var html = homeJade({ //render with datas
                    news: val[0],
                    mtin: val[1],
                    data: val[2]
                });
                res.send(html);
            }
            var mtinFilter = defaultFilter();
            mtinFilter.selector.type = 'mtin';
            var dataFilter = defaultFilter();
            dataFilter.selector.type = 'data';
            var getDatas = [findPostsAsync(defaultFilter())];
            getDatas.push(findPostsAsync(mtinFilter));
            getDatas.push(findPostsAsync(dataFilter));
            Promise.all(getDatas).then(sendHtml).catch(function(err) {
                res.send(err);
                logErr(err);
            });
        });

        /**
         * [function to get certain type of record from mongodb]
         * @param {[object]} req [includes query containing record type(req.query.t), whitch page(req.query.cnum) and how many(req.query.numpp) records to be extracted.]
         * @param {[object]} res [render certain type of view to the client]
         */
        router.get('/records?', function(req, res) {
            var pnum = req.query;
            var recFilter = defaultFilter();
            recFilter.selector.type = pnum.t; //record type
            pnum.numpp = pnum.numpp ? pnum.numpp : 12;
            recFilter.skip = parseInt(pnum.p) * parseInt(pnum.numpp); //whitch page of record
            recFilter.limit = parseInt(pnum.numpp);
            if (pnum.t === 'refe') {
                recFilter.sorter = {
                    iteratee: 'serl',
                    order: 'asc'
                }
                recFilter.limit = 999;
            }
            //do the query:
            findPostsAsync(recFilter).then(function(docs) {
                posts.countAsync({
                    type: pnum.t
                }).then(function(count) {
                    var tnum = Math.ceil(count / pnum.numpp); //count how many pages
                    pnum['tnum'] = tnum;
                    var html = recsJade[pnum.t]({
                        data: docs,
                        pnum: pnum
                    });
                    res.send(html);
                })
            }).catch(function(err) {
                res.send(err);
                logErr(err);
            });
        });

        /**
         * [show a detailed view of a record]
         * @param  {[type]} req [record ID(req.query._id), can be converted to ObjectID in mongodb]
         * @param  {[type]} res [if a record of certain id is found, render the details, else redirect home]
         */
        router.get('/details?', function(req, res) {
            var getId = function() {
                try {
                    return require('mongodb').ObjectID(req.query._id)
                } catch (err) {
                    return require('mongodb').ObjectID(req.query._id.substr(1, 24))
                }
            }
            Promise.resolve(getId())
                .then(function(id) {
                    var deFilter = defaultFilter();
                    deFilter.selector = {
                        _id: id
                    };
                    deFilter.limit = 1;
                    return deFilter;
                })
                .then(function(qFilter) {
                    findPostsAsync(qFilter)
                        .then(function(doc) {
                            var html = detailsJade({
                                doc: doc
                            });
                            res.send(html);
                        })
                }).catch(function(err) {
                    res.send(err);
                    logErr(err);
                });
        });

        /**
         * [simply get the data from mongodb and render the view of the about page]
         */
        router.get('/about', function(req, res) {
            fs.readFile(__dirname + '/../public/about.md', 'utf8', (err, data) => {
                if (err) console.log(err);
                html = md.render(data);
                res.send(html);
            })
        });
        /**
         * [function to delete a certain record
         * And delete the directory consists the related files.]
         * @param  {[type]} req [contains parameters including username and record ID]
         * @param  {[type]} res [send back a json object with the delete result(true or false)]
         */
        router.post('/delete', function(req, res) {
            var id = require('mongodb').ObjectID(req.body._id.substr(1, 24));
            var user = req.body.username;

            posts.findOneAsync({
                _id: id,
                owner: user
            }).then(function(doc) { //found ? delete record and file : return
                posts.deleteOneAsync({ //delete from mongodb
                        _id: id,
                        owner: user
                    }).then(function(result) {
                        winston.info('deleted:' + result);
                        res.json({
                            result: true
                        });
                    })
                    /*.then(function() {
                        var cdir = ''; //remove the directory consists the related files.
                        if (doc.img && doc.img[0]) {
                            cdir = './public' + doc.img[0].src.substring(0, doc.img[0].src.lastIndexOf('/'));
                            fs.remove(cdir);
                        } else if (doc.att && doc.att[0]) {
                            cdir = '../' + doc.att[0].substring(0, doc.att[0].lastIndexOf('/'));
                            fs.remove(cdir);
                        }
                    })*/
            }).catch(function(err) {
                res.json({
                    result: false
                });
                logErr(err);
            })
        });

        /**
         * [simply get the staff data from mongodb and render the view of the staff page]
         */
        router.get('/staff', function(req, res) {
            var staff = db.collection('staff');
            staff.findAsync().then(function(cursor) {
                return cursor.toArrayAsync()
            }).then(function(docs) {
                docs = _.sortByOrder(docs, 'inst', 'desc');
                var html = staffJade({
                    data: docs
                });
                res.send(html);
            }).catch(function(err) {
                res.send(err);
                logErr(err);
            })
        });

        router.post('/authentication', function(req, res) {
            var users = db.collection('users');
            users.countAsync({
                username: req.body.username,
                password: req.body.password
            }).then(function(count) {
                res.json({
                    result: count == 1
                });
            }).catch(function(err) {
                res.send(err);
                logErr(err);
            })
        });

        router.get('/upload', function(req, res) {
            if (req.cookies.username) {
                var html = uploadJade();
                res.send(html);
            } else {
                res.send('Illegal Access!');
            }
        });

        router.post('/add_new_post', function(req, res) {
            console.log(req.body);
            posts.insertOneAsync(req.body)
                .then(function(r) {
                    res.send({
                        url: '/details?_id=' + r.insertedId
                    });
                })
                .catch(logErr);
        });
    })
    .catch(function(err) {
        logErr(err);
    });

function GetCurrentDate() {
    var cdate = new Date();
    var month = cdate.getMonth() < 9 ? ('0' + (cdate.getMonth() + 1)) : (cdate.getMonth() + 1)
    var currentDate = cdate.getFullYear() + "-" +
        month + "-" +
        cdate.getDate();
    return currentDate;
}

function GetCurrentTime() {
    var cdate = new Date();
    var currentTime = cdate.toString().substr(16, 8);
    return currentTime;
}

function GetCurrentDatetime() {
    var currentDatetime = GetCurrentDate() + "_at_" + GetCurrentTime();
    return currentDatetime;
}

function DatetimeDash() {
    return GetCurrentDatetime().replace(/:/g, "-")
}

function DatetimeDashMin() {
    return DatetimeDash().substring(0, DatetimeDash().length - 3)
}
module.exports = router;
