setFont = ->
	$('p').each ->
		if $(this).data 'fweight' is 'bold' or $(this).data 'fweight' is 'normal'
			$(this).css
				'font-size': $(this).data('fsize')
				'font-weight': $(this).data('fweight')
				'font-style': $(this).data('fstyle')
		return
	return

dLinks = []

screenDownload = ->
	$('.downloadlink').each ->
		dLinks.push
            linkid: this.id
            href: $(this).attr('href')
            download: $(this).attr('download')
		return
	return

setLogin = ->
	$('#upload_entry').css 'display', 'none'

	$('#log_out').css 'display', 'none'

	$('.login_entry')
	.text '登录'
    .attr 'data-toggle', 'modal'

    $('.downloadlink')
	.click showLogin
	.removeAttr 'href'
	.removeAttr 'download'

	$('#login_username').val 'Username'

	$('#login_password').val 'Password'

	$('input')
	.css 'color', 'gray'
    .mousedown inputClick

    $('#login_submit').click loginSubmit
    return

showLogin = ->
	$('#ldlog').modal 'show'
	return

setUser =  (username) ->
	$('.login_entry')
	.text username
	.off 'click'
	.removeAttr 'data-toggle'

	$('#upload_entry')
	.css 'display', 'inline-block'
    .text '上传'

    $('#log_out')
    .css 'display','inline-block'
    .text '退出'
    .click logOut

	return

logOut = ->
	$(this).css 'display', 'none'
	$('.login_entry')
	.switchClass 'username', 'login_entry', 0
	.text '登录'
	.click showLogin
	$('#upload_entry').css 'display', 'none'
	Cookies.remove 'username'
	return

setNav = ->
    pathname = window.location.pathname
    cpath = pathname.substring pathname.lastIndexOf('/') + 1
    if  cpath is 'records'
        tempath = window.location.search.substr(7, 8)
        cpath = tempath.substring 0, tempath.lastIndexOf('&')

    if $(this).data('type') is cpath
        $(this).click ->
        	window.location = '#header'
	        return
    else
        if $(this).data('type') is 'staff' or $(this).data('type') is 'about'
            $(this).click ->
                cnav = $(this)
                window.location = '/' + $(this).data('type')
                return
        else
            $(this).click ->
                window.location = '/records?rtype=' + $(this).data('type') + '&cnum=0&numpp=12'
                return
    return

setDelete = ->
    if $('#modify') && $('#modify').data('owner') is Cookies.get('username')
        $('#modify').css 'display', 'inline-block'
        $('#delete').click ->
            param =
                username: Cookies.get('username')
                _id: $('#article_detail').data('id')

            $.post '/delete', param, (res) ->
                if res.result
                    window.location = '/'
                else
                    alert('Something went wrong!')
                return
            return
    return

inputClick = ->
    $('input').css 'color', 'gray'
    $(this).css 'color', 'black'
    $(this).val ''
    input_type = this.id.substring this.id.lastIndexOf('_') + 1
    if this.id.substr(this.id.length - 8) is 'password'
        $(this).attr 'type', input_type
    $(this).off 'mousedown'
    return

loginSubmit = ->
    userinfo =
        'username': $('#login_username').val()
        'password': $('#login_password').val()

    $.post '/authentication', userinfo, (res) ->
        if res.result is true
            closeDlg()
            Cookies.set 'username', userinfo.username, expires: 7
            setUser userinfo.username
            setDownload()
        else
            alert 'Authentication Filed!'
        return
    return

setDownload = ->
    $('.downloadlink').unbind 'click', showLogin
    setLink for dLink in dLinks
    return

setLink = (linkData) ->
	$('#' + linkData.linkid).attr
		'href': '../../' + linkData.href
	    'download': linkData.download
	return

setNews = ->
    newsUrl = '/news?rtype=news&cnum=' + $(this).data('packnum') + '&numpp=12'
    window.location = newsUrl
    return

showDetail = ->
    detailsUrl = '/details?_id=' + $(this).data('id')
    window.location = detailsUrl
    return

closeDlg = ->
    $('#ldlog').modal 'hide'
    return

setPageNav = ->
    loadPrevious = $('.load_previous')
    loadNext = $('.load_next')

    if $('.pagenum') && $('.pagenum').data('pagenum') is $('.pagenum').data('pagenum')
        loadNext
	        .off 'click'
            .css('cursor', 'text')
    else
        loadNext.click ->
            newUrl = '/records?rtype=' + $(this).data('type') + '&cnum=' + $(this).data('cnum') + '&numpp=' + $(this).data('numpp')
            window.location = newUrl
            return

    if $('.pagenum') && $('.pagenum').data('pagenum') == 1
        loadPrevious.off('click').css('cursor', 'text')
    else
        loadPrevious.click ->
            newUrl = '/records?rtype=' + $(this).data('type') + '&cnum=' + $(this).data('cnum') + '&numpp=' + $(this).data('numpp')
            window.location = newUrl
            return
    return

windowOnScroll = ->
    if checkVisible $('header')
        $('.div_pagetitle').css
            'position': 'relative'
            'top': '4px'
            'height': '60px'

        $('#navs').css
            'position': 'relative'
            'bottom': '-15px'

    else
        $('.div_pagetitle').css
            'position': 'fixed'
            'top': '0px'
            'height': '46px'
            'left': '0px'

        $('#page_title').css
            'top': '-2px'

        $('#navs').css
            'position': 'relative'
            'bottom': '0px'
    return

checkVisible = (elm, evalType) ->
    evalType = evalType || 'visible'

    vpH = $(window).height()
    st = $(window).scrollTop()
    y = $(elm).offset().top
    elementHeight = $(elm).height()

    if evalType is 'visible'
    	return y < (vpH + st) && y > (st - elementHeight)
    if evalType is 'above'
    	return y < (vpH + st)
    return

$(document).ready ->
	setPageNav()
	setFont()
	if Cookies.get 'username'
		setUser Cookies.get 'username'
		setDelete()
	else
		screenDownload()
		setLogin()
	window.onscroll = windowOnScroll
	$('.a_nav').each setNav
	$('.detail_entry').click showDetail
	return