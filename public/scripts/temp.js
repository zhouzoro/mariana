$.get('Datas/data', function(data) {
    var tdata = $(data).toString();
    var lines = tdata.split(" ");
    for (var i = 0; i < lines.length; i++) {
        $("#na1").append($("<p>").text(lines(i)));
    }
    $("#na1").html(data);
}, 'text');




$("dl").append($("<dt>").attr("id", "newdt"));


'Files/Record/Cont', 'Files/Record/Data', 'Files/Record/Data', 'Files/Record/Data'


$(".sub").append(data);

//create dt article elements:
$(s_dlid).append($("<dt>").text(lines[0]).append($("<label>").text(reccolumn[0]).attr("class", "datelabel")))
    .append($("<article>").attr("id", artid).append($("<h2>").text(lines[0])));
for (var i = 1; i < lines.length; i++) {
    $(s_artid).append($("<p>").text(lines[i]));
}
for (var i = 2; i < reccolumn.length; i++) {
    var downloadpath = "Files/" + rectype + "/" + reccolumn[1] + "/" + reccolumn[i];
    $(s_artid)
        .append($("<a>").text(reccolumn[i])
            .attr({
                "href": downloadpath,
                "download": downloadpath,
            }))
        .append("<br/>")
}

$(s_artid).append(
$("<a>")
.attr({
    "id": aid,
    "class": "ashrink"
})
.text("- Tuck"));
}, 'text');



//add onclick events:
$(".ashrink").on("click", function() {
    $("#" + this.id.substring(4)).slideToggle();
});

$("dt").on("click", function() {
    $(".sub").append($(this).next().id);
    $(this).next().slideToggle();


})

    /*var setSlider = function(numperpage) {
        var getRcordUrl = '../record?rtype=news&pnum=0&numpp=' + numperpage;
        $.get(getRcordUrl, function(data) {
            var slider = $('<div>').attr('id', 'news_slider');
            $('body').append(slider);
            var ul = $('<ul>')
            for (var i = 0; i < data.length; i++) {
                var detailsUrl = '/details?_id=' + data[i]._id;
                var item = $('<li>').attr({
                        'class': 'slider_item',
                        'data-url': detailsUrl
                    }).click(function() {
                        window.location = $(this).data('url')
                    })
                    .append($('<label>').attr('class', 'sliderlabel').text(data[i].title)
                        .append($('<label>').attr('class', 'slabelextra')
                            .append($('<label>').attr('class', 'slabeldate').text(data[i].date.substr(0, 10)))
                            .append($('<label>').attr('class', 'slabelsource').text(data[i].source))
                        )
                    );
                if (data[i].img.length) {
                    item.append($('<img>').attr({
                        'class': 'sliderimg',
                        'src': '../' + data[i].img[0].src,
                        'alt': 'slider image',
                        'data-title': data[i].title
                    }));
                }
                ul.append(item);
            }
            slider.append(ul);
            slider.unslider({
                animation: 'fade',
                autoplay: true,
                delay: 4600,
                arrows: false
            });
        })
    }*/








function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
            f.size, ' bytes, last modified: ',
            f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
            '</li>');
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);


function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
            f.size, ' bytes, last modified: ',
            f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
            '</li>');
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the dnd listeners.
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

        // Only process image files.
        if (!f.type.match('image.*')) {
            continue;
        }

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {
                // Render thumbnail.
                var span = document.createElement('span');
                span.innerHTML = ['<img class="thumb" src="', e.target.result,
                    '" title="', escape(theFile.name), '"/>'
                ].join('');
                document.getElementById('list').insertBefore(span, null);
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
    }
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);



function readBlob(opt_startByte, opt_stopByte) {

    var files = document.getElementById('files').files;
    if (!files.length) {
        alert('Please select a file!');
        return;
    }

    var file = files[0];
    var start = parseInt(opt_startByte) || 0;
    var stop = parseInt(opt_stopByte) || file.size - 1;

    var reader = new FileReader();

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
            document.getElementById('byte_content').textContent = evt.target.result;
            document.getElementById('byte_range').textContent = ['Read bytes: ', start + 1, ' - ', stop + 1,
                ' of ', file.size, ' byte file'
            ].join('');
        }
    };

    var blob = file.slice(start, stop + 1);
    reader.readAsBinaryString(blob);
}

document.querySelector('.readBytesButtons').addEventListener('click', function(evt) {
    if (evt.target.tagName.toLowerCase() == 'button') {
        var startByte = evt.target.getAttribute('data-startbyte');
        var endByte = evt.target.getAttribute('data-endbyte');
        readBlob(startByte, endByte);
    }
}, false);





