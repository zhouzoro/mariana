var express = require('express');
var router = express.Router();
var _ = require('lodash');
var Promise = require('bluebird');

var fs = require('fs-extra'); //fs-extra to mkdir, rename and remove
Promise.promisifyAll(fs);

var mongoDb = require('mongodb');
Promise.promisifyAll(mongoDb);
var MongoClient = mongoDb.MongoClient;
var ObjectID = require('mongodb').ObjectID;
//mongorestore -h ds061464.mongolab.com:61464 -d zyoldb2 -u zhouzoro -p mydb1acc C:\zhouy\_wrkin\mongoDB-11-24\test
var url = process.env.MONGOLAB_URL;
//['mongodb://mariana:MarianaDB1@ds035485.mongolab.com:35485/zyoldb1', 'mongodb://mariana:MarianaDB2@ds061464.mongolab.com:61464/zyoldb2', 'mongodb://mariana:MarianaDB3@ds056698.mongolab.com:56698/zyoldb3'];
//heroku config:set MONGOLAB_URL=mongodb://mariana:MarianaDB2@ds061464.mongolab.com:61464/zyoldb2
var coll_name = 'mariana'; //mongodb collection name

var formidable = require('formidable'); //formidable to handle form upload
var util = require('util');

var jade = require('jade');
var layoutJade = jade.compileFile('./views/layout.jade');
var homeJade = jade.compileFile('./views/home.jade');
var detailsJade = jade.compileFile('./views/details.jade'); //pre-compile details.jade will be used a lot
var recsJade = {
    news: jade.compileFile('./views/news.jade'),
    mtin: jade.compileFile('./views/mtin.jade'),
    data: jade.compileFile('./views/data.jade'),
    refe: jade.compileFile('./views/refe.jade')
};
var staffJade = jade.compileFile('./views/staff.jade');
var aboutJade = jade.compileFile('./views/about.jade');
var uploadJade = jade.compileFile('./views/upload.jade');

var socketioPort = 30000;
var io = require('socket.io')(socketioPort); //socket.io just to emit upload progress, kinda silly...

io.on('connection', function(socket) {
    winston.info('CONNECTED');
    socket.join('sessionId');
});

var winston = require('winston'); //winston.js to log info and error
winston.add(winston.transports.File, {
    filename: '../lib/mariana-logs.log',
    handleExceptions: true,
    humanReadableUnhandledException: true
});
var logErr = function(err) {
    io.sockets.in('sessionId').emit('log', err);
    Promise.resolve(winston.error(err.toString())).catch(function(errs) {
        winston.error(err)
    });
};

var readLog = fs.readFileAsync('../lib/mariana-logs.log');
/**
 * middleware function to log info
 */
router.use(function(req, res, next) {
    winston.info(GetCurrentDatetime(), ': request from: ', req.ip, ', req.url: ', req.originalUrl);
    var readLog = fs.readFileAsync('../lib/mariana-logs.log');
    var emitLog = function(logRaw) {
        var logs = logRaw.toString().split('\n');
        var newLog = JSON.parse(logs[logs.length - 2]);
        io.sockets.in('sessionId').emit('log', newLog);
    };
    readLog.then(emitLog).catch(logErr);
    next();
});

router.get('/', function(req, res) {
    var html = layoutJade();
    res.send(html);
})

router.get('/env', function(req, res) {
    res.send(process.env.MONGOLAB_URL);
})
router.get('/log', function(req, res) {
    res.render('log');
})
router.get('/logs', function(req, res) {
    res.end('end');
    var readLog = fs.readFileAsync('../lib/mariana-logs.log');
    var emitLog = function(logRaw) {
        var logs = logRaw.toString().split('\n');
        for (var i = 0; i < logs.length; i++) {
            var newLog = JSON.parse(logs[i]);
            io.sockets.in('sessionId').emit('log', newLog);
        }
    };
    readLog.then(emitLog).catch(logErr);
});

//connect to mongodb, and stay connected ever since.
MongoClient.connectAsync(url)
    .then(setRoutes)
    .catch(function(err) {
        logErr(err);
        connectToMongo(urlIndex + 1);
    });

