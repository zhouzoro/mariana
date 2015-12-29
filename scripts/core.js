$(document).ready(function() {
    loadContent($('#main_body').data('init-url'));
    //loadContent('/ajax');
    if (Cookies.get('username')) {
        setUser(Cookies.get('username'));
    } else {
        setLogin();
    }
    //window.onscroll = windowOnScroll;
})
var loadContent = function(url) {
    var main = $('#main_body');
    main.find('*').remove();
    if (url !== '/home') history.pushState(null, null, url);
    //$('#loader').modal('show');
    showLoader();
    //var newId = url.replace(/\//g, '_').replace(/=/g, '--').replace(/&/g, '_').replace('?', '-').replace(/"/g, '');
    $.get(url, function(html) {
        var newContent = $('<div>').attr('class', 'main_body')
        main.html(newContent.html(html));
        $('.carousel').carousel();
        $('.a_nav').each(setNav);
        setPageNav();
        setPanelColor()
        setFont();
        if (Cookies.get('username')) {
            setDelete();
        } else {
            screenDownload();
        }
        $('.active img').on('load', setColor);
        $('#slr').on('slid.bs.carousel', setColor);

        hideLoader();
        //window.location = '#' + newId;
        //$('#loader').modal('hide');
    })
}
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

var setColor = function() {
    var index = $('.item.active').data('index');
    var img = $('.active img')[0];
    var vibrant = new Vibrant(img);
    $('#slr-container').css({
        'background-color': vibrant.MutedSwatch.rgb,
        'color': vibrant.VibrantSwatch.rgb
    });
    //$('#carousel').css('box-shadow', '0px 0px 10px 1px ' + rgbaColor);

}
var setPanelColor = function() {
    $('.panel-body img').load(function() {
        var img = $(this)[0];
        var vibrant = new Vibrant(img);
        var panelBody = $(this).parent('.panel-body');
        var panelHead = panelBody.prev('.panel-heading');
        var panelTtile = panelHead.find('.panel-title');
        var muted = vibrant.VibrantSwatch.rgb;
        var rgbaColor = 'rgba(' + muted[0] + ',' + muted[1] + ',' + muted[2] + ', 0.4)';
        panelBody.css({
            'background-color': rgbaColor,
            'box-shadow': 'inset 0px 0px 400px 400px rgba(199,199,199,0.4)'
        });
        panelHead.css({
            'background-color': vibrant.VibrantSwatch.rgb,
            'box-shadow': 'inset 0px 0px 400px 400px rgba(199,199,199,0.2)'
        });
    })
}
var loader = $('<div>').attr('id', 'loader').append($('<span>').attr('class', 'loader .row').append($('<span>').attr('class', 'loader-inner')))
var showLoader = function() {
    $('#main_body').append(loader);
}
var hideLoader = function() {
    $('#main_body').find('#loader').hide('slide');
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
        $(this).click(showLogin);
    })
}
var setLogin = function() {
    $('#upload_entry').css('display', 'none');
    $('#log_out').css('display', 'none');
    $('#login_entry').attr('data-toggle', 'modal');
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
    $('#login_entry').off('click').attr('title', 'log out').switchClass('glyphicon-log-in', 'glyphicon-log-out');
    $('#upload_entry').css('display', 'inline-block').click(function() {
        loadContent('/upload')
    });
    $('#log_out').css('display', 'inline-block').click(function() {
        logOut()
    });
}
var logOut = function() {
    Cookies.remove('username');
    setLogin();
}
var setNav = function() {
    $(this).off('click');
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
                loadContent('/' + $(this).data('type'));
            })
        } else {
            $(this).click(function() {
                loadContent('/records?rtype=' + $(this).data('type') + '&cnum=0&numpp=12');
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
                    alert('Something went wrong!');
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
    loadContent(newsUrl);
}
var showDetail = function(id) {
    var detailsUrl = '/details?_id=' + id;
    loadContent(detailsUrl);
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
            loadContent(newUrl);
        })
    }
    if ($('.pagenum') && $('.pagenum').data('pagenum') == 1) {
        loadPrevious.off('click')
            .css('cursor', 'text');
    } else {
        loadPrevious.click(function() {
            newUrl = '/records?rtype=' + $(this).data('type') + '&cnum=' + $(this).data('cnum') + '&numpp=' + $(this).data('numpp');
            loadContent(newUrl);
        })
    }
}
var windowOnScroll = function() {
    if (checkVisible($('header'))) {
        $('.navbar').removeClass('navbar-fixed-top');
    } else {
        $('.navbar').addClass('navbar-fixed-top');
    }
}

var checkVisible = function(elm, evalType) {
    evalType = evalType || 'visible';

    var vpH = $(window).height(), // Viewport Height
        st = $(window).scrollTop(), // Scroll Top
        y = $(elm).offset().top,
        elementHeight = $(elm).height();

    if (evalType === 'visible') return ((y < (vpH + st)) && (y > (st - elementHeight)));
    if (evalType === 'above') return ((y < (vpH + st)));
}