$("#" + dtid).on("click", function() {
    $(this).slideToggle();
    $(this).next().slideToggle();
})
$("#" + btid).on("click", function() {
    var lartid = this.id.substr(0, this.id.lastIndexOf("_"));
    var ldtid = lartid.substr(0, lartid.lastIndexOf("_")) + "_dt" + lartid.substr((lartid.lastIndexOf("_") + 8));
    $("#" + lartid).slideToggle();
    $("#" + ldtid).slideToggle();
})






$(this).slideToggle();

$("#" + ldtid).slideToggle();




new_added.append($("<input>").attr({
        "class": "upload_text upload_img",
        "type": "file",
        "accept": "image/*",
        "name": "img",
        "data-pos": 1,
        "data-cap": "",
    }))
    .append($("<figure>").attr("class", "image-preview")
        .append($("<label>").attr({
            "class": "image_label"
        }))
        .append($("<img>").attr({
            "class": "img_prevu",
            "alt": "default image"
        }))
        .append($("<input>").attr({
            "class": "caption",
            "name": "cap",
            "type": "text",
            "value": "Put your figure caption here."
        }))
    )


/*.append($("<article>").attr({
                        "id": artid,
                        "class": "article_hidden"
                    })
                    .append($("<h2>").attr("class", "art_title").text(atitle))
                    .append($("<p>").attr("class", "art_source").text(asource))
                );
            if (aimg.length) {
                $("#" + dtid).css({
                    "background-image": "url(" + "../" + aimg[0].src + ")"
                })
            } else {
                $("#" + dtid).css({
                    "background-color": "#1496bb"
                })
            }

            for (var j = 0; j < aimg.length; j++) {
                if (aimg[j].pos == 0) {
                    $(s_artid).append(
                        $("<figure>")
                        .append($("<img>").attr({
                            "src": "../" + aimg[j].src,
                            "alt": "related picture",
                            "class": "post_img"
                        }))
                        .append($("<figcaption>").text(aimg[j].cap))
                    );
                }
            }

            //insert body
            for (var i = 0; i < abody.length; i++) {
                $(s_artid).append($("<p>").text(abody[i]).attr("class", "artp"));
                for (var j = 0; j < aimg.length; j++) {
                    if (aimg[j].pos == i + 1) {
                        $(s_artid).append(
                            $("<figure>").attr("class", "h_fig")
                            .append($("<img>").attr({
                                "src": "../" + aimg[j].src,
                                "alt": "related picture",
                                "class": "post_img"
                            }))
                            .append($("<figcaption>").attr("class", "h_figcap").text(aimg[j].cap))
                        );
                    }
                }
            }

            //insert date
            //$(s_artid).append($("<label>").attr("class", "datelabel").text(adate));
            //appendix
            for (var i = 0; i < aapend.length; i++) {
                var linkid = artid + "download-link" + i;
                var downloadpath = "../" + aapend[i];
                var appendix_name = aapend[i].substring(aapend[i].lastIndexOf("/") + 1);

                $(s_artid).append("<br/>").append($("<label>").text("附件" + (i + 1).toString() + "： ").attr("class", "appendix_label"))
                    .append($("<a>").text(appendix_name)
                        .attr({
                            "id": linkid,
                            "class": "downloadlink"
                        })
                    )
                $("#" + linkid).click(show_login);
                download_links.push({
                    "linkid": linkid,
                    "href": downloadpath,
                    "download": appendix_name
                })
                if ($("#login_entry").text().toLowerCase() != "login") {
                    $("#" + linkid).unbind('click', show_login);
                    $("#" + linkid).attr({
                        "href": downloadpath,
                        "download": appendix_name
                    })
                }
            }

            $(s_artid).append("<br/>")
                .append($("<a>")
                    .attr({
                        "id": btid,
                        "class": "a_hide_article"
                    })
                    .text("- 收起"));

            /*$("#" + dtid).on("click", function() {
                    //$(this).slideToggle();
                    //$(this).next().slideToggle();
                    //

                    window.location = $(this).attr("href");
                })
                /*$("#" + btid).on("click", function() {
                    var lartid = this.id.substr(0, this.id.lastIndexOf("_"));
                    var ldtid = lartid.substr(0, lartid.lastIndexOf("_")) + "_dt" + lartid.substring(lartid.length - 1);
                    $("#" + lartid).slideToggle();
                })*/

function SendUploadProgress(bytesReceived, bytesExpected) {
    var pct = (100 * (bytesReceived / bytesExpected)).toString();
    if (pct.substr(4, 2) < 20) {
        console.log(pct.substring(0, 4) + "%");
        io.sockets.in('sessionId').emit('uploadProgress', pct.substring(0, 4) + "%");
    }
}

"font_face":"monaco",