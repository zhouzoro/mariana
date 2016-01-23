var myUpload = function() {
    var mce = {};
    var vue;

    function uploadRD(darray) {
        _.forEach(darray, function(data, index) {
            _.forEach(data, function(val, key) {
                if (val === '') {
                    data[key + 'Placeholder'] += '不能为空！';

                }
            })
        })
        $('#loader').modal('show');
        var loader = $('#loader').find('.loader');
        var updatep = function(n) {
            loader.text('uploading ' + n + 'of ' + darray.length);
        }
        _.forEach(darray, function(data, index) {
            index++;
            updatep(index);
            data.date = GetCurrentDate();
            $.post('/add_new_post', data, function(res) {
                $('#loader').modal('hide');
                loadContent(res.url);
            });
        })
        loadContent('/home');
    }

    function computProgress(oEvent) {
        var percentComplete = Math.ceil(1000 * oEvent.loaded / oEvent.total) / 10 + '%';
        return percentComplete;
    }

    function Att() {
        var e = {};
        e.title = '';
        e.name = '';
        e.source = '';
        e.path = '';
        e.progress = '0%';
        e.updateProgress = function(oEvent) {
            e.progress = computProgress(oEvent);
        };
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = false;
        xhr.open('POST', '/files');

        xhr.onload = function() {
            var json = JSON.parse(xhr.responseText);
            e.path = json.location;
        };
        xhr.upload.addEventListener("progress", e.updateProgress, false);
        e.uploadFile = function(ele) {
            e.name = ele.files[0].name;
            var form = $(ele).parent('.frmfile')[0];
            var formData = new FormData(form);
            xhr.send(formData);
        };
        e.abort = function() {
            xhr.abort();
        }
        return e;
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
            var newAtt = Att();
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
            $('#btn-upload').click(function() {
                uploadRD(vue.datas)
            })
        } else {

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
            $('#btn-att').click(function() {
                vuef.atts.push(attManager.addAtt());
            });

            $('#btn-img').click(function() {
                $('#input-img').click();
            });
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
