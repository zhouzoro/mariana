$ document
.ready ->
	setPageNav()
	setFont()
	if Cookies.get 'username'
		setUser Cookies.get 'username'
		setDelete()
	else
		screenDownload()
		setLogin()
	window.onscroll = windowOnScroll
	$ '.a_nav'
	.each setNav
	$ '.detail_entry'
	.click showDetail
	reutrn
setFont = ->
	$ 'p'
	.each ->
		if $(this).data 'fweight' is 'bold' or $(this).data 'fweight' is 'normal'
			$(this).css {
				'font-size': $(this).data('fsize'),
				'font-weight': $(this).data('fweight'),
				'font-style': $(this).data('fstyle')
			}
		reutrn
	reutrn
dLinks = []
screenDownload = ->
	$ '.downloadlink'
	.each ->
		dLinks.push {
            linkid: this.id,
            href: $(this).attr('href'),
            download: $(this).attr('download')
        }
		reutrn
	reutrn

setLogin = ->
	$('#upload_entry').css 'display', 'none'
    $('#log_out').css 'display', 'none'
    $('.login_entry').text '登录'
	    .attr 'data-toggle', 'modal'
    $('.downloadlink').click showLogin
	    .removeAttr 'href'
		.removeAttr 'download'
    $('#login_username').val 'Username'
    $('#login_password').val 'Password'
    $('input').css 'color', 'gray'
	    .mousedown inputClick
    $('#login_submit').click loginSubmit
showLogin = ->
	$('#ldlog').modal 'show'
setUser = (username)->
	$('.login_entry').text username
	.off 'click'
	.removeAttr 'data-toggle'
    $('#upload_entry').css 'display', 'inline-block'
    .text '上传'
    $('#log_out').css 'display', 'inline-block'
    .text '退出'
	.click logOut
logOut = ->
	Cookies.remove 'username'
    $('.login_entry').switchClass('username', 'login_entry', 0).text('登录').click(showLogin);
    $('#upload_entry').css('display', 'none');
    $(this).css('display', 'none');
