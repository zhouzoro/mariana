"use strict";
$(document).ready(function() {
    loadContent($('#main_body').data('init-url'));
    if (Cookies.get('username')) {
        setUser(Cookies.get('username'));
    } else {
        setLogin();
    }
    $(document).scroll(controlNavPosition);
    $('#scroll-top').click(ScrollTop);
});
var downloads = function() {
    var dLinks = [];
    return {
        screenDownload: function() {
            $('.downloadlink').each(function() {
                dLinks.push({
                    linkid: this.id,
                    href: $(this).attr('href'),
                    download: $(this).attr('download')
                });
                $(this).removeAttr('href');
                $(this).removeAttr('download');
                $(this).click(showLogin);
            });
        },
        allowDownload: function() {
            $('.downloadlink').unbind('click', showLogin);
            for (var i = 0; i < dLinks.length; i++) {
                $('#' + dLinks[i].linkid).attr({
                    'href': '../../' + dLinks[i].href,
                    'download': dLinks[i].download
                });
            }
        }
    };
}();
function loadContent(url) {
    $('#body-loader').show();
    ScrollTop();
    history.pushState(null, null, url);
    var main = $('#main_body');
    $.get(url, function(html) {
        var newContent = $('<div>').attr('class', 'main_body');
        $('#body-loader').attr('class', 'in-progress');
        main.html(newContent.html(html));
        if ($('.carousel')[0]) $('.carousel').carousel();
        $('.a_nav').each(setNav);
        setPageNav();
        if (Cookies.get('username')) {
            setDelete();
        } else {
            downloads.screenDownload();
        }
        if (url == '/upload') {
            myUpload.init('news');
        }
        $('#body-loader').attr('class', 'complete');
        $('#body-loader').slideUp();
    });
}

function setLogin() {
    $('#upload_entry').css('display', 'none');
    $('#log_out').css('display', 'none');
    $('#login_entry').css('display', 'inline-block').click(function() {
        $('#ldlog').modal('show');
    });
    downloads.screenDownload();
    $('#login_submit').click(loginSubmit);
}

function showLogin() {
    $('#ldlog').modal('show');
}
function setUser(username) {
    $('#login_entry').css('display', 'none');
    $('#upload_entry').css('display', 'inline-block').click(function() {
        loadContent('/upload')
    });
    $('#log_out').css('display', 'inline-block').click(function() {
        logOut()
    });
}

function logOut() {
    Cookies.remove('username');
    setLogin();
}

function setNav() {
    $(this).off('click');
    $(this).click(function() {
        if ($('.collapse').hasClass('in')) $('.collapse').collapse('hide');
    })
    var pathname = window.location.pathname;
    var cpath = pathname.substring(pathname.lastIndexOf('/') + 1);
    if (cpath == 'records') {
        var tempath = window.location.search.substr(7, 8);
        cpath = tempath.substring(0, tempath.lastIndexOf('&'))
    }
    if ($(this).data('type') === cpath) {
        $(this).click(function() {
            ScrollTop();
        })
    } else {
        if ($(this).data('type') == 'home' || $(this).data('type') == 'staff' || $(this).data('type') == 'about') {
            $(this).click(function() {
                loadContent('/' + $(this).data('type'));
            })
        } else {
            $(this).click(function() {
                loadContent('/records?t=' + $(this).data('type') + '&p=0');
            })
        }
    }
}

function setDelete() {
    if ($('#modify') && $('#modify').data('owner') === Cookies.get('username')) {
        $('#modify').css('display', 'inline-block');
        $('#delete').click(function() {
            var param = {
                username: Cookies.get('username'),
                _id: $('#article_detail').data('id')
            }
            $.post('/delete', param, function(res) {
                if (res.result) {
                    window.location = '/';
                } else {
                    alert('Something went wrong!');
                }
            })
        })
    }
}

function loginSubmit() {
    var userinfo = {
        'username': $('#login_username').val(),
        'password': $('#login_password').val(),
    }
    console.log(userinfo);
    $.post('/authentication', userinfo, function(res) {
        if (res.result === true) {
            closeDlg();
            Cookies.set('username', userinfo.username, {
                expires: 7
            })
            setUser(userinfo.username);
            downloads.allowDownload();
        } else {
            alert('Authentication Filed!');
        }
    })
}

function showDetail(id) {
    var detailsUrl = '/details?_id=' + id;
    loadContent(detailsUrl);
}

function closeDlg() {
    $('#ldlog').modal('hide')
}

function setPageNav() {
    var loadPrevious = $('.load_previous');
    var loadNext = $('.load_next');

    if ($('.pagenum') && $('.pagenum').data('pagenum') >= $('.tpagenum').data('pagenum')) {
        loadNext.off('click')
            .addClass('disabled');
    } else {
        loadNext.click(function() {
            newUrl = '/records?t=' + $(this).data('type') + '&p=' + $(this).data('num');
            loadContent(newUrl);
        }).removeClass('disabled');
    }
    if ($('.pagenum') && $('.pagenum').data('pagenum') == 1) {
        loadPrevious.off('click')
            .addClass('disabled');
    } else {
        loadPrevious.click(function() {
            newUrl = '/records?t=' + $(this).data('type') + '&p=' + $(this).data('num');
            loadContent(newUrl);
        }).removeClass('disabled');
    }
}

