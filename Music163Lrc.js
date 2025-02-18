(function() {
    var tagsRegMap = {
            ti: 'title',
            ar: 'artist',
            al: 'album',
        },
        isLrcLine = function isLrcLine(lrc) {
            return /^\[(\d{2,}):(\d{2})(\.\d{2,3})?\](.*)$|^\[(ti|ar|al):([^\]]*)\]$/g.test(lrc);
        },
        isLoaded = false;
    function parseLrc(lrc) {
        var tags = {},
            lrcs = {},
            times = [],
            result = '';
        lrc.split(/\r*\n/).forEach(function(lrc) {
            if (!isLrcLine(lrc)) return;
            var tag = /^\[(ti|ar|al):([^\]]*)\]$/i.exec(lrc);
            if (tag) {
                tags[tagsRegMap[tag[1]]] = tag[2];
                return;
            }
            var exec = /^\[(\d{2,}):(\d{2})(\.\d{2,3})?\](.*)$/g.exec(lrc);
            if (!exec) return;
            var text = exec[4] || '',
                min = +exec[1],
                sec = +exec[2],
                ms = +exec[3] || 0;
            if (text === '') text = '<break>';
            var time = parseInt((min * 60 + sec + ms) * 1000) + '';
            if (!lrcs[time]) {
                lrcs[time] = text;
                times.push(+time);
            } else lrcs[time] += '\n' + text;
        });
        if (tags.title) {
            result += tags.title;
            if (tags.artist) result += ' - ' + tags.artist;
            if (tags.album) result += ' - ' + tags.album;
        }
        result += '\n<main_break>';
        times.sort(function(a, b) { return a - b });
        times.forEach(function(time) {
            result += '\n' + lrcs[time];
        });
        return result;
    }
    if (["edit", "submit"].includes(mw.config.get("wgAction"))) {
        var c;
        c = setInterval(function() {
            if (!$("#wikiEditor-section-advanced > div.group.group-insert").length) return;
            clearInterval(c);
            $("#wikiEditor-section-advanced > div.group.group-insert").append($("<a/>").addClass("label").css({
                "cursor": "pointer",
                "float": "right",
                "margin-left": "8px",
                "margin-right": "5px",
            }).text("获取网易云音乐翻译歌词").on("click", function() {
                var textbox = $("#wpTextbox1"),
                    start = textbox[0].selectionStart,
                    text = textbox.val(),
                    id = prompt("网易云音乐歌曲ID：");
                if (id === null) return;
                if (isNaN(+id) || +id <= 0 || /\D/.test(id)) return alert('歌曲ID非法！必须为正整数！');
                var url = 'https://moegirlpedia.annangela.cn/music163Lyric?id=' + +id,
                    defaultCursor = $('body').css('cursor');
                $('body').css('cursor', 'wait');
                $.ajax({
                    url: url,
                    type: "GET",
                    error: function() {
                        var info = '';
                        for (var i = 0, l = arguments.length; i < l; i++) info += JSON.stringify(arguments[i]) + '\n';
                        info += '\n出现问题！请截图本内容联系开发人员！';
                        alert(info);
                    },
                    timeout: 60000,
                    success: function(data) {
                        $('body').css('cursor', defaultCursor);
                        if (data.lrc && data.lrc.lyric) {
                            var string = '{{Lyrics';
                            var originLrcText = parseLrc(data.lrc.lyric);
                            string += '\n' + originLrcText.split('<main_break>').map(function(t, i) {
                                if (i === 0) return '|lb-text1=' + t;
                                else return t.split('<break>').map(function(t, i) {
                                    return '\n|lb-text' + (i + 2) + '=' + t.replace(/^\n*/, '');
                                }).join('');
                            }).join('');
                            if (data.tlyric && data.tlyric.lyric) {
                                var translatedLrcText = parseLrc(data.tlyric.lyric);
                                string += '\n' + translatedLrcText.split('<main_break>').map(function(t, i) {
                                    if (i === 0) return '|rb-text1=翻译者：' + data.transUser.nickname + '\n';
                                    else return t.split('<break>').map(function(t, i) {
                                        return '\n|rb-text' + (i + 2) + '=' + t.replace(/^\n*/, '');
                                    }).join('');
                                }).join('');
                            } else {
                                alert("该歌词没有翻译");
                            }
                            string += '\n}}';
                            textbox.val(text.substring(0, start) + "\n" + string.replace(/\n+/g, '\n') + "\n" + text.substring(start));
                            textbox[0].selectionStart = textbox[0].selectionEnd = start + string.length;
                            textbox.focus();
                        } else {
                            alert("你请求的歌曲没有歌词或不存在");
                        }
                    }
                });
            }));
        }, 1000);
    }
})();