var setRoutes = function(db) {
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
     * @param {[object]} req [includes query containing record type(req.query.rtype), whitch page(req.query.cnum) and how many(req.query.numpp) records to be extracted.]
     * @param {[object]} res [render certain type of view to the client]
     */
    router.get('/records?', function(req, res) {
        var pnum = req.query;
        var recFilter = defaultFilter();
        recFilter.selector.type = pnum.rtype; //record type
        recFilter.skip = parseInt(pnum.cnum) * parseInt(pnum.numpp); //whitch page of record
        recFilter.limit = parseInt(pnum.numpp);
        if (pnum.rtype === 'refe') {
            recFilter.sorter = {
                iteratee: 'serl',
                order: 'desc'
            }
            recFilter.limit = 999;
        }
        //do the query:
        findPostsAsync(recFilter).then(function(docs) {
            posts.countAsync({
                type: pnum.rtype
            }).then(function(count) {
                var tnum = Math.ceil(count / pnum.numpp); //count how many pages
                pnum['tnum'] = tnum;
                var html = recsJade[pnum.rtype]({
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
                            data: doc
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
        posts.findOneAsync({
            type: 'about'
        }).then(function(data) {
            var html = aboutJade({
                data: data
            });
            res.send(html);
        }).catch(function(err) {
            res.send(err);
            logErr(err);
        });
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
            }).then(function() {
                var cdir = ''; //remove the directory consists the related files.
                if (doc.img && doc.img[0]) {
                    cdir = '../' + doc.img[0].src.substring(0, doc.img[0].src.lastIndexOf('/'));
                    fs.remove(cdir);
                } else if (doc.att && doc.att[0]) {
                    cdir = '../' + doc.att[0].substring(0, doc.att[0].lastIndexOf('/'));
                    fs.remove(cdir);
                }
            })
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
        var users = db.collection('mariana_users');
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
        var cdir = '../lib/' + req.cookies.uploadType + '/upload_' + DatetimeDashMin() + '/';
        if (!fs.existsSync(cdir)) {
            fs.mkdirsSync(cdir);
        };
        var form = new formidable.IncomingForm({
            uploadDir: cdir
        });
        var nowner = '';
        var ntitle = '';
        var ntype = '';
        var ndate = '';
        var nsource = '';
        var bkeys = [];
        var nbody = [];
        var fsizes = [];
        var fweights = [];
        var fstyles = [];
        var pars = [];
        var ikeys = [];
        var img = [];
        var imgs = [];
        var imgpath = [];
        var caps = [];
        var atts = [];
        var posi = [];
        var swapath = [];
        form.on('progress', function(bytesReceived, bytesExpected) {
            var pct = (100 * (bytesReceived / bytesExpected)).toString();
            if (pct.substr(pct.lastIndexOf('.') + 1, 1) == 0) {
                var progress = pct.substring(0, pct.lastIndexOf('.')) + "%";
                winston.info(progress);
                io.sockets.in('sessionId').emit('uploadProgress', progress);
            }
        });

        form.on('field', function(name, value) {
            switch (name) {
                case 'owner':
                    {
                        nowner = value.trim();
                        break;
                    }
                case 'title':
                    {
                        if (value !== '输入标题') {
                            ntitle = value.trim();
                        }
                        break;
                    }
                case 'type':
                    {
                        ntype = value.trim();
                        break;
                    }
                case 'date':
                    {
                        ndate = value.trim();
                        break;
                    }
                case 'source':
                    {
                        if (value !== '输入文章/资料来源') {
                            nsource = value.trim();
                        }
                        break;
                    }
                default:
                    {
                        var ftype = name.substr(name.lastIndexOf('-') + 1, 3);
                        var key = name.substring(name.lastIndexOf('-') + 1);
                        var fld = name.substring(0, name.lastIndexOf('-'));
                        if (ftype === 'txa') {
                            if (!bkeys.find(function(k) {
                                    return k === key
                                })) {
                                bkeys.push(key);
                                nbody[key] = {};
                            }
                            nbody[key][fld] = value;
                        } else if (ftype === 'img') {
                            if (!ikeys.find(function(k) {
                                    return k === key
                                })) {
                                ikeys.push(key);
                                img[key] = {};
                            }
                            if (value !== '在此输入图片说明') {
                                img[key][fld] = value;
                            }
                        }
                    }
            };
        });
        form.on('file', function(name, file) {
            var tempPath = file.path;
            var newPath = cdir.substring(3) + file.name;
            swapath.push({
                tp: tempPath,
                np: '../' + newPath
            });
            if (name === 'att') {
                atts.push(newPath);
            } else {
                var key = name.substring(name.lastIndexOf('-') + 1);
                var fld = name.substring(0, name.lastIndexOf('-'));
                if (!ikeys.find(function(k) {
                        return k === key
                    })) {
                    ikeys.push(key);
                    img[key] = {};
                }
                img[key][fld] = newPath;
            }
        });
        form.on('error', function(err) {
            io.sockets.in('sessionId').emit('uploadProgress', 'ERROR!');
            winston.error('ERROR!');
            fs.remove(cdir);
        });

        form.on('aborted', function() {
            io.sockets.in('sessionId').emit('uploadProgress', 'ABORTED!');
            winston.error('ABORTED!');
        });

        form.on('end', function() {
            if (bkeys.length) {
                var pcount = [];
                _.each(bkeys, function(bkey, index) {
                    var tp = nbody[bkey].txt.split("\n");
                    pcount.push(tp.length);
                    _.each(tp, function(val, index) {
                        if (val) {
                            pars.push({
                                txt: val,
                                fsize: nbody[bkey].fsize,
                                fweight: nbody[bkey].fweight,
                                fstyle: nbody[bkey].fstyle
                            });
                        }
                    })
                })
                if (ikeys.length) {
                    _.each(ikeys, function(ikey, index) {
                        var c_pos = img[ikey].pos;
                        img[ikey].pos = 0;
                        for (var j = 0; j < c_pos; j++) {
                            img[ikey].pos += pcount[j];
                        };
                        var imp = img[ikey].src;
                        if (imp.substring(imp.lastIndexOf('/')).trim() !== '/') {
                            imgs.push({
                                src: img[ikey].src,
                                cap: img[ikey].cap,
                                pos: img[ikey].pos
                            })
                        }
                    })
                }
            };
            if (ndate === '') {
                ndate = GetCurrentDatetime()
            };
            var newPost = {
                owner: nowner,
                title: ntitle,
                type: ntype,
                date: ndate,
                source: nsource,
                body: pars,
                img: imgs,
                att: atts
            };
            var posts = db.collection(coll_name);
            posts.insertOneAsync(newPost)
                .then(function() {
                    io.sockets.in('sessionId').emit('uploadProgress', 'COMPLETE!');
                    var html = layoutJade({
                        initUrl: '/details?_id=' + r.insertedId
                    });
                    res.send(html);
                })
                .then(function() {
                    swapath.forEach(function(sp) {
                        fs.rename(sp.tp, sp.np);
                    });
                })
                .catch(logErr);
        });
        form.parse(req);
    });
}

function GetCurrentDate() {
    var cdate = new Date();
    var currentDate = cdate.getFullYear() + "-" +
        (cdate.getMonth() + 1) + "-" +
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
