var express = require('express');
var router = express.Router();

var fs = require('fs-extra'); //fs-extra to mkdir, rename and remove

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var url = 'mongodb://mariana:Mariana_mongoDB@210.77.91.195:27017/test';
var coll_name = 'mariana'; //mongodb collection name

var formidable = require('formidable'); //formidable to handle form upload
var util = require('util');

var jade = require('jade');
var home = jade.compileFile('./views/home.jade');
var details = jade.compileFile('./views/details.jade'); //pre-compile details.jade will be used a lot

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

/**
 * all exported function takes a db(a mongodb object) as parameter
 */

//connect to mongodb, and stay connected ever since.
MongoClient.connect(url, function(err, db) {
    if (err) {
        winston.info(GetCurrentDatetime(), err);
    }
    /**function to gather info from db and then render the home page;
     * takes No param, ends with res.render.
     */
    router.get('/', function(req, res) {
        winston.info(GetCurrentDatetime(), ': request from: ', req.ip, ', req.url: ', req.originalUrl);
        var posts = db.collection(coll_name);
        posts.find({
            type: 'news' //get news data
        }).limit(6).sort([
            ['date', -1]
        ]).toArray(function(err, news) {
            if (err) {
                winston.error(GetCurrentDatetime(), err);
            }
            posts.find({
                type: 'mtin' //get meeting data
            }).limit(6).sort([
                ['date', -1]
            ]).toArray(function(err, mtin) {
                if (err) {
                    winston.error(GetCurrentDatetime(), err);

                    return;
                }
                posts.find({
                    type: 'data' //get resources data
                }).limit(6).sort([
                    ['date', -1]
                ]).toArray(function(err, data) {
                    if (err) {
                        winston.error(GetCurrentDatetime(), err);

                        return;
                    }
                    var html = home({ //render with datas
                        news: news,
                        mtin: mtin,
                        data: data
                    });
                    res.send(html) //.replace(/</g,"bk"))

                })
            })
        })
    })

    /**
     * [function to get certain type of record from mongodb]
     * @param {[object]} req [includes query containing record type(req.query.rtype), whitch page(req.query.cnum) and how many(req.query.numpp) records to be extracted.]
     * @param {[object]} res [render certain type of view to the client]
     */
    router.get('/records?', function(req, res) {
        winston.info(GetCurrentDatetime(), ': request from: ', req.ip, ', req.url: ', req.originalUrl);
        var type = req.query.rtype; //record type
        var cnum = parseInt(req.query.cnum); //whitch page of record
        var numpp = parseInt(req.query.numpp); //how many record per page.
        var posts = db.collection(coll_name);
        var sorter = 'date'; //the field to sort the query result, default as date
        var sor = -1; //the sort order, default as date descend.

        //if record is reference(dissertation), order by sequence.
        if (type === 'refe') {
            sorter = 'serl';
            sor = 1;
            numpp = 999;
        }
        //do the query:
        posts.find({
            type: type
        }).skip(cnum * numpp).limit(numpp).sort([
            [sorter, sor]
        ]).toArray(function(err, data) {
            if (err) {
                winston.error(GetCurrentDatetime(), err);

                return;
            }
            posts.count({
                type: type
            }, function(err, count) {
                var tnum = Math.ceil(count / numpp); //count how many pages
                var pnum = { //pass all page number infomation to the page, prepare for future query.
                    type: type,
                    cnum: cnum,
                    tnum: tnum,
                    numpp: numpp
                };
                res.render(type, {
                    data: data,
                    pnum: pnum
                });

            })
        })
    })

    /**
     * [show a detailed view of a record]
     * @param  {[type]} req [record ID(req.query._id), can be converted to ObjectID in mongodb]
     * @param  {[type]} res [if a record of certain id is found, render the details, else redirect home]
     */
    router.get('/details?', function(req, res) {
        winston.info(GetCurrentDatetime(), ': request from: ', req.ip, ', req.url: ', req.originalUrl);
        var posts = db.collection(coll_name);
        try { //try convert ObjectID, avoid crash
            var id = require('mongodb').ObjectID(req.query._id.substr(1, 24));
        } catch (err) {
            winston.error(GetCurrentDatetime(), err);
            return;
        }
        posts.findOne({ //find with ObjectId
            _id: id
        }, function(err, data) {
            if (data) { //found? render : redirect home
                res.render('details', {
                    data: data
                })
            } else {
                res.redirect('/')
            }
        })
    })

    /**
     * [simply get the data from mongodb and render the view of the about page]
     */
    router.get('/about', function(req, res) {
        winston.info(GetCurrentDatetime(), ': request from: ', req.ip, ', req.url: ', req.originalUrl);
        var posts = db.collection(coll_name);
        posts.findOne({
            type: 'about'
        }, function(err, data) {
            if (data) {
                res.render('about', {
                    data: data
                })
            } else {
                res.redirect('/')
            }

        })
    })

    /**
     * [function to delete a certain record
     * And delete the directory consists the related files.]
     * @param  {[type]} req [contains parameters including username and record ID]
     * @param  {[type]} res [send back a json object with the delete result(true or false)]
     */
    router.post('/delete', function(req, res) {
        winston.info(GetCurrentDatetime(), ': request from: ', req.ip, ', req.url: ', req.originalUrl);
        var coll = db.collection(coll_name);
        var id = require('mongodb').ObjectID(req.body._id.substr(1, 24));
        var user = req.body.username;

        coll.findOne({
            _id: id,
            owner: user
        }, function(err, doc) { //found ? delete record and file : return
            if (err) {
                winston.error(GetCurrentDatetime(), err);
                return;
            }

            coll.deleteOne({ //delete from mongodb
                _id: id,
                owner: user
            }, function(err, result) {
                if (err) {
                    res.json({
                        result: false
                    });
                    winston.error(GetCurrentDatetime(), err);
                    return;
                }
                winston.info('deleted:' + result);
                res.json({
                    result: true
                });
            })
            var cdir = ''; //remove the directory consists the related files.
            if (doc.img && doc.img[0]) {
                cdir = '../' + doc.img[0].src.substring(0, doc.img[0].src.lastIndexOf('/'));
                fs.remove(cdir);
            } else if (doc.att && doc.att[0]) {
                cdir = '../' + doc.att[0].substring(0, doc.att[0].lastIndexOf('/'));
                fs.remove(cdir);
            }
        })
    })

    /**
     * [simply get the staff data from mongodb and render the view of the staff page]
     */
    router.get('/staff', function(req, res) {
        winston.info(GetCurrentDatetime(), ': request from: ', req.ip, ', req.url: ', req.originalUrl);
        var staff = db.collection('staff');
        staff.find().sort([
            ['inst', -1]
        ]).toArray(function(err, data) {
            res.render('staff', {
                data: data
            });

        })
    })

    router.post('/authentication', function(req, res) {
        winston.info(GetCurrentDatetime(), ': request from: ', req.ip, ', req.url: ', req.originalUrl);
        ValidateUser(req.body.username, req.body.password, function(result) {
            res.json({
                result: result
            });
        });
    })
    var ValidateUser = function(paramUsername, paramPassword, callback) {
        var users = db.collection('mariana_users');
        users.count({
            username: paramUsername,
            password: paramPassword
        }, function(err, count) {
            if (err) {
                winston.error(GetCurrentDatetime(), err);
                return;
            }
            if (count == 1) {
                return callback(true);
            } else {
                return callback(false);
            }

        })
    }

    router.get('/upload', function(req, res) {
        winston.info(GetCurrentDatetime(), ': request from: ', req.ip, ', req.url: ', req.originalUrl);
        if (req.cookies.username) {
            res.render('upload');
        } else {
            res.send('Illegal Access!');
        }
    })

    router.post('/add_new_post', function(req, res) {
        winston.info(GetCurrentDatetime(), ': request from: ', req.ip, ', req.url: ', req.originalUrl);
        var cdir = '../lib/' + req.cookies.uploadType + '/upload_' + DatetimeDashMin() + '/';
        if (!fs.existsSync(cdir)) {
            fs.mkdirsSync(cdir);
        }
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
                for (var i = 0; i < bkeys.length; i++) {
                    var tp = nbody[bkeys[i]].txt.split("\n");
                    pcount.push(tp.length);
                    for (var j = 0; j < tp.length; j++) {
                        if (tp[j]) {
                            pars.push({
                                txt: tp[j],
                                fsize: nbody[bkeys[i]].fsize,
                                fweight: nbody[bkeys[i]].fweight,
                                fstyle: nbody[bkeys[i]].fstyle
                            });
                        }
                    };
                }
                if (ikeys.length) {
                    for (var i = 0; i < ikeys.length; i++) {
                        var c_pos = img[ikeys[i]].pos;
                        img[ikeys[i]].pos = 0;
                        for (var j = 0; j < c_pos; j++) {
                            img[ikeys[i]].pos += pcount[j];
                        };
                    }
                }
            }
            if (ikeys.length) {
                for (var i = 0; i < ikeys.length; i++) {
                    var imp = img[ikeys[i]].src;
                    if (imp.substring(imp.lastIndexOf('/')).trim() !== '/') {
                        imgs.push({
                            src: img[ikeys[i]].src,
                            cap: img[ikeys[i]].cap,
                            pos: img[ikeys[i]].pos
                        })
                    }
                }
            }
            if (ndate === '') {
                ndate = GetCurrentDatetime()
            }
            var newPost = {
                owner: nowner,
                title: ntitle,
                type: ntype,
                date: ndate,
                source: nsource,
                body: pars,
                img: imgs,
                att: atts
            }
            var posts = db.collection(coll_name);
            posts.insertOne(newPost, function(err, r) {
                if (err) {
                    winston.error(GetCurrentDatetime(), err);

                    return;
                }
                newPost['_id'] = r.insertedId;

                io.sockets.in('sessionId').emit('uploadProgress', 'COMPLETE!');
                var html = details({
                    data: newPost
                });
                res.send(html);
                swapath.forEach(function(sp) {
                    fs.rename(sp.tp, sp.np);
                });
            });
        });
        form.parse(req);
    })

});

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