function ScrollTop() {
    var body = $("html, body");
    body.stop().animate({
        scrollTop: 0
    }, '500');
}

function controlNavPosition(evt) {
    if (checkVisible($('#logo-img'))) {
        $('#scroll-top').hide();
        $('#nav-content').css({
            'position': 'relative',
            'padding-top': '0px',
            'background-color': 'transparent'
        });
    } else {
        $('#nav-content').css({
            'position': 'fixed',
            'padding-top': '10px',
            'background-color': '#222'
        });
        $('#scroll-top').show();
    }
}



function checkVisible(elm, evalType) {
    evalType = evalType || 'visible';

    var vpH = $(window).height(), // Viewport Height
        st = $(window).scrollTop(), // Scroll Top
        y = $(elm).offset().top,
        elementHeight = $(elm).height();

    if (evalType === 'visible') return ((y < (vpH + st)) && (y > (st - elementHeight)));
    if (evalType === 'above') return ((y < (vpH + st)));
}

function GetCurrentDate() {
    var cdate = new Date();
    var month = cdate.getMonth() < 9 ? ('0' + (cdate.getMonth() + 1)) : (cdate.getMonth() + 1)
    var currentDate = cdate.getFullYear() + "-" +
        month + "-" +
        cdate.getDate();
    return currentDate;
}

