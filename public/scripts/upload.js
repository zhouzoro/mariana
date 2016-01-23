function initUpload() {
    var moveUpward = function() {
        var c_this = $(this).parents('.div_content');
        var c_prev = c_this.prev('.div_content');
        c_this.insertBefore(c_prev);

        if (c_this.find('.position').length && c_prev.find('textarea').length) {
            var c_val = c_this.find('.position').val() - 1;
            c_this.find('.position').val(c_val);
        } else if (c_this.find('textarea').length && c_prev.find('.image_box').length) {
            var c_val = c_prev.find('.position').val() + 1;
            c_prev.find('.position').val(c_val)
        }
    }
    var moveDownward = function() {
        var c_this = $(this).parents('.div_content');
        var c_next = c_this.next('.div_content');
        c_this.insertAfter(c_next);

        if (c_this.find('.image_box').length && c_next.find('textarea').length) {
            var c_val = c_this.find('.position').val() + 1;
            c_this.find('.position').val(c_val)
        } else if (c_this.find('textarea').length && c_next.find('.image_box').length) {
            var c_val = c_next.find('.position').val() - 1;
            c_next.find('.position').val(c_val)
        }
    }
    var deleteContent = function() {
        var c_this = $(this).parents('.div_content');
        if (c_this.find('textarea').length) {
            c_this.nextAll('.div_content').each(function() {
                if ($(this).find('.image_box')) {
                    var c_val = $(this).find('.position').val() - 1;
                    $(this).find('.position').val(c_val);
                };
            })
        }
        $(this).parents('.div_content').remove();
    }
    var hoverOn = function() {
        $(this).attr('src', '../styles/ico/delete01.png')
    }
    var hoverOff = function() {
        $(this).attr('src', '../styles/ico/delete00.png')
    }
    var boldClick = function() {
        if ($(this).data('checked') === 'n') {
            $(this).attr('src', '../styles/ico/bold01.png');
            $(this).parent('.adjust_font').next('textarea').css('font-weight', 'bold');
            $(this).next('.bold').val('bold');
            $(this).data('checked', 'y');
        } else if ($(this).data('checked') === 'y') {
            $(this).attr('src', '../styles/ico/bold00.png');
            $(this).parent('.adjust_font').next('textarea').css('font-weight', 'normal');
            $(this).next('.bold').val('normal');
            $(this).data('checked', 'n');
        }
    }
    var italicClick = function() {
        if ($(this).data('checked') === 'n') {
            $(this).attr('src', '../styles/ico/italic01.png');
            $(this).parent('.adjust_font').next('textarea').css('font-style', 'italic');
            $(this).next('.italic').val('italic');
            $(this).data('checked', 'y');
        } else if ($(this).data('checked') === 'y') {
            $(this).attr('src', '../styles/ico/italic00.png');
            $(this).parent('.adjust_font').next('textarea').css('font-style', 'normal');
            $(this).next('.italic').val('normal');
            $(this).data('checked', 'n');
        }
    }
    var fsizeChange = function() {
        $(this).parent('.adjust_font').next('textarea').css('font-size', $(this).val());
    }
    var taCount = 0;
    var imgCount = 0;
    function setType() {
        Cookies.set('uploadType', $(this).val(), {
            expires: 1
        })
    };
    $('#owner').val(Cookies.get('username'));
    Cookies.set('uploadType', 'news', {
        expires: 1
    })
    $('#upload-type').change(setType);
    $('.select_fs').val('15px');
    $('#frm_upload').submit(function() {
        $('#upload_dialog').modal('show')
    });

    $('.upward').click(moveUpward)
    $('.downward').click(moveDownward)
    $('.delete').click(deleteContent)
    $('.delete').hover(hoverOn, hoverOff)

    $('textarea').on('keyup input change', function() {
        var offset = this.offsetHeight - this.clientHeight;
        $(this).css('height', this.scrollHeight + offset);
    })

    $('.font_bold').click(boldClick);
    $('.font_italic').click(italicClick);
    $('.select_fs').click(fsizeChange);

    $('.bt_add').click(function() {
        var newStuff = ($('<div>').attr({
                'class': 'div_content'
            })
            .append($('<div>').attr('class', 'adjust_pos')
                .append($('<img>').attr({
                    'class': 'bt_move upward',
                    'src': '../styles/ico/upward00.png',
                    'alt': 'move up'
                }).click(moveUpward))
                .append($('<img>').attr({
                    'class': 'bt_move downward',
                    'src': '../styles/ico/downward00.png',
                    'alt': 'move down'
                }).click(moveDownward))
                .append($('<img>').attr({
                    'class': 'bt_move delete',
                    'src': '../styles/ico/delete00.png',
                    'alt': 'delete'
                }).click(deleteContent).hover(hoverOn, hoverOff))
            )
        )
        switch (this.id.substring(this.id.lastIndexOf('_') + 1)) {
            case 'par':
                {
                    taCount++;
                    $('#upload_content').append(newStuff
                        .append($('<div>').attr('class', 'adjust_font')
                            .append($('<span>').attr('class', 'glyphicon glyphicon-text-size'))
                            .append($('<select>').attr({
                                    'class': 'select_fs',
                                    'name': 'fsize-txa' + taCount
                                })
                                .append($('<option>').val('12px').text('12'))
                                .append($('<option>').val('13px').text('13'))
                                .append($('<option>').val('14px').text('14'))
                                .append($('<option>').val('15px').text('15').attr('selected', 'selected'))
                                .append($('<option>').val('16px').text('16'))
                                .append($('<option>').val('18px').text('18'))
                                .append($('<option>').val('20px').text('20'))
                                .append($('<option>').val('22px').text('22'))
                                .append($('<option>').val('24px').text('24'))
                                .click(fsizeChange)
                            )
                            .append($('<img>').attr({
                                'class': 'bt_font font_bold',
                                'src': '../styles/ico/bold00.png',
                                'alt': 'font weight bold',
                                'data-checked': 'n'
                            }).click(boldClick))
                            .append($('<input>').attr({
                                'class': 'bold invisible',
                                'name': 'fweight-txa' + taCount,
                                'type': 'text'
                            }).val('normal'))
                            .append($('<img>').attr({
                                'class': 'bt_font font_italic',
                                'src': '../styles/ico/italic00.png',
                                'alt': 'font style italic',
                                'data-checked': 'n'
                            }).click(italicClick))
                            .append($('<input>').attr({
                                'class': 'italic invisible',
                                'name': 'fstyle-txa' + taCount,
                                'type': 'text'
                            }).val('normal'))
                        ).append($('<textarea>').attr({
                            'class': 'upload_text upload_textarea',
                            'form': 'frm_upload',
                            'name': 'txt-txa' + taCount,
                            'rows': 1
                        }).text('正文').mousedown(function() {
                            $(this).val('');
                            $(this).off('mousedown');
                            $(this).css({
                                'font-style': 'normal',
                                'color': 'black'
                            });
                        }))
                    )
                    break;
                };
            case 'img':
                {
                    imgCount++;
                    $('#upload_content').append(
                        newStuff.append($('<div>').attr('class', 'image_box')
                            .append($('<label>').text('Choose Image').attr('class', 'image_label')
                                .append($('<input>').attr({
                                    'class': 'upload_text upload_img',
                                    'form': 'frm_upload',
                                    'type': 'file',
                                    'accept': 'image/*',
                                    'name': 'src-img' + imgCount
                                }).change(function() {
                                    var img_pre = $(this).parent().next('img');

                                    if (this.files && this.files[0]) {
                                        var reader = new FileReader();
                                        reader.onload = function(e) {
                                            img_pre.attr('src', e.target.result);
                                        }
                                        reader.readAsDataURL(this.files[0]);
                                    }
                                }))
                                .append($('<input>').attr({
                                    'class': 'position invisible',
                                    'form': 'frm_upload',
                                    'name': 'pos-img' + imgCount,
                                    'type': 'text',
                                    'value': $('.upload_textarea').length ? $('.upload_textarea').length : 0
                                }))
                            )
                            .append($('<img>').attr('class', 'image_preview'))
                            .append($('<textarea>').attr({
                                'class': 'caption',
                                'form': 'frm_upload',
                                'name': 'cap-img' + imgCount,
                                'rows': 1
                            }).text('在此输入图片说明').mousedown(function() {
                                $(this).val('');
                                $(this).off('mousedown');
                                $(this).css({
                                    'font-style': 'normal',
                                    'color': 'black'
                                });
                            }))
                        )
                    )
                    break;
                };
            case 'att':
                {
                    var attLabel = $('<div>').text('Choose File').attr('class', 'att_label');
                    var newAtt = $('<input>').attr({
                        'name': 'att',
                        'class': 'upload_text upload_att',
                        'form': 'frm_upload',
                        'type': 'file',
                        'accept': '*'
                    }).change(function() {
                        attLabel.css('text-transform', 'none').text(this.files[0].name)
                    })
                    $('#ul_att').append(
                        newStuff.append(attLabel).append(newAtt))
                    break;
                };
        }
        $('textarea').on('keyup input change', function() {
            var offset = this.offsetHeight - this.clientHeight;
            $(this).css('height', this.scrollHeight + offset);
        });
    })
}
