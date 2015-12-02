$(document).ready(function() {
    setPageNav();
    setFont();
    if (Cookies.get('username')) {
        setUser(Cookies.get('username'));
        setDelete();
    } else {
        screenDownload();
        setLogin();
    }
    window.onscroll = windowOnScroll;
    $('.a_nav').each(setNav);
    $('.detail_entry').click(showDetail);
})
var setFont = function() {
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
var dLinks = [];
var screenDownload = function() {
    $('.downloadlink').each(function() {
        dLinks.push({
            linkid: this.id,
            href: $(this).attr('href'),
            download: $(this).attr('download')
        })
        $(this).removeAttr('href');
        $(this).removeAttr('download');
    })
}
var setLogin = function() {
    $('#upload_entry').css('display', 'none');
    $('#log_out').css('display', 'none');
    $('.login_entry').text('登录').attr('data-toggle', 'modal');
    $('.downloadlink').click(showLogin).removeAttr('href').removeAttr('download');
    $('#login_username').val('Username');
    $('#login_password').val('Password');
    $('input').css('color', 'gray').mousedown(inputClick);
    $('#login_submit').click(loginSubmit);
}
var showLogin = function() {
    $('#ldlog').modal('show');
}
var setUser = function(username) {
    $('.login_entry').text(username).off('click').removeAttr('data-toggle');
    $('#upload_entry').css('display', 'inline-block').text('上传');
    $('#log_out').css('display', 'inline-block').text('退出').click(logOut);
}
var logOut = function() {
    Cookies.remove('username');
    $('.login_entry').switchClass('username', 'login_entry', 0).text('登录').click(showLogin);
    $('#upload_entry').css('display', 'none');
    $(this).css('display', 'none');
}
var setNav = function() {
    var pathname = window.location.pathname;
    var cpath = pathname.substring(pathname.lastIndexOf('/') + 1);
    if (cpath == 'records') {
        var tempath = window.location.search.substr(7, 8);
        cpath = tempath.substring(0, tempath.lastIndexOf('&'))
    }
    if ($(this).data('type') === cpath) {
        $(this).click(function() {
            window.location = '#header';
        })
    } else {
        if ($(this).data('type') == 'staff' || $(this).data('type') == 'about') {
            $(this).click(function() {
                cnav = $(this)
                window.location = '/' + $(this).data('type');
            })
        } else {
            $(this).click(function() {
                window.location = '/records?rtype=' + $(this).data('type') + '&cnum=0&numpp=12';
            })
        }
    }
}
var setDelete = function() {
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
                    alert('Something went wrong!')
                }
            })
        })
    }
}
var inputClick = function() {
    $('input').css('color', 'gray');
    $(this).css('color', 'black');
    $(this).val('');
    var input_type = this.id.substring(this.id.lastIndexOf('_') + 1);
    if (this.id.substr(this.id.length - 8) == 'password') {
        $(this).attr('type', input_type);
    }
    $(this).off('mousedown');
}
var loginSubmit = function() {
    var userinfo = {
        'username': $('#login_username').val(),
        'password': $('#login_password').val(),
    }
    $.post('/authentication', userinfo, function(res) {
        if (res.result == true) {
            closeDlg();
            Cookies.set('username', userinfo.username, {
                expires: 7
            })
            setUser(userinfo.username);
            setDownload();
        } else {
            alert('Authentication Filed!');
        }
    })
}
var setDownload = function() {
    $('.downloadlink').unbind('click', showLogin);
    for (var i = 0; i < dLinks.length; i++) {
        $('#' + dLinks[i].linkid).attr({
            'href': '../../' + dLinks[i].href,
            'download': dLinks[i].download
        });
    };
}
var setNews = function() {
    newsUrl = '/news?rtype=news&cnum=' + $(this).data('packnum') + '&numpp=12';
    window.location = newsUrl;
}
var showDetail = function() {
    var detailsUrl = '/details?_id=' + $(this).data('id');
    window.location = detailsUrl;
}
var closeDlg = function() {
    $('#ldlog').modal('hide')
}
var setPageNav = function() {
    var loadPrevious = $('.load_previous');
    var loadNext = $('.load_next');

    if ($('.pagenum') && $('.pagenum').data('pagenum') === $('.pagenum').data('pagenum')) {
        loadNext.off('click')
            .css('cursor', 'text');
    } else {
        loadNext.click(function() {
            newUrl = '/records?rtype=' + $(this).data('type') + '&cnum=' + $(this).data('cnum') + '&numpp=' + $(this).data('numpp');
            window.location = newUrl;
        })
    }
    if ($('.pagenum') && $('.pagenum').data('pagenum') == 1) {
        loadPrevious.off('click')
            .css('cursor', 'text');
    } else {
        loadPrevious.click(function() {
            newUrl = '/records?rtype=' + $(this).data('type') + '&cnum=' + $(this).data('cnum') + '&numpp=' + $(this).data('numpp');
            window.location = newUrl;
        })
    }
}
var windowOnScroll = function() {
    if (checkVisible($('header'))) {
        $('.div_pagetitle').css({
            'position': 'relative',
            'top': '4px',
            'height': '60px'
        });
        $('#navs').css({
            'position': 'relative',
            'bottom': '-15px'
        });
    } else {
        $('.div_pagetitle').css({
            'position': 'fixed',
            'top': '0px',
            'height': '46px',
            'left': '0px'
        });
        $('#page_title').css({
            'top': '-2px'
        });
        $('#navs').css({
            'position': 'relative',
            'bottom': '0px'
        });
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
