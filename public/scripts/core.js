$(document).ready(function() {
    loadContent($('#main_body').data('init-url'));
    if (Cookies.get('username')) {
        setUser(Cookies.get('username'));
    } else {
        setLogin();
    }
    $(document).scroll(controlNavPosition);
    $('#scroll-top').click(ScrollTop);
})


var downloads = function() {
    var dLinks = [];
    return {
        screenDownload: function() {
            $('.downloadlink').each(function() {
                dLinks.push({
                    linkid: this.id,
                    href: $(this).attr('href'),
                    download: $(this).attr('download')
                })
                $(this).removeAttr('href');
                $(this).removeAttr('download');
                $(this).click(showLogin);
            })
        },
        allowDownload: function() {
            $('.downloadlink').unbind('click', showLogin);
            for (var i = 0; i < dLinks.length; i++) {
                $('#' + dLinks[i].linkid).attr({
                    'href': '../../' + dLinks[i].href,
                    'download': dLinks[i].download
                });
            };
        }
    }
}();

function loadContent(url) {
    $('#body-loader').show();
    ScrollTop();
    history.pushState(null, null, url);
    var main = $('#main_body');
    $('footer').hide();
    $.post(url, {
        xreq: true
    }, function(html) {
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
        setTimeout(function() {
            $('footer').show().slideDown();
        }, 600);
    });
}

function setFont() { //*****abandoned
    $('p').each(function() {
        if ($(this).data('fweight') === 'bold' || $(this).data('fweight') === 'normal') {
            $(this).css({
                'font-size': $(this).data('fsize'),
                'font-weight': $(this).data('fweight'),
                'font-style': $(this).data('fstyle')
            })
        }
    })
}

function setColor() {
    if ($('.active img').attr('src')) {
        var img = $('.active img')[0];
        var vibrant = new Vibrant(img);
        $('#slr-container').css({
            'background-color': vibrant.MutedSwatch.rgb,
            'color': vibrant.VibrantSwatch.rgb
        });
    }
}

function setPanelColor() { //*****abandoned
    $('.item .image img').load(function() {
        var img = $(this)[0];
        var vibrant = new Vibrant(img);
        var item = $(this).parent('.item');
        var muted = vibrant.VibrantSwatch.rgb;
        var rgbaColor = 'rgba(' + muted[0] + ',' + muted[1] + ',' + muted[2] + ', 0.4)';
        item.css({
            'background-color': rgbaColor,
            'box-shadow': 'inset 0px 0px 400px 400px rgba(199,199,199,0.4)'
        });
    })
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
                loadContent('/records?rtype=' + $(this).data('type') + '&cnum=0&numpp=12');
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
        if (res.result == true) {
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
            newUrl = '/records?rtype=' + $(this).data('type') + '&cnum=' + $(this).data('num') + '&numpp=' + $(this).data('numpp');
            loadContent(newUrl);
        }).removeClass('disabled');
    }
    if ($('.pagenum') && $('.pagenum').data('pagenum') == 1) {
        loadPrevious.off('click')
            .addClass('disabled');
    } else {
        loadPrevious.click(function() {
            newUrl = '/records?rtype=' + $(this).data('type') + '&cnum=' + $(this).data('num') + '&numpp=' + $(this).data('numpp');
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
