$(document).ready(function() {
    $('.log').each(function() {
        if ($(this).data('level') == 'error') {
            console.log(1);
            $(this).find('label').addClass('log-level-error')
        } else if ($(this).data('level') === 'info') {
            $(this).find('label').addClass('log-level-info')
        }
    })

    var socket = io.connect('http://210.77.91.195:30000/');
     //var socket = io.connect('http://127.0.0.1:30001/');
    socket.on('log', function(log) {
        if (typeof(log) == 'object') {
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
            $('div:first').prepend(newLog
                .append(logLevel).append(logDate).append(logMsg).append(logDetail));
        } else if (typeof(log) == 'string') {
            var newLog = $('<div>').attr('class', 'log').text(log);
            $('div:first').prepend(newLog);
        }
    })
    $.get('/logs', function(res) {
        console.log(res);
    })
})