$(document).ready(function() {
    $('.log').each(function() {
        if ($(this).data('level') == 'error') {
            console.log(1);
            $(this).find('label').addClass('log-level-error')
        } else if ($(this).data('level') === 'info') {
            $(this).find('label').addClass('log-level-info')
        }
    })

    //var socket = io.connect('http://210.77.91.195:30000/');
    var socket = io.connect('http://127.0.0.1:30000/');
    socket.on('log', function(log) {
        if (typeof(log) === 'object') {
            var newLog = $('<div>').attr('class', 'log');
            var logLevel = $('<label>').attr('class', 'log-text log-level').text(log.level);
            var logDate = $('<label>').attr('class', 'log-text log-timr').text('_at_' + log.date);
            var logMsg = $('<label>').attr('class', 'log-text').text(log.message);
            var logDetail = $('<p>').attr('class', 'log-text').text(JSON.stringify(log));
            if (log.level === 'error') {
                logLevel.addClass('log-level-error');
                logDate.addClass('log-level-error');
                logMsg.addClass('log-level-error');
            } else if (log.level === 'info') {
                logLevel.addClass('log-level-info');
                logDate.addClass('log-level-info');
                logMsg.addClass('log-level-info');
            }
            newLog.append(logLevel).append(logDate).append(logMsg).append(logDetail);
        } else if (typeof(log) == 'string') {
            var newLog = $('<div>').attr('class', 'log').text(log);
        }
        newLog.insertBefore('div:first');
    })
    $.get('/logs', function(res) {
        console.log(res);
    })
})
var myUpload = function() {
    var mce = {};
    var vue;

    function uploadRD(darray) {
        $('#loader').modal('show');
        var loader = $('#loader').find('.loader');
        var updatep = function(n) {
            loader.text('uploading ' + n + 'of ' + darray.length);
        }
        _.forEach(darray, function(val, index) {
            index++;
            updatep(index);
            data = {
                date: GetCurrentDate(),
                type: $('#upload-type').val(),
                title: val.title,
                name: val.name,
                source: val.source,
                path: val.path
            }
            console.log(data);

            $.post('/add_new_post', data, function(res) {
                $('#loader').modal('hide');
                console.log(res);
                //loadContent(res.url);
            });
        })
        loadContent('/home');
    }
    function computProgress(oEvent) {
        var percentComplete = Math.ceil(1000 * oEvent.loaded / oEvent.total) / 10 + '%';
        return percentComplete;
    }

    function Att() {
        this.title = '';
        this.name = '';
        this.source = '';
        this.path = '';
        this.progress = '0%';
        this.updateProgress = function(oEvent)  {
            this.progress = computProgress(oEvent);
        };
        var fileUploadReq = new XMLHttpRequest();
        fileUploadReq.withCredentials = false;
        fileUploadReq.open('POST', '/files');

        fileUploadReq.onload = function() {
            var json = JSON.parse(fileUploadReq.responseText);
            this.path = json.location;
        };
        fileUploadReq.upload.addEventListener("progress", this.updateProgress, false);
        this.uploadFile = function(ele)  {
            this.name = ele.files[0].name;
            var form = $(ele).parent('.frmfile')[0];
            var formData = new FormData(form);
            fileUploadReq.send(formData);
        };
        this.abort = function() {
            fileUploadReq.abort();
        }
    }

    function initManeger() {
        var e = {
            atts: {}
        };
        var attCount = 0;
        e.states = []; //Array of upload process states, '1' means complete
        e.addAtt = function() {
            e.states.push(0);
            attCount++;
            var attname = 'att' + attCount;
            var newAtt = new Att();
            e.atts[attname] = newAtt;
            var newForm = $('<form>').attr({
                'class': 'frmfile',
                'enctype': 'multipart/form-data',
                'method': 'post',
                'hidden': 1
            });
            var fileInput = $('<input>').attr({
                'id': 'iptfile' + attCount,
                'type': 'file',
                'name': 'file' + attCount,
                'hidden': 1
            }).change(function() {
                newAtt.uploadFile(this);
            })
            $('body').append(newForm.append(fileInput));
            fileInput.click();
            return newAtt
        };
        e.wrapUp = function() {
            var html = '';
            _.forEach(vue.atts, function(att, index) {
                index++;
                html += '<p>附件.' + index + '： <a href="' + att.path + '" download="' + att.name + '">' + att.name + '</a>' + '</p>';
            })
            return html;
        }
        return e;
    };
    mce.init = function(type) {
        console.log(type);
        if (type == 'refe') {
            $('.news-only').hide();
            $('.data-only').hide();
            $('.refe-only').show();
            $('#btn-add').show();
            vue = new Vue({
                el: '#app-r',
                data: {
                    refes: []
                },
                methods: {
                    remove: function(refe) {
                        refe.abort();
                        this.refes.$remove(refe);
                    }
                }
            })
            var refeManager = initManeger();
            $('#btn-add').off('click');
            $('#btn-add').click(function() {
                vue.refes.push(refeManager.addAtt());
            });
            $('#btn-upload').off('click');
            $('#btn-upload').click(function() {
                uploadRD(vue.refes)
            })
        } else if (type == 'data') {
            $('.news-only').hide();
            $('.refe-only').hide();
            $('.data-only').show();
            $('#btn-add').show();
            vue = new Vue({
                el: '#app-d',
                data: {
                    datas: []
                },
                methods: {
                    remove: function(data) {
                        data.abort();
                        this.datas.$remove(data);
                    }
                }
            })
            var dataManager = initManeger();
            $('#btn-add').off('click');
            $('#btn-add').click(function() {
                vue.datas.push(dataManager.addAtt());
            });
            $('#btn-upload').off('click');
            $('#btn-upload').click(function() {
                uploadRD(vue.datas)
            })
        } else {
            $('.news-only').show();
            $('.refe-only').show();
            $('.data-only').hide();
            $('.refe-only').hide();
            $('#btn-add').hide();
            $('#upload-type').change(function() {
                mce.init($(this).val())
            })
            var attManager = initManeger();
            tinymce.EditorManager.remove('#input-body');
            $('#btn-add').hide();
            tinymce.init({
                selector: '#input-body', // change this value according to your HTML
                //inline:true,
                plugins: "advlist link anchor paste image autoresize preview imagetools",
                toolbar: 'undo redo formatselect advlist fontsizeselect bold italic underline strikethrough alignleft aligncenter alignright link image preview',
                image_caption: true,
                paste_data_images: true,
                fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 18pt 24pt 36pt',
                menubar: false,
                images_upload_url: '/images',
                content_css: '/app.min.css',
                min_width: 420,
                max_width: 960
            });
            vue = new Vue({
                el: '#app',
                data: {
                    atts: []
                },
                methods: {
                    remove: function(att) {
                        att.abort();
                        this.atts.$remove(att);
                    }
                }
            })
            $('#input-img').off('change');
            $('#input-img').change(function() {
                if (this.files && this.files[0]) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        tinymce.activeEditor.execCommand('insertHTML', false, '<img src="' + e.target.result + '" width="80%" >');

                        tinymce.activeEditor.uploadImages();
                    }
                    reader.readAsDataURL(this.files[0]);
                }
            });
            $('#input-date').val(GetCurrentDate());
            $('#btn-att').off('click');
            $('#btn-att').click(function() {
                vue.atts.push(attManager.addAtt());
            });

            $('#btn-upload').off('click');
            $('#btn-img').click(function() {
                $('#input-img').click();
            });
            $('#btn-upload').off('click');
            $('#btn-upload').click(function() {
                $('#loader').modal('show');
                var loader = $('#loader').find('.loader');
                loader.text('uploading Images');
                tinymce.activeEditor.uploadImages(function(success) {
                    loader.text('wrapping together');
                    tinymce.activeEditor.save();
                    var attHtml = attManager.wrapUp(vue.atts);
                    var data = {
                        type: $('#upload-type').val(),
                        title: $('#input-title').val(),
                        date: $('#input-date').val(),
                        owner: Cookies.get('username'),
                        source: $('#input-source').val(),
                        cover: $($('#input-body').val()).find('img').attr('src'),
                        body: $('#input-body').val() + attHtml,
                        att: attHtml
                    };
                    loader.text('pendding');
                    $.post('/add_new_post', data, function(res) {
                        $('#loader').modal('hide');
                        loadContent(res.url);
                    });
                });
            })
        }
    };
    return mce
}()
